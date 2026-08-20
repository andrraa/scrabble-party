<script lang="ts">
	import type { Snippet } from 'svelte';
	import { clsx } from 'clsx';
	import { twMerge } from 'tailwind-merge';

	let {
		class: className = '',
		children
	}: {
		class?: string;
		children?: Snippet;
	} = $props();

	const classes = $derived(
		twMerge(
			clsx(
				'rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100',
				className
			)
		)
	);
</script>

<div class={classes}>
	{@render children?.()}
</div>
