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
		DocumentText
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";

	// Simulation states (Steps 1 to 6)
	let isSimulating = $state(false);
	let simulationStep = $state(0); 
	// 0: idle
	// 1: Client Ingress (Chat/Foto)
	// 2: Hook & Vision OCR (Tesseract)
	// 3: Core & DB 1 Staging (PostgreSQL 18 Local)
	// 4: Human-in-the-Loop Sign-off (:3000 Cockpit)
	// 5: Enterprise MCP Connector (DB 2 Mutation)
	// 6: Bi-directional Outbound Loopback Receipt

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

	const platformConfigs: Record<ChatPlatform, PlatformEcosystem> = {
		whatsapp: {
			title: "WhatsApp Hook & Multi-Client Ecosystem",
			description: "Passive DOM observers inside Ferdium, Rambox, and browser userscripts plus headless Baileys WebSocket daemon with Tesseract OCR.",
			hookName: "DOM & Socket Hook",
			hookSub: "MutationObserver & Baileys",
			hookTech: "Passive Webview Inject + OCR",
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
					yPos: 52,
					path: "M 180 52 C 215 52, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
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
					yPos: 116,
					path: "M 180 116 C 210 116, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// Rambox -> WhatsApp -> Settings -> Advanced -> Inject JavaScript code\n(function() {\n  const BACKEND = "http://127.0.0.1:8088/api/inbound-messages";\n  console.log("[NovaPilot] Rambox Hook Active");\n})();`,
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
					yPos: 180,
					path: "M 180 180 C 210 180, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// ==UserScript==\n// @name         NovaPilot WhatsApp Ingestion Hook\n// @match        https://web.whatsapp.com/*\n// @grant        GM_xmlhttpRequest\n// ==/UserScript==\nconst NOVAPILOT_BACKEND = "http://127.0.0.1:8088/api/inbound-messages";`,
					notes: "Passive MutationObserver watching incoming messages on web.whatsapp.com."
				},
				{
					id: "baileys",
					name: "PC WA Daemon",
					subtitle: "Baileys Socket + OCR",
					badge: "MULTI-DEVICE LIVE",
					logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
					color: "text-green-600 dark:text-green-400",
					bgColor: "bg-green-500/10 border-green-500/30",
					dotColor: "#22c55e",
					yPos: 244,
					path: "M 180 244 C 215 244, 215 158, 240 158",
					endpoint: "Headless WebSocket Gateway :3002",
					snippet: `// Headless Baileys Daemon with Tesseract OCR\nbun run src/index.ts --port 3002\n// Auto-downloads attachments & runs OCR vision pipeline`,
					notes: "Direct WebSocket socket to WhatsApp servers with Tesseract OCR physical invoice parser."
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
					yPos: 52,
					path: "M 180 52 C 215 52, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `# Forward chat messages from desktop bot webhook\ncurl -X POST http://127.0.0.1:8088/api/inbound-messages \\\n  -H "Content-Type: application/json" \\\n  -d '{"platform":"telegram", "raw_message": "Revisi INV/2026/001 ke PT Maju"}'`,
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
					yPos: 116,
					path: "M 180 116 C 210 116, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
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
					yPos: 180,
					path: "M 180 180 C 210 180, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `curl -F "url=https://factory.internal:8088/api/inbound-messages" \\\n     "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook"`,
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
					yPos: 244,
					path: "M 180 244 C 215 244, 215 158, 240 158",
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
					badge: "GUILD INGRESS",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-indigo-600 dark:text-indigo-400",
					bgColor: "bg-indigo-500/10 border-indigo-500/30",
					dotColor: "#6366f1",
					yPos: 52,
					path: "M 180 52 C 215 52, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// Discord Webhook Payload\n{\n  "content": "Mohon update nota INV/2026/001 ke PT Mandiri Perkasa"\n}`,
					notes: "Receives events from engineering channels with zero bot server hosting."
				},
				{
					id: "discord_slash",
					name: "Slash Commands",
					subtitle: "Interactive ChatOps (/novapilot)",
					badge: "SLASH BOT",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-violet-600 dark:text-violet-400",
					bgColor: "bg-violet-500/10 border-violet-500/30",
					dotColor: "#8b5cf6",
					yPos: 116,
					path: "M 180 116 C 210 116, 215 158, 240 158",
					endpoint: "POST /api/webhooks/discord/interactions",
					snippet: `/novapilot update doc_no:INV/2026/001 field:customer_name value:"PT Jaya"`,
					notes: "Provides autocomplete and immediate modal confirmations inside Discord."
				},
				{
					id: "discord_bot",
					name: "Gateway Bot",
					subtitle: "Discord Gateway Socket",
					badge: "STANDALONE BOT",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-purple-600 dark:text-purple-400",
					bgColor: "bg-purple-500/10 border-purple-500/30",
					dotColor: "#a855f7",
					yPos: 180,
					path: "M 180 180 C 210 180, 215 158, 240 158",
					endpoint: "Direct WebSocket Gateway",
					snippet: `// Discord Bot Gateway client listener\nclient.on('messageCreate', async (msg) => { ... });`,
					notes: "Real-time message subscription across multiple enterprise discord servers."
				},
				{
					id: "discord_embed",
					name: "Embed Buttons",
					subtitle: "Interactive Approval Cards",
					badge: "INTERACTIVE UI",
					logoUrl: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
					color: "text-sky-600 dark:text-sky-400",
					bgColor: "bg-sky-500/10 border-sky-500/30",
					dotColor: "#0284c7",
					yPos: 244,
					path: "M 180 244 C 215 244, 215 158, 240 158",
					endpoint: "POST /api/webhooks/discord/interactions",
					snippet: `// Interactive Embed with Approve / Reject Buttons`,
					notes: "Renders interactive ticket cards with live action buttons directly inside Discord."
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
					yPos: 52,
					path: "M 180 52 C 215 52, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `# Slack Event Subscription URL:\nhttps://gateway.factory.internal:8088/api/inbound-messages`,
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
					yPos: 116,
					path: "M 180 116 C 210 116, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
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
					yPos: 180,
					path: "M 180 180 C 210 180, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
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
					yPos: 244,
					path: "M 180 244 C 215 244, 215 158, 240 158",
					endpoint: "POST http://127.0.0.1:8088/api/inbound-messages",
					snippet: `// Block Kit Action Payload\n{\n  "type": "block_actions",\n  "actions": [{ "action_id": "approve_mutation", "value": "TK-101" }]\n}`,
					notes: "Enables multi-branch supervisor sign-off directly inside Slack message thread."
				}
			]
		}
	};

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

	// Detailed Technical Explanation for each Phase (1-6)
	const stepNarratives = [
		{
			step: 1,
			title: "1. Client Ingress (Chat & Media Transmission)",
			badge: "MULTI-CLIENT INGRESS",
			color: "text-purple-500",
			bgColor: "bg-purple-500/10 border-purple-500/30",
			description: "Pesan teks atau foto fisik nota dikirimkan dari aplikasi WhatsApp, Ferdium, Rambox, atau Browser. Client tidak pernah memiliki akses jaringan langsung ke database manapun.",
			dataFlow: "Chat Client / Mobile → Ingress Hook (HTTP / Socket)",
			dbStatus: "Zero DB Exposure: Klien berjalan di sandbox terisolasi"
		},
		{
			step: 2,
			title: "2. Ingress Hook & Vision OCR Pipeline (Tesseract)",
			badge: "PARSING & OCR ENGINE",
			color: "text-blue-500",
			bgColor: "bg-blue-500/10 border-blue-500/30",
			description: "Hook mengekstrak body pesan dan mengunduh buffer gambar ke storage. Engine OCR Tesseract.js membaca teks nota fisik (INV/2026/001), sementara NLP regex mencocokkan intent dan target nama baru.",
			dataFlow: "Baileys Socket / DOM → Tesseract OCR Engine → Entity Mapping",
			dbStatus: "Memeriksa memory DB 1 (tabel learned_patterns) untuk mencocokkan gaya chat kasual"
		},
		{
			step: 3,
			title: "3. NovaPilot AI Core Gatekeeper & DB 1 Staging",
			badge: "DB 1: OPERATIONAL SYSTEM STORE",
			color: "text-emerald-500",
			bgColor: "bg-emerald-500/10 border-emerald-500/30",
			description: "Backend Go Core (:8088) mementaskan pesan ke DB 1 (PostgreSQL local :5432). Tiket baru (status PENDING_APPROVAL) dan immutable audit log dibuat secara atomik dengan rollback guard.",
			dataFlow: "Go Core Engine (:8088) → PostgreSQL 18 Local (novapilot_db)",
			dbStatus: "DB 1 AKTIF: Menyimpan tabel inbound_messages, tickets, audit_logs, learned_patterns"
		},
		{
			step: 4,
			title: "4. Human-in-the-Loop On-Call Sign-Off (Web Cockpit)",
			badge: "ZERO-TRUST VERIFICATION",
			color: "text-amber-500",
			bgColor: "bg-amber-500/10 border-amber-500/30",
			description: "Engineer on-call membuka dashboard (/dashboard/queue), memeriksa bukti foto nota asli, memvalidasi perbandingan nilai lama vs baru, lalu menekan tombol '1-Click Approve'.",
			dataFlow: "Web Dashboard (:3000) → POST /api/tickets/:id/approve",
			dbStatus: "DB 1 DIPERBARUI: Status tiket diubah menjadi APPROVED; log pengesahan dicatat"
		},
		{
			step: 5,
			title: "5. Enterprise MCP Data Connector (DB 2 Mutation)",
			badge: "DB 2: TARGET BUSINESS DATA SOURCE",
			color: "text-cyan-500",
			bgColor: "bg-cyan-500/10 border-cyan-500/30",
			description: "Core memanggil Model Context Protocol (MCP) Tool Server untuk memutasi data bisnis pada DB 2 (Oracle 19c Enterprise / ERP / SAP). Hanya parameterized prepared statement yang dieksekusi (Zero Raw SQL).",
			dataFlow: "Core Engine → MCP Tool Server → DB 2 Enterprise Data Source (Oracle/ERP)",
			dbStatus: "DB 2 DIMUTASI: Tabel faktur bisnis resmi (invoices) diperbarui secara transaksional"
		},
		{
			step: 6,
			title: "6. Bi-directional Outbound Receipt Loopback",
			badge: "REAL-TIME CONFIRMATION",
			color: "text-rose-500",
			bgColor: "bg-rose-500/10 border-rose-500/30",
			description: "Event SSE ticket_updated disiarkan secara real-time ke WhatsApp Gateway. Bot otomatis mengirimkan bukti tanda terima resmi beserta nomor tiket kembali ke grup/chat pengirim asli.",
			dataFlow: "SSE Stream (:8088/api/events) → WhatsApp Socket → Chat Group",
			dbStatus: "DB 1 LENGKAP: Waktu eksekusi, ID petugas, dan status akhir tersimpan permanen"
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
					extracted_target: `PT Test ${cockpit.chatPlatform.toUpperCase()} Ingress`
				})
			});
			if (res.ok) {
				cockpit.recordPlatformEvent(cockpit.chatPlatform);
				testPingSuccess = true;
				await cockpit.fetchInboundMessages();
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
			simulationStep = 2; // Ingestion & Vision OCR
			setTimeout(() => {
				simulationStep = 3; // Core & DB 1 Staging (Postgres)
				setTimeout(() => {
					simulationStep = 4; // Human Sign-off (Web Cockpit)
					setTimeout(() => {
						simulationStep = 5; // Enterprise MCP Connector (DB 2)
						setTimeout(() => {
							simulationStep = 6; // Outbound Receipt Loopback
							setTimeout(() => {
								isSimulating = false;
							}, 2800);
						}, 1400);
					}, 1400);
				}, 1300);
			}, 1300);
		}, 1000);
	}
</script>

<div class="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xl space-y-6 relative overflow-hidden font-sans">
	
	<!-- ========================================================================= -->
	<!-- 1. HEADER & PLATFORM SWITCHER                                             -->
	<!-- ========================================================================= -->
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border/60">
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
				Arsitektur isolasi 2 database: <strong>DB 1 (PostgreSQL)</strong> sebagai penampung operasional (tiket, log, dan memory AI), dan <strong>DB 2 (Oracle/ERP via MCP)</strong> sebagai sumber data bisnis eksternal yang dimutasi secara aman tanpa ekspos SQL mentah.
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
			<button
				type="button"
				onclick={() => activeClient = client.id}
				class="p-3 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 cursor-pointer {activeClient === client.id ? `${client.bgColor} ring-2 ring-primary/40 shadow-xs` : 'bg-secondary/30 border-border/60 hover:bg-secondary/60'}"
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
	<!-- 3. ANIMATED SVG PROCESS PIPELINE (DUAL DB + MCP ARCHITECTURE)              -->
	<!-- ========================================================================= -->
	<div class="relative w-full rounded-2xl bg-secondary/20 dark:bg-black/50 border border-border/70 p-3 sm:p-5 overflow-x-auto">
		<!-- SVG Canvas -->
		<svg
			viewBox="0 0 1180 480"
			class="w-full min-w-[900px] h-auto select-none overflow-visible"
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
					@keyframes activeGlowPulse {
						0% { stroke: #10b981; filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.7)); }
						50% { stroke: #3b82f6; filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.8)); }
						100% { stroke: #10b981; filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.7)); }
					}
					.flowing-path {
						stroke-dasharray: 8 5;
						animation: flowWire 1.1s linear infinite;
					}
					.flowing-path-fast {
						stroke-dasharray: 8 5;
						animation: flowWire 0.65s linear infinite;
					}
					.flowing-path-return {
						stroke-dasharray: 6 4;
						animation: flowWireReturn 0.9s linear infinite;
					}
					.active-box-glow {
						animation: activeGlowPulse 1.4s ease-in-out infinite;
						stroke-width: 2.5px !important;
					}
				</style>

				<!-- Gradients -->
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

			<!-- ============================================================= -->
			<!-- LAYER 1: CLIENT ADAPTERS (x=20 to 180)                        -->
			<!-- ============================================================= -->
			{#each currentConfig.adapters as client, idx}
				<g
					role="button"
					tabindex="0"
					class="cursor-pointer transition-opacity {activeClient === client.id ? 'opacity-100' : 'opacity-40'}"
					onclick={() => activeClient = client.id}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeClient = client.id; } }}
				>
					<rect
						x="20" y={25 + (idx * 64)} width="160" height="54" rx="12"
						fill="currentColor"
						class="text-card stroke-border/70 {simulationStep === 1 && activeClient === client.id ? 'active-box-glow' : 'stroke-[1.5px]'}"
					/>
					<image href={client.logoUrl} x="30" y={35 + (idx * 64)} width="32" height="32" preserveAspectRatio="xMidYMid slice" />
					<text x="72" y={47 + (idx * 64)} font-family="system-ui" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">{client.name}</text>
					<text x="72" y={64 + (idx * 64)} font-family="monospace" font-size="8.5" fill="currentColor" class="text-muted-foreground">{client.badge}</text>
				</g>
			{/each}

			<!-- CONNECTING BEZIER CURVES: From 4 Clients to Ingress Hook Node -->
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

			<!-- Simulation Packet: Step 1 (Client -> Ingress Hook) -->
			{#if isSimulating && simulationStep === 1}
				<circle r="6" fill="#a855f7" filter="url(#particleGlow)">
					<animateMotion dur="0.9s" repeatCount="1" path={activeAdapterObj.path} />
				</circle>
			{/if}

			<!-- ============================================================= -->
			<!-- LAYER 2: INGRESS HOOK & VISION OCR PIPELINE (x=240 to 415)    -->
			<!-- ============================================================= -->
			<g transform="translate(240, 50)">
				<rect
					x="0" y="0" width="175" height="230" rx="14"
					fill="currentColor"
					class="text-card stroke-blue-500/70 {simulationStep === 2 ? 'active-box-glow' : 'stroke-[1.5px]'}"
				/>
				<!-- Title Banner -->
				<rect x="0" y="0" width="175" height="34" rx="14" fill="#3b82f6" fill-opacity="0.12" />
				<text x="14" y="22" font-family="system-ui" font-size="11" font-weight="bold" fill="#3b82f6">📥 Ingress Hook &amp; OCR</text>

				<!-- Hook Sub-Engine Modules -->
				<g transform="translate(10, 42)">
					<!-- Module A: Text & Socket Extractor -->
					<rect x="0" y="0" width="155" height="48" rx="8" fill="currentColor" class="text-secondary/60 border" />
					<text x="10" y="16" font-family="monospace" font-size="8.5" font-weight="bold" fill="currentColor" class="text-foreground">⚡ Socket / DOM Parser</text>
					<text x="10" y="30" font-family="monospace" font-size="8" fill="currentColor" class="text-muted-foreground">Unwrap Ephemeral/ViewOnce</text>
					<text x="10" y="42" font-family="monospace" font-size="8" fill="#10b981">✓ Status: Realtime Hook</text>
				</g>

				<g transform="translate(10, 96)">
					<!-- Module B: Tesseract OCR Engine -->
					<rect x="0" y="0" width="155" height="64" rx="8" fill="#3b82f6" fill-opacity="0.08" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="1" />
					<text x="10" y="16" font-family="system-ui" font-size="9" font-weight="bold" fill="#3b82f6">📷 Tesseract OCR Engine</text>
					<text x="10" y="30" font-family="monospace" font-size="8" fill="currentColor" class="text-foreground">Doc: INV/2026/001</text>
					<text x="10" y="44" font-family="monospace" font-size="8" fill="currentColor" class="text-foreground">Bilingual: ind + eng</text>
					<text x="10" y="56" font-family="monospace" font-size="7.5" fill="#3b82f6" font-weight="bold">Extract physical nota/faktur</text>
				</g>

				<g transform="translate(10, 166)">
					<!-- Module C: Self-Learning Pattern Engine -->
					<rect x="0" y="0" width="155" height="52" rx="8" fill="#a855f7" fill-opacity="0.08" stroke="#a855f7" stroke-opacity="0.3" stroke-width="1" />
					<text x="10" y="16" font-family="system-ui" font-size="9" font-weight="bold" fill="#a855f7">🧠 Pattern Learning Matcher</text>
					<text x="10" y="30" font-family="monospace" font-size="8" fill="currentColor" class="text-foreground">Target: UPDATE_NAME</text>
					<text x="10" y="44" font-family="monospace" font-size="7.5" fill="#a855f7">Learned Regex from Postgres</text>
				</g>
			</g>

			<!-- Connecting Wire: Ingress Hook -> NovaPilot Core -->
			<path
				d="M 415 158 C 435 158, 435 110, 460 110"
				fill="none"
				stroke="#3b82f6"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			<!-- Simulation Packet: Step 2 (Hook -> Core) -->
			{#if isSimulating && simulationStep === 2}
				<circle r="6" fill="#3b82f6" filter="url(#particleGlow)">
					<animateMotion dur="0.6s" repeatCount="1" path="M 415 158 C 435 158, 435 110, 460 110" />
				</circle>
			{/if}

			<!-- ============================================================= -->
			<!-- LAYER 3: NOVAPILOT AI CORE + DB 1 OPERATIONAL STORE           -->
			<!-- ============================================================= -->
			<!-- Top Box: NovaPilot AI Core (:8088 Go) -->
			<g transform="translate(460, 30)">
				<rect
					x="0" y="0" width="230" height="155" rx="16"
					fill="currentColor"
					class="text-card stroke-emerald-500/80 {simulationStep === 3 ? 'active-box-glow' : 'stroke-[2px]'}"
				/>
				<rect x="0" y="0" width="230" height="34" rx="16" fill="#10b981" fill-opacity="0.14" />
				<text x="16" y="22" font-family="system-ui" font-size="11.5" font-weight="bold" fill="currentColor" class="text-primary">🛡️ NovaPilot AI Core</text>
				<text x="165" y="22" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">:8088 / Go</text>

				<!-- Core Capabilities -->
				<g transform="translate(12, 42)">
					<rect x="0" y="0" width="206" height="50" rx="8" fill="currentColor" class="text-secondary/60" />
					<text x="10" y="16" font-family="monospace" font-size="8" fill="currentColor" class="text-foreground">1. Heuristic Validator &amp; Tokenizer</text>
					<text x="10" y="30" font-family="monospace" font-size="8" fill="currentColor" class="text-foreground">2. Prepared SQL + Rollback Guard</text>
					<text x="10" y="42" font-family="monospace" font-size="8" fill="#10b981" font-weight="bold">3. SSE Event Bus (/api/events)</text>
				</g>

				<!-- Intake Staging Status -->
				<g transform="translate(12, 98)">
					<rect x="0" y="0" width="206" height="46" rx="8" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.25" stroke-width="1" />
					<text x="10" y="16" font-family="monospace" font-size="8.5" font-weight="bold" fill="#10b981">✓ Intake Packet Verified</text>
					<text x="10" y="30" font-family="monospace" font-size="8" fill="currentColor" class="text-muted-foreground">Confidence: 96% • Zero SQL Injection</text>
				</g>
			</g>

			<!-- Downward Wire: Core -> DB 1 System Store -->
			<path
				d="M 575 185 L 575 220"
				fill="none"
				stroke="url(#gradCoreToDB1)"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			<!-- Bottom Box: DB 1 (PostgreSQL 18 System Store Local) -->
			<g transform="translate(460, 220)">
				<rect
					x="0" y="0" width="230" height="110" rx="14"
					fill="currentColor"
					class="text-card stroke-emerald-600/90 {simulationStep === 3 ? 'active-box-glow' : 'stroke-[2px]'}"
				/>
				<!-- Title Banner -->
				<rect x="0" y="0" width="230" height="30" rx="14" fill="#10b981" fill-opacity="0.16" />
				<text x="14" y="20" font-family="system-ui" font-size="10.5" font-weight="bold" fill="#059669">🗄️ DB 1: System Store (PostgreSQL 18)</text>

				<!-- Tables List -->
				<g transform="translate(12, 38)">
					<text x="6" y="14" font-family="monospace" font-size="8" font-weight="bold" fill="currentColor" class="text-foreground">Tabel Operasional Internal (:5432):</text>
					<text x="6" y="28" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">• inbound_messages (Staging Feed)</text>
					<text x="6" y="41" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">• tickets (Pending Approval Queue)</text>
					<text x="6" y="54" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">• audit_logs (Immutable Historical Trail)</text>
					<text x="6" y="66" font-family="monospace" font-size="7.5" fill="#10b981" font-weight="bold">• learned_patterns (AI Memory Loop)</text>
				</g>
			</g>

			<!-- Connecting Wire: NovaPilot Core -> Human On-Call Cockpit -->
			<path
				d="M 690 110 L 735 110"
				fill="none"
				stroke="url(#gradCoreToCockpit)"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			<!-- Simulation Packet: Step 3 -> 4 (Core -> Human Cockpit) -->
			{#if isSimulating && simulationStep === 3}
				<circle r="6" fill="#10b981" filter="url(#particleGlow)">
					<animateMotion dur="0.5s" repeatCount="1" path="M 690 110 L 735 110" />
				</circle>
			{/if}

			<!-- ============================================================= -->
			<!-- LAYER 4: HUMAN-IN-THE-LOOP ON-CALL COCKPIT (x=735 to 900)     -->
			<!-- ============================================================= -->
			<g transform="translate(735, 50)">
				<rect
					x="0" y="0" width="165" height="230" rx="14"
					fill="currentColor"
					class="text-card stroke-amber-500/70 {simulationStep === 4 ? 'active-box-glow' : 'stroke-[1.5px]'}"
				/>
				<!-- Title Banner -->
				<rect x="0" y="0" width="165" height="34" rx="14" fill="#f59e0b" fill-opacity="0.12" />
				<text x="12" y="22" font-family="system-ui" font-size="11" font-weight="bold" fill="#f59e0b">👤 On-Call Cockpit</text>
				<text x="122" y="22" font-family="monospace" font-size="8.5" fill="#f59e0b">:3000</text>

				<!-- Sign-off Features -->
				<g transform="translate(10, 44)">
					<rect x="0" y="0" width="145" height="42" rx="8" fill="currentColor" class="text-secondary/60" />
					<text x="8" y="16" font-family="monospace" font-size="8" fill="currentColor" class="text-foreground">Engineer: John Doe</text>
					<text x="8" y="28" font-family="monospace" font-size="8" fill="currentColor" class="text-foreground">Session: Verified Admin</text>
					<text x="8" y="38" font-family="monospace" font-size="7.5" fill="#f59e0b">Queue: /dashboard/queue</text>
				</g>

				<g transform="translate(10, 94)">
					<rect x="0" y="0" width="145" height="72" rx="8" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.25" stroke-width="1" />
					<text x="8" y="16" font-family="monospace" font-size="8" font-weight="bold" fill="currentColor" class="text-foreground">Diff Inspector:</text>
					<text x="8" y="28" font-family="monospace" font-size="7.5" fill="#ef4444">- PT WOKWPWKW</text>
					<text x="8" y="40" font-family="monospace" font-size="7.5" fill="#10b981">+ PT HAHAHAHA</text>
					<text x="8" y="54" font-family="monospace" font-size="8" font-weight="bold" fill="#f59e0b">✓ 1-Click Approve</text>
					<text x="8" y="66" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">Audit Log Signed</text>
				</g>

				<g transform="translate(10, 174)">
					<rect x="0" y="0" width="145" height="44" rx="8" fill="currentColor" class="text-secondary/80" />
					<text x="8" y="16" font-family="monospace" font-size="8" font-weight="bold" fill="currentColor" class="text-foreground">Zero Direct Access</text>
					<text x="8" y="28" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">Petugas tidak pernah</text>
					<text x="8" y="38" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">mengetik query manual!</text>
				</g>
			</g>

			<!-- Connecting Wire: Cockpit -> Enterprise MCP Connector -->
			<path
				d="M 900 110 L 945 110"
				fill="none"
				stroke="url(#gradCockpitToMCP)"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			<!-- Simulation Packet: Step 4 -> 5 (Cockpit -> MCP) -->
			{#if isSimulating && simulationStep === 4}
				<circle r="6" fill="#f59e0b" filter="url(#particleGlow)">
					<animateMotion dur="0.5s" repeatCount="1" path="M 900 110 L 945 110" />
				</circle>
			{/if}

			<!-- ============================================================= -->
			<!-- LAYER 5: ENTERPRISE MCP DATA CONNECTOR + DB 2 BUSINESS STORE  -->
			<!-- ============================================================= -->
			<!-- Top Box: Enterprise MCP Multiplatform Data Connector -->
			<g transform="translate(945, 30)">
				<rect
					x="0" y="0" width="215" height="155" rx="16"
					fill="currentColor"
					class="text-card stroke-cyan-500/80 {simulationStep === 5 ? 'active-box-glow' : 'stroke-[2px]'}"
				/>
				<rect x="0" y="0" width="215" height="34" rx="16" fill="#06b6d4" fill-opacity="0.14" />
				<text x="14" y="22" font-family="system-ui" font-size="11.5" font-weight="bold" fill="#06b6d4">🔌 Enterprise MCP Connector</text>

				<!-- MCP Features -->
				<g transform="translate(10, 42)">
					<rect x="0" y="0" width="195" height="52" rx="8" fill="currentColor" class="text-secondary/60" />
					<text x="8" y="16" font-family="monospace" font-size="8" font-weight="bold" fill="currentColor" class="text-foreground">Model Context Protocol</text>
					<text x="8" y="28" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">Tool: mutate_invoice_record()</text>
					<text x="8" y="40" font-family="monospace" font-size="7.5" fill="#06b6d4">Standard Multiplatform Schema</text>
				</g>

				<g transform="translate(10, 100)">
					<rect x="0" y="0" width="195" height="44" rx="8" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.25" stroke-width="1" />
					<text x="8" y="16" font-family="monospace" font-size="8" font-weight="bold" fill="#06b6d4">✓ Zero Raw SQL Execution</text>
					<text x="8" y="28" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">Only parameterized mutations</text>
					<text x="8" y="38" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">forwarded to enterprise DB</text>
				</g>
			</g>

			<!-- Downward Wire: MCP -> DB 2 Business Store -->
			<path
				d="M 1052 185 L 1052 220"
				fill="none"
				stroke="url(#gradMCPToDB2)"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			<!-- Simulation Packet: Step 5 (MCP -> DB 2) -->
			{#if isSimulating && simulationStep === 5}
				<circle r="6" fill="#06b6d4" filter="url(#particleGlow)">
					<animateMotion dur="0.5s" repeatCount="1" path="M 1052 185 L 1052 220" />
				</circle>
			{/if}

			<!-- Bottom Box: DB 2 (Target Enterprise Business Store via MCP) -->
			<g transform="translate(945, 220)">
				<rect
					x="0" y="0" width="215" height="110" rx="14"
					fill="currentColor"
					class="text-card stroke-blue-600/90 {simulationStep === 5 ? 'active-box-glow' : 'stroke-[2px]'}"
				/>
				<!-- Title Banner -->
				<rect x="0" y="0" width="215" height="30" rx="14" fill="#2563eb" fill-opacity="0.16" />
				<text x="14" y="20" font-family="system-ui" font-size="10.5" font-weight="bold" fill="#2563eb">🏢 DB 2: Target Business DB</text>

				<!-- Tables List -->
				<g transform="translate(10, 38)">
					<text x="6" y="14" font-family="monospace" font-size="8" font-weight="bold" fill="currentColor" class="text-foreground">Sistem Enterprise Eksternal:</text>
					<text x="6" y="28" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">• Oracle 19c Enterprise Database</text>
					<text x="6" y="41" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">• PostgreSQL Enterprise ERP / Billing</text>
					<text x="6" y="54" font-family="monospace" font-size="7.5" fill="currentColor" class="text-muted-foreground">• SAP / Multiplatform CRM Master</text>
					<text x="6" y="66" font-family="monospace" font-size="7.5" fill="#2563eb" font-weight="bold">• Tabel Bisnis: invoices, customers</text>
				</g>
			</g>

			<!-- ============================================================= -->
			<!-- LAYER 6: BI-DIRECTIONAL OUTBOUND LOOPBACK CONFIRMATION WIRE   -->
			<!-- ============================================================= -->
			<path
				d="M 1052 330 C 1052 445, 550 445, 100 300"
				fill="none"
				stroke="url(#gradLoopbackFull)"
				stroke-width={simulationStep === 6 ? "3.5" : "1.8"}
				stroke-opacity={simulationStep === 6 ? "1" : "0.35"}
				class="flowing-path-return"
			/>

			<!-- Loopback Annotation Label -->
			<g transform="translate(580, 440)">
				<rect x="-240" y="-14" width="480" height="26" rx="6" fill="currentColor" class="text-card stroke-border/70" stroke-width="1" />
				<text x="0" y="3" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold" text-anchor="middle">
					↺ Bukti Tanda Terima Eksekusi Resmi Disiarkan Kembali ke WhatsApp / Chat Client
				</text>
			</g>

			<!-- Simulation Packet: Step 6 (Loopback to Client) -->
			{#if isSimulating && simulationStep === 6}
				<circle r="7" fill="#10b981" filter="url(#particleGlow)">
					<animateMotion dur="1.4s" repeatCount="1" path="M 1052 330 C 1052 445, 550 445, 100 300" />
				</circle>
			{/if}
		</svg>
	</div>

	<!-- ========================================================================= -->
	<!-- 4. INTERACTIVE STEP-BY-STEP SIMULATION TIMELINE & EXPLANATION CARD       -->
	<!-- ========================================================================= -->
	<div class="space-y-3">
		<!-- Step Selector Pills -->
		<div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
			{#each stepNarratives as sn}
				<button
					type="button"
					onclick={() => simulationStep = sn.step}
					class="px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 {simulationStep === sn.step ? `${sn.bgColor} ${sn.color} font-bold ring-1 ring-current` : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}"
				>
					<span class="h-1.5 w-1.5 rounded-full {simulationStep === sn.step ? 'bg-current animate-pulse' : 'bg-muted-foreground'}"></span>
					<span>Tahap {sn.step}: {sn.badge}</span>
				</button>
			{/each}
		</div>

		<!-- Active Step Technical Details Card -->
		{#if simulationStep > 0 && simulationStep <= 6}
			{@const activeSn = stepNarratives[simulationStep - 1]}
			<div class="p-4 rounded-2xl border transition-all {activeSn.bgColor} space-y-2.5 animate-in fade-in-50">
				<div class="flex items-center justify-between flex-wrap gap-2">
					<div class="flex items-center gap-2">
						<span class="text-xs font-bold font-mono uppercase {activeSn.color} bg-background/80 px-2.5 py-0.5 rounded-lg border border-current/30">
							{activeSn.badge}
						</span>
						<h4 class="text-sm font-bold text-foreground">{activeSn.title}</h4>
					</div>
					<span class="text-[11px] font-mono font-medium text-muted-foreground">
						Alur Data: <span class="font-bold text-foreground">{activeSn.dataFlow}</span>
					</span>
				</div>

				<p class="text-xs text-foreground/90 leading-relaxed font-sans">
					{activeSn.description}
				</p>

				<div class="p-2.5 rounded-xl bg-background/60 border border-border/50 text-[11px] font-mono flex items-center justify-between flex-wrap gap-2">
					<span class="text-muted-foreground">Peran Database:</span>
					<span class="font-bold {activeSn.color}">{activeSn.dbStatus}</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- ========================================================================= -->
	<!-- 5. DUAL DATABASE ARCHITECTURE BREAKDOWN (DB 1 vs DB 2)                   -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
		<!-- DB 1 Card -->
		<div class="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
			<div class="flex items-center gap-2">
				<div class="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
					<CircleStack class="h-4 w-4" />
				</div>
				<div>
					<h4 class="text-xs font-bold text-foreground">DB 1: Operational System Store</h4>
					<p class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">PostgreSQL 18 Local (:5432)</p>
				</div>
			</div>
			<p class="text-xs text-muted-foreground leading-relaxed">
				Menyimpan seluruh state operasional NovaPilot: staging chat omnichannel (<code class="text-emerald-600 font-mono">inbound_messages</code>), antrean tiket pending (<code class="text-emerald-600 font-mono">tickets</code>), immutable audit trail (<code class="text-emerald-600 font-mono">audit_logs</code>), dan memory AI (<code class="text-emerald-600 font-mono">learned_patterns</code>).
			</p>
			<div class="text-[10px] font-mono text-muted-foreground bg-background/50 p-2 rounded-lg border border-emerald-500/10">
				Hak Akses: Read/Write Eksklusif Core Backend Go (:8088).
			</div>
		</div>

		<!-- DB 2 Card -->
		<div class="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
			<div class="flex items-center gap-2">
				<div class="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
					<ServerStack class="h-4 w-4" />
				</div>
				<div>
					<h4 class="text-xs font-bold text-foreground">DB 2: Target Business Data Sources</h4>
					<p class="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">Oracle 19c / ERP / Multiplatform via MCP</p>
				</div>
			</div>
			<p class="text-xs text-muted-foreground leading-relaxed">
				Sumber data bisnis korporat yang sebenarnya (tabel <code class="text-cyan-600 font-mono">invoices</code>, billing master, dsb). Hanya dimutasi setelah human verification sign-off melalui Model Context Protocol (MCP) tool server dengan parameterized prepared statement.
			</p>
			<div class="text-[10px] font-mono text-muted-foreground bg-background/50 p-2 rounded-lg border border-cyan-500/10">
				Hak Akses: Terisolasi via MCP Server (Zero Raw SQL Injection).
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 6. SETUP GUIDE & CODE SNIPPET                                             -->
	<!-- ========================================================================= -->
	<div class="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border/70 space-y-3">
		<div class="flex items-center justify-between flex-wrap gap-2">
			<div class="flex items-center gap-2">
				<CodeBracket class="w-4 h-4 text-primary" />
				<h4 class="text-xs font-bold text-foreground">
					Konfigurasi Ingress Hook: <span class="text-primary">{activeAdapterObj.name}</span>
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
				<a href="/flow" class="text-primary hover:underline font-medium text-xs">Lihat Diagram Full-Screen &rarr;</a>
			</div>
		</div>
	</div>
</div>
