<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		ShieldCheck, CheckCircle, ArrowRight, ServerStack, CpuChip, Radio, LockClosed, Bolt, 
		DocumentText, Sparkles, CommandLine, Square3Stack3d, ArrowPath, ExclamationTriangle, 
		Check, XMark, Server, ChatBubbleLeftRight, CodeBracket, ChevronRight, Key, ArrowTopRightOnSquare,
		Play
	} from "svelte-heros-v2";
	import HookEcosystemVisualizer from "$lib/components/HookEcosystemVisualizer.svelte";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";

	let activeStage = $state(1);
	let isSimulating = $state(false);

	// WhatsApp Gateway Service Controller State (:3002)
	let gwLoading = $state(false);
	let gwActionMessage = $state<string | null>(null);
	let gwActionType = $state<"success" | "error" | "info">("info");
	let gwRunning = $state(false);
	let gwStatusData = $state<{
		service?: string;
		port?: number;
		status?: string;
		uptime_seconds?: number;
		memory_rss_mb?: string;
		mode?: string;
		whitelisted_groups?: string[];
	} | null>(null);

	let pollTimer: any = null;

	async function fetchGatewayStatus() {
		try {
			const res = await fetch("/api/gateway/status");
			if (res.ok) {
				const json = await res.json();
				gwRunning = json.running === true;
				gwStatusData = json.data || null;
			}
		} catch (e) {
			console.error("Failed to poll gateway status:", e);
		}
	}

	async function triggerGatewayAction(action: "start" | "restart" | "stop") {
		gwLoading = true;
		gwActionMessage = 
			action === "start" ? "Launching WhatsApp Gateway service (bun run start / npx tsx)..." :
			action === "restart" ? "Restarting WhatsApp Gateway daemon on port 3002..." :
			"Shutting down WhatsApp Gateway daemon (:3002)...";
		gwActionType = "info";

		try {
			const res = await fetch(`/api/gateway/${action}`, { method: "POST" });
			const json = await res.json();
			if (res.ok && json.ok) {
				gwActionMessage = json.message || `Service ${action} executed successfully.`;
				gwActionType = "success";
			} else {
				gwActionMessage = json.error || json.message || `Service ${action} failed.`;
				gwActionType = "error";
			}
			await fetchGatewayStatus();
		} catch (e: any) {
			gwActionMessage = `API connection error: ${e.message}`;
			gwActionType = "error";
		} finally {
			gwLoading = false;
			setTimeout(() => {
				if (gwActionType === "success") gwActionMessage = null;
			}, 7000);
		}
	}

	function formatUptime(seconds?: number): string {
		if (!seconds || seconds <= 0) return "0s";
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) return `${h}h ${m}m ${s}s`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}

	onMount(() => {
		fetchGatewayStatus();
		pollTimer = setInterval(fetchGatewayStatus, 4000);
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});

	const platformMeta = $derived({
		whatsapp: {
			name: "WhatsApp",
			ingressTitle: "1. WhatsApp Ingestion Layer",
			ingressSubtitle: "Baileys Socket & DOM Hook Filter",
			ingressBadge: "WhatsApp Ingress",
			ingressSummary: "Captures messages from authorized regional WhatsApp groups, applies debounce rate-limiting, and normalizes conversational chat.",
			ingressDetails: [
				"Maintains a persistent virtual WhatsApp Web session locally via socket connection (Baileys / WA-Web.js) or DOM MutationObserver.",
				"Validates incoming sender JID against an authorized group whitelist (e.g. Surabaya, Medan, Semarang, Makassar).",
				"Non-whitelisted chats, stickers, and casual social chatter are dropped immediately at the network edge with zero AI token consumption.",
				"Dispatches a clean JSON webhook payload to the Golang core backend at POST /api/tickets."
			],
			ingressCode: `// WhatsApp Baileys & DOM Filter Logic
if (!WHITELISTED_GROUPS.includes(message.remoteJid)) {
    return; // Immediate drop: Zero token waste
}

// Forward to NovaPilot Golang Ingestion Webhook
await fetch("http://localhost:8088/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        raw_message: message.body,
        branch_id: resolveBranchId(message.remoteJid),
        channel: "whatsapp"
    })
});`,
			replyTitle: "6. WhatsApp Reply & Active Learning",
			replySubtitle: "Thread Confirmation & Training Cache",
			replyDetails: [
				"Outbound Reply: Sends exactly one confirmation message back to the originating WhatsApp group thread ('✅ Ticket #TK-101 completed').",
				"Active Learning Capture: If the engineer modified the proposed value prior to approval, the pair (raw_chat, corrected_json) is stored in data/training/ground_truth.jsonl.",
				"Dynamic Context Injection: Backend automatically loads recently corrected pairs as dynamic few-shot prompts for future queries.",
				"The agent learns branch-specific dialect patterns organically over time without requiring manual codebase changes."
			],
			circuitDesc: "WhatsApp Socket & Hook → LLM Guardrail → Pre-Check → Human Sign-off → DB Commit",
			node1Label: "WhatsApp",
			apiKeyLabel: "Meta WhatsApp Cloud API & Apps",
			apiKeyUrl: "https://developers.facebook.com/apps/",
			portalName: "Meta Developer Console"
		},
		telegram: {
			name: "Telegram Bot",
			ingressTitle: "1. Telegram Ingress Layer",
			ingressSubtitle: "BotFather Webhook & Chat ID Filter",
			ingressBadge: "Telegram Ingress",
			ingressSummary: "Captures escalations via Telegram Bot API Webhook or Long-Polling, verifies chat_id against regional plant whitelist.",
			ingressDetails: [
				"Configures HTTPS Webhook listener at /api/webhooks/telegram or long-polling worker via BotFather token.",
				"Validates incoming update.Message.Chat.ID against the authorized regional plant group whitelist.",
				"Non-whitelisted public messages, stickers, and channel spam are dropped immediately at the gateway edge.",
				"Dispatches standard JSON ticket payload to Golang core backend at POST /api/tickets."
			],
			ingressCode: `// Telegram Bot Webhook & Chat ID Whitelist
if !IsWhitelistedChat(update.Message.Chat.ID) {
    return // Drop unauthorized group update immediately
}

ticketPayload := ParseTelegramUpdate(update)
resp, err := http.Post("http://localhost:8088/api/tickets", "application/json", ticketPayload)
if err != nil {
    log.Printf("Failed to dispatch ticket: %v", err)
}`,
			replyTitle: "6. Telegram Inline Reply & Active Learning",
			replySubtitle: "Inline Keyboard Confirmation & Training Cache",
			replyDetails: [
				"Outbound Reply: Dispatches rich inline keyboard status message back to the originating Telegram chat ('✅ Ticket #TK-101 completed').",
				"Active Learning Capture: Saves human supervisor overrides in ground_truth.jsonl for ongoing model few-shot tuning.",
				"Dynamic Context Injection: Automatically provides newly learned corrections to future parsing pipelines.",
				"Ensures prompt consistency across branch plant teams."
			],
			circuitDesc: "Telegram Bot API → LLM Guardrail → Pre-Check → Human Sign-off → DB Commit",
			node1Label: "Telegram",
			apiKeyLabel: "Get Bot Token via @BotFather",
			apiKeyUrl: "https://t.me/BotFather",
			portalName: "Telegram @BotFather"
		},
		discord: {
			name: "Discord Webhook",
			ingressTitle: "1. Discord Gateway Layer",
			ingressSubtitle: "Interaction Webhook & Guild Role RBAC",
			ingressBadge: "Discord Ingress",
			ingressSummary: "Listens to Discord server channel messages and slash commands (/mutate, /escalate), validates guild role permissions.",
			ingressDetails: [
				"Listens to Discord WebSocket gateway (MESSAGE_CREATE, INTERACTION_CREATE) using Bot Token.",
				"Enforces RBAC: only users with 'Plant Operations' role in authorized guild can trigger mutations.",
				"Rejects direct DM spam and unverified channels with zero AI token consumption.",
				"Dispatches standard JSON ticket payload to Golang backend at POST /api/tickets."
			],
			ingressCode: `// Discord Interaction & Guild RBAC Ingress
if interaction.GuildID != PlantGuildID || !HasPlantRole(interaction.Member) {
    return discord.RespondEphemeral("Unauthorized regional branch channel")
}

forwardToNovaPilot("http://localhost:8088/api/tickets", interaction.Data)`,
			replyTitle: "6. Discord Embed Reply & Active Learning",
			replySubtitle: "Rich Embed Notification & Training Cache",
			replyDetails: [
				"Outbound Reply: Posts rich Discord embed with green status banner into the originating channel.",
				"Active Learning Capture: Human operator modifications logged to ground_truth.jsonl.",
				"Dynamic Context Injection: Feeds past accepted diffs back into few-shot prompt context.",
				"Continuous improvement of entity extraction accuracy."
			],
			circuitDesc: "Discord Gateway & Embeds → LLM Guardrail → Pre-Check → Human Sign-off → DB Commit",
			node1Label: "Discord",
			apiKeyLabel: "Get Discord Bot Token & Applications",
			apiKeyUrl: "https://discord.com/developers/applications",
			portalName: "Discord Developer Portal"
		},
		slack: {
			name: "Slack Enterprise",
			ingressTitle: "1. Slack Enterprise Gateway",
			ingressSubtitle: "Events API & HMAC Signature Verification",
			ingressBadge: "Slack Ingress",
			ingressSummary: "Subscribes to Slack channel mentions, enterprise app commands (/novapilot), and validates cryptographic HMAC SHA256 signature.",
			ingressDetails: [
				"Receives incoming JSON payloads at /api/webhooks/slack with X-Slack-Signature verification.",
				"Verifies workspace team_id against authorized corporate plant tenants.",
				"Drops non-whitelisted channel banter and social mentions with zero overhead.",
				"Transforms Slack conversational event into standard NovaPilot ticket schema."
			],
			ingressCode: `// Slack HMAC Signature Verification & Events Ingress
if !VerifySlackHMAC(r.Header.Get("X-Slack-Signature"), body, SlackSigningSecret) {
    http.Error(w, "Invalid Slack signature", http.StatusUnauthorized)
    return
}

forwardTicketToCore("http://localhost:8088/api/tickets", slackEvent)`,
			replyTitle: "6. Slack Block Kit Reply & Active Learning",
			replySubtitle: "Interactive Card Feedback & Model Tuning",
			replyDetails: [
				"Outbound Reply: Dispatches updated Slack Block Kit card with interactive resolution audit trail.",
				"Active Learning Capture: Logs corrections in ground_truth.jsonl for iterative prompt adaptation.",
				"Dynamic Context Injection: Dynamic few-shot examples adapt to corporate terminology.",
				"Eliminates repetitive ticket correction overhead."
			],
			circuitDesc: "Slack Events API & Bolt → LLM Guardrail → Pre-Check → Human Sign-off → DB Commit",
			node1Label: "Slack",
			apiKeyLabel: "Create Slack App & Signing Secret",
			apiKeyUrl: "https://api.slack.com/apps",
			portalName: "Slack API Dashboard"
		}
	});

	const stages = $derived([
		{
			id: 1,
			title: platformMeta[cockpit.chatPlatform].ingressTitle,
			subtitle: platformMeta[cockpit.chatPlatform].ingressSubtitle,
			badge: platformMeta[cockpit.chatPlatform].ingressBadge,
			icon: Radio,
			color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
			summary: platformMeta[cockpit.chatPlatform].ingressSummary,
			details: platformMeta[cockpit.chatPlatform].ingressDetails,
			codeSnippet: platformMeta[cockpit.chatPlatform].ingressCode
		},
		{
			id: 2,
			title: "2. Deterministic AI Parsing",
			subtitle: "LLM Structured Output & Entity Extraction",
			badge: "Semantic Engine",
			icon: CpuChip,
			color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
			summary: "Translates noisy, informal branch Indonesian/English conversations into a deterministic, strictly validated JSON schema.",
			details: [
				"Enforces Temperature = 0.0 and Top_P = 0.95 to eliminate creative hallucinations and ensure reproducible outputs.",
				"Applies In-Context Few-Shot examples containing plant acronyms ('tlg ganti', 'salah ketik faktur', 'revisi npwp', 'nota pluit').",
				"Constrains the output strictly to JSON Schema containing: intent, document_number, field_target, proposed_value, and confidence_score.",
				"If extraction confidence is below 85% or document number is missing, the ticket is flagged for human manual entry."
			],
			codeSnippet: `// Deterministic JSON Output Contract
{
  "intent": "UPDATE_CUSTOMER_NAME",
  "document_type": "NOTA",
  "document_number": "INV/2026/001",
  "field_target": "customer_name",
  "proposed_value": "PT Sumber Makmur Abadi",
  "branch_origin": "Surabaya Regional Hub",
  "confidence_score": 0.98,
  "ingested_channel": "${cockpit.chatPlatform}"
}`
		},
		{
			id: 3,
			title: "3. Enterprise Pre-Validation Gate",
			subtitle: "Read-Only Database Verification",
			badge: "Policy Defense",
			icon: ServerStack,
			color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
			summary: "Executes read-only queries against PostgreSQL/Oracle to verify document existence and policy compliance before staging.",
			details: [
				"Policy Check 1 (Existence): Executes SELECT * FROM invoices WHERE invoice_no = $1 to retrieve current database state.",
				"Policy Check 2 (Accounting Period): If status == 'CLOSED', the invoice is locked in monthly financial closing. Mutation is automatically forbidden.",
				"Policy Check 3 (Posting State): Checks if transaction is already posted or cancelled, preventing illegal retrospective alterations.",
				"Captures the exact current database value (e.g. 'PT Sumber Makmur') to display a high-contrast side-by-side diff in the WebUI."
			],
			codeSnippet: `// Golang Service: Pre-check & Policy Enforcement
inv, err := s.invoiceRepo.GetByInvoiceNo(input.DocumentNo)
if err != nil {
    return nil, fmt.Errorf("invoice not found: %s", input.DocumentNo)
}

if inv.Status == domain.InvoiceClosed {
    return nil, fmt.Errorf("SOP violation: invoice %s is CLOSED and locked", input.DocumentNo)
}`
		},
		{
			id: 4,
			title: "4. Real-Time Human Sign-Off",
			subtitle: "Server-Sent Events & Mobile-Ready Cockpit",
			badge: "Human-in-the-Loop",
			icon: ShieldCheck,
			color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
			summary: "Streams pending tickets live via Server-Sent Events (SSE) to the on-call engineer's WebUI with side-by-side visual diffs.",
			details: [
				"Goroutine worker pushes event: ticket_created to all connected SSE clients over HTTP (text/event-stream).",
				"SvelteKit 5 reactive cockpit displays a high-contrast card showing strikethrough red (current DB) vs bold green (proposed AI value).",
				"The on-call engineer can review proof attachments (PDF tax documents, delivery receipts) uploaded via MCP or chat.",
				"The engineer can sign off with one click [Approve & Mutate] or click [Reject Request] to log an operational reason note."
			],
			codeSnippet: `// SSE Broadcaster in Go
payload, _ := json.Marshal(ticket)
msg := fmt.Sprintf("event: ticket_created\\ndata: %s\\n\\n", payload)

for clientChan := range h.clients {
    select {
    case clientChan <- msg:
    default:
    }
}`
		},
		{
			id: 5,
			title: "5. Transactional Database Mutation",
			subtitle: "Zero Raw SQL & Parameterized Commits",
			badge: "Core Execution",
			icon: LockClosed,
			color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
			summary: "Executes parameterized prepared statements within an atomic transaction block with guaranteed rollback upon conflict.",
			details: [
				"Zero Raw SQL Invariant: Concatenated dynamic SQL strings are strictly prohibited to prevent SQL injection and hallucinated queries.",
				"Uses positional bind variables: UPDATE invoices SET customer_name = $1, updated_at = $2 WHERE invoice_no = $3.",
				"Commits changes within an explicit transaction. If any database lock or timeout occurs, tx.Rollback() executes instantly.",
				"Inserts an immutable audit record containing ticket ID, timestamp, approving engineer identity, IP address, and JSON diff."
			],
			codeSnippet: `// Safe Parameterized Transaction in Go
tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
if err != nil { return err }
defer tx.Rollback() // Automatic rollback on error

query := \`UPDATE invoices 
          SET customer_name = $1, updated_at = $2 
          WHERE invoice_no = $3 AND status = 'OPEN'\`
_, err = tx.ExecContext(ctx, query, ticket.ProposedValue, time.Now(), ticket.DocumentNo)
if err != nil { return err }

return tx.Commit()`
		},
		{
			id: 6,
			title: platformMeta[cockpit.chatPlatform].replyTitle,
			subtitle: platformMeta[cockpit.chatPlatform].replySubtitle,
			badge: "Continuous Loop",
			icon: Sparkles,
			color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
			summary: "Confirms resolution to the branch channel and commits any human corrections to few-shot training memory.",
			details: platformMeta[cockpit.chatPlatform].replyDetails,
			codeSnippet: `// Active Learning Memory Ingestion
if humanCorrectedValue != aiExtractedValue {
    logGroundTruthPair({
        raw_message: ticket.raw_message,
        channel: "${cockpit.chatPlatform}",
        corrected_entity: humanCorrectedValue,
        corrected_by: "John Doe"
    }); // Dynamically loaded as future few-shot prompt
}`
		}
	]);

	function runSimulation() {
		if (isSimulating) return;
		isSimulating = true;
		let step = 1;
		activeStage = step;
		const interval = setInterval(() => {
			step++;
			if (step > 6) {
				clearInterval(interval);
				isSimulating = false;
			} else {
				activeStage = step;
			}
		}, 1400);
	}
</script>

<div class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative overflow-hidden font-sans">
	<!-- Ambient Radial Glow -->
	<span
		aria-hidden="true"
		class="pointer-events-none absolute -top-40 right-1/4 h-96 w-[600px] rounded-full opacity-25 blur-3xl"
		style="background: radial-gradient(circle, #2FB479 0%, transparent 70%);"
	></span>

	<!-- Header with Action Button & Platform Selector -->
	<div class="text-center space-y-4 max-w-3xl mx-auto relative z-10">
		<div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary/80 border border-border/70 text-xs font-mono text-muted-foreground shadow-xs">
			<span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
			<span>{platformMeta[cockpit.chatPlatform].name} ChatOps Engine Pipeline</span>
			<span class="text-border">|</span>
			<span class="text-foreground font-semibold">100% Deterministic & Audited</span>
		</div>
		<h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
			End-to-End System Flow
		</h1>
		<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
			From raw {platformMeta[cockpit.chatPlatform].name} chat escalation to safe prepared statement execution: how NovaPilot AI eliminates on-call burnout while preserving zero-error database governance.
		</p>

		<!-- Interactive ChatOps Platform Switcher -->
		<div class="pt-2 flex flex-wrap items-center justify-center gap-2">
			{#each [
				{ id: 'whatsapp', label: 'WhatsApp' },
				{ id: 'telegram', label: 'Telegram' },
				{ id: 'discord', label: 'Discord' },
				{ id: 'slack', label: 'Slack' }
			] as p}
				<button
					type="button"
					onclick={() => cockpit.chatPlatform = p.id as ChatPlatform}
					class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 {cockpit.chatPlatform === p.id ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30' : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60'}"
				>
					{#if cockpit.chatPlatform === p.id}
						<span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
					{/if}
					<span>{p.label} Flow</span>
				</button>
			{/each}
		</div>

		<!-- Simulation Trigger Button & Direct Platform API Key Portal Link -->
		<div class="pt-2 flex flex-wrap items-center justify-center gap-2.5">
			<button
				type="button"
				onclick={runSimulation}
				disabled={isSimulating}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
			>
				<ArrowPath class="h-3.5 w-3.5 {isSimulating ? 'animate-spin' : ''}" />
				<span>{isSimulating ? `Traversing Stage 0${activeStage}/06...` : `Simulate Live ${platformMeta[cockpit.chatPlatform].name} Ingestion`}</span>
			</button>

			<a
				href={platformMeta[cockpit.chatPlatform].apiKeyUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all shadow-xs group"
				title="Buka portal developer resmi untuk mendapatkan API key/bot token {platformMeta[cockpit.chatPlatform].name}"
			>
				<Key class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
				<span>Get {platformMeta[cockpit.chatPlatform].name} API Key</span>
				<span class="text-[10px] font-mono opacity-60">({platformMeta[cockpit.chatPlatform].portalName})</span>
				<ArrowTopRightOnSquare class="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
			</a>

			<a
				href="/dashboard/platforms"
				class="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium border border-border transition-all"
			>
				<span>Set Token di Dashboard</span>
				<ChevronRight class="h-3 w-3" />
			</a>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- WHATSAPP GATEWAY SERVICE CONTROLLER & LIFECYCLE DECK (:3002)             -->
	<!-- ========================================================================= -->
	<div class="p-5 sm:p-6 rounded-3xl bg-card border {gwRunning ? 'border-emerald-500/40 bg-gradient-to-br from-card via-card to-emerald-500/5' : 'border-border bg-card/60'} shadow-xl space-y-4 relative z-10 transition-all">
		<!-- Top Row: Service Title, Status Chip & Quick Actions -->
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border/50">
			<div class="flex items-center gap-3.5">
				<div class="h-12 w-12 rounded-2xl {gwRunning ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border'} flex items-center justify-center shadow-xs">
					<Radio class="h-6 w-6 {gwRunning ? 'animate-pulse text-emerald-500' : 'text-muted-foreground'}" />
				</div>
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<h2 class="text-base sm:text-lg font-bold text-foreground">
							WhatsApp Gateway Service Daemon
						</h2>
						<!-- Live Status Chip -->
						<span class="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 {gwRunning ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'}">
							<span class="h-2 w-2 rounded-full {gwRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
							{gwRunning ? (gwStatusData?.status || 'ONLINE (:3002)') : 'STOPPED / OFFLINE'}
						</span>
						{#if gwStatusData?.mode}
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
								{gwStatusData.mode}
							</span>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground mt-0.5">
						Baileys socket listener on port <code class="text-foreground font-mono font-semibold">3002</code>. Ingests authorized regional chats and dispatches to NovaPilot Golang core.
					</p>
				</div>
			</div>

			<!-- Real-Time Gateway Action Buttons (Start, Restart, Shut Down) -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- 1. Start Button -->
				<button
					type="button"
					onclick={() => triggerGatewayAction('start')}
					disabled={gwRunning || gwLoading}
					class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer {gwRunning ? 'bg-secondary text-muted-foreground/50 border border-border/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-emerald-500/20 shadow-md'}"
					title="Start WhatsApp Gateway Service (bun run start / npx tsx src/index.ts)"
				>
					<Play class="h-3.5 w-3.5" />
					<span>{gwLoading && gwActionType === 'info' ? 'Starting...' : 'Start Service'}</span>
				</button>

				<!-- 2. Restart Button -->
				<button
					type="button"
					onclick={() => triggerGatewayAction('restart')}
					disabled={gwLoading}
					class="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
					title="Gracefully restart WhatsApp Gateway daemon"
				>
					<ArrowPath class="h-3.5 w-3.5 {gwLoading ? 'animate-spin text-primary' : 'text-muted-foreground'}" />
					<span>Restart Gateway</span>
				</button>

				<!-- 3. Shut Down Button -->
				<button
					type="button"
					onclick={() => triggerGatewayAction('stop')}
					disabled={!gwRunning || gwLoading}
					class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer {!gwRunning ? 'bg-secondary text-muted-foreground/50 border border-border/50 cursor-not-allowed' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold'}"
					title="Shut down WhatsApp Gateway daemon process"
				>
					<XMark class="h-3.5 w-3.5" />
					<span>Shut Down</span>
				</button>

				<!-- 4. Refresh Button -->
				<button
					type="button"
					onclick={fetchGatewayStatus}
					disabled={gwLoading}
					class="p-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs transition-all cursor-pointer"
					title="Refresh gateway live telemetry"
				>
					<ArrowPath class="h-4 w-4 {gwLoading ? 'animate-spin' : ''}" />
				</button>
			</div>
		</div>

		<!-- Action Feedback Banner (if any) -->
		{#if gwActionMessage}
			<div class="p-3 rounded-2xl text-xs flex items-center justify-between gap-3 {gwActionType === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : gwActionType === 'error' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30' : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30'}">
				<div class="flex items-center gap-2">
					{#if gwActionType === 'success'}
						<CheckCircle class="h-4 w-4 shrink-0 text-emerald-500" />
					{:else if gwActionType === 'error'}
						<ExclamationTriangle class="h-4 w-4 shrink-0 text-rose-500" />
					{:else}
						<ArrowPath class="h-4 w-4 shrink-0 animate-spin text-blue-500" />
					{/if}
					<span class="font-medium">{gwActionMessage}</span>
				</div>
				<button
					type="button"
					onclick={() => gwActionMessage = null}
					class="p-1 hover:opacity-70 text-foreground"
				>
					<XMark class="h-3.5 w-3.5" />
				</button>
			</div>
		{/if}

		<!-- Telemetry Cards & Shortcuts Row -->
		<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
			<!-- Metric 1: Daemon Port -->
			<div class="p-3 rounded-2xl bg-secondary/30 border border-border/50 space-y-0.5">
				<span class="text-[10px] font-mono text-muted-foreground uppercase">Daemon Port</span>
				<div class="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
					<ServerStack class="h-3.5 w-3.5 text-primary" />
					<span>:3002</span>
				</div>
			</div>

			<!-- Metric 2: Process Uptime -->
			<div class="p-3 rounded-2xl bg-secondary/30 border border-border/50 space-y-0.5">
				<span class="text-[10px] font-mono text-muted-foreground uppercase">Process Uptime</span>
				<div class="text-sm font-bold font-mono text-foreground">
					{formatUptime(gwStatusData?.uptime_seconds)}
				</div>
			</div>

			<!-- Metric 3: Memory RSS -->
			<div class="p-3 rounded-2xl bg-secondary/30 border border-border/50 space-y-0.5">
				<span class="text-[10px] font-mono text-muted-foreground uppercase">Memory RSS</span>
				<div class="text-sm font-bold font-mono text-foreground">
					{gwStatusData?.memory_rss_mb ? `${gwStatusData.memory_rss_mb} MB` : (gwRunning ? 'Active' : '0 MB')}
				</div>
			</div>

			<!-- Metric 4: Whitelisted Groups -->
			<div class="p-3 rounded-2xl bg-secondary/30 border border-border/50 space-y-0.5">
				<span class="text-[10px] font-mono text-muted-foreground uppercase">Whitelisted JIDs</span>
				<div class="text-sm font-bold font-mono text-foreground">
					{gwStatusData?.whitelisted_groups?.length || 0} Groups
				</div>
			</div>

			<!-- Quick Shortcuts Deck -->
			<div class="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center gap-2">
				<a
					href="/dashboard/messages"
					class="w-full h-full min-h-[50px] p-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
					title="Lihat pesan WhatsApp live & buka Exec Terminal di Omnichannel Inbound Feed"
				>
					<CommandLine class="h-3.5 w-3.5" />
					<span>Terminal & Ingress</span>
				</a>
			</div>
		</div>
	</div>

	<!-- Signature Animated Pipeline Circuit Canvas -->
	<div class="p-5 rounded-3xl bg-card/60 backdrop-blur-md border border-border shadow-xl overflow-hidden relative">
		<div class="flex items-center justify-between pb-3 border-b border-border/50 text-xs font-mono text-muted-foreground">
			<span class="flex items-center gap-1.5 text-foreground font-semibold">
				<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
				Active Circuit: Stage 0{activeStage} Processing
			</span>
			<span class="text-emerald-600 dark:text-emerald-400 font-medium">
				{platformMeta[cockpit.chatPlatform].circuitDesc}
			</span>
		</div>

		<!-- SVG Circuit Path -->
		<div class="py-4 relative overflow-x-auto">
			<div class="min-w-[700px] h-20 relative flex items-center justify-between px-6">
				<!-- Connecting SVG animated line -->
				<svg class="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
					<line x1="8%" y1="50%" x2="92%" y2="50%" stroke="currentColor" class="text-border/50" stroke-width="2" stroke-dasharray="4 4" />
					<line 
						x1="8%" 
						y1="50%" 
						x2="{8 + (activeStage - 1) * 16.8}%" 
						y2="50%" 
						stroke="#10b981" 
						stroke-width="3" 
						class="transition-all duration-500 shadow-md"
					/>
				</svg>

				<!-- 6 Interactive Circuit Node Badges -->
				{#each stages as s}
					<button
						type="button"
						onclick={() => (activeStage = s.id)}
						class="relative z-10 flex flex-col items-center gap-1.5 transition-all group cursor-pointer focus:outline-none"
					>
						<div class="h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all {activeStage === s.id ? 'bg-primary text-primary-foreground shadow-lg scale-110 ring-4 ring-primary/20' : activeStage > s.id ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40' : 'bg-muted text-muted-foreground border border-border group-hover:border-primary/50'}">
							<s.icon class="h-4 w-4" />
						</div>
						<span class="text-[10px] font-mono font-medium truncate max-w-[90px] text-center {activeStage === s.id ? 'text-foreground font-bold' : 'text-muted-foreground'}">
							0{s.id}. {s.id === 1 ? platformMeta[cockpit.chatPlatform].node1Label : s.title.split('. ')[1]?.split(' ')[0]}
						</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Interactive Stepper Bar -->
	<div class="grid grid-cols-2 md:grid-cols-6 gap-2.5 relative z-10">
		{#each stages as s}
			<button
				onclick={() => (activeStage = s.id)}
				class="p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 group cursor-pointer {activeStage === s.id ? 'bg-card border-foreground/40 shadow-lg scale-[1.02]' : 'bg-card/40 border-border/50 hover:bg-card/70 hover:border-border'}"
			>
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md {s.color}">
						STAGE {s.id}
					</span>
					{#if activeStage === s.id}
						<span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
					{/if}
				</div>
				<div>
					<div class="text-xs font-bold text-foreground line-clamp-1">{s.title.split('. ')[1]}</div>
					<div class="text-[10px] text-muted-foreground font-mono">{s.badge}</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Detailed Stage Inspector -->
	{#each stages as s}
		{#if activeStage === s.id}
			<div class="p-8 rounded-3xl bg-card border border-border/70 shadow-2xl space-y-8 relative z-10 transition-all">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
					<div class="flex items-center gap-4">
						<div class="h-14 w-14 rounded-2xl {s.color} flex items-center justify-center font-bold shadow-md">
							<s.icon class="h-7 w-7" />
						</div>
						<div>
							<div class="flex items-center gap-2">
								<h2 class="text-xl sm:text-2xl font-extrabold text-foreground">{s.title}</h2>
								<span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold {s.color}">
									{s.badge}
								</span>
							</div>
							<p class="text-xs text-muted-foreground mt-0.5">{s.subtitle}</p>
						</div>
					</div>
				</div>

				<div class="grid lg:grid-cols-12 gap-8 items-start">
					<!-- Left Column: Architectural Explanation -->
					<div class="lg:col-span-7 space-y-6">
						<div class="p-4 rounded-2xl bg-secondary/40 border border-border/50 text-xs text-muted-foreground leading-relaxed">
							{s.summary}
						</div>

						<div class="space-y-3">
							<h3 class="text-xs font-bold uppercase font-mono text-foreground tracking-wider">Root Execution Mechanics:</h3>
							<ul class="space-y-2.5">
								{#each s.details as detail}
									<li class="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
										<div class="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
											<Check class="h-2.5 w-2.5" />
										</div>
										<span>{detail}</span>
									</li>
								{/each}
							</ul>
						</div>

						<!-- Step Navigation Controls -->
						<div class="pt-4 flex items-center justify-between border-t border-border/40">
							<button
								onclick={() => (activeStage = activeStage > 1 ? activeStage - 1 : 6)}
								class="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
							>
								← Previous Stage
							</button>
							<div class="flex items-center gap-1.5">
								{#each Array.from({ length: 6 }) as _, i}
									<button
										onclick={() => (activeStage = i + 1)}
										class="h-2 rounded-full transition-all {activeStage === i + 1 ? 'w-6 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/50'}"
										aria-label="Go to stage {i + 1}"
									></button>
								{/each}
							</div>
							<button
								onclick={() => (activeStage = activeStage < 6 ? activeStage + 1 : 1)}
								class="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5"
							>
								<span>Next Stage</span>
								<ArrowRight class="h-3.5 w-3.5" />
							</button>
						</div>
					</div>

					<!-- Right Column: Code & Payload Visualizer -->
					<div class="lg:col-span-5 space-y-4 flex flex-col justify-between">
						<div class="rounded-2xl bg-background/90 border border-border/70 overflow-hidden shadow-inner flex flex-col h-full">
							<div class="p-3 border-b border-border/50 bg-secondary/50 flex items-center justify-between text-xs">
								<div class="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
									<CodeBracket class="h-3.5 w-3.5 text-primary" />
									<span>Stage {s.id} Execution Code</span>
								</div>
								<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-card border border-border/50 text-foreground">
									{#if s.id === 1 && cockpit.chatPlatform === 'whatsapp'}
										<span class="inline-flex items-center gap-1.5 {gwRunning ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-semibold'}">
											<span class="h-1.5 w-1.5 rounded-full {gwRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
											{gwRunning ? (gwStatusData?.status === 'CONNECTED' ? 'GATEWAY CONNECTED' : 'DAEMON RUNNING :3002') : 'DAEMON STOPPED'}
										</span>
									{:else}
										Verified Implementation
									{/if}
								</span>
							</div>
							<pre class="p-4 text-[11px] font-mono text-foreground/90 overflow-x-auto leading-relaxed flex-1 bg-black/40"><code>{s.codeSnippet}</code></pre>
						</div>

						<div class="p-4 rounded-2xl bg-card border border-border/60 space-y-2 text-xs">
							<div class="flex items-center gap-1.5 font-bold text-foreground">
								<ShieldCheck class="h-4 w-4 text-emerald-400" />
								<span>Security & Invariant Guarantee:</span>
							</div>
							<p class="text-[11px] text-muted-foreground leading-relaxed">
								At no point in this stage does the AI possess write credentials, raw DDL access, or arbitrary database permissions.
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/each}

	<!-- 4 Safety Pillars -->
	<div class="space-y-6 pt-6 relative z-10">
		<div class="text-center space-y-2 max-w-xl mx-auto">
			<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">The 4 Foundational Safety Pillars</h2>
			<p class="text-xs text-muted-foreground">Why NovaPilot AI is enterprise-safe for production plant databases.</p>
		</div>

		<div class="grid md:grid-cols-2 gap-6">
			<!-- Pillar 1 -->
			<div class="p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-3 hover:border-foreground/30 transition-all">
				<div class="flex items-center gap-3">
					<div class="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
						<Server class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Zero Cloud Credential Exposure</h3>
						<span class="text-[10px] font-mono text-muted-foreground">Network Isolation</span>
					</div>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">
					Database connection strings, TNS descriptors, passwords, and factory internal subnets are stored exclusively in local environment variables. AI models receive only sanitized conversational strings and return schemas.
				</p>
			</div>

			<!-- Pillar 2 -->
			<div class="p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-3 hover:border-foreground/30 transition-all">
				<div class="flex items-center gap-3">
					<div class="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
						<LockClosed class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Transactional Atomicity & Rollback</h3>
						<span class="text-[10px] font-mono text-muted-foreground">Database Defense</span>
					</div>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">
					Mutations execute strictly through parameterized prepared statements ($1, $2) wrapped inside explicit database transactions. If a row lock or connection drops, rollback executes immediately with zero dirty reads.
				</p>
			</div>

			<!-- Pillar 3 -->
			<div class="p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-3 hover:border-foreground/30 transition-all">
				<div class="flex items-center gap-3">
					<div class="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">
						<Square3Stack3d class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Model Context Protocol (MCP) Bridge</h3>
						<span class="text-[10px] font-mono text-muted-foreground">Extensible Knowledge</span>
					</div>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">
					Our custom MCP server exposes factory SOP rules as resources (novapilot://sop/factory-rules) and provides document upload capabilities for PDF proof receipts and delivery orders.
				</p>
			</div>

			<!-- Pillar 4 -->
			<div class="p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-3 hover:border-foreground/30 transition-all">
				<div class="flex items-center gap-3">
					<div class="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
						<ChatBubbleLeftRight class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Meta WhatsApp Anti-Banning Design</h3>
						<span class="text-[10px] font-mono text-muted-foreground">Policy Compliance</span>
					</div>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">
					Zero outbound cold spam. The gateway operates in purely passive listener mode on whitelisted groups, sending exactly one reactive confirmation after an engineer approves the change.
				</p>
			</div>
		</div>
	</div>

	<!-- Universal Hooks Ecosystem Animated SVG Visualizer -->
	<HookEcosystemVisualizer />

	<!-- CTA Footer Banner -->
	<div class="p-8 rounded-3xl bg-card border border-border/70 text-center space-y-4 shadow-xl relative z-10">
		<h3 class="text-xl font-bold text-foreground">Ready to Test the Live On-Call Pipeline?</h3>
		<p class="text-xs text-muted-foreground max-w-lg mx-auto">
			Hop into the On-Call Cockpit, simulate a noisy WhatsApp branch revision, and watch the entire 6-stage lifecycle execute in real time.
		</p>
		<div class="flex items-center justify-center gap-3 pt-2">
			<a
				href="/dashboard"
				class="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all inline-flex items-center gap-2"
			>
				<CommandLine class="h-4 w-4" />
				<span>Open On-Call Cockpit</span>
				<ArrowRight class="h-4 w-4" />
			</a>
		</div>
	</div>
</div>
