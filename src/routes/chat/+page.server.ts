import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user?.id) {
		throw redirect(303, '/auth/login');
	}

	// Fetch all users except the current user for potential conversations
	const { data: users, error: usersError } = await supabase
		.from('users')
		.select('id, email, profiles(name, avatar_url)')
		.neq('id', user.id);

	if (usersError) {
		console.error('Error fetching users:', usersError);
	}

	// Fetch existing conversations for the current user
	const { data: conversations, error: conversationsError } = await supabase
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
		.order('updated_at', { ascending: false });

	if (conversationsError) {
		console.error('Error fetching conversations:', conversationsError);
	}
	return {
		users: users || [],
		conversations: conversations || [],
		currentUserId: user.id,
		devData: {
			relevantTables: ['users', 'profiles', 'conversations', 'messages']
		}
	};
};
