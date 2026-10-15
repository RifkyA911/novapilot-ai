<script lang="ts">
	import { 
		ShieldCheck, CheckCircle, XCircle, Clock, 
		ServerStack, ArrowPath, Check, 
		XMark, ArrowUpTray, ArrowTopRightOnSquare, ChartBarSquare, 
		MagnifyingGlass, Sparkles, CommandLine, CpuChip, Radio, LockClosed, 
		CodeBracket, Eye, InformationCircle, ChevronDown, ChevronUp,
		CircleStack, PaperAirplane, ArrowRight, ExclamationTriangle, ChatBubbleLeftRight,
		UserGroup, DocumentText
	} from "svelte-heros-v2";
	import { cockpit, type Ticket } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";
	import InspectModal from "$lib/components/InspectModal.svelte";
	import RejectModal from "$lib/components/RejectModal.svelte";
	import { timeAgo } from "$lib/utils";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	let currentUser = $derived(data.user || {
		id: "usr_guest",
		name: "John Doe",
		email: "johndoe@factory.internal",
		role: "oncall_engineer" as const
	});

	let isPipelineFolded = $state(true);

	// Modals
	let inspectedTicket = $state<Ticket | null>(null);
	let selectedTicketForReject = $state<Ticket | null>(null);
	let processingAction = $state(false);

	async function handleApprove(ticket: Ticket) {
		processingAction = true;
		const res = await cockpit.handleApprove(ticket, currentUser.name);
		if (!res.success) {
			alert(`Approval failed: ${res.error}`);
		}
		processingAction = false;
	}

	async function submitReject(reason: string) {
		if (!selectedTicketForReject) return;
		processingAction = true;
		const res = await cockpit.handleReject(selectedTicketForReject, currentUser.name, reason);
		if (res.success) {
			selectedTicketForReject = null;
		} else {
			alert(`Rejection failed: ${res.error}`);
		}
		processingAction = false;
	}
</script>

<svelte:head>
	<title>{i18n.t.nav.overview} • NovaPilot AI</title>
	<link rel="canonical" href="https://novapilot.internal/dashboard" />
	<meta name="description" content="Operations dashboard for real-time chat intake, guardrail assurance, dual-database paradigm monitoring, and on-call ticket staging." />
</svelte:head>

<!-- Inspect Plan Modal -->
<InspectModal 
	ticket={inspectedTicket} 
	onclose={() => (inspectedTicket = null)} 
/>

<!-- Reject Modal -->
<RejectModal 
	ticket={selectedTicketForReject} 
	processing={processingAction}
	onclose={() => (selectedTicketForReject = null)}
	onsubmit={submitReject}
/>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	
	<!-- ========================================================================= -->
	<!-- 1. GUARDRAIL ASSURANCE & REAL-TIME INTAKE ENGINE CARD                     -->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4 transition-all">
		<!-- Top Bar: Telemetry, Title, SSE Pulse & Refresh -->
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
			<!-- Left: Title & Guard Status -->
			<div class="flex items-center gap-3">
				<div class="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs shrink-0">
					<ShieldCheck class="h-5 w-5" />
				</div>
				<div>
					<div class="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
						<span>{i18n.t.overview.guardrail_title}</span>
						<span class="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
							{i18n.t.overview.active_guard}
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-0.5">{i18n.t.overview.guardrail_desc}</p>
				</div>
			</div>

			<!-- Right: SSE Pulse Indicator & Refresh Button -->
			<div class="flex items-center gap-2">
				<!-- SSE Pulse Indicator -->
				<div class="h-9 px-3 rounded-lg bg-muted/60 border border-input text-xs font-mono flex items-center gap-2 shadow-xs">
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full {cockpit.sseConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 {cockpit.sseConnected ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
					</span>
					<span class="font-medium {cockpit.sseConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}">
						{cockpit.sseConnected ? i18n.t.overview.sse_live : i18n.t.overview.sse_offline}
					</span>
				</div>

				<!-- Refresh Button -->
				<button
					type="button"
					onclick={() => cockpit.fetchTickets()}
					class="h-9 w-9 rounded-lg border border-input bg-background hover:bg-accent text-foreground transition-colors flex items-center justify-center shadow-xs cursor-pointer"
					title={i18n.t.actions.refresh}
				>
					<ArrowPath class="h-4 w-4 {cockpit.loading ? 'animate-spin' : ''}" />
				</button>
			</div>
		</div>

		<!-- Middle Divider & Foldable Pipeline Header -->
		<div class="pt-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
			<!-- Left: Step Indicator -->
			<div class="flex items-center gap-2 text-xs font-mono text-muted-foreground">
				<CpuChip class="h-4 w-4 text-primary" />
				<span class="font-semibold text-foreground">{i18n.t.overview.pipeline_title}</span>
				<span class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
					{i18n.t.overview.pipeline_standby}
				</span>
			</div>

			<!-- Right: LAN, DB Paradigm, DB Connectors on the LEFT of Expand Pipeline Details -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- LAN Telemetry Badge (Live from backend probe) -->
				<div class="h-8 px-2.5 rounded-lg bg-muted/60 border border-input text-xs font-mono text-muted-foreground flex items-center gap-1.5 shadow-xs">
					<span class="text-foreground font-semibold">LAN:</span>
					<span>{cockpit.telemetry?.lan_ip || "127.0.0.1"}</span>
				</div>

				<!-- Dual Database Paradigm Dropdown (Universal Enterprise LTS) -->
				<div class="flex items-center">
					<select
						bind:value={cockpit.dbEngineMode}
						class="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
						title="Select Database Engine Architecture (Enterprise LTS)"
					>
						<option value="relational">Relational: PostgreSQL / Oracle / MySQL (LTS)</option>
						<option value="non_relational">Non-Relational: MongoDB / Redis (LTS)</option>
					</select>
				</div>

				<!-- DB Connectors Dedicated URL Link -->
				<a
					href="/dashboard/connectors"
					class="h-8 px-2.5 rounded-lg border border-input bg-background hover:bg-accent text-foreground text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
					title="Open Database Connectors GUI Manager"
				>
					<CircleStack class="h-3.5 w-3.5 text-amber-500" />
					<span class="hidden sm:inline">DB Connectors</span>
				</a>

				<!-- Fold / Unfold Toggle Button -->
				<button
					type="button"
					onclick={() => isPipelineFolded = !isPipelineFolded}
					class="h-8 px-3 rounded-lg text-xs font-medium border border-input bg-background hover:bg-accent text-foreground transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
				>
					<span>{isPipelineFolded ? i18n.t.overview.expand_pipeline : i18n.t.overview.fold_pipeline}</span>
					{#if isPipelineFolded}
						<ChevronDown class="h-3.5 w-3.5 text-muted-foreground" />
					{:else}
						<ChevronUp class="h-3.5 w-3.5 text-muted-foreground" />
					{/if}
				</button>
			</div>
		</div>

		<!-- When FOLDED: Show sleek horizontal steps line directly -->
		{#if isPipelineFolded}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1 font-mono text-xs">
				<div class="px-3 py-2 rounded-lg border flex items-center justify-between transition-colors bg-muted/40 border-border text-muted-foreground">
					<div class="flex items-center gap-2">
						<Radio class="h-3.5 w-3.5 text-primary" />
						<span>01. Ingest ({cockpit.chatPlatform === 'whatsapp' ? 'WA' : cockpit.chatPlatform === 'telegram' ? 'TG' : cockpit.chatPlatform === 'discord' ? 'Discord' : 'Slack'})</span>
					</div>
				</div>

				<div class="px-3 py-2 rounded-lg border flex items-center justify-between transition-colors bg-muted/40 border-border text-muted-foreground">
					<div class="flex items-center gap-2">
						<CpuChip class="h-3.5 w-3.5 text-purple-500" />
						<span>02. Extract (LLM)</span>
					</div>
				</div>

				<div class="px-3 py-2 rounded-lg border flex items-center justify-between transition-colors bg-muted/40 border-border text-muted-foreground">
					<div class="flex items-center gap-2">
						<ServerStack class="h-3.5 w-3.5 text-amber-500" />
						<span>03. Pre-Check</span>
					</div>
				</div>

				<div class="px-3 py-2 rounded-lg border flex items-center justify-between transition-colors bg-muted/40 border-border text-muted-foreground">
					<div class="flex items-center gap-2">
						<ShieldCheck class="h-3.5 w-3.5 text-emerald-500" />
						<span>04. Gatekeeper</span>
					</div>
					{#if cockpit.pendingCount > 0}
						<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
							{cockpit.pendingCount}
						</span>
					{/if}
				</div>

				<div class="col-span-2 sm:col-span-1 px-3 py-2 rounded-lg border flex items-center justify-between transition-colors bg-muted/40 border-border text-muted-foreground">
					<div class="flex items-center gap-2">
						<LockClosed class="h-3.5 w-3.5 text-rose-500" />
						<span>05. Commit ({cockpit.dbEngineMode === 'relational' ? 'SQL' : 'BSON'})</span>
					</div>
					<span class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Atomic</span>
				</div>
			</div>
		{:else}
			<!-- Expanded Details Cards -->
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
				<div class="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
					<div class="font-semibold text-foreground flex items-center gap-1.5">
						<Radio class="h-3.5 w-3.5 text-primary" />
						<span>{cockpit.platformStatuses[cockpit.chatPlatform].name} Gateway Layer</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						{cockpit.platformStatuses[cockpit.chatPlatform].driver}. Drops unauthorized traffic with zero token waste.
					</p>
				</div>

				<div class="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
					<div class="font-semibold text-foreground flex items-center gap-1.5">
						<CpuChip class="h-3.5 w-3.5 text-purple-500" />
						<span>Deterministic AI Parsing</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Extracts document number, field mutation target, and proposed values with 95%+ confidence schema.
					</p>
				</div>

				<div class="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
					<div class="font-semibold text-foreground flex items-center gap-1.5">
						<CircleStack class="h-3.5 w-3.5 text-amber-500" />
						<span>{cockpit.dbEngineMode === 'relational' ? 'Relational Pre-Check' : 'NoSQL Schema Pre-Check'}</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						{cockpit.dbEngineMode === 'relational' 
							? 'Executes read-only SELECT verification and locks against closed financial periods.'
							: 'Validates BSON collection document existence and pre-generates compensating JSON patch.'}
					</p>
				</div>

				<div class="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
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

	<!-- Inbound Messages Alert Banner -->
	{#if cockpit.needsReviewCount > 0}
		<div class="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
			<div class="flex items-center gap-3">
				<div class="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
					<ExclamationTriangle class="h-5 w-5" />
				</div>
				<div>
					<h4 class="text-xs font-bold text-foreground">
						{i18n.t.overview.needs_review_title.replace('{count}', String(cockpit.needsReviewCount)).replace('{plural}', cockpit.needsReviewCount > 1 ? 's' : '')}
					</h4>
					<p class="text-[11px] text-muted-foreground">
						{i18n.t.overview.needs_review_desc}
					</p>
				</div>
			</div>
			<a
				href="/dashboard/messages"
				class="h-8 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
			>
				<span>{i18n.t.overview.review_stage_btn}</span>
				<ArrowTopRightOnSquare class="h-3.5 w-3.5" />
			</a>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. DATABASE ARCHITECTURE & ENTERPRISE KPI CARDS                           -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<!-- KPI 1: Pending Review -->
		<a 
			href="/dashboard/queue" 
			class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1 hover:border-primary/50 transition-colors group"
		>
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">{i18n.t.overview.kpi_pending}</div>
			<div class="text-2xl sm:text-3xl font-bold font-mono text-amber-500 flex items-center justify-between">
				<span>{cockpit.pendingCount}</span>
				<Clock class="h-5 w-5 text-amber-500/40 group-hover:text-amber-500 transition-colors" />
			</div>
			<div class="text-xs text-muted-foreground flex items-center justify-between">
				<span>{i18n.t.overview.kpi_pending_sub}</span>
				<span class="text-primary group-hover:underline text-[11px]">&rarr;</span>
			</div>
		</a>

		<!-- KPI 2: Mutated Today -->
		<a 
			href="/dashboard/history" 
			class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1 hover:border-emerald-500/50 transition-colors group"
		>
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">{i18n.t.overview.kpi_executed}</div>
			<div class="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
				<span>{cockpit.executedCount}</span>
				<CheckCircle class="h-5 w-5 text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
			</div>
			<div class="text-xs text-muted-foreground flex items-center justify-between">
				<span>{i18n.t.overview.kpi_executed_sub}</span>
				<span class="text-primary group-hover:underline text-[11px]">&rarr;</span>
			</div>
		</a>

		<!-- KPI 3: Policy Rejected -->
		<a 
			href="/dashboard/history" 
			class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1 hover:border-muted-foreground/50 transition-colors group"
		>
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">{i18n.t.overview.kpi_rejected}</div>
			<div class="text-2xl sm:text-3xl font-bold font-mono text-foreground flex items-center justify-between">
				<span>{cockpit.rejectedCount}</span>
				<XCircle class="h-5 w-5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
			</div>
			<div class="text-xs text-muted-foreground flex items-center justify-between">
				<span>{i18n.t.overview.kpi_rejected_sub}</span>
				<span class="text-primary group-hover:underline text-[11px]">&rarr;</span>
			</div>
		</a>

		<!-- KPI 4: Database Architecture -->
		<a 
			href="/dashboard/connectors" 
			class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1 hover:border-primary/50 transition-colors group"
		>
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Database Architecture</div>
			<div class="text-2xl sm:text-3xl font-bold font-mono text-primary flex items-center justify-between">
				<span>{cockpit.dbEngineMode === 'relational' ? 'SQL' : 'NoSQL'}</span>
				<ServerStack class="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
			</div>
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span class="truncate">{cockpit.dbEngineMode === 'relational' ? 'PostgreSQL, Oracle, MySQL (LTS)' : 'MongoDB, Redis (LTS)'}</span>
				<span class="text-primary font-medium ml-1 shrink-0 group-hover:underline">&rarr;</span>
			</div>
		</a>
	</div>

	<!-- ========================================================================= -->
	<!-- 2.5 REAL-TIME OPERATIONS TRAFFIC & MULTIPLATFORM INTAKE CHARTS             -->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-xs">
					<ChartBarSquare class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
						{i18n.t.overview.traffic_title}
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-primary/10 text-primary border border-primary/20">
							{i18n.t.overview.traffic_badge}
						</span>
					</h3>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.overview.traffic_subtitle}
					</p>
				</div>
			</div>

			<a
				href="/dashboard/cockpit"
				class="h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
			>
				<Sparkles class="h-3.5 w-3.5 text-purple-500" />
				<span>{i18n.t.overview.cockpit_btn}</span>
			</a>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
			<!-- Left 2 Cols: Inbound Traffic Chart -->
			<div class="lg:col-span-2 p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-3 flex flex-col justify-between">
				<div class="flex items-center justify-between text-xs font-mono">
					<span class="text-foreground font-semibold">{i18n.t.overview.chart_volume_title}</span>
					<div class="flex items-center gap-3 text-[11px]">
						<span class="flex items-center gap-1.5 text-blue-500">
							<span class="h-2 w-2 rounded-full bg-blue-500"></span>
							<span>{i18n.t.overview.chart_total_intake}</span>
						</span>
						<span class="flex items-center gap-1.5 text-emerald-500">
							<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
							<span>{i18n.t.overview.chart_approved}</span>
						</span>
					</div>
				</div>

				<!-- SVG Area Chart -->
				<div class="w-full h-44 flex items-end">
					<svg viewBox="0 0 600 160" class="w-full h-full overflow-visible">
						<defs>
							<linearGradient id="dashTrafficGrad" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35" />
								<stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
							</linearGradient>
							<linearGradient id="dashApprovedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
								<stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
							</linearGradient>
						</defs>

						<!-- Grid lines -->
						<line x1="20" y1="30" x2="580" y2="30" stroke="currentColor" class="text-border/40" stroke-dasharray="3 3" />
						<line x1="20" y1="80" x2="580" y2="80" stroke="currentColor" class="text-border/40" stroke-dasharray="3 3" />
						<line x1="20" y1="130" x2="580" y2="130" stroke="currentColor" class="text-border/40" stroke-dasharray="3 3" />

						<!-- Total Intake Curve (Blue) -->
						<path 
							d="M 30 120 C 110 90, 150 110, 210 75 C 270 45, 330 95, 390 40 C 450 -5, 510 50, 570 30 L 570 145 L 30 145 Z" 
							fill="url(#dashTrafficGrad)" 
						/>
						<path 
							d="M 30 120 C 110 90, 150 110, 210 75 C 270 45, 330 95, 390 40 C 450 -5, 510 50, 570 30" 
							fill="none" 
							stroke="#3b82f6" 
							stroke-width="2.5" 
						/>

						<!-- Approved & Mutated Curve (Emerald) -->
						<path 
							d="M 30 135 C 110 110, 150 125, 210 95 C 270 70, 330 115, 390 65 C 450 25, 510 75, 570 55 L 570 145 L 30 145 Z" 
							fill="url(#dashApprovedGrad)" 
						/>
						<path 
							d="M 30 135 C 110 110, 150 125, 210 95 C 270 70, 330 115, 390 65 C 450 25, 510 75, 570 55" 
							fill="none" 
							stroke="#10b981" 
							stroke-width="2" 
						/>

						<!-- Data Points -->
						<circle cx="30" cy="120" r="3.5" fill="#3b82f6" />
						<circle cx="210" cy="75" r="3.5" fill="#3b82f6" />
						<circle cx="390" cy="40" r="3.5" fill="#3b82f6" />
						<circle cx="570" cy="30" r="3.5" fill="#3b82f6" />

						<circle cx="30" cy="135" r="3" fill="#10b981" />
						<circle cx="210" cy="95" r="3" fill="#10b981" />
						<circle cx="390" cy="65" r="3" fill="#10b981" />
						<circle cx="570" cy="55" r="3" fill="#10b981" />
					</svg>
				</div>

				<div class="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/50">
					<span>{i18n.current === 'id' ? 'Sen (42 chat)' : 'Mon (42 chats)'}</span>
					<span>{i18n.current === 'id' ? 'Sel (68 chat)' : 'Tue (68 chats)'}</span>
					<span>{i18n.current === 'id' ? 'Rab (55 chat)' : 'Wed (55 chats)'}</span>
					<span>{i18n.current === 'id' ? 'Kam (90 chat)' : 'Thu (90 chats)'}</span>
					<span>{i18n.current === 'id' ? 'Jum (112 chat)' : 'Fri (112 chats)'}</span>
					<span>{i18n.current === 'id' ? 'Sab (48 chat)' : 'Sat (48 chats)'}</span>
					<span>{i18n.current === 'id' ? 'Min (35 chat)' : 'Sun (35 chats)'}</span>
				</div>
			</div>

			<!-- Right 1 Col: Platform Share Breakdown -->
			<div class="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-3">
				<div class="flex items-center justify-between text-xs font-mono">
					<span class="text-foreground font-semibold">{i18n.t.overview.channel_share_title}</span>
					<span class="text-primary font-bold">{i18n.t.overview.channel_total_ingress}</span>
				</div>

				<div class="space-y-2.5 text-xs font-mono">
					<!-- WhatsApp -->
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<span class="text-emerald-500 font-semibold flex items-center gap-1.5">
								<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
								<span>WhatsApp (Baileys/Hook)</span>
							</span>
							<span class="font-bold text-foreground">68% (340)</span>
						</div>
						<div class="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
							<div class="h-full rounded-full bg-emerald-500" style="width: 68%"></div>
						</div>
					</div>

					<!-- Telegram -->
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<span class="text-sky-500 font-semibold flex items-center gap-1.5">
								<span class="h-2 w-2 rounded-full bg-sky-500"></span>
								<span>Telegram Bot API</span>
							</span>
							<span class="font-bold text-foreground">18% (90)</span>
						</div>
						<div class="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
							<div class="h-full rounded-full bg-sky-500" style="width: 18%"></div>
						</div>
					</div>

					<!-- Slack -->
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<span class="text-rose-500 font-semibold flex items-center gap-1.5">
								<span class="h-2 w-2 rounded-full bg-rose-500"></span>
								<span>Slack Enterprise</span>
							</span>
							<span class="font-bold text-foreground">9% (45)</span>
						</div>
						<div class="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
							<div class="h-full rounded-full bg-rose-500" style="width: 9%"></div>
						</div>
					</div>

					<!-- Discord -->
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<span class="text-indigo-500 font-semibold flex items-center gap-1.5">
								<span class="h-2 w-2 rounded-full bg-indigo-500"></span>
								<span>Discord Webhook</span>
							</span>
							<span class="font-bold text-foreground">5% (25)</span>
						</div>
						<div class="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
							<div class="h-full rounded-full bg-indigo-500" style="width: 5%"></div>
						</div>
					</div>
				</div>

				<div class="pt-2 border-t border-border/50 text-[10.5px] font-mono text-muted-foreground space-y-1">
					<div class="flex items-center justify-between">
						<span>Avg Latency (P50):</span>
						<span class="text-foreground font-semibold">180 ms</span>
					</div>
					<div class="flex items-center justify-between">
						<span>DB 1 Pool State:</span>
						<span class="text-emerald-500 font-semibold">HEALTHY (1 Open)</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. DEDICATED OPERATIONS NAVIGATION HUB (DIRECT URL SHORTCUTS)              -->
	<!-- ========================================================================= -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-mono">
				Operations Cockpit Menus
			</h2>
			<span class="text-xs text-muted-foreground">Each module has its dedicated URL</span>
		</div>

		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
			<!-- Menu 1: Approval Queue -->
			<a
				href="/dashboard/queue"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<Clock class="h-5 w-5" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Approval Queue</span>
						{#if cockpit.pendingCount > 0}
							<span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
								{cockpit.pendingCount}
							</span>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						Pending ChatOps mutation tickets, side-by-side diffs, and cryptographic sign-off.
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/queue &rarr;
					</span>
				</div>
			</a>

			<!-- Menu 2: Universal DB Connectors -->
			<a
				href="/dashboard/connectors"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<CircleStack class="h-5 w-5 text-amber-500" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">DB Connectors GUI</span>
						<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
							LTS
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						Multi-engine manager supporting PostgreSQL, Oracle, MySQL, Mongo, Redis, and SQLite.
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/connectors &rarr;
					</span>
				</div>
			</a>

			<!-- Menu 3: System Telemetry & Probes -->
			<a
				href="/dashboard/connectivity"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<CpuChip class="h-5 w-5" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">System Telemetry</span>
						<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
							Live Probes
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						LAN IP probes, Go runtime memory metrics, Ferdium/Rambox health & setup guide.
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/connectivity &rarr;
					</span>
				</div>
			</a>

			<!-- Menu 4: Execution History -->
			<a
				href="/dashboard/history"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<ChartBarSquare class="h-5 w-5" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Execution History</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						Audit logs, compensating rollback scripts, and cryptographic proof attachments.
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/history &rarr;
					</span>
				</div>
			</a>

			<!-- Menu 5: Client Hook Ecosystem -->
			<a
				href="/dashboard/hooks"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<CodeBracket class="h-5 w-5" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Client Hook Flows</span>
						<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
							{cockpit.chatPlatform}
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						{cockpit.platformStatuses[cockpit.chatPlatform].driver}
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/hooks &rarr;
					</span>
				</div>
			</a>

			<!-- Menu 6: ChatOps Simulator -->
			<a
				href="/dashboard/simulator"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<PaperAirplane class="h-5 w-5" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{cockpit.platformStatuses[cockpit.chatPlatform].name} Simulator</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						Interactive simulation of branch chat ingestion and entity extraction.
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/simulator &rarr;
					</span>
				</div>
			</a>

			<!-- Menu 7: Cockpit Overview & AI Analytics -->
			<a
				href="/dashboard/cockpit"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<Sparkles class="h-5 w-5" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Cockpit Overview</span>
						<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
							DUMMY
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						AI intent classification breakdown, Tesseract OCR confidence, and guardrail metrics.
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/cockpit &rarr;
					</span>
				</div>
			</a>

			<!-- Menu 8: System Logs & Telemetry -->
			<a
				href="/dashboard/logs"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<DocumentText class="h-5 w-5" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">System Logs</span>
						<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
							STREAM
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						Live daemon terminal logs from Go Core :8088, PostgreSQL 18 :5432, and WA Gateway.
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/logs &rarr;
					</span>
				</div>
			</a>

			<!-- Menu 9: Group Contacts Directory -->
			<a
				href="/dashboard/contacts"
				class="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all flex items-start gap-3.5 group shadow-xs"
			>
				<div class="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
					<UserGroup class="h-5 w-5" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Group Contacts</span>
						<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
							DUMMY
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
						Whitelisted regional branch WhatsApp groups, Telegram channels, and authorized admins.
					</p>
					<span class="text-[11px] font-mono text-primary font-medium mt-2 inline-flex items-center gap-1">
						/dashboard/contacts &rarr;
					</span>
				</div>
			</a>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 4. ACTIVE PENDING APPROVALS SNAPSHOT (RECENT PREVIEW)                     -->
	<!-- ========================================================================= -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Clock class="h-4 w-4 text-amber-500" />
				<h2 class="text-sm font-semibold text-foreground">{i18n.t.overview.queue_preview_title}</h2>
				{#if cockpit.pendingCount > 0}
					<span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
						{cockpit.pendingCount} {i18n.t.status.pending}
					</span>
				{/if}
			</div>

			<a 
				href="/dashboard/queue" 
				class="text-xs font-medium text-primary hover:underline flex items-center gap-1"
			>
				<span>{i18n.t.overview.view_all}</span>
				<ArrowRight class="h-3.5 w-3.5" />
			</a>
		</div>

		{#if cockpit.tickets.filter(t => t.status === "PENDING_APPROVAL").length === 0}
			<div class="p-8 rounded-2xl border border-dashed border-border bg-card text-center space-y-2">
				<div class="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
					<CheckCircle class="h-6 w-6" />
				</div>
				<div class="text-sm font-semibold text-foreground">{i18n.t.overview.empty_queue}</div>
				<p class="text-xs text-muted-foreground max-w-sm mx-auto">
					{i18n.t.queue.no_pending_desc}
				</p>
				<div class="pt-2">
					<a
						href="/dashboard/simulator"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
					>
						<PaperAirplane class="h-3.5 w-3.5" />
						<span>{i18n.t.queue.send_simulated}</span>
					</a>
				</div>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each cockpit.tickets.filter(t => t.status === "PENDING_APPROVAL").slice(0, 3) as ticket (ticket.id)}
					<div class="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div class="min-w-0 space-y-1">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="font-mono font-bold text-xs text-foreground">{ticket.ticket_no}</span>
								<span class="text-xs text-muted-foreground font-mono">Doc: {ticket.document_no}</span>
								{#if ticket.branch_name}
									<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
										{ticket.branch_name}
									</span>
								{/if}
								<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
									{(ticket.confidence_score * 100).toFixed(0)}% AI Conf
								</span>
							</div>

							<!-- Side by side diff -->
							<div class="flex items-center gap-2 text-xs font-mono pt-1">
								<span class="line-through text-rose-500">{ticket.current_value}</span>
								<span class="text-muted-foreground">&rarr;</span>
								<span class="font-bold text-emerald-600 dark:text-emerald-400">{ticket.proposed_value}</span>
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center gap-2 shrink-0">
							<button
								type="button"
								onclick={() => (inspectedTicket = ticket)}
								class="h-8 px-2.5 rounded-lg border border-input bg-background hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1 cursor-pointer"
								title={i18n.t.actions.inspect}
							>
								<Eye class="h-3.5 w-3.5" />
								<span>{i18n.t.actions.inspect}</span>
							</button>

							<button
								type="button"
								onclick={() => (selectedTicketForReject = ticket)}
								class="h-8 px-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium cursor-pointer"
							>
								{i18n.t.actions.reject}
							</button>

							<button
								type="button"
								onclick={() => handleApprove(ticket)}
								disabled={processingAction}
								class="h-8 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
							>
								<Check class="h-3.5 w-3.5" />
								<span>{i18n.t.actions.approve}</span>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

</div>
