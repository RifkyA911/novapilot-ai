<script lang="ts">
	import { 
		UserGroup, 
		MagnifyingGlass, 
		ChatBubbleLeftRight, 
		ShieldCheck, 
		CheckCircle, 
		Plus, 
		Bolt, 
		ArrowPath, 
		Check, 
		Phone,
		BuildingOffice2,
		Envelope
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";

	interface GroupContact {
		id: string;
		name: string;
		branch: string;
		platform: "whatsapp" | "telegram" | "discord" | "slack";
		jidOrChatId: string;
		isWhitelisted: boolean;
		adminName: string;
		adminContact: string;
		totalMessages: number;
		lastActivity: string;
	}

	let searchQuery = $state("");
	let selectedPlatform = $state<"ALL" | "whatsapp" | "telegram" | "discord" | "slack">("ALL");
	let testPingGroup = $state<string | null>(null);

	// Whitelisted regional branch contacts (labeled DUMMY)
	let groups = $state<GroupContact[]>([
		{
			id: "grp_1",
			name: "Ops Cabang Surabaya & Gudang Timur",
			branch: "Jawa Timur (Surabaya)",
			platform: "whatsapp",
			jidOrChatId: "120363028192837492@g.us",
			isWhitelisted: true,
			adminName: "Bambang Santoso (Kepala Gudang)",
			adminContact: "+62 812-3456-7890",
			totalMessages: 184,
			lastActivity: "12 menit yang lalu"
		},
		{
			id: "grp_2",
			name: "Logistik Medan Priority & Distribusi",
			branch: "Sumatera Utara (Medan)",
			platform: "whatsapp",
			jidOrChatId: "120363098172635412@g.us",
			isWhitelisted: true,
			adminName: "Hendra Wijaya (Supervisor Logistik)",
			adminContact: "+62 813-8821-4910",
			totalMessages: 92,
			lastActivity: "45 menit yang lalu"
		},
		{
			id: "grp_3",
			name: "Finansial Kantor Pusat Jakarta",
			branch: "DKI Jakarta (Head Office)",
			platform: "whatsapp",
			jidOrChatId: "120363012938475610@g.us",
			isWhitelisted: true,
			adminName: "Dewi Lestari (Lead AR/AP)",
			adminContact: "+62 811-9283-7411",
			totalMessages: 312,
			lastActivity: "5 menit yang lalu"
		},
		{
			id: "grp_4",
			name: "Plant Operations Cikarang II",
			branch: "Jawa Barat (Cikarang)",
			platform: "whatsapp",
			jidOrChatId: "120363077889900112@g.us",
			isWhitelisted: true,
			adminName: "Agus Pratama (Plant Manager)",
			adminContact: "+62 821-7788-9900",
			totalMessages: 145,
			lastActivity: "2 jam yang lalu"
		},
		{
			id: "grp_5",
			name: "Telegram On-Call Incident Alerts",
			branch: "Nasional (IT Operations)",
			platform: "telegram",
			jidOrChatId: "-100192837482",
			isWhitelisted: true,
			adminName: "Rudi Hartono (IT Lead)",
			adminContact: "@rudi_oncall",
			totalMessages: 78,
			lastActivity: "1 jam yang lalu"
		},
		{
			id: "grp_6",
			name: "Discord #warehouse-ops Guild",
			branch: "Regional Warehouse Support",
			platform: "discord",
			jidOrChatId: "channel_119283749281920195",
			isWhitelisted: true,
			adminName: "DevOps Bot Automation",
			adminContact: "bot#1049",
			totalMessages: 54,
			lastActivity: "3 jam yang lalu"
		},
		{
			id: "grp_7",
			name: "Slack #it-helpdesk Enterprise",
			branch: "Kantor Pusat Jakarta",
			platform: "slack",
			jidOrChatId: "C0819283ABC",
			isWhitelisted: true,
			adminName: "IT Support Escalation",
			adminContact: "U06ABC1234",
			totalMessages: 110,
			lastActivity: "30 menit yang lalu"
		}
	]);

	let filteredGroups = $derived(
		groups.filter(g => {
			if (selectedPlatform !== "ALL" && g.platform !== selectedPlatform) return false;
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				g.name.toLowerCase().includes(q) ||
				g.branch.toLowerCase().includes(q) ||
				g.adminName.toLowerCase().includes(q) ||
				g.jidOrChatId.toLowerCase().includes(q)
			);
		})
	);

	async function pingGroup(g: GroupContact) {
		testPingGroup = g.id;
		try {
			await fetch("/api/inbound-messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					platform: g.platform,
					sender_id: g.jidOrChatId,
					sender_name: `${g.name} (${g.adminName})`,
					raw_message: `Test Ping dari Direktori Kontak [${g.branch}]: Tolong verifikasi nota INV/2026/001 customer PT Sumber Makmur.`,
					media_type: "text",
					classification: "ACTIONABLE",
					extracted_doc: "INV/2026/001",
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					extracted_target: "PT Sumber Makmur Sejahtera"
				})
			});
			cockpit.recordPlatformEvent(g.platform);
		} catch (e) {
			console.error(e);
		} finally {
			setTimeout(() => { testPingGroup = null; }, 1500);
		}
	}
</script>

<svelte:head>
	<title>Group Contacts & Regional Directory • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">

	<!-- ========================================================================= -->
	<!-- 1. HEADER & DUMMY PREVIEW BADGE                                           -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5 flex-wrap">
				<div class="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shadow-xs">
					<UserGroup class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
						Omnichannel Group Contacts &amp; Regional Directory
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
							[DUMMY / PREVIEW]
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Daftar grup WhatsApp cabang, saluran Telegram, Discord, dan Slack yang terdaftar dalam whitelist intake otomatis NovaPilot AI.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 2. FILTER & SEARCH BAR                                                    -->
	<!-- ========================================================================= -->
	<div class="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
		<!-- Search -->
		<div class="relative flex-1">
			<MagnifyingGlass class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Cari nama grup, cabang regional, JID WhatsApp, atau kontak penanggung jawab..."
				class="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary/50 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
			/>
		</div>

		<!-- Platform Filter -->
		<div class="flex items-center gap-1 bg-secondary/40 p-1 rounded-lg border border-border text-xs font-mono">
			{#each [
				{ id: "ALL", label: "Semua Platform" },
				{ id: "whatsapp", label: "WhatsApp" },
				{ id: "telegram", label: "Telegram" },
				{ id: "discord", label: "Discord" },
				{ id: "slack", label: "Slack" }
			] as item}
				<button
					type="button"
					onclick={() => selectedPlatform = item.id as any}
					class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer {selectedPlatform === item.id ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'}"
				>
					{item.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. GROUPS DIRECTORY GRID                                                  -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each filteredGroups as group}
			<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5 hover:border-primary/40 transition-colors">
				<!-- Card Header -->
				<div class="flex items-start justify-between gap-3">
					<div class="flex items-center gap-2.5">
						<div class="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border {group.platform === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : group.platform === 'telegram' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' : group.platform === 'discord' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}">
							{#if group.platform === 'whatsapp'}
								WA
							{:else if group.platform === 'telegram'}
								TG
							{:else if group.platform === 'discord'}
								DC
							{:else}
								SL
							{/if}
						</div>
						<div class="min-w-0">
							<h3 class="text-sm font-bold text-foreground truncate">{group.name}</h3>
							<p class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
								<BuildingOffice2 class="h-3.5 w-3.5" />
								<span>{group.branch}</span>
							</p>
						</div>
					</div>

					<!-- Whitelist Badge -->
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
						WHITELIST
					</span>
				</div>

				<!-- JID / Chat ID Detail -->
				<div class="p-2.5 rounded-xl bg-secondary/40 border border-border/50 font-mono text-[11px] space-y-1">
					<div class="text-muted-foreground flex items-center justify-between">
						<span>Identifier / JID:</span>
						<span class="text-foreground font-semibold truncate max-w-[170px]" title={group.jidOrChatId}>{group.jidOrChatId}</span>
					</div>
					<div class="text-muted-foreground flex items-center justify-between">
						<span>Pesan Tercatat:</span>
						<span class="text-primary font-bold">{group.totalMessages} chat</span>
					</div>
				</div>

				<!-- Admin Contact Information -->
				<div class="space-y-1 text-xs">
					<div class="text-muted-foreground text-[11px]">Penanggung Jawab Cabang:</div>
					<div class="font-medium text-foreground flex items-center justify-between">
						<span>{group.adminName}</span>
						<span class="font-mono text-[11px] text-muted-foreground">{group.adminContact}</span>
					</div>
				</div>

				<!-- Footer with Test Ping Action -->
				<div class="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
					<span class="text-muted-foreground text-[11px]">Aktif: {group.lastActivity}</span>
					<button
						type="button"
						onclick={() => pingGroup(group)}
						class="h-7 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-semibold text-foreground flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
					>
						{#if testPingGroup === group.id}
							<Check class="h-3.5 w-3.5 text-emerald-500" />
							<span class="text-emerald-500 font-bold">Terkirim</span>
						{:else}
							<Bolt class="h-3.5 w-3.5 text-primary" />
							<span>Simulasi Chat</span>
						{/if}
					</button>
				</div>
			</div>
		{/each}
	</div>

</div>
