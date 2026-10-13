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
		ArrowPath
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";

	let simMessage = $state("Hello IT Support, please update invoice INV/2026/001 customer name from PT Sumber Makmur to PT Sumber Makmur Abadi due to branch tax invoice amendment. Thanks!");
	let simDocNo = $state("INV/2026/001");
	let simProposed = $state("PT Sumber Makmur Abadi");
	let simBranchId = $state(1);
	let simLoading = $state(false);
	let simStep = $state(0);
	let simSuccess = $state(false);

	async function runSimulation() {
		if (simLoading) return;
		simLoading = true;
		simStep = 1; // WhatsApp Ingestion
		simSuccess = false;

		await new Promise(r => setTimeout(r, 800));
		simStep = 2; // LLM Extraction

		await new Promise(r => setTimeout(r, 900));
		simStep = 3; // Database Pre-check

		await new Promise(r => setTimeout(r, 800));
		simStep = 4; // Ready for Sign-off

		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: simMessage,
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: simDocNo,
					field_target: "customer_name",
					proposed_value: simProposed,
					branch_id: simBranchId,
					confidence_score: 0.98
				})
			});
			if (res.ok) {
				simSuccess = true;
				await cockpit.fetchTickets();
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

<div class="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-6">
	<!-- Simulator Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
		<div>
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
					<PaperAirplane class="h-4 w-4" />
				</div>
				<h3 class="text-base font-semibold text-foreground">WhatsApp Ingestion Pipeline Simulator</h3>
			</div>
			<p class="text-xs text-muted-foreground mt-0.5">
				Simulate real-time branch chat ingestion, deterministic LLM extraction, and database staging.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
				<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
				WhatsApp Gateway Live
			</span>
		</div>
	</div>

	<!-- Step Progression Visualizer -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
		<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simStep >= 1 ? 'bg-primary/10 border-primary/40 font-semibold text-foreground' : 'bg-muted/30 border-border text-muted-foreground'}">
			<div class="flex items-center gap-2">
				<Radio class="h-4 w-4 {simStep === 1 ? 'text-emerald-500 animate-pulse' : 'text-primary'}" />
				<span>01. WA Ingest</span>
			</div>
			{#if simStep === 1}<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>{/if}
		</div>

		<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simStep >= 2 ? 'bg-purple-500/10 border-purple-500/40 font-semibold text-foreground' : 'bg-muted/30 border-border text-muted-foreground'}">
			<div class="flex items-center gap-2">
				<CpuChip class="h-4 w-4 text-purple-500" />
				<span>02. LLM Extract</span>
			</div>
			{#if simStep === 2}<span class="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>{/if}
		</div>

		<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simStep >= 3 ? 'bg-amber-500/10 border-amber-500/40 font-semibold text-foreground' : 'bg-muted/30 border-border text-muted-foreground'}">
			<div class="flex items-center gap-2">
				<ServerStack class="h-4 w-4 text-amber-500" />
				<span>03. DB Pre-Check</span>
			</div>
			{#if simStep === 3}<span class="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>{/if}
		</div>

		<div class="p-3 rounded-xl border flex items-center justify-between transition-colors {simStep >= 4 ? 'bg-emerald-500/10 border-emerald-500/40 font-semibold text-foreground' : 'bg-muted/30 border-border text-muted-foreground'}">
			<div class="flex items-center gap-2">
				<ShieldCheck class="h-4 w-4 text-emerald-500" />
				<span>04. Stage in Queue</span>
			</div>
			{#if simStep === 4}<span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>{/if}
		</div>
	</div>

	<!-- Simulation Input Form -->
	<div class="grid md:grid-cols-2 gap-4 text-xs">
		<div class="space-y-3">
			<div>
				<label for="sim-raw-msg" class="block font-medium text-foreground mb-1.5">
					Simulated WhatsApp Chat Message:
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
						Originating Branch:
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
						Document Number:
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
					Proposed Mutation Value:
				</label>
				<input
					id="sim-proposed-val"
					type="text"
					bind:value={simProposed}
					class="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				/>
				<p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
					The engine executes a read-only query against the database to fetch the current customer name (<code>PT Sumber Makmur</code>) and ensures invoice status is not <code>CLOSED</code> before creating the staging ticket.
				</p>
			</div>

			<div class="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
				<div class="text-xs">
					<div class="font-semibold text-foreground">Zero Raw SQL Guard</div>
					<div class="text-[11px] text-muted-foreground">Parameterized binding enforced on sign-off</div>
				</div>

				<button
					type="button"
					onclick={runSimulation}
					disabled={simLoading}
					class="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
				>
					{#if simLoading}
						<ArrowPath class="h-4 w-4 animate-spin" />
						<span>Processing Step 0{simStep}...</span>
					{:else}
						<PaperAirplane class="h-4 w-4" />
						<span>Execute Ingestion Test</span>
					{/if}
				</button>
			</div>
		</div>
	</div>

	{#if simSuccess}
		<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between animate-in fade-in duration-200">
			<div class="flex items-center gap-2 font-medium">
				<CheckCircle class="h-4 w-4" />
				<span>Simulation complete! Mutation ticket created and staged into the <strong>Approval Queue</strong>.</span>
			</div>
			<a href="/dashboard/queue" class="font-semibold underline hover:opacity-80">
				View in Approval Queue &rarr;
			</a>
		</div>
	{/if}
</div>
