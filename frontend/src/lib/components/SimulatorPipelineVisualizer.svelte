<script lang="ts">
	import { 
		PaperAirplane, 
		Radio, 
		CpuChip, 
		ServerStack, 
		ShieldCheck, 
		CheckCircle, 
		Signal, 
		CommandLine, 
		LockClosed, 
		Sparkles, 
		ArrowPath, 
		Bolt 
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";
	import { sound } from "$lib/audio";

	let {
		simStep = 0,
		simLoading = false,
		simDocNo = "INV/2026/001",
		simProposed = "PT Sumber Makmur Abadi",
		onExecute = () => {}
	} = $props<{
		simStep?: number;
		simLoading?: boolean;
		simDocNo?: string;
		simProposed?: string;
		onExecute?: () => void;
	}>();

	// Pan & Zoom state
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);

	// Local visual simulation state for standalone preview
	let localSimStep = $state(0);
	let isBurstSimulating = $state(false);

	// Effective step: either parent's simStep or local visual preview
	let activeStep = $derived(simStep > 0 ? simStep : localSimStep);

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
		sound.playNavClick();
		zoom = Math.min(Number((zoom + 0.15).toFixed(2)), 2.2);
	}

	function zoomOut() {
		sound.playNavClick();
		zoom = Math.max(Number((zoom - 0.15).toFixed(2)), 0.6);
	}

	function resetPanZoom() {
		sound.playNavClick();
		zoom = 1;
		panX = 0;
		panY = 0;
	}

	function triggerBurstFlow() {
		if (isBurstSimulating || simLoading) return;
		isBurstSimulating = true;
		sound.playNavClick();

		localSimStep = 1;
		sound.playInboundPing();

		setTimeout(() => {
			localSimStep = 2;
			sound.playNavClick();
		}, 800);

		setTimeout(() => {
			localSimStep = 3;
			sound.playNavClick();
		}, 1600);

		setTimeout(() => {
			localSimStep = 4;
			sound.playActionChime();
		}, 2400);

		setTimeout(() => {
			localSimStep = 0;
			isBurstSimulating = false;
		}, 4200);
	}
</script>

<div class="rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden flex flex-col font-sans transition-colors">
	<!-- Visualizer Header Toolbar -->
	<div class="p-4 sm:p-5 border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5 flex-wrap">
				<div class="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
					<Bolt class="h-4.5 w-4.5" />
				</div>
				<div>
					<h2 class="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 flex-wrap">
						ChatOps Ingestion &amp; Deterministic Pipeline Topology
						<span class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></span>
							4-STAGE SYNAPTIC BUS
						</span>
					</h2>
					<p class="text-[11px] text-muted-foreground mt-0.5">
						Topologi visual alur pesan dari Ingress Gateway &rarr; Ekstraksi Intent Hermes 3 &rarr; Validasi Database &rarr; Pementasan Tiket HITL.
					</p>
				</div>
			</div>
		</div>

		<!-- Action Controls -->
		<div class="flex flex-wrap items-center gap-2 self-start lg:self-auto">
			<div class="inline-flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/70 text-xs">
				<button
					type="button"
					onclick={triggerBurstFlow}
					disabled={isBurstSimulating || simLoading}
					class="px-2.5 py-1 rounded-lg bg-background hover:bg-card text-foreground font-semibold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
					title="Simulasikan Denyut Aliran Paket Antar Node"
				>
					<Sparkles class="h-3 w-3 text-amber-500 {isBurstSimulating ? 'animate-spin' : ''}" />
					<span>Simulasi Paket Flow</span>
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
		class="relative w-full h-[400px] sm:h-[430px] md:h-[460px] bg-gradient-to-b from-card/30 via-background to-secondary/15 select-none overflow-hidden cursor-grab active:cursor-grabbing"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
	>
		<!-- Background Grid Pattern -->
		<div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none"></div>

		<!-- Status Pills Overlay -->
		<div class="absolute top-3 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
			<div class="px-2.5 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/80 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground">
				<span class="h-2 w-2 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
				<span>Ingress: <strong>{cockpit.platformStatuses[cockpit.chatPlatform].name}</strong></span>
			</div>
			<div class="px-2.5 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/80 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground">
				<span class="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
				<span>LLM: <strong>Hermes-3-Llama-3.1-8B</strong></span>
			</div>
			<div class="px-2.5 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/80 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground">
				<span class="h-2 w-2 rounded-full bg-amber-500"></span>
				<span>Guard: <strong>Zero Raw SQL (Strict)</strong></span>
			</div>
			{#if activeStep > 0}
				<div class="px-2.5 py-1 rounded-lg bg-primary/20 backdrop-blur-md border border-primary/40 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground animate-pulse font-bold">
					<span>Stage 0{activeStep} Aktif</span>
				</div>
			{/if}
		</div>

		<!-- Draggable / Zoomable Scaled Canvas Wrapper -->
		<div 
			class="w-full h-full flex items-center justify-center transition-transform duration-75"
			style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: center center;"
		>
			<svg 
				viewBox="0 0 1200 460" 
				class="w-full h-full max-w-[1200px]"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<style>
						@keyframes wireDashSim {
							to { stroke-dashoffset: -40; }
						}
						@keyframes packetGlowSim {
							0%, 100% { opacity: 0.3; transform: scale(0.95); }
							50% { opacity: 0.9; transform: scale(1.05); }
						}
						@keyframes ringExpandSim {
							0% { r: 24; opacity: 0.8; }
							100% { r: 56; opacity: 0; }
						}
						@keyframes neuralPulseSim {
							0%, 100% { opacity: 0.4; }
							50% { opacity: 1; }
						}
						.anim-wire-sim {
							animation: wireDashSim 1.5s linear infinite;
						}
						.anim-wire-active {
							animation: wireDashSim 0.7s linear infinite;
						}
					</style>

					<!-- Linear Gradients for Nodes & Paths -->
					<linearGradient id="gradIngress" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
						<stop offset="100%" stop-color="#065f46" stop-opacity="0.05" />
					</linearGradient>

					<linearGradient id="gradHermes" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.30" />
						<stop offset="100%" stop-color="#4c1d95" stop-opacity="0.05" />
					</linearGradient>

					<linearGradient id="gradPostgres" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
						<stop offset="100%" stop-color="#78350f" stop-opacity="0.05" />
					</linearGradient>

					<linearGradient id="gradHitl" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25" />
						<stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.05" />
					</linearGradient>

					<!-- Glow Filters -->
					<filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="6" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
					<filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="6" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
					<filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="6" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
					<filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="6" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>

					<!-- Arrow Markers -->
					<marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
					</marker>
					<marker id="arrowPurple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M 0 1 L 10 5 L 0 9 z" fill="#8b5cf6" />
					</marker>
					<marker id="arrowAmber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
					</marker>
				</defs>

				<!-- ================= BUS 1 -> 2 : Ingress to Hermes LLM ================= -->
				<g>
					<!-- Base line -->
					<path 
						d="M 240 220 L 360 220" 
						stroke="currentColor" 
						class="text-border" 
						stroke-width="3" 
						fill="none" 
					/>
					<!-- Animated line -->
					<path 
						d="M 240 220 L 360 220" 
						stroke={activeStep >= 1 ? "#10b981" : "#80808060"} 
						stroke-width={activeStep === 1 ? "4" : "2.5"} 
						stroke-dasharray="6,8" 
						class={activeStep >= 1 ? "anim-wire-active" : "anim-wire-sim"} 
						fill="none" 
						marker-end="url(#arrowGreen)"
					/>
					<!-- Packet traveling from Node 1 to Node 2 -->
					{#if activeStep === 1 || activeStep === 2}
						<circle r="5" fill="#10b981" filter="url(#glowGreen)">
							<animateMotion path="M 240 220 L 360 220" dur="1.2s" repeatCount="indefinite" />
						</circle>
					{/if}
					<!-- Packet payload tag -->
					<rect x="268" y="196" width="64" height="18" rx="4" fill="#0f172a" stroke="#10b981" stroke-width="1" opacity="0.85" />
					<text x="300" y="209" fill="#10b981" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">RAW CHAT</text>
				</g>

				<!-- ================= BUS 2 -> 3 : Hermes LLM to PostgreSQL ================= -->
				<g>
					<!-- Base line -->
					<path 
						d="M 540 220 L 660 220" 
						stroke="currentColor" 
						class="text-border" 
						stroke-width="3" 
						fill="none" 
					/>
					<!-- Animated line -->
					<path 
						d="M 540 220 L 660 220" 
						stroke={activeStep >= 2 ? "#8b5cf6" : "#80808060"} 
						stroke-width={activeStep === 2 ? "4" : "2.5"} 
						stroke-dasharray="6,8" 
						class={activeStep >= 2 ? "anim-wire-active" : "anim-wire-sim"} 
						fill="none" 
						marker-end="url(#arrowPurple)"
					/>
					<!-- Packet traveling from Node 2 to Node 3 -->
					{#if activeStep === 2 || activeStep === 3}
						<circle r="5" fill="#a855f7" filter="url(#glowPurple)">
							<animateMotion path="M 540 220 L 660 220" dur="1.2s" repeatCount="indefinite" />
						</circle>
					{/if}
					<!-- Packet payload tag -->
					<rect x="568" y="196" width="64" height="18" rx="4" fill="#0f172a" stroke="#8b5cf6" stroke-width="1" opacity="0.85" />
					<text x="600" y="209" fill="#c084fc" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">TOOL ARGS</text>
				</g>

				<!-- ================= BUS 3 -> 4 : PostgreSQL to HITL Staging ================= -->
				<g>
					<!-- Base line -->
					<path 
						d="M 840 220 L 960 220" 
						stroke="currentColor" 
						class="text-border" 
						stroke-width="3" 
						fill="none" 
					/>
					<!-- Animated line -->
					<path 
						d="M 840 220 L 960 220" 
						stroke={activeStep >= 3 ? "#f59e0b" : "#80808060"} 
						stroke-width={activeStep === 3 ? "4" : "2.5"} 
						stroke-dasharray="6,8" 
						class={activeStep >= 3 ? "anim-wire-active" : "anim-wire-sim"} 
						fill="none" 
						marker-end="url(#arrowAmber)"
					/>
					<!-- Packet traveling from Node 3 to Node 4 -->
					{#if activeStep === 3 || activeStep === 4}
						<circle r="5" fill="#f59e0b" filter="url(#glowAmber)">
							<animateMotion path="M 840 220 L 960 220" dur="1.2s" repeatCount="indefinite" />
						</circle>
					{/if}
					<!-- Packet payload tag -->
					<rect x="866" y="196" width="68" height="18" rx="4" fill="#0f172a" stroke="#f59e0b" stroke-width="1" opacity="0.85" />
					<text x="900" y="209" fill="#fbbf24" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">VALIDATED</text>
				</g>

				<!-- ================= STAGE 1 : Inbound Ingress Gateway (Center: X=150, Y=220) ================= -->
				<g transform="translate(150, 220)">
					<!-- Pulse Wave Rings when active -->
					{#if activeStep === 1}
						<circle r="60" fill="none" stroke="#10b981" stroke-width="1.5" style="animation: ringExpandSim 1.4s ease-out infinite;" />
						<circle r="72" fill="none" stroke="#10b981" stroke-width="1" opacity="0.4" style="animation: ringExpandSim 1.4s ease-out infinite 0.4s;" />
					{/if}

					<!-- Outer Hexagonal/Rounded Card -->
					<rect 
						x="-90" y="-130" width="180" height="260" rx="20" 
						fill="url(#gradIngress)" 
						stroke={activeStep === 1 ? "#10b981" : "currentColor"} 
						class={activeStep === 1 ? "" : "text-border/80"} 
						stroke-width={activeStep === 1 ? "2.5" : "1.5"} 
						filter={activeStep === 1 ? "url(#glowGreen)" : "none"}
					/>

					<!-- Stage Header Pill -->
					<rect x="-70" y="-115" width="140" height="22" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.3" stroke-width="1" />
					<text x="0" y="-100" fill="#10b981" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">STAGE 01 : INGRESS</text>

					<!-- Gateway Antenna & Pulse Disc -->
					<g transform="translate(0, -35)">
						<circle r="32" fill="#10b981" fill-opacity="0.1" stroke="#10b981" stroke-width="1.5" />
						<circle r="22" fill="#0f172a" stroke="#10b981" stroke-width="2" />
						
						<!-- Radio Antenna Waves -->
						<path d="M -12 -12 A 18 18 0 0 1 12 -12" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
						<path d="M -6 -6 A 9 9 0 0 1 6 -6" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" />
						<circle cx="0" cy="0" r="3.5" fill="#34d399" />
						<path d="M 0 4 L 0 14" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
					</g>

					<!-- Platform Title & Socket Status -->
					<text x="0" y="24" fill="currentColor" class="text-foreground" font-size="12" font-weight="bold" text-anchor="middle">
						{cockpit.platformStatuses[cockpit.chatPlatform].name}
					</text>
					<text x="0" y="42" fill="currentColor" class="text-muted-foreground" font-size="9" font-family="monospace" text-anchor="middle">
						AES-256 Webhook Ingress
					</text>

					<!-- Metric Subcard -->
					<g transform="translate(0, 75)">
						<rect x="-75" y="-16" width="150" height="34" rx="8" fill="#0f172a" fill-opacity="0.6" stroke="currentColor" class="text-border" stroke-width="1" />
						<circle cx="-55" cy="1" r="3" fill="#10b981" class="animate-pulse" />
						<text x="-45" y="5" fill="#34d399" font-size="9" font-family="monospace" font-weight="bold">SOCK_LIVE</text>
						<text x="55" y="5" fill="currentColor" class="text-muted-foreground" font-size="9" font-family="monospace" text-anchor="end">~0.4ms</text>
					</g>

					<!-- Bottom Status Indicator -->
					<circle cx="0" cy="115" r="4" fill={activeStep >= 1 ? "#10b981" : "#64748b"} />
				</g>

				<!-- ================= STAGE 2 : Hermes 3 Neural LLM Core (Center: X=450, Y=220) ================= -->
				<g transform="translate(450, 220)">
					<!-- Glow Aura when active -->
					{#if activeStep === 2}
						<circle r="65" fill="#8b5cf6" fill-opacity="0.12" filter="url(#glowPurple)" />
					{/if}

					<!-- Outer Card -->
					<rect 
						x="-90" y="-130" width="180" height="260" rx="20" 
						fill="url(#gradHermes)" 
						stroke={activeStep === 2 ? "#8b5cf6" : "currentColor"} 
						class={activeStep === 2 ? "" : "text-border/80"} 
						stroke-width={activeStep === 2 ? "2.5" : "1.5"} 
						filter={activeStep === 2 ? "url(#glowPurple)" : "none"}
					/>

					<!-- Stage Header Pill -->
					<rect x="-70" y="-115" width="140" height="22" rx="6" fill="#8b5cf6" fill-opacity="0.15" stroke="#8b5cf6" stroke-opacity="0.3" stroke-width="1" />
					<text x="0" y="-100" fill="#a855f7" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">STAGE 02 : HERMES 3</text>

					<!-- Neural Processor Core Diagram -->
					<g transform="translate(0, -35)">
						<!-- Chip Substrate -->
						<rect x="-30" y="-30" width="60" height="60" rx="10" fill="#0f172a" stroke="#8b5cf6" stroke-width="2" />
						
						<!-- Circuit Die Connectors -->
						<line x1="-36" y1="-15" x2="-30" y2="-15" stroke="#8b5cf6" stroke-width="2" />
						<line x1="-36" y1="0" x2="-30" y2="0" stroke="#8b5cf6" stroke-width="2" />
						<line x1="-36" y1="15" x2="-30" y2="15" stroke="#8b5cf6" stroke-width="2" />
						<line x1="30" y1="-15" x2="36" y2="-15" stroke="#8b5cf6" stroke-width="2" />
						<line x1="30" y1="0" x2="36" y2="0" stroke="#8b5cf6" stroke-width="2" />
						<line x1="30" y1="15" x2="36" y2="15" stroke="#8b5cf6" stroke-width="2" />

						<!-- Neural Synaptic Nodes Inside Core -->
						<g style={activeStep === 2 ? "animation: neuralPulseSim 0.8s ease-in-out infinite;" : ""}>
							<!-- Synaptic Lines -->
							<line x1="-12" y1="-12" x2="12" y2="12" stroke="#c084fc" stroke-width="1.5" stroke-opacity="0.6" />
							<line x1="-12" y1="12" x2="12" y2="-12" stroke="#c084fc" stroke-width="1.5" stroke-opacity="0.6" />
							<line x1="0" y1="-14" x2="0" y2="14" stroke="#c084fc" stroke-width="1.5" stroke-opacity="0.6" />
							
							<!-- Synaptic Nodes -->
							<circle cx="-12" cy="-12" r="4" fill="#a855f7" />
							<circle cx="12" cy="-12" r="4" fill="#a855f7" />
							<circle cx="-12" cy="12" r="4" fill="#a855f7" />
							<circle cx="12" cy="12" r="4" fill="#a855f7" />
							<circle cx="0" cy="0" r="5" fill="#f43f5e" filter="url(#glowPurple)" />
						</g>
					</g>

					<!-- Node Title & Function -->
					<text x="0" y="24" fill="currentColor" class="text-foreground" font-size="12" font-weight="bold" text-anchor="middle">
						Deterministic Extraction
					</text>
					<text x="0" y="42" fill="currentColor" class="text-muted-foreground" font-size="9" font-family="monospace" text-anchor="middle">
						Structured Tool Arguments
					</text>

					<!-- Metric Subcard -->
					<g transform="translate(0, 75)">
						<rect x="-75" y="-16" width="150" height="34" rx="8" fill="#0f172a" fill-opacity="0.6" stroke="currentColor" class="text-border" stroke-width="1" />
						<circle cx="-55" cy="1" r="3" fill="#a855f7" class="animate-pulse" />
						<text x="-45" y="5" fill="#c084fc" font-size="9" font-family="monospace" font-weight="bold">CONF: 98.4%</text>
						<text x="55" y="5" fill="currentColor" class="text-muted-foreground" font-size="9" font-family="monospace" text-anchor="end">temp: 0.1</text>
					</g>

					<!-- Bottom Status Indicator -->
					<circle cx="0" cy="115" r="4" fill={activeStep >= 2 ? "#8b5cf6" : "#64748b"} />
				</g>

				<!-- ================= STAGE 3 : PostgreSQL Policy Pre-Check (Center: X=750, Y=220) ================= -->
				<g transform="translate(750, 220)">
					<!-- Glow Aura when active -->
					{#if activeStep === 3}
						<circle r="65" fill="#f59e0b" fill-opacity="0.12" filter="url(#glowAmber)" />
					{/if}

					<!-- Outer Card -->
					<rect 
						x="-90" y="-130" width="180" height="260" rx="20" 
						fill="url(#gradPostgres)" 
						stroke={activeStep === 3 ? "#f59e0b" : "currentColor"} 
						class={activeStep === 3 ? "" : "text-border/80"} 
						stroke-width={activeStep === 3 ? "2.5" : "1.5"} 
						filter={activeStep === 3 ? "url(#glowAmber)" : "none"}
					/>

					<!-- Stage Header Pill -->
					<rect x="-70" y="-115" width="140" height="22" rx="6" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1" />
					<text x="0" y="-100" fill="#f59e0b" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">STAGE 03 : DB GUARD</text>

					<!-- 3D Database Cylinder Stack -->
					<g transform="translate(0, -35)">
						<!-- Bottom Cylinder -->
						<path d="M -26 10 C -26 17 26 17 26 10 L 26 22 C 26 29 -26 29 -26 22 Z" fill="#78350f" fill-opacity="0.4" stroke="#f59e0b" stroke-width="1.5" />
						<ellipse cx="0" cy="10" rx="26" ry="7" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />

						<!-- Middle Cylinder -->
						<path d="M -26 -6 C -26 1 26 1 26 -6 L 26 6 C 26 13 -26 13 -26 6 Z" fill="#78350f" fill-opacity="0.4" stroke="#f59e0b" stroke-width="1.5" />
						<ellipse cx="0" cy="-6" rx="26" ry="7" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />

						<!-- Top Cylinder -->
						<path d="M -26 -22 C -26 -15 26 -15 26 -22 L 26 -10 C 26 -3 -26 -3 -26 -10 Z" fill="#78350f" fill-opacity="0.4" stroke="#f59e0b" stroke-width="1.5" />
						<ellipse cx="0" cy="-22" rx="26" ry="7" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />

						<!-- Security Shield Badge -->
						<g transform="translate(18, 12)">
							<circle r="12" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
							<path d="M -5 0 L -1 4 L 5 -3" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</g>
					</g>

					<!-- Node Title & Function -->
					<text x="0" y="24" fill="currentColor" class="text-foreground" font-size="12" font-weight="bold" text-anchor="middle">
						PostgreSQL 18 Isolation
					</text>
					<text x="0" y="42" fill="currentColor" class="text-muted-foreground" font-size="9" font-family="monospace" text-anchor="middle">
						Read-Only Pre-Flight Verification
					</text>

					<!-- Metric Subcard -->
					<g transform="translate(0, 75)">
						<rect x="-75" y="-16" width="150" height="34" rx="8" fill="#0f172a" fill-opacity="0.6" stroke="currentColor" class="text-border" stroke-width="1" />
						<circle cx="-55" cy="1" r="3" fill="#f59e0b" class="animate-pulse" />
						<text x="-45" y="5" fill="#fbbf24" font-size="9" font-family="monospace" font-weight="bold">ZERO_SQL_RAW</text>
						<text x="55" y="5" fill="currentColor" class="text-muted-foreground" font-size="9" font-family="monospace" text-anchor="end">status!=CLOSED</text>
					</g>

					<!-- Bottom Status Indicator -->
					<circle cx="0" cy="115" r="4" fill={activeStep >= 3 ? "#f59e0b" : "#64748b"} />
				</g>

				<!-- ================= STAGE 4 : HITL Approval Queue Staging (Center: X=1050, Y=220) ================= -->
				<g transform="translate(1050, 220)">
					<!-- Glow Aura when active -->
					{#if activeStep === 4}
						<circle r="65" fill="#3b82f6" fill-opacity="0.15" filter="url(#glowBlue)" />
					{/if}

					<!-- Outer Card -->
					<rect 
						x="-90" y="-130" width="180" height="260" rx="20" 
						fill="url(#gradHitl)" 
						stroke={activeStep === 4 ? "#3b82f6" : "currentColor"} 
						class={activeStep === 4 ? "" : "text-border/80"} 
						stroke-width={activeStep === 4 ? "2.5" : "1.5"} 
						filter={activeStep === 4 ? "url(#glowBlue)" : "none"}
					/>

					<!-- Stage Header Pill -->
					<rect x="-70" y="-115" width="140" height="22" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="1" />
					<text x="0" y="-100" fill="#60a5fa" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">STAGE 04 : HITL VAULT</text>

					<!-- Cryptographic Ticket Vault Icon -->
					<g transform="translate(0, -35)">
						<!-- Ticket Container Shape -->
						<rect x="-28" y="-28" width="56" height="56" rx="8" fill="#0f172a" stroke="#3b82f6" stroke-width="2" />
						
						<!-- Ticket Serrated Notch Cutouts -->
						<circle cx="-28" cy="0" r="5" fill="#1e293b" stroke="#3b82f6" stroke-width="1" />
						<circle cx="28" cy="0" r="5" fill="#1e293b" stroke="#3b82f6" stroke-width="1" />
						
						<!-- Inner Document Lines -->
						<line x1="-16" y1="-12" x2="16" y2="-12" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" />
						<line x1="-16" y1="-4" x2="8" y2="-4" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.6" />
						<line x1="-16" y1="4" x2="14" y2="4" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.6" />

						<!-- Approval Stamp / Checkmark -->
						<g transform="translate(10, 10)">
							<circle r="10" fill="#10b981" />
							<path d="M -4 0 L -1 3 L 4 -3" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</g>
					</g>

					<!-- Node Title & Function -->
					<text x="0" y="24" fill="currentColor" class="text-foreground" font-size="12" font-weight="bold" text-anchor="middle">
						Staging &amp; Sign-Off
					</text>
					<text x="0" y="42" fill="currentColor" class="text-muted-foreground" font-size="9" font-family="monospace" text-anchor="middle">
						Dual-Operator HITL Queue
					</text>

					<!-- Metric Subcard -->
					<g transform="translate(0, 75)">
						<rect x="-75" y="-16" width="150" height="34" rx="8" fill="#0f172a" fill-opacity="0.6" stroke="currentColor" class="text-border" stroke-width="1" />
						<circle cx="-55" cy="1" r="3" fill="#3b82f6" class="animate-pulse" />
						<text x="-45" y="5" fill="#60a5fa" font-size="9" font-family="monospace" font-weight="bold">TICKET_STAGED</text>
						<text x="55" y="5" fill="currentColor" class="text-muted-foreground" font-size="9" font-family="monospace" text-anchor="end">Signed</text>
					</g>

					<!-- Bottom Status Indicator -->
					<circle cx="0" cy="115" r="4" fill={activeStep >= 4 ? "#10b981" : "#64748b"} />
				</g>

				<!-- ================= TOP HUD: Telemetry Context Stream ================= -->
				<g transform="translate(600, 32)">
					<rect x="-240" y="-16" width="480" height="32" rx="16" fill="#0f172a" fill-opacity="0.85" stroke="currentColor" class="text-border/70" stroke-width="1" />
					<circle cx="-215" cy="0" r="4" fill={activeStep > 0 ? "#10b981" : "#8b5cf6"} class="animate-ping" />
					<circle cx="-215" cy="0" r="3" fill={activeStep > 0 ? "#10b981" : "#8b5cf6"} />
					
					<text x="-195" y="4" fill="currentColor" class="text-foreground" font-size="10" font-family="monospace" font-weight="bold">
						TARGET: <tspan fill="#38bdf8">{simDocNo}</tspan> &rarr; PROPOSED: <tspan fill="#a855f7">{simProposed.length > 22 ? simProposed.slice(0, 20) + "..." : simProposed}</tspan>
					</text>
				</g>
			</svg>
		</div>

		<!-- Bottom Floating Hint Banner -->
		<div class="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
			<div class="px-3 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border/70 shadow-xs text-[10px] font-mono text-muted-foreground flex items-center gap-2">
				<span class="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
				<span>Gunakan klik-geser mouse untuk menggeser kanvas • Gunakan tombol + / - untuk zoom visual</span>
			</div>
		</div>
	</div>
</div>
