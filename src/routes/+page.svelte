<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getRecentMatches, type RecentMatch } from '$lib/match-history';

	let playerName = $state('');
	let gameCodeInput = $state('');
	let activeTab = $state<'create' | 'join' | 'history'>('create');
	let errorMessage = $state('');
	let isLoading = $state(true);
	let recentMatches = $state<RecentMatch[]>([]);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('scrabble_player_name');
			if (saved) playerName = saved;
			recentMatches = getRecentMatches();
		}
		// Smooth transition timeout
		const timer = setTimeout(() => {
			isLoading = false;
		}, 550);
		return () => clearTimeout(timer);
	});

	function generateRoomCode(): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let code = '';
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code;
	}

	function handleCreateGame(vsBot: boolean = false) {
		const trimmedName = playerName.trim() || 'Player';
		errorMessage = '';
		localStorage.setItem('scrabble_player_name', trimmedName);
		const code = generateRoomCode();
		const botParam = vsBot ? '&bot=1' : '';
		goto(`/game/${code}?name=${encodeURIComponent(trimmedName)}${botParam}`);
	}

	function handleJoinGame() {
		const trimmedName = playerName.trim() || 'Player';
		const trimmedCode = gameCodeInput.trim().toUpperCase();

		if (!trimmedCode || trimmedCode.length < 4) {
			errorMessage = 'Please enter a valid game code.';
			return;
		}

		errorMessage = '';
		localStorage.setItem('scrabble_player_name', trimmedName);
		goto(`/game/${trimmedCode}?name=${encodeURIComponent(trimmedName)}`);
	}
</script>

<svelte:head>
	<title>Scrabble Online - 2-Player Word Game</title>
</svelte:head>

<!-- Initial Loading Screen with Svelte Out:Fade Transition -->
{#if isLoading}
	<div
		out:fade={{ duration: 450 }}
		class="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center gap-4 select-none pointer-events-auto"
	>
		<div class="flex items-center gap-1.5 animate-bounce">
			{#each ['S', 'C', 'R', 'A', 'B', 'B', 'L', 'E'] as letter, idx}
				<span
					class="w-9 h-10 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/90 border border-amber-300 shadow-md flex items-center justify-center font-bold text-amber-950 text-xl font-serif"
					style="animation-delay: {idx * 50}ms;"
				>
					{letter}
				</span>
			{/each}
		</div>
		<p class="text-xs font-medium text-slate-400 tracking-wider animate-pulse">Loading Scrabble Online...</p>
	</div>
{/if}

<!-- Main Page Content with Smooth Glide In -->
<main
	in:fly={{ y: 10, duration: 500, delay: 250 }}
	class="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-slate-50 select-none transition-all duration-300"
>
	<!-- Top Spacer -->
	<div></div>

	<!-- Main Card Content -->
	<div class="w-full max-w-md mx-auto flex flex-col items-center gap-6 my-auto">
		<!-- Minimal Logo / Header with rounded tiles -->
		<div class="flex flex-col items-center text-center gap-2.5">
			<div class="flex items-center gap-1 sm:gap-1.5">
				{#each ['S', 'C', 'R', 'A', 'B', 'B', 'L', 'E'] as letter}
					<span class="w-8 h-9 sm:w-9 sm:h-10 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/90 border border-amber-300/80 shadow-xs flex items-center justify-center font-bold text-amber-950 text-lg sm:text-xl font-serif">
						{letter}
					</span>
				{/each}
			</div>
			<p class="text-xs text-slate-500 font-medium">2-Player Realtime Online Match</p>
		</div>

		<!-- Card Component -->
		<Card class="w-full shadow-lg border-slate-200/80 p-5 sm:p-6 rounded-2xl">
			<!-- Name Input -->
			<div class="flex flex-col gap-1.5 mb-5">
				<label for="name" class="text-xs font-semibold uppercase tracking-wider text-slate-600">
					Your Name
				</label>
				<Input
					id="name"
					bind:value={playerName}
					placeholder="Enter your name..."
					maxlength={20}
				/>
			</div>

			<!-- Tab Switcher -->
			<div class="grid grid-cols-3 p-1 bg-slate-100 rounded-xl mb-5">
				<button
					type="button"
					onclick={() => { activeTab = 'create'; errorMessage = ''; }}
					class="py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer {activeTab === 'create'
						? 'bg-white text-slate-900 shadow-xs'
						: 'text-slate-500 hover:text-slate-900'}"
				>
					Create
				</button>
				<button
					type="button"
					onclick={() => { activeTab = 'join'; errorMessage = ''; }}
					class="py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer {activeTab === 'join'
						? 'bg-white text-slate-900 shadow-xs'
						: 'text-slate-500 hover:text-slate-900'}"
				>
					Join
				</button>
				<button
					type="button"
					onclick={() => { activeTab = 'history'; errorMessage = ''; }}
					class="py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer {activeTab === 'history'
						? 'bg-white text-slate-900 shadow-xs'
						: 'text-slate-500 hover:text-slate-900'}"
				>
					History ({recentMatches.length})
				</button>
			</div>

			<!-- Tab Content -->
			{#if activeTab === 'create'}
				<div class="flex flex-col gap-3">
					<p class="text-xs text-slate-500 leading-relaxed">
						Start a new game session. Invite a friend or practice solo against the AI bot.
					</p>

					<Button
						variant="default"
						size="lg"
						onclick={() => handleCreateGame(false)}
						class="w-full bg-slate-900 hover:bg-slate-800"
					>
						Create 2-Player Room
					</Button>

					<Button
						variant="outline"
						size="default"
						onclick={() => handleCreateGame(true)}
						class="w-full border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold text-xs"
					>
						🤖 Play vs AI Bot (Single Player)
					</Button>
				</div>
			{:else if activeTab === 'join'}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<label for="code" class="text-xs font-semibold uppercase tracking-wider text-slate-600">
							Game Code
						</label>
						<Input
							id="code"
							bind:value={gameCodeInput}
							placeholder="e.g. WORD88"
							maxlength={10}
							class="uppercase font-mono font-bold tracking-widest text-center"
						/>
					</div>

					<Button
						variant="default"
						size="lg"
						onclick={handleJoinGame}
						class="w-full bg-slate-900 hover:bg-slate-800"
					>
						Join Match
					</Button>
				</div>
			{:else}
				<!-- Tab History Inside Card -->
				<div class="flex flex-col gap-2">
					<div class="flex items-center justify-between pb-1 border-b border-slate-100">
						<span class="text-xs font-bold text-slate-700">Recent 10 Matches</span>
						<span class="text-[10px] text-slate-400">{recentMatches.length} recorded</span>
					</div>

					{#if recentMatches.length === 0}
						<div class="py-6 text-center flex flex-col items-center gap-1.5">
							<span class="text-2xl opacity-60">🎮</span>
							<p class="text-xs font-semibold text-slate-600">No match history yet</p>
							<p class="text-[11px] text-slate-400">Complete a game to see your scores here.</p>
						</div>
					{:else}
						<div class="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-0.5">
							{#each recentMatches as match (match.id)}
								<div class="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1 text-xs">
									<div class="flex items-center justify-between text-[10px] text-slate-400">
										<span class="font-mono font-bold text-slate-600">Room {match.roomCode}</span>
										<span>{new Date(match.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="font-semibold text-slate-800 truncate {match.winnerName === match.player1.name ? 'text-amber-950 font-bold' : ''}">
											{match.player1.name} <span class="font-mono font-bold text-amber-900">({match.player1.score})</span>
										</span>
										<span class="text-[10px] text-slate-400 font-semibold px-1">vs</span>
										<span class="font-semibold text-slate-800 truncate {match.winnerName === match.player2.name ? 'text-amber-950 font-bold' : ''}">
											{match.player2.name} <span class="font-mono font-bold text-amber-900">({match.player2.score})</span>
										</span>
									</div>
									<div class="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/40">
										{#if match.isTie}
											<span class="text-slate-500 font-medium">Draw</span>
										{:else}
											<span class="text-emerald-700 font-semibold flex items-center gap-1">
												<span>🏆</span>
												<span>{match.winnerName} won</span>
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if errorMessage}
				<div class="mt-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
					{errorMessage}
				</div>
			{/if}
		</Card>

		<!-- Features Badges -->
		<div class="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
			<span>CSW Dictionary</span>
			<span>•</span>
			<span>AI Bot Mode</span>
			<span>•</span>
			<span>Responsive</span>
		</div>

		<!-- Recent Matches History Card (Always visible below main card) -->
		<Card class="w-full shadow-md border-slate-200/80 p-4 sm:p-5 rounded-2xl animate-in fade-in duration-200">
			<div class="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
				<div class="flex items-center gap-1.5">
					<span class="text-sm">📜</span>
					<h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Matches (Last 10)</h3>
				</div>
				<span class="text-[11px] font-medium text-slate-400">
					{recentMatches.length > 0 ? `${recentMatches.length} recorded` : 'Empty'}
				</span>
			</div>

			{#if recentMatches.length === 0}
				<div class="py-6 flex flex-col items-center justify-center text-center gap-2">
					<span class="text-2xl opacity-60">🎮</span>
					<p class="text-xs font-semibold text-slate-600">No matches recorded yet</p>
					<p class="text-[11px] text-slate-400 max-w-[250px] leading-relaxed">
						Play a match vs AI Bot or another player. Your 10 most recent game scores and results will appear here.
					</p>
				</div>
			{:else}
				<div class="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-0.5">
					{#each recentMatches as match (match.id)}
						<div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1.5 text-xs transition-all hover:bg-slate-100/70">
							<div class="flex items-center justify-between text-[10px] text-slate-400">
								<span class="font-mono font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.2 rounded">
									Room {match.roomCode}
								</span>
								<span>
									{new Date(match.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>

							<div class="flex items-center justify-between py-0.5">
								<!-- Player 1 -->
								<div class="flex items-center gap-1.5 min-w-0">
									<span class="font-semibold text-slate-800 truncate max-w-[90px] sm:max-w-[110px] {match.winnerName === match.player1.name ? 'text-amber-950 font-bold' : ''}">
										{match.player1.name}
									</span>
									<span class="px-1.5 py-0.5 rounded font-mono font-bold text-xs {match.winnerName === match.player1.name ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200/80 text-slate-600'}">
										{match.player1.score}
									</span>
								</div>

								<span class="text-[10px] text-slate-400 font-semibold px-1">vs</span>

								<!-- Player 2 -->
								<div class="flex items-center gap-1.5 min-w-0 justify-end">
									<span class="px-1.5 py-0.5 rounded font-mono font-bold text-xs {match.winnerName === match.player2.name ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200/80 text-slate-600'}">
										{match.player2.score}
									</span>
									<span class="font-semibold text-slate-800 truncate max-w-[90px] sm:max-w-[110px] {match.winnerName === match.player2.name ? 'text-amber-950 font-bold' : ''}">
										{match.player2.name}
									</span>
								</div>
							</div>

							<div class="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
								{#if match.isTie}
									<span class="font-semibold text-slate-500">Result: Draw (Tie)</span>
								{:else}
									<span class="font-semibold text-emerald-700 flex items-center gap-1">
										<span>🏆</span>
										<span>Winner: <strong>{match.winnerName}</strong></span>
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	</div>

	<!-- Footer with Author Signature -->
	<footer class="w-full text-center py-3">
		<p class="text-xs text-slate-400 font-medium tracking-wide">
			Made with <span class="text-red-500 inline-block animate-pulse">❤️</span> by <span class="text-slate-700 font-bold">ARP</span>
		</p>
	</footer>
</main>
