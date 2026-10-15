<script lang="ts">
	import { onMount } from "svelte";
	import { 
		CpuChip, 
		Sparkles, 
		CommandLine, 
		CheckCircle, 
		ExclamationTriangle, 
		ArrowPath, 
		Bolt, 
		DocumentText, 
		ShieldCheck, 
		ClipboardDocument, 
		Check, 
		Play,
		AdjustmentsHorizontal,
		Server,
		CodeBracket,
		ChatBubbleLeftRight,
		Clock,
		ArrowRight
	} from "svelte-heros-v2";
	import { cockpit, type Ticket } from "$lib/cockpit.svelte";
	import { sound } from "$lib/audio";
	import OpenClawAgentSection from "$lib/components/OpenClawAgentSection.svelte";
	import BrandIcon from "$lib/components/BrandIcon.svelte";
	import { i18n } from "$lib/i18n.svelte";

	// Navigation Tabs: Hermes 3 vs OpenClaw only (9Router completely removed)
	let activeTab = $state<"hermes" | "openclaw">("hermes");

	// Engine Telemetry & Config State
	let llmConfig = $state<{
		mode: string;
		base_url: string;
		model: string;
		cli_path: string;
		cli_available?: boolean;
		cli_name?: string;
		provider: string;
		status: string;
		capabilities: string[];
	}>({
		mode: "auto",
		base_url: "http://localhost:11434/v1",
		model: "hermes3:8b",
		cli_path: "C:\\Users\\USER\\.local\\bin\\hermes.cmd",
		cli_available: true,
		cli_name: "Hermes Agent CLI (Windows Native)",
		provider: "NousResearch / Hermes-3-Llama-3.1",
		status: "ACTIVE",
		capabilities: ["thought_reasoning", "tool_calling", "heuristic_fallback"]
	});

	let configLoading = $state(false);
	let configSaved = $state(false);
	let configError = $state<string | null>(null);

	// Editable Config Inputs
	let editMode = $state("auto");
	let editBaseURL = $state("http://localhost:11434/v1");
	let editModel = $state("hermes3:8b");
	let editCliPath = $state("C:\\Users\\USER\\.local\\bin\\hermes.cmd");

	async function activateCliMode() {
		editMode = "cli";
		if (llmConfig.cli_path) {
			editCliPath = llmConfig.cli_path;
		}
		sound.playActionChime();
		await saveConfig();
	}

	// Interactive Reasoning Playground State
	let promptInput = $state("Tolong ganti nama customer di invoice INV-2024-001 jadi PT Maju Terus");
	let branchContext = $state("Surabaya Regional Hub");
	let isProcessing = $state(false);
	let copiedField = $state<string | null>(null);

	// LLM Process Response
	let processResult = $state<{
		raw_content: string;
		thought: string;
		tool_call?: {
			name: string;
			arguments: Record<string, any>;
		};
		is_fallback: boolean;
		model_used: string;
		latency_ms: number;
	} | null>(null);

	let stagingLoading = $state(false);
	let stagingSuccess = $state<string | null>(null);
	let stagingError = $state<string | null>(null);

	// Real-world Presets for Indonesian Enterprise Scenarios
	const presets = [
		{
			title: "Mutasi Faktur Customer",
			category: "UPDATE_CUSTOMER",
			branch: "Surabaya Regional Hub",
			badge: "Actionable",
			badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
			text: "Tolong ganti nama customer di invoice INV-2024-001 jadi PT Maju Terus Abadi"
		},
		{
			title: "Koreksi Typo Cabang Medan",
			category: "ADMIN_REVISION",
			branch: "Medan Logistics Hub",
			badge: "Typo Fix",
			badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
			text: "Selamat siang admin, tolong revisi invoice INV/2026/003 customer name dari CV Bintang Timur ke CV Bintang Timur Sejahtera karena salah ketik admin."
		},
		{
			title: "Cek Status Nota Tagihan",
			category: "INQUIRY",
			branch: "Semarang Hub",
			badge: "Inquiry",
			badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
			text: "Cek status nota INV/2026/002 dong min udah lunas belom untuk PT Karya Abadi Perkasa?"
		},
		{
			title: "Obrolan Santai (Casual Banter)",
			category: "CASUAL_DROP",
			branch: "Makassar Central Hub",
			badge: "Zero Token",
			badgeColor: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
			text: "Pagi mas, besok kantor cabang Surabaya buka jam berapa ya? Ada acara syukuran gak?"
		},
		{
			title: "SOP Closed Period Mutation",
			category: "POLICY_GATE",
			branch: "Surabaya Regional Hub",
			badge: "Policy Gate",
			badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
			text: "Tolong revisi invoice INV/2026/004 jadi UD Berkah Jaya sekarang juga penting!"
		}
	];

	async function loadConfig() {
		try {
			const res = await fetch("/api/llm/config");
			if (res.ok) {
				const json = await res.json();
				llmConfig = json;
				editMode = json.mode || "auto";
				editBaseURL = json.base_url || "http://localhost:11434/v1";
				editModel = json.model || "hermes3:8b";
				editCliPath = json.cli_path || "";
			}
		} catch (e) {
			console.error("Failed to load Hermes LLM config:", e);
		}
	}

	async function saveConfig() {
		configLoading = true;
		configSaved = false;
		configError = null;
		try {
			const res = await fetch("/api/llm/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					mode: editMode,
					base_url: editBaseURL,
					model: editModel,
					cli_path: editCliPath
				})
			});
			const json = await res.json();
			if (res.ok && json.ok) {
				configSaved = true;
				sound.playActionChime();
				await loadConfig();
				setTimeout(() => (configSaved = false), 3500);
			} else {
				configError = json.error || "Gagal menyimpan konfigurasi";
			}
		} catch (e: any) {
			configError = e.message;
		} finally {
			configLoading = false;
		}
	}

	async function runReasoningEngine() {
		if (!promptInput.trim()) return;
		isProcessing = true;
		stagingSuccess = null;
		stagingError = null;
		sound.playNavClick();

		try {
			const res = await fetch("/api/llm/process", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: promptInput,
					branch_context: branchContext
				})
			});
			if (res.ok) {
				const json = await res.json();
				processResult = json;
				sound.playActionChime();
			} else {
				const errJson = await res.json();
				processResult = {
					raw_content: "Error: " + (errJson.error || "Request failed"),
					thought: "Reasoning dibatalkan karena kegagalan upstream endpoint.",
					is_fallback: true,
					model_used: "error",
					latency_ms: 0
				};
			}
		} catch (e: any) {
			processResult = {
				raw_content: `Network Error: ${e.message}`,
				thought: "Tidak dapat terhubung ke endpoint /api/llm/process.",
				is_fallback: true,
				model_used: "client-error",
				latency_ms: 0
			};
		} finally {
			isProcessing = false;
		}
	}

	async function stageTicketDirectly() {
		if (!processResult?.tool_call) return;
		stagingLoading = true;
		stagingSuccess = null;
		stagingError = null;
		sound.playNavClick();

		const args = processResult.tool_call.arguments || {};
		const docNo = args.document_no || args.invoice_no || "INV/2026/001";
		const proposed = args.proposed_value || args.target_client || "";

		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: promptInput,
					branch_id: 1,
					channel: "whatsapp",
					document_no: docNo,
					proposed_value: proposed
				})
			});
			const json = await res.json();
			if (res.ok) {
				stagingSuccess = `Tiket #${json.ticket_no || 'STAGED'} berhasil dimasukkan ke Antrean Persetujuan (Approval Queue)!`;
				sound.playActionChime();
				cockpit.fetchTickets();
			} else {
				stagingError = json.error || "Gagal memasukkan tiket ke antrian database";
			}
		} catch (e: any) {
			stagingError = e.message;
		} finally {
			stagingLoading = false;
		}
	}

	function copyToClipboard(text: string, fieldName: string) {
		navigator.clipboard.writeText(text);
		copiedField = fieldName;
		sound.playNavClick();
		setTimeout(() => (copiedField = null), 2000);
	}

	function applyPreset(p: typeof presets[0]) {
		promptInput = p.text;
		branchContext = p.branch;
		runReasoningEngine();
	}

	onMount(() => {
		loadConfig();
		runReasoningEngine();
	});
</script>

<svelte:head>
	<title>AI Agents: Hermes 3 & OpenClaw | NovaPilot AI</title>
</svelte:head>

<div class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
	<!-- ========================================================================= -->
	<!-- 1. CLEAN HEADER (NO 9ROUTER, REAL LOGOS FROM SELFH.ST)                    -->
	<!-- ========================================================================= -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
		<div class="space-y-1">
			<div class="flex items-center gap-3 flex-wrap">
				<!-- Official Icons Pair -->
				<div class="flex items-center gap-2">
					<div class="h-10 w-10 rounded-xl bg-card border border-border p-2 shadow-xs flex items-center justify-center">
						<BrandIcon name="hermes" class="h-6 w-6" />
					</div>
					<div class="h-10 w-10 rounded-xl bg-card border border-border p-2 shadow-xs flex items-center justify-center">
						<BrandIcon name="openclaw" class="h-6 w-6" />
					</div>
				</div>

				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
						{i18n.t.agents.hub_title}
						<span class="text-[11px] font-mono px-2 py-0.5 rounded-md font-medium bg-muted text-muted-foreground border border-border">
							HERMES 3 &bull; OPENCLAW
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.agents.hub_subtitle}
					</p>
				</div>
			</div>
		</div>

		<!-- Channel Indicators & Shortcuts -->
		<div class="flex items-center gap-2 flex-wrap">
			<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card shadow-xs text-xs">
				<span class="text-[11px] text-muted-foreground font-mono">Channels:</span>
				<BrandIcon name="whatsapp" class="h-3.5 w-3.5" />
				<BrandIcon name="telegram" class="h-3.5 w-3.5" />
				<BrandIcon name="discord" class="h-3.5 w-3.5" />
				<BrandIcon name="slack" class="h-3.5 w-3.5" />
			</div>

			<a
				href="/flow"
				class="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
			>
				<Bolt class="h-3.5 w-3.5 text-primary" />
				<span>{i18n.t.nav.flows}</span>
			</a>

			<a
				href="/dashboard/messages"
				class="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
			>
				<ChatBubbleLeftRight class="h-3.5 w-3.5 text-muted-foreground" />
				<span>{i18n.t.nav.inbound}</span>
			</a>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 2. TWO TABS ONLY: HERMES 3 vs OPENCLAW (NO 9ROUTER)                       -->
	<!-- ========================================================================= -->
	<div class="flex items-center gap-2 border-b border-border pb-2">
		<button
			type="button"
			onclick={() => { activeTab = "hermes"; sound.playNavClick(); }}
			class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer {activeTab === 'hermes' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<BrandIcon name="hermes" class="h-4 w-4" />
			<span>{i18n.t.agents.hermes_title}</span>
			<span class="px-1.5 py-0.2 rounded text-[10px] font-mono {activeTab === 'hermes' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
				{i18n.t.agents.hermes_badge}
			</span>
		</button>

		<button
			type="button"
			onclick={() => { activeTab = "openclaw"; sound.playNavClick(); }}
			class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer {activeTab === 'openclaw' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<BrandIcon name="openclaw" class="h-4 w-4" />
			<span>{i18n.t.agents.openclaw_title}</span>
			<span class="px-1.5 py-0.2 rounded text-[10px] font-mono {activeTab === 'openclaw' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
				{i18n.t.agents.openclaw_badge}
			</span>
		</button>
	</div>

	{#if activeTab === "hermes"}
		<!-- ===================================================================== -->
		<!-- TAB 1: HERMES 3 REASONING ENGINE                                      -->
		<!-- ===================================================================== -->
		<div class="space-y-6">
			<!-- Telemetry Strips -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<!-- Provider -->
				<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
					<div class="flex items-center justify-between text-muted-foreground">
						<span class="text-xs font-medium">Model Architecture</span>
						<BrandIcon name="hermes" class="h-4 w-4" />
					</div>
					<div class="text-sm font-semibold font-mono text-foreground truncate">
						Hermes-3-Llama-3.1
					</div>
					<div class="text-[11px] text-muted-foreground font-mono">
						NousResearch Open Weights
					</div>
				</div>

				<!-- Mode -->
				<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
					<div class="flex items-center justify-between text-muted-foreground">
						<span class="text-xs font-medium">Execution Mode</span>
						<Server class="h-4 w-4 text-muted-foreground" />
					</div>
					<div class="text-sm font-semibold font-mono uppercase text-foreground flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full {llmConfig.mode === 'auto' ? 'bg-emerald-500' : 'bg-primary'}"></span>
						{llmConfig.mode}
					</div>
					<div class="text-[11px] text-muted-foreground font-mono truncate">
						{llmConfig.base_url}
					</div>
				</div>

				<!-- Reasoning Contract -->
				<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
					<div class="flex items-center justify-between text-muted-foreground">
						<span class="text-xs font-medium">Reasoning Contract</span>
						<CodeBracket class="h-4 w-4 text-muted-foreground" />
					</div>
					<div class="text-sm font-semibold font-mono text-foreground">
						<code>&lt;thought&gt;</code> &amp; <code>&lt;tool_call&gt;</code>
					</div>
					<div class="text-[11px] text-muted-foreground">
						Deterministic JSON Extraction
					</div>
				</div>

				<!-- Resilience Net -->
				<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
					<div class="flex items-center justify-between text-muted-foreground">
						<span class="text-xs font-medium">Offline Resilience</span>
						<ShieldCheck class="h-4 w-4 text-emerald-500" />
					</div>
					<div class="text-sm font-semibold font-mono text-foreground flex items-center gap-1.5">
						<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
						Regex Heuristic Net
					</div>
					<div class="text-[11px] text-muted-foreground">
						Zero-downtime offline fallback
					</div>
				</div>
			</div>

			<!-- Windows Native CLI Detection Banner -->
			{#if llmConfig.cli_available}
				<div class="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
							<CommandLine class="h-5 w-5 text-foreground" />
						</div>
						<div>
							<div class="flex items-center gap-2 flex-wrap">
								<h3 class="text-sm font-semibold text-foreground">
									{llmConfig.cli_name || 'Hermes Agent CLI (Windows Native)'}
								</h3>
								<span class="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
									TERDETEKSI
								</span>
								{#if llmConfig.mode === 'cli'}
									<span class="text-[10px] font-mono px-2 py-0.2 rounded bg-primary text-primary-foreground font-medium">
										ENGINE AKTIF
									</span>
								{/if}
							</div>
							<p class="text-xs text-muted-foreground mt-0.5 font-mono">
								Path: <code class="text-foreground">{llmConfig.cli_path}</code>
							</p>
						</div>
					</div>

					<div>
						{#if llmConfig.mode === 'cli'}
							<div class="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5 border border-emerald-500/20">
								<CheckCircle class="h-4 w-4" />
								<span>Menggunakan CLI</span>
							</div>
						{:else}
							<button
								type="button"
								onclick={activateCliMode}
								class="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
							>
								<Bolt class="h-3.5 w-3.5" />
								<span>Gunakan Engine CLI</span>
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Config Form & Parameter Editor -->
			<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<div>
						<h3 class="text-sm font-semibold text-foreground">Konfigurasi Endpoint &amp; Model Hermes</h3>
						<p class="text-xs text-muted-foreground">Koneksi lokal ke instance Ollama, vLLM, atau Hermes CLI wrapper.</p>
					</div>

					<button
						type="button"
						onclick={saveConfig}
						disabled={configLoading}
						class="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
					>
						<Bolt class="h-3.5 w-3.5" />
						<span>{configLoading ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
					</button>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
					<div class="space-y-1">
						<label for="modeSelect" class="font-medium text-muted-foreground">Mode Eksekusi</label>
						<select
							id="modeSelect"
							bind:value={editMode}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
						>
							<option value="auto">Auto (Prioritas Ollama HTTP, Fallback Heuristic)</option>
							<option value="cli">CLI Native (hermes.cmd)</option>
							<option value="http">HTTP Dedicated (Ollama / vLLM)</option>
						</select>
					</div>

					<div class="space-y-1">
						<label for="baseUrlInput" class="font-medium text-muted-foreground">Base URL API</label>
						<input
							id="baseUrlInput"
							type="text"
							bind:value={editBaseURL}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
							placeholder="http://localhost:11434/v1"
						/>
					</div>

					<div class="space-y-1">
						<label for="modelInput" class="font-medium text-muted-foreground">Nama Model LLM</label>
						<input
							id="modelInput"
							type="text"
							bind:value={editModel}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
							placeholder="hermes3:8b"
						/>
					</div>

					<div class="space-y-1">
						<label for="cliPathInput" class="font-medium text-muted-foreground">Path CLI Executable</label>
						<input
							id="cliPathInput"
							type="text"
							bind:value={editCliPath}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
							placeholder="C:\Users\USER\.local\bin\hermes.cmd"
						/>
					</div>
				</div>

				{#if configSaved}
					<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
						<CheckCircle class="h-4 w-4 shrink-0" />
						<span>Konfigurasi LLM berhasil disimpan ke runtime NovaPilot!</span>
					</div>
				{/if}

				{#if configError}
					<div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
						<ExclamationTriangle class="h-4 w-4 shrink-0" />
						<span>{configError}</span>
					</div>
				{/if}
			</div>

			<!-- Interactive Playground Console -->
			<div class="grid lg:grid-cols-12 gap-6 items-start">
				<!-- Left: Prompt & Scenario Presets (5 Cols) -->
				<div class="lg:col-span-5 space-y-4">
					<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
						<div class="flex items-center justify-between border-b border-border/60 pb-3">
							<div class="flex items-center gap-2">
								<CommandLine class="h-4 w-4 text-muted-foreground" />
								<h2 class="text-sm font-semibold text-foreground">Interactive Prompt Console</h2>
							</div>
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
								Zero Temp
							</span>
						</div>

						<!-- Quick Presets -->
						<div class="space-y-1.5">
							<span class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
								Preset Skenario Percakapan:
							</span>
							<div class="grid grid-cols-1 gap-1.5">
								{#each presets as p}
									<button
										type="button"
										onclick={() => applyPreset(p)}
										class="p-2.5 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted text-left transition-colors text-xs flex items-center justify-between gap-2 group cursor-pointer"
									>
										<div class="space-y-0.5 min-w-0">
											<div class="font-medium text-foreground flex items-center gap-1.5">
												<span class="truncate">{p.title}</span>
												<span class="text-[10px] px-1.5 py-0.1 rounded font-mono border {p.badgeColor}">
													{p.badge}
												</span>
											</div>
											<div class="text-[11px] text-muted-foreground line-clamp-1 italic font-mono">
												"{p.text}"
											</div>
										</div>
										<Play class="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0" />
									</button>
								{/each}
							</div>
						</div>

						<!-- Prompt Textarea -->
						<div class="space-y-1.5">
							<label for="promptInputArea" class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
								Pesan / Perintah Chat:
							</label>
							<textarea
								id="promptInputArea"
								bind:value={promptInput}
								rows="3"
								class="w-full p-2.5 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed resize-none"
								placeholder="Ketik instruksi chat WhatsApp/Telegram..."
							></textarea>
						</div>

						<!-- Branch Context -->
						<div class="space-y-1.5">
							<label for="branchContextInput" class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
								Konteks Cabang Regional:
							</label>
							<input
								id="branchContextInput"
								type="text"
								bind:value={branchContext}
								class="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
								placeholder="Contoh: Surabaya Regional Hub"
							/>
						</div>

						<!-- Submit Button -->
						<button
							type="button"
							onclick={runReasoningEngine}
							disabled={isProcessing || !promptInput.trim()}
							class="w-full h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
						>
							<Bolt class="h-3.5 w-3.5 {isProcessing ? 'animate-spin' : ''}" />
							<span>{isProcessing ? 'Menganalisis Penalaran...' : 'Jalankan Inferensi'}</span>
						</button>
					</div>
				</div>

				<!-- Right: Reasoning & Extraction Inspector (7 Cols) -->
				<div class="lg:col-span-7 space-y-4">
					<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
						<div class="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
							<div class="flex items-center gap-2">
								<Sparkles class="h-4 w-4 text-primary" />
								<h3 class="text-sm font-semibold text-foreground">Hasil Inferensi &amp; Ekstraksi</h3>
							</div>

							{#if processResult}
								<div class="flex items-center gap-2">
									<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
										{processResult.latency_ms}ms
									</span>
									{#if processResult.is_fallback}
										<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
											HEURISTIC REGEX
										</span>
									{:else}
										<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
											{processResult.model_used}
										</span>
									{/if}
								</div>
							{/if}
						</div>

						{#if isProcessing}
							<div class="p-12 text-center space-y-2">
								<ArrowPath class="h-6 w-6 text-primary animate-spin mx-auto" />
								<p class="text-xs text-muted-foreground font-mono">Memproses prompt melalui Hermes 3...</p>
							</div>
						{:else if processResult}
							<!-- 1. Reasoning Thought Block -->
							<div class="space-y-1.5">
								<div class="flex items-center justify-between">
									<span class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
										Penalaran Kognitif (&lt;thought&gt;):
									</span>
									<button
										type="button"
										onclick={() => copyToClipboard(processResult?.thought || "", "thought")}
										class="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-mono"
									>
										{#if copiedField === "thought"}
											<Check class="h-3 w-3 text-emerald-500" />
											<span class="text-emerald-500">Copied</span>
										{:else}
											<ClipboardDocument class="h-3 w-3" />
											<span>Salin</span>
										{/if}
									</button>
								</div>
								<div class="p-3.5 rounded-lg bg-muted/30 border border-border font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
									{processResult.thought || "Tidak ada blok pemikiran terpisah (direct output)."}
								</div>
							</div>

							<!-- 2. Structured Tool Arguments -->
							{#if processResult.tool_call}
								<div class="space-y-1.5">
									<div class="flex items-center justify-between">
										<span class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
											Ekstraksi Parameter Terstruktur (&lt;tool_call&gt;):
										</span>
										<button
											type="button"
											onclick={() => copyToClipboard(JSON.stringify(processResult?.tool_call?.arguments, null, 2), "tool")}
											class="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-mono"
										>
											{#if copiedField === "tool"}
												<Check class="h-3 w-3 text-emerald-500" />
												<span class="text-emerald-500">Copied</span>
											{:else}
												<ClipboardDocument class="h-3 w-3" />
												<span>Salin JSON</span>
											{/if}
										</button>
									</div>
									<div class="p-3.5 rounded-lg bg-zinc-950 border border-border/60 font-mono text-xs text-emerald-400 overflow-x-auto">
										<pre>{JSON.stringify(processResult.tool_call, null, 2)}</pre>
									</div>
								</div>

								<!-- 1-Click Stage into PostgreSQL Tickets -->
								<div class="pt-2">
									<button
										type="button"
										onclick={stageTicketDirectly}
										disabled={stagingLoading}
										class="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
									>
										<Bolt class="h-3.5 w-3.5" />
										<span>{stagingLoading ? 'Menyimpan Tiket...' : 'Stage ke Antrean Approval (PostgreSQL)'}</span>
									</button>
								</div>
							{/if}

							{#if stagingSuccess}
								<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
									<CheckCircle class="h-4 w-4 shrink-0" />
									<span>{stagingSuccess}</span>
								</div>
							{/if}

							{#if stagingError}
								<div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
									<ExclamationTriangle class="h-4 w-4 shrink-0" />
									<span>{stagingError}</span>
								</div>
							{/if}
						{:else}
							<div class="p-12 text-center space-y-1">
								<CpuChip class="h-6 w-6 text-muted-foreground mx-auto" />
								<p class="text-xs text-muted-foreground">Ketik prompt dan klik "Jalankan Inferensi" untuk melihat penalaran Hermes 3.</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else if activeTab === "openclaw"}
		<!-- ===================================================================== -->
		<!-- TAB 2: OPENCLAW AUTONOMOUS AGENT INTEGRATION                          -->
		<!-- ===================================================================== -->
		<OpenClawAgentSection />
	{/if}
</div>
