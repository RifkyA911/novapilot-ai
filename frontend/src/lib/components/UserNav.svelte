<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { i18n } from "$lib/i18n.svelte";
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
		<!-- Humanized User Trigger with Name, Role and Avatar -->
		<button
			type="button"
			onclick={toggleMenu}
			class="relative flex items-center gap-2 sm:gap-2.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-border/80 bg-secondary/40 hover:bg-secondary text-left hover:border-border transition-all cursor-pointer shadow-xs focus:outline-none"
			aria-expanded={isMenuOpen}
			aria-haspopup="true"
			aria-label="User Account Menu"
			title="{activeUser.name} ({activeUser.email})"
		>
			<div class="relative shrink-0">
				{#if activeUser.avatar}
					<img
						src={activeUser.avatar}
						alt={activeUser.name}
						class="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-border bg-card shadow-xs"
					/>
				{:else}
					<div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center ring-1 ring-border shadow-xs">
						{getInitials(activeUser.name)}
					</div>
				{/if}
				<!-- Calm online status dot -->
				<span class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background"></span>
			</div>

			<div class="hidden sm:flex flex-col min-w-0 leading-tight">
				<span class="text-xs font-semibold text-foreground truncate max-w-[120px]">
					{activeUser.name}
				</span>
				<span class="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
					{activeUser.role === 'oncall_engineer' ? i18n.t.user_nav.oncall_role : activeUser.role}
				</span>
			</div>

			<ChevronDown class="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:block opacity-70" />
		</button>
	{:else}
		<!-- Guest / Unauthenticated Mode with calm Login CTA -->
		<div class="flex items-center gap-2">
			<a
				href="/auth"
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
			>
				<UserCircle class="w-4 h-4" />
				<span>{i18n.t.user_nav.signin}</span>
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
			<div class="flex items-start gap-3 pb-3 border-b border-border/50">
				<div class="relative flex-shrink-0">
					{#if activeUser.avatar}
						<img
							src={activeUser.avatar}
							alt={activeUser.name}
							class="w-10 h-10 rounded-xl object-cover ring-1 ring-border shadow-xs bg-secondary"
						/>
					{:else}
						<div class="w-10 h-10 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center ring-1 ring-border shadow-xs">
							{getInitials(activeUser.name)}
						</div>
					{/if}
				</div>

				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-1.5">
						<h4 class="text-sm font-semibold text-foreground truncate">{activeUser.name}</h4>
						<span class="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-secondary text-muted-foreground border border-border/50">
							{activeUser.role === 'oncall_engineer' ? i18n.t.user_nav.it_support : activeUser.role}
						</span>
					</div>
					<p class="text-xs text-muted-foreground truncate font-mono mt-0.5">{activeUser.email}</p>
				</div>
			</div>

			<!-- On-Call Shift Assignment -->
			<div class="my-3 p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs space-y-2">
				<div class="flex items-center justify-between text-muted-foreground">
					<span class="font-medium flex items-center gap-1.5">
						<Clock class="w-3.5 h-3.5 text-primary" />
						<span>{i18n.t.user_nav.oncall_roster}</span>
					</span>
					<span class="font-mono text-[11px] text-foreground font-medium">
						{i18n.t.user_nav.roster_schedule}
					</span>
				</div>

				<!-- Authorized Branch Coverage -->
				<div class="pt-1.5 border-t border-border/30">
					<span class="text-[10px] text-muted-foreground uppercase font-mono tracking-wider block mb-1">
						{i18n.t.user_nav.covered_branches}
					</span>
					<div class="flex flex-wrap gap-1">
						{#each (activeUser.branchClearance || ["SURABAYA_HQ", "MEDAN_HUB", "SEMARANG_DC"]) as branch}
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border/50 text-foreground">
								{branch}
							</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- Menu Quick Links -->
			<div class="space-y-0.5">
				<a
					href="/dashboard"
					onclick={closeMenu}
					class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary text-foreground transition-colors"
				>
					<CommandLine class="w-4 h-4 text-primary" />
					<span>{i18n.t.user_nav.dashboard_queue}</span>
				</a>
				<a
					href="/flow"
					onclick={closeMenu}
					class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary text-foreground transition-colors"
				>
					<Square3Stack3d class="w-4 h-4 text-emerald-500" />
					<span>{i18n.t.user_nav.system_architecture}</span>
				</a>
			</div>

			<!-- Sign Out -->
			<div class="pt-2 mt-2 border-t border-border/50">
				<button
					type="button"
					onclick={handleLogout}
					class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
				>
					<span class="flex items-center gap-2">
						<ArrowRightOnRectangle class="w-4 h-4" />
						<span>{i18n.t.user_nav.sign_out}</span>
					</span>
					<span class="text-[10px] font-mono">
						johndoe
					</span>
				</button>
			</div>
		</div>
	{/if}
</div>
