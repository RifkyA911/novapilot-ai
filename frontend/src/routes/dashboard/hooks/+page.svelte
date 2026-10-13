<script lang="ts">
	import { 
		CodeBracket, 
		Radio, 
		BookOpen, 
		ClipboardDocument, 
		Check,
		PaperAirplane
	} from "svelte-heros-v2";
	import HookEcosystemVisualizer from "$lib/components/HookEcosystemVisualizer.svelte";
	import TutorialModal from "$lib/components/TutorialModal.svelte";

	let showTutorial = $state(false);
	let copied = $state(false);

	function copyUserscript() {
		const code = `// ==UserScript==
// @name         NovaPilot WhatsApp Ingestion Observer
// @namespace    https://novapilot.internal/
// @version      2.0.0
// @description  Zero-token-waste passive DOM observer for invoice mutations
// @match        https://web.whatsapp.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    const NOVAPILOT_ENDPOINT = "http://127.0.0.1:8088/api/tickets";
    console.log("[NovaPilot] WhatsApp Web Observer Active on port 8088");
})();`;
		navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<!-- Tutorial Guide Modal -->
<TutorialModal 
	open={showTutorial} 
	onclose={() => (showTutorial = false)} 
/>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
					<CodeBracket class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>Client Hook Ecosystem</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium border border-emerald-500/20">
							WhatsApp Active
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Interactive visualizer of WhatsApp Web hooks running across Ferdium, Rambox, Chrome, and PC Daemons.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={copyUserscript}
				class="h-9 px-3 rounded-lg border border-input bg-background hover:bg-accent text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
			>
				{#if copied}
					<Check class="h-4 w-4 text-emerald-500" />
					<span class="text-emerald-500">Copied Script!</span>
				{:else}
					<ClipboardDocument class="h-4 w-4" />
					<span>Copy Userscript</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => (showTutorial = true)}
				class="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-xs flex items-center gap-1.5 cursor-pointer"
			>
				<BookOpen class="h-4 w-4" />
				<span>Installation Tutorial</span>
			</button>
		</div>
	</div>

	<!-- Hook Ecosystem Visualizer Component -->
	<div class="space-y-4">
		<HookEcosystemVisualizer />
	</div>
</div>
