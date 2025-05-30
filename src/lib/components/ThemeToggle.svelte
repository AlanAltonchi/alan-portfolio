<script lang="ts">
	import { themeState } from '$lib/stores/theme.svelte';
	import Button from './Button.svelte';

	interface Props {
		variant?: 'button' | 'dropdown';
		size?: 'sm' | 'md' | 'lg';
	}

	let { variant = 'button', size = 'md' }: Props = $props();

	let showDropdown = $state(false);

	const themes = [
		{ value: 'light', label: 'Light', icon: '☀️' },
		{ value: 'dark', label: 'Dark', icon: '🌙' },
		{ value: 'auto', label: 'Auto', icon: '💻' }
	] as const;

	function getCurrentThemeIcon(currentTheme: string) {
		return themes.find((t) => t.value === currentTheme)?.icon || '💻';
	}

	function handleThemeSelect(newTheme: 'light' | 'dark' | 'auto') {
		themeState.set(newTheme);
		showDropdown = false;
	}
</script>

{#if variant === 'button'}
	<Button
		variant="ghost"
		{size}
		onclick={() => themeState.toggle()}
		class="relative"
		aria-label="Toggle theme"
	>
		<span class="text-lg">{getCurrentThemeIcon(themeState.current)}</span>
	</Button>
{:else}
	<div class="relative">
		<Button
			variant="ghost"
			{size}
			onclick={() => (showDropdown = !showDropdown)}
			class="relative"
			aria-label="Select theme"
		>
			<span class="text-lg">{getCurrentThemeIcon(themeState.current)}</span>
			<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</Button>

		{#if showDropdown}
			<div
				class="absolute top-full right-0 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
			>
				{#each themes as themeOption (themeOption.value)}
					<button
						class="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 {themeState.current ===
						themeOption.value
							? 'bg-gray-100 dark:bg-gray-700'
							: ''}"
						onclick={() => handleThemeSelect(themeOption.value)}
					>
						<span class="mr-2">{themeOption.icon}</span>
						<span class="text-gray-900 dark:text-white">{themeOption.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Close dropdown when clicking outside -->
<svelte:window
	onclick={(e) => {
		if (showDropdown && e.target instanceof Element && !e.target.closest('.relative')) {
			showDropdown = false;
		}
	}}
/>
