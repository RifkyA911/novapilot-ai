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
		ArrowPath
	} from "svelte-heros-v2";

	// Active Tab State
	let activeTab = $state<"dual-db" | "resources" | "tools" | "playground">("dual-db");

	// Real MCP Resources data matching mcp-server/src/index.ts
	const mcpResources = [
		{
			uri: "novapilot://sop/factory-rules",
			name: "Factory IT Support SOP & Invoice Rules",
			mimeType: "text/markdown",
			description: "Official operational guidelines for customer name revisions, cutoff closing dates, and branches.",
			content: `# NovaPilot Enterprise SOP: Invoice Correction Policy

1. **Eligible Revisions:**
   - Typographical errors on customer company names (PT, CV, UD, Toko).
   - Invoices with status **OPEN** and \`is_posted = FALSE\` can be revised.
2. **Strictly Prohibited Revisions:**
   - Invoices with status **CLOSED** (already finalized in monthly accounting). Requires Supervisor override.
   - Modifying transaction amounts or quantities via chat is **STRICTLY PROHIBITED**.
3. **Approval Requirement:**
   - Every staged modification requires manual review and sign-off by the on-call IT engineer in the WebUI.`
		},
		{
			uri: "novapilot://branches/directory",
			name: "Active Factory Branches Directory",
			mimeType: "application/json",
			description: "Directory of authorized factory branches, city hubs, and whitelist WhatsApp groups.",
			content: JSON.stringify([
				{ code: "SBY-01", name: "Surabaya Hub", waGroup: "120363001@g.us" },
				{ code: "MDN-01", name: "Medan Hub", waGroup: "120363002@g.us" },
				{ code: "SMG-01", name: "Semarang Hub", waGroup: "120363003@g.us" },
				{ code: "MKS-01", name: "Makassar Hub", waGroup: "120363004@g.us" },
				{ code: "BDG-01", name: "Bandung Hub", waGroup: "120363005@g.us" }
			], null, 2)
		}
	];

	// Real MCP Tools data matching mcp-server/src/index.ts
	const mcpTools = [
		{
			name: "check_invoice",
			description: "Query and verify an invoice in the database by its invoice number.",
			schema: {
				type: "object",
				properties: {
					invoice_no: { type: "string", description: "The invoice number (e.g. INV/2026/001)" }
				},
				required: ["invoice_no"]
			},
			exampleInput: { invoice_no: "INV/2026/001" },
			permission: "READ_ONLY (Safe)"
		},
		{
			name: "stage_invoice_update",
			description: "Stage a proposed invoice customer name change into the on-call approval queue.",
			schema: {
				type: "object",
				properties: {
					document_no: { type: "string", description: "The invoice number" },
					proposed_value: { type: "string", description: "The corrected customer name" },
					raw_message: { type: "string", description: "Original message text from WhatsApp" },
					branch_id: { type: "number", description: "Optional branch ID" }
				},
				required: ["document_no", "proposed_value", "raw_message"]
			},
			exampleInput: {
				document_no: "INV/2026/001",
				proposed_value: "PT Sumber Makmur Abadi",
				raw_message: "Ubah nama nota INV/2026/001 ke PT Sumber Makmur Abadi",
				branch_id: 1
			},
			permission: "MUTATION_STAGING (Requires Human Sign-Off)"
		},
		{
			name: "upload_document",
			description: "Upload an attachment file (invoice PDF, proof photo, delivery order) associated with a ticket.",
			schema: {
				type: "object",
				properties: {
					file_name: { type: "string", description: "Name of the file including extension" },
					file_content_base64: { type: "string", description: "Base64-encoded binary content" },
					mime_type: { type: "string", description: "MIME type (e.g. application/pdf, image/jpeg)" },
					ticket_id: { type: "number", description: "Optional ticket ID to link" }
				},
				required: ["file_name", "file_content_base64", "mime_type"]
			},
			exampleInput: {
				file_name: "proof_invoice_signed.jpg",
				file_content_base64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
				mime_type: "image/jpeg",
				ticket_id: 1
			},
			permission: "WRITE_ATTACHMENT"
		},
		{
			name: "list_pending_tickets",
			description: "Retrieve all tickets currently waiting for human approval from the on-call engineer.",
			schema: {
				type: "object",
				properties: {}
			},
			exampleInput: {},
			permission: "READ_QUEUE (Safe)"
		}
	];

	// Interactive Playground State
	let selectedTool = $state("check_invoice");
	let playgroundInvoiceNo = $state("INV/2026/001");
	let playgroundProposedValue = $state("PT Sumber Makmur Sentosa");
	let isExecutingPlayground = $state(false);
	let playgroundResponse = $state<string | null>(null);

	async function runPlayground() {
		isExecutingPlayground = true;
		playgroundResponse = null;

		try {
			if (selectedTool === "check_invoice") {
				const res = await fetch("/api/invoices");
				if (res.ok) {
					const invoices = await res.json();
					const found = invoices.find((inv: any) => inv.invoice_no === playgroundInvoiceNo);
					if (found) {
						playgroundResponse = JSON.stringify({
							jsonrpc: "2.0",
							result: {
								content: [
									{
										type: "text",
										text: JSON.stringify({
											invoice_no: found.invoice_no,
											current_customer_name: found.customer_name,
											amount: found.amount,
											status: found.status,
											is_posted: found.is_posted,
											eligible_for_change: found.status === "OPEN" && !found.is_posted
										}, null, 2)
									}
								]
							}
						}, null, 2);
					} else {
						playgroundResponse = JSON.stringify({
							jsonrpc: "2.0",
							result: {
								content: [{ type: "text", text: `Invoice ${playgroundInvoiceNo} NOT found in database.` }]
							}
						}, null, 2);
					}
				} else {
					throw new Error("Backend query failed");
				}
			} else if (selectedTool === "list_pending_tickets") {
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
				}
			} else {
				// Simulated staging result
				playgroundResponse = JSON.stringify({
					jsonrpc: "2.0",
					result: {
						content: [
							{
								type: "text",
								text: `Successfully staged ticket for ${playgroundInvoiceNo} with proposed value "${playgroundProposedValue}". Status: PENDING_APPROVAL. Waiting for engineer sign-off in WebUI.`
							}
						]
					}
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
	<title>Model Context Protocol (MCP) Knowledge • NovaPilot AI</title>
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
						MCP Knowledge Base & Dual-DB Architecture
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
							SPECIFICATION v1.0
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Model Context Protocol (JSON-RPC 2.0) tooling, enterprise ERP data governance, dan spesifikasi pemisahan Dual-DB.
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
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 {activeTab === 'dual-db' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CircleStack class="h-4 w-4" />
			<span>1. Arsitektur Isolasi Database</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "resources"}
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 {activeTab === 'resources' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<DocumentText class="h-4 w-4" />
			<span>2. MCP Resources ({mcpResources.length})</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "tools"}
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 {activeTab === 'tools' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CpuChip class="h-4 w-4" />
			<span>3. MCP Tools Schema ({mcpTools.length})</span>
		</button>
		<button
			type="button"
			onclick={() => activeTab = "playground"}
			class="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 {activeTab === 'playground' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<CommandLine class="h-4 w-4" />
			<span>4. Interactive Playground</span>
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
								<div class="text-[10px] font-mono text-muted-foreground">PostgreSQL 18 / Local SQLite WAL</div>
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
								<li><span class="text-foreground font-semibold">tickets</span> - Antrean tiket, status, proposed value diff</li>
								<li><span class="text-foreground font-semibold">audit_logs</span> - Immutable audit signature & IP petugas</li>
								<li><span class="text-foreground font-semibold">inbound_messages</span> - Arsip chat WhatsApp, Telegram, Discord</li>
								<li><span class="text-foreground font-semibold">learned_patterns</span> - Pola regex pembelajaran intent</li>
								<li><span class="text-foreground font-semibold">documents</span> - Metadata lampiran nota & hasil OCR</li>
							</ul>
						</div>

						<div class="pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
							<span>Pool: Max 25 open / 10 idle</span>
							<span class="text-emerald-500 font-bold">Koneksi: Aktif</span>
						</div>
					</div>
				</div>

				<!-- DB 2: Enterprise Business Data Store (ERP) -->
				<div class="p-5 rounded-2xl border border-cyan-500/30 bg-card/70 space-y-4 shadow-xs">
					<div class="flex items-center justify-between pb-3 border-b border-border/50">
						<div class="flex items-center gap-2.5">
							<div class="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
								<LockClosed class="h-4 w-4" />
							</div>
							<div>
								<div class="text-sm font-bold text-foreground">DB 2: Enterprise Data (ERP Core)</div>
								<div class="text-[10px] font-mono text-muted-foreground">Oracle 19c / SAP HANA / PostgreSQL Enterprise</div>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
							MCP ISOLATED
						</span>
					</div>

					<div class="space-y-3 text-xs">
						<div>
							<span class="font-semibold text-muted-foreground">Tujuan & Fungsi:</span>
							<p class="text-foreground mt-0.5">
								Buku besar faktur utama perusahaan (ledger faktur, master data pelanggan, saldo piutang). Terisolasi ketat di balik boundary tool MCP.
							</p>
						</div>

						<div class="space-y-1">
							<span class="font-semibold text-muted-foreground">Tabel Sasaran ERP:</span>
							<ul class="list-disc list-inside text-muted-foreground space-y-0.5 font-mono text-[11px]">
								<li><span class="text-foreground font-semibold">invoices</span> - Data nota faktur (hanya status OPEN & unposted)</li>
								<li><span class="text-foreground font-semibold">customer_master</span> - Master nama entitas bisnis</li>
								<li><span class="text-foreground font-semibold">ar_ledger</span> - Buku piutang (Read-only check)</li>
							</ul>
						</div>

						<div class="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-700 dark:text-cyan-300">
							🔒 <strong>Aturan Isolasi:</strong> Bot WhatsApp tidak pernah diizinkan menjalankan <code>UPDATE invoices SET ...</code> secara manual. Hanya tool <code>check_invoice</code> dan approval 1-klik di WebUI yang dapat memutasi data.
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 2: MCP RESOURCES -->
	{#if activeTab === "resources"}
		<div class="space-y-4">
			<p class="text-xs text-muted-foreground">
				Resources pada Model Context Protocol adalah dokumen kontekstual yang dibaca oleh LLM/AI Agent sebagai pedoman aturan operasional standar (SOP).
			</p>

			<div class="grid grid-cols-1 gap-4">
				{#each mcpResources as res}
					<div class="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3">
						<div class="flex items-center justify-between pb-2 border-b border-border/40">
							<div class="flex items-center gap-2">
								<span class="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{res.uri}</span>
								<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground font-semibold">
									{res.mimeType}
								</span>
							</div>
							<span class="text-xs font-bold text-foreground">{res.name}</span>
						</div>

						<p class="text-xs text-muted-foreground">{res.description}</p>

						<div class="p-3 rounded-xl bg-secondary/50 font-mono text-xs text-foreground whitespace-pre-wrap max-h-56 overflow-y-auto border border-border/40">
							{res.content}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- TAB 3: MCP TOOLS SCHEMA -->
	{#if activeTab === "tools"}
		<div class="space-y-4">
			<p class="text-xs text-muted-foreground">
				Tools pada Model Context Protocol mendefinisikan aksi executable yang diizinkan untuk dipanggil oleh AI Agent melalui JSON-RPC.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each mcpTools as tool}
					<div class="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3">
						<div class="flex items-center justify-between pb-2 border-b border-border/40">
							<span class="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
								{tool.name}()
							</span>
							<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {tool.permission.includes('READ') ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}">
								{tool.permission}
							</span>
						</div>

						<p class="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>

						<div class="space-y-1">
							<span class="text-[10px] font-mono uppercase text-muted-foreground font-bold">Input Schema:</span>
							<pre class="p-2.5 rounded-xl bg-secondary/60 text-[11px] font-mono text-foreground overflow-x-auto border border-border/40">{JSON.stringify(tool.schema, null, 2)}</pre>
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
						<select
							id="mcp-tool-select"
							bind:value={selectedTool}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs font-semibold"
						>
							<option value="check_invoice">check_invoice (Verifikasi Faktur)</option>
							<option value="stage_invoice_update">stage_invoice_update (Tahap Perubahan)</option>
							<option value="list_pending_tickets">list_pending_tickets (Daftar Antrean)</option>
						</select>
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
</div>
