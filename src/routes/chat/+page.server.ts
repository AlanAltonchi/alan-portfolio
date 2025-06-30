import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user?.id) {
		throw redirect(303, '/auth/login');
	}

	// Fetch data in parallel for better performance
	const [usersResult, conversationsResult] = await Promise.all([
		// Limit users to most recent 50 for better performance
		supabase
			.from('users')
			.select('id, email, profiles(name, avatar_url)')
			.neq('id', user.id)
			.order('created_at', { ascending: false })
			.limit(50),
		
		// Fetch existing conversations with limit
		supabase
			.from('conversations')
			.select(
				`
				id,
				user_a,
				user_b,
				created_at,
				updated_at,
				user_a_profile:users!conversations_user_a_fkey(id, email, profiles(name, avatar_url)),
				user_b_profile:users!conversations_user_b_fkey(id, email, profiles(name, avatar_url))
			`
			)
			.or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
			.order('updated_at', { ascending: false })
			.limit(20)
	]);

	if (usersResult.error) {
		console.error('Error fetching users:', usersResult.error);
	}

	if (conversationsResult.error) {
		console.error('Error fetching conversations:', conversationsResult.error);
	}

	return {
		users: usersResult.data || [],
		conversations: conversationsResult.data || [],
		currentUserId: user.id,
		devData: {
			relevantTables: ['users', 'profiles', 'conversations', 'messages']
		}
	};
};
