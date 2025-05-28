<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: 'default' | 'outlined' | 'elevated';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		children: Snippet;
	}

	let {
		variant = 'default',
		padding = 'md',
		class: className = '',
		children
	}: Props = $props();	

	const baseClasses = 'rounded-lg';

	const variantClasses = {
		default: 'bg-white dark:bg-gray-800',
		outlined: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
		elevated: 'bg-white shadow-md dark:bg-gray-800'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const classes = $derived(`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`);
</script>

<div class={classes}>
	{@render children()}
</div> 