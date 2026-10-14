<script lang="ts">
	import { onMount } from "svelte";
	import { 
		ServerStack, 
		CircleStack, 
		CheckCircle, 
		XCircle, 
		ArrowPath, 
		ShieldCheck, 
		LockClosed, 
		Check, 
		InformationCircle, 
		XMark, 
		Eye,
		EyeSlash,
		ClipboardDocument,
		TableCells,
		CommandLine,
		ArrowTopRightOnSquare
	} from "svelte-heros-v2";

	// Database Connection Form States
	let sysConfig = $state({
		host: "localhost",
		port: "5432",
		user: "postgres",
		password: "",
		dbname: "novapilot_db",
		sslmode: "disable"
	});

	let mcpConfig = $state({
		host: "localhost",
		port: "1521",
		user: "erp_agent",
		password: "",
		dbname: "ERP_PROD_PDB",
		sslmode: "require"
	});

	// Platform & Connection Mode for MCP Reference DB
	let mcpPlatform = $state<"oracle" | "sap" | "postgres" | "mysql" | "mssql" | "custom_rest">("oracle");
	let mcpMode = $state<"local" | "ssl" | "ssh">("ssl");

	// SSH Bastion Tunnel Configuration for MCP
	let mcpSshConfig = $state({
		bastionHost: "bastion.corp.internal",
		bastionPort: "22",
		user: "novapilot-bastion",
		authType: "key" as "key" | "password",
		privateKey: "",
		passphrase: ""
	});

	// SSL/TLS Details for MCP
	let mcpSslCaCert = $state("");

	// Statuses from backend GET /api/database/config
	// Note: Default for MCP reference is DISCONNECTED when not verified
	let sysStatus = $state("CHECKING...");
	let mcpStatus = $state("DISCONNECTED");
	let isLoadingConfig = $state(false);

	// Telemetry & Pool Stats
	interface TelemetryData {
		service: string;
		status: string;
		lan_ip: string;
		uptime_seconds: number;
		memory_alloc_mb: string;
		goroutines: number;
		database: {
			driver: string;
			status: string;
			open_connections: number;
			in_use: number;
			idle: number;
			max_open: number;
			wait_count: number;
		};
	}
	let telemetry = $state<TelemetryData | null>(null);

	// Test Connection States
	let isTestingSys = $state(false);
	let isTestingMcp = $state(false);
	let sysTestResult = $state<{ ok: boolean; message: string; latency_ms?: number; time: string } | null>(null);
	let mcpTestResult = $state<{ ok: boolean; message: string; latency_ms?: number; time: string } | null>(null);

	// Password Visibility Toggles
	let showSysPass = $state(false);
	let showMcpPass = $state(false);
	let showSshPass = $state(false);

	// Active tab: system | mcp | mcp_tools | env
	let activeTab = $state<"system" | "mcp" | "mcp_tools" | "env">("system");
	let copiedEnv = $state(false);

	// Animated SVG Connectors Simulation States
	let isSimulatingDb1 = $state(false);
	let isSimulatingDb2 = $state(false);

	function triggerDb1Burst() {
		isSimulatingDb1 = true;
		setTimeout(() => { isSimulatingDb1 = false; }, 1800);
	}

	function triggerDb2Burst() {
		isSimulatingDb2 = true;
		setTimeout(() => { isSimulatingDb2 = false; }, 1800);
	}

	// =========================================================================
	// INTERACTIVE PAN & ZOOM CONTROLS FOR SVG
	// =========================================================================
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		const target = e.target as HTMLElement | SVGElement;
		if (target.closest("button") || target.closest("a") || target.closest(".no-pan")) return;
		isDragging = true;
		dragStartX = e.clientX - panX;
		dragStartY = e.clientY - panY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		panX = e.clientX - dragStartX;
		panY = e.clientY - dragStartY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
		const nextZoom = Math.min(Math.max(zoom + zoomDelta, 0.5), 2.5);
		zoom = Number(nextZoom.toFixed(2));
	}

	function zoomIn() {
		zoom = Math.min(Number((zoom + 0.15).toFixed(2)), 2.5);
	}

	function zoomOut() {
		zoom = Math.max(Number((zoom - 0.15).toFixed(2)), 0.5);
	}

	function resetPanZoom() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}

	// Visual State Derivations for DB 1 and DB 2
	const db1VisualState = $derived<"PROCESSING" | "CONNECTED" | "DISCONNECTED">(
		isTestingSys || isSimulatingDb1 ? "PROCESSING" : (sysStatus === "CONNECTED" ? "CONNECTED" : "DISCONNECTED")
	);

	const db2VisualState = $derived<"PROCESSING" | "CONNECTED" | "DISCONNECTED">(
		isTestingMcp || isSimulatingDb2 ? "PROCESSING" : (mcpStatus === "CONNECTED" ? "CONNECTED" : "DISCONNECTED")
	);

	// Quick toggle helpers for testing animation states
	function toggleMockStatusDb1() {
		sysStatus = sysStatus === "CONNECTED" ? "DISCONNECTED" : "CONNECTED";
	}

	function toggleMockStatusDb2() {
		mcpStatus = mcpStatus === "CONNECTED" ? "DISCONNECTED" : "CONNECTED";
	}

	// Dynamic port switching based on database platform
	function handlePlatformChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value as typeof mcpPlatform;
		mcpPlatform = val;
		if (val === "oracle") {
			mcpConfig.port = "1521";
			mcpConfig.dbname = "ERP_PROD_PDB";
			mcpConfig.user = "erp_agent";
		} else if (val === "sap") {
			mcpConfig.port = "3300";
			mcpConfig.dbname = "S4HANA_PRD";
			mcpConfig.user = "bapi_rfc_user";
		} else if (val === "mysql") {
			mcpConfig.port = "3306";
			mcpConfig.dbname = "enterprise_db";
			mcpConfig.user = "app_reader";
		} else if (val === "mssql") {
			mcpConfig.port = "1433";
			mcpConfig.dbname = "MasterInvoiceStore";
			mcpConfig.user = "sa_novapilot";
		} else if (val === "postgres") {
			mcpConfig.port = "5432";
			mcpConfig.dbname = "enterprise_dw";
			mcpConfig.user = "postgres";
		} else if (val === "custom_rest") {
			mcpConfig.port = "8000";
			mcpConfig.dbname = "mcp_gateway";
			mcpConfig.user = "api_client";
		}
	}

	// =========================================================================
	// MCP TOOL CATALOG & MANIFEST UPLOAD STATE & METHODS
	// =========================================================================
	interface MCPToolItem {
		id: string;
		name: string;
		description: string;
		version: string;
		category: string;
		inputSchema: {
			type?: string;
			properties?: Record<string, { type: string; description?: string }>;
			required?: string[];
		};
		transport: string;
		status: string;
		created_at: string;
	}

	let mcpTools = $state<MCPToolItem[]>([]);
	let isLoadingMcpTools = $state(false);
	let uploadManifestText = $state("");
	let uploadError = $state<string | null>(null);
	let uploadSuccess = $state<string | null>(null);
	let isUploadingTool = $state(false);

	// Interactive Testing Sandbox (Dry-Run Tool Modal)
	let activeToolForTest = $state<MCPToolItem | null>(null);
	let testParamsInput = $state<Record<string, any>>({});
	let isExecutingToolTest = $state(false);
	let toolTestExecutionResult = $state<{
		ok: boolean;
		tool_name?: string;
		latency_ms?: number;
		protocol?: string;
		result?: any;
		error?: string;
		timestamp: string;
	} | null>(null);

	// Default Presets for Easy Manifest Upload
	const presets = {
		oracle_invoicing: {
			name: "mutate_invoice_record",
			version: "1.4.0",
			category: "ERP_MUTATION",
			description: "Memperbarui nama pelanggan dan status faktur pada Oracle 19c Enterprise via parameterized query tanpa raw SQL.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					invoice_no: { type: "string", description: "Nomor faktur/nota resmi misal INV/2026/001" },
					target_client: { type: "string", description: "Nama badan usaha pelanggan resmi baru" },
					revised_amount: { type: "number", description: "Nominal revisi jika terdapat penyesuaian pajak" },
					operator_note: { type: "string", description: "Catatan pengesahan dari petugas on-call" }
				},
				required: ["invoice_no", "target_client"]
			}
		},
		sap_bapi_customer: {
			name: "query_customer_master_bapi",
			version: "2.1.0",
			category: "SAP_RFC_CONNECTOR",
			description: "Kueri read-only data master nama legal PT/CV dan nomor registrasi pajak dari SAP S/4HANA BAPI Gateway.",
			transport: "sse / http-rpc",
			inputSchema: {
				type: "object",
				properties: {
					customer_code: { type: "string", description: "Kode pelanggan SAP misal CUST-8820" },
					tax_id: { type: "string", description: "Nomor NPWP 15/16 digit" },
					company_code: { type: "string", description: "Company code unit bisnis SAP (default 1000)" }
				},
				required: ["customer_code"]
			}
		},
		tax_compliance_djp: {
			name: "verify_tax_registration",
			version: "1.1.0",
			category: "TAX_COMPLIANCE",
			description: "Validasi status registrasi NPWP dan validitas faktur pajak terhadap database referensi enterprise atau portal DJP.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					tax_id: { type: "string", description: "15/16 digit format NPWP" },
					invoice_serial: { type: "string", description: "Nomor seri faktur pajak (NSFP)" }
				},
				required: ["tax_id"]
			}
		},
		warehouse_stock_sync: {
			name: "sync_branch_stock",
			version: "1.0.0",
			category: "INVENTORY_SYNC",
			description: "Sinkronisasi saldo stok barang dan bukti surat jalan antara database pabrik cabang dan pusat.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					branch_code: { type: "string", description: "Kode cabang pabrik (misal SBY-01, MDN-01)" },
					sku: { type: "string", description: "Stock Keeping Unit kode produk" },
					delta_quantity: { type: "number", description: "Perubahan jumlah barang" }
				},
				required: ["branch_code", "sku"]
			}
		}
	};

	function loadPresetManifest(key: keyof typeof presets) {
		const preset = presets[key];
		uploadManifestText = JSON.stringify(preset, null, 2);
		uploadError = null;
		uploadSuccess = null;
	}

	async function fetchMCPTools() {
		isLoadingMcpTools = true;
		try {
			const res = await fetch("/api/mcp/tools");
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data.tools)) {
					mcpTools = data.tools;
				}
			}
		} catch (e) {
			console.error("Gagal mengambil daftar MCP tools:", e);
		} finally {
			isLoadingMcpTools = false;
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			uploadManifestText = text;
			uploadError = null;
			uploadSuccess = null;
		};
		reader.onerror = () => {
			uploadError = "Gagal membaca berkas manifest dari disk.";
		};
		reader.readAsText(file);
	}

	async function registerUploadedMCPTool() {
		uploadError = null;
		uploadSuccess = null;

		if (!uploadManifestText.trim()) {
			uploadError = "Mohon isi atau pilih berkas manifest MCP terlebih dahulu.";
			return;
		}

		let parsed: any;
		try {
			parsed = JSON.parse(uploadManifestText);
		} catch (err: any) {
			uploadError = `Format JSON tidak valid: ${err.message}. Pastikan sintaks JSON sesuai standar schema MCP.`;
			return;
		}

		if (!parsed.name) {
			uploadError = "Manifest wajib memiliki atribut 'name' sebagai pengenal tool.";
			return;
		}

		isUploadingTool = true;
		try {
			const res = await fetch("/api/mcp/tools", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(parsed)
			});

			const data = await res.json();
			if (res.ok && data.ok) {
				uploadSuccess = `Tool '${parsed.name}' versi ${parsed.version || '1.0.0'} berhasil diregistrasikan ke NovaPilot Protocol Catalog!`;
				uploadManifestText = "";
				await fetchMCPTools();
			} else {
				uploadError = data.error || "Gagal meregistrasikan tool ke server MCP.";
			}
		} catch (err: any) {
			uploadError = `Network error: ${err.message}`;
		} finally {
			isUploadingTool = false;
		}
	}

	function openToolTestModal(tool: MCPToolItem) {
		activeToolForTest = tool;
		toolTestExecutionResult = null;
		
		const initialParams: Record<string, any> = {};
		if (tool.inputSchema?.properties) {
			for (const [propKey, propVal] of Object.entries(tool.inputSchema.properties)) {
				if (propVal.type === "number") {
					initialParams[propKey] = 1250000;
				} else if (propVal.type === "integer") {
					initialParams[propKey] = 10;
				} else if (propVal.type === "boolean") {
					initialParams[propKey] = true;
				} else {
					if (propKey.includes("invoice") || propKey.includes("nota")) {
						initialParams[propKey] = "INV/2026/001";
					} else if (propKey.includes("client") || propKey.includes("name") || propKey.includes("customer")) {
						initialParams[propKey] = "PT Sumber Makmur Sentosa";
					} else if (propKey.includes("tax")) {
						initialParams[propKey] = "01.234.567.8-901.000";
					} else if (propKey.includes("branch")) {
						initialParams[propKey] = "SBY-01";
					} else {
						initialParams[propKey] = "sample_value";
					}
				}
			}
		}
		testParamsInput = initialParams;
	}

	async function executeToolTest() {
		if (!activeToolForTest) return;
		isExecutingToolTest = true;
		toolTestExecutionResult = null;

		try {
			const res = await fetch("/api/mcp/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					tool_name: activeToolForTest.name,
					parameters: testParamsInput
				})
			});

			const data = await res.json();
			if (res.ok && data.ok) {
				toolTestExecutionResult = {
					ok: true,
					tool_name: data.tool_name,
					latency_ms: data.latency_ms,
					protocol: data.protocol,
					result: data.result,
					timestamp: new Date().toLocaleTimeString("id-ID")
				};
			} else {
				toolTestExecutionResult = {
					ok: false,
					error: data.error || "Eksekusi tool gagal.",
					timestamp: new Date().toLocaleTimeString("id-ID")
				};
			}
		} catch (err: any) {
			toolTestExecutionResult = {
				ok: false,
				error: `Network error: ${err.message}`,
				timestamp: new Date().toLocaleTimeString("id-ID")
			};
		} finally {
			isExecutingToolTest = false;
		}
	}

	// =========================================================================
	// TABLES & CONFIG LOGIC
	// =========================================================================
	const systemTables = [
		{ name: "tickets", count: "~12 baris", desc: "Antrean Human-in-the-Loop, mutasi usulan nota, status lifecycle approval" },
		{ name: "audit_logs", count: "~50 baris", desc: "Log audit digital immutable, HMAC digest, IP operator, timestamp RFC3339" },
		{ name: "inbound_messages", count: "~85 baris", desc: "Feed pesan masuk omnichannel (WhatsApp, Telegram, Discord)" },
		{ name: "learned_patterns", count: "~6 baris", desc: "Koleksi regex dynamic dan klasifikasi intent dari loop self-learning" },
		{ name: "documents", count: "~18 baris", desc: "Metadata file lampiran foto bukti nota, invoice PDF, dan ringkasan OCR" }
	];

	const mcpReferenceTables = [
		{ name: "invoices", desc: "Faktur operasional, nomor nota, nama pelanggan, nominal, status OPEN/CLOSED" },
		{ name: "customer_master", desc: "Master nama PT/CV/Toko pelanggan resmi terdaftar dalam enterprise" },
		{ name: "branches", desc: "Daftar cabang resmi pabrik/gudang dan nomor kontak whitelist" }
	];

	async function fetchConfigAndTelemetry() {
		isLoadingConfig = true;
		try {
			const [cfgRes, telRes] = await Promise.all([
				fetch("/api/database/config"),
				fetch("/api/telemetry")
			]);

			if (cfgRes.ok) {
				const cfg = await cfgRes.json();
				if (cfg.system_db) {
					sysConfig.host = cfg.system_db.host || "localhost";
					sysConfig.port = cfg.system_db.port || "5432";
					sysConfig.user = cfg.system_db.user || "postgres";
					sysConfig.dbname = cfg.system_db.dbname || "novapilot_db";
					sysConfig.sslmode = cfg.system_db.sslmode || "disable";
					sysStatus = cfg.system_db.status || "DISCONNECTED";
				}
				if (cfg.mcp_ref_db) {
					mcpConfig.host = cfg.mcp_ref_db.host || "localhost";
					mcpConfig.port = cfg.mcp_ref_db.port || "1521";
					mcpConfig.user = cfg.mcp_ref_db.user || "erp_agent";
					mcpConfig.dbname = cfg.mcp_ref_db.dbname || "ERP_PROD_PDB";
					mcpConfig.sslmode = cfg.mcp_ref_db.sslmode || "disable";
					mcpStatus = cfg.mcp_ref_db.status || "DISCONNECTED";
				}
			}

			if (telRes.ok) {
				telemetry = await telRes.json();
			}
		} catch (err) {
			console.error("Gagal memuat konfigurasi database:", err);
			sysStatus = "DISCONNECTED";
			mcpStatus = "DISCONNECTED";
		} finally {
			isLoadingConfig = false;
		}
	}

	async function testSystemConnection() {
		isTestingSys = true;
		sysTestResult = null;
		try {
			const res = await fetch("/api/database/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					target: "system",
					platform: "postgres",
					host: sysConfig.host,
					port: sysConfig.port,
					user: sysConfig.user,
					password: sysConfig.password,
					dbname: sysConfig.dbname,
					sslmode: sysConfig.sslmode
				})
			});

			const data = await res.json();
			if (data.ok) {
				sysTestResult = {
					ok: true,
					latency_ms: data.latency_ms,
					message: data.message || "Koneksi database sistem berhasil diverifikasi!",
					time: new Date().toLocaleTimeString("id-ID")
				};
				sysStatus = "CONNECTED";
			} else {
				sysTestResult = {
					ok: false,
					message: data.error || "Gagal menghubungi database sistem.",
					time: new Date().toLocaleTimeString("id-ID")
				};
				sysStatus = "DISCONNECTED";
			}
		} catch (err: any) {
			sysTestResult = {
				ok: false,
				message: `Network error: ${err.message}`,
				time: new Date().toLocaleTimeString("id-ID")
			};
			sysStatus = "DISCONNECTED";
		} finally {
			isTestingSys = false;
		}
	}

	async function testMCPReferenceConnection() {
		isTestingMcp = true;
		mcpTestResult = null;
		try {
			const payload: Record<string, any> = {
				target: "mcp_ref",
				platform: mcpPlatform,
				mode: mcpMode,
				host: mcpConfig.host,
				port: mcpConfig.port,
				user: mcpConfig.user,
				password: mcpConfig.password,
				dbname: mcpConfig.dbname,
				sslmode: mcpConfig.sslmode
			};

			if (mcpMode === "ssh") {
				payload.ssh_bastion_host = mcpSshConfig.bastionHost;
				payload.ssh_bastion_port = mcpSshConfig.bastionPort;
				payload.ssh_bastion_user = mcpSshConfig.user;
			}

			const res = await fetch("/api/database/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});

			const data = await res.json();
			if (data.ok) {
				mcpTestResult = {
					ok: true,
					latency_ms: data.latency_ms,
					message: data.message || `Koneksi database referensi ${mcpPlatform.toUpperCase()} via mode ${mcpMode.toUpperCase()} berhasil diverifikasi!`,
					time: new Date().toLocaleTimeString("id-ID")
				};
				mcpStatus = "CONNECTED";
			} else {
				mcpTestResult = {
					ok: false,
					message: data.error || "Gagal menghubungi database referensi MCP.",
					time: new Date().toLocaleTimeString("id-ID")
				};
				mcpStatus = "DISCONNECTED";
			}
		} catch (err: any) {
			mcpTestResult = {
				ok: false,
				message: `Network error: ${err.message}`,
				time: new Date().toLocaleTimeString("id-ID")
			};
			mcpStatus = "DISCONNECTED";
		} finally {
			isTestingMcp = false;
		}
	}

	function generateEnvSnippet() {
		let snippet = `# ============================================================
# 1. DATABASE INTERNAL SISTEM (Wajib PostgreSQL - Locked Engine)
# ============================================================
SYSTEM_DB_ENGINE=postgresql
SYSTEM_DB_HOST=${sysConfig.host}
SYSTEM_DB_PORT=${sysConfig.port}
SYSTEM_DB_USER=${sysConfig.user}
SYSTEM_DB_PASSWORD=${sysConfig.password ? sysConfig.password : "postgres"}
SYSTEM_DB_NAME=${sysConfig.dbname}
SYSTEM_DB_SSLMODE=${sysConfig.sslmode}

# Backward Compatibility
POSTGRES_HOST=${sysConfig.host}
POSTGRES_PORT=${sysConfig.port}
POSTGRES_USER=${sysConfig.user}
POSTGRES_PASSWORD=${sysConfig.password ? sysConfig.password : "postgres"}
POSTGRES_DB=${sysConfig.dbname}
POSTGRES_SSLMODE=${sysConfig.sslmode}

# ============================================================
# 2. DATABASE REFERENSI MCP (Data Faktur & Master Pelanggan ERP)
# ============================================================
MCP_REF_DB_PLATFORM=${mcpPlatform}
MCP_REF_DB_MODE=${mcpMode}
MCP_REF_DB_HOST=${mcpConfig.host}
MCP_REF_DB_PORT=${mcpConfig.port}
MCP_REF_DB_USER=${mcpConfig.user}
MCP_REF_DB_PASSWORD=${mcpConfig.password ? mcpConfig.password : "secret_password"}
MCP_REF_DB_NAME=${mcpConfig.dbname}
MCP_REF_DB_SSLMODE=${mcpConfig.sslmode}
MCP_REF_DB_TIMEOUT_MS=5000`;

		if (mcpMode === "ssh") {
			snippet += `\n
# Parameter SSH Tunnel Bastion Host (DMZ Jump Host)
MCP_REF_SSH_BASTION_HOST=${mcpSshConfig.bastionHost}
MCP_REF_SSH_BASTION_PORT=${mcpSshConfig.bastionPort}
MCP_REF_SSH_USER=${mcpSshConfig.user}
MCP_REF_SSH_AUTH_TYPE=${mcpSshConfig.authType}
MCP_REF_SSH_KEY_PATH=/etc/novapilot/keys/id_rsa`;
		}

		return snippet;
	}

	function copyEnvSnippet() {
		navigator.clipboard.writeText(generateEnvSnippet());
		copiedEnv = true;
		setTimeout(() => { copiedEnv = false; }, 2500);
	}

	onMount(() => {
		fetchConfigAndTelemetry();
		fetchMCPTools();
	});
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
					<CircleStack class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						Konfigurasi & Setup Database &amp; MCP
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Pengaturan terisolasi untuk <strong>Database Internal Sistem</strong> (PostgreSQL Locked), <strong>Database Referensi MCP</strong> (Multi-Platform SSL/SSH), dan <strong>Katalog Tool MCP</strong>.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => { fetchConfigAndTelemetry(); fetchMCPTools(); }}
				disabled={isLoadingConfig}
				class="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="h-3.5 w-3.5 {isLoadingConfig ? 'animate-spin' : ''}" />
				<span>{isLoadingConfig ? 'Memuat Ulang...' : 'Muat Ulang Status'}</span>
			</button>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- REDESIGNED ANIMATED SVG DUAL-DB ARCHITECTURE (PAN, ZOOM, & 3 VISUAL STATES)-->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 overflow-hidden relative">
		<!-- Header Toolbar: Clean Tiered Architecture (Anti-Collision Layout) -->
		<div class="space-y-3 pb-3 border-b border-border/60">
			<!-- Tier 1: Title, Badges, & Architecture Purpose -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
				<div class="flex items-center gap-2.5">
					<div class="h-8.5 w-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
						<CircleStack class="h-4.5 w-4.5" />
					</div>
					<div>
						<div class="flex items-center gap-2 flex-wrap">
							<h3 class="text-sm font-bold text-foreground tracking-tight">
								Diagram Aliran Konektor Dual-DB
							</h3>
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-primary/15 text-primary border border-primary/30">
								LIVE ARCHITECTURE
							</span>
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-secondary text-muted-foreground border border-border">
								PAN &amp; ZOOMABLE
							</span>
						</div>
						<p class="text-xs text-muted-foreground mt-0.5">
							Visualisasi aliran data real-time, throughput socket, dan proteksi mutasi enterprise.
						</p>
					</div>
				</div>

				<!-- Visual Canvas Hints -->
				<div class="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-lg border border-border/50 shrink-0">
					<span>🖐️ Drag geser</span>
					<span class="text-border">•</span>
					<span>Scroll zoom ({Math.round(zoom * 100)}%)</span>
				</div>
			</div>

			<!-- Tier 2: Dedicated Control & Simulation Toolbar Strip -->
			<div class="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-secondary/35 dark:bg-muted/20 border border-border/70">
				<!-- Simulation Action Buttons -->
				<div class="flex items-center gap-2 flex-wrap text-xs font-mono">
					<span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1 hidden sm:inline">
						Simulasi I/O:
					</span>

					<!-- DB 1 Button -->
					<button
						type="button"
						onclick={triggerDb1Burst}
						disabled={isSimulatingDb1}
						class="h-7.5 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
						title="Memicu efek transmisi PROCESSING pada DB 1 (PostgreSQL Core)"
					>
						<span class="h-2 w-2 rounded-full {db1VisualState === 'CONNECTED' ? 'bg-emerald-500' : db1VisualState === 'PROCESSING' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'}"></span>
						<span>DB 1: Core</span>
						<span class="text-[10px] px-1 py-0.2 rounded font-bold {db1VisualState === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : db1VisualState === 'PROCESSING' ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'}">
							{db1VisualState}
						</span>
					</button>

					<!-- DB 2 Button -->
					<button
						type="button"
						onclick={triggerDb2Burst}
						disabled={isSimulatingDb2}
						class="h-7.5 px-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
						title="Memicu efek transmisi PROCESSING pada DB 2 (MCP Reference Store)"
					>
						<span class="h-2 w-2 rounded-full {db2VisualState === 'CONNECTED' ? 'bg-cyan-500' : db2VisualState === 'PROCESSING' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'}"></span>
						<span>DB 2: MCP Ref</span>
						<span class="text-[10px] px-1 py-0.2 rounded font-bold {db2VisualState === 'CONNECTED' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300' : db2VisualState === 'PROCESSING' ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'}">
							{db2VisualState}
						</span>
					</button>

					<!-- Toggle DB 2 Link State Button -->
					<button
						type="button"
						onclick={toggleMockStatusDb2}
						class="h-7.5 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
						title="Uji langsung switch status Link Online vs Offline pada DB 2"
					>
						{#if mcpStatus === 'CONNECTED'}
							<span class="h-2 w-2 rounded-full bg-rose-500"></span>
							<span>Putus Link DB 2</span>
						{:else}
							<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
							<span>Hubung Link DB 2</span>
						{/if}
					</button>
				</div>

				<!-- Quick Reset Pan & Zoom -->
				<div class="flex items-center gap-1.5 text-xs font-mono ml-auto">
					<button
						type="button"
						onclick={resetPanZoom}
						class="h-7.5 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors cursor-pointer"
						title="Reset kanvas ke ukuran normal (100%)"
					>
						Reset View ({Math.round(zoom * 100)}%)
					</button>
				</div>
			</div>
		</div>

		<!-- Status Legend Bar -->
		<div class="flex items-center justify-between text-xs px-1 text-muted-foreground flex-wrap gap-2 pt-0.5">
			<div class="flex items-center gap-3 text-[11px] font-mono flex-wrap">
				<span class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
					<span class="text-foreground font-medium">Connected:</span> Aliran data aktif &amp; platter beroperasi
				</span>
				<span class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
					<span class="text-foreground font-medium">Processing:</span> Strobo I/O &amp; laser scan cepat
				</span>
				<span class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-rose-500"></span>
					<span class="text-foreground font-medium">Disconnected:</span> Pipa putus (zero packet, platter unlit)
				</span>
			</div>
		</div>

		<!-- Interactive Pan & Zoom Canvas Viewport -->
		<div 
			role="region"
			aria-label="Interactive Dual-DB Connector Architecture Visualizer"
			class="relative w-full rounded-xl bg-secondary/25 dark:bg-black/70 border border-border/80 overflow-hidden select-none transition-colors {isDragging ? 'cursor-grabbing' : 'cursor-grab'} h-[390px]"
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
			onwheel={handleWheel}
		>
			<!-- Floating Pan & Zoom Controls Toolbar -->
			<div class="absolute top-3 right-3 z-20 flex items-center gap-1 p-1 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-md text-xs font-mono">
				<button 
					type="button"
					onclick={zoomIn} 
					class="h-7 w-7 rounded-lg hover:bg-muted text-foreground flex items-center justify-center font-bold text-sm cursor-pointer transition-colors" 
					title="Perbesar (Zoom In)"
				>
					+
				</button>
				<button 
					type="button"
					onclick={zoomOut} 
					class="h-7 w-7 rounded-lg hover:bg-muted text-foreground flex items-center justify-center font-bold text-sm cursor-pointer transition-colors" 
					title="Perkecil (Zoom Out)"
				>
					-
				</button>
				<button 
					type="button"
					onclick={resetPanZoom} 
					class="h-7 px-2 rounded-lg hover:bg-muted text-foreground flex items-center justify-center font-semibold text-[11px] cursor-pointer transition-colors" 
					title="Reset Zoom &amp; Posisi (100%)"
				>
					{Math.round(zoom * 100)}%
				</button>
			</div>

			<!-- Spacious Scaled Vector Canvas -->
			<svg
				viewBox="0 0 1260 380"
				class="w-full h-full"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<style>
						@keyframes wireDashFlow {
							from { stroke-dashoffset: 0; }
							to { stroke-dashoffset: -24; }
						}
						@keyframes wireDashFlowFast {
							from { stroke-dashoffset: 0; }
							to { stroke-dashoffset: -24; }
						}
						@keyframes wireDashReturn {
							from { stroke-dashoffset: 0; }
							to { stroke-dashoffset: 24; }
						}
						@keyframes diskLedFast {
							0%, 100% { opacity: 0.25; }
							50% { opacity: 1; }
						}
						@keyframes diskLedSlow {
							0%, 100% { opacity: 0.35; }
							50% { opacity: 1; }
						}
						@keyframes diskLedStrobe {
							0%, 100% { opacity: 0.15; }
							50% { opacity: 1; }
						}
						@keyframes diskBeamActive {
							0% { transform: translateY(0px); opacity: 0.3; }
							50% { transform: translateY(28px); opacity: 0.95; }
							100% { transform: translateY(0px); opacity: 0.3; }
						}
						@keyframes diskBeamFast {
							0% { transform: translateY(0px); opacity: 0.4; }
							50% { transform: translateY(28px); opacity: 1; }
							100% { transform: translateY(0px); opacity: 0.4; }
						}
						@keyframes socketPingRipple {
							0% { r: 4px; opacity: 1; stroke-width: 2px; }
							100% { r: 16px; opacity: 0; stroke-width: 0.5px; }
						}
						@keyframes socketPingFast {
							0% { r: 4px; opacity: 1; stroke-width: 2.5px; }
							100% { r: 20px; opacity: 0; stroke-width: 0.5px; }
						}
						.wire-flow-forward {
							stroke-dasharray: 6 4;
							animation: wireDashFlow 0.9s linear infinite;
						}
						.wire-flow-fast {
							stroke-dasharray: 6 4;
							animation: wireDashFlowFast 0.35s linear infinite;
						}
						.wire-flow-backward {
							stroke-dasharray: 6 4;
							animation: wireDashReturn 1.1s linear infinite;
						}
						.conn-led-fast {
							animation: diskLedFast 0.65s infinite;
						}
						.conn-led-slow {
							animation: diskLedSlow 1.3s infinite;
						}
						.conn-led-strobe {
							animation: diskLedStrobe 0.18s infinite;
						}
						.conn-socket-pulse {
							animation: socketPingRipple 1.6s ease-out infinite;
						}
						.conn-socket-pulse-fast {
							animation: socketPingFast 0.6s ease-out infinite;
						}
						.conn-beam {
							animation: diskBeamActive 1.8s ease-in-out infinite;
						}
						.conn-beam-fast {
							animation: diskBeamFast 0.65s ease-in-out infinite;
						}
						.active-box-glow {
							filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.6));
						}
						.active-box-glow-cyan {
							filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.6));
						}
					</style>

					<!-- Particle Glow Filter -->
					<filter id="dbConnGlow" x="-30%" y="-30%" width="160%" height="160%">
						<feGaussianBlur stdDeviation="3" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>

					<linearGradient id="connGradCoreToDB1" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#10b981" />
						<stop offset="100%" stop-color="#059669" />
					</linearGradient>

					<linearGradient id="connGradCoreToMCP" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#10b981" />
						<stop offset="100%" stop-color="#06b6d4" />
					</linearGradient>

					<linearGradient id="connGradMCPToDB2" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#06b6d4" />
						<stop offset="100%" stop-color="#2563eb" />
					</linearGradient>
				</defs>

				<!-- Outer Transformed Group for Pan & Zoom -->
				<g transform="translate({panX}, {panY}) scale({zoom})">

					<!-- ========================================================= -->
					<!-- 1. LEFT BOX: NOVAPILOT CORE ENGINE (:8088 GO)             -->
					<!-- ========================================================= -->
					<g transform="translate(30, 35)">
						<rect
							x="0" y="0" width="250" height="310" rx="18"
							fill="currentColor"
							class="text-card stroke-emerald-500/80 stroke-[2px]"
						/>
						<rect x="0" y="0" width="250" height="42" rx="18" fill="#10b981" fill-opacity="0.16" />
						<text x="14" y="27" font-family="system-ui" font-size="14" font-weight="bold" fill="currentColor" class="text-primary">🛡️ NovaPilot AI Core</text>
						<text x="180" y="27" font-family="monospace" font-size="11.5" fill="#10b981" font-weight="bold">:8088 Go</text>

						<!-- Module A: Connection Pooler -->
						<g transform="translate(10, 52)">
							<rect x="0" y="0" width="230" height="56" rx="10" fill="currentColor" class="text-secondary/60" />
							<text x="12" y="18" font-family="monospace" font-size="11.5" font-weight="bold" fill="currentColor" class="text-foreground">Connection Pooler</text>
							<text x="12" y="34" font-family="monospace" font-size="11" fill="#10b981" font-weight="bold">Pool: {telemetry?.database?.open_connections || 0} / 25 Conns</text>
							<text x="12" y="48" font-family="monospace" font-size="10" fill="currentColor" class="text-muted-foreground">Max Idle: 10 • Wait: {telemetry?.database?.wait_count || 0}</text>
						</g>

						<!-- Module B: Dual-Engine Router -->
						<g transform="translate(10, 118)">
							<rect x="0" y="0" width="230" height="56" rx="10" fill="currentColor" class="text-secondary/60" />
							<text x="12" y="18" font-family="monospace" font-size="11.5" font-weight="bold" fill="currentColor" class="text-foreground">Dual-Engine Router</text>
							<text x="12" y="34" font-family="monospace" font-size="10.5" fill="currentColor" class="text-foreground">Direct Internal vs MCP Isolation</text>
							<text x="12" y="48" font-family="monospace" font-size="10" fill="#06b6d4" font-weight="bold">Zero Raw SQL Policy Enforced</text>
						</g>

						<!-- Module C: Runtime Telemetry -->
						<g transform="translate(10, 184)">
							<rect x="0" y="0" width="230" height="56" rx="10" fill="currentColor" class="text-secondary/60" />
							<text x="12" y="18" font-family="monospace" font-size="11.5" font-weight="bold" fill="currentColor" class="text-foreground">Runtime Telemetry</text>
							<text x="12" y="34" font-family="monospace" font-size="10.5" fill="currentColor" class="text-muted-foreground">Goroutines: {telemetry?.goroutines || 14} • Mem: {telemetry?.memory_alloc_mb || '18.2'} MB</text>
							<text x="12" y="48" font-family="monospace" font-size="10" fill="#10b981">SSE Stream: /api/events</text>
						</g>

						<!-- Module D: Uptime Banner -->
						<g transform="translate(10, 250)">
							<rect x="0" y="0" width="230" height="48" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.3" stroke-width="1" />
							<circle cx="16" cy="24" r="3.5" fill="#10b981" class="conn-led-fast" />
							<text x="28" y="24" font-family="monospace" font-size="11" font-weight="bold" fill="#10b981">Uptime: {Math.floor((telemetry?.uptime_seconds || 0) / 60)} min</text>
							<text x="28" y="39" font-family="monospace" font-size="9.5" fill="currentColor" class="text-muted-foreground">Status: Core Engine Healthy</text>
						</g>
					</g>

					<!-- ========================================================= -->
					<!-- 2. UPPER PIPE: CORE -> DB 1 SYSTEM STORE                  -->
					<!-- ========================================================= -->
					{#if db1VisualState === "DISCONNECTED"}
						<!-- Disconnected Static Severed Pipe -->
						<path
							d="M 280 105 L 580 105"
							fill="none"
							stroke="#64748b"
							stroke-width="2"
							stroke-dasharray="6 6"
							stroke-opacity="0.45"
						/>
						<!-- Severed Indicator Badge -->
						<g transform="translate(430, 105)">
							<rect x="-65" y="-13" width="130" height="26" rx="6" fill="#0f172a" stroke="#ef4444" stroke-width="1.2" stroke-opacity="0.6" />
							<text x="0" y="4" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ef4444">✕ LINK SEVERED</text>
						</g>
						<!-- Static Inactive Socket -->
						<circle cx="580" cy="105" r="4.5" fill="#ef4444" />
					{:else if db1VisualState === "PROCESSING"}
						<!-- Processing Burst Pipe -->
						<path
							d="M 280 105 L 580 105"
							fill="none"
							stroke="#10b981"
							stroke-width="3.5"
							class="wire-flow-fast"
						/>
						<!-- Processing Badge on Wire -->
						<g transform="translate(430, 105)">
							<rect x="-70" y="-13" width="140" height="26" rx="6" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
							<text x="0" y="4" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#10b981">⚡ EXECUTING QUERY</text>
						</g>
						<!-- Fast Burst Packets -->
						<circle r="8" fill="#10b981" filter="url(#dbConnGlow)">
							<animateMotion dur="0.45s" repeatCount="indefinite" path="M 280 105 L 580 105" />
						</circle>
						<circle r="6" fill="#34d399" filter="url(#dbConnGlow)">
							<animateMotion dur="0.45s" begin="0.22s" repeatCount="indefinite" path="M 280 105 L 580 105" />
						</circle>
						<!-- Socket with Fast Pulse Ripple -->
						<circle cx="580" cy="105" r="5" fill="#10b981" />
						<circle cx="580" cy="105" r="6" fill="none" stroke="#10b981" class="conn-socket-pulse-fast" />
					{:else}
						<!-- Connected Active Pipe -->
						<path
							d="M 280 105 L 580 105"
							fill="none"
							stroke="url(#connGradCoreToDB1)"
							stroke-width="2.5"
							class="wire-flow-forward"
						/>
						<!-- Active Data Packets (Bidirectional) -->
						<circle r="4.5" fill="#10b981" filter="url(#dbConnGlow)">
							<animateMotion dur="1.6s" repeatCount="indefinite" path="M 280 105 L 580 105" />
						</circle>
						<circle r="3.5" fill="#34d399" filter="url(#dbConnGlow)">
							<animateMotion dur="2.2s" begin="0.8s" repeatCount="indefinite" path="M 580 105 L 280 105" />
						</circle>
						<!-- Socket with Normal Ripple -->
						<circle cx="580" cy="105" r="5" fill="#10b981" />
						<circle cx="580" cy="105" r="6" fill="none" stroke="#10b981" class="conn-socket-pulse" />
					{/if}

					<!-- ========================================================= -->
					<!-- 3. UPPER RIGHT: DB 1 (POSTGRESQL SYSTEM STORE - LOCKED)   -->
					<!-- ========================================================= -->
					<g transform="translate(580, 35)">
						<rect
							x="0" y="0" width="650" height="145" rx="18"
							fill="currentColor"
							class="text-card {db1VisualState === 'PROCESSING' ? 'stroke-emerald-400 stroke-[2.5px] active-box-glow' : db1VisualState === 'CONNECTED' ? 'stroke-emerald-600/90 stroke-[2px]' : 'stroke-rose-500/40 stroke-[1.5px]'}"
						/>
						<!-- Title Banner -->
						<rect 
							x="0" y="0" width="650" height="38" rx="18" 
							fill={db1VisualState === 'DISCONNECTED' ? '#ef4444' : '#10b981'} 
							fill-opacity={db1VisualState === 'DISCONNECTED' ? '0.08' : db1VisualState === 'PROCESSING' ? '0.24' : '0.16'} 
						/>
						<text x="16" y="25" font-family="system-ui" font-size="13.5" font-weight="bold" fill={db1VisualState === 'DISCONNECTED' ? '#ef4444' : '#059669'}>
							🗄️ Database Internal Sistem (PostgreSQL 14–18 Core - Locked)
						</text>
						
						<!-- Status Indicator Badge -->
						{#if db1VisualState === 'PROCESSING'}
							<circle cx="530" cy="24" r="3.5" fill="#10b981" class="conn-led-strobe" />
							<text x="540" y="28" font-family="monospace" font-size="11.5" font-weight="bold" fill="#10b981">⚡ PROCESSING...</text>
						{:else if db1VisualState === 'CONNECTED'}
							<circle cx="530" cy="24" r="3.5" fill="#10b981" class="conn-led-fast" />
							<text x="540" y="28" font-family="monospace" font-size="11.5" font-weight="bold" fill="#10b981">● CONNECTED (LIVE)</text>
						{:else}
							<circle cx="510" cy="24" r="3.5" fill="#ef4444" />
							<text x="520" y="28" font-family="monospace" font-size="11.5" font-weight="bold" fill="#ef4444">● DISCONNECTED (OFFLINE)</text>
						{/if}

						<!-- Left Text Details Column -->
						<g transform="translate(18, 48)">
							<text x="0" y="16" font-family="monospace" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">
								Host: {sysConfig.host}:{sysConfig.port}/{sysConfig.dbname} (PostgreSQL Core Locked)
							</text>
							<text x="0" y="34" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">
								• Tabel: tickets, audit_logs (HMAC Signed), inbound_messages, learned_patterns
							</text>
							<text x="0" y="50" font-family="monospace" font-size="10.5" fill="#10b981" font-weight="bold">
								✓ Transactional ACID Staging Store • Atomic Rollback Guard
							</text>
							<!-- Realtime Health Notice -->
							<text x="0" y="66" font-family="monospace" font-size="10" fill={db1VisualState === 'DISCONNECTED' ? '#ef4444' : 'currentColor'} class={db1VisualState === 'DISCONNECTED' ? '' : 'text-muted-foreground'}>
								{#if db1VisualState === 'CONNECTED'}
									✓ Pool Conns: {telemetry?.database?.in_use || 0} in use, {telemetry?.database?.idle || 0} idle • Latensi Socket ~1.2ms
								{:else if db1VisualState === 'PROCESSING'}
									⚡ Sedang Memproses Kueri Staging Tiket &amp; Penandatanganan Log Audit...
								{:else}
									✕ Server Database Belum Terhubung • Pastikan PostgreSQL aktif pada port 5432
								{/if}
							</text>
						</g>

						<!-- Right Platter Disc Rack (DB 1) -->
						<g transform="translate(555, 46)">
							<!-- Scanner Laser Beam (Only active if not disconnected) -->
							{#if db1VisualState !== 'DISCONNECTED'}
								<line 
									x1="-10" y1="0" x2="38" y2="0" 
									stroke="#10b981" stroke-width="1.8" 
									class={db1VisualState === 'PROCESSING' ? 'conn-beam-fast' : 'conn-beam'} 
									filter="url(#dbConnGlow)" 
								/>
							{/if}
							
							<!-- Disk 1 (Top) -->
							<path 
								d="M 0 10 v 10 a 18 6.5 0 0 0 36 0 v -10" 
								fill={db1VisualState === 'DISCONNECTED' ? '#334155' : '#059669'} 
								fill-opacity={db1VisualState === 'DISCONNECTED' ? '0.4' : '0.55'} 
								stroke={db1VisualState === 'DISCONNECTED' ? '#475569' : '#10b981'} 
								stroke-width="1" 
							/>
							<ellipse 
								cx="18" cy="10" rx="18" ry="6.5" 
								fill={db1VisualState === 'DISCONNECTED' ? '#475569' : '#10b981'} 
								fill-opacity={db1VisualState === 'DISCONNECTED' ? '0.5' : '0.75'} 
								stroke={db1VisualState === 'DISCONNECTED' ? '#475569' : '#10b981'} 
								stroke-width="1.2" 
							/>
							
							<!-- Disk 2 (Middle) -->
							<path 
								d="M 0 24 v 10 a 18 6.5 0 0 0 36 0 v -10" 
								fill={db1VisualState === 'DISCONNECTED' ? '#1e293b' : '#047857'} 
								fill-opacity={db1VisualState === 'DISCONNECTED' ? '0.4' : '0.65'} 
								stroke={db1VisualState === 'DISCONNECTED' ? '#475569' : '#10b981'} 
								stroke-width="1" 
							/>
							<ellipse 
								cx="18" cy="24" rx="18" ry="6.5" 
								fill={db1VisualState === 'DISCONNECTED' ? '#334155' : '#059669'} 
								fill-opacity={db1VisualState === 'DISCONNECTED' ? '0.5' : '0.85'} 
								stroke={db1VisualState === 'DISCONNECTED' ? '#475569' : '#10b981'} 
								stroke-width="1.2" 
							/>

							<!-- LEDs Activity -->
							<circle cx="4" cy="46" r="3" fill={db1VisualState === 'DISCONNECTED' ? '#334155' : '#10b981'} class={db1VisualState === 'PROCESSING' ? 'conn-led-strobe' : db1VisualState === 'CONNECTED' ? 'conn-led-fast' : ''} />
							<text x="11" y="49" font-family="monospace" font-size="8.5" fill={db1VisualState === 'DISCONNECTED' ? '#64748b' : '#10b981'} font-weight="bold">RD</text>

							<circle cx="23" cy="46" r="3" fill={db1VisualState === 'DISCONNECTED' ? '#334155' : '#f59e0b'} class={db1VisualState === 'PROCESSING' ? 'conn-led-strobe' : db1VisualState === 'CONNECTED' ? 'conn-led-slow' : ''} />
							<text x="30" y="49" font-family="monospace" font-size="8.5" fill={db1VisualState === 'DISCONNECTED' ? '#64748b' : '#f59e0b'} font-weight="bold">WR</text>
						</g>
					</g>

					<!-- ========================================================= -->
					<!-- 4. LOWER PIPE: CORE -> MCP GATEWAY -> DB 2                -->
					<!-- ========================================================= -->
					{#if db2VisualState === "DISCONNECTED"}
						<!-- Disconnected Static Pipe to MCP -->
						<path
							d="M 280 265 L 375 265"
							fill="none"
							stroke="#64748b"
							stroke-width="2"
							stroke-dasharray="6 6"
							stroke-opacity="0.45"
						/>
						<g transform="translate(325, 265)">
							<rect x="-40" y="-12" width="80" height="24" rx="5" fill="#0f172a" stroke="#ef4444" stroke-width="1.2" stroke-opacity="0.6" />
							<text x="0" y="4" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ef4444">✕ OFFLINE</text>
						</g>
						<path
							d="M 525 265 L 580 265"
							fill="none"
							stroke="#64748b"
							stroke-width="2"
							stroke-dasharray="6 6"
							stroke-opacity="0.45"
						/>
						<circle cx="580" cy="265" r="4.5" fill="#ef4444" />
					{:else if db2VisualState === "PROCESSING"}
						<!-- Processing Burst Pipe -->
						<path
							d="M 280 265 L 375 265"
							fill="none"
							stroke="#06b6d4"
							stroke-width="3.5"
							class="wire-flow-fast"
						/>
						<path
							d="M 525 265 L 580 265"
							fill="none"
							stroke="#06b6d4"
							stroke-width="3.5"
							class="wire-flow-fast"
						/>
						<circle r="7.5" fill="#06b6d4" filter="url(#dbConnGlow)">
							<animateMotion dur="0.4s" repeatCount="indefinite" path="M 280 265 L 375 265" />
						</circle>
						<circle r="7.5" fill="#06b6d4" filter="url(#dbConnGlow)">
							<animateMotion dur="0.3s" repeatCount="indefinite" path="M 525 265 L 580 265" />
						</circle>
						<circle cx="580" cy="265" r="5" fill="#06b6d4" />
						<circle cx="580" cy="265" r="6" fill="none" stroke="#06b6d4" class="conn-socket-pulse-fast" />
					{:else}
						<!-- Connected Active Pipe -->
						<path
							d="M 280 265 L 375 265"
							fill="none"
							stroke="url(#connGradCoreToMCP)"
							stroke-width="2.5"
							class="wire-flow-forward"
						/>
						<path
							d="M 525 265 L 580 265"
							fill="none"
							stroke="url(#connGradMCPToDB2)"
							stroke-width="2.5"
							class="wire-flow-forward"
						/>
						<circle r="4.5" fill="#06b6d4" filter="url(#dbConnGlow)">
							<animateMotion dur="1.4s" repeatCount="indefinite" path="M 280 265 L 375 265" />
						</circle>
						<circle r="4" fill="#38bdf8" filter="url(#dbConnGlow)">
							<animateMotion dur="0.9s" begin="0.3s" repeatCount="indefinite" path="M 525 265 L 580 265" />
						</circle>
						<circle r="3.5" fill="#38bdf8" filter="url(#dbConnGlow)">
							<animateMotion dur="1.7s" begin="0.6s" repeatCount="indefinite" path="M 580 265 L 525 265" />
						</circle>
						<circle cx="580" cy="265" r="5" fill="#06b6d4" />
						<circle cx="580" cy="265" r="6" fill="none" stroke="#06b6d4" class="conn-socket-pulse" />
					{/if}

					<!-- MCP Protocol Gateway Node (Middle) -->
					<g transform="translate(375, 215)">
						<rect 
							x="0" y="0" width="150" height="100" rx="14" 
							fill="currentColor" 
							class="text-card stroke-cyan-500/80 stroke-[1.8px] shadow-sm" 
						/>
						<rect x="0" y="0" width="150" height="28" rx="14" fill="#06b6d4" fill-opacity="0.18" />
						<text x="12" y="19" font-family="system-ui" font-size="11.5" font-weight="bold" fill="#06b6d4">🔌 MCP Protocol Tool</text>
						
						<g transform="translate(10, 36)">
							<text x="0" y="14" font-family="monospace" font-size="10.5" font-weight="bold" fill="currentColor" class="text-foreground">mutate_invoice()</text>
							<text x="0" y="28" font-family="monospace" font-size="9.5" fill="#06b6d4" font-weight="bold">Zero Raw SQL Guard</text>
							<text x="0" y="42" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">JSON-RPC 2.0 / stdio</text>
							<text x="0" y="55" font-family="monospace" font-size="9" fill={db2VisualState === 'DISCONNECTED' ? '#ef4444' : '#10b981'}>
								{db2VisualState === 'PROCESSING' ? '⚡ EXECUTING RPC' : db2VisualState === 'CONNECTED' ? '● ACTIVE / READY' : '○ STANDBY PROXY'}
							</text>
						</g>
					</g>

					<!-- ========================================================= -->
					<!-- 5. LOWER RIGHT: DB 2 (ENTERPRISE ERP STORE VIA MCP)       -->
					<!-- ========================================================= -->
					<g transform="translate(580, 200)">
						<rect
							x="0" y="0" width="650" height="145" rx="18"
							fill="currentColor"
							class="text-card {db2VisualState === 'PROCESSING' ? 'stroke-cyan-400 stroke-[2.5px] active-box-glow-cyan' : db2VisualState === 'CONNECTED' ? 'stroke-blue-600/90 stroke-[2px]' : 'stroke-rose-500/40 stroke-[1.5px]'}"
						/>
						<!-- Title Banner -->
						<rect 
							x="0" y="0" width="650" height="38" rx="18" 
							fill={db2VisualState === 'DISCONNECTED' ? '#ef4444' : '#2563eb'} 
							fill-opacity={db2VisualState === 'DISCONNECTED' ? '0.08' : db2VisualState === 'PROCESSING' ? '0.24' : '0.16'} 
						/>
						<text x="16" y="25" font-family="system-ui" font-size="13.5" font-weight="bold" fill={db2VisualState === 'DISCONNECTED' ? '#ef4444' : '#2563eb'}>
							🏢 Database Referensi MCP &amp; ERP ({mcpPlatform === 'oracle' ? 'Oracle 19c Enterprise' : mcpPlatform === 'sap' ? 'SAP S/4HANA' : mcpPlatform === 'mysql' ? 'MySQL Cluster' : mcpPlatform === 'mssql' ? 'MS SQL Server' : 'Enterprise DB'})
						</text>
						
						<!-- Status Indicator Badge -->
						{#if db2VisualState === 'PROCESSING'}
							<circle cx="530" cy="24" r="3.5" fill="#06b6d4" class="conn-led-strobe" />
							<text x="540" y="28" font-family="monospace" font-size="11.5" font-weight="bold" fill="#06b6d4">⚡ MUTATING...</text>
						{:else if db2VisualState === 'CONNECTED'}
							<circle cx="530" cy="24" r="3.5" fill="#06b6d4" class="conn-led-fast" />
							<text x="540" y="28" font-family="monospace" font-size="11.5" font-weight="bold" fill="#06b6d4">● CONNECTED (LIVE)</text>
						{:else}
							<circle cx="510" cy="24" r="3.5" fill="#ef4444" />
							<text x="520" y="28" font-family="monospace" font-size="11.5" font-weight="bold" fill="#ef4444">● DISCONNECTED (OFFLINE)</text>
						{/if}

						<!-- Left Text Details Column -->
						<g transform="translate(18, 48)">
							<text x="0" y="16" font-family="monospace" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">
								Host: {mcpConfig.host}:{mcpConfig.port}/{mcpConfig.dbname} • Mode: {mcpMode === 'ssh' ? 'SSH Tunnel (Bastion 22)' : mcpMode === 'ssl' ? 'SSL/TLS Encrypted' : 'Local Direct'}
							</text>
							<text x="0" y="34" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">
								• Tabel Referensi: invoices (Buku Besar Transaksi), customer_master (Entitas Resmi), branches
							</text>
							<text x="0" y="50" font-family="monospace" font-size="10.5" fill="#2563eb" font-weight="bold">
								🔒 Terisolasi Total di Balik Protokol MCP • Parameterized Prepared Statements Saja
							</text>
							<!-- Realtime Health Notice -->
							<text x="0" y="66" font-family="monospace" font-size="10" fill={db2VisualState === 'DISCONNECTED' ? '#ef4444' : 'currentColor'} class={db2VisualState === 'DISCONNECTED' ? '' : 'text-muted-foreground'}>
								{#if db2VisualState === 'CONNECTED'}
									✓ Sumber Data Bisnis Terverifikasi • Akses Read/Write Terisolasi Aman
								{:else if db2VisualState === 'PROCESSING'}
									⚡ Mengeksekusi Mutasi Terverifikasi melalui MCP Protocol RPC...
								{:else}
									✕ Belum Terhubung • Konfigurasikan Platform &amp; Uji Koneksi di Tab 2
								{/if}
							</text>
						</g>

						<!-- Right Platter Disc Rack (DB 2) -->
						<g transform="translate(555, 46)">
							<!-- Scanner Laser Beam (Only active if not disconnected) -->
							{#if db2VisualState !== 'DISCONNECTED'}
								<line 
									x1="-10" y1="0" x2="38" y2="0" 
									stroke="#06b6d4" stroke-width="1.8" 
									class={db2VisualState === 'PROCESSING' ? 'conn-beam-fast' : 'conn-beam'} 
									filter="url(#dbConnGlow)" 
								/>
							{/if}
							
							<!-- Disk 1 (Top) -->
							<path 
								d="M 0 10 v 10 a 18 6.5 0 0 0 36 0 v -10" 
								fill={db2VisualState === 'DISCONNECTED' ? '#334155' : '#0284c7'} 
								fill-opacity={db2VisualState === 'DISCONNECTED' ? '0.4' : '0.55'} 
								stroke={db2VisualState === 'DISCONNECTED' ? '#475569' : '#06b6d4'} 
								stroke-width="1" 
							/>
							<ellipse 
								cx="18" cy="10" rx="18" ry="6.5" 
								fill={db2VisualState === 'DISCONNECTED' ? '#475569' : '#06b6d4'} 
								fill-opacity={db2VisualState === 'DISCONNECTED' ? '0.5' : '0.75'} 
								stroke={db2VisualState === 'DISCONNECTED' ? '#475569' : '#06b6d4'} 
								stroke-width="1.2" 
							/>
							
							<!-- Disk 2 (Middle) -->
							<path 
								d="M 0 24 v 10 a 18 6.5 0 0 0 36 0 v -10" 
								fill={db2VisualState === 'DISCONNECTED' ? '#1e293b' : '#0369a1'} 
								fill-opacity={db2VisualState === 'DISCONNECTED' ? '0.4' : '0.65'} 
								stroke={db2VisualState === 'DISCONNECTED' ? '#475569' : '#06b6d4'} 
								stroke-width="1" 
							/>
							<ellipse 
								cx="18" cy="24" rx="18" ry="6.5" 
								fill={db2VisualState === 'DISCONNECTED' ? '#334155' : '#0284c7'} 
								fill-opacity={db2VisualState === 'DISCONNECTED' ? '0.5' : '0.85'} 
								stroke={db2VisualState === 'DISCONNECTED' ? '#475569' : '#06b6d4'} 
								stroke-width="1.2" 
							/>

							<!-- LEDs Activity -->
							<circle cx="4" cy="46" r="3" fill={db2VisualState === 'DISCONNECTED' ? '#334155' : '#06b6d4'} class={db2VisualState === 'PROCESSING' ? 'conn-led-strobe' : db2VisualState === 'CONNECTED' ? 'conn-led-fast' : ''} />
							<text x="11" y="49" font-family="monospace" font-size="8.5" fill={db2VisualState === 'DISCONNECTED' ? '#64748b' : '#06b6d4'} font-weight="bold">TX</text>

							<circle cx="23" cy="46" r="3" fill={db2VisualState === 'DISCONNECTED' ? '#334155' : '#3b82f6'} class={db2VisualState === 'PROCESSING' ? 'conn-led-strobe' : db2VisualState === 'CONNECTED' ? 'conn-led-slow' : ''} />
							<text x="30" y="49" font-family="monospace" font-size="8.5" fill={db2VisualState === 'DISCONNECTED' ? '#64748b' : '#3b82f6'} font-weight="bold">OK</text>
						</g>
					</g>

				</g>
			</svg>
		</div>
	</div>

	<!-- Top Summary Cards (2 Databases) -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Card 1: System DB -->
		<div class="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
						<ServerStack class="h-4 w-4" />
					</div>
					<div>
						<div class="text-xs font-bold text-foreground">Database Internal Sistem</div>
						<div class="text-[11px] font-mono text-muted-foreground">{sysConfig.host}:{sysConfig.port}/{sysConfig.dbname} (PostgreSQL)</div>
					</div>
				</div>

				<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold {sysStatus === 'CONNECTED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'}">
					● {sysStatus}
				</span>
			</div>

			<div class="text-[11px] text-muted-foreground leading-relaxed">
				Menampung tiket approval, audit trail HMAC, raw messages chatops, dan pola regex self-learning.
			</div>

			<div class="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
				<span class="font-mono text-muted-foreground">Pool: {telemetry?.database?.open_connections || 0} / {telemetry?.database?.max_open || 25} conns</span>
				<button
					type="button"
					onclick={() => activeTab = "system"}
					class="text-xs text-primary hover:underline font-medium cursor-pointer"
				>
					Konfigurasi Sistem &rarr;
				</button>
			</div>
		</div>

		<!-- Card 2: MCP Reference DB -->
		<div class="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
						<LockClosed class="h-4 w-4" />
					</div>
					<div>
						<div class="text-xs font-bold text-foreground">Database Referensi MCP</div>
						<div class="text-[11px] font-mono text-muted-foreground">
							{mcpConfig.host}:{mcpConfig.port}/{mcpConfig.dbname} ({mcpPlatform.toUpperCase()})
						</div>
					</div>
				</div>

				{#if mcpStatus === 'CONNECTED'}
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
						● CONNECTED (TERHUBUNG)
					</span>
				{:else}
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
						● DISCONNECTED (BELUM TERHUBUNG)
					</span>
				{/if}
			</div>

			<div class="text-[11px] text-muted-foreground leading-relaxed">
				Sumber data referensi faktur dan pelanggan bisnis yang diakses terkontrol oleh tool MCP (Zero Raw SQL).
			</div>

			<div class="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
				<span class="font-mono text-muted-foreground">Mode: {mcpMode === 'ssh' ? 'SSH Tunnel' : mcpMode === 'ssl' ? 'SSL/TLS' : 'Local Direct'}</span>
				<button
					type="button"
					onclick={() => activeTab = "mcp"}
					class="text-xs text-primary hover:underline font-medium cursor-pointer"
				>
					Setup Referensi MCP &rarr;
				</button>
			</div>
		</div>
	</div>

	<!-- Navigation Tabs: 4 Distinct Workflows -->
	<div class="flex items-center gap-2 border-b border-border/50 pb-1 text-xs font-semibold overflow-x-auto">
		<button
			type="button"
			onclick={() => activeTab = "system"}
			class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 {activeTab === 'system' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<ServerStack class="h-3.5 w-3.5" />
			<span>1. Database Internal Sistem</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "mcp"}
			class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 {activeTab === 'mcp' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CircleStack class="h-3.5 w-3.5" />
			<span>2. Database Referensi MCP</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "mcp_tools"}
			class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 {activeTab === 'mcp_tools' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CommandLine class="h-3.5 w-3.5" />
			<span>3. Katalog &amp; Upload MCP ({mcpTools.length})</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "env"}
			class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 {activeTab === 'env' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<ClipboardDocument class="h-3.5 w-3.5" />
			<span>4. Setup File .env</span>
		</button>
	</div>

	<!-- ========================================================================= -->
	<!-- TAB 1: DATABASE INTERNAL SISTEM (POSTGRESQL ONLY - LOCKED)                -->
	<!-- ========================================================================= -->
	{#if activeTab === "system"}
		<div class="space-y-6">
			<!-- Config Form Box -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
					<div>
						<h2 class="text-sm font-bold text-foreground">Parameter Koneksi Database Internal Sistem</h2>
						<p class="text-xs text-muted-foreground">Koneksi PostgreSQL yang digunakan oleh server Go untuk seluruh data operasional, tiket, dan audit.</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={testSystemConnection}
							disabled={isTestingSys}
							class="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
						>
							<ArrowPath class="h-3.5 w-3.5 {isTestingSys ? 'animate-spin' : ''}" />
							<span>{isTestingSys ? 'Menguji Koneksi...' : 'Uji Koneksi Sistem'}</span>
						</button>
					</div>
				</div>

				<!-- Test Result Notification -->
				{#if sysTestResult}
					<div class="p-3.5 rounded-xl border flex items-start gap-3 text-xs {sysTestResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
						{#if sysTestResult.ok}
							<CheckCircle class="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
						{:else}
							<XCircle class="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
						{/if}
						<div class="flex-1 font-mono">
							<div class="font-bold flex items-center justify-between">
								<span>{sysTestResult.ok ? 'KONEKSI SISTEM TERVERIFIKASI' : 'GAGAL TERHUBUNG KE SISTEM'}</span>
								<span class="text-[10px] opacity-75">{sysTestResult.time}</span>
							</div>
							<div class="mt-1">{sysTestResult.message}</div>
						</div>
						<button
							type="button"
							onclick={() => sysTestResult = null}
							class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground cursor-pointer"
						>
							<XMark class="h-4 w-4" />
						</button>
					</div>
				{/if}

				<!-- Requirement Notice: Database Internal Wajib PostgreSQL -->
				<div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
					<LockClosed class="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
					<div class="leading-relaxed">
						<strong>Persyaratan Wajib Engine Inti:</strong> Database internal sistem wajib menggunakan <strong>PostgreSQL (v14–v18)</strong> untuk menjamin integritas transaksi ACID antrean tiket, penandatanganan log audit immutable HMAC, dan pembaruan pola regex AI. Pilihan tipe DB ini <strong>dikunci permanen</strong> dan tidak dapat diubah ke platform lain.
					</div>
				</div>

				<!-- Inputs Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
					<!-- Locked Engine Selector -->
					<div class="space-y-1 sm:col-span-2 md:col-span-3">
						<label for="sys-engine" class="font-semibold text-muted-foreground flex items-center justify-between">
							<span>Tipe Database Engine:</span>
							<span class="text-[10px] text-amber-500 font-mono font-bold flex items-center gap-1">
								<LockClosed class="h-3 w-3" /> WAJIB / TERKUNCI (POSTGRESQL ONLY)
							</span>
						</label>
						<div class="relative">
							<select
								id="sys-engine"
								disabled
								class="w-full h-9 px-3 pr-8 rounded-lg border border-input bg-muted/70 text-foreground font-mono text-xs cursor-not-allowed opacity-90 select-none"
							>
								<option value="postgres" selected>PostgreSQL 14 - 18 (Core Engine Requirement - Terkunci)</option>
							</select>
							<LockClosed class="h-4 w-4 text-amber-500 absolute right-2.5 top-2.5 pointer-events-none" />
						</div>
					</div>

					<div class="space-y-1">
						<label for="sys-host" class="font-semibold text-muted-foreground">Host Sistem:</label>
						<input
							id="sys-host"
							type="text"
							bind:value={sysConfig.host}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="localhost"
						/>
					</div>

					<div class="space-y-1">
						<label for="sys-port" class="font-semibold text-muted-foreground">Port Sistem:</label>
						<input
							id="sys-port"
							type="text"
							bind:value={sysConfig.port}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="5432"
						/>
					</div>

					<div class="space-y-1">
						<label for="sys-dbname" class="font-semibold text-muted-foreground">Nama Database:</label>
						<input
							id="sys-dbname"
							type="text"
							bind:value={sysConfig.dbname}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="novapilot_db"
						/>
					</div>

					<div class="space-y-1">
						<label for="sys-user" class="font-semibold text-muted-foreground">User:</label>
						<input
							id="sys-user"
							type="text"
							bind:value={sysConfig.user}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="postgres"
						/>
					</div>

					<div class="space-y-1">
						<label for="sys-password" class="font-semibold text-muted-foreground">Password:</label>
						<div class="relative">
							<input
								id="sys-password"
								type={showSysPass ? "text" : "password"}
								bind:value={sysConfig.password}
								class="w-full h-9 px-3 pr-9 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
								placeholder="••••••••"
							/>
							<button
								type="button"
								onclick={() => showSysPass = !showSysPass}
								class="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
								title={showSysPass ? "Sembunyikan Password" : "Lihat Password"}
							>
								{#if showSysPass}
									<EyeSlash class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<div class="space-y-1">
						<label for="sys-sslmode" class="font-semibold text-muted-foreground">SSL Mode:</label>
						<select
							id="sys-sslmode"
							bind:value={sysConfig.sslmode}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
						>
							<option value="disable">disable</option>
							<option value="require">require</option>
							<option value="verify-ca">verify-ca</option>
							<option value="verify-full">verify-full</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Pool Telemetry Stats -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="flex items-center justify-between pb-2 border-b border-border/50">
					<div class="text-xs font-bold text-foreground">Metrik Connection Pool Database Sistem (Live)</div>
					<div class="text-[10px] font-mono text-muted-foreground">Driver: {telemetry?.database?.driver || 'lib/pq (PostgreSQL)'}</div>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
					<div class="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
						<div class="text-[10px] font-mono text-muted-foreground uppercase">Open Conns</div>
						<div class="text-xl font-bold font-mono text-foreground">
							{telemetry?.database?.open_connections || 0}
							<span class="text-xs text-muted-foreground font-normal">/ {telemetry?.database?.max_open || 25}</span>
						</div>
					</div>

					<div class="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
						<div class="text-[10px] font-mono text-muted-foreground uppercase">In-Use Conns</div>
						<div class="text-xl font-bold font-mono text-blue-500">
							{telemetry?.database?.in_use || 0}
						</div>
					</div>

					<div class="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
						<div class="text-[10px] font-mono text-muted-foreground uppercase">Idle Conns</div>
						<div class="text-xl font-bold font-mono text-emerald-500">
							{telemetry?.database?.idle || 0}
						</div>
					</div>

					<div class="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
						<div class="text-[10px] font-mono text-muted-foreground uppercase">Wait Count</div>
						<div class="text-xl font-bold font-mono text-purple-500">
							{telemetry?.database?.wait_count || 0}
						</div>
					</div>
				</div>
			</div>

			<!-- Tabel Terkelola Sistem -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="text-xs font-bold text-foreground">Tabel yang Dikelola oleh Sistem Internal ({systemTables.length})</div>
				<div class="rounded-xl border border-border/60 overflow-hidden">
					<table class="w-full text-xs text-left">
						<thead class="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-mono border-b border-border/50">
							<tr>
								<th class="py-2.5 px-3.5 font-bold">Nama Tabel</th>
								<th class="py-2.5 px-3.5 font-bold">Estimasi Baris</th>
								<th class="py-2.5 px-3.5 font-bold">Deskripsi &amp; Peran</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/40 font-mono">
							{#each systemTables as tbl}
								<tr class="hover:bg-muted/40 transition-colors">
									<td class="py-2.5 px-3.5 font-bold text-foreground">{tbl.name}</td>
									<td class="py-2.5 px-3.5 text-muted-foreground">{tbl.count}</td>
									<td class="py-2.5 px-3.5 font-sans text-muted-foreground text-[11px]">{tbl.desc}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- TAB 2: DATABASE REFERENSI MCP (PLATFORM + SSL / SSH / LOCAL MODES)        -->
	<!-- ========================================================================= -->
	{#if activeTab === "mcp"}
		<div class="space-y-6">
			<!-- Config Form Box -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
					<div>
						<h2 class="text-sm font-bold text-foreground">Setup Database Referensi MCP &amp; ERP</h2>
						<p class="text-xs text-muted-foreground">Sumber data faktur &amp; master pelanggan bisnis yang diakses oleh tool Model Context Protocol (Zero Raw SQL).</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={testMCPReferenceConnection}
							disabled={isTestingMcp}
							class="h-8 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
						>
							<ArrowPath class="h-3.5 w-3.5 {isTestingMcp ? 'animate-spin' : ''}" />
							<span>{isTestingMcp ? 'Menguji Koneksi...' : 'Uji Koneksi Referensi MCP'}</span>
						</button>
					</div>
				</div>

				<!-- Test Result Notification -->
				{#if mcpTestResult}
					<div class="p-3.5 rounded-xl border flex items-start gap-3 text-xs {mcpTestResult.ok ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
						{#if mcpTestResult.ok}
							<CheckCircle class="h-5 w-5 shrink-0 text-cyan-500 mt-0.5" />
						{:else}
							<XCircle class="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
						{/if}
						<div class="flex-1 font-mono">
							<div class="font-bold flex items-center justify-between">
								<span>{mcpTestResult.ok ? 'KONEKSI REFERENSI MCP TERVERIFIKASI' : 'GAGAL TERHUBUNG KE REFERENSI MCP'}</span>
								<span class="text-[10px] opacity-75">{mcpTestResult.time}</span>
							</div>
							<div class="mt-1">{mcpTestResult.message}</div>
						</div>
						<button
							type="button"
							onclick={() => mcpTestResult = null}
							class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground cursor-pointer"
						>
							<XMark class="h-4 w-4" />
						</button>
					</div>
				{/if}

				<!-- Platform & Connection Mode Selectors -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/40 border border-border/60">
					<!-- Platform Database Selector -->
					<div class="space-y-1.5">
						<label for="mcp-platform" class="text-xs font-bold text-foreground flex items-center gap-1.5">
							<span>Platform Database Referensi:</span>
						</label>
						<select
							id="mcp-platform"
							value={mcpPlatform}
							onchange={handlePlatformChange}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
						>
							<option value="oracle">Oracle 19c / 21c Enterprise (ERP Prod / Financials)</option>
							<option value="sap">SAP S/4HANA (BAPI / RFC Data Source)</option>
							<option value="postgres">PostgreSQL (External Data Warehouse / Secondary DB)</option>
							<option value="mysql">MySQL / MariaDB Enterprise Cluster</option>
							<option value="mssql">Microsoft SQL Server (MSSQL Enterprise)</option>
							<option value="custom_rest">Custom MCP REST / GraphQL Adapter</option>
						</select>
						<p class="text-[11px] text-muted-foreground">Port default otomatis disesuaikan dengan arsitektur platform yang dipilih.</p>
					</div>

					<!-- Connection Mode (Local / SSL / SSH Tunnel) -->
					<div class="space-y-1.5">
						<span class="text-xs font-bold text-foreground block">
							Mode Konektivitas &amp; Keamanan:
						</span>
						<div class="grid grid-cols-3 gap-1.5 bg-background p-1 rounded-lg border border-input">
							<button
								type="button"
								onclick={() => mcpMode = "local"}
								class="h-7 text-xs font-semibold rounded transition-colors cursor-pointer {mcpMode === 'local' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:bg-muted'}"
							>
								Local Direct
							</button>
							<button
								type="button"
								onclick={() => mcpMode = "ssl"}
								class="h-7 text-xs font-semibold rounded transition-colors cursor-pointer {mcpMode === 'ssl' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:bg-muted'}"
							>
								SSL / TLS
							</button>
							<button
								type="button"
								onclick={() => mcpMode = "ssh"}
								class="h-7 text-xs font-semibold rounded transition-colors cursor-pointer {mcpMode === 'ssh' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:bg-muted'}"
							>
								SSH Tunnel
							</button>
						</div>
						<p class="text-[11px] text-muted-foreground">
							{#if mcpMode === 'ssh'}
								Melalui bastion jump host di perimeter DMZ pabrik untuk isolasi ketat.
							{:else if mcpMode === 'ssl'}
								Menggunakan enkripsi TLS terverifikasi untuk cloud DB atau managed instance.
							{:else}
								Koneksi langsung melalui jaringan lokal (LAN / intranet tanpa enkripsi tambahan).
							{/if}
						</p>
					</div>
				</div>

				<!-- SSH Tunnel Bastion Fields (If SSH Mode Selected) -->
				{#if mcpMode === "ssh"}
					<div class="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3">
						<div class="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
							<ShieldCheck class="h-4 w-4" />
							<span>Konfigurasi SSH Tunnel (Bastion Jump Host)</span>
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
							<div class="space-y-1">
								<label for="ssh-host" class="font-semibold text-muted-foreground">SSH Bastion Host:</label>
								<input
									id="ssh-host"
									type="text"
									bind:value={mcpSshConfig.bastionHost}
									class="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs focus:outline-none"
									placeholder="bastion.corp.internal"
								/>
							</div>
							<div class="space-y-1">
								<label for="ssh-port" class="font-semibold text-muted-foreground">SSH Port:</label>
								<input
									id="ssh-port"
									type="text"
									bind:value={mcpSshConfig.bastionPort}
									class="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs focus:outline-none"
									placeholder="22"
								/>
							</div>
							<div class="space-y-1">
								<label for="ssh-user" class="font-semibold text-muted-foreground">SSH User:</label>
								<input
									id="ssh-user"
									type="text"
									bind:value={mcpSshConfig.user}
									class="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs focus:outline-none"
									placeholder="novapilot-bastion"
								/>
							</div>
						</div>
					</div>
				{/if}

				<!-- Inputs Grid for Target Database -->
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
					<div class="space-y-1">
						<label for="mcp-host" class="font-semibold text-muted-foreground">Host Endpoint Referensi:</label>
						<input
							id="mcp-host"
							type="text"
							bind:value={mcpConfig.host}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="erp-db.internal"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-port" class="font-semibold text-muted-foreground">Port Target:</label>
						<input
							id="mcp-port"
							type="text"
							bind:value={mcpConfig.port}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="1521"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-dbname" class="font-semibold text-muted-foreground">Nama DB / SID / PDB:</label>
						<input
							id="mcp-dbname"
							type="text"
							bind:value={mcpConfig.dbname}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="ERP_PROD_PDB"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-user" class="font-semibold text-muted-foreground">User Kredensial MCP:</label>
						<input
							id="mcp-user"
							type="text"
							bind:value={mcpConfig.user}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="erp_agent"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-password" class="font-semibold text-muted-foreground">Password Kredensial:</label>
						<div class="relative">
							<input
								id="mcp-password"
								type={showMcpPass ? "text" : "password"}
								bind:value={mcpConfig.password}
								class="w-full h-9 px-3 pr-9 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
								placeholder="••••••••"
							/>
							<button
								type="button"
								onclick={() => showMcpPass = !showMcpPass}
								class="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
								title={showMcpPass ? "Sembunyikan Password" : "Lihat Password"}
							>
								{#if showMcpPass}
									<EyeSlash class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<div class="space-y-1">
						<label for="mcp-sslmode" class="font-semibold text-muted-foreground">Tingkat Enkripsi SSL:</label>
						<select
							id="mcp-sslmode"
							bind:value={mcpConfig.sslmode}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
						>
							<option value="disable">disable (Tanpa Enkripsi)</option>
							<option value="require">require (Enkripsi Wajib)</option>
							<option value="verify-ca">verify-ca (Validasi CA)</option>
							<option value="verify-full">verify-full (Validasi CA + Hostname)</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Protocol Isolation & Security Rules -->
			<div class="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-3 shadow-xs text-xs">
				<div class="flex items-center gap-2 font-bold text-cyan-600 dark:text-cyan-400">
					<ShieldCheck class="h-4 w-4" />
					<span>Kebijakan Keamanan: Zero Direct Raw SQL Execution</span>
				</div>
				<p class="text-muted-foreground leading-relaxed">
					AI Agent dan bot chat <strong>tidak pernah memegang string SQL bebas</strong>. Seluruh komunikasi dilakukan melalui kontrak parameter tool terdaftar:
				</p>
				<ul class="list-disc list-inside space-y-1 text-foreground font-mono text-[11px]">
					<li><code>check_invoice(invoice_no)</code> &rarr; Membaca verifikasi data faktur dari {mcpPlatform.toUpperCase()} (read-only).</li>
					<li><code>stage_invoice_update(...)</code> &rarr; Mengajukan usulan koreksi ke antrean tiket sistem tanpa eksekusi langsung.</li>
					<li><code>mutate_invoice_record(...)</code> &rarr; Dijalankan secara atomik hanya setelah persetujuan 1-Click dari engineer on-call.</li>
				</ul>
			</div>

			<!-- Tabel Referensi yang Diakses Tool MCP -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="text-xs font-bold text-foreground">Tabel Referensi ERP yang Diakses ({mcpReferenceTables.length})</div>
				<div class="rounded-xl border border-border/60 overflow-hidden">
					<table class="w-full text-xs text-left">
						<thead class="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-mono border-b border-border/50">
							<tr>
								<th class="py-2.5 px-3.5 font-bold">Nama Tabel</th>
								<th class="py-2.5 px-3.5 font-bold">Peran Data dalam MCP</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/40 font-mono">
							{#each mcpReferenceTables as tbl}
								<tr class="hover:bg-muted/40 transition-colors">
									<td class="py-2.5 px-3.5 font-bold text-foreground">{tbl.name}</td>
									<td class="py-2.5 px-3.5 font-sans text-muted-foreground text-[11px]">{tbl.desc}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- TAB 3: KATALOG & UPLOAD TOOL MCP                                          -->
	<!-- ========================================================================= -->
	{#if activeTab === "mcp_tools"}
		<div class="space-y-6">
			<!-- Header & Preset Loader -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
					<div>
						<h2 class="text-sm font-bold text-foreground">Katalog &amp; Pendaftaran Tool Model Context Protocol (MCP)</h2>
						<p class="text-xs text-muted-foreground">Unggah manifest atau skema tool kustom (JSON / YAML) agar AI Agent dapat berinteraksi dengan database bisnis eksternal secara aman.</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={fetchMCPTools}
							disabled={isLoadingMcpTools}
							class="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
						>
							<ArrowPath class="h-3.5 w-3.5 {isLoadingMcpTools ? 'animate-spin' : ''}" />
							<span>Muat Tool</span>
						</button>
					</div>
				</div>

				<!-- Upload Success / Error Notifications -->
				{#if uploadSuccess}
					<div class="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
						<div class="flex items-center gap-2">
							<CheckCircle class="h-4 w-4 text-emerald-500 shrink-0" />
							<span>{uploadSuccess}</span>
						</div>
						<button type="button" onclick={() => uploadSuccess = null} class="text-muted-foreground hover:text-foreground cursor-pointer">
							<XMark class="h-4 w-4" />
						</button>
					</div>
				{/if}

				{#if uploadError}
					<div class="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
						<div class="flex items-center gap-2">
							<XCircle class="h-4 w-4 text-rose-500 shrink-0" />
							<span>{uploadError}</span>
						</div>
						<button type="button" onclick={() => uploadError = null} class="text-muted-foreground hover:text-foreground cursor-pointer">
							<XMark class="h-4 w-4" />
						</button>
					</div>
				{/if}

				<!-- Upload Zone & Preset Buttons -->
				<div class="space-y-3">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
						<span class="font-bold text-foreground">Muat Template Preset Cepat:</span>
						<div class="flex items-center gap-1.5 flex-wrap">
							<button
								type="button"
								onclick={() => loadPresetManifest("oracle_invoicing")}
								class="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-mono cursor-pointer transition-colors"
							>
								Oracle Invoice Mutation
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("sap_bapi_customer")}
								class="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-mono cursor-pointer transition-colors"
							>
								SAP Customer Master
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("tax_compliance_djp")}
								class="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-mono cursor-pointer transition-colors"
							>
								DJP Tax Validator
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("warehouse_stock_sync")}
								class="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-mono cursor-pointer transition-colors"
							>
								Stock Sync
							</button>
						</div>
					</div>

					<!-- Drag & Drop / File Input -->
					<div class="flex items-center gap-3">
						<label class="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer">
							<span>Pilih Berkas (.json / .yaml)</span>
							<input
								type="file"
								accept=".json,.yaml,.yml,.txt"
								onchange={handleFileSelect}
								class="hidden"
							/>
						</label>
						<span class="text-xs text-muted-foreground">atau tempel langsung kode manifest JSON di bawah ini:</span>
					</div>

					<!-- Manifest Textarea -->
					<div class="relative">
						<textarea
							bind:value={uploadManifestText}
							rows={8}
							placeholder={`{
  "name": "mutate_custom_tool",
  "version": "1.0.0",
  "category": "ERP_INTEGRATION",
  "description": "Deskripsi fungsi tool MCP",
  "transport": "stdio / json-rpc 2.0",
  "inputSchema": {
    "type": "object",
    "properties": {
      "record_id": { "type": "string", "description": "ID entitas" }
    },
    "required": ["record_id"]
  }
}`}
							class="w-full p-3 rounded-xl border border-input bg-secondary/50 font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none leading-relaxed"
						></textarea>
					</div>

					<div class="flex items-center justify-between pt-1">
						<button
							type="button"
							onclick={() => uploadManifestText = ""}
							class="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
						>
							Bersihkan Formulir
						</button>

						<button
							type="button"
							onclick={registerUploadedMCPTool}
							disabled={isUploadingTool || !uploadManifestText.trim()}
							class="h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
						>
							<ArrowPath class="h-3.5 w-3.5 {isUploadingTool ? 'animate-spin' : ''}" />
							<span>{isUploadingTool ? 'Mendaftarkan Tool...' : 'Unggah &amp; Registrasikan Tool MCP'}</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Registered Tools List -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="flex items-center justify-between pb-2 border-b border-border/50">
					<div class="text-xs font-bold text-foreground">Daftar Tool MCP yang Aktif &amp; Terdaftar ({mcpTools.length})</div>
					<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
						ZERO RAW SQL ENFORCED
					</span>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each mcpTools as tool}
						<div class="p-4 rounded-xl border border-border/70 bg-secondary/40 space-y-3 hover:border-cyan-500/40 transition-colors shadow-2xs">
							<div class="flex items-start justify-between gap-2">
								<div class="space-y-0.5">
									<div class="font-mono font-bold text-xs text-foreground flex items-center gap-1.5">
										<CommandLine class="h-3.5 w-3.5 text-cyan-500" />
										<span>{tool.name}</span>
										<span class="text-[10px] font-normal px-1.5 py-0.2 rounded bg-muted text-muted-foreground">v{tool.version}</span>
									</div>
									<div class="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{tool.transport} • {tool.category}</div>
								</div>

								<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
									● {tool.status}
								</span>
							</div>

							<p class="text-xs text-muted-foreground leading-relaxed">
								{tool.description}
							</p>

							<!-- Schema Properties Preview -->
							{#if tool.inputSchema?.properties}
								<div class="p-2.5 rounded-lg bg-background/80 border border-border/60 space-y-1 font-mono text-[11px]">
									<div class="text-[10px] font-bold text-muted-foreground uppercase">Parameter Input:</div>
									{#each Object.entries(tool.inputSchema.properties) as [paramKey, paramVal]}
										<div class="flex items-baseline justify-between gap-2 text-foreground">
											<span class="font-bold text-cyan-600 dark:text-cyan-400">{paramKey}</span>
											<span class="text-muted-foreground text-[10px]">({paramVal.type})</span>
										</div>
									{/each}
								</div>
							{/if}

							<div class="pt-2 flex items-center justify-end">
								<button
									type="button"
									onclick={() => openToolTestModal(tool)}
									class="h-7 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
								>
									<span>Uji Panggilan Tool (Dry-Run)</span>
									<ArrowTopRightOnSquare class="h-3 w-3" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Interactive Dry-Run Execution Modal / Panel -->
			{#if activeToolForTest}
				<div class="p-5 rounded-2xl border border-cyan-500/30 bg-card space-y-4 shadow-md">
					<div class="flex items-center justify-between pb-3 border-b border-border/50">
						<div class="flex items-center gap-2">
							<CommandLine class="h-4 w-4 text-cyan-500" />
							<h3 class="text-sm font-bold text-foreground">
								Sandbox Simulasi Eksekusi: <span class="font-mono text-cyan-500">{activeToolForTest.name}</span>
							</h3>
						</div>
						<button
							type="button"
							onclick={() => activeToolForTest = null}
							class="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer"
						>
							<XMark class="h-4 w-4" />
						</button>
					</div>

					<p class="text-xs text-muted-foreground">
						Uji coba panggil tool MCP ini menggunakan data uji tanpa memodifikasi data produksi secara permanen.
					</p>

					<!-- Parameters Form -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
						{#each Object.entries(testParamsInput) as [key, val]}
							<div class="space-y-1">
								<label for="param-{key}" class="font-mono font-bold text-foreground">{key}:</label>
								<input
									id="param-{key}"
									type="text"
									value={val}
									oninput={(e) => testParamsInput[key] = (e.target as HTMLInputElement).value}
									class="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs focus:outline-none"
								/>
							</div>
						{/each}
					</div>

					<!-- Execution Result -->
					{#if toolTestExecutionResult}
						<div class="p-3.5 rounded-xl border text-xs font-mono space-y-2 {toolTestExecutionResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'}">
							<div class="flex items-center justify-between font-bold">
								<span>{toolTestExecutionResult.ok ? 'HASIL SIMULASI MCP PROTOCOL (SUKSES)' : 'GAGAL EKSEKUSI TOOL'}</span>
								<span class="text-[10px] opacity-75">{toolTestExecutionResult.timestamp}</span>
							</div>
							{#if toolTestExecutionResult.ok}
								<div class="text-[11px] opacity-90">
									Roundtrip: <span class="font-bold">{toolTestExecutionResult.latency_ms}ms</span> • Protocol: {toolTestExecutionResult.protocol}
								</div>
								<pre class="p-2.5 rounded bg-black/10 dark:bg-black/30 overflow-x-auto text-[11px] leading-relaxed">{JSON.stringify(toolTestExecutionResult.result, null, 2)}</pre>
							{:else}
								<div>{toolTestExecutionResult.error}</div>
							{/if}
						</div>
					{/if}

					<div class="flex items-center justify-end gap-2 pt-1">
						<button
							type="button"
							onclick={() => activeToolForTest = null}
							class="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
						>
							Tutup
						</button>
						<button
							type="button"
							onclick={executeToolTest}
							disabled={isExecutingToolTest}
							class="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
						>
							<ArrowPath class="h-3.5 w-3.5 {isExecutingToolTest ? 'animate-spin' : ''}" />
							<span>{isExecutingToolTest ? 'Mengeksekusi...' : 'Jalankan Simulasi MCP Tool'}</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- TAB 4: SETUP FILE .ENV HELPER                                             -->
	<!-- ========================================================================= -->
	{#if activeTab === "env"}
		<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
			<div class="flex items-center justify-between pb-2 border-b border-border/50">
				<div>
					<h2 class="text-sm font-bold text-foreground">Konfigurasi .env Terpadu</h2>
					<p class="text-xs text-muted-foreground">Salin variabel lingkungan ini ke file <code>.env</code> root dan <code>backend/.env</code> untuk kedua database.</p>
				</div>
				<button
					type="button"
					onclick={copyEnvSnippet}
					class="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
				>
					{#if copiedEnv}
						<Check class="h-3.5 w-3.5 text-emerald-500" />
						<span class="text-emerald-500">Tersalin!</span>
					{:else}
						<ClipboardDocument class="h-3.5 w-3.5" />
						<span>Salin ke Clipboard</span>
					{/if}
				</button>
			</div>

			<pre class="p-4 rounded-xl bg-secondary/70 border border-border/60 font-mono text-xs overflow-x-auto text-foreground leading-relaxed">{generateEnvSnippet()}</pre>
		</div>
	{/if}
</div>
