<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import type PartySocket from 'partysocket';
	import type { GameState, PlacedTileMove, ScrabbleTile, ServerMessage } from '$lib/types';
	import { createEmptyBoard, LETTER_DISTRIBUTION, LETTER_VALUES } from '$lib/engine/board-constants';
	import { createGameSocket, sendSocketMessage } from '$lib/partykit/client';
	import {
		playTilePlaceSound,
		playRecallSound,
		playShuffleSound,
		playSuccessSound,
		playBingoSound,
		playErrorSound,
		playEmoteSound,
		setMuted,
		getMuted
	} from '$lib/audio/sound-effects';
	import Board from '$lib/components/Board.svelte';
	import Rack from '$lib/components/Rack.svelte';
	import ScoreBoard from '$lib/components/ScoreBoard.svelte';
	import GameLog from '$lib/components/GameLog.svelte';
	import BlankDialog from '$lib/components/BlankDialog.svelte';
	import SwapDialog from '$lib/components/SwapDialog.svelte';
	import GameOverModal from '$lib/components/GameOverModal.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	const roomCode = $derived((page.params.code || '').toUpperCase());

	let socket = $state<PartySocket | null>(null);
	let currentUserId = $state<string>('');
	let isConnected = $state(false);
	let isAudioMuted = $state(false);
	let storedPlayerName = $state('Player');

	// Translucent floating toast state
	interface Toast {
		id: number;
		type: 'success' | 'error' | 'warning' | 'info';
		message: string;
	}
	let activeToast = $state<Toast | null>(null);
	let toastTimeout = $state<any>(null);

	// Pending tile placement state for active turn
	let pendingPlacements = $state<PlacedTileMove[]>([]);
	let selectedRackTile = $state<ScrabbleTile | null>(null);

	// Active Emotes mapping per player
	let activeEmotes = $state<Record<string, string>>({});

	// Modals & Drawers
	let showBlankDialog = $state(false);
	let pendingBlankCoord = $state<{ row: number; col: number; tile: ScrabbleTile } | null>(null);
	let showSwapDialog = $state(false);
	let showMobileLog = $state(false);
	let showLeaveDialog = $state(false);
	let showBagInfo = $state(false);

	// Game state
	let gameState = $state<GameState>({
		code: '',
		status: 'LOBBY',
		board: createEmptyBoard(),
		tileBag: [],
		remainingBagCount: 100,
		players: {},
		playerOrder: [],
		turnPlayerId: '',
		consecutivePasses: 0,
		moveHistory: [],
		winnerId: null,
		lastMoveTime: Date.now(),
		timerDuration: 90,
		turnStartTime: Date.now()
	});

	const currentPlayer = $derived(currentUserId ? gameState.players[currentUserId] : null);
	const isHost = $derived(currentPlayer?.isHost ?? false);
	const isMyTurn = $derived(gameState.status === 'PLAYING' && gameState.turnPlayerId === currentUserId);
	const canStartGame = $derived(isHost && gameState.playerOrder.length === 2 && gameState.status === 'LOBBY');

	// Available rack tiles = player rack minus tiles currently placed as pending on the board
	const availableRack = $derived.by(() => {
		if (!currentPlayer) return [];
		const placedIds = new Set(pendingPlacements.map((p) => p.tile.id));
		return currentPlayer.rack.filter((t) => !placedIds.has(t.id));
	});

	// Live word & score preview estimation
	const liveWordPreview = $derived.by(() => {
		if (pendingPlacements.length === 0) return null;

		// Extract placed letters summary
		const letters = pendingPlacements.map((p) =>
			p.tile.isBlank ? (p.tile.assignedLetter || '?') : p.tile.letter
		);
		const rawScore = pendingPlacements.reduce((sum, p) => sum + (p.tile.isBlank ? 0 : p.tile.value), 0);
		const bingoAdd = pendingPlacements.length >= 7 ? 50 : 0;

		return {
			words: [letters.join('')],
			score: rawScore + bingoAdd,
			isValid: true
		};
	});

	function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
		if (toastTimeout) clearTimeout(toastTimeout);
		activeToast = { id: Date.now(), type, message };
		toastTimeout = setTimeout(() => {
			activeToast = null;
		}, 3800);
	}

	function handleServerMessage(msg: ServerMessage) {
		switch (msg.type) {
			case 'SYNC_STATE':
				gameState = msg.state;
				currentUserId = msg.yourPlayerId;
				if (typeof window !== 'undefined' && msg.yourPlayerId) {
					sessionStorage.setItem(`scrabble_pid_${roomCode}`, msg.yourPlayerId);
				}
				// If turn changed, reset pending placements
				if (msg.state.turnPlayerId !== currentUserId) {
					pendingPlacements = [];
					selectedRackTile = null;
				}
				break;
			case 'ERROR':
				playErrorSound();
				showToast(msg.message, 'error');
				break;
			case 'NOTIFICATION':
				if (msg.toastType === 'success') {
					if (msg.message.includes('BINGO')) {
						playBingoSound();
					} else {
						playSuccessSound();
					}
				}
				showToast(msg.message, msg.toastType || 'info');
				break;
			case 'EMOTE_EVENT':
				playEmoteSound();
				activeEmotes = { ...activeEmotes, [msg.playerId]: msg.emote };
				setTimeout(() => {
					const copy = { ...activeEmotes };
					delete copy[msg.playerId];
					activeEmotes = copy;
				}, 3500);
				break;
		}
	}

	let visibilityListener: any = null;

	onMount(() => {
		let playerName = page.url.searchParams.get('name') || '';

		if (typeof window !== 'undefined') {
			if (!playerName) {
				playerName = sessionStorage.getItem('scrabble_player_name') || localStorage.getItem('scrabble_player_name') || 'Player';
			} else {
				sessionStorage.setItem('scrabble_player_name', playerName);
			}
			storedPlayerName = playerName;

			const savedMute = localStorage.getItem('scrabble_mute');
			if (savedMute === 'true') {
				isAudioMuted = true;
				setMuted(true);
			}
		}

		socket = createGameSocket(
			roomCode,
			handleServerMessage,
			() => {
				isConnected = true;
				if (socket) {
					const activePid = currentUserId || (typeof window !== 'undefined' ? sessionStorage.getItem(`scrabble_pid_${roomCode}`) : '') || undefined;
					sendSocketMessage(socket, {
						type: 'JOIN',
						name: storedPlayerName,
						playerId: activePid
					});
				}
			},
			() => {
				isConnected = false;
			}
		);

		// Mobile background/resume listener
		visibilityListener = () => {
			if (document.visibilityState === 'visible' && socket) {
				const activePid = currentUserId || sessionStorage.getItem(`scrabble_pid_${roomCode}`) || undefined;
				sendSocketMessage(socket, {
					type: 'JOIN',
					name: storedPlayerName,
					playerId: activePid
				});
			}
		};
		document.addEventListener('visibilitychange', visibilityListener);
	});

	onDestroy(() => {
		if (socket) {
			socket.close();
		}
		if (toastTimeout) clearTimeout(toastTimeout);
		if (visibilityListener && typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', visibilityListener);
		}
	});

	function toggleMute() {
		isAudioMuted = !isAudioMuted;
		setMuted(isAudioMuted);
		if (typeof window !== 'undefined') {
			localStorage.setItem('scrabble_mute', isAudioMuted ? 'true' : 'false');
		}
	}

	function handleSetTimer(seconds: number) {
		if (!socket || !isHost) return;
		sendSocketMessage(socket, {
			type: 'SET_TIMER',
			seconds,
			playerId: currentUserId
		});
	}

	function handleSendEmote(emote: string) {
		if (!socket) return;
		sendSocketMessage(socket, {
			type: 'SEND_EMOTE',
			emote,
			playerId: currentUserId
		});
	}

	// Mobile & Desktop Tap-to-Place Tile Interaction (Allowed at any time for rearranging)
	function handleSelectRackTile(tile: ScrabbleTile | null) {
		if (!tile || selectedRackTile?.id === tile.id) {
			selectedRackTile = null;
		} else {
			selectedRackTile = tile;
		}
	}

	function handleGlobalClick(e: MouseEvent) {
		if (!selectedRackTile) return;
		const target = e.target as HTMLElement | null;
		if (!target) return;

		// Check if click was inside the rack stand, board grid, buttons, or modals
		const isBoard = target.closest('.scrabble-board-grid');
		const isRack = target.closest('.grid-cols-7');
		const isButton = target.closest('button');
		const isModal = target.closest('.fixed');

		if (!isBoard && !isRack && !isButton && !isModal) {
			selectedRackTile = null;
		}
	}

	function handlePlaceTile(row: number, col: number, droppedTile?: ScrabbleTile) {
		if (!isMyTurn) {
			playErrorSound();
			showToast("It's not your turn.", 'error');
			return;
		}

		// Don't place on existing locked board tiles
		if (gameState.board[row][col].tile !== null && gameState.board[row][col].isLocked) {
			return;
		}

		// Don't place on already pending cell
		if (pendingPlacements.some((p) => p.row === row && p.col === col)) {
			return;
		}

		const tileToPlace = droppedTile || selectedRackTile;
		if (!tileToPlace) return;

		// Check if it is a wildcard blank tile
		if (tileToPlace.isBlank && !tileToPlace.assignedLetter) {
			pendingBlankCoord = { row, col, tile: tileToPlace };
			showBlankDialog = true;
			return;
		}

		// Place tile & play sound
		playTilePlaceSound();
		pendingPlacements = [...pendingPlacements, { row, col, tile: tileToPlace }];

		// Auto-select next available tile in rack for fast consecutive placement
		const nextAvail = availableRack.find((t) => t.id !== tileToPlace.id);
		selectedRackTile = nextAvail || null;
	}

	function handleSelectBlankLetter(letter: string) {
		if (!pendingBlankCoord) return;
		const { row, col, tile } = pendingBlankCoord;
		const assignedTile: ScrabbleTile = {
			...tile,
			assignedLetter: letter.toUpperCase()
		};

		playTilePlaceSound();
		pendingPlacements = [...pendingPlacements, { row, col, tile: assignedTile }];
		showBlankDialog = false;
		pendingBlankCoord = null;

		// Auto-select next tile
		const nextAvail = availableRack.find((t) => t.id !== tile.id);
		selectedRackTile = nextAvail || null;
	}

	function handleCancelBlank() {
		showBlankDialog = false;
		pendingBlankCoord = null;
	}

	function handleRemovePendingTile(row: number, col: number) {
		playRecallSound();
		pendingPlacements = pendingPlacements.filter((p) => !(p.row === row && p.col === col));
	}

	function handleRecallAll() {
		if (pendingPlacements.length > 0) {
			playRecallSound();
		}
		pendingPlacements = [];
		selectedRackTile = null;
	}

	function handleShuffleRack() {
		if (!currentPlayer) return;
		playShuffleSound();
		const shuffled = [...currentPlayer.rack];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		currentPlayer.rack = shuffled;
	}

	function handlePlayWord() {
		if (!socket || !isMyTurn || pendingPlacements.length === 0) return;
		sendSocketMessage(socket, {
			type: 'PLAY_MOVE',
			placements: pendingPlacements,
			playerId: currentUserId
		});
	}

	function handlePassTurn() {
		if (!socket || !isMyTurn) return;
		if (confirm('Are you sure you want to pass your turn?')) {
			handleRecallAll();
			sendSocketMessage(socket, { type: 'PASS_TURN', playerId: currentUserId });
		}
	}

	function handleConfirmSwap(tileIds: string[]) {
		if (!socket || !isMyTurn) return;
		handleRecallAll();
		playShuffleSound();
		sendSocketMessage(socket, {
			type: 'SWAP_TILES',
			tileIds,
			playerId: currentUserId
		});
		showSwapDialog = false;
	}

	function handleStartGame() {
		if (!socket || !canStartGame) return;
		sendSocketMessage(socket, { type: 'START_GAME', playerId: currentUserId });
	}

	function handleRestartGame() {
		if (!socket || !isHost) return;
		sendSocketMessage(socket, { type: 'RESTART_GAME', playerId: currentUserId });
	}

	function handleCopyLink() {
		if (typeof window !== 'undefined') {
			const cleanUrl = `${window.location.origin}/game/${roomCode}`;
			navigator.clipboard.writeText(cleanUrl);
			showToast('Invite link copied to clipboard!', 'info');
		}
	}

	function handleConfirmLeave() {
		if (socket) {
			sendSocketMessage(socket, { type: 'LEAVE_GAME', playerId: currentUserId });
		}
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem(`scrabble_pid_${roomCode}`);
		}
		if (socket) {
			socket.close();
		}
		goto('/');
	}
</script>

<svelte:head>
	<title>Scrabble Room {roomCode}</title>
</svelte:head>

<svelte:window onclick={handleGlobalClick} />

<main class="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 flex flex-col p-1 sm:p-3 md:p-4 lg:px-6 lg:py-3 select-none">
	<div class="max-w-6xl w-full mx-auto flex flex-col gap-1.5 sm:gap-2 md:gap-3 flex-1 min-h-0">
		<!-- Top Bar / Navigation -->
		<header class="flex items-center justify-between py-1 px-2 shrink-0 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs">
			<div class="flex items-center gap-2">
				<a href="/" class="flex items-center gap-2 group cursor-pointer">
					<!-- Rounded navbar logo tile -->
					<span class="w-8 h-8 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/90 border border-amber-300/80 shadow-xs flex items-center justify-center font-serif font-bold text-amber-950 text-base">
						S
					</span>
					<span class="font-bold text-sm md:text-base text-slate-800 group-hover:text-slate-950 transition-colors">
						Scrabble
					</span>
				</a>
			</div>

			<div class="flex items-center gap-1.5 sm:gap-2">
				<!-- Online Status Badge -->
				{#if isConnected}
					<span class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] md:text-xs font-medium text-emerald-700 border border-emerald-200">
						<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
						Online
					</span>
				{:else}
					<span class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-amber-50 text-[11px] md:text-xs font-medium text-amber-700 border border-amber-200">
						<span class="w-2 h-2 rounded-full bg-amber-500"></span>
						Connecting...
					</span>
				{/if}

				<!-- Audio Mute Toggle Button -->
				<button
					onclick={toggleMute}
					class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors cursor-pointer shrink-0"
					title={isAudioMuted ? 'Unmute Sound' : 'Mute Sound'}
				>
					{isAudioMuted ? '🔇' : '🔊'}
				</button>

				<!-- Tile Bag Distribution Reference Button -->
				{#if gameState.status === 'PLAYING'}
					<button
						onclick={() => (showBagInfo = true)}
						class="hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
						title="View standard tile distribution"
					>
						Tiles ({gameState.remainingBagCount})
					</button>
				{/if}

				<!-- Mobile Log Drawer Toggle -->
				{#if gameState.status === 'PLAYING'}
					<button
						onclick={() => (showMobileLog = !showMobileLog)}
						class="lg:hidden px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
					>
						<span>Log</span>
						<span class="px-1.5 py-0.2 rounded-full bg-slate-200 text-[10px] text-slate-600 font-bold">
							{gameState.moveHistory.length}
						</span>
					</button>
				{/if}

				<!-- Leave Room Icon Button -->
				<button
					onclick={() => (showLeaveDialog = true)}
					class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200/80 transition-colors cursor-pointer shrink-0 shadow-2xs"
					title="Leave Match"
					aria-label="Leave Match"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
						<polyline points="16 17 21 12 16 7" />
						<line x1="21" y1="12" x2="9" y2="12" />
					</svg>
				</button>
			</div>
		</header>

		<!-- Floating Glassmorphic Toast Notifications -->
		{#if activeToast}
			<div
				class="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[92%] sm:max-w-md px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto border transition-all {activeToast.type ===
				'success'
					? 'bg-emerald-950/85 text-emerald-100 border-emerald-500/30'
					: activeToast.type === 'error'
						? 'bg-rose-950/85 text-rose-100 border-rose-500/30'
						: activeToast.type === 'warning'
							? 'bg-amber-950/85 text-amber-100 border-amber-500/30'
							: 'bg-slate-900/85 text-slate-100 border-slate-700/50'}"
			>
				<span class="text-xs sm:text-sm font-medium leading-tight">
					{activeToast.message}
				</span>
				<button
					onclick={() => (activeToast = null)}
					class="opacity-70 hover:opacity-100 font-bold text-xs p-0.5 cursor-pointer"
				>
					✕
				</button>
			</div>
		{/if}

		<!-- LOBBY SCREEN -->
		{#if gameState.status === 'LOBBY'}
			<div class="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6">
				<Card class="w-full max-w-md md:max-w-lg flex flex-col gap-4 md:gap-5 text-center shadow-lg border-slate-200 p-6 md:p-8">
					<div>
						<Badge variant="indigo" class="mb-1.5">MATCH LOBBY</Badge>
						<h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">Room {roomCode}</h2>
						<p class="text-xs md:text-sm text-slate-500 mt-1">Share the code or invite link with your opponent</p>
					</div>

					<!-- Room Code & Copy Link -->
					<div class="flex items-center justify-center gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
						<span class="text-xl md:text-2xl font-mono font-bold tracking-widest text-slate-800">{roomCode}</span>
						<Button variant="outline" size="sm" onclick={handleCopyLink} class="md:h-9 md:px-4">
							Copy Link
						</Button>
					</div>

					<!-- Turn Timer Setting (Configurable by Host in Lobby) -->
					<div class="flex flex-col gap-1.5 text-left p-3 rounded-xl bg-slate-50 border border-slate-200">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-slate-700">Turn Timer</span>
							<span class="text-xs font-bold text-slate-900">
								{gameState.timerDuration === 0 ? 'Unlimited' : `${gameState.timerDuration}s / turn`}
							</span>
						</div>
						{#if isHost}
							<div class="grid grid-cols-5 gap-1 pt-1">
								{#each [0, 60, 90, 120, 180] as sec}
									<button
										type="button"
										onclick={() => handleSetTimer(sec)}
										class="py-1 text-[11px] font-semibold rounded-md border transition-all cursor-pointer {gameState.timerDuration === sec
											? 'bg-slate-900 text-white border-slate-900'
											: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}"
									>
										{sec === 0 ? 'Off' : `${sec}s`}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Players in Lobby -->
					<div class="flex flex-col gap-2">
						<span class="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
							Players ({gameState.playerOrder.length}/2)
						</span>

						<div class="grid grid-cols-2 gap-2 md:gap-3">
							{#each [0, 1] as index}
								{@const pid = gameState.playerOrder[index]}
								{@const player = pid ? gameState.players[pid] : null}
								<div class="p-3.5 md:p-4 rounded-xl border flex flex-col items-center justify-center min-h-[70px] md:min-h-[84px] {player ? 'bg-white border-slate-300 shadow-2xs' : 'bg-slate-50 border-dashed border-slate-200'}">
									{#if player}
										<span class="font-bold text-xs sm:text-sm md:text-base text-slate-900 truncate w-full text-center">
											{player.name} {player.id === currentUserId ? '(You)' : ''}
										</span>
										{#if player.isHost}
											<span class="text-[9px] md:text-[10px] text-amber-700 font-bold uppercase mt-0.5">Host</span>
										{/if}
									{:else}
										<span class="text-xs md:text-sm text-slate-400 italic">Waiting...</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Host Start Action -->
					<div class="pt-2">
						{#if isHost}
							<Button
								variant="default"
								size="lg"
								onclick={handleStartGame}
								disabled={!canStartGame}
								class="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 md:h-12 md:text-base"
							>
								{gameState.playerOrder.length < 2 ? 'Waiting for Player 2...' : 'Start Game'}
							</Button>
						{:else}
							<div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs md:text-sm text-slate-500 font-medium">
								Waiting for host to start the match...
							</div>
						{/if}
					</div>
				</Card>
			</div>

		<!-- GAME PLAYING / FINISHED SCREEN -->
		{:else}
			<div class="flex flex-col lg:grid lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4 lg:gap-5 items-center lg:items-stretch flex-1 min-h-0">
				<!-- Mobile & Tablet Portrait ScoreBoard -->
				<div class="w-full max-w-full lg:hidden">
					<ScoreBoard
						gameCode={roomCode}
						players={gameState.players}
						playerOrder={gameState.playerOrder}
						turnPlayerId={gameState.turnPlayerId}
						remainingBagCount={gameState.remainingBagCount}
						{currentUserId}
						status={gameState.status}
						timerDuration={gameState.timerDuration}
						turnStartTime={gameState.turnStartTime}
						{activeEmotes}
						onCopyCode={handleCopyLink}
						onSendEmote={handleSendEmote}
					/>
				</div>

				<!-- Board & Rack Column (Transparent full width on Mobile, Card on Desktop) -->
				<div class="lg:col-span-8 flex flex-col items-center justify-between w-full h-auto lg:h-full min-h-0 bg-transparent lg:bg-white border-0 lg:border lg:border-slate-200/90 rounded-none lg:rounded-2xl p-0 lg:p-4 shadow-none lg:shadow-2xs gap-1.5 sm:gap-2.5">
					<!-- Scrabble 15x15 Board Wrapper -->
					<div class="w-full flex items-center justify-center lg:flex-1 lg:min-h-0 lg:min-w-0">
						<Board
							board={gameState.board}
							{pendingPlacements}
							onPlaceTile={handlePlaceTile}
							onRemovePendingTile={handleRemovePendingTile}
						/>
					</div>

					<!-- Rack & Action Controls -->
					<div class="w-full shrink-0 pt-1 sm:pt-1.5">
						<Rack
							rack={availableRack}
							selectedTileId={selectedRackTile?.id}
							isTurn={isMyTurn}
							hasPending={pendingPlacements.length > 0}
							canSwap={gameState.remainingBagCount >= 7}
							{liveWordPreview}
							onSelectTile={handleSelectRackTile}
							onShuffle={handleShuffleRack}
							onRecall={handleRecallAll}
							onOpenSwap={() => (showSwapDialog = true)}
							onPass={handlePassTurn}
							onPlay={handlePlayWord}
							onReorderRack={(newRack) => {
								if (currentPlayer) currentPlayer.rack = newRack;
							}}
						/>
					</div>
				</div>

				<!-- Desktop Side Panel: ScoreBoard + Game Log (4 cols) -->
				<div class="hidden lg:flex lg:col-span-4 flex-col gap-3 h-full min-h-0">
					<ScoreBoard
						gameCode={roomCode}
						players={gameState.players}
						playerOrder={gameState.playerOrder}
						turnPlayerId={gameState.turnPlayerId}
						remainingBagCount={gameState.remainingBagCount}
						{currentUserId}
						status={gameState.status}
						timerDuration={gameState.timerDuration}
						turnStartTime={gameState.turnStartTime}
						{activeEmotes}
						onCopyCode={handleCopyLink}
						onSendEmote={handleSendEmote}
					/>

					<div class="flex-1 min-h-0 overflow-hidden">
						<GameLog history={gameState.moveHistory} />
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Mobile & Tablet Log Bottom Sheet -->
	{#if showMobileLog}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 lg:hidden"
			onclick={() => (showMobileLog = false)}
		>
			<div
				class="bg-white rounded-t-2xl sm:rounded-2xl max-w-md md:max-w-lg w-full p-4 md:p-6 max-h-[75vh] flex flex-col gap-3 shadow-2xl animate-in slide-in-from-bottom duration-200"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="flex items-center justify-between pb-2 border-b border-slate-100">
					<h3 class="font-bold text-sm md:text-base text-slate-800">Game History</h3>
					<button
						onclick={() => (showMobileLog = false)}
						class="text-xs md:text-sm font-semibold text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
					>
						Done
					</button>
				</div>
				<div class="flex-1 overflow-y-auto min-h-[220px] md:min-h-[280px]">
					<GameLog history={gameState.moveHistory} />
				</div>
			</div>
		</div>
	{/if}

	<!-- Tile Distribution Info Dialog -->
	{#if showBagInfo}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
			onclick={() => (showBagInfo = false)}
		>
			<div
				class="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-3"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="flex items-center justify-between pb-2 border-b border-slate-100">
					<h3 class="font-bold text-sm md:text-base text-slate-900">Tile Bag Distribution</h3>
					<button onclick={() => (showBagInfo = false)} class="text-xs font-semibold text-slate-400 hover:text-slate-700">✕</button>
				</div>
				<p class="text-xs text-slate-500">Standard English Scrabble total: 100 tiles</p>

				<div class="grid grid-cols-6 sm:grid-cols-7 gap-1.5 py-1 text-center">
					{#each Object.entries(LETTER_DISTRIBUTION) as [letter, count]}
						{@const val = LETTER_VALUES[letter] || 0}
						<div class="p-1.5 rounded-lg bg-amber-50/80 border border-amber-200 flex flex-col items-center">
							<span class="font-bold text-xs text-amber-950">{letter === '_' ? 'BLANK' : letter}</span>
							<span class="text-[9px] text-amber-700">{count}x ({val}pt)</span>
						</div>
					{/each}
				</div>

				<div class="flex justify-end pt-1">
					<Button variant="outline" size="sm" onclick={() => (showBagInfo = false)}>Close</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Leave Game Confirmation Dialog -->
	{#if showLeaveDialog}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
			onclick={() => (showLeaveDialog = false)}
		>
			<div
				class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-4 text-center"
				onclick={(e) => e.stopPropagation()}
			>
				<div>
					<h3 class="text-lg font-bold text-slate-900">Leave Game?</h3>
					<p class="text-xs text-slate-500 mt-1">Are you sure you want to leave this game session and return to the main menu?</p>
				</div>

				<div class="flex items-center justify-center gap-2 pt-2">
					<Button variant="outline" size="sm" onclick={() => (showLeaveDialog = false)} class="flex-1">
						Cancel
					</Button>
					<Button variant="destructive" size="sm" onclick={handleConfirmLeave} class="flex-1">
						Leave Match
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modals -->
	<BlankDialog
		isOpen={showBlankDialog}
		onSelect={handleSelectBlankLetter}
		onCancel={handleCancelBlank}
	/>

	<SwapDialog
		isOpen={showSwapDialog}
		rack={currentPlayer?.rack || []}
		onConfirm={handleConfirmSwap}
		onCancel={() => (showSwapDialog = false)}
	/>

	<GameOverModal
		{gameState}
		{currentUserId}
		onRestart={handleRestartGame}
	/>
</main>
