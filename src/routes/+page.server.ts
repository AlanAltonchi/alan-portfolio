import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Define which tables are relevant for the home page
	const relevantTables = ['users', 'profiles'];

	return {
		devData: {
			relevantTables
		}
	};
};
