<script lang="ts">
	import type { MoveHistoryItem } from '../types';

	let { history = [] }: { history: MoveHistoryItem[] } = $props();
</script>

<div class="flex flex-col h-full bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs overflow-hidden">
	<div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 shrink-0">
		<h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Game History</h3>
		<span class="text-[11px] text-slate-400 font-medium">{history.length} moves</span>
	</div>

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
