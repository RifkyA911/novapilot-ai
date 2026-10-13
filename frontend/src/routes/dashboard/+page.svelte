<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		ShieldCheck, CheckCircle, XCircle, ExclamationTriangle, Clock, 
		ServerStack, DocumentText, ArrowRight, ArrowPath, PaperAirplane, Check, 
		XMark, ArrowUpTray, User, ArrowTopRightOnSquare, ChartBarSquare, 
		MagnifyingGlass, Sparkles, CommandLine, CpuChip, Radio, LockClosed, 
		CodeBracket, Eye, InformationCircle, ChevronDown, ChevronUp,
		Funnel, ArrowsUpDown, BookOpen, QuestionMarkCircle, ClipboardDocument,
		ClipboardDocumentCheck, CircleStack, DevicePhoneMobile
	} from "svelte-heros-v2";
	import ThemeToggle from "$lib/components/ThemeToggle.svelte";
	import HookEcosystemVisualizer from "$lib/components/HookEcosystemVisualizer.svelte";
	import HistoryTable from "$lib/components/HistoryTable.svelte";
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
	let isPipelineFolded = $state(true);

	// Multi-Engine Database Paradigm (Relational vs Non-Relational)
	let dbEngineMode = $state<"relational" | "non_relational">("relational");

	// Approval Queue Search, Multi-Criteria Filters & Sorting
	let pendingSearch = $state("");
	let filterBranch = $state("all");
	let filterConfidence = $state("all");
	let sortBy = $state<"newest" | "oldest" | "confidence">("newest");

	// Active tab: 'pending' | 'simulator' | 'hooks' | 'connectivity' | 'history'
	let activeTab = $state<"pending" | "simulator" | "hooks" | "connectivity" | "history">("pending");

	// Inspected Ticket State (Transparency & Explainability)
	let inspectedTicketId = $state<number | null>(null);
	let inspectedPlanParadigm = $state<"relational" | "non_relational">("relational");

	// Reject Modal State
	let selectedTicketForReject = $state<Ticket | null>(null);
	let rejectionReason = $state("");
	let processingAction = $state(false);

	// Interactive Platform Integration Tutorial Popup
	let showTutorialModal = $state(false);
	let activeTutorialTab = $state<"ferdium" | "rambox" | "web" | "pc">("ferdium");
	let copiedCode = $state(false);
	let testHookSuccess = $state(false);

	// Real-time Pipeline Simulator State
	let simMessage = $state("Hello IT Support, please update invoice INV/2026/001 customer name from PT Sumber Makmur to PT Sumber Makmur Abadi due to branch tax invoice amendment. Thanks!");
	let simDocNo = $state("INV/2026/001");
	let simProposed = $state("PT Sumber Makmur Abadi");
	let simBranchId = $state(1);
	let simLoading = $state(false);
	let simStep = $state(0); // 0: Idle, 1: WA Ingestion, 2: LLM Extraction, 3: DB Pre-check, 4: Ready for Sign-off

	// Reactive filtering & sorting for Approval Queue
	let filteredTickets = $derived(
		tickets.filter(t => {
			if (filterBranch !== "all" && t.branch_name !== filterBranch) return false;
			if (filterConfidence === "high" && t.confidence_score < 0.9) return false;
			if (filterConfidence === "review" && t.confidence_score >= 0.9) return false;
			if (!pendingSearch.trim()) return true;
			const q = pendingSearch.toLowerCase();
			return (
				t.ticket_no.toLowerCase().includes(q) ||
				t.document_no.toLowerCase().includes(q) ||
				t.proposed_value.toLowerCase().includes(q) ||
				t.raw_message.toLowerCase().includes(q) ||
				(t.branch_name && t.branch_name.toLowerCase().includes(q))
			);
		}).sort((a, b) => {
			if (sortBy === "oldest") {
				return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
			}
			if (sortBy === "confidence") {
				return b.confidence_score - a.confidence_score;
			}
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
				alert(`Simulation error: ${err.error || "Failed to create ticket"}`);
			}
		} catch (err: any) {
			alert(`Network error: ${err.message}`);
		} finally {
			simLoading = false;
			simStep = 0;
		}
	}

	function openTutorial(platform: "ferdium" | "rambox" | "web" | "pc") {
		activeTutorialTab = platform;
		showTutorialModal = true;
	}

	async function copySnippet(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedCode = true;
			setTimeout(() => (copiedCode = false), 2000);
		} catch (err) {
			console.error("Copy failed:", err);
		}
	}

	async function testHookPing() {
		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: "Test Hook Ping from Integration Guide: Please update invoice INV/2026/001 customer name to PT Test Ping Sukses.",
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: "INV/2026/001",
					field_target: "customer_name",
					proposed_value: "PT Test Ping Sukses",
					branch_id: 1,
					confidence_score: 0.99
				})
			});
			if (res.ok) {
				testHookSuccess = true;
				await fetchTickets();
				setTimeout(() => (testHookSuccess = false), 3500);
			}
		} catch (err) {
			console.error("Test hook ping error:", err);
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

<div class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
	
	<!-- Guardrail Assurance & Real-Time Intake Engine (Unified Header Card) -->
	<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4 transition-all">
		<!-- Top Bar: Clean shadcn telemetry bar with Database Engine Selector -->
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
			<!-- Left: Title & Guard Status -->
			<div class="flex items-center gap-3">
				<div class="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs flex-shrink-0">
					<ShieldCheck class="h-5 w-5" />
				</div>
				<div>
					<div class="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
						<span>Guardrail Assurance & Intake Engine</span>
						<span class="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
							Active Guard
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-0.5">Automated validation of incoming mutations against schema constraints and zero raw SQL/NoSQL injection.</p>
				</div>
			</div>

			<!-- Right: Shadcn Telemetry Controls & DB Paradigm Switcher -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- LAN Telemetry Badge -->
				<div class="h-9 px-3 rounded-md bg-muted/60 border border-input text-xs font-mono text-muted-foreground flex items-center gap-1.5 shadow-xs">
					<span class="text-foreground font-semibold">LAN:</span>
					<span>192.168.1.104</span>
				</div>

				<!-- Dual Database Paradigm Dropdown (Relational vs Non-Relational) -->
				<div class="flex items-center">
					<select
						bind:value={dbEngineMode}
						class="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
						title="Select Database Engine Architecture"
					>
						<option value="relational">Relational: PostgreSQL 18 / Oracle 11g</option>
						<option value="non_relational">Non-Relational: MongoDB / Redis Store</option>
					</select>
				</div>

				<!-- SSE Pulse Indicator -->
				<div class="h-9 px-3 rounded-md bg-muted/60 border border-input text-xs font-mono flex items-center gap-2 shadow-xs">
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full {sseConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 {sseConnected ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
					</span>
					<span class="font-medium {sseConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}">
						{sseConnected ? "SSE Live" : "Reconnecting"}
					</span>
				</div>

				<!-- Refresh Button -->
				<button
					type="button"
					onclick={fetchTickets}
					class="h-9 w-9 rounded-md border border-input bg-background hover:bg-accent text-foreground transition-colors flex items-center justify-center shadow-xs cursor-pointer"
					title="Refresh On-Call Queue"
				>
					<ArrowPath class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
				</button>

				<!-- Theme Toggle -->
				<ThemeToggle />
			</div>
		</div>

		<!-- Middle Divider & Foldable Pipeline Header -->
		<div class="pt-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
			<div class="flex items-center gap-2 text-xs font-mono text-muted-foreground">
				<CpuChip class="h-4 w-4 text-primary" />
				<span class="font-semibold text-foreground">Real-Time Ingestion Pipeline:</span>
				<span class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
					{simStep === 0 ? "Standby" : `Step 0${simStep} Processing`}
				</span>
			</div>

			<!-- Fold / Unfold Toggle Button (Shadcn style) -->
			<button
				type="button"
				onclick={() => isPipelineFolded = !isPipelineFolded}
				class="h-8 px-3 rounded-md text-xs font-medium border border-input bg-background hover:bg-accent text-foreground transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
			>
				<span>{isPipelineFolded ? "Expand Pipeline Details" : "Fold to Step View"}</span>
				{#if isPipelineFolded}
					<ChevronDown class="h-3.5 w-3.5 text-muted-foreground" />
				{:else}
					<ChevronUp class="h-3.5 w-3.5 text-muted-foreground" />
				{/if}
			</button>
		</div>

		<!-- When FOLDED: Show sleek horizontal steps line directly -->
		{#if isPipelineFolded}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1 font-mono text-xs">
				<div class="px-3 py-2 rounded-lg border flex items-center justify-between transition-colors {simStep >= 1 ? 'bg-primary/10 border-primary/40 font-semibold text-foreground' : 'bg-muted/40 border-border text-muted-foreground'}">
					<div class="flex items-center gap-2">
						<Radio class="h-3.5 w-3.5 {simStep === 1 ? 'text-emerald-500 animate-pulse' : 'text-primary'}" />
						<span>01. Ingest (WA)</span>
					</div>
					{#if simStep === 1}<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>{/if}
				</div>

				<div class="px-3 py-2 rounded-lg border flex items-center justify-between transition-colors {simStep >= 2 ? 'bg-purple-500/10 border-purple-500/40 font-semibold text-foreground' : 'bg-muted/40 border-border text-muted-foreground'}">
					<div class="flex items-center gap-2">
						<CpuChip class="h-3.5 w-3.5 text-purple-500" />
						<span>02. Extract (LLM)</span>
					</div>
					{#if simStep === 2}<span class="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>{/if}
				</div>

				<div class="px-3 py-2 rounded-lg border flex items-center justify-between transition-colors {simStep >= 3 ? 'bg-amber-500/10 border-amber-500/40 font-semibold text-foreground' : 'bg-muted/40 border-border text-muted-foreground'}">
					<div class="flex items-center gap-2">
						<ServerStack class="h-3.5 w-3.5 text-amber-500" />
						<span>03. Pre-Check</span>
					</div>
					{#if simStep === 3}<span class="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>{/if}
				</div>

				<div class="px-3 py-2 rounded-lg border flex items-center justify-between transition-colors {simStep >= 4 ? 'bg-emerald-500/10 border-emerald-500/40 font-semibold text-foreground' : 'bg-muted/40 border-border text-muted-foreground'}">
					<div class="flex items-center gap-2">
						<ShieldCheck class="h-3.5 w-3.5 text-emerald-500" />
						<span>04. Gatekeeper</span>
					</div>
					{#if pendingCount > 0}<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">{pendingCount}</span>{/if}
				</div>

				<div class="col-span-2 sm:col-span-1 px-3 py-2 rounded-lg border flex items-center justify-between transition-colors bg-muted/40 border-border text-muted-foreground">
					<div class="flex items-center gap-2">
						<LockClosed class="h-3.5 w-3.5 text-rose-500" />
						<span>05. Commit ({dbEngineMode === 'relational' ? 'SQL' : 'BSON'})</span>
					</div>
					<span class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Atomic</span>
				</div>
			</div>
		{:else}
			<!-- Expanded Details Cards -->
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
				<div class="p-3.5 rounded-lg bg-muted/30 border border-border space-y-1">
					<div class="font-semibold text-foreground flex items-center gap-1.5">
						<Radio class="h-3.5 w-3.5 text-primary" />
						<span>Ingestion Protocols</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Passive WhatsApp observers running inside Ferdium, Rambox, and Chrome Tampermonkey.
					</p>
				</div>

				<div class="p-3.5 rounded-lg bg-muted/30 border border-border space-y-1">
					<div class="font-semibold text-foreground flex items-center gap-1.5">
						<CpuChip class="h-3.5 w-3.5 text-purple-500" />
						<span>AI Entity Extraction</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Extracts document number, field mutation target, and proposed values with 95%+ confidence.
					</p>
				</div>

				<div class="p-3.5 rounded-lg bg-muted/30 border border-border space-y-1">
					<div class="font-semibold text-foreground flex items-center gap-1.5">
						<CircleStack class="h-3.5 w-3.5 text-amber-500" />
						<span>{dbEngineMode === 'relational' ? 'Relational Pre-Check' : 'NoSQL Schema Pre-Check'}</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						{dbEngineMode === 'relational' 
							? 'Dry-runs SELECT against PostgreSQL/Oracle and prepares atomic UPDATE transaction.'
							: 'Validates BSON collection document existence and pre-generates compensating JSON patch.'}
					</p>
				</div>

				<div class="p-3.5 rounded-lg bg-muted/30 border border-border space-y-1">
					<div class="font-semibold text-foreground flex items-center gap-1.5">
						<ShieldCheck class="h-3.5 w-3.5 text-emerald-500" />
						<span>Human Gatekeeper</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Cryptographic sign-off by on-call engineer before any database transaction locks or commits.
					</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Stats Counter Bar (Shadcn KPI Cards) -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Pending Review</div>
			<div class="text-2xl sm:text-3xl font-bold font-mono text-amber-500 flex items-center justify-between">
				<span>{pendingCount}</span>
				<Clock class="h-5 w-5 text-amber-500/40" />
			</div>
			<div class="text-xs text-muted-foreground">Awaiting on-call signoff</div>
		</div>

		<div class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Mutated Today</div>
			<div class="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
				<span>{executedCount}</span>
				<CheckCircle class="h-5 w-5 text-emerald-500/40" />
			</div>
			<div class="text-xs text-muted-foreground">Committed with audit log</div>
		</div>

		<div class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Policy Rejected</div>
			<div class="text-2xl sm:text-3xl font-bold font-mono text-foreground flex items-center justify-between">
				<span>{rejectedCount}</span>
				<XCircle class="h-5 w-5 text-muted-foreground/40" />
			</div>
			<div class="text-xs text-muted-foreground">Closed invoices or errors</div>
		</div>

		<div class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Database Architecture</div>
			<div class="text-2xl sm:text-3xl font-bold font-mono text-primary flex items-center justify-between">
				<span>{dbEngineMode === 'relational' ? 'SQL' : 'NoSQL'}</span>
				<ServerStack class="h-5 w-5 text-primary/40" />
			</div>
			<div class="text-xs text-muted-foreground">
				{dbEngineMode === 'relational' ? 'PostgreSQL / Oracle 11g' : 'MongoDB / Redis Store'}
			</div>
		</div>
	</div>

	<!-- Shadcn Segmented Tab Navigation -->
	<div class="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full flex-wrap gap-1">
		<button
			type="button"
			onclick={() => (activeTab = "pending")}
			class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer {activeTab === 'pending' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'}"
		>
			<span>Approval Queue</span>
			{#if pendingCount > 0}
				<span class="ml-1.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
					{pendingCount}
				</span>
			{/if}
		</button>

		<button
			type="button"
			onclick={() => (activeTab = "simulator")}
			class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer {activeTab === 'simulator' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'}"
		>
			<PaperAirplane class="h-3.5 w-3.5 mr-1.5" />
			<span>Simulate Ingestion</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = "hooks")}
			class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer {activeTab === 'hooks' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'}"
		>
			<CodeBracket class="h-3.5 w-3.5 mr-1.5 text-purple-500" />
			<span>Client Hooks (Visual Flow)</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = "connectivity")}
			class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer {activeTab === 'connectivity' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'}"
		>
			<CpuChip class="h-3.5 w-3.5 mr-1.5 text-blue-500" />
			<span>System Connectivity & Platform Indicators</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = "history")}
			class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer {activeTab === 'history' ? 'bg-background text-foreground shadow-xs font-semibold' : 'hover:text-foreground'}"
		>
			<ChartBarSquare class="h-3.5 w-3.5 mr-1.5" />
			<span>Execution History & Audit</span>
		</button>
	</div>

	<!-- TAB 1: PENDING APPROVAL QUEUE (SHADCN DATA-TABLE TOOLBAR & CARDS) -->
	{#if activeTab === "pending"}
		<div class="space-y-4">
			<!-- Authentic Shadcn Data-Table Toolbar -->
			<div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
				<div class="flex items-center gap-2.5 flex-wrap flex-1 min-w-[280px]">
					<!-- Search Input (Standard shadcn h-9, rounded-md, text-sm) -->
					<div class="relative flex-1 min-w-[220px] max-w-sm">
						<MagnifyingGlass class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							bind:value={pendingSearch}
							placeholder="Search ticket, invoice, customer, raw text..."
							class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans shadow-xs transition-colors"
						/>
						{#if pendingSearch}
							<button
								type="button"
								onclick={() => (pendingSearch = "")}
								class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
								title="Clear search"
							>
								✕
							</button>
						{/if}
					</div>

					<!-- Branch Filter Select (shadcn style) -->
					<div class="flex items-center">
						<select
							bind:value={filterBranch}
							class="h-9 rounded-md border border-input bg-background px-3 text-sm font-sans text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
						>
							<option value="all">All Regional Branches</option>
							<option value="Surabaya HQ">Surabaya HQ</option>
							<option value="Medan Hub">Medan Hub</option>
							<option value="Semarang DC">Semarang DC</option>
							<option value="Makassar Hub">Makassar Hub</option>
						</select>
					</div>

					<!-- Confidence Filter Select -->
					<div class="flex items-center">
						<select
							bind:value={filterConfidence}
							class="h-9 rounded-md border border-input bg-background px-3 text-sm font-sans text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
						>
							<option value="all">All Confidence Scores</option>
							<option value="high">High Confidence (≥90%)</option>
							<option value="review">Needs Review (&lt;90%)</option>
						</select>
					</div>

					<!-- Sort By Select -->
					<div class="flex items-center">
						<select
							bind:value={sortBy}
							class="h-9 rounded-md border border-input bg-background px-3 text-sm font-sans text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
						>
							<option value="newest">Sort: Newest First</option>
							<option value="oldest">Sort: Oldest First</option>
							<option value="confidence">Sort: Highest Confidence</option>
						</select>
					</div>
				</div>

				<!-- Reset Filters & Count Status -->
				<div class="flex items-center gap-2">
					{#if pendingSearch || filterBranch !== "all" || filterConfidence !== "all" || sortBy !== "newest"}
						<button
							type="button"
							onclick={() => { pendingSearch = ""; filterBranch = "all"; filterConfidence = "all"; sortBy = "newest"; }}
							class="h-9 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
						>
							Reset
						</button>
					{/if}
					
					<span class="inline-flex items-center rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-mono text-muted-foreground">
						Showing <strong class="text-foreground ml-1 mr-1">{filteredTickets.filter(t => t.status === "PENDING_APPROVAL").length}</strong> of {pendingCount}
					</span>
				</div>
			</div>

			<!-- Loading State -->
			{#if loading}
				<div class="py-16 text-center text-muted-foreground space-y-2">
					<ArrowPath class="h-6 w-6 animate-spin mx-auto text-primary" />
					<p class="text-xs font-mono">Streaming on-call approval queue...</p>
				</div>
			{:else if filteredTickets.filter(t => t.status === "PENDING_APPROVAL").length === 0}
				<!-- Empty Queue State -->
				<div class="py-16 text-center space-y-3 rounded-xl border border-border bg-card p-8 shadow-xs">
					<div class="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
						<CheckCircle class="h-5 w-5" />
					</div>
					<h3 class="text-base font-semibold text-foreground">Zero Pending Approvals</h3>
					<p class="text-sm text-muted-foreground max-w-md mx-auto">
						{pendingSearch || filterBranch !== "all" || filterConfidence !== "all" 
							? "No tickets match your active filter criteria. Try resetting your search or branch selection." 
							: "All incoming branch requests have been reviewed and committed. Your on-call shift queue is currently clear."}
					</p>
					{#if pendingSearch || filterBranch !== "all" || filterConfidence !== "all"}
						<button
							type="button"
							onclick={() => { pendingSearch = ""; filterBranch = "all"; filterConfidence = "all"; }}
							class="h-9 px-4 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium transition-colors cursor-pointer"
						>
							Clear Active Filters
						</button>
					{:else}
						<button
							type="button"
							onclick={() => (activeTab = "simulator")}
							class="h-9 px-4 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
						>
							<Sparkles class="h-4 w-4 text-primary" />
							<span>Test with simulated WhatsApp message</span>
						</button>
					{/if}
				</div>
			{:else}
				<!-- Ticket Cards List (Shadcn Clean Design) -->
				<div class="grid gap-4">
					{#each filteredTickets.filter(t => t.status === "PENDING_APPROVAL") as ticket (ticket.id)}
						<div class="rounded-xl border border-border bg-card p-5 shadow-xs hover:border-foreground/20 transition-all space-y-4">
							
							<!-- Ticket Header -->
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-3">
								<div class="flex items-center gap-2.5 flex-wrap">
									<span class="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
										#{ticket.ticket_no}
									</span>
									<span class="text-sm font-semibold text-foreground">
										{ticket.branch_name || "Authorized Regional Hub"}
									</span>
									<span class="text-border">|</span>
									<span class="text-xs text-muted-foreground font-mono">
										Invoice: <strong class="text-foreground">{ticket.document_no}</strong>
									</span>
								</div>

								<div class="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
									<span class="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
										<ShieldCheck class="h-3.5 w-3.5" />
										<span>Guardrails Passed</span>
									</span>

									<span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
										<Clock class="h-3.5 w-3.5" />
										<span>{timeAgo(ticket.created_at)}</span>
									</span>

									<span class="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-mono font-medium text-foreground">
										Confidence: {Math.round(ticket.confidence_score * 100)}%
									</span>
								</div>
							</div>

							<!-- WhatsApp Raw Message Quote -->
							<div class="rounded-lg border border-border/80 bg-muted/40 p-3.5 space-y-1">
								<div class="text-xs font-medium text-muted-foreground flex items-center gap-1.5 font-mono">
									<Radio class="h-3.5 w-3.5 text-emerald-500" />
									<span>INCOMING BRANCH WHATSAPP EVIDENCE:</span>
								</div>
								<p class="text-sm font-normal text-foreground leading-relaxed italic">
									"{ticket.raw_message}"
								</p>
							</div>

							<!-- Side-by-Side High-Contrast Value Diff -->
							<div class="grid sm:grid-cols-2 gap-3.5">
								<!-- Current in Database -->
								<div class="rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 space-y-1">
									<div class="text-xs font-medium text-destructive flex items-center gap-1.5">
										<XCircle class="h-4 w-4" />
										<span>CURRENT DATABASE RECORD (READ-ONLY)</span>
									</div>
									<div class="text-sm font-mono font-semibold text-foreground line-through opacity-75">
										{ticket.current_value || "(Empty / Null)"}
									</div>
								</div>

								<!-- Proposed Value to Mutate -->
								<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1">
									<div class="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
										<CheckCircle class="h-4 w-4" />
										<span>PROPOSED VALUE (MUTATION TARGET)</span>
									</div>
									<div class="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
										{ticket.proposed_value}
									</div>
								</div>
							</div>

							<!-- Transparent Execution & AI Plan Drawer (Dual Paradigm: Relational & Non-Relational) -->
							{#if inspectedTicketId === ticket.id}
								<div class="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-xs transition-all">
									<div class="flex items-center justify-between border-b border-border/60 pb-2.5">
										<div class="flex items-center gap-2">
											<CodeBracket class="h-4 w-4 text-primary" />
											<span class="font-semibold text-foreground text-xs sm:text-sm">
												Execution Plan & Safety Proof (Zero Black Box)
											</span>
										</div>

										<div class="flex items-center gap-2">
											<!-- Toggle Paradigm inside inspection -->
											<div class="inline-flex rounded-md border border-input bg-background p-0.5 text-xs font-mono">
												<button
													type="button"
													onclick={() => (inspectedPlanParadigm = "relational")}
													class="px-2 py-0.5 rounded transition-colors {inspectedPlanParadigm === 'relational' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}"
												>
													Relational (SQL)
												</button>
												<button
													type="button"
													onclick={() => (inspectedPlanParadigm = "non_relational")}
													class="px-2 py-0.5 rounded transition-colors {inspectedPlanParadigm === 'non_relational' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}"
												>
													NoSQL (Document)
												</button>
											</div>

											<button
												type="button"
												onclick={() => (inspectedTicketId = null)}
												class="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
											>
												Close
											</button>
										</div>
									</div>

									{#if inspectedPlanParadigm === "relational"}
										<!-- Relational SQL Execution Plan -->
										<div class="grid md:grid-cols-2 gap-3 text-xs font-mono">
											<div class="p-3 rounded-md bg-card border border-border space-y-1 shadow-2xs">
												<div class="text-amber-500 font-bold uppercase text-[11px]">1. Relational Dry-Run (Read-Only):</div>
												<code class="text-foreground/90 block text-xs">
													SELECT customer_name, status FROM invoices WHERE invoice_no = '{ticket.document_no}';
												</code>
												<div class="text-muted-foreground pt-0.5 text-[11px]">
													Status: <span class="text-emerald-600 dark:text-emerald-400 font-bold">OPEN (Eligible for mutation)</span>
												</div>
											</div>

											<div class="p-3 rounded-md bg-card border border-border space-y-1 shadow-2xs">
												<div class="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px]">2. Prepared SQL Statement:</div>
												<code class="text-foreground/90 block text-xs">
													UPDATE invoices SET customer_name = $1, updated_at = NOW() WHERE invoice_no = $2;
												</code>
												<div class="text-muted-foreground pt-0.5 text-[11px]">
													Bind Params: <span class="text-foreground font-semibold">$1="{ticket.proposed_value}", $2="{ticket.document_no}"</span>
												</div>
											</div>
										</div>

										<div class="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
											<InformationCircle class="h-3.5 w-3.5 text-primary shrink-0" />
											<span>Auto Rollback Script: <code>UPDATE invoices SET customer_name = '{ticket.current_value}' WHERE invoice_no = '{ticket.document_no}';</code></span>
										</div>
									{:else}
										<!-- Non-Relational NoSQL / Document Execution Plan -->
										<div class="grid md:grid-cols-2 gap-3 text-xs font-mono">
											<div class="p-3 rounded-md bg-card border border-border space-y-1 shadow-2xs">
												<div class="text-amber-500 font-bold uppercase text-[11px]">1. NoSQL BSON Inspection:</div>
												<code class="text-foreground/90 block text-xs">
													db.invoices.findOne(&#123; invoice_no: "{ticket.document_no}" &#125;, &#123; customer_name: 1, status: 1 &#125;)
												</code>
												<div class="text-muted-foreground pt-0.5 text-[11px]">
													Document Status: <span class="text-emerald-600 dark:text-emerald-400 font-bold">Found (Status: OPEN)</span>
												</div>
											</div>

											<div class="p-3 rounded-md bg-card border border-border space-y-1 shadow-2xs">
												<div class="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px]">2. Atomic Document Patch:</div>
												<code class="text-foreground/90 block text-xs">
													db.invoices.updateOne(&#123; invoice_no: "{ticket.document_no}" &#125;, &#123; $set: &#123; customer_name: "{ticket.proposed_value}", updated_at: new Date() &#125; &#125;)
												</code>
												<div class="text-muted-foreground pt-0.5 text-[11px]">
													Guard: <span class="text-foreground font-semibold">Strict JSON Schema Validation Passed</span>
												</div>
											</div>
										</div>

										<div class="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
											<InformationCircle class="h-3.5 w-3.5 text-primary shrink-0" />
											<span>Inverse JSON Patch: <code>&#123; op: "replace", path: "/customer_name", value: "{ticket.current_value}" &#125;</code></span>
										</div>
									{/if}
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

							<!-- Actions Bar (Shadcn style buttons) -->
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
								<button
									type="button"
									onclick={() => (inspectedTicketId = inspectedTicketId === ticket.id ? null : ticket.id)}
									class="h-9 px-3 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
								>
									<Eye class="h-3.5 w-3.5" />
									<span>{inspectedTicketId === ticket.id ? "Hide Execution Plan" : "Inspect AI Reasoning & Query Plan"}</span>
								</button>

								<div class="flex items-center gap-2 self-end sm:self-auto">
									<!-- Reject Button -->
									<button
										type="button"
										onclick={() => (selectedTicketForReject = ticket)}
										disabled={processingAction}
										class="h-9 px-3.5 rounded-md border border-input bg-background hover:bg-destructive/10 text-destructive text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
									>
										<XMark class="h-3.5 w-3.5" />
										<span>Reject Request</span>
									</button>

									<!-- Approve Button -->
									<button
										type="button"
										onclick={() => handleApprove(ticket)}
										disabled={processingAction}
										class="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
									>
										<Check class="h-3.5 w-3.5" />
										<span>Approve & Mutate ({dbEngineMode === 'relational' ? 'SQL' : 'Document'})</span>
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
		<div class="max-w-2xl mx-auto p-6 sm:p-8 rounded-xl border border-border bg-card shadow-xs space-y-6">
			<div>
				<h3 class="text-base sm:text-lg font-semibold text-foreground">Simulate WhatsApp Branch Ingestion</h3>
				<p class="text-xs sm:text-sm text-muted-foreground mt-1">
					Test AI intent extraction, database pre-check policy validation, and real-time SSE push dispatch.
				</p>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleSimulateSubmit(); }} class="space-y-4 text-sm">
				<div>
					<label for="sim-raw-chat" class="block font-medium mb-1.5 text-foreground">Raw WhatsApp Chat Message</label>
					<textarea
						id="sim-raw-chat"
						bind:value={simMessage}
						rows={3}
						class="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						placeholder="Paste chat message..."
					></textarea>
				</div>

				<div class="grid sm:grid-cols-2 gap-4">
					<div>
						<label for="sim-doc-no" class="block font-medium mb-1.5 text-foreground">Target Document No</label>
						<input
							id="sim-doc-no"
							type="text"
							bind:value={simDocNo}
							class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>
					<div>
						<label for="sim-proposed-val" class="block font-medium mb-1.5 text-foreground">Proposed Mutation Value</label>
						<input
							id="sim-proposed-val"
							type="text"
							bind:value={simProposed}
							class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>
				</div>

				<div>
					<label for="sim-branch-id" class="block font-medium mb-1.5 text-foreground">Regional Branch Hub</label>
					<select
						id="sim-branch-id"
						bind:value={simBranchId}
						class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<option value={1}>Surabaya HQ (Main DC)</option>
						<option value={2}>Medan Hub (North Sumatra)</option>
						<option value={3}>Semarang DC (Central Java)</option>
						<option value={4}>Makassar Hub (Eastern Region)</option>
					</select>
				</div>

				<button
					type="submit"
					disabled={simLoading}
					class="w-full h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
				>
					<PaperAirplane class="h-4 w-4" />
					<span>{simLoading ? "Processing Ingestion & Pre-check..." : "Dispatch to On-Call Ingestion Queue"}</span>
				</button>
			</form>
		</div>

	<!-- TAB: CLIENT HOOKS ECOSYSTEM VISUALIZER (SVG ANIMATED) -->
	{:else if activeTab === "hooks"}
		<HookEcosystemVisualizer />

	<!-- TAB 3: SYSTEM CONNECTIVITY & INTEGRATION PLATFORM MATRIX -->
	{:else if activeTab === "connectivity"}
		<div class="space-y-6">
			<!-- Top Overview & Tutorial Trigger Header -->
			<div class="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
							<CpuChip class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-base sm:text-lg font-semibold text-foreground">
								Multi-Platform Hook & System Connectivity
							</h3>
							<p class="text-xs sm:text-sm text-muted-foreground">
								Live telemetry, hook health, and platform status across Ferdium, Rambox, Web WA, and PC WA.
							</p>
						</div>
					</div>

					<!-- Discreet Interactive Tutorial Button -->
					<button
						type="button"
						onclick={() => openTutorial("ferdium")}
						class="h-9 px-3.5 rounded-md border border-input bg-background hover:bg-accent text-foreground text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer w-fit"
						title="Open Step-by-Step Integration Guide"
					>
						<BookOpen class="h-4 w-4 text-primary" />
						<span>Interactive Setup Tutorial</span>
					</button>
				</div>

				<!-- Hook & Platform Ingestion Matrix (4 Live Dedicated Cards) -->
				<div class="space-y-3 pt-2">
					<div class="text-xs font-semibold text-foreground uppercase tracking-wider font-mono flex items-center justify-between">
						<span>Client Hook Ingestion Platforms</span>
						<span class="text-muted-foreground font-normal">Real-Time Observation</span>
					</div>

					<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
						
						<!-- Platform 1: Ferdium Desktop App -->
						<div class="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-purple-500/40 transition-colors flex flex-col justify-between">
							<div class="space-y-2.5">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<img src="https://avatars.githubusercontent.com/u/102928503?s=200&v=4" alt="Ferdium" class="h-6 w-6 rounded-md object-contain shrink-0" />
										<span class="font-semibold text-sm text-foreground">Ferdium Desktop</span>
									</div>
									<span class="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
										<span class="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></span>
										ACTIVE
									</span>
								</div>

								<div class="text-xs font-mono text-muted-foreground space-y-1">
									<div>Recipe: <code>novapilot-hook.js</code></div>
									<div>Mode: Electron webview IPC</div>
									<div>Port: <code>127.0.0.1:8088</code></div>
									<div>Status: Listening on DOM</div>
								</div>
							</div>

							<div class="pt-2 border-t border-border flex items-center justify-between">
								<span class="text-[11px] text-muted-foreground font-mono">12 events captured</span>
								<button
									type="button"
									onclick={() => openTutorial("ferdium")}
									class="h-7 px-2 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
									title="View Ferdium Tutorial"
								>
									<BookOpen class="h-3 w-3" />
									<span>Guide</span>
								</button>
							</div>
						</div>

						<!-- Platform 2: Rambox App -->
						<div class="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-blue-500/40 transition-colors flex flex-col justify-between">
							<div class="space-y-2.5">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<img src="https://avatars.githubusercontent.com/u/19875476?s=200&v=4" alt="Rambox" class="h-6 w-6 rounded-md object-contain shrink-0" />
										<span class="font-semibold text-sm text-foreground">Rambox App</span>
									</div>
									<span class="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
										<span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
										READY
									</span>
								</div>

								<div class="text-xs font-mono text-muted-foreground space-y-1">
									<div>Script: <code>novapilot-rambox.js</code></div>
									<div>Mode: Custom Service JS</div>
									<div>Target: WhatsApp Service</div>
									<div>Status: Webhook Forwarder</div>
								</div>
							</div>

							<div class="pt-2 border-t border-border flex items-center justify-between">
								<span class="text-[11px] text-muted-foreground font-mono">Service Standby</span>
								<button
									type="button"
									onclick={() => openTutorial("rambox")}
									class="h-7 px-2 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
									title="View Rambox Tutorial"
								>
									<BookOpen class="h-3 w-3" />
									<span>Guide</span>
								</button>
							</div>
						</div>

						<!-- Platform 3: WhatsApp Web (Browser Userscript) -->
						<div class="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
							<div class="space-y-2.5">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Browser" class="h-6 w-6 rounded-md object-contain shrink-0" />
										<span class="font-semibold text-sm text-foreground">WhatsApp Web</span>
									</div>
									<span class="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
										<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
										CONNECTED
									</span>
								</div>

								<div class="text-xs font-mono text-muted-foreground space-y-1">
									<div>Extension: Tampermonkey</div>
									<div>Target: <code>web.whatsapp.com</code></div>
									<div>Mode: DOM Observer on Pane</div>
									<div>Status: Zero Anti-Ban Filter</div>
								</div>
							</div>

							<div class="pt-2 border-t border-border flex items-center justify-between">
								<span class="text-[11px] text-muted-foreground font-mono">Chrome / Edge / Firefox</span>
								<button
									type="button"
									onclick={() => openTutorial("web")}
									class="h-7 px-2 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
									title="View Web WA Tutorial"
								>
									<BookOpen class="h-3 w-3" />
									<span>Guide</span>
								</button>
							</div>
						</div>

						<!-- Platform 4: PC WhatsApp / Baileys Gateway -->
						<div class="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-amber-500/40 transition-colors flex flex-col justify-between">
							<div class="space-y-2.5">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="PC WA" class="h-6 w-6 rounded-md object-contain shrink-0" />
										<span class="font-semibold text-sm text-foreground">PC WhatsApp WA</span>
									</div>
									<span class="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
										<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
										PAIRED
									</span>
								</div>

								<div class="text-xs font-mono text-muted-foreground space-y-1">
									<div>Daemon: <code>whatsapp-gateway</code></div>
									<div>Session: <code>CORP-WA-HUB-01</code></div>
									<div>Channels: 24 Branch Groups</div>
									<div>Status: Duplex Auto-Reply</div>
								</div>
							</div>

							<div class="pt-2 border-t border-border flex items-center justify-between">
								<span class="text-[11px] text-muted-foreground font-mono">Port 8088 / 3001</span>
								<button
									type="button"
									onclick={() => openTutorial("pc")}
									class="h-7 px-2 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
									title="View PC WA Tutorial"
								>
									<BookOpen class="h-3 w-3" />
									<span>Guide</span>
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Infrastructure & Dual Database Engine Architecture -->
				<div class="space-y-3 pt-4 border-t border-border">
					<div class="text-xs font-semibold text-foreground uppercase tracking-wider font-mono flex items-center justify-between">
						<span>Database Engine Architecture (Relational & Non-Relational Supported)</span>
						<span class="text-primary font-bold">Dual Paradigm Certified</span>
					</div>

					<div class="grid md:grid-cols-2 gap-4">
						<!-- Relational Database Layer -->
						<div class="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
							<div class="flex items-center justify-between">
								<span class="font-semibold text-sm text-foreground flex items-center gap-2">
									<ServerStack class="h-4 w-4 text-emerald-500" />
									<span>Relational Engine (SQL / ACID)</span>
								</span>
								<span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
									ACTIVE
								</span>
							</div>
							<div class="text-xs font-mono text-muted-foreground space-y-1">
								<div>Supported Engines: PostgreSQL 18 Local, Oracle 11g Enterprise, MySQL</div>
								<div>Transaction Integrity: Prepared Statements with Parameter Binding</div>
								<div>Guardrail Check: Foreign Key Constraints & Schema Dry-Run Simulation</div>
								<div>Rollback Strategy: Automated Inverse SQL Execution Plan</div>
							</div>
						</div>

						<!-- Non-Relational Database Layer -->
						<div class="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
							<div class="flex items-center justify-between">
								<span class="font-semibold text-sm text-foreground flex items-center gap-2">
									<CircleStack class="h-4 w-4 text-blue-500" />
									<span>Non-Relational Engine (Document / NoSQL / Key-Value)</span>
								</span>
								<span class="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
									SUPPORTED
								</span>
							</div>
							<div class="text-xs font-mono text-muted-foreground space-y-1">
								<div>Supported Engines: MongoDB 7.0 Document Store, Redis Key-Value & Streams</div>
								<div>Mutation Format: Atomic Document Updates ($set) & JSON Patch RFC 6902</div>
								<div>Guardrail Check: BSON Schema Validation & Idempotency Key Lock</div>
								<div>Rollback Strategy: Inverse JSON Patch Snapshot Storage</div>
							</div>
						</div>
					</div>
				</div>

				<!-- AI & MCP Server Status -->
				<div class="grid md:grid-cols-2 gap-4 pt-2">
					<!-- AI LLM Engine -->
					<div class="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-sm text-foreground flex items-center gap-2">
								<Sparkles class="h-4 w-4 text-purple-500" />
								<span>AI Reasoning & Extraction LLM</span>
							</span>
							<span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
								READY (280ms)
							</span>
						</div>
						<div class="text-xs font-mono text-muted-foreground space-y-1">
							<div>Primary: Google Gemini 1.5 Flash via Antigravity CLI</div>
							<div>Air-Gap Local Fallback: Ollama Local (qwen2.5-coder:7b)</div>
							<div>Memory: Active Learning Few-Shot Ground Truth</div>
						</div>
					</div>

					<!-- Model Context Protocol (MCP) -->
					<div class="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-sm text-foreground flex items-center gap-2">
								<CommandLine class="h-4 w-4 text-amber-500" />
								<span>Model Context Protocol (MCP) Server</span>
							</span>
							<span class="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
								STANDALONE
							</span>
						</div>
						<div class="text-xs font-mono text-muted-foreground space-y-1">
							<div>Script: <code>mcp-server/src/index.ts</code> (Bun Stdio Engine)</div>
							<div>Tools: <code>check_invoice</code>, <code>stage_invoice_update</code>, <code>upload_document</code></div>
							<div>Resources: <code>novapilot://sop/factory-rules</code></div>
						</div>
					</div>
				</div>
			</div>
		</div>

	<!-- TAB 4: EXECUTION HISTORY & AUDIT (TANSTACK TABLE V9 POWERED) -->
	{:else if activeTab === "history"}
		<HistoryTable {tickets} />
	{/if}
</div>

<!-- REJECT REASON MODAL (SHADCN DIALOG STYLE) -->
{#if selectedTicketForReject}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
		<div class="w-full max-w-md bg-card p-6 rounded-xl border border-border shadow-xl space-y-4">
			<div class="flex items-center justify-between border-b border-border pb-3">
				<div>
					<h4 class="text-base font-semibold text-foreground">Reject Mutation Request</h4>
					<p class="text-xs text-muted-foreground mt-0.5">Ticket #{selectedTicketForReject.ticket_no}</p>
				</div>
				<button
					type="button"
					onclick={() => (selectedTicketForReject = null)}
					class="text-muted-foreground hover:text-foreground cursor-pointer"
				>
					<XMark class="h-5 w-5" />
				</button>
			</div>

			<div class="space-y-3 text-sm">
				<div>
					<label for="reject-reason" class="block font-medium mb-1.5 text-foreground text-xs">
						Reason for Rejection (Audit Log & Branch WhatsApp Reply)
					</label>
					<textarea
						id="reject-reason"
						bind:value={rejectionReason}
						rows={3}
						class="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						placeholder="e.g., Faktur pajak belum sesuai memo finance, nomor invoice sudah close."
					></textarea>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
				<button
					type="button"
					onclick={() => (selectedTicketForReject = null)}
					class="h-9 px-4 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={submitReject}
					disabled={processingAction || !rejectionReason.trim()}
					class="h-9 px-4 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium cursor-pointer disabled:opacity-50"
				>
					{processingAction ? "Submitting..." : "Confirm Rejection"}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- INTERACTIVE PLATFORM INTEGRATION TUTORIAL MODAL (SHADCN DIALOG WITH TABS) -->
{#if showTutorialModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200">
		<div class="w-full max-w-3xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
			
			<!-- Modal Header -->
			<div class="p-5 border-b border-border flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
						<BookOpen class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-base font-semibold text-foreground">Client Hook Integration Guide</h3>
						<p class="text-xs text-muted-foreground">Setup instructions and copyable snippets for Ferdium, Rambox, Web WA, and PC WA.</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => (showTutorialModal = false)}
					class="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
				>
					<XMark class="h-5 w-5" />
				</button>
			</div>

			<!-- Platform Tabs Inside Modal -->
			<div class="border-b border-border bg-muted/40 px-5 pt-2 flex items-center gap-2 overflow-x-auto text-xs">
				<button
					type="button"
					onclick={() => (activeTutorialTab = "ferdium")}
					class="px-3.5 py-2 font-medium border-b-2 transition-colors cursor-pointer {activeTutorialTab === 'ferdium' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					Ferdium Desktop
				</button>

				<button
					type="button"
					onclick={() => (activeTutorialTab = "rambox")}
					class="px-3.5 py-2 font-medium border-b-2 transition-colors cursor-pointer {activeTutorialTab === 'rambox' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					Rambox App
				</button>

				<button
					type="button"
					onclick={() => (activeTutorialTab = "web")}
					class="px-3.5 py-2 font-medium border-b-2 transition-colors cursor-pointer {activeTutorialTab === 'web' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					WhatsApp Web (Chrome / Edge)
				</button>

				<button
					type="button"
					onclick={() => (activeTutorialTab = "pc")}
					class="px-3.5 py-2 font-medium border-b-2 transition-colors cursor-pointer {activeTutorialTab === 'pc' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					PC WhatsApp (Baileys)
				</button>
			</div>

			<!-- Modal Body (Scrollable) -->
			<div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
				
				{#if activeTutorialTab === "ferdium"}
					<!-- Tab Ferdium -->
					<div class="space-y-3.5">
						<div class="flex items-center justify-between">
							<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
								<span>1. Connect via Native Ferdium Electron Recipe</span>
								<span class="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">Zero QR Scan</span>
							</h4>
						</div>

						<p class="text-xs text-muted-foreground leading-relaxed">
							Ferdium allows injecting scripts directly into its WhatsApp service webview. NovaPilot provides a dedicated observer hook that captures invoice mutation chats without requiring any third-party browser extensions.
						</p>

						<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
							<div class="font-semibold text-foreground">Step-by-Step Installation:</div>
							<ol class="list-decimal pl-4 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
								<li>Locate your Ferdium recipe folder: <code class="bg-background px-1 py-0.5 rounded border border-input text-foreground font-mono">%APPDATA%\Ferdium\recipes\whatsapp\</code></li>
								<li>Copy <code class="bg-background px-1 py-0.5 rounded border border-input text-foreground font-mono">novapilot-hook.js</code> into that folder.</li>
								<li>Open <code class="bg-background px-1 py-0.5 rounded border border-input text-foreground font-mono">webview.js</code> in the same folder, and append the injection code below.</li>
								<li>In Ferdium, press <kbd class="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[11px]">Ctrl + R</kbd> on your WhatsApp tab.</li>
							</ol>
						</div>

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-xs font-mono font-medium text-muted-foreground">Append to webview.js:</span>
								<button
									type="button"
									onclick={() => copySnippet(`// NovaPilot Hook Injection\nFerdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));`)}
									class="h-7 px-2.5 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 cursor-pointer"
								>
									{#if copiedCode}
										<Check class="h-3.5 w-3.5 text-emerald-500" />
										<span class="text-emerald-500">Copied!</span>
									{:else}
										<ClipboardDocument class="h-3.5 w-3.5" />
										<span>Copy Snippet</span>
									{/if}
								</button>
							</div>

							<pre class="p-3.5 rounded-lg bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-neutral-800">
<code><span class="text-neutral-500">// Append at the bottom of %APPDATA%\Ferdium\recipes\whatsapp\webview.js</span>
Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));</code></pre>
						</div>
					</div>

				{:else if activeTutorialTab === "rambox"}
					<!-- Tab Rambox -->
					<div class="space-y-3.5">
						<div class="flex items-center justify-between">
							<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
								<span>2. Connect via Rambox Custom JavaScript Injection</span>
								<span class="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">Service Advanced</span>
							</h4>
						</div>

						<p class="text-xs text-muted-foreground leading-relaxed">
							Rambox supports running arbitrary JavaScript inside any app tab. By injecting our observer, chats containing invoice mutations are passively forwarded to NovaPilot at <code>http://127.0.0.1:8088/api/tickets</code>.
						</p>

						<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
							<div class="font-semibold text-foreground">Step-by-Step Installation:</div>
							<ol class="list-decimal pl-4 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
								<li>Open Rambox and right-click your <strong>WhatsApp service</strong> icon.</li>
								<li>Select <strong>Settings</strong> $\rightarrow$ Expand <strong>Advanced</strong>.</li>
								<li>Find the <strong>"Inject JavaScript code"</strong> input box.</li>
								<li>Paste the script snippet below and click <strong>Save</strong>.</li>
							</ol>
						</div>

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-xs font-mono font-medium text-muted-foreground">Rambox Custom JS Code:</span>
								<button
									type="button"
									onclick={() => copySnippet(`(function() {\n  const BACKEND = "http://127.0.0.1:8088/api/tickets";\n  console.log("[NovaPilot] Rambox Hook Active");\n  // Mutation observer logic\n})();`)}
									class="h-7 px-2.5 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 cursor-pointer"
								>
									{#if copiedCode}
										<Check class="h-3.5 w-3.5 text-emerald-500" />
										<span class="text-emerald-500">Copied!</span>
									{:else}
										<ClipboardDocument class="h-3.5 w-3.5" />
										<span>Copy Snippet</span>
									{/if}
								</button>
							</div>

							<pre class="p-3.5 rounded-lg bg-neutral-950 text-blue-400 font-mono text-xs overflow-x-auto border border-neutral-800">
<code><span class="text-neutral-500">// Paste into Rambox -> WhatsApp -> Advanced -> Inject JavaScript code</span>
(function() &#123;
  const BACKEND = "http://127.0.0.1:8088/api/tickets";
  console.log("[NovaPilot] Rambox Hook Active on port 8088");
&#125;)();</code></pre>
						</div>
					</div>

				{:else if activeTutorialTab === "web"}
					<!-- Tab Web WhatsApp -->
					<div class="space-y-3.5">
						<div class="flex items-center justify-between">
							<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
								<span>3. Connect via Browser Userscript (Chrome, Edge, Firefox)</span>
								<span class="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">Tampermonkey</span>
							</h4>
						</div>

						<p class="text-xs text-muted-foreground leading-relaxed">
							If you use WhatsApp Web in Google Chrome, Microsoft Edge, or Mozilla Firefox, you can install the lightweight Tampermonkey userscript to hook incoming messages automatically.
						</p>

						<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
							<div class="font-semibold text-foreground">Step-by-Step Installation:</div>
							<ol class="list-decimal pl-4 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
								<li>Install the <strong>Tampermonkey</strong> or <strong>Violentmonkey</strong> extension from the Chrome Web Store.</li>
								<li>Click the Tampermonkey icon $\rightarrow$ <strong>Create a new script</strong>.</li>
								<li>Paste the Userscript code below and press <kbd class="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[11px]">Ctrl + S</kbd>.</li>
								<li>Reload <code>web.whatsapp.com</code>. Check Developer Console for <code>[NovaPilot Web Hook Active]</code>.</li>
							</ol>
						</div>

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-xs font-mono font-medium text-muted-foreground">Tampermonkey Userscript Header:</span>
								<button
									type="button"
									onclick={() => copySnippet(`// ==UserScript==\n// @name         NovaPilot WhatsApp Web Hook\n// @match        https://web.whatsapp.com/*\n// @grant        GM_xmlhttpRequest\n// ==/UserScript==\n\nconst NOVAPILOT_BACKEND = "http://127.0.0.1:8088/api/tickets";\nconsole.log("[NovaPilot Web Hook Active]");`)}
									class="h-7 px-2.5 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 cursor-pointer"
								>
									{#if copiedCode}
										<Check class="h-3.5 w-3.5 text-emerald-500" />
										<span class="text-emerald-500">Copied!</span>
									{:else}
										<ClipboardDocument class="h-3.5 w-3.5" />
										<span>Copy Snippet</span>
									{/if}
								</button>
							</div>

							<pre class="p-3.5 rounded-lg bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-neutral-800">
<code><span class="text-neutral-500">// ==UserScript==</span>
<span class="text-neutral-500">// @name         NovaPilot WhatsApp Web Hook</span>
<span class="text-neutral-500">// @match        https://web.whatsapp.com/*</span>
<span class="text-neutral-500">// @grant        GM_xmlhttpRequest</span>
<span class="text-neutral-500">// ==/UserScript==</span>

<span class="text-blue-400">const</span> NOVAPILOT_BACKEND = <span class="text-amber-300">"http://127.0.0.1:8088/api/tickets"</span>;
console.log(<span class="text-amber-300">"[NovaPilot Web Hook Active]"</span>);</code></pre>
						</div>
					</div>

				{:else}
					<!-- Tab PC WA / Baileys -->
					<div class="space-y-3.5">
						<div class="flex items-center justify-between">
							<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
								<span>4. Connect via Standalone PC WhatsApp Daemon (Baileys)</span>
								<span class="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">Headless Daemon</span>
							</h4>
						</div>

						<p class="text-xs text-muted-foreground leading-relaxed">
							For dedicated on-call servers or background terminal workers, run the included Baileys Multi-Device gateway. It supports automated confirmation replies back to the group once you sign off.
						</p>

						<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
							<div class="font-semibold text-foreground">Launch Commands:</div>
							<ol class="list-decimal pl-4 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
								<li>Open your PowerShell terminal in the project directory.</li>
								<li>Run: <code class="bg-background px-1 py-0.5 rounded border border-input text-foreground font-mono">cd whatsapp-gateway && bun run start</code></li>
								<li>Scan the terminal QR code once with WhatsApp on your on-call phone.</li>
								<li>Whitelisted groups are automatically monitored for document mutation requests.</li>
							</ol>
						</div>

						<pre class="p-3.5 rounded-lg bg-neutral-950 text-amber-400 font-mono text-xs overflow-x-auto border border-neutral-800">
<code><span class="text-neutral-500"># PowerShell in novapilot-ai directory</span>
cd whatsapp-gateway
bun run start
<span class="text-neutral-500"># Or run test simulation without physical phone:</span>
bun run simulate</code></pre>
					</div>
				{/if}
			</div>

			<!-- Modal Footer with Quick Test Ping Button -->
			<div class="p-4 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					{#if testHookSuccess}
						<span class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
							<CheckCircle class="h-4 w-4" />
							<span>Test packet successfully queued! Check Approval Queue.</span>
						</span>
					{:else}
						<span>Click "Send Test Ping" to verify end-to-end webhook delivery right now.</span>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={testHookPing}
						class="h-9 px-3.5 rounded-md border border-input bg-background hover:bg-accent text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
					>
						<Sparkles class="h-3.5 w-3.5 text-primary" />
						<span>Send Test Hook Ping</span>
					</button>

					<button
						type="button"
						onclick={() => (showTutorialModal = false)}
						class="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
