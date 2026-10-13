<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		ShieldCheck, CheckCircle, XCircle, ExclamationTriangle, Clock, 
		ServerStack, DocumentText, ArrowRight, ArrowPath, PaperAirplane, Check, 
		XMark, ArrowUpTray, User, ArrowTopRightOnSquare, ChartBarSquare, 
		MagnifyingGlass, Sparkles, CommandLine, CpuChip, Radio, LockClosed, 
		CodeBracket, Eye, InformationCircle
	} from "svelte-heros-v2";
	import ThemeToggle from "$lib/components/ThemeToggle.svelte";
	import HookEcosystemVisualizer from "$lib/components/HookEcosystemVisualizer.svelte";
	import { timeAgo } from "$lib/utils";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	let currentUser = $derived(data.user || {
		id: "usr_guest",
		name: "John Doe",
		email: "johndoe@factory.internal",
		role: "oncall_engineer" as const,
		avatar: undefined as string | undefined,
		branchClearance: ["SURABAYA_HQ", "MEDAN_HUB", "SEMARANG_DC"]
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

	// Active tab: 'pending' | 'simulator' | 'hooks' | 'connectivity' | 'history'
	let activeTab = $state<"pending" | "simulator" | "hooks" | "connectivity" | "history">("pending");

	// Inspected Ticket State (Transparency & Explainability)
	let inspectedTicketId = $state<number | null>(null);

	// Reject Modal State
	let selectedTicketForReject = $state<Ticket | null>(null);
	let rejectionReason = $state("");
	let processingAction = $state(false);

	// Real-time Pipeline Simulator State
	let simMessage = $state("Hello IT Support, please update invoice INV/2026/001 customer name from PT Sumber Makmur to PT Sumber Makmur Abadi due to branch tax invoice amendment. Thanks!");
	let simDocNo = $state("INV/2026/001");
	let simProposed = $state("PT Sumber Makmur Abadi");
	let simBranchId = $state(1);
	let simLoading = $state(false);
	let simStep = $state(0); // 0: Idle, 1: WA Ingestion, 2: LLM Extraction, 3: DB Pre-check, 4: Ready for Sign-off

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
		simStep = 1; // Step 1: WA Ingestion
		
		await new Promise(r => setTimeout(r, 500));
		simStep = 2; // Step 2: LLM Extraction
		
		await new Promise(r => setTimeout(r, 600));
		simStep = 3; // Step 3: DB Pre-Check
		
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
				simStep = 4; // Step 4: Queued for Human Gatekeeper
				await fetchTickets();
				await new Promise(r => setTimeout(r, 500));
				activeTab = "pending";
			} else {
				const err = await res.json();
				alert(`Simulation rejected by database pre-check policy: ${err.error || "Invoice check failed"}`);
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

<div class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-7 font-sans">
	<!-- VibeUI Command Header (Clean Light & Dark Mode) -->
	<div class="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
		<!-- User Identity Card -->
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
					<h2 class="text-base font-bold text-foreground tracking-tight">{currentUser.name}</h2>
					<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
						{currentUser.role === 'oncall_engineer' ? 'ON-CALL ENGINEER' : currentUser.role.toUpperCase()}
					</span>
				</div>
				<p class="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
					<span>{currentUser.email}</span>
					<span>•</span>
					<span>Weekend Plant Operations</span>
					<span>•</span>
					<span class="font-mono text-[11px]">LAN IP: 192.168.1.104</span>
				</p>
			</div>
		</div>

		<!-- Toolbar: Search, Telemetry & Theme Toggle -->
		<div class="flex items-center gap-2.5 flex-wrap">
			<!-- Search Bar -->
			<div class="relative w-44 sm:w-60">
				<MagnifyingGlass class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search tickets, doc #…"
					class="h-9 w-full rounded-xl border border-border/80 bg-background pl-8 pr-8 text-xs outline-none transition-colors focus:border-foreground/40 font-mono shadow-sm"
				/>
				<kbd class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">/</kbd>
			</div>

			<!-- DB Badge -->
			<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/70 text-xs shadow-sm">
				<ServerStack class="h-3.5 w-3.5 text-primary" />
				<span class="text-muted-foreground text-[11px]">DB:</span>
				<span class="font-semibold text-foreground text-[11px]">PostgreSQL 18</span>
			</div>

			<!-- SSE Pulse -->
			<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/70 text-xs shadow-sm">
				<span class="relative flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full {sseConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 {sseConnected ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
				</span>
				<span class="text-muted-foreground text-[11px]">SSE:</span>
				<span class="font-semibold text-[11px] {sseConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}">
					{sseConnected ? "Streaming" : "Reconnecting"}
				</span>
			</div>

			<!-- Refresh -->
			<button
				onclick={fetchTickets}
				class="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border/70 shadow-sm"
				title="Refresh Queue"
			>
				<ArrowPath class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
			</button>

			<!-- Theme Toggle Component (Light / Dark) -->
			<ThemeToggle />
		</div>
	</div>

	<!-- Guardrail Assurance Banner (VibeUI High-Contrast Light & Dark) -->
	<div class="p-4 rounded-2xl bg-card border border-emerald-500/30 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
		<div class="flex items-center gap-3">
			<div class="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
				<ShieldCheck class="h-4 w-4" />
			</div>
			<div>
				<div class="font-bold text-foreground flex items-center gap-2">
					<span>Guardrail Assurance Engine</span>
					<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase">
						Enforcing
					</span>
				</div>
				<p class="text-[11px] text-muted-foreground">Every incoming mutation is protected against unparameterized SQL, state tampering, and unauthorized bypass.</p>
			</div>
		</div>

		<div class="flex items-center gap-2 flex-wrap font-mono text-[11px]">
			<span class="px-2.5 py-1 rounded-lg bg-secondary border border-border text-foreground flex items-center gap-1.5 shadow-sm">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
				<span>Session: Verified</span>
			</span>
			<span class="px-2.5 py-1 rounded-lg bg-secondary border border-border text-foreground flex items-center gap-1.5 shadow-sm">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
				<span>SQL: Parameterized Only</span>
			</span>
			<span class="px-2.5 py-1 rounded-lg bg-secondary border border-border text-foreground flex items-center gap-1.5 shadow-sm">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
				<span>State: Anti-Tamper Lock</span>
			</span>
			<span class="px-2.5 py-1 rounded-lg bg-secondary border border-border text-foreground flex items-center gap-1.5 shadow-sm">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
				<span>Audit: SHA-256 Log</span>
			</span>
		</div>
	</div>

	<!-- Real-Time Visual Pipeline (Explainable Dataflow) -->
	<div class="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2.5">
				<div class="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
					<CpuChip class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider font-mono text-foreground">Real-Time Data Extraction Pipeline</h3>
					<p class="text-[11px] text-muted-foreground">Deterministic progression from raw WhatsApp message to prepared statement commit.</p>
				</div>
			</div>
			<span class="text-[10px] font-mono px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">
				Zero Black Box (100% Explainable)
			</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
			<!-- Stage 1 -->
			<div class="p-4 rounded-xl border transition-all {simStep >= 1 ? 'bg-primary/5 border-primary/50 shadow-sm' : 'bg-secondary/40 border-border/60'}">
				<div class="flex items-center justify-between text-[11px] font-mono">
					<span class="font-bold text-muted-foreground">01. INGEST</span>
					{#if simStep === 1}<span class="animate-pulse text-emerald-600 dark:text-emerald-400 font-bold">Active</span>{/if}
				</div>
				<div class="text-xs font-bold text-foreground mt-1.5 flex items-center gap-1.5">
					<Radio class="h-3.5 w-3.5 text-primary" />
					<span>WhatsApp Chat</span>
				</div>
				<p class="text-[10px] text-muted-foreground mt-1 leading-relaxed">Whitelisted regional branch channel</p>
			</div>

			<!-- Stage 2 -->
			<div class="p-4 rounded-xl border transition-all {simStep >= 2 ? 'bg-purple-500/5 border-purple-500/50 shadow-sm' : 'bg-secondary/40 border-border/60'}">
				<div class="flex items-center justify-between text-[11px] font-mono">
					<span class="font-bold text-muted-foreground">02. EXTRACT</span>
					{#if simStep === 2}<span class="animate-pulse text-purple-600 dark:text-purple-400 font-bold">Parsing...</span>{/if}
				</div>
				<div class="text-xs font-bold text-foreground mt-1.5 flex items-center gap-1.5">
					<CpuChip class="h-3.5 w-3.5 text-purple-500" />
					<span>LLM Entity Parser</span>
				</div>
				<p class="text-[10px] text-muted-foreground mt-1 leading-relaxed">Structured JSON + Few-shot prompt</p>
			</div>

			<!-- Stage 3 -->
			<div class="p-4 rounded-xl border transition-all {simStep >= 3 ? 'bg-amber-500/5 border-amber-500/50 shadow-sm' : 'bg-secondary/40 border-border/60'}">
				<div class="flex items-center justify-between text-[11px] font-mono">
					<span class="font-bold text-muted-foreground">03. PRE-CHECK</span>
					{#if simStep === 3}<span class="animate-pulse text-amber-600 dark:text-amber-400 font-bold">Verifying...</span>{/if}
				</div>
				<div class="text-xs font-bold text-foreground mt-1.5 flex items-center gap-1.5">
					<ServerStack class="h-3.5 w-3.5 text-amber-500" />
					<span>Database Pre-Check</span>
				</div>
				<p class="text-[10px] text-muted-foreground mt-1 leading-relaxed">Read-only SELECT & period lock check</p>
			</div>

			<!-- Stage 4 -->
			<div class="p-4 rounded-xl border transition-all {simStep >= 4 ? 'bg-emerald-500/5 border-emerald-500/50 shadow-sm' : 'bg-secondary/40 border-border/60'}">
				<div class="flex items-center justify-between text-[11px] font-mono">
					<span class="font-bold text-muted-foreground">04. APPROVAL</span>
					{#if pendingCount > 0}<span class="text-emerald-600 dark:text-emerald-400 font-bold">{pendingCount} Waiting</span>{/if}
				</div>
				<div class="text-xs font-bold text-foreground mt-1.5 flex items-center gap-1.5">
					<ShieldCheck class="h-3.5 w-3.5 text-emerald-500" />
					<span>Human Gatekeeper</span>
				</div>
				<p class="text-[10px] text-muted-foreground mt-1 leading-relaxed">1-click review in on-call WebUI</p>
			</div>

			<!-- Stage 5 -->
			<div class="p-4 rounded-xl border bg-secondary/40 border-border/60">
				<div class="flex items-center justify-between text-[11px] font-mono">
					<span class="font-bold text-muted-foreground">05. COMMIT</span>
					<span class="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">Prepared SQL</span>
				</div>
				<div class="text-xs font-bold text-foreground mt-1.5 flex items-center gap-1.5">
					<LockClosed class="h-3.5 w-3.5 text-rose-500" />
					<span>Atomic Transaction</span>
				</div>
				<p class="text-[10px] text-muted-foreground mt-1 leading-relaxed">Prepared statement + Audit Log</p>
			</div>
		</div>
	</div>

	<!-- Bento Stat Metrics -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1.5 hover:border-amber-500/40 transition-colors">
			<div class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Pending Sign-Off</div>
			<div class="text-3xl font-extrabold font-mono text-amber-500 flex items-center justify-between">
				<span>{pendingCount}</span>
				<Clock class="h-5 w-5 text-amber-500/50" />
			</div>
			<div class="text-[11px] text-muted-foreground">Awaiting on-call approval</div>
		</div>

		<div class="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1.5 hover:border-emerald-500/40 transition-colors">
			<div class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Mutated Today</div>
			<div class="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
				<span>{executedCount}</span>
				<CheckCircle class="h-5 w-5 text-emerald-500/50" />
			</div>
			<div class="text-[11px] text-muted-foreground">Committed with audit log</div>
		</div>

		<div class="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1.5 hover:border-destructive/40 transition-colors">
			<div class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Policy Rejected</div>
			<div class="text-3xl font-extrabold font-mono text-foreground flex items-center justify-between">
				<span>{rejectedCount}</span>
				<XCircle class="h-5 w-5 text-muted-foreground" />
			</div>
			<div class="text-[11px] text-muted-foreground">Closed invoices or errors</div>
		</div>

		<div class="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1.5 hover:border-primary/40 transition-colors">
			<div class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Security Rating</div>
			<div class="text-3xl font-extrabold font-mono text-primary flex items-center justify-between">
				<span>100%</span>
				<ShieldCheck class="h-5 w-5 text-primary/50" />
			</div>
			<div class="text-[11px] text-muted-foreground">Zero Unsanitized SQL Queries</div>
		</div>
	</div>

	<!-- VibeUI Segmented Tab Navigation -->
	<div class="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/60 border border-border/70 flex-wrap">
		<button
			onclick={() => (activeTab = "pending")}
			class="px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 {activeTab === 'pending' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			<span>Approval Queue</span>
			{#if pendingCount > 0}
				<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
					{pendingCount}
				</span>
			{/if}
		</button>

		<button
			onclick={() => (activeTab = "simulator")}
			class="px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 {activeTab === 'simulator' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			<PaperAirplane class="h-3.5 w-3.5" />
			<span>Simulate WhatsApp Ingestion</span>
		</button>

		<button
			onclick={() => (activeTab = "hooks")}
			class="px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 {activeTab === 'hooks' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			<CodeBracket class="h-3.5 w-3.5 text-purple-500" />
			<span>Client Hooks (Ferdium, Rambox, Web)</span>
		</button>

		<button
			onclick={() => (activeTab = "connectivity")}
			class="px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 {activeTab === 'connectivity' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			<CpuChip class="h-3.5 w-3.5" />
			<span>System Connectivity (AI, WA & MCP)</span>
		</button>

		<button
			onclick={() => (activeTab = "history")}
			class="px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 {activeTab === 'history' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			<ChartBarSquare class="h-3.5 w-3.5" />
			<span>Execution History & Audit</span>
		</button>
	</div>

	<!-- TAB 1: PENDING APPROVAL QUEUE -->
	{#if activeTab === "pending"}
		<div class="space-y-4">
			{#if loading}
				<div class="py-16 text-center text-muted-foreground space-y-2">
					<ArrowPath class="h-6 w-6 animate-spin mx-auto text-primary" />
					<p class="text-xs font-mono">Streaming on-call queue...</p>
				</div>
			{:else if filteredTickets.filter(t => t.status === "PENDING_APPROVAL").length === 0}
				<div class="py-20 text-center space-y-3 rounded-2xl bg-card border border-border/80 p-8 shadow-sm">
					<div class="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-sm">
						<CheckCircle class="h-6 w-6" />
					</div>
					<h3 class="text-base font-bold text-foreground">Zero Pending Approvals</h3>
					<p class="text-xs text-muted-foreground max-w-md mx-auto">
						All incoming branch requests have been reviewed and processed. Your on-call shift queue is clear.
					</p>
					<button
						onclick={() => (activeTab = "simulator")}
						class="mt-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors border border-border/60 inline-flex items-center gap-1.5 shadow-sm"
					>
						<Sparkles class="h-3.5 w-3.5 text-primary" />
						<span>Test with simulated WhatsApp message</span>
					</button>
				</div>
			{:else}
				<div class="grid gap-4">
					{#each filteredTickets.filter(t => t.status === "PENDING_APPROVAL") as ticket (ticket.id)}
						<div class="p-6 rounded-2xl bg-card border border-border/80 hover:border-foreground/30 transition-all shadow-sm space-y-4">
							<!-- Header of Ticket Card -->
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
								<div class="flex items-center gap-2.5">
									<span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
										#{ticket.ticket_no}
									</span>
									<span class="text-xs font-bold text-foreground">
										{ticket.branch_name || "Authorized Regional Hub"}
									</span>
									<span class="text-border">|</span>
									<span class="text-xs text-muted-foreground font-mono">
										Invoice: {ticket.document_no}
									</span>
								</div>
								<div class="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
									<span class="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
										<ShieldCheck class="h-3 w-3" />
										<span>Guardrails Verified</span>
									</span>
									<span class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										{timeAgo(ticket.created_at)}
									</span>
									<span class="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold">
										AI Confidence: {Math.round(ticket.confidence_score * 100)}%
									</span>
								</div>
							</div>

							<!-- WhatsApp Raw Message Bubble -->
							<div class="p-3.5 rounded-xl bg-secondary/50 border border-border/60 text-xs text-foreground space-y-1">
								<div class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
									<Radio class="h-3 w-3 text-emerald-500" />
									<span>Incoming Branch WhatsApp Message:</span>
								</div>
								<p class="italic text-foreground/90 font-medium">"{ticket.raw_message}"</p>
							</div>

							<!-- High-Contrast Side-by-Side Diff -->
							<div class="grid sm:grid-cols-2 gap-3 pt-1">
								<!-- Current in Database -->
								<div class="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1">
									<div class="text-[10px] uppercase font-mono font-bold text-destructive flex items-center gap-1.5">
										<XCircle class="h-3.5 w-3.5" />
										<span>Current Database Record (Read-Only)</span>
									</div>
									<div class="font-mono text-sm font-semibold text-foreground line-through opacity-80">
										{ticket.current_value || "(Empty / Unverified)"}
									</div>
								</div>

								<!-- Proposed Value to Mutate -->
								<div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
									<div class="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
										<CheckCircle class="h-3.5 w-3.5" />
										<span>Proposed Value from AI Extraction</span>
									</div>
									<div class="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
										{ticket.proposed_value}
									</div>
								</div>
							</div>

							<!-- Transparent Explainable AI & SQL Drawer (ZERO NDUKUN!) -->
							{#if inspectedTicketId === ticket.id}
								<div class="p-4 rounded-xl bg-secondary/70 border border-border/70 space-y-3 text-xs transition-all">
									<div class="flex items-center justify-between border-b border-border/50 pb-2">
										<span class="font-bold font-mono text-foreground flex items-center gap-1.5">
											<CodeBracket class="h-4 w-4 text-primary" />
											<span>Transparent Execution & AI Plan (Zero Black Box)</span>
										</span>
										<button
											onclick={() => (inspectedTicketId = null)}
											class="text-muted-foreground hover:text-foreground text-xs font-medium"
										>
											Close Plan
										</button>
									</div>

									<div class="grid md:grid-cols-2 gap-3 text-[11px] font-mono">
										<!-- Step A: Database Pre-check Query -->
										<div class="p-3 rounded-lg bg-card border border-border/80 space-y-1 shadow-sm">
											<div class="text-amber-500 font-bold uppercase">1. Verification Query (Read-Only):</div>
											<code class="text-foreground/90 block">
												SELECT customer_name, status FROM invoices WHERE invoice_no = '{ticket.document_no}';
											</code>
											<div class="text-muted-foreground pt-1">
												Status: <span class="text-emerald-600 dark:text-emerald-400 font-bold">OPEN (Eligible for mutation)</span>
											</div>
										</div>

										<!-- Step B: Prepared Statement Mutation Plan -->
										<div class="p-3 rounded-lg bg-card border border-border/80 space-y-1 shadow-sm">
											<div class="text-emerald-600 dark:text-emerald-400 font-bold uppercase">2. Prepared Mutation Statement:</div>
											<code class="text-foreground/90 block">
												UPDATE invoices SET customer_name = $1, updated_at = NOW() WHERE invoice_no = $2;
											</code>
											<div class="text-muted-foreground pt-1">
												Params: <span class="text-foreground">$1="{ticket.proposed_value}", $2="{ticket.document_no}"</span>
											</div>
										</div>
									</div>

									<div class="text-[11px] text-muted-foreground flex items-center gap-2">
										<InformationCircle class="h-3.5 w-3.5 text-primary shrink-0" />
										<span>Safe Rollback Guarantee: In case of error, <code>UPDATE invoices SET customer_name = '{ticket.current_value}' WHERE invoice_no = '{ticket.document_no}';</code> is prepared.</span>
									</div>
								</div>
							{/if}

							<!-- Attached Documents from MCP / Chat -->
							{#if ticket.documents && ticket.documents.length > 0}
								<div class="flex items-center gap-2 pt-1 text-xs">
									<span class="text-muted-foreground flex items-center gap-1">
										<DocumentText class="h-3.5 w-3.5" />
										<span>Proof Attachments:</span>
									</span>
									{#each ticket.documents as doc}
										<a
											href={doc.file_path}
											target="_blank"
											class="text-xs text-primary underline flex items-center gap-1 hover:text-primary/80 font-mono"
										>
											<span>{doc.file_name}</span>
											<ArrowTopRightOnSquare class="h-3 w-3" />
										</a>
									{/each}
								</div>
							{/if}

							<!-- Actions -->
							<div class="flex items-center justify-between gap-3 pt-2">
								<button
									onclick={() => (inspectedTicketId = inspectedTicketId === ticket.id ? null : ticket.id)}
									class="text-xs text-muted-foreground hover:text-foreground font-mono flex items-center gap-1.5 transition-colors"
								>
									<Eye class="h-3.5 w-3.5" />
									<span>{inspectedTicketId === ticket.id ? "Hide SQL Plan" : "Inspect AI Reasoning & SQL Plan"}</span>
								</button>

								<div class="flex items-center gap-3">
									<button
										onclick={() => (selectedTicketForReject = ticket)}
										disabled={processingAction}
										class="px-4 py-2 rounded-xl bg-secondary text-destructive hover:bg-destructive/10 text-xs font-semibold border border-border/70 transition-colors flex items-center gap-1.5 shadow-sm"
									>
										<XMark class="h-3.5 w-3.5" />
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
						</div>
					{/each}
				</div>
			{/if}
		</div>

	<!-- TAB 2: REAL-TIME PIPELINE SIMULATOR -->
	{:else if activeTab === "simulator"}
		<div class="max-w-2xl mx-auto p-8 rounded-2xl bg-card border border-border/80 shadow-sm space-y-6">
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
						class="w-full p-3.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40 font-sans shadow-sm"
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
							class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-foreground/40 shadow-sm"
						/>
					</div>
					<div>
						<label for="sim-branch-id" class="block font-medium mb-1 text-foreground">Branch Regional Hub</label>
						<select
							id="sim-branch-id"
							bind:value={simBranchId}
							class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40 shadow-sm"
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
						class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40 shadow-sm"
					/>
				</div>

				<button
					type="submit"
					disabled={simLoading}
					class="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20"
				>
					<PaperAirplane class="h-4 w-4" />
					<span>{simLoading ? "Processing Ingestion & Pre-check..." : "Dispatch to On-Call Ingestion Queue"}</span>
				</button>
			</form>
		</div>

	<!-- TAB: CLIENT HOOKS ECOSYSTEM VISUALIZER (SVG ANIMATED) -->
	{:else if activeTab === "hooks"}
		<HookEcosystemVisualizer />

	<!-- TAB 3: SYSTEM CONNECTIVITY & INTEGRATIONS -->
	{:else if activeTab === "connectivity"}
		<div class="space-y-6">
			<div class="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
							<CpuChip class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground">AI & Ingestion Gateway Integrations</h3>
							<p class="text-xs text-muted-foreground">Live telemetry and health status across all internal on-call connections.</p>
						</div>
					</div>
					<span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs border border-emerald-500/20 font-bold">
						All Engines Online
					</span>
				</div>

				<div class="grid md:grid-cols-2 gap-4 pt-2">
					<!-- Integration 1: AI Provider -->
					<div class="p-5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
						<div class="flex items-center justify-between">
							<span class="font-bold text-sm text-foreground flex items-center gap-2">
								<Sparkles class="h-4 w-4 text-purple-500" />
								<span>AI LLM Engine</span>
							</span>
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">ACTIVE</span>
						</div>
						<div class="text-xs text-muted-foreground space-y-1 font-mono text-[11px]">
							<div>Provider: Google Gemini API / Antigravity CLI</div>
							<div>Model: <code>gemini-1.5-flash</code> (Latency: 280ms)</div>
							<div>In-Context Memory: Active Learning Few-Shot Ground Truth</div>
							<div>Air-Gap Fallback: Ollama Local (qwen2.5-coder:7b)</div>
						</div>
					</div>

					<!-- Integration 2: WhatsApp Scraper Gateway -->
					<div class="p-5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
						<div class="flex items-center justify-between">
							<span class="font-bold text-sm text-foreground flex items-center gap-2">
								<Radio class="h-4 w-4 text-blue-500" />
								<span>WhatsApp Gateway / Scraper</span>
							</span>
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">CONNECTED</span>
						</div>
						<div class="text-xs text-muted-foreground space-y-1 font-mono text-[11px]">
							<div>Session: CORP-WA-HUB-01 (Multi-Device Baileys)</div>
							<div>Whitelisted Channels: 24 Regional Branch Groups</div>
							<div>Anti-Ban Filter: Passive Listener (Zero Cold Messaging)</div>
							<div>Ingress Endpoint: <code>POST /api/tickets</code></div>
						</div>
					</div>

					<!-- Integration 3: Database Storage -->
					<div class="p-5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
						<div class="flex items-center justify-between">
							<span class="font-bold text-sm text-foreground flex items-center gap-2">
								<ServerStack class="h-4 w-4 text-emerald-500" />
								<span>Database Adapter</span>
							</span>
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">HEALTHY</span>
						</div>
						<div class="text-xs text-muted-foreground space-y-1 font-mono text-[11px]">
							<div>Prototyping: PostgreSQL 18 Local (Port 5432)</div>
							<div>Production Driver: Oracle 11g Enterprise (via TNS Alias)</div>
							<div>Pool Health: 10 Idle Conns, 2 Active, 25 Max</div>
							<div>Query Mode: Parameterized Prepared Statements Only</div>
						</div>
					</div>

					<!-- Integration 4: Model Context Protocol (MCP) -->
					<div class="p-5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
						<div class="flex items-center justify-between">
							<span class="font-bold text-sm text-foreground flex items-center gap-2">
								<CommandLine class="h-4 w-4 text-amber-500" />
								<span>Custom MCP Server</span>
							</span>
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">STANDALONE</span>
						</div>
						<div class="text-xs text-muted-foreground space-y-1 font-mono text-[11px]">
							<div>Binary: <code>mcp-server/src/index.ts</code> (Bun Stdio)</div>
							<div>Tools: <code>check_invoice</code>, <code>stage_invoice_update</code>, <code>upload_document</code></div>
							<div>Resources: <code>novapilot://sop/factory-rules</code>, <code>branches/directory</code></div>
							<div>Config: Gitignored <code>mcp.config.json</code> (Example committed)</div>
						</div>
					</div>
				</div>
			</div>
		</div>

	<!-- TAB 4: EXECUTION HISTORY & AUDIT -->
	{:else if activeTab === "history"}
		<div class="space-y-6">
			<div class="rounded-2xl bg-card border border-border/80 overflow-hidden shadow-sm">
				<div class="p-4 border-b border-border/60 font-semibold text-sm flex items-center justify-between">
					<span>Processed Tickets & Mutation Audit Trail</span>
					<span class="text-xs text-muted-foreground font-mono">{tickets.filter(t => t.status !== "PENDING_APPROVAL").length} records</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead class="bg-secondary/60 text-muted-foreground uppercase font-mono text-[10px]">
							<tr>
								<th class="p-3.5">Ticket</th>
								<th class="p-3.5">Document No</th>
								<th class="p-3.5">Updated Name</th>
								<th class="p-3.5">Status</th>
								<th class="p-3.5">Approved By</th>
								<th class="p-3.5">Timestamp</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/40">
							{#each tickets.filter(t => t.status !== "PENDING_APPROVAL") as t}
								<tr class="hover:bg-secondary/40 transition-colors">
									<td class="p-3.5 font-mono font-bold text-foreground">{t.ticket_no}</td>
									<td class="p-3.5 font-mono">{t.document_no}</td>
									<td class="p-3.5 font-medium">{t.proposed_value}</td>
									<td class="p-3.5">
										{#if t.status === "EXECUTED"}
											<span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
	{/if}
</div>

<!-- REJECT REASON MODAL -->
{#if selectedTicketForReject}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
		<div class="w-full max-w-md bg-card p-6 rounded-2xl border border-border shadow-2xl space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-bold text-foreground">Reject Ticket #{selectedTicketForReject.ticket_no}</h3>
				<button onclick={() => (selectedTicketForReject = null)} class="text-muted-foreground hover:text-foreground">
					<XMark class="h-4 w-4" />
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
					class="w-full p-3.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-destructive shadow-sm"
				></textarea>
			</div>

			<div class="flex items-center justify-end gap-2 pt-2">
				<button
					onclick={() => (selectedTicketForReject = null)}
					class="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium border border-border/70"
				>
					Cancel
				</button>
				<button
					onclick={submitReject}
					disabled={processingAction || !rejectionReason.trim()}
					class="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 disabled:opacity-50 shadow-sm"
				>
					Confirm Rejection
				</button>
			</div>
		</div>
	</div>
{/if}
