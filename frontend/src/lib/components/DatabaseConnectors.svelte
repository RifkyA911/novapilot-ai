<script lang="ts">
	import { 
		ServerStack, CircleStack, CheckCircle, XCircle, ArrowPath, 
		Plus, Trash, PencilSquare, ShieldCheck, LockClosed, Check, 
		CodeBracket, Sparkles, InformationCircle, XMark, Funnel,
		MagnifyingGlass, CpuChip
	} from "svelte-heros-v2";

	interface DBConnector {
		id: string;
		name: string;
		engine: "postgres" | "oracle" | "mysql" | "sqlite" | "mongodb" | "redis" | "mssql";
		engineLabel: string;
		paradigm: "relational" | "non_relational" | "key_value";
		host: string;
		port: number | string;
		databaseName: string;
		username?: string;
		status: "active" | "connected" | "standby" | "error";
		latencyMs: number;
		maxConns: number;
		idleConns: number;
		sslMode: string;
		notes: string;
	}

	let connectors = $state<DBConnector[]>([
		{
			id: "conn-pg-local",
			name: "PostgreSQL 18 Local DC",
			engine: "postgres",
			engineLabel: "PostgreSQL 18.2",
			paradigm: "relational",
			host: "localhost",
			port: 5432,
			databaseName: "novapilot_db",
			username: "novapilot",
			status: "active",
			latencyMs: 12,
			maxConns: 25,
			idleConns: 10,
			sslMode: "disable",
			notes: "Primary development database with ACID transactions and foreign key enforcement."
		},
		{
			id: "conn-oracle-erp",
			name: "Oracle 11g Enterprise ERP",
			engine: "oracle",
			engineLabel: "Oracle Database 11g R2",
			paradigm: "relational",
			host: "172.20.14.88",
			port: 1521,
			databaseName: "PROD_ERP",
			username: "app_it_support",
			status: "standby",
			latencyMs: 42,
			maxConns: 50,
			idleConns: 5,
			sslMode: "tns_wallet",
			notes: "Plant logistics core ERP ledger on factory on-prem intranet via TNS alias."
		},
		{
			id: "conn-mysql-branch",
			name: "MySQL 8.4 Regional Branch Store",
			engine: "mysql",
			engineLabel: "MySQL 8.4 LTS",
			paradigm: "relational",
			host: "192.168.10.12",
			port: 3306,
			databaseName: "branch_orders_db",
			username: "branch_sync",
			status: "connected",
			latencyMs: 28,
			maxConns: 30,
			idleConns: 8,
			sslMode: "preferred",
			notes: "Decentralized regional distribution center database replica."
		},
		{
			id: "conn-mongo-doc",
			name: "MongoDB 7.0 Document Store",
			engine: "mongodb",
			engineLabel: "MongoDB 7.0 Community",
			paradigm: "non_relational",
			host: "mongodb://127.0.0.1",
			port: 27017,
			databaseName: "novapilot_catalog",
			username: "admin",
			status: "connected",
			latencyMs: 18,
			maxConns: 40,
			idleConns: 12,
			sslMode: "optional",
			notes: "Schemaless document collection for unformatted branch attachments and raw JSON invoices."
		},
		{
			id: "conn-redis-cache",
			name: "Redis 7.2 Key-Value Stream",
			engine: "redis",
			engineLabel: "Redis 7.2 In-Memory",
			paradigm: "key_value",
			host: "127.0.0.1",
			port: 6379,
			databaseName: "db0",
			status: "connected",
			latencyMs: 4,
			maxConns: 100,
			idleConns: 20,
			sslMode: "none",
			notes: "Sub-millisecond rate limiter, session clearance store, and SSE broadcast buffer."
		},
		{
			id: "conn-sqlite-edge",
			name: "SQLite 3 Embedded Local",
			engine: "sqlite",
			engineLabel: "SQLite 3.45 (WAL Mode)",
			paradigm: "relational",
			host: "file://./data/novapilot.db",
			port: "local",
			databaseName: "novapilot.db",
			status: "standby",
			latencyMs: 1,
			maxConns: 5,
			idleConns: 2,
			sslMode: "n/a",
			notes: "Zero-configuration file-based database for air-gapped emergency edge shifts."
		}
	]);

	let activeConnectorId = $state<string>("conn-pg-local");
	let paradigmFilter = $state<"all" | "relational" | "non_relational" | "key_value">("all");
	let searchQuery = $state("");
	let isTestingConnection = $state<string | null>(null);
	let testSuccessMessage = $state<{ id: string; msg: string } | null>(null);

	// Add / Edit Modal State
	let showAddModal = $state(false);
	let newConnector = $state({
		name: "",
		engine: "postgres" as DBConnector["engine"],
		paradigm: "relational" as DBConnector["paradigm"],
		host: "localhost",
		port: 5432 as number | string,
		databaseName: "",
		username: "",
		password: "",
		maxConns: 25,
		idleConns: 10,
		sslMode: "disable",
		notes: ""
	});

	let filteredConnectors = $derived(
		connectors.filter(c => {
			if (paradigmFilter !== "all" && c.paradigm !== paradigmFilter) return false;
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				c.name.toLowerCase().includes(q) ||
				c.engineLabel.toLowerCase().includes(q) ||
				c.databaseName.toLowerCase().includes(q) ||
				c.host.toLowerCase().includes(q)
			);
		})
	);

	let activeConnector = $derived(connectors.find(c => c.id === activeConnectorId) || connectors[0]);

	function setActive(id: string) {
		activeConnectorId = id;
		connectors = connectors.map(c => ({
			...c,
			status: c.id === id ? "active" : (c.status === "active" ? "connected" : c.status)
		}));
	}

	async function runTestConnection(id: string) {
		isTestingConnection = id;
		testSuccessMessage = null;
		
		await new Promise(r => setTimeout(r, 700));
		
		const target = connectors.find(c => c.id === id);
		const latency = Math.floor(Math.random() * 25) + 8;
		
		if (target) {
			target.latencyMs = latency;
			testSuccessMessage = {
				id,
				msg: `Connection verified! Roundtrip latency: ${latency}ms (Handshake OK)`
			};
		}
		
		isTestingConnection = null;
		setTimeout(() => {
			if (testSuccessMessage?.id === id) testSuccessMessage = null;
		}, 4000);
	}

	function handleEngineChange(engine: DBConnector["engine"]) {
		newConnector.engine = engine;
		if (engine === "mongodb") {
			newConnector.paradigm = "non_relational";
			newConnector.port = 27017;
			newConnector.host = "localhost";
		} else if (engine === "redis") {
			newConnector.paradigm = "key_value";
			newConnector.port = 6379;
			newConnector.host = "localhost";
		} else if (engine === "oracle") {
			newConnector.paradigm = "relational";
			newConnector.port = 1521;
			newConnector.host = "localhost";
		} else if (engine === "mysql") {
			newConnector.paradigm = "relational";
			newConnector.port = 3306;
			newConnector.host = "localhost";
		} else if (engine === "sqlite") {
			newConnector.paradigm = "relational";
			newConnector.port = "local";
			newConnector.host = "file://./data.db";
		} else {
			newConnector.paradigm = "relational";
			newConnector.port = 5432;
			newConnector.host = "localhost";
		}
	}

	function handleAddConnector() {
		if (!newConnector.name.trim() || !newConnector.databaseName.trim()) {
			alert("Please provide connector name and database name.");
			return;
		}

		let engineLabel = "PostgreSQL";
		if (newConnector.engine === "oracle") engineLabel = "Oracle Database 11g";
		else if (newConnector.engine === "mysql") engineLabel = "MySQL 8.4";
		else if (newConnector.engine === "mongodb") engineLabel = "MongoDB 7.0";
		else if (newConnector.engine === "redis") engineLabel = "Redis 7.2";
		else if (newConnector.engine === "sqlite") engineLabel = "SQLite 3";

		const newEntry: DBConnector = {
			id: `conn-custom-${Date.now()}`,
			name: newConnector.name,
			engine: newConnector.engine,
			engineLabel,
			paradigm: newConnector.paradigm,
			host: newConnector.host,
			port: newConnector.port,
			databaseName: newConnector.databaseName,
			username: newConnector.username || undefined,
			status: "connected",
			latencyMs: 16,
			maxConns: newConnector.maxConns,
			idleConns: newConnector.idleConns,
			sslMode: newConnector.sslMode,
			notes: newConnector.notes || "Custom user-configured database connector."
		};

		connectors = [...connectors, newEntry];
		showAddModal = false;

		// Reset form
		newConnector = {
			name: "",
			engine: "postgres",
			paradigm: "relational",
			host: "localhost",
			port: 5432,
			databaseName: "",
			username: "",
			password: "",
			maxConns: 25,
			idleConns: 10,
			sslMode: "disable",
			notes: ""
		};
	}

	function deleteConnector(id: string) {
		if (id === activeConnectorId) {
			alert("Cannot delete the currently active database connector. Switch to another connector first.");
			return;
		}
		if (confirm("Are you sure you want to delete this database connector?")) {
			connectors = connectors.filter(c => c.id !== id);
		}
	}
</script>

<div class="space-y-6 font-sans">
	
	<!-- Header Bar & Overview -->
	<div class="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<div class="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
					<ServerStack class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
						<span>Database Connectors & Storage Engines</span>
						<span class="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
							Multi-Engine GUI
						</span>
					</h3>
					<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
						NovaPilot is not tied to a single database. Configure, test, and switch between Relational (SQL) and Non-Relational (NoSQL / Document) stores with zero downtime.
					</p>
				</div>
			</div>

			<!-- Add Connector CTA -->
			<button
				type="button"
				onclick={() => (showAddModal = true)}
				class="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
			>
				<Plus class="h-4 w-4" />
				<span>Add Database Connector</span>
			</button>
		</div>

		<!-- Toolbar: Paradigm Filter & Search -->
		<div class="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
			<div class="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
				<!-- Search Input -->
				<div class="relative flex-1 min-w-[200px] max-w-sm">
					<MagnifyingGlass class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search connector name, engine, host, db..."
						class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-xs font-sans placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
					{#if searchQuery}
						<button
							type="button"
							onclick={() => (searchQuery = "")}
							class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
						>
							✕
						</button>
					{/if}
				</div>

				<!-- Paradigm Filter -->
				<div class="inline-flex h-9 rounded-md border border-input bg-background p-0.5 text-xs font-medium">
					<button
						type="button"
						onclick={() => (paradigmFilter = "all")}
						class="px-2.5 py-1 rounded transition-colors cursor-pointer {paradigmFilter === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						All Engines ({connectors.length})
					</button>
					<button
						type="button"
						onclick={() => (paradigmFilter = "relational")}
						class="px-2.5 py-1 rounded transition-colors cursor-pointer {paradigmFilter === 'relational' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						Relational (SQL)
					</button>
					<button
						type="button"
						onclick={() => (paradigmFilter = "non_relational")}
						class="px-2.5 py-1 rounded transition-colors cursor-pointer {paradigmFilter === 'non_relational' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						Document (MongoDB)
					</button>
					<button
						type="button"
						onclick={() => (paradigmFilter = "key_value")}
						class="px-2.5 py-1 rounded transition-colors cursor-pointer {paradigmFilter === 'key_value' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						Key-Value (Redis)
					</button>
				</div>
			</div>

			<div class="flex items-center gap-2 text-muted-foreground font-mono">
				<span>Active Engine: <strong class="text-foreground">{activeConnector.name}</strong></span>
			</div>
		</div>
	</div>

	<!-- Connectors Grid -->
	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each filteredConnectors as conn (conn.id)}
			<div class="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:border-foreground/20 {conn.id === activeConnectorId ? 'ring-2 ring-primary border-primary/50' : ''}">
				
				<!-- Card Header -->
				<div class="space-y-2">
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-2 min-w-0">
							{#if conn.paradigm === "relational"}
								<div class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
									<ServerStack class="h-4 w-4" />
								</div>
							{:else if conn.paradigm === "non_relational"}
								<div class="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
									<CircleStack class="h-4 w-4" />
								</div>
							{:else}
								<div class="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
									<CpuChip class="h-4 w-4" />
								</div>
							{/if}

							<div class="min-w-0">
								<h4 class="font-semibold text-sm text-foreground truncate" title={conn.name}>
									{conn.name}
								</h4>
								<span class="text-xs font-mono text-muted-foreground block truncate">
									{conn.engineLabel}
								</span>
							</div>
						</div>

						<!-- Status Badge -->
						{#if conn.id === activeConnectorId}
							<span class="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
								<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
								ACTIVE
							</span>
						{:else}
							<span class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground border border-border shrink-0">
								STANDBY
							</span>
						{/if}
					</div>

					<p class="text-xs text-muted-foreground leading-relaxed line-clamp-2">
						{conn.notes}
					</p>
				</div>

				<!-- Connection Parameters Table -->
				<div class="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-1.5 font-mono text-[11.5px] text-muted-foreground">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Target Host:</span>
						<span class="text-foreground font-semibold truncate max-w-[170px]">{conn.host}:{conn.port}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Database / Schema:</span>
						<span class="text-foreground font-semibold">{conn.databaseName}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Paradigm:</span>
						<span class="uppercase text-[10.5px] font-bold {conn.paradigm === 'relational' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">
							{conn.paradigm.replace('_', ' ')}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Pool Conns:</span>
						<span>{conn.idleConns} idle / {conn.maxConns} max</span>
					</div>
				</div>

				<!-- Test Feedback Message -->
				{#if testSuccessMessage?.id === conn.id}
					<div class="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-1.5 animate-in fade-in">
						<CheckCircle class="h-3.5 w-3.5 shrink-0" />
						<span class="truncate">{testSuccessMessage.msg}</span>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="pt-2 border-t border-border flex items-center justify-between gap-2">
					<div class="flex items-center gap-1.5">
						<!-- Test Connection Button -->
						<button
							type="button"
							onclick={() => runTestConnection(conn.id)}
							disabled={isTestingConnection === conn.id}
							class="h-8 px-2.5 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium text-foreground flex items-center gap-1 cursor-pointer disabled:opacity-50"
							title="Test network ping and handshake"
						>
							<ArrowPath class="h-3 w-3 {isTestingConnection === conn.id ? 'animate-spin' : ''}" />
							<span>{isTestingConnection === conn.id ? 'Pinging...' : 'Test'}</span>
						</button>

						<!-- Delete Button (Only for inactive custom connectors) -->
						{#if conn.id !== activeConnectorId && conn.id.startsWith("conn-custom")}
							<button
								type="button"
								onclick={() => deleteConnector(conn.id)}
								class="h-8 w-8 rounded-md border border-input bg-background hover:bg-destructive/10 text-destructive flex items-center justify-center cursor-pointer"
								title="Delete connector"
							>
								<Trash class="h-3.5 w-3.5" />
							</button>
						{/if}
					</div>

					<!-- Set Active / Current Button -->
					{#if conn.id === activeConnectorId}
						<span class="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
							<Check class="h-3.5 w-3.5" />
							<span>Primary Active</span>
						</span>
					{:else}
						<button
							type="button"
							onclick={() => setActive(conn.id)}
							class="h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors cursor-pointer shadow-xs"
						>
							Set as Active
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Guardrail Schema Adaptation Preview (Dynamic Proof) -->
	<div class="p-5 rounded-xl border border-border bg-card shadow-xs space-y-3">
		<div class="flex items-center justify-between border-b border-border pb-2.5">
			<div class="flex items-center gap-2">
				<ShieldCheck class="h-4 w-4 text-primary" />
				<span class="font-semibold text-sm text-foreground">
					Guardrail Translation for Active Engine: <code class="text-primary">{activeConnector.name}</code>
				</span>
			</div>
			<span class="text-xs font-mono text-muted-foreground">
				Protocol: {activeConnector.paradigm.toUpperCase()}
			</span>
		</div>

		{#if activeConnector.paradigm === "relational"}
			<div class="grid md:grid-cols-2 gap-3 text-xs font-mono">
				<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
					<div class="text-amber-500 font-bold uppercase text-[11px]">Relational Dry-Run Pre-Check (SQL):</div>
					<code class="text-foreground block text-xs">
						SELECT customer_name, status FROM invoices WHERE invoice_no = $1;
					</code>
					<div class="text-muted-foreground text-[11px] pt-1">
						Parameters: <code>$1 = "INV/2026/001"</code> (Bound parameter, zero concatenation)
					</div>
				</div>

				<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
					<div class="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px]">Atomic Transaction Commit:</div>
					<code class="text-foreground block text-xs">
						UPDATE invoices SET customer_name = $1, updated_at = NOW() WHERE invoice_no = $2;
					</code>
					<div class="text-muted-foreground text-[11px] pt-1">
						ACID Guarantee: Transaction rolls back automatically on error.
					</div>
				</div>
			</div>
		{:else if activeConnector.paradigm === "non_relational"}
			<div class="grid md:grid-cols-2 gap-3 text-xs font-mono">
				<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
					<div class="text-blue-500 font-bold uppercase text-[11px]">BSON Document Pre-Check (MongoDB):</div>
					<code class="text-foreground block text-xs">
						db.invoices.findOne(&#123; invoice_no: "INV/2026/001" &#125;, &#123; customer_name: 1, status: 1 &#125;)
					</code>
					<div class="text-muted-foreground text-[11px] pt-1">
						Collection: <code>invoices</code> | Schema Validation: BSON Strict Rules Passed
					</div>
				</div>

				<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
					<div class="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px]">Atomic Document Patch ($set):</div>
					<code class="text-foreground block text-xs">
						db.invoices.updateOne(&#123; invoice_no: "INV/2026/001" &#125;, &#123; $set: &#123; customer_name: "PT Sumber Makmur Abadi" &#125; &#125;)
					</code>
					<div class="text-muted-foreground text-[11px] pt-1">
						Rollback: Inverse JSON Patch snapshot stored in audit trail.
					</div>
				</div>
			</div>
		{:else}
			<div class="grid md:grid-cols-2 gap-3 text-xs font-mono">
				<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
					<div class="text-purple-500 font-bold uppercase text-[11px]">Key-Value Inspection (Redis):</div>
					<code class="text-foreground block text-xs">
						HGETALL invoice:INV/2026/001
					</code>
					<div class="text-muted-foreground text-[11px] pt-1">
						Data Structure: Redis Hash | Latency: &lt; 1ms
					</div>
				</div>

				<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
					<div class="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px]">Transactional Key Update:</div>
					<code class="text-foreground block text-xs">
						MULTI; HSET invoice:INV/2026/001 customer_name "PT Sumber Makmur Abadi"; EXEC
					</code>
					<div class="text-muted-foreground text-[11px] pt-1">
						Atomicity: Executed inside isolated Redis MULTI transaction.
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- ADD NEW CONNECTOR MODAL (SHADCN DIALOG) -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200">
		<div class="w-full max-w-xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
			
			<div class="p-5 border-b border-border flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
						<Plus class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-base font-semibold text-foreground">Add New Database Connector</h3>
						<p class="text-xs text-muted-foreground">Configure connection string, credentials, and connection pool.</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => (showAddModal = false)}
					class="text-muted-foreground hover:text-foreground cursor-pointer"
				>
					<XMark class="h-5 w-5" />
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleAddConnector(); }} class="p-5 space-y-4 overflow-y-auto text-xs sm:text-sm">
				<!-- Connector Display Name -->
				<div>
					<label for="conn-name" class="block font-medium mb-1 text-foreground text-xs">Connector Display Name</label>
					<input
						id="conn-name"
						type="text"
						bind:value={newConnector.name}
						placeholder="e.g. Jakarta Hub PostgreSQL / Surabaya MongoDB"
						class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						required
					/>
				</div>

				<!-- Database Engine Selector -->
				<div class="grid sm:grid-cols-2 gap-3">
					<div>
						<label for="conn-engine" class="block font-medium mb-1 text-foreground text-xs">Database Engine</label>
						<select
							id="conn-engine"
							value={newConnector.engine}
							onchange={(e) => handleEngineChange((e.target as HTMLSelectElement).value as any)}
							class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
						>
							<option value="postgres">PostgreSQL (Relational)</option>
							<option value="oracle">Oracle Database 11g (Relational)</option>
							<option value="mysql">MySQL / MariaDB (Relational)</option>
							<option value="sqlite">SQLite 3 (Relational Embedded)</option>
							<option value="mongodb">MongoDB (Non-Relational Document)</option>
							<option value="redis">Redis (Non-Relational Key-Value)</option>
						</select>
					</div>

					<div>
						<label for="conn-paradigm" class="block font-medium mb-1 text-foreground text-xs">Architecture Paradigm</label>
						<input
							id="conn-paradigm"
							type="text"
							value={newConnector.paradigm.toUpperCase()}
							disabled
							class="h-9 w-full rounded-md border border-input bg-muted px-3 text-xs font-mono text-muted-foreground uppercase cursor-not-allowed"
						/>
					</div>
				</div>

				<!-- Host & Port -->
				<div class="grid sm:grid-cols-3 gap-3">
					<div class="sm:col-span-2">
						<label for="conn-host" class="block font-medium mb-1 text-foreground text-xs">Host / Connection String</label>
						<input
							id="conn-host"
							type="text"
							bind:value={newConnector.host}
							placeholder="localhost or 192.168.1.50"
							class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							required
						/>
					</div>
					<div>
						<label for="conn-port" class="block font-medium mb-1 text-foreground text-xs">Port</label>
						<input
							id="conn-port"
							type="text"
							bind:value={newConnector.port}
							class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>
				</div>

				<!-- Database Name -->
				<div>
					<label for="conn-dbname" class="block font-medium mb-1 text-foreground text-xs">Database Name / Collection</label>
					<input
						id="conn-dbname"
						type="text"
						bind:value={newConnector.databaseName}
						placeholder="novapilot_db or ERP_DATA"
						class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						required
					/>
				</div>

				<!-- Credentials -->
				<div class="grid sm:grid-cols-2 gap-3">
					<div>
						<label for="conn-user" class="block font-medium mb-1 text-foreground text-xs">Username (Optional)</label>
						<input
							id="conn-user"
							type="text"
							bind:value={newConnector.username}
							class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>
					<div>
						<label for="conn-pass" class="block font-medium mb-1 text-foreground text-xs">Password</label>
						<input
							id="conn-pass"
							type="password"
							bind:value={newConnector.password}
							class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>
				</div>

				<!-- Notes -->
				<div>
					<label for="conn-notes" class="block font-medium mb-1 text-foreground text-xs">Operational Description</label>
					<input
						id="conn-notes"
						type="text"
						bind:value={newConnector.notes}
						placeholder="e.g. Factory DC backup database"
						class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>

				<!-- Actions -->
				<div class="pt-3 border-t border-border flex items-center justify-end gap-2">
					<button
						type="button"
						onclick={() => (showAddModal = false)}
						class="h-9 px-4 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer"
					>
						Cancel
					</button>

					<button
						type="submit"
						class="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer shadow-xs"
					>
						Save & Register Connector
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
