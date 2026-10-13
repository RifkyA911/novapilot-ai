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

	// Simulation states
	let isSimulating = $state(false);
	let simulationStep = $state(0); // 0: idle, 1: client trigger, 2: hook extract, 3: novapilot core & db, 4: human sign-off, 5: loopback confirmation
	let copied = $state(false);
	let testPingSuccess = $state(false);
	let pinging = $state(false);

	// Multi-platform Client Definitions
	interface ClientAdapter {
		id: string;
		name: string;
		subtitle: string;
		badge: string;
		logoUrl: string;
		color: string;
		bgColor: string;
		dotColor: string;
		yPos: number; // 55, 135, 215, 295
		path: string;
		endpoint: string;
		snippet: string;
		notes: string;
	}

	interface PlatformEcosystem {
		title: string;
		description: string;
		hookName: string;
		hookSub: string;
		hookTech: string;
		adapters: ClientAdapter[];
	}

	const platformConfigs: Record<ChatPlatform, PlatformEcosystem> = {
		whatsapp: {
			title: "WhatsApp Hook Ecosystem",
			description: "Passive DOM observers inside Ferdium, Rambox, and browser userscripts plus headless Baileys WebSocket daemon.",
			hookName: "DOM Ingestion Hook",
			hookSub: "MutationObserver Active",
			hookTech: "Passive Webview Inject",
			adapters: [
				{
					id: "ferdium",
					name: "Ferdium App",
					subtitle: "Electron Recipe webview.js",
					badge: "ACTIVE RECIPE",
					logoUrl: "https://avatars.githubusercontent.com/u/102928503?s=200&v=4",
					color: "text-purple-600 dark:text-purple-400",
					bgColor: "bg-purple-500/10 border-purple-500/30",
					dotColor: "#a855f7",
					yPos: 55,
					path: "M 180 55 C 235 55, 255 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/tickets",
					snippet: `// %APPDATA%\\Ferdium\\recipes\\whatsapp\\webview.js\nFerdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));`,
					notes: "Zero QR scan requirement. Injects DOM observer directly into Ferdium WhatsApp webview."
				},
				{
					id: "rambox",
					name: "Rambox App",
					subtitle: "Service Custom JS Code",
					badge: "STANDALONE JS",
					logoUrl: "https://avatars.githubusercontent.com/u/19875476?s=200&v=4",
					color: "text-blue-600 dark:text-blue-400",
					bgColor: "bg-blue-500/10 border-blue-500/30",
					dotColor: "#3b82f6",
					yPos: 135,
					path: "M 180 135 C 230 135, 260 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/tickets",
					snippet: `// Rambox -> WhatsApp -> Settings -> Advanced -> Inject JavaScript code\n(function() {\n  const BACKEND = "http://127.0.0.1:8088/api/tickets";\n  console.log("[NovaPilot] Rambox Hook Active");\n})();`,
					notes: "Runs inside Rambox Electron process. Forwards whitelisted branch groups to local port 8088."
				},
				{
					id: "browser",
					name: "Web Browser",
					subtitle: "Tampermonkey Userscript",
					badge: "ONE-CLICK SCRIPT",
					logoUrl: "https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png",
					color: "text-emerald-600 dark:text-emerald-400",
					bgColor: "bg-emerald-500/10 border-emerald-500/30",
					dotColor: "#10b981",
					yPos: 215,
					path: "M 180 215 C 230 215, 260 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/tickets",
					snippet: `// ==UserScript==\n// @name         NovaPilot WhatsApp Ingestion Hook\n// @match        https://web.whatsapp.com/*\n// @grant        GM_xmlhttpRequest\n// ==/UserScript==\nconst NOVAPILOT_BACKEND = "http://127.0.0.1:8088/api/tickets";`,
					notes: "Passive MutationObserver watching incoming messages on web.whatsapp.com."
				},
				{
					id: "baileys",
					name: "PC WA Daemon",
					subtitle: "Baileys Socket Gateway",
					badge: "NODE.JS SERVICE",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
					color: "text-green-600 dark:text-green-400",
					bgColor: "bg-green-500/10 border-green-500/30",
					dotColor: "#22c55e",
					yPos: 295,
					path: "M 180 295 C 235 295, 255 175, 305 175",
					endpoint: "Direct WebSocket Gateway :8088",
					snippet: `// Run headless background daemon\nnpm install @whiskeysockets/baileys\nnode ./scripts/baileys-daemon.js --port 8088`,
					notes: "Standalone Node.js service connecting directly to WhatsApp Multi-Device protocol."
				}
			]
		},
		telegram: {
			title: "Telegram Bot & Webhook Ecosystem",
			description: "Ingress gateway receiving JSON update payloads from Telegram BotFather or pulling updates via intranet long-polling.",
			hookName: "Bot API Ingress Hook",
			hookSub: "JSON Update Receiver",
			hookTech: "Fast HTTP Webhook",
			adapters: [
				{
					id: "tg_desktop",
					name: "Telegram Desktop",
					subtitle: "TDLib / MTProto Client",
					badge: "DESKTOP APP",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
					color: "text-sky-600 dark:text-sky-400",
					bgColor: "bg-sky-500/10 border-sky-500/30",
					dotColor: "#0284c7",
					yPos: 55,
					path: "M 180 55 C 235 55, 255 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/telegram",
					snippet: `# Forward chat messages from desktop bot webhook\ncurl -X POST http://127.0.0.1:8088/api/webhooks/telegram \\\n  -H "Content-Type: application/json" \\\n  -d '{"message": {"chat": {"id": -1001234}, "text": "Revisi PO-9921"}}'`,
					notes: "Dispatches update messages from Telegram Desktop group chats to the intake engine."
				},
				{
					id: "tg_mobile",
					name: "Telegram Mobile",
					subtitle: "BotFather Inline Action",
					badge: "MOBILE CHAT",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
					color: "text-blue-600 dark:text-blue-400",
					bgColor: "bg-blue-500/10 border-blue-500/30",
					dotColor: "#3b82f6",
					yPos: 135,
					path: "M 180 135 C 230 135, 260 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/telegram/callback",
					snippet: `// Telegram Mobile Inline Approval Contract\n{\n  "callback_query": {\n    "data": "approve_TK_101",\n    "from": { "id": 109283719, "username": "johndoe" }\n  }\n}`,
					notes: "Allows plant engineers to sign off directly from Android/iOS Telegram notifications."
				},
				{
					id: "tg_webhook",
					name: "Webhook Gateway",
					subtitle: "Bot API Webhook Ingress",
					badge: "PUBLIC PROXY",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
					color: "text-cyan-600 dark:text-cyan-400",
					bgColor: "bg-cyan-500/10 border-cyan-500/30",
					dotColor: "#06b6d4",
					yPos: 215,
					path: "M 180 215 C 230 215, 260 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/telegram",
					snippet: `curl -F "url=https://factory.internal:8088/api/webhooks/telegram" \\\n     "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook"`,
					notes: "Receives instant webhook callbacks on every branch group transaction message."
				},
				{
					id: "tg_daemon",
					name: "Long-Polling Daemon",
					subtitle: "Air-Gapped Intranet Pull",
					badge: "NO PUBLIC IP",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
					color: "text-indigo-600 dark:text-indigo-400",
					bgColor: "bg-indigo-500/10 border-indigo-500/30",
					dotColor: "#6366f1",
					yPos: 295,
					path: "M 180 295 C 235 295, 255 175, 305 175",
					endpoint: "Internal Go Worker (getUpdates)",
					snippet: `// .env configuration for air-gapped industrial LAN\nTELEGRAM_MODE=polling\nTELEGRAM_POLL_TIMEOUT=25s`,
					notes: "Pulls updates over outbound HTTPS without requiring incoming port forwarding."
				}
			]
		},
		discord: {
			title: "Discord Webhook & Bot Gateway",
			description: "Channel webhook ingestion and bot interactions for engineering support servers.",
			hookName: "Guild Channel Hook",
			hookSub: "Gateway WebSocket Ingress",
			hookTech: "Discord.js / Webhook",
			adapters: [
				{
					id: "dc_desktop",
					name: "Discord Desktop",
					subtitle: "Electron Client Channel",
					badge: "DESKTOP GUILD",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-indigo-600 dark:text-indigo-400",
					bgColor: "bg-indigo-500/10 border-indigo-500/30",
					dotColor: "#6366f1",
					yPos: 55,
					path: "M 180 55 C 235 55, 255 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/discord",
					snippet: `# Discord Channel Dispatch Payload\ncurl -X POST http://127.0.0.1:8088/api/webhooks/discord \\\n  -H "Content-Type: application/json" \\\n  -d '{"content": "Revisi PO-9921", "channel_id": "11928374928"}'`,
					notes: "Hooks ops tickets posted by factory staff in #plant-operations directly into parser."
				},
				{
					id: "dc_webhook",
					name: "Channel Webhook",
					subtitle: "Incoming Ingress Webhook",
					badge: "CHANNEL HOOK",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-blue-600 dark:text-blue-400",
					bgColor: "bg-blue-500/10 border-blue-500/30",
					dotColor: "#3b82f6",
					yPos: 135,
					path: "M 180 135 C 230 135, 260 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/discord",
					snippet: `// Discord Inbound Ingress Webhook Contract\n{\n  "content": "Update INV/2026/001 customer_name ke PT Maju Jaya",\n  "author": { "username": "Operator-Surabaya" }\n}`,
					notes: "Zero authentication friction: forwards whitelisted Discord channel alerts directly."
				},
				{
					id: "dc_bot",
					name: "Gateway Bot Daemon",
					subtitle: "WebSocket Event Loop",
					badge: "WSS GATEWAY",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-purple-600 dark:text-purple-400",
					bgColor: "bg-purple-500/10 border-purple-500/30",
					dotColor: "#a855f7",
					yPos: 215,
					path: "M 180 215 C 230 215, 260 175, 305 175",
					endpoint: "wss://gateway.discord.gg/?v=10&encoding=json",
					snippet: `DISCORD_BOT_TOKEN=MTE5MjgzNzQ5MjgxOTIwMTk0.Gb819a...\nDISCORD_GUILD_ID=981273645129384756\nDISCORD_ALLOWED_CHANNELS=ops-tickets`,
					notes: "Maintains full duplex gateway connection with Message Content privileged intent."
				},
				{
					id: "dc_slash",
					name: "Slash Commands",
					subtitle: "Interactive ChatOps (/novapilot)",
					badge: "SLASH BOT",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-violet-600 dark:text-violet-400",
					bgColor: "bg-violet-500/10 border-violet-500/30",
					dotColor: "#8b5cf6",
					yPos: 295,
					path: "M 180 295 C 235 295, 255 175, 305 175",
					endpoint: "POST /api/webhooks/discord/interactions",
					snippet: `/novapilot update doc_no:INV/2026/001 field:customer_name value:"PT Jaya"`,
					notes: "Provides autocomplete and immediate modal confirmations inside Discord."
				}
			]
		},
		slack: {
			title: "Slack Enterprise Bolt Ecosystem",
			description: "Slack Events API subscriptions, slash commands (/novapilot), and Block Kit interactive message modals.",
			hookName: "Bolt Events Hook",
			hookSub: "HMAC-SHA256 Ingress",
			hookTech: "Bolt SDK Gateway",
			adapters: [
				{
					id: "slack_desktop",
					name: "Slack Desktop App",
					subtitle: "Enterprise Grid Client",
					badge: "WORKSPACE CLIENT",
					logoUrl: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
					color: "text-amber-600 dark:text-amber-400",
					bgColor: "bg-amber-500/10 border-amber-500/30",
					dotColor: "#d97706",
					yPos: 55,
					path: "M 180 55 C 235 55, 255 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/slack",
					snippet: `# Slack Event Subscription URL:\nhttps://gateway.factory.internal:8088/api/webhooks/slack`,
					notes: "Captures messages in authorized operational channels without manual export."
				},
				{
					id: "slack_events",
					name: "Slack Events API",
					subtitle: "JSON Event Subscriptions",
					badge: "EVENTS API",
					logoUrl: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
					color: "text-emerald-600 dark:text-emerald-400",
					bgColor: "bg-emerald-500/10 border-emerald-500/30",
					dotColor: "#10b981",
					yPos: 135,
					path: "M 180 135 C 230 135, 260 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/slack",
					snippet: `// X-Slack-Signature: v0=a2114d57b48eac39b9ad189dd8313238e7a471d6...\n{\n  "event": {\n    "type": "message",\n    "text": "Mohon update nama customer INV/2026/001"\n  }\n}`,
					notes: "Cryptographically verified using Slack Signing Secret HMAC-SHA256."
				},
				{
					id: "slack_slash",
					name: "Slash Command Engine",
					subtitle: "/novapilot Command Trigger",
					badge: "SLASH TRIGGER",
					logoUrl: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
					color: "text-purple-600 dark:text-purple-400",
					bgColor: "bg-purple-500/10 border-purple-500/30",
					dotColor: "#a855f7",
					yPos: 215,
					path: "M 180 215 C 230 215, 260 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/slack/commands",
					snippet: `/novapilot update INV/2026/001 customer_name "PT Sumber Makmur"`,
					notes: "Instantly initiates deterministic parsing and stages ticket into Approval Queue."
				},
				{
					id: "slack_block",
					name: "Block Kit Interactive",
					subtitle: "Interactive Action Modals",
					badge: "BLOCK KIT",
					logoUrl: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
					color: "text-rose-600 dark:text-rose-400",
					bgColor: "bg-rose-500/10 border-rose-500/30",
					dotColor: "#f43f5e",
					yPos: 295,
					path: "M 180 295 C 235 295, 255 175, 305 175",
					endpoint: "POST http://127.0.0.1:8088/api/webhooks/slack/actions",
					snippet: `// Block Kit Action Payload\n{\n  "type": "block_actions",\n  "actions": [{ "action_id": "approve_mutation", "value": "TK-101" }]\n}`,
					notes: "Enables multi-branch supervisor sign-off directly inside Slack message thread."
				}
			]
		}
	};

	let currentConfig = $derived(platformConfigs[cockpit.chatPlatform] || platformConfigs.whatsapp);
	let currentPlatformStatus = $derived(cockpit.platformStatuses[cockpit.chatPlatform]);

	// Active selected client adapter within the current platform
	let activeClient = $state<string>("ferdium");

	// Auto-select first adapter when platform changes
	$effect(() => {
		const adapters = currentConfig.adapters;
		if (!adapters.some(a => a.id === activeClient)) {
			activeClient = adapters[0]?.id || "ferdium";
		}
	});

	let activeAdapterObj = $derived(
		currentConfig.adapters.find(a => a.id === activeClient) || currentConfig.adapters[0]
	);

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
					raw_message: `Test ${cockpit.chatPlatform.toUpperCase()} Hook [${activeAdapterObj.name}]: Verified connection from Hook Ecosystem Cockpit.`,
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: "INV/2026/001",
					field_target: "customer_name",
					proposed_value: `PT Test ${cockpit.chatPlatform.toUpperCase()} Active`,
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

	function triggerLiveSimulation() {
		if (isSimulating) return;
		isSimulating = true;
		simulationStep = 1;

		setTimeout(() => {
			simulationStep = 2; // Ingestion / DOM Hook
			setTimeout(() => {
				simulationStep = 3; // NovaPilot Go Core & DB Pre-check
				setTimeout(() => {
					simulationStep = 4; // On-Call Sign-off
					setTimeout(() => {
						simulationStep = 5; // Return Loopback to Client
						setTimeout(() => {
							isSimulating = false;
							simulationStep = 0;
						}, 1800);
					}, 1200);
				}, 1200);
			}, 1000);
		}, 800);
	}
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
				<PaperAirplane class="w-3.5 h-3.5 {pinging ? 'animate-bounce' : ''}" />
				<span>{pinging ? "Sending Ping..." : `Test ${currentPlatformStatus.name} Ping`}</span>
			</button>

			<button
				type="button"
				onclick={triggerLiveSimulation}
				disabled={isSimulating}
				class="px-3.5 py-2 text-xs font-semibold rounded-xl border border-input bg-background hover:bg-accent text-foreground transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="w-3.5 h-3.5 {isSimulating ? 'animate-spin' : ''}" />
				<span>{isSimulating ? `Traversing Stage 0${simulationStep}/05...` : "Test Hook Animation"}</span>
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
				<span>Platform Not Configured: Add credentials or tokens in Platform Settings to activate.</span>
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

	<!-- Interactive Client Selector Pills with Real Web Logos -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		{#each currentConfig.adapters as client}
			<button
				type="button"
				onclick={() => activeClient = client.id}
				class="p-3 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 cursor-pointer {activeClient === client.id ? `${client.bgColor} ring-2 ring-primary/40 shadow-sm` : 'bg-secondary/30 border-border/60 hover:bg-secondary/60'}"
			>
				<img
					src={client.logoUrl}
					alt={client.name}
					class="w-8 h-8 rounded-lg object-contain bg-background p-1 border border-border/60 shrink-0 shadow-2xs"
				/>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold truncate {activeClient === client.id ? client.color : 'text-foreground'}">
							{client.name}
						</span>
					</div>
					<p class="text-[10px] text-muted-foreground truncate font-mono">
						{client.badge}
					</p>
				</div>
			</button>
		{/each}
	</div>

	<!-- ========================================================================= -->
	<!-- ANIMATED SVG PROCESS PIPELINE (ENHANCED CONNECTIVITY & FLOWING WIRES)       -->
	<!-- ========================================================================= -->
	<div class="relative w-full rounded-2xl bg-secondary/20 dark:bg-black/40 border border-border/70 p-4 overflow-hidden">
		<!-- SVG Canvas -->
		<svg
			viewBox="0 0 980 380"
			class="w-full h-auto select-none overflow-visible"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<!-- Custom SVG Keyframes for Flowing Lines & RGB Outer Border Glow -->
				<style>
					@keyframes flowWire {
						from { stroke-dashoffset: 0; }
						to { stroke-dashoffset: -28; }
					}
					@keyframes flowWireReturn {
						from { stroke-dashoffset: 0; }
						to { stroke-dashoffset: 28; }
					}
					@keyframes rgbGlowPulse {
						0% {
							stroke: #ef4444;
							filter: drop-shadow(0 0 7px #ef4444) drop-shadow(0 0 14px rgba(239, 68, 68, 0.5));
						}
						25% {
							stroke: #f59e0b;
							filter: drop-shadow(0 0 7px #f59e0b) drop-shadow(0 0 14px rgba(245, 158, 11, 0.5));
						}
						50% {
							stroke: #10b981;
							filter: drop-shadow(0 0 7px #10b981) drop-shadow(0 0 14px rgba(16, 185, 129, 0.5));
						}
						75% {
							stroke: #3b82f6;
							filter: drop-shadow(0 0 7px #3b82f6) drop-shadow(0 0 14px rgba(59, 130, 246, 0.5));
						}
						100% {
							stroke: #a855f7;
							filter: drop-shadow(0 0 7px #a855f7) drop-shadow(0 0 14px rgba(168, 85, 247, 0.5));
						}
					}
					.flowing-path {
						stroke-dasharray: 8 5;
						animation: flowWire 1s linear infinite;
					}
					.flowing-path-fast {
						stroke-dasharray: 8 5;
						animation: flowWire 0.65s linear infinite;
					}
					.flowing-path-return {
						stroke-dasharray: 6 4;
						animation: flowWireReturn 0.9s linear infinite;
					}
					.rgb-border-glow {
						animation: rgbGlowPulse 1.6s linear infinite;
						stroke-width: 3px !important;
					}
				</style>

				<!-- Linear Gradients for 4 Client Adapters -->
				{#each currentConfig.adapters as adapter}
					<linearGradient id="grad_{adapter.id}" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color={adapter.dotColor} />
						<stop offset="100%" stop-color="#10b981" />
					</linearGradient>
				{/each}

				<linearGradient id="gradNovaPilot" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#10b981" />
					<stop offset="100%" stop-color="#3b82f6" />
				</linearGradient>

				<linearGradient id="gradLoopback" x1="100%" y1="0%" x2="0%" y2="0%">
					<stop offset="0%" stop-color="#10b981" />
					<stop offset="100%" stop-color="#a855f7" />
				</linearGradient>

				<!-- Particle Glow Filter -->
				<filter id="particleGlow" x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>

			<!-- 1. LEFT LAYER: 4 Client Adapters (With Web Images) -->
			{#each currentConfig.adapters as client, idx}
				<g
					role="button"
					tabindex="0"
					class="cursor-pointer transition-opacity {activeClient === client.id ? 'opacity-100' : 'opacity-40'}"
					onclick={() => activeClient = client.id}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeClient = client.id; } }}
				>
					<rect
						x="20" y={25 + (idx * 80)} width="160" height="60" rx="12"
						fill="currentColor"
						class="text-card stroke-border/70 {simulationStep === 1 && activeClient === client.id ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
					/>
					<image href={client.logoUrl} x="32" y={37 + (idx * 80)} width="34" height="34" preserveAspectRatio="xMidYMid slice" />
					<text x="76" y={48 + (idx * 80)} font-family="system-ui" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">{client.name}</text>
					<text x="76" y={65 + (idx * 80)} font-family="monospace" font-size="8.5" fill="currentColor" class="text-muted-foreground">{client.badge}</text>
				</g>
			{/each}

			<!-- 2. CONNECTING BEZIER CURVES: From 4 Clients to Hook Node -->
			{#each currentConfig.adapters as client}
				<path
					d={client.path}
					fill="none"
					stroke={activeClient === client.id ? `url(#grad_${client.id})` : '#94a3b8'}
					stroke-width={activeClient === client.id ? '2.5' : '1'}
					stroke-opacity={activeClient === client.id ? '0.9' : '0.2'}
					class={activeClient === client.id ? 'flowing-path-fast' : 'flowing-path'}
				/>
			{/each}

			<!-- Animated Pulse Packet from Active Client to Hook (Stage 1) -->
			{#if isSimulating && simulationStep === 1}
				<circle r="6" fill="#10b981" filter="url(#particleGlow)">
					<animateMotion
						dur="0.8s"
						repeatCount="1"
						path={activeAdapterObj.path}
					/>
				</circle>
			{/if}

			<!-- 3. CENTER-LEFT: Ingestion Hook Box -->
			<g transform="translate(305, 115)">
				<rect
					x="0" y="0" width="165" height="120" rx="14"
					fill="currentColor"
					class="text-card stroke-emerald-500/60 {simulationStep === 2 ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
				/>
				<!-- Title -->
				<text x="16" y="26" font-family="system-ui" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">{currentConfig.hookName}</text>
				<text x="16" y="42" font-family="monospace" font-size="8.5" fill="#10b981" font-weight="bold">{currentConfig.hookSub}</text>
				
				<!-- Inner Process Specs -->
				<rect x="12" y="52" width="141" height="56" rx="8" fill="currentColor" class="text-secondary/60" />
				<text x="20" y="68" font-family="monospace" font-size="8.5" fill="currentColor" class="text-foreground">⚡ Ingress: {currentConfig.hookTech}</text>
				<text x="20" y="82" font-family="monospace" font-size="8.5" fill="currentColor" class="text-foreground">🔍 Intent: UPDATE_NAME</text>
				<text x="20" y="96" font-family="monospace" font-size="8.5" fill="#10b981" font-weight="bold">✓ Badge: Ingested</text>
			</g>

			<!-- Flowing Line from Hook to NovaPilot AI Core -->
			<path
				d="M 470 175 L 530 175"
				fill="none"
				stroke="url(#gradNovaPilot)"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			{#if isSimulating && simulationStep === 2}
				<circle r="6" fill="#3b82f6" filter="url(#particleGlow)">
					<animateMotion dur="0.6s" repeatCount="1" path="M 470 175 L 530 175" />
				</circle>
			{/if}

			<!-- 4. CENTER-RIGHT: NOVAPILOT AI CORE GATEKEEPER & DB (PROMINENT CENTERPIECE) -->
			<g transform="translate(530, 85)">
				<!-- Main NovaPilot Core Box -->
				<rect
					x="0" y="0" width="220" height="180" rx="16"
					fill="currentColor"
					class="text-card stroke-primary/80 {simulationStep === 3 ? 'rgb-border-glow' : 'stroke-[2px]'}"
				/>
				<!-- Brand Header -->
				<rect x="0" y="0" width="220" height="38" rx="16" fill="#10b981" fill-opacity="0.12" />
				<text x="18" y="24" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-primary">🛡️ NovaPilot AI Core</text>
				<text x="145" y="24" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">:8088 / Go</text>

				<!-- Engine Features -->
				<g transform="translate(14, 48)">
					<rect x="0" y="0" width="192" height="60" rx="8" fill="currentColor" class="text-secondary/60" />
					<text x="12" y="18" font-family="monospace" font-size="8.5" fill="currentColor" class="text-foreground">1. Pre-Check: SELECT inv_no</text>
					<text x="12" y="32" font-family="monospace" font-size="8.5" fill="currentColor" class="text-foreground">2. Safety: Enforce OPEN status</text>
					<text x="12" y="46" font-family="monospace" font-size="8.5" fill="#3b82f6" font-weight="bold">3. Prepared SQL + Rollback</text>
				</g>

				<!-- Database Adapter Sub-Box -->
				<g transform="translate(14, 116)">
					<rect x="0" y="0" width="192" height="50" rx="8" fill="currentColor" class="text-secondary/80 stroke-border/70" stroke-width="1" />
					<text x="12" y="20" font-family="system-ui" font-size="9.5" font-weight="bold" fill="currentColor" class="text-foreground">🗄️ Database Adapter</text>
					<text x="12" y="38" font-family="monospace" font-size="8" fill="#10b981" font-weight="bold">PostgreSQL 18 • Oracle 11g • LTS</text>
				</g>
			</g>

			<!-- Flowing Line from NovaPilot to On-Call Cockpit -->
			<path
				d="M 750 175 L 810 175"
				fill="none"
				stroke="#10b981"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			{#if isSimulating && simulationStep === 3}
				<circle r="6" fill="#10b981" filter="url(#particleGlow)">
					<animateMotion dur="0.5s" repeatCount="1" path="M 750 175 L 810 175" />
				</circle>
			{/if}

			<!-- 5. RIGHT LAYER: On-Call Human Cockpit -->
			<g transform="translate(810, 115)">
				<rect
					x="0" y="0" width="150" height="120" rx="14"
					fill="currentColor"
					class="text-card stroke-emerald-500/70 {simulationStep === 4 ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
				/>
				<text x="16" y="26" font-family="system-ui" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">On-Call Sign-Off</text>
				<text x="16" y="42" font-family="monospace" font-size="8.5" fill="#10b981" font-weight="bold">Port :3000 Dashboard</text>

				<rect x="12" y="52" width="126" height="56" rx="8" fill="currentColor" class="text-secondary/60" />
				<text x="20" y="70" font-family="monospace" font-size="8.5" fill="currentColor" class="text-foreground">👤 John Doe</text>
				<text x="20" y="84" font-family="monospace" font-size="8.5" fill="#10b981" font-weight="bold">✓ 1-Click Approve</text>
				<text x="20" y="98" font-family="monospace" font-size="8" fill="currentColor" class="text-muted-foreground">Zero Raw SQL Guard</text>
			</g>

			<!-- 6. RETURN LOOPBACK WIRE (Automated Receipt dispatched back to chat client) -->
			<path
				d="M 885 235 C 885 360, 450 360, 100 335"
				fill="none"
				stroke="url(#gradLoopback)"
				stroke-width={simulationStep === 5 ? "3" : "1.5"}
				stroke-opacity={simulationStep === 5 ? "1" : "0.3"}
				class="flowing-path-return"
			/>
			<text x="500" y="352" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold" text-anchor="middle">
				↺ ChatOps Confirmation Receipt Delivered Back to {currentPlatformStatus.name} Client
			</text>

			{#if isSimulating && simulationStep === 5}
				<circle r="6" fill="#a855f7" filter="url(#particleGlow)">
					<animateMotion dur="1.2s" repeatCount="1" path="M 885 235 C 885 360, 450 360, 100 335" />
				</circle>
			{/if}
		</svg>
	</div>

	<!-- Active Integration Details Card & Setup Guide -->
	<div class="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border/70 space-y-3">
		<div class="flex items-center justify-between flex-wrap gap-2">
			<div class="flex items-center gap-2">
				<CodeBracket class="w-4 h-4 text-primary" />
				<h4 class="text-xs font-bold text-foreground">
					Setup Hook for: <span class="text-primary">{activeAdapterObj.name}</span>
				</h4>
			</div>
			<span class="text-[10px] font-mono text-muted-foreground">
				Target: {activeAdapterObj.endpoint}
			</span>
		</div>

		<!-- Code Snippet -->
		<pre class="p-3.5 rounded-xl bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-neutral-800 leading-relaxed"><code>{activeAdapterObj.snippet}</code></pre>

		<div class="flex items-center justify-between text-xs text-muted-foreground pt-1 flex-wrap gap-2">
			<div class="flex items-center gap-1.5">
				<CheckCircle class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
				<span class="text-[11px]">{activeAdapterObj.notes}</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => copyCode(activeAdapterObj.snippet)}
					class="h-7 px-2.5 rounded-lg border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
				>
					{#if copied}
						<Check class="h-3.5 w-3.5 text-emerald-500" />
						<span class="text-emerald-500">Copied!</span>
					{:else}
						<ClipboardDocument class="h-3.5 w-3.5" />
						<span>Copy Snippet</span>
					{/if}
				</button>
				<a href="/flow" class="text-primary hover:underline font-medium text-xs">View Full Architecture &rarr;</a>
			</div>
		</div>
	</div>
</div>
