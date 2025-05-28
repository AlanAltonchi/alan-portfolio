<script lang="ts">
	import { AuthService } from '$lib/auth';
	import { AuthForm, AuthLayout } from '$lib/components';
	import { supabase } from '$lib/db.svelte.js';


	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	const authService = new AuthService(supabase);

	async function handleLogin() {
		try {
			loading = true;
			error = '';
			success = '';

			const result = await authService.signIn({ email, password });

			if (!result.success) {
				error = result.error || 'Login failed';
				return;
			}

			if (result.user && result.session) {
				success = 'Successfully signed in! Redirecting...';
				await authService.handleAuthSuccess(result.user, result.session);
			}
		} catch (err) {
			error = 'An unexpected error occurred';
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<AuthLayout 
	title="Sign in to your account"
	subtitle='Or <a href="/auth/signup" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">create a new account</a>'
>
	{#snippet children()}
		{#if success}
			<div class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
				<p class="text-green-800 dark:text-green-200 text-sm">{success}</p>
			</div>
		{:else}
			<AuthForm
				bind:email
				bind:password
				{loading}
				{error}
				submitText="Sign in"
				loadingText="Signing in..."
				onSubmit={handleLogin}
			/>
		{/if}

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Don't have an account?
				<a href="/auth/signup" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">
					Sign up here
				</a>
			</p>
		</div>
	{/snippet}
</AuthLayout> 