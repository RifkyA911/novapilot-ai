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
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";

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

<svelte:head>
	<title>{i18n.t.nav.hooks} • NovaPilot AI</title>
</svelte:head>

<!-- Tutorial Guide Modal -->
<TutorialModal 
	open={showTutorial} 
	onclose={() => (showTutorial = false)} 
/>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
					<CodeBracket class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
						<span>{i18n.t.nav.hooks}</span>
						<span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'}">
							{cockpit.platformStatuses[cockpit.chatPlatform].name} ({cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? (i18n.current === 'id' ? 'AKTIF LIVE' : 'LIVE') : (i18n.current === 'id' ? 'MENUNGGU HOOK' : 'AWAITING HOOK')})
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.current === 'id' 
							? `Visualisasi ekosistem hook multiplatform dan kontrak webhook untuk ${cockpit.platformStatuses[cockpit.chatPlatform].name}.`
							: `Multi-platform client hook visualizer and webhook payload contracts for ${cockpit.platformStatuses[cockpit.chatPlatform].name}.`}
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2 flex-wrap">
			{#if cockpit.chatPlatform === "whatsapp"}
				<button
					type="button"
					onclick={copyUserscript}
					class="h-9 px-3 rounded-xl border border-input bg-background hover:bg-accent text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
				>
					{#if copied}
						<Check class="h-4 w-4 text-emerald-500" />
						<span class="text-emerald-500">{i18n.t.actions.copied}</span>
					{:else}
						<ClipboardDocument class="h-4 w-4" />
						<span>{i18n.current === 'id' ? 'Salin Userscript' : 'Copy Userscript'}</span>
					{/if}
				</button>
			{/if}

			<button
				type="button"
				onclick={() => (showTutorial = true)}
				class="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
			>
				<BookOpen class="h-4 w-4" />
				<span>{i18n.current === 'id' ? 'Panduan Instalasi' : 'Installation Tutorial'}</span>
			</button>
		</div>
	</div>

	<!-- Hook Ecosystem Visualizer Component -->
	<div class="space-y-4">
		<HookEcosystemVisualizer />
	</div>
</div>
