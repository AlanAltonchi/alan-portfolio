import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
// import { init } from '$lib/db.svelte'; // Unused

const supabase: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this server request.
	 *
	 * The Supabase client gets the Auth token from the request cookies.
	 */
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			/**
			 * SvelteKit's cookies API requires `path` to be explicitly set in
			 * the cookie options. Setting `path` to `/` replicates previous/
			 * standard behavior.
			 */
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: '/',
						httpOnly: false,
						secure: false, // Set to true in production with HTTPS
						sameSite: 'lax'
					});
				});
			}
		}
	});

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 *
	 * SECURITY NOTE: We call getSession() only for session metadata (expiry, tokens, etc.).
	 * We NEVER use session.user as it's potentially insecure (comes from storage).
	 * We always use getUser() to get validated user data.
	 */
	event.locals.safeGetSession = async () => {
		const session = (await event.locals.supabase.auth.getSession()).data.session;

		if (!session) return { session: null, user: null };

		/* We wrap getClaims in a try/catch, because it could throw. */
		try {
			/**
			 * If your project is using symmetric JWTs,
			 * getClaims makes a network call to your Supabase instance.
			 *
			 * We pass the access_token into getClaims, otherwise it
			 * would call getSession itself - which we've already done above.
			 *
			 * If you need data that is only returned from `getUser`,
			 * then you can substitute it here and assign accordingly in the return statement.
			 */
			const { data, error } = await event.locals.supabase.auth.getClaims(session.access_token);

			if (error || !data) return { session: null, user: null };

			const { claims } = data;

			/**
			 * Return a Session, created from validated claims.
			 *
			 * For security, the only items you should use from `session` are the access and refresh tokens.
			 *
			 * Most of these properties are required for functionality or typing.
			 * Add any data needed for your layouts or pages.
			 *
			 * Here are the properties which aren't required, but we use them in the demo:
			 * `user.user_metadata.avatar_url`
			 * `user.user_metadata.nickname`
			 * `user.email`
			 * `user.phone`
			 */
			const validatedSession = {
				access_token: session.access_token,
				refresh_token: session.refresh_token,
				expires_at: claims.exp,
				expires_in: claims.exp - Math.round(Date.now() / 1000),
				token_type: 'bearer',
				user: {
					app_metadata: claims.app_metadata ?? {},
					aud: 'authenticated',
					created_at: '', // only found in session.user or getUser
					id: claims.sub,
					email: claims.email,
					phone: claims.phone,
					user_metadata: claims.user_metadata ?? {},
					is_anonymous: claims.is_anonymous
				}
			};

			return {
				session: validatedSession,
				user: validatedSession.user
			};
		} catch (err) {
			console.error(err);
			return { session: null, user: null };
		}
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	if (!event.locals.session && event.url.pathname.startsWith('/private')) {
		redirect(303, '/auth');
	}

	if (event.locals.session && event.url.pathname === '/auth') {
		redirect(303, '/private');
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);
