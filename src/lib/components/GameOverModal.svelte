<script lang="ts">
	import type { GameState } from '../types';
	import Button from './ui/Button.svelte';

	let {
		gameState,
		currentUserId,
		onRestart
	}: {
		gameState: GameState;
		currentUserId: string;
		onRestart: () => void;
	} = $props();

	const isHost = $derived(gameState.players[currentUserId]?.isHost ?? false);
	const winner = $derived(gameState.winnerId ? gameState.players[gameState.winnerId] : null);
	const isWinner = $derived(gameState.winnerId === currentUserId);
	const isTie = $derived(gameState.winnerId === null);
</script>

{#if gameState.status === 'FINISHED'}
	<div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">
			<!-- Header / Result Banner -->
			<div class="flex flex-col items-center gap-1">
				{#if isTie}
					<span class="text-3xl font-extrabold text-slate-800">It's a Tie!</span>
					<p class="text-sm text-slate-500">Both players finished with equal scores.</p>
				{:else if isWinner}
					<span class="text-3xl font-extrabold text-emerald-600">Victory!</span>
					<p class="text-sm text-slate-500">Congratulations, you won the match!</p>
				{:else}
					<span class="text-3xl font-extrabold text-slate-800">{winner?.name} Won!</span>
					<p class="text-sm text-slate-500">Good game! Better luck next round.</p>
				{/if}
			</div>

			<!-- Final Score Board -->
			<div class="w-full grid grid-cols-2 gap-3 py-2">
				{#each gameState.playerOrder as pid}
					{@const p = gameState.players[pid]}
					<div
						class="flex flex-col p-4 rounded-2xl border {gameState.winnerId === p.id
							? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
							: 'bg-slate-50 border-slate-200'}"
					>
						<span class="text-xs font-semibold text-slate-500 truncate mb-1">
							{p.name} {p.id === currentUserId ? '(You)' : ''}
						</span>
						<span class="text-3xl font-extrabold text-slate-900 tabular-nums">
							{p.score}
						</span>
						<span class="text-[11px] text-slate-400 font-medium">Final Points</span>
					</div>
				{/each}
			</div>

			<!-- Action -->
			<div class="flex flex-col gap-2 w-full pt-2">
				{#if isHost}
					<Button variant="default" size="lg" onclick={onRestart} class="w-full bg-slate-900 hover:bg-slate-800">
						Play Again
					</Button>
				{:else}
					<p class="text-xs text-slate-400 italic">Waiting for host to restart match...</p>
				{/if}
				<a
					href="/"
					class="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 transition-colors"
				>
					Return to Home
				</a>
			</div>
		</div>
	</div>
{/if}
