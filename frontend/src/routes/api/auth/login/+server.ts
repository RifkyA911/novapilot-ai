import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { email, password, provider, name } = body;

		let userSession: App.Locals["user"] = null;

		if (provider === "google") {
			userSession = {
				id: "usr_google_rifky",
				email: email || "rifky.aditya@enterprise.corp",
				name: name || "Rifky Aditya (Google OAuth)",
				role: "oncall_engineer",
				avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rifky",
				branchClearance: ["SURABAYA_HQ", "SEMARANG_DC", "JAKARTA_CENTRAL", "MEDAN_HUB"]
			};
		} else if (email === "rifky@factory.internal" || email?.endsWith(".internal") || email?.includes("@")) {
			// Internal Enterprise or On-call shift login
			userSession = {
				id: "usr_internal_rifky",
				email: email,
				name: name || (email === "rifky@factory.internal" ? "Rifky Aditya" : email.split("@")[0]),
				role: "oncall_engineer",
				avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rifky",
				branchClearance: ["SURABAYA_HQ", "SEMARANG_DC", "JAKARTA_CENTRAL", "MEDAN_HUB"]
			};
		} else {
			return json({ error: "Invalid credentials. Please provide a valid internal work email." }, { status: 401 });
		}

		// Set HTTP-Only Session Cookie
		cookies.set("novapilot_session", JSON.stringify(userSession), {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		// Also set a non-httpOnly hint cookie for fast client-side state hydration
		cookies.set("novapilot_user_name", encodeURIComponent(userSession.name), {
			path: "/",
			httpOnly: false,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 7
		});

		return json({
			success: true,
			user: userSession,
			message: "Authentication successful. On-call session active."
		});
	} catch (err: any) {
		return json({ error: err?.message || "Authentication error" }, { status: 500 });
	}
};
