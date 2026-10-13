<script lang="ts">
	import { 
		BookOpen, 
		XMark, 
		Check, 
		ClipboardDocument, 
		PaperAirplane,
		Radio
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";

	let { 
		open = false, 
		onclose 
	}: { 
		open: boolean; 
		onclose: () => void;
	} = $props();

	let activeTutorialTab = $state<"ferdium" | "rambox" | "web" | "pc">("ferdium");
	let copiedCode = $state(false);
	let testHookSuccess = $state(false);

	function copySnippet(text: string) {
		navigator.clipboard.writeText(text);
		copiedCode = true;
		setTimeout(() => (copiedCode = false), 2000);
	}

	async function triggerTestPing() {
		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: "Test Hook Ping from Integration Guide: Please update invoice INV/2026/001 customer name to PT Test Ping Sukses.",
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: "INV/2026/001",
					field_target: "customer_name",
					proposed_value: "PT Test Ping Sukses",
					branch_id: 1,
					confidence_score: 0.99
				})
			});
			if (res.ok) {
				testHookSuccess = true;
				await cockpit.fetchTickets();
				setTimeout(() => (testHookSuccess = false), 3500);
			}
		} catch (err) {
			console.error("Test hook ping error:", err);
		}
	}
</script>

{#if open}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200"
		role="presentation"
		onclick={onclose}
	>
		<div 
			class="w-full max-w-3xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
			role="dialog"
			aria-modal="true"
			aria-label="Platform Integration Tutorial"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="p-5 border-b border-border flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
						<BookOpen class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-base font-semibold text-foreground">Client Hook Integration Guide</h3>
						<p class="text-xs text-muted-foreground">Setup instructions and copyable snippets for Ferdium, Rambox, Web WA, and PC WA.</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onclose}
					class="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
				>
					<XMark class="h-5 w-5" />
				</button>
			</div>

			<!-- Platform Tabs Inside Modal -->
			<div class="border-b border-border bg-muted/40 px-5 pt-2 flex items-center gap-2 overflow-x-auto text-xs">
				<button
					type="button"
					onclick={() => (activeTutorialTab = "ferdium")}
					class="px-3.5 py-2 font-medium border-b-2 transition-colors cursor-pointer {activeTutorialTab === 'ferdium' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					Ferdium Desktop
				</button>

				<button
					type="button"
					onclick={() => (activeTutorialTab = "rambox")}
					class="px-3.5 py-2 font-medium border-b-2 transition-colors cursor-pointer {activeTutorialTab === 'rambox' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					Rambox App
				</button>

				<button
					type="button"
					onclick={() => (activeTutorialTab = "web")}
					class="px-3.5 py-2 font-medium border-b-2 transition-colors cursor-pointer {activeTutorialTab === 'web' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					WhatsApp Web (Chrome / Edge)
				</button>

				<button
					type="button"
					onclick={() => (activeTutorialTab = "pc")}
					class="px-3.5 py-2 font-medium border-b-2 transition-colors cursor-pointer {activeTutorialTab === 'pc' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					PC WhatsApp (Baileys Gateway)
				</button>
			</div>

			<!-- Modal Body (Scrollable) -->
			<div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
				{#if activeTutorialTab === "ferdium"}
					<div class="space-y-3.5">
						<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
							<span>1. Connect via Native Ferdium Electron Recipe</span>
							<span class="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">Zero QR Scan</span>
						</h4>

						<p class="text-xs text-muted-foreground leading-relaxed">
							Ferdium allows injecting scripts directly into its WhatsApp service webview. NovaPilot provides a dedicated observer hook that captures invoice mutation chats without requiring any third-party browser extensions.
						</p>

						<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
							<div class="font-semibold text-foreground">Step-by-Step Installation:</div>
							<ol class="list-decimal pl-4 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
								<li>Locate your Ferdium recipe folder: <code class="bg-background px-1 py-0.5 rounded border border-input text-foreground font-mono">%APPDATA%\Ferdium\recipes\whatsapp\</code></li>
								<li>Copy <code class="bg-background px-1 py-0.5 rounded border border-input text-foreground font-mono">novapilot-hook.js</code> into that folder.</li>
								<li>Open <code class="bg-background px-1 py-0.5 rounded border border-input text-foreground font-mono">webview.js</code> in the same folder, and append the injection snippet below.</li>
								<li>In Ferdium, press <kbd class="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[11px]">Ctrl + R</kbd> on your WhatsApp tab.</li>
							</ol>
						</div>

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-xs font-mono font-medium text-muted-foreground">Append to webview.js:</span>
								<button
									type="button"
									onclick={() => copySnippet(`// NovaPilot Hook Injection\nFerdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));`)}
									class="h-7 px-2.5 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 cursor-pointer"
								>
									{#if copiedCode}
										<Check class="h-3.5 w-3.5 text-emerald-500" />
										<span class="text-emerald-500">Copied!</span>
									{:else}
										<ClipboardDocument class="h-3.5 w-3.5" />
										<span>Copy Snippet</span>
									{/if}
								</button>
							</div>

							<pre class="p-3.5 rounded-lg bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-neutral-800">
<code><span class="text-neutral-500">// Append at the bottom of %APPDATA%\Ferdium\recipes\whatsapp\webview.js</span>
Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));</code></pre>
						</div>
					</div>

				{:else if activeTutorialTab === "rambox"}
					<div class="space-y-3.5">
						<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
							<span>2. Connect via Rambox Custom JavaScript Injection</span>
							<span class="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">Service Advanced</span>
						</h4>

						<p class="text-xs text-muted-foreground leading-relaxed">
							Rambox supports running arbitrary JavaScript inside any app tab. By injecting our observer, chats containing invoice mutations are passively forwarded to NovaPilot at <code>http://127.0.0.1:8088/api/tickets</code>.
						</p>

						<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
							<div class="font-semibold text-foreground">Step-by-Step Installation:</div>
							<ol class="list-decimal pl-4 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
								<li>Open Rambox and right-click your <strong>WhatsApp service</strong> icon.</li>
								<li>Select <strong>Settings</strong> $\rightarrow$ Expand <strong>Advanced</strong>.</li>
								<li>Find the <strong>"Inject JavaScript code"</strong> input box.</li>
								<li>Paste the script snippet below and click <strong>Save</strong>.</li>
							</ol>
						</div>

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-xs font-mono font-medium text-muted-foreground">Rambox Custom JS Code:</span>
								<button
									type="button"
									onclick={() => copySnippet(`(function() {\n  const BACKEND = "http://127.0.0.1:8088/api/tickets";\n  console.log("[NovaPilot] Rambox Hook Active");\n})();`)}
									class="h-7 px-2.5 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 cursor-pointer"
								>
									{#if copiedCode}
										<Check class="h-3.5 w-3.5 text-emerald-500" />
										<span class="text-emerald-500">Copied!</span>
									{:else}
										<ClipboardDocument class="h-3.5 w-3.5" />
										<span>Copy Snippet</span>
									{/if}
								</button>
							</div>

							<pre class="p-3.5 rounded-lg bg-neutral-950 text-blue-400 font-mono text-xs overflow-x-auto border border-neutral-800">
<code><span class="text-neutral-500">// Paste into Rambox -> WhatsApp -> Advanced -> Inject JavaScript code</span>
(function() &#123;
  const BACKEND = "http://127.0.0.1:8088/api/tickets";
  console.log("[NovaPilot] Rambox Hook Active on port 8088");
&#125;)();</code></pre>
						</div>
					</div>

				{:else if activeTutorialTab === "web"}
					<div class="space-y-3.5">
						<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
							<span>3. Connect via Browser Userscript (Chrome, Edge, Firefox)</span>
							<span class="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">Tampermonkey</span>
						</h4>

						<p class="text-xs text-muted-foreground leading-relaxed">
							If you use WhatsApp Web in Google Chrome, Microsoft Edge, or Mozilla Firefox, you can install the lightweight Tampermonkey userscript to hook incoming messages automatically.
						</p>

						<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
							<div class="font-semibold text-foreground">Step-by-Step Installation:</div>
							<ol class="list-decimal pl-4 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
								<li>Install the <strong>Tampermonkey</strong> extension from Chrome Web Store.</li>
								<li>Click the Tampermonkey icon $\rightarrow$ <strong>Create a new script</strong>.</li>
								<li>Paste the Userscript code below and press <kbd class="px-1 py-0.5 rounded bg-muted border border-border font-mono text-[11px]">Ctrl + S</kbd>.</li>
								<li>Reload <code>web.whatsapp.com</code>.</li>
							</ol>
						</div>

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-xs font-mono font-medium text-muted-foreground">Tampermonkey Code:</span>
								<button
									type="button"
									onclick={() => copySnippet(`// ==UserScript==\n// @name         NovaPilot WhatsApp Web Hook\n// @match        https://web.whatsapp.com/*\n// @grant        GM_xmlhttpRequest\n// ==/UserScript==\n\nconst NOVAPILOT_BACKEND = "http://127.0.0.1:8088/api/tickets";\nconsole.log("[NovaPilot Web Hook Active]");`)}
									class="h-7 px-2.5 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium flex items-center gap-1 cursor-pointer"
								>
									{#if copiedCode}
										<Check class="h-3.5 w-3.5 text-emerald-500" />
										<span class="text-emerald-500">Copied!</span>
									{:else}
										<ClipboardDocument class="h-3.5 w-3.5" />
										<span>Copy Snippet</span>
									{/if}
								</button>
							</div>

							<pre class="p-3.5 rounded-lg bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-neutral-800">
<code><span class="text-neutral-500">// ==UserScript==</span>
<span class="text-neutral-500">// @name         NovaPilot WhatsApp Web Hook</span>
<span class="text-neutral-500">// @match        https://web.whatsapp.com/*</span>
<span class="text-neutral-500">// @grant        GM_xmlhttpRequest</span>
<span class="text-neutral-500">// ==/UserScript==</span>

<span class="text-blue-400">const</span> NOVAPILOT_BACKEND = <span class="text-amber-300">"http://127.0.0.1:8088/api/tickets"</span>;
console.log(<span class="text-amber-300">"[NovaPilot Web Hook Active]"</span>);</code></pre>
						</div>
					</div>

				{:else if activeTutorialTab === "pc"}
					<div class="space-y-3.5">
						<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
							<span>4. Standalone PC WhatsApp Gateway (Baileys Socket)</span>
							<span class="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">Headless Daemon</span>
						</h4>

						<p class="text-xs text-muted-foreground leading-relaxed">
							Run a dedicated Node.js service using <code>@whiskeysockets/baileys</code> or <code>whatsapp-web.js</code> locally as a Windows Service or background process. It connects directly to the WhatsApp Multi-Device protocol.
						</p>

						<div class="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
							<div class="font-semibold text-foreground">Daemon Command:</div>
							<pre class="p-2.5 rounded bg-background border border-border font-mono text-[11px] text-foreground"><code>npm install @whiskeysockets/baileys\nnode ./scripts/baileys-daemon.js --port 8088</code></pre>
						</div>
					</div>
				{/if}
			</div>

			<!-- Modal Footer with Test Hook Ping -->
			<div class="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={triggerTestPing}
						class="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
					>
						<PaperAirplane class="h-3.5 w-3.5" />
						<span>Send Test Hook Ping</span>
					</button>
					{#if testHookSuccess}
						<span class="text-xs text-emerald-500 font-medium flex items-center gap-1">
							<Check class="h-4 w-4" /> Ping Received in Approval Queue!
						</span>
					{/if}
				</div>

				<button
					type="button"
					onclick={onclose}
					class="h-8 px-4 rounded-md border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer"
				>
					Close Guide
				</button>
			</div>
		</div>
	</div>
{/if}
