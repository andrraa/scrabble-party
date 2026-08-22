<script lang="ts">
	import type { Player } from '../types';
	import Badge from './ui/Badge.svelte';

	let {
		gameCode,
		players,
		playerOrder,
		turnPlayerId,
		remainingBagCount,
		currentUserId,
		status,
		winnerId = null,
		timerDuration = 0,
		turnStartTime = 0,
		activeEmotes = {},
		onCopyCode,
		onSendEmote,
		onTimerExpired,
		onOpenResults,
		class: className = ''
	}: {
		gameCode: string;
		players: Record<string, Player>;
		playerOrder: string[];
		turnPlayerId: string;
		remainingBagCount: number;
		currentUserId: string;
		status: 'LOBBY' | 'PLAYING' | 'FINISHED';
		winnerId?: string | null;
		timerDuration?: number;
		turnStartTime?: number;
		activeEmotes?: Record<string, string>;
		onCopyCode: () => void;
		onSendEmote?: (emote: string) => void;
		onTimerExpired?: () => void;
		onOpenResults?: () => void;
		class?: string;
	} = $props();

	const p1 = $derived(playerOrder[0] ? players[playerOrder[0]] : null);
	const p2 = $derived(playerOrder[1] ? players[playerOrder[1]] : null);

	let showEmotePicker = $state(false);
	let secondsRemaining = $state<number | null>(null);

	// Precise, reactive turn timer countdown
	$effect(() => {
		if (status !== 'PLAYING' || !timerDuration || timerDuration <= 0) {
			secondsRemaining = null;
			return;
		}

		// Track reactive dependencies
		const start = turnStartTime || Date.now();
		const duration = timerDuration;
		const activeTurnId = turnPlayerId;

		const updateCountdown = () => {
			const elapsed = Math.floor((Date.now() - start) / 1000);
			const left = Math.max(0, duration - elapsed);
			secondsRemaining = left;

			if (left === 0 && activeTurnId === currentUserId && onTimerExpired) {
				onTimerExpired();
			}
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 400);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col gap-2 w-full bg-white border border-slate-200/90 rounded-xl md:rounded-2xl p-2.5 sm:p-3 shadow-2xs {className}">
	<!-- Top Bar Header: Structured 2-row layout for 100% responsiveness -->
	<div class="flex flex-col gap-1.5 pb-1.5 border-b border-slate-100 text-xs">
		<!-- Sub-row 1: Room Code + Emote + Game Status / Results Button -->
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-1.5 min-w-0">
				<span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">ROOM</span>
				<button
					onclick={onCopyCode}
					class="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-mono font-bold tracking-wider text-slate-800 transition-colors cursor-pointer flex items-center gap-1"
					title="Copy Room Code"
				>
					<span>{gameCode}</span>
					<span class="text-[10px] text-slate-400 font-sans font-normal hidden sm:inline">copy</span>
				</button>
			</div>

			<!-- Right side: Emote Popover + Status Badge / Results Button -->
			<div class="flex items-center gap-1.5 shrink-0">
				{#if onSendEmote && status === 'PLAYING'}
					<div class="relative">
						<button
							type="button"
							onclick={() => (showEmotePicker = !showEmotePicker)}
							class="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-0.5 cursor-pointer shadow-2xs"
							title="Send Quick Reaction"
						>
							<span>💬</span>
							<span class="text-[10px] font-sans">React</span>
						</button>

						{#if showEmotePicker}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="fixed inset-0 z-40 bg-transparent"
								onclick={() => (showEmotePicker = false)}
							></div>
							<div
								class="absolute top-full -right-12 sm:right-0 mt-1.5 z-50 p-2 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-2xl flex flex-wrap sm:flex-nowrap gap-1 w-[220px] sm:w-auto animate-in fade-in zoom-in-95 duration-100"
							>
								{#each ['👏 Nice!', '🤔 Thinking', '🔥 Wow', '👍 GG', '🎯 Boom!'] as emote}
									<button
										type="button"
										onclick={() => {
											if (onSendEmote) onSendEmote(emote);
											showEmotePicker = false;
										}}
										class="px-2 py-1 rounded-lg hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors whitespace-nowrap cursor-pointer flex-1 sm:flex-initial text-center"
									>
										{emote}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				{#if status === 'LOBBY'}
					<Badge variant="warning" class="text-[10px] py-0.5 px-2 font-bold">LOBBY</Badge>
				{:else if status === 'PLAYING'}
					<Badge variant="indigo" class="text-[10px] py-0.5 px-2 font-bold">PLAYING</Badge>
				{:else}
					<!-- Re-open Results Modal Button -->
					<button
						onclick={onOpenResults}
						class="px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold tracking-wide transition-all shadow-xs flex items-center gap-1 cursor-pointer animate-pulse"
						title="View Victory Results"
					>
						<span>🏆</span>
						<span>Results</span>
					</button>
				{/if}
			</div>
		</div>

		<!-- Sub-row 2: Tiles Remaining + Turn Timer -->
		<div class="flex items-center justify-between gap-2 text-slate-600 pt-0.5">
			<div class="flex items-center gap-1 text-[11px] sm:text-xs font-medium">
				<span class="w-2 h-2 rounded-full bg-amber-500"></span>
				<span>{remainingBagCount} tiles left</span>
			</div>

			{#if secondsRemaining !== null}
				<div class="flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] sm:text-xs font-bold border transition-colors {secondsRemaining <= 15
					? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
					: 'bg-slate-100 text-slate-700 border-slate-200'}">
					<span class="text-[10px]">⏱️</span>
					<span>{Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Player Score Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-1 gap-2">
		<!-- Player 1 Card -->
		<div
			class="relative flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition-all {status === 'FINISHED' && winnerId === p1?.id
				? 'bg-gradient-to-r from-amber-50 to-amber-100/90 border-amber-400 ring-2 ring-amber-400/80 shadow-xs'
				: turnPlayerId === p1?.id && status === 'PLAYING'
					? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/50 shadow-xs'
					: 'bg-slate-50 border-slate-200'}"
		>
			<!-- Emote Speech Bubble -->
			{#if p1 && activeEmotes[p1.id]}
				<div class="absolute -top-3.5 left-3 z-20 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-lg animate-in zoom-in-75 fade-in duration-150 border border-slate-700">
					{activeEmotes[p1.id]}
				</div>
			{/if}

			<div class="flex flex-col min-w-0 pr-1">
				<div class="flex items-center gap-1">
					{#if status === 'FINISHED' && winnerId === p1?.id}
						<span class="text-xs" title="Match Winner">👑</span>
					{/if}
					<span class="font-semibold text-xs sm:text-sm text-slate-900 truncate">
						{p1 ? p1.name : 'Waiting...'} {p1 && p1.id === currentUserId ? '(You)' : ''}
					</span>
					{#if p1 && !p1.isConnected && status === 'PLAYING'}
						<span class="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">Offline</span>
					{/if}
				</div>
				{#if status === 'FINISHED' && winnerId === p1?.id}
					<span class="text-[9px] font-extrabold text-amber-900 uppercase tracking-tight">Winner 🏆</span>
				{:else if turnPlayerId === p1?.id && status === 'PLAYING'}
					<span class="text-[9px] font-bold text-amber-800 uppercase tracking-tight">Active Turn</span>
				{/if}
			</div>

			<div class="flex items-baseline gap-0.5 shrink-0">
				<span class="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
					{p1 ? p1.score : 0}
				</span>
				<span class="text-[10px] text-slate-400 font-medium">pts</span>
			</div>
		</div>

		<!-- Player 2 Card -->
		<div
			class="relative flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition-all {status === 'FINISHED' && winnerId === p2?.id
				? 'bg-gradient-to-r from-amber-50 to-amber-100/90 border-amber-400 ring-2 ring-amber-400/80 shadow-xs'
				: turnPlayerId === p2?.id && status === 'PLAYING'
					? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/50 shadow-xs'
					: 'bg-slate-50 border-slate-200'}"
		>
			<!-- Emote Speech Bubble -->
			{#if p2 && activeEmotes[p2.id]}
				<div class="absolute -top-3.5 left-3 z-20 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-lg animate-in zoom-in-75 fade-in duration-150 border border-slate-700">
					{activeEmotes[p2.id]}
				</div>
			{/if}

			<div class="flex flex-col min-w-0 pr-1">
				<div class="flex items-center gap-1">
					{#if status === 'FINISHED' && winnerId === p2?.id}
						<span class="text-xs" title="Match Winner">👑</span>
					{/if}
					<span class="font-semibold text-xs sm:text-sm text-slate-900 truncate">
						{p2 ? p2.name : 'Waiting...'} {p2 && p2.id === currentUserId ? '(You)' : ''}
					</span>
					{#if p2 && !p2.isConnected && status === 'PLAYING'}
						<span class="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">Offline</span>
					{/if}
				</div>
				{#if status === 'FINISHED' && winnerId === p2?.id}
					<span class="text-[9px] font-extrabold text-amber-900 uppercase tracking-tight">Winner 🏆</span>
				{:else if turnPlayerId === p2?.id && status === 'PLAYING'}
					<span class="text-[9px] font-bold text-amber-800 uppercase tracking-tight">Active Turn</span>
				{/if}
			</div>

			<div class="flex items-baseline gap-0.5 shrink-0">
				<span class="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
					{p2 ? p2.score : 0}
				</span>
				<span class="text-[10px] text-slate-400 font-medium">pts</span>
			</div>
		</div>
	</div>
</div>
