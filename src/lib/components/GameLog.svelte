<script lang="ts">
	import type { MoveHistoryItem } from '../types';

	let { history = [] }: { history: MoveHistoryItem[] } = $props();

	// Calculate highest scoring word in the match
	const bestWord = $derived.by(() => {
		let best: { word: string; score: number; playerName: string } | null = null;
		for (const item of history) {
			if (item.type === 'PLAY' && item.words) {
				for (const w of item.words) {
					if (!best || w.score > best.score) {
						best = { word: w.word, score: w.score, playerName: item.playerName };
					}
				}
			}
		}
		return best;
	});
</script>

<div class="flex flex-col h-full bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs overflow-hidden">
	<div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 shrink-0">
		<h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Game History</h3>
		<span class="text-[11px] text-slate-400 font-medium">{history.length} moves</span>
	</div>

	<!-- Best Word Banner (if words have been played) -->
	{#if bestWord}
		<div class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-300 text-xs mb-2 shrink-0 shadow-2xs">
			<div class="flex items-center gap-1.5 min-w-0">
				<span>👑</span>
				<span class="text-[11px] font-semibold text-amber-800 shrink-0">Best Word:</span>
				<span class="font-mono font-bold text-amber-950 truncate">{bestWord.word}</span>
			</div>
			<div class="flex items-center gap-1 text-amber-950 font-bold shrink-0">
				<span>+{bestWord.score} pts</span>
			</div>
		</div>
	{/if}

	{#if history.length === 0}
		<div class="flex-1 flex items-center justify-center text-center p-4">
			<span class="text-xs text-slate-400 italic">No moves recorded yet.</span>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
			{#each history as item (item.id)}
				<div class="flex items-start justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
					<div class="flex flex-col gap-0.5 min-w-0 pr-2">
						<span class="font-semibold text-slate-800 truncate">
							{item.playerName}
						</span>

						{#if item.type === 'PLAY' && item.words}
							<div class="flex flex-wrap gap-1 mt-0.5">
								{#each item.words as w}
									<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[11px]">
										{w.word} <span class="text-[9px] font-sans font-normal opacity-75">+{w.score}</span>
									</span>
								{/each}
							</div>
						{:else if item.type === 'PASS'}
							<span class="text-[11px] text-slate-400 italic">Passed turn</span>
						{:else if item.type === 'SWAP'}
							<span class="text-[11px] text-slate-400 italic">Swapped {item.swappedCount} tiles</span>
						{/if}
					</div>

					<div class="flex flex-col items-end shrink-0">
						{#if item.totalScore > 0}
							<span class="font-bold text-slate-900 text-sm tabular-nums">
								+{item.totalScore}
							</span>
						{:else}
							<span class="font-medium text-slate-400 text-xs">-</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
