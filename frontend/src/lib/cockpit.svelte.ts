// Cockpit Shared State (Svelte 5 Runes)
// Provides unified SSE, ticket cache, audit logs, and telemetry across all dashboard views.

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

class CockpitState {
	tickets = $state<Ticket[]>([]);
	auditLogs = $state<AuditLog[]>([]);
	telemetry = $state<TelemetryData | null>(null);
	loading = $state(true);
	sseConnected = $state(false);
	eventSource = $state<EventSource | null>(null);
	
	// Database engine architecture mode
	dbEngineMode = $state<"relational" | "non_relational">("relational");
	
	// WhatsApp ChatOps Active State (Focus on WhatsApp)
	chatPlatform = $state<"whatsapp">("whatsapp");

	// Reactive counts
	pendingCount = $derived(this.tickets.filter(t => t.status === "PENDING_APPROVAL").length);
	executedCount = $derived(this.tickets.filter(t => t.status === "EXECUTED").length);
	rejectedCount = $derived(this.tickets.filter(t => t.status === "REJECTED").length);

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
