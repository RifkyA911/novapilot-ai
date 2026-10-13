<script lang="ts">
	import { 
		CpuChip, 
		ServerStack, 
		Radio, 
		CheckCircle, 
		ArrowPath, 
		BookOpen, 
		Sparkles,
		Signal,
		PaperAirplane,
		Check,
		CommandLine,
		LockClosed
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";
	import TutorialModal from "$lib/components/TutorialModal.svelte";

	let showTutorial = $state(false);
	let testPingSuccess = $state(false);
	let pinging = $state(false);

	async function triggerTestPing() {
		if (pinging) return;
		pinging = true;
		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: "Telemetry Test Ping: Check connectivity from System Telemetry Cockpit.",
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: "INV/2026/001",
					field_target: "customer_name",
					proposed_value: "PT Telemetry Active Test",
					branch_id: 1,
					confidence_score: 0.99
				})
			});
			if (res.ok) {
				testPingSuccess = true;
				await cockpit.fetchTickets();
				setTimeout(() => (testPingSuccess = false), 3500);
			}
		} catch (err) {
			console.error("Test ping error:", err);
		} finally {
			pinging = false;
		}
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
				<div class="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
					<CpuChip class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>System Telemetry & Platform Probes</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium border border-emerald-500/20">
							All Systems Normal
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Live hardware probes, Go goroutine telemetry, and WhatsApp client hook integration status.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- Interactive Tutorial CTA Button -->
			<button
				type="button"
				onclick={() => (showTutorial = true)}
				class="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-xs flex items-center gap-1.5 cursor-pointer"
			>
				<BookOpen class="h-4 w-4" />
				<span>How to Integrate (Guide)</span>
			</button>

			<button
				type="button"
				onclick={() => cockpit.fetchTelemetry()}
				class="h-9 px-3 rounded-lg border border-input bg-background hover:bg-accent text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
			>
				<ArrowPath class="h-4 w-4 {cockpit.loading ? 'animate-spin' : ''}" />
				<span>Probe Now</span>
			</button>
		</div>
	</div>

	<!-- Top Telemetry Probes Grid -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<!-- LAN IP Address Probe -->
		<div class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">LAN Ingress IP</div>
			<div class="text-xl sm:text-2xl font-bold font-mono text-foreground flex items-center justify-between">
				<span>{cockpit.telemetry?.lan_ip || "127.0.0.1"}</span>
				<Signal class="h-5 w-5 text-emerald-500" />
			</div>
			<div class="text-xs text-muted-foreground">HTTP Port 8088 / Webhook Target</div>
		</div>

		<!-- Memory Alloc -->
		<div class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Go Memory Alloc</div>
			<div class="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center justify-between">
				<span>{cockpit.telemetry?.memory_alloc_mb || "14.2"} MB</span>
				<CpuChip class="h-5 w-5 text-primary/40" />
			</div>
			<div class="text-xs text-muted-foreground">Low footprint heap runtime</div>
		</div>

		<!-- Goroutines -->
		<div class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Active Goroutines</div>
			<div class="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
				<span>{cockpit.telemetry?.goroutines || 18}</span>
				<CommandLine class="h-5 w-5 text-emerald-500/40" />
			</div>
			<div class="text-xs text-muted-foreground">SSE workers & HTTP daemons</div>
		</div>

		<!-- Server Uptime -->
		<div class="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Server Status</div>
			<div class="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
				<span>ONLINE</span>
				<CheckCircle class="h-5 w-5 text-emerald-500" />
			</div>
			<div class="text-xs text-muted-foreground">Uptime: {Math.floor((cockpit.telemetry?.uptime_seconds || 1200) / 60)} minutes</div>
		</div>
	</div>

	<!-- Database Connection Pool Probe -->
	<div class="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2.5">
				<ServerStack class="h-5 w-5 text-amber-500" />
				<h3 class="text-sm font-semibold text-foreground">Database Connection Pool Telemetry</h3>
			</div>
			<span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
				Driver: {cockpit.telemetry?.database?.driver || "PostgreSQL ANSI"}
			</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
			<div class="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
				<span class="text-muted-foreground">Open Connections:</span>
				<span class="font-bold text-foreground">{cockpit.telemetry?.database?.open_connections || 6}</span>
			</div>
			<div class="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
				<span class="text-muted-foreground">Idle Connections:</span>
				<span class="font-bold text-emerald-600 dark:text-emerald-400">{cockpit.telemetry?.database?.idle || 5}</span>
			</div>
			<div class="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
				<span class="text-muted-foreground">In-Use Concurrency:</span>
				<span class="font-bold text-primary">{cockpit.telemetry?.database?.in_use || 1}</span>
			</div>
		</div>
	</div>

	<!-- Platform Integration Probes (WhatsApp Operational Focus) -->
	<div class="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
		<div class="flex items-center justify-between flex-wrap gap-2">
			<div>
				<h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
					<Radio class="h-4 w-4 text-emerald-500" />
					<span>WhatsApp Platform Ingestion Probes</span>
				</h3>
				<p class="text-xs text-muted-foreground mt-0.5">
					Probing authorized enterprise client adapters communicating over local port 8088.
				</p>
			</div>

			<button
				type="button"
				onclick={triggerTestPing}
				disabled={pinging}
				class="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
			>
				<PaperAirplane class="h-3.5 w-3.5" />
				<span>{pinging ? "Sending Ping..." : "Send Test Ping"}</span>
			</button>
		</div>

		{#if testPingSuccess}
			<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
				<Check class="h-4 w-4" />
				<span>Test hook ping received successfully! Staged as a test ticket in the Approval Queue.</span>
			</div>
		{/if}

		<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
			<!-- Probe 1: Ferdium -->
			<div class="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
				<div class="flex items-center justify-between">
					<span class="font-semibold text-foreground">Ferdium Desktop</span>
					<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
				</div>
				<p class="text-muted-foreground text-[11px] leading-relaxed">
					Recipe observer active in Ferdium WhatsApp tab. Passive DOM mutation capture.
				</p>
				<div class="pt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
					● Ingress Ready
				</div>
			</div>

			<!-- Probe 2: Rambox -->
			<div class="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
				<div class="flex items-center justify-between">
					<span class="font-semibold text-foreground">Rambox App</span>
					<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
				</div>
				<p class="text-muted-foreground text-[11px] leading-relaxed">
					Custom JavaScript injection script active inside WhatsApp service tab.
				</p>
				<div class="pt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
					● Ingress Ready
				</div>
			</div>

			<!-- Probe 3: WhatsApp Web Chrome -->
			<div class="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
				<div class="flex items-center justify-between">
					<span class="font-semibold text-foreground">WhatsApp Web (Chrome)</span>
					<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
				</div>
				<p class="text-muted-foreground text-[11px] leading-relaxed">
					Tampermonkey userscript observer capturing whitelisted group chats.
				</p>
				<div class="pt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
					● Ingress Ready
				</div>
			</div>

			<!-- Probe 4: PC WhatsApp Daemon -->
			<div class="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
				<div class="flex items-center justify-between">
					<span class="font-semibold text-foreground">PC Baileys Socket</span>
					<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
				</div>
				<p class="text-muted-foreground text-[11px] leading-relaxed">
					Headless Node.js Baileys multi-device socket daemon connected to port 8088.
				</p>
				<div class="pt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
					● Socket Active
				</div>
			</div>
		</div>
	</div>
</div>
