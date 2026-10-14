<script lang="ts">
	import { 
		UserGroup, 
		User,
		ShieldCheck, 
		CheckCircle, 
		XCircle,
		Bolt, 
		ArrowPath, 
		Check, 
		Signal,
		BuildingOffice2,
		Envelope,
		Radio,
		CpuChip,
		ExclamationTriangle,
		ChartBar,
		CommandLine,
		ClipboardDocument,
		UserPlus,
		Trash,
		XMark,
		Plus
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";
	import DataTable from "$lib/components/DataTable.svelte";
	import type { ColumnDef } from "$lib/types/table";

	interface ContactChannel {
		id: string;
		type: "GROUP" | "INDIVIDUAL";
		name: string;
		branch: string;
		platform: "whatsapp" | "telegram" | "discord" | "slack";
		jidOrChatId: string;
		status: "ACTIVE" | "STANDBY" | "MUTED" | "RATE_LIMITED";
		isWhitelisted: boolean;
		contactPerson: string;
		contactPhone: string;
		totalMessages: number;
		actionableTickets: number;
		latencyMs: number;
		lastActivity: string;
	}

	let testPingId = $state<string | null>(null);
	let copiedJid = $state<string | null>(null);

	// Whitelisted regional branch contacts (both Groups and Individuals)
	let channels = $state<ContactChannel[]>([
		{
			id: "ch_wa_grp_1",
			type: "GROUP",
			name: "Ops Cabang Surabaya & Gudang Timur",
			branch: "Jawa Timur (Surabaya Hub)",
			platform: "whatsapp",
			jidOrChatId: "120363028192837492@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Bambang Santoso (Kepala Gudang)",
			contactPhone: "+62 812-3456-7890",
			totalMessages: 284,
			actionableTickets: 32,
			latencyMs: 78,
			lastActivity: "4 menit yang lalu"
		},
		{
			id: "ch_wa_ind_1",
			type: "INDIVIDUAL",
			name: "Rifky Firdaus (On-Call Regional Lead)",
			branch: "Jawa Timur (Surabaya)",
			platform: "whatsapp",
			jidOrChatId: "6281234567890@s.whatsapp.net",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Rifky Firdaus",
			contactPhone: "+62 812-3456-7890",
			totalMessages: 142,
			actionableTickets: 18,
			latencyMs: 65,
			lastActivity: "12 menit yang lalu"
		},
		{
			id: "ch_wa_grp_2",
			type: "GROUP",
			name: "Logistik Medan Priority & Distribusi",
			branch: "Sumatera Utara (Medan)",
			platform: "whatsapp",
			jidOrChatId: "120363098172635412@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Hendra Wijaya (Supervisor Logistik)",
			contactPhone: "+62 813-8821-4910",
			totalMessages: 198,
			actionableTickets: 24,
			latencyMs: 112,
			lastActivity: "25 menit yang lalu"
		},
		{
			id: "ch_wa_ind_2",
			type: "INDIVIDUAL",
			name: "Dewi Lestari (Lead AR/AP Finance)",
			branch: "DKI Jakarta (Head Office)",
			platform: "whatsapp",
			jidOrChatId: "6281192837411@s.whatsapp.net",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Dewi Lestari",
			contactPhone: "+62 811-9283-7411",
			totalMessages: 412,
			actionableTickets: 56,
			latencyMs: 72,
			lastActivity: "2 menit yang lalu"
		},
		{
			id: "ch_wa_grp_3",
			type: "GROUP",
			name: "Finansial Kantor Pusat Jakarta",
			branch: "DKI Jakarta (Head Office)",
			platform: "whatsapp",
			jidOrChatId: "120363012938475610@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Siti Rahmawati (Manajer Keuangan)",
			contactPhone: "+62 812-9900-1122",
			totalMessages: 540,
			actionableTickets: 72,
			latencyMs: 82,
			lastActivity: "8 menit yang lalu"
		},
		{
			id: "ch_wa_grp_4",
			type: "GROUP",
			name: "Plant Operations Cikarang II",
			branch: "Jawa Barat (Cikarang Industrial)",
			platform: "whatsapp",
			jidOrChatId: "120363077889900112@g.us",
			status: "STANDBY",
			isWhitelisted: true,
			contactPerson: "Agus Pratama (Plant Manager)",
			contactPhone: "+62 821-7788-9900",
			totalMessages: 96,
			actionableTickets: 11,
			latencyMs: 95,
			lastActivity: "1 jam yang lalu"
		},
		{
			id: "ch_wa_ind_3",
			type: "INDIVIDUAL",
			name: "Joko Anwar (Warehouse Dispatcher Semarang)",
			branch: "Jawa Tengah (Semarang)",
			platform: "whatsapp",
			jidOrChatId: "6285671239870@s.whatsapp.net",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Joko Anwar",
			contactPhone: "+62 856-7123-9870",
			totalMessages: 88,
			actionableTickets: 9,
			latencyMs: 90,
			lastActivity: "35 menit yang lalu"
		},
		{
			id: "ch_tg_grp_1",
			type: "GROUP",
			name: "Telegram On-Call Incident Alerts",
			branch: "Nasional (IT Infrastructure)",
			platform: "telegram",
			jidOrChatId: "-100192837482",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Rudi Hartono (SRE Lead)",
			contactPhone: "@rudi_oncall",
			totalMessages: 165,
			actionableTickets: 21,
			latencyMs: 145,
			lastActivity: "18 menit yang lalu"
		},
		{
			id: "ch_dc_grp_1",
			type: "GROUP",
			name: "Discord #warehouse-ops Guild",
			branch: "Regional Plant IT Automation",
			platform: "discord",
			jidOrChatId: "channel_119283749281920195",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "DevOps Ops Bot",
			contactPhone: "ops-bot#1049",
			totalMessages: 130,
			actionableTickets: 14,
			latencyMs: 120,
			lastActivity: "40 menit yang lalu"
		},
		{
			id: "ch_sl_grp_1",
			type: "GROUP",
			name: "Slack #it-helpdesk Enterprise",
			branch: "Kantor Pusat Jakarta",
			platform: "slack",
			jidOrChatId: "C0819283ABC",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "IT Support Escalation Bot",
			contactPhone: "U06ABC1234",
			totalMessages: 220,
			actionableTickets: 29,
			latencyMs: 110,
			lastActivity: "15 menit yang lalu"
		},
		{
			id: "ch_wa_grp_5",
			type: "GROUP",
			name: "Ekspedisi Cargo Makassar Hub",
			branch: "Sulawesi Selatan (Makassar)",
			platform: "whatsapp",
			jidOrChatId: "120363066554433221@g.us",
			status: "MUTED",
			isWhitelisted: false,
			contactPerson: "Andi Mallarangeng",
			contactPhone: "+62 813-4455-6677",
			totalMessages: 45,
			actionableTickets: 2,
			latencyMs: 230,
			lastActivity: "4 jam yang lalu"
		},
		{
			id: "ch_wa_ind_4",
			type: "INDIVIDUAL",
			name: "Vendor Support Oracle Database",
			branch: "Third-Party SLA",
			platform: "whatsapp",
			jidOrChatId: "6289988776655@s.whatsapp.net",
			status: "STANDBY",
			isWhitelisted: true,
			contactPerson: "Senior DBA Support",
			contactPhone: "+62 899-8877-6655",
			totalMessages: 19,
			actionableTickets: 4,
			latencyMs: 160,
			lastActivity: "2 hari yang lalu"
		}
	]);

	// Interactive whitelist toggle
	function toggleWhitelist(channelId: string) {
		const target = channels.find(c => c.id === channelId);
		if (target) {
			target.isWhitelisted = !target.isWhitelisted;
			target.status = target.isWhitelisted ? "ACTIVE" : "MUTED";
		}
	}

	// Copy JID to clipboard
	function copyJid(jid: string) {
		navigator.clipboard.writeText(jid);
		copiedJid = jid;
		setTimeout(() => { copiedJid = null; }, 1800);
	}

	// Ping Simulation to Backend Inbound Webhook
	async function pingChannel(c: ContactChannel) {
		testPingId = c.id;
		try {
			await fetch("/api/inbound-messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					platform: c.platform,
					sender_id: c.jidOrChatId,
					sender_name: `${c.name} (${c.contactPerson})`,
					raw_message: `[Simulasi Probing ${c.type}] Dari ${c.branch}: Tolong cek revisi faktur INV/2026/001 customer PT Sumber Makmur.`,
					media_type: "text",
					classification: "ACTIONABLE",
					extracted_doc: "INV/2026/001",
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					extracted_target: "PT Sumber Makmur Berkah Abadi"
				})
			});
			c.totalMessages++;
			c.actionableTickets++;
			c.lastActivity = "Baru saja";
			cockpit.recordPlatformEvent(c.platform);
		} catch (e) {
			console.error("Failed to ping channel:", e);
		} finally {
			setTimeout(() => { testPingId = null; }, 1200);
		}
	}

	// =========================================================================
	// ADD & DELETE CONTACT CHANNELS LOGIC & MODAL STATE
	// =========================================================================
	let isAddModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);
	let channelToDelete = $state<ContactChannel | null>(null);

	let newContact = $state<{
		type: "GROUP" | "INDIVIDUAL";
		name: string;
		branch: string;
		platform: "whatsapp" | "telegram" | "discord" | "slack";
		jidOrChatId: string;
		contactPerson: string;
		contactPhone: string;
		isWhitelisted: boolean;
	}>({
		type: "GROUP",
		name: "",
		branch: "",
		platform: "whatsapp",
		jidOrChatId: "",
		contactPerson: "",
		contactPhone: "",
		isWhitelisted: true
	});

	let formError = $state<string | null>(null);

	function openAddModal() {
		newContact = {
			type: "GROUP",
			name: "",
			branch: "",
			platform: "whatsapp",
			jidOrChatId: "",
			contactPerson: "",
			contactPhone: "",
			isWhitelisted: true
		};
		formError = null;
		isAddModalOpen = true;
	}

	function saveContact() {
		if (!newContact.name.trim()) {
			formError = "Nama saluran atau grup wajib diisi.";
			return;
		}
		if (!newContact.jidOrChatId.trim()) {
			formError = "JID atau Chat ID wajib diisi untuk routing masuk.";
			return;
		}
		if (!newContact.branch.trim()) {
			formError = "Cabang atau unit kerja wajib diisi.";
			return;
		}

		let finalJid = newContact.jidOrChatId.trim();
		if (newContact.platform === "whatsapp") {
			if (newContact.type === "GROUP" && !finalJid.includes("@")) {
				finalJid = `${finalJid}@g.us`;
			} else if (newContact.type === "INDIVIDUAL" && !finalJid.includes("@")) {
				finalJid = `${finalJid.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
			}
		}

		const createdChannel: ContactChannel = {
			id: `ch_${newContact.platform}_${Date.now()}`,
			type: newContact.type,
			name: newContact.name.trim(),
			branch: newContact.branch.trim(),
			platform: newContact.platform,
			jidOrChatId: finalJid,
			status: "ACTIVE",
			isWhitelisted: newContact.isWhitelisted,
			contactPerson: newContact.contactPerson.trim() || "-",
			contactPhone: newContact.contactPhone.trim() || "-",
			totalMessages: 0,
			actionableTickets: 0,
			latencyMs: Math.floor(Math.random() * 40) + 60,
			lastActivity: "Baru saja"
		};

		channels = [createdChannel, ...channels];
		isAddModalOpen = false;
	}

	function promptDelete(channel: ContactChannel) {
		channelToDelete = channel;
		isDeleteModalOpen = true;
	}

	function confirmDelete() {
		if (channelToDelete) {
			channels = channels.filter(c => c.id !== channelToDelete!.id);
			channelToDelete = null;
			isDeleteModalOpen = false;
		}
	}

	// TanStack Table Column Definitions
	const tableColumns: ColumnDef<ContactChannel>[] = [
		{
			id: "name",
			header: "Saluran & Identitas",
			sortable: true,
			accessorKey: "name",
			exportValue: (row) => `${row.name} (${row.type}) - ${row.branch}`
		},
		{
			id: "platform",
			header: "Platform",
			sortable: true,
			align: "center",
			accessorKey: "platform",
			exportValue: (row) => row.platform.toUpperCase()
		},
		{
			id: "jidOrChatId",
			header: "JID / Identifier",
			sortable: true,
			accessorKey: "jidOrChatId",
			exportValue: (row) => row.jidOrChatId
		},
		{
			id: "status",
			header: "Monitoring Probe",
			sortable: true,
			align: "center",
			accessorKey: "status",
			exportValue: (row) => `${row.status} (${row.latencyMs}ms)`
		},
		{
			id: "telemetry",
			header: "Volume Telemetry",
			sortable: true,
			accessorKey: "totalMessages",
			exportValue: (row) => `${row.totalMessages} chat, ${row.actionableTickets} tiket`
		},
		{
			id: "whitelist",
			header: "Whitelist Intake",
			sortable: true,
			align: "center",
			accessorKey: "isWhitelisted",
			exportValue: (row) => row.isWhitelisted ? "WHITELISTED" : "MUTED"
		},
		{
			id: "actions",
			header: "Aksi",
			sortable: false,
			align: "right"
		}
	];

	// Filter options for dropdown
	const filterOptions = [
		{ label: "Grup WhatsApp (@g.us)", value: "GROUP" },
		{ label: "Kontak Perorangan (@s.whatsapp.net)", value: "INDIVIDUAL" }
	];

	// Telemetry Calculations for Analytics Header
	const totalChannelsCount = $derived(channels.length);
	const totalGroupsCount = $derived(channels.filter(c => c.type === "GROUP").length);
	const totalIndividualsCount = $derived(channels.filter(c => c.type === "INDIVIDUAL").length);
	const whitelistedCount = $derived(channels.filter(c => c.isWhitelisted).length);
	const totalIngestedChats = $derived(channels.reduce((sum, c) => sum + c.totalMessages, 0));
	const totalActionableTickets = $derived(channels.reduce((sum, c) => sum + c.actionableTickets, 0));
	const avgLatency = $derived(
		Math.round(channels.reduce((sum, c) => sum + c.latencyMs, 0) / (channels.length || 1))
	);
</script>

<svelte:head>
	<title>Omnichannel Group & Contact Directory • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">

	<!-- ========================================================================= -->
	<!-- 1. PAGE HEADER                                                            -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5 flex-wrap">
				<div class="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shadow-xs">
					<UserGroup class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
						Direktori Saluran Ingress &amp; Kontak ChatOps
						<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
							MONITORING AKTIF
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Manajemen grup WhatsApp cabang, hotline darurat perorangan, dan saluran bot yang terintegrasi dengan filter AI Guardrail.
					</p>
				</div>
			</div>
		</div>

		<!-- Action Buttons: Add Contact & E2E Flow Link -->
		<div class="flex items-center gap-2.5 font-mono text-xs flex-wrap">
			<button
				type="button"
				onclick={openAddModal}
				class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs transition-all cursor-pointer"
			>
				<UserPlus class="h-4 w-4" />
				<span>Tambah Kontak / Grup</span>
			</button>

			<a
				href="/flow"
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
			>
				<CommandLine class="h-3.5 w-3.5 text-primary" />
				<span>Lihat Alur E2E Flow</span>
			</a>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- ANIMATED SVG DIRECTORY TOPOLOGY (LIVE CHANNEL INGRESS & GUARDRAIL ROUTER) -->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 overflow-hidden relative">
		<!-- Toolbar / Title -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60">
			<div class="flex items-center gap-2.5">
				<div class="h-8.5 w-8.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
					<Radio class="h-4.5 w-4.5" />
				</div>
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<h3 class="text-sm font-bold text-foreground">Topologi Aliran Ingress Saluran &amp; Whitelist Gatekeeper</h3>
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
							LIVE TOPOLOGY
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-0.5">Visualisasi rute pesan masuk dari saluran grup &amp; hotline menuju filter AI Guardrail.</p>
				</div>
			</div>

			<div class="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
				<span class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
					<strong class="text-foreground">Inbound Stream:</strong> {channels.filter(c => c.isWhitelisted).length} Saluran Terverifikasi
				</span>
			</div>
		</div>

		<!-- Animated SVG Canvas -->
		<div class="relative w-full rounded-xl bg-secondary/25 dark:bg-black/60 border border-border/80 overflow-hidden select-none h-[220px]">
			<svg viewBox="0 0 1080 220" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="ingressGradWA" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#10b981" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#059669" stop-opacity="0.9" />
					</linearGradient>
					<linearGradient id="ingressGradTG" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#0284c7" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#0369a1" stop-opacity="0.9" />
					</linearGradient>
					<linearGradient id="guardrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#6d28d9" stop-opacity="0.9" />
					</linearGradient>
					<linearGradient id="wireGradIn" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#10b981" />
						<stop offset="100%" stop-color="#8b5cf6" />
					</linearGradient>
					<linearGradient id="wireGradOut" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#8b5cf6" />
						<stop offset="100%" stop-color="#06b6d4" />
					</linearGradient>
					<filter id="contactGlow" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="3.5" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
					<style>
						@keyframes packetFlow {
							from { stroke-dashoffset: 0; }
							to { stroke-dashoffset: -20; }
						}
						@keyframes laserScan {
							0%, 100% { transform: translateY(0px); opacity: 0.2; }
							50% { transform: translateY(60px); opacity: 0.8; }
						}
						.ingress-wire {
							stroke-dasharray: 5 4;
							animation: packetFlow 0.8s linear infinite;
						}
						.guardrail-laser {
							animation: laserScan 2s ease-in-out infinite;
						}
					</style>
				</defs>

				<!-- 1. LEFT INGRESS GATEWAY NODES -->
				<!-- WhatsApp Ingress Node -->
				<g transform="translate(30, 25)">
					<rect x="0" y="0" width="180" height="70" rx="12" fill="currentColor" class="text-card stroke-emerald-500/60 stroke-[1.5px]" />
					<rect x="0" y="0" width="180" height="26" rx="12" fill="#10b981" fill-opacity="0.15" />
					<circle cx="16" cy="13" r="3.5" fill="#10b981" />
					<text x="26" y="17" font-family="system-ui" font-size="11" font-weight="bold" fill="#059669">WhatsApp Gateway</text>
					<text x="14" y="42" font-family="monospace" font-size="9.5" fill="currentColor" class="text-foreground">Port :3002 Baileys</text>
					<text x="14" y="58" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">{totalGroupsCount} Grup · {totalIndividualsCount} Hotline</text>
				</g>

				<!-- Telegram / Multi-Bot Ingress Node -->
				<g transform="translate(30, 125)">
					<rect x="0" y="0" width="180" height="70" rx="12" fill="currentColor" class="text-card stroke-sky-500/60 stroke-[1.5px]" />
					<rect x="0" y="0" width="180" height="26" rx="12" fill="#0284c7" fill-opacity="0.15" />
					<circle cx="16" cy="13" r="3.5" fill="#0284c7" />
					<text x="26" y="17" font-family="system-ui" font-size="11" font-weight="bold" fill="#0284c7">Multi-Bot Ingress</text>
					<text x="14" y="42" font-family="monospace" font-size="9.5" fill="currentColor" class="text-foreground">Telegram / Discord API</text>
					<text x="14" y="58" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">Rate Limit: Safe 2s Interval</text>
				</g>

				<!-- 2. WIRES: LEFT TO CENTER GUARDRAIL -->
				<!-- Wire 1: WA -> Center -->
				<path d="M 210 60 C 310 60, 340 100, 440 100" fill="none" stroke="url(#wireGradIn)" stroke-width="2.5" class="ingress-wire" />
				<!-- Moving Packets WA -->
				<circle r="4.5" fill="#10b981" filter="url(#contactGlow)">
					<animateMotion dur="1.4s" repeatCount="indefinite" path="M 210 60 C 310 60, 340 100, 440 100" />
				</circle>

				<!-- Wire 2: Bot -> Center -->
				<path d="M 210 160 C 310 160, 340 120, 440 120" fill="none" stroke="url(#wireGradIn)" stroke-width="2.5" class="ingress-wire" />
				<!-- Moving Packets Bot -->
				<circle r="4.5" fill="#0284c7" filter="url(#contactGlow)">
					<animateMotion dur="1.7s" begin="0.4s" repeatCount="indefinite" path="M 210 160 C 310 160, 340 120, 440 120" />
				</circle>

				<!-- 3. CENTER: DIRECTORY GUARDRAIL & WHITELIST GATEKEEPER -->
				<g transform="translate(440, 35)">
					<rect x="0" y="0" width="220" height="150" rx="16" fill="currentColor" class="text-card stroke-purple-500 stroke-[2px]" />
					<rect x="0" y="0" width="220" height="34" rx="16" fill="#8b5cf6" fill-opacity="0.18" />
					<text x="14" y="22" font-family="system-ui" font-size="12" font-weight="bold" fill="#7c3aed">🛡️ Directory Gatekeeper</text>
					
					<!-- Laser scanning beam -->
					<rect x="6" y="38" width="208" height="2" fill="#a855f7" filter="url(#contactGlow)" class="guardrail-laser" />

					<g transform="translate(14, 46)">
						<rect x="0" y="0" width="192" height="26" rx="6" fill="currentColor" class="text-secondary/60" />
						<text x="10" y="17" font-family="monospace" font-size="10" font-weight="bold" fill="#10b981">● {whitelistedCount} Whitelisted (Pass)</text>
					</g>

					<g transform="translate(14, 78)">
						<rect x="0" y="0" width="192" height="26" rx="6" fill="currentColor" class="text-secondary/60" />
						<text x="10" y="17" font-family="monospace" font-size="10" font-weight="bold" fill="#ef4444">✕ {totalChannelsCount - whitelistedCount} Muted (Drop/Ignore)</text>
					</g>

					<g transform="translate(14, 110)">
						<rect x="0" y="0" width="192" height="28" rx="6" fill="#8b5cf6" fill-opacity="0.1" />
						<text x="10" y="18" font-family="monospace" font-size="9.5" fill="#7c3aed" font-weight="bold">AI Intent &amp; OCR Verification</text>
					</g>
				</g>

				<!-- 4. WIRES: CENTER TO RIGHT DESTINATIONS -->
				<!-- Wire 3: Center -> Groups -->
				<path d="M 660 100 C 760 100, 780 60, 870 60" fill="none" stroke="url(#wireGradOut)" stroke-width="2.5" class="ingress-wire" />
				<!-- Moving Packets to Groups -->
				<circle r="4.5" fill="#8b5cf6" filter="url(#contactGlow)">
					<animateMotion dur="1.3s" repeatCount="indefinite" path="M 660 100 C 760 100, 780 60, 870 60" />
				</circle>

				<!-- Wire 4: Center -> Individuals -->
				<path d="M 660 120 C 760 120, 780 160, 870 160" fill="none" stroke="url(#wireGradOut)" stroke-width="2.5" class="ingress-wire" />
				<!-- Moving Packets to Individuals -->
				<circle r="4.5" fill="#06b6d4" filter="url(#contactGlow)">
					<animateMotion dur="1.6s" begin="0.5s" repeatCount="indefinite" path="M 660 120 C 760 120, 780 160, 870 160" />
				</circle>

				<!-- 5. RIGHT DESTINATION NODES -->
				<!-- Node 1: Regional WhatsApp Groups -->
				<g transform="translate(870, 25)">
					<rect x="0" y="0" width="180" height="70" rx="12" fill="currentColor" class="text-card stroke-primary/50 stroke-[1.5px]" />
					<rect x="0" y="0" width="180" height="26" rx="12" fill="#10b981" fill-opacity="0.12" />
					<circle cx="14" cy="13" r="3.5" fill="#10b981" />
					<text x="24" y="17" font-family="system-ui" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">🏢 Grup Cabang &amp; Gudang</text>
					<text x="14" y="42" font-family="monospace" font-size="9.5" fill="#10b981" font-weight="bold">Target: @g.us</text>
					<text x="14" y="58" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">{totalIngestedChats} Total Inbound Chat</text>
				</g>

				<!-- Node 2: Individual PIC Hotlines -->
				<g transform="translate(870, 125)">
					<rect x="0" y="0" width="180" height="70" rx="12" fill="currentColor" class="text-card stroke-cyan-500/50 stroke-[1.5px]" />
					<rect x="0" y="0" width="180" height="26" rx="12" fill="#06b6d4" fill-opacity="0.12" />
					<circle cx="14" cy="13" r="3.5" fill="#06b6d4" />
					<text x="24" y="17" font-family="system-ui" font-size="11" font-weight="bold" fill="#0891b2">👤 Hotline PIC Personal</text>
					<text x="14" y="42" font-family="monospace" font-size="9.5" fill="#06b6d4" font-weight="bold">Target: @s.whatsapp.net</text>
					<text x="14" y="58" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">{totalActionableTickets} Tiket Staged (HITL)</text>
				</g>
			</svg>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 2. ANALYTICS & MONITORING METRIC CARDS                                    -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Card 1: Channel Ingress Coverage -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Saluran Terdaftar</span>
				<div class="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
					<Radio class="h-4 w-4" />
				</div>
			</div>
			<div>
				<div class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
					{totalChannelsCount} <span class="text-xs font-normal text-muted-foreground">Channel</span>
				</div>
				<p class="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
					<span class="text-emerald-500 font-semibold">{totalGroupsCount} Grup WA</span>
					<span class="text-border">·</span>
					<span class="text-cyan-500 font-semibold">{totalIndividualsCount} Hotline Kontak</span>
				</p>
			</div>
			<div class="w-full bg-secondary h-1 rounded-full overflow-hidden">
				<div class="bg-primary h-full rounded-full" style="width: {(whitelistedCount / totalChannelsCount) * 100}%"></div>
			</div>
		</div>

		<!-- Card 2: Monitoring Probe Health -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Monitoring Health</span>
				<div class="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
					<Signal class="h-4 w-4" />
				</div>
			</div>
			<div>
				<div class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
					{avgLatency} <span class="text-xs font-normal text-muted-foreground">ms latency</span>
				</div>
				<p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
					<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
					99.8% Uptime Ingress Socket
				</p>
			</div>
			<div class="w-full bg-secondary h-1 rounded-full overflow-hidden">
				<div class="bg-emerald-500 h-full rounded-full" style="width: 98%"></div>
			</div>
		</div>

		<!-- Card 3: Ingested Traffic & Ticket Yield -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Traffic &amp; Tiket Yield</span>
				<div class="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
					<ChartBar class="h-4 w-4" />
				</div>
			</div>
			<div>
				<div class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
					{totalIngestedChats} <span class="text-xs font-normal text-muted-foreground">Pesan</span>
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">
					<strong class="text-foreground">{totalActionableTickets} Tiket</strong> staging terverifikasi AI
				</p>
			</div>
			<div class="w-full bg-secondary h-1 rounded-full overflow-hidden">
				<div class="bg-cyan-500 h-full rounded-full" style="width: {(totalActionableTickets / totalIngestedChats) * 100 * 5}%"></div>
			</div>
		</div>

		<!-- Card 4: Whitelist Gatekeeper -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Whitelist Gatekeeper</span>
				<div class="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
					<ShieldCheck class="h-4 w-4" />
				</div>
			</div>
			<div>
				<div class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
					{whitelistedCount} <span class="text-xs font-normal text-muted-foreground">dari {totalChannelsCount} aktif</span>
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">
					{totalChannelsCount - whitelistedCount} saluran dalam status muted/standby
				</p>
			</div>
			<div class="w-full bg-secondary h-1 rounded-full overflow-hidden">
				<div class="bg-amber-500 h-full rounded-full" style="width: {(whitelistedCount / totalChannelsCount) * 100}%"></div>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. MODULAR TANSTACK-POWERED DATA TABLE                                     -->
	<!-- ========================================================================= -->
	<DataTable
		data={channels}
		columns={tableColumns}
		title="Tabel Manajemen Saluran & Kontak"
		subtitle="Daftar lengkap grup dan kontak dengan pencarian multi-kolom, filter jenis, pengurutan, dan ekspor instan."
		searchPlaceholder="Cari nama grup/kontak, cabang, nomor HP, atau JID..."
		searchKeys={["name", "branch", "jidOrChatId", "contactPerson", "contactPhone"]}
		filterKey="type"
		{filterOptions}
		defaultPageSize={10}
		enableExport={true}
		exportFilename="novapilot_contacts_directory"
		emptyMessage="Tidak ditemukan saluran atau kontak yang cocok"
	>
		<!-- Custom Cell Rendering -->
		{#snippet rowCell({ row, column })}
			{#if column.id === "name"}
				<div class="flex items-center gap-3 min-w-[200px]">
					<div class="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border {row.type === 'GROUP' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'}">
						{#if row.type === 'GROUP'}
							<UserGroup class="h-4 w-4" />
						{:else}
							<User class="h-4 w-4" />
						{/if}
					</div>
					<div class="min-w-0">
						<div class="font-bold text-foreground text-xs truncate flex items-center gap-1.5">
							<span>{row.name}</span>
							<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold {row.type === 'GROUP' ? 'bg-secondary text-foreground border border-border' : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'}">
								{row.type}
							</span>
						</div>
						<div class="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
							<BuildingOffice2 class="h-3 w-3" />
							<span>{row.branch}</span>
							<span class="text-border">·</span>
							<span>{row.contactPerson}</span>
						</div>
					</div>
				</div>

			{:else if column.id === "platform"}
				<div class="flex items-center justify-center">
					<span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1.5 {row.platform === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : row.platform === 'telegram' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' : row.platform === 'discord' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'}">
						<span class="h-1.5 w-1.5 rounded-full {row.platform === 'whatsapp' ? 'bg-emerald-500' : row.platform === 'telegram' ? 'bg-sky-500' : row.platform === 'discord' ? 'bg-indigo-500' : 'bg-rose-500'}"></span>
						{row.platform}
					</span>
				</div>

			{:else if column.id === "jidOrChatId"}
				<div class="flex items-center gap-1.5 font-mono text-[11px]">
					<span class="text-foreground font-medium truncate max-w-[180px]" title={row.jidOrChatId}>
						{row.jidOrChatId}
					</span>
					<button
						type="button"
						onclick={() => copyJid(row.jidOrChatId)}
						class="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary cursor-pointer"
						title="Salin JID"
					>
						{#if copiedJid === row.jidOrChatId}
							<Check class="h-3.5 w-3.5 text-emerald-500" />
						{:else}
							<ClipboardDocument class="h-3.5 w-3.5" />
						{/if}
					</button>
				</div>

			{:else if column.id === "status"}
				<div class="flex flex-col items-center justify-center space-y-0.5">
					<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold {row.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : row.status === 'STANDBY' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-muted text-muted-foreground border border-border'}">
						<span class="h-1.5 w-1.5 rounded-full {row.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : row.status === 'STANDBY' ? 'bg-amber-500' : 'bg-zinc-400'}"></span>
						{row.status}
					</span>
					<span class="text-[10px] font-mono text-muted-foreground">
						{row.latencyMs}ms latency
					</span>
				</div>

			{:else if column.id === "telemetry"}
				<div class="space-y-0.5">
					<div class="font-semibold text-foreground text-xs">
						{row.totalMessages} <span class="font-normal text-muted-foreground">chat</span>
					</div>
					<div class="text-[11px] text-primary font-medium">
						{row.actionableTickets} tiket staging
					</div>
				</div>

			{:else if column.id === "whitelist"}
				<div class="flex items-center justify-center">
					<button
						type="button"
						onclick={() => toggleWhitelist(row.id)}
						class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {row.isWhitelisted ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}"
						title={row.isWhitelisted ? "Saluran diizinkan masuk pipeline otomatis" : "Saluran dimatikan / diabaikan oleh bot"}
					>
						<span
							class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out {row.isWhitelisted ? 'translate-x-4' : 'translate-x-0'}"
						></span>
					</button>
				</div>

			{:else if column.id === "actions"}
				<div class="flex items-center justify-end gap-1.5">
					<!-- Simulasi Inbound Ping -->
					<button
						type="button"
						onclick={() => pingChannel(row)}
						disabled={testPingId === row.id}
						class="h-7 px-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
						title="Kirim pesan simulasi dari saluran ini"
					>
						{#if testPingId === row.id}
							<Check class="h-3 w-3 text-emerald-500" />
							<span class="text-emerald-500 font-bold">Terkirim</span>
						{:else}
							<Bolt class="h-3 w-3 text-primary" />
							<span>Simulasi</span>
						{/if}
					</button>

					<!-- Hapus Saluran -->
					<button
						type="button"
						onclick={() => promptDelete(row)}
						class="h-7 w-7 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
						title="Hapus saluran ini dari direktori"
					>
						<Trash class="h-3.5 w-3.5" />
					</button>
				</div>
			{/if}
		{/snippet}
	</DataTable>

	<!-- ========================================================================= -->
	<!-- MODAL: TAMBAH SALURAN / KONTAK BARU                                       -->
	<!-- ========================================================================= -->
	{#if isAddModalOpen}
		<div 
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
			role="dialog"
			aria-modal="true"
		>
			<div 
				class="w-full max-w-lg rounded-2xl bg-card border border-border text-card-foreground shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
			>
				<!-- Modal Header -->
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-2.5">
						<div class="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
							<UserPlus class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">Tambah Saluran Ingress Baru</h3>
							<p class="text-xs text-muted-foreground">Daftarkan grup atau kontak perorangan ke whitelist direktori.</p>
						</div>
					</div>
					<button 
						type="button"
						onclick={() => isAddModalOpen = false}
						class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
					>
						<XMark class="h-4 w-4" />
					</button>
				</div>

				<!-- Form Error Alert -->
				{#if formError}
					<div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
						<ExclamationTriangle class="h-4 w-4 shrink-0" />
						<span>{formError}</span>
					</div>
				{/if}

				<!-- Form Inputs -->
				<div class="space-y-4 text-xs font-sans">
					<!-- Tipe Saluran -->
					<div class="space-y-1.5">
						<label class="block font-semibold text-foreground">Tipe Saluran Ingress</label>
						<div class="grid grid-cols-2 gap-2">
							<button
								type="button"
								onclick={() => newContact.type = "GROUP"}
								class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 {newContact.type === 'GROUP' ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'}"
							>
								<UserGroup class="h-4 w-4" />
								<div>
									<div class="font-semibold text-xs">Grup Cabang / Divisi</div>
									<div class="text-[10px] opacity-75">Target: @g.us</div>
								</div>
							</button>

							<button
								type="button"
								onclick={() => newContact.type = "INDIVIDUAL"}
								class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 {newContact.type === 'INDIVIDUAL' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-2xs' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'}"
							>
								<User class="h-4 w-4" />
								<div>
									<div class="font-semibold text-xs">Kontak Hotline PIC</div>
									<div class="text-[10px] opacity-75">Target: @s.whatsapp.net</div>
								</div>
							</button>
						</div>
					</div>

					<!-- Platform -->
					<div class="space-y-1.5">
						<label class="block font-semibold text-foreground">Platform Pesan</label>
						<select
							bind:value={newContact.platform}
							class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						>
							<option value="whatsapp">WhatsApp (Baileys Hook)</option>
							<option value="telegram">Telegram Bot API</option>
							<option value="discord">Discord Webhook</option>
							<option value="slack">Slack Enterprise</option>
						</select>
					</div>

					<!-- Nama Saluran / Identitas -->
					<div class="space-y-1.5">
						<label class="block font-semibold text-foreground">Nama Saluran / Identitas Resmi</label>
						<input
							type="text"
							bind:value={newContact.name}
							placeholder={newContact.type === 'GROUP' ? 'mis. Ops Cabang Semarang & Gudang' : 'mis. Budi Wicaksono (Lead AR Finance)'}
							class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						/>
					</div>

					<!-- JID / Chat ID Identifier -->
					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<label class="font-semibold text-foreground">JID / Identifier Saluran</label>
							<span class="text-[10px] font-mono text-muted-foreground">
								{newContact.type === 'GROUP' ? 'Format WA: 120363xxx@g.us' : 'Format WA: 6281xxx@s.whatsapp.net'}
							</span>
						</div>
						<input
							type="text"
							bind:value={newContact.jidOrChatId}
							placeholder={newContact.type === 'GROUP' ? '120363028192837492@g.us' : '6281234567890'}
							class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						/>
					</div>

					<!-- Cabang & Regional -->
					<div class="space-y-1.5">
						<label class="block font-semibold text-foreground">Cabang / Regional Hub</label>
						<input
							type="text"
							bind:value={newContact.branch}
							placeholder="mis. Jawa Tengah (Semarang Hub) / Head Office"
							class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						/>
					</div>

					<!-- Contact Person & Telepon -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<label class="block font-semibold text-foreground">Nama PIC / Penanggung Jawab</label>
							<input
								type="text"
								bind:value={newContact.contactPerson}
								placeholder="mis. Budi Wicaksono"
								class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
							/>
						</div>
						<div class="space-y-1.5">
							<label class="block font-semibold text-foreground">Nomor Telepon / Handle</label>
							<input
								type="text"
								bind:value={newContact.contactPhone}
								placeholder="+62 812-3456-7890"
								class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
							/>
						</div>
					</div>

					<!-- Whitelist Intake Switch -->
					<div class="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between">
						<div>
							<div class="font-semibold text-foreground">Otomatiskan Whitelist Intake</div>
							<div class="text-[11px] text-muted-foreground">Pesan yang masuk dari saluran ini langsung diproses Guardrail.</div>
						</div>
						<input 
							type="checkbox" 
							bind:checked={newContact.isWhitelisted} 
							class="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
						/>
					</div>
				</div>

				<!-- Modal Footer -->
				<div class="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
					<button
						type="button"
						onclick={() => isAddModalOpen = false}
						class="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
					>
						Batal
					</button>
					<button
						type="button"
						onclick={saveContact}
						class="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
					>
						<Check class="h-4 w-4" />
						<span>Simpan Saluran</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- MODAL: KONFIRMASI HAPUS SALURAN                                           -->
	<!-- ========================================================================= -->
	{#if isDeleteModalOpen && channelToDelete}
		<div 
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
			role="dialog"
			aria-modal="true"
		>
			<div 
				class="w-full max-w-md rounded-2xl bg-card border border-border text-card-foreground shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
			>
				<div class="flex items-center gap-3">
					<div class="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold shrink-0">
						<Trash class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Hapus Saluran dari Direktori?</h3>
						<p class="text-xs text-muted-foreground">Tindakan ini akan mencabut izin saluran dari ingress filter.</p>
					</div>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/50 border border-border/60 text-xs space-y-1.5">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Nama Saluran:</span>
						<strong class="text-foreground">{channelToDelete.name}</strong>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Tipe / Platform:</span>
						<span class="font-mono">{channelToDelete.type} ({channelToDelete.platform})</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">JID / ID:</span>
						<span class="font-mono text-muted-foreground">{channelToDelete.jidOrChatId}</span>
					</div>
				</div>

				<p class="text-xs text-rose-600 dark:text-rose-400">
					⚠️ Pesan masuk atau gambar faktur dari saluran ini selanjutnya akan diabaikan dan tidak dibuatkan tiket staging.
				</p>

				<div class="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
					<button
						type="button"
						onclick={() => isDeleteModalOpen = false}
						class="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
					>
						Batal
					</button>
					<button
						type="button"
						onclick={confirmDelete}
						class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
					>
						<Trash class="h-3.5 w-3.5" />
						<span>Ya, Hapus Saluran</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
