<script lang="ts">
	import { ChevronDown, Check } from "svelte-heros-v2";

	export interface SelectOption {
		value: string;
		label: string;
		description?: string;
	}

	let {
		value = $bindable(""),
		options = [],
		id = "custom-select",
		placeholder = "Pilih opsi...",
		disabled = false,
		class: customClass = "",
		onchange
	} = $props<{
		value: string;
		options: SelectOption[] | string[];
		id?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		onchange?: (val: string) => void;
	}>();

	let isOpen = $state(false);
	let containerEl = $state<HTMLDivElement | null>(null);

	// Normalize options
	let normalizedOptions = $derived<SelectOption[]>(
		options.map(opt => typeof opt === "string" ? { value: opt, label: opt } : opt)
	);

	let currentSelected = $derived<SelectOption | undefined>(
		normalizedOptions.find(o => o.value === value)
	);

	function toggle() {
		if (disabled) return;
		isOpen = !isOpen;
	}

	function select(opt: SelectOption) {
		value = opt.value;
		isOpen = false;
		if (onchange) {
			onchange(opt.value);
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (isOpen && containerEl && !containerEl.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="relative w-full {customClass}" bind:this={containerEl}>
	<button
		type="button"
		{id}
		{disabled}
		onclick={toggle}
		class="w-full h-9 px-3 pr-9 rounded-lg border border-input bg-background hover:bg-muted/30 transition-all flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed select-none group font-mono text-xs"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="truncate {currentSelected ? 'text-foreground font-semibold' : 'text-muted-foreground'}">
			{currentSelected ? currentSelected.label : placeholder}
		</span>

		<!-- Chevron icon with proper spacing from the edge -->
		<div class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-transform duration-200 {isOpen ? 'rotate-180 text-primary' : ''}">
			<ChevronDown class="h-3.5 w-3.5" />
		</div>
	</button>

	{#if isOpen}
		<div 
			class="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border/80 bg-card/95 backdrop-blur-xl shadow-lg p-1 space-y-0.5 max-h-56 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100 font-mono text-xs"
			role="listbox"
		>
			{#each normalizedOptions as opt}
				{@const isSelected = opt.value === value}
				<button
					type="button"
					onclick={() => select(opt)}
					class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer {isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/70'}"
					role="option"
					aria-selected={isSelected}
				>
					<span class="truncate">{opt.label}</span>
					{#if isSelected}
						<Check class="h-3.5 w-3.5 text-primary shrink-0 ml-1.5" />
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
