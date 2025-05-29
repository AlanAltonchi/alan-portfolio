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
		return data.map(item => {
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
	<svg width={size} height={size} class="transform transition-transform duration-300 hover:scale-105">
		{#each segments() as segment, i}
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
				class="transition-all duration-1000 ease-out cursor-pointer"
				opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.3}
				onmouseenter={() => hoveredIndex = i}
				onmouseleave={() => hoveredIndex = null}
			/>
		{/each}
	</svg>
	
	<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
		<div class="text-center">
			{#if hoveredIndex !== null}
				<div class="animate-in fade-in duration-200">
					<div class="text-2xl font-bold" style="color: {segments()[hoveredIndex].color}">
						{segments()[hoveredIndex].percentage}%
					</div>
					<div class="text-sm text-muted-foreground">
						{segments()[hoveredIndex].name}
					</div>
				</div>
			{:else}
				<div class="text-sm text-muted-foreground">Total</div>
				<div class="text-2xl font-bold">
					{data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
				</div>
			{/if}
		</div>
	</div>
</div>

<div class="mt-4 space-y-2">
	{#each data as item, i}
		<div
			class="flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-muted/50"
			onmouseenter={() => hoveredIndex = i}
			onmouseleave={() => hoveredIndex = null}
		>
			<div class="flex items-center gap-2">
				<div
					class="w-3 h-3 rounded-full transition-transform duration-200"
					style="background-color: {item.color}"
					class:scale-125={hoveredIndex === i}
				/>
				<span class="text-sm">{item.name}</span>
			</div>
			<div class="flex items-center gap-4">
				<span class="text-sm font-medium">{item.value.toLocaleString()}</span>
				<span class="text-sm text-muted-foreground">{item.percentage}%</span>
			</div>
		</div>
	{/each}
</div>