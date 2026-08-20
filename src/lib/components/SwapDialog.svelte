<script lang="ts">
	import type { ScrabbleTile } from '../types';
	import Tile from './Tile.svelte';
	import Button from './ui/Button.svelte';

	let {
		isOpen = false,
		rack = [],
		onConfirm,
		onCancel
	}: {
		isOpen: boolean;
		rack: ScrabbleTile[];
		onConfirm: (selectedIds: string[]) => void;
		onCancel: () => void;
	} = $props();

	let selectedIds = $state<string[]>([]);

	function toggleTile(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((tId) => tId !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function handleConfirm() {
		if (selectedIds.length > 0) {
			onConfirm(selectedIds);
			selectedIds = [];
		}
	}

	function handleClose() {
		selectedIds = [];
		onCancel();
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={handleClose}
	>
		<div
			class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4"
			onclick={(e) => e.stopPropagation()}
		>
			<div>
				<h3 class="text-lg font-bold text-slate-900">Swap Tiles</h3>
				<p class="text-xs text-slate-500 mt-1">
					Select tiles to return to the bag and receive new random ones. This will end your turn.
				</p>
			</div>

			<div class="flex items-center justify-center gap-2 py-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[80px]">
				{#each rack as tile (tile.id)}
					<Tile
						{tile}
						size="normal"
						isSelected={selectedIds.includes(tile.id)}
						onclick={() => toggleTile(tile.id)}
					/>
				{/each}
			</div>

			<div class="flex items-center justify-between pt-2">
				<span class="text-xs font-semibold text-slate-500">
					{selectedIds.length} tile(s) selected
				</span>

				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" onclick={handleClose}>
						Cancel
					</Button>
					<Button
						variant="default"
						size="sm"
						onclick={handleConfirm}
						disabled={selectedIds.length === 0}
						class="bg-amber-600 hover:bg-amber-700 text-white"
					>
						Confirm Swap
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
