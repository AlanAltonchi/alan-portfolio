<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components';
	import { AuthLayout, AuthForm, DemoUserCard } from '$lib/components';
	import { AuthService } from '$lib/auth';
	import { supabase } from '$lib/db.svelte.js';

	let { form } = $props();

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let demoLoading = $state(false);
	let error = $state('');
	let success = $state('');

	const authService = new AuthService(supabase);

	// Handle form action result for demo user
	$effect(() => {
		if (form?.error) {
			error = form.error;
			demoLoading = false;
		} else if (form?.success && form?.user) {
			handleDemoSignInSuccess(form.user.email ?? '');
		}
	});

	async function handleDemoSignInSuccess(email: string) {
		try {
			const result = await authService.signInDemoUser(email);

			if (!result.success) {
				error = result.error || 'Demo sign-in failed';
				demoLoading = false;
				return;
			}

			if (result.user && result.session) {
				const userName = result.user.user_metadata?.name || 'Demo User';
				success = `Demo account ready! Welcome ${userName}! Redirecting to dashboard...`;
				await authService.handleAuthSuccess(result.user, result.session, '/dashboard');
			}
		} catch (err) {
			error = 'Failed to sign in to demo account. Please try again.';
			console.error('Demo signin error:', err);
		} finally {
			demoLoading = false;
		}
	}

	async function handleSignup() {
		try {
			loading = true;
			error = '';
			success = '';

			const result = await authService.signUp({
				email,
				password,
				confirmPassword
			});

			if (!result.success) {
				error = result.error || 'Signup failed';
				return;
			}

			if (result.user && !result.user.email_confirmed_at) {
				success = 'Please check your email for a confirmation link before signing in.';
			} else if (result.user && result.session) {
				success = 'Account created successfully! Redirecting...';
				await authService.handleAuthSuccess(result.user, result.session);
			}
		} catch (err) {
			error = 'An unexpected error occurred';
			console.error('Signup error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<AuthLayout
	title="Create your account"
	subtitle="Or <a href='/auth/login' class='text-blue-600 hover:text-blue-500 dark:text-blue-400'>sign in to existing account</a>"
	showCard={false}
>
		<!-- Demo User Section -->
		<DemoUserCard bind:loading={demoLoading} />

		<!-- Divider -->
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
					Or create a permanent account
				</span>
			</div>
		</div>

		<!-- Signup Form -->
		<div
			class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			{#if success}
				<div
					class="mb-6 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
				>
					<p class="text-sm text-green-800 dark:text-green-200">{success}</p>
					{#if !success.includes('Demo account')}
						<div class="mt-4">
							<Button variant="outline" onclick={() => goto('/auth/login')}>Go to Sign In</Button>
						</div>
					{/if}
				</div>
			{:else}
				<AuthForm
					bind:email
					bind:password
					bind:confirmPassword
					{loading}
					{error}
					showConfirmPassword={true}
					submitText="Create account"
					loadingText="Creating account..."
					onSubmit={handleSignup}
				/>
			{/if}

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Already have an account?
					<a
						href="/auth/login"
						class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
					>
						Sign in here
					</a>
				</p>
			</div>
		</div>
</AuthLayout>
