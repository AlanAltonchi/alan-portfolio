<script lang="ts">
	import { fly } from 'svelte/transition';
	import Button from './Button.svelte';
	// import { onMount } from 'svelte'; // Unused
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		side?: 'left' | 'right' | 'top' | 'bottom';
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		closable?: boolean;
		onclose?: () => void;
		children: Snippet;
	}

	let {
		open = false,
		title,
		// side = 'right', // Unused
		// size = 'md', // Unused
		closable = true,
		onclose,
		children
	}: Props = $props();

	// const sideClasses = { // Unused
	// 	left: 'left-0 top-0 h-full',
	// 	right: 'right-0 top-0 h-full',
	// 	top: 'top-0 left-0 w-full',
	// 	bottom: 'bottom-0 left-0 w-full'
	// };

	// const sizeClasses = { // Unused
	// 	sm: side === 'left' || side === 'right' ? 'w-80' : 'h-80',
	// 	md: side === 'left' || side === 'right' ? 'w-96' : 'h-96',
	// 	lg: side === 'left' || side === 'right' ? 'w-[32rem]' : 'h-[32rem]',
	// 	xl: 'w-full h-full',
	// 	full: 'w-full h-full'
	// };

	// const transformClasses = { // Unused
	// 	left: open ? 'translate-x-0' : '-translate-x-full',
	// 	right: open ? 'translate-x-0' : 'translate-x-full',
	// 	top: open ? 'translate-y-0' : '-translate-y-full',
	// 	bottom: open ? 'translate-y-0' : 'translate-y-full'
	// };

	function handleBackdropClick(event: MouseEvent) {
		if (closable && event.target === event.currentTarget) {
			onclose?.();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (closable && event.key === 'Escape') {
			onclose?.();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="presentation"
	></div>

	<!-- Drawer -->
	<div
		in:fly={{ x: 512, duration: 300, opacity: 1 }}
		out:fly={{ x: 512, duration: 300, opacity: 1 }}
		class="fixed top-0 right-0 z-[101] flex h-full w-[32rem] flex-col bg-white shadow-lg dark:bg-gray-800"
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'drawer-title' : undefined}
		tabindex="0"
	>
		{#if title || closable}
			<div
				class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700"
			>
				{#if title}
					<h2 id="drawer-title" class="text-lg font-semibold text-gray-900 dark:text-white">
						{title}
					</h2>
				{/if}
				{#if closable}
					<Button variant="ghost" size="sm" onclick={() => onclose?.()} class="ml-auto">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</Button>
				{/if}
			</div>
		{/if}

		<div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
			{@render children()}
		</div>
	</div>
{/if}
