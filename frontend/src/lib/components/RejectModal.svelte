<script lang="ts">
	import { ExclamationTriangle, XMark } from "svelte-heros-v2";
	import type { Ticket } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";

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
			aria-label={i18n.t.modals.reject_title}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between pb-3 border-b border-border">
				<div class="flex items-center gap-2.5 text-destructive font-semibold text-base">
					<ExclamationTriangle class="h-5 w-5" />
					<span>{i18n.t.modals.reject_title}</span>
				</div>
				<button
					type="button"
					onclick={onclose}
					class="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
				>
					<XMark class="h-4 w-4" />
				</button>
			</div>

			<p class="text-xs text-muted-foreground leading-relaxed">
				{i18n.t.modals.reject_desc.replace("{ticket_no}", ticket.ticket_no).replace("{doc_no}", ticket.document_no)}
			</p>

			<div class="space-y-1.5">
				<label for="reject-reason-input" class="block font-medium text-foreground text-xs">
					{i18n.t.modals.reason_label}
				</label>
				<textarea
					id="reject-reason-input"
					bind:value={reason}
					rows={3}
					class="w-full rounded-md border border-input bg-background p-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					placeholder={i18n.t.modals.reason_placeholder}
				></textarea>
			</div>

			<div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
				<button
					type="button"
					onclick={onclose}
					class="h-9 px-4 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer"
				>
					{i18n.t.modals.cancel}
				</button>
				<button
					type="button"
					onclick={() => onsubmit(reason)}
					disabled={processing || !reason.trim()}
					class="h-9 px-4 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-medium cursor-pointer disabled:opacity-50"
				>
					{processing ? i18n.t.modals.rejecting : i18n.t.modals.confirm_reject}
				</button>
			</div>
		</div>
	</div>
{/if}
