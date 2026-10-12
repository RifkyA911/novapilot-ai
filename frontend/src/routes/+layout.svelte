<script lang="ts">
	import "../app.css";
	import { page } from "$app/stores";
	import { ShieldCheck, CommandLine, ArrowRightOnRectangle, ArrowLeftOnRectangle, Square3Stack3d } from "svelte-heros-v2";
	import ThemeToggle from "$lib/components/ThemeToggle.svelte";
	import type { LayoutData } from "./$types";

	let { data, children }: { data: LayoutData; children: any } = $props();
	let currentPath = $derived($page.url.pathname);
	let user = $derived(data.user);

	async function handleLogout() {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			window.location.href = "/auth?message=logged_out";
		} catch (err) {
			window.location.href = "/auth";
		}
	}
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground font-sans">
	<!-- Enterprise Navigation Bar -->
	<header class="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
			<!-- Logo -->
			<div class="flex items-center gap-3">
				<a href="/" class="flex items-center gap-2.5 group">
					<div class="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
						<ShieldCheck class="h-5 w-5" />
					</div>
					<div class="flex flex-col">
						<div class="flex items-center gap-1.5">
							<span class="font-bold text-base tracking-tight">NovaPilot</span>
							<span class="text-xs px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-mono font-semibold">AI</span>
							<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
								BETA
							</span>
						</div>
						<span class="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">ChatOps Gatekeeper</span>
					</div>
				</a>

				<!-- Live Pulse -->
				<div class="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-border/40 text-xs text-muted-foreground">
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
					</span>
					<span class="font-mono text-[11px]">LAN GATEWAY ACTIVE</span>
				</div>
			</div>

			<!-- Navigation Links -->
			<nav class="flex items-center gap-1 sm:gap-2">
				<a
					href="/"
					class="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors {currentPath === '/' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}"
				>
					Overview
				</a>
				<a
					href="/flow"
					class="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 {currentPath.startsWith('/flow') ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}"
				>
					<Square3Stack3d class="h-3.5 w-3.5 text-emerald-400" />
					<span>System Flow</span>
				</a>
				<a
					href="/dashboard"
					class="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 {currentPath.startsWith('/dashboard') ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}"
				>
					<CommandLine class="h-3.5 w-3.5" />
					<span>On-Call Dashboard</span>
				</a>

				{#if user}
					<!-- Authenticated User Profile Pill & Sign Out -->
					<div class="ml-2 flex items-center gap-2 pl-2 border-l border-border/50">
						<div class="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-secondary/80 border border-border/60 text-xs">
							<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
							<span class="font-medium text-foreground text-xs">{user.name}</span>
							<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary uppercase font-bold">
								{user.role === 'oncall_engineer' ? 'ON-CALL' : user.role}
							</span>
						</div>
						<button
							onclick={handleLogout}
							class="px-3 py-1.5 text-xs font-medium rounded-xl bg-secondary/80 hover:bg-destructive/10 hover:text-destructive text-muted-foreground border border-border/50 transition-colors flex items-center gap-1.5"
							title="Sign Out of On-Call Session"
						>
							<ArrowRightOnRectangle class="h-3.5 w-3.5" />
							<span class="hidden sm:inline">Sign Out</span>
						</button>
					</div>
				{:else}
					<a
						href="/auth"
						class="ml-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
					>
						<ArrowLeftOnRectangle class="h-3.5 w-3.5" />
						<span>Sign In</span>
					</a>
				{/if}

				<!-- Theme Toggle (Light by default, Aceternity / Magic UI style) -->
				<div class="ml-1 pl-1 border-l border-border/50">
					<ThemeToggle />
				</div>
			</nav>
		</div>
	</header>

	<!-- Main Body Content -->
	<main class="flex-1 flex flex-col">
		{@render children()}
	</main>

	<!-- Minimal Enterprise Footer -->
	<footer class="border-t border-border/40 py-6 text-xs text-muted-foreground bg-card/20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex items-center gap-2 font-mono text-[11px]">
				<span>NovaPilot AI v1.0.0</span>
				<span>•</span>
				<span>Go 1.22 + SvelteKit 5 + Bun Runtime</span>
				<span>•</span>
				<span>Zero Raw SQL Certified</span>
			</div>
			<div class="flex items-center gap-4 text-[11px]">
				<span class="text-emerald-400 font-medium">PostgreSQL 18 Local Prototyping</span>
				<span>•</span>
				<span>Oracle 11g Enterprise Adapter</span>
			</div>
		</div>
	</footer>
</div>
