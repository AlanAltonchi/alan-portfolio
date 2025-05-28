<script lang="ts">
	let { onclick }: { onclick: () => void } = $props();
</script>

<button
	class="fixed right-4 bottom-4 z-50 cursor-pointer rounded-full bg-blue-600 p-3 text-white shadow-lg transition-colors hover:bg-blue-700"
	{onclick}
	aria-label="Toggle Developer Mode"
	title="Developer Mode"
>
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
		/>
	</svg>
</button> 