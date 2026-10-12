import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { redirect, type Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Check & Parse Enterprise Session from Secure Cookie
	const sessionCookie = event.cookies.get("novapilot_session");
	if (sessionCookie) {
		try {
			let raw = sessionCookie;
			if (raw.startsWith("%7B") || raw.startsWith("%22")) {
				raw = decodeURIComponent(raw);
			}
			event.locals.user = JSON.parse(raw);
		} catch (err) {
			try {
				event.locals.user = JSON.parse(decodeURIComponent(sessionCookie));
			} catch {
				event.cookies.delete("novapilot_session", { path: "/" });
				event.locals.user = null;
			}
		}
	} else {
		event.locals.user = null;
	}

	const pathname = event.url.pathname;

	// 2. Route Guardrail 1: Enforce strict clearance on /dashboard and child routes
	if (pathname.startsWith("/dashboard")) {
		if (!event.locals.user) {
			// Unauthenticated access attempt blocked by Guardrail Engine
			throw redirect(303, "/auth?error=unauthorized&redirectTo=" + encodeURIComponent(pathname));
		}
	}

	// 3. Route Guardrail 2: Authenticated engineers visiting /auth get redirected to /dashboard
	if (pathname === "/auth" && event.locals.user) {
		throw redirect(303, "/dashboard");
	}

	// 4. Delegate to Better Auth handler for any /api/auth better-auth specific calls
	if (pathname.startsWith("/api/auth") && !pathname.startsWith("/api/auth/login") && !pathname.startsWith("/api/auth/logout") && !pathname.startsWith("/api/auth/session")) {
		return svelteKitHandler({ event, resolve, auth, building });
	}

	return resolve(event);
};
