<script lang="ts">
	import {
		createTable,
		FlexRender,
		tableFeatures,
		rowPaginationFeature,
		rowSortingFeature,
		type PaginationState,
		type SortingState
	} from "@tanstack/svelte-table";
	import { 
		MagnifyingGlass, Funnel, ArrowUp, ArrowDown, 
		ChevronLeft, ChevronRight, CheckCircle, XCircle,
		ArrowsUpDown, Sparkles
	} from "svelte-heros-v2";
	import { timeAgo } from "$lib/utils";

	interface Ticket {
		id: number;
		ticket_no: string;
		branch_id?: number;
		branch_name?: string;
		raw_message: string;
		extracted_intent: string;
		document_no: string;
		field_target: string;
		current_value: string;
		proposed_value: string;
		confidence_score: number;
		status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED";
		approved_by?: string;
		rejection_reason?: string;
		created_at: string;
		updated_at?: string;
	}

	let { tickets = [] }: { tickets: Ticket[] } = $props();

	// History data (processed / completed tickets)
	let historyData = $derived(tickets.filter(t => t.status !== "PENDING_APPROVAL"));

	const features = tableFeatures({
		rowPaginationFeature,
		rowSortingFeature
	});

	const columns = [
		{
			accessorKey: "ticket_no",
			header: "Ticket #",
			enableSorting: true
		},
		{
			accessorKey: "document_no",
			header: "Invoice No",
			enableSorting: true
		},
		{
			accessorKey: "branch_name",
			header: "Branch Hub",
			enableSorting: true
		},
		{
			accessorKey: "proposed_value",
			header: "Mutated Value",
			enableSorting: true
		},
		{
			accessorKey: "status",
			header: "Status",
			enableSorting: true
		},
		{
			accessorKey: "approved_by",
			header: "Audited By",
			enableSorting: true
		},
		{
			accessorKey: "created_at",
			header: "Timestamp",
			enableSorting: true
		}
	];

	let globalSearch = $state("");
	let statusFilter = $state<"ALL" | "EXECUTED" | "REJECTED">("ALL");
	let branchFilter = $state<string>("ALL");
	let sorting = $state<SortingState>([{ id: "created_at", desc: true }]);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 8 });

	// Filtered data stream
	let processedData = $derived(
		historyData.filter(item => {
			if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
			if (branchFilter !== "ALL" && item.branch_name !== branchFilter) return false;
			if (!globalSearch.trim()) return true;
			const q = globalSearch.toLowerCase();
			return (
				item.ticket_no.toLowerCase().includes(q) ||
				item.document_no.toLowerCase().includes(q) ||
				item.proposed_value.toLowerCase().includes(q) ||
				(item.branch_name && item.branch_name.toLowerCase().includes(q)) ||
				(item.approved_by && item.approved_by.toLowerCase().includes(q))
			);
		})
	);

	const table = createTable({
		features,
		columns,
		get data() {
			return processedData;
		},
		state: {
			get sorting() {
				return sorting;
			},
			get pagination() {
				return pagination;
			}
		},
		onSortingChange: (updater) => {
			sorting = typeof updater === "function" ? updater(sorting) : updater;
		},
		onPaginationChange: (updater) => {
			pagination = typeof updater === "function" ? updater(pagination) : updater;
		}
	});

	let pageIndex = $derived(table.atoms.pagination.get().pageIndex);
	let pageSize = $derived(table.atoms.pagination.get().pageSize);
	let totalPages = $derived(Math.ceil(processedData.length / pageSize) || 1);
</script>

<div class="space-y-3 font-sans">
	<!-- TanStack Filter & Control Bar -->
	<div class="p-3 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-wrap items-center justify-between gap-3">
		<!-- Search & Filter Controls -->
		<div class="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
			<!-- Global Search -->
			<div class="relative flex-1 min-w-[200px] max-w-sm">
				<MagnifyingGlass class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
				<input
					type="text"
					bind:value={globalSearch}
					placeholder="Search ticket, invoice, customer, engineer…"
					class="h-8.5 w-full rounded-xl border border-border/80 bg-background pl-8.5 pr-8 text-[13px] outline-none transition-colors focus:border-foreground/40 font-mono shadow-xs placeholder:text-muted-foreground/70"
				/>
				{#if globalSearch}
					<button
						onclick={() => (globalSearch = "")}
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
					>
						✕
					</button>
				{/if}
			</div>

			<!-- Status Filter Dropdown -->
			<div class="flex items-center gap-1.5">
				<Funnel class="h-3.5 w-3.5 text-muted-foreground" />
				<select
					bind:value={statusFilter}
					class="h-8.5 px-2.5 rounded-xl border border-border/80 bg-background text-[12px] font-mono outline-none focus:border-foreground/40 text-foreground cursor-pointer"
				>
					<option value="ALL">All Statuses</option>
					<option value="EXECUTED">Executed Only</option>
					<option value="REJECTED">Rejected Only</option>
				</select>
			</div>

			<!-- Branch Filter Dropdown -->
			<select
				bind:value={branchFilter}
				class="h-8.5 px-2.5 rounded-xl border border-border/80 bg-background text-[12px] font-mono outline-none focus:border-foreground/40 text-foreground cursor-pointer"
			>
				<option value="ALL">All Branches</option>
				<option value="Surabaya HQ">Surabaya HQ</option>
				<option value="Medan Hub">Medan Hub</option>
				<option value="Semarang DC">Semarang DC</option>
				<option value="Makassar Hub">Makassar Hub</option>
			</select>
		</div>

		<!-- TanStack Stack Engine Tag -->
		<div class="flex items-center gap-2">
			<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary border border-border/60 text-[11px] font-mono text-muted-foreground">
				<Sparkles class="h-3 w-3 text-primary" />
				<span class="font-bold text-foreground">TanStack Table</span> v9 Active
			</span>
			<span class="text-[12px] font-mono text-muted-foreground">
				{processedData.length} records
			</span>
		</div>
	</div>

	<!-- TanStack Data Table Card -->
	<div class="rounded-2xl bg-card border border-border/80 overflow-hidden shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-[13px]">
				<!-- Table Header with Sorting -->
				<thead class="bg-secondary/60 text-muted-foreground uppercase font-mono text-[11px] border-b border-border/60">
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<tr>
							{#each headerGroup.headers as header (header.id)}
								<th class="p-3 select-none">
									{#if !header.isPlaceholder}
										<button
											onclick={header.column.getToggleSortingHandler()}
											class="flex items-center gap-1.5 hover:text-foreground transition-colors font-bold uppercase tracking-wider text-left w-full cursor-pointer"
										>
											<span>{header.column.columnDef.header}</span>
											{#if header.column.getIsSorted() === 'asc'}
												<ArrowUp class="h-3 w-3 text-primary shrink-0" />
											{:else if header.column.getIsSorted() === 'desc'}
												<ArrowDown class="h-3 w-3 text-primary shrink-0" />
											{:else}
												<ArrowsUpDown class="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
											{/if}
										</button>
									{/if}
								</th>
							{/each}
						</tr>
					{/each}
				</thead>

				<!-- Table Body -->
				<tbody class="divide-y divide-border/40">
					{#if table.getRowModel().rows.length === 0}
						<tr>
							<td colspan={columns.length} class="py-12 text-center text-muted-foreground text-[13px] font-mono">
								No matching audit records found.
							</td>
						</tr>
					{:else}
						{#each table.getRowModel().rows as row (row.id)}
							<tr class="hover:bg-secondary/40 transition-colors">
								<!-- Ticket No -->
								<td class="p-3 font-mono font-bold text-foreground">
									#{row.original.ticket_no}
								</td>

								<!-- Document No -->
								<td class="p-3 font-mono text-foreground/90">
									{row.original.document_no}
								</td>

								<!-- Branch -->
								<td class="p-3 text-muted-foreground font-medium">
									{row.original.branch_name || "Surabaya HQ"}
								</td>

								<!-- Proposed Value -->
								<td class="p-3 font-medium text-foreground">
									{row.original.proposed_value}
								</td>

								<!-- Status Badge -->
								<td class="p-3">
									{#if row.original.status === "EXECUTED"}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
											<CheckCircle class="h-3 w-3" />
											<span>EXECUTED</span>
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-destructive/10 text-destructive border border-destructive/20">
											<XCircle class="h-3 w-3" />
											<span>REJECTED</span>
										</span>
									{/if}
								</td>

								<!-- Approved By -->
								<td class="p-3 text-muted-foreground font-medium">
									{row.original.approved_by || "John Doe"}
								</td>

								<!-- Timestamp -->
								<td class="p-3 text-muted-foreground font-mono text-[12px]">
									{timeAgo(row.original.updated_at || row.original.created_at)}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- TanStack Pagination Toolbar -->
		<div class="p-3 border-t border-border/50 bg-secondary/20 flex flex-wrap items-center justify-between gap-3 text-[12px] font-mono">
			<div class="flex items-center gap-2 text-muted-foreground">
				<span>Page <strong class="text-foreground">{pageIndex + 1}</strong> of <strong class="text-foreground">{totalPages}</strong></span>
				<span class="text-border">|</span>
				<span>Total {processedData.length} entries</span>
			</div>

			<div class="flex items-center gap-2">
				<!-- Page Size Select -->
				<select
					value={pageSize}
					onchange={(e) => table.setPageSize(Number((e.target as HTMLSelectElement).value))}
					class="h-7 px-2 rounded-lg border border-border/80 bg-background text-[11px] font-mono text-foreground cursor-pointer"
				>
					<option value={8}>8 / page</option>
					<option value={15}>15 / page</option>
					<option value={25}>25 / page</option>
				</select>

				<!-- Prev / Next Buttons -->
				<div class="flex items-center gap-1">
					<button
						onclick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						class="p-1.5 rounded-lg border border-border/70 bg-background hover:bg-secondary text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
						title="Previous Page"
					>
						<ChevronLeft class="h-3.5 w-3.5" />
					</button>

					<button
						onclick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						class="p-1.5 rounded-lg border border-border/70 bg-background hover:bg-secondary text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
						title="Next Page"
					>
						<ChevronRight class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
