<script lang="ts">
	import { 
		PaperAirplane, 
		Radio, 
		CpuChip, 
		ServerStack, 
		ShieldCheck, 
		CheckCircle, 
		Clock, 
		Sparkles,
		ArrowPath,
		ExclamationTriangle,
		Phone
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";
	import SimulatorPipelineVisualizer from "$lib/components/SimulatorPipelineVisualizer.svelte";

	let simMessage = $state("Hello IT Support, please update invoice INV/2026/001 customer name from PT Sumber Makmur to PT Sumber Makmur Abadi due to branch tax invoice amendment. Thanks!");
	let simDocNo = $state("INV/2026/001");
	let simProposed = $state("PT Sumber Makmur Abadi");
	let simBranchId = $state(1);
	let simLoading = $state(false);
	let simStep = $state(0);
	let simSuccess = $state(false);

	// Real WhatsApp Dispatch (EXP) - Configurable via .env: WA_TEST_RECIPIENT
	let testPhone = $state("081228632195");
	let isDispatching = $state(false);
	let dispatchResult = $state<{ ok: boolean; message: string; recipient?: string } | null>(null);
	let sendRealWhatsAppOnSim = $state(false);

	$effect(() => {
		fetch("/api/gateway/status")
			.then(r => r.json())
			.then(data => {
				if (data.default_test_phone) {
					testPhone = data.default_test_phone;
				}
			})
			.catch(() => {});
	});

	async function sendRealWhatsAppMessage() {
		if (isDispatching) return;
		isDispatching = true;
		dispatchResult = null;
		try {
			const res = await fetch("/api/gateway/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					phone: testPhone || "081228632195",
					message: simMessage
				})
			});
			const data = await res.json();
			if (res.ok && data.ok) {
				dispatchResult = {
					ok: true,
					recipient: data.recipient,
					message: i18n.locale === 'id' 
						? `Pesan WhatsApp berhasil dikirim ke ${data.recipient || testPhone}!` 
						: `Real WhatsApp message delivered to ${data.recipient || testPhone}!`
				};
			} else {
				dispatchResult = {
					ok: false,
					message: data.error || (i18n.locale === 'id' ? "Gagal mengirim pesan melalui WhatsApp Gateway." : "Failed to dispatch message via WhatsApp Gateway.")
				};
			}
		} catch (err: any) {
			dispatchResult = {
				ok: false,
				message: `Network error: ${err.message}`
			};
		} finally {
			isDispatching = false;
		}
	}

	async function runSimulation() {
		if (simLoading) return;
		simLoading = true;
		simStep = 1; // 1. WhatsApp Inbound Ingestion
		simSuccess = false;

		let inboundMsgId: number | null = null;
		let extractedDoc = simDocNo;
		let extractedProposed = simProposed;

		try {
			// Step 1: Real Inbound Message Ingestion
			const ingestRes = await fetch("/api/inbound-messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					platform: cockpit.chatPlatform,
					sender_id: cockpit.chatPlatform === "whatsapp" ? "6281234567890@s.whatsapp.net" : "@warehouse_ops",
					sender_name: "Surabaya Logistics Admin",
					raw_message: simMessage,
					media_type: "text",
					classification: "ACTIONABLE",
					extracted_doc: simDocNo,
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					extracted_target: simProposed
				})
			});
			if (ingestRes.ok) {
				const ingestData = await ingestRes.json();
				inboundMsgId = ingestData.id;
			}

			// Step 2: Real Agentic Hermes 3 LLM Extraction
			simStep = 2; // 2. LLM Extraction
			const llmRes = await fetch("/api/llm/process", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: simMessage,
					branch_context: `Branch ID ${simBranchId} (Surabaya)`
				})
			});
			if (llmRes.ok) {
				const llmData = await llmRes.json();
				if (llmData.tool_call?.arguments?.invoice_no) {
					extractedDoc = String(llmData.tool_call.arguments.invoice_no);
					simDocNo = extractedDoc;
				}
				if (llmData.tool_call?.arguments?.proposed_value) {
					extractedProposed = String(llmData.tool_call.arguments.proposed_value);
					simProposed = extractedProposed;
				}
			}

			// Step 3: Real Database Pre-Check & Validation
			simStep = 3; // 3. DB Pre-Check
			const invRes = await fetch("/api/invoices");
			if (invRes.ok) {
				const invoices = await invRes.json();
				const found = invoices.find((i: any) => i.invoice_no === extractedDoc);
				if (found && found.status === "CLOSED") {
					throw new Error(`Policy violation: invoice ${extractedDoc} is closed`);
				}
			}

			// Step 4: Real Staging into HITL Approval Queue
			simStep = 4; // 4. Ready for Sign-Off
			let stageOk = false;
			if (inboundMsgId) {
				const stageRes = await fetch(`/api/inbound-messages/${inboundMsgId}/stage-ticket`, {
					method: "POST"
				});
				stageOk = stageRes.ok;
			} else {
				const res = await fetch("/api/tickets", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						raw_message: simMessage,
						extracted_intent: "UPDATE_CUSTOMER_NAME",
						document_no: extractedDoc,
						field_target: "customer_name",
						proposed_value: extractedProposed,
						branch_id: simBranchId,
						confidence_score: 0.98
					})
				});
				stageOk = res.ok;
			}

			if (stageOk) {
				cockpit.recordPlatformEvent(cockpit.chatPlatform);
				simSuccess = true;
				await cockpit.fetchTickets();
				if (sendRealWhatsAppOnSim) {
					sendRealWhatsAppMessage();
				}
			}
		} catch (err) {
			console.error("Simulation error:", err);
		} finally {
			simLoading = false;
			setTimeout(() => {
				simStep = 0;
			}, 3000);
		}
	}
</script>

<div class="p-6 rounded-3xl bg-card border border-border/80 shadow-xl space-y-6">
	<!-- Simulator Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
		<div>
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
					<PaperAirplane class="h-4 w-4" />
				</div>
				<h3 class="text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
					{cockpit.platformStatuses[cockpit.chatPlatform].name} Ingestion Pipeline Simulator
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
						EXPERIMENTAL
					</span>
				</h3>
			</div>
			<p class="text-xs text-muted-foreground mt-0.5">
				Simulate real-time branch chat ingestion, deterministic LLM extraction, and database staging for {cockpit.platformStatuses[cockpit.chatPlatform].name}.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'} text-xs font-mono font-medium">
				<span class="h-2 w-2 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
				{cockpit.platformStatuses[cockpit.chatPlatform].name} Gateway {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'Live' : 'Standby'}
			</span>
		</div>
	</div>

	<!-- Interactive Animated Pipeline SVG Visualizer with Pan & Zoom -->
	<SimulatorPipelineVisualizer 
		{simStep} 
		{simLoading} 
		{simDocNo} 
		{simProposed} 
		onExecute={runSimulation} 
	/>

	<!-- Step Progression Visualizer -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
		<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simStep >= 1 ? 'bg-primary/10 border-primary/40 font-semibold text-foreground' : 'bg-muted/30 border-border text-muted-foreground'}">
			<div class="flex items-center gap-2">
				<Radio class="h-4 w-4 {simStep === 1 ? 'text-emerald-500 animate-pulse' : 'text-primary'}" />
				<span>{i18n.t.simulator.step_1}</span>
			</div>
			{#if simStep === 1}<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>{/if}
		</div>

		<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simStep >= 2 ? 'bg-purple-500/10 border-purple-500/40 font-semibold text-foreground' : 'bg-muted/30 border-border text-muted-foreground'}">
			<div class="flex items-center gap-2">
				<CpuChip class="h-4 w-4 text-purple-500" />
				<span>{i18n.t.simulator.step_2}</span>
			</div>
			{#if simStep === 2}<span class="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>{/if}
		</div>

		<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simStep >= 3 ? 'bg-amber-500/10 border-amber-500/40 font-semibold text-foreground' : 'bg-muted/30 border-border text-muted-foreground'}">
			<div class="flex items-center gap-2">
				<ServerStack class="h-4 w-4 text-amber-500" />
				<span>{i18n.t.simulator.step_3}</span>
			</div>
			{#if simStep === 3}<span class="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>{/if}
		</div>

		<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simStep >= 4 ? 'bg-emerald-500/10 border-emerald-500/40 font-semibold text-foreground' : 'bg-muted/30 border-border text-muted-foreground'}">
			<div class="flex items-center gap-2">
				<ShieldCheck class="h-4 w-4 text-emerald-500" />
				<span>{i18n.t.simulator.step_4}</span>
			</div>
			{#if simStep === 4}<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>{/if}
		</div>
	</div>

	<!-- Simulation Input Form -->
	<div class="grid md:grid-cols-2 gap-4 text-xs">
		<div class="space-y-3">
			<div>
				<label for="sim-raw-msg" class="block font-medium text-foreground mb-1.5">
					{i18n.t.simulator.chat_msg_label}
				</label>
				<textarea
					id="sim-raw-msg"
					bind:value={simMessage}
					rows={4}
					class="w-full rounded-lg border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="sim-branch" class="block font-medium text-foreground mb-1">
						{i18n.t.simulator.branch_source_label}
					</label>
					<select
						id="sim-branch"
						bind:value={simBranchId}
						class="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<option value={1}>Surabaya HQ (Main Plant)</option>
						<option value={2}>Medan Hub (Sumatra)</option>
						<option value={3}>Semarang DC (Central Java)</option>
						<option value={4}>Makassar Hub (East)</option>
					</select>
				</div>

				<div>
					<label for="sim-doc-no" class="block font-medium text-foreground mb-1">
						{i18n.t.simulator.invoice_target_label}
					</label>
					<input
						id="sim-doc-no"
						type="text"
						bind:value={simDocNo}
						class="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
			</div>
		</div>

		<div class="space-y-3 flex flex-col justify-between">
			<div>
				<label for="sim-proposed-val" class="block font-medium text-foreground mb-1.5">
					{i18n.t.simulator.value_target_label}
				</label>
				<input
					id="sim-proposed-val"
					type="text"
					bind:value={simProposed}
					class="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				/>
				<p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
					{i18n.locale === 'id' ? 'Engine mengeksekusi query read-only terhadap database untuk mengambil nama customer saat ini (PT Sumber Makmur) dan memastikan status faktur bukan CLOSED sebelum membuat tiket approval.' : 'The engine executes a read-only query against the database to fetch the current customer name (PT Sumber Makmur) and ensures invoice status is not CLOSED before creating the staging ticket.'}
				</p>
			</div>

			<div class="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
				<div class="text-xs">
					<div class="font-semibold text-foreground">Zero Raw SQL Guard</div>
					<div class="text-[11px] text-muted-foreground">{i18n.locale === 'id' ? 'Binding berparameter diterapkan saat sign-off' : 'Parameterized binding enforced on sign-off'}</div>
				</div>

				<button
					type="button"
					onclick={runSimulation}
					disabled={simLoading}
					class="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
				>
					{#if simLoading}
						<ArrowPath class="h-4 w-4 animate-spin" />
						<span>{i18n.locale === 'id' ? `Memproses Langkah 0${simStep}...` : `Processing Step 0${simStep}...`}</span>
					{:else}
						<PaperAirplane class="h-4 w-4" />
						<span>{i18n.t.simulator.run_simulation}</span>
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Real Outbound WhatsApp Live Dispatcher [EXP] -->
	<div class="p-4 sm:p-5 rounded-2xl bg-secondary/40 border border-border/80 space-y-3 shadow-xs">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div class="flex items-center gap-2.5">
				<div class="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
					<Phone class="h-4 w-4" />
				</div>
				<div>
					<div class="text-xs font-semibold text-foreground flex items-center gap-2 flex-wrap">
						<span>{i18n.locale === 'id' ? 'Kirim Pesan WhatsApp Real [EXP]' : 'Real WhatsApp Live Dispatch [EXP]'}</span>
						<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
							EXP
						</span>
						<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border">
							ENV: WA_TEST_RECIPIENT
						</span>
					</div>
					<p class="text-[11px] text-muted-foreground mt-0.5">
						{i18n.locale === 'id' ? 'Kirim pesan live secara aktual ke nomor tujuan melalui WhatsApp Gateway daemon (:3002).' : 'Dispatch real outbound WhatsApp message to recipient phone via active gateway (:3002).'}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2 self-start sm:self-auto">
				<label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
					<input 
						type="checkbox" 
						bind:checked={sendRealWhatsAppOnSim} 
						class="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
					/>
					<span class="text-[11px] font-medium">{i18n.locale === 'id' ? 'Kirim otomatis saat simulasi dijalankan' : 'Auto-send on simulation execute'}</span>
				</label>
			</div>
		</div>

		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
			<div class="relative flex-1">
				<Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
				<input
					type="text"
					bind:value={testPhone}
					placeholder="081228632195"
					class="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				/>
			</div>

			<button
				type="button"
				onclick={sendRealWhatsAppMessage}
				disabled={isDispatching}
				class="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
			>
				{#if isDispatching}
					<ArrowPath class="h-3.5 w-3.5 animate-spin" />
					<span>{i18n.locale === 'id' ? 'Mengirim ke WhatsApp...' : 'Sending to WhatsApp...'}</span>
				{:else}
					<PaperAirplane class="h-3.5 w-3.5" />
					<span>{i18n.locale === 'id' ? `Kirim Pesan Live ke ${testPhone}` : `Send Live Message to ${testPhone}`}</span>
				{/if}
			</button>
		</div>

		{#if dispatchResult}
			<div class="p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 {dispatchResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
				{#if dispatchResult.ok}
					<CheckCircle class="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
				{:else}
					<ExclamationTriangle class="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
				{/if}
				<div class="flex-1 space-y-0.5">
					<div class="font-semibold">{dispatchResult.message}</div>
					{#if !dispatchResult.ok}
						<div class="text-[11px] opacity-90 flex items-center gap-2 mt-1">
							<span>Periksa status koneksi WhatsApp di menu Platforms & Hubs.</span>
							<a href="/dashboard/platforms" class="underline font-bold hover:opacity-80">Buka Platforms →</a>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if simSuccess}
		<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between animate-in fade-in duration-200">
			<div class="flex items-center gap-2 font-medium">
				<CheckCircle class="h-4 w-4" />
				<span>{i18n.locale === 'id' ? 'Simulasi selesai! Tiket mutasi berhasil dibuat dan di-stage ke Antrean Persetujuan.' : 'Simulation complete! Mutation ticket created and staged into the Approval Queue.'}</span>
			</div>
			<a href="/dashboard/queue" class="font-semibold underline hover:opacity-80">
				{i18n.locale === 'id' ? 'Buka di Antrean Persetujuan →' : 'View in Approval Queue →'}
			</a>
		</div>
	{/if}
</div>
