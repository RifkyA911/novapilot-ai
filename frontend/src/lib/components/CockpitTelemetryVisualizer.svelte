<script lang="ts">
	import { 
		Sparkles, 
		CpuChip, 
		CircleStack, 
		ShieldCheck, 
		ArrowPath, 
		CheckCircle, 
		ChatBubbleLeftRight, 
		LockClosed, 
		CommandLine,
		Bolt,
		Signal,
		Cube,
		Eye,
		ArrowsPointingOut
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";
	import { sound } from "$lib/audio";

	// Simulation states for animated pulses
	let isSimulatingIngress = $state(false);
	let isSimulatingReasoning = $state(false);
	let isSimulatingCommit = $state(false);
	let activePulseSource = $state<"whatsapp" | "telegram" | "discord" | "slack">("whatsapp");

	// Pan & Zoom controls
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		const target = e.target as HTMLElement | SVGElement;
		if (target.closest("button") || target.closest("a") || target.closest(".no-pan")) return;
		isDragging = true;
		dragStartX = e.clientX - panX;
		dragStartY = e.clientY - panY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		panX = e.clientX - dragStartX;
		panY = e.clientY - dragStartY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function zoomIn() {
		zoom = Math.min(Number((zoom + 0.15).toFixed(2)), 2.2);
	}

	function zoomOut() {
		zoom = Math.max(Number((zoom - 0.15).toFixed(2)), 0.6);
	}

	function resetPanZoom() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}

	function triggerIngressSimulation(platform: typeof activePulseSource = "whatsapp") {
		activePulseSource = platform;
		isSimulatingIngress = true;
		sound.playNavClick();
		setTimeout(() => {
			isSimulatingReasoning = true;
			sound.playInboundPing();
		}, 600);
		setTimeout(() => {
			isSimulatingCommit = true;
			sound.playActionChime();
		}, 1400);
		setTimeout(() => {
			isSimulatingIngress = false;
			isSimulatingReasoning = false;
			isSimulatingCommit = false;
		}, 2600);
	}

	function triggerReasoningPulse() {
		isSimulatingReasoning = true;
		sound.playNavClick();
		setTimeout(() => {
			isSimulatingReasoning = false;
		}, 1600);
	}

	function triggerCommitPulse() {
		isSimulatingCommit = true;
		sound.playActionChime();
		setTimeout(() => {
			isSimulatingCommit = false;
		}, 1600);
	}
</script>

<div class="rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden flex flex-col font-sans transition-colors">
	<!-- Top Bar: Title, Live Telemetry Badges & Simulation Triggers -->
	<div class="p-4 sm:p-5 border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5 flex-wrap">
				<div class="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
					<Sparkles class="h-4.5 w-4.5" />
				</div>
				<div>
					<h2 class="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
						NovaPilot AI Live Architecture Telemetry
						<span class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
							REALTIME SVG TELEMETRY
						</span>
					</h2>
					<p class="text-[11px] text-muted-foreground mt-0.5">
						Visualisasi interaktif aliran paket ChatOps: Ingress Multi-Platform &rarr; Hermes 3 Reasoning Engine &rarr; Safety Gate &rarr; Dual-Database Parameterized Vault.
					</p>
				</div>
			</div>
		</div>

		<!-- Action Controls: Simulation Bursts & Zoom Controls -->
		<div class="flex flex-wrap items-center gap-2 self-start lg:self-auto">
			<!-- Simulation Trigger Buttons -->
			<div class="inline-flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/70 text-xs">
				<button
					type="button"
					onclick={() => triggerIngressSimulation("whatsapp")}
					disabled={isSimulatingIngress}
					class="px-2.5 py-1 rounded-lg bg-background hover:bg-card text-foreground font-semibold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
					title="Simulasi Aliran Pesan Masuk dari WhatsApp Webhook"
				>
					<Bolt class="h-3 w-3 text-emerald-500 {isSimulatingIngress ? 'animate-bounce' : ''}" />
					<span>Simulasi Ingress</span>
				</button>
				<button
					type="button"
					onclick={triggerReasoningPulse}
					disabled={isSimulatingReasoning}
					class="px-2.5 py-1 rounded-lg bg-background hover:bg-card text-foreground font-semibold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
					title="Simulasi Hermes 3 AI Thinking & Tool-Call"
				>
					<CpuChip class="h-3 w-3 text-sky-500 {isSimulatingReasoning ? 'animate-spin' : ''}" />
					<span>Pulsing Core</span>
				</button>
				<button
					type="button"
					onclick={triggerCommitPulse}
					disabled={isSimulatingCommit}
					class="px-2.5 py-1 rounded-lg bg-background hover:bg-card text-foreground font-semibold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
					title="Simulasi Laser Sync ke DB 1 & DB 2"
				>
					<CircleStack class="h-3 w-3 text-purple-500" />
					<span>Sync DB</span>
				</button>
			</div>

			<!-- Pan & Zoom Control -->
			<div class="inline-flex items-center rounded-xl border border-border/70 bg-secondary/50 p-1 text-xs">
				<button 
					type="button"
					onclick={zoomOut}
					class="h-7 w-7 rounded-lg hover:bg-card text-foreground flex items-center justify-center font-bold text-sm cursor-pointer transition-colors" 
					title="Zoom Out (-)"
				>
					&minus;
				</button>
				<button 
					type="button"
					onclick={resetPanZoom}
					class="h-7 px-2 rounded-lg hover:bg-card text-foreground flex items-center justify-center font-mono text-[10px] font-semibold cursor-pointer transition-colors" 
					title="Reset Zoom (100%)"
				>
					{Math.round(zoom * 100)}%
				</button>
				<button 
					type="button"
					onclick={zoomIn}
					class="h-7 w-7 rounded-lg hover:bg-card text-foreground flex items-center justify-center font-bold text-sm cursor-pointer transition-colors" 
					title="Zoom In (+)"
				>
					+
				</button>
			</div>
		</div>
	</div>

	<!-- Interactive Animated SVG Canvas Container -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="relative w-full h-[400px] sm:h-[460px] md:h-[500px] bg-gradient-to-b from-card/30 via-background to-secondary/15 select-none overflow-hidden cursor-grab active:cursor-grabbing"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
	>
		<!-- Ambient Grid Pattern -->
		<div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none"></div>

		<!-- Status Pills Overlay on Canvas -->
		<div class="absolute top-3 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
			<div class="px-2.5 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/80 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground">
				<span class="h-2 w-2 rounded-full {cockpit.isGatewayRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
				<span>Gateway Ingress: <strong>{cockpit.isGatewayRunning ? 'ONLINE (:3002)' : 'STANDBY'}</strong></span>
			</div>
			<div class="px-2.5 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/80 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground">
				<span class="h-2 w-2 rounded-full {cockpit.isHermesConfigured ? 'bg-sky-500 animate-pulse' : 'bg-amber-500'}"></span>
				<span>Hermes 3: <strong>{cockpit.isHermesConfigured ? 'ACTIVE (CLI / LLM)' : 'AWAITING CONFIG'}</strong></span>
			</div>
			<div class="px-2.5 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/80 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground">
				<span class="h-2 w-2 rounded-full {cockpit.isDbConfigured ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
				<span>Postgres 18: <strong>{cockpit.isDbConfigured ? 'CONNECTED' : 'DISCONNECTED'}</strong></span>
			</div>
		</div>

		<!-- Draggable / Zoomable Scaled Canvas Wrapper -->
		<div 
			class="w-full h-full flex items-center justify-center transition-transform duration-75"
			style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: center center;"
		>
			<svg 
				viewBox="0 0 1280 480" 
				class="w-full h-full max-w-[1280px]"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<style>
						@keyframes wireDashForward {
							from { stroke-dashoffset: 24; }
							to { stroke-dashoffset: 0; }
						}
						@keyframes wireDashFast {
							from { stroke-dashoffset: 32; }
							to { stroke-dashoffset: 0; }
						}
						@keyframes wireDashReverse {
							from { stroke-dashoffset: 0; }
							to { stroke-dashoffset: 24; }
						}
						@keyframes corePulseRays {
							0%, 100% { transform: scale(1); opacity: 0.45; }
							50% { transform: scale(1.12); opacity: 0.95; }
						}
						@keyframes coreRotateSlow {
							from { transform: rotate(0deg); }
							to { transform: rotate(360deg); }
						}
						@keyframes coreRotateRev {
							from { transform: rotate(360deg); }
							to { transform: rotate(0deg); }
						}
						@keyframes beamSweep {
							0% { transform: translateY(-12px); opacity: 0.3; }
							50% { transform: translateY(14px); opacity: 1; }
							100% { transform: translateY(-12px); opacity: 0.3; }
						}
						@keyframes floatingParticle {
							0% { offset-distance: 0%; opacity: 0; }
							20% { opacity: 1; }
							80% { opacity: 1; }
							100% { offset-distance: 100%; opacity: 0; }
						}
						.wire-stream {
							stroke-dasharray: 6 5;
							animation: wireDashForward 1s linear infinite;
						}
						.wire-stream-fast {
							stroke-dasharray: 6 5;
							animation: wireDashFast 0.4s linear infinite;
						}
						.wire-stream-return {
							stroke-dasharray: 6 5;
							animation: wireDashReverse 1.2s linear infinite;
						}
						.rotate-gear {
							transform-origin: 520px 240px;
							animation: coreRotateSlow 20s linear infinite;
						}
						.rotate-gear-rev {
							transform-origin: 520px 240px;
							animation: coreRotateRev 14s linear infinite;
						}
						.db-beam-laser {
							animation: beamSweep 1.6s ease-in-out infinite;
						}
					</style>

					<!-- Gradients -->
					<linearGradient id="flowGradWa" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#10b981" stop-opacity="0.8" />
						<stop offset="100%" stop-color="#0284c7" stop-opacity="0.8" />
					</linearGradient>

					<linearGradient id="flowGradAi" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#0284c7" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.9" />
					</linearGradient>

					<linearGradient id="flowGradDb1" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.8" />
						<stop offset="100%" stop-color="#10b981" stop-opacity="0.9" />
					</linearGradient>

					<linearGradient id="flowGradDb2" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.8" />
						<stop offset="100%" stop-color="#06b6d4" stop-opacity="0.9" />
					</linearGradient>

					<linearGradient id="coreGlowRadial" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
						<stop offset="60%" stop-color="#818cf8" stop-opacity="0.15" />
						<stop offset="100%" stop-color="#818cf8" stop-opacity="0" />
					</linearGradient>

					<!-- Filters -->
					<filter id="neonGlowEmerald" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="3" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
					<filter id="neonGlowSky" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="3" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
					<filter id="neonGlowPurple" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="4" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
				</defs>

				<!-- ============================================================= -->
				<!-- 1. DATA WIRE PATHWAYS (BEZIER SPLINES)                        -->
				<!-- ============================================================= -->
				<g id="circuitWires">
					<!-- Ingress Wires: From 4 Platforms (x=160) to Central Ingress Multiplexer (x=300, y=240) -->
					<!-- WhatsApp (y=80) to Multiplexer -->
					<path 
						d="M 160 80 C 230 80, 240 240, 300 240" 
						fill="none" 
						stroke="#10b981" 
						stroke-width={isSimulatingIngress && activePulseSource === 'whatsapp' ? '3.5' : '2'}
						stroke-opacity="0.5" 
						class={isSimulatingIngress && activePulseSource === 'whatsapp' ? 'wire-stream-fast' : 'wire-stream'}
					/>

					<!-- Telegram (y=180) to Multiplexer -->
					<path 
						d="M 160 180 C 230 180, 240 240, 300 240" 
						fill="none" 
						stroke="#0284c7" 
						stroke-width="1.8" 
						stroke-opacity="0.4" 
						class="wire-stream"
					/>

					<!-- Discord (y=300) to Multiplexer -->
					<path 
						d="M 160 300 C 230 300, 240 240, 300 240" 
						fill="none" 
						stroke="#6366f1" 
						stroke-width="1.8" 
						stroke-opacity="0.4" 
						class="wire-stream"
					/>

					<!-- Slack (y=400) to Multiplexer -->
					<path 
						d="M 160 400 C 230 400, 240 240, 300 240" 
						fill="none" 
						stroke="#e11d48" 
						stroke-width="1.8" 
						stroke-opacity="0.4" 
						class="wire-stream"
					/>

					<!-- Ingress Multiplexer (x=360, y=240) to Hermes 3 Neural Core (x=460, y=240) -->
					<path 
						d="M 360 240 L 460 240" 
						fill="none" 
						stroke="url(#flowGradWa)" 
						stroke-width={isSimulatingIngress || isSimulatingReasoning ? '4' : '2.5'}
						class={isSimulatingIngress || isSimulatingReasoning ? 'wire-stream-fast' : 'wire-stream'}
					/>

					<!-- OCR Auxiliary Stream: From Tesseract Node (x=520, y=80) to Hermes Core (x=520, y=190) -->
					<path 
						d="M 520 120 L 520 180" 
						fill="none" 
						stroke="#38bdf8" 
						stroke-width="2" 
						stroke-dasharray="4 4"
						stroke-opacity="0.7"
						class="wire-stream"
					/>

					<!-- Hermes Neural Core (x=580, y=240) to Safety & Guardrail Gate (x=700, y=240) -->
					<path 
						d="M 580 240 L 700 240" 
						fill="none" 
						stroke="url(#flowGradAi)" 
						stroke-width={isSimulatingReasoning || isSimulatingCommit ? '4' : '2.5'}
						class={isSimulatingReasoning || isSimulatingCommit ? 'wire-stream-fast' : 'wire-stream'}
					/>

					<!-- Safety Gate (x=790, y=240) to Dual Databases: -->
					<!-- To DB 1 (PostgreSQL 18 - x=940, y=140) -->
					<path 
						d="M 790 240 C 850 240, 870 140, 940 140" 
						fill="none" 
						stroke="url(#flowGradDb1)" 
						stroke-width={isSimulatingCommit ? '3.5' : '2.2'}
						class={isSimulatingCommit ? 'wire-stream-fast' : 'wire-stream'}
					/>

					<!-- To DB 2 (ERP MCP Reference - x=940, y=340) -->
					<path 
						d="M 790 240 C 850 240, 870 340, 940 340" 
						fill="none" 
						stroke="url(#flowGradDb2)" 
						stroke-width={isSimulatingCommit ? '3.5' : '2.2'}
						class={isSimulatingCommit ? 'wire-stream-fast' : 'wire-stream'}
					/>

					<!-- Active Self-Learning Feedback Loop Return: From DB 1 (x=1120, y=110) back to Hermes/Ingress (x=480, y=420) -->
					<path 
						d="M 1120 110 C 1220 110, 1220 440, 800 440 C 560 440, 480 320, 520 280" 
						fill="none" 
						stroke="#ec4899" 
						stroke-width="1.8" 
						stroke-opacity="0.5" 
						class="wire-stream-return"
					/>
				</g>

				<!-- ============================================================= -->
				<!-- 2. STAGE 1: INGRESS PLATFORM NODES (Left Column)              -->
				<!-- ============================================================= -->
				<!-- Column Header -->
				<text x="90" y="40" fill="currentColor" class="text-[11px] font-mono font-bold opacity-60">1. CHATOPS INGRESS</text>

				<!-- WhatsApp Node (x=40, y=55) -->
				<g id="nodeWa" class="cursor-pointer" onclick={() => triggerIngressSimulation('whatsapp')}>
					<rect x="40" y="55" width="120" height="50" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="1.5" class="shadow-sm" />
					<circle cx="65" cy="80" r="14" fill="#10b98125" />
					<path d="M 60 76 Q 65 72, 70 76 Q 72 82, 65 85 L 61 86 L 63 82 Z" fill="#10b981" />
					<text x="88" y="76" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">WhatsApp</text>
					<text x="88" y="90" fill="#10b981" font-size="8.5" font-family="monospace">Baileys :3002</text>
				</g>

				<!-- Telegram Node (x=40, y=155) -->
				<g id="nodeTg" class="cursor-pointer" onclick={() => triggerIngressSimulation('telegram')}>
					<rect x="40" y="155" width="120" height="50" rx="12" fill="#0f172a" stroke="#0284c7" stroke-width="1.2" />
					<circle cx="65" cy="180" r="14" fill="#0284c725" />
					<path d="M 58 180 L 71 174 L 67 186 L 63 182 Z" fill="#0284c7" />
					<text x="88" y="176" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">Telegram</text>
					<text x="88" y="190" fill="#0284c7" font-size="8.5" font-family="monospace">BotFather API</text>
				</g>

				<!-- Discord Node (x=40, y=275) -->
				<g id="nodeDiscord" class="cursor-pointer" onclick={() => triggerIngressSimulation('discord')}>
					<rect x="40" y="275" width="120" height="50" rx="12" fill="#0f172a" stroke="#6366f1" stroke-width="1.2" />
					<circle cx="65" cy="300" r="14" fill="#6366f125" />
					<circle cx="61" cy="300" r="2.5" fill="#6366f1" />
					<circle cx="69" cy="300" r="2.5" fill="#6366f1" />
					<text x="88" y="296" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">Discord</text>
					<text x="88" y="310" fill="#6366f1" font-size="8.5" font-family="monospace">Guild Webhook</text>
				</g>

				<!-- Slack Node (x=40, y=375) -->
				<g id="nodeSlack" class="cursor-pointer" onclick={() => triggerIngressSimulation('slack')}>
					<rect x="40" y="375" width="120" height="50" rx="12" fill="#0f172a" stroke="#e11d48" stroke-width="1.2" />
					<circle cx="65" cy="400" r="14" fill="#e11d4825" />
					<rect x="62" y="394" width="6" height="12" rx="2" fill="#e11d48" />
					<text x="88" y="396" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">Slack Ent</text>
					<text x="88" y="410" fill="#e11d48" font-size="8.5" font-family="monospace">Bolt SDK Ingress</text>
				</g>

				<!-- Central Ingress Multiplexer / Router Node (x=300, y=205) -->
				<g id="nodeMux">
					<rect x="300" y="210" width="60" height="60" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
					<circle cx="330" cy="240" r="16" fill="#38bdf820" />
					<circle cx="330" cy="240" r="5" fill="#38bdf8" />
					<text x="330" y="284" text-anchor="middle" fill="currentColor" font-size="9" font-family="monospace" font-weight="bold">GATEWAY</text>
					<text x="330" y="296" text-anchor="middle" fill="#38bdf8" font-size="8" font-family="monospace">:8088 ROUTER</text>
				</g>

				<!-- ============================================================= -->
				<!-- 3. STAGE 2: OCR VISION & HERMES 3 REASONING CORE              -->
				<!-- ============================================================= -->
				<!-- Column Header -->
				<text x="520" y="40" text-anchor="middle" fill="currentColor" class="text-[11px] font-mono font-bold opacity-60">2. HERMES 3 REASONING &amp; OCR</text>

				<!-- Tesseract OCR Vision Satellite (x=460, y=70) -->
				<g id="nodeOcr" class="cursor-pointer" onclick={triggerReasoningPulse}>
					<rect x="460" y="70" width="120" height="48" rx="12" fill="#0f172a" stroke="#06b6d4" stroke-width="1.3" />
					<circle cx="482" cy="94" r="12" fill="#06b6d425" />
					<path d="M 478 94 Q 482 88, 486 94 Q 482 100, 478 94 Z" fill="#06b6d4" />
					<text x="502" y="90" fill="#f8fafc" font-size="10.5" font-family="monospace" font-weight="bold">OCR Vision</text>
					<text x="502" y="104" fill="#06b6d4" font-size="8" font-family="monospace">Tesseract.js Engine</text>
				</g>

				<!-- Hermes 3 Concentric Neural Reactor Core (Center cx=520, cy=240) -->
				<g id="coreHermes" class="cursor-pointer" onclick={triggerReasoningPulse}>
					<!-- Radial Background Halo -->
					<circle cx="520" cy="240" r="64" fill="url(#coreGlowRadial)" />

					<!-- Outer Rotating Dash Ring -->
					<circle 
						cx="520" 
						cy="240" 
						r="50" 
						fill="none" 
						stroke="#38bdf8" 
						stroke-width="1.8" 
						stroke-dasharray="8 6" 
						class="rotate-gear" 
						stroke-opacity="0.8"
					/>

					<!-- Inner Reverse Dash Ring -->
					<circle 
						cx="520" 
						cy="240" 
						r="40" 
						fill="none" 
						stroke="#818cf8" 
						stroke-width="1.5" 
						stroke-dasharray="5 5" 
						class="rotate-gear-rev" 
						stroke-opacity="0.85"
					/>

					<!-- Central Reactor Orb -->
					<circle cx="520" cy="240" r="30" fill="#0f172a" stroke="#c084fc" stroke-width="2" filter="url(#neonGlowSky)" />
					<circle cx="520" cy="240" r="14" fill="#8b5cf6" fill-opacity="0.75" />

					<!-- Glowing Core Dot -->
					<circle cx="520" cy="240" r="6" fill="#38bdf8" class={isSimulatingReasoning ? 'animate-ping' : ''} />

					<!-- Labels Under Core -->
					<text x="520" y="315" text-anchor="middle" fill="#f8fafc" font-size="12" font-family="monospace" font-weight="bold">Hermes 3 Llama-3.1</text>
					<text x="520" y="329" text-anchor="middle" fill="#38bdf8" font-size="9" font-family="monospace">Native CLI &lt;thought&gt; &amp; &lt;tool_call&gt;</text>
					<text x="520" y="342" text-anchor="middle" fill="#10b981" font-size="8" font-family="monospace">Active Mode: Windows CLI</text>
				</g>

				<!-- ============================================================= -->
				<!-- 4. STAGE 3: SAFETY GUARDRAIL & HITL APPROVAL GATE             -->
				<!-- ============================================================= -->
				<!-- Column Header -->
				<text x="745" y="40" text-anchor="middle" fill="currentColor" class="text-[11px] font-mono font-bold opacity-60">3. SAFETY &amp; HITL GATE</text>

				<!-- Safety Gate Shield Node (x=700, y=200) -->
				<g id="nodeGate">
					<rect x="700" y="200" width="90" height="80" rx="16" fill="#0f172a" stroke="#10b981" stroke-width="1.8" filter="url(#neonGlowEmerald)" />
					<circle cx="745" cy="235" r="18" fill="#10b98120" />
					<path d="M 745 224 L 755 228 V 236 C 755 242, 745 246, 745 246 C 745 246, 735 242, 735 236 V 228 Z" fill="#10b981" />
					<text x="745" y="266" text-anchor="middle" fill="#f8fafc" font-size="10.5" font-family="monospace" font-weight="bold">HITL GATE</text>
					<text x="745" y="296" text-anchor="middle" fill="#10b981" font-size="8" font-family="monospace">Zero Raw SQL Lock</text>
					<text x="745" y="308" text-anchor="middle" fill="currentColor" font-size="7.5" font-family="monospace" class="opacity-60">Human Sign-off</text>
				</g>

				<!-- ============================================================= -->
				<!-- 5. STAGE 4: DUAL-DATABASE VAULTS (Right Column)               -->
				<!-- ============================================================= -->
				<!-- Column Header -->
				<text x="1030" y="40" text-anchor="middle" fill="currentColor" class="text-[11px] font-mono font-bold opacity-60">4. ISOLATED DUAL-DB VAULTS</text>

				<!-- DB 1: Internal PostgreSQL 18 Vault (x=940, y=85) -->
				<g id="nodeDb1" class="cursor-pointer" onclick={triggerCommitPulse}>
					<rect x="940" y="85" width="180" height="110" rx="16" fill="#0f172a" stroke="#8b5cf6" stroke-width="1.6" />
					
					<!-- 3D Cylindrical Platter Top -->
					<ellipse cx="985" cy="120" rx="28" ry="10" fill="#8b5cf625" stroke="#8b5cf6" stroke-width="1.2" />
					<ellipse cx="985" cy="132" rx="28" ry="10" fill="#8b5cf620" stroke="#8b5cf6" stroke-width="1" />
					<ellipse cx="985" cy="144" rx="28" ry="10" fill="#8b5cf615" stroke="#8b5cf6" stroke-width="1" />

					<!-- Read/Write Beam Indicator -->
					<rect x="1010" y="115" width="4" height="24" rx="2" fill="#a855f7" class="db-beam-laser" />

					<text x="1025" y="118" fill="#f8fafc" font-size="11.5" font-family="monospace" font-weight="bold">DB 1: System Vault</text>
					<text x="1025" y="132" fill="#a855f7" font-size="9" font-family="monospace">PostgreSQL 18 Local</text>
					<text x="1025" y="146" fill="currentColor" font-size="8" font-family="monospace" class="opacity-60">Tickets • Audit Logs</text>
					<text x="1025" y="158" fill="#10b981" font-size="8" font-family="monospace">Learned Patterns</text>

					<!-- Live Status Indicator -->
					<circle cx="1105" cy="100" r="4" fill="#10b981" class="animate-pulse" />
				</g>

				<!-- DB 2: Enterprise ERP Reference via MCP Protocol (x=940, y=285) -->
				<g id="nodeDb2" class="cursor-pointer" onclick={triggerCommitPulse}>
					<rect x="940" y="285" width="180" height="110" rx="16" fill="#0f172a" stroke="#06b6d4" stroke-width="1.6" />
					
					<!-- Platter Stack 2 -->
					<ellipse cx="985" cy="320" rx="28" ry="10" fill="#06b6d425" stroke="#06b6d4" stroke-width="1.2" />
					<ellipse cx="985" cy="332" rx="28" ry="10" fill="#06b6d420" stroke="#06b6d4" stroke-width="1" />
					<ellipse cx="985" cy="344" rx="28" ry="10" fill="#06b6d415" stroke="#06b6d4" stroke-width="1" />

					<!-- Read/Write Beam Indicator 2 -->
					<rect x="1010" y="315" width="4" height="24" rx="2" fill="#06b6d4" class="db-beam-laser" />

					<text x="1025" y="318" fill="#f8fafc" font-size="11.5" font-family="monospace" font-weight="bold">DB 2: ERP MCP Ref</text>
					<text x="1025" y="332" fill="#06b6d4" font-size="9" font-family="monospace">Oracle / SAP / PG ERP</text>
					<text x="1025" y="346" fill="currentColor" font-size="8" font-family="monospace" class="opacity-60">Customer Master</text>
					<text x="1025" y="358" fill="#06b6d4" font-size="8" font-family="monospace">Zero Direct Mutations</text>

					<!-- Protocol Lock Badge -->
					<rect x="1025" y="366" width="80" height="15" rx="4" fill="#06b6d420" stroke="#06b6d4" stroke-width="0.8" />
					<text x="1065" y="377" text-anchor="middle" fill="#06b6d4" font-size="7.5" font-family="monospace" font-weight="bold">JSON-RPC MCP</text>
				</g>

				<!-- ============================================================= -->
				<!-- 6. ACTIVE FEEDBACK LOOP CALLOUT BADGE                         -->
				<!-- ============================================================= -->
				<g id="feedbackCallout">
					<rect x="680" y="420" width="220" height="32" rx="10" fill="#0f172a" stroke="#ec4899" stroke-width="1.2" stroke-dasharray="4 3" />
					<circle cx="700" cy="436" r="6" fill="#ec4899" />
					<text x="715" y="440" fill="#ec4899" font-size="9.5" font-family="monospace" font-weight="bold">Self-Learning Feedback Loop</text>
				</g>
			</svg>
		</div>

		<!-- Bottom Hint Info -->
		<div class="absolute bottom-2.5 right-3 text-[10px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/60 pointer-events-none">
			Gunakan drag &amp; scroll untuk pan/zoom diagram
		</div>
	</div>

	<!-- Bottom Architectural Invariant Highlights -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/15 border-t border-border/60 text-xs font-mono">
		<div class="p-2.5 rounded-xl bg-card border border-border/50 space-y-0.5">
			<span class="text-muted-foreground text-[10px]">INGRESS INTAKE</span>
			<div class="font-bold text-foreground">Baileys + Webhooks</div>
			<span class="text-emerald-500 text-[10px] flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
				4 Channels Ready
			</span>
		</div>

		<div class="p-2.5 rounded-xl bg-card border border-border/50 space-y-0.5">
			<span class="text-muted-foreground text-[10px]">AI AGENTIC CORE</span>
			<div class="font-bold text-foreground">Hermes 3 (8B Llama-3.1)</div>
			<span class="text-sky-500 text-[10px]">CLI Reasoning Active</span>
		</div>

		<div class="p-2.5 rounded-xl bg-card border border-border/50 space-y-0.5">
			<span class="text-muted-foreground text-[10px]">TRANSACTION GUARD</span>
			<div class="font-bold text-foreground">Prepared Stmt Only</div>
			<span class="text-emerald-500 text-[10px]">0 Raw SQL Allowed</span>
		</div>

		<div class="p-2.5 rounded-xl bg-card border border-border/50 space-y-0.5">
			<span class="text-muted-foreground text-[10px]">ERP PERSISTENCE</span>
			<div class="font-bold text-foreground">MCP Tool Isolation</div>
			<span class="text-purple-500 text-[10px]">Dual-DB Segregated</span>
		</div>
	</div>
</div>
