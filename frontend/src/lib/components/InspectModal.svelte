<script lang="ts">
	import { 
		ShieldCheck, 
		XMark, 
		CodeBracket, 
		CircleStack, 
		CheckCircle, 
		LockClosed,
		CpuChip,
		ExclamationTriangle
	} from "svelte-heros-v2";
	import type { Ticket } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";

	let { 
		ticket = null, 
		onclose 
	}: { 
		ticket: Ticket | null; 
		onclose: () => void;
	} = $props();

	let paradigm = $state<"relational" | "non_relational">("relational");
</script>

{#if ticket}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200"
		role="presentation"
		onclick={onclose}
	>
		<div 
			class="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
			role="dialog"
			aria-modal="true"
			aria-label={i18n.t.modals.inspect_title}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="p-5 border-b border-border flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
						<CodeBracket class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-base font-semibold text-foreground flex items-center gap-2">
							<span>{i18n.t.modals.inspect_title} {ticket.ticket_no}</span>
							<span class="text-xs px-2 py-0.5 rounded font-mono font-medium {ticket.confidence_score >= 0.9 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}">
								{(ticket.confidence_score * 100).toFixed(0)}% Confidence
							</span>
						</h3>
						<p class="text-xs text-muted-foreground font-mono">Document #{ticket.document_no} · Target: {ticket.field_target}</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onclose}
					class="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
				>
					<XMark class="h-5 w-5" />
				</button>
			</div>

			<!-- Paradigm Selector Bar -->
			<div class="border-b border-border bg-muted/30 px-5 py-2.5 flex items-center justify-between text-xs">
				<div class="flex items-center gap-2">
					<span class="font-medium text-foreground">{i18n.t.modals.target_engine}</span>
					<div class="flex items-center rounded-lg border border-border bg-background p-0.5">
						<button
							type="button"
							onclick={() => (paradigm = "relational")}
							class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {paradigm === 'relational' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
						>
							{i18n.t.modals.relational_sql}
						</button>
						<button
							type="button"
							onclick={() => (paradigm = "non_relational")}
							class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {paradigm === 'non_relational' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
						>
							{i18n.t.modals.non_relational_bson}
						</button>
					</div>
				</div>

				<span class="text-[11px] font-mono text-muted-foreground">{i18n.t.modals.zero_sql_guard}</span>
			</div>

			<!-- Body -->
			<div class="p-5 overflow-y-auto space-y-4 text-xs font-mono">
				<!-- Diff Preview -->
				<div class="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
					<div class="text-[11px] font-semibold text-foreground uppercase tracking-wider">{i18n.t.modals.diff_title}</div>
					<div class="grid grid-cols-2 gap-3 text-xs">
						<div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
							<div class="text-[10px] text-muted-foreground">{i18n.t.modals.current_val}</div>
							<div class="font-bold line-through mt-0.5">{ticket.current_value}</div>
						</div>
						<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
							<div class="text-[10px] text-muted-foreground">{i18n.t.modals.proposed_val}</div>
							<div class="font-bold mt-0.5">{ticket.proposed_value}</div>
						</div>
					</div>
				</div>

				<!-- Code Box Preview -->
				{#if paradigm === "relational"}
					<div class="space-y-1.5">
						<div class="flex items-center justify-between text-muted-foreground text-[11px]">
							<span>Parameterized SQL Prepared Statement (PostgreSQL / Oracle):</span>
							<span class="text-emerald-500">Atomic Tx</span>
						</div>
						<pre class="p-3.5 rounded-xl bg-neutral-950 text-neutral-100 overflow-x-auto border border-neutral-800 leading-relaxed">
<code><span class="text-neutral-500">-- Transaction Isolation: Read Committed</span>
<span class="text-purple-400">BEGIN</span>;

<span class="text-blue-400">UPDATE</span> invoices 
<span class="text-blue-400">SET</span> {ticket.field_target} = <span class="text-amber-300">'{ticket.proposed_value}'</span>, 
    updated_at = <span class="text-blue-400">NOW()</span>
<span class="text-blue-400">WHERE</span> invoice_no = <span class="text-amber-300">'{ticket.document_no}'</span>
  <span class="text-blue-400">AND</span> status != <span class="text-amber-300">'CLOSED'</span>;

<span class="text-neutral-500">-- Automated Immutable Audit Trail Entry</span>
<span class="text-blue-400">INSERT INTO</span> audit_logs (ticket_id, action, performed_by, prev_value, new_value)
<span class="text-blue-400">VALUES</span> ({ticket.id}, <span class="text-amber-300">'MUTATE'</span>, <span class="text-amber-300">'john.doe'</span>, <span class="text-amber-300">'{ticket.current_value}'</span>, <span class="text-amber-300">'{ticket.proposed_value}'</span>);

<span class="text-purple-400">COMMIT</span>;</code></pre>
					</div>
				{:else}
					<div class="space-y-1.5">
						<div class="flex items-center justify-between text-muted-foreground text-[11px]">
							<span>Compensating BSON Command (MongoDB / Document Store):</span>
							<span class="text-emerald-500">Two-Phase Commit</span>
						</div>
						<pre class="p-3.5 rounded-xl bg-neutral-950 text-neutral-100 overflow-x-auto border border-neutral-800 leading-relaxed">
<code><span class="text-neutral-500">// Atomic $set with preconditions</span>
db.invoices.updateOne(
  &#123; 
    invoice_no: <span class="text-amber-300">"{ticket.document_no}"</span>, 
    status: &#123; $ne: <span class="text-amber-300">"CLOSED"</span> &#125; 
  &#125;,
  &#123; 
    $set: &#123; 
      <span class="text-purple-300">"{ticket.field_target}"</span>: <span class="text-amber-300">"{ticket.proposed_value}"</span>,
      <span class="text-purple-300">"updated_at"</span>: new Date()
    &#125; 
  &#125;
);</code></pre>
					</div>
				{/if}

				<!-- Raw Message Context -->
				<div class="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs font-sans">
					<div class="font-semibold text-foreground text-[11px] font-mono uppercase tracking-wider">Original Inbound Message:</div>
					<p class="text-muted-foreground italic bg-background p-2.5 rounded-lg border border-border">"{ticket.raw_message}"</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="p-4 border-t border-border bg-muted/20 flex items-center justify-end">
				<button
					type="button"
					onclick={onclose}
					class="h-9 px-4 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer"
				>
					{i18n.t.modals.close}
				</button>
			</div>
		</div>
	</div>
{/if}
