<script lang="ts">
	import type { PendingChallenge } from '../types';
	import Button from './ui/Button.svelte';

	let {
		isOpen = false,
		pendingChallenge = null,
		isChallenger = false,
		onAccept,
		onChallenge
	}: {
		isOpen: boolean;
		pendingChallenge: PendingChallenge | null;
		isChallenger: boolean;
		onAccept: () => void;
		onChallenge: () => void;
	} = $props();

	const wordsStr = $derived(
		pendingChallenge?.words.map((w) => w.word).join(', ') || ''
	);
</script>

{#if isOpen && pendingChallenge}
	{#if isChallenger}
		<!-- Modal for the Opponent (Decider) -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
			<div
				class="bg-white rounded-2xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4 text-center animate-in fade-in zoom-in-95 duration-150"
				onclick={(e) => e.stopPropagation()}
			>
				<div>
					<span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 mb-1.5">
						Official Challenge Window
					</span>
					<h3 class="text-lg sm:text-xl font-extrabold text-slate-900">
						Challenge {pendingChallenge.playerName}'s Play?
					</h3>
					<p class="text-xs text-slate-500 mt-1">
						Review the formed word(s) before making your decision.
					</p>
				</div>

				<!-- Word details card -->
				<div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
					<div class="flex items-center justify-between text-xs">
						<span class="text-slate-500 font-medium">Played Word(s):</span>
						<span class="font-bold text-sm text-slate-900 font-mono tracking-wider">
							{wordsStr}
						</span>
					</div>
					<div class="flex items-center justify-between text-xs">
						<span class="text-slate-500 font-medium">Claimed Score:</span>
						<span class="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
							+{pendingChallenge.totalScore} pts
						</span>
					</div>
					{#if pendingChallenge.isBingo}
						<div class="text-[11px] font-bold text-emerald-700 bg-emerald-50 py-1 px-2 rounded-md border border-emerald-200">
							🎉 BINGO! All 7 tiles played (+50 bonus)
						</div>
					{/if}
				</div>

				<!-- Penalty Rule Notice (Option B: 5-Point Penalty) -->
				<div class="text-[11px] text-left p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 leading-relaxed">
					<strong class="font-bold">Tournament Rule (Option B):</strong>
					If you challenge and the word is <em>valid</em> in Collins CSW24, you lose <strong>5 points</strong>. If the word is <em>invalid</em>, it is removed from the board and {pendingChallenge.playerName} scores 0 points.
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center gap-2 pt-1">
					<Button
						variant="outline"
						size="default"
						onclick={onAccept}
						class="flex-1 text-xs sm:text-sm font-semibold border-slate-300 hover:bg-slate-100"
					>
						Accept Play
					</Button>
					<Button
						variant="default"
						size="default"
						onclick={onChallenge}
						class="flex-1 text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
					>
						Challenge (-5)
					</Button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Floating banner for the Active Player while opponent decides -->
		<div class="fixed top-18 left-1/2 -translate-x-1/2 z-40 bg-amber-900/90 text-amber-50 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-amber-600/40 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
			<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
			<span>Waiting for opponent to accept or challenge "{wordsStr}"...</span>
		</div>
	{/if}
{/if}
