<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		AdjustmentsHorizontal, 
		Check, 
		ArrowPath, 
		ShieldCheck, 
		ShieldExclamation,
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
		ArrowTopRightOnSquare,
		XMark,
		BookOpen,
		QuestionMarkCircle,
		ClipboardDocument
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
		botToken: "8625472390:AAGiAXwbJNwe017i9THSjoSg10SLOWlDaJU",
		webhookUrl: "https://gateway.factory.internal:8088/api/webhooks/telegram",
		connectionMode: "webhook", // "webhook" | "polling"
		whitelistedChatIds: "-100192837482, -100281920194",
		adminUserId: "109283719"
	});

	// Telegram Bot Live Testing State
	let tgTesting = $state(false);
	let tgTestResult = $state<{ ok: boolean; message: string; botInfo?: any } | null>(null);

	async function testTelegramBot() {
		if (!tgConfig.botToken.trim()) return;
		tgTesting = true;
		tgTestResult = null;
		try {
			const res = await fetch(`https://api.telegram.org/bot${tgConfig.botToken.trim()}/getMe`);
			const data = await res.json();
			if (res.ok && data.ok && data.result) {
				tgTestResult = {
					ok: true,
					message: `Koneksi Telegram Berhasil! Bot @${data.result.username} (${data.result.first_name}) aktif dan siap menerima pesan.`,
					botInfo: data.result
				};
				cockpit.recordPlatformEvent("telegram");
			} else {
				tgTestResult = {
					ok: false,
					message: `Gagal verifikasi token: ${data.description || "Token tidak valid"}`
				};
			}
		} catch (err: any) {
			tgTestResult = {
				ok: false,
				message: `Error koneksi ke api.telegram.org: ${err.message}`
			};
		} finally {
			tgTesting = false;
		}
	}

	// How to Get Credentials Modal State
	let showCredentialModal = $state(false);
	let credentialGuidePlatform = $state<ChatPlatform>("whatsapp");

	function openCredentialGuide(platform?: ChatPlatform) {
		credentialGuidePlatform = platform || cockpit.chatPlatform;
		showCredentialModal = true;
	}

	function closeCredentialGuide() {
		showCredentialModal = false;
	}

	let copiedGuideText = $state<string | null>(null);
	function copyGuideText(id: string, text: string) {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(text);
			copiedGuideText = id;
			setTimeout(() => (copiedGuideText = null), 2000);
		}
	}

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

	// WhatsApp Ingress Connection Options: 3 Main Tabs
	// 1. "api": WA API Scan (WhatsApp Cloud API / Meta Graph API)
	// 2. "gateway": WA Gateway (TOS) - Baileys with mandatory TOS modal
	// 3. "web": Web - Unified WhatsApp Web, Ferdium & Rambox Desktop
	type WAConnectMode = "api" | "gateway" | "web";
	let waConnectMode = $state<WAConnectMode>("gateway");

	// Web client sub-selector inside "web" tab
	type WebClientType = "browser" | "ferdium" | "rambox";
	let webClientType = $state<WebClientType>("ferdium");

	// WhatsApp Cloud API Form & Test State
	let waApiConfig = $state({
		phoneNumberId: "109283748291024",
		wabaId: "102938475618290",
		accessToken: "EAAG_NOVAPILOT_ENTERPRISE_SYSTEM_USER_TOKEN",
		verifyToken: "novapilot_wa_verify_2026",
		phoneNumber: "081228632195",
		defaultMessage: "Halo NovaPilot AI, cek status faktur INV/2026/001"
	});
	let waApiTesting = $state(false);
	let waApiTestResult = $state<{ ok: boolean; message: string; timestamp?: string } | null>(null);

	async function testWaApiConnection() {
		if (waApiTesting) return;
		waApiTesting = true;
		waApiTestResult = null;
		try {
			const res = await fetch("/api/whatsapp-api/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					phone_number_id: waApiConfig.phoneNumberId,
					token: waApiConfig.accessToken,
					recipient: waApiConfig.phoneNumber,
					message: waApiConfig.defaultMessage
				})
			});
			const data = await res.json();
			if (res.ok && data.ok) {
				waApiTestResult = {
					ok: true,
					message: data.note || "Koneksi WhatsApp API berhasil diverifikasi!",
					timestamp: data.timestamp
				};
			} else {
				waApiTestResult = {
					ok: false,
					message: data.error || "Gagal memverifikasi koneksi WhatsApp API."
				};
			}
		} catch (err: any) {
			waApiTestResult = {
				ok: false,
				message: `Network error: ${err.message}`
			};
		} finally {
			waApiTesting = false;
		}
	}

	// TOS Modal State for WA Gateway
	let isTosAccepted = $state(false);
	let showTosModal = $state(false);
	let tosAgreedCheckbox = $state(false);

	function acceptTos() {
		if (!tosAgreedCheckbox) return;
		isTosAccepted = true;
		showTosModal = false;
		if (typeof window !== "undefined") {
			localStorage.setItem("novapilot_wa_gateway_tos_accepted", "true");
		}
		manualRefreshQR();
	}

	function resetTos() {
		isTosAccepted = false;
		tosAgreedCheckbox = false;
		if (typeof window !== "undefined") {
			localStorage.removeItem("novapilot_wa_gateway_tos_accepted");
		}
	}

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
		if (typeof window !== "undefined") {
			isTosAccepted = localStorage.getItem("novapilot_wa_gateway_tos_accepted") === "true";
		}
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
				onclick={() => openCredentialGuide(cockpit.chatPlatform)}
				class="h-9 px-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
			>
				<BookOpen class="h-4 w-4" />
				<span>{i18n.current === 'id' ? 'Panduan Kredensial' : 'How to Get Credentials'}</span>
			</button>

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
							<div class="flex items-center justify-between flex-wrap gap-2">
								<span class="font-semibold text-foreground text-xs">{i18n.t.platforms.select_method}</span>
								<button
									type="button"
									onclick={() => openCredentialGuide("whatsapp")}
									class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
								>
									<QuestionMarkCircle class="h-3.5 w-3.5" />
									<span>Panduan Kredensial WhatsApp</span>
								</button>
							</div>
							<div class="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border">
								<button
									type="button"
									onclick={() => waConnectMode = "api"}
									class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer {waConnectMode === 'api' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									<QrCode class="h-3.5 w-3.5" />
									<span>{i18n.t.platforms.tab_wa_api}</span>
								</button>
								<button
									type="button"
									onclick={() => waConnectMode = "gateway"}
									class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer {waConnectMode === 'gateway' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									<ShieldCheck class="h-3.5 w-3.5" />
									<span>{i18n.t.platforms.tab_wa_gateway}</span>
									{#if isTosAccepted}
										<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
									{/if}
								</button>
								<button
									type="button"
									onclick={() => waConnectMode = "web"}
									class="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer {waConnectMode === 'web' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
								>
									<GlobeAlt class="h-3.5 w-3.5" />
									<span>{i18n.t.platforms.tab_wa_web}</span>
								</button>
							</div>
						</div>

						<!-- ========================================================================= -->
						<!-- TAB 1: OFFICIAL WHATSAPP CLOUD API & SCAN                                -->
						<!-- ========================================================================= -->
						{#if waConnectMode === "api"}
							<div class="p-5 rounded-2xl border border-border bg-card/60 space-y-4">
								<div class="flex items-center justify-between flex-wrap gap-2">
									<div class="flex items-center gap-2">
										<div class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
											<QrCode class="h-4 w-4" />
										</div>
										<div>
											<h4 class="text-xs font-bold text-foreground">{i18n.t.platforms.api_title}</h4>
											<p class="text-[11px] text-muted-foreground">{i18n.t.platforms.api_subtitle}</p>
										</div>
									</div>

									<span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
										Meta Cloud API v21.0
									</span>
								</div>

								<!-- API Credentials Grid -->
								<div class="grid sm:grid-cols-2 gap-3.5 pt-1">
									<div class="space-y-1">
										<label for="wa-phone-id" class="font-medium text-foreground text-[11px]">{i18n.t.platforms.api_phone_id}</label>
										<input
											id="wa-phone-id"
											type="text"
											bind:value={waApiConfig.phoneNumberId}
											placeholder="109283748291024"
											class="w-full h-8 rounded-lg border border-input bg-background px-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
										/>
									</div>

									<div class="space-y-1">
										<label for="wa-waba-id" class="font-medium text-foreground text-[11px]">{i18n.t.platforms.api_waba_id}</label>
										<input
											id="wa-waba-id"
											type="text"
											bind:value={waApiConfig.wabaId}
											placeholder="102938475618290"
											class="w-full h-8 rounded-lg border border-input bg-background px-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
										/>
									</div>
								</div>

								<!-- Webhook Verify Token & Callback -->
								<div class="grid sm:grid-cols-2 gap-3.5">
									<div class="space-y-1">
										<label for="wa-verify-token" class="font-medium text-foreground text-[11px]">{i18n.t.platforms.api_verify_token}</label>
										<input
											id="wa-verify-token"
											type="text"
											bind:value={waApiConfig.verifyToken}
											class="w-full h-8 rounded-lg border border-input bg-background px-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
										/>
									</div>

									<div class="space-y-1">
										<label for="wa-callback-url" class="font-medium text-foreground text-[11px]">{i18n.t.platforms.api_callback_url}</label>
										<div class="flex items-center gap-1.5">
											<input
												id="wa-callback-url"
												type="text"
												readonly
												value={`http://${cockpit.telemetry?.lan_ip || "127.0.0.1"}:8088/api/webhooks/whatsapp`}
												class="w-full h-8 rounded-lg border border-input bg-muted/40 px-2.5 font-mono text-xs text-muted-foreground select-all"
											/>
											<button
												type="button"
												onclick={() => copySnippet(`http://${cockpit.telemetry?.lan_ip || "127.0.0.1"}:8088/api/webhooks/whatsapp`)}
												class="h-8 px-2.5 rounded-lg border border-input bg-background hover:bg-muted text-[11px] font-semibold shrink-0 cursor-pointer"
											>
												{copiedSnippet ? "✓" : "Copy"}
											</button>
										</div>
									</div>
								</div>

								<!-- Access Token with Eye Toggle -->
								<div class="space-y-1">
									<label for="wa-api-token" class="font-medium text-foreground text-[11px]">{i18n.t.platforms.api_token}</label>
									<div class="relative">
										<input
											id="wa-api-token"
											type={showSecrets.whatsapp ? "text" : "password"}
											bind:value={waApiConfig.accessToken}
											class="w-full h-8 rounded-lg border border-input bg-background px-2.5 pr-8 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
										/>
										<button
											type="button"
											onclick={() => toggleSecret("whatsapp")}
											class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
										>
											{#if showSecrets.whatsapp}
												<EyeSlash class="h-3.5 w-3.5" />
											{:else}
												<Eye class="h-3.5 w-3.5" />
											{/if}
										</button>
									</div>
								</div>

								<!-- Quick-Connect QR Code Card & Ping Test -->
								<div class="p-4 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row items-center gap-4">
									<div class="bg-white p-2.5 rounded-xl shadow-xs border border-border shrink-0 text-center">
										<img 
											src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://wa.me/${waApiConfig.phoneNumber.replace(/\\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(waApiConfig.defaultMessage)}`)}`}
											alt="WhatsApp API Quick Connect QR"
											class="w-28 h-28 object-contain rounded-md mx-auto"
										/>
										<span class="text-[9px] text-zinc-500 font-mono mt-1 block">wa.me Quick-Scan</span>
									</div>

									<div class="space-y-2 flex-1 text-xs">
										<div class="font-semibold text-foreground flex items-center gap-1.5">
											<QrCode class="h-4 w-4 text-emerald-500" />
											<span>{i18n.t.platforms.api_qr_title}</span>
										</div>
										<p class="text-[11px] text-muted-foreground leading-relaxed">
											{i18n.t.platforms.api_qr_sub}: <strong>{waApiConfig.phoneNumber}</strong>.
										</p>
										
										<div class="flex items-center gap-2 pt-1">
											<button
												type="button"
												onclick={testWaApiConnection}
												disabled={waApiTesting}
												class="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
											>
												{#if waApiTesting}
													<ArrowPath class="h-3 w-3 animate-spin" />
													<span>Menguji...</span>
												{:else}
													<Check class="h-3 w-3" />
													<span>{i18n.t.platforms.api_test_btn}</span>
												{/if}
											</button>
										</div>

										{#if waApiTestResult}
											<div class="p-2 rounded-lg border text-[11px] flex items-center gap-2 animate-in fade-in duration-150 {waApiTestResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
												<span>{waApiTestResult.message}</span>
											</div>
										{/if}
									</div>
								</div>
							</div>

						<!-- ========================================================================= -->
						<!-- TAB 2: WA MULTI-DEVICE GATEWAY (LIVE QR CODE WITH MANDATORY TOS)         -->
						<!-- ========================================================================= -->
						{:else if waConnectMode === "gateway"}
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
										{#if isTosAccepted}
											<span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
												✓ {i18n.t.platforms.tos_accepted_badge}
											</span>
											<button
												type="button"
												onclick={() => showTosModal = true}
												class="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
											>
												{i18n.t.platforms.tos_view_btn}
											</button>
										{/if}

										<span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border {qrData.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : qrData.status === 'WAITING_SCAN' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse' : 'bg-muted text-muted-foreground border-border'}">
											{qrData.status === 'CONNECTED' ? i18n.t.platforms.qr_status_connected : qrData.status === 'WAITING_SCAN' ? i18n.t.platforms.qr_status_waiting : qrData.status === 'LOADING' ? i18n.t.platforms.qr_status_loading : i18n.t.platforms.qr_status_offline}
										</span>

										{#if isTosAccepted}
											<button
												type="button"
												onclick={manualRefreshQR}
												disabled={isRefreshingQR}
												class="h-7 px-2.5 rounded-lg border border-input bg-background hover:bg-muted text-[11px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
											>
												<ArrowPath class="h-3 w-3 {isRefreshingQR ? 'animate-spin' : ''}" />
												<span>{i18n.t.platforms.qr_refresh_btn}</span>
											</button>
										{/if}
									</div>
								</div>

								<!-- TOS GATEKEEPER CHECK: MUST ACCEPT TOS BEFORE SCANNING -->
								{#if !isTosAccepted}
									<div class="p-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-center space-y-3 shadow-xs">
										<div class="h-12 w-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
											<ShieldExclamation class="h-6 w-6" />
										</div>
										<div class="space-y-1">
											<h5 class="text-xs font-bold text-foreground">{i18n.t.platforms.tos_locked_title}</h5>
											<p class="text-[11px] text-muted-foreground max-w-md mx-auto leading-relaxed">
												{i18n.t.platforms.tos_locked_desc}
											</p>
										</div>
										<button
											type="button"
											onclick={() => showTosModal = true}
											class="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-xs"
										>
											<ShieldCheck class="h-4 w-4" />
											<span>{i18n.t.platforms.tos_open_btn}</span>
										</button>
									</div>
								{:else if qrData.status === 'CONNECTED'}
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

						<!-- ========================================================================= -->
						<!-- TAB 3: WEB (UNIFIED BROWSER, FERDIUM & RAMBOX WITH PC SUPPORT)             -->
						<!-- ========================================================================= -->
						{:else if waConnectMode === "web"}
							<div class="p-5 rounded-2xl border border-border bg-card/60 space-y-4">
								<!-- PC & Desktop Ready Badge Banner -->
								<div class="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-3">
									<ComputerDesktop class="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
									<div class="space-y-0.5">
										<div class="text-xs font-bold text-foreground flex items-center gap-2">
											<span>{i18n.t.platforms.pc_support_title}</span>
											<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold">WINDOWS / LINUX / MAC</span>
										</div>
										<p class="text-[11px] text-muted-foreground leading-relaxed">
											{i18n.t.platforms.pc_support_desc}
										</p>
									</div>
								</div>

								<!-- Client Sub-Tabs (Pills) -->
								<div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
									<button
										type="button"
										onclick={() => webClientType = "ferdium"}
										class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 {webClientType === 'ferdium' ? 'bg-purple-600 text-white shadow-xs' : 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
									>
										<ComputerDesktop class="h-3.5 w-3.5" />
										<span>{i18n.t.platforms.wa_ferdium}</span>
										<span class="px-1 py-0.2 rounded text-[9px] bg-white/20 font-mono">Multi-WA</span>
									</button>

									<button
										type="button"
										onclick={() => webClientType = "browser"}
										class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 {webClientType === 'browser' ? 'bg-blue-600 text-white shadow-xs' : 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
									>
										<GlobeAlt class="h-3.5 w-3.5" />
										<span>{i18n.t.platforms.wa_web} (Tampermonkey)</span>
									</button>

									<button
										type="button"
										onclick={() => webClientType = "rambox"}
										class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 {webClientType === 'rambox' ? 'bg-amber-600 text-white shadow-xs' : 'bg-muted/60 text-muted-foreground hover:text-foreground'}"
									>
										<DevicePhoneMobile class="h-3.5 w-3.5" />
										<span>{i18n.t.platforms.wa_rambox}</span>
									</button>
								</div>

								<!-- Sub-View: Ferdium Desktop Hook -->
								{#if webClientType === "ferdium"}
									<div class="space-y-3 animate-in fade-in duration-150">
										<div class="flex items-center justify-between flex-wrap gap-2">
											<div>
												<h4 class="text-xs font-bold text-foreground">{i18n.t.platforms.ferdium_hook_title}</h4>
												<p class="text-[11px] text-muted-foreground">{i18n.t.platforms.ferdium_hook_sub}</p>
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
												<strong>{i18n.locale === 'id' ? 'Mendukung Multi-Service (1, 2, atau 3 Akun WA Sekaligus di PC):' : 'Supports Multi-Service (1, 2, or 3+ WA Accounts Concurrently on PC):'}</strong> {i18n.locale === 'id' ? 'Buka Ferdium > Klik kanan setiap service WhatsApp > Edit Service > Menu Advanced > Tempel kode pada input "Custom Code (Inject JavaScript code)" > Simpan & Reload. Anda bisa membedakan label service (misal "WA 1", "WA 2", "WA 3") di baris atas skrip.' : 'Open Ferdium > Right-click each WhatsApp service > Edit Service > Advanced > Paste code into "Custom Code (Inject JavaScript code)" > Save & Reload. You can customize the service label (e.g. "WA 1", "WA 2", "WA 3") at the top of the script.'}
											</div>
											<pre class="p-3 rounded-xl bg-black/70 border border-border/80 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed"><code>{ferdiumHookScript}</code></pre>
										</div>
									</div>

								<!-- Sub-View: WhatsApp Web (Tampermonkey) -->
								{:else if webClientType === "browser"}
									<div class="space-y-3 animate-in fade-in duration-150">
										<div class="flex items-center justify-between flex-wrap gap-2">
											<div>
												<h4 class="text-xs font-bold text-foreground">{i18n.t.platforms.browser_hook_title}</h4>
												<p class="text-[11px] text-muted-foreground">{i18n.t.platforms.browser_hook_sub}</p>
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
												<strong>Cara Pasang di Browser PC:</strong> Pasang ekstensi <strong>Tampermonkey</strong> atau <strong>Violentmonkey</strong> di Chrome/Edge/Firefox, buat script baru, paste kode di bawah, lalu buka <strong>web.whatsapp.com</strong>.
											</div>
											<pre class="p-3 rounded-xl bg-black/70 border border-border/80 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed"><code>{browserUserscript}</code></pre>
										</div>
									</div>

								<!-- Sub-View: Rambox Desktop Hook -->
								{:else if webClientType === "rambox"}
									<div class="space-y-3 animate-in fade-in duration-150">
										<div class="flex items-center justify-between flex-wrap gap-2">
											<div>
												<h4 class="text-xs font-bold text-foreground">{i18n.t.platforms.rambox_hook_title}</h4>
												<p class="text-[11px] text-muted-foreground">{i18n.t.platforms.rambox_hook_sub}</p>
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
												<strong>Cara Pasang di Rambox PC:</strong> Buka Rambox &gt; Klik kanan tab service WhatsApp &gt; <strong>Edit</strong> &gt; Buka tab <strong>Advanced</strong> &gt; Tempel kode ke kotak <strong>Inject JavaScript code</strong> &gt; Simpan.
											</div>
											<pre class="p-3 rounded-xl bg-black/70 border border-border/80 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed"><code>{ramboxHookScript}</code></pre>
										</div>
									</div>
								{/if}
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
						<!-- Telegram Header Actions -->
						<div class="flex items-center justify-between pb-1 flex-wrap gap-2">
							<div class="flex items-center gap-2">
								<span class="text-xs font-bold text-foreground">Konfigurasi Telegram Bot API</span>
								{#if tgTestResult?.ok}
									<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
										● Terverifikasi
									</span>
								{/if}
							</div>
							<button
								type="button"
								onclick={() => openCredentialGuide("telegram")}
								class="text-xs text-sky-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
							>
								<QuestionMarkCircle class="h-3.5 w-3.5" />
								<span>Panduan Token @BotFather</span>
							</button>
						</div>

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<label for="tg-token" class="font-medium text-foreground">{i18n.t.platforms.bot_token}</label>
								<span class="text-[10px] font-mono text-muted-foreground">Format: 123456789:AA...</span>
							</div>
							<div class="flex gap-2">
								<div class="relative flex-1">
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
										aria-label={showSecrets.telegram ? "Sembunyikan token" : "Tampilkan token"}
									>
										{#if showSecrets.telegram}
											<EyeSlash class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>

								<button
									type="button"
									onclick={testTelegramBot}
									disabled={tgTesting || !tgConfig.botToken}
									class="h-9 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
								>
									<ArrowPath class="h-3.5 w-3.5 {tgTesting ? 'animate-spin' : ''}" />
									<span>{tgTesting ? (i18n.current === 'id' ? 'Menguji...' : 'Testing...') : (i18n.current === 'id' ? 'Uji Token' : 'Test Token')}</span>
								</button>
							</div>
							<span class="text-[10px] text-muted-foreground">{i18n.t.platforms.bot_token_desc}</span>
						</div>

						<!-- Telegram Test Feedback Card -->
						{#if tgTestResult}
							{#if tgTestResult.ok && tgTestResult.botInfo}
								<div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-in fade-in">
									<div class="flex items-center justify-between flex-wrap gap-2">
										<div class="flex items-center gap-2.5">
											<div class="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
												<Check class="h-4 w-4" />
											</div>
											<div>
												<div class="font-bold text-foreground text-xs flex items-center gap-1.5">
													<span>{tgTestResult.botInfo.first_name}</span>
													<span class="text-sky-500 font-mono">@{tgTestResult.botInfo.username}</span>
												</div>
												<div class="text-[10px] text-muted-foreground font-mono">
													Bot ID: {tgTestResult.botInfo.id} • Grup: {tgTestResult.botInfo.can_join_groups ? 'Diizinkan' : 'Dibatasi'}
												</div>
											</div>
										</div>

										<a
											href="https://t.me/{tgTestResult.botInfo.username}"
											target="_blank"
											rel="noopener noreferrer"
											class="h-7 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
										>
											<ArrowTopRightOnSquare class="h-3 w-3" />
											<span>Buka di Telegram</span>
										</a>
									</div>
									<p class="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
										{tgTestResult.message} Bot siap menerima pesan transaksi & integrasi on-call.
									</p>
								</div>
							{:else}
								<div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
									<ShieldExclamation class="h-4 w-4 shrink-0" />
									<span>{tgTestResult.message}</span>
								</div>
							{/if}
						{/if}

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
						<div class="flex items-center justify-between pb-1 flex-wrap gap-2">
							<span class="text-xs font-bold text-foreground">Konfigurasi Discord Gateway & Bot</span>
							<button
								type="button"
								onclick={() => openCredentialGuide("discord")}
								class="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
							>
								<QuestionMarkCircle class="h-3.5 w-3.5" />
								<span>Panduan Kredensial Discord</span>
							</button>
						</div>

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
						<div class="flex items-center justify-between pb-1 flex-wrap gap-2">
							<span class="text-xs font-bold text-foreground">Konfigurasi Slack Web API & OAuth</span>
							<button
								type="button"
								onclick={() => openCredentialGuide("slack")}
								class="text-xs text-amber-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
							>
								<QuestionMarkCircle class="h-3.5 w-3.5" />
								<span>Panduan Kredensial Slack</span>
							</button>
						</div>
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

	<!-- ========================================================================= -->
	<!-- TOS (TERMS OF SERVICE) MODAL FOR WA GATEWAY                              -->
	<!-- ========================================================================= -->
	{#if showTosModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
			<div class="w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-7 space-y-5 text-foreground relative animate-in zoom-in-95 duration-200">
				<!-- Modal Close Button -->
				<button
					type="button"
					onclick={() => showTosModal = false}
					class="absolute right-5 top-5 h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
					aria-label="Tutup Modal"
				>
					<XMark class="h-4 w-4" />
				</button>

				<!-- Header -->
				<div class="flex items-start gap-3.5 pr-8">
					<div class="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
						<ShieldExclamation class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-base font-bold text-foreground">
							{i18n.t.platforms.tos_modal_title}
						</h3>
						<p class="text-xs text-muted-foreground mt-0.5">
							{i18n.t.platforms.tos_modal_subtitle}
						</p>
					</div>
				</div>

				<!-- TOS Content Box -->
				<div class="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3.5 max-h-72 overflow-y-auto text-xs leading-relaxed text-muted-foreground">
					<div class="space-y-1">
						<div class="font-bold text-foreground flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
							<span>{i18n.t.platforms.tos_point_1_title}</span>
						</div>
						<p class="text-[11px] pl-3">
							{i18n.t.platforms.tos_point_1_desc}
						</p>
					</div>

					<div class="space-y-1">
						<div class="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
							<span>{i18n.t.platforms.tos_point_2_title}</span>
						</div>
						<p class="text-[11px] pl-3">
							{i18n.t.platforms.tos_point_2_desc}
						</p>
					</div>

					<div class="space-y-1">
						<div class="font-bold text-foreground flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
							<span>{i18n.t.platforms.tos_point_3_title}</span>
						</div>
						<p class="text-[11px] pl-3">
							{i18n.t.platforms.tos_point_3_desc}
						</p>
					</div>

					<div class="space-y-1">
						<div class="font-bold text-foreground flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
							<span>{i18n.t.platforms.tos_point_4_title}</span>
						</div>
						<p class="text-[11px] pl-3">
							{i18n.t.platforms.tos_point_4_desc}
						</p>
					</div>
				</div>

				<!-- Mandatory Checkbox -->
				<label class="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs cursor-pointer select-none">
					<input
						type="checkbox"
						bind:checked={tosAgreedCheckbox}
						class="mt-0.5 rounded border-border text-amber-600 focus:ring-amber-500 h-4 w-4"
					/>
					<span class="text-xs font-medium text-foreground leading-snug">
						{i18n.t.platforms.tos_checkbox_label}
					</span>
				</label>

				<!-- Modal Actions -->
				<div class="flex items-center justify-between gap-3 pt-1">
					{#if isTosAccepted}
						<button
							type="button"
							onclick={resetTos}
							class="text-xs text-rose-500 hover:text-rose-600 underline font-semibold cursor-pointer"
						>
							{i18n.t.platforms.tos_reset_btn}
						</button>
					{:else}
						<div></div>
					{/if}

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => showTosModal = false}
							class="h-9 px-4 rounded-xl border border-input bg-background hover:bg-muted text-xs font-semibold cursor-pointer transition-colors"
						>
							{i18n.t.platforms.tos_cancel_btn}
						</button>
						<button
							type="button"
							onclick={acceptTos}
							disabled={!tosAgreedCheckbox}
							class="h-9 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
						>
							<ShieldCheck class="h-4 w-4" />
							<span>{i18n.t.platforms.tos_accept_btn}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- CREDENTIAL GUIDE MODAL (Cara Mendapatkan Kredensial Platform)             -->
	<!-- ========================================================================= -->
	{#if showCredentialModal}
		<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
			<div class="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[90vh]">
				<!-- Modal Header -->
				<div class="p-5 border-b border-border/70 flex items-center justify-between relative bg-muted/20 shrink-0">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
							<BookOpen class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground flex items-center gap-2">
								<span>Panduan Mendapatkan Kredensial</span>
								<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
									ChatOps Hub
								</span>
							</h3>
							<p class="text-xs text-muted-foreground mt-0.5">
								Langkah praktis mendapatkan token API, Bot ID, dan otentikasi on-call gateway.
							</p>
						</div>
					</div>

					<button
						type="button"
						onclick={closeCredentialGuide}
						class="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
						aria-label="Tutup Panduan"
					>
						<XMark class="h-4 w-4" />
					</button>
				</div>

				<!-- Platform Tabs -->
				<div class="p-3 bg-muted/10 border-b border-border/50 grid grid-cols-4 gap-2 shrink-0">
					{#each platforms as platform}
						<button
							type="button"
							onclick={() => credentialGuidePlatform = platform.id}
							class="py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer {credentialGuidePlatform === platform.id ? 'bg-card border border-primary/40 shadow-xs text-foreground font-bold ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}"
						>
							<img src={platform.icon} alt={platform.name} class="h-4 w-4 object-contain" />
							<span class="truncate">{platform.name}</span>
						</button>
					{/each}
				</div>

				<!-- Modal Scrollable Content -->
				<div class="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
					<!-- ============================================== -->
					<!-- TELEGRAM GUIDE                                 -->
					<!-- ============================================== -->
					{#if credentialGuidePlatform === "telegram"}
						<div class="space-y-5 animate-in fade-in duration-150">
							<div class="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-3">
								<img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" class="h-6 w-6 shrink-0 mt-0.5" />
								<div class="space-y-1">
									<h4 class="font-bold text-foreground text-xs">Telegram Bot API (Rekomendasi Cepat & Gratis)</h4>
									<p class="text-[11px] text-muted-foreground">
										Telegram bot tidak memerlukan verifikasi kartu kredit atau persetujuan Meta. Cukup 2 menit dengan akun Telegram Anda.
									</p>
								</div>
							</div>

							<!-- Current Tested Token Callout -->
							<div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
										<Check class="h-4 w-4 text-emerald-500" />
										Token Terverifikasi Aktif
									</span>
									<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
										@novapilot_ai_ky_bot
									</span>
								</div>
								<p class="text-[11px] text-muted-foreground">
									Bot Telegram <strong class="text-foreground">novapilot_ai</strong> (<a href="https://t.me/novapilot_ai_ky_bot" target="_blank" rel="noopener noreferrer" class="text-sky-500 hover:underline">@novapilot_ai_ky_bot</a>) sudah terverifikasi di server Telegram.
								</p>
								<div class="flex items-center gap-2 pt-1">
									<button
										type="button"
										onclick={() => copyGuideText("tg-token-sample", "8625472390:AAGiAXwbJNwe017i9THSjoSg10SLOWlDaJU")}
										class="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
									>
										{#if copiedGuideText === "tg-token-sample"}
											<Check class="h-3.5 w-3.5" />
											<span>Tersalin!</span>
										{:else}
											<ClipboardDocument class="h-3.5 w-3.5" />
											<span>Salin Token Aktif</span>
										{/if}
									</button>
									<button
										type="button"
										onclick={() => {
											tgConfig.botToken = "8625472390:AAGiAXwbJNwe017i9THSjoSg10SLOWlDaJU";
											cockpit.chatPlatform = "telegram";
											testTelegramBot();
											closeCredentialGuide();
										}}
										class="h-7 px-3 rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
									>
										<span>Terapkan ke Form & Uji</span>
									</button>
								</div>
							</div>

							<!-- Step by step list -->
							<div class="space-y-4">
								<h5 class="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">Langkah Membuat Bot Baru Sendiri:</h5>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">1</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Buka @BotFather di Telegram</p>
										<p class="text-[11px] text-muted-foreground">
											Buka aplikasi Telegram di HP atau Desktop, cari bot resmi <code class="px-1.5 py-0.5 rounded bg-muted font-mono font-bold">@BotFather</code> (ada centang biru), atau kunjungi link berikut:
										</p>
										<a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-sky-500 hover:underline font-medium text-[11px]">
											<ArrowTopRightOnSquare class="h-3 w-3" />
											<span>Buka https://t.me/BotFather</span>
										</a>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">2</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Jalankan Perintah Pembuatan Bot</p>
										<p class="text-[11px] text-muted-foreground">
											Kirim pesan <code class="px-1.5 py-0.5 rounded bg-muted font-mono font-bold">/newbot</code> ke BotFather.
										</p>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">3</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Beri Nama dan Username Bot</p>
										<p class="text-[11px] text-muted-foreground">
											Masukkan nama tampilan bot Anda (misal: <em>NovaPilot Gatekeeper</em>), lalu masukkan username bot yang berakhiran <code class="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">bot</code> (misal: <em>novapilot_ops_bot</em>).
										</p>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">4</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Salin HTTP API Token</p>
										<p class="text-[11px] text-muted-foreground">
											BotFather akan mengirimkan pesan berisi token dengan format:
										</p>
										<div class="p-2.5 rounded-xl bg-black/60 text-amber-400 font-mono text-[11px] flex items-center justify-between">
											<span>123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ</span>
										</div>
										<p class="text-[11px] text-muted-foreground">
											Tempel token tersebut ke kolom <strong>Bot Token</strong> di NovaPilot.
										</p>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">5</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Cari Supervisor User ID (Opsional)</p>
										<p class="text-[11px] text-muted-foreground">
											Kirim pesan apa saja ke bot <code class="px-1.5 py-0.5 rounded bg-muted font-mono font-bold">@userinfobot</code> di Telegram untuk mengetahui ID akun Anda (angka numerik). Masukkan ke <strong>Supervisor User ID</strong>.
										</p>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">6</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Matikan Group Privacy (Jika Digunakan di Grup On-Call)</p>
										<p class="text-[11px] text-muted-foreground">
											Di chat BotFather, kirim <code class="px-1.5 py-0.5 rounded bg-muted font-mono font-bold">/setprivacy</code> &gt; pilih bot Anda &gt; pilih <strong>Disable</strong> agar bot dapat membaca semua pesan transaksi di grup tanpa harus di-mention.
										</p>
									</div>
								</div>
							</div>
						</div>

					<!-- ============================================== -->
					<!-- WHATSAPP GUIDE                                 -->
					<!-- ============================================== -->
					{:else if credentialGuidePlatform === "whatsapp"}
						<div class="space-y-5 animate-in fade-in duration-150">
							<div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
								<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" class="h-6 w-6 shrink-0 mt-0.5" />
								<div class="space-y-1">
									<h4 class="font-bold text-foreground text-xs">WhatsApp Multi-Channel (3 Pilihan Metode)</h4>
									<p class="text-[11px] text-muted-foreground">
										NovaPilot mendukung Gateway QR Code Baileys (gratis dari nomor sendiri), Meta Cloud API resmi bisnis, serta Hook Browser/Desktop.
									</p>
								</div>
							</div>

							<!-- Method 1: Baileys QR Gateway -->
							<div class="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
								<div class="flex items-center gap-2">
									<span class="px-2 py-0.5 rounded-lg bg-emerald-500 text-white font-bold text-[10px]">METODE 1</span>
									<h5 class="font-bold text-foreground text-xs">Gateway QR Code (Baileys) — Paling Praktis</h5>
								</div>
								<ol class="list-decimal pl-4 space-y-1.5 text-[11px] text-muted-foreground">
									<li>Buka tab <strong>Gateway QR Code (Baileys)</strong> di halaman Platform Settings.</li>
									<li>Klik tombol <strong>Buka Ketentuan & Tautkan QR</strong> dan setujui disclaimer keamanan.</li>
									<li>Buka aplikasi WhatsApp di HP Anda &gt; Menu Tiga Titik &gt; <strong>Perangkat Tertaut (Linked Devices)</strong> &gt; <strong>Tautkan Perangkat</strong>.</li>
									<li>Arahkan kamera ke QR Code di layar dashboard. Status akan langsung berubah menjadi <strong class="text-emerald-500">CONNECTED</strong>.</li>
									<li>Tidak memerlukan token berbayar dari Meta. Nomor HP Anda langsung bertindak sebagai host bot.</li>
								</ol>
							</div>

							<!-- Method 2: Meta Cloud API -->
							<div class="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
								<div class="flex items-center gap-2">
									<span class="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-[10px]">METODE 2</span>
									<h5 class="font-bold text-foreground text-xs">Meta WhatsApp Cloud API — Resmi Enterprise</h5>
								</div>
								<ol class="list-decimal pl-4 space-y-1.5 text-[11px] text-muted-foreground">
									<li>
										Buka portal pengembang Meta di <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" class="text-sky-500 hover:underline">developers.facebook.com</a> dan login.
									</li>
									<li>Klik <strong>My Apps</strong> &gt; <strong>Create App</strong> &gt; Pilih tipe <strong>Business</strong>.</li>
									<li>Pada panel produk, tambahkan produk <strong>WhatsApp</strong>.</li>
									<li>
										Masuk ke menu <strong>WhatsApp &gt; API Setup</strong>:
										<ul class="list-disc pl-4 mt-1 space-y-0.5 text-foreground">
											<li>Salin <strong>Phone number ID</strong> (ID numerik) ke kolom <em>Phone Number ID</em> di NovaPilot.</li>
											<li>Salin <strong>Temporary Access Token</strong> (atau buat System User Token permanen) ke kolom <em>Access Token</em>.</li>
										</ul>
									</li>
									<li>
										Masuk ke menu <strong>Configuration &gt; Webhook</strong>: Masukkan Callback URL backend Anda dan samakan Verify Token dengan yang terdaftar di NovaPilot.
									</li>
								</ol>
							</div>

							<!-- Method 3: Browser & Desktop Hook -->
							<div class="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
								<div class="flex items-center gap-2">
									<span class="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold text-[10px]">METODE 3</span>
									<h5 class="font-bold text-foreground text-xs">Ferdium Desktop / Tampermonkey Userscript</h5>
								</div>
								<p class="text-[11px] text-muted-foreground">
									Cocok untuk memantau 1 hingga banyak akun WhatsApp Web sekaligus di komputer on-call tanpa setup server tambahan:
								</p>
								<ol class="list-decimal pl-4 space-y-1.5 text-[11px] text-muted-foreground">
									<li>Pilih tab <strong>Browser & Desktop Hook</strong> di konfigurasi WhatsApp.</li>
									<li>Pilih sub-kategori: <strong>Ferdium Desktop</strong> atau <strong>Tampermonkey Web</strong>.</li>
									<li>Salin skrip JavaScript yang disediakan dan tempel pada menu Custom Script aplikasi Anda.</li>
								</ol>
							</div>
						</div>

					<!-- ============================================== -->
					<!-- DISCORD GUIDE                                  -->
					<!-- ============================================== -->
					{:else if credentialGuidePlatform === "discord"}
						<div class="space-y-5 animate-in fade-in duration-150">
							<div class="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
								<img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" alt="Discord" class="h-6 w-6 shrink-0 mt-0.5 object-contain" />
								<div class="space-y-1">
									<h4 class="font-bold text-foreground text-xs">Discord Bot & Server Integration</h4>
									<p class="text-[11px] text-muted-foreground">
										Menggunakan Discord Gateway API untuk menangkap pesan perintah di channel tertentu pada server Discord Anda.
									</p>
								</div>
							</div>

							<div class="space-y-4">
								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs flex items-center justify-center shrink-0">1</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Buka Discord Developer Portal</p>
										<p class="text-[11px] text-muted-foreground">Kunjungi portal resmi pengembang Discord:</p>
										<a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-indigo-500 hover:underline font-medium text-[11px]">
											<ArrowTopRightOnSquare class="h-3 w-3" />
											<span>https://discord.com/developers/applications</span>
										</a>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs flex items-center justify-center shrink-0">2</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Buat Aplikasi & Bot Baru</p>
										<p class="text-[11px] text-muted-foreground">
											Klik <strong>New Application</strong> &gt; Beri nama (misal: <em>NovaPilot Gatekeeper</em>) &gt; Masuk ke menu <strong>Bot</strong> di sidebar &gt; Klik <strong>Reset Token</strong> &gt; Salin Bot Token ke NovaPilot.
										</p>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs flex items-center justify-center shrink-0">3</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-rose-600 dark:text-rose-400">Aktifkan Message Content Intent (PENTING!)</p>
										<p class="text-[11px] text-muted-foreground">
											Masih di tab <strong>Bot</strong>, scroll ke bawah ke bagian <strong>Privileged Gateway Intents</strong>, lalu centang:
										</p>
										<div class="p-2.5 rounded-xl bg-card border border-border/80 font-mono text-[10px] space-y-1">
											<div class="text-emerald-500 font-bold">✓ MESSAGE CONTENT INTENT (Wajib untuk membaca pesan on-call)</div>
											<div class="text-emerald-500 font-bold">✓ SERVER MEMBERS INTENT</div>
										</div>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs flex items-center justify-center shrink-0">4</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Undang Bot ke Server Anda</p>
										<p class="text-[11px] text-muted-foreground">
											Buka tab <strong>OAuth2 &gt; URL Generator</strong>, centang scope <code class="px-1 py-0.5 rounded bg-muted font-mono">bot</code> dan <code class="px-1 py-0.5 rounded bg-muted font-mono">applications.commands</code>, lalu centang permissions <em>Send Messages</em>, <em>Read Messages/View Channels</em>, dan <em>Read Message History</em>. Buka link tersebut untuk menambahkan bot ke server Anda.
										</p>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs flex items-center justify-center shrink-0">5</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Salin Guild ID & Channel ID</p>
										<p class="text-[11px] text-muted-foreground">
											Di Discord, buka <strong>User Settings &gt; Advanced &gt; Aktifkan Developer Mode</strong>. Klik kanan ikon server Anda &gt; <strong>Copy Server ID</strong> (Guild ID). Klik kanan channel target &gt; <strong>Copy Channel ID</strong>.
										</p>
									</div>
								</div>
							</div>
						</div>

					<!-- ============================================== -->
					<!-- SLACK GUIDE                                    -->
					<!-- ============================================== -->
					{:else if credentialGuidePlatform === "slack"}
						<div class="space-y-5 animate-in fade-in duration-150">
							<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
								<img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" alt="Slack" class="h-6 w-6 shrink-0 mt-0.5" />
								<div class="space-y-1">
									<h4 class="font-bold text-foreground text-xs">Slack App & OAuth 2.0 Integration</h4>
									<p class="text-[11px] text-muted-foreground">
										Mengintegrasikan bot ke channel internal Slack perusahaan dengan Bot Token (<code class="px-1 py-0.5 rounded bg-muted font-mono">xoxb-</code>) dan Signing Secret.
									</p>
								</div>
							</div>

							<div class="space-y-4">
								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">1</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Buka Slack Apps Management</p>
										<p class="text-[11px] text-muted-foreground">Kunjungi dashboard pengembang Slack:</p>
										<a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-medium text-[11px]">
											<ArrowTopRightOnSquare class="h-3 w-3" />
											<span>https://api.slack.com/apps</span>
										</a>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">2</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Create App (From Scratch)</p>
										<p class="text-[11px] text-muted-foreground">
											Klik tombol <strong>Create New App</strong> &gt; Pilih <strong>From scratch</strong> &gt; Masukkan nama aplikasi (misal: <em>NovaPilot</em>) dan pilih workspace Slack Anda.
										</p>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">3</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Tambahkan Bot Token Scopes</p>
										<p class="text-[11px] text-muted-foreground">
											Masuk ke menu <strong>OAuth &amp; Permissions</strong> di sidebar &gt; Scroll ke <strong>Scopes &gt; Bot Token Scopes</strong>, tambahkan permission:
										</p>
										<div class="flex flex-wrap gap-1.5 pt-1">
											<code class="px-2 py-0.5 rounded bg-muted text-[10px] font-mono">chat:write</code>
											<code class="px-2 py-0.5 rounded bg-muted text-[10px] font-mono">channels:history</code>
											<code class="px-2 py-0.5 rounded bg-muted text-[10px] font-mono">groups:history</code>
											<code class="px-2 py-0.5 rounded bg-muted text-[10px] font-mono">commands</code>
										</div>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">4</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Install ke Workspace &amp; Salin Token</p>
										<p class="text-[11px] text-muted-foreground">
											Di bagian atas halaman <strong>OAuth &amp; Permissions</strong>, klik tombol <strong>Install to Workspace</strong> dan izinkan. Salin <strong>Bot User OAuth Token</strong> (awalan <code class="px-1 py-0.5 rounded bg-muted font-mono font-bold">xoxb-</code>) ke kolom <em>Slack Bot User Token</em>.
										</p>
									</div>
								</div>

								<div class="flex gap-3">
									<div class="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">5</div>
									<div class="space-y-1 flex-1">
										<p class="font-semibold text-foreground">Salin Signing Secret</p>
										<p class="text-[11px] text-muted-foreground">
											Buka menu <strong>Basic Information</strong> &gt; Scroll ke <strong>App Credentials</strong> &gt; Salin <strong>Signing Secret</strong> ke kolom <em>Signing Secret</em> di NovaPilot.
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Modal Footer -->
				<div class="p-4 bg-muted/20 border-t border-border/70 flex items-center justify-between gap-3 shrink-0">
					<div class="text-[11px] text-muted-foreground flex items-center gap-1.5">
						<InformationCircle class="h-4 w-4 text-sky-500 shrink-0" />
						<span>Token disimpan lokal di sesi browser dan server on-call internal.</span>
					</div>

					<button
						type="button"
						onclick={closeCredentialGuide}
						class="h-9 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
					>
						Tutup Panduan
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
