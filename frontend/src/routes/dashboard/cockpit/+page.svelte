<script lang="ts">
	import { 
		Sparkles, 
		CpuChip, 
		ShieldCheck, 
		ChartBarSquare, 
		ArrowPath, 
		Bolt, 
		CheckCircle, 
		ExclamationTriangle, 
		DocumentText, 
		Eye, 
		CommandLine,
		CircleStack,
		ArrowTopRightOnSquare,
		Clock,
		ServerStack
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";
	import CockpitTelemetryVisualizer from "$lib/components/CockpitTelemetryVisualizer.svelte";

	let timeRange = $state<"24h" | "7d" | "30d">("7d");
	let isRefreshing = $state(false);

	async function refreshAnalytics() {
		isRefreshing = true;
		await cockpit.fetchTelemetry();
		await cockpit.fetchTickets();
		setTimeout(() => { isRefreshing = false; }, 400);
	}
</script>

<svelte:head>
	<title>Cockpit Overview & AI Analytics • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	
	<!-- ========================================================================= -->
	<!-- 1. HEADER & PREVIEW BADGE                                                 -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5 flex-wrap">
				<div class="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold shadow-xs">
					<Sparkles class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
						{i18n.t.cockpit.title}
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
							DMY
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.cockpit.subtitle}
					</p>
				</div>
			</div>
		</div>

		<!-- Action Controls -->
		<div class="flex items-center gap-2 self-start sm:self-auto">
			<div class="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs font-mono">
				<button 
					type="button"
					onclick={() => timeRange = "24h"}
					class="px-2.5 py-1 rounded-md transition-all cursor-pointer {timeRange === '24h' ? 'bg-primary text-primary-foreground font-bold shadow-2xs' : 'text-muted-foreground hover:text-foreground'}"
				>
					24H
				</button>
				<button 
					type="button"
					onclick={() => timeRange = "7d"}
					class="px-2.5 py-1 rounded-md transition-all cursor-pointer {timeRange === '7d' ? 'bg-primary text-primary-foreground font-bold shadow-2xs' : 'text-muted-foreground hover:text-foreground'}"
				>
					7D
				</button>
				<button 
					type="button"
					onclick={() => timeRange = "30d"}
					class="px-2.5 py-1 rounded-md transition-all cursor-pointer {timeRange === '30d' ? 'bg-primary text-primary-foreground font-bold shadow-2xs' : 'text-muted-foreground hover:text-foreground'}"
				>
					30D
				</button>
			</div>

			<button
				type="button"
				onclick={refreshAnalytics}
				class="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
				title={i18n.t.actions.refresh}
			>
				<ArrowPath class="h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
			</button>
		</div>
	</div>

	<!-- Notice Banner -->
	<div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs flex items-start gap-3 text-amber-800 dark:text-amber-200">
		<ExclamationTriangle class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
		<div class="space-y-0.5 leading-relaxed">
			<span class="font-bold">{i18n.t.cockpit.preview_notice_title}</span>
			<p class="text-amber-700 dark:text-amber-300">
				{i18n.t.cockpit.preview_notice_desc}
			</p>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 2. SUMMARY METRIC KPI CARDS                                               -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
		<!-- Card 1 -->
		<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
				<span>{i18n.t.cockpit.intent_accuracy}</span>
				<span class="text-emerald-500 font-bold flex items-center gap-1">
					<span>+2.4%</span>
				</span>
			</div>
			<div class="text-2xl font-bold font-mono text-foreground">
				98.6%
			</div>
			<div class="text-[11px] text-muted-foreground flex items-center justify-between">
				<span>Target: &gt;95.0%</span>
				<span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">OPTIMAL</span>
			</div>
		</div>

		<!-- Card 2 -->
		<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
				<span>{i18n.t.cockpit.ocr_precision}</span>
				<span class="text-blue-500 font-bold">Bilingual Ind/Eng</span>
			</div>
			<div class="text-2xl font-bold font-mono text-foreground">
				94.2%
			</div>
			<div class="text-[11px] text-muted-foreground flex items-center justify-between">
				<span>Tesseract.js Engine</span>
				<span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">PHYSICAL NOTA</span>
			</div>
		</div>

		<!-- Card 3 -->
		<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
				<span>{i18n.t.cockpit.avg_latency}</span>
				<span class="text-purple-500 font-bold">Sub-Second</span>
			</div>
			<div class="text-2xl font-bold font-mono text-foreground">
				320 ms
			</div>
			<div class="text-[11px] text-muted-foreground flex items-center justify-between">
				<span>Go Core + Local NLP</span>
				<span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold">ZERO CLOUD LAG</span>
			</div>
		</div>

		<!-- Card 4 -->
		<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
			<div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
				<span>{i18n.t.cockpit.gatekeeper_block_rate}</span>
				<span class="text-emerald-500 font-bold">Zero Leakage</span>
			</div>
			<div class="text-2xl font-bold font-mono text-emerald-500">
				100.0%
			</div>
			<div class="text-[11px] text-muted-foreground flex items-center justify-between">
				<span>Raw SQL Injections: 0</span>
				<span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">PROTECTED</span>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. LIVE INTERACTIVE CHATOPS ARCHITECTURE TELEMETRY (ANIMATED SVG)        -->
	<!-- ========================================================================= -->
	<CockpitTelemetryVisualizer />

	<!-- ========================================================================= -->
	<!-- 4. AI INTENT & CLASSIFICATION BREAKDOWN CHARTS                             -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Chart 1: Intent Distribution -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
						<Bolt class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Distribusi Intent AI (Natural Language)</h3>
						<p class="text-[11px] font-mono text-muted-foreground">Klasifikasi ekstraksi otomatis dari chat WhatsApp &amp; Telegram</p>
					</div>
				</div>
				<span class="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
					DMY
				</span>
			</div>

			<!-- Visual Progress Bars for Intents -->
			<div class="space-y-3 pt-2 text-xs font-mono">
				<div>
					<div class="flex items-center justify-between pb-1">
						<span class="text-foreground font-semibold">UPDATE_CUSTOMER_NAME (Perubahan Nama PT)</span>
						<span class="text-primary font-bold">68.4% (342 chat)</span>
					</div>
					<div class="w-full h-2 rounded-full bg-secondary overflow-hidden">
						<div class="h-full rounded-full bg-primary" style="width: 68.4%"></div>
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between pb-1">
						<span class="text-foreground font-semibold">AMEND_INVOICE_AMOUNT (Koreksi Nominal Faktur)</span>
						<span class="text-blue-500 font-bold">18.2% (91 chat)</span>
					</div>
					<div class="w-full h-2 rounded-full bg-secondary overflow-hidden">
						<div class="h-full rounded-full bg-blue-500" style="width: 18.2%"></div>
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between pb-1">
						<span class="text-foreground font-semibold">REISSUE_TAX_INVOICE (Terbit Ulang Faktur Pajak)</span>
						<span class="text-purple-500 font-bold">8.1% (40 chat)</span>
					</div>
					<div class="w-full h-2 rounded-full bg-secondary overflow-hidden">
						<div class="h-full rounded-full bg-purple-500" style="width: 8.1%"></div>
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between pb-1">
						<span class="text-foreground font-semibold">CANCEL_TRANSACTION_ESCALATION (Eskalasi Pembatalan)</span>
						<span class="text-amber-500 font-bold">5.3% (27 chat)</span>
					</div>
					<div class="w-full h-2 rounded-full bg-secondary overflow-hidden">
						<div class="h-full rounded-full bg-amber-500" style="width: 5.3%"></div>
					</div>
				</div>
			</div>

			<div class="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-center justify-between font-mono">
				<span>Total Permintaan Dianalisa: 500 Sampel</span>
				<span class="text-emerald-500 font-bold">Confidence Threshold: &gt; 85%</span>
			</div>
		</div>

		<!-- Chart 2: Tesseract OCR Vision Accuracy -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
						<DocumentText class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Performa OCR Vision (Tesseract.js)</h3>
						<p class="text-[11px] font-mono text-muted-foreground">Kualitas ekstraksi teks dari gambar struk/nota fisik &amp; PDF</p>
					</div>
				</div>
				<span class="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
					DMY
				</span>
			</div>

			<!-- SVG Graph Illustration of OCR Accuracy -->
			<div class="w-full h-44 rounded-xl bg-secondary/30 border border-border/60 p-3 flex flex-col justify-between">
				<div class="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
					<span>Akurasi Pembacaan No Faktur vs Tanggal</span>
					<span class="text-blue-500 font-bold">96.8% Success Rate</span>
				</div>

				<!-- SVG Area Chart -->
				<svg viewBox="0 0 500 120" class="w-full h-28 overflow-visible">
					<defs>
						<linearGradient id="chartOcrGrad" x1="0%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.4" />
							<stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
						</linearGradient>
					</defs>
					<!-- Area fill -->
					<path 
						d="M 10 90 Q 90 40, 170 60 T 330 30 T 490 20 L 490 110 L 10 110 Z" 
						fill="url(#chartOcrGrad)" 
					/>
					<!-- Stroke Line -->
					<path 
						d="M 10 90 Q 90 40, 170 60 T 330 30 T 490 20" 
						fill="none" 
						stroke="#3b82f6" 
						stroke-width="2.5" 
					/>
					<!-- Points -->
					<circle cx="10" cy="90" r="3.5" fill="#3b82f6" />
					<circle cx="170" cy="60" r="3.5" fill="#3b82f6" />
					<circle cx="330" cy="30" r="3.5" fill="#3b82f6" />
					<circle cx="490" cy="20" r="3.5" fill="#10b981" />
				</svg>

				<div class="flex items-center justify-between text-[9.5px] font-mono text-muted-foreground px-2">
					<span>Sen (88%)</span>
					<span>Sel (91%)</span>
					<span>Rab (93%)</span>
					<span>Kam (95%)</span>
					<span>Jum (98%)</span>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-2 text-xs font-mono">
				<div class="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
					<span class="text-muted-foreground block text-[10px]">Auto Bounding Box</span>
					<span class="font-bold text-foreground">Aktif (Tesseract PSM 6)</span>
				</div>
				<div class="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
					<span class="text-muted-foreground block text-[10px]">Noise Filtering</span>
					<span class="font-bold text-emerald-500">Adaptive Grayscale</span>
				</div>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 4. GUARDRAIL ASSURANCE & MCP VERIFICATION METRICS                         -->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
					<ShieldCheck class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-foreground">Invarian Keamanan Transaksi &amp; Integrasi MCP</h3>
					<p class="text-[11px] font-mono text-muted-foreground">Pemisahan fisik DB 1 (PostgreSQL) vs DB 2 (Oracle ERP via Model Context Protocol)</p>
				</div>
			</div>
			<span class="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
				AUDIT-READY
			</span>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
			<div class="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-1.5">
				<span class="text-[11px] font-mono text-muted-foreground uppercase">Zero Raw SQL Guarantee</span>
				<div class="text-lg font-bold text-emerald-500">0 Query Terbuka</div>
				<p class="text-[11px] text-muted-foreground leading-relaxed">
					Seluruh mutasi ke DB 2 diisolasi di balik MCP Tool <code>mutate_invoice_record</code> dengan parameter prepared statements.
				</p>
			</div>

			<div class="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-1.5">
				<span class="text-[11px] font-mono text-muted-foreground uppercase">Human Sign-off Enforcement</span>
				<div class="text-lg font-bold text-amber-500">100% Mandatory</div>
				<p class="text-[11px] text-muted-foreground leading-relaxed">
					Tidak ada tiket berstatus mutatif yang dieksekusi ke ERP tanpa tanda tangan sesi dari operator on-call di port :3000.
				</p>
			</div>

			<div class="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-1.5">
				<span class="text-[11px] font-mono text-muted-foreground uppercase">Self-Learning Feedback Loop</span>
				<div class="text-lg font-bold text-purple-500">Aktif &amp; Terus Belajar</div>
				<p class="text-[11px] text-muted-foreground leading-relaxed">
					Pola chat kasual yang dikoreksi otomatis disimpan ke tabel <code>learned_patterns</code> di DB 1 untuk adaptasi regex real-time.
				</p>
			</div>
		</div>
	</div>

</div>
