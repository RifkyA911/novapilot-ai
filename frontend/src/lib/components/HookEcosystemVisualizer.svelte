<script lang="ts">
	import { 
		CommandLine, 
		CheckCircle, 
		ShieldCheck, 
		Square3Stack3d, 
		ArrowPath, 
		PaperAirplane, 
		Sparkles,
		CpuChip,
		ComputerDesktop,
		GlobeAlt,
		DevicePhoneMobile,
		CodeBracket
	} from "svelte-heros-v2";

	// Selected Client Tab
	let activeClient = $state<"ferdium" | "rambox" | "browser" | "desktop">("ferdium");
	let isSimulating = $state(false);
	let simulationStep = $state(0); // 0: idle, 1: intercept, 2: extract, 3: post, 4: dashboard

	const clients = [
		{
			id: "ferdium" as const,
			name: "Ferdium App",
			subtitle: "Electron Recipe webview.js",
			badge: "ACTIVE HOOK",
			color: "text-purple-600 dark:text-purple-400",
			bgColor: "bg-purple-500/10 border-purple-500/30",
			dotColor: "#a855f7",
			yPos: 65,
			snippet: `// C:\\Users\\USER\\AppData\\Roaming\\Ferdium\\recipes\\whatsapp\\webview.js
Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));`
		},
		{
			id: "rambox" as const,
			name: "Rambox App",
			subtitle: "Service Advanced Custom JS",
			badge: "READY",
			color: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-500/10 border-blue-500/30",
			dotColor: "#3b82f6",
			yPos: 145,
			snippet: `// Paste into Rambox -> WhatsApp -> Advanced -> "Inject JavaScript code"
(function() {
    // NovaPilot DOM Hook for Rambox
    const NOVAPILOT_BACKEND = "http://127.0.0.1:8088";
    // ... novapilot-rambox.js
})();`
		},
		{
			id: "browser" as const,
			name: "Web Browser",
			subtitle: "Chrome / Edge / Firefox Userscript",
			badge: "ONE-CLICK",
			color: "text-emerald-600 dark:text-emerald-400",
			bgColor: "bg-emerald-500/10 border-emerald-500/30",
			dotColor: "#10b981",
			yPos: 225,
			snippet: `// ==UserScript==
// @name         NovaPilot AI — WhatsApp Web Ingestion Hook
// @match        https://web.whatsapp.com/*
// @run-at       document-idle
// ==/UserScript==`
		},
		{
			id: "desktop" as const,
			name: "PC WA Desktop",
			subtitle: "Windows WebView2 / CDP Bridge",
			badge: "STANDALONE",
			color: "text-amber-600 dark:text-amber-400",
			bgColor: "bg-amber-500/10 border-amber-500/30",
			dotColor: "#f59e0b",
			yPos: 305,
			snippet: `// Launch PC WA with remote debugging port:
Start-Process "WhatsApp.exe" -ArgumentList "--remote-debugging-port=9222"
// novapilot-desktop-bridge.js auto-attaches CDP session`
		}
	];

	function triggerLiveSimulation() {
		if (isSimulating) return;
		isSimulating = true;
		simulationStep = 1;

		setTimeout(() => {
			simulationStep = 2;
			setTimeout(() => {
				simulationStep = 3;
				setTimeout(() => {
					simulationStep = 4;
					setTimeout(() => {
						isSimulating = false;
						simulationStep = 0;
					}, 2000);
				}, 1000);
			}, 1000);
		}, 800);
	}
</script>

<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
		<div>
			<div class="flex items-center gap-2">
				<h3 class="text-base font-bold text-foreground">Universal WhatsApp Hooks Ecosystem</h3>
				<span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
					Cross-Platform Engine
				</span>
			</div>
			<p class="text-xs text-muted-foreground mt-1">
				Real-time animated visualization of how incoming WhatsApp requests from Ferdium, Rambox, Browsers, and PC WhatsApp Desktop are hooked and forwarded to NovaPilot AI.
			</p>
		</div>

		<!-- Action Trigger -->
		<button
			type="button"
			onclick={triggerLiveSimulation}
			disabled={isSimulating}
			class="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
		>
			<PaperAirplane class="w-3.5 h-3.5 {isSimulating ? 'animate-bounce' : ''}" />
			<span>{isSimulating ? 'Simulating Hook Flow...' : 'Test Hook Animation'}</span>
		</button>
	</div>

	<!-- Interactive Client Selector Pills -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
		{#each clients as client}
			<button
				type="button"
				onclick={() => activeClient = client.id}
				class="p-3 rounded-xl border text-left transition-all duration-200 {activeClient === client.id ? `${client.bgColor} ring-2 ring-primary/40 shadow-sm` : 'bg-secondary/30 border-border/60 hover:bg-secondary/60'}"
			>
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold {activeClient === client.id ? client.color : 'text-foreground'}">
						{client.name}
					</span>
					<span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-background border border-border/60">
						{client.badge}
					</span>
				</div>
				<p class="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
					{client.subtitle}
				</p>
			</button>
		{/each}
	</div>

	<!-- ANIMATED SVG PROCESS PIPELINE -->
	<div class="relative w-full rounded-2xl bg-secondary/20 dark:bg-black/30 border border-border/70 p-4 overflow-hidden">
		<!-- SVG Canvas -->
		<svg
			viewBox="0 0 920 370"
			class="w-full h-auto select-none overflow-visible"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<!-- Linear Gradients -->
				<linearGradient id="gradFerdium" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#a855f7" />
					<stop offset="100%" stop-color="#10b981" />
				</linearGradient>
				<linearGradient id="gradRambox" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#3b82f6" />
					<stop offset="100%" stop-color="#10b981" />
				</linearGradient>
				<linearGradient id="gradBrowser" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#10b981" />
					<stop offset="100%" stop-color="#10b981" />
				</linearGradient>
				<linearGradient id="gradDesktop" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#f59e0b" />
					<stop offset="100%" stop-color="#10b981" />
				</linearGradient>
				<linearGradient id="gradCore" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#10b981" />
					<stop offset="100%" stop-color="#3b82f6" />
				</linearGradient>

				<!-- Glow Filter -->
				<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>

			<!-- 1. LEFT LAYER: 4 WhatsApp Clients -->
			<!-- Ferdium Box -->
			<g class="cursor-pointer transition-opacity {activeClient === 'ferdium' ? 'opacity-100' : 'opacity-40'}" onclick={() => activeClient = 'ferdium'}>
				<rect x="20" y="35" width="160" height="60" rx="12" fill="currentColor" class="text-card stroke-purple-500/50" stroke-width="1.5" />
				<circle cx="45" cy="65" r="14" fill="#a855f7" fill-opacity="0.15" />
				<text x="45" y="70" font-family="system-ui" font-size="13" font-weight="bold" fill="#a855f7" text-anchor="middle">F</text>
				<text x="70" y="58" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">Ferdium App</text>
				<text x="70" y="74" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">webview.js</text>
			</g>

			<!-- Rambox Box -->
			<g class="cursor-pointer transition-opacity {activeClient === 'rambox' ? 'opacity-100' : 'opacity-40'}" onclick={() => activeClient = 'rambox'}>
				<rect x="20" y="115" width="160" height="60" rx="12" fill="currentColor" class="text-card stroke-blue-500/50" stroke-width="1.5" />
				<circle cx="45" cy="145" r="14" fill="#3b82f6" fill-opacity="0.15" />
				<text x="45" y="150" font-family="system-ui" font-size="13" font-weight="bold" fill="#3b82f6" text-anchor="middle">R</text>
				<text x="70" y="138" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">Rambox App</text>
				<text x="70" y="154" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">Custom JS</text>
			</g>

			<!-- Web Browser Box -->
			<g class="cursor-pointer transition-opacity {activeClient === 'browser' ? 'opacity-100' : 'opacity-40'}" onclick={() => activeClient = 'browser'}>
				<rect x="20" y="195" width="160" height="60" rx="12" fill="currentColor" class="text-card stroke-emerald-500/50" stroke-width="1.5" />
				<circle cx="45" cy="225" r="14" fill="#10b981" fill-opacity="0.15" />
				<text x="45" y="230" font-family="system-ui" font-size="13" font-weight="bold" fill="#10b981" text-anchor="middle">W</text>
				<text x="70" y="218" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">Web Browser</text>
				<text x="70" y="234" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">Tampermonkey</text>
			</g>

			<!-- PC WA Box -->
			<g class="cursor-pointer transition-opacity {activeClient === 'desktop' ? 'opacity-100' : 'opacity-40'}" onclick={() => activeClient = 'desktop'}>
				<rect x="20" y="275" width="160" height="60" rx="12" fill="currentColor" class="text-card stroke-amber-500/50" stroke-width="1.5" />
				<circle cx="45" cy="305" r="14" fill="#f59e0b" fill-opacity="0.15" />
				<text x="45" y="310" font-family="system-ui" font-size="13" font-weight="bold" fill="#f59e0b" text-anchor="middle">P</text>
				<text x="70" y="298" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">PC WhatsApp</text>
				<text x="70" y="314" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">WebView2 / CDP</text>
			</g>

			<!-- 2. ANIMATED CONNECTING PATHS TO INTERCEPTOR -->
			<!-- Path from Ferdium -->
			<path
				id="pathFerdium"
				d="M 180 65 C 240 65, 260 185, 320 185"
				fill="none"
				stroke={activeClient === 'ferdium' ? 'url(#gradFerdium)' : '#94a3b8'}
				stroke-width={activeClient === 'ferdium' ? '2.5' : '1'}
				stroke-opacity={activeClient === 'ferdium' ? '0.9' : '0.2'}
				stroke-dasharray={activeClient === 'ferdium' ? '6 3' : 'none'}
				class={activeClient === 'ferdium' ? 'animate-[dash_1s_linear_infinite]' : ''}
			/>

			<!-- Path from Rambox -->
			<path
				id="pathRambox"
				d="M 180 145 C 230 145, 270 185, 320 185"
				fill="none"
				stroke={activeClient === 'rambox' ? 'url(#gradRambox)' : '#94a3b8'}
				stroke-width={activeClient === 'rambox' ? '2.5' : '1'}
				stroke-opacity={activeClient === 'rambox' ? '0.9' : '0.2'}
				stroke-dasharray={activeClient === 'rambox' ? '6 3' : 'none'}
				class={activeClient === 'rambox' ? 'animate-[dash_1s_linear_infinite]' : ''}
			/>

			<!-- Path from Browser -->
			<path
				id="pathBrowser"
				d="M 180 225 C 230 225, 270 185, 320 185"
				fill="none"
				stroke={activeClient === 'browser' ? 'url(#gradBrowser)' : '#94a3b8'}
				stroke-width={activeClient === 'browser' ? '2.5' : '1'}
				stroke-opacity={activeClient === 'browser' ? '0.9' : '0.2'}
				stroke-dasharray={activeClient === 'browser' ? '6 3' : 'none'}
				class={activeClient === 'browser' ? 'animate-[dash_1s_linear_infinite]' : ''}
			/>

			<!-- Path from Desktop -->
			<path
				id="pathDesktop"
				d="M 180 305 C 240 305, 260 185, 320 185"
				fill="none"
				stroke={activeClient === 'desktop' ? 'url(#gradDesktop)' : '#94a3b8'}
				stroke-width={activeClient === 'desktop' ? '2.5' : '1'}
				stroke-opacity={activeClient === 'desktop' ? '0.9' : '0.2'}
				stroke-dasharray={activeClient === 'desktop' ? '6 3' : 'none'}
				class={activeClient === 'desktop' ? 'animate-[dash_1s_linear_infinite]' : ''}
			/>

			<!-- Moving Data Packet Simulation -->
			{#if isSimulating}
				<circle r="5" fill="#10b981" filter="url(#glow)">
					<animateMotion
						dur="0.8s"
						repeatCount="1"
						path={
							activeClient === 'ferdium' ? "M 180 65 C 240 65, 260 185, 320 185" :
							activeClient === 'rambox' ? "M 180 145 C 230 145, 270 185, 320 185" :
							activeClient === 'browser' ? "M 180 225 C 230 225, 270 185, 320 185" :
							"M 180 305 C 240 305, 260 185, 320 185"
						}
					/>
				</circle>
			{/if}

			<!-- 3. CENTER LAYER: DOM Observer & Extraction Engine -->
			<g transform="translate(320, 125)">
				<rect
					x="0"
					y="0"
					width="170"
					height="120"
					rx="14"
					fill="currentColor"
					class="text-card stroke-emerald-500/60 {simulationStep === 2 ? 'stroke-emerald-400 stroke-[2.5px] filter drop-shadow-md' : 'stroke-[1.5px]'}"
				/>
				<!-- Title -->
				<text x="18" y="28" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">DOM Ingestion Hook</text>
				<text x="18" y="44" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">MutationObserver Active</text>
				
				<!-- Inner Process Specs -->
				<rect x="15" y="55" width="140" height="52" rx="8" fill="currentColor" class="text-secondary/60" />
				<text x="24" y="72" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">⚡ RegEx: INV/\d{4}/\d{3}</text>
				<text x="24" y="86" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">🔍 Intent: UPDATE_NAME</text>
				<text x="24" y="99" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">✓ Badge: Ingested</text>
			</g>

			<!-- Path from Interceptor to Go API Core -->
			<path
				d="M 490 185 L 570 185"
				fill="none"
				stroke="url(#gradCore)"
				stroke-width="2.5"
				stroke-dasharray="6 3"
				class="animate-[dash_1s_linear_infinite]"
			/>

			{#if isSimulating && simulationStep >= 2}
				<circle r="5" fill="#3b82f6" filter="url(#glow)">
					<animateMotion dur="0.6s" repeatCount="1" path="M 490 185 L 570 185" />
				</circle>
			{/if}

			<!-- 4. RIGHT LAYER 1: NovaPilot Go Backend API Core (:8088) -->
			<g transform="translate(570, 115)">
				<rect
					x="0"
					y="0"
					width="160"
					height="140"
					rx="14"
					fill="currentColor"
					class="text-card stroke-primary/70 {simulationStep === 3 ? 'stroke-primary stroke-[2.5px] filter drop-shadow-md' : 'stroke-[1.5px]'}"
				/>
				<text x="18" y="28" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">NovaPilot Go Core</text>
				<text x="18" y="44" font-family="monospace" font-size="9" fill="#3b82f6" font-weight="bold">Port :8088 / Clean Arch</text>

				<rect x="15" y="55" width="130" height="72" rx="8" fill="currentColor" class="text-secondary/60" />
				<text x="24" y="72" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">🔒 Pre-Check Query</text>
				<text x="24" y="86" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">🛡️ Prepared Statement</text>
				<text x="24" y="100" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">📦 Rollback Script</text>
				<text x="24" y="114" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">📡 SSE Broadcast</text>
			</g>

			<!-- Path from Go Core to Dashboard Gatekeeper -->
			<path
				d="M 730 185 L 780 185"
				fill="none"
				stroke="#10b981"
				stroke-width="2.5"
				stroke-dasharray="6 3"
				class="animate-[dash_1s_linear_infinite]"
			/>

			{#if isSimulating && simulationStep >= 3}
				<circle r="5" fill="#10b981" filter="url(#glow)">
					<animateMotion dur="0.5s" repeatCount="1" path="M 730 185 L 780 185" />
				</circle>
			{/if}

			<!-- 5. RIGHT LAYER 2: On-Call Human Gatekeeper -->
			<g transform="translate(780, 125)">
				<rect
					x="0"
					y="0"
					width="120"
					height="120"
					rx="14"
					fill="currentColor"
					class="text-card stroke-emerald-500/70 {simulationStep === 4 ? 'stroke-emerald-400 stroke-[2.5px] filter drop-shadow-md' : 'stroke-[1.5px]'}"
				/>
				<text x="16" y="28" font-family="system-ui" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">On-Call Staff</text>
				<text x="16" y="44" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">Port :3000 WebUI</text>

				<rect x="12" y="55" width="96" height="52" rx="8" fill="currentColor" class="text-secondary/60" />
				<text x="20" y="74" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">👤 John Doe</text>
				<text x="20" y="89" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">✓ Sign-Off</text>
				<text x="20" y="100" font-family="monospace" font-size="8" fill="#10b981" font-weight="bold">Zero Raw SQL</text>
			</g>
		</svg>
	</div>

	<!-- Active Integration Details Card & Setup Guide -->
	<div class="p-4 rounded-xl bg-secondary/30 border border-border/70 space-y-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<CodeBracket class="w-4 h-4 text-primary" />
				<h4 class="text-xs font-bold text-foreground">
					Setup Hook for: <span class="text-primary">{clients.find(c => c.id === activeClient)?.name}</span>
				</h4>
			</div>
			<span class="text-[10px] font-mono text-muted-foreground">
				Target: http://127.0.0.1:8088/api/tickets
			</span>
		</div>

		<!-- Code Snippet -->
		<pre class="p-3 rounded-lg bg-background border border-border/60 text-[11px] font-mono text-foreground overflow-x-auto leading-relaxed">{clients.find(c => c.id === activeClient)?.snippet}</pre>

		<div class="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
			<div class="flex items-center gap-1.5">
				<CheckCircle class="w-3.5 h-3.5 text-emerald-500" />
				<span>Non-invasive DOM Hook: Discards private chats & captures only verified branch invoice requests.</span>
			</div>
			<a href="/flow" class="text-primary hover:underline font-medium">View Full Architecture &rarr;</a>
		</div>
	</div>
</div>

<style>
	@keyframes dash {
		to {
			stroke-dashoffset: -18;
		}
	}
</style>
