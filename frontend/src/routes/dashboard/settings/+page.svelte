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
		Radio,
		CursorArrowRays,
		UserCircle,
		Folder,
		Server,
		Cloud,
		Photo,
		Trash,
		ArrowUpTray,
		ArrowTopRightOnSquare,
		PaperAirplane
	} from "svelte-heros-v2";
	import { sound, SOUND_THEMES, type SoundTheme } from "$lib/audio";
	import { i18n } from "$lib/i18n.svelte";
	import { cockpit } from "$lib/cockpit.svelte";
	import { formatCurrency } from "$lib/utils";

	// Active Navigation Tab
	type SettingsTab = "profile" | "storage" | "gatekeeper" | "ai_model" | "chatops" | "database" | "alerts" | "interface";
	let activeTab = $state<SettingsTab>("profile");

	// Guard: If switching to Lite Mode while on an SRE/Dev tab, redirect gracefully
	$effect(() => {
		if (cockpit.isLite && (activeTab === "storage" || activeTab === "gatekeeper" || activeTab === "ai_model" || activeTab === "chatops" || activeTab === "database")) {
			activeTab = "interface";
		}
	});

	// 0. User Profile & Account Settings
	let profileName = $state("John Doe");
	let profileEmail = $state("johndoe@factory.internal");
	let profileRole = $state("Lead On-Call SRE / Incident Commander");
	let profileBranch = $state("Surabaya Hub (Jawa Timur)");
	let profilePhone = $state("+62 812-2863-2195");
	let profileShift = $state("Shift A (08:00 - 17:00 WIB)");
	let profileBio = $state("Responsible for automated invoice mutations, ERP reconciliation, and WhatsApp ingress triage.");
	let profileTimezone = $state("Asia/Jakarta (WIB, UTC+7)");
	let profileAvatar = $state("https://api.dicebear.com/7.x/avataaars/svg?seed=JohnDoe");
	let profile2FA = $state(true);
	let isUploadingAvatar = $state(false);
	let avatarUploadError = $state<string | null>(null);
	let avatarFileInput: HTMLInputElement | null = $state(null);
	let profileSaveSuccess = $state(false);

	// 0.1 Storage Architecture (Internal FS & S3 Cloud Object Storage)
	let storageActiveBackend = $state<"internal" | "s3">("internal");
	let storageCategories = $state<Array<{
		category: string;
		path: string;
		file_count: number;
		size_mb: string;
		description: string;
	}>>([
		{ category: "avatars", path: "uploads/avatars", file_count: 0, size_mb: "0.0 KB", description: "User profile photos, avatars, and employee credentials" },
		{ category: "documents", path: "uploads/documents", file_count: 0, size_mb: "0.0 KB", description: "Invoices, tax slips, work orders, purchase orders & PDFs" },
		{ category: "wa_attachments", path: "uploads/wa_attachments", file_count: 6, size_mb: "793.4 KB", description: "Inbound WhatsApp photos, camera shots, and payment receipts" },
		{ category: "mcp_exports", path: "uploads/mcp_exports", file_count: 0, size_mb: "0.0 KB", description: "MCP catalog schemas, system exports, and JSON dumps" }
	]);
	let storageTotalFiles = $state(6);
	let storageTotalMB = $state("0.77 MB");
	let storageLoading = $state(false);
	let storageTesting = $state(false);
	let storageTestResult = $state<{ success: boolean; latency: number; message: string; target: string } | null>(null);

	// S3 Configuration Fields
	let s3Enabled = $state(false);
	let s3Endpoint = $state("s3.ap-southeast-1.amazonaws.com");
	let s3Region = $state("ap-southeast-1");
	let s3Bucket = $state("novapilot-vault");
	let s3AccessKey = $state("AKIA_NOVAPILOT_DEMO");
	let s3SecretKey = $state("••••••••");
	let showS3SecretKey = $state(false);
	let s3PathStyle = $state(true);
	let s3UseSSL = $state(true);
	let s3Testing = $state(false);
	let s3TestResult = $state<{ success: boolean; latency: number; message: string } | null>(null);
	let storageSaveSuccess = $state(false);

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
	let soundAlerts = $state(sound.enabled);
	let soundVolume = $state(Math.round(sound.volume * 100));
	let soundTheme = $state<SoundTheme>(sound.theme);
	let navSoundEnabled = $state(sound.navEnabled);
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

				if (s.soundAlerts !== undefined) {
					soundAlerts = s.soundAlerts;
					sound.enabled = s.soundAlerts;
				}
				if (s.soundVolume !== undefined) {
					soundVolume = s.soundVolume;
					sound.volume = s.soundVolume / 100;
				}
				if (s.soundTheme && ["sony_crystal", "sony_xperia", "bravia_cinema", "cyber_clean"].includes(s.soundTheme)) {
					soundTheme = s.soundTheme;
					sound.theme = s.soundTheme;
				}
				if (s.navSoundEnabled !== undefined) {
					navSoundEnabled = s.navSoundEnabled;
					sound.navEnabled = s.navSoundEnabled;
				}
				if (s.highValueAlertEscalation !== undefined) highValueAlertEscalation = s.highValueAlertEscalation;
				if (s.idleEscalationMinutes !== undefined) idleEscalationMinutes = s.idleEscalationMinutes;

				if (s.compactTable !== undefined) compactTable = s.compactTable;
				if (s.telemetryRefreshRate) telemetryRefreshRate = s.telemetryRefreshRate;
				if (s.sessionAutoLock) sessionAutoLock = s.sessionAutoLock;
				if (s.defaultExportFormat) defaultExportFormat = s.defaultExportFormat;
			}
		} catch {}

		// Check URL parameter tab
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const tabParam = params.get("tab") as SettingsTab | null;
			if (tabParam && ["profile", "storage", "gatekeeper", "ai_model", "chatops", "database", "alerts", "interface"].includes(tabParam)) {
				activeTab = tabParam;
			}

			// Load customized user profile
			try {
				const savedProfile = localStorage.getItem("novapilot_user_profile");
				if (savedProfile) {
					const p = JSON.parse(savedProfile);
					if (p.name) profileName = p.name;
					if (p.email) profileEmail = p.email;
					if (p.role) profileRole = p.role;
					if (p.branch) profileBranch = p.branch;
					if (p.phone) profilePhone = p.phone;
					if (p.shift) profileShift = p.shift;
					if (p.bio) profileBio = p.bio;
					if (p.timezone) profileTimezone = p.timezone;
					if (p.avatar) profileAvatar = p.avatar;
					if (p.twoFactorEnabled !== undefined) profile2FA = p.twoFactorEnabled;
				}
			} catch {}
		}

		fetchStorageConfig();
	});

	async function fetchStorageConfig() {
		storageLoading = true;
		try {
			const res = await fetch("/api/storage/config");
			if (res.ok) {
				const data = await res.json();
				storageActiveBackend = data.active_backend || "internal";
				storageCategories = data.categories || [];
				storageTotalFiles = data.total_files || 0;
				storageTotalMB = data.total_size_mb || "0 MB";
				if (data.s3) {
					s3Enabled = data.s3.enabled || false;
					if (data.s3.endpoint) s3Endpoint = data.s3.endpoint;
					if (data.s3.region) s3Region = data.s3.region;
					if (data.s3.bucket) s3Bucket = data.s3.bucket;
					if (data.s3.access_key) s3AccessKey = data.s3.access_key;
					if (data.s3.secret_key) s3SecretKey = data.s3.secret_key;
					if (data.s3.path_style !== undefined) s3PathStyle = data.s3.path_style;
					if (data.s3.use_ssl !== undefined) s3UseSSL = data.s3.use_ssl;
				}
			}
		} catch {} finally {
			storageLoading = false;
		}
	}

	async function saveStorageConfig() {
		try {
			const res = await fetch("/api/storage/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					active_backend: storageActiveBackend,
					s3_enabled: s3Enabled,
					s3_endpoint: s3Endpoint,
					s3_region: s3Region,
					s3_bucket: s3Bucket,
					s3_access_key: s3AccessKey,
					s3_secret_key: s3SecretKey,
					s3_path_style: s3PathStyle,
					s3_use_ssl: s3UseSSL
				})
			});
			if (res.ok) {
				storageSaveSuccess = true;
				setTimeout(() => { storageSaveSuccess = false; }, 3500);
			}
		} catch {}
	}

	async function testInternalStorage() {
		storageTesting = true;
		storageTestResult = null;
		try {
			const res = await fetch("/api/storage/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ target: "internal" })
			});
			const data = await res.json();
			storageTestResult = {
				success: data.ok,
				latency: data.latency_ms || 1,
				message: data.message || (data.ok ? "Filesystem internal verified" : data.error),
				target: "internal"
			};
		} catch (err: any) {
			storageTestResult = { success: false, latency: 0, message: err.message, target: "internal" };
		} finally {
			storageTesting = false;
			setTimeout(() => { storageTestResult = null; }, 5000);
		}
	}

	async function testS3Connection() {
		s3Testing = true;
		s3TestResult = null;
		try {
			const res = await fetch("/api/storage/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ target: "s3" })
			});
			const data = await res.json();
			s3TestResult = {
				success: data.ok,
				latency: data.latency_ms || 12,
				message: data.message || (data.ok ? "S3 handshake verified" : data.error)
			};
		} catch (err: any) {
			s3TestResult = { success: false, latency: 0, message: err.message };
		} finally {
			s3Testing = false;
			setTimeout(() => { s3TestResult = null; }, 5000);
		}
	}

	async function handleAvatarUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		const file = target.files[0];
		if (file.size > 5 * 1024 * 1024) {
			avatarUploadError = "File size exceeds 5MB limit.";
			setTimeout(() => { avatarUploadError = null; }, 4000);
			return;
		}

		isUploadingAvatar = true;
		avatarUploadError = null;

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("category", "avatars");
			formData.append("uploaded_by", profileName);

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData
			});

			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || "Gagal mengunggah avatar.");
			}

			const data = await res.json();
			profileAvatar = data.url || data.file_path;
			saveUserProfile();
			fetchStorageConfig();
		} catch (err: any) {
			avatarUploadError = err.message || "Upload avatar failed.";
		} finally {
			isUploadingAvatar = false;
			if (avatarFileInput) avatarFileInput.value = "";
		}
	}

	function generateRandomAvatar() {
		const seeds = ["Felix", "Aero", "Nova", "Cipher", "Vortex", "Sora", "Zephyr", "Ranger", "Orion", "Titan"];
		const rand = seeds[Math.floor(Math.random() * seeds.length)] + "_" + Math.floor(Math.random() * 999);
		profileAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${rand}`;
		saveUserProfile();
	}

	function removeAvatar() {
		profileAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=JohnDoe";
		saveUserProfile();
	}

	function saveUserProfile() {
		const profileObj = {
			name: profileName,
			email: profileEmail,
			role: profileRole,
			branch: profileBranch,
			phone: profilePhone,
			shift: profileShift,
			bio: profileBio,
			timezone: profileTimezone,
			avatar: profileAvatar,
			twoFactorEnabled: profile2FA,
			updatedAt: new Date().toISOString()
		};
		localStorage.setItem("novapilot_user_profile", JSON.stringify(profileObj));
		window.dispatchEvent(new Event("novapilot_profile_updated"));
		profileSaveSuccess = true;
		setTimeout(() => { profileSaveSuccess = false; }, 3000);
	}

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
				soundTheme,
				navSoundEnabled,
				browserPushAlerts,
				highValueAlertEscalation,
				idleEscalationMinutes,
				compactTable,
				telemetryRefreshRate,
				sessionAutoLock,
				defaultExportFormat,
				lastSavedAt: new Date().toISOString()
			};

			// Sync with global sound engine
			sound.enabled = soundAlerts;
			sound.volume = soundVolume / 100;
			sound.theme = soundTheme;
			sound.navEnabled = navSoundEnabled;

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

	function playTestSound() {
		sound.playInboundPing(soundTheme);
	}

	function playTestActionChime() {
		sound.playActionChime(soundTheme);
	}

	function playTestAlertChime() {
		sound.playAlertChime(soundTheme);
	}

	function playTestNavClick() {
		sound.playNavClick(soundTheme);
	}

	function selectSoundTheme(th: SoundTheme) {
		soundTheme = th;
		sound.theme = th;
		sound.playInboundPing(th);
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
						{i18n.t.settings.title}
						<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-primary/15 text-primary border border-primary/30">
							{i18n.t.settings.enterprise_badge}
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.settings.subtitle}
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
				title={i18n.t.settings.export_json}
			>
				<ArrowDownTray class="h-3.5 w-3.5 text-primary" />
				<span class="hidden sm:inline">{i18n.t.settings.export_json}</span>
			</button>

			<button
				type="button"
				onclick={() => resetConfirmOpen = true}
				class="h-9 px-3 rounded-xl border border-destructive/30 hover:border-destructive/60 bg-card hover:bg-destructive/10 text-xs font-semibold text-destructive flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
				title={i18n.t.settings.reset_default}
			>
				<ArrowPath class="h-3.5 w-3.5" />
				<span class="hidden sm:inline">{i18n.t.settings.reset_default}</span>
			</button>

			<button
				type="button"
				onclick={saveSettings}
				disabled={isSaving}
				class="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
			>
				{#if isSaving}
					<ArrowPath class="h-3.5 w-3.5 animate-spin" />
					<span>{i18n.t.settings.saving}</span>
				{:else if saveSuccess}
					<Check class="h-3.5 w-3.5 text-primary-foreground" />
					<span>{i18n.t.settings.saved}</span>
				{:else}
					<span>{i18n.t.settings.save_changes}</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Save Toast Notification -->
	{#if saveSuccess}
		<div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
			<div class="flex items-center gap-2.5">
				<Check class="h-4 w-4 text-emerald-500 shrink-0" />
				<span>{i18n.t.settings.saved_toast}</span>
			</div>
			<span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{i18n.t.settings.synced}</span>
		</div>
	{/if}

	<!-- Reset Confirmation Modal / Banner -->
	{#if resetConfirmOpen}
		<div class="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
			<div class="flex items-center gap-2.5">
				<ExclamationTriangle class="h-4 w-4 text-destructive shrink-0" />
				<span>{i18n.t.settings.reset_confirm_title}</span>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<button
					type="button"
					onclick={() => resetConfirmOpen = false}
					class="h-8 px-3 rounded-lg border border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
				>
					{i18n.t.settings.cancel}
				</button>
				<button
					type="button"
					onclick={resetToDefaults}
					class="h-8 px-3 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold cursor-pointer shadow-2xs"
				>
					{i18n.t.settings.confirm_reset}
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
			onclick={() => activeTab = "profile"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'profile' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<UserCircle class="h-4 w-4" />
			<span>Profile &amp; Avatar</span>
		</button>

		{#if cockpit.isPro}
			<button
				type="button"
				onclick={() => activeTab = "storage"}
				class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'storage' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
			>
				<Folder class="h-4 w-4" />
				<span>Backend Storage &amp; S3</span>
			</button>

			<button
				type="button"
				onclick={() => activeTab = "gatekeeper"}
				class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'gatekeeper' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
			>
				<ShieldCheck class="h-4 w-4" />
				<span>{i18n.t.settings.tab_gatekeeper}</span>
			</button>

			<button
				type="button"
				onclick={() => activeTab = "ai_model"}
				class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'ai_model' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
			>
				<Sparkles class="h-4 w-4" />
				<span>{i18n.t.settings.tab_ai}</span>
			</button>

			<button
				type="button"
				onclick={() => activeTab = "chatops"}
				class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'chatops' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
			>
				<ChatBubbleLeftRight class="h-4 w-4" />
				<span>{i18n.t.settings.tab_chatops}</span>
			</button>

			<button
				type="button"
				onclick={() => activeTab = "database"}
				class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'database' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
			>
				<CircleStack class="h-4 w-4" />
				<span>{i18n.t.settings.tab_database}</span>
			</button>
		{/if}

		<button
			type="button"
			onclick={() => activeTab = "alerts"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'alerts' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<Bell class="h-4 w-4" />
			<span>{i18n.t.settings.tab_alerts}</span>
		</button>

		<button
			type="button"
			onclick={() => activeTab = "interface"}
			class="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap {activeTab === 'interface' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}"
		>
			<WrenchScrewdriver class="h-4 w-4" />
			<span>{i18n.t.settings.tab_interface}</span>
		</button>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. TAB CONTENTS                                                           -->
	<!-- ========================================================================= -->

	<!-- TAB 0: USER PROFILE & AVATAR SETTINGS -->
	{#if activeTab === "profile"}
		<div class="space-y-6 animate-in fade-in duration-150">
			<!-- Profile Card with Avatar Changer -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-6">
				<!-- Header info -->
				<div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs border border-purple-500/20">
							<UserCircle class="h-6 w-6" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground">User Profile &amp; Operational Credentials</h3>
							<p class="text-xs text-muted-foreground">Manage your identity, on-call shift, branch clearance, and profile avatar.</p>
						</div>
					</div>

					<div class="flex items-center gap-2">
						{#if profileSaveSuccess}
							<span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
								<Check class="h-4 w-4" />
								<span>Profile Saved!</span>
							</span>
						{/if}
						<button
							type="button"
							onclick={saveUserProfile}
							class="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
						>
							<Check class="h-4 w-4" />
							<span>Save Profile</span>
						</button>
					</div>
				</div>

				<!-- Avatar Upload & Management Section -->
				<div class="p-5 rounded-2xl border border-border/70 bg-secondary/20 space-y-4">
					<div class="text-xs font-bold text-foreground flex items-center justify-between">
						<span class="flex items-center gap-2">
							<Photo class="h-4 w-4 text-primary" />
							<span>Profile Photo &amp; Avatar</span>
						</span>
						<span class="text-[11px] font-mono text-muted-foreground">Internal Storage: uploads/avatars/</span>
					</div>

					<div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
						<!-- Big Avatar Preview -->
						<div class="relative shrink-0">
							<div class="w-24 h-24 rounded-2xl ring-4 ring-primary/20 overflow-hidden bg-card border border-border shadow-md flex items-center justify-center">
								<img
									src={profileAvatar}
									alt={profileName}
									class="w-full h-full object-cover"
								/>
							</div>
							<span class="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center text-white text-[10px]">
								✓
							</span>
						</div>

						<!-- Avatar Controls -->
						<div class="flex-1 space-y-3 w-full text-center sm:text-left">
							<div>
								<h4 class="text-sm font-bold text-foreground">{profileName}</h4>
								<p class="text-xs text-muted-foreground font-mono truncate">{profileRole}</p>
								<p class="text-[11px] text-muted-foreground mt-0.5">Supports PNG, JPG, WebP, SVG up to 5MB. Stored automatically in structured backend folders.</p>
							</div>

							<!-- Action Buttons -->
							<div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
								<!-- Hidden file input -->
								<input
									type="file"
									accept="image/png,image/jpeg,image/webp,image/svg+xml"
									bind:this={avatarFileInput}
									onchange={handleAvatarUpload}
									class="hidden"
								/>

								<button
									type="button"
									onclick={() => avatarFileInput?.click()}
									disabled={isUploadingAvatar}
									class="h-8.5 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
								>
									{#if isUploadingAvatar}
										<ArrowPath class="h-3.5 w-3.5 animate-spin" />
										<span>Uploading...</span>
									{:else}
										<ArrowUpTray class="h-3.5 w-3.5 text-primary" />
										<span>Upload Photo</span>
									{/if}
								</button>

								<button
									type="button"
									onclick={generateRandomAvatar}
									class="h-8.5 px-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 transition-all cursor-pointer"
									title="Generate unique AI avatar illustration using DiceBear"
								>
									<Sparkles class="h-3.5 w-3.5" />
									<span>DiceBear AI Seed</span>
								</button>

								<button
									type="button"
									onclick={removeAvatar}
									class="h-8.5 px-3 rounded-xl border border-destructive/20 hover:border-destructive/40 bg-card hover:bg-destructive/10 text-xs font-semibold text-destructive flex items-center gap-1.5 transition-all cursor-pointer"
								>
									<Trash class="h-3.5 w-3.5" />
									<span>Reset</span>
								</button>
							</div>

							{#if avatarUploadError}
								<div class="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
									{avatarUploadError}
								</div>
							{/if}

							<!-- Preset Avatars -->
							<div class="pt-2 flex items-center justify-center sm:justify-start gap-2">
								<span class="text-[10px] uppercase font-mono font-bold text-muted-foreground">Presets:</span>
								{#each [
									{ name: "John", seed: "JohnDoe" },
									{ name: "Sarah", seed: "SarahOps" },
									{ name: "Alex", seed: "AlexDev" },
									{ name: "Maya", seed: "MayaSec" },
									{ name: "David", seed: "DavidDBA" }
								] as p}
									<button
										type="button"
										onclick={() => { profileAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`; saveUserProfile(); }}
										class="h-6 w-6 rounded-full overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-primary transition-all cursor-pointer shadow-2xs"
										title="Select preset avatar {p.name}"
									>
										<img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`} alt={p.name} class="w-full h-full object-cover" />
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Profile Metadata Form -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
					<!-- Full Name -->
					<div class="space-y-1.5">
						<label for="profileNameInput" class="font-semibold text-foreground block">Full Legal / Operational Name:</label>
						<input
							id="profileNameInput"
							type="text"
							bind:value={profileName}
							class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
						/>
					</div>

					<!-- Email Address -->
					<div class="space-y-1.5">
						<label for="profileEmailInput" class="font-semibold text-foreground block">Corporate Email Address:</label>
						<input
							id="profileEmailInput"
							type="email"
							bind:value={profileEmail}
							class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
						/>
					</div>

					<!-- Operational Role -->
					<div class="space-y-1.5">
						<label for="profileRoleInput" class="font-semibold text-foreground block">Designation / Role Title:</label>
						<input
							id="profileRoleInput"
							type="text"
							bind:value={profileRole}
							class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
						/>
					</div>

					<!-- Branch Coverage -->
					<div class="space-y-1.5">
						<label for="profileBranchInput" class="font-semibold text-foreground block">Assigned Operational Branch / Hub:</label>
						<input
							id="profileBranchInput"
							type="text"
							bind:value={profileBranch}
							class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
						/>
					</div>

					<!-- Direct Phone / WhatsApp Hotline -->
					<div class="space-y-1.5">
						<label for="profilePhoneInput" class="font-semibold text-foreground block">Direct Phone / WhatsApp Hotline:</label>
						<input
							id="profilePhoneInput"
							type="text"
							bind:value={profilePhone}
							class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
						/>
					</div>

					<!-- On-Call Shift Roster -->
					<div class="space-y-1.5">
						<label for="profileShiftInput" class="font-semibold text-foreground block">On-Call Shift &amp; Working Hours:</label>
						<input
							id="profileShiftInput"
							type="text"
							bind:value={profileShift}
							class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
						/>
					</div>

					<!-- Timezone -->
					<div class="space-y-1.5">
						<label for="profileTimezoneInput" class="font-semibold text-foreground block">Operational Timezone:</label>
						<select
							id="profileTimezoneInput"
							bind:value={profileTimezone}
							class="w-full h-10 px-3 rounded-xl border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
						>
							<option value="Asia/Jakarta (WIB, UTC+7)">Asia/Jakarta (WIB, UTC+7) — Western Indonesia</option>
							<option value="Asia/Makassar (WITA, UTC+8)">Asia/Makassar (WITA, UTC+8) — Central Indonesia</option>
							<option value="Asia/Jayapura (WIT, UTC+9)">Asia/Jayapura (WIT, UTC+9) — Eastern Indonesia</option>
							<option value="UTC">UTC (Universal Coordinated Time)</option>
						</select>
					</div>

					<!-- Security Clearance Level -->
					<div class="space-y-1.5">
						<div class="font-semibold text-foreground block">ERP Mutation Security Clearance:</div>
						<div class="h-10 px-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center justify-between">
							<span class="flex items-center gap-2">
								<ShieldCheck class="h-4 w-4 text-emerald-500" />
								<span>Level 3 (Full ERP Read/Write)</span>
							</span>
							<span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 uppercase font-bold">Authorized</span>
						</div>
					</div>
				</div>

				<!-- Bio & Notes -->
				<div class="space-y-1.5 text-xs">
					<label for="profileBioInput" class="font-semibold text-foreground block">Bio &amp; Incident Commander Responsibilities:</label>
					<textarea
						id="profileBioInput"
						bind:value={profileBio}
						rows="3"
						class="w-full p-3 rounded-xl border border-input bg-background text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary shadow-xs resize-y"
					></textarea>
				</div>

				<!-- Security Toggle -->
				<div class="pt-2 border-t border-border/60">
					<label class="p-4 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={profile2FA}
							class="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
						/>
						<div class="space-y-0.5">
							<div class="font-bold text-foreground">Require Explicit On-Call Confirmation for High-Value Mutations</div>
							<p class="text-[11px] text-muted-foreground">Prompts for security confirmation modal whenever approving invoice corrections exceeding nominal thresholds.</p>
						</div>
					</label>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 0.1: BACKEND STORAGE & S3 CLOUD OBJECT STORAGE ARCHITECTURE -->
	{#if activeTab === "storage"}
		<div class="space-y-6 animate-in fade-in duration-150">
			<!-- Active Storage Architecture Selector -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-3">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shadow-xs border border-sky-500/20">
							<Folder class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-base font-bold text-foreground">Storage Architecture &amp; Repository Hierarchy</h3>
							<p class="text-xs text-muted-foreground">Default structured internal filesystem storage with optional AWS S3 / MinIO cloud integration.</p>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={fetchStorageConfig}
							disabled={storageLoading}
							class="h-8.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
						>
							<ArrowPath class="h-3.5 w-3.5 {storageLoading ? 'animate-spin' : ''}" />
							<span>Refresh Stats</span>
						</button>
						<button
							type="button"
							onclick={saveStorageConfig}
							class="h-8.5 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
						>
							{#if storageSaveSuccess}
								<Check class="h-3.5 w-3.5" />
								<span>Saved!</span>
							{:else}
								<span>Apply Changes</span>
							{/if}
						</button>
					</div>
				</div>

				<!-- Storage Backend Selection Radio Cards -->
				<div class="space-y-2">
					<span class="text-xs font-bold text-foreground block">Active Storage Backend:</span>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- Internal Filesystem Card -->
						<label class="p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 {storageActiveBackend === 'internal' ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40' : 'border-border bg-card hover:bg-secondary/30'}">
							<input
								type="radio"
								name="storageBackend"
								value="internal"
								bind:group={storageActiveBackend}
								class="mt-1 h-4 w-4 text-primary focus:ring-primary cursor-pointer"
							/>
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2">
									<Server class="h-4 w-4 text-primary shrink-0" />
									<span class="text-sm font-bold text-foreground">Internal Backend Storage (Default)</span>
									<span class="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
										Active &amp; Ready
									</span>
								</div>
								<p class="text-xs text-muted-foreground">
									Zero-dependency high performance storage utilizing structured local disk directories under <code class="font-mono text-foreground font-bold">uploads/</code>.
								</p>
							</div>
						</label>

						<!-- S3 Object Storage Card -->
						<label class="p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 {storageActiveBackend === 's3' ? 'border-sky-500 bg-sky-500/5 shadow-xs ring-1 ring-sky-500/40' : 'border-border bg-card hover:bg-secondary/30'}">
							<input
								type="radio"
								name="storageBackend"
								value="s3"
								bind:group={storageActiveBackend}
								class="mt-1 h-4 w-4 text-sky-500 focus:ring-sky-500 cursor-pointer"
							/>
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2">
									<Cloud class="h-4 w-4 text-sky-500 shrink-0" />
									<span class="text-sm font-bold text-foreground">S3 / MinIO Cloud Object Storage</span>
									<span class="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
										Optional
									</span>
								</div>
								<p class="text-xs text-muted-foreground">
									Offload avatars and large documents to AWS S3, MinIO, or Ceph object storage with presigned URLs and immutable storage policies.
								</p>
							</div>
						</label>
					</div>
				</div>
			</div>

			<!-- Section: Internal Structured Directory Architecture -->
			<div class="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-3">
					<div>
						<h4 class="text-sm font-bold text-foreground flex items-center gap-2">
							<Folder class="h-4 w-4 text-primary" />
							<span>Structured Local Directory Hierarchy</span>
						</h4>
						<p class="text-xs text-muted-foreground mt-0.5">
							Separated directory partitions ensuring file hygiene, access isolation, and zero file naming collisions.
						</p>
					</div>

					<div class="flex items-center gap-2 font-mono text-xs">
						<span class="px-2.5 py-1 rounded-xl bg-secondary border border-border text-foreground font-semibold">
							Total Files: <strong class="text-primary">{storageTotalFiles}</strong>
						</span>
						<span class="px-2.5 py-1 rounded-xl bg-secondary border border-border text-foreground font-semibold">
							Disk Usage: <strong class="text-primary">{storageTotalMB}</strong>
						</span>
					</div>
				</div>

				<!-- Directory Table -->
				<div class="overflow-x-auto rounded-2xl border border-border/70 bg-card">
					<table class="w-full text-left text-xs">
						<thead class="bg-secondary/40 text-muted-foreground font-mono font-semibold border-b border-border/60">
							<tr>
								<th class="py-2.5 px-4">Partition / Category</th>
								<th class="py-2.5 px-4">Filesystem Path</th>
								<th class="py-2.5 px-4">Files</th>
								<th class="py-2.5 px-4">Size</th>
								<th class="py-2.5 px-4">Purpose / Content</th>
								<th class="py-2.5 px-4">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/40 font-mono">
							{#each storageCategories as cat}
								<tr class="hover:bg-secondary/20 transition-colors">
									<td class="py-3 px-4 font-bold text-foreground">
										📁 {cat.category}
									</td>
									<td class="py-3 px-4 text-muted-foreground">
										<code>{cat.path}</code>
									</td>
									<td class="py-3 px-4 font-bold text-foreground">
										{cat.file_count}
									</td>
									<td class="py-3 px-4 text-primary font-bold">
										{cat.size_mb}
									</td>
									<td class="py-3 px-4 font-sans text-muted-foreground text-[11px]">
										{cat.description}
									</td>
									<td class="py-3 px-4">
										<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
											Read/Write OK
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Test Internal Storage Button -->
				<div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<span class="text-[11px] text-muted-foreground">
						Files are statically served via backend Go HTTP engine at <code class="font-mono text-foreground font-bold">/uploads/*</code>.
					</span>

					<button
						type="button"
						onclick={testInternalStorage}
						disabled={storageTesting}
						class="h-8.5 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
					>
						{#if storageTesting}
							<ArrowPath class="h-3.5 w-3.5 animate-spin" />
							<span>Verifying...</span>
						{:else}
							<Check class="h-3.5 w-3.5 text-emerald-500" />
							<span>Verify Filesystem Health</span>
						{/if}
					</button>
				</div>

				{#if storageTestResult}
					<div class="p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in {storageTestResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-destructive/10 border border-destructive/30 text-destructive'}">
						<div class="flex items-center gap-2">
							<Check class="h-4 w-4 shrink-0" />
							<span>{storageTestResult.message}</span>
						</div>
						<span class="font-mono text-[10px] font-bold">{storageTestResult.latency}ms</span>
					</div>
				{/if}
			</div>

			<!-- Section: S3 Cloud Object Storage Settings (Only shown if S3 backend is active) -->
			{#if storageActiveBackend === "s3"}
				<div class="p-6 rounded-3xl border border-sky-500/40 bg-card shadow-xs space-y-5 animate-in fade-in duration-150">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-3">
						<div class="flex items-center gap-3">
							<div class="h-9 w-9 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shadow-xs border border-sky-500/20">
								<Cloud class="h-5 w-5" />
							</div>
							<div>
								<h4 class="text-sm font-bold text-foreground">S3 / MinIO Cloud Object Storage Gateway</h4>
								<p class="text-xs text-muted-foreground">Configure AWS S3 or private MinIO credentials for cloud asset replication.</p>
							</div>
						</div>

						<label class="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
							<input
								type="checkbox"
								bind:checked={s3Enabled}
								class="h-4 w-4 rounded border-input text-sky-500 focus:ring-sky-500 cursor-pointer"
							/>
							<span>Enable S3 Storage Engine</span>
						</label>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
						<!-- Endpoint -->
						<div class="space-y-1.5">
							<label for="s3EndpointInput" class="font-semibold text-foreground block">S3 Endpoint URL / Host:</label>
							<input
								id="s3EndpointInput"
								type="text"
								bind:value={s3Endpoint}
								placeholder="s3.ap-southeast-1.amazonaws.com or localhost:9000"
								class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
							/>
						</div>

						<!-- Region -->
						<div class="space-y-1.5">
							<label for="s3RegionInput" class="font-semibold text-foreground block">S3 Region:</label>
							<input
								id="s3RegionInput"
								type="text"
								bind:value={s3Region}
								placeholder="ap-southeast-1"
								class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
							/>
						</div>

						<!-- Bucket Name -->
						<div class="space-y-1.5">
							<label for="s3BucketInput" class="font-semibold text-foreground block">Bucket Name:</label>
							<input
								id="s3BucketInput"
								type="text"
								bind:value={s3Bucket}
								placeholder="novapilot-vault"
								class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
							/>
						</div>

						<!-- Access Key -->
						<div class="space-y-1.5">
							<label for="s3AccessKeyInput" class="font-semibold text-foreground block">Access Key ID:</label>
							<input
								id="s3AccessKeyInput"
								type="text"
								bind:value={s3AccessKey}
								placeholder="AKIA..."
								class="w-full h-10 px-3.5 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
							/>
						</div>

						<!-- Secret Key -->
						<div class="space-y-1.5 md:col-span-2">
							<label for="s3SecretKeyInput" class="font-semibold text-foreground block">Secret Access Key:</label>
							<div class="relative">
								<input
									id="s3SecretKeyInput"
									type={showS3SecretKey ? "text" : "password"}
									bind:value={s3SecretKey}
									class="w-full h-10 pl-3.5 pr-10 rounded-xl border border-input bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
								/>
								<button
									type="button"
									onclick={() => showS3SecretKey = !showS3SecretKey}
									class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
								>
									{#if showS3SecretKey}
										<EyeSlash class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>
					</div>

					<!-- Advanced S3 Options -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
						<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={s3PathStyle}
								class="mt-0.5 h-4 w-4 rounded border-input text-sky-500 focus:ring-sky-500 cursor-pointer"
							/>
							<div class="space-y-0.5">
								<div class="font-bold text-foreground">Enable Path-Style URL Format</div>
								<p class="text-[11px] text-muted-foreground">Required for on-prem MinIO, Ceph, and LocalStack instances.</p>
							</div>
						</label>

						<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={s3UseSSL}
								class="mt-0.5 h-4 w-4 rounded border-input text-sky-500 focus:ring-sky-500 cursor-pointer"
							/>
							<div class="space-y-0.5">
								<div class="font-bold text-foreground">Enforce HTTPS / SSL Encryption</div>
								<p class="text-[11px] text-muted-foreground">Secures all object transmissions with TLS v1.3 encryption.</p>
							</div>
						</label>
					</div>

					<!-- Action Buttons for S3 -->
					<div class="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
						<button
							type="button"
							onclick={testS3Connection}
							disabled={s3Testing}
							class="h-8.5 px-4 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
						>
							{#if s3Testing}
								<ArrowPath class="h-3.5 w-3.5 animate-spin" />
								<span>Connecting...</span>
							{:else}
								<Cloud class="h-3.5 w-3.5" />
								<span>Test S3 Handshake</span>
							{/if}
						</button>

						<button
							type="button"
							onclick={saveStorageConfig}
							class="h-8.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
						>
							<Check class="h-3.5 w-3.5" />
							<span>Save S3 Configuration</span>
						</button>
					</div>

					{#if s3TestResult}
						<div class="p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in {s3TestResult.success ? 'bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300' : 'bg-destructive/10 border border-destructive/30 text-destructive'}">
							<div class="flex items-center gap-2">
								<Cloud class="h-4 w-4 shrink-0" />
								<span>{s3TestResult.message}</span>
							</div>
							<span class="font-mono text-[10px] font-bold">{s3TestResult.latency}ms</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

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
							<h3 class="text-sm font-bold text-foreground">{i18n.t.settings.threshold_title}</h3>
							<p class="text-xs text-muted-foreground">{i18n.t.settings.threshold_desc}</p>
						</div>
					</div>
					<span class="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
						{formatCurrency(Number(highValueThreshold || 0))}
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
							<div class="font-bold text-foreground">{i18n.t.settings.supervisor_override}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.supervisor_override_desc}</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={blockClosedInvoices}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">{i18n.t.settings.block_closed}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.block_closed_desc}</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={mandatoryAuditReason}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">{i18n.t.settings.mandatory_audit_reason}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.mandatory_audit_reason_desc}</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={autoApproveLowRisk}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">{i18n.t.settings.auto_approve_low_risk}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.auto_approve_low_risk_desc}</div>
						</div>
					</label>
				</div>

				<!-- Rate Limiter Slider -->
				<div class="pt-4 border-t border-border/60 space-y-2">
					<div class="flex items-center justify-between text-xs">
						<span class="font-semibold text-foreground">{i18n.t.settings.rate_limit}:</span>
						<span class="font-mono font-bold text-primary">{rateLimitPerBranch} req/min</span>
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
						{i18n.t.settings.rate_limit_desc}
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
					<h3 class="text-sm font-bold text-foreground">{i18n.t.settings.ai_engine_title}</h3>
					<p class="text-xs text-muted-foreground">{i18n.t.settings.ai_engine_desc}</p>
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
								<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-primary/20 text-primary">RECOMMENDED</span>
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
						<label for="ai-api-key" class="font-semibold text-foreground">{i18n.t.settings.api_key}:</label>
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
						<label for="ai-endpoint" class="font-semibold text-foreground">{i18n.t.settings.api_endpoint}:</label>
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
					{i18n.t.settings.ai_engine_title}
				</h3>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
					<!-- Temperature -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-foreground">{i18n.t.settings.temperature}:</span>
							<span class="font-mono font-bold text-primary">{aiTemperature}</span>
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
							<span class="font-semibold text-foreground">{i18n.t.settings.confidence_threshold}:</span>
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
							<div class="font-bold text-foreground">{i18n.t.settings.injection_defense}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.injection_defense_desc}</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={strictJsonSchema}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">{i18n.t.settings.strict_json}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.strict_json_desc}</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={ragGroundingEnabled}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">{i18n.t.settings.rag_grounding}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.rag_grounding_desc}</div>
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
							<h3 class="text-sm font-bold text-foreground">{i18n.t.settings.chatops_title}</h3>
							<p class="text-xs text-muted-foreground">{i18n.t.settings.chatops_desc}</p>
						</div>
					</div>
					<span class="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
						PORT :3002
					</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
					<div class="space-y-1">
						<label for="wa-gateway-url" class="font-semibold text-foreground">{i18n.t.settings.wa_gateway_url}:</label>
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
							<span class="font-bold text-foreground">{i18n.t.settings.auto_reply}</span>
						</label>

						<label class="flex items-center gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={autoOcrEnabled}
								class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
							/>
							<span class="font-bold text-foreground">{i18n.t.settings.auto_ocr}</span>
						</label>
					</div>
				</div>

				<!-- Template Auto-Reply -->
				{#if autoReplyEnabled}
					<div class="space-y-1.5 text-xs pt-2">
						<label for="auto-reply-tpl" class="font-semibold text-foreground">{i18n.t.settings.auto_reply_template}:</label>
						<textarea
							id="auto-reply-tpl"
							bind:value={autoReplyTemplate}
							rows={3}
							class="w-full p-3 rounded-xl border border-input bg-secondary/30 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						></textarea>
						<p class="text-[11px] text-muted-foreground">
							Variabel: <code class="font-mono text-primary font-bold">{'{sender_name}'}</code>, <code class="font-mono text-primary font-bold">{'{ticket_no}'}</code>, <code class="font-mono text-primary font-bold">{'{doc_no}'}</code>.
						</p>
					</div>
				{/if}

				<!-- Whitelist & Blacklist -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60 text-xs">
					<div class="space-y-1">
						<label for="wa-whitelist" class="font-semibold text-foreground">{i18n.t.settings.whitelisted_groups}:</label>
						<textarea
							id="wa-whitelist"
							bind:value={whitelistedGroups}
							rows={3}
							class="w-full p-3 rounded-xl border border-input bg-secondary/30 font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						></textarea>
						<p class="text-[11px] text-muted-foreground">Hanya grup di atas yang pesannya akan diekstraksi ke antrean staging.</p>
					</div>

					<div class="space-y-1">
						<label for="wa-blacklist" class="font-semibold text-foreground">{i18n.t.settings.blacklisted_jids}:</label>
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
					<h3 class="text-sm font-bold text-foreground">Telegram, Discord &amp; Slack Gateways</h3>
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
							<span>{i18n.t.settings.test_webhook}</span>
						{/if}
					</button>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
					<div class="space-y-1">
						<label for="tg-bot-token" class="font-semibold text-foreground">{i18n.t.settings.telegram_token}:</label>
						<input
							id="tg-bot-token"
							type="password"
							bind:value={telegramBotToken}
							placeholder="123456789:ABCDefGhiJklMnoPqrStuVwxYz"
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					<div class="space-y-1">
						<label for="tg-chat-id" class="font-semibold text-foreground">{i18n.t.settings.telegram_chat_id}:</label>
						<input
							id="tg-chat-id"
							type="text"
							bind:value={telegramChatId}
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					<div class="space-y-1">
						<label for="dc-webhook" class="font-semibold text-foreground">{i18n.t.settings.discord_webhook}:</label>
						<input
							id="dc-webhook"
							type="text"
							bind:value={discordWebhook}
							placeholder="https://discord.com/api/webhooks/..."
							class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					<div class="space-y-1">
						<label for="sl-webhook" class="font-semibold text-foreground">{i18n.t.settings.slack_webhook}:</label>
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
							<h3 class="text-sm font-bold text-foreground">{i18n.t.settings.db_title}</h3>
							<p class="text-xs text-muted-foreground">{i18n.t.settings.db_desc}</p>
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
							<span>{i18n.t.settings.test_db_conn}</span>
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
						<label for="db1-host" class="font-semibold text-muted-foreground">{i18n.t.settings.pg_host}:</label>
						<input id="db1-host" type="text" bind:value={pgHost} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
					<div class="space-y-1">
						<label for="db1-port" class="font-semibold text-muted-foreground">{i18n.t.settings.pg_port}:</label>
						<input id="db1-port" type="text" bind:value={pgPort} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
					<div class="space-y-1">
						<label for="db1-db" class="font-semibold text-muted-foreground">{i18n.t.settings.pg_db}:</label>
						<input id="db1-db" type="text" bind:value={pgDB} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
					<div class="space-y-1">
						<label for="db1-user" class="font-semibold text-muted-foreground">{i18n.t.settings.pg_user}:</label>
						<input id="db1-user" type="text" bind:value={pgUser} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
					<div class="space-y-1">
						<label for="db1-pass" class="font-semibold text-muted-foreground">{i18n.t.settings.pg_password}:</label>
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
						<label for="db1-max-conn" class="font-semibold text-muted-foreground">{i18n.t.settings.pg_max_conns}:</label>
						<input id="db1-max-conn" type="number" bind:value={pgMaxConns} class="w-full h-10 px-3 rounded-xl border border-input bg-secondary/30 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
					</div>

					<div class="space-y-1">
						<label for="db1-idle-conn" class="font-semibold text-muted-foreground">{i18n.t.settings.pg_idle_conns}:</label>
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
						<label for="erp-type" class="font-semibold text-foreground">{i18n.t.settings.target_erp}:</label>
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
						<label for="mcp-endpoint" class="font-semibold text-foreground">{i18n.t.settings.mcp_endpoint}:</label>
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
								{i18n.t.settings.safe_dry_run}
								<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">ACTIVE</span>
							</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">
								{i18n.t.settings.safe_dry_run_desc}
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
							<h3 class="text-sm font-bold text-foreground">{i18n.t.settings.alerts_title}</h3>
							<p class="text-xs text-muted-foreground">{i18n.t.settings.alerts_desc}</p>
						</div>
					</div>

					<div class="flex items-center gap-1.5 flex-wrap">
						<button
							type="button"
							onclick={playTestSound}
							class="h-8 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
							title="Uji Lonceng Pesan Masuk"
						>
							<SpeakerWave class="h-3.5 w-3.5 text-purple-500" />
							<span>{i18n.t.settings.test_sound}</span>
						</button>
						<button
							type="button"
							onclick={playTestActionChime}
							class="h-8 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
							title="Uji Akord Aksi / Persetujuan"
						>
							<Sparkles class="h-3.5 w-3.5 text-amber-500" />
							<span>{i18n.t.settings.test_action_chime}</span>
						</button>
						<button
							type="button"
							onclick={playTestAlertChime}
							class="h-8 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
							title="Uji Sinyal Peringatan"
						>
							<ExclamationTriangle class="h-3.5 w-3.5 text-rose-500" />
							<span>{i18n.t.settings.test_alert_chime}</span>
						</button>
						<button
							type="button"
							onclick={playTestNavClick}
							class="h-8 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
							title="Uji Haptic Micro-Tap"
						>
							<CursorArrowRays class="h-3.5 w-3.5 text-primary" />
							<span>{i18n.t.settings.test_nav_click}</span>
						</button>
					</div>
				</div>

				<!-- SOUND THEME SELECTOR CARDS -->
				<div class="space-y-3 pt-2">
					<div>
						<div class="text-xs font-bold text-foreground flex items-center gap-2">
							<Sparkles class="h-4 w-4 text-purple-500" />
							<span>{i18n.t.settings.sound_theme}</span>
						</div>
						<p class="text-[11px] text-muted-foreground mt-0.5">
							{i18n.t.settings.sound_theme_desc}
						</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each SOUND_THEMES as themeItem}
							<button
								type="button"
								onclick={() => selectSoundTheme(themeItem.id)}
								class="p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between {soundTheme === themeItem.id ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40' : 'border-border/70 bg-secondary/20 hover:bg-secondary/50'}"
							>
								<div class="flex items-start justify-between gap-2">
									<div>
										<div class="flex items-center gap-2">
											<span class="text-xs font-bold text-foreground">{themeItem.name}</span>
											<span class="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md bg-secondary text-foreground/80 border border-border/60">
												{themeItem.badge}
											</span>
										</div>
										<p class="text-[11px] text-muted-foreground mt-1 line-clamp-2">
											{themeItem.description}
										</p>
									</div>
									{#if soundTheme === themeItem.id}
										<div class="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
											<Check class="h-3.5 w-3.5 stroke-2" />
										</div>
									{/if}
								</div>

								<div class="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
									<span class="font-mono">Profil: {themeItem.brand}</span>
									<span class="text-primary font-semibold flex items-center gap-1">
										<SpeakerWave class="h-3 w-3" />
										Pilih &amp; Dengarkan
									</span>
								</div>
							</button>
						{/each}
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pt-2 border-t border-border/60">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={soundAlerts}
							onchange={() => { sound.enabled = soundAlerts; }}
							class="h-4 w-4 rounded border-input text-primary focus:ring-primary shrink-0 cursor-pointer"
						/>
						<div>
							<div class="font-bold text-foreground">{i18n.t.settings.sound_alerts}</div>
							<div class="text-[11px] text-muted-foreground">{i18n.t.settings.sound_alerts_desc}</div>
						</div>
					</label>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-foreground">{i18n.t.settings.sound_volume}:</span>
							<span class="font-mono font-bold text-purple-500">{soundVolume}%</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							step="5"
							bind:value={soundVolume}
							oninput={() => { sound.volume = soundVolume / 100; }}
							disabled={!soundAlerts}
							class="w-full h-2 rounded-lg bg-secondary appearance-none cursor-pointer accent-purple-500 disabled:opacity-40"
						/>
					</div>
				</div>

				<!-- Navigation Click Sound Toggle Row -->
				<div class="pt-4 border-t border-border/60 text-xs">
					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={navSoundEnabled}
							onchange={() => { sound.navEnabled = navSoundEnabled; }}
							disabled={!soundAlerts}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0 cursor-pointer disabled:opacity-40"
						/>
						<div>
							<div class="font-bold text-foreground flex items-center gap-2">
								<CursorArrowRays class="h-4 w-4 text-primary" />
								<span>{i18n.t.settings.nav_sound}</span>
							</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">
								{i18n.t.settings.nav_sound_desc}
							</div>
						</div>
					</label>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60 text-xs">
					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={browserPushAlerts}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">{i18n.t.settings.push_alerts}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.push_alerts_desc}</div>
						</div>
					</label>

					<label class="p-3.5 rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 transition-all flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={highValueAlertEscalation}
							class="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
						/>
						<div>
							<div class="font-bold text-foreground">{i18n.t.settings.escalation}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.escalation_desc}</div>
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
					<h3 class="text-sm font-bold text-foreground">{i18n.t.settings.ui_title}</h3>
					<p class="text-xs text-muted-foreground">{i18n.t.settings.ui_desc}</p>
				</div>

				<!-- GLOBAL UI MODE SELECTION (PRO MODE VS COMPACT LITE) -->
				<div class="space-y-3 pb-5 border-b border-border/60">
					<div>
						<div class="text-xs font-bold text-foreground flex items-center gap-2">
							<Sparkles class="h-4 w-4 text-primary" />
							<span>{i18n.t.settings.ui_mode_title}</span>
						</div>
						<p class="text-[11px] text-muted-foreground mt-0.5">
							{i18n.t.settings.ui_desc}
						</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<!-- PRO MODE CARD -->
						<button
							type="button"
							onclick={() => {
								cockpit.setUiMode("pro");
								sound.playActionChime();
							}}
							class="p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between {cockpit.uiMode === 'pro' ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40' : 'border-border/70 bg-secondary/20 hover:bg-secondary/50'}"
						>
							<div class="flex items-start justify-between gap-2">
								<div>
									<div class="flex items-center gap-2">
										<span class="text-xs font-bold text-foreground">{i18n.t.settings.ui_mode_pro}</span>
										<span class="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md bg-secondary text-foreground/80 border border-border/60">
											DEFAULT
										</span>
									</div>
									<p class="text-[11px] text-muted-foreground mt-1">
										{i18n.t.settings.ui_mode_pro_desc}
									</p>
								</div>
								{#if cockpit.uiMode === 'pro'}
									<div class="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
										<Check class="h-3.5 w-3.5 stroke-2" />
									</div>
								{/if}
							</div>

							<div class="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
								<span class="font-mono">Circuit visualizers &amp; rich telemetry</span>
								<span class="text-primary font-semibold flex items-center gap-1">
									<Sparkles class="h-3 w-3" />
									Full Experience
								</span>
							</div>
						</button>

						<!-- COMPACT LITE MODE CARD -->
						<button
							type="button"
							onclick={() => {
								cockpit.setUiMode("compact_lite");
								sound.playActionChime();
							}}
							class="p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between {cockpit.uiMode === 'compact_lite' ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40' : 'border-border/70 bg-secondary/20 hover:bg-secondary/50'}"
						>
							<div class="flex items-start justify-between gap-2">
								<div>
									<div class="flex items-center gap-2">
										<span class="text-xs font-bold text-foreground">{i18n.t.settings.ui_mode_compact_lite}</span>
										<span class="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
											FAST &amp; MINIMAL
										</span>
									</div>
									<p class="text-[11px] text-muted-foreground mt-1">
										{i18n.t.settings.ui_mode_compact_lite_desc}
									</p>
								</div>
								{#if cockpit.uiMode === 'compact_lite'}
									<div class="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
										<Check class="h-3.5 w-3.5 stroke-2" />
									</div>
								{/if}
							</div>

							<div class="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
								<span class="font-mono">Tight padding &amp; condensed tables</span>
								<span class="text-amber-500 font-semibold flex items-center gap-1">
									<Bolt class="h-3 w-3" />
									Ultra Fast
								</span>
							</div>
						</button>
					</div>
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
							<div class="font-bold text-foreground">{i18n.t.settings.compact_table}</div>
							<div class="text-[11px] text-muted-foreground mt-0.5">{i18n.t.settings.compact_table_desc}</div>
						</div>
					</label>

					<!-- Telemetry Refresh Rate -->
					<div class="p-4 rounded-2xl border border-border/70 bg-secondary/20 space-y-2">
						<div class="font-bold text-foreground">{i18n.t.settings.telemetry_rate}:</div>
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
						<div class="font-bold text-foreground">{i18n.t.settings.session_lock}:</div>
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
						<div class="font-bold text-foreground">{i18n.t.settings.export_format}:</div>
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
