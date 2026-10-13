<script lang="ts">
	import "../app.css";
	import { page } from "$app/stores";
	import { 
		ShieldCheck, 
		CommandLine, 
		Square3Stack3d, 
		Bars3, 
		XMark, 
		Sparkles, 
		Clock, 
		Signal, 
		ArrowRightOnRectangle,
		UserCircle,
		CheckCircle
	} from "svelte-heros-v2";
	import ThemeToggle from "$lib/components/ThemeToggle.svelte";
	import UserNav from "$lib/components/UserNav.svelte";
	import type { LayoutData } from "./$types";

	let { data, children }: { data: LayoutData; children: any } = $props();
	let currentPath = $derived($page.url.pathname);
	let user = $derived(data.user);

	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	async function handleLogout() {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			window.location.href = "/auth?message=logged_out";
		} catch (err) {
			window.location.href = "/auth";
		}
	}
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
	<!-- Humanized Enterprise Navigation Bar -->
	<header class="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-colors">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
			
			<!-- Left: Brand Logo & Factory Operational Pulse -->
			<div class="flex items-center gap-3 sm:gap-4">
				<a href="/" class="flex items-center gap-2.5 group focus:outline-none" aria-label="NovaPilot AI Home">
					<div class="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/25 group-hover:scale-105 group-hover:shadow-primary/40 transition-all duration-200">
						<ShieldCheck class="h-5 w-5" />
					</div>
					<div class="flex flex-col">
						<div class="flex items-center gap-1.5 leading-none">
							<span class="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
								NovaPilot
							</span>
							<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-mono font-bold">
								AI
							</span>
							<span class="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
								BETA
							</span>
						</div>
						<span class="text-[10px] text-muted-foreground uppercase tracking-wider font-mono font-medium mt-0.5">
							ChatOps Gatekeeper
						</span>
					</div>
				</a>
			</div>

			<!-- Center: Navigation Links (Desktop) -->
			<nav class="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/40 text-xs">
				<a
					href="/"
					class="px-3.5 py-1.5 font-medium rounded-lg transition-all duration-150 {currentPath === '/' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'}"
				>
					Overview
				</a>
				<a
					href="/flow"
					class="px-3.5 py-1.5 font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 {currentPath.startsWith('/flow') ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'}"
				>
					<Square3Stack3d class="h-3.5 w-3.5 text-emerald-500" />
					<span>System Flow</span>
				</a>
				<a
					href="/dashboard"
					class="px-3.5 py-1.5 font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 {currentPath.startsWith('/dashboard') ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'}"
				>
					<CommandLine class="h-3.5 w-3.5 text-primary" />
					<span>Dashboard</span>
				</a>
			</nav>

			<!-- Right: Account Profile Dropdown & Controls -->
			<div class="flex items-center gap-2 sm:gap-2.5">
				<!-- Light / Dark Theme Switcher (Aceternity / Magic UI) -->
				<ThemeToggle />

				<!-- Rich User Account Profile Widget -->
				<div class="pl-1 sm:pl-1.5 border-l border-border/50">
					<UserNav {user} />
				</div>

				<!-- Mobile Hamburger Button -->
				<button
					type="button"
					onclick={toggleMobileMenu}
					class="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 transition-colors"
					aria-label="Toggle Navigation Menu"
				>
					{#if mobileMenuOpen}
						<XMark class="h-5 w-5" />
					{:else}
						<Bars3 class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Navigation Sheet (Expandable) -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-border/60 bg-card/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-3 duration-200">
				<!-- Mobile Nav Links -->
				<div class="space-y-1">
					<a
						href="/"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors {currentPath === '/' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span>Overview</span>
						<span class="text-xs font-mono text-muted-foreground">/</span>
					</a>
					<a
						href="/flow"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors {currentPath.startsWith('/flow') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<Square3Stack3d class="h-4 w-4 text-emerald-500" />
							<span>System Architecture & Flow</span>
						</span>
						<span class="text-xs font-mono text-muted-foreground">/flow</span>
					</a>
					<a
						href="/dashboard"
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors {currentPath.startsWith('/dashboard') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
					>
						<span class="flex items-center gap-2">
							<CommandLine class="h-4 w-4 text-primary" />
							<span>Dashboard Queue</span>
						</span>
					</a>
				</div>

				<!-- Mobile User Profile Card -->
				<div class="pt-3 border-t border-border/60">
					{#if user}
						<div class="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-2">
							<div class="flex items-center gap-3">
								<img
									src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=JohnDoe"}
									alt={user.name}
									class="w-9 h-9 rounded-xl bg-card border border-border object-cover"
								/>
								<div class="min-w-0 flex-1">
									<div class="text-xs font-semibold text-foreground truncate">{user.name}</div>
									<div class="text-[11px] text-muted-foreground font-mono truncate">{user.email}</div>
								</div>
							</div>

							<button
								type="button"
								onclick={() => { closeMobileMenu(); handleLogout(); }}
								class="w-full mt-2 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
							>
								<ArrowRightOnRectangle class="h-3.5 w-3.5" />
								<span>Sign Out</span>
							</button>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<a
								href="/auth"
								onclick={closeMobileMenu}
								class="w-full py-2.5 text-center text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
							>
								Sign In
							</a>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</header>

	<!-- Main Body Content -->
	<main class="flex-1 flex flex-col">
		{@render children()}
	</main>

	<!-- Minimal Enterprise Humanized Footer -->
	<footer class="border-t border-border/40 py-6 text-xs text-muted-foreground bg-card/20 transition-colors">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex flex-wrap items-center gap-2 font-mono text-[11px]">
				<span class="font-semibold text-foreground">NovaPilot AI</span>
				<span>•</span>
				<span>On-Call Operations Assistant</span>
				<span>•</span>
				<span>Zero Raw SQL Certified</span>
			</div>
			<div class="flex items-center gap-3 text-[11px] font-mono">
				<span class="text-emerald-500 font-medium flex items-center gap-1">
					<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
					PostgreSQL 18 Local
				</span>
				<span>•</span>
				<span>Oracle 11g Enterprise</span>
			</div>
		</div>
	</footer>
</div>
