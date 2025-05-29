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

	const maxValue = $derived(Math.max(...data.map(d => d.value), 1));
	let animationProgress = $state(animated ? 0 : 1);

	$effect(() => {
		if (animated) {
			const timer = setTimeout(() => {
				animationProgress = 1;
			}, 100);
			return () => clearTimeout(timer);
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
		<div class="h-full flex flex-col justify-between gap-2">
			{#each data as item, i}
				<div
					class="flex items-center gap-3 group"
					onmouseenter={() => hoveredIndex = i}
					onmouseleave={() => hoveredIndex = null}
				>
					<div class="w-24 text-sm text-right text-muted-foreground group-hover:text-foreground transition-colors">
						{item.label}
					</div>
					<div class="flex-1 h-8 bg-muted/20 rounded-md overflow-hidden relative">
						<div
							class="h-full rounded-md transition-all duration-200"
							style="background-color: {item.color || 'rgb(99, 102, 241)'}; {getBarStyle(item.value, i)}"
						>
							<div class="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
						</div>
						{#if hoveredIndex === i}
							<div class="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium animate-in fade-in duration-200">
								{item.value.toLocaleString()}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="h-full flex items-end justify-between gap-2">
			{#each data as item, i}
				<div
					class="flex-1 flex flex-col items-center gap-2 group"
					onmouseenter={() => hoveredIndex = i}
					onmouseleave={() => hoveredIndex = null}
				>
					<div class="flex-1 w-full flex items-end relative">
						<div
							class="w-full rounded-t-md transition-all duration-200 relative"
							style="background-color: {item.color || 'rgb(99, 102, 241)'}; {getBarStyle(item.value, i)}"
						>
							<div class="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
							{#if hoveredIndex === i}
								<div class="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-200">
									{item.value.toLocaleString()}
								</div>
							{/if}
						</div>
					</div>
					<div class="text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
						{item.label}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>