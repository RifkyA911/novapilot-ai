<script lang="ts">
	import { 
		CpuChip, 
		CircleStack, 
		Signal, 
		CommandLine, 
		CheckCircle, 
		ArrowPath, 
		Bolt, 
		ServerStack,
		LockClosed,
		Radio
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";
	import { sound } from "$lib/audio";

	// Pan & Zoom state
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);

	// Simulation states
	let isSimulatingProbe = $state(false);
	let isSimulatingDbPool = $state(false);

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

	function triggerProbeSimulation() {
		isSimulatingProbe = true;
		sound.playNavClick();
		setTimeout(() => {
			sound.playInboundPing();
		}, 400);
		setTimeout(() => {
			isSimulatingProbe = false;
		}, 1800);
	}

	function triggerDbPoolSimulation() {
		isSimulatingDbPool = true;
		sound.playActionChime();
		setTimeout(() => {
			isSimulatingDbPool = false;
		}, 1800);
	}
</script>

<div class="rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden flex flex-col font-sans transition-colors">
	<!-- Header Bar: Title, Live Telemetry & Zoom Controls -->
	<div class="p-4 sm:p-5 border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5 flex-wrap">
				<div class="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
					<CpuChip class="h-4.5 w-4.5" />
				</div>
				<div>
					<h2 class="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
						Go Runtime &amp; Hardware Telemetry Bus
						<span class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
							INTERACTIVE TOPOLOGY
						</span>
					</h2>
					<p class="text-[11px] text-muted-foreground mt-0.5">
						Topologi sirkuit probe LAN, alokasi memori Go runtime, goroutine broadcaster, dan pool koneksi PostgreSQL 18.
					</p>
				</div>
			</div>
		</div>

		<!-- Action Controls -->
		<div class="flex flex-wrap items-center gap-2 self-start lg:self-auto">
			<div class="inline-flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/70 text-xs">
				<button
					type="button"
					onclick={triggerProbeSimulation}
					disabled={isSimulatingProbe}
					class="px-2.5 py-1 rounded-lg bg-background hover:bg-card text-foreground font-semibold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
					title="Simulasi Denyut Probe LAN &amp; Multiplexer"
				>
					<Signal class="h-3 w-3 text-emerald-500 {isSimulatingProbe ? 'animate-bounce' : ''}" />
					<span>Uji Probe</span>
				</button>
				<button
					type="button"
					onclick={triggerDbPoolSimulation}
					disabled={isSimulatingDbPool}
					class="px-2.5 py-1 rounded-lg bg-background hover:bg-card text-foreground font-semibold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
					title="Simulasi Aliran Beban Pool PostgreSQL 18"
				>
					<CircleStack class="h-3 w-3 text-purple-500" />
					<span>Pool Surge</span>
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
		class="relative w-full h-[400px] sm:h-[440px] md:h-[480px] bg-gradient-to-b from-card/30 via-background to-secondary/15 select-none overflow-hidden cursor-grab active:cursor-grabbing"
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
				<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
				<span>LAN Host: <strong>{cockpit.telemetry?.lan_ip || "127.0.0.1"}:8088</strong></span>
			</div>
			<div class="px-2.5 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/80 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground">
				<span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
				<span>Goroutines: <strong>{cockpit.telemetry?.goroutines || 18} threads</strong></span>
			</div>
			<div class="px-2.5 py-1 rounded-lg bg-background/85 backdrop-blur-md border border-border/80 shadow-xs text-[10px] font-mono flex items-center gap-1.5 text-foreground">
				<span class="h-2 w-2 rounded-full bg-purple-500"></span>
				<span>Alloc: <strong>{cockpit.telemetry?.memory_alloc_mb || "14.2"} MB</strong></span>
			</div>
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
						@keyframes wireDashTel {
							from { stroke-dashoffset: 24; }
							to { stroke-dashoffset: 0; }
						}
						@keyframes wireDashTelFast {
							from { stroke-dashoffset: 32; }
							to { stroke-dashoffset: 0; }
						}
						@keyframes radarSweepCentric {
							0% { transform: rotate(0deg); }
							100% { transform: rotate(360deg); }
						}
						@keyframes sonarEchoPulse {
							0% { r: 6px; opacity: 0.9; stroke-width: 1.5px; }
							100% { r: 54px; opacity: 0; stroke-width: 0.5px; }
						}
						@keyframes poolPulseRing {
							0% { r: 10px; opacity: 1; stroke-width: 2px; }
							100% { r: 35px; opacity: 0; stroke-width: 0.5px; }
						}
						.wire-flow-tel {
							stroke-dasharray: 6 5;
							animation: wireDashTel 1.1s linear infinite;
							will-change: stroke-dashoffset;
						}
						.wire-flow-tel-fast {
							stroke-dasharray: 6 5;
							animation: wireDashTelFast 0.35s linear infinite;
							will-change: stroke-dashoffset;
						}
						.sonar-sweep-group {
							transform-origin: 0px 0px;
							animation: radarSweepCentric 4s linear infinite;
							will-change: transform;
						}
						.sonar-sweep-group-fast {
							transform-origin: 0px 0px;
							animation: radarSweepCentric 1.5s linear infinite;
							will-change: transform;
						}
						.sonar-echo-ring {
							animation: sonarEchoPulse 2.2s ease-out infinite;
						}
						.pool-ripple {
							animation: poolPulseRing 2s ease-out infinite;
						}
					</style>

					<!-- Sonar Beam Fan Gradient -->
					<linearGradient id="sonarFanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#10b981" stop-opacity="0" />
						<stop offset="60%" stop-color="#10b981" stop-opacity="0.12" />
						<stop offset="100%" stop-color="#34d399" stop-opacity="0.55" />
					</linearGradient>

					<!-- Gradients -->
					<linearGradient id="gradLanProbe" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#10b981" stop-opacity="0.8" />
						<stop offset="100%" stop-color="#38bdf8" stop-opacity="0.9" />
					</linearGradient>

					<linearGradient id="gradGoCore" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#0284c7" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.9" />
					</linearGradient>

					<linearGradient id="gradDbPool" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.8" />
						<stop offset="100%" stop-color="#10b981" stop-opacity="0.9" />
					</linearGradient>
				</defs>

				<!-- ============================================================= -->
				<!-- 1. BUS WIRES & PIPES                                          -->
				<!-- ============================================================= -->
				<g id="telemetryPipes">
					<!-- Probe to Engine Router (x=260 to 450) -->
					<path 
						d="M 260 230 L 450 230" 
						fill="none" 
						stroke="url(#gradLanProbe)" 
						stroke-width={isSimulatingProbe ? '4' : '2.5'}
						class={isSimulatingProbe ? 'wire-flow-tel-fast' : 'wire-flow-tel'}
					/>

					<!-- Engine to Goroutine Broadcaster Bus (x=590, y=190 to 760, y=110) -->
					<path 
						d="M 590 190 C 650 190, 680 110, 760 110" 
						fill="none" 
						stroke="#38bdf8" 
						stroke-width="2.2" 
						class="wire-flow-tel"
					/>

					<!-- Engine to Go Memory Alloc Bus (x=590, y=270 to 760, y=350) -->
					<path 
						d="M 590 270 C 650 270, 680 350, 760 350" 
						fill="none" 
						stroke="#c084fc" 
						stroke-width="2.2" 
						class="wire-flow-tel"
					/>

					<!-- Engine Direct to PostgreSQL Pool (x=590, y=230 to 920, y=230) -->
					<path 
						d="M 590 230 L 920 230" 
						fill="none" 
						stroke="url(#gradDbPool)" 
						stroke-width={isSimulatingDbPool ? '4.5' : '2.8'}
						class={isSimulatingDbPool ? 'wire-flow-tel-fast' : 'wire-flow-tel'}
					/>
				</g>

				<!-- ============================================================= -->
				<!-- 2. STAGE 1: LAN PROBE & MULTI-PLATFORM RADAR (Left)           -->
				<!-- ============================================================= -->
				<g id="radarProbeNode" class="cursor-pointer" onclick={triggerProbeSimulation}>
					<!-- Outer Housing Box -->
					<rect x="70" y="100" width="190" height="260" rx="20" fill="#0f172a" stroke="#10b981" stroke-width="1.6" />
					<rect x="70" y="100" width="190" height="36" rx="20" fill="#10b98120" />
					<text x="86" y="123" fill="#10b981" font-size="11" font-family="monospace" font-weight="bold">LAN PROBE SCANNER</text>

					<!-- Radar Screen Housing (Center cx=165, cy=215, r=55) -->
					<circle cx="165" cy="215" r="55" fill="#022c22" stroke="#10b981" stroke-width="1.4" stroke-opacity="0.8" />
					<circle cx="165" cy="215" r="38" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="3 3" stroke-opacity="0.5" />
					<circle cx="165" cy="215" r="20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-opacity="0.5" />
					
					<!-- Radar Crosshair -->
					<line x1="165" y1="160" x2="165" y2="270" stroke="#10b981" stroke-width="0.8" stroke-opacity="0.4" />
					<line x1="110" y1="215" x2="220" y2="215" stroke="#10b981" stroke-width="0.8" stroke-opacity="0.4" />

					<!-- Expanding Sonar Echo Pulse Ring -->
					<circle cx="165" cy="215" r="6" fill="none" stroke="#34d399" class="sonar-echo-ring" />
					{#if isSimulatingProbe}
						<circle cx="165" cy="215" r="6" fill="none" stroke="#38bdf8" class="sonar-echo-ring" style="animation-duration: 0.9s;" />
					{/if}

					<!-- Rotating Sonar Beam Group (Centered strictly at cx=165, cy=215) -->
					<g transform="translate(165, 215)">
						<g class={isSimulatingProbe ? 'sonar-sweep-group-fast' : 'sonar-sweep-group'}>
							<!-- Trailing phosphorescent fan wedge (45-degree angle arc to r=55) -->
							<path d="M 0 0 L 55 0 A 55 55 0 0 0 38.89 -38.89 Z" fill="url(#sonarFanGrad)" />
							<!-- Leading sweep laser line -->
							<line x1="0" y1="0" x2="55" y2="0" stroke="#34d399" stroke-width="2" stroke-linecap="round" />
						</g>
						<!-- Central hub dot -->
						<circle cx="0" cy="0" r="3.5" fill="#10b981" />
					</g>

					<!-- Ping Target Blips (Positioned strictly inside the r=55 circle) -->
					<circle cx="145" cy="195" r="3" fill="#10b981" class="animate-ping" />
					<circle cx="145" cy="195" r="2.5" fill="#34d399" />
					<circle cx="190" cy="235" r="2.5" fill="#38bdf8" />
					<circle cx="140" cy="240" r="2.5" fill="#fbbf24" />

					<!-- Telemetry Labels -->
					<text x="86" y="300" fill="#f8fafc" font-size="10.5" font-family="monospace" font-weight="bold">Host: {cockpit.telemetry?.lan_ip || "127.0.0.1"}</text>
					<text x="86" y="318" fill="#10b981" font-size="9" font-family="monospace">Interface: en0 / eth0</text>
					<text x="86" y="334" fill="#38bdf8" font-size="9" font-family="monospace">Sockets: Baileys/TG/DC/Slack</text>
				</g>

				<!-- ============================================================= -->
				<!-- 3. STAGE 2: GO ENGINE CORE MULTIPLEXER (Center)               -->
				<!-- ============================================================= -->
				<g id="goCoreEngine">
					<!-- Engine Box -->
					<rect x="450" y="150" width="140" height="160" rx="20" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
					<rect x="450" y="150" width="140" height="34" rx="20" fill="#0284c725" />
					<text x="520" y="172" text-anchor="middle" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="bold">GO HTTP ENGINE</text>

					<!-- Microprocessor Die Illustration -->
					<rect x="480" y="200" width="80" height="65" rx="10" fill="#082f49" stroke="#0ea5e9" stroke-width="1.2" />
					<circle cx="520" cy="232" r="16" fill="#0284c730" stroke="#38bdf8" stroke-width="1" />
					<circle cx="520" cy="232" r="6" fill="#38bdf8" class={isSimulatingProbe ? 'animate-ping' : ''} />

					<!-- Microchip Pins -->
					<line x1="470" y1="210" x2="480" y2="210" stroke="#38bdf8" stroke-width="2" />
					<line x1="470" y1="225" x2="480" y2="225" stroke="#38bdf8" stroke-width="2" />
					<line x1="470" y1="240" x2="480" y2="240" stroke="#38bdf8" stroke-width="2" />
					<line x1="470" y1="255" x2="480" y2="255" stroke="#38bdf8" stroke-width="2" />

					<line x1="560" y1="210" x2="570" y2="210" stroke="#38bdf8" stroke-width="2" />
					<line x1="560" y1="225" x2="570" y2="225" stroke="#38bdf8" stroke-width="2" />
					<line x1="560" y1="240" x2="570" y2="240" stroke="#38bdf8" stroke-width="2" />
					<line x1="560" y1="255" x2="570" y2="255" stroke="#38bdf8" stroke-width="2" />

					<!-- Status text -->
					<text x="520" y="285" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold">Port 8088 Active</text>
					<text x="520" y="299" text-anchor="middle" fill="#10b981" font-size="8.5" font-family="monospace">Zero Heap Spills</text>
				</g>

				<!-- ============================================================= -->
				<!-- 4. SATELLITE: ACTIVE GOROUTINES BROADCASTER (Top Right)       -->
				<!-- ============================================================= -->
				<g id="nodeGoroutines">
					<rect x="760" y="60" width="160" height="95" rx="16" fill="#0f172a" stroke="#0ea5e9" stroke-width="1.5" />
					<rect x="760" y="60" width="160" height="28" rx="16" fill="#0ea5e920" />
					<text x="775" y="79" fill="#38bdf8" font-size="10" font-family="monospace" font-weight="bold">ACTIVE GOROUTINES</text>

					<text x="775" y="112" fill="#f8fafc" font-size="16" font-family="monospace" font-weight="bold">{cockpit.telemetry?.goroutines || 18}</text>
					<text x="815" y="112" fill="#38bdf8" font-size="10" font-family="monospace">threads</text>

					<text x="775" y="130" fill="#94a3b8" font-size="8.5" font-family="monospace">SSE Hub Broadcasters</text>
					<text x="775" y="142" fill="#10b981" font-size="8" font-family="monospace">Non-blocking Channels</text>
				</g>

				<!-- ============================================================= -->
				<!-- 5. SATELLITE: MEMORY ALLOCATIONS RUNTIME (Bottom Right)       -->
				<!-- ============================================================= -->
				<g id="nodeMemory">
					<rect x="760" y="305" width="160" height="95" rx="16" fill="#0f172a" stroke="#c084fc" stroke-width="1.5" />
					<rect x="760" y="305" width="160" height="28" rx="16" fill="#c084fc20" />
					<text x="775" y="324" fill="#c084fc" font-size="10" font-family="monospace" font-weight="bold">MEMORY ALLOCATION</text>

					<text x="775" y="357" fill="#f8fafc" font-size="16" font-family="monospace" font-weight="bold">{cockpit.telemetry?.memory_alloc_mb || "14.2"}</text>
					<text x="830" y="357" fill="#c084fc" font-size="10" font-family="monospace">MB</text>

					<text x="775" y="375" fill="#94a3b8" font-size="8.5" font-family="monospace">Go Runtime Heap</text>
					<text x="775" y="387" fill="#10b981" font-size="8" font-family="monospace">Low Footprint / Air-Gap</text>
				</g>

				<!-- ============================================================= -->
				<!-- 6. STAGE 3: POSTGRESQL 18 CONNECTION POOL VAULT (Far Right)  -->
				<!-- ============================================================= -->
				<g id="nodePostgresPool" class="cursor-pointer" onclick={triggerDbPoolSimulation}>
					<rect x="940" y="130" width="210" height="200" rx="20" fill="#0f172a" stroke="#8b5cf6" stroke-width="1.8" />
					<rect x="940" y="130" width="210" height="34" rx="20" fill="#8b5cf625" />
					<text x="955" y="152" fill="#c084fc" font-size="11" font-family="monospace" font-weight="bold">POSTGRESQL 18 POOL</text>

					<!-- Cylinder Stack Visualization -->
					<ellipse cx="1045" cy="195" rx="35" ry="12" fill="#8b5cf625" stroke="#8b5cf6" stroke-width="1.2" />
					<ellipse cx="1045" cy="210" rx="35" ry="12" fill="#8b5cf620" stroke="#8b5cf6" stroke-width="1" />
					<ellipse cx="1045" cy="225" rx="35" ry="12" fill="#8b5cf615" stroke="#8b5cf6" stroke-width="1" />

					<!-- Ripple effect on burst -->
					{#if isSimulatingDbPool}
						<circle cx="1045" cy="210" r="10" fill="none" stroke="#a855f7" class="pool-ripple" />
					{/if}

					<!-- Connection Counts -->
					<text x="960" y="260" fill="#f8fafc" font-size="12" font-family="monospace" font-weight="bold">Max Open: 25 Connections</text>
					
					<g transform="translate(960, 272)">
						<rect x="0" y="0" width="170" height="8" rx="4" fill="#334155" />
						<rect x="0" y="0" width="60" height="8" rx="4" fill="#10b981" />
					</g>

					<text x="960" y="295" fill="#10b981" font-size="9" font-family="monospace">In Use: {cockpit.telemetry?.database?.in_use || 2} active</text>
					<text x="960" y="308" fill="#94a3b8" font-size="9" font-family="monospace">Idle: {cockpit.telemetry?.database?.idle || 8} pooled</text>
					<text x="960" y="321" fill="#c084fc" font-size="8.5" font-family="monospace">Driver: PostgreSQL 18 Local</text>
				</g>
			</svg>
		</div>

		<!-- Bottom Hint -->
		<div class="absolute bottom-2.5 right-3 text-[10px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/60 pointer-events-none">
			Gunakan drag &amp; scroll untuk pan/zoom topologi
		</div>
	</div>
</div>
