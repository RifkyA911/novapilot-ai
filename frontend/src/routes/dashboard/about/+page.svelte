<script lang="ts">
	import { 
		InformationCircle, 
		CodeBracket, 
		ArrowTopRightOnSquare, 
		ShieldCheck, 
		Sparkles, 
		Heart, 
		CpuChip, 
		CircleStack, 
		Cube, 
		Check, 
		ClipboardDocument 
	} from "svelte-heros-v2";
	import { i18n } from "$lib/i18n.svelte";

	let copiedClone = $state(false);

	function copyCloneCmd() {
		navigator.clipboard.writeText("git clone https://github.com/RifkyA911/novapilot-ai.git");
		copiedClone = true;
		setTimeout(() => { copiedClone = false; }, 2000);
	}
</script>

<svelte:head>
	<title>{i18n.t.about.title} • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full font-sans">
	<!-- Hero Header -->
	<div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card via-card/90 to-primary/5 border border-border/70 shadow-xl space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div class="space-y-1.5">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary">
					<Sparkles class="h-3.5 w-3.5" />
					<span>{i18n.t.about.badge}</span>
				</div>
				<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
					{i18n.t.about.title}
				</h1>
				<p class="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
					{i18n.t.about.subtitle}
				</p>
			</div>

			<div class="flex items-center gap-3 shrink-0">
				<a
					href="https://github.com/RifkyA911/novapilot-ai"
					target="_blank"
					rel="noreferrer"
					class="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-md transition-colors"
				>
					<CodeBracket class="h-4 w-4" />
					<span>{i18n.t.about.open_github}</span>
					<ArrowTopRightOnSquare class="h-3.5 w-3.5 opacity-75" />
				</a>
			</div>
		</div>
	</div>

	<!-- Author & Repository Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Profil Kreator (Tentangku) -->
		<div class="p-6 rounded-3xl border border-border/80 bg-card/70 space-y-5 shadow-xs">
			<div class="flex items-center justify-between pb-3 border-b border-border/50">
				<div class="flex items-center gap-2.5">
					<div class="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
						<InformationCircle class="h-5 w-5" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-foreground">{i18n.t.about.creator_title}</h2>
						<p class="text-[11px] text-muted-foreground">Architect & Lead Developer</p>
					</div>
				</div>
				<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
					CREATOR
				</span>
			</div>

			<!-- Author Identity Card -->
			<div class="p-4 rounded-2xl bg-secondary/50 border border-border/50 flex items-start gap-4">
				<div class="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
					RA
				</div>
				<div class="space-y-1 min-w-0">
					<div class="text-base font-bold text-foreground flex items-center gap-2">
						<span>Rifky</span>
						<span class="text-xs font-mono text-muted-foreground">(@RifkyA911)</span>
					</div>
					<div class="text-xs text-primary font-medium">
						Full-Stack Engineer & AI Systems Architect
					</div>
					<p class="text-[11px] text-muted-foreground leading-relaxed pt-1">
						{i18n.current === 'id' 
							? 'Fokus pada perancangan arsitektur sistem otonom yang aman, zero-trust backend pipelines, multi-agent frameworks, dan integrasi enterprise data berbasis Model Context Protocol (MCP).' 
							: 'Specializing in secure autonomous systems design, zero-trust backend pipelines, multi-agent reasoning frameworks, and Model Context Protocol (MCP) enterprise data grounding.'}
					</p>
				</div>
			</div>

			<!-- Author Links -->
			<div class="space-y-2 text-xs">
				<div class="flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors">
					<span class="font-medium text-muted-foreground">GitHub Profile:</span>
					<a
						href="https://github.com/RifkyA911"
						target="_blank"
						rel="noreferrer"
						class="text-primary hover:underline font-mono font-semibold flex items-center gap-1"
					>
						<span>github.com/RifkyA911</span>
						<ArrowTopRightOnSquare class="h-3 w-3" />
					</a>
				</div>
				<div class="flex items-center justify-between p-2.5 rounded-xl border border-border/40">
					<span class="font-medium text-muted-foreground">{i18n.current === 'id' ? 'Spesialisasi:' : 'Specialization:'}</span>
					<span class="font-medium text-foreground">Go, SvelteKit, Bun, MCP, Python, PostgreSQL</span>
				</div>
				<div class="flex items-center justify-between p-2.5 rounded-xl border border-border/40">
					<span class="font-medium text-muted-foreground">{i18n.current === 'id' ? 'Lokasi:' : 'Location:'}</span>
					<span class="font-medium text-foreground">Indonesia 🇮🇩</span>
				</div>
			</div>
		</div>

		<!-- Repositori GitHub -->
		<div class="p-6 rounded-3xl border border-border/80 bg-card/70 space-y-5 shadow-xs">
			<div class="flex items-center justify-between pb-3 border-b border-border/50">
				<div class="flex items-center gap-2.5">
					<div class="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
						<CodeBracket class="h-5 w-5" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-foreground">{i18n.current === 'id' ? 'Repositori Resmi' : 'Official Repository'}</h2>
						<p class="text-[11px] text-muted-foreground">Open-Source Project</p>
					</div>
				</div>
				<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
					MIT LICENSE
				</span>
			</div>

			<!-- Repo Card -->
			<div class="p-4 rounded-2xl bg-secondary/50 border border-border/50 space-y-3">
				<div class="flex items-center justify-between">
					<div class="font-bold text-sm text-foreground flex items-center gap-2">
						<span>RifkyA911/novapilot-ai</span>
					</div>
					<span class="text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
						Public
					</span>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">
					{i18n.current === 'id'
						? 'Platform otomasi ChatOps multiplatform generasi baru untuk teknisi on-call, mencegah mutasi SQL langsung melalui Model Context Protocol & verifikasi Human-in-the-Loop.'
						: 'Next-gen multiplatform ChatOps automation platform designed for on-call engineers, preventing direct SQL mutation via Model Context Protocol & Human-in-the-Loop verification.'}
				</p>

				<!-- Git Clone Command Box -->
				<div class="pt-2">
					<div class="text-[10px] font-mono uppercase text-muted-foreground font-semibold mb-1">
						{i18n.current === 'id' ? 'Clone Repositori:' : 'Clone Repository:'}
					</div>
					<div class="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-zinc-800 text-[11px] font-mono text-zinc-300">
						<span class="truncate">git clone https://github.com/RifkyA911/novapilot-ai.git</span>
						<button
							type="button"
							onclick={copyCloneCmd}
							class="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
							title={i18n.t.about.copy_clone}
						>
							{#if copiedClone}
								<Check class="h-3.5 w-3.5 text-emerald-400" />
							{:else}
								<ClipboardDocument class="h-3.5 w-3.5" />
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Tech Stack Chips -->
			<div class="space-y-1.5">
				<div class="text-[10px] font-mono uppercase font-bold text-muted-foreground">
					{i18n.current === 'id' ? 'Teknologi yang Digunakan:' : 'Technologies Used:'}
				</div>
				<div class="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
					<span class="px-2 py-1 rounded bg-secondary border border-border text-foreground font-semibold">Go 1.24 (Clean Arch)</span>
					<span class="px-2 py-1 rounded bg-secondary border border-border text-foreground font-semibold">SvelteKit 2 + Svelte 5 Runes</span>
					<span class="px-2 py-1 rounded bg-secondary border border-border text-foreground font-semibold">Bun Runtime</span>
					<span class="px-2 py-1 rounded bg-secondary border border-border text-foreground font-semibold">Baileys WA Multi-Device</span>
					<span class="px-2 py-1 rounded bg-secondary border border-border text-foreground font-semibold">Model Context Protocol (MCP)</span>
					<span class="px-2 py-1 rounded bg-secondary border border-border text-foreground font-semibold">PostgreSQL 18</span>
					<span class="px-2 py-1 rounded bg-secondary border border-border text-foreground font-semibold">Tesseract.js OCR</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Core Architectural Manifesto -->
	<div class="p-6 rounded-3xl border border-border/80 bg-card/70 space-y-4 shadow-xs">
		<h2 class="text-sm font-bold text-foreground flex items-center gap-2">
			<ShieldCheck class="h-4 w-4 text-emerald-500" />
			<span>{i18n.t.about.architecture_title}</span>
		</h2>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
			<div class="p-4 rounded-2xl bg-secondary/40 border border-border/40 space-y-2">
				<div class="font-bold text-foreground">1. Zero Direct SQL</div>
				<p class="text-muted-foreground leading-relaxed">
					{i18n.current === 'id'
						? 'Petugas lapangan dan chatbot tidak pernah diizinkan mengetik atau mengirimkan query SQL langsung ke database produksi ERP.'
						: 'Field staff and chatbots are never permitted to type or transmit raw SQL queries directly to production ERP databases.'}
				</p>
			</div>

			<div class="p-4 rounded-2xl bg-secondary/40 border border-border/40 space-y-2">
				<div class="font-bold text-foreground">2. Human-in-the-Loop Gatekeeper</div>
				<p class="text-muted-foreground leading-relaxed">
					{i18n.current === 'id'
						? 'AI hanya bertindak mengekstrak intent dan mengajukan proposal (staging). Hanya teknisi on-call berwenang yang dapat menekan tombol sign-off.'
						: 'AI acts strictly as an intent extractor and mutation proposer (staging). Only authorized on-call engineers can authorize changes.'}
				</p>
			</div>

			<div class="p-4 rounded-2xl bg-secondary/40 border border-border/40 space-y-2">
				<div class="font-bold text-foreground">3. Dual-DB Physical Separation</div>
				<p class="text-muted-foreground leading-relaxed">
					{i18n.current === 'id'
						? 'Database operasional internal (tiket, chat) dipisahkan secara fisik dari database buku besar finansial (Oracle / SAP).'
						: 'Internal operational databases (tickets, chat logs) remain physically isolated from primary financial ledgers (Oracle / SAP).'}
				</p>
			</div>
		</div>
	</div>
</div>
