declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				role: "oncall_engineer" | "gatekeeper" | "admin";
				avatar?: string;
				branchClearance: string[];
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
