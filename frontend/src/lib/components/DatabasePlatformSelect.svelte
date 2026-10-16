<script lang="ts">
	import { ChevronDown, Check } from "svelte-heros-v2";
	import BrandIcon, { type BrandIconName } from "./BrandIcon.svelte";

	export interface PlatformOption {
		value: string;
		label: string;
		subtitle?: string;
		brand: BrandIconName;
		defaultPort: string;
		badge?: string;
		badgeColor?: string;
	}

	export const PLATFORM_OPTIONS: PlatformOption[] = [
		{
			value: "postgres",
			label: "PostgreSQL 16 / 18",
			subtitle: "novapilot_mcp_ref / Enterprise MCP Store",
			brand: "postgresql",
			defaultPort: "5432",
			badge: "STANDARD MCP",
			badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
		},
		{
			value: "oracle",
			label: "Oracle 19c / 21c Enterprise",
			subtitle: "ERP Production / General Ledger / AR",
			brand: "oracle",
			defaultPort: "1521",
			badge: "ERP CORE",
			badgeColor: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
		},
		{
			value: "sap",
			label: "SAP S/4HANA",
			subtitle: "BAPI / RFC / NetWeaver Gateway",
			brand: "sap",
			defaultPort: "3300",
			badge: "SAP RFC",
			badgeColor: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
		},
		{
			value: "mysql",
			label: "MySQL / MariaDB Enterprise",
			subtitle: "Regional Customer & CRM Replica Cluster",
			brand: "mysql",
			defaultPort: "3306",
			badge: "REPLICA",
			badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
		},
		{
			value: "mssql",
			label: "Microsoft SQL Server (MSSQL)",
			subtitle: "Legacy Financial Invoicing Archive",
			brand: "mssql",
			defaultPort: "1433",
			badge: "ARCHIVE",
			badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
		},
		{
			value: "sqlite",
			label: "SQLite 3 Enterprise WAL",
			subtitle: "Local Embedded High-Performance Cache",
			brand: "sqlite",
			defaultPort: "0",
			badge: "LOCAL WAL",
			badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
		},
		{
			value: "mongodb",
			label: "MongoDB Enterprise Cluster",
			subtitle: "Document BSON Customer Store",
			brand: "mongodb",
			defaultPort: "27017",
			badge: "NOSQL",
			badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
		},
		{
			value: "custom_rest",
			label: "Custom MCP REST / GraphQL",
			subtitle: "Generic Microservice Data Gateway",
			brand: "rest",
			defaultPort: "8080",
			badge: "API GATEWAY",
			badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
		}
	];

	let {
		value = $bindable("postgres"),
		id = "db-platform-select",
		disabled = false,
		onchange
	} = $props<{
		value: string;
		id?: string;
		disabled?: boolean;
		onchange?: (selected: PlatformOption) => void;
	}>();

	let isOpen = $state(false);
	let containerEl = $state<HTMLDivElement | null>(null);

	let currentSelected = $derived(
		PLATFORM_OPTIONS.find(p => p.value === value) || PLATFORM_OPTIONS[0]
	);

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
	}

	function selectOption(opt: PlatformOption) {
		value = opt.value;
		isOpen = false;
		if (onchange) {
			onchange(opt);
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (isOpen && containerEl && !containerEl.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="relative w-full" bind:this={containerEl}>
	<!-- Trigger Button (Replaces raw select element) -->
	<button
		type="button"
		{id}
		{disabled}
		onclick={toggleDropdown}
		class="w-full h-10 px-3.5 pr-10 rounded-xl border border-input bg-background hover:bg-muted/40 transition-all flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/30 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed select-none group"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<!-- Left: Platform Icon & Label -->
		<div class="flex items-center gap-2.5 min-w-0 pr-2">
			<div class="h-6 w-6 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50 p-0.5">
				<BrandIcon name={currentSelected.brand} class="h-4.5 w-4.5" />
			</div>
			<div class="min-w-0 flex items-center gap-2">
				<span class="text-xs font-semibold text-foreground font-mono truncate">
					{currentSelected.label}
				</span>
				{#if currentSelected.badge}
					<span class="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 hidden sm:inline {currentSelected.badgeColor}">
						{currentSelected.badge}
					</span>
				{/if}
			</div>
		</div>

		<!-- Right: Chevron Down Icon positioned nicely with generous padding, never hitting the border -->
		<div class="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-transform duration-200 {isOpen ? 'rotate-180 text-cyan-500' : ''}">
			<ChevronDown class="h-4 w-4" />
		</div>
	</button>

	<!-- Custom Dropdown Popover List -->
	{#if isOpen}
		<div 
			class="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl p-1.5 space-y-1 max-h-72 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150"
			role="listbox"
		>
			<div class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1 flex items-center justify-between">
				<span>Pilih Platform Database</span>
				<span class="text-cyan-500 font-normal">{PLATFORM_OPTIONS.length} Tersedia</span>
			</div>

			{#each PLATFORM_OPTIONS as opt}
				{@const isSelected = opt.value === value}
				<button
					type="button"
					onclick={() => selectOption(opt)}
					class="w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer group {isSelected ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold' : 'text-foreground hover:bg-muted/70'}"
					role="option"
					aria-selected={isSelected}
				>
					<div class="flex items-center gap-2.5 min-w-0">
						<div class="h-7 w-7 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/60 p-1 group-hover:scale-105 transition-transform">
							<BrandIcon name={opt.brand} class="h-4.5 w-4.5" />
						</div>
						<div class="min-w-0">
							<div class="flex items-center gap-1.5">
								<span class="text-xs font-mono font-bold truncate">{opt.label}</span>
								{#if opt.badge}
									<span class="text-[9px] font-mono px-1 py-0.2 rounded font-bold {opt.badgeColor}">
										{opt.badge}
									</span>
								{/if}
							</div>
							{#if opt.subtitle}
								<p class="text-[11px] text-muted-foreground truncate font-sans mt-0.5">
									{opt.subtitle}
								</p>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-2 shrink-0 pl-2">
						{#if isSelected}
							<Check class="h-4 w-4 text-cyan-500" />
						{:else}
							<span class="text-[10px] font-mono text-muted-foreground opacity-60">:{opt.defaultPort}</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
