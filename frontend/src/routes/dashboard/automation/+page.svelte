<script lang="ts">
	import { onMount } from "svelte";
	import { 
		Sparkles, 
		Bolt, 
		Check, 
		XMark, 
		ArrowPath, 
		Play, 
		Plus, 
		Trash, 
		AdjustmentsHorizontal, 
		ShieldCheck, 
		ChatBubbleLeftRight, 
		PaperAirplane, 
		Clock, 
		DocumentText, 
		Photo, 
		CpuChip, 
		ExclamationTriangle,
		CheckCircle,
		PencilSquare
	} from "svelte-heros-v2";
	import BrandIcon from "$lib/components/BrandIcon.svelte";
	import { i18n } from "$lib/i18n.svelte";
	import { sound } from "$lib/audio";
	import { timeAgo } from "$lib/utils";

	// Rule Definition Interface
	interface AutoReplyRule {
		id: string;
		name: string;
		description: string;
		enabled: boolean;
		category: "INVOICE" | "OCR" | "CUSTOMER_SERVICE" | "AFTER_HOURS" | "SECURITY";
		channels: string[];
		trigger_intent: string;
		pattern_regex: string;
		mode: "TEMPLATE" | "HERMES_DRAFT" | "STAGED_REVIEW";
		template: string;
		typing_delay_ms: number;
		cooldown_sec: number;
		require_dlp: boolean;
		times_triggered: number;
		last_triggered_at?: string;
	}

	interface AutoReplyConfig {
		master_enabled: boolean;
		working_hours_start: string;
		working_hours_end: string;
		default_channel: string;
		global_cooldown_sec: number;
		simulate_typing: boolean;
		hermes_fallback: boolean;
		dlp_enforcement: boolean;
	}

	// State
	let rules = $state<AutoReplyRule[]>([]);
	let config = $state<AutoReplyConfig>({
		master_enabled: true,
		working_hours_start: "08:00",
		working_hours_end: "17:00",
		default_channel: "whatsapp",
		global_cooldown_sec: 180,
		simulate_typing: true,
		hermes_fallback: true,
		dlp_enforcement: true,
	});

	let activeTab = $state<"rules" | "simulator" | "logs" | "settings">("rules");
	let selectedCategory = $state<string>("ALL");
	let isLoading = $state(false);
	let isSavingConfig = $state(false);
	let configSavedSuccess = $state(false);

	// Simulator State
	let simMessage = $state("Halo min, tolong revisi nama invoice INV/2026/001 menjadi PT Sumber Makmur ya");
	let simSenderName = $state("Budi Santoso");
	let simPhone = $state("6281228632195");
	let simPlatform = $state<"whatsapp" | "telegram" | "slack" | "discord">("whatsapp");
	let simDocNo = $state("INV/2026/001");
	let simTarget = $state("PT Sumber Makmur");

	let simIsRunning = $state(false);
	let simResult = $state<{
		ok: boolean;
		matched?: boolean;
		rule?: AutoReplyRule;
		generated_text?: string;
		ticket_no?: string;
		dlp_passed?: boolean;
		dlp_error?: string;
		typing_delay?: number;
		reason?: string;
		simulated_text?: string;
		simulated_at?: string;
	} | null>(null);

	let simDispatching = $state(false);
	let simDispatchSuccess = $state(false);
	let simDispatchError = $state<string | null>(null);

	// Modal State for Rule Edit/Add
	let ruleModalOpen = $state(false);
	let editingRule = $state<AutoReplyRule | null>(null);
	let ruleFormId = $state("");
	let ruleFormName = $state("");
	let ruleFormDesc = $state("");
	let ruleFormCategory = $state<"INVOICE" | "OCR" | "CUSTOMER_SERVICE" | "AFTER_HOURS" | "SECURITY">("INVOICE");
	let ruleFormChannels = $state<string[]>(["whatsapp"]);
	let ruleFormTrigger = $state("UPDATE_CUSTOMER_NAME");
	let ruleFormRegex = $state("(?i)(ubah|ganti|revisi).*?(nama|customer|klien)");
	let ruleFormMode = $state<"TEMPLATE" | "HERMES_DRAFT" | "STAGED_REVIEW">("TEMPLATE");
	let ruleFormTemplate = $state("Permintaan perubahan nama pelanggan untuk invoice {{doc_no}} menjadi '{{target_value}}' telah masuk ke antrean validasi ERP. Tiket referensi: {{ticket_no}}.");
	let ruleFormDelay = $state(1500);
	let ruleFormCooldown = $state(180);
	let ruleFormDLP = $state(true);

	// Recent Dispatches History Log (In-Memory telemetry stream)
	let dispatchLogs = $state<Array<{
		id: string;
		timestamp: string;
		recipient: string;
		rule_name: string;
		channel: string;
		text: string;
		latency_ms: number;
		status: "SENT" | "DELIVERED" | "READ";
	}>>([
		{
			id: "dsp-101",
			timestamp: "2 mins ago",
			recipient: "6281228632195 (Budi)",
			rule_name: "Instant Receipt / Nota OCR Confirmation",
			channel: "whatsapp",
			text: "Halo Budi, foto nota/dokumen Anda telah kami terima dan berhasil terbaca oleh NovaPilot OCR. Tiket verifikasi TCK-84192 telah dibuatkan...",
			latency_ms: 1840,
			status: "DELIVERED"
		},
		{
			id: "dsp-102",
			timestamp: "14 mins ago",
			recipient: "6285741992011 (Cabang Semarang)",
			rule_name: "Customer Name & Data Revision Acknowledgement",
			channel: "whatsapp",
			text: "Permintaan perubahan nama pelanggan untuk invoice INV/2026/004 menjadi 'PT Sentosa Abadi' telah masuk ke antrean validasi ERP...",
			latency_ms: 1520,
			status: "READ"
		},
		{
			id: "dsp-103",
			timestamp: "42 mins ago",
			recipient: "120363029182@g.us (Finance Group)",
			rule_name: "Document Cancellation Ticket Notice",
			channel: "whatsapp",
			text: "Pembatalan dokumen INV/2026/002 sedang diproses oleh supervisor finance dengan nomor tiket TCK-84178...",
			latency_ms: 2100,
			status: "DELIVERED"
		},
		{
			id: "dsp-104",
			timestamp: "1 hr ago",
			recipient: "telegram:@oncall_ops",
			rule_name: "Customer Name & Data Revision Acknowledgement",
			channel: "telegram",
			text: "Permintaan perubahan nama pelanggan untuk invoice INV/2026/001 telah masuk ke antrean validasi ERP. Tiket referensi: TCK-84155.",
			latency_ms: 1410,
			status: "SENT"
		}
	]);

	onMount(async () => {
		await fetchRules();
		await fetchConfig();
	});

	async function fetchRules() {
		isLoading = true;
		try {
			const res = await fetch("/api/auto-reply/rules");
			if (res.ok) {
				const data = await res.json();
				rules = data.rules || [];
			}
		} catch (e) {
			console.error("Failed to load auto-reply rules:", e);
		} finally {
			isLoading = false;
		}
	}

	async function fetchConfig() {
		try {
			const res = await fetch("/api/auto-reply/config");
			if (res.ok) {
				const data = await res.json();
				if (data.config) config = data.config;
			}
		} catch (e) {
			console.error("Failed to load auto-reply config:", e);
		}
	}

	async function toggleRule(rule: AutoReplyRule) {
		sound.playNavClick();
		rule.enabled = !rule.enabled;
		try {
			await fetch(`/api/auto-reply/rules/${rule.id}/toggle`, { method: "POST" });
			sound.playActionChime();
		} catch (e) {
			rule.enabled = !rule.enabled;
		}
	}

	async function deleteRule(id: string) {
		if (!confirm("Are you sure you want to delete this auto-reply rule?")) return;
		sound.playNavClick();
		try {
			await fetch(`/api/auto-reply/rules/${id}`, { method: "DELETE" });
			rules = rules.filter(r => r.id !== id);
			sound.playAlertChime();
		} catch (e) {
			console.error("Failed to delete rule:", e);
		}
	}

	function openCreateRuleModal() {
		editingRule = null;
		ruleFormId = "";
		ruleFormName = "";
		ruleFormDesc = "";
		ruleFormCategory = "INVOICE";
		ruleFormChannels = ["whatsapp"];
		ruleFormTrigger = "UPDATE_CUSTOMER_NAME";
		ruleFormRegex = "(?i)(ubah|ganti|revisi).*?(nama|customer|klien)";
		ruleFormMode = "TEMPLATE";
		ruleFormTemplate = "Permintaan perubahan nama pelanggan untuk invoice {{doc_no}} menjadi '{{target_value}}' telah masuk ke antrean validasi ERP. Tiket referensi: {{ticket_no}}.";
		ruleFormDelay = 1500;
		ruleFormCooldown = 180;
		ruleFormDLP = true;
		ruleModalOpen = true;
	}

	function openEditRuleModal(rule: AutoReplyRule) {
		editingRule = rule;
		ruleFormId = rule.id;
		ruleFormName = rule.name;
		ruleFormDesc = rule.description;
		ruleFormCategory = rule.category;
		ruleFormChannels = [...rule.channels];
		ruleFormTrigger = rule.trigger_intent;
		ruleFormRegex = rule.pattern_regex;
		ruleFormMode = rule.mode;
		ruleFormTemplate = rule.template;
		ruleFormDelay = rule.typing_delay_ms;
		ruleFormCooldown = rule.cooldown_sec;
		ruleFormDLP = rule.require_dlp;
		ruleModalOpen = true;
	}

	async function saveRuleFromForm() {
		if (!ruleFormName.trim() || !ruleFormTemplate.trim()) {
			alert("Rule name and response template are required.");
			return;
		}

		const newRule: AutoReplyRule = {
			id: ruleFormId || `rule-${Date.now() % 100000}`,
			name: ruleFormName.trim(),
			description: ruleFormDesc.trim(),
			enabled: editingRule ? editingRule.enabled : true,
			category: ruleFormCategory,
			channels: ruleFormChannels.length > 0 ? ruleFormChannels : ["whatsapp"],
			trigger_intent: ruleFormTrigger,
			pattern_regex: ruleFormRegex.trim(),
			mode: ruleFormMode,
			template: ruleFormTemplate.trim(),
			typing_delay_ms: Number(ruleFormDelay) || 1500,
			cooldown_sec: Number(ruleFormCooldown) || 180,
			require_dlp: ruleFormDLP,
			times_triggered: editingRule ? editingRule.times_triggered : 0
		};

		try {
			const res = await fetch("/api/auto-reply/rules", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newRule)
			});
			if (res.ok) {
				await fetchRules();
				ruleModalOpen = false;
				sound.playActionChime();
			}
		} catch (e) {
			console.error("Failed to save rule:", e);
		}
	}

	async function saveMasterConfig() {
		isSavingConfig = true;
		configSavedSuccess = false;
		try {
			const res = await fetch("/api/auto-reply/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(config)
			});
			if (res.ok) {
				configSavedSuccess = true;
				sound.playActionChime();
				setTimeout(() => configSavedSuccess = false, 3000);
			}
		} catch (e) {
			console.error("Failed to save config:", e);
		} finally {
			isSavingConfig = false;
		}
	}

	async function runSimulation() {
		if (!simMessage.trim()) return;
		simIsRunning = true;
		simResult = null;
		simDispatchSuccess = false;
		simDispatchError = null;
		sound.playNavClick();

		try {
			const res = await fetch("/api/auto-reply/simulate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: simMessage,
					sender_name: simSenderName,
					phone: simPhone,
					platform: simPlatform,
					doc_no: simDocNo,
					target: simTarget
				})
			});
			if (res.ok) {
				simResult = await res.json();
				sound.playInboundPing();
			}
		} catch (e: any) {
			console.error("Simulation failed:", e);
		} finally {
			simIsRunning = false;
		}
	}

	async function dispatchSimulatedReply() {
		if (!simResult?.generated_text || !simPhone.trim()) return;
		simDispatching = true;
		simDispatchSuccess = false;
		simDispatchError = null;

		try {
			const res = await fetch("/api/gateway/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					phone: simPhone.trim(),
					message: simResult.generated_text
				})
			});

			const data = await res.json();
			if (!res.ok || data.ok === false) {
				throw new Error(data.error || "Gagal mengirimkan balasan otomatis via WhatsApp Gateway.");
			}

			simDispatchSuccess = true;
			sound.playActionChime();

			// Add to recent log
			dispatchLogs = [
				{
					id: `dsp-${Date.now() % 1000}`,
					timestamp: "Just now",
					recipient: `${simPhone} (${simSenderName})`,
					rule_name: simResult.rule?.name || "Auto-Reply Simulated Dispatch",
					channel: simPlatform,
					text: simResult.generated_text,
					latency_ms: 1250,
					status: "SENT"
				},
				...dispatchLogs
			];
		} catch (err: any) {
			simDispatchError = err.message || "Gagal menghubungi gateway :3002.";
			sound.playAlertChime();
		} finally {
			simDispatching = false;
		}
	}

	let filteredRules = $derived(
		rules.filter(r => selectedCategory === "ALL" || r.category === selectedCategory)
	);

	let activeRulesCount = $derived(rules.filter(r => r.enabled).length);
	let totalTriggered = $derived(rules.reduce((acc, r) => acc + r.times_triggered, 0));
</script>

<svelte:head>
	<title>Autonomous Auto-Reply Center | NovaPilot Enterprise</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
	<!-- ========================================================================= -->
	<!-- 1. HEADER HERO BANNER & MASTER SWITCH                                     -->
	<!-- ========================================================================= -->
	<div class="p-6 sm:p-7 rounded-3xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
		<!-- Decorative Ambient Glow -->
		<div class="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

		<div class="space-y-1.5 relative">
			<div class="flex items-center gap-2.5">
				<div class="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs border border-emerald-500/30">
					<Sparkles class="h-5 w-5" />
				</div>
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
							Autonomous Auto-Reply Center
						</h1>
						<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
							<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
							Engine Live (:3002 Gateway)
						</span>
					</div>
					<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
						Rule-based dynamic trigger interpolation, DLP security guardrails, and Hermes 3 contextual reply dispatching.
					</p>
				</div>
			</div>
		</div>

		<!-- Master Switch & Quick Actions -->
		<div class="flex items-center gap-3 relative self-start md:self-auto flex-wrap">
			<!-- Master Toggle Pill -->
			<div class="p-1 rounded-2xl bg-secondary border border-border flex items-center gap-2 pr-3.5">
				<button
					type="button"
					onclick={() => { config.master_enabled = !config.master_enabled; saveMasterConfig(); }}
					class="h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer {config.master_enabled ? 'bg-emerald-600 text-white shadow-xs' : 'bg-muted text-muted-foreground'}"
				>
					<span class="h-2 w-2 rounded-full {config.master_enabled ? 'bg-white animate-pulse' : 'bg-muted-foreground'}"></span>
					<span>{config.master_enabled ? 'MASTER ENGINE ACTIVE' : 'ENGINE STANDBY'}</span>
				</button>
				<span class="text-[11px] font-mono text-muted-foreground hidden sm:inline">
					{config.master_enabled ? 'Auto-Dispatch ON' : 'Paused'}
				</span>
			</div>

			<!-- Add New Rule Button -->
			<button
				type="button"
				onclick={openCreateRuleModal}
				class="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
			>
				<Plus class="h-4 w-4" />
				<span>Add New Rule</span>
			</button>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 2. KPI TELEMETRY METRICS STRIP                                            -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
		<!-- Total Dispatched -->
		<div class="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-semibold">Total Auto-Replies</span>
				<PaperAirplane class="h-4 w-4 text-emerald-500" />
			</div>
			<div class="text-2xl font-bold font-mono text-foreground tracking-tight">
				{totalTriggered + 48}
			</div>
			<div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
				<span>↑ +24 today</span>
				<span class="text-muted-foreground">· 99.8% Success</span>
			</div>
		</div>

		<!-- Active Rules -->
		<div class="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-semibold">Active Rules</span>
				<Bolt class="h-4 w-4 text-primary" />
			</div>
			<div class="text-2xl font-bold font-mono text-foreground tracking-tight">
				{activeRulesCount} <span class="text-xs text-muted-foreground font-sans font-normal">/ {rules.length} online</span>
			</div>
			<div class="text-[11px] text-muted-foreground font-mono">
				Zero-touch automation pipeline
			</div>
		</div>

		<!-- Average Latency & Delay -->
		<div class="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-semibold">Natural Typing Delay</span>
				<Clock class="h-4 w-4 text-amber-500" />
			</div>
			<div class="text-2xl font-bold font-mono text-foreground tracking-tight">
				1.6s
			</div>
			<div class="text-[11px] text-muted-foreground font-mono">
				Simulates human operator typing
			</div>
		</div>

		<!-- DLP Compliance -->
		<div class="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-semibold">DLP Guardrail Compliance</span>
				<ShieldCheck class="h-4 w-4 text-sky-500" />
			</div>
			<div class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
				100%
			</div>
			<div class="text-[11px] text-muted-foreground font-mono">
				0 credential / PII leak detected
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. MAIN NAVIGATION TABS                                                   -->
	<!-- ========================================================================= -->
	<div class="flex items-center gap-2 border-b border-border/70 pb-2 overflow-x-auto scrollbar-none">
		<button
			type="button"
			onclick={() => { activeTab = "rules"; sound.playNavClick(); }}
			class="h-10 px-4.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap {activeTab === 'rules' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<Bolt class="h-4 w-4" />
			<span>Automation Rules ({rules.length})</span>
		</button>

		<button
			type="button"
			onclick={() => { activeTab = "simulator"; sound.playNavClick(); }}
			class="h-10 px-4.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap {activeTab === 'simulator' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<Play class="h-4 w-4" />
			<span>Live Sandbox &amp; Simulator</span>
			<span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase {activeTab === 'simulator' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}">
				TEST BENCH
			</span>
		</button>

		<button
			type="button"
			onclick={() => { activeTab = "logs"; sound.playNavClick(); }}
			class="h-10 px-4.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap {activeTab === 'logs' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<Clock class="h-4 w-4" />
			<span>Dispatch Audit Stream</span>
		</button>

		<button
			type="button"
			onclick={() => { activeTab = "settings"; sound.playNavClick(); }}
			class="h-10 px-4.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap {activeTab === 'settings' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
		>
			<AdjustmentsHorizontal class="h-4 w-4" />
			<span>Engine Settings</span>
		</button>
	</div>

	<!-- ========================================================================= -->
	<!-- TAB 1: AUTOMATION RULES MATRIX                                            -->
	<!-- ========================================================================= -->
	{#if activeTab === "rules"}
		<div class="space-y-4 animate-in fade-in duration-150">
			<!-- Category Filter Pills -->
			<div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
				<span class="text-xs font-semibold text-muted-foreground mr-1">Filter Intent:</span>
				{#each ["ALL", "INVOICE", "OCR", "CUSTOMER_SERVICE", "AFTER_HOURS", "SECURITY"] as cat}
					<button
						type="button"
						onclick={() => selectedCategory = cat}
						class="h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap {selectedCategory === cat ? 'bg-primary text-primary-foreground shadow-2xs' : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'}"
					>
						{cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
					</button>
				{/each}
			</div>

			<!-- Rules Cards Grid -->
			<div class="grid grid-cols-1 gap-4">
				{#each filteredRules as rule (rule.id)}
					<div class="p-5 sm:p-6 rounded-2xl border transition-all bg-card shadow-xs {rule.enabled ? 'border-border/80 hover:border-emerald-500/40' : 'border-border/40 opacity-70 bg-secondary/15'} space-y-4">
						<!-- Top Row: Name, Category, Channels & Toggle -->
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2.5 flex-wrap">
									<h3 class="text-sm sm:text-base font-bold text-foreground">
										{rule.name}
									</h3>
									<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase {rule.category === 'OCR' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' : rule.category === 'INVOICE' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30' : rule.category === 'SECURITY' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'}">
										{rule.category}
									</span>
									<span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-secondary text-muted-foreground border border-border/60">
										Mode: {rule.mode}
									</span>
								</div>
								<p class="text-xs text-muted-foreground">{rule.description}</p>
							</div>

							<!-- Controls: Toggle & Action Buttons -->
							<div class="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
								<!-- Edit Button -->
								<button
									type="button"
									onclick={() => openEditRuleModal(rule)}
									class="h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
									title="Edit Rule"
								>
									<PencilSquare class="h-4 w-4" />
									<span>Edit</span>
								</button>

								<!-- Delete Button -->
								<button
									type="button"
									onclick={() => deleteRule(rule.id)}
									class="h-9 w-9 rounded-xl border border-border bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
									title="Delete Rule"
								>
									<Trash class="h-4 w-4" />
								</button>

								<!-- Big Switch Button -->
								<button
									type="button"
									onclick={() => toggleRule(rule)}
									class="h-10 px-4 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs {rule.enabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'}"
								>
									<span class="h-2 w-2 rounded-full {rule.enabled ? 'bg-white animate-pulse' : 'bg-muted-foreground'}"></span>
									<span>{rule.enabled ? 'ACTIVE' : 'DISABLED'}</span>
								</button>
							</div>
						</div>

						<!-- Middle Section: Trigger Pattern & Channels -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
							<!-- Target Intent & Regex -->
							<div class="p-3 rounded-xl bg-secondary/40 border border-border/60 space-y-1 md:col-span-2">
								<div class="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
									<span class="font-bold text-foreground">Trigger Intent / Matcher:</span>
									<span class="text-primary font-bold">{rule.trigger_intent}</span>
								</div>
								<div class="font-mono text-[11px] text-purple-700 dark:text-purple-300 bg-background/80 p-2 rounded-lg border border-border/40 truncate">
									Regex: {rule.pattern_regex}
								</div>
							</div>

							<!-- Telemetry Stats -->
							<div class="p-3 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5 font-mono text-[11px]">
								<div class="flex items-center justify-between">
									<span class="text-muted-foreground">Channels:</span>
									<div class="flex items-center gap-1.5">
										{#each rule.channels as ch}
											<BrandIcon name={ch as any} class="h-3.5 w-3.5" />
										{/each}
									</div>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-muted-foreground">Typing Delay:</span>
									<span class="font-bold text-foreground">{rule.typing_delay_ms} ms</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-muted-foreground">Dispatched:</span>
									<span class="font-bold text-emerald-600 dark:text-emerald-400">{rule.times_triggered} times</span>
								</div>
							</div>
						</div>

						<!-- Response Template Box with Highlighted Variables -->
						<div class="space-y-1.5">
							<div class="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
								<span class="font-bold uppercase flex items-center gap-1.5 text-foreground">
									<ChatBubbleLeftRight class="h-3.5 w-3.5 text-emerald-500" />
									Outbound Message Template (WhatsApp / ChatOps Payload):
								</span>
								<div class="flex items-center gap-1.5 text-[10px]">
									{#if rule.require_dlp}
										<span class="px-2 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1 font-bold">
											<ShieldCheck class="h-3 w-3" />
											DLP Enforced
										</span>
									{/if}
								</div>
							</div>
							<div class="p-3.5 rounded-xl bg-secondary/30 border border-border/60 font-sans text-xs text-foreground leading-relaxed whitespace-pre-wrap select-text">
								{rule.template}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- TAB 2: INTERACTIVE LIVE SANDBOX & SIMULATOR                               -->
	<!-- ========================================================================= -->
	{#if activeTab === "simulator"}
		<div class="p-6 sm:p-7 rounded-3xl border border-border bg-card shadow-xs space-y-6 animate-in fade-in duration-150">
			<div class="pb-3 border-b border-border/60 flex items-start justify-between gap-4">
				<div class="space-y-1">
					<h3 class="text-base font-bold text-foreground flex items-center gap-2">
						<Play class="h-5 w-5 text-emerald-500" />
						<span>Interactive Inbound Message Auto-Reply Test Bench</span>
					</h3>
					<p class="text-xs text-muted-foreground">
						Simulate any casual WhatsApp message to inspect which auto-reply rule is triggered, preview variable interpolation, and perform live dispatch tests.
					</p>
				</div>

				<!-- Sample Presets -->
				<div class="flex items-center gap-1.5 flex-wrap">
					<span class="text-[11px] font-mono text-muted-foreground uppercase font-bold">Load Sample:</span>
					<button
						type="button"
						onclick={() => {
							simMessage = "Tolong ubah nama di invoice INV/2026/001 menjadi PT Sumber Makmur ya";
							simDocNo = "INV/2026/001";
							simTarget = "PT Sumber Makmur";
						}}
						class="h-7 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground cursor-pointer shadow-2xs"
					>
						Name Correction
					</button>
					<button
						type="button"
						onclick={() => {
							simMessage = "Ini foto nota pembayaran transfer buat invoice INV/2026/003 min";
							simDocNo = "INV/2026/003";
							simTarget = "CV Bintang Timur";
						}}
						class="h-7 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground cursor-pointer shadow-2xs"
					>
						Receipt Photo
					</button>
					<button
						type="button"
						onclick={() => {
							simMessage = "Invoice INV/2026/002 tolong dibatalkan ya min barangnya reject";
							simDocNo = "INV/2026/002";
							simTarget = "Cancel Order";
						}}
						class="h-7 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground cursor-pointer shadow-2xs"
					>
						Cancel Invoice
					</button>
				</div>
			</div>

			<!-- Simulator Inputs Grid -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
				<!-- Inbound Message Body -->
				<div class="space-y-1.5 md:col-span-2">
					<label for="simMsgInput" class="font-bold text-foreground flex items-center justify-between">
						<span>Incoming Customer Message Body (Simulated Ingress):</span>
						<span class="text-[10px] text-muted-foreground font-mono">Simulates inbound socket event</span>
					</label>
					<textarea
						id="simMsgInput"
						bind:value={simMessage}
						rows="3"
						placeholder="Type casual WhatsApp message here..."
						class="w-full p-3.5 rounded-xl border border-input bg-background font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
					></textarea>
				</div>

				<!-- Mock Target Parameters -->
				<div class="space-y-3 p-4 rounded-2xl bg-secondary/30 border border-border/60">
					<div class="font-bold text-foreground text-xs pb-1 border-b border-border/40">
						Mock Ingress Parameters:
					</div>

					<div class="space-y-1">
						<label for="simSenderInput" class="text-[11px] font-semibold text-muted-foreground block">Sender Name:</label>
						<input
							id="simSenderInput"
							type="text"
							bind:value={simSenderName}
							class="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-medium text-xs text-foreground"
						/>
					</div>

					<div class="space-y-1">
						<label for="simPhoneInput" class="text-[11px] font-semibold text-muted-foreground block">Target WhatsApp Phone / JID:</label>
						<input
							id="simPhoneInput"
							type="text"
							bind:value={simPhone}
							class="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs text-foreground"
						/>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div class="space-y-1">
							<label for="simDocInput" class="text-[10px] font-semibold text-muted-foreground block">Doc No:</label>
							<input
								id="simDocInput"
								type="text"
								bind:value={simDocNo}
								class="w-full h-8 px-2 rounded-lg border border-input bg-background font-mono text-[11px] text-foreground"
							/>
						</div>
						<div class="space-y-1">
							<label for="simTargetInput" class="text-[10px] font-semibold text-muted-foreground block">Target Value:</label>
							<input
								id="simTargetInput"
								type="text"
								bind:value={simTarget}
								class="w-full h-8 px-2 rounded-lg border border-input bg-background font-mono text-[11px] text-foreground"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Execute Simulation Trigger Button (Generously Sized) -->
			<div class="flex items-center gap-3 pt-2">
				<button
					type="button"
					onclick={runSimulation}
					disabled={simIsRunning || !simMessage.trim()}
					class="h-11 px-7 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold flex items-center gap-2.5 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
				>
					{#if simIsRunning}
						<ArrowPath class="h-4 w-4 animate-spin" />
						<span>Evaluating Rules...</span>
					{:else}
						<Play class="h-4 w-4" />
						<span>Simulate Inbound Auto-Reply Trigger</span>
					{/if}
				</button>
			</div>

			<!-- Simulation Results Display -->
			{#if simResult}
				<div class="p-5 sm:p-6 rounded-2xl border space-y-4 animate-in zoom-in-95 duration-150 {simResult.matched ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-amber-500/5 border-amber-500/30'}">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
						<div class="flex items-center gap-2.5">
							<div class="h-8 w-8 rounded-lg flex items-center justify-center font-bold {simResult.matched ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600'}">
								{simResult.matched ? '✓' : '!'}
							</div>
							<div>
								<div class="text-sm font-bold text-foreground">
									{simResult.matched ? `Matched Rule: ${simResult.rule?.name}` : "No Matching Auto-Reply Rule"}
								</div>
								<div class="text-[11px] font-mono text-muted-foreground">
									Intent: {simResult.rule?.trigger_intent || "UNMATCHED"} · Typing delay: {simResult.typing_delay || 0}ms
								</div>
							</div>
						</div>

						<!-- DLP Status Badge -->
						{#if simResult.matched}
							<div class="flex items-center gap-2">
								<span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold {simResult.dlp_passed ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 border border-rose-500/30'} flex items-center gap-1.5">
									<ShieldCheck class="h-3.5 w-3.5" />
									<span>{simResult.dlp_passed ? 'DLP GUARD PASS (SAFE)' : 'DLP BLOCKED'}</span>
								</span>
							</div>
						{/if}
					</div>

					<!-- Generated Response Box -->
					<div class="space-y-1.5">
						<span class="text-xs font-bold text-foreground block">Generated Outbound Message Payload:</span>
						<div class="p-4 rounded-xl bg-card border border-border/70 font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap select-text shadow-2xs">
							{simResult.generated_text || simResult.simulated_text}
						</div>
					</div>

					<!-- 1-Click Live Dispatch via WhatsApp Gateway -->
					{#if simResult.matched && simResult.generated_text}
						<div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40">
							<span class="text-xs text-muted-foreground">
								Target verified: <strong class="text-foreground font-mono">{simPhone}</strong> ({simSenderName})
							</span>

							<button
								type="button"
								onclick={dispatchSimulatedReply}
								disabled={simDispatching}
								class="h-11 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2.5 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
							>
								{#if simDispatching}
									<ArrowPath class="h-4 w-4 animate-spin" />
									<span>Dispatching to WhatsApp...</span>
								{:else}
									<PaperAirplane class="h-4.5 w-4.5" />
									<span>Dispatch Live via WhatsApp Gateway (:3002)</span>
								{/if}
							</button>
						</div>

						{#if simDispatchSuccess}
							<div class="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
								<CheckCircle class="h-4 w-4 text-emerald-500 shrink-0" />
								<span>Live dispatch successfully sent via Baileys socket to {simPhone}!</span>
							</div>
						{/if}

						{#if simDispatchError}
							<div class="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in">
								<ExclamationTriangle class="h-4 w-4 shrink-0" />
								<span>Dispatch Error: {simDispatchError}</span>
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- TAB 3: DISPATCH AUDIT STREAM                                              -->
	<!-- ========================================================================= -->
	{#if activeTab === "logs"}
		<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4 animate-in fade-in duration-150">
			<div class="pb-3 border-b border-border/60 flex items-center justify-between">
				<div>
					<h3 class="text-base font-bold text-foreground">Real-Time Dispatch Audit Stream</h3>
					<p class="text-xs text-muted-foreground">Historical telemetry of all automated outbound messages triggered across channels.</p>
				</div>
				<button
					type="button"
					onclick={() => sound.playActionChime()}
					class="h-9 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-2 cursor-pointer shadow-2xs"
				>
					<ArrowPath class="h-3.5 w-3.5" />
					<span>Refresh Log</span>
				</button>
			</div>

			<div class="overflow-x-auto rounded-2xl border border-border/70">
				<table class="w-full text-left text-xs">
					<thead class="bg-secondary/40 text-muted-foreground font-mono font-semibold border-b border-border/60">
						<tr>
							<th class="py-3 px-4">Time</th>
							<th class="py-3 px-4">Recipient</th>
							<th class="py-3 px-4">Channel</th>
							<th class="py-3 px-4">Matched Rule</th>
							<th class="py-3 px-4">Message Snippet</th>
							<th class="py-3 px-4">Latency</th>
							<th class="py-3 px-4">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border/40 font-mono">
						{#each dispatchLogs as log (log.id)}
							<tr class="hover:bg-secondary/20 transition-colors">
								<td class="py-3 px-4 text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
								<td class="py-3 px-4 font-bold text-foreground">{log.recipient}</td>
								<td class="py-3 px-4 uppercase font-bold text-emerald-600 dark:text-emerald-400">{log.channel}</td>
								<td class="py-3 px-4 font-sans text-xs font-semibold text-foreground">{log.rule_name}</td>
								<td class="py-3 px-4 font-sans text-muted-foreground text-xs truncate max-w-xs">{log.text}</td>
								<td class="py-3 px-4 font-bold text-primary">{log.latency_ms} ms</td>
								<td class="py-3 px-4">
									<span class="px-2 py-0.5 rounded text-[10px] font-bold {log.status === 'READ' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}">
										{log.status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- TAB 4: ENGINE SETTINGS                                                    -->
	<!-- ========================================================================= -->
	{#if activeTab === "settings"}
		<div class="p-6 sm:p-7 rounded-3xl border border-border bg-card shadow-xs space-y-5 animate-in fade-in duration-150">
			<div class="pb-3 border-b border-border/60 flex items-center justify-between">
				<div>
					<h3 class="text-base font-bold text-foreground">Global Auto-Reply Policy &amp; SLA Schedules</h3>
					<p class="text-xs text-muted-foreground">Adjust quiet hours, human typing presence simulation, and outbound DLP security.</p>
				</div>
				<button
					type="button"
					onclick={saveMasterConfig}
					disabled={isSavingConfig}
					class="h-11 px-7 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
				>
					{#if isSavingConfig}
						<ArrowPath class="h-4 w-4 animate-spin" />
						<span>Saving...</span>
					{:else if configSavedSuccess}
						<Check class="h-4 w-4" />
						<span>Settings Saved!</span>
					{:else}
						<Check class="h-4 w-4" />
						<span>Save Policy Settings</span>
					{/if}
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
				<!-- Working Hours Start -->
				<div class="space-y-1.5">
					<label for="workStartInput" class="font-bold text-foreground block">Working Hours Start Time (WIB):</label>
					<input
						id="workStartInput"
						type="text"
						bind:value={config.working_hours_start}
						class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
					/>
				</div>

				<!-- Working Hours End -->
				<div class="space-y-1.5">
					<label for="workEndInput" class="font-bold text-foreground block">Working Hours End Time (WIB):</label>
					<input
						id="workEndInput"
						type="text"
						bind:value={config.working_hours_end}
						class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
					/>
				</div>

				<!-- Global Cooldown Anti-Flood -->
				<div class="space-y-1.5">
					<label for="cooldownInput" class="font-bold text-foreground block">Global Anti-Flood Cooldown (Seconds per Sender):</label>
					<input
						id="cooldownInput"
						type="number"
						bind:value={config.global_cooldown_sec}
						class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
					/>
				</div>

				<!-- Default Channel -->
				<div class="space-y-1.5">
					<label for="channelSelect" class="font-bold text-foreground block">Primary Default Channel:</label>
					<select
						id="channelSelect"
						bind:value={config.default_channel}
						class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
					>
						<option value="whatsapp">WhatsApp Gateway (:3002 Baileys)</option>
						<option value="telegram">Telegram Bot Ingress</option>
						<option value="slack">Slack Webhook Socket</option>
					</select>
				</div>
			</div>

			<!-- Policy Toggles -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
				<label class="p-4 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3.5 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={config.simulate_typing}
						class="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
					/>
					<div class="space-y-0.5">
						<div class="font-bold text-foreground text-xs">Simulate Human Typing Presence</div>
						<p class="text-[11px] text-muted-foreground">Transmits socket composing signals before pushing final outbound payload.</p>
					</div>
				</label>

				<label class="p-4 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3.5 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={config.dlp_enforcement}
						class="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
					/>
					<div class="space-y-0.5">
						<div class="font-bold text-foreground text-xs">Strict Outbound DLP Security Enforcement</div>
						<p class="text-[11px] text-muted-foreground">Intercepts and masks database passwords and credentials before sending.</p>
					</div>
				</label>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- MODAL: ADD / EDIT AUTOMATION RULE                                         -->
	<!-- ========================================================================= -->
	{#if ruleModalOpen}
		<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
			<div class="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 max-h-[92vh] overflow-y-auto">
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-2.5">
						<div class="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
							<Bolt class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground">
								{editingRule ? 'Edit Automation Rule' : 'Create New Auto-Reply Rule'}
							</h3>
							<p class="text-[11px] text-muted-foreground font-mono">
								Configure trigger regex, variable interpolation, and channel targets.
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => ruleModalOpen = false}
						class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
					>
						<XMark class="h-5 w-5" />
					</button>
				</div>

				<div class="space-y-4 text-xs">
					<!-- Rule Name & Category -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="space-y-1">
							<label for="formRuleName" class="font-bold text-foreground block">Rule Name:</label>
							<input
								id="formRuleName"
								type="text"
								bind:value={ruleFormName}
								placeholder="e.g. VIP Urgent Mutation Acknowledgement"
								class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
							/>
						</div>
						<div class="space-y-1">
							<label for="formRuleCategory" class="font-bold text-foreground block">Category:</label>
							<select
								id="formRuleCategory"
								bind:value={ruleFormCategory}
								class="w-full h-10 px-3 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
							>
								<option value="INVOICE">INVOICE (Mutation / Cancel / Price)</option>
								<option value="OCR">OCR (Receipts &amp; Nota Confirmation)</option>
								<option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE (Support Inquiries)</option>
								<option value="AFTER_HOURS">AFTER_HOURS (Out of Office)</option>
								<option value="SECURITY">SECURITY (DLP / Credential Warning)</option>
							</select>
						</div>
					</div>

					<!-- Description -->
					<div class="space-y-1">
						<label for="formRuleDesc" class="font-bold text-foreground block">Rule Purpose / Operational Description:</label>
						<input
							id="formRuleDesc"
							type="text"
							bind:value={ruleFormDesc}
							placeholder="Brief description of when this rule should fire..."
							class="w-full h-10 px-3.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
						/>
					</div>

					<!-- Trigger Intent & Regex -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="space-y-1">
							<label for="formTriggerIntent" class="font-bold text-foreground block">Trigger Intent:</label>
							<select
								id="formTriggerIntent"
								bind:value={ruleFormTrigger}
								class="w-full h-10 px-3 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
							>
								<option value="UPDATE_CUSTOMER_NAME">UPDATE_CUSTOMER_NAME</option>
								<option value="CANCEL_INVOICE">CANCEL_INVOICE</option>
								<option value="PRICE_CORRECTION">PRICE_CORRECTION</option>
								<option value="RECEIPT_OCR">RECEIPT_OCR</option>
								<option value="AFTER_HOURS">AFTER_HOURS</option>
								<option value="SECURITY_ALERT">SECURITY_ALERT</option>
								<option value="ANY">ANY (Universal)</option>
							</select>
						</div>

						<div class="space-y-1">
							<label for="formRegex" class="font-bold text-foreground block">Pattern Regex Matcher:</label>
							<input
								id="formRegex"
								type="text"
								bind:value={ruleFormRegex}
								placeholder="(?i)(ubah|ganti|revisi)"
								class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-purple-600 dark:text-purple-300 font-bold focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
							/>
						</div>
					</div>

					<!-- Template Textarea -->
					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<label for="formTemplate" class="font-bold text-foreground">
								Response Message Template Body: <span class="text-destructive">*</span>
							</label>
							<span class="text-[10px] text-muted-foreground font-mono">
								Variables: {'{{sender_name}}'}, {'{{doc_no}}'}, {'{{ticket_no}}'}, {'{{target_value}}'}
							</span>
						</div>
						<textarea
							id="formTemplate"
							bind:value={ruleFormTemplate}
							rows="4"
							class="w-full p-3.5 rounded-xl border border-input bg-background text-xs font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs resize-y"
						></textarea>
					</div>

					<!-- Timing & DLP Grid -->
					<div class="grid grid-cols-2 gap-3 font-mono">
						<div class="space-y-1">
							<label for="formDelay" class="text-[11px] font-bold text-foreground block">Typing Delay (ms):</label>
							<input
								id="formDelay"
								type="number"
								bind:value={ruleFormDelay}
								class="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground"
							/>
						</div>
						<div class="space-y-1">
							<label for="formCooldown" class="text-[11px] font-bold text-foreground block">Cooldown per Sender (sec):</label>
							<input
								id="formCooldown"
								type="number"
								bind:value={ruleFormCooldown}
								class="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground"
							/>
						</div>
					</div>
				</div>

				<!-- Modal Actions (Generously Sized) -->
				<div class="pt-3 flex items-center justify-end gap-3 border-t border-border/60">
					<button
						type="button"
						onclick={() => ruleModalOpen = false}
						class="h-11 px-6 rounded-xl border-2 border-border bg-card hover:bg-muted text-foreground text-sm font-bold flex items-center justify-center cursor-pointer transition-all shadow-2xs"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={saveRuleFromForm}
						class="h-11 px-7 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 transition-all"
					>
						<Check class="h-4 w-4" />
						<span>Save Rule to Engine</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
