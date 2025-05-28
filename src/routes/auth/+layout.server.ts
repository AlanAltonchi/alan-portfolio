import type { LayoutServerLoad } from './$types';

export const load = (async () => {
    return {
        devData: {
            relevantTables: ['users', 'profiles']
        }
    };
}) satisfies LayoutServerLoad;