<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { 
		ShieldCheck, 
		CommandLine, 
		Clock, 
		ChartBarSquare, 
		CircleStack, 
		CpuChip, 
		CodeBracket, 
		PaperAirplane, 
		MagnifyingGlass, 
		ChevronDoubleLeft, 
		ChevronDoubleRight, 
		Bars3, 
		XMark, 
		Square3Stack3d, 
		ArrowRightOnRectangle,
		ArrowTopRightOnSquare,
		ChatBubbleLeftRight
	} from "svelte-heros-v2";
	import ThemeToggle from "$lib/components/ThemeToggle.svelte";
	import UserNav from "$lib/components/UserNav.svelte";
	import CommandPalette from "$lib/components/CommandPalette.svelte";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";
	import type { LayoutData } from "./$types";

	let { data, children }: { data: LayoutData; children: any } = $props();
	let currentPath: string = $derived($page.url.pathname);
	let user = $derived(data.user);

	// Sidebar Collapsed State (Full-height 1-level layout)
	let sidebarCollapsed = $state(false);

	// Command Search Palette State
	let commandOpen = $state(false);

	// Mobile Navigation Sheet
	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === "k") {
			e.preventDefault();
			commandOpen = !commandOpen;
		}
	}

	onMount(() => {
		cockpit.setupSSE();
		cockpit.fetchTickets();
		cockpit.fetchAuditLogs();
		cockpit.fetchTelemetry();
	});

	onDestroy(() => {
		cockpit.closeSSE();
	});
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<!-- Interactive Command Menu Search Palette -->
<CommandPalette bind:open={commandOpen} />

<div class="min-h-screen flex bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
	<!-- ========================================================================= -->
	<!-- 1. FULL-HEIGHT PROTECTED APP SIDEBAR (1 Level with Navbar)                -->
	<!-- ========================================================================= -->
	<aside 
		class="sticky top-0 h-screen shrink-0 border-r border-border bg-card/75 backdrop-blur-xl hidden lg:flex flex-col transition-all duration-300 z-40 {sidebarCollapsed ? 'w-16' : 'w-64'}"
	>
		<!-- Sidebar Top: Brand Logo & Title (Collapses to Logo only) -->
		<div class="h-16 flex items-center {sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'} border-b border-border/50 shrink-0">
			<a 
				href="/dashboard" 
				class="flex items-center gap-3 group focus:outline-none overflow-hidden" 
				aria-label="NovaPilot Cockpit Home"
				title={sidebarCollapsed ? "NovaPilot AI" : undefined}
			>
				<!-- Brand Logo Icon: Always Visible -->
				<div class="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/25 shrink-0 group-hover:scale-105 group-hover:shadow-primary/40 transition-all duration-200">
					<ShieldCheck class="h-5 w-5" />
				</div>
				
				<!-- Brand Name Text: Only Visible When Expanded -->
				{#if !sidebarCollapsed}
					<div class="flex flex-col min-w-0 transition-opacity duration-200">
						<div class="flex items-center gap-1.5 leading-none">
							<span class="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
								NovaPilot
							</span>
							<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-mono font-bold">
								AI
							</span>
							<span class="text-[9px] px-1 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
								BETA
							</span>
						</div>
						<span class="text-[10px] text-muted-foreground uppercase tracking-wider font-mono font-medium mt-0.5">
							ChatOps Gatekeeper
						</span>
					</div>
				{/if}
			</a>

			<!-- Collapse Toggle Button (When Expanded) -->
			{#if !sidebarCollapsed}
				<button
					type="button"
					onclick={() => sidebarCollapsed = true}
					class="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-xs cursor-pointer"
					title="Collapse Sidebar"
				>
					<ChevronDoubleLeft class="h-4 w-4" />
				</button>
			{/if}
		</div>

		<!-- Expand Button (When Collapsed) -->
		{#if sidebarCollapsed}
			<div class="py-2 flex justify-center border-b border-border/40">
				<button
					type="button"
					onclick={() => sidebarCollapsed = false}
					class="h-7 w-7 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-xs cursor-pointer"
					title="Expand Sidebar"
				>
					<ChevronDoubleRight class="h-3.5 w-3.5" />
				</button>
			</div>
		{/if}

		<!-- Navigation Menu Links -->
		<div class="flex-1 overflow-y-auto px-3 py-4 space-y-4">
			<!-- Group 1: OPERATIONS -->
			<div class="space-y-1">
				{#if !sidebarCollapsed}
					<div class="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
						Operations
					</div>
				{/if}

				<!-- Dashboard Overview -->
				<a
					href="/dashboard"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg text-xs font-medium transition-all {currentPath === '/dashboard' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					title="Dashboard Overview"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<CommandLine class="h-4 w-4 shrink-0" />
						{#if !sidebarCollapsed}
							<span class="truncate">Cockpit Overview</span>
						{/if}
					</div>
				</a>

				<!-- Approval Queue -->
				<a
					href="/dashboard/queue"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg text-xs font-medium transition-all {currentPath === '/dashboard/queue' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					title="Approval Queue"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<Clock class="h-4 w-4 shrink-0" />
						{#if !sidebarCollapsed}
							<span class="truncate">Approval Queue</span>
						{/if}
					</div>
					{#if cockpit.pendingCount > 0}
						<span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 {currentPath === '/dashboard/queue' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}">
							{cockpit.pendingCount}
						</span>
					{/if}
				</a>

				<!-- Execution History -->
				<a
					href="/dashboard/history"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg text-xs font-medium transition-all {currentPath === '/dashboard/history' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					title="Execution History & Audit Log"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<ChartBarSquare class="h-4 w-4 shrink-0" />
						{#if !sidebarCollapsed}
							<span class="truncate">Execution History</span>
						{/if}
					</div>
				</a>
			</div>

			<!-- Group 2: DATABASES & TELEMETRY -->
			<div class="space-y-1">
				{#if !sidebarCollapsed}
					<div class="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
						Databases & Telemetry
					</div>
				{/if}

				<!-- DB Connectors (Universal Enterprise LTS) -->
				<a
					href="/dashboard/connectors"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg text-xs font-medium transition-all {currentPath === '/dashboard/connectors' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					title="Universal DB Connectors (Multi-Engine Enterprise LTS)"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<CircleStack class="h-4 w-4 shrink-0 {currentPath === '/dashboard/connectors' ? '' : 'text-amber-500'}" />
						{#if !sidebarCollapsed}
							<span class="truncate">DB Connectors</span>
						{/if}
					</div>
					{#if !sidebarCollapsed}
						<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase tracking-wider {currentPath === '/dashboard/connectors' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'}">
							LTS
						</span>
					{/if}
				</a>

				<!-- System Telemetry & Probes -->
				<a
					href="/dashboard/connectivity"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg text-xs font-medium transition-all {currentPath === '/dashboard/connectivity' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					title="System Telemetry & Platform Probes"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<CpuChip class="h-4 w-4 shrink-0 {currentPath === '/dashboard/connectivity' ? '' : 'text-blue-500'}" />
						{#if !sidebarCollapsed}
							<span class="truncate">System Telemetry</span>
						{/if}
					</div>
				</a>
			</div>

			<!-- Group 3: CHATOPS GATEWAYS -->
			<div class="space-y-1">
				{#if !sidebarCollapsed}
					<div class="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
						ChatOps Gateways
					</div>
				{/if}

				<!-- Client Hook Flows -->
				<a
					href="/dashboard/hooks"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg text-xs font-medium transition-all {currentPath === '/dashboard/hooks' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					title="Client Hook Flows"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<CodeBracket class="h-4 w-4 shrink-0 {currentPath === '/dashboard/hooks' ? '' : 'text-purple-500'}" />
						{#if !sidebarCollapsed}
							<span class="truncate">Client Hook Flows</span>
						{/if}
					</div>
					{#if !sidebarCollapsed}
						<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
							{cockpit.chatPlatform}
						</span>
					{/if}
				</a>

				<!-- ChatOps Simulator -->
				<a
					href="/dashboard/simulator"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-2 rounded-lg text-xs font-medium transition-all {currentPath === '/dashboard/simulator' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					title="ChatOps Ingestion Simulator"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<PaperAirplane class="h-4 w-4 shrink-0" />
						{#if !sidebarCollapsed}
							<span class="truncate">Simulator</span>
						{/if}
					</div>
				</a>
			</div>

			<!-- Group 4: PUBLIC PORTAL (Links back to public website) -->
			<div class="space-y-1 pt-2 border-t border-border/40">
				{#if !sidebarCollapsed}
					<div class="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
						Public Portal
					</div>
				{/if}

				<a
					href="/"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
					title="Public Overview (Home /)"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<ShieldCheck class="h-3.5 w-3.5 shrink-0 opacity-70" />
						{#if !sidebarCollapsed}
							<span class="truncate">Public Home (/)</span>
						{/if}
					</div>
					{#if !sidebarCollapsed}
						<ArrowTopRightOnSquare class="h-3 w-3 opacity-50" />
					{/if}
				</a>

				<a
					href="/flow"
					class="w-full flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
					title="System Flow (/flow)"
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<Square3Stack3d class="h-3.5 w-3.5 shrink-0 text-emerald-500 opacity-80" />
						{#if !sidebarCollapsed}
							<span class="truncate">Public Flow (/flow)</span>
						{/if}
					</div>
					{#if !sidebarCollapsed}
						<ArrowTopRightOnSquare class="h-3 w-3 opacity-50" />
					{/if}
				</a>
			</div>
		</div>

		<!-- Sidebar Bottom: Honest Platform Connection Status -->
		<div class="p-3 border-t border-border/50 shrink-0">
			{#if !sidebarCollapsed}
				<div class="p-2.5 rounded-xl bg-secondary/40 border border-border/40 text-[11px] font-mono space-y-1.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-foreground flex items-center gap-1.5">
							<span class="h-2 w-2 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
							{cockpit.platformStatuses[cockpit.chatPlatform].name}
						</span>
						<span class="text-[9px] px-1.5 py-0.2 rounded font-bold {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}">
							{cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'LIVE' : 'AWAITING HOOK'}
						</span>
					</div>
					<div class="text-[10px] text-muted-foreground line-clamp-1">
						{cockpit.platformStatuses[cockpit.chatPlatform].eventsCaptured > 0 ? `${cockpit.platformStatuses[cockpit.chatPlatform].eventsCaptured} events captured` : "0 hook packets received"}
					</div>
				</div>
			{:else}
				<div class="flex justify-center" title="{cockpit.platformStatuses[cockpit.chatPlatform].name}: {cockpit.platformStatuses[cockpit.chatPlatform].status}">
					<div class="relative flex h-3 w-3">
						<span class="h-3 w-3 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
					</div>
				</div>
			{/if}
		</div>
	</aside>

	<!-- ========================================================================= -->
	<!-- 2. MAIN COCKPIT AREA: CENTERED SEARCH NAVBAR + CONTENT + FOOTER           -->
	<!-- ========================================================================= -->
	<div class="flex-1 flex flex-col min-w-0 min-h-screen">
		<!-- Top Dashboard Header Bar -->
		<header class="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sm:px-6 gap-3 transition-colors">
			<!-- Left: Mobile Brand & Toggle -->
			<div class="flex items-center gap-2 shrink-0">
				<!-- Mobile Hamburger Button -->
				<button
					type="button"
					onclick={toggleMobileMenu}
					class="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 transition-colors"
					aria-label="Toggle Navigation Menu"
				>
					{#if mobileMenuOpen}
						<XMark class="h-5 w-5" />
					{:else}
						<Bars3 class="h-5 w-5" />
					{/if}
				</button>

				<!-- Mobile Brand Display -->
				<a href="/dashboard" class="lg:hidden flex items-center gap-2" aria-label="NovaPilot Home">
					<div class="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
						<ShieldCheck class="h-4 w-4" />
					</div>
					<span class="font-bold text-sm tracking-tight text-foreground">NovaPilot AI</span>
				</a>
			</div>

			<!-- Center: CENTERED SEARCH MENU COMMAND PALETTE BUTTON (⌘K) -->
			<div class="flex-1 flex justify-center max-w-md mx-auto px-2">
				<button
					type="button"
					onclick={() => commandOpen = true}
					class="w-full max-w-sm flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs shadow-xs transition-colors cursor-pointer"
					title="Search menus, tickets, docs... (Ctrl+K / ⌘K)"
				>
					<span class="flex items-center gap-2 truncate">
						<MagnifyingGlass class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
						<span class="hidden sm:inline truncate">Search menus, tickets, docs...</span>
						<span class="sm:hidden">Search...</span>
					</span>
					<kbd class="ml-2 inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground shrink-0">
						⌘K
					</kbd>
				</button>
			</div>

			<!-- Right: CHATOPS PLATFORM SELECTOR, THEME TOGGLE & SIMPLIFIED USER AVATAR -->
			<div class="flex items-center gap-2 sm:gap-2.5 shrink-0">
				<!-- ChatOps Platform Selector Dropdown (WA, TG, Discord, Slack) -->
				<div class="flex items-center">
					<select
						bind:value={cockpit.chatPlatform}
						class="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
						title="Select Active ChatOps Ingestion Platform"
					>
						<option value="whatsapp">💬 WhatsApp (Live Hook)</option>
						<option value="telegram">✈️ Telegram Bot</option>
						<option value="discord">🎮 Discord Webhook</option>
						<option value="slack">💼 Slack Enterprise</option>
					</select>
				</div>

				<!-- Theme Toggle -->
				<ThemeToggle />

				<!-- Simplified Circular Avatar UserNav -->
				<div class="pl-1 sm:pl-1.5 border-l border-border/50">
					<UserNav {user} />
				</div>
			</div>
		</header>

		<!-- Mobile Navigation Drawer -->
		{#if mobileMenuOpen}
			<div class="lg:hidden border-b border-border/60 bg-card/95 backdrop-blur-xl px-4 py-4 space-y-4 animate-in slide-in-from-top-3 duration-200">
				<!-- Mobile Platform Select -->
				<div class="space-y-1">
					<div class="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">ChatOps Platform</div>
					<select
						bind:value={cockpit.chatPlatform}
						class="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold text-foreground shadow-xs"
					>
						<option value="whatsapp">💬 WhatsApp (Live Hook)</option>
						<option value="telegram">✈️ Telegram Bot</option>
						<option value="discord">🎮 Discord Webhook</option>
						<option value="slack">💼 Slack Enterprise</option>
					</select>
				</div>

				<!-- Mobile Navigation Links -->
				<div class="space-y-1">
					<div class="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">Operations</div>

					<a
						href="/dashboard"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg {currentPath === '/dashboard' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<CommandLine class="h-4 w-4 text-primary" />
							<span>Cockpit Overview</span>
						</span>
						<span class="font-mono text-[10px]">/dashboard</span>
					</a>

					<a
						href="/dashboard/queue"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg {currentPath === '/dashboard/queue' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<Clock class="h-4 w-4 text-amber-500" />
							<span>Approval Queue</span>
						</span>
						{#if cockpit.pendingCount > 0}
							<span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500">
								{cockpit.pendingCount}
							</span>
						{/if}
					</a>

					<a
						href="/dashboard/history"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg {currentPath === '/dashboard/history' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<ChartBarSquare class="h-4 w-4" />
							<span>Execution History</span>
						</span>
					</a>

					<a
						href="/dashboard/connectors"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg {currentPath === '/dashboard/connectors' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<CircleStack class="h-4 w-4 text-amber-500" />
							<span>DB Connectors (LTS)</span>
						</span>
					</a>

					<a
						href="/dashboard/connectivity"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg {currentPath === '/dashboard/connectivity' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<CpuChip class="h-4 w-4 text-blue-500" />
							<span>System Telemetry</span>
						</span>
					</a>

					<a
						href="/dashboard/hooks"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg {currentPath === '/dashboard/hooks' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<CodeBracket class="h-4 w-4 text-purple-500" />
							<span>Client Hook Flows</span>
						</span>
					</a>

					<a
						href="/dashboard/simulator"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg {currentPath === '/dashboard/simulator' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<PaperAirplane class="h-4 w-4" />
							<span>ChatOps Simulator</span>
						</span>
					</a>

					<div class="pt-2 px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">Public Website</div>

					<a
						href="/"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary"
					>
						<span>Public Home (/)</span>
					</a>

					<a
						href="/flow"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary"
					>
						<span>System Flow (/flow)</span>
					</a>
				</div>
			</div>
		{/if}

		<!-- Main Content Slot -->
		<main class="flex-1 flex flex-col min-w-0">
			{@render children()}
		</main>

		<!-- Minimal Enterprise Footer -->
		<footer class="border-t border-border/40 py-5 text-xs text-muted-foreground bg-card/20 transition-colors mt-auto">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex flex-wrap items-center gap-2 font-mono text-[11px]">
					<span class="font-semibold text-foreground">NovaPilot AI Cockpit</span>
					<span>•</span>
					<span>Protected On-Call Session</span>
					<span>•</span>
					<span>Zero Raw SQL Certified</span>
				</div>
				<div class="flex items-center gap-3 text-[11px] font-mono">
					<span class="text-foreground font-medium flex items-center gap-1.5">
						<span class="h-1.5 w-1.5 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
						Platform: {cockpit.platformStatuses[cockpit.chatPlatform].name}
					</span>
					<span>•</span>
					<span>Universal LTS Multi-Engine</span>
				</div>
			</div>
		</footer>
	</div>
</div>
