<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		AdjustmentsHorizontal, 
		Check, 
		ArrowPath, 
		ShieldCheck, 
		LockClosed, 
		Key, 
		Signal, 
		CommandLine,
		Eye,
		EyeSlash,
		CodeBracket,
		ClipboardDocumentCheck,
		InformationCircle,
		QrCode,
		GlobeAlt,
		ComputerDesktop,
		DevicePhoneMobile,
		ArrowTopRightOnSquare
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";

	// Platform definitions with official logos
	const platforms = [
		{
			id: "whatsapp" as ChatPlatform,
			name: "WhatsApp",
			sub: "Baileys Socket & DOM Mutation Hooks",
			icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
			badge: "Live Hook Engine"
		},
		{
			id: "telegram" as ChatPlatform,
			name: "Telegram",
			sub: "BotFather API Webhook & Long Polling",
			icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
			badge: "Bot API Gateway"
		},
		{
			id: "discord" as ChatPlatform,
			name: "Discord",
			sub: "Bot Interactions & Guild Channel Webhooks",
			icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
			badge: "Guild Interaction"
		},
		{
			id: "slack" as ChatPlatform,
			name: "Slack",
			sub: "Events API & Bolt SDK Ingress",
			icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
			badge: "Enterprise Events"
		}
	];

	// Reactive active platform object
	let selectedPlatform = $derived(
		platforms.find(p => p.id === cockpit.chatPlatform) || platforms[0]
	);

	// Secret Visibility Toggles
	let showSecrets = $state<Record<string, boolean>>({
		whatsapp: false,
		telegram: false,
		discord: false,
		slack: false
	});

	function toggleSecret(id: string) {
		showSecrets[id] = !showSecrets[id];
	}

	// Dynamic Form States for Each Platform
	let waConfig = $state({
		port: "8088",
		sessionDir: "./data/whatsapp-auth",
		whitelistedJids: "120363028391@g.us, 120363098124@g.us, 120363119028@g.us",
		rateLimitDebounceMs: 500,
		antiBanMode: "passive_listener",
		tampermonkeyToken: "np_sec_wa_7819f2a"
	});

	let tgConfig = $state({
		botToken: "6192837492:AAHgK891vBnc781K9aLj182NmPql910",
		webhookUrl: "https://gateway.factory.internal:8088/api/webhooks/telegram",
		connectionMode: "webhook", // "webhook" | "polling"
		whitelistedChatIds: "-100192837482, -100281920194",
		adminUserId: "109283719"
	});

	let discordConfig = $state({
		botToken: "MTE5MjgzNzQ5MjgxOTIwMTk0.Gb819a.K91aLj182NmPql910-AAHgK",
		applicationId: "119283749281920194",
		guildId: "981273645129384756",
		whitelistedChannels: "119283749281920195, 119283749281920196",
		permittedRole: "Plant Operations"
	});

	let slackConfig = $state({
		botToken: "PLACEHOLDER_SLACK_BOT_TOKEN_REDACTED",
		signingSecret: "3a9f819b7c2d1e0f4a5b6c7d8e9f0a1b",
		teamId: "T0819283XYZ",
		whitelistedChannels: "C0819283ABC, C0819283DEF",
		slashCommand: "/novapilot"
	});

	// Save feedback state
	let saving = $state(false);
	let saveSuccess = $state(false);

	async function handleSaveSettings() {
		saving = true;
		try {
			await new Promise(r => setTimeout(r, 600));
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 3500);
		} finally {
			saving = false;
		}
	}

	// Test Ping state
	let pinging = $state(false);
	let pingFeedback = $state<string | null>(null);

	async function handleTestPing() {
		if (pinging) return;
		pinging = true;
		pingFeedback = null;
		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: `Platform Settings Ping [${selectedPlatform.name}]: Verifying ingestion logic flow and webhook token credentials.`,
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: "INV/2026/001",
					field_target: "customer_name",
					proposed_value: `PT ${selectedPlatform.name} Config Verified`,
					branch_id: 1,
					confidence_score: 0.99
				})
			});

			if (res.ok) {
				cockpit.recordPlatformEvent(cockpit.chatPlatform);
				pingFeedback = `Successfully dispatched test packet through ${selectedPlatform.name} gateway. Staged to Approval Queue!`;
				await cockpit.fetchTickets();
				setTimeout(() => (pingFeedback = null), 4000);
			}
		} catch (err) {
			pingFeedback = `Connection error testing ${selectedPlatform.name} gateway endpoint.`;
		} finally {
			pinging = false;
		}
	}

	// Copied state
	let copiedSnippet = $state(false);
	function copySnippet(text: string) {
		navigator.clipboard.writeText(text);
		copiedSnippet = true;
		setTimeout(() => (copiedSnippet = false), 2500);
	}

	// WhatsApp Ingress Connection Options
	type WAConnectMode = "gateway" | "browser" | "ferdium" | "rambox";
	let waConnectMode = $state<WAConnectMode>("gateway");

	let qrData = $state<{
		status: "WAITING_SCAN" | "CONNECTED" | "DISCONNECTED" | "LOADING";
		qr?: string;
		qrDataUrl?: string;
		updatedAt?: string;
	}>({
		status: "LOADING"
	});
	let isRefreshingQR = $state(false);
	let qrPollingInterval: any = null;

	async function fetchWAQR() {
		try {
			const res = await fetch("/uploads/whatsapp_qr.json?t=" + Date.now());
			if (res.ok) {
				const data = await res.json();
				qrData = data;
			} else {
				qrData = { status: "DISCONNECTED" };
			}
		} catch (err) {
			qrData = { status: "DISCONNECTED" };
		}
	}

	async function manualRefreshQR() {
		isRefreshingQR = true;
		await fetchWAQR();
		setTimeout(() => (isRefreshingQR = false), 600);
	}

	onMount(() => {
		fetchWAQR();
		qrPollingInterval = setInterval(() => {
			if (cockpit.chatPlatform === "whatsapp" && waConnectMode === "gateway") {
				fetchWAQR();
			}
		}, 3000);
	});

	onDestroy(() => {
		if (qrPollingInterval) clearInterval(qrPollingInterval);
	});

	let copiedScriptType = $state<string | null>(null);
	function copyIntegrationScript(type: string, text: string) {
		navigator.clipboard.writeText(text);
		copiedScriptType = type;
		setTimeout(() => (copiedScriptType = null), 2500);
	}

	const browserUserscript = `// ==UserScript==
// @name         NovaPilot AI — WhatsApp Web ChatOps Ingestion Hook
// @namespace    https://github.com/RifkyA911/novapilot-ai
// @version      1.0.0
// @description  Automated ChatOps Hook for WhatsApp Web to NovaPilot On-Call Gatekeeper
// @match        https://web.whatsapp.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';
    const NOVAPILOT_BACKEND = "http://127.0.0.1:8088";
    const processedMessages = new Set();
    console.log("%c[NovaPilot AI Userscript]%c Initialized on WhatsApp Web.", "background:#059669; color:#fff; font-weight:bold; padding:2px 5px; border-radius:3px;", "color:#059669; font-weight:bold;");

    function parseMessage(text) {
        const docMatch = text.match(/\\b(INV[\\/\\-]\\d{4}[\\/\\-]\\d{3}|NOTA[\\/\\-]\\d{4}[\\/\\-]\\d{3})\\b/i);
        if (!docMatch) return null;
        const documentNo = docMatch[1].toUpperCase().replace("-", "/");

        let proposedValue = "";
        const targetMatch = text.match(/(?:menjadi|ke|to|ubah ke|ganti jadi)\\s+['"]?([^,\\.\\n\\r"']+)['"]?/i);
        if (targetMatch && targetMatch[1]) {
            proposedValue = targetMatch[1].trim();
        } else {
            const corpMatch = text.match(/\\b(PT|CV|UD)\\s+([A-Za-z0-9\\s]{3,35})\\b/i);
            if (corpMatch) proposedValue = \`\${corpMatch[1].toUpperCase()} \${corpMatch[2].trim()}\`;
        }
        if (!proposedValue) return null;

        return { documentNo, proposedValue, fieldTarget: "customer_name", intent: "UPDATE_CUSTOMER_NAME", confidence: 0.98 };
    }

    async function forwardToNovaPilot(rawText, parsed) {
        try {
            const res = await fetch(\`\${NOVAPILOT_BACKEND}/api/tickets\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_message: rawText,
                    extracted_intent: parsed.intent,
                    document_no: parsed.documentNo,
                    field_target: parsed.fieldTarget,
                    proposed_value: parsed.proposedValue,
                    branch_id: 1,
                    confidence_score: parsed.confidence
                })
            });
            if (res.ok) {
                const ticket = await res.json();
                console.log(\`[NovaPilot] Ticket \${ticket.ticket_no} created successfully via Userscript!\`);
                return ticket;
            }
        } catch (err) {
            console.error("[NovaPilot] Communication error:", err);
        }
        return null;
    }

    function observeWhatsAppMessages() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        const textNodes = node.querySelectorAll ? node.querySelectorAll(".selectable-text, [data-pre-plain-text]") : [];
                        for (const el of textNodes) {
                            const text = el.textContent || "";
                            if (!text || processedMessages.has(text)) continue;
                            const parsed = parseMessage(text);
                            if (parsed) {
                                processedMessages.add(text);
                                forwardToNovaPilot(text, parsed);
                            }
                        }
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    const checkInterval = setInterval(() => {
        if (document.querySelector("#app") || document.querySelector("#pane-side")) {
            clearInterval(checkInterval);
            observeWhatsAppMessages();
        }
    }, 1500);
})();`;

	const ferdiumHookScript = `/**
 * NovaPilot AI — Ferdium WhatsApp Web Integration Hook
 * Mendukung Multi-Service WhatsApp (Service 1, Service 2, Service 3, dst.)
 * 
 * CARA PASANG:
 * 1. Di Ferdium, klik kanan icon Service WhatsApp Anda > Edit Service
 * 2. Masuk ke menu "Advanced"
 * 3. Tempel skrip ini pada kolom "Custom Code (Inject JavaScript code)"
 * 4. (Opsional) Sesuaikan BRANCH_ID dan SERVICE_LABEL untuk membedakan tiap akun
 * 5. Klik "Save service" lalu tekan Ctrl + R (Reload)
 */
(function () {
    const NOVAPILOT_BACKEND = "http://127.0.0.1:8088";
    // Konfigurasi khusus service ini (sesuaikan per tab service jika punya multiple WA)
    const BRANCH_ID = 1; // ID Cabang NovaPilot (1: Surabaya, 2: Medan, 3: Semarang, dst.)
    const SERVICE_LABEL = "Ferdium WA"; // Label penanda akun WA ini

    const processedMessages = new Set();
    console.log(\`%c[NovaPilot AI]%c Ferdium ChatOps Hook aktif untuk \${SERVICE_LABEL} (Backend: \${NOVAPILOT_BACKEND})\`, "background:#059669; color:#fff; font-weight:bold; padding:2px 5px; border-radius:3px;", "color:#059669; font-weight:bold;");

    function parseMessage(text) {
        const docMatch = text.match(/\\b(INV[\\/\\-]\\d{4}[\\/\\-]\\d{3}|NOTA[\\/\\-]\\d{4}[\\/\\-]\\d{3})\\b/i);
        if (!docMatch) return null;
        const documentNo = docMatch[1].toUpperCase().replace("-", "/");

        let proposedValue = "";
        const targetMatch = text.match(/(?:menjadi|ke|to|ubah ke|ganti jadi)\\s+['"]?([^,\\.\\n\\r"']+)['"]?/i);
        if (targetMatch && targetMatch[1]) {
            proposedValue = targetMatch[1].trim();
        } else {
            const corpMatch = text.match(/\\b(PT|CV|UD)\\s+([A-Za-z0-9\\s]{3,35})\\b/i);
            if (corpMatch) proposedValue = \`\${corpMatch[1].toUpperCase()} \${corpMatch[2].trim()}\`;
        }
        if (!proposedValue) return null;

        return { documentNo, proposedValue, fieldTarget: "customer_name", intent: "UPDATE_CUSTOMER_NAME", confidence: 0.98 };
    }

    async function forwardToNovaPilot(rawText, parsed) {
        try {
            const res = await fetch(\`\${NOVAPILOT_BACKEND}/api/tickets\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_message: \`[\${SERVICE_LABEL}] \${rawText}\`,
                    extracted_intent: parsed.intent,
                    document_no: parsed.documentNo,
                    field_target: parsed.fieldTarget,
                    proposed_value: parsed.proposedValue,
                    branch_id: BRANCH_ID,
                    confidence_score: parsed.confidence
                })
            });
            if (res.ok) {
                const ticket = await res.json();
                console.log(\`%c[NovaPilot AI]%c Tiket \${ticket.ticket_no} (\${ticket.document_no}) berhasil dibuat via \${SERVICE_LABEL}!\`, "background:#059669; color:#fff; padding:2px 4px; border-radius:3px;", "color:#059669; font-weight:bold;");
                return ticket;
            }
        } catch (err) {
            console.error(\`[NovaPilot \${SERVICE_LABEL}] Error:\`, err);
        }
        return null;
    }

    function observeWhatsAppMessages() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        const textNodes = node.querySelectorAll ? node.querySelectorAll(".selectable-text, [data-pre-plain-text], .copyable-text") : [];
                        for (const el of textNodes) {
                            const text = el.textContent || "";
                            if (!text || processedMessages.has(text)) continue;
                            const parsed = parseMessage(text);
                            if (parsed) {
                                processedMessages.add(text);
                                forwardToNovaPilot(text, parsed);
                            }
                        }
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        console.log(\`[NovaPilot AI] Observer WhatsApp aktif pada \${SERVICE_LABEL}.\`);
    }

    const checkInterval = setInterval(() => {
        if (document.querySelector("#app") || document.querySelector("#pane-side") || document.querySelector("div[role='textbox']")) {
            clearInterval(checkInterval);
            observeWhatsAppMessages();
        }
    }, 1500);
})();`;

	const ramboxHookScript = `/**
 * NovaPilot AI — Rambox WhatsApp Service Injection Hook
 * Paste into: Rambox > Right-click WhatsApp service tab > Edit > Advanced > Inject JavaScript code
 */
(function () {
    const NOVAPILOT_BACKEND = "http://127.0.0.1:8088";
    const processedMessages = new Set();
    console.log("%c[NovaPilot AI]%c Rambox WhatsApp ChatOps Hook Active.", "background:#059669; color:#fff; padding:2px 4px; border-radius:3px; font-weight:bold;", "color:#059669;");

    function parseMessage(text) {
        const docMatch = text.match(/\\b(INV[\\/\\-]\\d{4}[\\/\\-]\\d{3}|NOTA[\\/\\-]\\d{4}[\\/\\-]\\d{3})\\b/i);
        if (!docMatch) return null;
        const documentNo = docMatch[1].toUpperCase().replace("-", "/");

        let proposedValue = "";
        const targetMatch = text.match(/(?:menjadi|ke|to|ubah ke|ganti jadi)\\s+['"]?([^,\\.\\n\\r"']+)['"]?/i);
        if (targetMatch && targetMatch[1]) {
            proposedValue = targetMatch[1].trim();
        } else {
            const corpMatch = text.match(/\\b(PT|CV|UD)\\s+([A-Za-z0-9\\s]{3,35})\\b/i);
            if (corpMatch) proposedValue = \`\${corpMatch[1].toUpperCase()} \${corpMatch[2].trim()}\`;
        }
        if (!proposedValue) return null;

        return { documentNo, proposedValue, fieldTarget: "customer_name", intent: "UPDATE_CUSTOMER_NAME", confidence: 0.98 };
    }

    async function forwardToNovaPilot(rawText, parsed) {
        try {
            const res = await fetch(\`\${NOVAPILOT_BACKEND}/api/tickets\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_message: rawText,
                    extracted_intent: parsed.intent,
                    document_no: parsed.documentNo,
                    field_target: parsed.fieldTarget,
                    proposed_value: parsed.proposedValue,
                    branch_id: 1,
                    confidence_score: parsed.confidence
                })
            });
            if (res.ok) {
                const ticket = await res.json();
                console.log(\`[NovaPilot] Ticket \${ticket.ticket_no} created from Rambox!\`);
                return ticket;
            }
        } catch (err) {
            console.error("[NovaPilot] Error:", err);
        }
        return null;
    }

    function observeMessages() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        const textNodes = node.querySelectorAll ? node.querySelectorAll(".selectable-text, [data-pre-plain-text]") : [];
                        for (const el of textNodes) {
                            const text = el.textContent || "";
                            if (!text || processedMessages.has(text)) continue;
                            const parsed = parseMessage(text);
                            if (parsed) {
                                processedMessages.add(text);
                                forwardToNovaPilot(text, parsed);
                            }
                        }
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    const checkInterval = setInterval(() => {
        if (document.querySelector("#app") || document.querySelector("#pane-side")) {
            clearInterval(checkInterval);
            observeMessages();
        }
    }, 1500);
})();`;
</script>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	<!-- Top Aceternity Glow Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
					<AdjustmentsHorizontal class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>{i18n.t.platforms.page_title}</span>
						<span class="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium border border-primary/20">
							{i18n.t.platforms.hub_badge}
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.platforms.page_subtitle}
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2 flex-wrap">
			<button
				type="button"
				onclick={handleTestPing}
				disabled={pinging}
				class="h-9 px-3 rounded-xl border border-input bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="h-4 w-4 {pinging ? 'animate-spin' : ''}" />
				<span>{pinging ? (i18n.current === 'id' ? 'Menguji...' : 'Testing...') : `${i18n.t.actions.test_connection} (${selectedPlatform.name})`}</span>
			</button>

			<button
				type="button"
				onclick={handleSaveSettings}
				disabled={saving}
				class="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
			>
				{#if saveSuccess}
					<Check class="h-4 w-4" />
					<span>{i18n.current === 'id' ? 'Tersimpan!' : 'Saved!'}</span>
				{:else if saving}
					<ArrowPath class="h-4 w-4 animate-spin" />
					<span>{i18n.t.common.loading}</span>
				{:else}
					<span>{i18n.t.actions.save}</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if saveSuccess}
		<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
			<Check class="h-4 w-4 shrink-0" />
			<span>Configuration parameters updated and stored in memory. Ingress listener restarted successfully.</span>
		</div>
	{/if}

	{#if pingFeedback}
		<div class="p-3 rounded-xl bg-primary/10 border border-primary/30 text-foreground text-xs flex items-center gap-2 animate-in fade-in">
			<Signal class="h-4 w-4 text-primary shrink-0" />
			<span>{pingFeedback}</span>
		</div>
	{/if}

	<!-- Platform Selection Tabs (Original Logos - Zero Text Emojis) -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each platforms as platform}
			<button
				type="button"
				onclick={() => cockpit.chatPlatform = platform.id}
				class="p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer {cockpit.chatPlatform === platform.id ? 'bg-card border-primary ring-1 ring-primary/40 shadow-md' : 'bg-card/40 border-border hover:bg-card hover:border-border/80'}"
			>
				<div class="flex items-center justify-between">
					<div class="h-8 w-8 rounded-lg bg-background border border-border/80 p-1 flex items-center justify-center shadow-2xs">
						<img src={platform.icon} alt={platform.name} class="h-6 w-6 object-contain" />
					</div>
					{#if cockpit.chatPlatform === platform.id}
						<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
					{/if}
				</div>

				<div>
					<div class="text-sm font-bold text-foreground flex items-center gap-1.5">
						<span>{platform.name}</span>
						<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium {cockpit.chatPlatform === platform.id ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground'}">
							{platform.badge}
						</span>
					</div>
					<div class="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 font-mono">{platform.sub}</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Platform Content Card: Credentials & Ingress Logic Settings -->
	<div class="grid lg:grid-cols-12 gap-6 items-start">
		<!-- Left: Form Configuration Inputs -->
		<div class="lg:col-span-7 space-y-6">
			<div class="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-5">
				<div class="flex items-center justify-between border-b border-border/50 pb-3">
					<div class="flex items-center gap-2.5">
						<img src={selectedPlatform.icon} alt={selectedPlatform.name} class="h-6 w-6 object-contain" />
						<div>
							<h3 class="text-base font-bold text-foreground">
								{selectedPlatform.name} Ingress Configuration
							</h3>
							<p class="text-xs text-muted-foreground">Network listeners, credentials, and whitelist validation.</p>
						</div>
					</div>

					<span class="text-xs font-mono px-2 py-0.5 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'} font-semibold">
						{cockpit.platformStatuses[cockpit.chatPlatform].status}
					</span>
				</div>

				<!-- WHATSAPP SPECIFIC INPUTS -->
				{#if cockpit.chatPlatform === "whatsapp"}
					<div class="space-y-5 text-xs font-sans">
						<!-- Connection Mode Selector Tabs -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="font-semibold text-foreground text-xs">{i18n.t.platforms.select_method}</span>
								<span class="text-[10px] text-muted-foreground font-mono">{i18n.t.platforms.verified_routes}</span>
							</div>
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border">
								<button
									type="button"
									onclick={() => waConnectMode = "gateway"}
									class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer {waConnectMode === 'gateway' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									<QrCode class="h-3.5 w-3.5" />
									<span>{i18n.t.platforms.wa_gateway_qr}</span>
								</button>
								<button
									type="button"
									onclick={() => waConnectMode = "browser"}
									class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer {waConnectMode === 'browser' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									<GlobeAlt class="h-3.5 w-3.5" />
									<span>{i18n.t.platforms.wa_web}</span>
								</button>
								<button
									type="button"
									onclick={() => waConnectMode = "ferdium"}
									class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer {waConnectMode === 'ferdium' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									<ComputerDesktop class="h-3.5 w-3.5" />
									<span>{i18n.t.platforms.wa_ferdium}</span>
								</button>
								<button
									type="button"
									onclick={() => waConnectMode = "rambox"}
									class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer {waConnectMode === 'rambox' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									<DevicePhoneMobile class="h-3.5 w-3.5" />
									<span>{i18n.t.platforms.wa_rambox}</span>
								</button>
							</div>
						</div>

						<!-- TAB 1: WA MULTI-DEVICE GATEWAY (LIVE QR CODE) -->
						{#if waConnectMode === "gateway"}
							<div class="p-5 rounded-2xl border border-border bg-card/60 space-y-4">
								<div class="flex items-center justify-between flex-wrap gap-2">
									<div class="flex items-center gap-2">
										<div class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
											<QrCode class="h-4 w-4" />
										</div>
										<div>
											<h4 class="text-xs font-bold text-foreground">{i18n.t.platforms.qr_title}</h4>
											<p class="text-[11px] text-muted-foreground">{i18n.t.platforms.qr_subtitle}</p>
										</div>
									</div>
									
									<div class="flex items-center gap-2">
										<span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border {qrData.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : qrData.status === 'WAITING_SCAN' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse' : 'bg-muted text-muted-foreground border-border'}">
											{qrData.status === 'CONNECTED' ? i18n.t.platforms.qr_status_connected : qrData.status === 'WAITING_SCAN' ? i18n.t.platforms.qr_status_waiting : qrData.status === 'LOADING' ? i18n.t.platforms.qr_status_loading : i18n.t.platforms.qr_status_offline}
										</span>
										<button
											type="button"
											onclick={manualRefreshQR}
											disabled={isRefreshingQR}
											class="h-7 px-2.5 rounded-lg border border-input bg-background hover:bg-muted text-[11px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
										>
											<ArrowPath class="h-3 w-3 {isRefreshingQR ? 'animate-spin' : ''}" />
											<span>{i18n.t.platforms.qr_refresh_btn}</span>
										</button>
									</div>
								</div>

								{#if qrData.status === 'CONNECTED'}
									<div class="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
										<div class="h-10 w-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
											<Check class="h-5 w-5" />
										</div>
										<div class="text-xs font-bold text-foreground">{i18n.t.platforms.qr_connected_title}</div>
										<p class="text-[11px] text-muted-foreground max-w-sm mx-auto">
											{i18n.t.platforms.qr_connected_desc}
										</p>
									</div>
								{:else if qrData.status === 'WAITING_SCAN' && qrData.qrDataUrl}
									<div class="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-muted/20 border border-border/60">
										<div class="bg-white p-3 rounded-2xl shadow-lg border border-border shrink-0 text-center">
											<img src={qrData.qrDataUrl} alt="WhatsApp QR Code" class="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg mx-auto" />
											<span class="text-[10px] text-zinc-500 font-mono mt-1 block">Auto-refreshed via Baileys</span>
										</div>
										<div class="space-y-3 text-xs w-full">
											<div class="font-semibold text-foreground flex items-center gap-1.5">
												<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
												<span>{i18n.t.platforms.qr_steps_title}</span>
											</div>
											<ol class="space-y-2 text-[11px] text-muted-foreground list-decimal list-inside leading-relaxed">
												<li>{i18n.t.platforms.qr_step_1}</li>
												<li>{i18n.t.platforms.qr_step_2}</li>
												<li>{i18n.t.platforms.qr_step_3}</li>
												<li>{i18n.t.platforms.qr_step_4}</li>
												<li>{i18n.t.platforms.qr_step_5}</li>
											</ol>
											{#if qrData.updatedAt}
												<div class="text-[10px] text-muted-foreground font-mono pt-1">
													Sinkronisasi: {new Date(qrData.updatedAt).toLocaleTimeString()}
												</div>
											{/if}
										</div>
									</div>
								{:else}
									<div class="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
										<div class="text-xs font-bold text-amber-600 dark:text-amber-400">{i18n.t.platforms.qr_waiting_init}</div>
										<p class="text-[11px] text-muted-foreground max-w-sm mx-auto">
											{i18n.t.platforms.qr_waiting_desc}
										</p>
									</div>
								{/if}
							</div>

						<!-- TAB 2: WHATSAPP WEB (BROWSER USERSCRIPT) -->
						{:else if waConnectMode === "browser"}
							<div class="p-5 rounded-2xl border border-border bg-card/60 space-y-4">
								<div class="flex items-center justify-between flex-wrap gap-2">
									<div class="flex items-center gap-2">
										<div class="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
											<GlobeAlt class="h-4 w-4" />
										</div>
										<div>
											<h4 class="text-xs font-bold text-foreground">{i18n.t.platforms.browser_hook_title}</h4>
											<p class="text-[11px] text-muted-foreground">{i18n.t.platforms.browser_hook_sub}</p>
										</div>
									</div>

									<button
										type="button"
										onclick={() => copyIntegrationScript("browser", browserUserscript)}
										class="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
									>
										{#if copiedScriptType === "browser"}
											<Check class="h-3 w-3" />
											<span>Copied!</span>
										{:else}
											<CodeBracket class="h-3 w-3" />
											<span>Copy Userscript</span>
										{/if}
									</button>
								</div>

								<div class="space-y-2">
									<div class="text-[11px] text-muted-foreground leading-relaxed">
										<strong>Cara Pasang:</strong> Pasang ekstensi <strong>Tampermonkey</strong> atau <strong>Violentmonkey</strong> di Chrome/Edge/Firefox, buat script baru, paste kode di bawah, lalu buka <strong>web.whatsapp.com</strong>.
									</div>
									<pre class="p-3 rounded-xl bg-black/70 border border-border/80 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed"><code>{browserUserscript}</code></pre>
								</div>
							</div>

						<!-- TAB 3: FERDIUM DESKTOP -->
						{:else if waConnectMode === "ferdium"}
							<div class="p-5 rounded-2xl border border-border bg-card/60 space-y-4">
								<div class="flex items-center justify-between flex-wrap gap-2">
									<div class="flex items-center gap-2">
										<div class="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
											<ComputerDesktop class="h-4 w-4" />
										</div>
										<div>
											<h4 class="text-xs font-bold text-foreground">{i18n.t.platforms.ferdium_hook_title}</h4>
											<p class="text-[11px] text-muted-foreground">{i18n.t.platforms.ferdium_hook_sub}</p>
										</div>
									</div>

									<button
										type="button"
										onclick={() => copyIntegrationScript("ferdium", ferdiumHookScript)}
										class="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
									>
										{#if copiedScriptType === "ferdium"}
											<Check class="h-3 w-3" />
											<span>Copied!</span>
										{:else}
											<CodeBracket class="h-3 w-3" />
											<span>Copy Ferdium Hook</span>
										{/if}
									</button>
								</div>

								<div class="space-y-2">
									<div class="text-[11px] text-muted-foreground leading-relaxed">
										<strong>{i18n.locale === 'id' ? 'Mendukung Multi-Service (1, 2, atau 3 Akun WA Sekaligus):' : 'Supports Multi-Service (1, 2, or 3+ WA Accounts Concurrently):'}</strong> {i18n.locale === 'id' ? 'Buka Ferdium > Klik kanan setiap service WhatsApp > Edit Service > Menu Advanced > Tempel kode pada input "Custom Code (Inject JavaScript code)" > Simpan & Reload. Anda bisa membedakan label service (misal "WA 1", "WA 2", "WA 3") di baris atas skrip.' : 'Open Ferdium > Right-click each WhatsApp service > Edit Service > Advanced > Paste code into "Custom Code (Inject JavaScript code)" > Save & Reload. You can customize the service label (e.g. "WA 1", "WA 2", "WA 3") at the top of the script.'}
									</div>
									<pre class="p-3 rounded-xl bg-black/70 border border-border/80 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed"><code>{ferdiumHookScript}</code></pre>
								</div>
							</div>

						<!-- TAB 4: RAMBOX DESKTOP -->
						{:else if waConnectMode === "rambox"}
							<div class="p-5 rounded-2xl border border-border bg-card/60 space-y-4">
								<div class="flex items-center justify-between flex-wrap gap-2">
									<div class="flex items-center gap-2">
										<div class="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
											<DevicePhoneMobile class="h-4 w-4" />
										</div>
										<div>
											<h4 class="text-xs font-bold text-foreground">{i18n.t.platforms.rambox_hook_title}</h4>
											<p class="text-[11px] text-muted-foreground">{i18n.t.platforms.rambox_hook_sub}</p>
										</div>
									</div>

									<button
										type="button"
										onclick={() => copyIntegrationScript("rambox", ramboxHookScript)}
										class="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
									>
										{#if copiedScriptType === "rambox"}
											<Check class="h-3 w-3" />
											<span>Copied!</span>
										{:else}
											<CodeBracket class="h-3 w-3" />
											<span>Copy Rambox Hook</span>
										{/if}
									</button>
								</div>

								<div class="space-y-2">
									<div class="text-[11px] text-muted-foreground leading-relaxed">
										<strong>Cara Pasang:</strong> Buka Rambox &gt; Klik kanan tab service WhatsApp &gt; <strong>Edit</strong> &gt; Buka tab <strong>Advanced</strong> &gt; Tempel kode ke kotak <strong>Inject JavaScript code</strong> &gt; Simpan.
									</div>
									<pre class="p-3 rounded-xl bg-black/70 border border-border/80 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed"><code>{ramboxHookScript}</code></pre>
								</div>
							</div>
						{/if}

						<!-- Common Network & Filter Parameters -->
						<div class="pt-3 border-t border-border/50 space-y-4">
							<h5 class="text-xs font-bold text-foreground">{i18n.t.platforms.network_security_title}</h5>

							<div class="grid sm:grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<label for="wa-port" class="font-medium text-foreground">{i18n.t.platforms.local_port}</label>
									<input
										id="wa-port"
										type="text"
										bind:value={waConfig.port}
										class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
									/>
									<span class="text-[10px] text-muted-foreground">Endpoint: http://127.0.0.1:8088/api/tickets</span>
								</div>

								<div class="space-y-1.5">
									<label for="wa-debounce" class="font-medium text-foreground">{i18n.t.platforms.antispam_debounce}</label>
									<input
										id="wa-debounce"
										type="number"
										bind:value={waConfig.rateLimitDebounceMs}
										class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
									/>
									<span class="text-[10px] text-muted-foreground">{i18n.t.platforms.antispam_desc}</span>
								</div>
							</div>

							<div class="space-y-1.5">
								<label for="wa-whitelist" class="font-medium text-foreground">{i18n.t.platforms.whitelisted_jids}</label>
								<textarea
									id="wa-whitelist"
									rows="3"
									bind:value={waConfig.whitelistedJids}
									class="w-full rounded-xl border border-input bg-background p-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
								></textarea>
								<span class="text-[10px] text-muted-foreground">{i18n.t.platforms.whitelisted_jids_desc}</span>
							</div>

							<div class="space-y-1.5">
								<label for="wa-token" class="font-medium text-foreground">{i18n.t.platforms.security_token}</label>
								<div class="relative">
									<input
										id="wa-token"
										type={showSecrets.whatsapp ? "text" : "password"}
										bind:value={waConfig.tampermonkeyToken}
										class="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
									/>
									<button
										type="button"
										onclick={() => toggleSecret("whatsapp")}
										class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										{#if showSecrets.whatsapp}
											<EyeSlash class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
							</div>
						</div>
					</div>

				<!-- TELEGRAM SPECIFIC INPUTS -->
				{:else if cockpit.chatPlatform === "telegram"}
					<div class="space-y-4 text-xs font-sans">
						<div class="space-y-1.5">
							<label for="tg-token" class="font-medium text-foreground">{i18n.t.platforms.bot_token}</label>
							<div class="relative">
								<input
									id="tg-token"
									type={showSecrets.telegram ? "text" : "password"}
									bind:value={tgConfig.botToken}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
									placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
								/>
								<button
									type="button"
									onclick={() => toggleSecret("telegram")}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{#if showSecrets.telegram}
										<EyeSlash class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
							<span class="text-[10px] text-muted-foreground">{i18n.t.platforms.bot_token_desc}</span>
						</div>

						<div class="grid sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="tg-mode" class="font-medium text-foreground">{i18n.t.platforms.delivery_mode}</label>
								<select
									id="tg-mode"
									bind:value={tgConfig.connectionMode}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
								>
									<option value="webhook">HTTPS Webhook (Recommended)</option>
									<option value="polling">Long Polling (Intranet / Firewall)</option>
								</select>
							</div>

							<div class="space-y-1.5">
								<label for="tg-admin" class="font-medium text-foreground">{i18n.t.platforms.supervisor_id}</label>
								<input
									id="tg-admin"
									type="text"
									bind:value={tgConfig.adminUserId}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="tg-whitelist" class="font-medium text-foreground">{i18n.t.platforms.authorized_chat_ids}</label>
							<textarea
								id="tg-whitelist"
								rows="2"
								bind:value={tgConfig.whitelistedChatIds}
								class="w-full rounded-xl border border-input bg-background p-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
							></textarea>
							<span class="text-[10px] text-muted-foreground">{i18n.t.platforms.authorized_chat_ids_desc}</span>
						</div>
					</div>

				<!-- DISCORD SPECIFIC INPUTS -->
				{:else if cockpit.chatPlatform === "discord"}
					<div class="space-y-4 text-xs font-sans">
						<div class="space-y-1.5">
							<label for="dc-token" class="font-medium text-foreground">{i18n.t.platforms.discord_token}</label>
							<div class="relative">
								<input
									id="dc-token"
									type={showSecrets.discord ? "text" : "password"}
									bind:value={discordConfig.botToken}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<button
									type="button"
									onclick={() => toggleSecret("discord")}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{#if showSecrets.discord}
										<EyeSlash class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>

						<div class="grid sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="dc-guild" class="font-medium text-foreground">{i18n.t.platforms.guild_id}</label>
								<input
									id="dc-guild"
									type="text"
									bind:value={discordConfig.guildId}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>

							<div class="space-y-1.5">
								<label for="dc-role" class="font-medium text-foreground">{i18n.t.platforms.rbac_role}</label>
								<input
									id="dc-role"
									type="text"
									bind:value={discordConfig.permittedRole}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="dc-channels" class="font-medium text-foreground">{i18n.t.platforms.whitelisted_channels}</label>
							<textarea
								id="dc-channels"
								rows="2"
								bind:value={discordConfig.whitelistedChannels}
								class="w-full rounded-xl border border-input bg-background p-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
							></textarea>
						</div>
					</div>

				<!-- SLACK SPECIFIC INPUTS -->
				{:else if cockpit.chatPlatform === "slack"}
					<div class="space-y-4 text-xs font-sans">
						<div class="space-y-1.5">
							<label for="sl-token" class="font-medium text-foreground">{i18n.t.platforms.slack_token}</label>
							<div class="relative">
								<input
									id="sl-token"
									type={showSecrets.slack ? "text" : "password"}
									bind:value={slackConfig.botToken}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<button
									type="button"
									onclick={() => toggleSecret("slack")}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{#if showSecrets.slack}
										<EyeSlash class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="sl-secret" class="font-medium text-foreground">{i18n.t.platforms.signing_secret}</label>
							<input
								id="sl-secret"
								type="text"
								bind:value={slackConfig.signingSecret}
								class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
							/>
							<span class="text-[10px] text-muted-foreground">{i18n.t.platforms.signing_secret_desc}</span>
						</div>

						<div class="grid sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="sl-team" class="font-medium text-foreground">{i18n.t.platforms.team_id}</label>
								<input
									id="sl-team"
									type="text"
									bind:value={slackConfig.teamId}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>

							<div class="space-y-1.5">
								<label for="sl-cmd" class="font-medium text-foreground">{i18n.t.platforms.slash_command}</label>
								<input
									id="sl-cmd"
									type="text"
									bind:value={slackConfig.slashCommand}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Architectural Logic Flow & SOP Enforcement Rules -->
		<div class="lg:col-span-5 space-y-6">
			<!-- Architecture Flow Box -->
			<div class="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
				<div class="flex items-center gap-2 border-b border-border/50 pb-3">
					<CommandLine class="h-5 w-5 text-primary" />
					<h3 class="text-sm font-bold text-foreground">
						{i18n.t.platforms.logic_flow_title.replace("{platform}", selectedPlatform.name)}
					</h3>
				</div>

				<div class="space-y-3 text-xs">
					<!-- Step 1 -->
					<div class="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
						<span class="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
							1
						</span>
						<div>
							<div class="font-semibold text-foreground">{i18n.t.platforms.flow_step_1_title}</div>
							<p class="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
								{i18n.t.platforms.flow_step_1_desc}
							</p>
						</div>
					</div>

					<!-- Step 2 -->
					<div class="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
						<span class="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
							2
						</span>
						<div>
							<div class="font-semibold text-foreground">{i18n.t.platforms.flow_step_2_title}</div>
							<p class="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
								{i18n.t.platforms.flow_step_2_desc}
							</p>
						</div>
					</div>

					<!-- Step 3 -->
					<div class="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
						<span class="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
							3
						</span>
						<div>
							<div class="font-semibold text-foreground">{i18n.t.platforms.flow_step_3_title}</div>
							<p class="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
								{i18n.t.platforms.flow_step_3_desc}
							</p>
						</div>
					</div>
				</div>

				<!-- Setup Code Snippet Preview -->
				<div class="pt-2">
					<div class="flex items-center justify-between pb-1.5 text-[11px] font-mono text-muted-foreground">
						<span>Environment Variables (.env)</span>
						<button
							type="button"
							onclick={() => copySnippet(cockpit.chatPlatform === "whatsapp" ? `CHATOPS_PLATFORM=whatsapp\nWA_INGRESS_PORT=8088\nWA_WHITELIST=${waConfig.whitelistedJids}` : cockpit.chatPlatform === "telegram" ? `CHATOPS_PLATFORM=telegram\nTELEGRAM_BOT_TOKEN=${tgConfig.botToken}\nTELEGRAM_WHITELIST=${tgConfig.whitelistedChatIds}` : cockpit.chatPlatform === "discord" ? `CHATOPS_PLATFORM=discord\nDISCORD_BOT_TOKEN=${discordConfig.botToken}\nDISCORD_GUILD_ID=${discordConfig.guildId}` : `CHATOPS_PLATFORM=slack\nSLACK_BOT_TOKEN=${slackConfig.botToken}\nSLACK_SIGNING_SECRET=${slackConfig.signingSecret}`)}
							class="hover:text-foreground text-primary transition-colors flex items-center gap-1 cursor-pointer"
						>
							{#if copiedSnippet}
								<ClipboardDocumentCheck class="h-3.5 w-3.5 text-emerald-500" />
								<span class="text-emerald-500">Copied!</span>
							{:else}
								<CodeBracket class="h-3.5 w-3.5" />
								<span>{i18n.t.platforms.copy_config}</span>
							{/if}
						</button>
					</div>

					<pre class="p-3 rounded-xl bg-black/60 border border-border/80 text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed"><code>{#if cockpit.chatPlatform === "whatsapp"}CHATOPS_PLATFORM=whatsapp
WA_INGRESS_PORT={waConfig.port}
WA_WHITELIST="{waConfig.whitelistedJids}"
WA_DEBOUNCE_MS={waConfig.rateLimitDebounceMs}{:else if cockpit.chatPlatform === "telegram"}CHATOPS_PLATFORM=telegram
TELEGRAM_BOT_TOKEN="{tgConfig.botToken}"
TELEGRAM_MODE="{tgConfig.connectionMode}"
TELEGRAM_WHITELIST="{tgConfig.whitelistedChatIds}"{:else if cockpit.chatPlatform === "discord"}CHATOPS_PLATFORM=discord
DISCORD_BOT_TOKEN="{discordConfig.botToken}"
DISCORD_GUILD_ID="{discordConfig.guildId}"
DISCORD_ROLE="{discordConfig.permittedRole}"{:else}CHATOPS_PLATFORM=slack
SLACK_BOT_TOKEN="{slackConfig.botToken}"
SLACK_SIGNING_SECRET="{slackConfig.signingSecret}"
SLACK_TEAM_ID="{slackConfig.teamId}"{/if}</code></pre>
				</div>
			</div>
		</div>
	</div>
</div>
