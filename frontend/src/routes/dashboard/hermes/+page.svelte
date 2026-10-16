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
		ArrowRight,
		Eye,
		PaperAirplane
	} from "svelte-heros-v2";
	import { cockpit, type Ticket } from "$lib/cockpit.svelte";
	import { sound } from "$lib/audio";
	import OpenClawAgentSection from "$lib/components/OpenClawAgentSection.svelte";
	import BrandIcon from "$lib/components/BrandIcon.svelte";
	import { i18n } from "$lib/i18n.svelte";

	// Navigation Tabs: Model APIs vs Hermes 3 vs OpenClaw
	let activeTab = $state<"models" | "hermes" | "openclaw">("models");

	// AI Model Providers State
	interface ModelProvider {
		id: string;
		name: string;
		description: string;
		enabled: boolean;
		is_primary: boolean;
		api_key: string;
		base_url: string;
		model: string;
		available_models: string[];
		temperature: number;
		max_tokens: number;
		status: string;
		latency_ms: number;
	}

	let providers = $state<ModelProvider[]>([]);
	let providersLoading = $state(false);
	let providersSaving = $state(false);
	let providersSavedSuccess = $state(false);
	let testingProviderId = $state<string | null>(null);
	let showKeys = $state<Record<string, boolean>>({});
	let providerSearch = $state("");

	async function fetchProviders() {
		providersLoading = true;
		try {
			const res = await fetch("/api/llm/providers");
			if (res.ok) {
				const data = await res.json();
				if (data.providers) {
					providers = data.providers;
				}
			}
		} catch (e) {
			console.error("Failed to load providers:", e);
		} finally {
			providersLoading = false;
		}
	}

	async function saveAllProviders() {
		providersSaving = true;
		providersSavedSuccess = false;
		try {
			const res = await fetch("/api/llm/providers", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(providers)
			});
			if (res.ok) {
				providersSavedSuccess = true;
				sound.playActionChime();
				setTimeout(() => providersSavedSuccess = false, 3000);
			}
		} catch (e) {
			console.error("Failed to save providers:", e);
		} finally {
			providersSaving = false;
		}
	}

	async function testProviderConnection(p: ModelProvider) {
		testingProviderId = p.id;
		try {
			const res = await fetch("/api/llm/providers/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: p.id,
					base_url: p.base_url,
					api_key: p.api_key,
					model: p.model
				})
			});
			if (res.ok) {
				const result = await res.json();
				p.status = result.status;
				p.latency_ms = result.latency_ms;
				sound.playInboundPing();
			}
		} catch (e) {
			console.error("Test failed:", e);
		} finally {
			testingProviderId = null;
		}
	}

	function setAsPrimary(id: string) {
		providers = providers.map(p => ({
			...p,
			is_primary: p.id === id
		}));
		sound.playNavClick();
	}

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
	let editAutoReplyEnabled = $state(true);
	let editAutoReplyMode = $state("smart");
	let editReplyTone = $state("professional");
	let editReplyPrefix = $state("[NovaPilot AI]");
	let editReplyLanguage = $state("id");

	// Auto-Reply Live Sandbox State
	let autoReplyTestPrompt = $state("Halo min tolong ubah customer faktur INV/2026/001 menjadi PT Sumber Makmur Abadi");
	let autoReplyGenerating = $state(false);
	let autoReplyResult = $state<{
		generated_reply: string;
		model_used: string;
		latency_ms: number;
		is_fallback: boolean;
		thought?: string;
		tool_call?: any;
	} | null>(null);
	let testDispatching = $state(false);
	let testDispatched = $state(false);

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
				if (json.auto_reply_enabled !== undefined) editAutoReplyEnabled = json.auto_reply_enabled;
				if (json.auto_reply_mode) editAutoReplyMode = json.auto_reply_mode;
				if (json.reply_tone) editReplyTone = json.reply_tone;
				if (json.reply_prefix) editReplyPrefix = json.reply_prefix;
				if (json.reply_language) editReplyLanguage = json.reply_language;
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
					cli_path: editCliPath,
					auto_reply_enabled: editAutoReplyEnabled,
					auto_reply_mode: editAutoReplyMode,
					reply_tone: editReplyTone,
					reply_prefix: editReplyPrefix,
					reply_language: editReplyLanguage
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

	async function runAutoReplySandbox() {
		if (autoReplyGenerating || !autoReplyTestPrompt.trim()) return;
		autoReplyGenerating = true;
		autoReplyResult = null;
		testDispatched = false;
		try {
			const res = await fetch("/api/llm/generate-reply", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: autoReplyTestPrompt,
					tone: editReplyTone,
					mode: editAutoReplyMode,
					prefix: editReplyPrefix,
					language: editReplyLanguage,
					branch_context: branchContext
				})
			});
			if (res.ok) {
				autoReplyResult = await res.json();
				sound.playActionChime();
			}
		} catch (e) {
			console.error("Failed to generate auto-reply:", e);
		} finally {
			autoReplyGenerating = false;
		}
	}

	async function dispatchTestReplyToWhatsApp() {
		if (testDispatching || !autoReplyResult?.generated_reply) return;
		testDispatching = true;
		try {
			const res = await fetch("/api/gateway/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: autoReplyResult.generated_reply
				})
			});
			if (res.ok) {
				testDispatched = true;
				sound.playActionChime();
				setTimeout(() => (testDispatched = false), 4000);
			}
		} catch (e) {
			console.error("Failed to dispatch test reply:", e);
		} finally {
			testDispatching = false;
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
		fetchProviders();
		runReasoningEngine();
	});
</script>

<svelte:head>
	<title>AI Agents &amp; LLM Configuration Hub | NovaPilot Enterprise</title>
</svelte:head>

<div class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
	<!-- ========================================================================= -->
	<!-- 1. CLEAN HEADER (AI AGENTS & LLM)                                         -->
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
					<div class="h-10 w-10 rounded-xl bg-primary/10 border border-primary/25 p-2 shadow-xs flex items-center justify-center text-primary">
						<CpuChip class="h-6 w-6" />
					</div>
				</div>

				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
						AI Agents &amp; LLM
						<span class="text-[11px] font-mono px-2 py-0.5 rounded-md font-medium bg-muted text-muted-foreground border border-border">
							MULTI-MODEL API &bull; HERMES 3 &bull; OPENCLAW
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Konfigurasi seluruh penyedia AI Model API (OpenAI, Claude, Gemini, Groq, Ollama, DeepSeek) serta orkestrasi agen otonom.
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
	<!-- 2. THREE TABS: MULTI-MODEL APIS vs HERMES 3 vs OPENCLAW                   -->
	<!-- ========================================================================= -->
	<div class="flex items-center gap-2 border-b border-border pb-2 flex-wrap">
		<!-- Tab 1: AI Model APIs -->
		<button
			type="button"
			onclick={() => { activeTab = "models"; sound.playNavClick(); }}
			class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 cursor-pointer {activeTab === 'models' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<div class="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 {activeTab === 'models' ? 'bg-primary-foreground/20' : 'bg-secondary'}">
				<CpuChip class="h-4 w-4 {activeTab === 'models' ? 'text-primary-foreground' : 'text-sky-500'}" />
			</div>
			<span>AI Model APIs &amp; Providers</span>
			<span class="px-1.5 py-0.2 rounded text-[10px] font-mono {activeTab === 'models' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
				{providers.filter(p => p.enabled).length}/{providers.length} AKTIF
			</span>
		</button>

		<!-- Tab 2: Hermes 3 Neural Agent -->
		<button
			type="button"
			onclick={() => { activeTab = "hermes"; sound.playNavClick(); }}
			class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 cursor-pointer {activeTab === 'hermes' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<div class="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 {activeTab === 'hermes' ? 'bg-primary-foreground/20' : 'bg-secondary'}">
				<BrandIcon name="hermes" class="h-4 w-4 {activeTab === 'hermes' ? 'brightness-0 invert dark:invert-0' : ''}" />
			</div>
			<span>{i18n.t.agents.hermes_title}</span>
			<span class="px-1.5 py-0.2 rounded text-[10px] font-mono {activeTab === 'hermes' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
				{i18n.t.agents.hermes_badge}
			</span>
			<div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono {activeTab === 'hermes' ? 'bg-emerald-500/25 text-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-700 font-bold border border-emerald-400/30' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
				<span class="font-bold tracking-wider">CONNECTED</span>
			</div>
		</button>

		<!-- Tab 3: OpenClaw Harvester -->
		<button
			type="button"
			onclick={() => { activeTab = "openclaw"; sound.playNavClick(); }}
			class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 cursor-pointer {activeTab === 'openclaw' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<div class="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 {activeTab === 'openclaw' ? 'bg-primary-foreground/20' : 'bg-secondary'}">
				<BrandIcon name="openclaw" class="h-4 w-4" />
			</div>
			<span>{i18n.t.agents.openclaw_title}</span>
			<span class="px-1.5 py-0.2 rounded text-[10px] font-mono {activeTab === 'openclaw' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
				{i18n.t.agents.openclaw_badge}
			</span>
			<div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono {activeTab === 'openclaw' ? 'bg-emerald-500/25 text-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-700 font-bold border border-emerald-400/30' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
				<span class="font-bold tracking-wider">CONNECTED</span>
			</div>
		</button>
	</div>

	{#if activeTab === "models"}
		<!-- ===================================================================== -->
		<!-- TAB 0: ALL AI MODEL APIS & PROVIDERS CONFIGURATION                    -->
		<!-- ===================================================================== -->
		<div class="space-y-6">
			<!-- Header Summary & Quick Actions -->
			<div class="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div class="space-y-1">
					<div class="flex items-center gap-2.5">
						<div class="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
							<CpuChip class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground">Multi-Model LLM API Configuration Hub</h3>
							<p class="text-xs text-muted-foreground">
								Konfigurasi provider model AI untuk inferensi NovaPilot, ekstraksi faktur otomatis, dan pembuatan draf tiket.
							</p>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-3 flex-wrap">
					<!-- Filter Search Input -->
					<div class="relative w-48 sm:w-64">
						<input
							type="text"
							bind:value={providerSearch}
							placeholder="Cari provider / model..."
							class="w-full h-9 pl-8 pr-3 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground shadow-xs"
						/>
						<span class="absolute left-2.5 top-2.5 text-muted-foreground">🔍</span>
					</div>

					<!-- Save All Button -->
					<button
						type="button"
						onclick={saveAllProviders}
						disabled={providersSaving}
						class="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
					>
						{#if providersSaving}
							<ArrowPath class="h-3.5 w-3.5 animate-spin" />
							<span>Menyimpan...</span>
						{:else}
							<Check class="h-3.5 w-3.5" />
							<span>Simpan Semua Konfigurasi</span>
						{/if}
					</button>
				</div>
			</div>

			{#if providersSavedSuccess}
				<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
					<CheckCircle class="h-4 w-4 shrink-0" />
					<span>Seluruh konfigurasi API Model LLM berhasil disimpan dan disinkronkan ke sistem runtime backend!</span>
				</div>
			{/if}

			<!-- Providers Cards Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{#each providers.filter(p => !providerSearch || p.name.toLowerCase().includes(providerSearch.toLowerCase()) || p.model.toLowerCase().includes(providerSearch.toLowerCase()) || p.id.toLowerCase().includes(providerSearch.toLowerCase())) as provider}
					<div class="p-5 rounded-2xl bg-card border {provider.is_primary ? 'border-primary ring-1 ring-primary/30' : 'border-border'} shadow-xs space-y-4 transition-all">
						<!-- Provider Card Header -->
						<div class="flex items-start justify-between gap-3">
							<div class="flex items-center gap-3 min-w-0">
								<div class="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border/80 p-2">
									{#if provider.id === 'hermes'}
										<BrandIcon name="hermes" class="h-6 w-6" />
									{:else if provider.id === 'openclaw'}
										<BrandIcon name="openclaw" class="h-6 w-6" />
									{:else if provider.id === 'ollama'}
										<BrandIcon name="ollama" class="h-6 w-6" />
									{:else}
										<CpuChip class="h-5 w-5 text-primary" />
									{/if}
								</div>
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<h4 class="text-sm font-bold text-foreground truncate">{provider.name}</h4>
										{#if provider.is_primary}
											<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-primary-foreground">
												⭐ PRIMARY
											</span>
										{/if}
									</div>
									<p class="text-[11px] text-muted-foreground truncate">{provider.description}</p>
								</div>
							</div>

							<!-- Master Enable Toggle -->
							<button
								type="button"
								onclick={() => { provider.enabled = !provider.enabled; sound.playNavClick(); }}
								class="h-6 px-2.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 {provider.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}"
							>
								<span class="h-1.5 w-1.5 rounded-full {provider.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}"></span>
								<span>{provider.enabled ? 'ENABLED' : 'DISABLED'}</span>
							</button>
						</div>

						<!-- Configuration Inputs -->
						<div class="space-y-3 pt-1 border-t border-border/60 text-xs">
							<!-- API Key Field -->
							<div class="space-y-1">
								<div class="flex items-center justify-between text-[11px]">
									<label class="font-semibold text-foreground">API Secret Key / Token</label>
									{#if provider.id === 'ollama' || provider.id === 'hermes' || provider.id === 'openclaw'}
										<span class="text-muted-foreground text-[10px] italic">Lokal / Tidak wajib</span>
									{:else}
										<span class="text-amber-500 text-[10px] font-mono font-semibold">Tersimpan Aman (.env)</span>
									{/if}
								</div>
								<div class="relative">
									<input
										type={showKeys[provider.id] ? "text" : "password"}
										bind:value={provider.api_key}
										placeholder={provider.id === 'ollama' || provider.id === 'hermes' ? 'Tidak diperlukan untuk model lokal' : 'Masukkan API Key resmi (sk-..., gsk_...)'}
										class="w-full h-9 pl-3 pr-9 rounded-xl border border-input bg-background font-mono text-xs text-foreground placeholder:text-muted-foreground shadow-xs"
									/>
									<button
										type="button"
										onclick={() => showKeys[provider.id] = !showKeys[provider.id]}
										class="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
										title="Tampilkan / Sembunyikan Key"
									>
										<Eye class="h-4 w-4" />
									</button>
								</div>
							</div>

							<!-- Endpoint Base URL -->
							<div class="space-y-1">
								<label class="font-semibold text-foreground text-[11px]">API Base URL / Host Endpoint</label>
								<input
									type="text"
									bind:value={provider.base_url}
									placeholder="https://api.openai.com/v1"
									class="w-full h-9 px-3 rounded-xl border border-input bg-background font-mono text-xs text-foreground placeholder:text-muted-foreground shadow-xs"
								/>
							</div>

							<!-- Model Name Selection -->
							<div class="space-y-1">
								<div class="flex items-center justify-between text-[11px]">
									<label class="font-semibold text-foreground">Model Target / Deployment ID</label>
									<span class="font-mono text-[10px] text-muted-foreground">Aktif: {provider.model}</span>
								</div>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{#if provider.available_models && provider.available_models.length > 0}
										<select
											bind:value={provider.model}
											class="h-9 rounded-xl border border-input bg-background px-2.5 font-mono text-xs text-foreground shadow-xs cursor-pointer"
										>
											{#each provider.available_models as m}
												<option value={m}>{m}</option>
											{/each}
										</select>
									{/if}
									<input
										type="text"
										bind:value={provider.model}
										placeholder="Custom model id..."
										class="h-9 px-3 rounded-xl border border-input bg-background font-mono text-xs text-foreground placeholder:text-muted-foreground shadow-xs"
									/>
								</div>
							</div>

							<!-- Parameters (Temperature & Max Tokens) -->
							<div class="grid grid-cols-2 gap-3 pt-1">
								<div class="space-y-1">
									<div class="flex items-center justify-between text-[11px]">
										<span class="font-medium text-foreground">Temperature</span>
										<span class="font-mono font-bold text-primary">{provider.temperature.toFixed(2)}</span>
									</div>
									<input
										type="range"
										min="0.0"
										max="1.0"
										step="0.05"
										bind:value={provider.temperature}
										class="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
									/>
								</div>

								<div class="space-y-1">
									<div class="flex items-center justify-between text-[11px]">
										<span class="font-medium text-foreground">Max Tokens</span>
										<span class="font-mono text-muted-foreground">{provider.max_tokens}</span>
									</div>
									<input
										type="number"
										step="256"
										min="512"
										max="32768"
										bind:value={provider.max_tokens}
										class="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs text-foreground shadow-xs"
									/>
								</div>
							</div>
						</div>

						<!-- Card Footer Actions -->
						<div class="pt-3 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
							<div class="flex items-center gap-2">
								<!-- Set as Primary Button -->
								{#if !provider.is_primary}
									<button
										type="button"
										onclick={() => setAsPrimary(provider.id)}
										class="h-7.5 px-3 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
										title="Jadikan provider ini sebagai model utama NovaPilot"
									>
										<span>Jadikan Primary</span>
									</button>
								{/if}

								<!-- Connection Status Badge -->
								<div class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono {provider.status === 'CONNECTED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}">
									<span class="h-1.5 w-1.5 rounded-full {provider.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-muted-foreground'}"></span>
									<span>{provider.status}</span>
									{#if provider.latency_ms > 0}
										<span>· {provider.latency_ms}ms</span>
									{/if}
								</div>
							</div>

							<!-- Test Handshake Button -->
							<button
								type="button"
								onclick={() => testProviderConnection(provider)}
								disabled={testingProviderId === provider.id}
								class="h-7.5 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
							>
								{#if testingProviderId === provider.id}
									<ArrowPath class="h-3 w-3 animate-spin" />
									<span>Testing...</span>
								{:else}
									<Bolt class="h-3 w-3" />
									<span>Test Handshake</span>
								{/if}
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if activeTab === "hermes"}
		<!-- ===================================================================== -->
		<!-- TAB 1: HERMES 3 REASONING ENGINE                                      -->
		<!-- ===================================================================== -->
		<div class="space-y-6">
			<!-- Telemetry Strips -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<!-- Provider -->
				<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1">
					<div class="flex items-center justify-between text-muted-foreground">
						<span class="text-xs font-medium">{i18n.t.agents.model_architecture}</span>
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
						<span class="text-xs font-medium">{i18n.t.agents.execution_mode}</span>
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
						<span class="text-xs font-medium">{i18n.t.agents.reasoning_contract}</span>
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
						<span class="text-xs font-medium">{i18n.t.agents.offline_resilience}</span>
						<ShieldCheck class="h-4 w-4 text-emerald-500" />
					</div>
					<div class="text-sm font-semibold font-mono text-foreground flex items-center gap-1.5">
						<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
						Regex Heuristic Net
					</div>
					<div class="text-[11px] text-muted-foreground">
						{i18n.t.agents.offline_resilience_sub}
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
									{i18n.t.agents.cli_detected}
								</span>
								{#if llmConfig.mode === 'cli'}
									<span class="text-[10px] font-mono px-2 py-0.2 rounded bg-primary text-primary-foreground font-medium">
										{i18n.t.agents.cli_active}
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
								<span>{i18n.t.agents.cli_using}</span>
							</div>
						{:else}
							<button
								type="button"
								onclick={activateCliMode}
								class="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
							>
								<Bolt class="h-3.5 w-3.5" />
								<span>{i18n.t.agents.cli_activate}</span>
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Config Form & Parameter Editor -->
			<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<div>
						<h3 class="text-sm font-semibold text-foreground">{i18n.t.agents.config_title}</h3>
						<p class="text-xs text-muted-foreground">{i18n.t.agents.config_subtitle}</p>
					</div>

					<button
						type="button"
						onclick={saveConfig}
						disabled={configLoading}
						class="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
					>
						<Bolt class="h-3.5 w-3.5" />
						<span>{configLoading ? i18n.t.agents.saving : i18n.t.agents.save_config}</span>
					</button>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
					<div class="space-y-1">
						<label for="modeSelect" class="font-medium text-muted-foreground">{i18n.t.agents.mode_label}</label>
						<select
							id="modeSelect"
							bind:value={editMode}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
						>
							<option value="auto">{i18n.t.agents.mode_auto}</option>
							<option value="cli">{i18n.t.agents.mode_cli}</option>
							<option value="http">{i18n.t.agents.mode_http}</option>
						</select>
					</div>

					<div class="space-y-1">
						<label for="baseUrlInput" class="font-medium text-muted-foreground">{i18n.t.agents.base_url_label}</label>
						<input
							id="baseUrlInput"
							type="text"
							bind:value={editBaseURL}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
							placeholder="http://localhost:11434/v1"
						/>
					</div>

					<div class="space-y-1">
						<label for="modelInput" class="font-medium text-muted-foreground">{i18n.t.agents.model_name_label}</label>
						<input
							id="modelInput"
							type="text"
							bind:value={editModel}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
							placeholder="hermes3:8b"
						/>
					</div>

					<div class="space-y-1">
						<label for="cliPathInput" class="font-medium text-muted-foreground">{i18n.t.agents.cli_path_label}</label>
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
						<span>{i18n.t.agents.saved}</span>
					</div>
				{/if}

				{#if configError}
					<div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
						<ExclamationTriangle class="h-4 w-4 shrink-0" />
						<span>{configError}</span>
					</div>
				{/if}
			</div>

			<!-- ============================================================= -->
			<!-- AI AUTO-GENERATE REPLY CHAT CONFIGURATION CARD                -->
			<!-- ============================================================= -->
			<div class="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5">
				<!-- Header with Master Toggle -->
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
					<div class="flex items-start gap-3">
						<div class="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
							<ChatBubbleLeftRight class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
								<span>{i18n.t.agents.auto_reply_card_title}</span>
								<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {editAutoReplyEnabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}">
									{editAutoReplyEnabled ? 'AUTO-REPLY ACTIVE' : 'MUTED'}
								</span>
							</h3>
							<p class="text-xs text-muted-foreground mt-0.5">
								{i18n.t.agents.auto_reply_card_subtitle}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-3">
						<label class="flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								bind:checked={editAutoReplyEnabled}
								class="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
							/>
							<span class="text-xs font-semibold text-foreground">
								{i18n.t.agents.auto_reply_toggle_label}
							</span>
						</label>

						<button
							type="button"
							onclick={saveConfig}
							disabled={configLoading}
							class="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
						>
							<Bolt class="h-3.5 w-3.5" />
							<span>{configLoading ? i18n.t.agents.saving : i18n.t.agents.save_config}</span>
						</button>
					</div>
				</div>

				<!-- Settings Grid: Trigger Mode, Tone, Prefix, Language -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
					<!-- 1. Trigger Mode -->
					<div class="space-y-1.5">
						<label for="autoReplyModeSelect" class="font-medium text-muted-foreground">{i18n.t.agents.auto_reply_mode_label}</label>
						<select
							id="autoReplyModeSelect"
							bind:value={editAutoReplyMode}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
						>
							<option value="smart">{i18n.t.agents.auto_reply_mode_smart}</option>
							<option value="actionable_only">{i18n.t.agents.auto_reply_mode_actionable}</option>
							<option value="all">{i18n.t.agents.auto_reply_mode_all}</option>
							<option value="manual">{i18n.t.agents.auto_reply_mode_manual}</option>
						</select>
					</div>

					<!-- 2. Response Tone -->
					<div class="space-y-1.5">
						<label for="replyToneSelect" class="font-medium text-muted-foreground">{i18n.t.agents.auto_reply_tone_label}</label>
						<select
							id="replyToneSelect"
							bind:value={editReplyTone}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
						>
							<option value="professional">{i18n.t.agents.auto_reply_tone_professional}</option>
							<option value="friendly">{i18n.t.agents.auto_reply_tone_friendly}</option>
							<option value="concise">{i18n.t.agents.auto_reply_tone_concise}</option>
						</select>
					</div>

					<!-- 3. Bot Prefix -->
					<div class="space-y-1.5">
						<label for="replyPrefixInput" class="font-medium text-muted-foreground">{i18n.t.agents.auto_reply_prefix_label}</label>
						<input
							id="replyPrefixInput"
							type="text"
							bind:value={editReplyPrefix}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
							placeholder="[NovaPilot AI]"
						/>
					</div>

					<!-- 4. Response Language -->
					<div class="space-y-1.5">
						<label for="replyLangSelect" class="font-medium text-muted-foreground">{i18n.t.agents.auto_reply_lang_label}</label>
						<select
							id="replyLangSelect"
							bind:value={editReplyLanguage}
							class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
						>
							<option value="id">{i18n.t.agents.auto_reply_lang_id}</option>
							<option value="auto">{i18n.t.agents.auto_reply_lang_auto}</option>
							<option value="en">{i18n.t.agents.auto_reply_lang_en}</option>
						</select>
					</div>
				</div>

				<!-- Live Interactive Reply Sandbox -->
				<div class="p-4 rounded-xl bg-muted/20 border border-border/80 space-y-3.5">
					<div class="flex items-center justify-between flex-wrap gap-2">
						<div class="flex items-center gap-2">
							<Sparkles class="h-4 w-4 text-primary" />
							<h4 class="text-xs font-bold text-foreground">{i18n.t.agents.auto_reply_sandbox_title}</h4>
						</div>
						<div class="flex items-center gap-1.5">
							<button
								type="button"
								onclick={() => { autoReplyTestPrompt = "Halo min tolong ubah customer faktur INV/2026/001 menjadi PT Sumber Makmur Abadi"; runAutoReplySandbox(); }}
								class="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-colors"
							>
								Mutasi INV
							</button>
							<button
								type="button"
								onclick={() => { autoReplyTestPrompt = "halo selamat pagi min mau tanya jam operasional cabang"; runAutoReplySandbox(); }}
								class="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-colors"
							>
								Sapaan
							</button>
							<button
								type="button"
								onclick={() => { autoReplyTestPrompt = "cek harga dan plafon diskon pipa baja schedule 40"; runAutoReplySandbox(); }}
								class="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-colors"
							>
								Katalog ERP
							</button>
							<button
								type="button"
								onclick={() => { autoReplyTestPrompt = "tolong revisi nama pt jadi PT Mitra Sukses"; runAutoReplySandbox(); }}
								class="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-colors"
							>
								Data Kurang
							</button>
						</div>
					</div>

					<div class="flex flex-col sm:flex-row gap-2">
						<input
							type="text"
							bind:value={autoReplyTestPrompt}
							class="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
							placeholder="Ketik simulasi pesan masuk..."
						/>
						<button
							type="button"
							onclick={runAutoReplySandbox}
							disabled={autoReplyGenerating || !autoReplyTestPrompt.trim()}
							class="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
						>
							{#if autoReplyGenerating}
								<ArrowPath class="h-3.5 w-3.5 animate-spin" />
								<span>{i18n.t.agents.auto_reply_generating}</span>
							{:else}
								<Sparkles class="h-3.5 w-3.5" />
								<span>{i18n.t.agents.auto_reply_generate_btn}</span>
							{/if}
						</button>
					</div>

					<!-- Auto-Reply Output Preview Box -->
					{#if autoReplyResult}
						<div class="p-3.5 rounded-xl bg-card border border-primary/30 shadow-xs space-y-2.5 animate-in fade-in duration-150">
							<div class="flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
								<span class="font-bold text-foreground flex items-center gap-1.5">
									<ChatBubbleLeftRight class="h-3.5 w-3.5 text-primary" />
									<span>{i18n.t.agents.auto_reply_result_label}</span>
								</span>
								<div class="flex items-center gap-2 font-mono text-[10px]">
									<span class="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
										{autoReplyResult.model_used}
									</span>
									<span class="text-primary font-bold">
										⚡ {autoReplyResult.latency_ms}ms
									</span>
								</div>
							</div>

							<div class="p-3 rounded-lg bg-muted/40 border border-border/80 text-xs font-mono text-foreground leading-relaxed select-all">
								{autoReplyResult.generated_reply}
							</div>

							<div class="flex items-center justify-between pt-1 flex-wrap gap-2">
								<button
									type="button"
									onclick={() => copyToClipboard(autoReplyResult?.generated_reply || '', 'auto_reply')}
									class="h-7 px-2.5 rounded-md border border-border bg-background hover:bg-muted text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
								>
									{#if copiedField === 'auto_reply'}
										<Check class="h-3 w-3 text-emerald-500" />
										<span>{i18n.t.agents.copied}</span>
									{:else}
										<ClipboardDocument class="h-3 w-3" />
										<span>{i18n.t.agents.copy_code}</span>
									{/if}
								</button>

								<button
									type="button"
									onclick={dispatchTestReplyToWhatsApp}
									disabled={testDispatching}
									class="h-7 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
								>
									{#if testDispatched}
										<Check class="h-3 w-3" />
										<span>{i18n.t.agents.auto_reply_dispatched}</span>
									{:else if testDispatching}
										<ArrowPath class="h-3 w-3 animate-spin" />
										<span>Mengirim...</span>
									{:else}
										<PaperAirplane class="h-3 w-3" />
										<span>{i18n.t.agents.auto_reply_test_dispatch}</span>
									{/if}
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Interactive Playground Console -->
			<div class="grid lg:grid-cols-12 gap-6 items-start">
				<!-- Left: Prompt & Scenario Presets (5 Cols) -->
				<div class="lg:col-span-5 space-y-4">
					<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
						<div class="flex items-center justify-between border-b border-border/60 pb-3">
							<div class="flex items-center gap-2">
								<CommandLine class="h-4 w-4 text-muted-foreground" />
								<h2 class="text-sm font-semibold text-foreground">{i18n.t.agents.interactive_console}</h2>
							</div>
							<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
								Zero Temp
							</span>
						</div>

						<!-- Quick Presets -->
						<div class="space-y-1.5">
							<span class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
								{i18n.t.agents.presets_label}
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
								{i18n.t.agents.prompt_label_chat}
							</label>
							<textarea
								id="promptInputArea"
								bind:value={promptInput}
								rows="3"
								class="w-full p-2.5 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed resize-none"
								placeholder={i18n.t.agents.prompt_placeholder}
							></textarea>
						</div>

						<!-- Branch Context -->
						<div class="space-y-1.5">
							<label for="branchContextInput" class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
								{i18n.t.agents.branch_context_label}
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
							<span>{isProcessing ? i18n.t.agents.running_inference : i18n.t.agents.run_inference}</span>
						</button>
					</div>
				</div>

				<!-- Right: Reasoning & Extraction Inspector (7 Cols) -->
				<div class="lg:col-span-7 space-y-4">
					<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
						<div class="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
							<div class="flex items-center gap-2">
								<Sparkles class="h-4 w-4 text-primary" />
								<h3 class="text-sm font-semibold text-foreground">{i18n.t.agents.inference_result}</h3>
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
								<p class="text-xs text-muted-foreground font-mono">{i18n.t.agents.running_inference}</p>
							</div>
						{:else if processResult}
							<!-- 1. Reasoning Thought Block -->
							<div class="space-y-1.5">
								<div class="flex items-center justify-between">
									<span class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
										{i18n.t.agents.reasoning_thought}
									</span>
									<button
										type="button"
										onclick={() => copyToClipboard(processResult?.thought || "", "thought")}
										class="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-mono"
									>
										{#if copiedField === "thought"}
											<Check class="h-3 w-3 text-emerald-500" />
											<span class="text-emerald-500">{i18n.t.agents.copied}</span>
										{:else}
											<ClipboardDocument class="h-3 w-3" />
											<span>{i18n.t.agents.copy_code}</span>
										{/if}
									</button>
								</div>
								<div class="p-3.5 rounded-lg bg-muted/30 border border-border font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
									{processResult.thought || (i18n.locale === 'id' ? "Tidak ada blok pemikiran terpisah (direct output)." : "No separate thought block (direct output).")}
								</div>
							</div>

							<!-- 2. Structured Tool Arguments -->
							{#if processResult.tool_call}
								<div class="space-y-1.5">
									<div class="flex items-center justify-between">
										<span class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
											{i18n.t.agents.tool_arguments}
										</span>
										<button
											type="button"
											onclick={() => copyToClipboard(JSON.stringify(processResult?.tool_call?.arguments, null, 2), "tool")}
											class="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-mono"
										>
											{#if copiedField === "tool"}
												<Check class="h-3 w-3 text-emerald-500" />
												<span class="text-emerald-500">{i18n.t.agents.copied}</span>
											{:else}
												<ClipboardDocument class="h-3 w-3" />
												<span>{i18n.locale === 'id' ? 'Salin JSON' : 'Copy JSON'}</span>
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
										<span>{stagingLoading ? i18n.t.agents.staging_in_progress : i18n.t.agents.staging_ticket_queue}</span>
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
								<p class="text-xs text-muted-foreground">{i18n.t.agents.prompt_hint}</p>
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
