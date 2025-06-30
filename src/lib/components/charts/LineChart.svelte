<script lang="ts">
	interface ChartData {
		date: string;
		pageViews: number;
		uniqueVisitors: number;
		label?: string;
	}

	interface Props {
		data: ChartData[];
		height?: number;
	}

	let { data, height = 300 }: Props = $props();

	const padding = { top: 30, right: 30, bottom: 50, left: 70 };
	let width = $state(800);
	let svgElement = $state<SVGElement | null>(null);

	$effect(() => {
		if (svgElement && svgElement.parentElement) {
			const parent = svgElement.parentElement;
			const resizeObserver = new ResizeObserver((entries) => {
				width = entries[0].contentRect.width;
			});
			resizeObserver.observe(parent);
			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	const chartWidth = $derived(width - padding.left - padding.right);
	const chartHeight = $derived(height - padding.top - padding.bottom);

	// Handle empty data
	const hasData = $derived(data && data.length > 0);

	const maxPageViews = $derived(hasData ? Math.max(...data.map((d) => d.pageViews)) : 0);
	const maxVisitors = $derived(hasData ? Math.max(...data.map((d) => d.uniqueVisitors)) : 0);
	const maxValue = $derived(Math.max(maxPageViews, maxVisitors, 1)); // Ensure minimum of 1 to avoid division by zero

	// Fix division by zero for single data point
	const xScale = $derived((index: number) => {
		if (data.length <= 1) return chartWidth / 2;
		return (index / (data.length - 1)) * chartWidth;
	});

	const yScale = $derived((value: number) => chartHeight - (value / maxValue) * chartHeight);

	const pageViewsPath = $derived(() => {
		if (!hasData) return '';
		const points = data.map((d, i) => `${xScale(i)},${yScale(d.pageViews)}`);
		return `M${points.join(' L')}`;
	});

	const visitorsPath = $derived(() => {
		if (!hasData) return '';
		const points = data.map((d, i) => `${xScale(i)},${yScale(d.uniqueVisitors)}`);
		return `M${points.join(' L')}`;
	});

	// Create gradient paths for area fills
	const pageViewsAreaPath = $derived(() => {
		if (!hasData) return '';
		const points = data.map((d, i) => `${xScale(i)},${yScale(d.pageViews)}`);
		const firstPoint = `${xScale(0)},${chartHeight}`;
		const lastPoint = `${xScale(data.length - 1)},${chartHeight}`;
		return `M${firstPoint} L${points.join(' L')} L${lastPoint} Z`;
	});

	const visitorsAreaPath = $derived(() => {
		if (!hasData) return '';
		const points = data.map((d, i) => `${xScale(i)},${yScale(d.uniqueVisitors)}`);
		const firstPoint = `${xScale(0)},${chartHeight}`;
		const lastPoint = `${xScale(data.length - 1)},${chartHeight}`;
		return `M${firstPoint} L${points.join(' L')} L${lastPoint} Z`;
	});

	// Calculate path length for proper animation
	const pathLength = $derived(
		(() => {
			if (!hasData || data.length <= 1) return 0;
			let length = 0;
			for (let i = 1; i < data.length; i++) {
				const dx = xScale(i) - xScale(i - 1);
				const dy1 = yScale(data[i].pageViews) - yScale(data[i - 1].pageViews);
				const dy2 = yScale(data[i].uniqueVisitors) - yScale(data[i - 1].uniqueVisitors);
				length += Math.max(Math.sqrt(dx * dx + dy1 * dy1), Math.sqrt(dx * dx + dy2 * dy2));
			}
			return Math.ceil(length);
		})()
	);

	const yTicks = $derived(() => {
		const ticks = [];
		const step = maxValue / 5; // More granular ticks
		for (let i = 0; i <= 5; i++) {
			ticks.push(Math.round(step * i));
		}
		return ticks;
	});

	// Format numbers with K/M suffixes
	const formatNumber = (num: number) => {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	};

	// Format date for better readability
	const formatDate = (dateStr: string) => {
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		} catch {
			return dateStr;
		}
	};

	let hoveredIndex = $state<number | null>(null);

	// Calculate tooltip position to prevent overflow
	const getTooltipPosition = (index: number) => {
		const x = xScale(index);
		const tooltipWidth = 140;
		const tooltipHeight = 70;

		let tooltipX = x;
		let tooltipY = Math.min(yScale(data[index].pageViews), yScale(data[index].uniqueVisitors)) - 15;

		// Adjust horizontal position if tooltip would overflow
		if (x + tooltipWidth / 2 > chartWidth) {
			tooltipX = chartWidth - tooltipWidth / 2;
		} else if (x - tooltipWidth / 2 < 0) {
			tooltipX = tooltipWidth / 2;
		}

		// Adjust vertical position if tooltip would overflow
		if (tooltipY - tooltipHeight < 0) {
			tooltipY =
				Math.max(yScale(data[index].pageViews), yScale(data[index].uniqueVisitors)) +
				tooltipHeight +
				15;
		}

		return { x: tooltipX, y: tooltipY };
	};
</script>

<div
	class="w-full rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg dark:border-slate-700 dark:from-slate-900 dark:to-slate-800"
	style="height: {height}px"
>
	{#if !hasData}
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700"
				>
					<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						></path>
					</svg>
				</div>
				<p class="font-medium text-slate-500 dark:text-slate-400">No data available</p>
				<p class="mt-1 text-sm text-slate-400 dark:text-slate-500">
					Chart will appear when data is loaded
				</p>
			</div>
		</div>
	{:else}
		<svg bind:this={svgElement} class="h-full w-full">
			<defs>
				<!-- Gradients for area fills -->
				<linearGradient id="pageViewsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" style="stop-color:rgb(99, 102, 241);stop-opacity:0.3" />
					<stop offset="100%" style="stop-color:rgb(99, 102, 241);stop-opacity:0.05" />
				</linearGradient>
				<linearGradient id="visitorsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" style="stop-color:rgb(34, 197, 94);stop-opacity:0.3" />
					<stop offset="100%" style="stop-color:rgb(34, 197, 94);stop-opacity:0.05" />
				</linearGradient>

				<!-- Drop shadow filter -->
				<filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
					<feDropShadow
						dx="0"
						dy="2"
						stdDeviation="3"
						flood-color="rgb(0,0,0)"
						flood-opacity="0.1"
					/>
				</filter>
			</defs>

			<g transform="translate({padding.left}, {padding.top})">
				<!-- Grid lines -->
				{#each yTicks() as tick, i (tick)}
					<line
						x1="0"
						y1={yScale(tick)}
						x2={chartWidth}
						y2={yScale(tick)}
						stroke="currentColor"
						stroke-opacity={i === 0 ? '0.2' : '0.08'}
						stroke-width={i === 0 ? '1' : '1'}
						stroke-dasharray={i === 0 ? 'none' : '2,4'}
						class="transition-all duration-300"
					/>
					<text
						x="-15"
						y={yScale(tick) + 4}
						text-anchor="end"
						fill="currentColor"
						opacity="0.6"
						font-size="11"
						font-weight="500"
						class="font-mono"
					>
						{formatNumber(tick)}
					</text>
				{/each}

				<!-- X-axis labels -->
				{#each data as d, i (d.label || i)}
					{#if data.length <= 8 || i % Math.ceil(data.length / 8) === 0}
						<text
							x={xScale(i)}
							y={chartHeight + 30}
							text-anchor="middle"
							fill="currentColor"
							opacity="0.6"
							font-size="11"
							font-weight="500"
							class="font-mono"
						>
							{formatDate(d.date)}
						</text>
					{/if}
				{/each}

				<!-- Area fills -->
				<g class="chart-areas">
					<path
						d={visitorsAreaPath()}
						fill="url(#visitorsGradient)"
						class="transition-all duration-1000"
						style="animation: fadeIn 1.5s ease-out 0.8s both"
					/>
					<path
						d={pageViewsAreaPath()}
						fill="url(#pageViewsGradient)"
						class="transition-all duration-1000"
						style="animation: fadeIn 1.5s ease-out 1s both"
					/>
				</g>

				<!-- Chart lines -->
				<g class="chart-lines" filter="url(#dropshadow)">
					<path
						d={visitorsPath()}
						fill="none"
						stroke="rgb(34, 197, 94)"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="transition-all duration-1000"
						stroke-dasharray={pathLength}
						stroke-dashoffset={pathLength}
						style="animation: draw 2.5s ease-out 0.3s forwards"
					/>
					<path
						d={pageViewsPath()}
						fill="none"
						stroke="rgb(99, 102, 241)"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="transition-all duration-1000"
						stroke-dasharray={pathLength}
						stroke-dashoffset={pathLength}
						style="animation: draw 2.5s ease-out forwards"
					/>
				</g>

				<!-- Data points -->
				<g class="data-points">
					{#each data as d, i (d.label || i)}
						<circle
							cx={xScale(i)}
							cy={yScale(d.pageViews)}
							r="4"
							fill="rgb(99, 102, 241)"
							stroke="white"
							stroke-width="2"
							class="hover:r-6 transition-all duration-300"
							style="animation: popIn 0.6s ease-out {0.5 + i * 0.1}s both"
							filter="url(#dropshadow)"
						/>
						<circle
							cx={xScale(i)}
							cy={yScale(d.uniqueVisitors)}
							r="4"
							fill="rgb(34, 197, 94)"
							stroke="white"
							stroke-width="2"
							class="hover:r-6 transition-all duration-300"
							style="animation: popIn 0.6s ease-out {0.7 + i * 0.1}s both"
							filter="url(#dropshadow)"
						/>
					{/each}
				</g>

				<!-- Interactive overlay -->
				<g class="pointer-events-auto" role="group" aria-label="Interactive chart overlay">
					{#each data as d, i (d.label || i)}
						<g
							onmouseenter={() => (hoveredIndex = i)}
							onmouseleave={() => (hoveredIndex = null)}
							onfocus={() => (hoveredIndex = i)}
							onblur={() => (hoveredIndex = null)}
							tabindex="0"
							role="button"
							aria-label="Data point for {formatDate(
								d.date
							)}: {d.pageViews} views, {d.uniqueVisitors} visitors"
							class="cursor-pointer"
						>
							<rect
								x={data.length === 1 ? 0 : i === 0 ? 0 : xScale(i) - chartWidth / data.length / 2}
								y="0"
								width={data.length === 1 ? chartWidth : chartWidth / data.length}
								height={chartHeight}
								fill="transparent"
							/>
							{#if hoveredIndex === i}
								{@const tooltipPos = getTooltipPosition(i)}
								<g class="animate-in fade-in duration-200">
									<line
										x1={xScale(i)}
										y1="0"
										x2={xScale(i)}
										y2={chartHeight}
										stroke="currentColor"
										stroke-opacity="0.3"
										stroke-width="2"
										stroke-dasharray="4,4"
									/>
									<circle
										cx={xScale(i)}
										cy={yScale(d.pageViews)}
										r="6"
										fill="rgb(99, 102, 241)"
										stroke="white"
										stroke-width="3"
										class="animate-in zoom-in duration-200"
										filter="url(#dropshadow)"
									/>
									<circle
										cx={xScale(i)}
										cy={yScale(d.uniqueVisitors)}
										r="6"
										fill="rgb(34, 197, 94)"
										stroke="white"
										stroke-width="3"
										class="animate-in zoom-in duration-200"
										filter="url(#dropshadow)"
									/>
									<g transform="translate({tooltipPos.x}, {tooltipPos.y})">
										<rect
											x="-70"
											y="-65"
											width="140"
											height="60"
											rx="8"
											fill="rgba(0, 0, 0, 0.9)"
											stroke="rgba(255, 255, 255, 0.1)"
											stroke-width="1"
											filter="url(#dropshadow)"
										/>
										<text
											x="0"
											y="-40"
											text-anchor="middle"
											fill="white"
											font-size="12"
											font-weight="600"
										>
											{formatDate(d.date)}
										</text>
										<text
											x="0"
											y="-22"
											text-anchor="middle"
											fill="rgb(129, 140, 248)"
											font-size="11"
											font-weight="500"
										>
											Views: {d.pageViews.toLocaleString()}
										</text>
										<text
											x="0"
											y="-8"
											text-anchor="middle"
											fill="rgb(74, 222, 128)"
											font-size="11"
											font-weight="500"
										>
											Visitors: {d.uniqueVisitors.toLocaleString()}
										</text>
									</g>
								</g>
							{/if}
						</g>
					{/each}
				</g>
			</g>
		</svg>
	{/if}
</div>

<style>
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes popIn {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		80% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
