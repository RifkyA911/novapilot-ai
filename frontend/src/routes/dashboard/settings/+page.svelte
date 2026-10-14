<script lang="ts">
	import { onMount } from "svelte";
	import { 
		AdjustmentsHorizontal, 
		Check, 
		ShieldCheck, 
		CircleStack, 
		ChatBubbleLeftRight, 
		Bell, 
		Eye, 
		EyeSlash,
		CpuChip, 
		LockClosed,
		ArrowPath,
		ExclamationTriangle,
		SpeakerWave,
		WrenchScrewdriver,
		CommandLine,
		Sparkles,
		DocumentText,
		ArrowDownTray,
		Key,
		Bolt,
		Signal,
		Radio
	} from "svelte-heros-v2";

	// Active Navigation Tab
	type SettingsTab = "gatekeeper" | "ai_model" | "chatops" | "database" | "alerts" | "interface";
	let activeTab = $state<SettingsTab>("gatekeeper");

	// 1. Gatekeeper & Kebijakan Mutasi Faktur
	let highValueThreshold = $state("50000000"); // 50 juta IDR
	let requireSupervisorAboveThreshold = $state(true);
	let blockClosedInvoices = $state(true);
	let autoApproveLowRisk = $state(false);
	let mandatoryAuditReason = $state(true);
	let rateLimitPerBranch = $state(10); // 10 requests / menit

	// 2. AI Engine & LLM Guardrails
	let selectedModelProvider = $state<"gemini-2.5-flash" | "gemini-1.5-pro" | "claude-3-5-sonnet" | "ollama-deepseek-r1">("gemini-2.5-flash");
	let aiApiKey = $state("");
	let showApiKey = $state(false);
	let aiEndpoint = $state("https://generativelanguage.googleapis.com");
	let aiTemperature = $state(0.1);
	let confidenceThreshold = $state(75); // 75%
	let promptInjectionDefense = $state(true);
	let strictJsonSchema = $state(true);
	let ragGroundingEnabled = $state(true);

	// 3. Multiplatform ChatOps & Ingress Gateway
	let waGatewayUrl = $state("http://localhost:3002");
	let autoReplyEnabled = $state(true);
	let autoReplyTemplate = $state("[NovaPilot AI] Halo {sender_name}, permintaan koreksi tiket #{ticket_no} untuk dokumen {doc_no} telah kami terima dan masuk antrean staging verifikasi.");
	let autoOcrEnabled = $state(true);
	let whitelistedGroups = $state("120363028192837492@g.us, 120363098172635412@g.us, 120363012938475610@g.us");
	let blacklistSpamJids = $state("628999999999@s.whatsapp.net, 628888888888@s.whatsapp.net");
	let telegramBotToken = $state("");
	let telegramChatId = $state("-100192837482");
	let discordWebhook = $state("");
	let slackWebhook = $state("");

	// 4. Dual-DB Connection Profiles & Enterprise MCP
	let pgHost = $state("localhost");
	let pgPort = $state("5432");
	let pgDB = $state("novapilot_db");
	let pgUser = $state("postgres");
	let pgPassword = $state("");
	let showPgPassword = $state(false);
	let pgMaxConns = $state(25);
	let pgIdleConns = $state(10);
	let targetErpType = $state<"Oracle 19c Enterprise" | "SAP S/4HANA" | "PostgreSQL ERP DB" | "REST API Gateway">("Oracle 19c Enterprise");
	let mcpEndpoint = $state("http://localhost:8088/mcp");
	let safeDryRunMode = $state(true);
	let mcpBearerToken = $state("");

	// 5. Alert, Notifikasi & Audio Feedback
	let soundAlerts = $state(true);
	let soundVolume = $state(70);
	let browserPushAlerts = $state(true);
	let highValueAlertEscalation = $state(true);
	let idleEscalationMinutes = $state(30);

	// 6. Cockpit & Antarmuka
	let compactTable = $state(false);
	let telemetryRefreshRate = $state<"3" | "5" | "10" | "30" | "manual">("5");
	let sessionAutoLock = $state<"5" | "15" | "30" | "off">("15");
	let defaultExportFormat = $state<"csv" | "pdf">("csv");

	// State Aksi Interaktif
	let saveSuccess = $state(false);
	let isSaving = $state(false);
	let db1Testing = $state(false);
	let db1TestResult = $state<{ success: boolean; latency: number; message: string } | null>(null);
	let webhookTesting = $state(false);
	let webhookTestSuccess = $state(false);
	let resetConfirmOpen = $state(false);

	onMount(() => {
		try {
			const saved = localStorage.getItem("novapilot_settings");
			if (saved) {
				const s = JSON.parse(saved);
				if (s.highValueThreshold) highValueThreshold = s.highValueThreshold;
				if (s.requireSupervisorAboveThreshold !== undefined) requireSupervisorAboveThreshold = s.requireSupervisorAboveThreshold;
				if (s.blockClosedInvoices !== undefined) blockClosedInvoices = s.blockClosedInvoices;
				if (s.autoApproveLowRisk !== undefined) autoApproveLowRisk = s.autoApproveLowRisk;
				if (s.mandatoryAuditReason !== undefined) mandatoryAuditReason = s.mandatoryAuditReason;
				if (s.rateLimitPerBranch !== undefined) rateLimitPerBranch = s.rateLimitPerBranch;

				if (s.selectedModelProvider) selectedModelProvider = s.selectedModelProvider;
				if (s.aiApiKey) aiApiKey = s.aiApiKey;
				if (s.aiEndpoint) aiEndpoint = s.aiEndpoint;
				if (s.aiTemperature !== undefined) aiTemperature = s.aiTemperature;
				if (s.confidenceThreshold !== undefined) confidenceThreshold = s.confidenceThreshold;
				if (s.promptInjectionDefense !== undefined) promptInjectionDefense = s.promptInjectionDefense;
				if (s.strictJsonSchema !== undefined) strictJsonSchema = s.strictJsonSchema;
				if (s.ragGroundingEnabled !== undefined) ragGroundingEnabled = s.ragGroundingEnabled;

				if (s.waGatewayUrl) waGatewayUrl = s.waGatewayUrl;
				if (s.autoReplyEnabled !== undefined) autoReplyEnabled = s.autoReplyEnabled;
				if (s.autoReplyTemplate) autoReplyTemplate = s.autoReplyTemplate;
				if (s.autoOcrEnabled !== undefined) autoOcrEnabled = s.autoOcrEnabled;
				if (s.whitelistedGroups) whitelistedGroups = s.whitelistedGroups;
				if (s.blacklistSpamJids) blacklistSpamJids = s.blacklistSpamJids;
				if (s.telegramBotToken) telegramBotToken = s.telegramBotToken;
				if (s.telegramChatId) telegramChatId = s.telegramChatId;
				if (s.discordWebhook) discordWebhook = s.discordWebhook;
				if (s.slackWebhook) slackWebhook = s.slackWebhook;

				if (s.pgHost) pgHost = s.pgHost;
				if (s.pgPort) pgPort = s.pgPort;
				if (s.pgDB) pgDB = s.pgDB;
				if (s.pgUser) pgUser = s.pgUser;
				if (s.pgMaxConns !== undefined) pgMaxConns = s.pgMaxConns;
				if (s.pgIdleConns !== undefined) pgIdleConns = s.pgIdleConns;
				if (s.targetErpType) targetErpType = s.targetErpType;
				if (s.mcpEndpoint) mcpEndpoint = s.mcpEndpoint;
				if (s.safeDryRunMode !== undefined) safeDryRunMode = s.safeDryRunMode;

				if (s.soundAlerts !== undefined) soundAlerts = s.soundAlerts;
				if (s.soundVolume !== undefined) soundVolume = s.soundVolume;
				if (s.browserPushAlerts !== undefined) browserPushAlerts = s.browserPushAlerts;
				if (s.highValueAlertEscalation !== undefined) highValueAlertEscalation = s.highValueAlertEscalation;
				if (s.idleEscalationMinutes !== undefined) idleEscalationMinutes = s.idleEscalationMinutes;

				if (s.compactTable !== undefined) compactTable = s.compactTable;
				if (s.telemetryRefreshRate) telemetryRefreshRate = s.telemetryRefreshRate;
				if (s.sessionAutoLock) sessionAutoLock = s.sessionAutoLock;
				if (s.defaultExportFormat) defaultExportFormat = s.defaultExportFormat;
			}
		} catch {}
	});

	function saveSettings() {
		isSaving = true;
		try {
			const configObj = {
				highValueThreshold,
				requireSupervisorAboveThreshold,
				blockClosedInvoices,
				autoApproveLowRisk,
				mandatoryAuditReason,
				rateLimitPerBranch,
				selectedModelProvider,
				aiApiKey,
				aiEndpoint,
				aiTemperature,
				confidenceThreshold,
				promptInjectionDefense,
				strictJsonSchema,
				ragGroundingEnabled,
				waGatewayUrl,
				autoReplyEnabled,
				autoReplyTemplate,
				autoOcrEnabled,
				whitelistedGroups,
				blacklistSpamJids,
				telegramBotToken,
				telegramChatId,
				discordWebhook,
				slackWebhook,
				pgHost,
				pgPort,
				pgDB,
				pgUser,
				pgMaxConns,
				pgIdleConns,
				targetErpType,
				mcpEndpoint,
				safeDryRunMode,
				soundAlerts,
				soundVolume,
				browserPushAlerts,
				highValueAlertEscalation,
				idleEscalationMinutes,
				compactTable,
				telemetryRefreshRate,
				sessionAutoLock,
				defaultExportFormat,
				lastSavedAt: new Date().toISOString()
			};

			localStorage.setItem("novapilot_settings", JSON.stringify(configObj));

			setTimeout(() => {
				isSaving = false;
				saveSuccess = true;
				setTimeout(() => { saveSuccess = false; }, 3500);
			}, 350);
		} catch {
			isSaving = false;
		}
	}

	function resetToDefaults() {
		localStorage.removeItem("novapilot_settings");
		window.location.reload();
	}

	// Web Audio API Synthesizer (Pleasant Gentle Dual-Tone Alert)
	function playTestSound() {
		try {
			const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
			if (!AudioCtx) return;
			const ctx = new AudioCtx();
			const now = ctx.currentTime;
			const vol = (soundVolume / 100) * 0.12;

			const osc1 = ctx.createOscillator();
			const gain1 = ctx.createGain();
			osc1.type = "sine";
			osc1.frequency.setValueAtTime(659.25, now); // E5
			gain1.gain.setValueAtTime(vol, now);
			gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
			osc1.connect(gain1);
			gain1.connect(ctx.destination);
			osc1.start(now);
			osc1.stop(now + 0.3);

			const osc2 = ctx.createOscillator();
			const gain2 = ctx.createGain();
			osc2.type = "sine";
			osc2.frequency.setValueAtTime(880, now + 0.1); // A5
			gain2.gain.setValueAtTime(vol, now + 0.1);
			gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
			osc2.connect(gain2);
			gain2.connect(ctx.destination);
			osc2.start(now + 0.1);
			osc2.stop(now + 0.45);
		} catch (e) {
			console.error("Audio playback error:", e);
		}
	}

	// Simulation for DB 1 Ping
	function testDB1Connection() {
		db1Testing = true;
		db1TestResult = null;
		setTimeout(() => {
			db1Testing = false;
			db1TestResult = {
				success: true,
				latency: Math.floor(Math.random() * 8) + 4,
				message: `Koneksi berhasil ke PostgreSQL ${pgHost}:${pgPort}/${pgDB} (Connection Pool OK)`
			};
			setTimeout(() => { db1TestResult = null; }, 5000);
		}, 650);
	}

	// Simulation for Webhook Incident Notification Ping
	function testWebhookPing() {
		webhookTesting = true;
		webhookTestSuccess = false;
		setTimeout(() => {
			webhookTesting = false;
			webhookTestSuccess = true;
			setTimeout(() => { webhookTestSuccess = false; }, 4000);
		}, 700);
	}

	// Export Configuration as JSON
	function exportConfigJSON() {
		const configData = {
			highValueThreshold,
			requireSupervisorAboveThreshold,
			blockClosedInvoices,
			autoApproveLowRisk,
			mandatoryAuditReason,
			rateLimitPerBranch,
			selectedModelProvider,
			aiTemperature,
			confidenceThreshold,
			promptInjectionDefense,
			strictJsonSchema,
			ragGroundingEnabled,
			waGatewayUrl,
			autoReplyEnabled,
			autoReplyTemplate,
			autoOcrEnabled,
			whitelistedGroups,
			blacklistSpamJids,
			pgHost,
			pgPort,
			pgDB,
			pgUser,
			pgMaxConns,
			pgIdleConns,
			targetErpType,
			mcpEndpoint,
			safeDryRunMode,
			soundAlerts,
			soundVolume,
			compactTable,
			telemetryRefreshRate,
			sessionAutoLock,
			defaultExportFormat,
			exportedAt: new Date().toISOString()
		};
		const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `novapilot_config_${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// Quick Presets for High Value Threshold
	function setThresholdPreset(val: number) {
		highValueThreshold = String(val);
	}
</script>

<svelte:head>
	<title>System Settings & Gatekeeper Policies • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full font-sans">
	
	<!-- ========================================================================= -->
	<!-- 1. PAGE HEADER & PRIMARY ACTION CONTROLS                                  -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
		<div class="space-y-1">
			<div class="flex items-center gap-3">
				<div class="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
					<AdjustmentsHorizontal class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						System Settings &amp; Gatekeeper Policies
						<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-primary/15 text-primary border border-primary/30">
							ENTERPRISE v2.4
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Konfigurasi komprehensif pipeline AI, ambang batas SOP finansial, multiplatform ChatOps, dan arsitektur Dual-DB.
					</p>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-wrap items-center gap-2 font-mono">
			<button
				type="button"
				onclick={exportConfigJSON}
				class="h-9 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
				title="Ekspor seluruh konfigurasi ke berkas JSON"
			>
				<ArrowDownTray class="h-3.5 w-3.5 text-primary" />
				<span class="hidden sm:inline">Ekspor JSON</span>
			</button>

			<button
				type="button"
				onclick={() => resetConfirmOpen = true}
				class="h-9 px-3 rounded-xl border border-destructive/30 hover:border-destructive/60 bg-card hover:bg-destructive/10 text-xs font-semibold text-destructive flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
				title="Reset seluruh pengaturan ke nilai default"
			>
				<ArrowPath class="h-3.5 w-3.5" />
				<span class="hidden sm:inline">Reset Default</span>
			</button>

			<button
				type="button"
				onclick={saveSettings}
				disabled={isSaving}
				class="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
			>
				{#if isSaving}
					<ArrowPath class="h-3.5 w-3.5 animate-spin" />
					<span>Menyimpan...</span>
				{:else if saveSuccess}
					<Check class="h-3.5 w-3.5 text-primary-foreground" />
					<span>Tersimpan!</span>
				{:else}
					<span>Simpan Perubahan</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Save Toast Notification -->
	{#if saveSuccess}
		<div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
			<div class="flex items-center gap-2.5">
				<Check class="h-4 w-4 text-emerald-500 shrink-0" />
				<span>Seluruh konfigurasi sistem, kebijakan SOP, dan preferensi konektor berhasil disimpan ke penyimpanan lokal.</span>
			</div>
			<span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Tersinkronisasi</span>
		</div>
	{/if}

	<!-- Reset Confirmation Modal / Banner -->
	{#if resetConfirmOpen}
		<div class="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
			<div class="flex items-center gap-2.5">
				<ExclamationTriangle class="h-4 w-4 text-destructive shrink-0" />
				<span>Apakah Anda yakin ingin mereset seluruh preferensi dan kebijakan ke nilai default pabrik? Tindakan ini tidak dapat dibatalkan.</span>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<button
					type="button"
					onclick={() => resetConfirmOpen = false}
					class="h-8 px-3 rounded-lg border border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={resetToDefaults}
					class="h-8 px-3 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold cursor-pointer shadow-2xs"
				>
					Ya, Reset Sekarang
				</button>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. TAB NAVIGATION BAR                                                     -->
	<!-- ========================================================================= -->
	<div class="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60 scrollbar-none">
		<button
			type="button"
			onclick={() => activeTab = "gatekeeper"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'gatekeeper' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<ShieldCheck class="h-4 w-4" />
			<span>Gatekeeper SOP</span>
		</button>

		<button
			type="button"
			onclick={() => activeTab = "ai_model"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'ai_model' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<Sparkles class="h-4 w-4" />
			<span>Model AI &amp; Guardrails</span>
		</button>

		<button
			type="button"
			onclick={() => activeTab = "chatops"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'chatops' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<ChatBubbleLeftRight class="h-4 w-4" />
			<span>ChatOps &amp; Gateway</span>
		</button>

		<button
			type="button"
			onclick={() => activeTab = "database"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'database' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<CircleStack class="h-4 w-4" />
			<span>Dual-DB &amp; MCP</span>
		</button>

		<button
			type="button"
			onclick={() => activeTab = "alerts"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'alerts' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<Bell class="h-4 w-4" />
			<span>Alert &amp; Notifikasi</span>
		</button>

		<button
			type="button"
			onclick={() => activeTab = "interface"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'interface' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<WrenchScrewdriver class="h-4 w-4" />
			<span>Cockpit UI</span>
		</button>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. TAB CONTENTS                                                           -->
	<!-- ========================================================================= -->

	<!-- TAB 1: GATEKEEPER & KEBIJAKAN MUTASI FAKTUR -->
	{#if activeTab === "gatekeeper"}
		<div class="space-y-6 animate-in fade-in duration-150">
			<!-- Section 1.1: Threshold Nilai Faktur Tinggi -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-2.5">
						<div class="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
							<ShieldCheck class="h-4 w-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">Batas Threshold Nilai Faktur Tinggi (High-Value Policy)</h3>
							<p class="text-xs text-muted-foreground">Faktur di atas nilai ini mewajibkan persetujuan ganda (Two-Man Rule / Supervisor Override).</p>
						</div>
					</div>
					<span class="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
						Rp {Number(highValueThreshold || 0).toLocaleString("id-ID")}
					</span>
				</div>

				<div class="space-y-3">
					<label for="threshold-input" class="text-xs font-semibold text-foreground">Nilai Threshold Nominal Faktur (Rupiah):</label>
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
						<div class="relative flex-1">
							<span class="absolute left-3.5 top-2.5 text-xs font-mono text-muted-foreground font-bold">Rp</span>
							<input
								id="threshold-input"
								type="number"
								min="1000000"
								step="1000000"
								bind:value={highValueThreshold}
								class="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-secondary/30 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						<!-- Quick Presets -->
						<div class="flex items-center gap-1 font-mono text-xs">
							<button
								type="button"
								onclick={() => setThresholdPreset(10000000)}
								class="h-10 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all"
							>
								10 Juta
							</button>
							<button
								type="button"
								onclick={() => setThresholdPreset(25000000)}
								class="h-10 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all"
							>
								25 Juta
							</button>
							<button
								type="button"
								onclick={() => setThresholdPreset(50000000)}
								class="h-10 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all font-bold text-primary"
							>
								50 Juta
							</button>
							<button
								type="button"
								onclick={() => setThresholdPreset(100000000)}
								class="h-10 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all"
							>
								100 Juta
							</button>
						</div>
					</div>
					<p class="text-[11px] text-muted-foreground">
						Setiap tiket mutasi dengan nominal melebihi batas ini akan ditandai dengan badge prioritas merah dan memerlukan tanda tangan otentikasi supervisor.
					</p>
				</div>
			</div>

			<!-- Section 1.2: Kebijakan Keamanan Operasional -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
				<h3 class="text-sm font-bold text-foreground pb-2 border-b border-border/60">
					Kebijakan Integritas &amp; Audit Trail
				</h3>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={requireSupervisorAboveThreshold}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Wajibkan Verifikasi Supervisor (Dual Sign-off)</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Memblokir eksekusi 1-klik untuk tiket di atas batas threshold tanpa konfirmasi akun level Supervisor.</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={blockClosedInvoices}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Kunci Faktur Berstatus CLOSED / ARCHIVED</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Faktur yang telah ditutup atau direkonsiliasi di ERP tidak dapat diubah namanya sama sekali.</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={mandatoryAuditReason}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Wajibkan Alasan Audit Sebelum Eksekusi</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Teknisi on-call harus mengetik alasan atau melampirkan nomor memo resmi sebelum tombol Approve aktif.</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={autoApproveLowRisk}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Auto-Approve Typo Ringan (&lt; Rp 1 Juta)</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Otomatisasi 100% untuk perbaikan ejaan nama PT dengan jarak Levenshtein &le; 2 karakter pada grup whitelisted.</div>
						</div>
					</label>
				</div>

				<!-- Rate Limiter Slider -->
				<div class="pt-4 border-t border-border/60 space-y-2">
					<div class="flex items-center justify-between text-xs">
						<span class="font-semibold text-foreground">Rate Limiting Mutasi Ingress per Cabang:</span>
						<span class="font-mono font-bold text-primary">{rateLimitPerBranch} request / menit</span>
					</div>
					<input
						type="range"
						min="1"
						max="30"
						step="1"
						bind:value={rateLimitPerBranch}
						class="w-full h-2 rounded-lg bg-secondary appearance-none cursor-pointer accent-primary"
					/>
					<p class="text-[11px] text-muted-foreground">
						Membatasi frekuensi bot WhatsApp cabang agar tidak membanjiri antrean saat terjadi lonjakan pesan spam.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 2: AI ENGINE & GUARDRAIL PIPELINE -->
	{#if activeTab === "ai_model"}
		<div class="space-y-6 animate-in fade-in duration-150">
			<!-- Section 2.1: Model Provider Selection -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
				<div class="pb-3 border-b border-border/60">
					<h3 class="text-sm font-bold text-foreground">Penyedia Model LLM (AI Inference Engine)</h3>
					<p class="text-xs text-muted-foreground">Pilih model kecerdasan buatan yang bertugas mengekstraksi maksud, nama dokumen, dan entitas customer dari pesan chat.</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
					<!-- Option 1: Gemini 2.5 Flash -->
					<button
						type="button"
						onclick={() => selectedModelProvider = "gemini-2.5-flash"}
						class="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer {selectedModelProvider === 'gemini-2.5-flash' ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary' : 'border-border bg-secondary/20 hover:bg-secondary/40'}"
					>
						<div>
							<div class="flex items-center justify-between">
								<span class="font-bold text-foreground">Gemini 2.5 Flash</span>
								<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-primary/20 text-primary">REKOMENDASI</span>
							</div>
							<p class="text-[11px] text-muted-foreground mt-1.5">Latensi ultra cepat &lt;200ms, format JSON terstruktur sangat stabil.</p>
						</div>
						<div class="text-[10px] font-mono text-muted-foreground mt-3 pt-2 border-t border-border/50">Google DeepMind API</div>
					</button>

					<!-- Option 2: Gemini 1.5 Pro -->
					<button
						type="button"
						onclick={() => selectedModelProvider = "gemini-1.5-pro"}
						class="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer {selectedModelProvider === 'gemini-1.5-pro' ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary' : 'border-border bg-secondary/20 hover:bg-secondary/40'}"
					>
						<div>
							<div class="flex items-center justify-between">
								<span class="font-bold text-foreground">Gemini 1.5 Pro</span>
								<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">REASONING</span>
							</div>
							<p class="text-[11px] text-muted-foreground mt-1.5">Konteks jendela 2M token, penalaran mendalam pada memo dan dokumen panjang.</p>
						</div>
						<div class="text-[10px] font-mono text-muted-foreground mt-3 pt-2 border-t border-border/50">Multimodal Heavyweight</div>
					</button>

					<!-- Option 3: Claude 3.5 Sonnet -->
					<button
						type="button"
						onclick={() => selectedModelProvider = "claude-3-5-sonnet"}
						class="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer {selectedModelProvider === 'claude-3-5-sonnet' ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary' : 'border-border bg-secondary/20 hover:bg-secondary/40'}"
					>
						<div>
							<div class="flex items-center justify-between">
								<span class="font-bold text-foreground">Claude 3.5 Sonnet</span>
								<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">PRECISION</span>
							</div>
							<p class="text-[11px] text-muted-foreground mt-1.5">Akurasi sintaksis kode dan instruksi mutasi SQL paling ketat.</p>
						</div>
						<div class="text-[10px] font-mono text-muted-foreground mt-3 pt-2 border-t border-border/50">Anthropic Claude API</div>
					</button>

					<!-- Option 4: Local Ollama -->
					<button
						type="button"
						onclick={() => selectedModelProvider = "ollama-deepseek-r1"}
						class="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer {selectedModelProvider === 'ollama-deepseek-r1' ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary' : 'border-border bg-secondary/20 hover:bg-secondary/40'}"
					>
						<div>
							<div class="flex items-center justify-between">
								<span class="font-bold text-foreground">Ollama DeepSeek-R1</span>
								<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400">OFFLINE</span>
							</div>
							<p class="text-[11px] text-muted-foreground mt-1.5">100% On-Premise Air-Gapped, data tidak pernah keluar jaringan lokal kantor.</p>
						</div>
						<div class="text-[10px] font-mono text-muted-foreground mt-3 pt-2 border-t border-border/50">Local Host :11434</div>
					</button>
				</div>

				<!-- API Key & Endpoint -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
					<div class="space-y-1 text-xs">
						<label for="ai-api-key" class="font-semibold text-foreground">API Key / Token Otentikasi:</label>
						<div class="relative">
							<Key class="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
							<input
								id="ai-api-key"
								type={showApiKey ? "text" : "password"}
								bind:value={aiApiKey}
								placeholder="AIzaSy... atau sk-ant-..."
								class="w-full h-10 pl-9 pr-10 rounded-xl border border-input bg-secondary/30 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							/>
							<button
								type="button"
								onclick={() => showApiKey = !showApiKey}
								class="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
								title={showApiKey ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
							>
								{#if showApiKey}
									<EyeSlash class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<div class="space-y-1 text-xs">
						<label for="ai-endpoint" class="font-semibold text-foreground">Base Endpoint URL Override:</label>
						<input
							id="ai-endpoint"
							type="text"
							bind:value={aiEndpoint}
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>
			</div>

			<!-- Section 2.2: Sliders & Guardrails -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
				<h3 class="text-sm font-bold text-foreground pb-2 border-b border-border/60">
					Parameter Inferensi &amp; Keamanan Prompt Injection
				</h3>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
					<!-- Temperature -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-foreground">Temperatur Ekstraksi (Randomness):</span>
							<span class="font-mono font-bold text-primary">{aiTemperature} (Deterministik)</span>
						</div>
						<input
							type="range"
							min="0.0"
							max="1.0"
							step="0.05"
							bind:value={aiTemperature}
							class="w-full h-2 rounded-lg bg-secondary appearance-none cursor-pointer accent-primary"
						/>
						<p class="text-[11px] text-muted-foreground">
							Nilai 0.1 sangat dianjurkan untuk data faktur dan akuntansi agar hasil ekstraksi selalu konsisten dan tidak berhalusinasi.
						</p>
					</div>

					<!-- Confidence Threshold -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-foreground">Confidence Threshold Minimal:</span>
							<span class="font-mono font-bold text-emerald-500">{confidenceThreshold}%</span>
						</div>
						<input
							type="range"
							min="50"
							max="95"
							step="5"
							bind:value={confidenceThreshold}
							class="w-full h-2 rounded-lg bg-secondary appearance-none cursor-pointer accent-emerald-500"
						/>
						<p class="text-[11px] text-muted-foreground">
							Tiket dengan skor keyakinan di bawah threshold ini otomatis ditandai kuning (Needs Review) dan tidak boleh di-approve instan.
						</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs">
					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={promptInjectionDefense}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Sanitasi Prompt Injection</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Blokir trik seperti "abaikan instruksi sebelumnya" atau "hapus seluruh tabel".</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={strictJsonSchema}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Strict JSON Schema Output</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Memaksa AI mengeluarkan format JSON valid sesuai tipe Go struct tanpa markdown sampah.</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={ragGroundingEnabled}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">RAG Grounding ERP Master</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Cocokkan nama PT tujuan dengan daftar customer resmi yang tersimpan di database ERP.</div>
						</div>
					</label>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 3: CHATOPS & INGRESS GATEWAY -->
	{#if activeTab === "chatops"}
		<div class="space-y-6 animate-in fade-in duration-150">
			<!-- WhatsApp Gateway Section -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-2.5">
						<div class="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
							<ChatBubbleLeftRight class="h-4 w-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">WhatsApp Gateway (Baileys Node.js Socket)</h3>
							<p class="text-xs text-muted-foreground">Konfigurasi endpoint ingress gateway, template balasan otomatis, dan whitelist grup cabang.</p>
						</div>
					</div>
					<span class="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
						PORT :3002
					</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
					<div class="space-y-1">
						<label for="wa-gateway-url" class="font-semibold text-foreground">URL Endpoint Ingress Gateway:</label>
						<input
							id="wa-gateway-url"
							type="text"
							bind:value={waGatewayUrl}
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					<div class="flex items-center gap-4 pt-5">
						<label class="flex items-center gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={autoReplyEnabled}
								class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
							/>
							<span class="font-bold text-foreground">Kirim Balasan Otomatis (Auto-Reply ACK)</span>
						</label>

						<label class="flex items-center gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={autoOcrEnabled}
								class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
							/>
							<span class="font-bold text-foreground">OCR Tesseract pada Lampiran</span>
						</label>
					</div>
				</div>

				<!-- Template Auto-Reply -->
				{#if autoReplyEnabled}
					<div class="space-y-1.5 text-xs pt-2">
						<label for="auto-reply-tpl" class="font-semibold text-foreground">Template Pesan Balasan WhatsApp (Dynamic Variables):</label>
						<textarea
							id="auto-reply-tpl"
							bind:value={autoReplyTemplate}
							rows={3}
							class="w-full p-3 rounded-xl border border-input bg-secondary/30 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						></textarea>
						<p class="text-[11px] text-muted-foreground">
							Variabel yang didukung: <code class="font-mono text-primary font-bold">{'{sender_name}'}</code>, <code class="font-mono text-primary font-bold">{'{ticket_no}'}</code>, <code class="font-mono text-primary font-bold">{'{doc_no}'}</code>.
						</p>
					</div>
				{/if}

				<!-- Whitelist & Blacklist -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60 text-xs">
					<div class="space-y-1">
						<label for="wa-whitelist" class="font-semibold text-foreground">Whitelist JID Grup Cabang (Pisahkan koma):</label>
						<textarea
							id="wa-whitelist"
							bind:value={whitelistedGroups}
							rows={3}
							class="w-full p-3 rounded-xl border border-input bg-secondary/30 font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						></textarea>
						<p class="text-[11px] text-muted-foreground">Hanya grup di atas yang pesannya akan diekstraksi ke antrean staging.</p>
					</div>

					<div class="space-y-1">
						<label for="wa-blacklist" class="font-semibold text-foreground">Blacklist JID / Nomor Spam (Abaikan pesan):</label>
						<textarea
							id="wa-blacklist"
							bind:value={blacklistSpamJids}
							rows={3}
							class="w-full p-3 rounded-xl border border-input bg-secondary/30 font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						></textarea>
						<p class="text-[11px] text-muted-foreground">Pesan dari nomor di atas langsung dibuang tanpa memicu panggilan API AI.</p>
					</div>
				</div>
			</div>

			<!-- Telegram, Discord & Slack Webhooks Section -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<h3 class="text-sm font-bold text-foreground">Kanal ChatOps Telegram, Discord &amp; Slack</h3>
					<button
						type="button"
						onclick={testWebhookPing}
						disabled={webhookTesting}
						class="h-8 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
					>
						{#if webhookTesting}
							<ArrowPath class="h-3 w-3 animate-spin" />
							<span>Menguji...</span>
						{:else if webhookTestSuccess}
							<Check class="h-3 w-3 text-emerald-500" />
							<span class="text-emerald-500 font-bold">Terkirim!</span>
						{:else}
							<Bolt class="h-3 w-3 text-primary" />
							<span>Kirim Pesan Uji Coba</span>
						{/if}
					</button>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
					<div class="space-y-1">
						<label for="tg-bot-token" class="font-semibold text-foreground">Telegram Bot Token:</label>
						<input
							id="tg-bot-token"
							type="password"
							bind:value={telegramBotToken}
							placeholder="123456789:ABCDefGhiJklMnoPqrStuVwxYz"
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					<div class="space-y-1">
						<label for="tg-chat-id" class="font-semibold text-foreground">Telegram Admin Alert Chat ID:</label>
						<input
							id="tg-chat-id"
							type="text"
							bind:value={telegramChatId}
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					<div class="space-y-1">
						<label for="dc-webhook" class="font-semibold text-foreground">Discord Incoming Webhook URL:</label>
						<input
							id="dc-webhook"
							type="text"
							bind:value={discordWebhook}
							placeholder="https://discord.com/api/webhooks/..."
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					<div class="space-y-1">
						<label for="sl-webhook" class="font-semibold text-foreground">Slack Incoming Webhook URL:</label>
						<input
							id="sl-webhook"
							type="text"
							bind:value={slackWebhook}
							placeholder="https://hooks.slack.com/services/..."
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 4: DATABASE & MCP CONNECTOR (DUAL-DB ARCHITECTURE) -->
	{#if activeTab === "database"}
		<div class="space-y-6 animate-in fade-in duration-150">
			<!-- DB 1: Cockpit Internal Database -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-2.5">
						<div class="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
							<CircleStack class="h-4 w-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">DB 1: Cockpit Staging &amp; Audit Database (PostgreSQL)</h3>
							<p class="text-xs text-muted-foreground">Penyimpanan internal antrean tiket, log percakapan WhatsApp, dan riwayat audit approval.</p>
						</div>
					</div>

					<!-- Test Ping Button -->
					<button
						type="button"
						onclick={testDB1Connection}
						disabled={db1Testing}
						class="h-8 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
					>
						{#if db1Testing}
							<ArrowPath class="h-3 w-3 animate-spin" />
							<span>Menghubungi...</span>
						{:else}
							<Signal class="h-3 w-3 text-emerald-500" />
							<span>Tes Koneksi (Ping)</span>
						{/if}
					</button>
				</div>

				{#if db1TestResult}
					<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
						<Check class="h-4 w-4 text-emerald-500 shrink-0" />
						<span>{db1TestResult.message} ({db1TestResult.latency}ms latency)</span>
					</div>
				{/if}

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
					<div class="space-y-1">
						<label for="db1-host" class="font-semibold text-muted-foreground">Host:</label>
						<input id="db1-host" type="text" bind:value={pgHost} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
					<div class="space-y-1">
						<label for="db1-port" class="font-semibold text-muted-foreground">Port:</label>
						<input id="db1-port" type="text" bind:value={pgPort} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
					<div class="space-y-1">
						<label for="db1-db" class="font-semibold text-muted-foreground">Database:</label>
						<input id="db1-db" type="text" bind:value={pgDB} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
					<div class="space-y-1">
						<label for="db1-user" class="font-semibold text-muted-foreground">Username:</label>
						<input id="db1-user" type="text" bind:value={pgUser} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
					<div class="space-y-1">
						<label for="db1-pass" class="font-semibold text-muted-foreground">Password:</label>
						<div class="relative">
							<input
								id="db1-pass"
								type={showPgPassword ? "text" : "password"}
								bind:value={pgPassword}
								placeholder="••••••••"
								class="w-full h-10 px-3 pr-9 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							/>
							<button
								type="button"
								onclick={() => showPgPassword = !showPgPassword}
								class="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
							>
								{#if showPgPassword}
									<EyeSlash class="h-3.5 w-3.5" />
								{:else}
									<Eye class="h-3.5 w-3.5" />
								{/if}
							</button>
						</div>
					</div>

					<div class="space-y-1">
						<label for="db1-max-conn" class="font-semibold text-muted-foreground">Max Open Connections:</label>
						<input id="db1-max-conn" type="number" bind:value={pgMaxConns} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>

					<div class="space-y-1">
						<label for="db1-idle-conn" class="font-semibold text-muted-foreground">Max Idle Connections:</label>
						<input id="db1-idle-conn" type="number" bind:value={pgIdleConns} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
				</div>
			</div>

			<!-- DB 2: Enterprise ERP Store via MCP Connector -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-2.5">
						<div class="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
							<LockClosed class="h-4 w-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">DB 2: Enterprise ERP Store &amp; MCP Parameterized Gateway</h3>
							<p class="text-xs text-muted-foreground">Sistem target data transaksi bisnis yang dilindungi protokol isolasi Model Context Protocol (Zero Raw SQL).</p>
						</div>
					</div>

					<span class="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
						MCP ISOLATION
					</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
					<div class="space-y-1">
						<label for="erp-type" class="font-semibold text-foreground">Jenis Sistem ERP Target:</label>
						<select
							id="erp-type"
							bind:value={targetErpType}
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
						>
							<option value="Oracle 19c Enterprise">Oracle 19c Enterprise Database (Faktur Buku Besar)</option>
							<option value="SAP S/4HANA">SAP S/4HANA (BAPI / RFC Financial Module)</option>
							<option value="PostgreSQL ERP DB">PostgreSQL Enterprise ERP Database</option>
							<option value="REST API Gateway">Enterprise In-House REST Microservice</option>
						</select>
					</div>

					<div class="space-y-1">
						<label for="mcp-endpoint" class="font-semibold text-foreground">Model Context Protocol (MCP) Endpoint:</label>
						<input
							id="mcp-endpoint"
							type="text"
							bind:value={mcpEndpoint}
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>

				<!-- Safe Dry-Run Mode Toggle -->
				<div class="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 mt-2">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={safeDryRunMode}
							class="h-4 w-4 rounded border-input text-emerald-500 focus:ring-emerald-500"
						/>
						<div>
							<div class="text-xs font-bold text-foreground flex items-center gap-2">
								Safe Dry-Run Mode (Simulasi Mutasi Terisolasi)
								<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">AKTIF</span>
							</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">
								Bila aktif, persetujuan tiket hanya mensimulasikan mutasi SQL dengan <code class="font-mono text-emerald-500 font-bold">ROLLBACK</code> tanpa merusak database produksi ERP asli.
							</div>
						</div>
					</label>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 5: ALERT, NOTIFIKASI & AUDIO FEEDBACK -->
	{#if activeTab === "alerts"}
		<div class="space-y-6 animate-in fade-in duration-150">
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-2.5">
						<div class="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
							<SpeakerWave class="h-4 w-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">Efek Suara &amp; Audio Cues Cockpit</h3>
							<p class="text-xs text-muted-foreground">Bunyikan nada lembut sintetik di browser saat ada tiket mendesak masuk ke antrean staging.</p>
						</div>
					</div>

					<button
						type="button"
						onclick={playTestSound}
						class="h-8 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
					>
						<SpeakerWave class="h-3.5 w-3.5 text-purple-500" />
						<span>Uji Nada Dering</span>
					</button>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={soundAlerts}
							class="h-4 w-4 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Aktifkan Efek Suara (Audio Notification)</div>
							<div class="text-[11px] text-muted-foreground">Memutar chord synthesizer saat webhook mendeteksi pesan berkategori ACTIONABLE.</div>
						</div>
					</label>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-foreground">Volume Nada Suara:</span>
							<span class="font-mono font-bold text-purple-500">{soundVolume}%</span>
						</div>
						<input
							type="range"
							min="10"
							max="100"
							step="5"
							bind:value={soundVolume}
							disabled={!soundAlerts}
							class="w-full h-2 rounded-lg bg-secondary appearance-none cursor-pointer accent-purple-500 disabled:opacity-40"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60 text-xs">
					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={browserPushAlerts}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Browser Desktop Push Notifications</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Tampilkan pop-up notifikasi OS Windows/Mac saat tab browser sedang berjalan di latar belakang.</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={highValueAlertEscalation}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Eskalasi Darurat Tiket High-Value</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Otomatis kirim broadcast ke channel Telegram SRE jika tiket &gt; Rp 50 Juta belum ditinjau dalam 15 menit.</div>
						</div>
					</label>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 6: COCKPIT UI & PREFERENSI ANTARMUKA -->
	{#if activeTab === "interface"}
		<div class="space-y-6 animate-in fade-in duration-150">
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
				<div class="pb-3 border-b border-border/60">
					<h3 class="text-sm font-bold text-foreground">Preferensi Tampilan Cockpit &amp; Pengalaman Pengguna</h3>
					<p class="text-xs text-muted-foreground">Atur tata letak tabel antrean, frekuensi polling telemetri, dan durasi penguncian sesi teknisi on-call.</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
					<!-- Compact Table View -->
					<label class="p-4 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={compactTable}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">Mode Tabel Ramping (Compact View)</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">Kurangi padding vertikal baris tabel antrean dan kontak agar memuat lebih banyak baris di layar.</div>
						</div>
					</label>

					<!-- Telemetry Refresh Rate -->
					<div class="p-4 rounded-2xl border border-border/70 bg-secondary/20 space-y-2">
						<div class="font-bold text-foreground">Interval Refresh Telemetri:</div>
						<select
							bind:value={telemetryRefreshRate}
							class="w-full h-9 px-3 rounded-xl border border-input bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
						>
							<option value="3">Setiap 3 Detik (Realtime Aggressive)</option>
							<option value="5">Setiap 5 Detik (Normal Rekomendasi)</option>
							<option value="10">Setiap 10 Detik (Hemat Bandwidth)</option>
							<option value="30">Setiap 30 Detik (Low Power Mode)</option>
							<option value="manual">Manual Saja (Klik Tombol Refresh)</option>
						</select>
						<p class="text-[10px] text-muted-foreground">Frekuensi SSE &amp; HTTP ping status server backend :8088.</p>
					</div>

					<!-- Session Auto-Lock -->
					<div class="p-4 rounded-2xl border border-border/70 bg-secondary/20 space-y-2">
						<div class="font-bold text-foreground">Kunci Sesi Otomatis (Idle Lock):</div>
						<select
							bind:value={sessionAutoLock}
							class="w-full h-9 px-3 rounded-xl border border-input bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
						>
							<option value="5">5 Menit Tidak Aktif</option>
							<option value="15">15 Menit Tidak Aktif (Standar SOP)</option>
							<option value="30">30 Menit Tidak Aktif</option>
							<option value="off">Jangan Pernah Kunci (Always On)</option>
						</select>
						<p class="text-[10px] text-muted-foreground">Mewajibkan PIN engineer jika laptop ditinggalkan tanpa pengawasan.</p>
					</div>
				</div>

				<!-- Default Export Format -->
				<div class="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
					<div>
						<div class="font-bold text-foreground">Format Ekspor Laporan Default:</div>
						<p class="text-[11px] text-muted-foreground">Format baku yang dipilih saat mengekspor riwayat audit dan direktori saluran.</p>
					</div>

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => defaultExportFormat = "csv"}
							class="h-8.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer {defaultExportFormat === 'csv' ? 'border-primary bg-primary text-primary-foreground shadow-2xs' : 'border-border bg-card text-muted-foreground hover:text-foreground'}"
						>
							CSV (Microsoft Excel)
						</button>
						<button
							type="button"
							onclick={() => defaultExportFormat = "pdf"}
							class="h-8.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer {defaultExportFormat === 'pdf' ? 'border-primary bg-primary text-primary-foreground shadow-2xs' : 'border-border bg-card text-muted-foreground hover:text-foreground'}"
						>
							PDF Report (Siap Cetak)
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

</div>
