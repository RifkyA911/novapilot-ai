<script lang="ts">
	import "../app.css";
	import { page } from "$app/stores";
	import { 
		ShieldCheck, 
		CommandLine, 
		Square3Stack3d, 
		Bars3, 
		XMark, 
		ArrowRight,
		ArrowRightOnRectangle
	} from "svelte-heros-v2";
	import ThemeToggle from "$lib/components/ThemeToggle.svelte";
	import LocaleToggle from "$lib/components/LocaleToggle.svelte";
	import UserNav from "$lib/components/UserNav.svelte";
	import { i18n } from "$lib/i18n.svelte";
	import type { LayoutData } from "./$types";

	let { data, children }: { data: LayoutData; children: any } = $props();
	let currentPath: string = $derived($page.url.pathname);
	let isDashboard = $derived(currentPath.startsWith("/dashboard"));
	let user = $derived(data.user);

	let publicMobileMenuOpen = $state(false);

	function togglePublicMenu() {
		publicMobileMenuOpen = !publicMobileMenuOpen;
	}

	function closePublicMenu() {
		publicMobileMenuOpen = false;
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

{#if isDashboard}
	<!-- ========================================================================= -->
	<!-- PROTECTED DASHBOARD APP SHELL (Delegated to /dashboard/+layout.svelte)    -->
	<!-- ========================================================================= -->
	{@render children()}
{:else}
	<!-- ========================================================================= -->
	<!-- PUBLIC WEBSITE (Home / and Flow /flow) — NO SIDEBAR, CLEAN MARKETING NAV  -->
	<!-- ========================================================================= -->
	<div class="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
		<!-- Public Navigation Bar -->
		<header class="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-colors">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
				
				<!-- Left: Brand Logo & Product Title -->
				<a href="/" class="flex items-center gap-3 group focus:outline-none" aria-label="NovaPilot AI Home">
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
							<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
								BETA
							</span>
						</div>
						<span class="text-[10px] text-muted-foreground uppercase tracking-wider font-mono font-medium mt-0.5">
							ChatOps Gatekeeper
						</span>
					</div>
				</a>

				<!-- Center: Public Navigation Links -->
				<nav class="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/40 text-xs">
					<a
						href="/"
						class="px-4 py-1.5 font-medium rounded-lg transition-all duration-150 {currentPath === '/' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'}"
					>
						{i18n.locale === 'id' ? 'Ringkasan' : 'Overview'}
					</a>
					<a
						href="/flow"
						class="px-4 py-1.5 font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 {currentPath.startsWith('/flow') ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'}"
					>
						<Square3Stack3d class="h-3.5 w-3.5 text-emerald-500" />
						<span>{i18n.locale === 'id' ? 'Alur Sistem' : 'System Flow'}</span>
					</a>
				</nav>

				<!-- Right: Locale Toggle, Theme Switcher & Launch Cockpit CTA -->
				<div class="flex items-center gap-2 sm:gap-2.5">
					<LocaleToggle />
					<ThemeToggle />

					<!-- Launch Protected Cockpit CTA Button -->
					<a
						href="/dashboard"
						class="relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-[0.98]"
					>
						<CommandLine class="h-3.5 w-3.5" />
						<span class="hidden sm:inline">{i18n.t.common.launch_cockpit}</span>
						<span class="sm:hidden">Cockpit</span>
						<ArrowRight class="h-3.5 w-3.5" />
					</a>

					<!-- Compact User Nav if Logged in -->
					<div class="pl-1 border-l border-border/50">
						<UserNav {user} />
					</div>

					<!-- Mobile Hamburger Button -->
					<button
						type="button"
						onclick={togglePublicMenu}
						class="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 transition-colors"
						aria-label="Toggle Public Menu"
					>
						{#if publicMobileMenuOpen}
							<XMark class="h-5 w-5" />
						{:else}
							<Bars3 class="h-5 w-5" />
						{/if}
					</button>
				</div>
			</div>

			<!-- Mobile Navigation Sheet -->
			{#if publicMobileMenuOpen}
				<div class="md:hidden border-t border-border/60 bg-card/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-3 duration-200">
					<div class="space-y-1">
						<a
							href="/"
							onclick={closePublicMenu}
							class="flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors {currentPath === '/' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
						>
							<span>{i18n.locale === 'id' ? 'Ringkasan' : 'Overview'}</span>
							<span class="text-xs font-mono text-muted-foreground">/</span>
						</a>
						<a
							href="/flow"
							onclick={closePublicMenu}
							class="flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors {currentPath.startsWith('/flow') ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'}"
						>
							<span class="flex items-center gap-2">
								<Square3Stack3d class="h-4 w-4 text-emerald-500" />
								<span>{i18n.locale === 'id' ? 'Arsitektur & Alur Sistem' : 'System Architecture & Flow'}</span>
							</span>
							<span class="text-xs font-mono text-muted-foreground">/flow</span>
						</a>
						<a
							href="/dashboard"
							onclick={closePublicMenu}
							class="flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground font-semibold shadow-xs"
						>
							<span class="flex items-center gap-2">
								<CommandLine class="h-4 w-4" />
								<span>{i18n.t.common.launch_cockpit}</span>
							</span>
							<ArrowRight class="h-4 w-4" />
						</a>
					</div>
				</div>
			{/if}
		</header>

		<!-- Main Public Body -->
		<main class="flex-1 flex flex-col min-w-0">
			{@render children()}
		</main>

		<!-- Public Footer -->
		<footer class="border-t border-border/40 py-6 text-xs text-muted-foreground bg-card/20 transition-colors">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex flex-wrap items-center gap-2 font-mono text-[11px]">
					<span class="font-semibold text-foreground">NovaPilot AI</span>
					<span>•</span>
					<span>{i18n.t.common.oncall_assistant}</span>
					<span>•</span>
					<span>{i18n.t.common.zero_sql_certified}</span>
				</div>
				<div class="flex items-center gap-3 text-[11px] font-mono">
					<span class="text-emerald-500 font-medium flex items-center gap-1">
						<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
						{i18n.t.common.universal_lts}
					</span>
					<span>•</span>
					<span>{i18n.t.common.multichannel_chatops}</span>
				</div>
			</div>
		</footer>
	</div>
{/if}
