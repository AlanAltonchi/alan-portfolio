<script lang="ts">
	import { page } from '$app/stores';
	import Drawer from './Drawer.svelte';
	import Tabs from './Tabs.svelte';
	import Button from './Button.svelte';
	import { 
		DEVELOPER_TABS, 
		createTabDataLoader,
		type DevData 
	} from '$lib/utils/developer-drawer.svelte';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let {
		open = false,
		onclose
	}: Props = $props();

	let activeTab = $state('page-code');

	// Get current page route and data
	const currentRoute = $derived($page.route.id || '/');
	const devData = $derived($page.data?.devData as DevData | undefined);

	// Initialize data loader
	const dataLoader = createTabDataLoader();

	// Load data when tab changes
	$effect(() => {
		if (open) {
			dataLoader.loadTabData(activeTab, currentRoute, devData);
		}
	});

	function downloadContent() {
		dataLoader.downloadCurrentTab(activeTab, currentRoute);
	}
</script>

<Drawer 
	{open} 
	title="🧑‍💻 Developer Mode" 
	side="right"
	size="lg"
	{onclose}
>
	<div class="space-y-4 overflow-hidden">
		<div class="flex items-center justify-between">
			<div class="text-sm text-gray-600 dark:text-gray-400">
				<p>Current route: <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">{currentRoute}</code></p>
				{#if devData?.relevantTables}
					<p class="mt-1">Tables: <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">{devData.relevantTables.join(', ')}</code></p>
				{/if}
			</div>
			<Button variant="outline" size="sm" onclick={downloadContent}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				Download
			</Button>
		</div>

		<Tabs tabs={DEVELOPER_TABS} {activeTab} onTabChange={(tabId) => activeTab = tabId}>
			{#snippet children({ activeTab }: { activeTab: string })}
				<div class="mt-4">
					{#if dataLoader.loading}
						<div class="flex items-center justify-center py-8">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					{:else if activeTab === 'page-code'}
						<div class="space-y-2">
							<h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
								</svg>
								Page Source Code
							</h3>
							<pre class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-96 border font-mono scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-400"><code>{dataLoader.pageCode}</code></pre>
						</div>
					{:else if activeTab === 'rls-rules'}
						<div class="space-y-2">
							<h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
								Row Level Security Policies
								{#if devData?.relevantTables}
									<span class="ml-2 text-xs text-gray-500">({devData.relevantTables.length} tables)</span>
								{/if}
							</h3>
							<pre class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-96 border font-mono scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-400"><code>{dataLoader.rlsRules}</code></pre>
						</div>
					{:else if activeTab === 'schema'}
						<div class="space-y-2">
							<h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
								</svg>
								Database Schema
								{#if devData?.relevantTables}
									<span class="ml-2 text-xs text-gray-500">({devData.relevantTables.length} tables)</span>
								{/if}
							</h3>
							<pre class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-96 border font-mono scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-400"><code>{dataLoader.schemaInfo}</code></pre>
						</div>
					{/if}
				</div>
			{/snippet}
		</Tabs>
	</div>
</Drawer> 