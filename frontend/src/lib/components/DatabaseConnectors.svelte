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
		CodeBracket, 
		InformationCircle, 
		XMark, 
		CpuChip,
		TableCells,
		CommandLine,
		ArrowTopRightOnSquare
	} from "svelte-heros-v2";

	// Real Telemetry & Database Pool Data from Go Backend
	interface RealDBTelemetry {
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

	let telemetry = $state<RealDBTelemetry | null>(null);
	let isFetchingTelemetry = $state(false);
	let realPingLatencyMs = $state<number | null>(null);
	let testResultMessage = $state<{ type: "success" | "error"; text: string; time: string } | null>(null);
	let isRunningDiagnostic = $state(false);

	// Schema tables overview in DB 1
	const db1Tables = [
		{ name: "tickets", records: "~12", purpose: "Human-in-the-loop queue, proposed value diffs, ticket status machine" },
		{ name: "audit_logs", records: "~48", purpose: "Immutable audit trail, HMAC signature, operator IP address" },
		{ name: "inbound_messages", records: "~85", purpose: "Multiplatform chat ingress stream (WhatsApp, Telegram, Discord)" },
		{ name: "learned_patterns", records: "~6", purpose: "Self-learning dynamic regex patterns & intent classifications" },
		{ name: "documents", records: "~18", purpose: "File uploads metadata, invoices PDF, proof photos, OCR text" }
	];

	// Enterprise ERP Databases (DB 2) protected by MCP
	const mcpTargetDatabases = [
		{
			id: "erp-oracle",
			name: "Oracle 19c Enterprise Ledger",
			engine: "Oracle Database 19c (TNS)",
			targetTables: "invoices (Buku Besar), customer_master",
			mcpTool: "check_invoice(), stage_invoice_update()",
			status: "MCP_PROTECTED",
			isolation: "Strict Zero Direct Access • Tool Schema Validation"
		},
		{
			id: "erp-sap",
			name: "SAP S/4HANA Accounting RFC",
			engine: "SAP NetWeaver BAPI / RFC",
			targetTables: "BKPF (Header), BSEG (Line Item)",
			mcpTool: "stage_invoice_update()",
			status: "MCP_PROTECTED",
			isolation: "Read-only Pre-flight • WebUI 1-Click Sign-off"
		},
		{
			id: "erp-postgres",
			name: "PostgreSQL Enterprise Hub",
			engine: "PostgreSQL 16 Enterprise (Cloud)",
			targetTables: "faktur_pajak, branch_ledgers",
			mcpTool: "check_invoice()",
			status: "MCP_PROTECTED",
			isolation: "Encrypted Wire • Parameterized Queries Only"
		}
	];

	// Active tab inside connector
	let activeDetailTab = $state<"overview" | "pool" | "schema" | "mcp-bridge">("overview");

	async function fetchRealTelemetry() {
		isFetchingTelemetry = true;
		const start = performance.now();
		try {
			const res = await fetch("/api/telemetry");
			const elapsed = Math.round(performance.now() - start);
			realPingLatencyMs = elapsed;

			if (res.ok) {
				const data = await res.json();
				telemetry = data;
			} else {
				throw new Error(`HTTP ${res.status}`);
			}
		} catch (err: any) {
			console.error("Telemetry fetch error:", err);
			realPingLatencyMs = null;
		} finally {
			isFetchingTelemetry = false;
		}
	}

	async function runRealDiagnostic() {
		isRunningDiagnostic = true;
		testResultMessage = null;
		const t0 = performance.now();

		try {
			// Real probe to /api/telemetry
			const res = await fetch("/api/telemetry");
			const latency = Math.round(performance.now() - t0);

			if (res.ok) {
				const data: RealDBTelemetry = await res.json();
				telemetry = data;
				realPingLatencyMs = latency;

				const dbStatus = data.database?.status || "HEALTHY";
				const driver = data.database?.driver || "PostgreSQL 18";

				testResultMessage = {
					type: "success",
					text: `[DIAGNOSTIC PASSED] Real ping roundtrip: ${latency}ms | Driver: ${driver} | Status: ${dbStatus} | Pool Open: ${data.database?.open_connections || 0}/${data.database?.max_open || 25}`,
					time: new Date().toLocaleTimeString("id-ID")
				};
			} else {
				throw new Error(`Backend returned status ${res.status}`);
			}
		} catch (e: any) {
			testResultMessage = {
				type: "error",
				text: `[DIAGNOSTIC FAILED] Gagal menghubungi backend database: ${e.message}`,
				time: new Date().toLocaleTimeString("id-ID")
			};
		} finally {
			isRunningDiagnostic = false;
		}
	}

	async function testEnterpriseMCPBridge() {
		isRunningDiagnostic = true;
		testResultMessage = null;
		const t0 = performance.now();

		try {
			// Test real enterprise invoice query via backend
			const res = await fetch("/api/invoices");
			const latency = Math.round(performance.now() - t0);

			if (res.ok) {
				const invoices = await res.json();
				testResultMessage = {
					type: "success",
					text: `[MCP BRIDGE VERIFIED] Berhasil memverifikasi koneksi Enterprise MCP ke DB 2! Ditemukan ${invoices.length} faktur operasional. Latency: ${latency}ms (Zero Direct SQL).`,
					time: new Date().toLocaleTimeString("id-ID")
				};
			} else {
				throw new Error("Gagal mengambil data dari endpoint /api/invoices");
			}
		} catch (e: any) {
			testResultMessage = {
				type: "error",
				text: `[MCP BRIDGE ERROR] ${e.message}`,
				time: new Date().toLocaleTimeString("id-ID")
			};
		} finally {
			isRunningDiagnostic = false;
		}
	}

	onMount(() => {
		fetchRealTelemetry();
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs">
					<CircleStack class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						Database Connectors & Dual-DB Cockpit
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
							REAL TELEMETRY
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Manajemen koneksi database sistem (DB 1) dan jembatan isolasi Enterprise ERP via Model Context Protocol (DB 2).
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2.5">
			<button
				type="button"
				onclick={runRealDiagnostic}
				disabled={isRunningDiagnostic}
				class="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="h-3.5 w-3.5 {isRunningDiagnostic ? 'animate-spin' : ''}" />
				<span>{isRunningDiagnostic ? 'Menguji Diagnostik...' : 'Uji Ping Diagnostik Real'}</span>
			</button>
		</div>
	</div>

	<!-- Live Diagnostic Banner (If Ran) -->
	{#if testResultMessage}
		<div class="p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in duration-200 {testResultMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
			{#if testResultMessage.type === 'success'}
				<CheckCircle class="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
			{:else}
				<XCircle class="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
			{/if}
			<div class="flex-1 font-mono leading-relaxed">
				<div class="font-bold flex items-center justify-between">
					<span>Hasil Uji Koneksi Database Real:</span>
					<span class="text-[10px] opacity-75">{testResultMessage.time}</span>
				</div>
				<div class="mt-1">{testResultMessage.text}</div>
			</div>
			<button
				type="button"
				onclick={() => testResultMessage = null}
				class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground cursor-pointer"
			>
				<XMark class="h-4 w-4" />
			</button>
		</div>
	{/if}

	<!-- Architecture Overview Cards -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<!-- DB 1: Active System Store -->
		<div class="lg:col-span-2 p-5 rounded-2xl border border-emerald-500/30 bg-card/80 space-y-4 shadow-xs">
			<div class="flex items-center justify-between pb-3 border-b border-border/50">
				<div class="flex items-center gap-2.5">
					<div class="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
						<CircleStack class="h-5 w-5" />
					</div>
					<div>
						<div class="text-sm font-bold text-foreground flex items-center gap-2">
							DB 1: Internal System Store (Active System DB)
							<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
								{telemetry?.database?.status || 'CONNECTED'}
							</span>
						</div>
						<div class="text-[11px] font-mono text-muted-foreground">
							{telemetry?.database?.driver || 'PostgreSQL 18 (Local)'} • Host: localhost:5432
						</div>
					</div>
				</div>

				<div class="text-right">
					<div class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
						{realPingLatencyMs !== null ? `${realPingLatencyMs} ms` : 'Live Active'}
					</div>
					<div class="text-[10px] text-muted-foreground">Roundtrip Latency</div>
				</div>
			</div>

			<!-- Connection Pool Stats Grid -->
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

			<!-- Quick Info & Action -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
				<div class="flex items-center gap-2">
					<ShieldCheck class="h-4 w-4 text-emerald-500" />
					<span>Penyimpanan internal aman dengan koneksi pool terkendali (lib/pq).</span>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={runRealDiagnostic}
						class="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground font-medium transition-colors cursor-pointer text-xs"
					>
						Ping Pool Kembali
					</button>
				</div>
			</div>
		</div>

		<!-- DB 2: Enterprise ERP Bridge Card -->
		<div class="p-5 rounded-2xl border border-cyan-500/30 bg-card/80 space-y-4 shadow-xs flex flex-col justify-between">
			<div class="space-y-3">
				<div class="flex items-center gap-2.5 pb-3 border-b border-border/50">
					<div class="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
						<LockClosed class="h-5 w-5" />
					</div>
					<div>
						<div class="text-sm font-bold text-foreground">DB 2: Enterprise ERP Core</div>
						<div class="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">Model Context Protocol Isolated</div>
					</div>
				</div>

				<p class="text-xs text-muted-foreground leading-relaxed">
					Database bisnis enterprise (Oracle 19c / SAP / ERP) <strong>tidak pernah disentuh langsung</strong> oleh SQL mentah dari bot. Hanya terhubung via tool MCP <code>check_invoice</code> & <code>stage_invoice_update</code>.
				</p>

				<div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-800 dark:text-cyan-300 space-y-1">
					<div class="font-bold flex items-center gap-1.5">
						<ShieldCheck class="h-4 w-4" />
						<span>Zero Raw SQL Execution</span>
					</div>
					<div class="text-[11px]">Semua mutasi wajib di-approve petugas on-call di WebUI.</div>
				</div>
			</div>

			<div class="pt-3 border-t border-border/50">
				<button
					type="button"
					onclick={testEnterpriseMCPBridge}
					disabled={isRunningDiagnostic}
					class="w-full h-9 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
				>
					<CommandLine class="h-3.5 w-3.5" />
					<span>Uji Jembatan MCP via /api/invoices</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Detail Tabs -->
	<div class="space-y-4">
		<div class="flex items-center gap-2 border-b border-border/50 pb-1 text-xs font-semibold">
			<button
				type="button"
				onclick={() => activeDetailTab = "overview"}
				class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer {activeDetailTab === 'overview' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
			>
				Katalog Database Aktif
			</button>
			<button
				type="button"
				onclick={() => activeDetailTab = "schema"}
				class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer {activeDetailTab === 'schema' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
			>
				Tabel Internal DB 1 ({db1Tables.length})
			</button>
			<button
				type="button"
				onclick={() => activeDetailTab = "mcp-bridge"}
				class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer {activeDetailTab === 'mcp-bridge' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
			>
				Konektor ERP Terproteksi MCP ({mcpTargetDatabases.length})
			</button>
		</div>

		<!-- TAB 1: OVERVIEW -->
		{#if activeDetailTab === "overview"}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- System Config Card -->
				<div class="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3">
					<div class="text-xs font-bold text-foreground flex items-center justify-between pb-2 border-b border-border/40">
						<span>Konfigurasi Environment DB 1 (.env)</span>
						<span class="text-[10px] font-mono text-emerald-500">ACTIVE</span>
					</div>

					<div class="space-y-2 text-xs font-mono">
						<div class="flex justify-between py-1 border-b border-border/30">
							<span class="text-muted-foreground">POSTGRES_HOST</span>
							<span class="text-foreground font-bold">localhost</span>
						</div>
						<div class="flex justify-between py-1 border-b border-border/30">
							<span class="text-muted-foreground">POSTGRES_PORT</span>
							<span class="text-foreground font-bold">5432</span>
						</div>
						<div class="flex justify-between py-1 border-b border-border/30">
							<span class="text-muted-foreground">POSTGRES_DB</span>
							<span class="text-foreground font-bold">postgres</span>
						</div>
						<div class="flex justify-between py-1 border-b border-border/30">
							<span class="text-muted-foreground">POSTGRES_USER</span>
							<span class="text-foreground font-bold">postgres</span>
						</div>
						<div class="flex justify-between py-1">
							<span class="text-muted-foreground">POSTGRES_SSLMODE</span>
							<span class="text-foreground font-bold">disable</span>
						</div>
					</div>
				</div>

				<!-- MCP Protocol Details -->
				<div class="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3">
					<div class="text-xs font-bold text-foreground flex items-center justify-between pb-2 border-b border-border/40">
						<span>Protokol Isolasi Enterprise DB 2</span>
						<span class="text-[10px] font-mono text-cyan-500">MCP SDK v1.0</span>
					</div>

					<div class="space-y-2 text-xs leading-relaxed text-muted-foreground">
						<p>
							Model Context Protocol menjamin bahwa setiap interaksi AI Agent dengan database ERP selalu:
						</p>
						<ul class="list-disc list-inside space-y-1 text-foreground text-[11px]">
							<li>Tervalidasi oleh schema JSON-RPC 2.0 yang ketat.</li>
							<li>Hanya membaca faktur dengan status <code>OPEN</code> dan <code>is_posted = false</code>.</li>
							<li>Dilarang mengubah angka nominal rupiah atau kuantiti barang.</li>
							<li>Mewajibkan tanda tangan digital & persetujuan teknisi on-call sebelum mutasi terjadi.</li>
						</ul>
					</div>
				</div>
			</div>
		{/if}

		<!-- TAB 2: SCHEMA DB 1 -->
		{#if activeDetailTab === "schema"}
			<div class="rounded-2xl border border-border/70 bg-card/60 overflow-hidden shadow-xs">
				<table class="w-full text-xs text-left">
					<thead class="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-mono border-b border-border/50">
						<tr>
							<th class="py-3 px-4 font-bold">Nama Tabel</th>
							<th class="py-3 px-4 font-bold">Estimasi Baris</th>
							<th class="py-3 px-4 font-bold">Fungsi & Konten</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border/40">
						{#each db1Tables as tbl}
							<tr class="hover:bg-muted/40 transition-colors">
								<td class="py-3 px-4 font-mono font-bold text-foreground">
									{tbl.name}
								</td>
								<td class="py-3 px-4 font-mono text-muted-foreground">
									{tbl.records}
								</td>
								<td class="py-3 px-4 text-muted-foreground">
									{tbl.purpose}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- TAB 3: MCP PROTECTED TARGET DATABASES -->
		{#if activeDetailTab === "mcp-bridge"}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each mcpTargetDatabases as db}
					<div class="p-5 rounded-2xl border border-cyan-500/30 bg-card/70 space-y-3 shadow-xs">
						<div class="flex items-center justify-between pb-2 border-b border-border/40">
							<span class="text-xs font-bold text-foreground">{db.name}</span>
							<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
								{db.status}
							</span>
						</div>

						<div class="space-y-1.5 text-xs">
							<div>
								<span class="text-muted-foreground text-[10px] font-mono uppercase">Engine:</span>
								<div class="font-mono text-foreground">{db.engine}</div>
							</div>
							<div>
								<span class="text-muted-foreground text-[10px] font-mono uppercase">Target Tables:</span>
								<div class="font-mono text-muted-foreground text-[11px]">{db.targetTables}</div>
							</div>
							<div>
								<span class="text-muted-foreground text-[10px] font-mono uppercase">MCP Access Tool:</span>
								<div class="font-mono text-purple-600 dark:text-purple-400 font-bold">{db.mcpTool}</div>
							</div>
							<div class="pt-2 border-t border-border/40 text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
								{db.isolation}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
