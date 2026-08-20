<script lang="ts">
	import type { ScrabbleTile } from '../types';
	import Tile from './Tile.svelte';
	import Button from './ui/Button.svelte';

	let {
		rack,
		selectedTileId = null,
		isTurn = false,
		hasPending = false,
		canSwap = true,
		liveWordPreview = null,
		onSelectTile,
		onShuffle,
		onRecall,
		onOpenSwap,
		onPass,
		onPlay,
		onSendEmote,
		onReorderRack
	}: {
		rack: ScrabbleTile[];
		selectedTileId?: string | null;
		isTurn?: boolean;
		hasPending?: boolean;
		canSwap?: boolean;
		liveWordPreview?: { words: string[]; score: number; isValid: boolean; error?: string } | null;
		onSelectTile: (tile: ScrabbleTile) => void;
		onShuffle: () => void;
		onRecall: () => void;
		onOpenSwap: () => void;
		onPass: () => void;
		onPlay: () => void;
		onSendEmote?: (emote: string) => void;
		onReorderRack?: (newRack: ScrabbleTile[]) => void;
	} = $props();

	const EMOTES = ['👏 Nice!', '🤔 Thinking', '🔥 Wow', '👍 GG', '🎯 Boom!'];
	let draggedRackIdx = $state<number | null>(null);

	function handleDragStart(e: DragEvent, tile: ScrabbleTile, index: number) {
		draggedRackIdx = index;
		if (e.dataTransfer) {
			e.dataTransfer.setData('application/json', JSON.stringify(tile));
			e.dataTransfer.setData('text/rack-index', index.toString());
			e.dataTransfer.effectAllowed = 'move';
		}
		onSelectTile(tile);
	}

	function handleRackSlotDrop(e: DragEvent, targetIdx: number) {
		e.preventDefault();
		const fromRackIdxStr = e.dataTransfer?.getData('text/rack-index');
		if (fromRackIdxStr !== undefined && fromRackIdxStr !== '') {
			const fromIdx = parseInt(fromRackIdxStr, 10);
			if (!isNaN(fromIdx) && fromIdx !== targetIdx && onReorderRack) {
				const newRack = [...rack];
				const [moved] = newRack.splice(fromIdx, 1);
				if (moved) {
					newRack.splice(targetIdx, 0, moved);
					onReorderRack(newRack);
				}
			}
		}
		draggedRackIdx = null;
	}

	function handleRackSlotDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleTileClick(tile: ScrabbleTile, index: number) {
		// If another tile in rack is already selected and we click a second tile in rack, swap them!
		if (selectedTileId && selectedTileId !== tile.id && onReorderRack) {
			const fromIdx = rack.findIndex((t) => t.id === selectedTileId);
			if (fromIdx !== -1) {
				const newRack = [...rack];
				const temp = newRack[fromIdx];
				newRack[fromIdx] = newRack[index];
				newRack[index] = temp;
				onReorderRack(newRack);
				onSelectTile(tile);
				return;
			}
		}
		onSelectTile(tile);
	}
</script>

<div class="flex flex-col items-center gap-1.5 sm:gap-2 w-full max-w-[min(100%,500px,calc(100vh-270px))] mx-auto mt-1 sm:mt-1.5">
	<!-- Fixed 7-Slot Tile Rack Stand with Drag-to-Reorder / Click-to-Swap -->
	<div class="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#4a3525] rounded-xl shadow-inner border border-[#3b2a1d] w-full items-center justify-items-center min-h-[48px] sm:min-h-[56px] md:min-h-[64px]">
		{#each Array(7) as _, index}
			{@const tile = rack[index]}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="w-full flex items-center justify-center aspect-[4/5] rounded-md transition-all duration-75"
				ondragover={handleRackSlotDragOver}
				ondrop={(e) => handleRackSlotDrop(e, index)}
			>
				{#if tile}
					<div
						draggable="true"
						ondragstart={(e) => handleDragStart(e, tile, index)}
						class="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
					>
						<Tile
							{tile}
							size="normal"
							isSelected={selectedTileId === tile.id}
							onclick={() => handleTileClick(tile, index)}
						/>
					</div>
				{:else}
					<!-- Empty slot placeholder -->
					<div class="w-full max-w-[42px] sm:max-w-[48px] md:max-w-[54px] aspect-[4/5] rounded-md border border-[#3b2a1d]/60 bg-[#3a281a]/50"></div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Live Word & Score Preview Banner (when tiles are placed) -->
	{#if hasPending && liveWordPreview}
		<div class="flex items-center justify-between w-full px-3 py-1.5 rounded-lg bg-amber-50/90 border border-amber-200 text-xs font-semibold animate-in fade-in duration-100">
			<div class="flex items-center gap-1.5 min-w-0">
				<span class="text-amber-700">Preview:</span>
				<span class="font-mono text-amber-950 font-bold truncate">
					{liveWordPreview.words.join(', ')}
				</span>
			</div>

			<div class="flex items-center gap-1 shrink-0 text-amber-900 font-bold">
				<span>+{liveWordPreview.score} pts</span>
			</div>
		</div>
	{/if}

	<!-- Controls & Actions -->
	<div class="flex items-center justify-between gap-1 sm:gap-1.5 w-full">
		<!-- Left helper actions: Shuffle & Recall -->
		<div class="flex items-center gap-1 sm:gap-1.5">
			<Button
				variant="outline"
				size="sm"
				onclick={onShuffle}
				title="Shuffle Rack"
				class="text-[11px] sm:text-xs px-2.5 sm:px-3 h-8 sm:h-9 rounded-lg font-medium"
			>
				Shuffle
			</Button>

			<Button
				variant="outline"
				size="sm"
				onclick={onRecall}
				disabled={!hasPending}
				title="Recall all tiles to rack"
				class="text-[11px] sm:text-xs px-2.5 sm:px-3 h-8 sm:h-9 rounded-lg font-medium"
			>
				Recall
			</Button>
		</div>

		<!-- Right gameplay actions: Swap, Pass, Play -->
		<div class="flex items-center gap-1 sm:gap-1.5">
			<Button
				variant="secondary"
				size="sm"
				onclick={onOpenSwap}
				disabled={!isTurn || !canSwap || hasPending}
				class="text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg font-medium"
			>
				Swap
			</Button>

			<Button
				variant="secondary"
				size="sm"
				onclick={onPass}
				disabled={!isTurn || hasPending}
				class="text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-slate-600 hover:text-slate-900 font-medium"
			>
				Pass
			</Button>

			<Button
				variant="default"
				size="default"
				onclick={onPlay}
				disabled={!isTurn || !hasPending}
				class="h-8 sm:h-9 px-3.5 sm:px-5 font-semibold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-lg"
			>
				Play Word
			</Button>
		</div>
	</div>

	<!-- Quick Emotes Bar -->
	{#if onSendEmote}
		<div class="flex items-center justify-center gap-1.5 pt-0.5 w-full overflow-x-auto">
			{#each EMOTES as emote}
				<button
					type="button"
					onclick={() => onSendEmote(emote)}
					class="px-2 py-0.5 rounded-full bg-slate-100/80 hover:bg-slate-200 text-[10px] sm:text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
				>
					{emote}
				</button>
			{/each}
		</div>
	{/if}
</div>
