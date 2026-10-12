import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete("novapilot_session", { path: "/" });
	cookies.delete("novapilot_user_name", { path: "/" });
	cookies.delete("better-auth.session_token", { path: "/" });

	return json({ success: true, message: "Logged out successfully" });
};

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete("novapilot_session", { path: "/" });
	cookies.delete("novapilot_user_name", { path: "/" });
	cookies.delete("better-auth.session_token", { path: "/" });

	throw redirect(303, "/auth?message=logged_out");
};
