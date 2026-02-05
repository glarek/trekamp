import { writable } from 'svelte/store';
import type { User } from '$lib/supabase';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isAuthenticated: false
	});

	// Try to restore session from localStorage on initialization
	if (typeof window !== 'undefined') {
		const savedUser = localStorage.getItem('eventcomp_user');
		if (savedUser) {
			try {
				const user = JSON.parse(savedUser);
				set({ user, isAuthenticated: true });
			} catch (e) {
				localStorage.removeItem('eventcomp_user');
			}
		}
	}

	return {
		subscribe,
		login: (user: User) => {
			if (typeof window !== 'undefined') {
				localStorage.setItem('eventcomp_user', JSON.stringify(user));
			}
			set({ user, isAuthenticated: true });
		},
		logout: () => {
			if (typeof window !== 'undefined') {
				localStorage.removeItem('eventcomp_user');
			}
			set({ user: null, isAuthenticated: false });
		}
	};
}

export const authStore = createAuthStore();
