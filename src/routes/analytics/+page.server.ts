import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	// Define which tables are relevant for the dashboard page
	const relevantTables = [
		'analytics_page_performance',
		'analytics_device_stats',
		'analytics_overview',
		'analytics_traffic_sources',
		'analytics_user_activity'
	];

	// Only load dev data in development environment
	const isDev = process.env.NODE_ENV === 'development';

	if (!isDev) {
		return {
			devData: {
				relevantTables,
				rlsRules: null,
				schemaInfo: null
			}
		};
	}

	try {
		// Fetch RLS rules and schema in parallel for better performance
		const [rlsResponse, schemaResponse] = await Promise.all([
			fetch(`/api/dev/rls-rules?tables=${relevantTables.join(',')}`),
			fetch(`/api/dev/schema?tables=${relevantTables.join(',')}`)
		]);

		const [rlsRules, schemaInfo] = await Promise.all([
			rlsResponse.ok ? rlsResponse.text() : null,
			schemaResponse.ok ? schemaResponse.text() : null
		]);

		return {
			devData: {
				relevantTables,
				rlsRules,
				schemaInfo
			}
		};
	} catch (error) {
		console.error('Error loading dev data:', error);
		return {
			devData: {
				relevantTables,
				rlsRules: null,
				schemaInfo: null
			}
		};
	}
};
