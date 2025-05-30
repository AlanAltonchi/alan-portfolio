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
	import {
		Users,
		Clock,
		TrendingUp,
		TrendingDown,
		Globe,
		Smartphone,
		Monitor,
		Tablet,
		Eye,
		Activity,
		BarChart3
	} from 'lucide-svelte';

	// let { data } = $props(); // Unused

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
		analyticsStore.trafficSources
			.filter((source) => source.visits !== null && source.percentage !== null)
			.map((source, i) => ({
				name: source.source_name,
				value: source.visits as number,
				percentage: Number(source.percentage),
				color: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][i]
			}))
	);

	const deviceDonutData = $derived(
		analyticsStore.deviceStats
			.filter((device) => device.count !== null && device.percentage !== null)
			.map((device, i) => ({
				name: device.device_type,
				value: device.count as number,
				percentage: Number(device.percentage),
				color: ['#3b82f6', '#10b981', '#f97316'][i]
			}))
	);

	const pageBarData = $derived(
		analyticsStore.pagePerformance
			.filter((page) => page.views !== null)
			.map((page) => ({
				label: page.page_path,
				value: page.views as number
			}))
	);

	const heatMapData = $derived(
		analyticsStore.userActivity
			.filter((activity) => activity.activity_count !== null)
			.map((activity) => ({
				hour: activity.hour_of_day || 0,
				value: activity.activity_count as number
			}))
	);

	// Stats cards animation
	let statsVisible = $state(false);
	onMount(() => {
		setTimeout(() => (statsVisible = true), 100);
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
				<div class="mb-4 inline-flex items-center gap-3">
					<div class="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-3 shadow-lg">
						<BarChart3 class="h-8 w-8 text-white" />
					</div>
					<h1
						class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-5xl font-bold text-transparent"
					>
						Analytics Dashboard
					</h1>
				</div>
				<p class="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
					Comprehensive insights and real-time performance metrics for your digital presence
				</p>
			</header>

			{#if analyticsStore.loading}
				<div class="flex items-center justify-center py-32">
					<div class="text-center">
						<div class="relative">
							<div
								class="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
							></div>
							<div
								class="absolute inset-0 mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"
								style="animation-direction: reverse; animation-duration: 1.5s;"
							></div>
						</div>
						<p class="text-lg text-slate-600 dark:text-slate-400">Loading analytics data...</p>
					</div>
				</div>
			{:else if analyticsStore.error}
				<div class="py-32 text-center">
					<div
						class="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20"
					>
						<p class="mb-6 text-lg text-red-600 dark:text-red-400">{analyticsStore.error}</p>
						<button
							class="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-xl"
							onclick={() => analyticsStore.loadAnalytics()}
						>
							Retry
						</button>
					</div>
				</div>
			{:else}
				<!-- Enhanced Stats Cards -->
				<div class="mb-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
					<!-- Total Page Views Card -->
					<div
						class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-500 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800"
						class:opacity-0={!statsVisible}
						class:translate-y-8={!statsVisible}
						style="transition-delay: 0ms"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 transition-all duration-500 group-hover:from-blue-500/10 group-hover:to-blue-600/20"
						></div>
						<div class="relative">
							<div class="mb-6 flex items-center justify-between">
								<div class="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-3 shadow-lg">
									<Eye class="h-6 w-6 text-white" />
								</div>
								<div
									class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400"
								>
									Last 30 days
								</div>
							</div>
							<h3
								class="mb-3 text-sm font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400"
							>
								Total Page Views
							</h3>
							<p class="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
								{analyticsStore.totalPageViews.toLocaleString()}
							</p>
							<div class="flex items-center gap-2">
								<div
									class="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 dark:bg-green-900/20"
								>
									<TrendingUp class="h-4 w-4 text-green-600" />
									<span class="text-sm font-medium text-green-600">+12.5%</span>
								</div>
								<span class="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
							</div>
						</div>
					</div>

					<!-- Unique Visitors Card -->
					<div
						class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-500 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800"
						class:opacity-0={!statsVisible}
						class:translate-y-8={!statsVisible}
						style="transition-delay: 100ms"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 transition-all duration-500 group-hover:from-green-500/10 group-hover:to-green-600/20"
						></div>
						<div class="relative">
							<div class="mb-6 flex items-center justify-between">
								<div class="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-3 shadow-lg">
									<Users class="h-6 w-6 text-white" />
								</div>
								<div
									class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400"
								>
									Last 30 days
								</div>
							</div>
							<h3
								class="mb-3 text-sm font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400"
							>
								Unique Visitors
							</h3>
							<p class="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
								{analyticsStore.totalUniqueVisitors.toLocaleString()}
							</p>
							<div class="flex items-center gap-2">
								<div
									class="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 dark:bg-green-900/20"
								>
									<TrendingUp class="h-4 w-4 text-green-600" />
									<span class="text-sm font-medium text-green-600">+8.3%</span>
								</div>
								<span class="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
							</div>
						</div>
					</div>

					<!-- Session Duration Card -->
					<div
						class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-500 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800"
						class:opacity-0={!statsVisible}
						class:translate-y-8={!statsVisible}
						style="transition-delay: 200ms"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 transition-all duration-500 group-hover:from-purple-500/10 group-hover:to-purple-600/20"
						></div>
						<div class="relative">
							<div class="mb-6 flex items-center justify-between">
								<div
									class="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 p-3 shadow-lg"
								>
									<Clock class="h-6 w-6 text-white" />
								</div>
								<div
									class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400"
								>
									Average
								</div>
							</div>
							<h3
								class="mb-3 text-sm font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400"
							>
								Session Duration
							</h3>
							<p class="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
								{Math.floor(analyticsStore.avgSessionDuration / 60)}:{(
									analyticsStore.avgSessionDuration % 60
								)
									.toString()
									.padStart(2, '0')}
							</p>
							<div class="flex items-center gap-2">
								<div
									class="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 dark:bg-green-900/20"
								>
									<TrendingUp class="h-4 w-4 text-green-600" />
									<span class="text-sm font-medium text-green-600">+5.7%</span>
								</div>
								<span class="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
							</div>
						</div>
					</div>

					<!-- Bounce Rate Card -->
					<div
						class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-500 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800"
						class:opacity-0={!statsVisible}
						class:translate-y-8={!statsVisible}
						style="transition-delay: 300ms"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 transition-all duration-500 group-hover:from-orange-500/10 group-hover:to-orange-600/20"
						></div>
						<div class="relative">
							<div class="mb-6 flex items-center justify-between">
								<div
									class="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-3 shadow-lg"
								>
									<Activity class="h-6 w-6 text-white" />
								</div>
								<div
									class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400"
								>
									Average
								</div>
							</div>
							<h3
								class="mb-3 text-sm font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400"
							>
								Bounce Rate
							</h3>
							<p class="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
								{analyticsStore.avgBounceRate}%
							</p>
							<div class="flex items-center gap-2">
								<div
									class="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 dark:bg-red-900/20"
								>
									<TrendingDown class="h-4 w-4 text-red-600" />
									<span class="text-sm font-medium text-red-600">-3.2%</span>
								</div>
								<span class="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Enhanced Main Chart -->
				<div
					class="animate-in fade-in slide-in-from-bottom-2 mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl duration-500 dark:border-slate-700 dark:bg-slate-800"
					style="animation-delay: 400ms"
				>
					<div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div>
							<h2 class="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
								Traffic Overview
							</h2>
							<p class="text-slate-600 dark:text-slate-400">
								Monitor your website's performance trends
							</p>
						</div>
						<div class="flex items-center gap-6 text-sm">
							<div class="flex items-center gap-3">
								<div
									class="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"
								></div>
								<span class="font-medium text-slate-700 dark:text-slate-300">Page Views</span>
							</div>
							<div class="flex items-center gap-3">
								<div
									class="h-4 w-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm"
								></div>
								<span class="font-medium text-slate-700 dark:text-slate-300">Unique Visitors</span>
							</div>
						</div>
					</div>
					<div class="rounded-2xl bg-slate-50 p-6 dark:bg-slate-700/50">
						<LineChart data={analyticsStore.chartData} height={350} />
					</div>
				</div>

				<!-- Enhanced Secondary Charts Grid -->
				<div class="mb-12 grid gap-8 lg:grid-cols-2">
					<!-- Traffic Sources -->
					<div
						class="animate-in fade-in slide-in-from-left-2 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl duration-500 dark:border-slate-700 dark:bg-slate-800"
						style="animation-delay: 500ms"
					>
						<div class="mb-8 flex items-center gap-3">
							<div class="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-2">
								<Globe class="h-5 w-5 text-white" />
							</div>
							<div>
								<h2 class="text-xl font-bold text-slate-900 dark:text-white">Traffic Sources</h2>
								<p class="text-sm text-slate-600 dark:text-slate-400">
									Where your visitors come from
								</p>
							</div>
						</div>
						<div class="rounded-2xl bg-slate-50 p-6 dark:bg-slate-700/50">
							<DonutChart data={trafficDonutData} size={200} />
						</div>
					</div>

					<!-- Device Stats -->
					<div
						class="animate-in fade-in slide-in-from-right-2 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl duration-500 dark:border-slate-700 dark:bg-slate-800"
						style="animation-delay: 600ms"
					>
						<div class="mb-8 flex items-center gap-3">
							<div class="rounded-xl bg-gradient-to-r from-green-500 to-blue-600 p-2">
								<div class="flex gap-1">
									<Monitor class="h-4 w-4 text-white" />
									<Smartphone class="h-4 w-4 text-white" />
									<Tablet class="h-4 w-4 text-white" />
								</div>
							</div>
							<div>
								<h2 class="text-xl font-bold text-slate-900 dark:text-white">
									Device Distribution
								</h2>
								<p class="text-sm text-slate-600 dark:text-slate-400">How users access your site</p>
							</div>
						</div>
						<div class="rounded-2xl bg-slate-50 p-6 dark:bg-slate-700/50">
							<DonutChart data={deviceDonutData} size={200} />
						</div>
					</div>
				</div>

				<!-- Enhanced Page Performance -->
				<div
					class="animate-in fade-in slide-in-from-bottom-2 mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl duration-500 dark:border-slate-700 dark:bg-slate-800"
					style="animation-delay: 700ms"
				>
					<div class="mb-8">
						<h2 class="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Page Performance</h2>
						<p class="text-slate-600 dark:text-slate-400">Most visited pages on your website</p>
					</div>
					<div class="rounded-2xl bg-slate-50 p-6 dark:bg-slate-700/50">
						<BarChart data={pageBarData} height={250} horizontal={true} />
					</div>
				</div>

				<!-- Enhanced User Activity Heatmap -->
				<div
					class="animate-in fade-in slide-in-from-bottom-2 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl duration-500 dark:border-slate-700 dark:bg-slate-800"
					style="animation-delay: 800ms"
				>
					<div class="mb-8">
						<h2 class="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
							User Activity by Hour
						</h2>
						<p class="text-slate-600 dark:text-slate-400">Peak activity times throughout the day</p>
					</div>
					<div class="rounded-2xl bg-slate-50 p-6 dark:bg-slate-700/50">
						<HeatMap data={heatMapData} height={120} />
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
	>
		<div
			class="mx-4 max-w-md rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-800"
		>
			<div class="mx-auto mb-6 w-fit rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-4">
				<BarChart3 class="h-8 w-8 text-white" />
			</div>
			<h2 class="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
				Authentication Required
			</h2>
			<p class="mb-8 text-slate-600 dark:text-slate-400">
				Please sign in to access your analytics dashboard and view your performance metrics.
			</p>
			<button
				class="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
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
