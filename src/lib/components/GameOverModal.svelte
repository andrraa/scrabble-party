<script lang="ts">
	import type { GameState } from '../types';
	import Button from './ui/Button.svelte';

	let {
		isOpen = true,
		gameState,
		currentUserId,
		onClose,
		onRestart
	}: {
		isOpen: boolean;
		gameState: GameState;
		currentUserId: string;
		onClose: () => void;
		onRestart: () => void;
	} = $props();

	const isHost = $derived(gameState.players[currentUserId]?.isHost ?? false);
	const winner = $derived(gameState.winnerId ? gameState.players[gameState.winnerId] : null);
	const isWinner = $derived(gameState.winnerId === currentUserId);
	const isTie = $derived(gameState.winnerId === null);
</script>

{#if gameState.status === 'FINISHED' && isOpen}
	<!-- Backdrop (Clicking backdrop also closes to view board) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={onClose}
	>
		<div
			class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200 relative"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Prominent Top Right Close Button (✕) -->
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				class="absolute top-3.5 right-3.5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-xs cursor-pointer border border-slate-200"
				title="Close to inspect board"
				aria-label="Close"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>

			<!-- Header / Result Banner -->
			<div class="flex flex-col items-center gap-1 mt-1">
				{#if isTie}
					<span class="text-3xl font-extrabold text-slate-800">It's a Tie!</span>
					<p class="text-xs text-slate-500">Both players finished with equal scores.</p>
				{:else if isWinner}
					<div class="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs mb-1 animate-bounce">
						👑
					</div>
					<span class="text-3xl font-extrabold text-emerald-600">Victory!</span>
					<p class="text-xs text-slate-500">Congratulations, you won the match!</p>
				{:else}
					<div class="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs mb-1">
						👑
					</div>
					<span class="text-2xl font-extrabold text-slate-800">{winner?.name} Won!</span>
					<p class="text-xs text-slate-500">Good game! Better luck next round.</p>
				{/if}
			</div>

			<!-- Final Score Board -->
			<div class="w-full grid grid-cols-2 gap-3 py-1">
				{#each gameState.playerOrder as pid}
					{@const p = gameState.players[pid]}
					<div
						class="flex flex-col p-3.5 rounded-2xl border transition-all {gameState.winnerId === p.id
							? 'bg-gradient-to-b from-amber-50 to-amber-100/80 border-amber-400 ring-2 ring-amber-400 shadow-xs'
							: 'bg-slate-50 border-slate-200'}"
					>
						<div class="flex items-center justify-center gap-1 mb-1">
							{#if gameState.winnerId === p.id}
								<span class="text-xs">👑</span>
							{/if}
							<span class="text-xs font-semibold text-slate-700 truncate">
								{p.name} {p.id === currentUserId ? '(You)' : ''}
							</span>
						</div>
						<span class="text-3xl font-extrabold text-slate-900 tabular-nums">
							{p.score}
						</span>
						<span class="text-[10px] text-slate-400 font-medium">Final Points</span>
					</div>
				{/each}
			</div>

			<!-- Actions -->
			<div class="flex flex-col gap-2 w-full pt-1">
				<Button
					variant="outline"
					size="default"
					onclick={onClose}
					class="w-full text-xs font-semibold border-slate-300"
				>
					📸 View Board & Screenshot
				</Button>

				{#if isHost}
					<Button variant="default" size="default" onclick={onRestart} class="w-full bg-slate-900 hover:bg-slate-800">
						Play Again
					</Button>
				{:else}
					<p class="text-xs text-slate-400 italic py-1">Waiting for host to restart match...</p>
				{/if}

				<a
					href="/"
					class="text-xs font-semibold text-slate-400 hover:text-slate-800 pt-1 transition-colors"
				>
					Return to Home
				</a>
			</div>
		</div>
	</div>
{/if}
