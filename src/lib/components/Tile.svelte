<script lang="ts">
	import type { ScrabbleTile } from '../types';
	import { clsx } from 'clsx';
	import { twMerge } from 'tailwind-merge';

	let {
		tile,
		isPending = false,
		isLocked = false,
		isSelected = false,
		size = 'normal', // 'small' | 'normal' | 'board'
		class: className = '',
		onclick
	}: {
		tile: ScrabbleTile;
		isPending?: boolean;
		isLocked?: boolean;
		isSelected?: boolean;
		size?: 'small' | 'normal' | 'board';
		class?: string;
		onclick?: () => void;
	} = $props();

	const displayLetter = $derived(
		tile.isBlank ? (tile.assignedLetter || '_') : tile.letter
	);

	const displayValue = $derived(
		tile.isBlank ? 0 : tile.value
	);

	const isWildcard = $derived(tile.isBlank);

	const rootClasses = $derived(
		twMerge(
			clsx(
				'relative select-none flex items-center justify-center font-bold tracking-tight rounded-md transition-all duration-100 touch-manipulation',
				// Size styles
				size === 'board' && 'w-full h-full text-[clamp(11.5px,3.6vw,19px)] leading-none font-bold',
				size === 'normal' && 'w-full max-w-[46px] sm:max-w-[54px] md:max-w-[62px] aspect-[4/5] text-[clamp(14px,2.5vw,22px)] shadow-xs cursor-pointer',
				size === 'small' && 'w-6 h-7 md:w-7 md:h-8 text-xs shadow-2xs',
				// State appearances
				isLocked && 'bg-[#fcf8f2] text-amber-950 border border-[#d9cbb7]',
				isPending && 'bg-amber-100 text-amber-900 border-2 border-amber-500 ring-2 ring-amber-300/70 scale-[1.03] shadow-md z-10',
				!isLocked && !isPending && 'bg-[#fdfbf7] text-amber-950 border border-[#e2d5c3] active:scale-95 shadow-xs hover:border-amber-400',
				isSelected && 'ring-2 ring-amber-600 border-amber-600 -translate-y-2 shadow-lg bg-amber-50 z-20 scale-105',
				className
			)
		)
	);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class={rootClasses} {onclick}>
	<!-- Letter -->
	<span class="leading-none select-none font-semibold">
		{displayLetter}
	</span>

	<!-- Subscript Point Value -->
	{#if displayLetter !== '?' && displayLetter !== '_'}
		<span
			class={clsx(
				'absolute leading-none font-medium opacity-80 select-none',
				size === 'board' && 'bottom-[0.5px] sm:bottom-[1px] right-[0.5px] sm:right-[1px] text-[clamp(6px,1.6vw,9px)]',
				size === 'normal' && 'bottom-0.5 sm:bottom-1 right-0.5 sm:right-1 text-[8px] sm:text-[10px] md:text-xs',
				size === 'small' && 'bottom-0.5 right-0.5 text-[7px]'
			)}
		>
			{displayValue}
		</span>
	{/if}

	<!-- Wildcard indicator dot -->
	{#if isWildcard}
		<span
			class="absolute top-0.5 left-0.5 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-600/90"
			title="Wildcard Tile"
		></span>
	{/if}
</div>
