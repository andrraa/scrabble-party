<script lang="ts">
	import Button from './ui/Button.svelte';

	let {
		isOpen = false,
		onSelect,
		onCancel
	}: {
		isOpen: boolean;
		onSelect: (letter: string) => void;
		onCancel: () => void;
	} = $props();

	const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
</script>

{#if isOpen}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={onCancel}
	>
		<div
			class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-4"
			onclick={(e) => e.stopPropagation()}
		>
			<div>
				<h3 class="text-lg font-bold text-slate-900">Choose Wildcard Letter</h3>
				<p class="text-xs text-slate-500 mt-1">Select the letter you want this blank tile to represent.</p>
			</div>

			<div class="grid grid-cols-7 gap-1.5 py-2">
				{#each LETTERS as letter}
					<button
						onclick={() => onSelect(letter)}
						class="w-9 h-10 rounded-lg bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-950 font-bold text-base border border-amber-200 shadow-2xs transition-all active:scale-90 flex items-center justify-center cursor-pointer"
					>
						{letter}
					</button>
				{/each}
			</div>

			<div class="flex justify-end pt-2">
				<Button variant="outline" size="sm" onclick={onCancel}>
					Cancel
				</Button>
			</div>
		</div>
	</div>
{/if}
