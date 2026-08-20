<script lang="ts">
	import type { Snippet } from 'svelte';
	import { clsx } from 'clsx';
	import { twMerge } from 'tailwind-merge';

	type Variant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'indigo';

	let {
		class: className = '',
		variant = 'default',
		children
	}: {
		class?: string;
		variant?: Variant;
		children?: Snippet;
	} = $props();

	const variantStyles: Record<Variant, string> = {
		default: 'bg-slate-900 text-white',
		secondary: 'bg-slate-100 text-slate-800 border border-slate-200',
		outline: 'border border-slate-300 text-slate-700 bg-white',
		success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
		warning: 'bg-amber-50 text-amber-800 border border-amber-200',
		destructive: 'bg-red-50 text-red-700 border border-red-200',
		indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200'
	};

	const classes = $derived(
		twMerge(
			clsx(
				'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors',
				variantStyles[variant],
				className
			)
		)
	);
</script>

<span class={classes}>
	{@render children?.()}
</span>
