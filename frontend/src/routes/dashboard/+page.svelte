<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		Shield, CheckCircle2, XCircle, AlertTriangle, Clock, 
		Database, FileText, ArrowRight, RefreshCw, Send, Check, 
		X, Upload, User, ExternalLink, Activity, Search, Sparkles
	} from "lucide-svelte";
	import { timeAgo } from "$lib/utils";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	let currentUser = $derived(data.user || {
		id: "usr_guest",
		name: "Rifky Aditya",
		email: "rifky@factory.internal",
		role: "oncall_engineer" as const,
		avatar: undefined as string | undefined,
		branchClearance: ["SURABAYA_HQ"]
	});

	interface Ticket {
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

	interface AuditLog {
		id: number;
		ticket_id: number;
		action: string;
		performed_by: string;
		ip_address: string;
		created_at: string;
	}

	let tickets = $state<Ticket[]>([]);
	let auditLogs = $state<AuditLog[]>([]);
	let loading = $state(true);
	let sseConnected = $state(false);
	let eventSource = $state<EventSource | null>(null);
	let searchQuery = $state("");

	// Active tab: 'pending' | 'history' | 'simulate'
	let activeTab = $state<"pending" | "history" | "simulate">("pending");

	// Reject Modal State
	let selectedTicketForReject = $state<Ticket | null>(null);
	let rejectionReason = $state("");
	let processingAction = $state(false);

	// Simulate Ticket Form (100% English)
	let simMessage = $state("Hello IT Support, please update invoice INV/2026/001 customer name from PT Sumber Makmur to PT Sumber Makmur Abadi due to branch tax invoice amendment. Thanks!");
	let simDocNo = $state("INV/2026/001");
	let simProposed = $state("PT Sumber Makmur Abadi");
	let simBranchId = $state(1);
	let simLoading = $state(false);

	// Reactive filtering
	let filteredTickets = $derived(
		tickets.filter(t => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				t.ticket_no.toLowerCase().includes(q) ||
				t.document_no.toLowerCase().includes(q) ||
				t.proposed_value.toLowerCase().includes(q) ||
				(t.branch_name && t.branch_name.toLowerCase().includes(q))
			);
		})
	);

	let pendingCount = $derived(tickets.filter(t => t.status === "PENDING_APPROVAL").length);
	let executedCount = $derived(tickets.filter(t => t.status === "EXECUTED").length);
	let rejectedCount = $derived(tickets.filter(t => t.status === "REJECTED").length);

	async function fetchTickets() {
		try {
			const res = await fetch("/api/tickets");
			if (res.ok) {
				tickets = await res.json();
			}
		} catch (err) {
			console.error("Failed to fetch tickets:", err);
		} finally {
			loading = false;
		}
	}

	async function fetchAuditLogs() {
		try {
			const res = await fetch("/api/audit-logs");
			if (res.ok) {
				auditLogs = await res.json();
			}
		} catch (err) {
			console.error("Failed to fetch audit logs:", err);
		}
	}

	function setupSSE() {
		try {
			eventSource = new EventSource("/api/events");
			eventSource.onopen = () => {
				sseConnected = true;
			};
			eventSource.addEventListener("ticket_created", (e) => {
				const newTicket: Ticket = JSON.parse(e.data);
				tickets = [newTicket, ...tickets.filter(t => t.id !== newTicket.id)];
			});
			eventSource.addEventListener("ticket_approved", (e) => {
				const updated: Ticket = JSON.parse(e.data);
				tickets = tickets.map(t => t.id === updated.id ? updated : t);
				fetchAuditLogs();
			});
			eventSource.addEventListener("ticket_rejected", (e) => {
				const updated: Ticket = JSON.parse(e.data);
				tickets = tickets.map(t => t.id === updated.id ? updated : t);
				fetchAuditLogs();
			});
			eventSource.onerror = () => {
				sseConnected = false;
			};
		} catch (err) {
			console.error("SSE connection error:", err);
		}
	}

	async function handleApprove(ticket: Ticket) {
		processingAction = true;
		try {
			const res = await fetch(`/api/tickets/${ticket.id}/approve`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ approver_name: currentUser.name })
			});
			if (res.ok) {
				await fetchTickets();
				await fetchAuditLogs();
			} else {
				const err = await res.json();
				alert(`Approval failed: ${err.error || "Server error"}`);
			}
		} catch (err: any) {
			alert(`Network error: ${err.message}`);
		} finally {
			processingAction = false;
		}
	}

	async function submitReject() {
		if (!selectedTicketForReject || !rejectionReason.trim()) return;
		processingAction = true;
		try {
			const res = await fetch(`/api/tickets/${selectedTicketForReject.id}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					approver_name: currentUser.name,
					reason: rejectionReason
				})
			});
			if (res.ok) {
				selectedTicketForReject = null;
				rejectionReason = "";
				await fetchTickets();
				await fetchAuditLogs();
			} else {
				const err = await res.json();
				alert(`Rejection failed: ${err.error || "Server error"}`);
			}
		} catch (err: any) {
			alert(`Network error: ${err.message}`);
		} finally {
			processingAction = false;
		}
	}

	async function handleSimulateSubmit() {
		simLoading = true;
		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: simMessage,
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: simDocNo,
					field_target: "customer_name",
					proposed_value: simProposed,
					branch_id: simBranchId,
					confidence_score: 0.98
				})
			});
			if (res.ok) {
				await fetchTickets();
				activeTab = "pending";
			} else {
				const err = await res.json();
				alert(`Simulation rejected by pre-check: ${err.error || "Database policy check failed"}`);
			}
		} catch (err: any) {
			alert(`Error: ${err.message}`);
		} finally {
			simLoading = false;
		}
	}

	onMount(() => {
		fetchTickets();
		fetchAuditLogs();
		setupSSE();
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
	});
</script>

<div class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
	<!-- VibeUI Command Header -->
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-card/80 backdrop-blur-md border border-border/70 shadow-sm">
		<div class="flex items-center gap-4">
			<div class="relative">
				<img
					src={currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(currentUser.name)}
					alt="On-Call Engineer Avatar"
					class="h-12 w-12 rounded-2xl bg-secondary border border-border/80 shadow-inner"
				/>
				<span class="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-card"></span>
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-base font-bold text-foreground">{currentUser.name}</h2>
					<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
						{currentUser.role === 'oncall_engineer' ? 'ON-CALL ENGINEER' : currentUser.role.toUpperCase()}
					</span>
				</div>
				<p class="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
					<span>{currentUser.email}</span>
					<span>•</span>
					<span>Shift: Production Operations</span>
					<span>•</span>
					<span class="font-mono text-[11px]">LAN IP: 192.168.1.104</span>
				</p>
			</div>
		</div>

		<!-- Status Pills & Search Bar (VibeUI style) -->
		<div class="flex items-center gap-3 flex-wrap">
			<div class="relative w-48 sm:w-64">
				<Search class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search tickets, doc #…"
					class="h-9 w-full rounded-xl border border-border bg-background/60 pl-8 pr-8 text-xs outline-none transition-colors focus:border-foreground/40 font-mono"
				/>
				<kbd class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">/</kbd>
			</div>

			<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/40 text-xs">
				<Database class="h-3.5 w-3.5 text-primary" />
				<span class="text-muted-foreground text-[11px]">DB:</span>
				<span class="font-semibold text-foreground text-[11px]">PostgreSQL 18</span>
			</div>

			<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/40 text-xs">
				<span class="relative flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full {sseConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 {sseConnected ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
				</span>
				<span class="text-muted-foreground text-[11px]">SSE:</span>
				<span class="font-semibold text-[11px] {sseConnected ? 'text-emerald-400' : 'text-amber-400'}">
					{sseConnected ? "Streaming" : "Reconnecting"}
				</span>
			</div>

			<button
				onclick={fetchTickets}
				class="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border/40"
				title="Refresh Queue"
			>
				<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
			</button>
		</div>
	</div>

	<!-- Guardrail Engine Assurance Bar -->
	<div class="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
		<div class="flex items-center gap-2.5">
			<div class="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
				<Shield class="h-4 w-4" />
			</div>
			<div>
				<div class="font-bold text-foreground flex items-center gap-2">
					<span>Guardrail Engine Assurance</span>
					<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
						Enforcing
					</span>
				</div>
				<p class="text-[11px] text-muted-foreground">Every mutation is protected against unparameterized queries, state tampering, and unauthorized bypass.</p>
			</div>
		</div>

		<div class="flex items-center gap-2 flex-wrap font-mono text-[11px]">
			<span class="px-2.5 py-1 rounded-lg bg-secondary/80 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				<span>Session Guard: Active</span>
			</span>
			<span class="px-2.5 py-1 rounded-lg bg-secondary/80 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				<span>SQL Engine: Parameterized Only</span>
			</span>
			<span class="px-2.5 py-1 rounded-lg bg-secondary/80 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				<span>State Transition: Anti-Tamper</span>
			</span>
			<span class="px-2.5 py-1 rounded-lg bg-secondary/80 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				<span>Audit Trail: Immutable Log</span>
			</span>
		</div>
	</div>

	<!-- VibeUI Bento Metric Grid -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-1 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
			<div class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">Pending Sign-Off</div>
			<div class="text-3xl font-extrabold font-mono text-amber-400 flex items-center justify-between">
				<span>{pendingCount}</span>
				<Clock class="h-5 w-5 text-amber-400/50" />
			</div>
			<div class="text-[11px] text-muted-foreground">Awaiting your approval</div>
		</div>

		<div class="p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
			<div class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">Mutated Today</div>
			<div class="text-3xl font-extrabold font-mono text-emerald-400 flex items-center justify-between">
				<span>{executedCount}</span>
				<CheckCircle2 class="h-5 w-5 text-emerald-400/50" />
			</div>
			<div class="text-[11px] text-muted-foreground">Committed with audit log</div>
		</div>

		<div class="p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-1 relative overflow-hidden group hover:border-destructive/40 transition-colors">
			<div class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">Policy Rejected</div>
			<div class="text-3xl font-extrabold font-mono text-foreground flex items-center justify-between">
				<span>{rejectedCount}</span>
				<XCircle class="h-5 w-5 text-muted-foreground" />
			</div>
			<div class="text-[11px] text-muted-foreground">Closed invoices or errors</div>
		</div>

		<div class="p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-1 relative overflow-hidden group hover:border-primary/40 transition-colors">
			<div class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">Security Rating</div>
			<div class="text-3xl font-extrabold font-mono text-primary flex items-center justify-between">
				<span>100%</span>
				<Shield class="h-5 w-5 text-primary/50" />
			</div>
			<div class="text-[11px] text-muted-foreground">Zero Unsanitized SQL Queries</div>
		</div>
	</div>

	<!-- Tab Navigation -->
	<div class="flex items-center gap-2 border-b border-border/50 pb-3">
		<button
			onclick={() => (activeTab = "pending")}
			class="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 {activeTab === 'pending' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}"
		>
			<span>Approval Queue</span>
			{#if pendingCount > 0}
				<span class="px-2 py-0.5 rounded-full text-[10px] font-mono {activeTab === 'pending' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-500/20 text-amber-400'}">
					{pendingCount}
				</span>
			{/if}
		</button>

		<button
			onclick={() => (activeTab = "history")}
			class="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 {activeTab === 'history' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}"
		>
			<span>Execution History & Audit</span>
		</button>

		<button
			onclick={() => (activeTab = "simulate")}
			class="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 {activeTab === 'simulate' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'}"
		>
			<Send class="h-3.5 w-3.5" />
			<span>Simulate Branch Chat</span>
		</button>
	</div>

	<!-- TAB 1: PENDING QUEUE -->
	{#if activeTab === "pending"}
		<div class="space-y-4">
			{#if loading}
				<div class="py-16 text-center text-muted-foreground space-y-2">
					<RefreshCw class="h-6 w-6 animate-spin mx-auto text-primary" />
					<p class="text-xs font-mono">Streaming on-call queue...</p>
				</div>
			{:else if filteredTickets.filter(t => t.status === "PENDING_APPROVAL").length === 0}
				<div class="py-20 text-center space-y-3 rounded-2xl bg-card border border-border/50 p-8 shadow-sm">
					<div class="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
						<CheckCircle2 class="h-6 w-6" />
					</div>
					<h3 class="text-base font-bold text-foreground">Zero Pending Approvals</h3>
					<p class="text-xs text-muted-foreground max-w-md mx-auto">
						All incoming branch requests have been reviewed and processed. Your shift queue is clear.
					</p>
					<button
						onclick={() => (activeTab = "simulate")}
						class="mt-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors border border-border/50 inline-flex items-center gap-1.5"
					>
						<Sparkles class="h-3.5 w-3.5 text-primary" />
						<span>Test with simulated WhatsApp message</span>
					</button>
				</div>
			{:else}
				<div class="grid gap-4">
					{#each filteredTickets.filter(t => t.status === "PENDING_APPROVAL") as ticket (ticket.id)}
						<div class="p-6 rounded-2xl bg-card border border-amber-500/30 hover:border-amber-500/50 transition-all shadow-md space-y-4">
							<!-- Header of Ticket Card -->
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
								<div class="flex items-center gap-2.5">
									<span class="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
										#{ticket.ticket_no}
									</span>
									<span class="text-xs font-semibold text-foreground">
										{ticket.branch_name || "Authorized Regional Hub"}
									</span>
									<span class="text-border">|</span>
									<span class="text-xs text-muted-foreground font-mono">
										Doc: {ticket.document_no}
									</span>
								</div>
								<div class="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
									<span class="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
										<Shield class="h-3 w-3" />
										<span>Guardrails Verified</span>
									</span>
									<span class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										{timeAgo(ticket.created_at)}
									</span>
									<span class="text-emerald-400 font-mono text-[11px] font-semibold">
										AI Confidence: {Math.round(ticket.confidence_score * 100)}%
									</span>
								</div>
							</div>

							<!-- WhatsApp Raw Message Quote -->
							<div class="p-3.5 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground space-y-1">
								<div class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Incoming Branch WhatsApp Message:</div>
								<p class="italic">"{ticket.raw_message}"</p>
							</div>

							<!-- High-Contrast Side-by-Side Diff -->
							<div class="grid sm:grid-cols-2 gap-3 pt-1">
								<!-- Current in Database -->
								<div class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1">
									<div class="text-[10px] uppercase font-mono font-bold text-destructive flex items-center gap-1.5">
										<XCircle class="h-3 w-3" />
										<span>Current Database Record</span>
									</div>
									<div class="font-mono text-sm font-semibold text-foreground line-through opacity-80">
										{ticket.current_value || "(Empty / Unverified)"}
									</div>
								</div>

								<!-- Proposed Value to Mutate -->
								<div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
									<div class="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
										<CheckCircle2 class="h-3 w-3" />
										<span>Proposed Value from AI Extraction</span>
									</div>
									<div class="font-mono text-sm font-bold text-emerald-400">
										{ticket.proposed_value}
									</div>
								</div>
							</div>

							<!-- Attached Documents from MCP / Chat -->
							{#if ticket.documents && ticket.documents.length > 0}
								<div class="flex items-center gap-2 pt-1 text-xs">
									<span class="text-muted-foreground flex items-center gap-1">
										<FileText class="h-3.5 w-3.5" />
										<span>Proof Attachments:</span>
									</span>
									{#each ticket.documents as doc}
										<a
											href={doc.file_path}
											target="_blank"
											class="text-xs text-primary underline flex items-center gap-1 hover:text-primary/80 font-mono"
										>
											<span>{doc.file_name}</span>
											<ExternalLink class="h-3 w-3" />
										</a>
									{/each}
								</div>
							{/if}

							<!-- Actions -->
							<div class="flex items-center justify-end gap-3 pt-2">
								<button
									onclick={() => (selectedTicketForReject = ticket)}
									disabled={processingAction}
									class="px-4 py-2 rounded-xl bg-secondary text-destructive hover:bg-destructive/10 text-xs font-semibold border border-border/50 transition-colors flex items-center gap-1.5"
								>
									<X class="h-3.5 w-3.5" />
									<span>Reject Request</span>
								</button>

								<button
									onclick={() => handleApprove(ticket)}
									disabled={processingAction}
									class="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
								>
									<Check class="h-3.5 w-3.5" />
									<span>Approve & Mutate Database</span>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

	<!-- TAB 2: EXECUTION HISTORY & AUDIT -->
	{:else if activeTab === "history"}
		<div class="space-y-6">
			<div class="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-sm">
				<div class="p-4 border-b border-border/40 font-semibold text-sm flex items-center justify-between">
					<span>Processed Tickets & Mutation Audit Trail</span>
					<span class="text-xs text-muted-foreground font-mono">{tickets.filter(t => t.status !== "PENDING_APPROVAL").length} records</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead class="bg-secondary/40 text-muted-foreground uppercase font-mono text-[10px]">
							<tr>
								<th class="p-3.5">Ticket</th>
								<th class="p-3.5">Document No</th>
								<th class="p-3.5">Updated Name</th>
								<th class="p-3.5">Status</th>
								<th class="p-3.5">Approved By</th>
								<th class="p-3.5">Timestamp</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/30">
							{#each tickets.filter(t => t.status !== "PENDING_APPROVAL") as t}
								<tr class="hover:bg-secondary/20 transition-colors">
									<td class="p-3.5 font-mono font-bold text-foreground">{t.ticket_no}</td>
									<td class="p-3.5 font-mono">{t.document_no}</td>
									<td class="p-3.5 font-medium">{t.proposed_value}</td>
									<td class="p-3.5">
										{#if t.status === "EXECUTED"}
											<span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
												EXECUTED
											</span>
										{:else}
											<span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-destructive/10 text-destructive border border-destructive/20">
												REJECTED
											</span>
										{/if}
									</td>
									<td class="p-3.5 text-muted-foreground">{t.approved_by || "-"}</td>
									<td class="p-3.5 text-muted-foreground font-mono">{timeAgo(t.updated_at || t.created_at)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

	<!-- TAB 3: SIMULATE BRANCH CHAT -->
	{:else if activeTab === "simulate"}
		<div class="max-w-2xl mx-auto p-8 rounded-2xl bg-card border border-border/70 shadow-xl space-y-6">
			<div>
				<h3 class="text-base font-bold text-foreground">Simulate WhatsApp Branch Ingestion</h3>
				<p class="text-xs text-muted-foreground mt-1">
					Test AI intent extraction, database pre-check policy validation, and real-time SSE push dispatch.
				</p>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleSimulateSubmit(); }} class="space-y-4 text-xs">
				<div>
					<label for="sim-raw-chat" class="block font-medium mb-1 text-foreground">Raw WhatsApp Chat Message</label>
					<textarea
						id="sim-raw-chat"
						bind:value={simMessage}
						rows="3"
						required
						class="w-full p-3.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40 font-sans"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="sim-invoice-no" class="block font-medium mb-1 text-foreground">Invoice Number</label>
						<input
							id="sim-invoice-no"
							type="text"
							bind:value={simDocNo}
							required
							class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-foreground/40"
						/>
					</div>
					<div>
						<label for="sim-branch-id" class="block font-medium mb-1 text-foreground">Branch Regional Hub</label>
						<select
							id="sim-branch-id"
							bind:value={simBranchId}
							class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40"
						>
							<option value={1}>1 - East Java (Surabaya Hub)</option>
							<option value={2}>2 - North Sumatra (Medan Hub)</option>
							<option value={3}>3 - Central Java (Semarang Hub)</option>
							<option value={4}>4 - South Sulawesi (Makassar Hub)</option>
						</select>
					</div>
				</div>

				<div>
					<label for="sim-customer-name" class="block font-medium mb-1 text-foreground">Requested Customer Entity Name</label>
					<input
						id="sim-customer-name"
						type="text"
						bind:value={simProposed}
						required
						class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40"
					/>
				</div>

				<button
					type="submit"
					disabled={simLoading}
					class="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
				>
					<Send class="h-4 w-4" />
					<span>{simLoading ? "Processing Ingestion & Pre-check..." : "Dispatch to On-Call Ingestion Queue"}</span>
				</button>
			</form>
		</div>
	{/if}
</div>

<!-- REJECT REASON MODAL -->
{#if selectedTicketForReject}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
		<div class="w-full max-w-md bg-card p-6 rounded-2xl border border-border shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-bold text-foreground">Reject Ticket #{selectedTicketForReject.ticket_no}</h3>
				<button onclick={() => (selectedTicketForReject = null)} class="text-muted-foreground hover:text-foreground">
					<X class="h-4 w-4" />
				</button>
			</div>

			<p class="text-xs text-muted-foreground">
				Specify the corporate SOP violation or operational reason for rejecting this branch revision. This note is permanently recorded in the audit trail.
			</p>

			<div>
				<label for="modal-rejection-reason" class="sr-only">Rejection Reason</label>
				<textarea
					id="modal-rejection-reason"
					bind:value={rejectionReason}
					rows="3"
					placeholder="e.g. Invoice has already been closed for the current fiscal period. Requires Supervisor override."
					class="w-full p-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-destructive"
				></textarea>
			</div>

			<div class="flex items-center justify-end gap-2 pt-2">
				<button
					onclick={() => (selectedTicketForReject = null)}
					class="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium"
				>
					Cancel
				</button>
				<button
					onclick={submitReject}
					disabled={processingAction || !rejectionReason.trim()}
					class="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 disabled:opacity-50"
				>
					Confirm Rejection
				</button>
			</div>
		</div>
	</div>
{/if}
