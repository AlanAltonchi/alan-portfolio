import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '$lib/types';

interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
	initialized: boolean;
}

interface UserStore {
	user: Profile | null;
}

function createAuthState(): AuthState {
	return {
		user: null,
		session: null,
		loading: true,
		initialized: false
	};
}

export const authState = $state(createAuthState());

export let userStore: UserStore = $state({
	user: null
});

export const setUserProfile = (profile: Profile | null) => {
	userStore.user = profile;
};

export const authStore = {
	// Getters
	get user() {
		return authState.user;
	},

	get session() {
		return authState.session;
	},

	get loading() {
		return authState.loading;
	},

	get initialized() {
		return authState.initialized;
	},

	get isAuthenticated() {
		return !!authState.session && !!authState.user;
	},

	// Actions
	setAuth(session: Session | null, user: User | null) {
		authState.session = session;
		authState.user = user;
		authState.loading = false;
		authState.initialized = true;
	},

	setLoading(loading: boolean) {
		authState.loading = loading;
	},

	clearAuth() {
		authState.session = null;
		authState.user = null;
		authState.loading = false;
		authState.initialized = true;
	},

	reset() {
		Object.assign(authState, createAuthState());
	}
};
