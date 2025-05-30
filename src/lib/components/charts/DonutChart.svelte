<script lang="ts">
	interface ChartData {
		name: string;
		value: number;
		percentage: number;
		color: string;
	}

	interface Props {
		data: ChartData[];
		size?: number;
		strokeWidth?: number;
	}

	let { data, size = 200, strokeWidth = 40 }: Props = $props();

	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	let animationProgress = $state(0);

	$effect(() => {
		const timer = setTimeout(() => {
			animationProgress = 1;
		}, 100);
		return () => clearTimeout(timer);
	});

	const segments = $derived(() => {
		let cumulativePercentage = 0;
		return data.map((item) => {
			const startAngle = (cumulativePercentage / 100) * circumference;
			const segmentLength = (item.percentage / 100) * circumference;
			cumulativePercentage += item.percentage;
			return {
				...item,
				dashArray: `${segmentLength * animationProgress} ${circumference}`,
				dashOffset: -startAngle,
				transform: `rotate(-90 ${size / 2} ${size / 2})`
			};
		});
	});

	let hoveredIndex = $state<number | null>(null);
</script>

<div class="relative inline-block">
	<svg
		width={size}
		height={size}
		class="transform transition-transform duration-300 hover:scale-105"
	>
		{#each segments() as segment, i (segment.name)}
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke={segment.color}
				stroke-width={strokeWidth}
				stroke-dasharray={segment.dashArray}
				stroke-dashoffset={segment.dashOffset}
				transform={segment.transform}
				class="cursor-pointer transition-all duration-1000 ease-out"
				opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.3}
				onmouseenter={() => (hoveredIndex = i)}
				onmouseleave={() => (hoveredIndex = null)}
				onfocus={() => (hoveredIndex = i)}
				onblur={() => (hoveredIndex = null)}
				tabindex="0"
				role="button"
				aria-label="{segment.name}: {segment.value} ({segment.percentage}%)"
			/>
		{/each}
	</svg>

	<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
		<div class="text-center">
			{#if hoveredIndex !== null}
				<div class="animate-in fade-in duration-200">
					<div class="text-2xl font-bold" style="color: {segments()[hoveredIndex].color}">
						{segments()[hoveredIndex].percentage}%
					</div>
					<div class="text-muted-foreground text-sm">
						{segments()[hoveredIndex].name}
					</div>
				</div>
			{:else}
				<div class="text-muted-foreground text-sm">Total</div>
				<div class="text-2xl font-bold">
					{data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
				</div>
			{/if}
		</div>
	</div>
</div>

<div class="mt-4 space-y-2">
	{#each data as item, i (item.name)}
		<button
			class="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left transition-all duration-200"
			onmouseenter={() => (hoveredIndex = i)}
			onmouseleave={() => (hoveredIndex = null)}
			aria-label="{item.name}: {item.value} ({item.percentage}%)"
		>
			<div class="flex items-center gap-2">
				<div
					class="h-3 w-3 rounded-full transition-transform duration-200"
					style="background-color: {item.color}"
					class:scale-125={hoveredIndex === i}
				></div>
				<span class="text-sm">{item.name}</span>
			</div>
			<div class="flex items-center gap-4">
				<span class="text-sm font-medium">{item.value.toLocaleString()}</span>
				<span class="text-muted-foreground text-sm">{item.percentage}%</span>
			</div>
		</button>
	{/each}
</div>
