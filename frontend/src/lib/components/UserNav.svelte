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
		<!-- Compact Circular Avatar Trigger (Simplified & Space-Efficient) -->
		<button
			type="button"
			onclick={toggleMenu}
			class="relative p-0.5 rounded-full hover:ring-2 hover:ring-primary/40 focus:outline-none transition-all cursor-pointer flex items-center justify-center"
			aria-expanded={isMenuOpen}
			aria-haspopup="true"
			aria-label="User Account Menu"
			title="{activeUser.name} ({activeUser.email})"
		>
			{#if activeUser.avatar}
				<img
					src={activeUser.avatar}
					alt={activeUser.name}
					class="w-8 h-8 rounded-full object-cover ring-1 ring-border hover:ring-primary/40 bg-card transition-all shadow-xs"
				/>
			{:else}
				<div class="w-8 h-8 rounded-full bg-secondary text-foreground font-semibold text-xs flex items-center justify-center ring-1 ring-border">
					{getInitials(activeUser.name)}
				</div>
			{/if}
			<!-- Calm online status dot -->
			<span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background"></span>
		</button>
	{:else}
		<!-- Guest / Unauthenticated Mode with calm Login CTA -->
		<div class="flex items-center gap-2">
			<a
				href="/auth"
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
			>
				<UserCircle class="w-4 h-4" />
				<span>Sign In</span>
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
							{activeUser.role === 'oncall_engineer' ? 'IT Support' : activeUser.role}
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
						<span>On-Call Roster</span>
					</span>
					<span class="font-mono text-[11px] text-foreground font-medium">
						2x Monthly (Shift 1 of 2)
					</span>
				</div>

				<!-- Authorized Branch Coverage -->
				<div class="pt-1.5 border-t border-border/30">
					<span class="text-[10px] text-muted-foreground uppercase font-mono tracking-wider block mb-1">
						Covered Branches:
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
					<span>Dashboard Queue</span>
				</a>
				<a
					href="/flow"
					onclick={closeMenu}
					class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary text-foreground transition-colors"
				>
					<Square3Stack3d class="w-4 h-4 text-emerald-500" />
					<span>System Architecture Flow</span>
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
						<span>Sign Out</span>
					</span>
					<span class="text-[10px] font-mono">
						johndoe
					</span>
				</button>
			</div>
		</div>
	{/if}
</div>
