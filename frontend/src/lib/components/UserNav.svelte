<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		UserCircle, 
		ChevronDown, 
		ShieldCheck, 
		CommandLine, 
		Square3Stack3d, 
		ArrowRightOnRectangle, 
		ArrowLeftOnRectangle, 
		BuildingOffice, 
		Sparkles, 
		CheckCircle,
		Clock
	} from "svelte-heros-v2";

	interface UserData {
		id: string;
		email: string;
		name: string;
		role: string;
		avatar?: string;
		branchClearance?: string[];
	}

	let { user }: { user: UserData | null | undefined } = $props();

	// Fallback humanized user if in guest preview
	let activeUser = $derived(user || {
		id: "usr_internal_johndoe",
		name: "John Doe",
		email: "johndoe@factory.internal",
		role: "oncall_engineer",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JohnDoe",
		branchClearance: ["Surabaya HQ", "Medan Hub", "Semarang DC"]
	});

	let isMenuOpen = $state(false);
	let dropdownRef: HTMLDivElement | null = $state(null);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			closeMenu();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			closeMenu();
		}
	}

	onMount(() => {
		window.addEventListener("click", handleWindowClick);
		window.addEventListener("keydown", handleKeyDown);
	});

	onDestroy(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener("click", handleWindowClick);
			window.removeEventListener("keydown", handleKeyDown);
		}
	});

	async function handleLogout() {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			window.location.href = "/auth?message=logged_out";
		} catch (err) {
			window.location.href = "/auth";
		}
	}

	function getInitials(name: string): string {
		return name
			.split(" ")
			.map(n => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<div class="relative" bind:this={dropdownRef}>
	{#if user}
		<!-- Authenticated Human-Friendly Profile Trigger -->
		<button
			type="button"
			onclick={toggleMenu}
			class="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-secondary/60 hover:bg-secondary/90 border border-border/70 hover:border-primary/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 group shadow-sm"
			aria-expanded={isMenuOpen}
			aria-haspopup="true"
		>
			<!-- User Avatar with live status ring -->
			<div class="relative flex-shrink-0">
				{#if activeUser.avatar}
					<img
						src={activeUser.avatar}
						alt={activeUser.name}
						class="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 bg-card transition-all"
					/>
				{:else}
					<div class="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center ring-2 ring-primary/20">
						{getInitials(activeUser.name)}
					</div>
				{/if}
				<!-- Active on-call shift pulse -->
				<span class="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-background"></span>
				</span>
			</div>

			<!-- User Name & Role Info (Desktop) -->
			<div class="hidden md:flex flex-col text-left">
				<div class="flex items-center gap-1.5 leading-tight">
					<span class="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
						{activeUser.name}
					</span>
					<span class="text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
						Piket Aktif
					</span>
				</div>
				<span class="text-[10px] text-muted-foreground font-mono leading-tight">
					{activeUser.email}
				</span>
			</div>

			<!-- Dropdown Chevron -->
			<ChevronDown class="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 {isMenuOpen ? 'rotate-180 text-primary' : ''}" />
		</button>
	{:else}
		<!-- Guest / Unauthenticated Mode with friendly Login CTA -->
		<div class="flex items-center gap-2">
			<a
				href="/auth"
				class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow"
			>
				<UserCircle class="w-4 h-4" />
				<span>Sign In (Piket)</span>
			</a>
		</div>
	{/if}

	<!-- Rich Humanized Account Profile Dropdown Popover -->
	{#if isMenuOpen}
		<div
			class="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-card border border-border/80 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
			role="menu"
			tabindex="-1"
		>
			<!-- Profile Header Card -->
			<div class="flex items-start gap-3.5 pb-4 border-b border-border/60">
				<div class="relative flex-shrink-0">
					{#if activeUser.avatar}
						<img
							src={activeUser.avatar}
							alt={activeUser.name}
							class="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary/30 shadow-md bg-secondary"
						/>
					{:else}
						<div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-base flex items-center justify-center ring-2 ring-primary/30 shadow-md">
							{getInitials(activeUser.name)}
						</div>
					{/if}
					<span class="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500 text-white shadow-sm">
						LIVE
					</span>
				</div>

				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2">
						<h4 class="text-sm font-bold text-foreground truncate">{activeUser.name}</h4>
						<span class="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold bg-primary/10 text-primary border border-primary/20 uppercase">
							{activeUser.role === 'oncall_engineer' ? 'IT On-Call' : activeUser.role}
						</span>
					</div>
					<p class="text-xs text-muted-foreground truncate font-mono mt-0.5">{activeUser.email}</p>
					
					<div class="mt-2 flex items-center gap-2">
						<span class="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
							<CheckCircle class="w-3.5 h-3.5" />
							<span>Verified Staff Clearance</span>
						</span>
					</div>
				</div>
			</div>

			<!-- Factory On-Call Shift Context (Directly Humanized for User's Routine) -->
			<div class="my-3.5 p-3 rounded-xl bg-secondary/50 border border-border/50 text-xs space-y-2.5">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground font-medium flex items-center gap-1.5">
						<Clock class="w-3.5 h-3.5 text-primary" />
						<span>Piket Bulanan Pabrik</span>
					</span>
					<span class="font-mono font-semibold text-[11px] text-foreground bg-background px-2 py-0.5 rounded border border-border/60">
						2x Quota / Month
					</span>
				</div>

				<!-- Quota Visual Progress -->
				<div>
					<div class="flex justify-between text-[11px] text-muted-foreground mb-1">
						<span>Piket Shift Progress</span>
						<span class="font-mono font-semibold text-primary">Shift 1 / 2 Active</span>
					</div>
					<div class="w-full h-1.5 rounded-full bg-border overflow-hidden">
						<div class="h-full bg-primary rounded-full transition-all" style="width: 50%;"></div>
					</div>
				</div>

				<!-- Authorized Branch Coverage -->
				<div class="pt-1.5 border-t border-border/40">
					<span class="text-[10px] text-muted-foreground uppercase font-mono tracking-wider block mb-1.5">
						Branch WA Support Coverage:
					</span>
					<div class="flex flex-wrap gap-1">
						{#each (activeUser.branchClearance || ["SURABAYA_HQ", "MEDAN_HUB", "SEMARANG_DC"]) as branch}
							<span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-card border border-border/60 text-foreground font-medium">
								{branch}
							</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- Guardrail Security Assurance -->
			<div class="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-muted-foreground flex items-center gap-2 mb-3">
				<ShieldCheck class="w-4 h-4 text-emerald-500 flex-shrink-0" />
				<span>Zero Raw SQL Certified: Every change requires human sign-off & audit log.</span>
			</div>

			<!-- Menu Quick Links -->
			<div class="space-y-1">
				<a
					href="/dashboard"
					onclick={closeMenu}
					class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-secondary text-foreground transition-colors"
				>
					<CommandLine class="w-4 h-4 text-primary" />
					<span>Open On-Call Incident Queue</span>
				</a>
				<a
					href="/flow"
					onclick={closeMenu}
					class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-secondary text-foreground transition-colors"
				>
					<Square3Stack3d class="w-4 h-4 text-emerald-500" />
					<span>Inspect Complete System Flow</span>
				</a>
			</div>

			<!-- Sign Out / End Shift -->
			<div class="pt-2 mt-2 border-t border-border/60">
				<button
					type="button"
					onclick={handleLogout}
					class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition-colors group"
				>
					<span class="flex items-center gap-2">
						<ArrowRightOnRectangle class="w-4 h-4 text-destructive" />
						<span>End Piket Shift / Sign Out</span>
					</span>
					<span class="text-[10px] font-mono text-muted-foreground group-hover:text-destructive">
						johndoe
					</span>
				</button>
			</div>
		</div>
	{/if}
</div>
