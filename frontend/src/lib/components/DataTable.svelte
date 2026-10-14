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
	<!-- Table Header & Controls Toolbar -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
		<!-- Left: Title or Search -->
		<div class="space-y-1">
			{#if title}
				<div class="flex items-center gap-2">
					<h2 class="text-base sm:text-lg font-bold text-foreground tracking-tight">{title}</h2>
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
						{totalItems} data
					</span>
				</div>
			{/if}
			{#if subtitle}
				<p class="text-xs text-muted-foreground">{subtitle}</p>
			{/if}
		</div>

		<!-- Right: Search, Filter, Entries, Export Actions -->
		<div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
			<!-- Search Bar -->
			<div class="relative flex-1 sm:w-64 min-w-[200px]">
				<MagnifyingGlass class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder={searchPlaceholder}
					class="w-full h-9 pl-9 pr-3 rounded-xl bg-secondary/50 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => searchQuery = ""}
						class="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
					>
						✕
					</button>
				{/if}
			</div>

			<!-- Optional Category Filter -->
			{#if filterOptions.length > 0}
				<div class="relative">
					<select
						bind:value={selectedFilter}
						class="h-9 px-3 pr-8 rounded-xl bg-secondary/50 border border-input text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
					>
						<option value="ALL">Semua Kategori</option>
						{#each filterOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
					<Funnel class="h-3 w-3 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
				</div>
			{/if}

			<!-- Show Entries Dropdown -->
			<div class="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-xl border border-border">
				<span>Show:</span>
				<select
					bind:value={pageSize}
					class="bg-transparent font-bold text-foreground text-xs focus:outline-none cursor-pointer"
				>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={25}>25</option>
					<option value={50}>50</option>
					<option value={100}>100</option>
				</select>
			</div>

			<!-- Export Actions -->
			{#if enableExport}
				<div class="flex items-center gap-1">
					<button
						type="button"
						onclick={exportToCSV}
						class="h-9 px-3 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
						title="Export data saat ini ke Excel (.csv)"
					>
						<ArrowDownTray class="h-3.5 w-3.5 text-emerald-500" />
						<span class="hidden sm:inline">Excel</span>
					</button>

					<button
						type="button"
						onclick={triggerPrint}
						class="h-9 px-3 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
						title="Cetak atau simpan sebagai PDF"
					>
						<Printer class="h-3.5 w-3.5 text-sky-500" />
						<span class="hidden sm:inline">PDF</span>
					</button>
				</div>
			{/if}

			<!-- Custom Toolbar Slot -->
			{#if toolbar}
				{@render toolbar()}
			{/if}
		</div>
	</div>

	<!-- Data Table Container -->
	<div class="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead class="bg-secondary/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
		<div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-secondary/20 text-xs">
			<div class="text-muted-foreground">
				Menampilkan <strong class="text-foreground">{startIndex}</strong> - <strong class="text-foreground">{endIndex}</strong> dari <strong class="text-foreground">{totalItems}</strong> data
				{#if totalItems !== data.length}
					<span class="text-[11px] text-primary font-medium">(difilter dari total {data.length} data)</span>
				{/if}
			</div>

			<!-- Page Navigation Buttons -->
			<div class="flex items-center gap-1 font-mono">
				<button
					type="button"
					onclick={() => currentPage = Math.max(1, currentPage - 1)}
					disabled={currentPage <= 1}
					class="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
					aria-label="Previous Page"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>

				{#each Array.from({ length: totalPages }, (_, i) => i + 1) as pageNum}
					{#if totalPages <= 7 || pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1}
						<button
							type="button"
							onclick={() => currentPage = pageNum}
							class="h-8 min-w-[32px] px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer {currentPage === pageNum ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'}"
						>
							{pageNum}
						</button>
					{:else if Math.abs(pageNum - currentPage) === 2}
						<span class="px-1 text-muted-foreground">...</span>
					{/if}
				{/each}

				<button
					type="button"
					onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
					disabled={currentPage >= totalPages}
					class="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
					aria-label="Next Page"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>
</div>
