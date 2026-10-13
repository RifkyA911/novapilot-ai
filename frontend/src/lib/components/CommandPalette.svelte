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
		ArrowRight
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";

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
			badge: "Cockpit",
			keywords: ["dashboard", "overview", "guardrail", "kpi", "assurance", "intake", "metrics"]
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
			id: "hooks",
			title: "Client Hook Flows & Ingestion Scripts",
			description: "WhatsApp Web DOM Observers, Tampermonkey Scripts & Webhook Ingestion Engine",
			category: "ChatOps & Hooks",
			url: "/dashboard/hooks",
			icon: CodeBracket,
			badge: "WA Active",
			keywords: ["hooks", "extension", "tampermonkey", "whatsapp", "script", "observer", "baileys", "client"]
		},
		{
			id: "simulator",
			title: "WhatsApp ChatOps Simulator",
			description: "Step-by-Step Interactive Pipeline: Ingest, Parse, Validate, and Stage Inbound Tickets",
			category: "ChatOps & Hooks",
			url: "/dashboard/simulator",
			icon: PaperAirplane,
			badge: "Simulator",
			keywords: ["simulator", "test", "whatsapp", "simulate", "ingest", "mock", "pipeline"]
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
					placeholder="Search menus, operations, connectors, or docs..."
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
						No results found for "{searchQuery}".
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
								<span class="text-[10px] font-mono text-muted-foreground hidden sm:inline">{item.category}</span>
								<ArrowRight class="h-3.5 w-3.5 text-muted-foreground opacity-60" />
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Command Palette Footer -->
			<div class="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
				<div class="flex items-center gap-2">
					<span>Use <kbd class="px-1 rounded bg-muted border border-border">↑</kbd> <kbd class="px-1 rounded bg-muted border border-border">↓</kbd> to navigate</span>
					<span>•</span>
					<span><kbd class="px-1.5 rounded bg-muted border border-border">↵</kbd> to select</span>
				</div>
				<span class="text-emerald-500 font-semibold">{cockpit.platformStatuses[cockpit.chatPlatform].name} ({cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'Live' : 'Standby'})</span>
			</div>
		</div>
	</div>
{/if}
