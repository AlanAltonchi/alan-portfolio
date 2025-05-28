<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'size'> {
		label?: string;
		error?: string;
		helperText?: string;
		variant?: 'default' | 'filled';
		size?: 'sm' | 'md' | 'lg';
		value?: string;
	}

	let {
		label,
		error,
		helperText,
		variant = 'default',
		size = 'md',
		class: className = '',
		id,
		value = $bindable(''),
		...restProps
	}: Props = $props();

	const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

	const baseClasses = 'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';

	const variantClasses = {
		default: 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-white',
		filled: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-3 py-2',
		lg: 'px-4 py-3 text-lg'
	};

	const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

	const classes = $derived(`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${errorClasses} ${className}`);
</script>

{#if label}
	<label for={inputId} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
		{label}
	</label>
{/if}

<input
	{id}
	class={classes}
	bind:value
	{...restProps}
/>

{#if error}
	<p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
{:else if helperText}
	<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
{/if} 