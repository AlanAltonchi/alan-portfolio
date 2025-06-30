<script lang="ts">
	interface HeatMapData {
		hour: number;
		value: number;
	}

	interface Props {
		data: HeatMapData[];
		height?: number;
	}

	let { data, height = 100 }: Props = $props();

	const maxValue = $derived(Math.max(...data.map((d) => d.value), 1));

	const getColor = (value: number) => {
		const intensity = value / maxValue;
		const hue = 240 - intensity * 60; // Blue to green gradient
		const lightness = 95 - intensity * 45;
		return `hsl(${hue}, 70%, ${lightness}%)`;
	};

	const hours = Array.from({ length: 24 }, (_, i) => i);
	let hoveredHour = $state<number | null>(null);
	let animationProgress = $state(0);

	$effect(() => {
		// Reset animation progress when data changes
		animationProgress = 0;
		const timer = setTimeout(() => {
			animationProgress = 1;
		}, 100);
		return () => {
			clearTimeout(timer);
		};
	});

	const formatHour = (hour: number) => {
		if (hour === 0) return '12AM';
		if (hour === 12) return '12PM';
		return hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
	};
</script>

<div class="w-full" style="height: {height}px">
	<div class="flex h-full items-center gap-1">
		{#each hours as hour, i (hour)}
			{@const dataPoint = data.find((d) => d.hour === hour)}
			{@const value = dataPoint?.value || 0}
			<div
				class="group flex h-full flex-1 flex-col items-center gap-1"
				onmouseenter={() => (hoveredHour = hour)}
				onmouseleave={() => (hoveredHour = null)}
				role="button"
				tabindex="0"
			>
				<div class="relative w-full flex-1">
					<div
						class="h-full w-full cursor-pointer rounded transition-all duration-300"
						style="
							background-color: {getColor(value)};
							transform: scaleY({animationProgress});
							transform-origin: bottom;
							transition-delay: {i * 20}ms;
						"
						class:scale-110={hoveredHour === hour}
					>
						{#if hoveredHour === hour && value > 0}
							<div
								class="animate-in fade-in slide-in-from-bottom-1 absolute -top-12 left-1/2 -translate-x-1/2 rounded bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white duration-200"
							>
								{value.toLocaleString()} activities
							</div>
						{/if}
					</div>
				</div>
				{#if hour % 3 === 0}
					<div class="text-muted-foreground group-hover:text-foreground text-xs transition-colors">
						{formatHour(hour)}
					</div>
				{:else}
					<div class="h-3"></div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
		<span>Less</span>
		<div class="flex gap-1">
			{#each [0.2, 0.4, 0.6, 0.8, 1] as intensity (intensity)}
				<div
					class="h-3 w-3 rounded"
					style="background-color: {getColor(maxValue * intensity)}"
				></div>
			{/each}
		</div>
		<span>More</span>
	</div>
</div>
