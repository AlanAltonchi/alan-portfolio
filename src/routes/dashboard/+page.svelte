<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Card, Button } from '$lib/components';
	import { authStore } from '$lib/stores/auth.svelte';

	let { data } = $props();

	// Redirect to login if not authenticated
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/auth/login');
		}
	});
</script>

{#if authStore.isAuthenticated}
	<div class="space-y-8">
		<div>
			<h1 class="text-3xl font-bold">Dashboard</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-2">
				Welcome to your personal dashboard, {authStore.user?.email}!
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<Card variant="outlined">
				<h3 class="text-lg font-semibold mb-2">Profile</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-4">
					Manage your account settings and preferences.
				</p>
				<Button variant="outline" size="sm" onclick={() => goto('/profile')}>
					Edit Profile
				</Button>
			</Card>

			<Card variant="outlined">
				<h3 class="text-lg font-semibold mb-2">Chat</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-4">
					Start simulated conversations with markdown, images, and real-time read receipts.
				</p>
				<Button variant="outline" size="sm" onclick={() => goto('/chat')}>
					Open Chat
				</Button>
			</Card>

			<Card variant="outlined">
				<h3 class="text-lg font-semibold mb-2">Tasks</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-4">
					Manage your tasks and projects.
				</p>
				<Button variant="outline" size="sm">
					View Tasks
				</Button>
			</Card>

			<Card variant="outlined">
				<h3 class="text-lg font-semibold mb-2">Inbox</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-4">
					Check your messages and notifications.
				</p>
				<Button variant="outline" size="sm">
					Open Inbox
				</Button>
			</Card>

			<Card variant="outlined">
				<h3 class="text-lg font-semibold mb-2">Analytics</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-4">
					View your activity and usage statistics.
				</p>
				<Button variant="outline" size="sm">
					View Analytics
				</Button>
			</Card>

			<Card variant="outlined">
				<h3 class="text-lg font-semibold mb-2">User Profiles</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-4">
					Discover and connect with other users.
				</p>
				<Button variant="outline" size="sm" onclick={() => goto('/profiles')}>
					View Profiles
				</Button>
			</Card>
		</div>

		<Card>
			<h2 class="text-xl font-semibold mb-4">Account Information</h2>
			<div class="space-y-2">
				<div>
					<span class="font-medium">Email:</span> {authStore.user?.email}
				</div>
				<div>
					<span class="font-medium">User ID:</span> {authStore.user?.id}
				</div>
				<div>
					<span class="font-medium">Last Sign In:</span> 
					{authStore.user?.last_sign_in_at ? new Date(authStore.user.last_sign_in_at).toLocaleString() : 'N/A'}
				</div>
			</div>
		</Card>
	</div>
{:else}
	<div class="flex items-center justify-center min-h-[50vh]">
		<div class="text-center">
			<h2 class="text-2xl font-semibold mb-4">Authentication Required</h2>
			<p class="text-gray-600 dark:text-gray-400 mb-6">
				Please sign in to access your dashboard.
			</p>
			<Button onclick={() => goto('/auth/login')}>
				Sign In
			</Button>
		</div>
	</div>
{/if} 