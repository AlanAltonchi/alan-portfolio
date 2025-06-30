import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const {
		locals: { safeGetSession }
	} = event;

	const { user } = await safeGetSession();

	if (!user) {
		return {
			boards: [],
			currentUserId: null
		};
	}

	return {
		currentUserId: user.id
	};
};
