<script lang="ts">
	import { ExclamationTriangle, XMark } from "svelte-heros-v2";
	import type { Ticket } from "$lib/cockpit.svelte";

	let { 
		ticket = null, 
		processing = false,
		onclose,
		onsubmit
	}: { 
		ticket: Ticket | null; 
		processing: boolean;
		onclose: () => void;
		onsubmit: (reason: string) => void;
	} = $props();

	let reason = $state("");
</script>

{#if ticket}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200"
		role="presentation"
		onclick={onclose}
	>
		<div 
			class="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4"
			role="dialog"
			aria-modal="true"
			aria-label="Reject Mutation Ticket"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between pb-3 border-b border-border">
				<div class="flex items-center gap-2.5 text-destructive font-semibold text-base">
					<ExclamationTriangle class="h-5 w-5" />
					<span>Reject Mutation Request</span>
				</div>
				<button
					type="button"
					onclick={onclose}
					class="p-1 rounded-md text-muted-foreground hover:text-foreground"
				>
					<XMark class="h-4 w-4" />
				</button>
			</div>

			<p class="text-xs text-muted-foreground leading-relaxed">
				Rejecting ticket <strong class="text-foreground font-mono">{ticket.ticket_no}</strong> ({ticket.document_no}). This action is logged permanently in the audit trail and sent back to the WhatsApp branch thread.
			</p>

			<div class="space-y-1.5">
				<label for="reject-reason-input" class="block font-medium text-foreground text-xs">
					Reason for Rejection:
				</label>
				<textarea
					id="reject-reason-input"
					bind:value={reason}
					rows={3}
					class="w-full rounded-md border border-input bg-background p-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					placeholder="e.g. Invoice sudah berstatus CLOSED dalam pembukuan akhir bulan; tidak memenuhi SOP koreksi."
				></textarea>
			</div>

			<div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
				<button
					type="button"
					onclick={onclose}
					class="h-9 px-4 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => onsubmit(reason)}
					disabled={processing || !reason.trim()}
					class="h-9 px-4 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium cursor-pointer disabled:opacity-50"
				>
					{processing ? "Rejecting..." : "Confirm Rejection"}
				</button>
			</div>
		</div>
	</div>
{/if}
