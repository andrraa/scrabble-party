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
		timerDuration = 0,
		turnStartTime = 0,
		activeEmotes = {},
		onCopyCode,
		class: className = ''
	}: {
		gameCode: string;
		players: Record<string, Player>;
		playerOrder: string[];
		turnPlayerId: string;
		remainingBagCount: number;
		currentUserId: string;
		status: 'LOBBY' | 'PLAYING' | 'FINISHED';
		timerDuration?: number;
		turnStartTime?: number;
		activeEmotes?: Record<string, string>;
		onCopyCode: () => void;
		class?: string;
	} = $props();

	const p1 = $derived(playerOrder[0] ? players[playerOrder[0]] : null);
	const p2 = $derived(playerOrder[1] ? players[playerOrder[1]] : null);

	// Live timer countdown calculation
	let now = $state(Date.now());
	$effect(() => {
		if (status !== 'PLAYING' || timerDuration === 0) return;
		const interval = setInterval(() => {
			now = Date.now();
		}, 500);
		return () => clearInterval(interval);
	});

	const secondsLeft = $derived.by(() => {
		if (timerDuration === 0 || status !== 'PLAYING') return null;
		const elapsed = Math.floor((now - turnStartTime) / 1000);
		return Math.max(0, timerDuration - elapsed);
	});
</script>

<div class="flex flex-col gap-2.5 w-full bg-white border border-slate-200/90 rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-3.5 shadow-2xs {className}">
	<!-- Top Bar Header: Structured 2-row layout for 100% responsiveness -->
	<div class="flex flex-col gap-1.5 pb-2 border-b border-slate-100 text-xs">
		<!-- Sub-row 1: Room Code + Game Status -->
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

			<div class="shrink-0">
				{#if status === 'LOBBY'}
					<Badge variant="warning" class="text-[10px] py-0.5 px-2 font-bold">LOBBY</Badge>
				{:else if status === 'PLAYING'}
					<Badge variant="indigo" class="text-[10px] py-0.5 px-2 font-bold">PLAYING</Badge>
				{:else}
					<Badge variant="success" class="text-[10px] py-0.5 px-2 font-bold">FINISHED</Badge>
				{/if}
			</div>
		</div>

		<!-- Sub-row 2: Tiles Remaining + Turn Timer -->
		<div class="flex items-center justify-between gap-2 text-slate-600 pt-0.5">
			<div class="flex items-center gap-1 text-[11px] sm:text-xs font-medium">
				<span class="w-2 h-2 rounded-full bg-amber-500"></span>
				<span>{remainingBagCount} tiles left</span>
			</div>

			{#if secondsLeft !== null}
				<div class="flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] sm:text-xs font-bold border transition-colors {secondsLeft <= 15
					? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
					: 'bg-slate-100 text-slate-700 border-slate-200'}">
					<span class="text-[10px]">⏱️</span>
					<span>{Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Player Score Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-1 gap-2">
		<!-- Player 1 Card -->
		<div
			class="relative flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition-all {turnPlayerId === p1?.id && status === 'PLAYING'
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
				<span class="font-semibold text-xs sm:text-sm text-slate-900 truncate">
					{p1 ? p1.name : 'Waiting...'} {p1 && p1.id === currentUserId ? '(You)' : ''}
				</span>
				{#if turnPlayerId === p1?.id && status === 'PLAYING'}
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
			class="relative flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition-all {turnPlayerId === p2?.id && status === 'PLAYING'
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
				<span class="font-semibold text-xs sm:text-sm text-slate-900 truncate">
					{p2 ? p2.name : 'Waiting...'} {p2 && p2.id === currentUserId ? '(You)' : ''}
				</span>
				{#if turnPlayerId === p2?.id && status === 'PLAYING'}
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
