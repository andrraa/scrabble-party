<script lang="ts">
	import type { BoardCell, PlacedTileMove, ScrabbleTile } from '../types';
	import Cell from './Cell.svelte';

	let {
		board,
		pendingPlacements = [],
		onPlaceTile,
		onRemovePendingTile
	}: {
		board: BoardCell[][];
		pendingPlacements?: PlacedTileMove[];
		onPlaceTile: (row: number, col: number, tile?: ScrabbleTile) => void;
		onRemovePendingTile: (row: number, col: number) => void;
	} = $props();

	function getPendingTileAt(r: number, c: number): ScrabbleTile | null {
		const found = pendingPlacements.find((p) => p.row === r && p.col === c);
		return found ? found.tile : null;
	}

	function handleDrop(e: DragEvent, r: number, c: number) {
		e.preventDefault();
		const rawData = e.dataTransfer?.getData('application/json');
		if (!rawData) return;

		try {
			const tile = JSON.parse(rawData) as ScrabbleTile;
			onPlaceTile(r, c, tile);
		} catch (err) {
			console.error('Invalid tile drop payload', err);
		}
	}
</script>

<div class="flex items-center justify-center select-none w-full max-w-full lg:w-auto lg:h-full lg:max-h-full lg:max-w-full aspect-square mx-auto">
	<!-- The 15x15 Grid Container -->
	<div class="scrabble-board-grid w-full h-full border border-[#8d7b68] sm:border-2 rounded-lg sm:rounded-xl overflow-hidden shadow-xs bg-[#c7baa7] gap-[1px] p-[1px]">
		{#each board as rowCells, r}
			{#each rowCells as cell, c}
				<Cell
					{cell}
					pendingTile={getPendingTileAt(r, c)}
					onclick={() => onPlaceTile(r, c)}
					ondrop={(e) => handleDrop(e, r, c)}
					onremove={() => onRemovePendingTile(r, c)}
				/>
			{/each}
		{/each}
	</div>
</div>
