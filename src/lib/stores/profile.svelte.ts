import { supabase } from '$lib/db.svelte';
import { userStore } from './auth.svelte';
import imageCompression from 'browser-image-compression';
import type { Profile } from '$lib/types';

interface ProfileState {
	profiles: Profile[];
	loading: boolean;
	error: string | null;
}

const compressImage = async (file: File): Promise<File> => {
	const options = {
		maxSizeMB: 1,
		maxWidthOrHeight: 1024,
		useWebWorker: true
	};
	return await imageCompression(file, options);
};

function createProfileState(): ProfileState {
	return {
		profiles: [],
		loading: false,
		error: null
	};
}

export const profileState = $state(createProfileState());

export const profileStore = {
	// Getters
	get currentProfile(): Profile | null {
		return userStore.user;
	},
	
	get profiles(): Profile[] {
		return profileState.profiles;
	},
	
	get loading(): boolean {
		return profileState.loading;
	},
	
	get error(): string | null {
		return profileState.error;
	},

	// Actions
	setLoading(loading: boolean): void {
		profileState.loading = loading;
	},

	setError(error: string | null): void {
		profileState.error = error;
	},

	setProfiles(profiles: Profile[]): void {
		profileState.profiles = profiles;
	},

	async createProfile(userId: string): Promise<Profile | null> {
		try {
			// For creating, we can omit auto-generated fields
			const profileData = {
				id: userId,
				name: null,
				bio: null,
				avatar_url: null,
				interests: null
			};

			const { data, error } = await supabase
				.from('profiles')
				.insert(profileData)
				.select()
				.single();

			if (error) throw error;
			userStore.user = data;
			return data;
		} catch (error) {
			console.error('Error creating profile:', error);
			this.setError(error instanceof Error ? error.message : 'Failed to create profile');
			return null;
		}
	},

	async updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
		if (!userStore.user) return null;

		try {
			this.setLoading(true);
			this.setError(null);
			
			// Add updated_at timestamp
			const updateData = {
				...updates,
				updated_at: new Date().toISOString()
			};

			const { data, error } = await supabase
				.from('profiles')
				.update(updateData)
				.eq('id', userStore.user.id)
				.select()
				.single();

			if (error) throw error;
			userStore.user = data;
			return data;
		} catch (error) {
			console.error('Error updating profile:', error);
			this.setError(error instanceof Error ? error.message : 'Failed to update profile');
			return null;
		} finally {
			this.setLoading(false);
		}
	},

	async fetchAllProfiles(): Promise<Profile[]> {
		try {
			this.setLoading(true);
			this.setError(null);

			const { data, error } = await supabase
				.from('profiles')
				.select('*')
				.order('updated_at', { ascending: false });

			if (error) throw error;

			this.setProfiles(data || []);
			return data || [];
		} catch (error) {
			console.error('Error fetching profiles:', error);
			this.setError(error instanceof Error ? error.message : 'Failed to fetch profiles');
			return [];
		} finally {
			this.setLoading(false);
		}
	},

	async uploadAvatar(file: File, userId: string): Promise<string | null> {
		try {
			this.setLoading(true);
			this.setError(null);

			// Upload new avatar
			const compressedFile = await compressImage(file);
			const filePath = `${userId}/avatar.png`;

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('profile-pictures')
				.upload(filePath, compressedFile, {
					upsert: true
				});		
				
			const { data: publicUrlData} = supabase.storage
				.from('profile-pictures')
				.getPublicUrl(filePath);


			if (uploadError) throw uploadError;

			// Update profile with the file path
			const cacheBuster = `?cache=${Date.now()}`;
			await this.updateProfile({ avatar_url: publicUrlData.publicUrl+cacheBuster });	

			return filePath;
		} catch (error) {
			console.error('Error uploading avatar:', error);
			this.setError(error instanceof Error ? error.message : 'Failed to upload avatar');
			return null;
		} finally {
			this.setLoading(false);
		}
	},

	reset(): void {
		Object.assign(profileState, createProfileState());
	}
}; 