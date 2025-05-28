import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	createDemoUser: async ({ request }) => {
		try {
			const formData = await request.formData();
			const userData = JSON.parse(formData.get('userData') as string);

			// Create admin client with service role
			const supabaseAdmin = createClient(
				PUBLIC_SUPABASE_URL,
				SUPABASE_SERVICE_ROLE_KEY,
				{
					auth: {
						autoRefreshToken: false,
						persistSession: false
					}
				}
			);

			// Create user with admin client (bypasses email confirmation)
			const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
				email: userData.email,
				password: userData.password,
				email_confirm: true, // Auto-confirm email
				user_metadata: {
					name: userData.name,
					company: userData.company,
					role: userData.role,
					is_demo: true
				}
			});

			if (createError) {
				console.error('Demo user creation error:', createError);
				return fail(400, { error: createError.message });
			}


			// Return success with user data
			return {
				success: true,
				user: {
					id: user.user.id,
					email: user.user.email,
					name: userData.name
				}
			};
		} catch (error) {
			console.error('Demo user creation error:', error);
			return fail(500, { error: 'Failed to create demo user' });
		}
	}
}; 