<script lang="ts">
	import { onMount } from "svelte";
	import { 
		Cube, 
		CircleStack, 
		ShieldCheck, 
		DocumentText, 
		Play, 
		ArrowTopRightOnSquare, 
		Check, 
		InformationCircle,
		CommandLine,
		LockClosed,
		CpuChip,
		ArrowPath,
		ArrowUpTray,
		CheckCircle,
		XCircle,
		XMark,
		Plus,
		Trash,
		Star,
		ServerStack
	} from "svelte-heros-v2";
	import { i18n } from "$lib/i18n.svelte";
	import CustomSelect from "$lib/components/CustomSelect.svelte";
	import BrandIcon from "$lib/components/BrandIcon.svelte";

	// Active Tab State
	let activeTab = $state<"dual-db" | "resources" | "tools" | "playground" | "upload">("dual-db");

	// Quick Preset Manifest Templates for MCP Tools
	const PRESET_TOOL_MANIFESTS: Record<string, any> = {
		postgres_invoicing: {
			name: "mutate_invoice_record",
			version: "1.2.0",
			category: "ERP_INTEGRATION",
			description: "Atomically update invoice customer name in PostgreSQL enterprise reference database after on-call supervisor sign-off.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					invoice_no: { type: "string", description: "Target invoice document number (e.g. INV/2026/001)" },
					proposed_name: { type: "string", description: "Validated legal entity name (e.g. PT Maju Bersama)" },
					ticket_id: { type: "string", description: "Approved ticket reference ID" }
				},
				required: ["invoice_no", "proposed_name"]
			}
		},
		customer_master_query: {
			name: "query_customer_master",
			version: "1.0.4",
			category: "CUSTOMER_360",
			description: "Lookup real-time credit limit, tax identification (NPWP), and legal address from reference DB.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					customer_code: { type: "string", description: "Customer ERP code (e.g. CUST-00921)" },
					tax_number: { type: "string", description: "16-digit NPWP format" }
				},
				required: ["customer_code"]
			}
		},
		oracle_invoicing: {
			name: "oracle_ebs_ar_update",
			version: "2.1.0",
			category: "ORACLE_EBS",
			description: "Execute PL/SQL package AR_INVOICE_API_PUB to stage receivable invoice adjustments.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					trx_number: { type: "string", description: "Oracle transaction number" },
					org_id: { type: "string", description: "Operating Unit ID" },
					new_customer_name: { type: "string", description: "Revised customer company name" }
				},
				required: ["trx_number", "new_customer_name"]
			}
		},
		sap_bapi_customer: {
			name: "sap_bapi_customer_change",
			version: "3.0.1",
			category: "SAP_RFC",
			description: "Invokes BAPI_CUSTOMER_CHANGEFROMDATA1 via SAP NetWeaver RFC Gateway for central master data.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					customer_no: { type: "string", description: "SAP KUNNR 10-digit customer code" },
					name1: { type: "string", description: "Name 1 (Company Name)" },
					sales_org: { type: "string", description: "VKORG Sales Organization" }
				},
				required: ["customer_no", "name1"]
			}
		},
		tax_compliance_djp: {
			name: "validate_faktur_pajak",
			version: "1.1.0",
			category: "COMPLIANCE_TAX",
			description: "Verify electronic tax invoice (e-Faktur) against Directorate General of Taxes (DJP) QR signature.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					nomor_faktur: { type: "string", description: "16-digit e-Faktur Pajak code" },
					npwp_penjual: { type: "string", description: "Seller Tax ID" }
				},
				required: ["nomor_faktur"]
			}
		},
		warehouse_stock_sync: {
			name: "sync_warehouse_inventory",
			version: "1.0.0",
			category: "LOGISTICS",
			description: "Query current inventory availability across multiple factory warehouses before fulfilling invoice.",
			transport: "stdio / json-rpc 2.0",
			inputSchema: {
				type: "object",
				properties: {
					item_sku: { type: "string", description: "Stock Keeping Unit identifier" },
					warehouse_code: { type: "string", description: "Warehouse branch ID (e.g. SBY-01)" }
				},
				required: ["item_sku"]
			}
		}
	};

	// Registered MCP Tools State (from Backend Catalog)
	interface RegisteredMCPTool {
		id: string;
		name: string;
		version: string;
		category: string;
		description: string;
		transport: string;
		inputSchema: {
			type: string;
			properties: Record<string, { type: string; description: string }>;
			required?: string[];
		};
		status: string;
		created_at?: string;
	}

	let registeredTools = $state<RegisteredMCPTool[]>([]);
	let isLoadingTools = $state(false);

	// Upload Tool State
	let uploadManifestText = $state("");
	let isUploadingTool = $state(false);
	let uploadSuccess = $state<string | null>(null);
	let uploadError = $state<string | null>(null);

	// Dry Run Simulation Sandbox State
	let activeToolForTest = $state<RegisteredMCPTool | null>(null);
	let testParamsInput = $state<Record<string, string>>({});
	let toolTestExecutionResult = $state<{
		ok: boolean;
		protocol: string;
		latency_ms: number;
		result?: any;
		error?: string;
		timestamp: string;
	} | null>(null);
	let isExecutingToolTest = $state(false);

	async function fetchRegisteredTools() {
		isLoadingTools = true;
		try {
			const res = await fetch("/api/mcp/tools");
			if (res.ok) {
				const data = await res.json();
				registeredTools = data.tools || [];
			}
		} catch (e) {
			console.error("Failed to fetch registered MCP tools:", e);
		} finally {
			isLoadingTools = false;
		}
	}

	function loadPresetManifest(key: string) {
		const preset = PRESET_TOOL_MANIFESTS[key];
		if (preset) {
			uploadManifestText = JSON.stringify(preset, null, 2);
			uploadError = null;
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const content = event.target?.result as string;
			uploadManifestText = content;
			uploadError = null;
		};
		reader.onerror = () => {
			uploadError = "Gagal membaca berkas manifest";
		};
		reader.readAsText(file);
	}

	async function registerUploadedMCPTool() {
		uploadError = null;
		uploadSuccess = null;

		if (!uploadManifestText.trim()) {
			uploadError = "Manifest tool tidak boleh kosong";
			return;
		}

		let parsed: any;
		try {
			parsed = JSON.parse(uploadManifestText);
		} catch (e: any) {
			uploadError = "Format JSON tidak valid: " + e.message;
			return;
		}

		if (!parsed.name) {
			uploadError = "Manifest wajib memiliki properti 'name'";
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
			if (res.ok) {
				uploadSuccess = data.message || `Tool '${parsed.name}' berhasil diregistrasikan!`;
				uploadManifestText = "";
				await fetchRegisteredTools();
			} else {
				uploadError = data.error || "Gagal meregistrasikan MCP Tool";
			}
		} catch (e: any) {
			uploadError = e.message || "Network error saat registrasi tool";
		} finally {
			isUploadingTool = false;
		}
	}

	function openToolTestModal(tool: RegisteredMCPTool) {
		activeToolForTest = tool;
		toolTestExecutionResult = null;
		testParamsInput = {};
		if (tool.inputSchema?.properties) {
			for (const [key, val] of Object.entries(tool.inputSchema.properties)) {
				testParamsInput[key] = key.includes("invoice") ? "INV/2026/001" : key.includes("name") ? "PT Sumber Makmur" : "SAMPLE_VAL";
			}
		}
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
			if (res.ok) {
				toolTestExecutionResult = {
					ok: true,
					protocol: data.protocol || "Model Context Protocol v1.0",
					latency_ms: data.latency_ms || 12,
					result: data.result || data,
					timestamp: new Date().toLocaleTimeString()
				};
			} else {
				toolTestExecutionResult = {
					ok: false,
					protocol: "Model Context Protocol v1.0",
					latency_ms: 0,
					error: data.error || "Execution failed",
					timestamp: new Date().toLocaleTimeString()
				};
			}
		} catch (e: any) {
			toolTestExecutionResult = {
				ok: false,
				protocol: "Model Context Protocol v1.0",
				latency_ms: 0,
				error: e.message,
				timestamp: new Date().toLocaleTimeString()
			};
		} finally {
			isExecutingToolTest = false;
		}
	}

	// Dynamic MCP Resources (Enterprise Knowledge Base)
	interface MCPResourceInfo {
		id: string;
		uri: string;
		name: string;
		mimeType: string;
		description: string;
		content: string;
		created_at?: string;
	}

	let mcpResources = $state<MCPResourceInfo[]>([]);
	let isLoadingResources = $state(false);
	let showAddResourceModal = $state(false);
	let isCreatingResource = $state(false);
	let resourceActionError = $state<string | null>(null);
	let resourceActionSuccess = $state<string | null>(null);
	let newResource = $state({
		uri: "novapilot://sop/custom-rules",
		name: "",
		mimeType: "text/markdown",
		description: "",
		content: ""
	});

	// Live status for DB 1 and DB 2
	let liveTelemetry = $state<any>(null);
	let liveDbConfig = $state<any>(null);

	async function fetchMCPResources() {
		isLoadingResources = true;
		try {
			const res = await fetch("/api/mcp/resources");
			if (res.ok) {
				const data = await res.json();
				mcpResources = data.resources || [];
			}
		} catch (e) {
			console.error("Failed to fetch MCP resources:", e);
		} finally {
			isLoadingResources = false;
		}
	}

	async function fetchLiveStatus() {
		try {
			const [telRes, cfgRes] = await Promise.all([
				fetch("/api/telemetry"),
				fetch("/api/database/config")
			]);
			if (telRes.ok) liveTelemetry = await telRes.json();
			if (cfgRes.ok) liveDbConfig = await cfgRes.json();
		} catch (e) {
			console.error("Failed to fetch live telemetry/db config:", e);
		}
	}

	async function createMCPResource() {
		resourceActionError = null;
		resourceActionSuccess = null;
		if (!newResource.name.trim() || !newResource.uri.trim() || !newResource.content.trim()) {
			resourceActionError = "Nama, URI, dan Konten dokumen resource wajib diisi";
			return;
		}
		isCreatingResource = true;
		try {
			const res = await fetch("/api/mcp/resources", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newResource)
			});
			const data = await res.json();
			if (res.ok) {
				resourceActionSuccess = data.message || "Knowledge Resource berhasil ditambahkan!";
				showAddResourceModal = false;
				newResource = { uri: "novapilot://sop/custom-rules", name: "", mimeType: "text/markdown", description: "", content: "" };
				await fetchMCPResources();
			} else {
				resourceActionError = data.error || "Gagal menambahkan resource";
			}
		} catch (e: any) {
			resourceActionError = e.message;
		} finally {
			isCreatingResource = false;
		}
	}

	async function deleteMCPResource(id: string, name: string) {
		if (!confirm(`Hapus resource "${name}" dari Model Context Protocol?`)) return;
		try {
			const res = await fetch(`/api/mcp/resources/${encodeURIComponent(id)}`, { method: "DELETE" });
			if (res.ok) {
				await fetchMCPResources();
			}
		} catch (e) {
			console.error("Failed to delete MCP resource:", e);
		}
	}

	onMount(() => {
		fetchRegisteredTools();
		fetchMCPResources();
		fetchLiveStatus();
	});

	// Interactive Playground State
	let selectedTool = $state("check_invoice");
	let playgroundInvoiceNo = $state("INV/2026/001");
	let playgroundProposedValue = $state("PT Sumber Makmur Sentosa");
	let isExecutingPlayground = $state(false);
	let playgroundResponse = $state<string | null>(null);

	// Dynamic Options for Tool Select in Playground
	let playgroundToolOptions = $derived([
		{ value: "check_invoice", label: "check_invoice (Verifikasi Faktur)", description: "Query invoice and status" },
		{ value: "stage_invoice_update", label: "stage_invoice_update (Tahap Perubahan)", description: "Stage revision for approval" },
		{ value: "list_pending_tickets", label: "list_pending_tickets (Daftar Antrean)", description: "Get queue tickets" },
		...registeredTools
			.filter(t => !["check_invoice", "stage_invoice_update", "list_pending_tickets"].includes(t.name))
			.map(t => ({
				value: t.name,
				label: `${t.name} (Custom MCP Tool)`,
				description: t.description
			}))
	]);

	async function runPlayground() {
		isExecutingPlayground = true;
		playgroundResponse = null;

		try {
			if (selectedTool === "list_pending_tickets") {
				const res = await fetch("/api/tickets");
				if (res.ok) {
					const tickets = await res.json();
					const pending = tickets.filter((t: any) => t.status === "PENDING_APPROVAL");
					playgroundResponse = JSON.stringify({
						jsonrpc: "2.0",
						result: {
							content: [
								{
									type: "text",
									text: JSON.stringify({ pending_count: pending.length, tickets: pending }, null, 2)
								}
							]
						}
					}, null, 2);
					return;
				}
			}

			// Call real backend MCP endpoint
			const res = await fetch("/api/mcp/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					tool_name: selectedTool,
					parameters: {
						invoice_no: playgroundInvoiceNo,
						proposed_value: playgroundProposedValue,
						branch_id: 1
					}
				})
			});

			if (res.ok) {
				const data = await res.json();
				playgroundResponse = JSON.stringify({
					jsonrpc: "2.0",
					result: {
						protocol: data.protocol || "Model Context Protocol v1.0",
						latency_ms: data.latency_ms,
						content: [
							{
								type: "text",
								text: JSON.stringify(data.result || data, null, 2)
							}
						]
					}
				}, null, 2);
			} else {
				const errData = await res.json();
				playgroundResponse = JSON.stringify({
					jsonrpc: "2.0",
					error: { code: -32603, message: errData.error || "Backend MCP error" }
				}, null, 2);
			}
		} catch (e: any) {
			playgroundResponse = JSON.stringify({
				jsonrpc: "2.0",
				error: { code: -32603, message: e.message || "Internal MCP error" }
			}, null, 2);
		} finally {
			isExecutingPlayground = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t.mcp.title} • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shadow-xs">
					<Cube class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						{i18n.t.mcp.title}
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
							SPECIFICATION v1.0
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.mcp.subtitle}
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="https://modelcontextprotocol.io"
				target="_blank"
				rel="noreferrer"
				class="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
			>
				<span>Official MCP Docs</span>
				<ArrowTopRightOnSquare class="h-3.5 w-3.5 text-muted-foreground" />
			</a>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="flex items-center gap-2 border-b border-border/50 overflow-x-auto pb-1 text-xs font-semibold">
		<button
			type="button"
			onclick={() => activeTab = "dual-db"}
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'dual-db' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CircleStack class="h-4 w-4" />
			<span>1. {i18n.t.mcp.tab_dual_db}</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "resources"}
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'resources' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<DocumentText class="h-4 w-4" />
			<span>2. {i18n.t.mcp.tab_resources} ({mcpResources.length})</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "tools"}
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'tools' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CpuChip class="h-4 w-4" />
			<span>3. {i18n.t.mcp.tab_tools} ({registeredTools.length})</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "playground"}
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'playground' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CommandLine class="h-4 w-4" />
			<span>4. {i18n.t.mcp.tab_playground}</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "upload"}
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0 {activeTab === 'upload' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<ArrowUpTray class="h-4 w-4" />
			<span>5. {i18n.t.mcp.tab_upload} ({registeredTools.length})</span>
		</button>
	</div>

	<!-- TAB 1: ARSITEKTUR ISOLASI DATABASE -->
	{#if activeTab === "dual-db"}
		<div class="space-y-6">
			<!-- Architecture Highlight Banner -->
			<div class="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 space-y-3">
				<div class="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
					<ShieldCheck class="h-5 w-5" />
					<span>Prinsip Keamanan: Isolasi Database Operasional & Sumber Data MCP</span>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">
					Sistem NovaPilot AI memisahkan antara <strong>Database Internal Sistem</strong> (antrean tiket, log audit) dan <strong>Database Referensi Bisnis</strong>. AI Agent dan bot chat <strong>tidak pernah memiliki kredensial SQL langsung</strong> ke database ERP. Segala interaksi dibatasi melalui protokol MCP yang terisolasi dan memerlukan verifikasi manual oleh petugas on-call.
				</p>
			</div>

			<!-- Comparison Cards Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- DB 1: Internal System Store -->
				<div class="p-5 rounded-2xl border border-emerald-500/30 bg-card/70 space-y-4 shadow-xs">
					<div class="flex items-center justify-between pb-3 border-b border-border/50">
						<div class="flex items-center gap-2.5">
							<div class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
								<CircleStack class="h-4 w-4" />
							</div>
							<div>
								<div class="text-sm font-bold text-foreground">DB 1: Internal System Store</div>
								<div class="text-[10px] font-mono text-muted-foreground">{liveDbConfig?.system_db?.driver || 'PostgreSQL 14–18 (ACID Core Required)'}</div>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
							DIRECT SYSTEM
						</span>
					</div>

					<div class="space-y-3 text-xs">
						<div>
							<span class="font-semibold text-muted-foreground">Tujuan & Fungsi:</span>
							<p class="text-foreground mt-0.5">
								Menyimpan seluruh lifecycle internal NovaPilot: antrean approval tiket, riwayat chat mentah dari berbagai platform, log audit kriptografis, dan pola klasifikasi self-learning.
							</p>
						</div>

						<div class="space-y-1">
							<span class="font-semibold text-muted-foreground">Tabel yang Dikelola:</span>
							<ul class="list-disc list-inside text-muted-foreground space-y-0.5 font-mono text-[11px]">
								{#if liveDbConfig?.system_db?.tables}
									{#each liveDbConfig.system_db.tables as tbl}
										<li><span class="text-foreground font-semibold">{tbl}</span></li>
									{/each}
								{:else}
									<li><span class="text-foreground font-semibold">tickets</span> - Antrean tiket, status, proposed value diff</li>
									<li><span class="text-foreground font-semibold">audit_logs</span> - Immutable audit signature & IP petugas</li>
									<li><span class="text-foreground font-semibold">inbound_messages</span> - Arsip chat WhatsApp, Telegram, Discord</li>
									<li><span class="text-foreground font-semibold">learned_patterns</span> - Pola regex pembelajaran intent</li>
									<li><span class="text-foreground font-semibold">documents</span> - Metadata lampiran nota & hasil OCR</li>
								{/if}
							</ul>
						</div>

						<div class="pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
							<span>Engine: {liveDbConfig?.system_db?.name || 'PostgreSQL Internal'}</span>
							<span class="{liveDbConfig?.system_db?.status === 'CONNECTED' ? 'text-emerald-500' : 'text-rose-500'} font-bold">
								Koneksi: {liveDbConfig?.system_db?.status || 'CONNECTED'} ({liveTelemetry?.database?.latency_ms ?? 0}ms)
							</span>
						</div>
					</div>
				</div>

				<!-- DB 2: Multi-Source Enterprise Reference Database Pool -->
				<div class="p-5 rounded-2xl border border-cyan-500/30 bg-card/70 space-y-4 shadow-xs">
					<div class="flex items-center justify-between pb-3 border-b border-border/50">
						<div class="flex items-center gap-2.5">
							<div class="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
								<LockClosed class="h-4 w-4" />
							</div>
							<div>
								<div class="text-sm font-bold text-foreground">DB 2: Multi-Source Reference Database Pool</div>
								<div class="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
									{liveTelemetry?.reference_database?.name || liveDbConfig?.mcp_ref_db?.driver || 'Oracle 11g Enterprise (HAWILA_TEST)'}
								</div>
							</div>
						</div>
						<div class="flex items-center gap-1.5">
							<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
								MCP ISOLATED
							</span>
							<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
								MULTI-POOL
							</span>
						</div>
					</div>

					<div class="space-y-3 text-xs">
						<div>
							<span class="font-semibold text-muted-foreground">Tujuan & Fungsi:</span>
							<p class="text-foreground mt-0.5">
								Buku besar faktur utama perusahaan & master pelanggan terisolasi ketat di balik boundary MCP. Sistem mendukung <strong>multi-database referensi</strong> dengan pergantian sumber aktif secara dinamis.
							</p>
						</div>

						<!-- Supported Platform Badges with Brand Icons -->
						<div class="space-y-1.5 pt-1">
							<span class="font-semibold text-muted-foreground text-[11px]">Platform Terintegrasi:</span>
							<div class="flex items-center gap-2 flex-wrap">
								<div class="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary border border-border/60 text-[10px] font-mono font-bold">
									<BrandIcon name="oracle" class="h-3.5 w-3.5" />
									<span>Oracle 11g/19c</span>
								</div>
								<div class="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary border border-border/60 text-[10px] font-mono font-bold">
									<BrandIcon name="postgresql" class="h-3.5 w-3.5" />
									<span>PostgreSQL</span>
								</div>
								<div class="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary border border-border/60 text-[10px] font-mono font-bold">
									<BrandIcon name="sap" class="h-3.5 w-3.5" />
									<span>SAP S/4HANA</span>
								</div>
								<div class="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary border border-border/60 text-[10px] font-mono font-bold">
									<BrandIcon name="mysql" class="h-3.5 w-3.5" />
									<span>MySQL</span>
								</div>
								<div class="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary border border-border/60 text-[10px] font-mono font-bold">
									<BrandIcon name="mssql" class="h-3.5 w-3.5" />
									<span>MS SQL</span>
								</div>
							</div>
						</div>

						<div class="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-700 dark:text-cyan-300">
							🔒 <strong>Aturan Isolasi:</strong> Bot WhatsApp tidak pernah diizinkan menjalankan <code>UPDATE invoices SET ...</code> secara manual. Hanya tool <code>check_invoice</code> dan approval 1-klik di WebUI yang dapat memutasi data.
						</div>

						<div class="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
							<span class="text-muted-foreground text-[11px] font-mono">
								Status: <strong class="text-emerald-500">{liveTelemetry?.reference_database?.status || 'CONNECTED'}</strong> ({liveTelemetry?.reference_database?.latency_ms ?? 4}ms)
							</span>
							<a
								href="/dashboard/connectors"
								class="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
							>
								<span>Buka Database Connectors</span>
								<ArrowTopRightOnSquare class="h-3 w-3" />
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 2: MCP RESOURCES (ENTERPRISE KNOWLEDGE BASE) -->
	{#if activeTab === "resources"}
		<div class="space-y-4">
			<div class="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-border/40">
				<div>
					<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
						<DocumentText class="h-4 w-4 text-cyan-500" />
						<span>Enterprise Knowledge Base &amp; SOP Resources ({mcpResources.length})</span>
					</h3>
					<p class="text-xs text-muted-foreground mt-0.5">
						Resources pada Model Context Protocol adalah dokumen kontekstual yang dibaca oleh LLM/AI Agent sebagai pedoman aturan operasional standar (SOP).
					</p>
				</div>
				<button
					type="button"
					onclick={() => { showAddResourceModal = true; resourceActionError = null; resourceActionSuccess = null; }}
					class="h-8 px-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
				>
					<Plus class="h-3.5 w-3.5" />
					<span>Tambah Knowledge Resource</span>
				</button>
			</div>

			{#if resourceActionSuccess}
				<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
					<span>{resourceActionSuccess}</span>
					<button type="button" onclick={() => resourceActionSuccess = null} class="text-muted-foreground hover:text-foreground cursor-pointer">
						<XMark class="h-3.5 w-3.5" />
					</button>
				</div>
			{/if}

			{#if isLoadingResources}
				<div class="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
					<ArrowPath class="h-4 w-4 animate-spin text-cyan-500" />
					<span>Memuat MCP Knowledge Resources...</span>
				</div>
			{:else if mcpResources.length === 0}
				<div class="p-10 text-center rounded-2xl border border-dashed border-border/80 space-y-3">
					<DocumentText class="h-8 w-8 text-muted-foreground/60 mx-auto" />
					<div class="text-xs font-semibold text-foreground">Belum ada Resource Pengetahuan Terdaftar</div>
					<p class="text-[11px] text-muted-foreground max-w-sm mx-auto">
						Tambahkan SOP pabrik, direktori cabang, atau regulasi perpajakan yang dapat dibaca oleh AI Agent saat memproses tiket.
					</p>
					<button
						type="button"
						onclick={() => showAddResourceModal = true}
						class="h-8 px-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
					>
						<Plus class="h-3.5 w-3.5" />
						<span>Tambah Knowledge Resource Pertama</span>
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4">
					{#each mcpResources as res}
						<div class="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3 relative group">
							<div class="flex items-center justify-between pb-2 border-b border-border/40 gap-2">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{res.uri}</span>
									<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground font-semibold">
										{res.mimeType}
									</span>
								</div>
								<div class="flex items-center gap-3">
									<span class="text-xs font-bold text-foreground">{res.name}</span>
									<button
										type="button"
										onclick={() => deleteMCPResource(res.id, res.name)}
										class="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
										title="Hapus resource ini dari MCP"
									>
										<Trash class="h-3.5 w-3.5" />
									</button>
								</div>
							</div>

							<p class="text-xs text-muted-foreground">{res.description}</p>

							<div class="p-3 rounded-xl bg-secondary/50 font-mono text-xs text-foreground whitespace-pre-wrap max-h-56 overflow-y-auto border border-border/40">
								{res.content}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- TAB 3: MCP TOOLS SCHEMA -->
	{#if activeTab === "tools"}
		<div class="space-y-4">
			<div class="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-border/40">
				<div>
					<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
						<CpuChip class="h-4 w-4 text-purple-500" />
						<span>Katalog Schema Model Context Protocol Tools ({registeredTools.length})</span>
					</h3>
					<p class="text-xs text-muted-foreground mt-0.5">
						Tools pada Model Context Protocol mendefinisikan aksi executable yang diizinkan untuk dipanggil oleh AI Agent melalui JSON-RPC.
					</p>
				</div>
				<button
					type="button"
					onclick={() => activeTab = "upload"}
					class="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
				>
					<ArrowUpTray class="h-3.5 w-3.5 text-purple-500" />
					<span>Upload Tool Baru</span>
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each registeredTools as tool}
					<div class="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3 flex flex-col justify-between">
						<div class="space-y-3">
							<div class="flex items-center justify-between pb-2 border-b border-border/40 gap-2">
								<span class="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
									{tool.name}()
								</span>
								<div class="flex items-center gap-1.5">
									<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
										v{tool.version || '1.0.0'}
									</span>
									<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {tool.name.includes('check') || tool.name.includes('query') || tool.name.includes('list') ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}">
										{tool.category || (tool.name.includes('check') ? 'READ_ONLY' : 'MUTATION')}
									</span>
								</div>
							</div>

							<p class="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>

							<div class="space-y-1">
								<div class="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
									<span class="uppercase font-bold">Input Schema:</span>
									<span>Transport: {tool.transport || 'stdio / json-rpc 2.0'}</span>
								</div>
								<pre class="p-2.5 rounded-xl bg-secondary/60 text-[11px] font-mono text-foreground overflow-x-auto border border-border/40 max-h-40">{JSON.stringify(tool.inputSchema, null, 2)}</pre>
							</div>
						</div>

						<div class="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
							<button
								type="button"
								onclick={() => openToolTestModal(tool)}
								class="px-2.5 py-1 rounded-md bg-secondary hover:bg-muted text-[11px] font-semibold text-foreground flex items-center gap-1 cursor-pointer"
							>
								<CommandLine class="h-3 w-3 text-cyan-500" />
								<span>Uji di Sandbox</span>
							</button>

							<button
								type="button"
								onclick={() => { selectedTool = tool.name; activeTab = 'playground'; }}
								class="px-2.5 py-1 rounded-md text-primary hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
							>
								<span>Buka di Playground</span>
								<Play class="h-3 w-3" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- TAB 4: INTERACTIVE PLAYGROUND -->
	{#if activeTab === "playground"}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Execution Form -->
			<div class="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-4">
				<div class="flex items-center gap-2 pb-2 border-b border-border/50 text-sm font-bold text-foreground">
					<CommandLine class="h-4 w-4 text-cyan-500" />
					<span>Uji Eksekusi Tool MCP</span>
				</div>

				<div class="space-y-3 text-xs">
					<div class="space-y-1">
						<label for="mcp-tool-select" class="font-semibold text-muted-foreground">Pilih Tool MCP:</label>
						<CustomSelect
							id="mcp-tool-select"
							bind:value={selectedTool}
							options={playgroundToolOptions}
						/>
					</div>

					{#if selectedTool === "check_invoice" || selectedTool === "stage_invoice_update"}
						<div class="space-y-1">
							<label for="mcp-invoice-no" class="font-semibold text-muted-foreground">Nomor Faktur (invoice_no):</label>
							<input
								id="mcp-invoice-no"
								type="text"
								bind:value={playgroundInvoiceNo}
								placeholder="INV/2026/001"
								class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono font-bold"
							/>
						</div>
					{/if}

					{#if selectedTool === "stage_invoice_update"}
						<div class="space-y-1">
							<label for="mcp-proposed-val" class="font-semibold text-muted-foreground">Nama Baru yang Diajukan (proposed_value):</label>
							<input
								id="mcp-proposed-val"
								type="text"
								bind:value={playgroundProposedValue}
								placeholder="PT Sumber Makmur Baru"
								class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono"
							/>
						</div>
					{/if}

					<button
						type="button"
						onclick={runPlayground}
						disabled={isExecutingPlayground}
						class="w-full h-9 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
					>
						{#if isExecutingPlayground}
							<ArrowPath class="h-4 w-4 animate-spin" />
							<span>Menjalankan JSON-RPC...</span>
						{:else}
							<Play class="h-4 w-4" />
							<span>Simulasikan Panggilan MCP Tool</span>
						{/if}
					</button>
				</div>
			</div>

			<!-- Response Console -->
			<div class="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 space-y-2 flex flex-col font-mono text-xs">
				<div class="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
					<span>JSON-RPC 2.0 Response Output</span>
					<span class="text-cyan-400 font-bold">@modelcontextprotocol/sdk</span>
				</div>

				<div class="flex-1 min-h-[260px] overflow-y-auto p-2 bg-black/60 rounded-xl border border-zinc-900">
					{#if playgroundResponse}
						<pre class="text-[11px] text-emerald-400 whitespace-pre-wrap">{playgroundResponse}</pre>
					{:else}
						<div class="text-zinc-600 p-8 text-center">
							Klik "Simulasikan Panggilan MCP Tool" untuk melihat respon payload JSON-RPC 2.0 secara realtime.
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- TAB 5: UPLOAD & REGISTRASI TOOL MCP                                       -->
	<!-- ========================================================================= -->
	{#if activeTab === "upload"}
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
							onclick={fetchRegisteredTools}
							disabled={isLoadingTools}
							class="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
						>
							<ArrowPath class="h-3.5 w-3.5 {isLoadingTools ? 'animate-spin' : ''}" />
							<span>{isLoadingTools ? 'Loading...' : 'Reload Tools'}</span>
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
								class="px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-[11px] font-mono cursor-pointer transition-colors font-semibold"
							>
								PostgreSQL Invoice Mutation
							</button>
							<button
								type="button"
								onclick={() => loadPresetManifest("customer_master_query")}
								class="px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-mono cursor-pointer transition-colors"
							>
								Customer Master Query
							</button>
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
							<ArrowUpTray class="h-3.5 w-3.5 text-cyan-500" />
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
							class="h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
					<div class="text-xs font-bold text-foreground">Active &amp; Registered MCP Tools ({registeredTools.length})</div>
					<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
						ZERO RAW SQL ENFORCED
					</span>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each registeredTools as tool}
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
								<label for="mcp-test-param-{key}" class="font-mono font-bold text-foreground">{key}:</label>
								<input
									id="mcp-test-param-{key}"
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

					<div class="flex items-center justify-end gap-2 pt-1">
						<button
							type="button"
							onclick={() => activeToolForTest = null}
							class="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
						>
							Close
						</button>
						<button
							type="button"
							onclick={executeToolTest}
							disabled={isExecutingToolTest}
							class="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
						>
							<ArrowPath class="h-3.5 w-3.5 {isExecutingToolTest ? 'animate-spin' : ''}" />
							<span>{isExecutingToolTest ? 'Executing...' : 'Run MCP Tool Simulation'}</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Modal Tambah Knowledge Resource MCP -->
	{#if showAddResourceModal}
		<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
			<div class="w-full max-w-xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				<div class="p-5 border-b border-border/60 flex items-center justify-between bg-muted/30">
					<div class="flex items-center gap-2.5">
						<div class="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
							<DocumentText class="h-4 w-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">Tambah Knowledge Resource MCP</h3>
							<p class="text-[11px] text-muted-foreground">Registrasikan dokumen pedoman SOP atau direktori untuk dibaca AI Agent</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => showAddResourceModal = false}
						class="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
					>
						<XMark class="h-4 w-4" />
					</button>
				</div>

				<div class="p-5 space-y-4 text-xs">
					{#if resourceActionError}
						<div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
							{resourceActionError}
						</div>
					{/if}

					<div class="space-y-1">
						<label for="new-res-uri" class="font-semibold text-muted-foreground">Resource URI (Protokol MCP):</label>
						<input
							id="new-res-uri"
							type="text"
							bind:value={newResource.uri}
							placeholder="novapilot://sop/aturan-faktur-surabaya"
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="space-y-1">
							<label for="new-res-name" class="font-semibold text-muted-foreground">Nama Dokumen:</label>
							<input
								id="new-res-name"
								type="text"
								bind:value={newResource.name}
								placeholder="SOP Revisi Faktur Pabrik SBY"
								class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
							/>
						</div>
						<div class="space-y-1">
							<label for="new-res-mime" class="font-semibold text-muted-foreground">MIME Type:</label>
							<select
								id="new-res-mime"
								bind:value={newResource.mimeType}
								class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono"
							>
								<option value="text/markdown">text/markdown</option>
								<option value="application/json">application/json</option>
								<option value="text/plain">text/plain</option>
							</select>
						</div>
					</div>

					<div class="space-y-1">
						<label for="new-res-desc" class="font-semibold text-muted-foreground">Deskripsi Singkat Dokumen:</label>
						<input
							id="new-res-desc"
							type="text"
							bind:value={newResource.description}
							placeholder="Panduan cutoff tanggal operasional dan penanggung jawab per cabang"
							class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
						/>
					</div>

					<div class="space-y-1">
						<label for="new-res-content" class="font-semibold text-muted-foreground">Konten Dokumen (Markdown / JSON):</label>
						<textarea
							id="new-res-content"
							bind:value={newResource.content}
							rows="6"
							placeholder="# Judul Pedoman Operasional&#10;&#10;1. Aturan pertama...&#10;2. Aturan kedua..."
							class="w-full p-3 rounded-lg border border-input bg-background font-mono text-xs leading-relaxed resize-y"
						></textarea>
					</div>

					<div class="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
						<button
							type="button"
							onclick={() => showAddResourceModal = false}
							class="h-9 px-4 rounded-lg border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
						>
							Batal
						</button>
						<button
							type="button"
							onclick={createMCPResource}
							disabled={isCreatingResource}
							class="h-9 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
						>
							{#if isCreatingResource}
								<ArrowPath class="h-3.5 w-3.5 animate-spin" />
								<span>Menyimpan...</span>
							{:else}
								<Check class="h-3.5 w-3.5" />
								<span>Simpan Knowledge Resource</span>
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
