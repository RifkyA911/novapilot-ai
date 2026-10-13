<script lang="ts">
	import { 
		Clock, 
		MagnifyingGlass, 
		Check, 
		XMark, 
		Eye, 
		CheckCircle, 
		ArrowPath,
		Funnel,
		ArrowsUpDown,
		DocumentText,
		ArrowTopRightOnSquare,
		PaperAirplane
	} from "svelte-heros-v2";
	import { cockpit, type Ticket } from "$lib/cockpit.svelte";
	import InspectModal from "$lib/components/InspectModal.svelte";
	import RejectModal from "$lib/components/RejectModal.svelte";
	import { timeAgo } from "$lib/utils";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	let currentUser = $derived(data.user || {
		id: "usr_guest",
		name: "John Doe",
		email: "johndoe@factory.internal",
		role: "oncall_engineer" as const
	});

	// Filtering & Sorting State
	let searchQuery = $state("");
	let filterBranch = $state("all");
	let filterConfidence = $state("all");
	let sortBy = $state<"newest" | "oldest" | "confidence">("newest");

	// Modals
	let inspectedTicket = $state<Ticket | null>(null);
	let selectedTicketForReject = $state<Ticket | null>(null);
	let processingAction = $state(false);

	let filteredTickets = $derived(
		cockpit.tickets
			.filter(t => t.status === "PENDING_APPROVAL")
			.filter(t => {
				if (filterBranch !== "all" && t.branch_name !== filterBranch) return false;
				if (filterConfidence === "high" && t.confidence_score < 0.9) return false;
				if (filterConfidence === "review" && t.confidence_score >= 0.9) return false;
				if (!searchQuery.trim()) return true;
				const q = searchQuery.toLowerCase();
				return (
					t.ticket_no.toLowerCase().includes(q) ||
					t.document_no.toLowerCase().includes(q) ||
					t.proposed_value.toLowerCase().includes(q) ||
					t.raw_message.toLowerCase().includes(q) ||
					(t.branch_name && t.branch_name.toLowerCase().includes(q))
				);
			})
			.sort((a, b) => {
				if (sortBy === "oldest") {
					return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
				}
				if (sortBy === "confidence") {
					return b.confidence_score - a.confidence_score;
				}
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			})
	);

	async function handleApprove(ticket: Ticket) {
		processingAction = true;
		const res = await cockpit.handleApprove(ticket, currentUser.name);
		if (!res.success) {
			alert(`Approval failed: ${res.error}`);
		}
		processingAction = false;
	}

	async function submitReject(reason: string) {
		if (!selectedTicketForReject) return;
		processingAction = true;
		const res = await cockpit.handleReject(selectedTicketForReject, currentUser.name, reason);
		if (res.success) {
			selectedTicketForReject = null;
		} else {
			alert(`Rejection failed: ${res.error}`);
		}
		processingAction = false;
	}
</script>

<!-- Inspect Modal -->
<InspectModal 
	ticket={inspectedTicket} 
	onclose={() => (inspectedTicket = null)} 
/>

<!-- Reject Modal -->
<RejectModal 
	ticket={selectedTicketForReject} 
	processing={processingAction}
	onclose={() => (selectedTicketForReject = null)}
	onsubmit={submitReject}
/>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
					<Clock class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>Approval Queue</span>
						{#if cockpit.pendingCount > 0}
							<span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
								{cockpit.pendingCount} pending
							</span>
						{/if}
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Side-by-side verification diffs for incoming WhatsApp mutation requests. Zero raw SQL certified.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => cockpit.fetchTickets()}
				class="h-9 px-3 rounded-lg border border-input bg-background hover:bg-accent text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
			>
				<ArrowPath class="h-4 w-4 {cockpit.loading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</button>
		</div>
	</div>

	<!-- Filter & Search Toolbar (Authentic shadcn / TanStack Table controls) -->
	<div class="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2.5 flex-wrap flex-1 min-w-[280px]">
			<!-- Search Input -->
			<div class="relative flex-1 min-w-[220px] max-w-sm">
				<MagnifyingGlass class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search ticket, invoice, customer, raw text..."
					class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans shadow-xs transition-colors"
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

			<!-- Branch Filter -->
			<div class="flex items-center">
				<select
					bind:value={filterBranch}
					class="h-9 rounded-md border border-input bg-background px-3 text-sm font-sans text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
				>
					<option value="all">All Regional Branches</option>
					<option value="Surabaya HQ">Surabaya HQ</option>
					<option value="Medan Hub">Medan Hub</option>
					<option value="Semarang DC">Semarang DC</option>
					<option value="Makassar Hub">Makassar Hub</option>
				</select>
			</div>

			<!-- Confidence Filter -->
			<div class="flex items-center">
				<select
					bind:value={filterConfidence}
					class="h-9 rounded-md border border-input bg-background px-3 text-sm font-sans text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
				>
					<option value="all">All Confidence Levels</option>
					<option value="high">High Confidence (&ge; 90%)</option>
					<option value="review">Needs Manual Review (&lt; 90%)</option>
				</select>
			</div>
		</div>

		<!-- Sort By -->
		<div class="flex items-center gap-2">
			<ArrowsUpDown class="h-4 w-4 text-muted-foreground" />
			<select
				bind:value={sortBy}
				class="h-9 rounded-md border border-input bg-background px-3 text-sm font-sans text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
			>
				<option value="newest">Newest First</option>
				<option value="oldest">Oldest First</option>
				<option value="confidence">Highest Confidence</option>
			</select>
		</div>
	</div>

	<!-- Tickets List -->
	{#if filteredTickets.length === 0}
		<div class="p-12 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
			<div class="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
				<CheckCircle class="h-6 w-6" />
			</div>
			<div class="text-base font-semibold text-foreground">No Pending Tickets</div>
			<p class="text-xs text-muted-foreground max-w-md mx-auto">
				{searchQuery || filterBranch !== "all" || filterConfidence !== "all" 
					? "No tickets match your active search filters. Try clearing filters."
					: "The queue is clean! All inbound WhatsApp requests have been reviewed."}
			</p>
			{#if searchQuery || filterBranch !== "all" || filterConfidence !== "all"}
				<button
					type="button"
					onclick={() => { searchQuery = ""; filterBranch = "all"; filterConfidence = "all"; }}
					class="px-3 py-1.5 rounded-lg border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer"
				>
					Clear All Filters
				</button>
			{:else}
				<a
					href="/dashboard/simulator"
					class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
				>
					<PaperAirplane class="h-3.5 w-3.5" />
					<span>Send Simulated Inbound Chat</span>
				</a>
			{/if}
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredTickets as ticket (ticket.id)}
				<div class="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3 transition-all hover:border-primary/40">
					<!-- Card Header -->
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="font-mono font-bold text-sm text-foreground">{ticket.ticket_no}</span>
							<span class="text-xs text-muted-foreground font-mono">Invoice #{ticket.document_no}</span>
							{#if ticket.branch_name}
								<span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
									{ticket.branch_name}
								</span>
							{/if}
							<span class="text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold {ticket.confidence_score >= 0.9 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}">
								{(ticket.confidence_score * 100).toFixed(0)}% AI Confidence
							</span>
						</div>

						<div class="text-[11px] font-mono text-muted-foreground">
							Received {timeAgo(ticket.created_at)}
						</div>
					</div>

					<!-- Side by Side Diff Comparison -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs font-mono">
						<div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
							<div class="text-[10px] text-muted-foreground font-sans">CURRENT DATABASE STATE ({ticket.field_target}):</div>
							<div class="font-bold line-through mt-0.5">{ticket.current_value}</div>
						</div>
						<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
							<div class="text-[10px] text-muted-foreground font-sans">PROPOSED MUTATION:</div>
							<div class="font-bold mt-0.5">{ticket.proposed_value}</div>
						</div>
					</div>

					<!-- Raw WhatsApp message snippet -->
					<div class="text-xs text-muted-foreground italic px-1 font-sans">
						"{ticket.raw_message}"
					</div>

					<!-- Document Attachments if any -->
					{#if ticket.documents && ticket.documents.length > 0}
						<div class="pt-2 flex items-center gap-2 flex-wrap">
							<span class="text-[11px] font-mono text-muted-foreground">Proof Attachments:</span>
							{#each ticket.documents as doc}
								<a
									href={doc.file_path}
									target="_blank"
									class="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] font-mono text-foreground border border-border"
								>
									<DocumentText class="h-3 w-3 text-primary" />
									<span>{doc.file_name}</span>
									<ArrowTopRightOnSquare class="h-3 w-3 opacity-60" />
								</a>
							{/each}
						</div>
					{/if}

					<!-- Action Buttons Bar -->
					<div class="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
						<button
							type="button"
							onclick={() => (inspectedTicket = ticket)}
							class="h-8 px-3 rounded-lg border border-input bg-background hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer shadow-xs"
							title="Inspect Prepared SQL and Schema Diffs"
						>
							<Eye class="h-3.5 w-3.5" />
							<span>Inspect Plan</span>
						</button>

						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => (selectedTicketForReject = ticket)}
								class="h-8 px-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium cursor-pointer transition-colors"
							>
								Reject
							</button>

							<button
								type="button"
								onclick={() => handleApprove(ticket)}
								disabled={processingAction}
								class="h-8 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs transition-colors"
							>
								<Check class="h-3.5 w-3.5" />
								<span>Approve & Mutate</span>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
