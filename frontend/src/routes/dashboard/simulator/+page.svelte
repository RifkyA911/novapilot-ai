<script lang="ts">
	import SimulatorSection from "$lib/components/SimulatorSection.svelte";
	import { ExclamationTriangle } from "svelte-heros-v2";
	import { i18n } from "$lib/i18n.svelte";
</script>

<svelte:head>
	<title>{i18n.t.simulator.title} [EXPERIMENTAL] • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	<!-- Experimental Warning Banner -->
	<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
		<ExclamationTriangle class="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
		<div class="space-y-1">
			<div class="font-bold flex items-center gap-2">
				<span>{i18n.t.simulator.banner_title}</span>
				<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 font-bold">ALPHA SANDBOX</span>
			</div>
			<p class="text-[11px] leading-relaxed opacity-90">
				{i18n.t.simulator.banner_desc}
			</p>
		</div>
	</div>

	<SimulatorSection />
</div>
