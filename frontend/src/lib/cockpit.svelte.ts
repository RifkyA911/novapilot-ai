// Cockpit Shared State (Svelte 5 Runes)
// Provides unified SSE, ticket cache, audit logs, telemetry, and multi-platform ChatOps state.
import { sound } from "./audio";

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

export interface InboundMessage {
	id: number;
	platform: "whatsapp" | "telegram" | "discord" | "slack";
	sender_id: string;
	sender_name: string;
	raw_message: string;
	media_type: "text" | "image" | "document" | "audio";
	media_url?: string;
	ocr_text?: string;
	classification: "ACTIONABLE" | "NEEDS_REVIEW" | "CASUAL_BANTER";
	extracted_doc?: string;
	extracted_intent?: string;
	extracted_target?: string;
	ticket_id?: number;
	ticket_no?: string;
	created_at: string;
}

export interface LearnedPattern {
	id: number;
	pattern_name: string;
	example_phrase: string;
	regex_pattern: string;
	target_intent: string;
	classification: string;
	confidence: number;
	times_matched: number;
	learned_by: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

class CockpitState {
	tickets = $state<Ticket[]>([]);
	inboundMessages = $state<InboundMessage[]>([]);
	learnedPatterns = $state<LearnedPattern[]>([]);
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

	// Extra Service & Component Configurations
	dbConfig = $state<{
		system_db?: { status: string; dbname: string };
		mcp_ref_db?: { status: string; dbname: string };
	} | null>(null);

	llmConfig = $state<{
		mode: string;
		status: string;
		cli_available?: boolean;
		model?: string;
	} | null>(null);

	isGatewayRunning = $state(false);

	// Reactive counts
	pendingCount = $derived(this.tickets.filter(t => t.status === "PENDING_APPROVAL").length);
	executedCount = $derived(this.tickets.filter(t => t.status === "EXECUTED").length);
	rejectedCount = $derived(this.tickets.filter(t => t.status === "REJECTED").length);
	actionableCount = $derived(this.inboundMessages.filter(m => m.classification === "ACTIONABLE").length);
	needsReviewCount = $derived(this.inboundMessages.filter(m => m.classification === "NEEDS_REVIEW").length);
	casualBanterCount = $derived(this.inboundMessages.filter(m => m.classification === "CASUAL_BANTER").length);

	// Reactive Service Setup Statuses (Used to hide static badges and show only when unconfigured)
	isDbConfigured = $derived(
		this.telemetry?.database?.status === "HEALTHY" ||
		this.telemetry?.database?.status === "CONNECTED" ||
		this.dbConfig?.system_db?.status === "CONNECTED"
	);

	isMcpConfigured = $derived(
		this.dbConfig?.mcp_ref_db?.status === "CONNECTED"
	);

	isHermesConfigured = $derived(
		this.llmConfig?.cli_available === true ||
		this.llmConfig?.status === "ACTIVE"
	);

	recordPlatformEvent(platform: ChatPlatform) {
		this.platformStatuses[platform].status = "CONNECTED";
		this.platformStatuses[platform].eventsCaptured++;
		this.platformStatuses[platform].lastPingAt = new Date().toLocaleTimeString();
	}

	async checkWhatsAppGatewayStatus() {
		try {
			const res = await fetch("/uploads/whatsapp_qr.json?t=" + Date.now());
			if (res.ok) {
				const data = await res.json();
				if (data.status === "CONNECTED") {
					this.platformStatuses.whatsapp.status = "CONNECTED";
					this.platformStatuses.whatsapp.details = "Baileys WhatsApp Multi-Device socket connected and actively listening for incoming branch messages.";
					if (!this.platformStatuses.whatsapp.lastPingAt) {
						this.platformStatuses.whatsapp.lastPingAt = new Date().toLocaleTimeString();
					}
				} else if (data.status === "WAITING_SCAN") {
					this.platformStatuses.whatsapp.status = "AWAITING_HOOK";
					this.platformStatuses.whatsapp.details = "WhatsApp QR Code generated. Awaiting device pairing scan in /dashboard/platforms.";
				} else if (data.status === "DISCONNECTED") {
					this.platformStatuses.whatsapp.status = "DISCONNECTED";
					this.platformStatuses.whatsapp.details = "WhatsApp Gateway session disconnected. Reconnection in progress.";
				}
			}
		} catch {}
	}

	refreshTickets() {
		return this.fetchTickets();
	}

	async fetchTickets() {
		try {
			this.fetchTelemetry();
			this.checkWhatsAppGatewayStatus();
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

	async fetchInboundMessages() {
		try {
			const res = await fetch("/api/inbound-messages");
			if (res.ok) {
				this.inboundMessages = await res.json();
			}
		} catch (err) {
			console.error("Failed to fetch inbound messages:", err);
		}
	}

	async fetchLearnedPatterns() {
		try {
			const res = await fetch("/api/learned-patterns");
			if (res.ok) {
				this.learnedPatterns = await res.json();
			}
		} catch (err) {
			console.error("Failed to fetch learned patterns:", err);
		}
	}

	async createLearnedPattern(input: {
		pattern_name: string;
		example_phrase: string;
		regex_pattern?: string;
		target_intent?: string;
		classification?: string;
		confidence?: number;
		learned_by?: string;
	}) {
		try {
			const res = await fetch("/api/learned-patterns", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input)
			});
			if (res.ok) {
				const pat = await res.json();
				await this.fetchLearnedPatterns();
				return { success: true, pattern: pat };
			} else {
				const err = await res.json();
				return { success: false, error: err.error || "Failed to learn pattern" };
			}
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	async deleteLearnedPattern(id: number) {
		try {
			const res = await fetch(`/api/learned-patterns/${id}`, {
				method: "DELETE"
			});
			if (res.ok) {
				this.learnedPatterns = this.learnedPatterns.filter(p => p.id !== id);
				return { success: true };
			}
		} catch (err) {
			console.error("Failed to delete pattern:", err);
		}
		return { success: false };
	}

	async stageTicketFromMessage(messageId: number, documentNo: string, proposedValue?: string) {
		try {
			const res = await fetch(`/api/inbound-messages/${messageId}/stage-ticket`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					document_no: documentNo,
					proposed_value: proposedValue
				})
			});
			if (res.ok) {
				const ticket = await res.json();
				await this.fetchTickets();
				await this.fetchInboundMessages();
				return { success: true, ticket };
			} else {
				const err = await res.json();
				return { success: false, error: err.error || "Failed to stage ticket" };
			}
		} catch (err: any) {
			return { success: false, error: err.message };
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

	private lastTelemetryFetch = 0;
	private telemetryInFlight: Promise<void> | null = null;

	async fetchTelemetry(force = false) {
		const now = Date.now();
		if (!force && now - this.lastTelemetryFetch < 3000) {
			return; // Throttled to prevent redundant parallel network calls
		}
		if (this.telemetryInFlight) {
			return this.telemetryInFlight;
		}

		this.telemetryInFlight = (async () => {
			try {
				this.lastTelemetryFetch = Date.now();
				this.checkWhatsAppGatewayStatus();
				const [telRes, gwRes, dbRes, llmRes] = await Promise.allSettled([
					fetch("/api/telemetry"),
					fetch("/api/gateway/status"),
					fetch("/api/database/config"),
					fetch("/api/llm/config")
				]);

				if (telRes.status === "fulfilled" && telRes.value.ok) {
					this.telemetry = await telRes.value.json();
				}
				if (gwRes.status === "fulfilled" && gwRes.value.ok) {
					const gwData = await gwRes.value.json();
					this.isGatewayRunning = !!gwData.running;
				}
				if (dbRes.status === "fulfilled" && dbRes.value.ok) {
					this.dbConfig = await dbRes.value.json();
				}
				if (llmRes.status === "fulfilled" && llmRes.value.ok) {
					this.llmConfig = await llmRes.value.json();
				}
			} catch (err) {
				console.error("Failed to fetch telemetry:", err);
			} finally {
				this.telemetryInFlight = null;
			}
		})();

		return this.telemetryInFlight;
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
				sound.playInboundPing();
			});
			this.eventSource.addEventListener("ticket_approved", (e) => {
				const updated: Ticket = JSON.parse(e.data);
				this.tickets = this.tickets.map(t => t.id === updated.id ? updated : t);
				this.fetchAuditLogs();
				sound.playActionChime();
			});
			this.eventSource.addEventListener("ticket_rejected", (e) => {
				const updated: Ticket = JSON.parse(e.data);
				this.tickets = this.tickets.map(t => t.id === updated.id ? updated : t);
				this.fetchAuditLogs();
				sound.playAlertChime();
			});
			this.eventSource.addEventListener("inbound_message", (e) => {
				const newMsg: InboundMessage = JSON.parse(e.data);
				this.inboundMessages = [newMsg, ...this.inboundMessages.filter(m => m.id !== newMsg.id)];
				this.recordPlatformEvent(newMsg.platform as ChatPlatform);
				sound.playInboundPing();
			});
			this.eventSource.addEventListener("inbound_message_updated", (e) => {
				const updatedMsg: InboundMessage = JSON.parse(e.data);
				this.inboundMessages = this.inboundMessages.map(m => m.id === updatedMsg.id ? updatedMsg : m);
			});
			this.eventSource.addEventListener("pattern_learned", (e) => {
				const pat: LearnedPattern = JSON.parse(e.data);
				this.learnedPatterns = [pat, ...this.learnedPatterns.filter(p => p.id !== pat.id)];
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
