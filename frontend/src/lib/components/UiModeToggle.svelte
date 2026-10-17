<script lang="ts">
	import { cockpit } from "$lib/cockpit.svelte";
	import { sound } from "$lib/audio";
	import { i18n } from "$lib/i18n.svelte";
	import { Sparkles, Bolt } from "svelte-heros-v2";

	function handleToggle() {
		sound.playNavClick();
		cockpit.toggleUiMode();
	}
</script>

<button
	type="button"
	onclick={handleToggle}
	class="h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs select-none active:scale-95 {
		cockpit.uiMode === 'compact_lite' 
			? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-xs ring-1 ring-amber-500/20' 
			: 'border-border/70 bg-card/60 hover:bg-muted text-foreground/80 hover:text-foreground'
	}"
	title={cockpit.uiMode === 'pro' 
		? (i18n.locale === 'id' ? 'Mode Pro Aktif (Klik untuk beralih ke Compact Lite Mode)' : 'Pro Mode Active (Click to switch to Compact Lite Mode)') 
		: (i18n.locale === 'id' ? 'Compact Lite Mode Aktif (Klik untuk kembali ke Pro Mode)' : 'Compact Lite Mode Active (Click to switch to Pro Mode)')}
>
	{#if cockpit.uiMode === 'compact_lite'}
		<Bolt class="h-3.5 w-3.5 text-amber-500 animate-pulse" />
		<span class="font-bold tracking-tight">Compact Lite</span>
		<span class="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 font-bold hidden sm:inline">LITE</span>
	{:else}
		<Sparkles class="h-3.5 w-3.5 text-purple-500" />
		<span class="font-semibold tracking-tight">Pro Mode</span>
		<span class="text-[9px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground hidden sm:inline">PRO</span>
	{/if}
</button>
