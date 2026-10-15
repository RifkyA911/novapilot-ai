<script lang="ts" generics="T extends Record<string, any>">
	import type { Snippet } from "svelte";
	import { 
		MagnifyingGlass, 
		ChevronUp, 
		ChevronDown, 
		ChevronUpDown, 
		ChevronLeft, 
		ChevronRight, 
		ArrowDownTray, 
		Printer, 
		Funnel,
		ArrowPath
	} from "svelte-heros-v2";

	import type { ColumnDef } from "$lib/types/table";
	export type { ColumnDef };

	interface Props {
		data: T[];
		columns: ColumnDef<T>[];
		title?: string;
		subtitle?: string;
		searchPlaceholder?: string;
		searchKeys?: (keyof T)[];
		filterKey?: keyof T;
		filterOptions?: { label: string; value: string }[];
		defaultPageSize?: number;
		enableExport?: boolean;
		exportFilename?: string;
		emptyMessage?: string;
		toolbar?: Snippet;
		rowCell?: Snippet<[{ row: T; column: ColumnDef<T> }]>;
	}

	let {
		data = [],
		columns,
		title,
		subtitle,
		searchPlaceholder = "Cari data dalam tabel...",
		searchKeys = [],
		filterKey,
		filterOptions = [],
		defaultPageSize = 10,
		enableExport = true,
		exportFilename = "novapilot-export",
		emptyMessage = "Tidak ada data yang cocok dengan pencarian",
		toolbar,
		rowCell
	}: Props = $props();

	// State
	let searchQuery = $state("");
	let selectedFilter = $state("ALL");
	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<"asc" | "desc">("asc");
	let currentPage = $state(1);
	let pageSize = $state(defaultPageSize);
	let jumpPageInput = $state("");

	function handleJumpPage() {
		const trimmed = String(jumpPageInput).trim();
		if (!trimmed) return;
		const pageNum = parseInt(trimmed, 10);
		if (!isNaN(pageNum)) {
			if (pageNum < 1) {
				currentPage = 1;
			} else if (pageNum > totalPages) {
				currentPage = totalPages;
			} else {
				currentPage = pageNum;
			}
		}
		jumpPageInput = "";
	}

	// Get value for a row given a column
	function getCellValue(row: T, col: ColumnDef<T>): any {
		if (typeof col.accessorKey === "function") {
			return col.accessorKey(row);
		}
		if (col.accessorKey) {
			return row[col.accessorKey];
		}
		return row[col.id];
	}

	// Filtered & Sorted Data
	const filteredData = $derived.by(() => {
		let result = [...data];

		// 1. Column Filter
		if (filterKey && selectedFilter !== "ALL") {
			result = result.filter(row => String(row[filterKey]) === selectedFilter);
		}

		// 2. Global Search
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			result = result.filter(row => {
				if (searchKeys.length > 0) {
					return searchKeys.some(key => {
						const val = row[key];
						return val != null && String(val).toLowerCase().includes(q);
					});
				}
				// Default fallback: search all string / number fields
				return Object.values(row).some(val => 
					val != null && String(val).toLowerCase().includes(q)
				);
			});
		}

		// 3. Sorting
		if (sortColumn) {
			const colDef = columns.find(c => c.id === sortColumn);
			if (colDef) {
				result.sort((a, b) => {
					const valA = getCellValue(a, colDef);
					const valB = getCellValue(b, colDef);

					if (valA == null) return 1;
					if (valB == null) return -1;

					if (typeof valA === "number" && typeof valB === "number") {
						return sortDirection === "asc" ? valA - valB : valB - valA;
					}

					const strA = String(valA).toLowerCase();
					const strB = String(valB).toLowerCase();
					return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
				});
			}
		}

		return result;
	});

	// Pagination Calculations
	const totalItems = $derived(filteredData.length);
	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	const validPage = $derived(Math.min(Math.max(1, currentPage), totalPages));

	const paginatedData = $derived.by(() => {
		const start = (validPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	});

	const startIndex = $derived(totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1);
	const endIndex = $derived(Math.min(validPage * pageSize, totalItems));

	// Sorting Handler
	function handleSort(colId: string, sortable?: boolean) {
		if (sortable === false) return;
		if (sortColumn === colId) {
			if (sortDirection === "asc") {
				sortDirection = "desc";
			} else {
				sortColumn = null;
				sortDirection = "asc";
			}
		} else {
			sortColumn = colId;
			sortDirection = "asc";
		}
		currentPage = 1;
	}

	// Export to Excel / CSV with UTF-8 BOM
	function exportToCSV() {
		const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(",");
		const rows = filteredData.map(row => {
			return columns.map(c => {
				const val = c.exportValue ? c.exportValue(row) : getCellValue(row, c);
				const clean = val == null ? "" : String(val).replace(/"/g, '""');
				return `"${clean}"`;
			}).join(",");
		});

		const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		const dateStr = new Date().toISOString().slice(0, 10);
		link.setAttribute("href", url);
		link.setAttribute("download", `${exportFilename}_${dateStr}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// Export / Print formatted report
	function triggerPrint() {
		window.print();
	}
</script>

<div class="space-y-4 w-full font-sans">
	<!-- Card 1: Header (Title, Subtitle, and Category Filter in 1 Row) -->
	<div class="rounded-2xl bg-card border border-border shadow-xs p-4 sm:px-5 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
			{#if title}
				<div class="flex items-center gap-2.5 shrink-0">
					<h2 class="text-base sm:text-lg font-bold text-foreground tracking-tight whitespace-nowrap">{title}</h2>
					<span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
						{totalItems} data
					</span>
				</div>
			{/if}
			{#if subtitle}
				<span class="hidden lg:inline text-muted-foreground/40 text-sm shrink-0">•</span>
				<p class="text-xs sm:text-sm text-muted-foreground truncate max-w-2xl">{subtitle}</p>
			{/if}
		</div>

		<!-- Category Filter Dropdown (Semua Kategori) -->
		{#if filterOptions.length > 0}
			<div class="relative shrink-0 w-full sm:w-auto">
				<select
					bind:value={selectedFilter}
					onchange={() => currentPage = 1}
					class="w-full sm:w-auto h-10 px-3.5 pr-9 rounded-xl bg-secondary/50 border border-input text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none transition-all shadow-2xs hover:bg-secondary/70"
				>
					<option value="ALL">Semua Kategori</option>
					{#each filterOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
				<Funnel class="h-3.5 w-3.5 text-muted-foreground absolute right-3 top-3.5 pointer-events-none" />
			</div>
		{/if}
	</div>

	<!-- Card 2: Table Container with Controls Bar & thead Divider -->
	<div class="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
		<!-- Controls Toolbar (Show entries | Search to Excel & PDF) -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-secondary/10">
			<!-- Left: Show Entries | Search -->
			<div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
				<!-- Show Entries Dropdown -->
				<div class="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-secondary/50 h-10 px-3 py-1.5 rounded-xl border border-input/60 shrink-0">
					<span>Show:</span>
					<select
						bind:value={pageSize}
						onchange={() => currentPage = 1}
						class="bg-transparent font-bold text-foreground text-xs sm:text-sm focus:outline-none cursor-pointer pr-1"
					>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</div>

				<!-- Divider "|" -->
				<div class="h-5 w-px bg-border shrink-0 hidden sm:block"></div>

				<!-- Search Bar -->
				<div class="relative flex-1 sm:w-80 min-w-[220px]">
					<MagnifyingGlass class="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
					<input
						type="text"
						bind:value={searchQuery}
						oninput={() => currentPage = 1}
						placeholder={searchPlaceholder}
						class="w-full h-10 pl-10 pr-8 rounded-xl bg-secondary/50 border border-input/60 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
					/>
					{#if searchQuery}
						<button
							type="button"
							onclick={() => { searchQuery = ""; currentPage = 1; }}
							class="absolute right-3 top-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
						>
							✕
						</button>
					{/if}
				</div>
			</div>

			<!-- Right: Excel & PDF Buttons -->
			<div class="flex items-center gap-2 shrink-0">
				{#if enableExport}
					<button
						type="button"
						onclick={exportToCSV}
						class="h-10 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
						title="Export data saat ini ke Excel (.csv)"
					>
						<ArrowDownTray class="h-4 w-4 text-emerald-500" />
						<span>Excel</span>
					</button>

					<button
						type="button"
						onclick={triggerPrint}
						class="h-10 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
						title="Cetak atau simpan sebagai PDF"
					>
						<Printer class="h-4 w-4 text-sky-500" />
						<span>PDF</span>
					</button>
				{/if}

				{#if toolbar}
					{@render toolbar()}
				{/if}
			</div>
		</div>

		<!-- Divider line between Controls Toolbar and thead -->
		<hr class="border-border my-0" />

		<!-- Table Scrollable Area -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs sm:text-sm">
				<thead class="bg-secondary/40 border-b border-border text-[10px] sm:text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
					<tr>
						{#each columns as col}
							<th 
								scope="col" 
								class="px-4 py-3.5 {col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} {col.class || ''} {col.sortable !== false ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''}"
								onclick={() => handleSort(col.id, col.sortable)}
							>
								<div class="flex items-center gap-1.5 {col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}">
									<span>{col.header}</span>
									{#if col.sortable !== false}
										{#if sortColumn === col.id}
											{#if sortDirection === 'asc'}
												<ChevronUp class="h-3.5 w-3.5 text-primary" />
											{:else}
												<ChevronDown class="h-3.5 w-3.5 text-primary" />
											{/if}
										{:else}
											<ChevronUpDown class="h-3.5 w-3.5 opacity-30 group-hover:opacity-100" />
										{/if}
									{/if}
								</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-border/60 text-foreground font-normal">
					{#if paginatedData.length === 0}
						<tr>
							<td colspan={columns.length} class="px-6 py-12 text-center text-muted-foreground">
								<div class="flex flex-col items-center justify-center space-y-2">
									<div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
										<MagnifyingGlass class="h-5 w-5" />
									</div>
									<p class="font-medium text-foreground">{emptyMessage}</p>
									<p class="text-xs text-muted-foreground">Coba sesuaikan kata kunci pencarian atau reset filter kategori.</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each paginatedData as row, rowIndex (row.id || rowIndex)}
							<tr class="hover:bg-muted/40 transition-colors">
								{#each columns as col}
									<td class="px-4 py-3.5 {col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} {col.class || ''}">
										{#if rowCell}
											{@render rowCell({ row, column: col })}
										{:else}
											{getCellValue(row, col) ?? "-"}
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination Footer -->
		<div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-border bg-secondary/20 text-[11px] sm:text-xs font-mono">
			<div class="text-muted-foreground">
				Menampilkan <strong class="text-foreground">{startIndex}</strong> - <strong class="text-foreground">{endIndex}</strong> dari <strong class="text-foreground">{totalItems}</strong> data
				{#if totalItems !== data.length}
					<span class="text-[11px] sm:text-xs text-primary font-medium">(difilter dari total {data.length} data)</span>
				{/if}
			</div>

			<!-- Pagination Navigation & Jump-to-Page Input -->
			<div class="flex flex-wrap items-center gap-3">
				<!-- Jump to Page Input -->
				<div class="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
					<span class="whitespace-nowrap font-medium">Loncat ke:</span>
					<input
						type="number"
						min="1"
						max={totalPages}
						bind:value={jumpPageInput}
						onkeydown={(e) => {
							if (e.key === "Enter") {
								handleJumpPage();
							}
						}}
						placeholder={String(validPage)}
						class="h-9 w-16 px-2 text-center rounded-xl border border-input/60 bg-card text-foreground text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
					/>
					<span class="font-mono text-muted-foreground">/ {totalPages}</span>
					<button
						type="button"
						onclick={handleJumpPage}
						class="h-9 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
					>
						Go
					</button>
				</div>

				<div class="h-5 w-px bg-border hidden sm:block"></div>

				<!-- Page Navigation Buttons -->
				<div class="flex items-center gap-1 font-mono">
					<button
						type="button"
						onclick={() => currentPage = Math.max(1, validPage - 1)}
						disabled={validPage <= 1}
						class="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
						aria-label="Previous Page"
					>
						<ChevronLeft class="h-4 w-4" />
					</button>

					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as pageNum}
						{#if totalPages <= 7 || pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - validPage) <= 1}
							<button
								type="button"
								onclick={() => currentPage = pageNum}
								class="h-9 min-w-[36px] px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer {validPage === pageNum ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'}"
							>
								{pageNum}
							</button>
						{:else if Math.abs(pageNum - validPage) === 2}
							<span class="px-1 text-muted-foreground">...</span>
						{/if}
					{/each}

					<button
						type="button"
						onclick={() => currentPage = Math.min(totalPages, validPage + 1)}
						disabled={validPage >= totalPages}
						class="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
						aria-label="Next Page"
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
