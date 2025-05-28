import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProfileFormData {
	name: string;
	bio: string;
	interests: string[];
}

export interface AvatarState {
	file: File | null;
	preview: string | null;
	currentUrl: string | null;
}

/**
 * Validates uploaded file for avatar
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
	if (!file.type.startsWith('image/')) {
		return { valid: false, error: 'Please select an image file' };
	}

	if (file.size > 5 * 1024 * 1024) {
		return { valid: false, error: 'File size must be less than 5MB' };
	}

	return { valid: true };
}

/**
 * Creates a preview URL for uploaded file
 */
export function createFilePreview(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result;
			if (typeof result === 'string') {
				resolve(result);
			} else {
				reject(new Error('Failed to create preview'));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});
}

/**
 * Loads current avatar URL from Supabase storage
 */
export async function loadAvatarUrl(
	supabase: SupabaseClient,
	avatarPath: string | null
): Promise<string | null> {
	if (!avatarPath) return null;

	// If it's already a full URL, use it directly
	if (avatarPath.startsWith('http')) {
		return avatarPath;
	}

	try {
		const { data, error } = await supabase.storage
			.from('profile-pictures')
			.createSignedUrl(avatarPath, 60 * 60 * 24);

		if (error) {
			console.error('Error creating signed URL:', error);
			return null;
		}

		return data?.signedUrl || null;
	} catch (error) {
		console.error('Error loading avatar:', error);
		return null;
	}
}

/**
 * Manages interests array operations
 */
export function createInterestsManager(initialInterests: string[] = []) {
	let interests = $state<string[]>(initialInterests);

	function addInterest(interest: string): boolean {
		const trimmed = interest.trim();
		if (trimmed && !interests.includes(trimmed)) {
			interests = [...interests, trimmed];
			return true;
		}
		return false;
	}

	function removeInterest(interest: string): void {
		interests = interests.filter((i) => i !== interest);
	}

	function setInterests(newInterests: string[]): void {
		// Only update if the interests actually changed
		if (JSON.stringify(interests) !== JSON.stringify(newInterests)) {
			interests = newInterests;
		}
	}

	return {
		get interests() { return interests; },
		addInterest,
		removeInterest,
		setInterests
	};
}

/**
 * Handles avatar file operations
 */
export function createAvatarManager() {
	let avatarState = $state<AvatarState>({
		file: null,
		preview: null,
		currentUrl: null
	});

	async function handleFileChange(file: File): Promise<{ success: boolean; error?: string }> {
		const validation = validateAvatarFile(file);
		if (!validation.valid) {
			return { success: false, error: validation.error };
		}

		try {
			const preview = await createFilePreview(file);
			avatarState.file = file;
			avatarState.preview = preview;
			return { success: true };
		} catch (error) {
			return { success: false, error: 'Failed to create preview' };
		}
	}

	function clearAvatar(): void {
		avatarState.file = null;
		avatarState.preview = null;
	}

	async function loadCurrentAvatar(
		supabase: SupabaseClient,
		avatarPath: string | null
	): Promise<void> {
		// Prevent unnecessary calls if the path hasn't changed
		if (avatarPath === null && avatarState.currentUrl === null) return;
		if (avatarPath && avatarState.currentUrl && avatarState.currentUrl.includes(avatarPath)) return;
		
		const newUrl = await loadAvatarUrl(supabase, avatarPath);
		
		// Only update if the URL actually changed
		if (newUrl !== avatarState.currentUrl) {
			avatarState.currentUrl = newUrl;
		}
	}

	return {
		get state() { return avatarState; },
		handleFileChange,
		clearAvatar,
		loadCurrentAvatar
	};
}

/**
 * Form validation utilities
 */
export function validateProfileForm(formData: ProfileFormData): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (formData.name && formData.name.length > 100) {
		errors.push('Name must be less than 100 characters');
	}

	if (formData.bio && formData.bio.length > 500) {
		errors.push('Bio must be less than 500 characters');
	}

	if (formData.interests.length > 20) {
		errors.push('Maximum 20 interests allowed');
	}

	return {
		valid: errors.length === 0,
		errors
	};
} 