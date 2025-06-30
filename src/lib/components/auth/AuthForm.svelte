<script lang="ts">
	import { Button, Input } from '$lib/components';

	let {
		name = $bindable(''),
		email = $bindable(''),
		password = $bindable(''),
		confirmPassword = $bindable(''),
		loading = false,
		error = '',
		showName = false,
		showConfirmPassword = false,
		submitText = 'Submit',
		loadingText = 'Loading...',
		onSubmit
	} = $props<{
		name?: string;
		email: string;
		password: string;
		confirmPassword?: string;
		loading?: boolean;
		error?: string;
		showName?: boolean;
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
		if (showName && name === undefined) {
			name = '';
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<form onsubmit={handleSubmit} class="space-y-6">
	{#if showName}
		<Input
			label="Full Name"
			type="text"
			bind:value={name}
			placeholder="Enter your full name"
			required
		/>
	{/if}

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
		helperText={showConfirmPassword ? 'Must be at least 6 characters' : undefined}
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
		<div class="text-sm text-red-600 dark:text-red-400">{error}</div>
	{/if}

	<Button
		type="submit"
		variant="primary"
		class="w-full"
		{loading}
		disabled={loading ||
			!email ||
			!password ||
			(showConfirmPassword && !confirmPassword) ||
			(showName && !name)}
	>
		{loading ? loadingText : submitText}
	</Button>
</form>
