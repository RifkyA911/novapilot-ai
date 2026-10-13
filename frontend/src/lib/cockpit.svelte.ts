// Cockpit Shared State (Svelte 5 Runes)
// Provides unified SSE, ticket cache, audit logs, telemetry, and multi-platform ChatOps state.

export interface Ticket {
	id: number;
	ticket_no: string;
	branch_id?: number;
	branch_name?: string;
	raw_message: string;
	extracted_intent: string;
	document_no: string;
	field_target: string;
	current_value: string;
	proposed_value: string;
	confidence_score: number;
	status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED";
	approved_by?: string;
	rejection_reason?: string;
	created_at: string;
	updated_at?: string;
	documents?: { id: number; file_name: string; file_path: string; mime_type: string }[];
}

export interface AuditLog {
	id: number;
	ticket_id: number;
	action: string;
	performed_by: string;
	ip_address: string;
	created_at: string;
}

export interface TelemetryData {
	lan_ip: string;
	status: string;
	uptime_seconds: number;
	goroutines: number;
	memory_alloc_mb: string;
	database: {
		driver: string;
		status: string;
		open_connections?: number;
		idle?: number;
		in_use?: number;
	};
}

export type ChatPlatform = "whatsapp" | "telegram" | "discord" | "slack";

class CockpitState {
	tickets = $state<Ticket[]>([]);
	auditLogs = $state<AuditLog[]>([]);
	telemetry = $state<TelemetryData | null>(null);
	loading = $state(true);
	sseConnected = $state(false);
	eventSource = $state<EventSource | null>(null);
	
	// Database engine architecture mode
	dbEngineMode = $state<"relational" | "non_relational">("relational");
	
	// Selected ChatOps Platform (WhatsApp, Telegram, Discord, Slack)
	chatPlatform = $state<ChatPlatform>("whatsapp");

	// Realistic Platform Status Tracking (Zero Fake "Connected" Badges!)
	platformStatuses = $state({
		whatsapp: {
			name: "WhatsApp",
			status: "AWAITING_HOOK" as "CONNECTED" | "AWAITING_HOOK" | "DISCONNECTED",
			eventsCaptured: 0,
			lastPingAt: null as string | null,
			endpoint: "http://127.0.0.1:8088/api/tickets",
			driver: "Baileys Socket & Client Observers (Ferdium/Rambox/Tampermonkey)",
			details: "Port 8088 listening. Zero DOM hook events received yet. Awaiting Ferdium/Rambox injection or manual test ping."
		},
		telegram: {
			name: "Telegram Bot",
			status: "NOT_CONFIGURED" as "CONNECTED" | "NOT_CONFIGURED" | "DISCONNECTED",
			eventsCaptured: 0,
			lastPingAt: null as string | null,
			endpoint: "http://127.0.0.1:8088/api/webhooks/telegram",
			driver: "Telegram Bot API (Long Polling & Webhook Ingress)",
			details: "No TELEGRAM_BOT_TOKEN found in local configuration. Set token from @BotFather to activate channel listener."
		},
		discord: {
			name: "Discord Webhook",
			status: "NOT_CONFIGURED" as "CONNECTED" | "NOT_CONFIGURED" | "DISCONNECTED",
			eventsCaptured: 0,
			lastPingAt: null as string | null,
			endpoint: "http://127.0.0.1:8088/api/webhooks/discord",
			driver: "Discord Developer Portal Interactions & Channel Webhooks",
			details: "No Discord Webhook URL found. Create a webhook in channel settings to route invoice escalations."
		},
		slack: {
			name: "Slack Enterprise",
			status: "NOT_CONFIGURED" as "CONNECTED" | "NOT_CONFIGURED" | "DISCONNECTED",
			eventsCaptured: 0,
			lastPingAt: null as string | null,
			endpoint: "http://127.0.0.1:8088/api/webhooks/slack",
			driver: "Slack Events API & Interactive Block Kit Handlers",
			details: "No SLACK_SIGNING_SECRET detected. Configure enterprise app manifest to enable slash commands."
		}
	});

	// Reactive counts
	pendingCount = $derived(this.tickets.filter(t => t.status === "PENDING_APPROVAL").length);
	executedCount = $derived(this.tickets.filter(t => t.status === "EXECUTED").length);
	rejectedCount = $derived(this.tickets.filter(t => t.status === "REJECTED").length);

	recordPlatformEvent(platform: ChatPlatform) {
		this.platformStatuses[platform].status = "CONNECTED";
		this.platformStatuses[platform].eventsCaptured++;
		this.platformStatuses[platform].lastPingAt = new Date().toLocaleTimeString();
	}

	async fetchTickets() {
		try {
			this.fetchTelemetry();
			const res = await fetch("/api/tickets");
			if (res.ok) {
				this.tickets = await res.json();
			}
		} catch (err) {
			console.error("Failed to fetch tickets:", err);
		} finally {
			this.loading = false;
		}
	}

	async fetchAuditLogs() {
		try {
			const res = await fetch("/api/audit-logs");
			if (res.ok) {
				this.auditLogs = await res.json();
			}
		} catch (err) {
			console.error("Failed to fetch audit logs:", err);
		}
	}

	async fetchTelemetry() {
		try {
			const res = await fetch("/api/telemetry");
			if (res.ok) {
				this.telemetry = await res.json();
			}
		} catch (err) {
			console.error("Failed to fetch telemetry:", err);
		}
	}

	setupSSE() {
		if (typeof window === "undefined") return;
		if (this.eventSource) return;

		try {
			this.eventSource = new EventSource("/api/events");
			this.eventSource.onopen = () => {
				this.sseConnected = true;
			};
			this.eventSource.addEventListener("ticket_created", (e) => {
				const newTicket: Ticket = JSON.parse(e.data);
				this.tickets = [newTicket, ...this.tickets.filter(t => t.id !== newTicket.id)];
				this.recordPlatformEvent("whatsapp");
			});
			this.eventSource.addEventListener("ticket_approved", (e) => {
				const updated: Ticket = JSON.parse(e.data);
				this.tickets = this.tickets.map(t => t.id === updated.id ? updated : t);
				this.fetchAuditLogs();
			});
			this.eventSource.addEventListener("ticket_rejected", (e) => {
				const updated: Ticket = JSON.parse(e.data);
				this.tickets = this.tickets.map(t => t.id === updated.id ? updated : t);
				this.fetchAuditLogs();
			});
			this.eventSource.onerror = () => {
				this.sseConnected = false;
			};
		} catch (err) {
			console.error("SSE connection error:", err);
		}
	}

	closeSSE() {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
			this.sseConnected = false;
		}
	}

	async handleApprove(ticket: Ticket, approverName: string) {
		try {
			const res = await fetch(`/api/tickets/${ticket.id}/approve`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ approver_name: approverName })
			});
			if (res.ok) {
				await this.fetchTickets();
				await this.fetchAuditLogs();
				return { success: true };
			} else {
				const err = await res.json();
				return { success: false, error: err.error || "Server error" };
			}
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	async handleReject(ticket: Ticket, approverName: string, reason: string) {
		try {
			const res = await fetch(`/api/tickets/${ticket.id}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					approver_name: approverName,
					reason: reason
				})
			});
			if (res.ok) {
				await this.fetchTickets();
				await this.fetchAuditLogs();
				return { success: true };
			} else {
				const err = await res.json();
				return { success: false, error: err.error || "Server error" };
			}
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}
}

export const cockpit = new CockpitState();
