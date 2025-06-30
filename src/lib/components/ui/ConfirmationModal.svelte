<script lang="ts">
	interface Props {
		isOpen: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		confirmVariant?: 'danger' | 'primary' | 'warning';
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		isOpen = false,
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		confirmVariant = 'primary',
		onConfirm,
		onCancel
	}: Props = $props();

	// Handle escape key
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onCancel();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onCancel();
		}
	}

	// Get confirm button classes based on variant
	const confirmButtonClasses = $derived(() => {
		const base =
			'flex-1 cursor-pointer w-[50%] px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

		switch (confirmVariant) {
			case 'danger':
				return `${base} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
			case 'warning':
				return `${base} bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500`;
			default:
				return `${base} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
		}
	});
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		aria-describedby="modal-message"
		tabindex="-1"
	>
		<!-- Modal -->
		<div class="relative w-[550px] overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
			<!-- Content -->
			<div class="p-6 text-center">
				<!-- Icon -->
				<div class="mb-4 flex justify-center">
					<div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700">
						{#if confirmVariant === 'danger'}
							<svg
								class="h-8 w-8 text-red-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						{:else if confirmVariant === 'warning'}
							<svg
								class="h-8 w-8 text-amber-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						{:else}
							<svg
								class="h-8 w-8 text-blue-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						{/if}
					</div>
				</div>

				<!-- Title -->
				<h2 id="modal-title" class="mb-2 text-xl font-semibold text-white">
					{title}
				</h2>

				<!-- Message -->
				<p id="modal-message" class="mb-6 text-gray-300">
					{message}
				</p>

				<!-- Actions -->
				<div class="flex gap-3">
					<button
						onclick={onCancel}
						class="flex-1 cursor-pointer rounded-lg bg-gray-700 px-4 py-3 font-medium text-gray-300 transition-colors duration-200 hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
					>
						{cancelText}
					</button>

					<button onclick={onConfirm} class={confirmButtonClasses}>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: scale(0.9) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
