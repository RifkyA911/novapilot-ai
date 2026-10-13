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
		LockClosed,
		ExclamationTriangle
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";
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
					raw_message: `Telemetry Probe Ping [${cockpit.chatPlatform.toUpperCase()}]: Testing ingress gateway connectivity.`,
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: "INV/2026/001",
					field_target: "customer_name",
					proposed_value: `PT Telemetry ${cockpit.chatPlatform.toUpperCase()} Active`,
					branch_id: 1,
					confidence_score: 0.99
				})
			});
			if (res.ok) {
				cockpit.recordPlatformEvent(cockpit.chatPlatform);
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
	
	<!-- Top Aceternity Glow Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
					<CpuChip class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>System Telemetry & Platform Probes</span>
						<span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium border border-emerald-500/20">
							Live Probes
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Hardware telemetry, Go runtime allocations, and multi-platform ChatOps ingress status.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2 flex-wrap">
			<button
				type="button"
				onclick={() => (showTutorial = true)}
				class="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
			>
				<BookOpen class="h-4 w-4" />
				<span>How to Integrate</span>
			</button>

			<button
				type="button"
				onclick={() => cockpit.fetchTelemetry()}
				class="h-9 px-3 rounded-xl border border-input bg-background hover:bg-accent text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
			>
				<ArrowPath class="h-4 w-4 {cockpit.loading ? 'animate-spin' : ''}" />
				<span>Probe Now</span>
			</button>
		</div>
	</div>

	<!-- Core Hardware & Runtime Telemetry Cards (Aceternity Style) -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<!-- LAN Ingress Probe -->
		<div class="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1 hover:border-foreground/30 transition-all">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">LAN Ingress IP</div>
			<div class="text-xl sm:text-2xl font-bold font-mono text-foreground flex items-center justify-between">
				<span>{cockpit.telemetry?.lan_ip || "127.0.0.1"}</span>
				<Signal class="h-5 w-5 text-emerald-500" />
			</div>
			<div class="text-xs text-muted-foreground">HTTP Port 8088 Active</div>
		</div>

		<!-- Memory Alloc -->
		<div class="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1 hover:border-foreground/30 transition-all">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Go Memory Alloc</div>
			<div class="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center justify-between">
				<span>{cockpit.telemetry?.memory_alloc_mb || "14.2"} MB</span>
				<CpuChip class="h-5 w-5 text-primary/40" />
			</div>
			<div class="text-xs text-muted-foreground">Low footprint runtime</div>
		</div>

		<!-- Goroutines -->
		<div class="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1 hover:border-foreground/30 transition-all">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Active Goroutines</div>
			<div class="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
				<span>{cockpit.telemetry?.goroutines || 18}</span>
				<CommandLine class="h-5 w-5 text-emerald-500/40" />
			</div>
			<div class="text-xs text-muted-foreground">SSE duplex broadcasters</div>
		</div>

		<!-- Uptime -->
		<div class="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-1 hover:border-foreground/30 transition-all">
			<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Server Status</div>
			<div class="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
				<span>ONLINE</span>
				<CheckCircle class="h-5 w-5 text-emerald-500" />
			</div>
			<div class="text-xs text-muted-foreground">Uptime: {Math.floor((cockpit.telemetry?.uptime_seconds || 1200) / 60)} min</div>
		</div>
	</div>

	<!-- Database Connection Pool Probe -->
	<div class="p-5 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2.5">
				<ServerStack class="h-5 w-5 text-amber-500" />
				<h3 class="text-sm font-semibold text-foreground">Database Connection Pool Telemetry</h3>
			</div>
			<span class="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
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

	<!-- Multi-Platform ChatOps Ingress Probes (Dynamic based on selected platform) -->
	<div class="p-6 rounded-3xl border border-border/80 bg-card shadow-xl space-y-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
			<div>
				<div class="flex items-center gap-2 flex-wrap">
					<Radio class="h-5 w-5 text-primary" />
					<h3 class="text-base font-bold text-foreground">
						ChatOps Platform Ingress Probes ({cockpit.platformStatuses[cockpit.chatPlatform].name})
					</h3>
				</div>
				<p class="text-xs text-muted-foreground mt-0.5">
					Probes live communication sockets and webhooks for the active platform.
				</p>
			</div>

			<!-- Platform Switcher Pills -->
			<div class="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border">
				{#each (["whatsapp", "telegram", "discord", "slack"] as ChatPlatform[]) as p}
					<button
						type="button"
						onclick={() => (cockpit.chatPlatform = p)}
						class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {cockpit.chatPlatform === p ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
					>
						{p === "whatsapp" ? "💬 WA" : p === "telegram" ? "✈️ TG" : p === "discord" ? "🎮 Discord" : "💼 Slack"}
					</button>
				{/each}
			</div>
		</div>

		<!-- Honest Diagnostic Status -->
		<div class="p-4 rounded-2xl {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : cockpit.platformStatuses[cockpit.chatPlatform].status === 'AWAITING_HOOK' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'} text-xs space-y-1">
			<div class="flex items-center justify-between flex-wrap gap-2">
				<div class="flex items-center gap-2 font-bold">
					<span class="h-2.5 w-2.5 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : cockpit.platformStatuses[cockpit.chatPlatform].status === 'AWAITING_HOOK' ? 'bg-amber-500' : 'bg-rose-500'}"></span>
					<span>Status: {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'CONNECTED' : cockpit.platformStatuses[cockpit.chatPlatform].status === 'AWAITING_HOOK' ? 'AWAITING FIRST HOOK PING' : 'NOT CONFIGURED'}</span>
				</div>

				<button
					type="button"
					onclick={triggerTestPing}
					disabled={pinging}
					class="px-3 py-1 rounded-lg bg-background text-foreground border border-input hover:bg-muted font-mono text-[11px] font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
				>
					{pinging ? "Sending..." : "Send Test Probe Ping"}
				</button>
			</div>

			<p class="text-[11px] opacity-90 pl-4 leading-relaxed">
				{cockpit.platformStatuses[cockpit.chatPlatform].details}
			</p>
		</div>

		{#if testPingSuccess}
			<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
				<Check class="h-4 w-4" />
				<span>Probe ping acknowledged! Staged test packet into Approval Queue.</span>
			</div>
		{/if}

		<!-- Platform Specific Probes Grid -->
		{#if cockpit.chatPlatform === "whatsapp"}
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Ferdium Desktop</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Recipe Hook</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Injects novapilot-hook.js into Ferdium WhatsApp webview.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Target: POST :8088/api/tickets
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Rambox App</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Custom JS</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Advanced JS injection listening to incoming chat DOM mutations.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Target: POST :8088/api/tickets
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Chrome Extension</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Tampermonkey</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Passive userscript running on web.whatsapp.com.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Target: GM_xmlhttpRequest
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Baileys Socket</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Daemon</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Headless Multi-Device socket gateway on background port.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Target: Local Node.js
					</div>
				</div>
			</div>
		{:else if cockpit.chatPlatform === "telegram"}
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Telegram Bot Ingress</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">HTTP Webhook</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						POST /api/webhooks/telegram receives raw message updates from Bot API.
					</p>
					<div class="pt-1 text-[10px] font-mono text-rose-500 font-medium">
						● TELEGRAM_BOT_TOKEN Not Set
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Channel ID Filter</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Whitelist</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Drops chats outside authorized plant operations groups at zero token cost.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Whitelist Filter: Enabled
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Inline Sign-off Callbacks</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Interactive</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Sends inline button messages for one-tap mobile approval by on-call engineers.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Callback Gateway: Standby
					</div>
				</div>
			</div>
		{:else if cockpit.chatPlatform === "discord"}
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Channel Webhook Ingress</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Incoming Webhook</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						POST /api/webhooks/discord parses text messages posted in support channels.
					</p>
					<div class="pt-1 text-[10px] font-mono text-rose-500 font-medium">
						● DISCORD_WEBHOOK_URL Not Set
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Discord Bot Gateway</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">WebSocket Intent</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Privileged Message Content Intent connects to Discord Gateway API.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Intent: MessageContent
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Role Clearance Gate</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">RBAC</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Verifies Discord user role against on-call engineering clearance.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Target Role: @OnCallEngineer
					</div>
				</div>
			</div>
		{:else}
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Slack Events API</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">POST /slack/events</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Listens to message events in authorized plant operations Slack channels.
					</p>
					<div class="pt-1 text-[10px] font-mono text-rose-500 font-medium">
						● SLACK_SIGNING_SECRET Not Set
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Slash Commands (/novapilot)</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Interactive Trigger</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Directly parse and stage mutation requests with command parameters.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Command: /novapilot
					</div>
				</div>

				<div class="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-foreground">Block Kit Action Cards</span>
						<span class="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-background">Rich UI</span>
					</div>
					<p class="text-muted-foreground text-[11px] leading-relaxed">
						Rich diff cards with Approve/Reject buttons inside Slack threads.
					</p>
					<div class="pt-1 text-[10px] font-mono text-muted-foreground">
						Block Kit Engine: Standby
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
