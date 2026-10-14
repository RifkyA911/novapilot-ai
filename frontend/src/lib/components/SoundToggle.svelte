<script lang="ts">
	import { SpeakerWave, SpeakerXMark } from "svelte-heros-v2";
	import { sound } from "$lib/audio";

	let isSoundEnabled = $state(sound.enabled);

	function toggle() {
		sound.enabled = !sound.enabled;
		isSoundEnabled = sound.enabled;
		if (isSoundEnabled) {
			sound.playInboundPing();
		}
	}
</script>

<button
	type="button"
	onclick={toggle}
	class="h-9 w-9 rounded-lg border border-border/80 bg-background hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs relative"
	title={isSoundEnabled ? "AI Corporate Sound Aktif (Klik untuk Mute)" : "Sound Hening / Muted (Klik untuk Aktifkan)"}
	aria-label="Toggle AI Corporate Sound"
>
	{#if isSoundEnabled}
		<SpeakerWave class="h-4 w-4 text-primary" />
		<span class="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
	{:else}
		<SpeakerXMark class="h-4 w-4 opacity-50" />
	{/if}
</button>
