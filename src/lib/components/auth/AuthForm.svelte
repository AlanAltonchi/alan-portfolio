<script lang="ts">
	import { Button, Input } from '$lib/components';

	let {
		email = $bindable(''),
		password = $bindable(''),
		confirmPassword = $bindable(''),
		loading = false,
		error = '',
		showConfirmPassword = false,
		submitText = 'Submit',
		loadingText = 'Loading...',
		onSubmit
	} = $props<{
		email: string;
		password: string;
		confirmPassword?: string;
		loading?: boolean;
		error?: string;
		showConfirmPassword?: boolean;
		submitText?: string;
		loadingText?: string;
		onSubmit: () => void;
	}>();

	function handleSubmit(event: Event) {
		event.preventDefault();
		onSubmit();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			onSubmit();
		}
	}

	$effect(() => {
		if (showConfirmPassword && confirmPassword === undefined) {
			confirmPassword = '';
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<form onsubmit={handleSubmit} class="space-y-6">
	<Input
		label="Email address"
		type="email"
		bind:value={email}
		placeholder="Enter your email"
		required
	/>

	<Input
		label="Password"
		type="password"
		bind:value={password}
		placeholder="Enter your password"
		helperText={showConfirmPassword ? "Must be at least 6 characters" : undefined}
		required
	/>

	{#if showConfirmPassword}
		<Input
			label="Confirm Password"
			type="password"
			bind:value={confirmPassword}
			placeholder="Confirm your password"
			required
		/>
	{/if}

	{#if error}
		<div class="text-red-600 dark:text-red-400 text-sm">{error}</div>
	{/if}

	<Button
		type="submit"
		variant="primary"
		class="w-full"
		{loading}
		disabled={loading || !email || !password || (showConfirmPassword && !confirmPassword)}
	>
		{loading ? loadingText : submitText}
	</Button>
</form> 