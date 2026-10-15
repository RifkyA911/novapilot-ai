// NovaPilot Internationalization (i18n) Engine
// Svelte 5 Rune-based reactive translation store with zero runtime dependencies.

export type Locale = "id" | "en";

export interface Translations {
	nav: {
		operations: string;
		overview: string;
		cockpit: string;
		queue: string;
		history: string;
		inbound: string;
		agents: string;
		hooks: string;
		contacts: string;
		databases: string;
		connectors: string;
		mcp: string;
		telemetry: string;
		logs: string;
		settings: string;
		flows: string;
	};
	actions: {
		approve: string;
		reject: string;
		stage: string;
		save: string;
		cancel: string;
		refresh: string;
		search: string;
		filter: string;
		export: string;
		test_connection: string;
		apply: string;
		run_inference: string;
		copy: string;
		copied: string;
		view_details: string;
		close: string;
	};
	status: {
		pending: string;
		approved: string;
		rejected: string;
		executed: string;
		failed: string;
		online: string;
		offline: string;
		connected: string;
		disconnected: string;
		healthy: string;
	};
	agents: {
		hub_title: string;
		hub_subtitle: string;
		hermes_title: string;
		hermes_badge: string;
		openclaw_title: string;
		openclaw_badge: string;
		reasoning_contract: string;
		reasoning_thought: string;
		tool_arguments: string;
		stage_ticket: string;
		prompt_label: string;
		prompt_placeholder: string;
		branch_context: string;
		presets_label: string;
		gateway_service: string;
		browser_driver: string;
		safety_gate: string;
		task_capacity: string;
		task_registry: string;
		task_instruction: string;
		dispatch_to_openclaw: string;
		stage_to_approval: string;
	};
	common: {
		loading: string;
		no_data: string;
		all: string;
		records: string;
		page: string;
		of: string;
		rows_per_page: string;
		language: string;
		theme: string;
		sound: string;
	};
}

const dictionaries: Record<Locale, Translations> = {
	id: {
		nav: {
			operations: "Operasional",
			overview: "Ringkasan Operasi",
			cockpit: "Cockpit Overview",
			queue: "Antrean Persetujuan",
			history: "Riwayat Eksekusi",
			inbound: "Pesan Masuk",
			agents: "AI Agents",
			hooks: "Client Hook Flows",
			contacts: "Kontak Saluran",
			databases: "Database & Telemetri",
			connectors: "Konektor DB",
			mcp: "Pengetahuan MCP",
			telemetry: "Telemetri Sistem",
			logs: "Log Sistem",
			settings: "Pengaturan",
			flows: "Platform Flows"
		},
		actions: {
			approve: "Setujui",
			reject: "Tolak",
			stage: "Stage ke Antrean",
			save: "Simpan Konfigurasi",
			cancel: "Batal",
			refresh: "Muat Ulang",
			search: "Cari data...",
			filter: "Filter",
			export: "Ekspor CSV",
			test_connection: "Uji Koneksi",
			apply: "Terapkan",
			run_inference: "Jalankan Inferensi",
			copy: "Salin",
			copied: "Tersalin",
			view_details: "Lihat Rincian",
			close: "Tutup"
		},
		status: {
			pending: "Menunggu Persetujuan",
			approved: "Disetujui",
			rejected: "Ditolak",
			executed: "Tereksekusi",
			failed: "Gagal",
			online: "ONLINE",
			offline: "OFFLINE",
			connected: "Terhubung",
			disconnected: "Terputus",
			healthy: "Optimal"
		},
		agents: {
			hub_title: "AI Agents Hub",
			hub_subtitle: "Manajemen integrasi model penalaran Hermes 3 (Cognitive Extraction) dan agen otonom OpenClaw (Browser Automation).",
			hermes_title: "Hermes 3 Reasoning Agent",
			hermes_badge: "8B LLM BRAIN",
			openclaw_title: "OpenClaw Autonomous Agent",
			openclaw_badge: "BROWSER & CHANNELS",
			reasoning_contract: "Kontrak Penalaran",
			reasoning_thought: "Penalaran Kognitif (<thought>):",
			tool_arguments: "Ekstraksi Parameter Terstruktur (<tool_call>):",
			stage_ticket: "Stage ke Antrean Approval (PostgreSQL)",
			prompt_label: "Pesan / Perintah Chat:",
			prompt_placeholder: "Ketik instruksi chat WhatsApp/Telegram...",
			branch_context: "Konteks Cabang Regional:",
			presets_label: "Preset Skenario Percakapan:",
			gateway_service: "Gateway Service",
			browser_driver: "Browser Driver",
			safety_gate: "Supervisor Gate",
			task_capacity: "Kapasitas Worker",
			task_registry: "Daftar Tugas Otonom (Task Registry)",
			task_instruction: "Instruksi Tugas (Prompt Eksekusi):",
			dispatch_to_openclaw: "Kirim ke OpenClaw",
			stage_to_approval: "Stage ke Approval"
		},
		common: {
			loading: "Memuat...",
			no_data: "Tidak ada data yang tersedia",
			all: "Semua",
			records: "data",
			page: "Halaman",
			of: "dari",
			rows_per_page: "Baris per halaman:",
			language: "Bahasa",
			theme: "Tema",
			sound: "Efek Suara"
		}
	},
	en: {
		nav: {
			operations: "Operations",
			overview: "Operations Overview",
			cockpit: "Cockpit Overview",
			queue: "Approval Queue",
			history: "Execution History",
			inbound: "Inbound Messages",
			agents: "AI Agents",
			hooks: "Client Hook Flows",
			contacts: "Channel Contacts",
			databases: "Databases & Telemetry",
			connectors: "DB Connectors",
			mcp: "MCP Knowledge",
			telemetry: "System Telemetry",
			logs: "System Logs",
			settings: "Settings",
			flows: "Platform Flows"
		},
		actions: {
			approve: "Approve",
			reject: "Reject",
			stage: "Stage to Queue",
			save: "Save Configuration",
			cancel: "Cancel",
			refresh: "Refresh",
			search: "Search data...",
			filter: "Filter",
			export: "Export CSV",
			test_connection: "Test Connection",
			apply: "Apply",
			run_inference: "Run Inference",
			copy: "Copy",
			copied: "Copied",
			view_details: "View Details",
			close: "Close"
		},
		status: {
			pending: "Pending Approval",
			approved: "Approved",
			rejected: "Rejected",
			executed: "Executed",
			failed: "Failed",
			online: "ONLINE",
			offline: "OFFLINE",
			connected: "Connected",
			disconnected: "Disconnected",
			healthy: "Healthy"
		},
		agents: {
			hub_title: "AI Agents Hub",
			hub_subtitle: "Fleet integration of Hermes 3 reasoning model (Cognitive Extraction) and OpenClaw autonomous agent (Browser Automation).",
			hermes_title: "Hermes 3 Reasoning Agent",
			hermes_badge: "8B LLM BRAIN",
			openclaw_title: "OpenClaw Autonomous Agent",
			openclaw_badge: "BROWSER & CHANNELS",
			reasoning_contract: "Reasoning Contract",
			reasoning_thought: "Cognitive Reasoning (<thought>):",
			tool_arguments: "Structured Parameter Extraction (<tool_call>):",
			stage_ticket: "Stage to Approval Queue (PostgreSQL)",
			prompt_label: "Chat Message / Instruction:",
			prompt_placeholder: "Type WhatsApp/Telegram instructions...",
			branch_context: "Regional Branch Context:",
			presets_label: "Conversation Scenario Presets:",
			gateway_service: "Gateway Service",
			browser_driver: "Browser Driver",
			safety_gate: "Supervisor Gate",
			task_capacity: "Worker Capacity",
			task_registry: "Autonomous Task Registry",
			task_instruction: "Task Instruction (Execution Prompt):",
			dispatch_to_openclaw: "Dispatch to OpenClaw",
			stage_to_approval: "Stage to Approval"
		},
		common: {
			loading: "Loading...",
			no_data: "No data available",
			all: "All",
			records: "records",
			page: "Page",
			of: "of",
			rows_per_page: "Rows per page:",
			language: "Language",
			theme: "Theme",
			sound: "Sound Effects"
		}
	}
};

class I18nState {
	current = $state<Locale>("id");

	constructor() {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("novapilot_locale") as Locale | null;
			if (saved && (saved === "id" || saved === "en")) {
				this.current = saved;
			} else {
				// Default to Indonesian if browser language contains "id", otherwise English
				const browserLang = navigator.language.toLowerCase();
				this.current = browserLang.startsWith("id") ? "id" : "en";
			}
		}
	}

	setLocale(locale: Locale) {
		this.current = locale;
		if (typeof window !== "undefined") {
			localStorage.setItem("novapilot_locale", locale);
			document.documentElement.lang = locale;
		}
	}

	toggleLocale() {
		this.setLocale(this.current === "id" ? "en" : "id");
	}

	// Reactive dictionary getter
	get t(): Translations {
		return dictionaries[this.current] || dictionaries.id;
	}

	// Helper for nested path lookups: tKey("nav.cockpit")
	tKey(path: string): string {
		const parts = path.split(".");
		let cur: any = dictionaries[this.current];
		for (const part of parts) {
			if (cur && typeof cur === "object" && part in cur) {
				cur = cur[part];
			} else {
				return path;
			}
		}
		return typeof cur === "string" ? cur : path;
	}
}

export const i18n = new I18nState();
