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
		CodeBracket,
		ServerStack,
		LockClosed,
		ChatBubbleLeftRight
	} from "svelte-heros-v2";

	// Selected Client Tab
	let activeClient = $state<"ferdium" | "rambox" | "browser" | "desktop">("ferdium");
	let isSimulating = $state(false);
	let simulationStep = $state(0); // 0: idle, 1: client trigger, 2: hook extract, 3: novapilot core & db, 4: human sign-off, 5: loopback confirmation

	const clients = [
		{
			id: "ferdium" as const,
			name: "Ferdium App",
			subtitle: "Electron Recipe webview.js",
			badge: "ACTIVE HOOK",
			logoUrl: "https://avatars.githubusercontent.com/u/102928503?s=200&v=4",
			color: "text-purple-600 dark:text-purple-400",
			bgColor: "bg-purple-500/10 border-purple-500/30",
			dotColor: "#a855f7",
			yPos: 55,
			snippet: `// C:\\Users\\USER\\AppData\\Roaming\\Ferdium\\recipes\\whatsapp\\webview.js
Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));`
		},
		{
			id: "rambox" as const,
			name: "Rambox App",
			subtitle: "Service Advanced Custom JS",
			badge: "READY",
			logoUrl: "https://avatars.githubusercontent.com/u/19875476?s=200&v=4",
			color: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-500/10 border-blue-500/30",
			dotColor: "#3b82f6",
			yPos: 135,
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
			logoUrl: "https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png",
			color: "text-emerald-600 dark:text-emerald-400",
			bgColor: "bg-emerald-500/10 border-emerald-500/30",
			dotColor: "#10b981",
			yPos: 215,
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
			logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
			color: "text-amber-600 dark:text-amber-400",
			bgColor: "bg-amber-500/10 border-amber-500/30",
			dotColor: "#22c55e",
			yPos: 295,
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
			simulationStep = 2; // Ingestion / DOM Hook
			setTimeout(() => {
				simulationStep = 3; // NovaPilot Go Core & DB Pre-check
				setTimeout(() => {
					simulationStep = 4; // On-Call Sign-off
					setTimeout(() => {
						simulationStep = 5; // Return Loopback to Client
						setTimeout(() => {
							isSimulating = false;
							simulationStep = 0;
						}, 1800);
					}, 1200);
				}, 1200);
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
					Connected to NovaPilot AI
				</span>
			</div>
			<p class="text-xs text-muted-foreground mt-1">
				Real-time animated visualization of how incoming WhatsApp requests from Ferdium, Rambox, Browsers, and PC WhatsApp Desktop are hooked and processed by the NovaPilot Gatekeeper.
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

	<!-- Interactive Client Selector Pills with Real Web Logos -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		{#each clients as client}
			<button
				type="button"
				onclick={() => activeClient = client.id}
				class="p-3 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 {activeClient === client.id ? `${client.bgColor} ring-2 ring-primary/40 shadow-sm` : 'bg-secondary/30 border-border/60 hover:bg-secondary/60'}"
			>
				<img
					src={client.logoUrl}
					alt={client.name}
					class="w-8 h-8 rounded-lg object-contain bg-background p-1 border border-border/60 flex-shrink-0 shadow-xs"
				/>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold truncate {activeClient === client.id ? client.color : 'text-foreground'}">
							{client.name}
						</span>
					</div>
					<p class="text-[10px] text-muted-foreground truncate font-mono">
						{client.badge}
					</p>
				</div>
			</button>
		{/each}
	</div>

	<!-- ANIMATED SVG PROCESS PIPELINE (ENHANCED CONNECTIVITY & FLOWING WIRES) -->
	<div class="relative w-full rounded-2xl bg-secondary/20 dark:bg-black/40 border border-border/70 p-4 overflow-hidden">
		<!-- SVG Canvas -->
		<svg
			viewBox="0 0 980 380"
			class="w-full h-auto select-none overflow-visible"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<!-- Custom SVG Keyframes for Flowing Lines & RGB Outer Border Glow -->
				<style>
					@keyframes flowWire {
						from { stroke-dashoffset: 0; }
						to { stroke-dashoffset: -28; }
					}
					@keyframes flowWireReturn {
						from { stroke-dashoffset: 0; }
						to { stroke-dashoffset: 28; }
					}
					@keyframes rgbGlowPulse {
						0% {
							stroke: #ef4444;
							filter: drop-shadow(0 0 7px #ef4444) drop-shadow(0 0 14px rgba(239, 68, 68, 0.5));
						}
						25% {
							stroke: #f59e0b;
							filter: drop-shadow(0 0 7px #f59e0b) drop-shadow(0 0 14px rgba(245, 158, 11, 0.5));
						}
						50% {
							stroke: #10b981;
							filter: drop-shadow(0 0 7px #10b981) drop-shadow(0 0 14px rgba(16, 185, 129, 0.5));
						}
						75% {
							stroke: #3b82f6;
							filter: drop-shadow(0 0 7px #3b82f6) drop-shadow(0 0 14px rgba(59, 130, 246, 0.5));
						}
						100% {
							stroke: #a855f7;
							filter: drop-shadow(0 0 7px #a855f7) drop-shadow(0 0 14px rgba(168, 85, 247, 0.5));
						}
					}
					.flowing-path {
						stroke-dasharray: 8 5;
						animation: flowWire 1s linear infinite;
					}
					.flowing-path-fast {
						stroke-dasharray: 8 5;
						animation: flowWire 0.65s linear infinite;
					}
					.flowing-path-return {
						stroke-dasharray: 6 4;
						animation: flowWireReturn 0.9s linear infinite;
					}
					.rgb-border-glow {
						animation: rgbGlowPulse 1.6s linear infinite;
						stroke-width: 3px !important;
					}
				</style>

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
					<stop offset="0%" stop-color="#22c55e" />
					<stop offset="100%" stop-color="#10b981" />
				</linearGradient>
				<linearGradient id="gradNovaPilot" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#10b981" />
					<stop offset="100%" stop-color="#3b82f6" />
				</linearGradient>
				<linearGradient id="gradLoopback" x1="100%" y1="0%" x2="0%" y2="0%">
					<stop offset="0%" stop-color="#10b981" />
					<stop offset="100%" stop-color="#a855f7" />
				</linearGradient>

				<!-- Particle Glow Filter -->
				<filter id="particleGlow" x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>

			<!-- 1. LEFT LAYER: 4 WhatsApp Clients (With Web Images) -->
			<!-- Ferdium Box -->
			<g
				role="button"
				tabindex="0"
				class="cursor-pointer transition-opacity {activeClient === 'ferdium' ? 'opacity-100' : 'opacity-40'}"
				onclick={() => activeClient = 'ferdium'}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeClient = 'ferdium'; } }}
			>
				<rect
					x="20" y="25" width="160" height="60" rx="12"
					fill="currentColor"
					class="text-card stroke-purple-500/50 {simulationStep === 1 && activeClient === 'ferdium' ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
				/>
				<image href="https://avatars.githubusercontent.com/u/102928503?s=200&v=4" x="32" y="37" width="34" height="34" preserveAspectRatio="xMidYMid slice" />
				<text x="76" y="48" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">Ferdium App</text>
				<text x="76" y="65" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">webview.js Hook</text>
			</g>

			<!-- Rambox Box -->
			<g
				role="button"
				tabindex="0"
				class="cursor-pointer transition-opacity {activeClient === 'rambox' ? 'opacity-100' : 'opacity-40'}"
				onclick={() => activeClient = 'rambox'}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeClient = 'rambox'; } }}
			>
				<rect
					x="20" y="105" width="160" height="60" rx="12"
					fill="currentColor"
					class="text-card stroke-blue-500/50 {simulationStep === 1 && activeClient === 'rambox' ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
				/>
				<image href="https://avatars.githubusercontent.com/u/19875476?s=200&v=4" x="32" y="117" width="34" height="34" preserveAspectRatio="xMidYMid slice" />
				<text x="76" y="128" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">Rambox App</text>
				<text x="76" y="145" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">Custom JS Code</text>
			</g>

			<!-- Web Browser Box -->
			<g
				role="button"
				tabindex="0"
				class="cursor-pointer transition-opacity {activeClient === 'browser' ? 'opacity-100' : 'opacity-40'}"
				onclick={() => activeClient = 'browser'}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeClient = 'browser'; } }}
			>
				<rect
					x="20" y="185" width="160" height="60" rx="12"
					fill="currentColor"
					class="text-card stroke-emerald-500/50 {simulationStep === 1 && activeClient === 'browser' ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
				/>
				<image href="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" x="32" y="197" width="34" height="34" preserveAspectRatio="xMidYMid slice" />
				<text x="76" y="208" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">Web Browser</text>
				<text x="76" y="225" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">Userscript Hook</text>
			</g>

			<!-- PC WA Box -->
			<g
				role="button"
				tabindex="0"
				class="cursor-pointer transition-opacity {activeClient === 'desktop' ? 'opacity-100' : 'opacity-40'}"
				onclick={() => activeClient = 'desktop'}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeClient = 'desktop'; } }}
			>
				<rect
					x="20" y="265" width="160" height="60" rx="12"
					fill="currentColor"
					class="text-card stroke-amber-500/50 {simulationStep === 1 && activeClient === 'desktop' ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
				/>
				<image href="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" x="32" y="277" width="34" height="34" preserveAspectRatio="xMidYMid slice" />
				<text x="76" y="288" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">PC WhatsApp</text>
				<text x="76" y="305" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">WebView2 / CDP</text>
			</g>

			<!-- 2. ANIMATED CONNECTOR BORDERS (FLOWING DASHES FROM CLIENTS TO DOM HOOK) -->
			<!-- Path from Ferdium -->
			<path
				d="M 180 55 C 235 55, 255 175, 305 175"
				fill="none"
				stroke={activeClient === 'ferdium' ? 'url(#gradFerdium)' : '#94a3b8'}
				stroke-width={activeClient === 'ferdium' ? '2.5' : '1'}
				stroke-opacity={activeClient === 'ferdium' ? '0.9' : '0.2'}
				class={activeClient === 'ferdium' ? 'flowing-path-fast' : 'flowing-path'}
			/>

			<!-- Path from Rambox -->
			<path
				d="M 180 135 C 230 135, 260 175, 305 175"
				fill="none"
				stroke={activeClient === 'rambox' ? 'url(#gradRambox)' : '#94a3b8'}
				stroke-width={activeClient === 'rambox' ? '2.5' : '1'}
				stroke-opacity={activeClient === 'rambox' ? '0.9' : '0.2'}
				class={activeClient === 'rambox' ? 'flowing-path-fast' : 'flowing-path'}
			/>

			<!-- Path from Browser -->
			<path
				d="M 180 215 C 230 215, 260 175, 305 175"
				fill="none"
				stroke={activeClient === 'browser' ? 'url(#gradBrowser)' : '#94a3b8'}
				stroke-width={activeClient === 'browser' ? '2.5' : '1'}
				stroke-opacity={activeClient === 'browser' ? '0.9' : '0.2'}
				class={activeClient === 'browser' ? 'flowing-path-fast' : 'flowing-path'}
			/>

			<!-- Path from Desktop -->
			<path
				d="M 180 295 C 235 295, 255 175, 305 175"
				fill="none"
				stroke={activeClient === 'desktop' ? 'url(#gradDesktop)' : '#94a3b8'}
				stroke-width={activeClient === 'desktop' ? '2.5' : '1'}
				stroke-opacity={activeClient === 'desktop' ? '0.9' : '0.2'}
				class={activeClient === 'desktop' ? 'flowing-path-fast' : 'flowing-path'}
			/>

			<!-- Animated Pulse Packet from Client to Hook -->
			{#if isSimulating && simulationStep === 1}
				<circle r="6" fill="#10b981" filter="url(#particleGlow)">
					<animateMotion
						dur="0.8s"
						repeatCount="1"
						path={
							activeClient === 'ferdium' ? "M 180 55 C 235 55, 255 175, 305 175" :
							activeClient === 'rambox' ? "M 180 135 C 230 135, 260 175, 305 175" :
							activeClient === 'browser' ? "M 180 215 C 230 215, 260 175, 305 175" :
							"M 180 295 C 235 295, 255 175, 305 175"
						}
					/>
				</circle>
			{/if}

			<!-- 3. CENTER-LEFT: DOM Ingestion Hook Box -->
			<g transform="translate(305, 115)">
				<rect
					x="0" y="0" width="165" height="120" rx="14"
					fill="currentColor"
					class="text-card stroke-emerald-500/60 {simulationStep === 2 ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
				/>
				<!-- Title -->
				<text x="16" y="26" font-family="system-ui" font-size="12" font-weight="bold" fill="currentColor" class="text-foreground">DOM Ingestion Hook</text>
				<text x="16" y="42" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">MutationObserver Active</text>
				
				<!-- Inner Process Specs -->
				<rect x="12" y="52" width="141" height="56" rx="8" fill="currentColor" class="text-secondary/60" />
				<text x="20" y="68" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">⚡ RegEx: INV/\d{4}/\d{3}</text>
				<text x="20" y="82" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">🔍 Intent: UPDATE_NAME</text>
				<text x="20" y="96" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">✓ Badge: Ingested</text>
			</g>

			<!-- Flowing Line from Hook to NovaPilot AI Core -->
			<path
				d="M 470 175 L 530 175"
				fill="none"
				stroke="url(#gradNovaPilot)"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			{#if isSimulating && simulationStep === 2}
				<circle r="6" fill="#3b82f6" filter="url(#particleGlow)">
					<animateMotion dur="0.6s" repeatCount="1" path="M 470 175 L 530 175" />
				</circle>
			{/if}

			<!-- 4. CENTER-RIGHT: NOVAPILOT AI CORE GATEKEEPER & DB (PROMINENT CENTERPIECE) -->
			<g transform="translate(530, 85)">
				<!-- Main NovaPilot Core Box -->
				<rect
					x="0" y="0" width="220" height="180" rx="16"
					fill="currentColor"
					class="text-card stroke-primary/80 {simulationStep === 3 ? 'rgb-border-glow' : 'stroke-[2px]'}"
				/>
				<!-- Brand Header -->
				<rect x="0" y="0" width="220" height="38" rx="16" fill="#10b981" fill-opacity="0.12" />
				<text x="18" y="24" font-family="system-ui" font-size="13" font-weight="bold" fill="currentColor" class="text-primary">🛡️ NovaPilot AI Core</text>
				<text x="140" y="24" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">:8088 / Go</text>

				<!-- Engine Features -->
				<g transform="translate(14, 48)">
					<rect x="0" y="0" width="192" height="60" rx="8" fill="currentColor" class="text-secondary/60" />
					<text x="12" y="18" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">1. Pre-Check: SELECT inv_no</text>
					<text x="12" y="32" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">2. Safety: Enforce OPEN status</text>
					<text x="12" y="46" font-family="monospace" font-size="9" fill="#3b82f6" font-weight="bold">3. Prepared SQL + Rollback</text>
				</g>

				<!-- Database Adapter Sub-Box -->
				<g transform="translate(14, 116)">
					<rect x="0" y="0" width="192" height="50" rx="8" fill="currentColor" class="text-secondary/80 stroke-border/70" stroke-width="1" />
					<text x="12" y="20" font-family="system-ui" font-size="10" font-weight="bold" fill="currentColor" class="text-foreground">🗄️ Database Adapter</text>
					<text x="12" y="38" font-family="monospace" font-size="8.5" fill="#10b981" font-weight="bold">PostgreSQL 18 • Oracle 11g TNS</text>
				</g>
			</g>

			<!-- Flowing Line from NovaPilot to On-Call Cockpit -->
			<path
				d="M 750 175 L 810 175"
				fill="none"
				stroke="#10b981"
				stroke-width="2.5"
				class="flowing-path-fast"
			/>

			{#if isSimulating && simulationStep === 3}
				<circle r="6" fill="#10b981" filter="url(#particleGlow)">
					<animateMotion dur="0.5s" repeatCount="1" path="M 750 175 L 810 175" />
				</circle>
			{/if}

			<!-- 5. RIGHT LAYER: On-Call Human Cockpit -->
			<g transform="translate(810, 115)">
				<rect
					x="0" y="0" width="150" height="120" rx="14"
					fill="currentColor"
					class="text-card stroke-emerald-500/70 {simulationStep === 4 ? 'rgb-border-glow' : 'stroke-[1.5px]'}"
				/>
				<text x="16" y="26" font-family="system-ui" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">On-Call Sign-Off</text>
				<text x="16" y="42" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">Port :3000 Dashboard</text>

				<rect x="12" y="52" width="126" height="56" rx="8" fill="currentColor" class="text-secondary/60" />
				<text x="20" y="70" font-family="monospace" font-size="9" fill="currentColor" class="text-foreground">👤 John Doe</text>
				<text x="20" y="84" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold">✓ 1-Click Approve</text>
				<text x="20" y="98" font-family="monospace" font-size="8.5" fill="currentColor" class="text-muted-foreground">Zero Raw SQL Guard</text>
			</g>

			<!-- 6. RETURN LOOPBACK WIRE (Automated Receipt dispatched back to WhatsApp client) -->
			<path
				d="M 885 235 C 885 360, 450 360, 100 335"
				fill="none"
				stroke="url(#gradLoopback)"
				stroke-width={simulationStep === 5 ? "3" : "1.5"}
				stroke-opacity={simulationStep === 5 ? "1" : "0.3"}
				class="flowing-path-return"
			/>
			<text x="500" y="352" font-family="monospace" font-size="9" fill="#10b981" font-weight="bold" text-anchor="middle">
				↺ ChatOps Confirmation Receipt Delivered Back to WhatsApp Chat
			</text>

			{#if isSimulating && simulationStep === 5}
				<circle r="6" fill="#a855f7" filter="url(#particleGlow)">
					<animateMotion dur="1.2s" repeatCount="1" path="M 885 235 C 885 360, 450 360, 100 335" />
				</circle>
			{/if}
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
