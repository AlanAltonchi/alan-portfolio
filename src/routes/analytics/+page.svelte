<script lang="ts">
	import { analyticsStore } from '$lib/stores/analytics.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import DeveloperDrawer from '$lib/components/DeveloperDrawer.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import HeatMap from '$lib/components/charts/HeatMap.svelte';
	import { CalendarDays, Users, MousePointer, Clock, TrendingUp, TrendingDown, Globe, Smartphone, Monitor, Tablet, Eye, Activity, BarChart3 } from 'lucide-svelte';

	let { data } = $props();

	// Redirect to login if not authenticated
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/auth/login');
			return;
		}
		// Load analytics data
		analyticsStore.loadAnalytics().then(() => {
			// If no data exists, generate mock data
			if (analyticsStore.overview.length === 0) {
				analyticsStore.generateMockData();
			}
		});
	});

	// Prepare data for charts
	const trafficDonutData = $derived(
		analyticsStore.trafficSources.map((source, i) => ({
			name: source.source_name,
			value: source.visits,
			percentage: Number(source.percentage),
			color: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][i]
		}))
	);

	const deviceDonutData = $derived(
		analyticsStore.deviceStats.map((device, i) => ({
			name: device.device_type,
			value: device.count,
			percentage: Number(device.percentage),
			color: ['#3b82f6', '#10b981', '#f97316'][i]
		}))
	);

	const pageBarData = $derived(
		analyticsStore.pagePerformance.map(page => ({
			label: page.page_path,
			value: page.views
		}))
	);

	const heatMapData = $derived(
		analyticsStore.userActivity.map(activity => ({
			hour: activity.hour_of_day || 0,
			value: activity.activity_count
		}))
	);

	// Stats cards animation
	let statsVisible = $state(false);
	onMount(() => {
		setTimeout(() => statsVisible = true, 100);
	});
</script>

<svelte:head>
	<title>Analytics Dashboard</title>
</svelte:head>

{#if authStore.isAuthenticated}
	<div class="min-h-screen">
		<div class="container mx-auto px-6 py-8">
			<!-- Enhanced Header -->
			<header class="mb-12 text-center">
				<div class="inline-flex items-center gap-3 mb-4">
					<div class="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
						<BarChart3 class="w-8 h-8 text-white" />
					</div>
					<h1 class="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
						Analytics Dashboard
					</h1>
				</div>
				<p class="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
					Comprehensive insights and real-time performance metrics for your digital presence
				</p>
			</header>

			{#if analyticsStore.loading}
				<div class="flex items-center justify-center py-32">
					<div class="text-center">
						<div class="relative">
							<div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
							<div class="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
						</div>
						<p class="text-slate-600 dark:text-slate-400 text-lg">Loading analytics data...</p>
					</div>
				</div>
			{:else if analyticsStore.error}
				<div class="text-center py-32">
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md mx-auto">
						<p class="text-red-600 dark:text-red-400 mb-6 text-lg">{analyticsStore.error}</p>
						<button
							class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
							onclick={() => analyticsStore.loadAnalytics()}
						>
							Retry
						</button>
					</div>
				</div>
			{:else}
				<!-- Enhanced Stats Cards -->
				<div class="grid gap-8 md:grid-cols-2 xl:grid-cols-4 mb-12">
					<!-- Total Page Views Card -->
					<div 
						class="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-200 dark:border-slate-700"
						class:opacity-0={!statsVisible}
						class:translate-y-8={!statsVisible}
						style="transition-delay: 0ms"
					>
						<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 group-hover:from-blue-500/10 group-hover:to-blue-600/20 transition-all duration-500"></div>
						<div class="relative">
							<div class="flex items-center justify-between mb-6">
								<div class="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
									<Eye class="w-6 h-6 text-white" />
								</div>
								<div class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
									Last 30 days
								</div>
							</div>
							<h3 class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">Total Page Views</h3>
							<p class="text-4xl font-bold text-slate-900 dark:text-white mb-4">{analyticsStore.totalPageViews.toLocaleString()}</p>
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
									<TrendingUp class="w-4 h-4 text-green-600" />
									<span class="text-sm font-medium text-green-600">+12.5%</span>
								</div>
								<span class="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
							</div>
						</div>
					</div>

					<!-- Unique Visitors Card -->
					<div 
						class="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-200 dark:border-slate-700"
						class:opacity-0={!statsVisible}
						class:translate-y-8={!statsVisible}
						style="transition-delay: 100ms"
					>
						<div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 group-hover:from-green-500/10 group-hover:to-green-600/20 transition-all duration-500"></div>
						<div class="relative">
							<div class="flex items-center justify-between mb-6">
								<div class="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg">
									<Users class="w-6 h-6 text-white" />
								</div>
								<div class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
									Last 30 days
								</div>
							</div>
							<h3 class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">Unique Visitors</h3>
							<p class="text-4xl font-bold text-slate-900 dark:text-white mb-4">{analyticsStore.totalUniqueVisitors.toLocaleString()}</p>
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
									<TrendingUp class="w-4 h-4 text-green-600" />
									<span class="text-sm font-medium text-green-600">+8.3%</span>
								</div>
								<span class="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
							</div>
						</div>
					</div>

					<!-- Session Duration Card -->
					<div 
						class="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-200 dark:border-slate-700"
						class:opacity-0={!statsVisible}
						class:translate-y-8={!statsVisible}
						style="transition-delay: 200ms"
					>
						<div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 group-hover:from-purple-500/10 group-hover:to-purple-600/20 transition-all duration-500"></div>
						<div class="relative">
							<div class="flex items-center justify-between mb-6">
								<div class="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg">
									<Clock class="w-6 h-6 text-white" />
								</div>
								<div class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
									Average
								</div>
							</div>
							<h3 class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">Session Duration</h3>
							<p class="text-4xl font-bold text-slate-900 dark:text-white mb-4">
								{Math.floor(analyticsStore.avgSessionDuration / 60)}:{(analyticsStore.avgSessionDuration % 60).toString().padStart(2, '0')}
							</p>
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
									<TrendingUp class="w-4 h-4 text-green-600" />
									<span class="text-sm font-medium text-green-600">+5.7%</span>
								</div>
								<span class="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
							</div>
						</div>
					</div>

					<!-- Bounce Rate Card -->
					<div 
						class="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-200 dark:border-slate-700"
						class:opacity-0={!statsVisible}
						class:translate-y-8={!statsVisible}
						style="transition-delay: 300ms"
					>
						<div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 group-hover:from-orange-500/10 group-hover:to-orange-600/20 transition-all duration-500"></div>
						<div class="relative">
							<div class="flex items-center justify-between mb-6">
								<div class="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg">
									<Activity class="w-6 h-6 text-white" />
								</div>
								<div class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
									Average
								</div>
							</div>
							<h3 class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">Bounce Rate</h3>
							<p class="text-4xl font-bold text-slate-900 dark:text-white mb-4">{analyticsStore.avgBounceRate}%</p>
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
									<TrendingDown class="w-4 h-4 text-red-600" />
									<span class="text-sm font-medium text-red-600">-3.2%</span>
								</div>
								<span class="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Enhanced Main Chart -->
				<div class="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-12 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-500" style="animation-delay: 400ms">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
						<div>
							<h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Traffic Overview</h2>
							<p class="text-slate-600 dark:text-slate-400">Monitor your website's performance trends</p>
						</div>
						<div class="flex items-center gap-6 text-sm">
							<div class="flex items-center gap-3">
								<div class="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"></div>
								<span class="font-medium text-slate-700 dark:text-slate-300">Page Views</span>
							</div>
							<div class="flex items-center gap-3">
								<div class="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm"></div>
								<span class="font-medium text-slate-700 dark:text-slate-300">Unique Visitors</span>
							</div>
						</div>
					</div>
					<div class="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
						<LineChart data={analyticsStore.chartData} height={350} />
					</div>
				</div>

				<!-- Enhanced Secondary Charts Grid -->
				<div class="grid gap-8 lg:grid-cols-2 mb-12">
					<!-- Traffic Sources -->
					<div class="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-left-2 duration-500" style="animation-delay: 500ms">
						<div class="flex items-center gap-3 mb-8">
							<div class="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
								<Globe class="w-5 h-5 text-white" />
							</div>
							<div>
								<h2 class="text-xl font-bold text-slate-900 dark:text-white">Traffic Sources</h2>
								<p class="text-sm text-slate-600 dark:text-slate-400">Where your visitors come from</p>
							</div>
						</div>
						<div class="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
							<DonutChart data={trafficDonutData} size={200} />
						</div>
					</div>

					<!-- Device Stats -->
					<div class="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-right-2 duration-500" style="animation-delay: 600ms">
						<div class="flex items-center gap-3 mb-8">
							<div class="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
								<div class="flex gap-1">
									<Monitor class="w-4 h-4 text-white" />
									<Smartphone class="w-4 h-4 text-white" />
									<Tablet class="w-4 h-4 text-white" />
								</div>
							</div>
							<div>
								<h2 class="text-xl font-bold text-slate-900 dark:text-white">Device Distribution</h2>
								<p class="text-sm text-slate-600 dark:text-slate-400">How users access your site</p>
							</div>
						</div>
						<div class="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
							<DonutChart data={deviceDonutData} size={200} />
						</div>
					</div>
				</div>

				<!-- Enhanced Page Performance -->
				<div class="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-12 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-500" style="animation-delay: 700ms">
					<div class="mb-8">
						<h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page Performance</h2>
						<p class="text-slate-600 dark:text-slate-400">Most visited pages on your website</p>
					</div>
					<div class="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
						<BarChart data={pageBarData} height={250} horizontal={true} />
					</div>
				</div>

				<!-- Enhanced User Activity Heatmap -->
				<div class="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-500" style="animation-delay: 800ms">
					<div class="mb-8">
						<h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">User Activity by Hour</h2>
						<p class="text-slate-600 dark:text-slate-400">Peak activity times throughout the day</p>
					</div>
					<div class="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
						<HeatMap data={heatMapData} height={120} />
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
		<div class="text-center bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-4">
			<div class="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl w-fit mx-auto mb-6">
				<BarChart3 class="w-8 h-8 text-white" />
			</div>
			<h2 class="mb-4 text-3xl font-bold text-slate-900 dark:text-white">Authentication Required</h2>
			<p class="mb-8 text-slate-600 dark:text-slate-400">Please sign in to access your analytics dashboard and view your performance metrics.</p>
			<button 
				class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
				onclick={() => goto('/auth/login')}
			>
				Sign In
			</button>
		</div>
	</div>
{/if}

<DeveloperDrawer />

<style>
	@keyframes animate-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-in {
		animation: animate-in 0.6s ease-out forwards;
	}

	/* Custom scrollbar for better aesthetics */
	:global(::-webkit-scrollbar) {
		width: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: linear-gradient(to bottom, #6366f1, #8b5cf6);
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: linear-gradient(to bottom, #4f46e5, #7c3aed);
	}
</style>