import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'auto';

function getInitialTheme(): Theme {
	if (!browser) return 'auto';
	return (localStorage.getItem('theme') as Theme) || 'auto';
}

function updateDocumentClass(theme: Theme) {
	if (!browser) return;

	const root = document.documentElement;
	root.classList.remove('light', 'dark');

	if (theme === 'auto') {
		// Use system preference
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const appliedTheme = prefersDark ? 'dark' : 'light';
		root.classList.add(appliedTheme);
	} else {
		root.classList.add(theme);
	}
}

export const themeState = $state({
	current: getInitialTheme(),
	
	set(theme: Theme) {
		this.current = theme;
		if (browser) {
			localStorage.setItem('theme', theme);
		}
		updateDocumentClass(theme);
	},
	
	toggle() {
		const newTheme = this.current === 'dark' ? 'light' : 'dark';
		this.set(newTheme);
	}
});

// Initialize theme on first load
if (browser) {
	updateDocumentClass(themeState.current);
	
	// Listen for system theme changes when in auto mode
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		if (themeState.current === 'auto') {
			updateDocumentClass('auto');
		}
	});
} 