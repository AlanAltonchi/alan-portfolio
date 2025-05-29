import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	// Define which tables are relevant for the dashboard page
	const relevantTables = ['analytics_page_performance', 'analytics_device_stats', 'analytics_overview', 'analytics_traffic_sources', 'analytics_user_activity'];

	try {
		// Fetch RLS rules for relevant tables
		const rlsResponse = await fetch(`/api/dev/rls-rules?tables=${relevantTables.join(',')}`);
		const rlsRules = rlsResponse.ok ? await rlsResponse.text() : null;

		// Fetch schema for relevant tables
		const schemaResponse = await fetch(`/api/dev/schema?tables=${relevantTables.join(',')}`);
		const schemaInfo = schemaResponse.ok ? await schemaResponse.text() : null;

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
