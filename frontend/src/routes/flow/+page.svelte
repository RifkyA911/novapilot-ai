<script lang="ts">
	import { 
		ShieldCheck, CheckCircle, ArrowRight, ServerStack, CpuChip, Radio, LockClosed, Bolt, 
		DocumentText, Sparkles, CommandLine, Square3Stack3d, ArrowPath, ExclamationTriangle, 
		Check, XMark, Server, ChatBubbleLeftRight, CodeBracket, ChevronRight
	} from "svelte-heros-v2";
	import HookEcosystemVisualizer from "$lib/components/HookEcosystemVisualizer.svelte";

	let activeStage = 1;

	const stages = [
		{
			id: 1,
			title: "1. Branch Ingestion Layer",
			subtitle: "WhatsApp Gateway & Whitelist Filter",
			badge: "Network Ingress",
			icon: Radio,
			color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
			summary: "Captures messages from authorized regional WhatsApp groups, applies debounce rate-limiting, and normalizes conversational text.",
			details: [
				"Maintains a persistent virtual WhatsApp Web session locally via socket connection (Baileys / WA-Web.js).",
				"Validates incoming sender JID against an authorized group whitelist (e.g. Surabaya, Medan, Semarang, Makassar).",
				"Non-whitelisted chats, stickers, and casual social chatter are dropped immediately at the network edge with zero AI token consumption.",
				"Dispatches a clean JSON webhook payload to the Golang core backend at POST /api/tickets."
			],
			codeSnippet: `// WA Gateway Filtering Logic
if (!WHITELISTED_GROUPS.includes(message.remoteJid)) {
    return; // Immediate drop: Zero token waste
}

// Forward to NovaPilot Golang Ingestion Webhook
await fetch("http://localhost:8088/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        raw_message: message.body,
        branch_id: resolveBranchId(message.remoteJid)
    })
});`
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
  "confidence_score": 0.98
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
			title: "6. WhatsApp Reply & Active Learning",
			subtitle: "Automated Feedback Loop & Training Cache",
			badge: "Continuous Loop",
			icon: Sparkles,
			color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
			summary: "Confirms resolution to the branch thread and commits any human corrections to few-shot training memory.",
			details: [
				"Outbound Reply: Sends exactly one confirmation message back to the originating branch thread ('✅ Ticket #TK-101 completed').",
				"Active Learning Capture: If the engineer modified the proposed name prior to approval, the pair (raw_chat, corrected_json) is stored in data/training/ground_truth.jsonl.",
				"Dynamic Context Injection: Backend automatically loads recently corrected pairs as dynamic few-shot prompts for future queries.",
				"The agent learns branch-specific dialect patterns organically over time without requiring manual codebase changes."
			],
			codeSnippet: `// Active Learning Memory Ingestion
if humanCorrectedValue != aiExtractedValue {
    logGroundTruthPair({
        raw_message: ticket.raw_message,
        corrected_entity: humanCorrectedValue,
        corrected_by: "John Doe"
    }); // Dynamically loaded as future few-shot prompt
}`
		}
	];
</script>

<div class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12 relative overflow-hidden font-sans">
	<!-- VibeUI Ambient Gradient Glow -->
	<span
		aria-hidden="true"
		class="pointer-events-none absolute -top-40 right-1/4 h-96 w-[600px] rounded-full opacity-25 blur-3xl"
		style="background: radial-gradient(circle, #2FB479 0%, transparent 70%);"
	></span>

	<!-- Header -->
	<div class="text-center space-y-4 max-w-3xl mx-auto relative z-10">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/70 text-xs font-mono text-muted-foreground shadow-sm">
			<span class="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
			<span>Microscopic Architecture Breakdown</span>
			<span class="text-border">|</span>
			<span class="text-foreground font-semibold">100% Explainable</span>
		</div>
		<h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
			End-to-End System Flow
		</h1>
		<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
			From raw WhatsApp chat message to safe prepared statement execution: how NovaPilot AI eliminates on-call burnout while preserving zero-error database governance.
		</p>
	</div>

	<!-- Interactive Stepper Bar -->
	<div class="grid grid-cols-2 md:grid-cols-6 gap-2.5 relative z-10">
		{#each stages as s}
			<button
				onclick={() => (activeStage = s.id)}
				class="p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 group {activeStage === s.id ? 'bg-card border-foreground/40 shadow-lg scale-[1.02]' : 'bg-card/40 border-border/50 hover:bg-card/70 hover:border-border'}"
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
									Verified Implementation
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
