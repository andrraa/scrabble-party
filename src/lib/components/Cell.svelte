<script lang="ts">
	import type { BoardCell, ScrabbleTile } from '../types';
	import Tile from './Tile.svelte';
	import { clsx } from 'clsx';

	let {
		cell,
		pendingTile = null,
		isTarget = false,
		onclick,
		ondrop,
		onremove
	}: {
		cell: BoardCell;
		pendingTile?: ScrabbleTile | null;
		isTarget?: boolean;
		onclick?: () => void;
		ondrop?: (e: DragEvent) => void;
		onremove?: () => void;
	} = $props();

	const tileToRender = $derived(cell.tile || pendingTile);
	const isPending = $derived(!cell.isLocked && pendingTile !== null);
	const isLocked = $derived(cell.isLocked && cell.tile !== null);

	// Label for empty multiplier cells
	const multiplierLabel = $derived.by(() => {
		switch (cell.multiplier) {
			case 'TW':
				return '3W';
			case 'DW':
				return '2W';
			case 'TL':
				return '3L';
			case 'DL':
				return '2L';
			case 'CENTER':
				return '★';
			default:
				return '';
		}
	});

	// Premium square color styling
	const cellColorClass = $derived.by(() => {
		if (tileToRender) return 'bg-[#ece4d8]';

		switch (cell.multiplier) {
			case 'TW':
				return 'bg-red-200 text-red-950 font-extrabold border-red-300';
			case 'DW':
				return 'bg-rose-100 text-rose-900 font-bold border-rose-200';
			case 'TL':
				return 'bg-blue-200 text-blue-950 font-extrabold border-blue-300';
			case 'DL':
				return 'bg-sky-100 text-sky-900 font-bold border-sky-200';
			case 'CENTER':
				return 'bg-amber-200 text-amber-950 font-extrabold border-amber-300';
			default:
				return 'bg-[#efebe4] text-slate-400/80 border-[#e5dfd6]';
		}
	});

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleCellClick() {
		if (isPending && onremove) {
			onremove();
		} else if (onclick) {
			onclick();
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={clsx(
		'relative border flex items-center justify-center aspect-square transition-all duration-75 p-[1px] select-none touch-manipulation',
		cellColorClass,
		isTarget && 'ring-2 ring-blue-500 ring-inset bg-blue-100',
		!tileToRender && 'active:bg-slate-200 cursor-pointer'
	)}
	onclick={handleCellClick}
	ondragover={handleDragOver}
	ondrop={ondrop}
>
	{#if tileToRender}
		<Tile
			tile={tileToRender}
			size="board"
			{isPending}
			{isLocked}
		/>
	{:else}
		<span class="text-[clamp(7px,1.8vw,11px)] font-bold tracking-tighter leading-none select-none">
			{multiplierLabel}
		</span>
	{/if}
</div>
