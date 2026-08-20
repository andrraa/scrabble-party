<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { clsx } from 'clsx';
	import { twMerge } from 'tailwind-merge';

	let {
		class: className = '',
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		disabled = false,
		...restProps
	}: HTMLInputAttributes = $props();

	const classes = $derived(
		twMerge(
			clsx(
				'flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs',
				className
			)
		)
	);
</script>

<input {type} class={classes} bind:value {placeholder} {disabled} {...restProps} />
