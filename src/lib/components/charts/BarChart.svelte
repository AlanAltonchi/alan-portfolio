<script lang="ts">
	interface ChartData {
		label: string;
		value: number;
		color?: string;
	}

	interface Props {
		data: ChartData[];
		height?: number;
		horizontal?: boolean;
		animated?: boolean;
	}

	let { data, height = 300, horizontal = false, animated = true }: Props = $props();

	const maxValue = $derived(Math.max(...data.map((d) => d.value), 1));
	let animationProgress = $state(animated ? 0 : 1);

	$effect(() => {
		if (animated) {
			// Reset animation progress when data changes
			animationProgress = 0;
			const timer = setTimeout(() => {
				animationProgress = 1;
			}, 100);
			return () => {
				clearTimeout(timer);
			};
		}
	});

	const getBarStyle = (value: number, index: number) => {
		const percentage = (value / maxValue) * 100 * animationProgress;
		const delay = index * 50;

		if (horizontal) {
			return `width: ${percentage}%; transition: width 0.8s ease-out ${delay}ms`;
		} else {
			return `height: ${percentage}%; transition: height 0.8s ease-out ${delay}ms`;
		}
	};

	let hoveredIndex = $state<number | null>(null);
</script>

<div class="w-full" style="height: {height}px">
	{#if horizontal}
		<div class="flex h-full flex-col justify-between gap-2">
			{#each data as item, i (item.label || i)}
				<button
					class="group flex w-full items-center gap-3 text-left"
					onmouseenter={() => (hoveredIndex = i)}
					onmouseleave={() => (hoveredIndex = null)}
					aria-label="{item.label}: {item.value}"
				>
					<div
						class="text-muted-foreground group-hover:text-foreground w-24 text-right text-sm transition-colors"
					>
						{item.label}
					</div>
					<div class="bg-muted/20 relative h-8 flex-1 overflow-hidden rounded-md">
						<div
							class="h-full rounded-md transition-all duration-200"
							style="background-color: {item.color || 'rgb(99, 102, 241)'}; {getBarStyle(
								item.value,
								i
							)}"
						>
							<div class="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
						</div>
						{#if hoveredIndex === i}
							<div
								class="animate-in fade-in absolute top-1/2 right-2 -translate-y-1/2 text-sm font-medium duration-200"
							>
								{item.value.toLocaleString()}
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<div class="flex h-full items-end justify-between gap-2">
			{#each data as item, i (item.label || i)}
				<button
					class="group flex flex-1 flex-col items-center gap-2"
					onmouseenter={() => (hoveredIndex = i)}
					onmouseleave={() => (hoveredIndex = null)}
					aria-label="{item.label}: {item.value}"
				>
					<div class="relative flex w-full flex-1 items-end">
						<div
							class="relative w-full rounded-t-md transition-all duration-200"
							style="background-color: {item.color || 'rgb(99, 102, 241)'}; {getBarStyle(
								item.value,
								i
							)}"
						>
							<div class="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"></div>
							{#if hoveredIndex === i}
								<div
									class="animate-in fade-in slide-in-from-bottom-1 absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-medium whitespace-nowrap duration-200"
								>
									{item.value.toLocaleString()}
								</div>
							{/if}
						</div>
					</div>
					<div
						class="text-muted-foreground group-hover:text-foreground text-center text-xs whitespace-nowrap transition-colors"
					>
						{item.label}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
