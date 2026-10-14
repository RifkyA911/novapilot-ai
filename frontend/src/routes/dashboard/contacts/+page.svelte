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
		ClipboardDocument
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

		<!-- Quick Status Link -->
		<div class="flex items-center gap-2 font-mono text-xs">
			<a
				href="/flow"
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
			>
				<CommandLine class="h-3.5 w-3.5 text-primary" />
				<span>Lihat Alur E2E Flow</span>
			</a>
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
					<button
						type="button"
						onclick={() => pingChannel(row)}
						disabled={testPingId === row.id}
						class="h-7 px-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
					>
						{#if testPingId === row.id}
							<Check class="h-3 w-3 text-emerald-500" />
							<span class="text-emerald-500 font-bold">Terkirim</span>
						{:else}
							<Bolt class="h-3 w-3 text-primary" />
							<span>Simulasi</span>
						{/if}
					</button>
				</div>
			{/if}
		{/snippet}
	</DataTable>
</div>
