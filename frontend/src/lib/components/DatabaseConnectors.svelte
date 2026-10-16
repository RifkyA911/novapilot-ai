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
		ArrowTopRightOnSquare,
		Plus,
		Trash,
		Play,
		Star,
		PencilSquare
	} from "svelte-heros-v2";
	import { i18n } from "$lib/i18n.svelte";
	import DatabasePlatformSelect, { type PlatformOption } from "./DatabasePlatformSelect.svelte";
	import CustomSelect from "./CustomSelect.svelte";
	import BrandIcon from "./BrandIcon.svelte";

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
		port: "5432",
		user: "postgres",
		password: "",
		dbname: "novapilot_mcp_ref",
		sslmode: "disable"
	});

	// Platform & Connection Mode for MCP Reference DB
	let mcpPlatform = $state<"oracle" | "sap" | "postgres" | "mysql" | "mssql" | "custom_rest">("postgres");
	let mcpMode = $state<"local" | "ssl" | "ssh">("local");

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
			latency_ms?: number;
		};
		reference_database?: {
			id?: string;
			name?: string;
			platform?: string;
			status?: string;
			latency_ms?: number;
		};
	}
	let telemetry = $state<TelemetryData | null>(null);

	// Test Connection States
	let isTestingSys = $state(false);
	let isTestingMcp = $state(false);
	let isApplyingSys = $state(false);
	let isApplyingMcp = $state(false);
	let sysTestResult = $state<{ ok: boolean; message: string; latency_ms?: number; time: string } | null>(null);
	let mcpTestResult = $state<{ ok: boolean; message: string; latency_ms?: number; time: string } | null>(null);
	let sysApplyResult = $state<{ ok: boolean; message: string; time: string } | null>(null);
	let mcpApplyResult = $state<{ ok: boolean; message: string; time: string } | null>(null);

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
	// MULTI-REFERENCE DATABASE POOL STATE & API METHODS
	// =========================================================================
	interface ReferenceDB {
		id: string;
		name: string;
		platform: string;
		host: string;
		port: string;
		dbname: string;
		user: string;
		password?: string;
		sslmode: string;
		mode: string;
		status: string;
		is_active: boolean;
		latency_ms?: number;
		description?: string;
		tns?: string;
		service_name?: string;
		created_at: string;
	}

	let referenceDBs = $state<ReferenceDB[]>([]);
	let isLoadingRefDBs = $state(false);
	let isActivatingRefDB = $state<string | null>(null);
	let isTestingRefDB = $state<string | null>(null);
	let refDBActionMessage = $state<{ ok: boolean; text: string } | null>(null);

	// Add New Reference DB Modal State
	let showAddRefModal = $state(false);
	let newRefDB = $state({
		name: "",
		platform: "postgres",
		host: "localhost",
		port: "5432",
		dbname: "",
		user: "postgres",
		password: "",
		sslmode: "disable",
		mode: "local",
		description: "",
		tns: "",
		service_name: ""
	});

	// Edit Reference DB Modal State
	let showEditRefModal = $state(false);
	let editingRefDB = $state<ReferenceDB | null>(null);
	let isUpdatingRefDB = $state(false);
	let isTestingEditRefDB = $state(false);
	let editTestResult = $state<{ ok: boolean; message: string; latency_ms?: number } | null>(null);
	let showEditRefPass = $state(false);
	let showNewRefPass = $state(false);
	let mcpOracleTNS = $state("");

	// Oracle TNS Auto-parser helper
	function parseOracleTNS(tns: string) {
		let host = "";
		let port = "1521";
		let serviceName = "";

		const hostMatch = tns.match(/HOST\s*=\s*([^)\s]+)/i);
		if (hostMatch) host = hostMatch[1].trim();

		const portMatch = tns.match(/PORT\s*=\s*([0-9]+)/i);
		if (portMatch) port = portMatch[1].trim();

		const svcMatch = tns.match(/SERVICE_NAME\s*=\s*([^)\s]+)/i);
		if (svcMatch) serviceName = svcMatch[1].trim();

		const sidMatch = tns.match(/SID\s*=\s*([^)\s]+)/i);
		if (!serviceName && sidMatch) serviceName = sidMatch[1].trim();

		return { host, port, serviceName };
	}

	function handleEditTNSInput() {
		if (!editingRefDB || !editingRefDB.tns) return;
		const { host, port, serviceName } = parseOracleTNS(editingRefDB.tns);
		if (host) editingRefDB.host = host;
		if (port) editingRefDB.port = port;
		if (serviceName) {
			editingRefDB.service_name = serviceName;
			if (!editingRefDB.dbname || editingRefDB.dbname === "XE" || editingRefDB.dbname === "ORCL") {
				editingRefDB.dbname = serviceName;
			}
		}
	}

	function handleNewRefTNSInput() {
		if (!newRefDB.tns) return;
		const { host, port, serviceName } = parseOracleTNS(newRefDB.tns);
		if (host) newRefDB.host = host;
		if (port) newRefDB.port = port;
		if (serviceName) {
			newRefDB.service_name = serviceName;
			if (!newRefDB.dbname) newRefDB.dbname = serviceName;
		}
	}

	function handleMcpTNSInput() {
		if (!mcpOracleTNS) return;
		const { host, port, serviceName } = parseOracleTNS(mcpOracleTNS);
		if (host) mcpConfig.host = host;
		if (port) mcpConfig.port = port;
		if (serviceName) mcpConfig.dbname = serviceName;
	}

	function openEditRefModal(db: ReferenceDB) {
		editingRefDB = {
			...db,
			password: db.password || "",
			tns: db.tns || (db.host && db.host.includes("DESCRIPTION") ? db.host : ""),
			service_name: db.service_name || ""
		};
		if (editingRefDB.tns && (!editingRefDB.host || editingRefDB.host.includes("DESCRIPTION"))) {
			const { host, port, serviceName } = parseOracleTNS(editingRefDB.tns);
			if (host) editingRefDB.host = host;
			if (port) editingRefDB.port = port;
			if (serviceName) editingRefDB.service_name = serviceName;
		}
		editTestResult = null;
		showEditRefPass = false;
		showEditRefModal = true;
	}

	async function handleUpdateRefDB() {
		if (!editingRefDB) return;
		isUpdatingRefDB = true;
		refDBActionMessage = null;
		try {
			const res = await fetch(`/api/database/reference-dbs/${editingRefDB.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(editingRefDB)
			});
			const data = await res.json();
			if (res.ok) {
				refDBActionMessage = { ok: true, text: data.message || "Konfigurasi database referensi berhasil diperbarui!" };
				showEditRefModal = false;
				editingRefDB = null;
				await fetchReferenceDBs();
				await fetchConfigAndTelemetry();
			} else {
				refDBActionMessage = { ok: false, text: data.error || "Gagal memperbarui database referensi" };
			}
		} catch (e: any) {
			refDBActionMessage = { ok: false, text: e.message };
		} finally {
			isUpdatingRefDB = false;
		}
	}

	async function testEditingRefDB() {
		if (!editingRefDB) return;
		isTestingEditRefDB = true;
		editTestResult = null;
		try {
			const res = await fetch("/api/database/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					platform: editingRefDB.platform,
					host: editingRefDB.host,
					port: editingRefDB.port,
					user: editingRefDB.user,
					password: editingRefDB.password,
					dbname: editingRefDB.dbname,
					sslmode: editingRefDB.sslmode,
					tns: editingRefDB.tns,
					service_name: editingRefDB.service_name
				})
			});
			const data = await res.json();
			editTestResult = {
				ok: data.ok,
				message: data.message || data.error || (data.ok ? "Koneksi berhasil diverifikasi!" : "Gagal terkoneksi"),
				latency_ms: data.latency_ms
			};
		} catch (e: any) {
			editTestResult = { ok: false, message: e.message };
		} finally {
			isTestingEditRefDB = false;
		}
	}

	async function fetchReferenceDBs() {
		isLoadingRefDBs = true;
		try {
			const res = await fetch("/api/database/reference-dbs");
			if (res.ok) {
				const data = await res.json();
				referenceDBs = data.reference_dbs || [];
			}
		} catch (e) {
			console.error("Failed to fetch reference dbs:", e);
		} finally {
			isLoadingRefDBs = false;
		}
	}

	async function activateReferenceDB(id: string) {
		isActivatingRefDB = id;
		refDBActionMessage = null;
		try {
			const res = await fetch(`/api/database/reference-dbs/${id}/activate`, { method: "POST" });
			const data = await res.json();
			if (res.ok) {
				refDBActionMessage = { ok: true, text: data.message };
				await fetchReferenceDBs();
				await fetchConfigAndTelemetry();
			} else {
				refDBActionMessage = { ok: false, text: data.error || "Gagal mengaktifkan database referensi" };
			}
		} catch (e: any) {
			refDBActionMessage = { ok: false, text: e.message };
		} finally {
			isActivatingRefDB = null;
		}
	}

	async function testSingleRefDB(id: string) {
		isTestingRefDB = id;
		refDBActionMessage = null;
		try {
			const res = await fetch(`/api/database/reference-dbs/${id}/test`, { method: "POST" });
			const data = await res.json();
			if (res.ok) {
				refDBActionMessage = { ok: true, text: data.message };
				await fetchReferenceDBs();
			} else {
				refDBActionMessage = { ok: false, text: data.error || "Gagal verifikasi koneksi" };
			}
		} catch (e: any) {
			refDBActionMessage = { ok: false, text: e.message };
		} finally {
			isTestingRefDB = null;
		}
	}

	async function deleteSingleRefDB(id: string) {
		if (!confirm("Hapus database referensi ini dari pool?")) return;
		try {
			const res = await fetch(`/api/database/reference-dbs/${id}`, { method: "DELETE" });
			const data = await res.json();
			if (res.ok) {
				refDBActionMessage = { ok: true, text: data.message };
				await fetchReferenceDBs();
			} else {
				refDBActionMessage = { ok: false, text: data.error };
			}
		} catch (e: any) {
			refDBActionMessage = { ok: false, text: e.message };
		}
	}

	async function handleCreateRefDB() {
		try {
			const res = await fetch("/api/database/reference-dbs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newRefDB)
			});
			const data = await res.json();
			if (res.ok) {
				refDBActionMessage = { ok: true, text: data.message };
				showAddRefModal = false;
				newRefDB = {
					name: "",
					platform: "postgres",
					host: "localhost",
					port: "5432",
					dbname: "",
					user: "postgres",
					password: "",
					sslmode: "disable",
					mode: "local",
					description: "",
					tns: "",
					service_name: ""
				};
				await fetchReferenceDBs();
			} else {
				refDBActionMessage = { ok: false, text: data.error || "Gagal menambahkan database" };
			}
		} catch (e: any) {
			refDBActionMessage = { ok: false, text: e.message };
		}
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
		// Only zoom when Ctrl or Cmd is held so normal page scrolling is not intercepted
		if (!e.ctrlKey && !e.metaKey) return;
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

	// Active reference DB derived from multi-reference pool
	const activeRef = $derived(referenceDBs.find(d => d.is_active) || null);

	// Live database test & SVG burst actions (Real telemetry & socket ping)
	async function runLiveTestDb1() {
		triggerDb1Burst();
		await testSystemConnection();
		await fetchConfigAndTelemetry();
	}

	async function runLiveTestDb2() {
		triggerDb2Burst();
		const active = referenceDBs.find(d => d.is_active);
		if (active) {
			await testSingleRefDB(active.id);
		} else {
			await testMCPReferenceConnection();
		}
		await fetchConfigAndTelemetry();
	}

	async function runLivePingAll() {
		await Promise.all([runLiveTestDb1(), runLiveTestDb2()]);
	}

	// Dynamic port switching based on database platform
	function handlePlatformChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value as typeof mcpPlatform;
		mcpPlatform = val;
		if (val === "postgres") {
			mcpConfig.port = "5432";
			mcpConfig.dbname = "novapilot_mcp_ref";
			mcpConfig.user = "postgres";
		} else if (val === "oracle") {
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
		postgres_invoicing: {
			name: "mutate_invoice_record",
			version: "1.4.0",
			category: "ERP_MUTATION",
			description: "Update customer name and invoice status on PostgreSQL (novapilot_mcp_ref) via parameterized query without raw SQL.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					invoice_no: { type: "string", description: "Official invoice document number e.g. INV/2026/001" },
					target_client: { type: "string", description: "New legal customer entity name" },
					revised_amount: { type: "number", description: "Revised amount if tax adjustment is needed" },
					operator_note: { type: "string", description: "Human reviewer approval note from on-call engineer" }
				},
				required: ["invoice_no", "target_client"]
			}
		},
		customer_master_query: {
			name: "query_customer_master",
			version: "1.2.0",
			category: "READ_ONLY_REFERENCE",
			description: "Read-only query for corporate legal name and tax registration number from novapilot_mcp_ref reference database.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					query: { type: "string", description: "Partial legal name or Tax ID e.g. Makmur or 01.234" },
					limit: { type: "integer", description: "Maximum reference records returned (default 10)" }
				},
				required: ["query"]
			}
		},
		oracle_invoicing: {
			name: "mutate_invoice_record",
			version: "1.4.0",
			category: "ERP_MUTATION",
			description: "Update customer name and invoice status on Oracle 19c Enterprise via parameterized query without raw SQL.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					invoice_no: { type: "string", description: "Official invoice document number e.g. INV/2026/001" },
					target_client: { type: "string", description: "New legal customer entity name" },
					revised_amount: { type: "number", description: "Revised amount if tax adjustment is needed" },
					operator_note: { type: "string", description: "Human reviewer approval note from on-call engineer" }
				},
				required: ["invoice_no", "target_client"]
			}
		},
		sap_bapi_customer: {
			name: "query_customer_master_bapi",
			version: "2.1.0",
			category: "SAP_RFC_CONNECTOR",
			description: "Read-only query for corporate legal name and tax registration number from SAP S/4HANA BAPI Gateway.",
			transport: "sse / http-rpc",
			inputSchema: {
				type: "object",
				properties: {
					customer_code: { type: "string", description: "SAP Customer Code e.g. CUST-8820" },
					tax_id: { type: "string", description: "15/16 digit Tax Registration Number" },
					company_code: { type: "string", description: "SAP business unit company code (default 1000)" }
				},
				required: ["customer_code"]
			}
		},
		tax_compliance_djp: {
			name: "verify_tax_registration",
			version: "1.1.0",
			category: "TAX_COMPLIANCE",
			description: "Validate Tax ID registration status and invoice compliance against enterprise reference database or DJP portal.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					tax_id: { type: "string", description: "15/16 digit Tax ID format" },
					invoice_serial: { type: "string", description: "Official tax invoice serial number (NSFP)" }
				},
				required: ["tax_id"]
			}
		},
		warehouse_stock_sync: {
			name: "sync_branch_stock",
			version: "1.0.0",
			category: "INVENTORY_SYNC",
			description: "Synchronize inventory balances and delivery documents between branch and central warehouse databases.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					branch_code: { type: "string", description: "Warehouse branch code (e.g. SBY-01, MDN-01)" },
					sku: { type: "string", description: "Product Stock Keeping Unit" },
					delta_quantity: { type: "number", description: "Stock balance adjustment delta" }
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
			console.error("Failed to fetch MCP tools:", e);
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
			uploadError = "Failed to read manifest file from disk.";
		};
		reader.readAsText(file);
	}

	async function registerUploadedMCPTool() {
		uploadError = null;
		uploadSuccess = null;

		if (!uploadManifestText.trim()) {
			uploadError = "Please enter or select an MCP manifest file first.";
			return;
		}

		let parsed: any;
		try {
			parsed = JSON.parse(uploadManifestText);
		} catch (err: any) {
			uploadError = `Invalid JSON format: ${err.message}. Ensure JSON conforms to MCP schema specifications.`;
			return;
		}

		if (!parsed.name) {
			uploadError = "Manifest must specify a 'name' attribute as the tool identifier.";
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
				uploadSuccess = `Tool '${parsed.name}' v${parsed.version || '1.0.0'} successfully registered to NovaPilot Protocol Catalog!`;
				uploadManifestText = "";
				await fetchMCPTools();
			} else {
				uploadError = data.error || "Failed to register tool to MCP server.";
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
					error: data.error || "Tool execution failed.",
					timestamp: new Date().toLocaleTimeString("en-US")
				};
			}
		} catch (err: any) {
			toolTestExecutionResult = {
				ok: false,
				error: `Network error: ${err.message}`,
				timestamp: new Date().toLocaleTimeString("en-US")
			};
		} finally {
			isExecutingToolTest = false;
		}
	}

	// =========================================================================
	// TABLES & CONFIG LOGIC
	// =========================================================================
	const systemTables = [
		{ name: "tickets", count: "~12 rows", desc: "Human-in-the-Loop staging queue, invoice mutation proposals, approval lifecycle" },
		{ name: "audit_logs", count: "~50 rows", desc: "Immutable digital audit log, HMAC digest, operator IP, RFC3339 timestamp" },
		{ name: "inbound_messages", count: "~85 rows", desc: "Omnichannel inbound message stream (WhatsApp, Telegram, Discord)" },
		{ name: "learned_patterns", count: "~6 rows", desc: "Dynamic regex rules and intent classifications from self-learning loop" },
		{ name: "documents", count: "~18 rows", desc: "Attachment metadata for receipts, PDF invoices, and OCR extraction summaries" }
	];

	let mcpReferenceTables = $state([
		{ name: "customer_master", desc: "Customer master records, legal corporate names, tax IDs (NPWP), enterprise status" },
		{ name: "erp_invoices", desc: "Operational ERP invoices, billing numbers, recipient names, amounts, OPEN/PAID status" },
		{ name: "tax_validations", desc: "Tax authority compliance database, VAT/taxpayer verification, electronic tax invoices" },
		{ name: "item_inventory", desc: "Spare parts SKU catalog, item descriptions, warehouse stock, reference price list" }
	]);

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
					mcpConfig.port = cfg.mcp_ref_db.port || "5432";
					mcpConfig.user = cfg.mcp_ref_db.user || "postgres";
					mcpConfig.dbname = cfg.mcp_ref_db.dbname || "novapilot_mcp_ref";
					mcpConfig.sslmode = cfg.mcp_ref_db.sslmode || "disable";
					mcpStatus = cfg.mcp_ref_db.status || "DISCONNECTED";

					// Dynamic detection of platform from backend response or port
					if (cfg.mcp_ref_db.platform) {
						mcpPlatform = cfg.mcp_ref_db.platform;
					} else if (mcpConfig.port === "5432") {
						mcpPlatform = "postgres";
					} else if (mcpConfig.port === "1521") {
						mcpPlatform = "oracle";
					} else if (mcpConfig.port === "3300") {
						mcpPlatform = "sap";
					} else if (mcpConfig.port === "3306") {
						mcpPlatform = "mysql";
					} else if (mcpConfig.port === "1433") {
						mcpPlatform = "mssql";
					}

					// Dynamic detection of tables from backend
					if (Array.isArray(cfg.mcp_ref_db.tables) && cfg.mcp_ref_db.tables.length > 0) {
						const tableDescMap: Record<string, string> = {
							customer_master: "Customer master records, legal corporate names, tax IDs (NPWP), enterprise status",
							erp_invoices: "Operational ERP invoices, billing numbers, recipient names, amounts, OPEN/PAID status",
							tax_validations: "Tax authority compliance database, VAT/taxpayer verification, electronic tax invoices",
							item_inventory: "Spare parts SKU catalog, item descriptions, warehouse stock, reference price list",
							invoices: "Operational invoices, billing numbers, customer names, amounts, OPEN/CLOSED status",
							branches: "Official enterprise plant/warehouse directory and whitelisted contact numbers"
						};
						mcpReferenceTables = cfg.mcp_ref_db.tables.map((tblName: string) => ({
							name: tblName,
							desc: tableDescMap[tblName] || "Enterprise MCP business reference data table"
						}));
					}
				}
			}

			if (telRes.ok) {
				telemetry = await telRes.json();
			}
		} catch (err) {
			console.error("Failed to load database configuration:", err);
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
					message: data.message || "System database connection verified successfully!",
					time: new Date().toLocaleTimeString("en-US")
				};
				sysStatus = "CONNECTED";
			} else {
				sysTestResult = {
					ok: false,
					message: data.error || "Failed to connect to system database.",
					time: new Date().toLocaleTimeString("en-US")
				};
				sysStatus = "DISCONNECTED";
			}
		} catch (err: any) {
			sysTestResult = {
				ok: false,
				message: `Network error: ${err.message}`,
				time: new Date().toLocaleTimeString("en-US")
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
					message: data.message || `${mcpPlatform.toUpperCase()} reference database connection verified via ${mcpMode.toUpperCase()} mode!`,
					time: new Date().toLocaleTimeString("en-US")
				};
				mcpStatus = "CONNECTED";
			} else {
				mcpTestResult = {
					ok: false,
					message: data.error || "Failed to connect to MCP reference database.",
					time: new Date().toLocaleTimeString("en-US")
				};
				mcpStatus = "DISCONNECTED";
			}
		} catch (err: any) {
			mcpTestResult = {
				ok: false,
				message: `Network error: ${err.message}`,
				time: new Date().toLocaleTimeString("en-US")
			};
			mcpStatus = "DISCONNECTED";
		} finally {
			isTestingMcp = false;
		}
	}

	async function applySystemConfig() {
		isApplyingSys = true;
		sysApplyResult = null;
		try {
			const res = await fetch("/api/database/apply", {
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
				sysApplyResult = {
					ok: true,
					message: data.message || "System Internal Database configuration applied and saved successfully!",
					time: new Date().toLocaleTimeString("en-US")
				};
				sysStatus = "CONNECTED";
				await fetchConfigAndTelemetry();
			} else {
				sysApplyResult = {
					ok: false,
					message: data.error || "Failed to apply system database configuration.",
					time: new Date().toLocaleTimeString("en-US")
				};
			}
		} catch (err: any) {
			sysApplyResult = {
				ok: false,
				message: `Network error: ${err.message}`,
				time: new Date().toLocaleTimeString("en-US")
			};
		} finally {
			isApplyingSys = false;
		}
	}

	async function applyMCPReferenceConfig() {
		isApplyingMcp = true;
		mcpApplyResult = null;
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

			const res = await fetch("/api/database/apply", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			const data = await res.json();
			if (data.ok) {
				mcpApplyResult = {
					ok: true,
					message: data.message || "MCP & ERP Reference Database configuration applied and ACTIVE LIVE!",
					time: new Date().toLocaleTimeString("en-US")
				};
				mcpStatus = "CONNECTED";
				await fetchConfigAndTelemetry();
			} else {
				mcpApplyResult = {
					ok: false,
					message: data.error || "Failed to apply MCP reference database configuration.",
					time: new Date().toLocaleTimeString("en-US")
				};
			}
		} catch (err: any) {
			mcpApplyResult = {
				ok: false,
				message: `Network error: ${err.message}`,
				time: new Date().toLocaleTimeString("en-US")
			};
		} finally {
			isApplyingMcp = false;
		}
	}

	function generateEnvSnippet() {
		let snippet = `# ============================================================
# 1. SYSTEM INTERNAL DATABASE (Required PostgreSQL - Locked Engine)
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
# 2. MCP REFERENCE DATABASE (ERP Invoices & Customer Master Records)
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
# SSH Tunnel Bastion Host Parameters (DMZ Jump Host)
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
		fetchReferenceDBs();
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
						{i18n.t.connectors.title}
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.connectors.subtitle}
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
				<span>{isLoadingConfig ? 'Reloading...' : 'Reload Status'}</span>
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
								{i18n.locale === 'id' ? 'Diagram Alur Konektor Dual-DB' : 'Dual-DB Connector Flow Diagram'}
							</h3>
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-primary/15 text-primary border border-primary/30">
								{i18n.locale === 'id' ? 'ARSITEKTUR REALTIME' : 'LIVE ARCHITECTURE'}
							</span>
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-secondary text-muted-foreground border border-border">
								PAN &amp; ZOOM
							</span>
						</div>
						<p class="text-xs text-muted-foreground mt-0.5">
							{i18n.locale === 'id' ? 'Visualisasi aliran data real-time, throughput soket, dan keamanan mutasi enterprise.' : 'Real-time data flow visualization, socket throughput, and enterprise mutation safety.'}
						</p>
					</div>
				</div>

				<!-- Visual Canvas Hints -->
				<div class="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-lg border border-border/50 shrink-0">
					<span>🖐️ {i18n.locale === 'id' ? 'Drag kanvas' : 'Drag to pan'}</span>
					<span class="text-border">•</span>
					<span>{i18n.locale === 'id' ? 'Ctrl + Scroll untuk zoom' : 'Ctrl + Scroll to zoom'} ({Math.round(zoom * 100)}%)</span>
				</div>
			</div>

			<!-- Tier 2: Dedicated Control & Simulation Toolbar Strip -->
			<div class="flex flex-wrap items-center justify-between gap-3 py-3.5 px-4 rounded-xl bg-secondary/40 dark:bg-muted/25 border border-border/70 shadow-2xs">
				<!-- Simulation Action Buttons -->
				<div class="flex items-center gap-2.5 flex-wrap text-xs font-mono">
					<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 hidden sm:inline">
						Live I/O & Ping:
					</span>

					<!-- DB 1 Live Ping Button -->
					<button
						type="button"
						onclick={runLiveTestDb1}
						disabled={isTestingSys || isSimulatingDb1}
						class="h-9 px-3.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50 text-xs"
						title="Uji live socket ping & transmisi data DB 1 (PostgreSQL Core)"
					>
						<span class="h-2.5 w-2.5 rounded-full {db1VisualState === 'CONNECTED' ? 'bg-emerald-500' : db1VisualState === 'PROCESSING' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'}"></span>
						<span>DB 1: Core</span>
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold {db1VisualState === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : db1VisualState === 'PROCESSING' ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'}">
							{db1VisualState}
						</span>
					</button>

					<!-- DB 2 Live Ping Button -->
					<button
						type="button"
						onclick={runLiveTestDb2}
						disabled={isTestingMcp || isSimulatingDb2 || isTestingRefDB !== null}
						class="h-9 px-3.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50 text-xs"
						title="Uji live socket ping & transmisi data DB 2 (MCP Reference / Oracle 11g)"
					>
						<span class="h-2.5 w-2.5 rounded-full {db2VisualState === 'CONNECTED' ? 'bg-cyan-500' : db2VisualState === 'PROCESSING' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'}"></span>
						<span>DB 2: {activeRef ? activeRef.name.split(' ')[0] : 'MCP Ref'}</span>
						<span class="text-[10px] px-1.5 py-0.5 rounded font-bold {db2VisualState === 'CONNECTED' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300' : db2VisualState === 'PROCESSING' ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'}">
							{db2VisualState}
						</span>
					</button>

					<!-- Live Ping Both DBs Button -->
					<button
						type="button"
						onclick={runLivePingAll}
						disabled={isTestingSys || isTestingMcp || isTestingRefDB !== null}
						class="h-9 px-3.5 py-1.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs text-xs disabled:opacity-50"
						title={i18n.locale === 'id' ? 'Uji konektivitas live socket & latensi roundtrip kedua database' : 'Test live socket & roundtrip latency for both databases'}
					>
						<Play class="h-3.5 w-3.5" />
						<span>{i18n.locale === 'id' ? 'Uji Koneksi Real-time (Live Ping)' : 'Live Ping All Databases'}</span>
					</button>
				</div>

				<!-- Quick Reset Pan & Zoom -->
				<div class="flex items-center gap-2 text-xs font-mono ml-auto">
					<button
						type="button"
						onclick={resetPanZoom}
						class="h-9 px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors cursor-pointer shadow-2xs"
						title={i18n.locale === 'id' ? 'Reset viewport kanvas (100%)' : 'Reset canvas viewport (100%)'}
					>
						{i18n.locale === 'id' ? 'Reset Tampilan' : 'Reset View'} ({Math.round(zoom * 100)}%)
					</button>
				</div>
			</div>
		</div>

		<!-- Status Legend Bar -->
		<div class="flex items-center justify-between text-xs px-1 text-muted-foreground flex-wrap gap-2 pt-0.5">
			<div class="flex items-center gap-3 text-[11px] font-mono flex-wrap">
				<span class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
					<span class="text-foreground font-medium">{i18n.locale === 'id' ? 'Terhubung:' : 'Connected:'}</span> {i18n.locale === 'id' ? 'Pipeline data aktif & platter operasional' : 'Active data pipeline & operational platter'}
				</span>
				<span class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
					<span class="text-foreground font-medium">{i18n.locale === 'id' ? 'Memproses:' : 'Processing:'}</span> {i18n.locale === 'id' ? 'Strobe burst I/O & seek laser cepat' : 'I/O strobe burst & rapid laser seek'}
				</span>
				<span class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-rose-500"></span>
					<span class="text-foreground font-medium">{i18n.locale === 'id' ? 'Terputus:' : 'Disconnected:'}</span> {i18n.locale === 'id' ? 'Tautan terputus (nol paket, platter nonaktif)' : 'Severed link (zero packets, inactive platter)'}
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
			<div class="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-md text-xs font-mono">
				<button 
					type="button"
					onclick={zoomIn} 
					class="h-8 w-8 rounded-lg hover:bg-muted text-foreground flex items-center justify-center font-bold text-base cursor-pointer transition-colors shadow-2xs" 
					title={i18n.locale === 'id' ? 'Perbesar (+)' : 'Zoom In (+)'}
				>
					+
				</button>
				<button 
					type="button"
					onclick={zoomOut} 
					class="h-8 w-8 rounded-lg hover:bg-muted text-foreground flex items-center justify-center font-bold text-base cursor-pointer transition-colors shadow-2xs" 
					title={i18n.locale === 'id' ? 'Perkecil (-)' : 'Zoom Out (-)'}
				>
					-
				</button>
				<button 
					type="button"
					onclick={resetPanZoom} 
					class="h-8 px-2.5 rounded-lg hover:bg-muted text-foreground flex items-center justify-center font-semibold text-xs cursor-pointer transition-colors shadow-2xs" 
					title={i18n.locale === 'id' ? 'Reset Zoom & Posisi (100%)' : 'Reset Zoom & Position (100%)'}
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
							🗄️ System Internal Database (PostgreSQL 14–18 Core - Locked)
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
								• Tables: tickets, audit_logs (HMAC Signed), inbound_messages, learned_patterns
							</text>
							<text x="0" y="50" font-family="monospace" font-size="10.5" fill="#10b981" font-weight="bold">
								✓ Transactional ACID Staging Store • Atomic Rollback Guard
							</text>
							<!-- Realtime Health Notice -->
							<text x="0" y="66" font-family="monospace" font-size="10" fill={db1VisualState === 'DISCONNECTED' ? '#ef4444' : 'currentColor'} class={db1VisualState === 'DISCONNECTED' ? '' : 'text-muted-foreground'}>
								{#if db1VisualState === 'CONNECTED'}
									✓ Pool Conns: {telemetry?.database?.in_use || 0} in use, {telemetry?.database?.idle || 0} idle • Ping Latency: {telemetry?.database?.latency_ms ?? sysTestResult?.latency_ms ?? 1}ms
								{:else if db1VisualState === 'PROCESSING'}
									⚡ Executing Ticket Staging Query &amp; Signing Audit Logs...
								{:else}
									✕ Database Server Not Connected • Verify PostgreSQL is active on port 5432
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
							🏢 MCP Reference &amp; ERP Database ({activeRef ? activeRef.name : (mcpPlatform === 'postgres' ? `PostgreSQL 16/18 (${mcpConfig.dbname})` : mcpPlatform === 'oracle' ? 'Oracle 11g Enterprise' : mcpPlatform === 'sap' ? 'SAP S/4HANA' : mcpPlatform === 'mysql' ? 'MySQL Cluster' : mcpPlatform === 'mssql' ? 'MS SQL Server' : mcpConfig.dbname)})
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
								Host: {activeRef ? (activeRef.tns ? `${activeRef.host}:${activeRef.port} (TNS: ${activeRef.service_name || activeRef.dbname})` : `${activeRef.host}:${activeRef.port}/${activeRef.dbname}`) : `${mcpConfig.host}:${mcpConfig.port}/${mcpConfig.dbname}`} • Driver: {activeRef ? activeRef.platform.toUpperCase() : mcpPlatform.toUpperCase()}
							</text>
							<text x="0" y="34" font-family="monospace" font-size="11" fill="currentColor" class="text-muted-foreground">
								• Reference Tables: {mcpReferenceTables.map(t => t.name).join(', ')}
							</text>
							<text x="0" y="50" font-family="monospace" font-size="10.5" fill="#2563eb" font-weight="bold">
								🔒 Fully Isolated Behind MCP Protocol • Parameterized Prepared Statements Only
							</text>
							<!-- Realtime Health Notice -->
							<text x="0" y="66" font-family="monospace" font-size="10" fill={db2VisualState === 'DISCONNECTED' ? '#ef4444' : 'currentColor'} class={db2VisualState === 'DISCONNECTED' ? '' : 'text-muted-foreground'}>
								{#if db2VisualState === 'CONNECTED'}
									✓ Verified Enterprise Reference DB • Ping Latency: {activeRef?.latency_ms ?? telemetry?.reference_database?.latency_ms ?? mcpTestResult?.latency_ms ?? 4}ms • Protocol Active
								{:else if db2VisualState === 'PROCESSING'}
									⚡ Executing Verified Mutation via MCP Protocol RPC...
								{:else}
									✕ Disconnected • Configure Platform &amp; Test Connection in Tab 2
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
						<div class="text-xs font-bold text-foreground">System Internal Database</div>
						<div class="text-[11px] font-mono text-muted-foreground">{sysConfig.host}:{sysConfig.port}/{sysConfig.dbname} (PostgreSQL)</div>
					</div>
				</div>

				<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold {sysStatus === 'CONNECTED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'}">
					● {sysStatus}
				</span>
			</div>

			<div class="text-[11px] text-muted-foreground leading-relaxed">
				Houses approval tickets, HMAC audit trails, chatops raw messages, and self-learning regex patterns.
			</div>

			<div class="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
				<span class="font-mono text-muted-foreground">Pool: {telemetry?.database?.open_connections || 0} / {telemetry?.database?.max_open || 25} conns</span>
				<button
					type="button"
					onclick={() => activeTab = "system"}
					class="text-xs text-primary hover:underline font-medium cursor-pointer"
				>
					System Configuration &rarr;
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
						<div class="text-xs font-bold text-foreground">MCP Reference Database</div>
						<div class="text-[11px] font-mono text-muted-foreground">
							{mcpConfig.host}:{mcpConfig.port}/{mcpConfig.dbname} ({mcpPlatform.toUpperCase()})
						</div>
					</div>
				</div>

				{#if mcpStatus === 'CONNECTED'}
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
						● CONNECTED (LIVE)
					</span>
				{:else}
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
						● DISCONNECTED (OFFLINE)
					</span>
				{/if}
			</div>

			<div class="text-[11px] text-muted-foreground leading-relaxed">
				Controlled business invoice and customer master reference data accessed via MCP tools (Zero Raw SQL).
			</div>

			<div class="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
				<span class="font-mono text-muted-foreground">Mode: {mcpMode === 'ssh' ? 'SSH Tunnel' : mcpMode === 'ssl' ? 'SSL/TLS' : 'Local Direct'}</span>
				<button
					type="button"
					onclick={() => activeTab = "mcp"}
					class="text-xs text-primary hover:underline font-medium cursor-pointer"
				>
					Setup MCP Reference &rarr;
				</button>
			</div>
		</div>
	</div>

	<!-- Navigation Tabs: 4 Distinct Workflows -->
	<div class="flex items-center gap-2 border-b border-border/50 pb-2 text-xs font-semibold overflow-x-auto">
		<button
			type="button"
			onclick={() => activeTab = "system"}
			class="px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'system' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<ServerStack class="h-4 w-4" />
			<span>1. {i18n.t.connectors.tab_system}</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "mcp"}
			class="px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'mcp' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CircleStack class="h-4 w-4" />
			<span>2. {i18n.t.connectors.tab_mcp}</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "mcp_tools"}
			class="px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'mcp_tools' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CommandLine class="h-4 w-4" />
			<span>3. {i18n.t.connectors.tab_tools} ({mcpTools.length})</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "env"}
			class="px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'env' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<ClipboardDocument class="h-4 w-4" />
			<span>4. {i18n.t.connectors.tab_env}</span>
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
						<h2 class="text-sm font-bold text-foreground">System Internal Database Connection Parameters</h2>
						<p class="text-xs text-muted-foreground">PostgreSQL connection utilized by the Go server for operational ticketing, sessions, and HMAC audit trails.</p>
					</div>
					<div class="flex items-center gap-2">
						<span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold {sysStatus === 'CONNECTED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'}">
							● {sysStatus}
						</span>
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
								<span>{sysTestResult.ok ? 'SYSTEM CONNECTION VERIFIED' : 'FAILED TO CONNECT TO SYSTEM'}</span>
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
						<strong>Core Engine Requirement:</strong> System internal database strictly requires <strong>PostgreSQL (v14–v18)</strong> to guarantee ACID transactional integrity for ticket queues, HMAC immutable audit signing, and AI regex pattern persistence. This engine type is <strong>permanently locked</strong> and cannot be modified.
					</div>
				</div>

				<!-- Inputs Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
					<!-- Locked Engine Selector -->
					<div class="space-y-1 sm:col-span-2 md:col-span-3">
						<label for="sys-engine" class="font-semibold text-muted-foreground flex items-center justify-between">
							<span>Database Engine Type:</span>
							<span class="text-[10px] text-amber-500 font-mono font-bold flex items-center gap-1">
								<LockClosed class="h-3 w-3" /> REQUIRED / LOCKED (POSTGRESQL ONLY)
							</span>
						</label>
						<div class="relative">
							<select
								id="sys-engine"
								disabled
								class="w-full h-9 px-3 pr-8 rounded-lg border border-input bg-muted/70 text-foreground font-mono text-xs cursor-not-allowed opacity-90 select-none"
							>
								<option value="postgres" selected>PostgreSQL 14 - 18 (Core Engine Requirement - Locked)</option>
							</select>
							<LockClosed class="h-4 w-4 text-amber-500 absolute right-2.5 top-2.5 pointer-events-none" />
						</div>
					</div>

					<div class="space-y-1">
						<label for="sys-host" class="font-semibold text-muted-foreground">System Host:</label>
						<input
							id="sys-host"
							type="text"
							bind:value={sysConfig.host}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="localhost"
						/>
					</div>

					<div class="space-y-1">
						<label for="sys-port" class="font-semibold text-muted-foreground">System Port:</label>
						<input
							id="sys-port"
							type="text"
							bind:value={sysConfig.port}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="5432"
						/>
					</div>

					<div class="space-y-1">
						<label for="sys-dbname" class="font-semibold text-muted-foreground">Database Name:</label>
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
								title={showSysPass ? "Hide Password" : "Show Password"}
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
						<CustomSelect
							id="sys-sslmode"
							bind:value={sysConfig.sslmode}
							options={["disable", "require", "verify-ca", "verify-full"]}
						/>
					</div>
				</div>

				<!-- Apply Result Banner -->
				{#if sysApplyResult}
					<div class="p-3.5 rounded-xl border flex items-start gap-3 text-xs {sysApplyResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
						{#if sysApplyResult.ok}
							<CheckCircle class="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
						{:else}
							<XCircle class="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
						{/if}
						<div class="flex-1 font-mono">
							<div class="font-bold flex items-center justify-between">
								<span>{sysApplyResult.ok ? 'SYSTEM CONFIGURATION APPLIED SUCCESSFULLY' : 'FAILED TO APPLY CONFIGURATION'}</span>
								<span class="text-[10px] opacity-75">{sysApplyResult.time}</span>
							</div>
							<div class="mt-1">{sysApplyResult.message}</div>
						</div>
						<button
							type="button"
							onclick={() => sysApplyResult = null}
							class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground cursor-pointer"
						>
							<XMark class="h-4 w-4" />
						</button>
					</div>
				{/if}

				<!-- Action Toolbar: Test & Apply -->
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-secondary/50 border border-border/80 shadow-2xs">
					<div class="text-xs text-muted-foreground flex items-center gap-2">
						<span class="h-2.5 w-2.5 rounded-full {sysStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
						<span>Active Status: <strong class="text-foreground font-mono">{sysStatus}</strong> ({sysConfig.dbname})</span>
					</div>
					<div class="flex items-center gap-2.5 flex-wrap justify-end">
						<button
							type="button"
							onclick={testSystemConnection}
							disabled={isTestingSys}
							class="h-10 px-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
						>
							<ArrowPath class="h-4 w-4 {isTestingSys ? 'animate-spin' : ''}" />
							<span>{isTestingSys ? 'Testing Connection...' : '⚡ Test Connection'}</span>
						</button>
						<button
							type="button"
							onclick={applySystemConfig}
							disabled={isApplyingSys}
							class="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
						>
							<Check class="h-4 w-4" />
							<span>{isApplyingSys ? 'Applying...' : 'Apply & Save'}</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Pool Telemetry Stats -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="flex items-center justify-between pb-2 border-b border-border/50">
					<div class="text-xs font-bold text-foreground">System Database Connection Pool Metrics (Live)</div>
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

			<!-- System Managed Tables -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="text-xs font-bold text-foreground">Tables Managed by Internal System ({systemTables.length})</div>
				<div class="rounded-xl border border-border/60 overflow-hidden">
					<table class="w-full text-xs text-left">
						<thead class="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-mono border-b border-border/50">
							<tr>
								<th class="py-2.5 px-3.5 font-bold">Table Name</th>
								<th class="py-2.5 px-3.5 font-bold">Estimated Rows</th>
								<th class="py-2.5 px-3.5 font-bold">Description &amp; Role</th>
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
			<!-- Multi-Reference Database Pool Section -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
					<div class="space-y-0.5">
						<div class="flex items-center gap-2">
							<h2 class="text-sm font-bold text-foreground">Multi-Source Enterprise Reference Database Pool</h2>
							<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
								{referenceDBs.length} SOURCE{referenceDBs.length === 1 ? '' : 'S'}
							</span>
						</div>
						<p class="text-xs text-muted-foreground">
							Kelola berbagai database referensi (ERP SAP, Oracle Finance, PostgreSQL Warehouse, MySQL CRM). Agent MCP membaca data dari database yang sedang diaktifkan.
						</p>
					</div>

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={fetchReferenceDBs}
							disabled={isLoadingRefDBs}
							class="h-9 px-3.5 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
						>
							<ArrowPath class="h-3.5 w-3.5 {isLoadingRefDBs ? 'animate-spin' : ''}" />
							<span>{isLoadingRefDBs ? 'Refreshing...' : 'Refresh Pool'}</span>
						</button>

						<button
							type="button"
							onclick={() => showAddRefModal = true}
							class="h-9 px-4.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
						>
							<Plus class="h-4 w-4" />
							<span>Tambah Database</span>
						</button>
					</div>
				</div>

				<!-- Action Result Feedback Notification -->
				{#if refDBActionMessage}
					<div class="p-3 rounded-xl border flex items-center justify-between text-xs {refDBActionMessage.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
						<div class="flex items-center gap-2">
							{#if refDBActionMessage.ok}
								<CheckCircle class="h-4 w-4 text-emerald-500 shrink-0" />
							{:else}
								<XCircle class="h-4 w-4 text-rose-500 shrink-0" />
							{/if}
							<span>{refDBActionMessage.text}</span>
						</div>
						<button
							type="button"
							onclick={() => refDBActionMessage = null}
							class="text-muted-foreground hover:text-foreground cursor-pointer"
						>
							<XMark class="h-4 w-4" />
						</button>
					</div>
				{/if}

				<!-- Pool Grid of Reference Databases -->
				{#if referenceDBs.length === 0 && !isLoadingRefDBs}
					<div class="p-8 text-center rounded-xl border border-dashed border-border/80 bg-secondary/20 space-y-3">
						<CircleStack class="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
						<div class="text-xs font-bold text-foreground">Belum ada database referensi tambahan di pool</div>
						<p class="text-xs text-muted-foreground max-w-md mx-auto">
							Daftarkan database Oracle, SAP HANA, MySQL CRM, atau PostgreSQL tambahan agar AI Agent dapat memverifikasi faktur lintas sistem.
						</p>
						<button
							type="button"
							onclick={() => showAddRefModal = true}
							class="h-9 px-4.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
						>
							<Plus class="h-3.5 w-3.5" />
							<span>Tambah Database Pertama</span>
						</button>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each referenceDBs as db}
							{@const isActive = db.is_active}
							<div 
								class="p-4 rounded-xl border transition-all duration-200 relative flex flex-col justify-between space-y-3 shadow-2xs cursor-pointer group {isActive ? 'border-cyan-500/70 bg-cyan-500/5 ring-2 ring-cyan-500/20' : 'border-border/70 bg-secondary/30 hover:border-cyan-500/50 hover:bg-secondary/60'}"
								onclick={() => openEditRefModal(db)}
								role="button"
								tabindex="0"
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditRefModal(db); } }}
								title="Klik untuk membuka editor konfigurasi database ini"
							>
								<!-- Card Top: Brand Icon + Platform Badge + Active State -->
								<div class="flex items-start justify-between gap-2">
									<div class="flex items-center gap-2.5">
										<div class="p-1.5 rounded-lg bg-background border border-border/60 shadow-2xs group-hover:border-cyan-500/40 transition-colors">
											<BrandIcon name={db.platform} class="h-6 w-6" />
										</div>
										<div>
											<div class="text-xs font-bold text-foreground leading-snug flex items-center gap-1.5">
												<span>{db.name}</span>
												<PencilSquare class="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
											</div>
											<div class="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
												<span>{db.platform}</span>
												<span>•</span>
												<span class="text-cyan-600 dark:text-cyan-400 font-bold">{db.mode}</span>
											</div>
										</div>
									</div>

									{#if isActive}
										<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shrink-0">
											<Star class="h-3 w-3 fill-current" />
											<span>ACTIVE</span>
										</span>
									{:else}
										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); activateReferenceDB(db.id); }}
											disabled={isActivatingRefDB === db.id}
											class="h-7.5 px-3 rounded-lg text-xs font-semibold bg-secondary hover:bg-primary hover:text-primary-foreground border border-border text-foreground transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
											title="Aktifkan sebagai database referensi utama untuk agent MCP"
										>
											<Play class="h-3 w-3" />
											<span>{isActivatingRefDB === db.id ? 'Mengaktifkan...' : 'Aktifkan'}</span>
										</button>
									{/if}
								</div>

								<!-- Card Body: Connection Spec -->
								<div class="p-2.5 rounded-lg bg-background/80 border border-border/50 font-mono text-[11px] space-y-1">
									<div class="flex items-center justify-between text-muted-foreground">
										<span>Target:</span>
										<span class="text-foreground font-semibold truncate max-w-[170px]">{db.host}:{db.port}</span>
									</div>
									<div class="flex items-center justify-between text-muted-foreground">
										<span>Database:</span>
										<span class="text-cyan-600 dark:text-cyan-400 font-bold truncate max-w-[170px]">{db.dbname}</span>
									</div>
									<div class="flex items-center justify-between text-muted-foreground">
										<span>User:</span>
										<span class="text-foreground truncate max-w-[170px]">{db.user}</span>
									</div>
									{#if db.description}
										<div class="pt-1 border-t border-border/40 text-[10px] font-sans text-muted-foreground line-clamp-2">
											{db.description}
										</div>
									{/if}
								</div>

								<!-- Card Footer: Edit, Test & Delete Actions -->
								<div class="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
									<div class="flex items-center gap-1.5 font-mono text-[10px]">
										<span class="h-2 w-2 rounded-full {db.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-zinc-400'}"></span>
										<span class="{db.status === 'CONNECTED' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}">{db.status || 'UNTESTED'}</span>
										{#if db.latency_ms}
											<span class="text-muted-foreground">({db.latency_ms}ms)</span>
										{/if}
									</div>

									<div class="flex items-center gap-1.5">
										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); openEditRefModal(db); }}
											class="h-8 px-3 rounded-lg text-xs font-semibold bg-secondary hover:bg-muted border border-border text-foreground flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
											title="Edit konfigurasi koneksi database ini"
										>
											<PencilSquare class="h-3.5 w-3.5 text-cyan-500" />
											<span>Edit</span>
										</button>

										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); testSingleRefDB(db.id); }}
											disabled={isTestingRefDB === db.id}
											class="h-8 px-3 rounded-lg text-xs font-semibold bg-secondary hover:bg-muted border border-border text-foreground flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
											title="Uji koneksi jaringan ke endpoint ini"
										>
											<ArrowPath class="h-3.5 w-3.5 {isTestingRefDB === db.id ? 'animate-spin text-cyan-500' : ''}" />
											<span>{isTestingRefDB === db.id ? 'Testing...' : 'Uji'}</span>
										</button>

										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); deleteSingleRefDB(db.id); }}
											class="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 flex items-center justify-center transition-all cursor-pointer"
											title="Hapus dari pool"
										>
											<Trash class="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- MODAL: Tambah Database Referensi Baru -->
			{#if showAddRefModal}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
					<div class="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
						<div class="flex items-center justify-between pb-3 border-b border-border/50">
							<div class="flex items-center gap-2">
								<CircleStack class="h-5 w-5 text-cyan-500" />
								<h3 class="text-base font-bold text-foreground">Tambah Database Referensi ke Pool</h3>
							</div>
							<button
								type="button"
								onclick={() => showAddRefModal = false}
								class="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
							>
								<XMark class="h-4 w-4" />
							</button>
						</div>

						<form onsubmit={(e) => { e.preventDefault(); handleCreateRefDB(); }} class="space-y-4 text-xs">
							<!-- Platform Selector with Official Brand Icons -->
							<div class="space-y-1.5">
								<label for="new-ref-platform" class="font-bold text-foreground flex items-center justify-between">
									<span>Platform Database:</span>
									<span class="text-[10px] text-cyan-500 font-mono font-bold">BRANDED ICON SELECTOR</span>
								</label>
								<DatabasePlatformSelect
									id="new-ref-platform"
									bind:value={newRefDB.platform}
									onchange={(opt) => {
										newRefDB.port = opt.defaultPort;
									}}
								/>
							</div>

							<!-- Database Alias / Name -->
							<div class="space-y-1">
								<label for="new-ref-name" class="font-semibold text-muted-foreground">Label / Nama Database (e.g. ERP Finance, SAP Materials):</label>
								<input
									id="new-ref-name"
									type="text"
									required
									bind:value={newRefDB.name}
									placeholder="Contoh: Oracle ERP Keuangan Pusat"
									class="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:outline-none"
								/>
							</div>

							<!-- Oracle TNS Connect Descriptor (If Oracle Platform) -->
							{#if newRefDB.platform === 'oracle'}
								<div class="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
									<div class="flex items-center justify-between">
										<label for="new-ref-tns" class="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
											<BrandIcon name="oracle" class="h-4 w-4" />
											<span>Oracle TNS Connect Descriptor (ezConnect / TNS):</span>
										</label>
										<span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">AUTO-PARSE</span>
									</div>
									<textarea
										id="new-ref-tns"
										bind:value={newRefDB.tns}
										oninput={handleNewRefTNSInput}
										rows={3}
										placeholder="(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.20.173.35)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=HBS)))"
										class="w-full p-2.5 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									></textarea>
									<p class="text-[10px] text-muted-foreground">
										Format TNS Oracle 11g diekstrak otomatis: Host (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{newRefDB.host || '-'}</span>), Port (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{newRefDB.port || '-'}</span>), Service (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{newRefDB.service_name || newRefDB.dbname || '-'}</span>).
									</p>
								</div>
							{/if}

							<!-- Host & Port -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div class="sm:col-span-2 space-y-1">
									<label for="new-ref-host" class="font-semibold text-muted-foreground">Host / IP Address:</label>
									<input
										id="new-ref-host"
										type="text"
										required
										bind:value={newRefDB.host}
										placeholder="erp-db.internal atau 10.0.1.50"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
								<div class="space-y-1">
									<label for="new-ref-port" class="font-semibold text-muted-foreground">Port:</label>
									<input
										id="new-ref-port"
										type="text"
										required
										bind:value={newRefDB.port}
										placeholder="1521"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
							</div>

							<!-- DB Name & User -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="space-y-1">
									<label for="new-ref-dbname" class="font-semibold text-muted-foreground">Nama Database / SID / PDB:</label>
									<input
										id="new-ref-dbname"
										type="text"
										required
										bind:value={newRefDB.dbname}
										placeholder="ERP_PROD_PDB"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
								<div class="space-y-1">
									<label for="new-ref-user" class="font-semibold text-muted-foreground">Username Kredensial:</label>
									<input
										id="new-ref-user"
										type="text"
										required
										bind:value={newRefDB.user}
										placeholder="mcp_reader"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Password & SSL Mode -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="space-y-1">
									<label for="new-ref-password" class="font-semibold text-muted-foreground">Password:</label>
									<div class="relative">
										<input
											id="new-ref-password"
											type={showNewRefPass ? "text" : "password"}
											bind:value={newRefDB.password}
											placeholder="••••••••"
											class="w-full h-9 px-3 pr-9 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
										/>
										<button
											type="button"
											onclick={() => showNewRefPass = !showNewRefPass}
											class="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
										>
											{#if showNewRefPass}
												<EyeSlash class="h-4 w-4" />
											{:else}
												<Eye class="h-4 w-4" />
											{/if}
										</button>
									</div>
								</div>
								<div class="space-y-1">
									<label for="new-ref-sslmode" class="font-semibold text-muted-foreground">SSL / TLS Mode:</label>
									<CustomSelect
										id="new-ref-sslmode"
										bind:value={newRefDB.sslmode}
										options={["disable", "require", "verify-ca", "verify-full"]}
									/>
								</div>
							</div>

							<!-- Mode Selector & Description -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div class="space-y-1">
									<label for="new-ref-mode" class="font-semibold text-muted-foreground">Konektivitas:</label>
									<CustomSelect
										id="new-ref-mode"
										bind:value={newRefDB.mode}
										options={[
											{ value: "local", label: "Direct LAN / Local" },
											{ value: "ssl", label: "Encrypted SSL/TLS" },
											{ value: "ssh", label: "SSH Bastion Tunnel" }
										]}
									/>
								</div>
								<div class="sm:col-span-2 space-y-1">
									<label for="new-ref-desc" class="font-semibold text-muted-foreground">Keterangan / Scope Data (Opsional):</label>
									<input
										id="new-ref-desc"
										type="text"
										bind:value={newRefDB.description}
										placeholder="Contoh: Faktur pajak dan master vendor wilayah timur"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
								<button
									type="button"
									onclick={() => showAddRefModal = false}
									class="h-10 px-4.5 rounded-xl border border-border text-foreground hover:bg-muted font-semibold text-xs transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button
									type="submit"
									class="h-10 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
								>
									<Plus class="h-4 w-4" />
									<span>Simpan ke Pool</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			{/if}

			<!-- MODAL: Edit Database Referensi Pool -->
			{#if showEditRefModal && editingRefDB}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
					<div class="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
						<div class="flex items-center justify-between pb-3 border-b border-border/50">
							<div class="flex items-center gap-2.5">
								<div class="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
									<PencilSquare class="h-5 w-5" />
								</div>
								<div>
									<h3 class="text-base font-bold text-foreground">Edit Database Referensi Pool</h3>
									<p class="text-[11px] text-muted-foreground font-mono">{editingRefDB.id} • {editingRefDB.name}</p>
								</div>
							</div>
							<button
								type="button"
								onclick={() => { showEditRefModal = false; editingRefDB = null; }}
								class="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
							>
								<XMark class="h-4 w-4" />
							</button>
						</div>

						<!-- Test Connection Banner in Modal -->
						{#if editTestResult}
							<div class="p-3.5 rounded-xl border flex items-start gap-2.5 text-xs {editTestResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
								{#if editTestResult.ok}
									<CheckCircle class="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
								{:else}
									<XCircle class="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
								{/if}
								<div class="flex-1 font-mono">
									<div class="font-bold flex items-center justify-between">
										<span>{editTestResult.ok ? 'KONEKSI BERHASIL TERVERIFIKASI' : 'GAGAL TERKONEKSI'}</span>
										{#if editTestResult.latency_ms}
											<span class="opacity-80">({editTestResult.latency_ms}ms)</span>
										{/if}
									</div>
									<div class="mt-1 text-[11px]">{editTestResult.message}</div>
								</div>
								<button
									type="button"
									onclick={() => editTestResult = null}
									class="text-muted-foreground hover:text-foreground cursor-pointer"
								>
									<XMark class="h-3.5 w-3.5" />
								</button>
							</div>
						{/if}

						<form onsubmit={(e) => { e.preventDefault(); handleUpdateRefDB(); }} class="space-y-4 text-xs">
							<!-- Platform Selector with Official Brand Icons -->
							<div class="space-y-1.5">
								<label for="edit-ref-platform" class="font-bold text-foreground flex items-center justify-between">
									<span>Platform Database:</span>
									<span class="text-[10px] text-cyan-500 font-mono font-bold">PLATFORM SELECTOR</span>
								</label>
								<DatabasePlatformSelect
									id="edit-ref-platform"
									bind:value={editingRefDB.platform}
									onchange={(opt) => {
										if (editingRefDB) editingRefDB.port = opt.defaultPort;
									}}
								/>
							</div>

							<!-- Database Alias / Name -->
							<div class="space-y-1">
								<label for="edit-ref-name" class="font-semibold text-muted-foreground">Label / Nama Database:</label>
								<input
									id="edit-ref-name"
									type="text"
									required
									bind:value={editingRefDB.name}
									placeholder="Contoh: Oracle 11g Enterprise Test Database"
									class="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:outline-none"
								/>
							</div>

							<!-- Oracle TNS Connect Descriptor (If Oracle Platform) -->
							{#if editingRefDB.platform === 'oracle'}
								<div class="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
									<div class="flex items-center justify-between">
										<label for="edit-ref-tns" class="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
											<BrandIcon name="oracle" class="h-4 w-4" />
											<span>Oracle TNS Connect Descriptor (ezConnect / TNS):</span>
										</label>
										<span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">AUTO-PARSE</span>
									</div>
									<textarea
										id="edit-ref-tns"
										bind:value={editingRefDB.tns}
										oninput={handleEditTNSInput}
										rows={4}
										placeholder="(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.20.173.35)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=HBS)))"
										class="w-full p-2.5 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									></textarea>
									<p class="text-[10px] text-muted-foreground">
										Format TNS Oracle 11g diekstrak otomatis: Host (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{editingRefDB.host || '-'}</span>), Port (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{editingRefDB.port || '-'}</span>), Service (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{editingRefDB.service_name || editingRefDB.dbname || '-'}</span>).
									</p>
								</div>
							{/if}

							<!-- Host & Port -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div class="sm:col-span-2 space-y-1">
									<label for="edit-ref-host" class="font-semibold text-muted-foreground">Host / IP Address:</label>
									<input
										id="edit-ref-host"
										type="text"
										required
										bind:value={editingRefDB.host}
										placeholder="172.20.173.35"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
								<div class="space-y-1">
									<label for="edit-ref-port" class="font-semibold text-muted-foreground">Port:</label>
									<input
										id="edit-ref-port"
										type="text"
										required
										bind:value={editingRefDB.port}
										placeholder="1521"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
							</div>

							<!-- DB Name & User -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="space-y-1">
									<label for="edit-ref-dbname" class="font-semibold text-muted-foreground">Database / Service Name / SID:</label>
									<input
										id="edit-ref-dbname"
										type="text"
										required
										bind:value={editingRefDB.dbname}
										placeholder="HAWILA_TEST"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
								<div class="space-y-1">
									<label for="edit-ref-user" class="font-semibold text-muted-foreground">Username Kredensial:</label>
									<input
										id="edit-ref-user"
										type="text"
										required
										bind:value={editingRefDB.user}
										placeholder="HBS_TEST"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Password & SSL Mode -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="space-y-1">
									<label for="edit-ref-password" class="font-semibold text-muted-foreground">Password Kredensial:</label>
									<div class="relative">
										<input
											id="edit-ref-password"
											type={showEditRefPass ? "text" : "password"}
											bind:value={editingRefDB.password}
											placeholder="••••••••"
											class="w-full h-9 px-3 pr-9 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
										/>
										<button
											type="button"
											onclick={() => showEditRefPass = !showEditRefPass}
											class="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
										>
											{#if showEditRefPass}
												<EyeSlash class="h-4 w-4" />
											{:else}
												<Eye class="h-4 w-4" />
											{/if}
										</button>
									</div>
								</div>
								<div class="space-y-1">
									<label for="edit-ref-sslmode" class="font-semibold text-muted-foreground">SSL / TLS Mode:</label>
									<CustomSelect
										id="edit-ref-sslmode"
										bind:value={editingRefDB.sslmode}
										options={["disable", "require", "verify-ca", "verify-full"]}
									/>
								</div>
							</div>

							<!-- Mode Selector & Description -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div class="space-y-1">
									<label for="edit-ref-mode" class="font-semibold text-muted-foreground">Konektivitas:</label>
									<CustomSelect
										id="edit-ref-mode"
										bind:value={editingRefDB.mode}
										options={[
											{ value: "local", label: "Direct LAN / Local" },
											{ value: "ssl", label: "Encrypted SSL/TLS" },
											{ value: "ssh", label: "SSH Bastion Tunnel" }
										]}
									/>
								</div>
								<div class="sm:col-span-2 space-y-1">
									<label for="edit-ref-desc" class="font-semibold text-muted-foreground">Keterangan / Scope Data:</label>
									<input
										id="edit-ref-desc"
										type="text"
										bind:value={editingRefDB.description}
										placeholder="Contoh: Oracle 11g Enterprise Test Database"
										class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex items-center justify-between gap-2.5 pt-3 border-t border-border/50">
								<button
									type="button"
									onclick={testEditingRefDB}
									disabled={isTestingEditRefDB}
									class="h-10 px-4.5 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
								>
									<ArrowPath class="h-4 w-4 {isTestingEditRefDB ? 'animate-spin text-cyan-500' : ''}" />
									<span>{isTestingEditRefDB ? 'Menguji Koneksi...' : 'Uji Koneksi'}</span>
								</button>

								<div class="flex items-center gap-2.5">
									<button
										type="button"
										onclick={() => { showEditRefModal = false; editingRefDB = null; }}
										class="h-10 px-4.5 rounded-xl border border-border text-foreground hover:bg-muted font-semibold text-xs transition-colors cursor-pointer"
									>
										Batal
									</button>
									<button
										type="submit"
										disabled={isUpdatingRefDB}
										class="h-10 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
									>
										{#if isUpdatingRefDB}
											<ArrowPath class="h-4 w-4 animate-spin" />
											<span>Menyimpan...</span>
										{:else}
											<Check class="h-4 w-4" />
											<span>Simpan Perubahan</span>
										{/if}
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
			{/if}

			<!-- Config Form Box (Active Source) -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
					<div>
						<h2 class="text-sm font-bold text-foreground">Parameter Konfigurasi Sumber Aktif (Runtime)</h2>
						<p class="text-xs text-muted-foreground">Business invoices &amp; customer master data source accessed strictly via Model Context Protocol tools (Zero Raw SQL).</p>
					</div>
					<div class="flex items-center gap-2">
						<span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold {mcpStatus === 'CONNECTED' ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'}">
							● {mcpStatus}
						</span>
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
								<span>{mcpTestResult.ok ? 'MCP REFERENCE CONNECTION VERIFIED' : 'FAILED TO CONNECT TO MCP REFERENCE'}</span>
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
						<label for="mcp-platform" class="text-xs font-bold text-foreground flex items-center justify-between">
							<span>Reference Database Platform:</span>
							<span class="text-[10px] text-cyan-500 font-mono font-bold">PLATFORM SELECTOR</span>
						</label>
						<DatabasePlatformSelect
							id="mcp-platform"
							bind:value={mcpPlatform}
							onchange={(opt) => {
								mcpPlatform = opt.value as any;
								handlePlatformChange({ target: { value: opt.value } } as any);
							}}
						/>
						<p class="text-[11px] text-muted-foreground">Default port automatically adjusts to the selected platform architecture.</p>
					</div>

					<!-- Connection Mode (Local / SSL / SSH Tunnel) -->
					<div class="space-y-1.5">
						<span class="text-xs font-bold text-foreground block">
							Connectivity &amp; Security Mode:
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
								Routes through a bastion jump host in the enterprise DMZ perimeter for strict network isolation.
							{:else if mcpMode === 'ssl'}
								Enforces TLS encrypted transport for managed cloud or remote instances.
							{:else}
								Direct network connection via local intranet / LAN without extra tunneling.
							{/if}
						</p>
					</div>
				</div>

				<!-- SSH Tunnel Bastion Fields (If SSH Mode Selected) -->
				{#if mcpMode === "ssh"}
					<div class="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3">
						<div class="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
							<ShieldCheck class="h-4 w-4" />
							<span>SSH Tunnel Configuration (Bastion Jump Host)</span>
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

				<!-- Oracle TNS Connect Descriptor (If Oracle Platform) -->
				{#if mcpPlatform === 'oracle'}
					<div class="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
						<div class="flex items-center justify-between">
							<label for="mcp-tns-runtime" class="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
								<BrandIcon name="oracle" class="h-4 w-4" />
								<span>Oracle TNS Connect Descriptor (ezConnect / TNS):</span>
							</label>
							<span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">AUTO-PARSE</span>
						</div>
						<textarea
							id="mcp-tns-runtime"
							bind:value={mcpOracleTNS}
							oninput={handleMcpTNSInput}
							rows={3}
							placeholder="(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.20.173.35)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=HBS)))"
							class="w-full p-2.5 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
						></textarea>
						<p class="text-[10px] text-muted-foreground">
							Format TNS Oracle 11g diekstrak otomatis ke Host (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{mcpConfig.host || '-'}</span>), Port (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{mcpConfig.port || '-'}</span>), dan Database / Service (<span class="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{mcpConfig.dbname || '-'}</span>).
						</p>
					</div>
				{/if}

				<!-- Inputs Grid for Target Database -->
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
					<div class="space-y-1">
						<label for="mcp-host" class="font-semibold text-muted-foreground">Reference Endpoint Host:</label>
						<input
							id="mcp-host"
							type="text"
							bind:value={mcpConfig.host}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="erp-db.internal"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-port" class="font-semibold text-muted-foreground">Target Port:</label>
						<input
							id="mcp-port"
							type="text"
							bind:value={mcpConfig.port}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="1521"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-dbname" class="font-semibold text-muted-foreground">DB Name / SID / PDB:</label>
						<input
							id="mcp-dbname"
							type="text"
							bind:value={mcpConfig.dbname}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="ERP_PROD_PDB"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-user" class="font-semibold text-muted-foreground">MCP Credential User:</label>
						<input
							id="mcp-user"
							type="text"
							bind:value={mcpConfig.user}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="erp_agent"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-password" class="font-semibold text-muted-foreground">Credential Password:</label>
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
								title={showMcpPass ? "Hide Password" : "Show Password"}
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
						<label for="mcp-sslmode" class="font-semibold text-muted-foreground">SSL Encryption Level:</label>
						<CustomSelect
							id="mcp-sslmode"
							bind:value={mcpConfig.sslmode}
							options={[
								{ value: "disable", label: "disable (No Encryption)" },
								{ value: "require", label: "require (Enforce TLS)" },
								{ value: "verify-ca", label: "verify-ca (Validate CA Certificate)" },
								{ value: "verify-full", label: "verify-full (Validate CA & Hostname)" }
							]}
						/>
					</div>
				</div>

				<!-- Apply Result Banner -->
				{#if mcpApplyResult}
					<div class="p-3.5 rounded-xl border flex items-start gap-3 text-xs {mcpApplyResult.ok ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
						{#if mcpApplyResult.ok}
							<CheckCircle class="h-5 w-5 shrink-0 text-cyan-500 mt-0.5" />
						{:else}
							<XCircle class="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
						{/if}
						<div class="flex-1 font-mono">
							<div class="font-bold flex items-center justify-between">
								<span>{mcpApplyResult.ok ? 'MCP REFERENCE CONFIGURATION APPLIED SUCCESSFULLY' : 'FAILED TO APPLY CONFIGURATION'}</span>
								<span class="text-[10px] opacity-75">{mcpApplyResult.time}</span>
							</div>
							<div class="mt-1">{mcpApplyResult.message}</div>
						</div>
						<button
							type="button"
							onclick={() => mcpApplyResult = null}
							class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground cursor-pointer"
						>
							<XMark class="h-4 w-4" />
						</button>
					</div>
				{/if}

				<!-- Action Toolbar: Test & Apply -->
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-secondary/50 border border-border/80 shadow-2xs">
					<div class="text-xs text-muted-foreground flex items-center gap-2">
						<span class="h-2.5 w-2.5 rounded-full {mcpStatus === 'CONNECTED' ? 'bg-cyan-500' : 'bg-rose-500'}"></span>
						<span>Active Status: <strong class="text-foreground font-mono">{mcpStatus}</strong> ({mcpPlatform.toUpperCase()} &bull; {mcpConfig.dbname})</span>
					</div>
					<div class="flex items-center gap-2.5 flex-wrap justify-end">
						<button
							type="button"
							onclick={testMCPReferenceConnection}
							disabled={isTestingMcp}
							class="h-10 px-5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
						>
							<ArrowPath class="h-4 w-4 {isTestingMcp ? 'animate-spin' : ''}" />
							<span>{isTestingMcp ? 'Testing Connection...' : '⚡ Test Connection'}</span>
						</button>
						<button
							type="button"
							onclick={applyMCPReferenceConfig}
							disabled={isApplyingMcp}
							class="h-10 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
						>
							<Check class="h-4 w-4" />
							<span>{isApplyingMcp ? 'Applying...' : 'Apply & Save'}</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Protocol Isolation & Security Rules -->
			<div class="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-3 shadow-xs text-xs">
				<div class="flex items-center gap-2 font-bold text-cyan-600 dark:text-cyan-400">
					<ShieldCheck class="h-4 w-4" />
					<span>Security Policy: Zero Direct Raw SQL Execution</span>
				</div>
				<p class="text-muted-foreground leading-relaxed">
					AI Agents and chat bots <strong>never receive direct SQL execution privileges</strong>. All data interactions are governed by registered tool parameter contracts:
				</p>
				<ul class="list-disc list-inside space-y-1 text-foreground font-mono text-[11px]">
					<li><code>check_invoice(invoice_no)</code> &rarr; Reads and verifies invoice data from {mcpPlatform.toUpperCase()} (read-only).</li>
					<li><code>stage_invoice_update(...)</code> &rarr; Stages proposed revisions into the system ticket queue without direct execution.</li>
					<li><code>mutate_invoice_record(...)</code> &rarr; Executes atomically only upon 1-Click approval from on-call engineer.</li>
				</ul>
			</div>

			<!-- ERP Reference Tables Accessed by MCP Tools -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="text-xs font-bold text-foreground">ERP Reference Tables Accessed ({mcpReferenceTables.length})</div>
				<div class="rounded-xl border border-border/60 overflow-hidden">
					<table class="w-full text-xs text-left">
						<thead class="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-mono border-b border-border/50">
							<tr>
								<th class="py-2.5 px-3.5 font-bold">Table Name</th>
								<th class="py-2.5 px-3.5 font-bold">Data Role in MCP</th>
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
						<h2 class="text-sm font-bold text-foreground">Model Context Protocol (MCP) Tool Catalog &amp; Registration</h2>
						<p class="text-xs text-muted-foreground">Upload custom tool manifests (JSON / YAML) allowing the AI Agent to interact securely with external enterprise databases.</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={fetchMCPTools}
							disabled={isLoadingMcpTools}
							class="h-9 px-3.5 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
						>
							<ArrowPath class="h-3.5 w-3.5 {isLoadingMcpTools ? 'animate-spin' : ''}" />
							<span>{isLoadingMcpTools ? 'Loading...' : 'Reload Tools'}</span>
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
						<span class="font-bold text-foreground">Load Quick Preset Templates:</span>
						<div class="flex items-center gap-1.5 flex-wrap">
							<button
								type="button"
								onclick={() => loadPresetManifest("postgres_invoicing")}
								class="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-mono cursor-pointer transition-colors font-semibold"
							>
								PostgreSQL Invoice Mutation
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("customer_master_query")}
								class="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border text-xs font-mono cursor-pointer transition-colors font-medium"
							>
								Customer Master Query
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("oracle_invoicing")}
								class="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border text-xs font-mono cursor-pointer transition-colors font-medium"
							>
								Oracle Invoice Mutation
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("sap_bapi_customer")}
								class="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border text-xs font-mono cursor-pointer transition-colors font-medium"
							>
								SAP Customer Master
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("tax_compliance_djp")}
								class="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border text-xs font-mono cursor-pointer transition-colors font-medium"
							>
								DJP Tax Validator
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("warehouse_stock_sync")}
								class="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border text-xs font-mono cursor-pointer transition-colors font-medium"
							>
								Stock Sync
							</button>
						</div>
					</div>

					<!-- Drag & Drop / File Input -->
					<div class="flex items-center gap-3">
						<label class="h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer">
							<span>Select File (.json / .yaml)</span>
							<input
								type="file"
								accept=".json,.yaml,.yml,.txt"
								onchange={handleFileSelect}
								class="hidden"
							/>
						</label>
						<span class="text-xs text-muted-foreground">or paste tool manifest JSON directly below:</span>
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
  "description": "MCP tool function description",
  "transport": "stdio / json-rpc 2.0",
  "inputSchema": {
    "type": "object",
    "properties": {
      "record_id": { "type": "string", "description": "Entity ID" }
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
							Clear Form
						</button>

						<button
							type="button"
							onclick={registerUploadedMCPTool}
							disabled={isUploadingTool || !uploadManifestText.trim()}
							class="h-10 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
						>
							<ArrowPath class="h-3.5 w-3.5 {isUploadingTool ? 'animate-spin' : ''}" />
							<span>{isUploadingTool ? 'Registering Tool...' : 'Upload &amp; Register MCP Tool'}</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Registered Tools List -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="flex items-center justify-between pb-2 border-b border-border/50">
					<div class="text-xs font-bold text-foreground">Active &amp; Registered MCP Tools ({mcpTools.length})</div>
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
									<div class="text-[10px] font-bold text-muted-foreground uppercase">Input Parameters:</div>
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
									<span>Test Tool Call (Dry-Run)</span>
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
								Execution Simulation Sandbox: <span class="font-mono text-cyan-500">{activeToolForTest.name}</span>
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
						Safely test calling this MCP tool with sample parameters without permanently altering production records.
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
								<span>{toolTestExecutionResult.ok ? 'MCP PROTOCOL SIMULATION RESULT (SUCCESS)' : 'TOOL EXECUTION FAILED'}</span>
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

					<div class="flex items-center justify-end gap-2.5 pt-1">
						<button
							type="button"
							onclick={() => activeToolForTest = null}
							class="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
						>
							Close
						</button>
						<button
							type="button"
							onclick={executeToolTest}
							disabled={isExecutingToolTest}
							class="h-9 px-4.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
						>
							<ArrowPath class="h-3.5 w-3.5 {isExecutingToolTest ? 'animate-spin' : ''}" />
							<span>{isExecutingToolTest ? 'Executing...' : 'Run MCP Tool Simulation'}</span>
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
					<h2 class="text-sm font-bold text-foreground">Unified .env Configuration</h2>
					<p class="text-xs text-muted-foreground">Copy these environment variables to root <code>.env</code> and <code>backend/.env</code> for both databases.</p>
				</div>
				<button
					type="button"
					onclick={copyEnvSnippet}
					class="h-9 px-4 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
				>
					{#if copiedEnv}
						<Check class="h-3.5 w-3.5 text-emerald-500" />
						<span class="text-emerald-500 font-bold">Copied!</span>
					{:else}
						<ClipboardDocument class="h-3.5 w-3.5" />
						<span>Copy to Clipboard</span>
					{/if}
				</button>
			</div>

			<pre class="p-4 rounded-xl bg-secondary/70 border border-border/60 font-mono text-xs overflow-x-auto text-foreground leading-relaxed">{generateEnvSnippet()}</pre>
		</div>
	{/if}
</div>
