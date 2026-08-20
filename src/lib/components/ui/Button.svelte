<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { clsx } from 'clsx';
	import { twMerge } from 'tailwind-merge';

	type Variant = 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'amber';
	type Size = 'sm' | 'default' | 'lg' | 'icon';

	let {
		class: className = '',
		variant = 'default',
		size = 'default',
		children,
		disabled = false,
		type = 'button',
		onclick,
		...restProps
	}: HTMLButtonAttributes & {
		variant?: Variant;
		size?: Size;
		children?: Snippet;
	} = $props();

	const variantStyles: Record<Variant, string> = {
		default: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-[0.98]',
		secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-[0.98]',
		outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-xs active:scale-[0.98]',
		destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]',
		ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
		amber: 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm active:scale-[0.98]'
	};

	const sizeStyles: Record<Size, string> = {
		sm: 'h-8 px-3 text-xs rounded-md',
		default: 'h-10 px-4 py-2 text-sm rounded-lg font-medium',
		lg: 'h-12 px-6 text-base rounded-xl font-semibold',
		icon: 'h-9 w-9 p-0 rounded-lg flex items-center justify-center'
	};

	const classes = $derived(
		twMerge(
			clsx(
				'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400',
				variantStyles[variant],
				sizeStyles[size],
				className
			)
		)
	);
</script>

<button {type} class={classes} {disabled} {onclick} {...restProps}>
	{@render children?.()}
</button>
