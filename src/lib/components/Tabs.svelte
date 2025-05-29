<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Tab {
		id: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		tabs: Tab[];
		activeTab?: string;
		onTabChange?: (tabId: string) => void;
		variant?: 'default' | 'pills';
		size?: 'sm' | 'md' | 'lg';
		children: Snippet<[{ activeTab: string }]>;
	}

	let {
		tabs,
		activeTab = tabs[0]?.id,
		variant = 'default',
		size = 'md',
		onTabChange,
		children
	}: Props = $props();

	const baseTabClasses =
		'inline-flex cursor-pointer items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variantClasses = {
		default: {
			container: 'border-b border-gray-200 dark:border-gray-700',
			tab: 'border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-300',
			active: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
			inactive: 'text-gray-500 dark:text-gray-400'
		},
		pills: {
			container: 'bg-gray-100 p-1 rounded-lg dark:bg-gray-800',
			tab: 'rounded-md hover:bg-gray-200 dark:hover:bg-gray-700',
			active: 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white',
			inactive: 'text-gray-600 dark:text-gray-300'
		}
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2',
		lg: 'px-6 py-3 text-lg'
	};

	function handleTabClick(tabId: string) {
		if (tabs.find((tab) => tab.id === tabId)?.disabled) return;
		onTabChange?.(tabId);
	}
</script>

<div class="w-full">
	<!-- Tab Navigation -->
	<div class="flex {variantClasses[variant].container}">
		{#each tabs as tab}
			<button
				class="{baseTabClasses} {sizeClasses[size]} {variantClasses[variant].tab} {activeTab ===
				tab.id
					? variantClasses[variant].active
					: variantClasses[variant].inactive}"
				disabled={tab.disabled}
				onclick={() => handleTabClick(tab.id)}
				role="tab"
				aria-selected={activeTab === tab.id}
				aria-controls="panel-{tab.id}"
				id="tab-{tab.id}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Tab Content -->
	<div class="mt-4">
		{@render children({ activeTab })}
	</div>
</div>
