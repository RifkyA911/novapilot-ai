<script lang="ts">
	import { 
		ChartBarSquare, 
		CheckCircle, 
		XCircle, 
		ArrowPath,
		ShieldCheck,
		ArrowDownTray,
		Clock
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";
	import HistoryTable from "$lib/components/HistoryTable.svelte";

	function downloadAuditJson() {
		const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cockpit.auditLogs, null, 2));
		const downloadAnchor = document.createElement("a");
		downloadAnchor.setAttribute("href", dataStr);
		downloadAnchor.setAttribute("download", `novapilot-audit-${new Date().toISOString().slice(0, 10)}.json`);
		document.body.appendChild(downloadAnchor);
		downloadAnchor.click();
		downloadAnchor.remove();
	}
</script>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
					<ChartBarSquare class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>Execution History & Audit Trail</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-mono font-medium border border-border">
							{cockpit.auditLogs.length} audit records
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Tamper-evident logs of signed mutations, policy rejections, and compensating rollback scripts.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={downloadAuditJson}
				class="h-9 px-3 rounded-lg border border-input bg-background hover:bg-accent text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
				title="Export Audit Logs as JSON"
			>
				<ArrowDownTray class="h-4 w-4" />
				<span>Export JSON</span>
			</button>

			<button
				type="button"
				onclick={() => { cockpit.fetchTickets(); cockpit.fetchAuditLogs(); }}
				class="h-9 px-3 rounded-lg border border-input bg-background hover:bg-accent text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
			>
				<ArrowPath class="h-4 w-4 {cockpit.loading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</button>
		</div>
	</div>

	<!-- Stats Bar -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
			<div>
				<div class="text-xs font-mono text-muted-foreground uppercase">Total Executed</div>
				<div class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{cockpit.executedCount}</div>
				<div class="text-[11px] text-muted-foreground">Committed with zero raw SQL</div>
			</div>
			<CheckCircle class="h-8 w-8 text-emerald-500/30" />
		</div>

		<div class="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
			<div>
				<div class="text-xs font-mono text-muted-foreground uppercase">Policy Rejections</div>
				<div class="text-2xl font-bold font-mono text-foreground mt-0.5">{cockpit.rejectedCount}</div>
				<div class="text-[11px] text-muted-foreground">Blocked closed accounting periods</div>
			</div>
			<XCircle class="h-8 w-8 text-muted-foreground/30" />
		</div>

		<div class="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
			<div>
				<div class="text-xs font-mono text-muted-foreground uppercase">Rollback Safety</div>
				<div class="text-2xl font-bold font-mono text-primary mt-0.5">100%</div>
				<div class="text-[11px] text-muted-foreground">Inverse scripts pre-calculated</div>
			</div>
			<ShieldCheck class="h-8 w-8 text-primary/30" />
		</div>
	</div>

	<!-- History Table Component -->
	<div class="space-y-4">
		<HistoryTable tickets={cockpit.tickets} />
	</div>
</div>
