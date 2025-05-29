import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { LayoutLoad } from './$types';
import { init } from '$lib/db.svelte';
export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	/**
	 * Declare a dependency so the layout can be invalidated, for example, on
	 * session refresh.
	 */
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch
				}
			})
		: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch
				},
				cookies: {
					getAll() {
						return data.cookies;
					}
				}
			});
	if (isBrowser()) init(supabase);

	/**
	 * On server-side, use the session from server data (which was safely validated).
	 * On client-side, get the session from Supabase client.
	 */
	let session = data.session;
	let user = data.user;

	if (isBrowser()) {
		// On client side, get fresh session from Supabase
		const {
			data: { session: clientSession }
		} = await supabase.auth.getSession();

		// Use client session if we don't have server session or if client session is newer
		if (!session || (clientSession && clientSession.expires_at !== session.expires_at)) {
			session = clientSession;
			user = clientSession?.user ?? null;
		}
	}

	return { session, supabase, user };
};
