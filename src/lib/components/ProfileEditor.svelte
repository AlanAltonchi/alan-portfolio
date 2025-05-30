<script lang="ts">
	import { Button, Input, Modal } from '$lib/components';
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { profileStore } from '$lib/stores/profile.svelte';
	import {
		createAvatarManager,
		createInterestsManager,
		validateProfileForm,
		type ProfileFormData
	} from '$lib/utils/profile.svelte';

	let { open = $bindable(false) } = $props();

	let formData = $state<ProfileFormData>({
		name: '',
		bio: '',
		interests: []
	});

	let newInterest = $state('');
	let fileInput: HTMLInputElement;
	let saving = $state(false);

	// Initialize managers
	const avatarManager = createAvatarManager();
	const interestsManager = createInterestsManager();

	// Initialize form data when profile loads or modal opens
	$effect(() => {
		const profile = profileStore.currentProfile;
		if (profile) {
			// Only update form data if it's different
			if (formData.name !== (profile.name || '')) {
				formData.name = profile.name || '';
			}
			if (formData.bio !== (profile.bio || '')) {
				formData.bio = profile.bio || '';
			}

			const profileInterests = profile.interests || [];
			if (JSON.stringify(formData.interests) !== JSON.stringify(profileInterests)) {
				formData.interests = profileInterests;
				interestsManager.setInterests(profileInterests);
			}

			// Load avatar when modal opens or when profile changes
			if (open) {
				avatarManager.loadCurrentAvatar(supabase, profile.avatar_url);
			}
		}
	});

	async function handleAvatarChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			const result = await avatarManager.handleFileChange(file);
			if (!result.success && result.error) {
				alert(result.error);
			}
		}
	}

	function addInterest() {
		if (interestsManager.addInterest(newInterest)) {
			formData.interests = interestsManager.interests;
			newInterest = '';
		}
	}

	function removeInterest(interest: string) {
		interestsManager.removeInterest(interest);
		formData.interests = interestsManager.interests;
	}

	function handleInterestKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addInterest();
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!authStore.user?.id) return;

		// Validate form
		const validation = validateProfileForm(formData);
		if (!validation.valid) {
			alert(validation.errors.join('\n'));
			return;
		}

		saving = true;

		try {
			// Upload avatar if selected
			if (avatarManager.state.file) {
				await profileStore.uploadAvatar(avatarManager.state.file, authStore.user.id);
			}

			// Update profile data
			await profileStore.updateProfile({
				name: formData.name || null,
				bio: formData.bio || null,
				interests: formData.interests.length > 0 ? formData.interests : null
			});

			if (!profileStore.error) {
				open = false;
				avatarManager.clearAvatar();
				avatarManager.loadCurrentAvatar(supabase, profileStore.currentProfile?.avatar_url || null);
			}
		} catch (error) {
			console.error('Error saving profile:', error);
		} finally {
			saving = false;
		}
	}

	function handleClose() {
		open = false;
		avatarManager.clearAvatar();

		// Reset form data to current profile
		if (profileStore.currentProfile) {
			formData.name = profileStore.currentProfile.name || '';
			formData.bio = profileStore.currentProfile.bio || '';
			formData.interests = profileStore.currentProfile.interests || [];
			interestsManager.setInterests(formData.interests);
			avatarManager.loadCurrentAvatar(supabase, profileStore.currentProfile.avatar_url);
		}
	}
</script>

<Modal title="Edit Profile" isOpen={open} onClose={handleClose}>
	<div class="mx-auto w-full max-w-2xl">
		{#if profileStore.error}
			<div
				class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
			>
				<p class="text-red-800 dark:text-red-200">{profileStore.error}</p>
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Avatar Upload -->
			<div class="flex flex-col items-center space-y-4">
				<div class="relative">
					<div
						class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
					>
						{#if avatarManager.state.preview}
							<img
								src={avatarManager.state.preview}
								alt="Avatar preview"
								class="h-full w-full object-cover"
							/>
						{:else if avatarManager.state.currentUrl}
							<img
								src={avatarManager.state.currentUrl}
								alt="Current avatar"
								class="h-full w-full object-cover"
							/>
						{:else}
							<svg class="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
								/>
							</svg>
						{/if}
					</div>
					<button
						type="button"
						onclick={() => fileInput.click()}
						aria-label="Upload avatar"
						class="absolute -right-2 -bottom-2 rounded-full bg-blue-600 p-2 text-white shadow-lg transition-colors hover:bg-blue-700"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
							></path>
						</svg>
					</button>
				</div>
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					onchange={handleAvatarChange}
					class="hidden"
				/>
				<p class="text-center text-sm text-gray-600 dark:text-gray-400">
					Click the camera icon to upload a new profile picture<br />
					<span class="text-xs">Max size: 5MB. Formats: JPG, PNG, WebP, GIF</span>
				</p>
			</div>

			<!-- Name -->
			<div>
				<label for="name" class="mb-2 block text-sm font-medium">Name</label>
				<Input
					id="name"
					bind:value={formData.name}
					placeholder="Enter your full name"
					maxlength={100}
				/>
			</div>

			<!-- Bio -->
			<div>
				<label for="bio" class="mb-2 block text-sm font-medium">Bio</label>
				<textarea
					id="bio"
					bind:value={formData.bio}
					placeholder="Tell us about yourself..."
					rows="4"
					maxlength={500}
					class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
				></textarea>
				<p class="mt-1 text-xs text-gray-500">{formData.bio.length}/500 characters</p>
			</div>

			<!-- Interests -->
			<div>
				<p class="mb-2 block text-sm font-medium">Interests</p>
				<div class="space-y-3">
					<div class="flex gap-2">
						<Input
							bind:value={newInterest}
							placeholder="Add an interest..."
							onkeydown={handleInterestKeydown}
							class="flex-1"
						/>
						<Button type="button" onclick={addInterest} variant="outline" size="sm">Add</Button>
					</div>

					{#if interestsManager.interests.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each interestsManager.interests as interest (interest)}
								<span
									class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
								>
									{interest}
									<button
										type="button"
										onclick={() => removeInterest(interest)}
										aria-label="Remove interest"
										class="rounded-full p-0.5 transition-colors hover:bg-blue-200 dark:hover:bg-blue-800"
									>
										<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											></path>
										</svg>
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
				<Button type="button" variant="outline" onclick={handleClose}>Cancel</Button>
				<Button type="submit" disabled={saving || profileStore.loading}>
					{#if saving || profileStore.loading}
						<svg class="mr-2 -ml-1 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Saving...
					{:else}
						Save Changes
					{/if}
				</Button>
			</div>
		</form>
	</div>
</Modal>
