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
		port: "5432",
		user: "postgres",
		password: "",
		dbname: "novapilot_db",
		sslmode: "disable"
	});

	// Statuses from backend GET /api/database/config
	let sysStatus = $state("CHECKING...");
	let mcpStatus = $state("CHECKING...");
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

	// Active tab
	let activeTab = $state<"system" | "mcp" | "env">("system");
	let copiedEnv = $state(false);

	// Animated SVG Connectors Simulation States
	let isSimulatingDb1 = $state(false);
	let isSimulatingDb2 = $state(false);

	function triggerDb1Burst() {
		isSimulatingDb1 = true;
		setTimeout(() => { isSimulatingDb1 = false; }, 1400);
	}

	function triggerDb2Burst() {
		isSimulatingDb2 = true;
		setTimeout(() => { isSimulatingDb2 = false; }, 1400);
	}

	// Tables info
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
					sysStatus = cfg.system_db.status || "CONNECTED";
				}
				if (cfg.mcp_ref_db) {
					mcpConfig.host = cfg.mcp_ref_db.host || "localhost";
					mcpConfig.port = cfg.mcp_ref_db.port || "5432";
					mcpConfig.user = cfg.mcp_ref_db.user || "postgres";
					mcpConfig.dbname = cfg.mcp_ref_db.dbname || "novapilot_db";
					mcpConfig.sslmode = cfg.mcp_ref_db.sslmode || "disable";
					mcpStatus = cfg.mcp_ref_db.status || "CONNECTED";
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
			const res = await fetch("/api/database/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					target: "mcp_ref",
					host: mcpConfig.host,
					port: mcpConfig.port,
					user: mcpConfig.user,
					password: mcpConfig.password,
					dbname: mcpConfig.dbname,
					sslmode: mcpConfig.sslmode
				})
			});

			const data = await res.json();
			if (data.ok) {
				mcpTestResult = {
					ok: true,
					latency_ms: data.latency_ms,
					message: data.message || "Koneksi database referensi MCP berhasil diverifikasi!",
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
		return `# ============================================================
# 1. DATABASE INTERNAL SISTEM (Operasional NovaPilot)
# ============================================================
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
# 2. DATABASE REFERENSI MCP (Data Faktur & Master Pelanggan)
# ============================================================
MCP_REF_DB_HOST=${mcpConfig.host}
MCP_REF_DB_PORT=${mcpConfig.port}
MCP_REF_DB_USER=${mcpConfig.user}
MCP_REF_DB_PASSWORD=${mcpConfig.password ? mcpConfig.password : "postgres"}
MCP_REF_DB_NAME=${mcpConfig.dbname}
MCP_REF_DB_SSLMODE=${mcpConfig.sslmode}
MCP_REF_DB_TIMEOUT_MS=5000`;
	}

	function copyEnvSnippet() {
		navigator.clipboard.writeText(generateEnvSnippet());
		copiedEnv = true;
		setTimeout(() => { copiedEnv = false; }, 2500);
	}

	onMount(() => {
		fetchConfigAndTelemetry();
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
						Konfigurasi & Setup Database
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Pengaturan terpisah untuk <strong>Database Internal Sistem</strong> (antrean tiket & audit) dan <strong>Database Referensi MCP</strong> (sumber data faktur & pelanggan).
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={fetchConfigAndTelemetry}
				disabled={isLoadingConfig}
				class="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="h-3.5 w-3.5 {isLoadingConfig ? 'animate-spin' : ''}" />
				<span>{isLoadingConfig ? 'Memuat Ulang...' : 'Muat Ulang Status'}</span>
			</button>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- ANIMATED SVG DUAL-DB CONNECTORS ARCHITECTURE                              -->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 overflow-hidden relative">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
			<div class="flex items-center gap-2.5">
				<div class="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
					<CircleStack class="h-4 w-4" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
						Diagram Aliran Konektor Dual-DB (Live Architecture)
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-primary/15 text-primary border border-primary/30">
							REALTIME ANIMATED
						</span>
					</h3>
					<p class="text-xs text-muted-foreground">Visualisasi pipa transmisi data internal sistem vs isolasi Model Context Protocol (MCP) ke ERP bisnis.</p>
				</div>
			</div>

			<!-- Trigger Buttons -->
			<div class="flex items-center gap-2 font-mono text-xs">
				<button
					type="button"
					onclick={triggerDb1Burst}
					disabled={isSimulatingDb1}
					class="h-8 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 {isSimulatingDb1 ? 'animate-ping' : ''}"></span>
					<span>Simulasi Kueri DB 1</span>
				</button>

				<button
					type="button"
					onclick={triggerDb2Burst}
					disabled={isSimulatingDb2}
					class="h-8 px-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-cyan-500 {isSimulatingDb2 ? 'animate-ping' : ''}"></span>
					<span>Simulasi Mutasi MCP DB 2</span>
				</button>
			</div>
		</div>

		<!-- SVG Canvas -->
		<div class="w-full overflow-x-auto py-2">
			<svg
				viewBox="0 0 960 230"
				class="w-full min-w-[780px] h-[210px] select-none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<style>
						@keyframes wireDashFlow {
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
						@keyframes diskBeam {
							0% { transform: translateY(0px); opacity: 0.3; }
							50% { transform: translateY(24px); opacity: 0.95; }
							100% { transform: translateY(0px); opacity: 0.3; }
						}
						@keyframes socketPingRipple {
							0% { r: 4px; opacity: 1; stroke-width: 2px; }
							100% { r: 14px; opacity: 0; stroke-width: 0.5px; }
						}
						.wire-flow-forward {
							stroke-dasharray: 6 4;
							animation: wireDashFlow 0.85s linear infinite;
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
						.conn-socket-pulse {
							animation: socketPingRipple 1.6s ease-out infinite;
						}
						.conn-beam {
							animation: diskBeam 1.8s ease-in-out infinite;
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

				<!-- ========================================================= -->
				<!-- LEFT BOX: NOVAPILOT CORE ENGINE (:8088 GO)                -->
				<!-- ========================================================= -->
				<g transform="translate(15, 20)">
					<rect
						x="0" y="0" width="185" height="190" rx="16"
						fill="currentColor"
						class="text-card stroke-emerald-500/80 stroke-[2px]"
					/>
					<rect x="0" y="0" width="185" height="34" rx="16" fill="#10b981" fill-opacity="0.16" />
					<text x="12" y="22" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-primary">🛡️ NovaPilot AI Core</text>
					<text x="135" y="22" font-family="monospace" font-size="9.5" fill="#10b981" font-weight="bold">:8088 Go</text>

					<g transform="translate(10, 44)">
						<rect x="0" y="0" width="165" height="42" rx="8" fill="currentColor" class="text-secondary/60" />
						<text x="8" y="16" font-family="monospace" font-size="9.5" font-weight="bold" fill="currentColor" class="text-foreground">Connection Pooler</text>
						<text x="8" y="30" font-family="monospace" font-size="8.5" fill="#10b981" font-weight="bold">Pool: {telemetry?.database?.open_connections || 0} / 25 Conns</text>
					</g>

					<g transform="translate(10, 94)">
						<rect x="0" y="0" width="165" height="40" rx="8" fill="currentColor" class="text-secondary/60" />
						<text x="8" y="16" font-family="monospace" font-size="9.5" font-weight="bold" fill="currentColor" class="text-foreground">Dual-Engine Router</text>
						<text x="8" y="29" font-family="monospace" font-size="8.5" fill="currentColor" class="text-muted-foreground">Internal vs ERP Isolation</text>
					</g>

					<g transform="translate(10, 142)">
						<rect x="0" y="0" width="165" height="38" rx="8" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.25" stroke-width="1" />
						<circle cx="10" cy="19" r="3" fill="#10b981" class="conn-led-fast" />
						<text x="18" y="22" font-family="monospace" font-size="9" font-weight="bold" fill="#10b981">Uptime: {Math.floor((telemetry?.uptime_seconds || 0) / 60)} min</text>
					</g>
				</g>

				<!-- ========================================================= -->
				<!-- UPPER PIPE: CORE -> DB 1 SYSTEM STORE                     -->
				<!-- ========================================================= -->
				<path
					d="M 200 65 L 430 65"
					fill="none"
					stroke="url(#connGradCoreToDB1)"
					stroke-width="2.5"
					class="wire-flow-forward"
				/>

				<!-- Socket Port 1 (DB 1) -->
				<circle cx="430" cy="65" r="4.5" fill="#10b981" />
				<circle cx="430" cy="65" r="5" fill="none" stroke="#10b981" class="conn-socket-pulse" />

				<!-- Continuous Live Packets: Core <-> DB 1 -->
				<circle r="4" fill="#10b981" filter="url(#dbConnGlow)">
					<animateMotion dur="1.3s" repeatCount="indefinite" path="M 200 65 L 430 65" />
				</circle>
				<circle r="3" fill="#34d399" filter="url(#dbConnGlow)">
					<animateMotion dur="1.8s" begin="0.5s" repeatCount="indefinite" path="M 430 65 L 200 65" />
				</circle>

				{#if isSimulatingDb1}
					<circle r="8" fill="#10b981" filter="url(#dbConnGlow)">
						<animateMotion dur="0.45s" repeatCount="1" path="M 200 65 L 430 65" />
					</circle>
				{/if}

				<!-- ========================================================= -->
				<!-- UPPER RIGHT: DB 1 (POSTGRESQL SYSTEM STORE)               -->
				<!-- ========================================================= -->
				<g transform="translate(430, 20)">
					<rect
						x="0" y="0" width="510" height="90" rx="14"
						fill="currentColor"
						class="text-card stroke-emerald-600/90 {isSimulatingDb1 ? 'active-box-glow' : 'stroke-[1.5px]'}"
					/>
					<rect x="0" y="0" width="510" height="30" rx="14" fill="#10b981" fill-opacity="0.16" />
					<text x="12" y="20" font-family="system-ui" font-size="12" font-weight="bold" fill="#059669">🗄️ Database Internal Sistem (PostgreSQL 18 Local)</text>
					<text x="430" y="20" font-family="monospace" font-size="9.5" font-weight="bold" fill="#10b981">● {sysStatus}</text>

					<!-- Table Badges & Descriptions -->
					<g transform="translate(12, 38)">
						<text x="4" y="16" font-family="monospace" font-size="10" font-weight="bold" fill="currentColor" class="text-foreground">Host: {sysConfig.host}:{sysConfig.port}/{sysConfig.dbname}</text>
						<text x="4" y="32" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">• tickets, audit_logs (HMAC Signed), inbound_messages, learned_patterns</text>
						<text x="4" y="44" font-family="monospace" font-size="8.5" fill="#10b981" font-weight="bold">✓ Transactional ACID Staging Store • Auto-Rollback Guard</text>
					</g>

					<!-- 3D Database Disk Platters (DB 1) -->
					<g transform="translate(455, 34)">
						<line x1="-10" y1="0" x2="34" y2="0" stroke="#10b981" stroke-width="1.5" class="conn-beam" filter="url(#dbConnGlow)" />
						<path d="M 0 8 v 7 a 15 5 0 0 0 30 0 v -7" fill="#059669" fill-opacity="0.45" stroke="#10b981" stroke-width="1" />
						<ellipse cx="15" cy="8" rx="15" ry="5" fill="#10b981" fill-opacity="0.65" stroke="#10b981" stroke-width="1.2" />
						<path d="M 0 19 v 7 a 15 5 0 0 0 30 0 v -7" fill="#047857" fill-opacity="0.55" stroke="#10b981" stroke-width="1" />
						<ellipse cx="15" cy="19" rx="15" ry="5" fill="#059669" fill-opacity="0.75" stroke="#10b981" stroke-width="1.2" />
						<circle cx="3" cy="38" r="2.5" fill="#10b981" class="conn-led-fast" />
						<text x="8" y="40" font-family="monospace" font-size="7" fill="#10b981" font-weight="bold">RD</text>
						<circle cx="18" cy="38" r="2.5" fill="#f59e0b" class="conn-led-slow" />
						<text x="23" y="40" font-family="monospace" font-size="7" fill="#f59e0b" font-weight="bold">WR</text>
					</g>
				</g>

				<!-- ========================================================= -->
				<!-- LOWER PIPE: CORE -> MCP GATEWAY -> DB 2                   -->
				<!-- ========================================================= -->
				<path
					d="M 200 165 L 290 165"
					fill="none"
					stroke="url(#connGradCoreToMCP)"
					stroke-width="2.5"
					class="wire-flow-forward"
				/>

				<!-- MCP Gateway Isolator Node -->
				<g transform="translate(290, 142)">
					<rect x="0" y="0" width="85" height="46" rx="10" fill="currentColor" class="text-card stroke-cyan-500/80 stroke-[1.5px]" />
					<rect x="0" y="0" width="85" height="18" rx="10" fill="#06b6d4" fill-opacity="0.18" />
					<text x="8" y="13" font-family="system-ui" font-size="9.5" font-weight="bold" fill="#06b6d4">🔌 MCP Tool</text>
					<text x="6" y="30" font-family="monospace" font-size="7.5" fill="currentColor" class="text-foreground">mutate_invoice()</text>
					<text x="6" y="40" font-family="monospace" font-size="7" fill="#06b6d4" font-weight="bold">Zero Raw SQL</text>
				</g>

				<path
					d="M 375 165 L 430 165"
					fill="none"
					stroke="url(#connGradMCPToDB2)"
					stroke-width="2.5"
					class="wire-flow-forward"
				/>

				<!-- Socket Port 2 (DB 2) -->
				<circle cx="430" cy="165" r="4.5" fill="#06b6d4" />
				<circle cx="430" cy="165" r="5" fill="none" stroke="#06b6d4" class="conn-socket-pulse" />

				<!-- Continuous Live Packets: MCP <-> DB 2 -->
				<circle r="4" fill="#06b6d4" filter="url(#dbConnGlow)">
					<animateMotion dur="1.4s" repeatCount="indefinite" path="M 200 165 L 290 165" />
				</circle>
				<circle r="4" fill="#06b6d4" filter="url(#dbConnGlow)">
					<animateMotion dur="0.9s" begin="0.3s" repeatCount="indefinite" path="M 375 165 L 430 165" />
				</circle>
				<circle r="3" fill="#38bdf8" filter="url(#dbConnGlow)">
					<animateMotion dur="1.7s" begin="0.6s" repeatCount="indefinite" path="M 430 165 L 375 165" />
				</circle>

				{#if isSimulatingDb2}
					<circle r="8" fill="#06b6d4" filter="url(#dbConnGlow)">
						<animateMotion dur="0.45s" repeatCount="1" path="M 375 165 L 430 165" />
					</circle>
				{/if}

				<!-- ========================================================= -->
				<!-- LOWER RIGHT: DB 2 (ENTERPRISE ERP STORE VIA MCP)          -->
				<!-- ========================================================= -->
				<g transform="translate(430, 120)">
					<rect
						x="0" y="0" width="510" height="90" rx="14"
						fill="currentColor"
						class="text-card stroke-blue-600/90 {isSimulatingDb2 ? 'active-box-glow' : 'stroke-[1.5px]'}"
					/>
					<rect x="0" y="0" width="510" height="30" rx="14" fill="#2563eb" fill-opacity="0.16" />
					<text x="12" y="20" font-family="system-ui" font-size="12" font-weight="bold" fill="#2563eb">🏢 Database Referensi MCP &amp; ERP Store (Oracle 19c / ERP Prod)</text>
					<text x="430" y="20" font-family="monospace" font-size="9.5" font-weight="bold" fill="#06b6d4">● {mcpStatus}</text>

					<!-- Table Badges & Descriptions -->
					<g transform="translate(12, 38)">
						<text x="4" y="16" font-family="monospace" font-size="10" font-weight="bold" fill="currentColor" class="text-foreground">Host: {mcpConfig.host}:{mcpConfig.port}/{mcpConfig.dbname}</text>
						<text x="4" y="32" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">• invoices (Buku Besar Transaksi), customer_master (Entitas Resmi)</text>
						<text x="4" y="44" font-family="monospace" font-size="8.5" fill="#2563eb" font-weight="bold">🔒 Terisolasi Total di Balik Protokol MCP • Parameterized Prepared Statements Saja</text>
					</g>

					<!-- 3D Database Disk Platters (DB 2) -->
					<g transform="translate(445, 34)">
						<line x1="-10" y1="0" x2="34" y2="0" stroke="#06b6d4" stroke-width="1.5" class="conn-beam" filter="url(#dbConnGlow)" />
						<path d="M 0 8 v 7 a 15 5 0 0 0 30 0 v -7" fill="#0284c7" fill-opacity="0.45" stroke="#06b6d4" stroke-width="1" />
						<ellipse cx="15" cy="8" rx="15" ry="5" fill="#06b6d4" fill-opacity="0.65" stroke="#06b6d4" stroke-width="1.2" />
						<path d="M 0 19 v 7 a 15 5 0 0 0 30 0 v -7" fill="#0369a1" fill-opacity="0.55" stroke="#06b6d4" stroke-width="1" />
						<ellipse cx="15" cy="19" rx="15" ry="5" fill="#0284c7" fill-opacity="0.75" stroke="#06b6d4" stroke-width="1.2" />
						<circle cx="3" cy="38" r="2.5" fill="#06b6d4" class="conn-led-fast" />
						<text x="8" y="40" font-family="monospace" font-size="7" fill="#06b6d4" font-weight="bold">TX</text>
						<circle cx="18" cy="38" r="2.5" fill="#3b82f6" class="conn-led-slow" />
						<text x="23" y="40" font-family="monospace" font-size="7" fill="#3b82f6" font-weight="bold">OK</text>
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
						<div class="text-[11px] font-mono text-muted-foreground">{sysConfig.host}:{sysConfig.port}/{sysConfig.dbname}</div>
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
						<div class="text-[11px] font-mono text-muted-foreground">{mcpConfig.host}:{mcpConfig.port}/{mcpConfig.dbname}</div>
					</div>
				</div>

				<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold {mcpStatus === 'CONNECTED' ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : mcpStatus === 'STANDBY' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'}">
					● {mcpStatus}
				</span>
			</div>

			<div class="text-[11px] text-muted-foreground leading-relaxed">
				Sumber data referensi faktur dan pelanggan bisnis yang diakses secara terkontrol oleh tool MCP (read-only pre-flight).
			</div>

			<div class="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
				<span class="font-mono text-muted-foreground">Protokol: Model Context Protocol</span>
				<button
					type="button"
					onclick={() => activeTab = "mcp"}
					class="text-xs text-primary hover:underline font-medium cursor-pointer"
				>
					Konfigurasi Referensi MCP &rarr;
				</button>
			</div>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="flex items-center gap-2 border-b border-border/50 pb-1 text-xs font-semibold">
		<button
			type="button"
			onclick={() => activeTab = "system"}
			class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 {activeTab === 'system' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<ServerStack class="h-3.5 w-3.5" />
			<span>1. Database Internal Sistem</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "mcp"}
			class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 {activeTab === 'mcp' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CircleStack class="h-3.5 w-3.5" />
			<span>2. Database Referensi MCP</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "env"}
			class="px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 {activeTab === 'env' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<ClipboardDocument class="h-3.5 w-3.5" />
			<span>3. Setup File .env</span>
		</button>
	</div>

	<!-- ========================================================================= -->
	<!-- TAB 1: DATABASE INTERNAL SISTEM                                           -->
	<!-- ========================================================================= -->
	{#if activeTab === "system"}
		<div class="space-y-6">
			<!-- Config Form Box -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
					<div>
						<h2 class="text-sm font-bold text-foreground">Parameter Koneksi Database Internal</h2>
						<p class="text-xs text-muted-foreground">Koneksi PostgreSQL yang digunakan oleh server Go untuk seluruh data sistem.</p>
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

				<!-- Inputs Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
					<div class="space-y-1">
						<label for="sys-host" class="font-semibold text-muted-foreground">Host:</label>
						<input
							id="sys-host"
							type="text"
							bind:value={sysConfig.host}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="localhost"
						/>
					</div>

					<div class="space-y-1">
						<label for="sys-port" class="font-semibold text-muted-foreground">Port:</label>
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
								<th class="py-2.5 px-3.5 font-bold">Deskripsi & Peran</th>
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
	<!-- TAB 2: DATABASE REFERENSI MCP                                             -->
	<!-- ========================================================================= -->
	{#if activeTab === "mcp"}
		<div class="space-y-6">
			<!-- Config Form Box -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
					<div>
						<h2 class="text-sm font-bold text-foreground">Parameter Koneksi Database Referensi MCP</h2>
						<p class="text-xs text-muted-foreground">Sumber data faktur & master pelanggan yang dikueri oleh tool Model Context Protocol.</p>
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

				<!-- Inputs Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
					<div class="space-y-1">
						<label for="mcp-host" class="font-semibold text-muted-foreground">Host Referensi:</label>
						<input
							id="mcp-host"
							type="text"
							bind:value={mcpConfig.host}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="localhost"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-port" class="font-semibold text-muted-foreground">Port:</label>
						<input
							id="mcp-port"
							type="text"
							bind:value={mcpConfig.port}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="5432"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-dbname" class="font-semibold text-muted-foreground">Nama Database:</label>
						<input
							id="mcp-dbname"
							type="text"
							bind:value={mcpConfig.dbname}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="novapilot_db"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-user" class="font-semibold text-muted-foreground">User:</label>
						<input
							id="mcp-user"
							type="text"
							bind:value={mcpConfig.user}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
							placeholder="postgres"
						/>
					</div>

					<div class="space-y-1">
						<label for="mcp-password" class="font-semibold text-muted-foreground">Password:</label>
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
						<label for="mcp-sslmode" class="font-semibold text-muted-foreground">SSL Mode:</label>
						<select
							id="mcp-sslmode"
							bind:value={mcpConfig.sslmode}
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

			<!-- Protocol Isolation & Security Rules -->
			<div class="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-3 shadow-xs text-xs">
				<div class="flex items-center gap-2 font-bold text-cyan-600 dark:text-cyan-400">
					<ShieldCheck class="h-4 w-4" />
					<span>Kebijakan Akses Tool MCP terhadap Database Referensi</span>
				</div>
				<p class="text-muted-foreground leading-relaxed">
					Bot atau AI Agent <strong>tidak diberikan akses SQL langsung</strong> (Direct SQL Access) ke database referensi ini. 
					Kueri hanya dapat dilakukan melalui fungsi resmi server MCP:
				</p>
				<ul class="list-disc list-inside space-y-1 text-foreground font-mono text-[11px]">
					<li><code>check_invoice(invoice_no)</code> &rarr; Membaca verifikasi data faktur (read-only).</li>
					<li><code>stage_invoice_update(...)</code> &rarr; Menampung usulan perubahan ke antrean tiket sistem (tanpa mengeksekusi UPDATE langsung).</li>
				</ul>
			</div>

			<!-- Tabel Referensi yang Diakses Tool MCP -->
			<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
				<div class="text-xs font-bold text-foreground">Tabel Referensi yang Diakses ({mcpReferenceTables.length})</div>
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
	<!-- TAB 3: SETUP FILE .ENV HELPER                                             -->
	<!-- ========================================================================= -->
	{#if activeTab === "env"}
		<div class="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
			<div class="flex items-center justify-between pb-2 border-b border-border/50">
				<div>
					<h2 class="text-sm font-bold text-foreground">Konfigurasi .env Terpadu</h2>
					<p class="text-xs text-muted-foreground">Salin variabel lingkungan ini ke file <code>.env</code> root dan <code>backend/.env</code>.</p>
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
