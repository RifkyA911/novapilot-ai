import { betterAuth } from "better-auth";

export const auth = betterAuth({
	appName: "NovaPilot AI",
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	secret: process.env.BETTER_AUTH_SECRET || "novapilot-super-secret-key-internal-enterprise-32chars",
	emailAndPassword: {
		enabled: true,
		autoSignIn: true
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "mock-google-client-id.apps.googleusercontent.com",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret"
		}
	}
});
