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
	subtitle="Or <a href='/auth/signup' class='text-blue-600 hover:text-blue-500 dark:text-blue-400'>create a new account</a>"
>
	{#if success}
		<div
			class="mb-6 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
		>
			<p class="text-sm text-green-800 dark:text-green-200">{success}</p>
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
			<a
				href="/auth/signup"
				class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
			>
				Sign up here
			</a>
		</p>
	</div>
</AuthLayout>
