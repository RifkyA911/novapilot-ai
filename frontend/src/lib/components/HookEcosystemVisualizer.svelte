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
		Radio,
		Eye,
		Bolt,
		CircleStack,
		Photo,
		DocumentText,
		ArrowsPointingOut,
		ArrowsPointingIn
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";

	// Simulation states (Steps 1 to 6)
	let isSimulating = $state(false);
	let simulationStep = $state(0); 

	let copied = $state(false);
	let testPingSuccess = $state(false);
	let pinging = $state(false);

	// Pan & Zoom interactive controls
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);

	function handleMouseDown(e: MouseEvent) {
		// Only start drag on left click and ignore buttons/links
		if (e.button !== 0) return;
		const target = e.target as HTMLElement | SVGElement;
		if (target.closest("button") || target.closest("a") || target.closest(".no-pan")) return;
		isDragging = true;
		dragStartX = e.clientX - panX;
		dragStartY = e.clientY - panY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		panX = e.clientX - dragStartX;
		panY = e.clientY - dragStartY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		// Only zoom when Ctrl or Cmd is held so normal page scrolling is not intercepted
		if (!e.ctrlKey && !e.metaKey) return;
		e.preventDefault();
		const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
		const nextZoom = Math.min(Math.max(zoom + zoomDelta, 0.6), 2.5);
		zoom = Number(nextZoom.toFixed(2));
	}

	function zoomIn() {
		zoom = Math.min(Number((zoom + 0.15).toFixed(2)), 2.5);
	}

	function zoomOut() {
		zoom = Math.max(Number((zoom - 0.15).toFixed(2)), 0.6);
	}

	function resetPanZoom() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}

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
		status: "CONNECTED" | "STANDBY" | "DISCONNECTED";
		yPos: number;
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

	// Dynamic adapters with toggleable live connection states
	let platformConfigs = $state<Record<ChatPlatform, PlatformEcosystem>>({
		whatsapp: {
			title: "WhatsApp Hook & Multi-Client Ecosystem",
			description: "Passive DOM observers inside Ferdium, Rambox, and browser userscripts plus headless Baileys WebSocket daemon with Tesseract OCR.",
			hookName: "DOM & Socket Hook",
			hookSub: "MutationObserver & Baileys",
			hookTech: "Passive Webview Inject + OCR",
			adapters: [
				{
					id: "baileys",
					name: "PC WA Gateway",
					subtitle: "Baileys Multi-Device Socket",
					badge: "LIVE GATEWAY",
					status: "CONNECTED",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
					color: "text-emerald-500",
					bgColor: "bg-emerald-500/10 border-emerald-500/30",
					dotColor: "#10b981",
					yPos: 56,
					path: "M 200 59 C 235 59, 235 170, 270 170",
					endpoint: "Headless WebSocket Gateway :3002",
					snippet: `// Headless Baileys Daemon with Tesseract OCR\nbun run src/index.ts --port 3002\n// Auto-downloads attachments & runs OCR vision pipeline`,
					notes: "Active direct multi-device socket to WhatsApp servers with local Tesseract OCR physical invoice parser."
				},
				{
					id: "ferdium",
					name: "Ferdium App",
					subtitle: "Electron Recipe webview.js",
					badge: "STANDBY RECIPE",
					status: "STANDBY",
					logoUrl: "https://avatars.githubusercontent.com/u/103602318?s=280&v=4",
					color: "text-purple-500",
					bgColor: "bg-purple-500/10 border-purple-500/30",
					dotColor: "#a855f7",
					yPos: 124,
					path: "M 200 127 C 235 127, 235 170, 270 170",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// %APPDATA%\\Ferdium\\recipes\\whatsapp\\webview.js\nFerdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));`,
					notes: "Zero QR scan requirement. Injects DOM observer directly into Ferdium WhatsApp webview."
				},
				{
					id: "rambox",
					name: "Rambox App",
					subtitle: "Service Custom JS Code",
					badge: "STANDBY JS",
					status: "STANDBY",
					logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqMqZSsR2E7Uo-_ij-9er8fUBTYLAXxHXGfJZK_W9f7A&s=10",
					color: "text-blue-500",
					bgColor: "bg-blue-500/10 border-blue-500/30",
					dotColor: "#3b82f6",
					yPos: 192,
					path: "M 200 195 C 235 195, 235 170, 270 170",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// Rambox -> WhatsApp -> Settings -> Advanced -> Inject JavaScript code\n(function() {\n  const BACKEND = "http://127.0.0.1:8088/api/inbound-messages";\n  console.log("[NovaPilot] Rambox Hook Active");\n})();`,
					notes: "Runs inside Rambox Electron process. Forwards whitelisted branch groups to local port 8088."
				},
				{
					id: "browser",
					name: "Web Browser",
					subtitle: "Tampermonkey Userscript",
					badge: "STANDBY SCRIPT",
					status: "STANDBY",
					logoUrl: "https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png",
					color: "text-amber-500",
					bgColor: "bg-amber-500/10 border-amber-500/30",
					dotColor: "#f59e0b",
					yPos: 260,
					path: "M 200 263 C 235 263, 235 170, 270 170",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// ==UserScript==\n// @name         NovaPilot WhatsApp Ingestion Hook\n// @match        https://web.whatsapp.com/*\n// @grant        GM_xmlhttpRequest\n// ==/UserScript==\nconst NOVAPILOT_BACKEND = "http://127.0.0.1:8088/api/inbound-messages";`,
					notes: "Passive MutationObserver watching incoming messages on web.whatsapp.com."
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
					id: "tg_webhook",
					name: "Webhook Gateway",
					subtitle: "Bot API Webhook Ingress",
					badge: "LIVE WEBHOOK",
					status: "CONNECTED",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
					color: "text-sky-500",
					bgColor: "bg-sky-500/10 border-sky-500/30",
					dotColor: "#0284c7",
					yPos: 56,
					path: "M 200 59 C 235 59, 235 170, 270 170",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `curl -F "url=https://factory.internal:8088/api/inbound-messages" \\\n     "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook"`,
					notes: "Receives instant webhook callbacks on every branch group transaction message."
				},
				{
					id: "tg_desktop",
					name: "Telegram Desktop",
					subtitle: "TDLib / MTProto Client",
					badge: "STANDBY CLIENT",
					status: "STANDBY",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
					color: "text-blue-500",
					bgColor: "bg-blue-500/10 border-blue-500/30",
					dotColor: "#3b82f6",
					yPos: 124,
					path: "M 200 127 C 235 127, 235 170, 270 170",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `# Forward chat messages from desktop bot webhook\ncurl -X POST http://127.0.0.1:8088/api/inbound-messages \\\n  -H "Content-Type: application/json" \\\n  -d '{"platform":"telegram", "raw_message": "Revisi INV/2026/001 ke PT Maju"}'`,
					notes: "Dispatches update messages from Telegram Desktop group chats to the intake engine."
				},
				{
					id: "tg_mobile",
					name: "Telegram Mobile",
					subtitle: "BotFather Inline Action",
					badge: "STANDBY APP",
					status: "STANDBY",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
					color: "text-indigo-500",
					bgColor: "bg-indigo-500/10 border-indigo-500/30",
					dotColor: "#6366f1",
					yPos: 192,
					path: "M 200 195 C 235 195, 235 170, 270 170",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// Telegram Mobile Inline Approval Contract\n{\n  "callback_query": {\n    "data": "approve_TK_101",\n    "from": { "id": 109283719, "username": "johndoe" }\n  }\n}`,
					notes: "Allows plant engineers to sign off directly from Android/iOS Telegram notifications."
				},
				{
					id: "tg_daemon",
					name: "Long-Polling Daemon",
					subtitle: "Air-Gapped Intranet Pull",
					badge: "STANDBY DAEMON",
					status: "STANDBY",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
					color: "text-purple-500",
					bgColor: "bg-purple-500/10 border-purple-500/30",
					dotColor: "#a855f7",
					yPos: 260,
					path: "M 200 263 C 235 263, 235 170, 270 170",
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
					id: "discord_channel",
					name: "Discord Channel",
					subtitle: "On-Call Incident Channel",
					badge: "LIVE GUILD HOOK",
					status: "CONNECTED",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-indigo-500",
					bgColor: "bg-indigo-500/10 border-indigo-500/30",
					dotColor: "#6366f1",
					yPos: 56,
					path: "M 200 59 C 235 59, 235 170, 270 170",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// Discord Webhook Payload\n{\n  "content": "Mohon update nota INV/2026/001 ke PT Mandiri Perkasa"\n}`,
					notes: "Receives events from engineering channels with zero bot server hosting."
				},
				{
					id: "discord_slash",
					name: "Slash Commands",
					subtitle: "Interactive ChatOps (/novapilot)",
					badge: "STANDBY BOT",
					status: "STANDBY",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-violet-500",
					bgColor: "bg-violet-500/10 border-violet-500/30",
					dotColor: "#8b5cf6",
					yPos: 124,
					path: "M 200 127 C 235 127, 235 170, 270 170",
					endpoint: "POST /api/webhooks/discord/interactions",
					snippet: `/novapilot update doc_no:INV/2026/001 field:customer_name value:"PT Jaya"`,
					notes: "Provides autocomplete and immediate modal confirmations inside Discord."
				},
				{
					id: "discord_bot",
					name: "Gateway Bot",
					subtitle: "Discord Gateway Socket",
					badge: "STANDBY GATEWAY",
					status: "STANDBY",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-purple-500",
					bgColor: "bg-purple-500/10 border-purple-500/30",
					dotColor: "#a855f7",
					yPos: 192,
					path: "M 200 195 C 235 195, 235 170, 270 170",
					endpoint: "Gateway WebSocket / wss://gateway.discord.gg",
					snippet: `// Discord Bot Gateway Client\nclient.on('messageCreate', msg => forwardToNovaPilot(msg));`,
					notes: "Full bidirectional gateway bot for enterprise Discord channels."
				},
				{
					id: "discord_relay",
					name: "Incident Relay",
					subtitle: "PagerDuty / Opsgenie Forwarder",
					badge: "STANDBY RELAY",
					status: "STANDBY",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-cyan-500",
					bgColor: "bg-cyan-500/10 border-cyan-500/30",
					dotColor: "#06b6d4",
					yPos: 260,
					path: "M 200 263 C 235 263, 235 170, 270 170",
					endpoint: "POST /api/webhooks/discord/relay",
					snippet: `// Forward on-call escalation alerts\nPOST /api/tickets/escalate`,
					notes: "Relays urgent plant alarms directly to on-call voice channel."
				}
			]
		},
		slack: {
			title: "Slack Enterprise Grid & Events API",
			description: "Events API and Interactive Block Kit handlers for corporate workspace channels.",
			hookName: "Slack Events API Ingress",
			hookSub: "JSON Payload Verifier",
			hookTech: "Signed Secret Webhook",
			adapters: [
				{
					id: "slack_channel",
					name: "Slack Channel",
					subtitle: "#it-helpdesk Ingress Hook",
					badge: "LIVE APP HOOK",
					status: "CONNECTED",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
					color: "text-emerald-500",
					bgColor: "bg-emerald-500/10 border-emerald-500/30",
					dotColor: "#10b981",
					yPos: 56,
					path: "M 200 59 C 235 59, 235 170, 270 170",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// Incoming Webhook payload\n{\n  "channel": "#it-helpdesk",\n  "text": "Revisi customer INV/2026/001 ke PT Cahaya Baru"\n}`,
					notes: "Slack channel notifications forwarded directly into the staging feed."
				},
				{
					id: "slack_events",
					name: "Events API",
					subtitle: "message.channels Listener",
					badge: "STANDBY EVENTS",
					status: "STANDBY",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
					color: "text-amber-500",
					bgColor: "bg-amber-500/10 border-amber-500/30",
					dotColor: "#f59e0b",
					yPos: 124,
					path: "M 200 127 C 235 127, 235 170, 270 170",
					endpoint: "POST /api/webhooks/slack/events",
					snippet: `// Verifies X-Slack-Signature before parsing\napp.event('message', async ({ event }) => novapilot.stage(event));`,
					notes: "Enterprise-grade HMAC signature verification on every incoming message."
				},
				{
					id: "slack_slash",
					name: "Slash Command",
					subtitle: "Interactive /novapilot Prompt",
					badge: "STANDBY CMD",
					status: "STANDBY",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
					color: "text-rose-500",
					bgColor: "bg-rose-500/10 border-rose-500/30",
					dotColor: "#f43f5e",
					yPos: 192,
					path: "M 200 195 C 235 195, 235 170, 270 170",
					endpoint: "POST /api/webhooks/slack/commands",
					snippet: `/novapilot approve TK-2026-001`,
					notes: "On-call engineers can approve or reject tickets without leaving Slack."
				},
				{
					id: "slack_block",
					name: "Block Kit UI",
					subtitle: "Rich Interactive Cards",
					badge: "STANDBY UI",
					status: "STANDBY",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
					color: "text-blue-500",
					bgColor: "bg-blue-500/10 border-blue-500/30",
					dotColor: "#3b82f6",
					yPos: 260,
					path: "M 200 263 C 235 263, 235 170, 270 170",
					endpoint: "POST /api/webhooks/slack/actions",
					snippet: `// Block Kit interactive button payload\n{ "type": "block_actions", "action_id": "approve_mutation" }`,
					notes: "Full interactive modals and diff preview blocks rendered natively inside Slack."
				}
			]
		}
	});

	let currentConfig = $derived(platformConfigs[cockpit.chatPlatform] || platformConfigs.whatsapp);
	let currentPlatformStatus = $derived(cockpit.platformStatuses[cockpit.chatPlatform]);

	// Active selected client adapter within current platform
	let activeClient = $state<string>("baileys");

	$effect(() => {
		const adapters = currentConfig.adapters;
		if (!adapters.some(a => a.id === activeClient)) {
			activeClient = adapters[0]?.id || "baileys";
		}
	});

	let activeAdapterObj = $derived(
		currentConfig.adapters.find(a => a.id === activeClient) || currentConfig.adapters[0]
	);

	function toggleAdapterStatus(adapterId: string) {
		const adapter = currentConfig.adapters.find(a => a.id === adapterId);
		if (adapter) {
			adapter.status = adapter.status === "CONNECTED" ? "STANDBY" : "CONNECTED";
		}
	}

	// Detailed Technical Explanation for each Phase (1-6)
	const stepNarratives = [
		{
			step: 1,
			title: "1. Client Ingress (Chat & Media Transmission)",
			badge: "MULTI-CLIENT INGRESS",
			color: "text-purple-500",
			bgColor: "bg-purple-500/10 border-purple-500/30",
			description: "Text messages or physical invoice photos sent from WhatsApp, Telegram, Ferdium, Rambox, or Web UI. Clients never hold direct network access to any database.",
			dataFlow: "Chat Client / Mobile → Ingress Hook (HTTP / Socket)",
			dbStatus: "Zero DB Exposure: Clients execute in isolated sandbox"
		},
		{
			step: 2,
			title: "2. Ingress Hook & Vision OCR Pipeline (Tesseract)",
			badge: "PARSING & OCR ENGINE",
			color: "text-blue-500",
			bgColor: "bg-blue-500/10 border-blue-500/30",
			description: "Hook extracts message body and downloads image buffers to storage. Tesseract.js OCR engine parses physical invoice text (INV/2026/001), while NLP regex matches intent and target customer name.",
			dataFlow: "Baileys Socket / DOM → Tesseract OCR Engine → Entity Mapping",
			dbStatus: "Queries DB 1 memory (learned_patterns table) to match conversational phrasing"
		},
		{
			step: 3,
			title: "3. NovaPilot AI Core Gatekeeper & DB 1 Staging",
			badge: "DB 1: OPERATIONAL SYSTEM STORE",
			color: "text-emerald-500",
			bgColor: "bg-emerald-500/10 border-emerald-500/30",
			description: "Go Core Backend (:8088) stages the payload into DB 1 (PostgreSQL local :5432). A new ticket (PENDING_APPROVAL status) and immutable HMAC audit log are created atomically with rollback guard.",
			dataFlow: "Go Core Engine (:8088) → PostgreSQL 18 Local (novapilot_db)",
			dbStatus: "DB 1 ACTIVE: Persisting inbound_messages, tickets, audit_logs, learned_patterns tables"
		},
		{
			step: 4,
			title: "4. Human-in-the-Loop On-Call Sign-Off (Web Cockpit)",
			badge: "ZERO-TRUST VERIFICATION",
			color: "text-amber-500",
			bgColor: "bg-amber-500/10 border-amber-500/30",
			description: "On-call engineer inspects dashboard (/dashboard/queue), verifies original invoice image proof, compares old vs new values, then triggers '1-Click Approve'.",
			dataFlow: "Web Dashboard (:3000) → POST /api/tickets/:id/approve",
			dbStatus: "DB 1 UPDATED: Ticket status updated to APPROVED; cryptographic approval signature logged"
		},
		{
			step: 5,
			title: "5. Enterprise MCP Data Connector (DB 2 Mutation)",
			badge: "DB 2: TARGET BUSINESS DATA SOURCE",
			color: "text-cyan-500",
			bgColor: "bg-cyan-500/10 border-cyan-500/30",
			description: "Core invokes Model Context Protocol (MCP) Tool Server to mutate business data in DB 2 (Oracle 19c Enterprise / ERP / SAP). Only parameterized prepared statements are executed (Zero Raw SQL).",
			dataFlow: "Core Engine → MCP Tool Server → DB 2 Enterprise Data Source (Oracle/ERP)",
			dbStatus: "DB 2 MUTATED: Official enterprise invoice table updated transactionally"
		},
		{
			step: 6,
			title: "6. Bi-directional Outbound Receipt Loopback",
			badge: "REAL-TIME CONFIRMATION",
			color: "text-rose-500",
			bgColor: "bg-rose-500/10 border-rose-500/30",
			description: "SSE ticket_updated event broadcasts in real-time to WhatsApp Gateway. The bot automatically dispatches an official receipt with ticket number back to the originating chat group.",
			dataFlow: "SSE Stream (:8088/api/events) → WhatsApp Socket → Chat Group",
			dbStatus: "DB 1 COMPLETE: Execution time, operator ID, and final state permanently archived"
		}
	];

	function copyCode(text: string) {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function triggerTestPing() {
		if (pinging) return;
		pinging = true;
		try {
			const res = await fetch("/api/inbound-messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					platform: cockpit.chatPlatform,
					sender_id: `test_${activeAdapterObj.id}`,
					sender_name: `${activeAdapterObj.name} Test Runner`,
					raw_message: `Ping Test Hook [${activeAdapterObj.name}]: Verifikasi aliran dari Hook Ecosystem Cockpit.`,
					media_type: "text",
					classification: "ACTIONABLE",
					extracted_doc: "INV/2026/001",
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					extracted_target: "PT Test Ingress Perkasa"
				})
			});
			if (res.ok) {
				testPingSuccess = true;
				cockpit.recordPlatformEvent(cockpit.chatPlatform);
				setTimeout(() => { testPingSuccess = false; }, 3500);
			}
		} catch (e) {
			console.error("Test ping error:", e);
		} finally {
			pinging = false;
		}
	}

	async function triggerLiveSimulation() {
		if (isSimulating) return;
		isSimulating = true;
		for (let step = 1; step <= 6; step++) {
			simulationStep = step;
			await new Promise(r => setTimeout(r, 1200));
		}
		await new Promise(r => setTimeout(r, 800));
		isSimulating = false;
		simulationStep = 0;
	}
</script>

<div class="space-y-6">
	<!-- ========================================================================= -->
	<!-- 1. HEADER SECTION & SIMULATION CONTROLS                                   -->
	<!-- ========================================================================= -->
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
		<div class="space-y-1.5">
			<div class="flex items-center gap-2.5 flex-wrap">
				<h3 class="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
					{currentConfig.title}
					<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
						DUAL DB + MCP ARCHITECTURE
					</span>
				</h3>
				
				<!-- Live Connection Status -->
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
					<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-muted text-muted-foreground border border-border">
						<span class="h-2 w-2 rounded-full bg-muted-foreground"></span>
						<span>NOT CONFIGURED</span>
					</span>
				{/if}
			</div>

			<p class="text-xs text-muted-foreground leading-relaxed max-w-3xl">
				Dual-Database Isolation Architecture: <strong>DB 1 (PostgreSQL)</strong> serves as the operational staging store (tickets, logs, and AI memory), and <strong>DB 2 (Enterprise ERP via MCP)</strong> acts as the external business data source mutated safely without raw SQL exposure.
			</p>
		</div>

		<!-- Action Controls -->
		<div class="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
			<button
				type="button"
				onclick={triggerTestPing}
				disabled={pinging}
				class="h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
			>
				{#if pinging}
					<ArrowPath class="h-3.5 w-3.5 animate-spin text-primary" />
					<span>Pinging Hook...</span>
				{:else if testPingSuccess}
					<Check class="h-3.5 w-3.5 text-emerald-500" />
					<span class="text-emerald-500 font-bold">Hook Ingested!</span>
				{:else}
					<Bolt class="h-3.5 w-3.5 text-primary" />
					<span>Ping Test Hook</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={triggerLiveSimulation}
				disabled={isSimulating}
				class="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
			>
				<Sparkles class="h-3.5 w-3.5 {isSimulating ? 'animate-spin' : ''}" />
				<span>{isSimulating ? `Simulasi Tahap ${simulationStep}/6...` : "▶ Jalankan Simulasi End-to-End"}</span>
			</button>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 2. CLIENT ADAPTERS SELECTOR TABS                                          -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
		{#each currentConfig.adapters as client}
			<div
				class="p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-2.5 {activeClient === client.id ? `${client.bgColor} ring-2 ring-primary/40 shadow-xs` : 'bg-secondary/30 border-border/60 hover:bg-secondary/60'}"
			>
				<button
					type="button"
					onclick={() => activeClient = client.id}
					class="min-w-0 flex-1 flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
				>
					<img
						src={client.logoUrl}
						alt={client.name}
						class="w-8 h-8 rounded-lg object-contain bg-background p-1 border border-border/60 shrink-0 shadow-2xs"
					/>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-bold truncate {activeClient === client.id ? client.color : 'text-foreground'}">
								{client.name}
							</span>
						</div>
						<p class="text-[10px] text-muted-foreground truncate font-mono">
							{client.subtitle}
						</p>
					</div>
				</button>

				<!-- Toggle Connection Status Badge -->
				<button
					type="button"
					onclick={() => toggleAdapterStatus(client.id)}
					class="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-all border {client.status === 'CONNECTED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border hover:border-foreground/30'}"
					title="Click to toggle adapter connection status"
				>
					{client.status === 'CONNECTED' ? 'LIVE' : 'STANDBY'}
				</button>
			</div>
		{/each}
	</div>

	<!-- ========================================================================= -->
	<!-- 3. ANIMATED SVG PROCESS PIPELINE (PAN & ZOOM INTERACTIVE CANVAS)           -->
	<!-- ========================================================================= -->
	<div 
		role="region"
		aria-label="Interactive Client Hook Ecosystem Visualizer"
		class="relative w-full rounded-2xl bg-secondary/20 dark:bg-black/60 border border-border/80 p-2 sm:p-4 overflow-hidden select-none transition-colors {isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
		onwheel={handleWheel}
	>
		<!-- Floating Pan & Zoom Controls Toolbar -->
		<div class="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-md">
			<button 
				type="button"
				onclick={zoomIn} 
				class="h-7 w-7 rounded-lg hover:bg-muted text-foreground flex items-center justify-center font-bold text-sm cursor-pointer transition-colors" 
				title="Perbesar Tampilan (Zoom In)"
			>
				+
			</button>
			<button 
				type="button"
				onclick={zoomOut} 
				class="h-7 w-7 rounded-lg hover:bg-muted text-foreground flex items-center justify-center font-bold text-sm cursor-pointer transition-colors" 
				title="Perkecil Tampilan (Zoom Out)"
			>
				-
			</button>
			<div class="h-4 w-px bg-border"></div>
			<button 
				type="button"
				onclick={resetPanZoom} 
				class="px-2 h-7 rounded-lg hover:bg-muted text-xs font-mono font-semibold text-foreground flex items-center cursor-pointer transition-colors" 
				title="Reset Zoom & Pusatkan (100%)"
			>
				{Math.round(zoom * 100)}%
			</button>
			<div class="h-4 w-px bg-border"></div>
			<span class="text-[10px] text-muted-foreground px-2 font-mono hidden md:inline">
				🖐️ Drag kanvas • 🔍 Ctrl + Scroll zoom
			</span>
		</div>

		<!-- SVG Canvas with Pan & Zoom Transform -->
		<svg
			viewBox="0 0 1260 500"
			class="w-full min-w-[960px] h-[480px] sm:h-[540px] select-none overflow-visible"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<!-- Custom SVG Keyframes for Flowing Lines & RGB Outer Border Glow -->
				<style>
					@keyframes flowWireFast {
						from { stroke-dashoffset: 0; }
						to { stroke-dashoffset: -32; }
					}
					@keyframes flowWireSlow {
						from { stroke-dashoffset: 0; }
						to { stroke-dashoffset: -20; }
					}
					@keyframes flowWireReturn {
						from { stroke-dashoffset: 0; }
						to { stroke-dashoffset: 32; }
					}
					@keyframes activeGlowPulse {
						0% { stroke: #10b981; filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8)); }
						50% { stroke: #3b82f6; filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.9)); }
						100% { stroke: #10b981; filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8)); }
					}
					.flowing-path-connected {
						stroke-dasharray: 8 5;
						animation: flowWireFast 0.85s linear infinite;
					}
					.flowing-path-normal {
						stroke-dasharray: 8 5;
						animation: flowWireSlow 1.2s linear infinite;
					}
					.flowing-path-return {
						stroke-dasharray: 8 5;
						animation: flowWireReturn 0.9s linear infinite;
					}
					.active-box-glow {
						animation: activeGlowPulse 1.4s ease-in-out infinite;
						stroke-width: 3px !important;
					}
					@keyframes dbLedBlinkFast {
						0%, 100% { opacity: 0.25; }
						50% { opacity: 1; }
					}
					@keyframes dbLedBlinkSlow {
						0%, 100% { opacity: 0.35; }
						50% { opacity: 1; }
					}
					@keyframes dbBeamScan {
						0% { transform: translateY(0px); opacity: 0.3; }
						50% { transform: translateY(28px); opacity: 0.95; }
						100% { transform: translateY(0px); opacity: 0.3; }
					}
					@keyframes socketRipple {
						0% { r: 4px; opacity: 1; stroke-width: 2px; }
						100% { r: 14px; opacity: 0; stroke-width: 0.5px; }
					}
					.db-led-fast {
						animation: dbLedBlinkFast 0.65s infinite;
					}
					.db-led-slow {
						animation: dbLedBlinkSlow 1.3s infinite;
					}
					.db-socket-pulse {
						animation: socketRipple 1.6s ease-out infinite;
					}
					.db-beam {
						animation: dbBeamScan 1.8s ease-in-out infinite;
					}
				</style>

				<!-- Gradients for Adapters -->
				{#each currentConfig.adapters as adapter}
					<linearGradient id="grad_{adapter.id}" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color={adapter.dotColor} />
						<stop offset="100%" stop-color="#3b82f6" />
					</linearGradient>
				{/each}

				<linearGradient id="gradCoreToDB1" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#10b981" />
					<stop offset="100%" stop-color="#059669" />
				</linearGradient>

				<linearGradient id="gradCoreToCockpit" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#10b981" />
					<stop offset="100%" stop-color="#f59e0b" />
				</linearGradient>

				<linearGradient id="gradCockpitToMCP" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#f59e0b" />
					<stop offset="100%" stop-color="#06b6d4" />
				</linearGradient>

				<linearGradient id="gradMCPToDB2" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#06b6d4" />
					<stop offset="100%" stop-color="#2563eb" />
				</linearGradient>

				<linearGradient id="gradLoopbackFull" x1="100%" y1="0%" x2="0%" y2="0%">
					<stop offset="0%" stop-color="#06b6d4" />
					<stop offset="50%" stop-color="#a855f7" />
					<stop offset="100%" stop-color="#10b981" />
				</linearGradient>

				<!-- Particle Glow Filter -->
				<filter id="particleGlow" x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>

			<!-- Outer Zoom & Pan Transformed Group -->
			<g transform="translate({panX}, {panY}) scale({zoom})">

				<!-- ============================================================= -->
				<!-- LAYER 1: CLIENT ADAPTERS (x=20 to 200)                        -->
				<!-- ============================================================= -->
				{#each currentConfig.adapters as client, idx}
					<g
						role="button"
						tabindex="0"
						class="cursor-pointer transition-all {activeClient === client.id ? 'opacity-100' : 'opacity-65 hover:opacity-90'}"
						onclick={() => activeClient = client.id}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeClient = client.id; } }}
					>
						<!-- Box Card -->
						<rect
							x="20" y={28 + (idx * 68)} width="180" height="60" rx="14"
							fill="currentColor"
							class="text-card stroke-border/80 {simulationStep === 1 && activeClient === client.id ? 'active-box-glow' : 'stroke-[1.5px]'}"
						/>
						<!-- Logo Icon -->
						<image href={client.logoUrl} x="32" y={40 + (idx * 68)} width="36" height="36" preserveAspectRatio="xMidYMid slice" />
						
						<!-- Name & Badge -->
						<text x="78" y={52 + (idx * 68)} font-family="system-ui" font-size="13" font-weight="bold" fill="currentColor" class="text-foreground">{client.name}</text>
						
						<!-- Connection Status Tag inside Box -->
						{#if client.status === 'CONNECTED'}
							<circle cx="83" cy="71 + (idx * 68)" r="3.5" fill="#10b981" />
							<text x="92" y={75 + (idx * 68)} font-family="monospace" font-size="10.5" font-weight="bold" fill="#10b981">CONNECTED (LIVE)</text>
						{:else}
							<circle cx="83" cy="71 + (idx * 68)" r="3" fill="#64748b" />
							<text x="92" y={75 + (idx * 68)} font-family="monospace" font-size="10" fill="#64748b">STANDBY (OFFLINE)</text>
						{/if}
					</g>
				{/each}

				<!-- CONNECTING BEZIER CURVES: From 4 Clients to Ingress Hook Node (Exact Anchors) -->
				{#each currentConfig.adapters as client}
					{#if client.status === 'CONNECTED'}
						<!-- CONNECTED: Vibrant flowing dashed curve with high stroke -->
						<path
							d={client.path}
							fill="none"
							stroke={activeClient === client.id ? `url(#grad_${client.id})` : '#10b981'}
							stroke-width={activeClient === client.id ? '3' : '2'}
							stroke-opacity="0.95"
							class="flowing-path-connected"
						/>
					{:else}
						<!-- STANDBY / DISCONNECTED: Muted static dashed line, ZERO animation -->
						<path
							d={client.path}
							fill="none"
							stroke="#64748b"
							stroke-width="1.2"
							stroke-opacity="0.3"
							stroke-dasharray="4 4"
						/>
					{/if}
				{/each}

				<!-- Simulation Packet: Step 1 (Only along CONNECTED active adapter) -->
				{#if isSimulating && simulationStep === 1 && activeAdapterObj.status === 'CONNECTED'}
					<circle r="7" fill="#10b981" filter="url(#particleGlow)">
						<animateMotion dur="0.8s" repeatCount="1" path={activeAdapterObj.path} />
					</circle>
				{/if}

				<!-- ============================================================= -->
				<!-- LAYER 2: INGRESS HOOK & VISION OCR PIPELINE (x=270 to 470)    -->
				<!-- ============================================================= -->
				<g transform="translate(270, 36)">
					<rect
						x="0" y="0" width="195" height="264" rx="16"
						fill="currentColor"
						class="text-card stroke-blue-500/80 {simulationStep === 2 ? 'active-box-glow' : 'stroke-[2px]'}"
					/>
					<!-- Title Banner -->
					<rect x="0" y="0" width="195" height="38" rx="16" fill="#3b82f6" fill-opacity="0.15" />
					<text x="14" y="24" font-family="system-ui" font-size="13" font-weight="bold" fill="#3b82f6">📥 Ingress Hook &amp; OCR</text>

					<!-- Hook Sub-Engine Modules -->
					<g transform="translate(10, 48)">
						<!-- Module A: Text & Socket Extractor -->
						<rect x="0" y="0" width="175" height="52" rx="10" fill="currentColor" class="text-secondary/60" />
						<text x="10" y="18" font-family="monospace" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">⚡ Socket &amp; DOM Parser</text>
						<text x="10" y="33" font-family="monospace" font-size="10" fill="currentColor" class="text-muted-foreground">Unwrap Ephemeral/ViewOnce</text>
						<text x="10" y="46" font-family="monospace" font-size="10" fill="#10b981" font-weight="bold">✓ Socket Status: Realtime Hook</text>
					</g>

					<g transform="translate(10, 108)">
						<!-- Module B: Tesseract OCR Engine -->
						<rect x="0" y="0" width="175" height="74" rx="10" fill="#3b82f6" fill-opacity="0.08" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="1" />
						<text x="10" y="18" font-family="system-ui" font-size="11.5" font-weight="bold" fill="#3b82f6">📷 Tesseract Vision OCR</text>
						<text x="10" y="34" font-family="monospace" font-size="10.5" fill="currentColor" class="text-foreground">Doc: INV/2026/001</text>
						<text x="10" y="49" font-family="monospace" font-size="10.5" fill="currentColor" class="text-foreground">Bilingual: ind + eng</text>
						<text x="10" y="64" font-family="monospace" font-size="10" fill="#3b82f6" font-weight="bold">Extract physical invoices</text>
					</g>

					<g transform="translate(10, 190)">
						<!-- Module C: Self-Learning Pattern Engine -->
						<rect x="0" y="0" width="175" height="62" rx="10" fill="#a855f7" fill-opacity="0.08" stroke="#a855f7" stroke-opacity="0.3" stroke-width="1" />
						<text x="10" y="18" font-family="system-ui" font-size="11.5" font-weight="bold" fill="#a855f7">🧠 Pattern Learning Loop</text>
						<text x="10" y="34" font-family="monospace" font-size="10.5" fill="currentColor" class="text-foreground">Target: UPDATE_NAME</text>
						<text x="10" y="50" font-family="monospace" font-size="10" fill="#a855f7">Learned Regex from Postgres</text>
					</g>
				</g>

				<!-- Connecting Wire: Ingress Hook -> NovaPilot Core -->
				<path
					d="M 465 168 C 485 168, 485 110, 505 110"
					fill="none"
					stroke="#3b82f6"
					stroke-width="2.5"
					class="flowing-path-connected"
				/>

				<!-- Simulation Packet: Step 2 (Hook -> Core) -->
				{#if isSimulating && simulationStep === 2}
					<circle r="7" fill="#3b82f6" filter="url(#particleGlow)">
						<animateMotion dur="0.6s" repeatCount="1" path="M 465 168 C 485 168, 485 110, 505 110" />
					</circle>
				{/if}

				<!-- ============================================================= -->
				<!-- LAYER 3: NOVAPILOT AI CORE + DB 1 OPERATIONAL STORE           -->
				<!-- ============================================================= -->
				<!-- Top Box: NovaPilot AI Core (:8088 Go) -->
				<g transform="translate(505, 26)">
					<rect
						x="0" y="0" width="245" height="168" rx="18"
						fill="currentColor"
						class="text-card stroke-emerald-500/90 {simulationStep === 3 ? 'active-box-glow' : 'stroke-[2px]'}"
					/>
					<rect x="0" y="0" width="245" height="38" rx="18" fill="#10b981" fill-opacity="0.16" />
					<text x="16" y="25" font-family="system-ui" font-size="13.5" font-weight="bold" fill="currentColor" class="text-primary">🛡️ NovaPilot AI Core</text>
					<text x="175" y="25" font-family="monospace" font-size="11" fill="#10b981" font-weight="bold">:8088 / Go</text>

					<!-- Core Capabilities -->
					<g transform="translate(12, 48)">
						<rect x="0" y="0" width="221" height="56" rx="10" fill="currentColor" class="text-secondary/60" />
						<text x="10" y="18" font-family="monospace" font-size="10.5" fill="currentColor" class="text-foreground">1. Heuristic Intent Validator</text>
						<text x="10" y="34" font-family="monospace" font-size="10.5" fill="currentColor" class="text-foreground">2. Zero Raw SQL Injection Guard</text>
						<text x="10" y="49" font-family="monospace" font-size="10.5" fill="#10b981" font-weight="bold">3. SSE Event Bus (/api/events)</text>
					</g>

					<!-- Intake Staging Status -->
					<g transform="translate(12, 110)">
						<rect x="0" y="0" width="221" height="48" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.25" stroke-width="1" />
						<text x="10" y="18" font-family="monospace" font-size="11" font-weight="bold" fill="#10b981">✓ Intake Packet Verified</text>
						<text x="10" y="34" font-family="monospace" font-size="10" fill="currentColor" class="text-muted-foreground">Confidence: 96% • Schema Compliant</text>
					</g>
				</g>

				<!-- Downward Wire: Core -> DB 1 System Store -->
				<path
					d="M 627 194 L 627 232"
					fill="none"
					stroke="url(#gradCoreToDB1)"
					stroke-width="2.5"
					class="flowing-path-connected"
				/>

				<!-- DB 1 Connection Socket with Animated Pulse Ripple -->
				<circle cx="627" cy="232" r="4.5" fill="#10b981" />
				<circle cx="627" cy="232" r="5" fill="none" stroke="#10b981" class="db-socket-pulse" />

				<!-- Continuous Live Data Packets: Core <-> DB 1 -->
				<circle r="4" fill="#10b981" filter="url(#particleGlow)">
					<animateMotion dur="1.5s" repeatCount="indefinite" path="M 627 194 L 627 232" />
				</circle>
				<circle r="3" fill="#34d399" filter="url(#particleGlow)">
					<animateMotion dur="2.1s" begin="0.7s" repeatCount="indefinite" path="M 627 232 L 627 194" />
				</circle>

				<!-- Simulation Packet: Step 3 (Core -> DB 1 Staging Burst) -->
				{#if isSimulating && simulationStep === 3}
					<circle r="8" fill="#10b981" filter="url(#particleGlow)">
						<animateMotion dur="0.45s" repeatCount="1" path="M 627 194 L 627 232" />
					</circle>
				{/if}

				<!-- Bottom Box: DB 1 (PostgreSQL 18 System Store Local) -->
				<g transform="translate(505, 232)">
					<rect
						x="0" y="0" width="245" height="125" rx="16"
						fill="currentColor"
						class="text-card stroke-emerald-600/90 {simulationStep === 3 ? 'active-box-glow' : 'stroke-[2px]'}"
					/>
					<!-- Title Banner -->
					<rect x="0" y="0" width="245" height="34" rx="16" fill="#10b981" fill-opacity="0.18" />
					<text x="14" y="23" font-family="system-ui" font-size="13.5" font-weight="bold" fill="#059669">🗄️ DB 1: System Store (PostgreSQL 18)</text>

					<!-- Animated 3D Disk Platter Cylinder Stack on Right -->
					<g transform="translate(192, 44)">
						<!-- Laser Scanner Read/Write Beam -->
						<line x1="-12" y1="0" x2="36" y2="0" stroke="#10b981" stroke-width="1.5" class="db-beam" filter="url(#particleGlow)" />
						
						<!-- Disk 1 (Top Platter) -->
						<path d="M 0 10 v 9 a 18 6.5 0 0 0 36 0 v -9" fill="#059669" fill-opacity="0.45" stroke="#10b981" stroke-width="1" />
						<ellipse cx="18" cy="10" rx="18" ry="6.5" fill="#10b981" fill-opacity="0.65" stroke="#10b981" stroke-width="1.2" />
						
						<!-- Disk 2 (Middle Platter) -->
						<path d="M 0 23 v 9 a 18 6.5 0 0 0 36 0 v -9" fill="#047857" fill-opacity="0.55" stroke="#10b981" stroke-width="1" />
						<ellipse cx="18" cy="23" rx="18" ry="6.5" fill="#059669" fill-opacity="0.75" stroke="#10b981" stroke-width="1.2" />

						<!-- Disk 3 (Bottom Platter) -->
						<path d="M 0 36 v 9 a 18 6.5 0 0 0 36 0 v -9" fill="#065f46" fill-opacity="0.65" stroke="#10b981" stroke-width="1" />
						<ellipse cx="18" cy="36" rx="18" ry="6.5" fill="#047857" fill-opacity="0.85" stroke="#10b981" stroke-width="1.2" />

						<!-- Blinking IO Activity LEDs -->
						<circle cx="4" cy="54" r="2.5" fill="#10b981" class="db-led-fast" />
						<text x="10" y="57" font-family="monospace" font-size="8.5" fill="#10b981" font-weight="bold">RD</text>

						<circle cx="21" cy="54" r="2.5" fill="#f59e0b" class="db-led-slow" />
						<text x="27" y="57" font-family="monospace" font-size="8.5" fill="#f59e0b" font-weight="bold">WR</text>
					</g>

					<!-- Tables List -->
					<g transform="translate(12, 42)">
						<text x="6" y="15" font-family="monospace" font-size="11.5" font-weight="bold" fill="currentColor" class="text-foreground">Tabel Operasional (:5432 novapilot_db):</text>
						<text x="6" y="31" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">• inbound_messages (Staging Feed)</text>
						<text x="6" y="46" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">• tickets (Pending Approval Queue)</text>
						<text x="6" y="61" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">• audit_logs (Immutable Historical Trail)</text>
						<text x="6" y="74" font-family="monospace" font-size="11" fill="#10b981" font-weight="bold">• learned_patterns (AI Feedback Weights)</text>
					</g>
				</g>

				<!-- Connecting Wire: NovaPilot Core -> Human On-Call Cockpit -->
				<path
					d="M 750 110 L 795 110"
					fill="none"
					stroke="url(#gradCoreToCockpit)"
					stroke-width="2.5"
					class="flowing-path-connected"
				/>

				<!-- Simulation Packet: Step 3 -> 4 (Core -> Human Cockpit) -->
				{#if isSimulating && simulationStep === 3}
					<circle r="7" fill="#10b981" filter="url(#particleGlow)">
						<animateMotion dur="0.5s" repeatCount="1" path="M 750 110 L 795 110" />
					</circle>
				{/if}

				<!-- ============================================================= -->
				<!-- LAYER 4: HUMAN-IN-THE-LOOP ON-CALL COCKPIT (x=795 to 975)     -->
				<!-- ============================================================= -->
				<g transform="translate(795, 36)">
					<rect
						x="0" y="0" width="180" height="264" rx="16"
						fill="currentColor"
						class="text-card stroke-amber-500/80 {simulationStep === 4 ? 'active-box-glow' : 'stroke-[2px]'}"
					/>
					<!-- Title Banner -->
					<rect x="0" y="0" width="180" height="38" rx="16" fill="#f59e0b" fill-opacity="0.14" />
					<text x="14" y="24" font-family="system-ui" font-size="13" font-weight="bold" fill="#f59e0b">👤 On-Call Cockpit</text>
					<text x="135" y="24" font-family="monospace" font-size="10" fill="#f59e0b">:3000</text>

					<!-- Sign-off Features -->
					<g transform="translate(10, 48)">
						<rect x="0" y="0" width="160" height="50" rx="10" fill="currentColor" class="text-secondary/60" />
						<text x="8" y="18" font-family="monospace" font-size="10.5" fill="currentColor" class="text-foreground">Engineer: John Doe</text>
						<text x="8" y="32" font-family="monospace" font-size="10.5" fill="currentColor" class="text-foreground">Session: Verified Admin</text>
						<text x="8" y="44" font-family="monospace" font-size="9.5" fill="#f59e0b">Queue: /dashboard/queue</text>
					</g>

					<g transform="translate(10, 106)">
						<rect x="0" y="0" width="160" height="84" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.25" stroke-width="1" />
						<text x="8" y="18" font-family="monospace" font-size="10.5" font-weight="bold" fill="currentColor" class="text-foreground">Semantic Diff Inspector:</text>
						<text x="8" y="33" font-family="monospace" font-size="10" fill="#ef4444">- PT WOKWPWKW</text>
						<text x="8" y="48" font-family="monospace" font-size="10" fill="#10b981">+ PT HAHAHAHA</text>
						<text x="8" y="65" font-family="monospace" font-size="10.5" font-weight="bold" fill="#f59e0b">✓ 1-Click Approve</text>
						<text x="8" y="78" font-family="monospace" font-size="9.5" fill="currentColor" class="text-muted-foreground">Audit Signature Generated</text>
					</g>

					<g transform="translate(10, 198)">
						<rect x="0" y="0" width="160" height="54" rx="10" fill="currentColor" class="text-secondary/80" />
						<text x="8" y="18" font-family="monospace" font-size="10.5" font-weight="bold" fill="currentColor" class="text-foreground">Zero Direct Access</text>
						<text x="8" y="33" font-family="monospace" font-size="9.5" fill="currentColor" class="text-muted-foreground">Operators never type</text>
						<text x="8" y="46" font-family="monospace" font-size="9.5" fill="currentColor" class="text-muted-foreground">manual SQL queries!</text>
					</g>
				</g>

				<!-- Connecting Wire: Cockpit -> Enterprise MCP Connector -->
				<path
					d="M 975 110 L 1020 110"
					fill="none"
					stroke="url(#gradCockpitToMCP)"
					stroke-width="2.5"
					class="flowing-path-connected"
				/>

				<!-- Simulation Packet: Step 4 -> 5 (Cockpit -> MCP) -->
				{#if isSimulating && simulationStep === 4}
					<circle r="7" fill="#f59e0b" filter="url(#particleGlow)">
						<animateMotion dur="0.5s" repeatCount="1" path="M 975 110 L 1020 110" />
					</circle>
				{/if}

				<!-- ============================================================= -->
				<!-- LAYER 5: ENTERPRISE MCP DATA CONNECTOR + DB 2 BUSINESS STORE  -->
				<!-- ============================================================= -->
				<!-- Top Box: Enterprise MCP Multiplatform Data Connector -->
				<g transform="translate(1020, 26)">
					<rect
						x="0" y="0" width="220" height="168" rx="18"
						fill="currentColor"
						class="text-card stroke-cyan-500/90 {simulationStep === 5 ? 'active-box-glow' : 'stroke-[2px]'}"
					/>
					<rect x="0" y="0" width="220" height="38" rx="18" fill="#06b6d4" fill-opacity="0.16" />
					<text x="14" y="25" font-family="system-ui" font-size="13.5" font-weight="bold" fill="#06b6d4">🔌 Enterprise MCP Connector</text>
					
					<!-- Live Status Indicator -->
					<circle cx="204" cy="18" r="3" fill="#06b6d4" class="db-led-fast" />
					<text x="156" y="21" font-family="monospace" font-size="9.5" font-weight="bold" fill="#06b6d4">RPC: LIVE</text>

					<!-- MCP Features -->
					<g transform="translate(10, 48)">
						<rect x="0" y="0" width="200" height="58" rx="10" fill="currentColor" class="text-secondary/60" />
						<line x1="8" y1="48" x2="192" y2="48" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" class="flowing-path-connected" />
						<text x="8" y="18" font-family="monospace" font-size="11.5" font-weight="bold" fill="currentColor" class="text-foreground">Model Context Protocol</text>
						<text x="8" y="33" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">Tool: mutate_invoice_record()</text>
						<text x="8" y="45" font-family="monospace" font-size="10" fill="#06b6d4">Standard Multiplatform Schema</text>
					</g>

					<g transform="translate(10, 112)">
						<rect x="0" y="0" width="200" height="48" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.25" stroke-width="1" />
						<text x="8" y="18" font-family="monospace" font-size="11.5" font-weight="bold" fill="#06b6d4">✓ Zero Raw SQL Execution</text>
						<text x="8" y="33" font-family="monospace" font-size="10.5" fill="currentColor" class="text-muted-foreground">Only parameterized mutations</text>
						<text x="8" y="44" font-family="monospace" font-size="10.5" fill="currentColor" class="text-muted-foreground">passed to target ERP/DB</text>
					</g>
				</g>

				<!-- Downward Wire: MCP -> DB 2 Business Store -->
				<path
					d="M 1130 194 L 1130 232"
					fill="none"
					stroke="url(#gradMCPToDB2)"
					stroke-width="2.5"
					class="flowing-path-connected"
				/>

				<!-- DB 2 Connection Socket with Animated Pulse Ripple -->
				<circle cx="1130" cy="232" r="4.5" fill="#06b6d4" />
				<circle cx="1130" cy="232" r="5" fill="none" stroke="#06b6d4" class="db-socket-pulse" />

				<!-- Continuous Live Data Packets: MCP <-> DB 2 -->
				<circle r="4.5" fill="#06b6d4" filter="url(#particleGlow)">
					<animateMotion dur="1.4s" repeatCount="indefinite" path="M 1130 194 L 1130 232" />
				</circle>
				<circle r="3.5" fill="#38bdf8" filter="url(#particleGlow)">
					<animateMotion dur="2.0s" begin="0.7s" repeatCount="indefinite" path="M 1130 232 L 1130 194" />
				</circle>

				<!-- Simulation Packet: Step 5 (MCP -> DB 2 Parameterized Burst) -->
				{#if isSimulating && simulationStep === 5}
					<circle r="8" fill="#06b6d4" filter="url(#particleGlow)">
						<animateMotion dur="0.45s" repeatCount="1" path="M 1130 194 L 1130 232" />
					</circle>
				{/if}

				<!-- Bottom Box: DB 2 (Enterprise Business Data Source) -->
				<g transform="translate(1020, 232)">
					<rect
						x="0" y="0" width="220" height="125" rx="16"
						fill="currentColor"
						class="text-card stroke-blue-600/90 {simulationStep === 5 ? 'active-box-glow' : 'stroke-[2px]'}"
					/>
					<rect x="0" y="0" width="220" height="34" rx="16" fill="#2563eb" fill-opacity="0.18" />
					<text x="12" y="23" font-family="system-ui" font-size="13.5" font-weight="bold" fill="#2563eb">🏢 DB 2: Enterprise Data (ERP)</text>

					<!-- Animated 3D Disk Platter Cylinder Stack on Right -->
					<g transform="translate(170, 44)">
						<!-- Laser Scanner Read/Write Beam -->
						<line x1="-12" y1="0" x2="34" y2="0" stroke="#06b6d4" stroke-width="1.5" class="db-beam" filter="url(#particleGlow)" />
						
						<!-- Disk 1 (Top Platter) -->
						<path d="M 0 10 v 9 a 17 6.5 0 0 0 34 0 v -9" fill="#0284c7" fill-opacity="0.45" stroke="#06b6d4" stroke-width="1" />
						<ellipse cx="17" cy="10" rx="17" ry="6.5" fill="#06b6d4" fill-opacity="0.65" stroke="#06b6d4" stroke-width="1.2" />
						
						<!-- Disk 2 (Middle Platter) -->
						<path d="M 0 23 v 9 a 17 6.5 0 0 0 34 0 v -9" fill="#0369a1" fill-opacity="0.55" stroke="#06b6d4" stroke-width="1" />
						<ellipse cx="17" cy="23" rx="17" ry="6.5" fill="#0284c7" fill-opacity="0.75" stroke="#06b6d4" stroke-width="1.2" />

						<!-- Disk 3 (Bottom Platter) -->
						<path d="M 0 36 v 9 a 17 6.5 0 0 0 34 0 v -9" fill="#075985" fill-opacity="0.65" stroke="#06b6d4" stroke-width="1" />
						<ellipse cx="17" cy="36" rx="17" ry="6.5" fill="#0369a1" fill-opacity="0.85" stroke="#06b6d4" stroke-width="1.2" />

						<!-- Blinking IO Activity LEDs -->
						<circle cx="4" cy="54" r="2.5" fill="#06b6d4" class="db-led-fast" />
						<text x="10" y="57" font-family="monospace" font-size="8.5" fill="#06b6d4" font-weight="bold">TX</text>

						<circle cx="20" cy="54" r="2.5" fill="#3b82f6" class="db-led-slow" />
						<text x="26" y="57" font-family="monospace" font-size="8.5" fill="#3b82f6" font-weight="bold">OK</text>
					</g>

					<g transform="translate(10, 42)">
						<text x="6" y="15" font-family="monospace" font-size="11.5" font-weight="bold" fill="currentColor" class="text-foreground">Oracle 19c / SAP / ERP Prod:</text>
						<text x="6" y="31" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">• invoices (General Ledger Invoices)</text>
						<text x="6" y="46" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">• customer_master (Customer Master)</text>
						<text x="6" y="61" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">• ledger_balance (Accounting Ledger)</text>
						<text x="6" y="74" font-family="monospace" font-size="11" fill="#2563eb" font-weight="bold">🔒 Isolated Behind MCP Server</text>
					</g>
				</g>

				<!-- Simulation Packet: Step 5 (MCP -> DB 2) -->
				{#if isSimulating && simulationStep === 5}
					<circle r="7" fill="#06b6d4" filter="url(#particleGlow)">
						<animateMotion dur="0.5s" repeatCount="1" path="M 1130 194 L 1130 232" />
					</circle>
				{/if}

				<!-- ============================================================= -->
				<!-- LAYER 6: BI-DIRECTIONAL LOOPBACK WIRE TO WHATSAPP (x=1130 to 110) -->
				<!-- ============================================================= -->
				<path
					d="M 1130 357 C 1130 460, 270 460, 110 300"
					fill="none"
					stroke="url(#gradLoopbackFull)"
					stroke-width="2.5"
					class="flowing-path-return"
				/>

				<!-- Loopback Banner Label -->
				<g transform="translate(480, 436)">
					<rect x="0" y="0" width="310" height="34" rx="10" fill="currentColor" class="text-card border stroke-purple-500/60" stroke-width="1.5" />
					<text x="16" y="22" font-family="monospace" font-size="11" font-weight="bold" fill="#a855f7">
						🔄 Outbound Loopback Delivery Receipt
					</text>
				</g>

				<!-- Simulation Packet: Step 6 (Loopback Return to WhatsApp) -->
				{#if isSimulating && simulationStep === 6}
					<circle r="8" fill="#a855f7" filter="url(#particleGlow)">
						<animateMotion dur="1.2s" repeatCount="1" path="M 1130 357 C 1130 460, 270 460, 110 300" />
					</circle>
				{/if}

			</g>
		</svg>
	</div>

	<!-- ========================================================================= -->
	<!-- 4. STEP NARRATIVES ACCORDION / TIMELINE PILLS                              -->
	<!-- ========================================================================= -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<h4 class="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
				6-Stage Transaction Lifecycle &amp; Security Boundary
			</h4>
			<span class="text-[11px] font-mono text-muted-foreground">
				Langkah {simulationStep > 0 ? simulationStep : 1} dari 6
			</span>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each stepNarratives as narrative}
				<div
					class="p-4 rounded-xl border transition-all duration-200 space-y-2.5 {simulationStep === narrative.step ? `${narrative.bgColor} ring-2 ring-primary shadow-sm scale-[1.01]` : 'bg-card border-border/80 hover:border-border'}"
				>
					<div class="flex items-center justify-between gap-2">
						<span class="text-xs font-bold {narrative.color} flex items-center gap-1.5">
							{#if simulationStep === narrative.step}
								<span class="h-2 w-2 rounded-full bg-primary animate-ping"></span>
							{/if}
							{narrative.title}
						</span>
						<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border {narrative.bgColor}">
							{narrative.badge}
						</span>
					</div>

					<p class="text-xs text-foreground/80 leading-relaxed">
						{narrative.description}
					</p>

					<div class="pt-2 border-t border-border/50 text-[10.5px] font-mono space-y-1">
						<div class="text-muted-foreground truncate">
							<strong class="text-foreground">Alur:</strong> {narrative.dataFlow}
						</div>
						<div class="text-primary truncate">
							<strong class="text-foreground">Database:</strong> {narrative.dbStatus}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 5. DUAL DATABASE ARCHITECTURE COMPARISON CARDS                            -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
		<!-- DB 1 Card -->
		<div class="p-5 rounded-2xl bg-card border border-emerald-500/30 shadow-xs space-y-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
						<CircleStack class="h-5 w-5" />
					</div>
					<div>
						<h4 class="text-sm font-bold text-foreground">DB 1: System Operational Store</h4>
						<p class="text-[11px] font-mono text-muted-foreground">PostgreSQL 18 Local (:5432 novapilot_db)</p>
					</div>
				</div>
				<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
					INTERNAL
				</span>
			</div>

			<p class="text-xs text-muted-foreground leading-relaxed">
				Isolated local store accessed directly by the Go Backend Core for staging omnichannel inbound messages, human-in-the-loop approval queues, immutable HMAC audit logs, and self-learning AI patterns.
			</p>

			<div class="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
				<div class="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
					<span class="text-muted-foreground block text-[10px]">Core Tables</span>
					<span class="font-bold text-foreground">inbound_messages, tickets</span>
				</div>
				<div class="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
					<span class="text-muted-foreground block text-[10px]">ChatOps Access</span>
					<span class="font-bold text-emerald-500">Automated Staging</span>
				</div>
			</div>
		</div>

		<!-- DB 2 Card -->
		<div class="p-5 rounded-2xl bg-card border border-blue-500/30 shadow-xs space-y-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
						<ServerStack class="h-5 w-5" />
					</div>
					<div>
						<h4 class="text-sm font-bold text-foreground">DB 2: Enterprise Business Data Source</h4>
						<p class="text-[11px] font-mono text-muted-foreground">Oracle 19c / SAP HANA / Remote ERP</p>
					</div>
				</div>
				<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
					VIA MCP ONLY
				</span>
			</div>

			<p class="text-xs text-muted-foreground leading-relaxed">
				Core enterprise business transaction database. Completely isolated from ChatOps/LLM with guaranteed <strong>Zero Raw SQL Injection</strong>. Mutations are exclusively performed via Model Context Protocol (MCP) upon on-call engineer sign-off.
			</p>

			<div class="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
				<div class="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
					<span class="text-muted-foreground block text-[10px]">Execution Protocol</span>
					<span class="font-bold text-foreground">MCP Tool JSON-RPC</span>
				</div>
				<div class="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
					<span class="text-muted-foreground block text-[10px]">ChatOps Access</span>
					<span class="font-bold text-rose-500">Zero Direct SQL</span>
				</div>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 6. ACTIVE ADAPTER CODE SNIPPET INSPECTOR                                  -->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
		<div class="flex items-center justify-between gap-4 flex-wrap">
			<div class="flex items-center gap-3">
				<img
					src={activeAdapterObj.logoUrl}
					alt={activeAdapterObj.name}
					class="w-9 h-9 rounded-xl object-contain bg-background p-1.5 border border-border shadow-xs"
				/>
				<div>
					<h4 class="text-sm font-bold text-foreground flex items-center gap-2">
						{activeAdapterObj.name} Hook Integration
						<span class="text-[10px] font-mono px-2 py-0.5 rounded-md {activeAdapterObj.bgColor}">
							{activeAdapterObj.badge}
						</span>
					</h4>
					<p class="text-xs text-muted-foreground font-mono">{activeAdapterObj.endpoint}</p>
				</div>
			</div>

			<button
				type="button"
				onclick={() => copyCode(activeAdapterObj.snippet)}
				class="h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
			>
				{#if copied}
					<Check class="h-3.5 w-3.5 text-emerald-500" />
					<span class="text-emerald-500">Tersalin!</span>
				{:else}
					<ClipboardDocument class="h-3.5 w-3.5 text-muted-foreground" />
					<span>Salin Skrip Hook</span>
				{/if}
			</button>
		</div>

		<div class="relative rounded-xl overflow-hidden bg-muted/40 dark:bg-black/80 border border-border/60">
			<pre class="p-4 font-mono text-xs text-foreground/90 overflow-x-auto leading-relaxed"><code>{activeAdapterObj.snippet}</code></pre>
		</div>

		<p class="text-xs text-muted-foreground flex items-center gap-1.5">
			<span class="font-semibold text-foreground">💡 Catatan Arsitektur:</span>
			{activeAdapterObj.notes}
		</p>
	</div>
</div>
