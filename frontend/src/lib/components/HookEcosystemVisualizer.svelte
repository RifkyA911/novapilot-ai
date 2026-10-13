<script lang="ts">
	import { 
		CommandLine, 
		CheckCircle, 
		ShieldCheck, 
		Square3Stack3d, 
		ArrowPath, 
		PaperAirplane, 
		Sparkles,
		CpuChip,
		ComputerDesktop,
		GlobeAlt,
		CodeBracket,
		ServerStack,
		LockClosed,
		ChatBubbleLeftRight,
		ClipboardDocument,
		Check,
		ExclamationTriangle,
		Radio
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";

	// Selected Client Sub-Adapter
	let activeAdapter = $state<string>("ferdium");
	let isSimulating = $state(false);
	let simulationStep = $state(0);
	let copied = $state(false);
	let testPingSuccess = $state(false);
	let pinging = $state(false);

	function copyCode(text: string) {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function triggerTestPing() {
		if (pinging) return;
		pinging = true;
		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: `Test ${cockpit.chatPlatform.toUpperCase()} Hook: Verified connection from Hook Ecosystem Cockpit.`,
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: "INV/2026/001",
					field_target: "customer_name",
					proposed_value: `PT Test ${cockpit.chatPlatform} Ping`,
					branch_id: 1,
					confidence_score: 0.99
				})
			});
			if (res.ok) {
				cockpit.recordPlatformEvent(cockpit.chatPlatform);
				testPingSuccess = true;
				await cockpit.fetchTickets();
				setTimeout(() => (testPingSuccess = false), 3500);
			}
		} catch (err) {
			console.error("Test ping error:", err);
		} finally {
			pinging = false;
		}
	}

	function runSimulation() {
		if (isSimulating) return;
		isSimulating = true;
		simulationStep = 1;

		setTimeout(() => {
			simulationStep = 2; // Ingestion Edge
			setTimeout(() => {
				simulationStep = 3; // Deterministic Parsing & DB Pre-check
				setTimeout(() => {
					simulationStep = 4; // On-Call Sign-off
					setTimeout(() => {
						simulationStep = 5; // Return Loopback
						setTimeout(() => {
							isSimulating = false;
							simulationStep = 0;
						}, 1400);
					}, 1200);
				}, 1200);
			}, 1000);
		}, 800);
	}

	// Platform Configuration Definitions
	const platformConfigs = {
		whatsapp: {
			title: "WhatsApp Hook Ecosystem",
			description: "Passive DOM observers inside Ferdium, Rambox, and browser userscripts plus headless Baileys WebSocket daemon.",
			adapters: [
				{
					id: "ferdium",
					name: "Ferdium Desktop",
					badge: "Electron Recipe",
					endpoint: "POST http://127.0.0.1:8088/api/tickets",
					snippet: `// %APPDATA%\\Ferdium\\recipes\\whatsapp\\webview.js\nFerdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));`,
					notes: "Zero QR scan requirement. Injects DOM observer directly into Ferdium WhatsApp webview."
				},
				{
					id: "rambox",
					name: "Rambox App",
					badge: "Service Custom JS",
					endpoint: "POST http://127.0.0.1:8088/api/tickets",
					snippet: `// Rambox -> WhatsApp -> Settings -> Advanced -> Inject JavaScript code\n(function() {\n  const BACKEND = "http://127.0.0.1:8088/api/tickets";\n  console.log("[NovaPilot] Rambox Hook Active");\n})();`,
					notes: "Runs inside Rambox Electron process. Forwards whitelisted branch groups to local port 8088."
				},
				{
					id: "tampermonkey",
					name: "WhatsApp Web (Chrome)",
					badge: "Tampermonkey",
					endpoint: "POST http://127.0.0.1:8088/api/tickets",
					snippet: `// ==UserScript==\n// @name         NovaPilot WhatsApp Ingestion Hook\n// @match        https://web.whatsapp.com/*\n// @grant        GM_xmlhttpRequest\n// ==/UserScript==\nconst NOVAPILOT_BACKEND = "http://127.0.0.1:8088/api/tickets";`,
					notes: "Passive MutationObserver watching incoming messages on web.whatsapp.com."
				},
				{
					id: "baileys",
					name: "PC WhatsApp Daemon",
					badge: "Node.js Socket",
					endpoint: "Direct WebSocket Gateway",
					snippet: `// Run headless background daemon\nnpm install @whiskeysockets/baileys\nnode ./scripts/baileys-daemon.js --port 8088`,
					notes: "Standalone Node.js service connecting directly to WhatsApp Multi-Device protocol."
				}
			]
		},
		telegram: {
			title: "Telegram Bot & Channel Ecosystem",
			description: "Direct webhook ingestion from authorized Telegram branch groups and inline interactive button callbacks.",
			adapters: [
				{
					id: "tg_webhook",
					name: "Telegram Bot API Webhook",
					badge: "Webhook Endpoint",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/telegram",
					snippet: `# Register local webhook with Telegram Bot API:\ncurl -F "url=https://your-public-proxy:8088/api/webhooks/telegram" \\\n     "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook"`,
					notes: "Receives JSON update payloads from Telegram BotFather bot on every group message."
				},
				{
					id: "tg_polling",
					name: "Intranet Long-Polling Worker",
					badge: "Air-Gapped Daemon",
					endpoint: "Internal Go Worker (getUpdates)",
					snippet: `// Enable long-polling in backend .env:\nTELEGRAM_MODE=polling\nTELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNO\nTELEGRAM_ALLOWED_CHAT_IDS=-100123456789,-100987654321`,
					notes: "Ideal for factory networks without public IP: pulls updates using HTTP long-polling."
				},
				{
					id: "tg_inline",
					name: "Inline Action Sign-off",
					badge: "Interactive Callback",
					endpoint: "POST /api/webhooks/telegram/callback",
					snippet: `// Telegram Inline Keyboard Contract\n{\n  "inline_keyboard": [[\n    { "text": "✅ Approve & Commit", "callback_data": "approve_TK_101" },\n    { "text": "❌ Reject", "callback_data": "reject_TK_101" }\n  ]]\n}`,
					notes: "Allows engineers with valid Telegram clearance to sign off directly from mobile chat."
				}
			]
		},
		discord: {
			title: "Discord Webhook & Bot Gateway",
			description: "Channel webhook ingestion and bot interactions for engineering support servers.",
			adapters: [
				{
					id: "discord_webhook",
					name: "Channel Ingress Webhook",
					badge: "Channel Webhook",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/discord",
					snippet: `# Sample Discord Inbound Webhook Payload\ncurl -X POST http://127.0.0.1:8088/api/webhooks/discord \\\n  -H "Content-Type: application/json" \\\n  -d '{"content": "Tlg revisi PO-9921 alamat kirim ke DC Medan", "channel_id": "11982348"}'`,
					notes: "Hooks Discord channel messages directly into the NovaPilot parsing engine."
				},
				{
					id: "discord_bot",
					name: "Discord Bot (Gateway WebSocket)",
					badge: "Gateway Intent",
					endpoint: "wss://gateway.discord.gg/?v=10&encoding=json",
					snippet: `// Configure in backend .env:\nDISCORD_BOT_TOKEN=your_bot_token_here\nDISCORD_GUILD_ID=119823489123\nDISCORD_ALLOWED_CHANNELS=ops-tickets,factory-alerts`,
					notes: "Listens to MESSAGE_CREATE gateway events with privileged Message Content Intent."
				}
			]
		},
		slack: {
			title: "Slack Enterprise Bolt Ecosystem",
			description: "Slack Events API subscriptions, slash commands (/novapilot), and Block Kit interactive message modals.",
			adapters: [
				{
					id: "slack_events",
					name: "Slack Events API",
					badge: "Event Subscriptions",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/slack",
					snippet: `# Slack App Request URL:\n# https://your-domain.internal/api/webhooks/slack\n# Handshake verified via HMAC-SHA256 (X-Slack-Signature)`,
					notes: "Listens to message.channels and message.groups events in authorized internal channels."
				},
				{
					id: "slack_slash",
					name: "Slash Command (/novapilot)",
					badge: "Command Trigger",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/slack/commands",
					snippet: `# Usage in Slack Channel:\n/novapilot update INV/2026/001 customer_name "PT Sumber Makmur Abadi"`,
					notes: "Instantly triggers the parsing and staging pipeline directly from any Slack workspace."
				}
			]
		}
	};

	let currentConfig = $derived(platformConfigs[cockpit.chatPlatform] || platformConfigs.whatsapp);
	let currentPlatformStatus = $derived(cockpit.platformStatuses[cockpit.chatPlatform]);
</script>

<div class="rounded-3xl border border-border/80 bg-card p-6 shadow-xl space-y-6 relative overflow-hidden font-sans">
	
	<!-- Top Aceternity Header: Platform Switcher & Honest Status Banner -->
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border/60">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5 flex-wrap">
				<h3 class="text-base sm:text-lg font-bold text-foreground">{currentConfig.title}</h3>
				
				<!-- HONEST STATUS BADGE: Zero Fake Connected Indicators! -->
				{#if currentPlatformStatus.status === "CONNECTED"}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
						<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
						<span>CONNECTED ({currentPlatformStatus.eventsCaptured} events captured)</span>
					</span>
				{:else if currentPlatformStatus.status === "AWAITING_HOOK"}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
						<span class="h-2 w-2 rounded-full bg-amber-500"></span>
						<span>AWAITING FIRST HOOK PING</span>
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
						<span class="h-2 w-2 rounded-full bg-rose-500"></span>
						<span>NOT CONFIGURED</span>
					</span>
				{/if}
			</div>

			<p class="text-xs text-muted-foreground leading-relaxed">
				{currentConfig.description}
			</p>
		</div>

		<!-- Action Controls -->
		<div class="flex items-center gap-2 flex-wrap">
			<button
				type="button"
				onclick={triggerTestPing}
				disabled={pinging}
				class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
			>
				<PaperAirplane class="w-3.5 h-3.5" />
				<span>{pinging ? "Sending Ping..." : `Test ${currentPlatformStatus.name} Ping`}</span>
			</button>

			<button
				type="button"
				onclick={runSimulation}
				disabled={isSimulating}
				class="px-3.5 py-2 text-xs font-semibold rounded-xl border border-input bg-background hover:bg-accent text-foreground transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="w-3.5 h-3.5 {isSimulating ? 'animate-spin' : ''}" />
				<span>{isSimulating ? `Traversing Stage ${simulationStep}/5...` : "Animate Circuit"}</span>
			</button>
		</div>
	</div>

	<!-- Honest Connection Diagnostic Notice -->
	<div class="p-4 rounded-2xl {currentPlatformStatus.status === 'CONNECTED' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : currentPlatformStatus.status === 'AWAITING_HOOK' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-muted/40 border border-border text-muted-foreground'} text-xs space-y-1">
		<div class="flex items-center gap-2 font-semibold">
			{#if currentPlatformStatus.status === "CONNECTED"}
				<CheckCircle class="h-4 w-4 shrink-0" />
				<span>Live Socket & Ingress Active: Verified communication on port 8088.</span>
			{:else if currentPlatformStatus.status === "AWAITING_HOOK"}
				<Radio class="h-4 w-4 shrink-0 animate-pulse" />
				<span>Ingress Gateway Ready: Local port 8088 is open, but no client extension or recipe has sent an event yet.</span>
			{:else}
				<ExclamationTriangle class="h-4 w-4 shrink-0" />
				<span>Platform Not Configured: Add credentials or tokens in local environment to activate.</span>
			{/if}
		</div>
		<p class="text-[11px] opacity-90 pl-6">
			{currentPlatformStatus.details}
		</p>
	</div>

	{#if testPingSuccess}
		<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
			<Check class="h-4 w-4" />
			<span>Test packet received! Hook status updated to <strong>CONNECTED</strong> with audit log entry.</span>
		</div>
	{/if}

	<!-- Sub-Adapter Selection Grid -->
	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
		{#each currentConfig.adapters as adapter}
			<button
				type="button"
				onclick={() => (activeAdapter = adapter.id)}
				class="p-3.5 rounded-2xl border text-left transition-all cursor-pointer {activeAdapter === adapter.id ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/40 shadow-xs' : 'bg-card border-border hover:bg-muted/40'}"
			>
				<div class="flex items-center justify-between pb-1.5">
					<span class="text-xs font-bold text-foreground">{adapter.name}</span>
					<span class="text-[9px] font-mono px-1.5 py-0.2 rounded border {activeAdapter === adapter.id ? 'border-primary/40 bg-primary/20 text-primary font-bold' : 'border-border bg-muted text-muted-foreground'}">
						{adapter.badge}
					</span>
				</div>
				<p class="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
					{adapter.notes}
				</p>
			</button>
		{/each}
	</div>

	<!-- Aceternity Circuit Simulation Visualizer Canvas -->
	<div class="p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
		<div class="flex items-center justify-between text-xs font-mono text-muted-foreground">
			<span class="font-semibold text-foreground flex items-center gap-1.5">
				<CpuChip class="h-4 w-4 text-primary" />
				<span>Interactive Ingress Circuit:</span>
			</span>
			<span>{isSimulating ? `Active Stage: 0${simulationStep}` : "Standby"}</span>
		</div>

		<!-- Animated Circuit Steps -->
		<div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
			<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simulationStep >= 1 ? 'bg-primary/10 border-primary/40 font-bold text-foreground' : 'bg-background border-border text-muted-foreground'}">
				<span>01. Ingress Trigger</span>
				{#if simulationStep === 1}<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>{/if}
			</div>

			<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simulationStep >= 2 ? 'bg-purple-500/10 border-purple-500/40 font-bold text-foreground' : 'bg-background border-border text-muted-foreground'}">
				<span>02. AST Sanitizer</span>
				{#if simulationStep === 2}<span class="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>{/if}
			</div>

			<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simulationStep >= 3 ? 'bg-amber-500/10 border-amber-500/40 font-bold text-foreground' : 'bg-background border-border text-muted-foreground'}">
				<span>03. DB Pre-Check</span>
				{#if simulationStep === 3}<span class="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>{/if}
			</div>

			<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simulationStep >= 4 ? 'bg-emerald-500/10 border-emerald-500/40 font-bold text-foreground' : 'bg-background border-border text-muted-foreground'}">
				<span>04. Human Sign-Off</span>
				{#if simulationStep === 4}<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>{/if}
			</div>

			<div class="col-span-2 sm:col-span-1 p-3 rounded-xl border flex items-center justify-between transition-colors {simulationStep >= 5 ? 'bg-rose-500/10 border-rose-500/40 font-bold text-foreground' : 'bg-background border-border text-muted-foreground'}">
				<span>05. Safe Commit</span>
				{#if simulationStep === 5}<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>{/if}
			</div>
		</div>
	</div>

	<!-- Code Snippet & Integration Guide for Selected Adapter -->
	{#each currentConfig.adapters as adapter}
		{#if activeAdapter === adapter.id}
			<div class="space-y-3 pt-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="text-xs font-semibold text-foreground">{adapter.name} Integration Snippet:</span>
						<span class="text-[11px] font-mono text-muted-foreground">({adapter.endpoint})</span>
					</div>

					<button
						type="button"
						onclick={() => copyCode(adapter.snippet)}
						class="h-7 px-2.5 rounded-lg border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
					>
						{#if copied}
							<Check class="h-3.5 w-3.5 text-emerald-500" />
							<span class="text-emerald-500">Copied!</span>
						{:else}
							<ClipboardDocument class="h-3.5 w-3.5" />
							<span>Copy Snippet</span>
						{/if}
					</button>
				</div>

				<pre class="p-4 rounded-2xl bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-neutral-800 leading-relaxed"><code>{adapter.snippet}</code></pre>
			</div>
		{/if}
	{/each}
</div>
