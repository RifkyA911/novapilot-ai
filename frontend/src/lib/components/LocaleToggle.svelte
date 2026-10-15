<script lang="ts">
	import { i18n } from "$lib/i18n.svelte";
	import { sound } from "$lib/audio";
	import { GlobeAlt } from "svelte-heros-v2";

	function toggle() {
		i18n.toggleLocale();
		sound.playNavClick();
	}
</script>

<button
	type="button"
	onclick={toggle}
	class="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs select-none"
	title="Ganti Bahasa / Switch Language ({i18n.current === 'id' ? 'Indonesia' : 'English'})"
	aria-label="Switch Language"
>
	<GlobeAlt class="h-3.5 w-3.5 text-muted-foreground" />
	<span class="tracking-wider">{i18n.current.toUpperCase()}</span>
</button>
