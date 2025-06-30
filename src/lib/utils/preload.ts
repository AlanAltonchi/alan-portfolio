import { browser } from '$app/environment';
import { preloadData } from '$app/navigation';

/**
 * Preload data for common navigation paths
 */
export function setupNavigationPreloading() {
	if (!browser) return;

	// Preload common navigation paths when hovering over navigation items
	const preloadPaths = ['/chat', '/kanban', '/analytics', '/profile'];

	// Set up intersection observer for visible navigation links
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const link = entry.target as HTMLAnchorElement;
					const href = link.getAttribute('href');
					if (href && preloadPaths.includes(href)) {
						// Preload the route data
						preloadData(href).catch(() => {
							// Silently fail if preload fails
						});
					}
				}
			});
		},
		{ rootMargin: '50px' }
	);

	// Observe navigation links
	const setupObserver = () => {
		const navLinks = document.querySelectorAll('nav a[href]');
		navLinks.forEach((link) => observer.observe(link));
	};

	// Initial setup
	setTimeout(setupObserver, 100);

	// Re-setup when navigation changes
	const navigationObserver = new MutationObserver(() => {
		setupObserver();
	});

	const nav = document.querySelector('nav');
	if (nav) {
		navigationObserver.observe(nav, { childList: true, subtree: true });
	}

	// Cleanup function
	return () => {
		observer.disconnect();
		navigationObserver.disconnect();
	};
}

/**
 * Preload specific route data programmatically
 */
export async function preloadRoute(path: string) {
	if (!browser) return;

	try {
		await preloadData(path);
	} catch (error) {
		console.error(`Failed to preload ${path}:`, error);
	}
}
