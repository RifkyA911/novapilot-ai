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
		ChatBubbleLeftRight,
		AdjustmentsHorizontal,
		Sparkles,
		UserGroup,
		DocumentText,
		Cube,
		InformationCircle,
		Cog6Tooth
	} from "svelte-heros-v2";
	import ThemeToggle from "$lib/components/ThemeToggle.svelte";
	import SoundToggle from "$lib/components/SoundToggle.svelte";
	import LocaleToggle from "$lib/components/LocaleToggle.svelte";
	import UiModeToggle from "$lib/components/UiModeToggle.svelte";
	import UserNav from "$lib/components/UserNav.svelte";
	import CommandPalette from "$lib/components/CommandPalette.svelte";
	import PlatformSelect from "$lib/components/PlatformSelect.svelte";
	import { sound } from "$lib/audio";
	import { i18n } from "$lib/i18n.svelte";
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
		if (e.key === "Escape" && mobileMenuOpen) {
			mobileMenuOpen = false;
		}
	}

	// Unified Navigation Items Structure (Shared between Desktop & Mobile)
	// Reactive to language changes (i18n) and service status
	const navGroups = $derived([
		{
			title: i18n.t.nav.operations,
			items: [
				{
					href: "/dashboard",
					label: i18n.t.nav.overview,
					icon: CommandLine,
					iconColor: "text-primary",
					title: "Operations Dashboard Overview"
				},
				{
					href: "/dashboard/cockpit",
					label: i18n.t.nav.cockpit,
					icon: Sparkles,
					iconColor: "text-purple-500",
					title: "Cockpit Overview & AI Analytics",
					badge: "DMY",
					badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
				},
				{
					href: "/dashboard/queue",
					label: i18n.t.nav.queue,
					icon: Clock,
					iconColor: "text-amber-500",
					title: "Approval Queue",
					count: cockpit.pendingCount
				},
				{
					href: "/dashboard/history",
					label: i18n.t.nav.history,
					icon: ChartBarSquare,
					iconColor: "text-foreground",
					title: "Execution History & Audit Log"
				}
			]
		},
		{
			title: i18n.t.nav.databases,
			items: [
				{
					href: "/dashboard/connectors",
					label: i18n.t.nav.connectors,
					icon: CircleStack,
					iconColor: "text-amber-500",
					title: "Database Configuration & Setup",
					badge: !cockpit.isDbConfigured ? "SETUP" : undefined,
					badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
				},
				{
					href: "/dashboard/mcp",
					label: i18n.t.nav.mcp,
					icon: Cube,
					iconColor: "text-cyan-500",
					title: "Model Context Protocol (MCP) Knowledge Base & Tools",
					badge: !cockpit.isMcpConfigured ? "SETUP" : undefined,
					badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
				},
				{
					href: "/dashboard/connectivity",
					label: i18n.t.nav.telemetry,
					icon: CpuChip,
					iconColor: "text-blue-500",
					title: "System Telemetry & Platform Probes"
				},
				{
					href: "/dashboard/logs",
					label: i18n.t.nav.logs,
					icon: DocumentText,
					iconColor: "text-cyan-500",
					title: "Enterprise System Logs & Daemon Telemetry"
				}
			]
		},
		{
			title: i18n.t.nav.chatops_gateways,
			items: [
				{
					href: "/dashboard/messages",
					label: i18n.t.nav.inbound,
					icon: ChatBubbleLeftRight,
					iconColor: "text-emerald-500",
					title: "Omnichannel Inbound Messages Feed",
					count: cockpit.needsReviewCount
				},
				{
					href: "/dashboard/automation",
					label: i18n.t.nav.automation,
					icon: Sparkles,
					iconColor: "text-emerald-500",
					title: "Inbound Auto-Reply Engine & Dispatch Rules"
				},
				{
					href: "/dashboard/hooks",
					label: i18n.t.nav.hooks,
					icon: CodeBracket,
					iconColor: "text-purple-500",
					title: "Client Hook Flows"
				},
				{
					href: "/dashboard/contacts",
					label: i18n.t.nav.contacts,
					icon: UserGroup,
					iconColor: "text-teal-500",
					title: "Omnichannel Group Contacts & Directory",
					badge: "DMY",
					badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
				},
				{
					href: "/dashboard/simulator",
					label: i18n.t.nav.simulator,
					icon: PaperAirplane,
					iconColor: "text-foreground",
					title: "ChatOps Ingestion Simulator [EXPERIMENTAL]",
					badge: "EXP",
					badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
				},
				{
					href: "/dashboard/platforms",
					label: i18n.t.nav.flows,
					icon: AdjustmentsHorizontal,
					iconColor: "text-sky-500",
					title: "ChatOps Platform Settings & Logic Flows",
					badge: !cockpit.isGatewayRunning ? "OFFLINE" : undefined,
					badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
				}
			]
		},
		{
			title: i18n.t.nav.settings,
			items: [
				{
					href: "/dashboard/settings",
					label: i18n.t.nav.settings,
					icon: Cog6Tooth,
					iconColor: "text-zinc-400",
					title: "System Settings & Gatekeeper Policies"
				},
				{
					href: "/dashboard/hermes",
					label: i18n.t.nav.agents_llm || "AI Agents & LLM",
					icon: CpuChip,
					iconColor: "text-sky-500",
					title: "AI Agents & Multi-Model LLM API Configuration Hub",
					badge: !cockpit.isHermesConfigured ? "CONFIG" : undefined,
					badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
				},
				{
					href: "/dashboard/about",
					label: i18n.t.nav.about,
					icon: InformationCircle,
					iconColor: "text-purple-500",
					title: "About NovaPilot AI & Creator"
				}
			]
		}
	]);

	onMount(() => {
		cockpit.initUiMode();
		cockpit.setupSSE();
		cockpit.fetchTickets();
		cockpit.fetchInboundMessages();
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

		<!-- Navigation Menu Links (Unified, Centered, & Protected) -->
		<div class="flex-1 overflow-y-auto px-2 py-4 space-y-4">
			{#each navGroups as group, gIdx}
				<div class="space-y-1">
					{#if sidebarCollapsed}
						{#if gIdx > 0}
							<div class="w-8 h-px bg-border/60 mx-auto my-2"></div>
						{/if}
					{:else}
						<div class="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
							{group.title}
						</div>
					{/if}

					{#each group.items as item}
						{@const isActive = currentPath === item.href}
						{#if sidebarCollapsed}
							<!-- Collapsed Mode: Dead-Centered 36x36px Square Box on Exact Vertical Axis -->
							<div class="flex justify-center py-0.5">
								<a
									href={item.href}
									onclick={() => sound.playNavClick()}
									class="relative h-9 w-9 rounded-xl flex items-center justify-center transition-all {isActive ? 'bg-primary text-primary-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
									title="{item.title}{item.count && item.count > 0 ? ` (${item.count} items)` : item.badge ? ` [${item.badge}]` : ''}"
								>
									<item.icon class="h-4.5 w-4.5 shrink-0 {isActive ? '' : item.iconColor || ''}" />

									<!-- Notification Badge on Top-Right Corner (Fixed Absolute, Never Displaces the Centerline) -->
									{#if item.count && item.count > 0}
										<span class="absolute -top-1 -right-1 min-w-[17px] h-4 px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center bg-amber-500 text-white shadow-xs ring-2 ring-card animate-pulse leading-none">
											{item.count > 99 ? '99+' : item.count}
										</span>
									{/if}
								</a>
							</div>
						{:else}
							<!-- Expanded Mode: Full Width Row with Label and Side Badge -->
							<a
								href={item.href}
								onclick={() => sound.playNavClick()}
								class="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all {isActive ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
								title={item.title}
							>
								<div class="flex items-center gap-2.5 min-w-0">
									<item.icon class="h-4 w-4 shrink-0 {isActive ? '' : item.iconColor || ''}" />
									<span class="truncate">{item.label}</span>
								</div>
								{#if item.count && item.count > 0}
									<span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 {isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}">
										{item.count}
									</span>
								{:else if item.badge}
									<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase tracking-wider {isActive ? 'bg-primary-foreground/20 text-primary-foreground' : item.badgeColor || 'bg-secondary text-muted-foreground border border-border'}">
										{item.badge}
									</span>
								{/if}
							</a>
						{/if}
					{/each}
				</div>
			{/each}
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
			<!-- Left: Mobile Brand & Toggle + Shadcn Platform Selector (To the left of Search Input) -->
			<div class="flex items-center gap-2.5 shrink-0">
				<!-- Mobile Hamburger Button -->
				<button
					type="button"
					onclick={toggleMobileMenu}
					class="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 transition-colors cursor-pointer"
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
					<span class="font-bold text-sm tracking-tight text-foreground hidden sm:inline">NovaPilot</span>
				</a>

				<!-- Shadcn Platform Select Component (Positioned to the left of Search Bar) -->
				<PlatformSelect />
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
						<span class="hidden sm:inline truncate">{i18n.t.actions.search}</span>
						<span class="sm:hidden">{i18n.t.actions.search}</span>
					</span>
					<kbd class="ml-2 inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground shrink-0">
						⌘K
					</kbd>
				</button>
			</div>

			<!-- Right: UI MODE TOGGLE, LOCALE TOGGLE, SOUND TOGGLE, THEME TOGGLE & USER AVATAR WITH NAME & ROLE -->
			<div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
				<!-- Pro vs Compact Lite Density Switcher -->
				<UiModeToggle />

				<!-- Language Switcher (Intl ID/EN) -->
				<LocaleToggle />

				<!-- Corporate AI Sound Toggle -->
				<SoundToggle />

				<!-- Theme Toggle -->
				<ThemeToggle />

				<!-- UserNav with Name, Role, and Avatar -->
				<div class="pl-1 sm:pl-1.5 border-l border-border/50">
					<UserNav {user} />
				</div>
			</div>
		</header>

		<!-- Mobile Navigation Slide-Over Drawer Sheet -->
		{#if mobileMenuOpen}
			<!-- Backdrop Overlay with Blur -->
			<div 
				class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-200"
				onclick={closeMobileMenu}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Escape' && closeMobileMenu()}
				aria-label="Close mobile navigation"
			></div>

			<!-- Slide-Over Drawer Panel -->
			<aside 
				class="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border z-50 flex flex-col shadow-2xl lg:hidden animate-in slide-in-from-left duration-200"
				aria-label="Mobile Navigation"
			>
				<!-- Drawer Header -->
				<div class="h-16 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
					<a href="/dashboard" onclick={closeMobileMenu} class="flex items-center gap-2.5">
						<div class="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/25">
							<ShieldCheck class="h-5 w-5" />
						</div>
						<div class="flex flex-col">
							<div class="flex items-center gap-1.5 leading-none">
								<span class="font-bold text-sm tracking-tight text-foreground">NovaPilot</span>
								<span class="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-mono font-bold">AI</span>
								<span class="text-[8px] px-1 py-0.2 rounded font-mono font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">BETA</span>
							</div>
							<span class="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mt-0.5">ChatOps Gatekeeper</span>
						</div>
					</a>

					<button
						type="button"
						onclick={closeMobileMenu}
						class="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
						aria-label="Close menu"
					>
						<XMark class="h-4.5 w-4.5" />
					</button>
				</div>

				<!-- Drawer Scrollable Content -->
				<div class="flex-1 overflow-y-auto px-3 py-4 space-y-4">
					<!-- Quick Search Palette Trigger in Drawer -->
					<button
						type="button"
						onclick={() => { closeMobileMenu(); commandOpen = true; }}
						class="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-border/80 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
					>
						<span class="flex items-center gap-2">
							<MagnifyingGlass class="h-4 w-4 text-muted-foreground" />
							<span>Search commands...</span>
						</span>
						<kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px]">⌘K</kbd>
					</button>

					<!-- Navigation Groups (Cleanly Styled with Active Indicator & Number Badges) -->
					{#each navGroups as group}
						<div class="space-y-1">
							<div class="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
								{group.title}
							</div>
							{#each group.items as item}
								{@const isActive = currentPath === item.href}
								<a
									href={item.href}
									onclick={() => { sound.playNavClick(); closeMobileMenu(); }}
									class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all {isActive ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
								>
									<div class="flex items-center gap-2.5 min-w-0">
										<item.icon class="h-4 w-4 shrink-0 {isActive ? '' : item.iconColor || ''}" />
										<span class="truncate">{item.label}</span>
									</div>
									{#if item.count && item.count > 0}
										<span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold {isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}">
											{item.count}
										</span>
									{:else if item.badge}
										<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase {isActive ? 'bg-primary-foreground/20 text-primary-foreground' : item.badgeColor || 'bg-secondary text-muted-foreground border border-border'}">
											{item.badge}
										</span>
									{/if}
								</a>
							{/each}
						</div>
					{/each}

					<!-- Public Site Links -->
					<div class="space-y-1 pt-2 border-t border-border/50">
						<div class="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">Public Website</div>
						<a href="/" onclick={closeMobileMenu} class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-secondary">
							<span>Public Home (/)</span>
						</a>
						<a href="/flow" onclick={closeMobileMenu} class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-secondary">
							<span>System Flow (/flow)</span>
						</a>
					</div>
				</div>

				<!-- Drawer Footer -->
				<div class="p-3 border-t border-border/50 shrink-0 bg-card/60">
					<div class="flex items-center justify-between text-[11px] font-mono">
						<span class="flex items-center gap-1.5 font-medium text-foreground">
							<span class="h-2 w-2 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
							{cockpit.platformStatuses[cockpit.chatPlatform].name}
						</span>
						<span class="text-[9px] px-1.5 py-0.5 rounded font-bold {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}">
							{cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'LIVE' : 'STANDBY'}
						</span>
					</div>
				</div>
			</aside>
		{/if}

		<!-- Main Content Slot -->
		<main class="flex-1 flex flex-col min-w-0">
			{@render children()}
		</main>

		<!-- Minimal Enterprise Footer with Public Links -->
		<footer class="border-t border-border/40 py-4 text-xs text-muted-foreground bg-card/20 transition-colors mt-auto">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
				<div class="flex flex-wrap items-center gap-2 font-mono text-[11px]">
					<span class="font-semibold text-foreground">NovaPilot AI Cockpit</span>
					<span>•</span>
					<span>Protected On-Call Session</span>
					<span>•</span>
					<span>Zero Raw SQL Certified</span>
				</div>
				<div class="flex flex-wrap items-center gap-3 text-[11px] font-mono">
					<span class="text-foreground font-medium flex items-center gap-1.5">
						<span class="h-1.5 w-1.5 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
						{cockpit.platformStatuses[cockpit.chatPlatform].name}
					</span>
					<span>•</span>
					<a href="/" class="text-muted-foreground hover:text-foreground hover:underline transition-colors">
						Public Home (/)
					</a>
					<span>•</span>
					<a href="/flow" class="text-muted-foreground hover:text-foreground hover:underline transition-colors">
						System Flow (/flow)
					</a>
				</div>
			</div>
		</footer>
	</div>
</div>
