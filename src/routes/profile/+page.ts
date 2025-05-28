import type { PageLoad } from './$types';

export const load = (async () => {
    return {
        devData: {
            relevantTables: ['profiles', 'users']
        }
    };
}) satisfies PageLoad;