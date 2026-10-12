<script lang="ts">
	import { ShieldCheck, CheckCircle, ArrowRight, CommandLine, LockClosed, Radio, CpuChip } from "svelte-heros-v2";
	import Ripple from "$lib/components/magicui/Ripple.svelte";
</script>

<div class="flex-1 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative overflow-hidden font-sans">
	<!-- VibeUI Radial Glow Header Background -->
	<span
		aria-hidden="true"
		class="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-35 blur-3xl"
		style="background: radial-gradient(circle, #2FB479 0%, transparent 70%);"
	></span>

	<!-- Magic UI Ripple Background Component (Applied to Hero) -->
	<div class="relative w-full overflow-hidden rounded-3xl py-12 md:py-16">
		<Ripple mainCircleSize={220} mainCircleOpacity={0.3} numCircles={7} class="z-0" />

		<!-- Hero Section -->
		<div class="text-center space-y-6 max-w-4xl mx-auto relative z-10 px-4">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 backdrop-blur-md border border-border/70 text-xs font-mono text-muted-foreground shadow-sm">
				<span class="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
				<span>Human-in-the-Loop Operations Copilot</span>
				<span class="text-border">|</span>
				<span class="text-foreground font-semibold">Zero Unchecked Mutations</span>
			</div>

			<h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
				Autonomous ChatOps with a <br class="hidden sm:inline" />
				<span class="relative inline-block mt-1">
					Strict Human Gate
					<span
						aria-hidden="true"
						class="absolute left-0 right-0 -bottom-1 h-[6px] md:h-[10px] -z-10 rounded-full"
						style="background-color: #2FB479;"
					></span>
				</span>
			</h1>

			<p class="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
				Eliminate late-night VPN logins, database IDE queries, and on-call burnout. NovaPilot ingests chaotic WhatsApp branch requests, verifies against production databases, and lets you review & commit mutations with <strong>one click from your phone</strong>.
			</p>

			<div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
				<a
					href="/dashboard"
					class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
				>
					<CommandLine class="h-4 w-4" />
					<span>Launch On-Call Cockpit</span>
					<ArrowRight class="h-4 w-4 group-hover:translate-x-1 transition-transform" />
				</a>
				<a
					href="/auth"
					class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-secondary/80 backdrop-blur-md text-foreground font-semibold text-sm hover:bg-secondary border border-border/60 transition-colors flex items-center justify-center gap-2 shadow-sm"
				>
					<LockClosed class="h-4 w-4 text-muted-foreground" />
					<span>Sign In via Better Auth</span>
				</a>
			</div>
		</div>
	</div>

	<!-- VibeUI Stats Bar -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-border/50 my-6 relative z-10">
		<div class="p-5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 text-center space-y-1">
			<div class="text-2xl sm:text-4xl font-extrabold font-mono text-emerald-400">30s</div>
			<div class="text-xs text-muted-foreground">Average Ticket Turnaround</div>
		</div>
		<div class="p-5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 text-center space-y-1">
			<div class="text-2xl sm:text-4xl font-extrabold font-mono text-foreground">100%</div>
			<div class="text-xs text-muted-foreground">Parameterized Query Safety</div>
		</div>
		<div class="p-5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 text-center space-y-1">
			<div class="text-2xl sm:text-4xl font-extrabold font-mono text-foreground">0</div>
			<div class="text-xs text-muted-foreground">Unchecked AI Mutations</div>
		</div>
		<div class="p-5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 text-center space-y-1">
			<div class="text-2xl sm:text-4xl font-extrabold font-mono text-primary">Postgres / 11g</div>
			<div class="text-xs text-muted-foreground">Dual Database Adapter</div>
		</div>
	</div>

	<!-- VibeUI Bento Feature Grid -->
	<div class="grid md:grid-cols-3 gap-6 py-8 relative z-10">
		<!-- Bento 1 -->
		<div class="p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4 hover:border-foreground/30 hover:-translate-y-0.5 transition-all">
			<div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
				<Radio class="h-5 w-5" />
			</div>
			<h3 class="text-base font-bold text-foreground">Passive WhatsApp Ingestion</h3>
			<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
				Monitors authorized regional branch groups exclusively. Employs zero spamming and single-reply confirmation patterns strictly compliant with Meta WhatsApp ToS.
			</p>
		</div>

		<!-- Bento 2 -->
		<div class="p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4 hover:border-foreground/30 hover:-translate-y-0.5 transition-all">
			<div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
				<CpuChip class="h-5 w-5" />
			</div>
			<h3 class="text-base font-bold text-foreground">Active Learning Agent</h3>
			<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
				Extracts invoice numbers and requested company revisions from noisy chat. Human corrections made in the WebUI automatically feed future few-shot contexts.
			</p>
		</div>

		<!-- Bento 3 -->
		<div class="p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4 hover:border-foreground/30 hover:-translate-y-0.5 transition-all">
			<div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
				<ShieldCheck class="h-5 w-5" />
			</div>
			<h3 class="text-base font-bold text-foreground">Strict Human-in-the-Loop Gate</h3>
			<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
				Zero direct mutation by AI. On-call engineers review side-by-side visual diffs and tap 'Approve' to trigger transactional prepared statements with complete audit logs.
			</p>
		</div>
	</div>
</div>
