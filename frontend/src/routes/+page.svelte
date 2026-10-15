<script lang="ts">
	import { 
		ShieldCheck, 
		CheckCircle, 
		ArrowRight, 
		CommandLine, 
		LockClosed, 
		Radio, 
		CpuChip,
		Square3Stack3d,
		ArrowPath,
		Sparkles,
		ServerStack,
		CodeBracket,
		Check,
		ChevronDown,
		ChevronUp,
		DocumentText,
		ChatBubbleLeftRight,
		Clock,
		ExclamationTriangle
	} from "svelte-heros-v2";
	import DottedSurface from "$lib/components/DottedSurface.svelte";
	import PulsarGridBackground from "$lib/components/PulsarGridBackground.svelte";
	import { i18n } from "$lib/i18n.svelte";

	// Interactive Simulation State
	let isSimulating = $state(false);
	let activeStage = $state<number>(0);
	let previewTab = $state<"ticket" | "sql" | "rollback">("ticket");

	// Architecture Beam Visualizer Multi-Platform Mode
	type BeamMode = "all" | "whatsapp" | "telegram" | "discord" | "slack";
	let beamMode = $state<BeamMode>("all");

	const activeIngressNodes = $derived(() => {
		switch (beamMode) {
			case "whatsapp":
				return [
					{ name: "Ferdium App", desc: "webview.js hook", icon: "https://avatars.githubusercontent.com/u/102928503?s=200&v=4" },
					{ name: "Rambox App", desc: "Custom JS code", icon: "https://avatars.githubusercontent.com/u/19875476?s=200&v=4" },
					{ name: "WhatsApp Web", desc: "DOM Extractor", icon: "https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" },
					{ name: "PC Desktop WA", desc: "Native Port 8088", icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" }
				];
			case "telegram":
				return [
					{ name: "BotFather API", desc: "Webhook Token", icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" },
					{ name: "Telegram Web", desc: "Channel Ingress", icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" },
					{ name: "Long-Polling", desc: "Daemon Socket", icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" },
					{ name: "Desktop Client", desc: "HTTPS :8088", icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" }
				];
			case "discord":
				return [
					{ name: "Bot Gateway", desc: "Discord WebSocket", icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" },
					{ name: "Slash Command", desc: "/novapilot mutate", icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" },
					{ name: "REST Webhook", desc: "Guild Channel", icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" },
					{ name: "Guild RBAC", desc: "Role Check", icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" }
				];
			case "slack":
				return [
					{ name: "Slack Bolt SDK", desc: "Go/Node Ingress", icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png" },
					{ name: "Events API", desc: "HMAC SHA256", icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png" },
					{ name: "Slash Command", desc: "/novapilot inv", icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png" },
					{ name: "Block Kit UI", desc: "Interactive Modal", icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png" }
				];
			default: // "all"
				return [
					{ name: "WhatsApp Hook", desc: "Baileys / Ferdium", icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" },
					{ name: "Telegram Bot", desc: "BotFather Webhook", icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" },
					{ name: "Discord Gateway", desc: "Guild Interactions", icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" },
					{ name: "Slack Enterprise", desc: "Events API / Bolt", icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png" }
				];
		}
	});

	// FAQ Accordion State
	let openFaq = $state<number | null>(null);
	function toggleFaq(index: number) {
		openFaq = openFaq === index ? null : index;
	}

	function runSimulation() {
		if (isSimulating) return;
		isSimulating = true;
		activeStage = 1;

		setTimeout(() => {
			activeStage = 2;
			setTimeout(() => {
				activeStage = 3;
				setTimeout(() => {
					activeStage = 4;
					setTimeout(() => {
						isSimulating = false;
						activeStage = 0;
					}, 2500);
				}, 1800);
			}, 1800);
		}, 1400);
	}

	const faqs = $derived([
		{
			q: i18n.t.landing.faq_1_q,
			a: i18n.t.landing.faq_1_a
		},
		{
			q: i18n.t.landing.faq_2_q,
			a: i18n.t.landing.faq_2_a
		},
		{
			q: i18n.t.landing.faq_3_q,
			a: i18n.t.landing.faq_3_a
		},
		{
			q: i18n.t.landing.faq_4_q,
			a: i18n.t.landing.faq_4_a
		}
	]);
</script>

<svelte:head>
	<title>NovaPilot AI — Autonomous ChatOps &amp; Database Gatekeeper</title>
	<link rel="canonical" href="https://novapilot.internal/" />
	<meta name="description" content="Next-Gen Autonomous ChatOps &amp; Database Gatekeeper for Enterprise On-Call Teams. Zero direct SQL mutations, Hermes 3 8B cognitive reasoning, Model Context Protocol (MCP), and human-in-the-loop audit verification." />
	
	<!-- Rich Snippet: FAQPage Structured Data -->
	<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": [
			{
				"@type": "Question",
				"name": "Does NovaPilot ever execute raw, unescaped SQL directly?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Never. Every chat request is parsed into structured parameters and verified against predefined parameterized query templates. Zero raw string interpolation is permitted, preventing accidental schema corruption and SQL injection."
				}
			},
			{
				"@type": "Question",
				"name": "How does NovaPilot hook into WhatsApp without getting banned?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "NovaPilot uses passive client-side DOM observers inside authorized enterprise clients (Ferdium recipes, Rambox scripts, browser userscripts, or desktop observers). It exclusively monitors authorized internal branch groups and only sends single confirmation replies upon human sign-off."
				}
			},
			{
				"@type": "Question",
				"name": "Can approved mutations be rolled back in an emergency?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "Yes. Every single mutation automatically generates an inverse compensating rollback script prior to execution. The on-call engineer can trigger a one-click rollback from the cockpit at any time."
				}
			},
			{
				"@type": "Question",
				"name": "How is access controlled for on-call engineers?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "NovaPilot integrates with Better Auth and session-based cryptographic clearance. Only authenticated on-call personnel with active clearance tokens can approve pending mutations."
				}
			}
		]
	}
	</script>
</svelte:head>

<div class="relative w-full overflow-hidden bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
	<!-- Background subtle grid & radial glow (Aceternity UI style) -->
	<div 
		aria-hidden="true" 
		class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
	></div>
	
	<div 
		aria-hidden="true" 
		class="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[800px] rounded-full opacity-20 blur-[120px] bg-gradient-to-b from-primary via-emerald-500/20 to-transparent"
	></div>

	<!-- HERO SECTION -->
	<section class="relative pt-12 pb-16 md:pt-20 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
		<!-- Interactive Pulsar Grid Background (21st.dev @dhileepkumargm reference) -->
		<PulsarGridBackground />
		<!-- 3D Three.js Animated Dotted Surface Wave Background (21st.dev @efferd reference) -->
		<DottedSurface />

		<div class="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto relative z-10">
			
			<!-- Aceternity Pill Announcement Badge -->
			<div class="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/80 backdrop-blur-md px-3.5 py-1 text-xs font-mono text-muted-foreground shadow-xs transition-all hover:border-foreground/30">
				<span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
				<span class="font-medium text-foreground">NovaPilot 2.0</span>
				<span class="text-border">·</span>
				<span>{i18n.t.landing.pill_announcement}</span>
			</div>

			<!-- Aceternity Hero Headline -->
			<h1 class="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08] text-balance">
				{i18n.t.landing.headline_main} <br class="max-sm:hidden" />
				<span class="bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
					{i18n.t.landing.headline_gradient}
				</span>
			</h1>

			<!-- Subtitle -->
			<p class="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
				{i18n.t.landing.subtitle}
			</p>

			<!-- Action Pills / Buttons -->
			<div class="flex flex-wrap items-center justify-center gap-3 pt-2">
				<a
					href="/dashboard"
					class="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 bg-foreground text-background hover:opacity-90 shadow-md shadow-foreground/10 active:scale-[0.98]"
				>
					<CommandLine class="h-4 w-4" />
					<span>{i18n.t.landing.launch_cockpit}</span>
					<ArrowRight class="h-3.5 w-3.5" />
				</a>

				<a
					href="/flow"
					class="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 bg-secondary/70 backdrop-blur-md text-foreground ring-1 ring-border/80 hover:bg-secondary hover:ring-foreground/20 active:scale-[0.98]"
				>
					<Square3Stack3d class="h-4 w-4 text-emerald-500" />
					<span>{i18n.t.landing.flow_and_hooks}</span>
				</a>
			</div>
		</div>

		<!-- ACETERNITY SIGNATURE ANIMATED BEAM ARCHITECTURE FLOW -->
		<div class="mt-14 md:mt-20 relative w-full">
			<div class="p-4 sm:p-6 rounded-3xl bg-card/60 backdrop-blur-md border border-border/70 shadow-xl overflow-hidden relative">
				
				<!-- Header bar for architecture visualizer with Platform Tabs -->
				<div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/50 text-xs">
					<div class="flex items-center gap-2">
						<span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
						<span class="font-mono font-semibold uppercase tracking-wider text-foreground">
							{i18n.t.landing.circuit_arch}
						</span>
					</div>

					<!-- Platform Switcher Tabs -->
					<div class="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-secondary/60 border border-border/60">
						{#each [
							{ id: 'all', label: i18n.t.landing.all_channels },
							{ id: 'whatsapp', label: 'WhatsApp' },
							{ id: 'telegram', label: 'Telegram' },
							{ id: 'discord', label: 'Discord' },
							{ id: 'slack', label: 'Slack' }
						] as tab}
							<button
								type="button"
								onclick={() => beamMode = tab.id as BeamMode}
								class="px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer {beamMode === tab.id ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}"
							>
								{tab.label}
							</button>
						{/each}
					</div>

					<button
						type="button"
						onclick={runSimulation}
						disabled={isSimulating}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 text-xs font-mono font-medium transition-all cursor-pointer disabled:opacity-50"
					>
						<ArrowPath class="h-3 w-3 {isSimulating ? 'animate-spin' : ''}" />
						<span>{isSimulating ? i18n.t.landing.simulating_stage.replace('{stage}', String(activeStage)) : i18n.t.landing.simulate_flow}</span>
					</button>
				</div>

				<!-- SVG Architecture Canvas with Animated Beams -->
				<div class="relative w-full mt-6 py-4 overflow-x-auto">
					<div class="min-w-[760px] max-w-4xl mx-auto relative h-[260px]">
						<svg viewBox="0 0 800 260" class="w-full h-full pointer-events-none absolute inset-0 select-none" fill="none">
							<defs>
								<!-- Glow Filter for Aceternity Beams -->
								<filter id="beam-glow" x="-20%" y="-40%" width="140%" height="180%">
									<feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"></feGaussianBlur>
									<feMerge>
										<feMergeNode in="blur"></feMergeNode>
										<feMergeNode in="SourceGraphic"></feMergeNode>
									</feMerge>
								</filter>

								<!-- Pulse Animation Keyframes (CSS) -->
								<style>
									@keyframes beamDash {
										to {
											stroke-dashoffset: -120;
										}
									}
									.animated-beam {
										stroke-dasharray: 10 16;
										animation: beamDash 2.5s linear infinite;
									}
									.active-pulse {
										stroke-dasharray: 20 60;
										animation: beamDash 1.2s linear infinite;
									}
								</style>
							</defs>

							<!-- Base Connecting Lines (Left Ingestion to Center Core) -->
							<path d="M 120 40 C 260 40, 280 130, 400 130" stroke="currentColor" class="text-border/60" stroke-width="1.5" />
							<path d="M 120 100 C 260 100, 280 130, 400 130" stroke="currentColor" class="text-border/60" stroke-width="1.5" />
							<path d="M 120 160 C 260 160, 280 130, 400 130" stroke="currentColor" class="text-border/60" stroke-width="1.5" />
							<path d="M 120 220 C 260 220, 280 130, 400 130" stroke="currentColor" class="text-border/60" stroke-width="1.5" />

							<!-- Base Connecting Lines (Center Core to Right Destinations) -->
							<path d="M 400 130 C 520 130, 540 40, 680 40" stroke="currentColor" class="text-border/60" stroke-width="1.5" />
							<path d="M 400 130 C 520 130, 540 100, 680 100" stroke="currentColor" class="text-border/60" stroke-width="1.5" />
							<path d="M 400 130 C 520 130, 540 160, 680 160" stroke="currentColor" class="text-border/60" stroke-width="1.5" />
							<path d="M 400 130 C 520 130, 540 220, 680 220" stroke="currentColor" class="text-border/60" stroke-width="1.5" />

							<!-- Glowing Animated Beams (Active Data Currents) -->
							<path 
								d="M 120 40 C 260 40, 280 130, 400 130" 
								class="stroke-primary animated-beam {activeStage === 1 ? 'active-pulse stroke-emerald-400' : 'opacity-70'}" 
								stroke-width="2.5" 
								filter="url(#beam-glow)" 
							/>
							<path 
								d="M 120 100 C 260 100, 280 130, 400 130" 
								class="stroke-primary animated-beam {activeStage === 1 ? 'active-pulse stroke-emerald-400' : 'opacity-70'}" 
								stroke-width="2.5" 
								filter="url(#beam-glow)" 
							/>
							<path 
								d="M 120 160 C 260 160, 280 130, 400 130" 
								class="stroke-primary animated-beam {activeStage === 1 ? 'active-pulse stroke-emerald-400' : 'opacity-70'}" 
								stroke-width="2.5" 
								filter="url(#beam-glow)" 
							/>
							<path 
								d="M 120 220 C 260 220, 280 130, 400 130" 
								class="stroke-primary animated-beam {activeStage === 1 ? 'active-pulse stroke-emerald-400' : 'opacity-70'}" 
								stroke-width="2.5" 
								filter="url(#beam-glow)" 
							/>

							<!-- Outgoing Beams (Core to Storage & Audit) -->
							<path 
								d="M 400 130 C 520 130, 540 40, 680 40" 
								class="stroke-emerald-400 animated-beam {activeStage >= 3 ? 'active-pulse' : 'opacity-60'}" 
								stroke-width="2.5" 
								filter="url(#beam-glow)" 
							/>
							<path 
								d="M 400 130 C 520 130, 540 100, 680 100" 
								class="stroke-emerald-400 animated-beam {activeStage >= 3 ? 'active-pulse' : 'opacity-60'}" 
								stroke-width="2.5" 
								filter="url(#beam-glow)" 
							/>
							<path 
								d="M 400 130 C 520 130, 540 160, 680 160" 
								class="stroke-emerald-400 animated-beam {activeStage >= 3 ? 'active-pulse' : 'opacity-60'}" 
								stroke-width="2.5" 
								filter="url(#beam-glow)" 
							/>
							<path 
								d="M 400 130 C 520 130, 540 220, 680 220" 
								class="stroke-emerald-400 animated-beam {activeStage >= 3 ? 'active-pulse' : 'opacity-60'}" 
								stroke-width="2.5" 
								filter="url(#beam-glow)" 
							/>
						</svg>

						<!-- DOM NODES: Ingestion Clients (Left Column - Multi-Platform Adaptive) -->
						<div class="absolute left-0 top-0 w-36 flex flex-col gap-2 justify-between h-full py-1 text-left">
							{#each activeIngressNodes() as node, i}
								<div class="p-2 rounded-xl bg-background border border-border/80 shadow-xs flex items-center gap-2 transition-all {activeStage === 1 ? 'ring-2 ring-primary ring-offset-1' : ''}">
									<img src={node.icon} alt={node.name} class="h-6 w-6 rounded-md object-contain shrink-0" />
									<div class="min-w-0">
										<div class="text-[11px] font-bold text-foreground truncate">{node.name}</div>
										<div class="text-[9px] font-mono text-muted-foreground truncate">{node.desc}</div>
									</div>
								</div>
							{/each}
						</div>

						<!-- DOM NODES: Central NovaPilot Engine (Center) -->
						<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 text-center">
							<div class="p-3.5 rounded-2xl bg-card border border-primary/40 shadow-xl shadow-primary/10 relative {activeStage === 2 ? 'ring-4 ring-primary/40 scale-105' : ''} transition-all">
								<div class="h-10 w-10 mx-auto rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-primary/30">
									<ShieldCheck class="h-6 w-6" />
								</div>
								<div class="mt-2 text-xs font-bold text-foreground">NovaPilot Core</div>
								<div class="text-[10px] font-mono text-primary font-semibold">Guardrail Engine</div>
								<div class="mt-1.5 flex items-center justify-center gap-1">
									<span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
									<span class="text-[9px] font-mono text-muted-foreground">Zero Raw SQL AST</span>
								</div>
							</div>
						</div>

						<!-- DOM NODES: Destination Networks (Right Column) -->
						<div class="absolute right-0 top-0 w-36 flex flex-col gap-2 justify-between h-full py-1 text-left">
							<!-- PostgreSQL DC -->
							<div class="p-2 rounded-xl bg-background border border-border/80 shadow-xs flex items-center gap-2 {activeStage >= 3 ? 'border-emerald-500/60 bg-emerald-500/5' : ''}">
								<ServerStack class="h-5 w-5 text-emerald-500 shrink-0" />
								<div class="min-w-0">
									<div class="text-[11px] font-bold text-foreground truncate">PostgreSQL 18</div>
									<div class="text-[9px] font-mono text-muted-foreground truncate">Plant DC Database</div>
								</div>
							</div>

							<!-- Oracle 11g -->
							<div class="p-2 rounded-xl bg-background border border-border/80 shadow-xs flex items-center gap-2 {activeStage >= 3 ? 'border-emerald-500/60 bg-emerald-500/5' : ''}">
								<ServerStack class="h-5 w-5 text-red-500 shrink-0" />
								<div class="min-w-0">
									<div class="text-[11px] font-bold text-foreground truncate">Oracle 11g</div>
									<div class="text-[9px] font-mono text-muted-foreground truncate">Legacy ERP Ledger</div>
								</div>
							</div>

							<!-- SSE Live Stream -->
							<div class="p-2 rounded-xl bg-background border border-border/80 shadow-xs flex items-center gap-2 {activeStage >= 3 ? 'border-emerald-500/60 bg-emerald-500/5' : ''}">
								<Radio class="h-5 w-5 text-blue-500 shrink-0" />
								<div class="min-w-0">
									<div class="text-[11px] font-bold text-foreground truncate">SSE Stream</div>
									<div class="text-[9px] font-mono text-muted-foreground truncate">Real-time Terminal</div>
								</div>
							</div>

							<!-- Rollback Generator -->
							<div class="p-2 rounded-xl bg-background border border-border/80 shadow-xs flex items-center gap-2 {activeStage >= 3 ? 'border-emerald-500/60 bg-emerald-500/5' : ''}">
								<ArrowPath class="h-5 w-5 text-amber-500 shrink-0" />
								<div class="min-w-0">
									<div class="text-[11px] font-bold text-foreground truncate">Rollback Vault</div>
									<div class="text-[9px] font-mono text-muted-foreground truncate">Auto Undo Script</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Visual Step Legend -->
				<div class="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-muted-foreground">
					<div class="flex items-center gap-4 flex-wrap">
						<span class="flex items-center gap-1.5">
							<span class="h-2 w-2 rounded-full bg-primary"></span>
							<span>{i18n.t.landing.stage_1}</span>
						</span>
						<span class="flex items-center gap-1.5">
							<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
							<span>{i18n.t.landing.stage_2}</span>
						</span>
						<span class="flex items-center gap-1.5">
							<span class="h-2 w-2 rounded-full bg-blue-500"></span>
							<span>{i18n.t.landing.stage_3}</span>
						</span>
						<span class="flex items-center gap-1.5">
							<span class="h-2 w-2 rounded-full bg-amber-500"></span>
							<span>{i18n.t.landing.stage_4}</span>
						</span>
					</div>

					<span class="text-foreground font-semibold">
						{isSimulating ? i18n.t.landing.status_simulating : i18n.t.landing.status_ready}
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- PRODUCT COCKPIT MOCKUP FRAME (ACETERNITY STYLE INTERACTIVE CARD) -->
	<section class="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center space-y-3 mb-10">
			<h2 class="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
				{i18n.t.landing.cockpit_mockup_title}
			</h2>
			<p class="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
				{i18n.t.landing.cockpit_mockup_sub}
			</p>
		</div>

		<!-- Mockup Frame -->
		<div class="rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden max-w-5xl mx-auto">
			<!-- Window Titlebar -->
			<div class="h-10 px-4 bg-secondary/80 border-b border-border/60 flex items-center justify-between text-xs">
				<div class="flex items-center gap-2">
					<div class="flex items-center gap-1.5">
						<span class="h-3 w-3 rounded-full bg-red-500/80"></span>
						<span class="h-3 w-3 rounded-full bg-amber-500/80"></span>
						<span class="h-3 w-3 rounded-full bg-emerald-500/80"></span>
					</div>
					<span class="ml-2 font-mono text-[11px] text-muted-foreground hidden sm:inline">
						novapilot.internal/dashboard
					</span>
				</div>

				<!-- Mockup Tab Switcher -->
				<div class="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/60 font-mono text-[11px]">
					<button
						type="button"
						onclick={() => (previewTab = "ticket")}
						class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {previewTab === 'ticket' ? 'bg-secondary text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}"
					>
						{i18n.t.landing.tab_live_ticket}
					</button>
					<button
						type="button"
						onclick={() => (previewTab = "sql")}
						class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {previewTab === 'sql' ? 'bg-secondary text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}"
					>
						{i18n.t.landing.tab_zero_sql}
					</button>
					<button
						type="button"
						onclick={() => (previewTab = "rollback")}
						class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {previewTab === 'rollback' ? 'bg-secondary text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}"
					>
						{i18n.t.landing.tab_auto_rollback}
					</button>
				</div>
			</div>

			<!-- Window Content Preview -->
			<div class="p-5 sm:p-7 space-y-5">
				{#if previewTab === "ticket"}
					<!-- Tab 1: Live Ticket Inspection -->
					<div class="grid md:grid-cols-2 gap-5 items-stretch">
						<!-- Left: WhatsApp Ingested Message -->
						<div class="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-3 flex flex-col justify-between">
							<div class="space-y-2">
								<div class="flex items-center justify-between text-xs font-mono">
									<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
										{i18n.t.landing.medan_hub}
									</span>
									<span class="text-muted-foreground">03:14 AM</span>
								</div>

								<div class="p-3 rounded-xl bg-background border border-border/60 text-xs text-foreground space-y-1">
									<div class="font-semibold text-emerald-600 dark:text-emerald-400">{i18n.t.landing.medan_msg}</div>
									<div class="text-[10px] text-muted-foreground font-mono">{i18n.t.landing.sender_info}</div>
								</div>
							</div>

							<div class="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/40">
								<span>{i18n.t.landing.confidence_score} <strong class="text-foreground">96.4%</strong></span>
								<span class="text-emerald-500 font-semibold">{i18n.t.landing.high_confidence}</span>
							</div>
						</div>

						<!-- Right: Parameterized Field Mutation Diff -->
						<div class="p-4 rounded-2xl bg-card border border-border/70 space-y-3 flex flex-col justify-between">
							<div class="space-y-2">
								<div class="flex items-center justify-between text-xs font-mono">
									<span class="text-muted-foreground font-semibold">{i18n.t.landing.target_doc}</span>
									<span class="text-foreground font-bold font-mono">INV-2024-8901</span>
								</div>

								<!-- Side by Side Diff -->
								<div class="grid grid-cols-2 gap-2 text-xs font-mono">
									<div class="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
										<div class="text-[10px] uppercase font-bold text-destructive/80">{i18n.t.landing.current_value}</div>
										<div class="font-bold text-sm mt-0.5">11.0%</div>
										<div class="text-[10px] text-muted-foreground mt-1">TOTAL_TAX_RATE</div>
									</div>

									<div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
										<div class="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400/80">{i18n.t.landing.proposed_value}</div>
										<div class="font-bold text-sm mt-0.5">12.0%</div>
										<div class="text-[10px] text-muted-foreground mt-1">MUTATED FIELD</div>
									</div>
								</div>
							</div>

							<div class="flex items-center gap-2 pt-2">
								<a
									href="/dashboard"
									class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs text-center transition-colors shadow-sm"
								>
									{i18n.t.landing.approve_execute}
								</a>
								<button
									type="button"
									class="px-3 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors"
								>
									{i18n.t.landing.reject}
								</button>
							</div>
						</div>
					</div>
				{:else if previewTab === "sql"}
					<!-- Tab 2: Zero Raw SQL Guardrail -->
					<div class="p-4 rounded-2xl bg-secondary/20 border border-border/60 space-y-3">
						<div class="flex items-center justify-between text-xs font-mono">
							<span class="flex items-center gap-1.5 text-primary font-bold">
								<CodeBracket class="h-4 w-4" />
								<span>{i18n.t.landing.sql_preview_title}</span>
							</span>
							<span class="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px]">
								{i18n.t.landing.dry_run_passed}
							</span>
						</div>

						<pre class="p-3.5 rounded-xl bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-800">
<code><span class="text-neutral-500">-- NovaPilot Prepared Transaction: Ticket #TKT-8901</span>
<span class="text-blue-400">BEGIN TRANSACTION</span>;
<span class="text-blue-400">UPDATE</span> invoices 
<span class="text-blue-400">SET</span> tax_rate = <span class="text-amber-300">$1</span>, updated_at = <span class="text-amber-300">NOW()</span>
<span class="text-blue-400">WHERE</span> document_no = <span class="text-amber-300">$2</span> <span class="text-blue-400">AND</span> branch_id = <span class="text-amber-300">$3</span>;
<span class="text-neutral-500">-- Bounded Parameters: [$1: 12.00, $2: "INV-2024-8901", $3: 4]</span>
<span class="text-blue-400">COMMIT</span>;</code></pre>

						<div class="text-[11px] text-muted-foreground flex items-center gap-2">
							<CheckCircle class="h-3.5 w-3.5 text-emerald-500 shrink-0" />
							<span>{i18n.t.landing.zero_sql_note}</span>
						</div>
					</div>
				{:else}
					<!-- Tab 3: Auto Rollback Script -->
					<div class="p-4 rounded-2xl bg-secondary/20 border border-border/60 space-y-3">
						<div class="flex items-center justify-between text-xs font-mono">
							<span class="flex items-center gap-1.5 text-amber-500 font-bold">
								<ArrowPath class="h-4 w-4" />
								<span>{i18n.t.landing.rollback_preview_title}</span>
							</span>
							<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px]">
								{i18n.t.landing.instant_reversible}
							</span>
						</div>

						<pre class="p-3.5 rounded-xl bg-neutral-950 text-amber-400 font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-800">
<code><span class="text-neutral-500">-- Generated Inverse Transaction for Ticket #TKT-8901</span>
<span class="text-blue-400">BEGIN TRANSACTION</span>;
<span class="text-blue-400">UPDATE</span> invoices 
<span class="text-blue-400">SET</span> tax_rate = <span class="text-amber-300">11.00</span>, updated_at = <span class="text-amber-300">NOW()</span>
<span class="text-blue-400">WHERE</span> document_no = <span class="text-amber-300">'INV-2024-8901'</span>;
<span class="text-neutral-500">-- Signed by Auditor: johndoe@factory.internal</span>
<span class="text-blue-400">COMMIT</span>;</code></pre>

						<div class="text-[11px] text-muted-foreground flex items-center gap-2">
							<CheckCircle class="h-3.5 w-3.5 text-emerald-500 shrink-0" />
							<span>{i18n.t.landing.rollback_note}</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- METRICS COUNTER BAR (ACETERNITY SOCIAL PROOF) -->
	<section class="py-12 border-y border-border/50 bg-secondary/20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
			<div class="space-y-1">
				<div class="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-500">{i18n.t.landing.stat_turnaround}</div>
				<div class="text-xs font-mono text-muted-foreground uppercase tracking-wider">{i18n.t.landing.stat_turnaround_sub}</div>
			</div>
			<div class="space-y-1">
				<div class="text-3xl sm:text-4xl font-extrabold font-mono text-foreground">{i18n.t.landing.stat_safety}</div>
				<div class="text-xs font-mono text-muted-foreground uppercase tracking-wider">{i18n.t.landing.stat_safety_sub}</div>
			</div>
			<div class="space-y-1">
				<div class="text-3xl sm:text-4xl font-extrabold font-mono text-primary">{i18n.t.landing.stat_unchecked}</div>
				<div class="text-xs font-mono text-muted-foreground uppercase tracking-wider">{i18n.t.landing.stat_unchecked_sub}</div>
			</div>
			<div class="space-y-1">
				<div class="text-3xl sm:text-4xl font-extrabold font-mono text-foreground">{i18n.t.landing.stat_hubs}</div>
				<div class="text-xs font-mono text-muted-foreground uppercase tracking-wider">{i18n.t.landing.stat_hubs_sub}</div>
			</div>
		</div>
	</section>

	<!-- BENTO FEATURE GRID (ACETERNITY 3-COLUMN BENTO) -->
	<section class="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center space-y-3 mb-12">
			<h2 class="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
				{i18n.t.landing.bento_title}
			</h2>
			<p class="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
				{i18n.t.landing.bento_sub}
			</p>
		</div>

		<div class="grid md:grid-cols-3 gap-6">
			<!-- Bento 1 -->
			<div class="rounded-3xl border border-border/70 bg-card p-6 flex flex-col justify-between space-y-6 hover:border-foreground/30 transition-all shadow-xs">
				<div class="space-y-4">
					<div class="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
						<Radio class="h-5 w-5" />
					</div>

					<div class="space-y-1.5">
						<h3 class="text-lg font-bold text-foreground">{i18n.t.landing.bento_1_title}</h3>
						<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{i18n.t.landing.bento_1_desc}
						</p>
					</div>
				</div>

				<!-- Visual Micro-UI -->
				<div class="p-3 rounded-2xl bg-secondary/40 border border-border/50 text-[11px] font-mono space-y-2">
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Observer: Ferdium Recipe</span>
						<span class="text-emerald-500 font-bold">CONNECTED</span>
					</div>
					<div class="p-2 rounded-xl bg-background border border-border/40 text-foreground truncate">
						💬 #ops-surabaya: "Revisi PO-9921 alamat kirim..."
					</div>
				</div>
			</div>

			<!-- Bento 2 -->
			<div class="rounded-3xl border border-border/70 bg-card p-6 flex flex-col justify-between space-y-6 hover:border-foreground/30 transition-all shadow-xs">
				<div class="space-y-4">
					<div class="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
						<CodeBracket class="h-5 w-5" />
					</div>

					<div class="space-y-1.5">
						<h3 class="text-lg font-bold text-foreground">{i18n.t.landing.bento_2_title}</h3>
						<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{i18n.t.landing.bento_2_desc}
						</p>
					</div>
				</div>

				<!-- Visual Micro-UI -->
				<div class="p-3 rounded-2xl bg-secondary/40 border border-border/50 text-[11px] font-mono space-y-2">
					<div class="flex items-center justify-between text-muted-foreground">
						<span>AST Analyzer</span>
						<span class="text-primary font-bold">VALIDATED</span>
					</div>
					<div class="p-2 rounded-xl bg-background border border-border/40 text-foreground truncate">
						🛡️ Prepared: UPDATE invoices SET status = $1...
					</div>
				</div>
			</div>

			<!-- Bento 3 -->
			<div class="rounded-3xl border border-border/70 bg-card p-6 flex flex-col justify-between space-y-6 hover:border-foreground/30 transition-all shadow-xs">
				<div class="space-y-4">
					<div class="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
						<ShieldCheck class="h-5 w-5" />
					</div>

					<div class="space-y-1.5">
						<h3 class="text-lg font-bold text-foreground">{i18n.t.landing.bento_3_title}</h3>
						<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{i18n.t.landing.bento_3_desc}
						</p>
					</div>
				</div>

				<!-- Visual Micro-UI -->
				<div class="p-3 rounded-2xl bg-secondary/40 border border-border/50 text-[11px] font-mono space-y-2">
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Clearance Check</span>
						<span class="text-emerald-500 font-bold">JOHN DOE (ON-CALL)</span>
					</div>
					<div class="p-2 rounded-xl bg-background border border-border/40 text-foreground truncate">
						✍️ Signed token: 0x8a92f0... [Audited]
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- HOW IT WORKS SECTION (ACETERNITY FOLIO STEP WALKTHROUGH) -->
	<section class="py-16 md:py-24 bg-secondary/20 border-t border-border/50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center space-y-3 mb-14">
			<h2 class="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
				{i18n.t.landing.how_it_works_title}
			</h2>
			<p class="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
				{i18n.t.landing.how_it_works_sub}
			</p>
		</div>

		<div class="grid md:grid-cols-3 gap-8">
			<!-- Step 1 -->
			<div class="space-y-3 p-6 rounded-3xl bg-card border border-border/70 relative">
				<div class="h-8 w-8 rounded-full bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center border border-primary/20">
					01
				</div>
				<h3 class="text-base font-bold text-foreground">{i18n.t.landing.step_1_title}</h3>
				<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
					{i18n.t.landing.step_1_desc}
				</p>
			</div>

			<!-- Step 2 -->
			<div class="space-y-3 p-6 rounded-3xl bg-card border border-border/70 relative">
				<div class="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/20">
					02
				</div>
				<h3 class="text-base font-bold text-foreground">{i18n.t.landing.step_2_title}</h3>
				<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
					{i18n.t.landing.step_2_desc}
				</p>
			</div>

			<!-- Step 3 -->
			<div class="space-y-3 p-6 rounded-3xl bg-card border border-border/70 relative">
				<div class="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 font-mono font-bold text-xs flex items-center justify-center border border-blue-500/20">
					03
				</div>
				<h3 class="text-base font-bold text-foreground">{i18n.t.landing.step_3_title}</h3>
				<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
					{i18n.t.landing.step_3_desc}
				</p>
			</div>
		</div>
	</section>

	<!-- FAQ ACCORDION SECTION (ACETERNITY STYLE) -->
	<section class="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center space-y-3 mb-10">
			<h2 class="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
				{i18n.t.landing.faq_title}
			</h2>
			<p class="text-xs sm:text-sm text-muted-foreground">
				{i18n.t.landing.faq_sub}
			</p>
		</div>

		<div class="space-y-3">
			{#each faqs as faq, i}
				<div class="rounded-2xl border border-border/70 bg-card overflow-hidden transition-colors">
					<button
						type="button"
						onclick={() => toggleFaq(i)}
						class="w-full p-4.5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
					>
						<span>{faq.q}</span>
						{#if openFaq === i}
							<ChevronUp class="h-4 w-4 text-muted-foreground shrink-0" />
						{:else}
							<ChevronDown class="h-4 w-4 text-muted-foreground shrink-0" />
						{/if}
					</button>

					{#if openFaq === i}
						<div class="px-4.5 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
							{faq.a}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<!-- BOTTOM HIGH-IMPACT CTA BANNER (ACETERNITY STYLE) -->
	<section class="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="relative rounded-3xl p-8 sm:p-14 text-center overflow-hidden border border-primary/30 bg-gradient-to-b from-card via-card to-primary/10 shadow-2xl space-y-6">
			<!-- Radial Glow inside banner -->
			<div 
				aria-hidden="true" 
				class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full opacity-30 blur-3xl bg-primary"
			></div>

			<div class="relative z-10 space-y-3 max-w-2xl mx-auto">
				<h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
					Eliminate 2 AM on-call burnout today
				</h2>
				<p class="text-xs sm:text-base text-muted-foreground leading-relaxed">
					Connect your WhatsApp client hooks and manage factory mutations safely with zero unverified queries.
				</p>
			</div>

			<div class="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
				<a
					href="/dashboard"
					class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold bg-foreground text-background hover:opacity-90 shadow-lg shadow-foreground/10 transition-all active:scale-[0.98]"
				>
					<CommandLine class="h-4 w-4" />
					<span>Launch On-Call Cockpit</span>
					<ArrowRight class="h-3.5 w-3.5" />
				</a>

				<a
					href="/auth"
					class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold bg-background/80 backdrop-blur-md text-foreground ring-1 ring-border/80 hover:bg-secondary transition-all"
				>
					<LockClosed class="h-4 w-4 text-muted-foreground" />
					<span>Sign In via Better Auth</span>
				</a>
			</div>
		</div>
	</section>
</div>
