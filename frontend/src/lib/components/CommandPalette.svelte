<script lang="ts">
	import { goto } from "$app/navigation";
	import { 
		MagnifyingGlass, 
		XMark, 
		ShieldCheck, 
		CommandLine, 
		Square3Stack3d, 
		Clock, 
		ChartBarSquare, 
		CircleStack, 
		CpuChip, 
		CodeBracket, 
		PaperAirplane,
		ArrowRight,
		AdjustmentsHorizontal,
		ChatBubbleLeftRight,
		Sparkles,
		UserGroup,
		DocumentText,
		Cube,
		InformationCircle,
		Cog6Tooth
	} from "svelte-heros-v2";
	import { sound } from "$lib/audio";
	import { cockpit } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";

	let { open = $bindable(false) }: { open: boolean } = $props();

	let searchQuery = $state("");
	let selectedIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	interface MenuItem {
		id: string;
		title: string;
		description: string;
		category: "Core Navigation" | "Operations" | "Databases & Telemetry" | "ChatOps & Hooks";
		url: string;
		icon: any;
		badge?: string;
		keywords: string[];
	}

	const menuItems: MenuItem[] = [
		{
			id: "overview",
			title: "Overview",
			description: "SaaS Landing Page, Architectural Philosophy & On-Call Cockpit Showcase",
			category: "Core Navigation",
			url: "/",
			icon: ShieldCheck,
			badge: "Home",
			keywords: ["overview", "home", "landing", "saas", "hero"]
		},
		{
			id: "flow",
			title: "System Architecture & Flow",
			description: "Interactive 6-Stage WhatsApp Ingestion, Deterministic Parsing & Atomic DB Commits",
			category: "Core Navigation",
			url: "/flow",
			icon: Square3Stack3d,
			badge: "Animated",
			keywords: ["flow", "pipeline", "architecture", "svg", "diagram", "stages", "ingestion"]
		},
		{
			id: "dashboard",
			title: "Dashboard Overview",
			description: "Guardrail Assurance & Intake Engine with Multi-Engine Architecture KPIs",
			category: "Operations",
			url: "/dashboard",
			icon: CommandLine,
			badge: "Overview",
			keywords: ["dashboard", "overview", "guardrail", "kpi", "assurance", "intake", "metrics"]
		},
		{
			id: "cockpit_overview",
			title: "Cockpit Overview & AI Analytics",
			description: "In-depth Intent Classification Distribution, OCR Accuracy & Guardrail Metrics",
			category: "Operations",
			url: "/dashboard/cockpit",
			icon: Sparkles,
			badge: "DMY",
			keywords: ["cockpit", "ai", "analytics", "intent", "ocr", "tesseract", "confidence", "metrics", "chart"]
		},
		{
			id: "queue",
			title: "Approval Queue",
			description: "Pending ChatOps Ingestion Tickets, Side-by-Side Visual Diffs & Instant Sign-off",
			category: "Operations",
			url: "/dashboard/queue",
			icon: Clock,
			badge: "Live Queue",
			keywords: ["queue", "approval", "pending", "tickets", "diff", "signoff", "reject", "approve"]
		},
		{
			id: "history",
			title: "Execution History & Audit Log",
			description: "Immutable Audit Trail, Compensating Rollback Scripts & Tamper-Evident Logs",
			category: "Operations",
			url: "/dashboard/history",
			icon: ChartBarSquare,
			badge: "Audit",
			keywords: ["history", "audit", "logs", "executed", "rollback", "compensating", "records"]
		},
		{
			id: "connectors",
			title: "Universal DB Connectors",
			description: "Multi-Engine Database GUI (PostgreSQL, Oracle, MySQL, Mongo, Redis, SQLite)",
			category: "Databases & Telemetry",
			url: "/dashboard/connectors",
			icon: CircleStack,
			badge: "Universal LTS",
			keywords: ["database", "connectors", "db", "postgresql", "oracle", "mysql", "mongo", "redis", "lts", "sql", "nosql"]
		},
		{
			id: "connectivity",
			title: "System Telemetry & Platform Probes",
			description: "Live LAN Probes, Go Runtime Metrics, Ferdium/Rambox Probes & Interactive Tutorial",
			category: "Databases & Telemetry",
			url: "/dashboard/connectivity",
			icon: CpuChip,
			badge: "Probes",
			keywords: ["connectivity", "telemetry", "lan", "ip", "probes", "ferdium", "rambox", "tutorial", "runtime", "health"]
		},
		{
			id: "logs",
			title: "System Logs & Daemon Telemetry",
			description: "Streaming stdout runtime logs from Go Core :8088, PostgreSQL 18 :5432, and WA Gateway",
			category: "Databases & Telemetry",
			url: "/dashboard/logs",
			icon: DocumentText,
			badge: "Live Logs",
			keywords: ["logs", "system", "stdout", "daemon", "telemetry", "core", "terminal", "debug"]
		},
		{
			id: "contacts",
			title: "Group Contacts & Regional Whitelist",
			description: "Directory of whitelisted branch WhatsApp groups, Telegram alert channels, and admins",
			category: "ChatOps & Hooks",
			url: "/dashboard/contacts",
			icon: UserGroup,
			badge: "DMY",
			keywords: ["contacts", "groups", "whatsapp", "branches", "directory", "whitelist", "surabaya", "medan", "jakarta"]
		},
		{
			id: "hooks",
			title: "Client Hook Flows & Ingestion Scripts",
			description: "WhatsApp Web DOM Observers, Tampermonkey Scripts & Webhook Ingestion Engine",
			category: "ChatOps & Hooks",
			url: "/dashboard/hooks",
			icon: CodeBracket,
			keywords: ["hooks", "extension", "tampermonkey", "whatsapp", "script", "observer", "baileys", "client"]
		},
		{
			id: "mcp",
			title: "MCP Knowledge Base & Dual-DB",
			description: "Model Context Protocol JSON-RPC Specification, Dual-DB Isolation & Real Tool Inspector",
			category: "Databases & Telemetry",
			url: "/dashboard/mcp",
			icon: Cube,
			keywords: ["mcp", "model context protocol", "dual-db", "oracle", "sap", "erp", "tools", "resources", "specification"]
		},
		{
			id: "simulator",
			title: "WhatsApp ChatOps Simulator",
			description: "Step-by-Step Interactive Pipeline: Ingest, Parse, Validate, and Stage Inbound Tickets",
			category: "ChatOps & Hooks",
			url: "/dashboard/simulator",
			icon: PaperAirplane,
			badge: "DMY",
			keywords: ["simulator", "test", "whatsapp", "simulate", "ingest", "mock", "pipeline", "experimental"]
		},
		{
			id: "messages",
			title: "Omnichannel Inbound Messages",
			description: "Live Stream of Incoming Chats (WhatsApp, Telegram, Discord, Slack) with 1-Click Ticket Staging",
			category: "ChatOps & Hooks",
			url: "/dashboard/messages",
			icon: ChatBubbleLeftRight,
			badge: "Live Feed",
			keywords: ["messages", "inbound", "chat", "whatsapp", "telegram", "discord", "slack", "feed", "staging", "viewer"]
		},
		{
			id: "agents",
			title: "AI Agents (Hermes 3 & OpenClaw)",
			description: "Local reasoning with Hermes 3 & autonomous browser task automation with OpenClaw",
			category: "ChatOps & Hooks",
			url: "/dashboard/hermes",
			icon: CpuChip,
			badge: "AI Fleet",
			keywords: ["agents", "ai", "hermes", "openclaw", "claw", "llm", "reasoning", "browser", "playwright", "automation", "tool_call", "autonomous"]
		},
		{
			id: "platforms",
			title: "ChatOps Platform Settings & Logic Flows",
			description: "Credentials, Webhook Tokens, Filters, Whitelists & Ingestion Flows (WhatsApp, Telegram, Discord, Slack)",
			category: "ChatOps & Hooks",
			url: "/dashboard/platforms",
			icon: AdjustmentsHorizontal,
			badge: "Flows",
			keywords: ["platform", "settings", "whatsapp", "telegram", "discord", "slack", "config", "token", "bot", "webhook", "credentials"]
		},
		{
			id: "settings",
			title: "System Settings & Gatekeeper Policies",
			description: "Configure Ingestion Policies, High-Value Thresholds, Auto-Reply & Dual-DB Pools",
			category: "Operations",
			url: "/dashboard/settings",
			icon: Cog6Tooth,
			badge: "Settings",
			keywords: ["settings", "preferences", "threshold", "gatekeeper", "guardrails", "policies", "config"]
		},
		{
			id: "about",
			title: "Tentang Kreator & Repositori GitHub",
			description: "Profil Kreator Rifky (@RifkyA911), Arsitektur Manifesto, dan Link Repositori GitHub",
			category: "Core Navigation",
			url: "/dashboard/about",
			icon: InformationCircle,
			badge: "About",
			keywords: ["about", "author", "creator", "rifky", "github", "repo", "manifesto", "tentangku"]
		}
	];

	let filteredItems = $derived(
		menuItems.filter(item => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase().trim();
			return (
				item.title.toLowerCase().includes(q) ||
				item.description.toLowerCase().includes(q) ||
				item.category.toLowerCase().includes(q) ||
				item.keywords.some(k => k.includes(q))
			);
		})
	);

	function navigateTo(url: string) {
		sound.playNavClick();
		open = false;
		searchQuery = "";
		goto(url);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === "Escape") {
			open = false;
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (filteredItems.length > 0) {
				selectedIndex = (selectedIndex + 1) % filteredItems.length;
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (filteredItems.length > 0) {
				selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
			}
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (filteredItems[selectedIndex]) {
				navigateTo(filteredItems[selectedIndex].url);
			}
		}
	}

	$effect(() => {
		if (open) {
			selectedIndex = 0;
			setTimeout(() => {
				inputEl?.focus();
			}, 50);
		}
	});

	$effect(() => {
		// Reset selected index when query changes
		if (searchQuery) {
			selectedIndex = 0;
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4 animate-in fade-in-0 duration-150"
		onclick={() => (open = false)}
		role="presentation"
	>
		<!-- Command Palette Dialog -->
		<div 
			class="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			tabindex="-1"
			role="dialog"
			aria-modal="true"
			aria-label="Command Menu Palette"
		>
			<!-- Search Bar Header -->
			<div class="flex items-center px-4 py-3.5 border-b border-border gap-3">
				<MagnifyingGlass class="h-5 w-5 text-muted-foreground shrink-0" />
				<input
					bind:this={inputEl}
					bind:value={searchQuery}
					type="text"
					placeholder={i18n.t.command.search_placeholder}
					class="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-sans"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = "")}
						class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
					>
						<XMark class="h-4 w-4" />
					</button>
				{/if}
				<kbd class="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
					ESC
				</kbd>
			</div>

			<!-- Search Results List -->
			<div class="max-h-[380px] overflow-y-auto p-2 space-y-1">
				{#if filteredItems.length === 0}
					<div class="py-10 text-center text-xs text-muted-foreground font-mono">
						{i18n.t.command.no_results.replace("{query}", searchQuery)}
					</div>
				{:else}
					{#each filteredItems as item, idx}
						<button
							type="button"
							onclick={() => navigateTo(item.url)}
							onmouseenter={() => (selectedIndex = idx)}
							class="w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer {selectedIndex === idx ? 'bg-accent text-accent-foreground shadow-xs' : 'text-foreground hover:bg-muted/60'}"
						>
							<div class="flex items-center gap-3 min-w-0">
								<div class="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 {selectedIndex === idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}">
									<item.icon class="h-4 w-4" />
								</div>
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-xs font-semibold truncate">{item.title}</span>
										{#if item.badge}
											<span class="text-[9px] font-mono px-1.5 py-0.2 rounded border {selectedIndex === idx ? 'border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground' : 'border-border bg-muted text-muted-foreground'}">
												{item.badge}
											</span>
										{/if}
									</div>
									<p class="text-[11px] text-muted-foreground truncate font-sans">
										{item.description}
									</p>
								</div>
							</div>

							<div class="flex items-center gap-2 shrink-0 pl-2">
								<span class="text-[10px] font-mono text-muted-foreground hidden sm:inline">{item.category === "Core Navigation" ? i18n.t.command.category_core : item.category === "Operations" ? i18n.t.command.category_operations : item.category === "Databases & Telemetry" ? i18n.t.command.category_db : i18n.t.command.category_chatops}</span>
								<ArrowRight class="h-3.5 w-3.5 text-muted-foreground opacity-60" />
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Command Palette Footer -->
			<div class="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
				<div class="flex items-center gap-2">
					<span>{i18n.t.command.nav_hint}</span>
					<span>•</span>
					<span>{i18n.t.command.select_hint}</span>
				</div>
				<span class="text-emerald-500 font-semibold">{cockpit.platformStatuses[cockpit.chatPlatform].name} ({cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'Live' : 'Standby'})</span>
			</div>
		</div>
	</div>
{/if}
