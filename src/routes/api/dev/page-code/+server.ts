import { json } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const route = url.searchParams.get('route');
	
	if (!route) {
		return json({ error: 'Route parameter is required' }, { status: 400 });
	}

	try {
		// Convert route to file path
		let filePath: string;
		
		if (route === '/+page.svelte') {
			filePath = join(process.cwd(), 'src/routes/+page.svelte');
		} else {
			// Remove leading slash and convert to file path
			const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
			filePath = join(process.cwd(), 'src/routes', cleanRoute);
		}

		const content = await readFile(filePath, 'utf-8');
		
		return new Response(content, {
			headers: {
				'Content-Type': 'text/plain',
			},
		});
	} catch (error) {
		// If file doesn't exist, return a helpful message
		const fallbackContent = `// Page source not found for route: ${route}
// This could be because:
// 1. The route doesn't exist
// 2. It's a dynamic route
// 3. The file is in a different location
//
// Available routes to try:
// - /+page.svelte (home page)
// - /dashboard/+page.svelte
// - /auth/login/+page.svelte
// - /auth/signup/+page.svelte

// Error details: ${error}`;

		return new Response(fallbackContent, {
			headers: {
				'Content-Type': 'text/plain',
			},
		});
	}
}; 