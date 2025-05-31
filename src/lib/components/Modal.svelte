<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onOpen?: () => void;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		closable?: boolean;
		children: Snippet;
	}

	let {
		isOpen = $bindable(false),
		title,
		size = 'md',
		closable = true,
		onClose,
		onOpen,
		children
	}: Props = $props();

	let previousIsOpen = $state(false);

	$effect(() => {
		if (isOpen && !previousIsOpen) {
			onOpen?.();
		}
		previousIsOpen = isOpen;
	});

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function handleBackdropClick(event: MouseEvent) {
		if (closable && event.target === event.currentTarget) {
			onClose?.();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (closable && event.key === 'Escape') {
			onClose?.();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<!-- Modal -->
		<div class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
			<div
				class="w-full {sizeClasses[size]} rounded-lg bg-white shadow-lg dark:bg-gray-800"
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? 'modal-title' : undefined}
				tabindex="0"
			>
				{#if title || closable}
					<div
						class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700"
					>
						{#if title}
							<h2 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">
								{title}
							</h2>
						{/if}
						{#if closable}
							<Button variant="ghost" size="sm" onclick={() => onClose?.()} class="ml-auto">
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

				<div class="px-6 py-4">
					{@render children()}
				</div>
			</div>
		</div>
	</div>
{/if}
