<script lang="ts">
	import { onMount } from "svelte";
	import { 
		GlobeAlt, 
		CommandLine, 
		ComputerDesktop, 
		Sparkles, 
		CpuChip, 
		ShieldCheck, 
		CheckCircle, 
		ArrowPath, 
		Bolt, 
		ClipboardDocument, 
		Check, 
		Play, 
		ArrowTopRightOnSquare, 
		Server, 
		CodeBracket, 
		ChatBubbleLeftRight, 
		ExclamationTriangle,
		InformationCircle
	} from "svelte-heros-v2";
	import { cockpit } from "$lib/cockpit.svelte";
	import { sound } from "$lib/audio";
	import BrandIcon from "$lib/components/BrandIcon.svelte";

	// OpenClaw Gateway Configuration
	let gatewayUrl = $state("http://127.0.0.1:18789");
	let cdpPort = $state(9222);
	let browserMode = $state<"headless" | "headed">("headless");
	let maxConcurrentTasks = $state(4);
	let hitlSafetyGate = $state(true);

	// Gateway Probe Status (Real HTTP ping, not a fake timer)
	let isProbing = $state(false);
	let gatewayOnline = $state(false);
	let probeLatencyMs = $state<number | null>(null);
	let probeError = $state<string | null>(null);

	// Test Dispatcher State
	let selectedTaskIndex = $state(0);
	let customPrompt = $state("");
	let isDispatching = $state(false);
	let dispatchSuccess = $state<string | null>(null);
	let dispatchError = $state<string | null>(null);

	let stagingLoading = $state(false);
	let stagingSuccess = $state<string | null>(null);
	let stagingError = $state<string | null>(null);

	let copiedField = $state<string | null>(null);

	// Real-world Enterprise Task Registry for OpenClaw
	const taskRegistry = [
		{
			id: "TASK-DJP-01",
			name: "Validasi e-Faktur Pajak DJP",
			category: "TAX_VERIFICATION",
			targetUrl: "https://efaktur.pajak.go.id",
			defaultPrompt: "Buka portal e-Faktur DJP, verifikasi keabsahan faktur INV/2026/001 dan konfirmasi identitas NPWP PT Sumber Makmur Abadi.",
			channels: ["whatsapp", "telegram"],
			docNo: "INV/2026/001",
			proposedValue: "PT Sumber Makmur Abadi",
			requiresBrowser: true
		},
		{
			id: "TASK-ERP-02",
			name: "Cek Delivery Order Vendor ERP",
			category: "SUPPLY_CHAIN",
			targetUrl: "https://vendor-portal.internal.corp/deliveries",
			defaultPrompt: "Akses portal supplier ERP, periksa status nomor resi pengiriman DO/2026/0889 dan catat estimasi tanggal tiba.",
			channels: ["whatsapp"],
			docNo: "DO/2026/0889",
			proposedValue: "Ekspedisi Logistik Utama",
			requiresBrowser: true
		},
		{
			id: "TASK-BANK-03",
			name: "Rekonsiliasi Mutasi Rekening",
			category: "FINANCIAL_AUDIT",
			targetUrl: "https://ibanking.bank-mandiri.staging/mutasi",
			defaultPrompt: "Periksa mutasi kredit rekening harian untuk memastikan pelunasan invoice INV/2026/001 senilai Rp 145.000.000.",
			channels: ["slack", "telegram"],
			docNo: "INV/2026/001",
			proposedValue: "Rp 145.000.000 (Lunas)",
			requiresBrowser: true
		},
		{
			id: "TASK-DISPATCH-04",
			name: "Distribusi Status Omnichannel",
			category: "MULTI_CHANNEL_NOTIFY",
			targetUrl: "http://127.0.0.1:18789/dispatch",
			defaultPrompt: "Kirim ringkasan tiket persetujuan ke channel branch WhatsApp & Telegram regional secara serentak.",
			channels: ["whatsapp", "telegram", "discord", "slack"],
			docNo: "NOTIF/2026/012",
			proposedValue: "Branch Notification Hub",
			requiresBrowser: false
		}
	];

	async function probeGateway() {
		isProbing = true;
		probeError = null;
		sound.playNavClick();
		const start = performance.now();

		try {
			// Real probe to the OpenClaw gateway HTTP endpoint
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 2000);

			await fetch(`${gatewayUrl}/health`, {
				method: "GET",
				signal: controller.signal,
				mode: "no-cors"
			});

			clearTimeout(timeoutId);
			probeLatencyMs = Math.round(performance.now() - start);
			gatewayOnline = true;
			sound.playActionChime();
		} catch (e: any) {
			probeLatencyMs = null;
			gatewayOnline = false;
			probeError = e.name === "AbortError" 
				? "Timeout: Gateway tidak merespons dalam 2000ms" 
				: `Tidak dapat terhubung ke ${gatewayUrl}`;
		} finally {
			isProbing = false;
		}
	}

	function copyToClipboard(text: string, fieldName: string) {
		navigator.clipboard.writeText(text);
		copiedField = fieldName;
		sound.playNavClick();
		setTimeout(() => (copiedField = null), 2000);
	}

	function selectTask(index: number) {
		selectedTaskIndex = index;
		customPrompt = taskRegistry[index].defaultPrompt;
		dispatchSuccess = null;
		dispatchError = null;
		stagingSuccess = null;
		stagingError = null;
		sound.playNavClick();
	}

	async function dispatchTaskToOpenClaw() {
		const currentTask = taskRegistry[selectedTaskIndex];
		const promptText = customPrompt.trim() || currentTask.defaultPrompt;
		isDispatching = true;
		dispatchSuccess = null;
		dispatchError = null;
		stagingSuccess = null;
		stagingError = null;
		sound.playNavClick();

		try {
			if (!gatewayOnline) {
				// Transparent, honest message when gateway is offline
				dispatchError = `OpenClaw Gateway (${gatewayUrl}) sedang offline. Jalankan service OpenClaw di terminal terlebih dahulu, atau langsung simpan ke Approval Queue NovaPilot di bawah.`;
				return;
			}

			// Actual POST to OpenClaw Gateway API
			const res = await fetch(`${gatewayUrl}/api/v1/tasks`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					task_id: currentTask.id,
					action: currentTask.category,
					prompt: promptText,
					target_url: currentTask.targetUrl,
					browser_mode: browserMode,
					cdp_port: cdpPort,
					require_hitl: hitlSafetyGate
				})
			});

			if (res.ok) {
				const json = await res.json();
				dispatchSuccess = `Tugas berhasil dikirim ke OpenClaw Gateway (Task ID: ${json.id || currentTask.id}).`;
				sound.playActionChime();
			} else {
				const err = await res.text();
				dispatchError = `OpenClaw Gateway menolak request: ${err || res.statusText}`;
			}
		} catch (e: any) {
			dispatchError = `Gagal mengirim request ke OpenClaw: ${e.message}`;
		} finally {
			isDispatching = false;
		}
	}

	async function stageTaskToNovaPilot() {
		const currentTask = taskRegistry[selectedTaskIndex];
		const promptText = customPrompt.trim() || currentTask.defaultPrompt;
		stagingLoading = true;
		stagingSuccess = null;
		stagingError = null;
		sound.playNavClick();

		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: `[OpenClaw: ${currentTask.name}] ${promptText}`,
					branch_id: 1,
					channel: currentTask.channels[0] || "whatsapp",
					document_no: currentTask.docNo,
					proposed_value: currentTask.proposedValue
				})
			});
			const json = await res.json();
			if (res.ok) {
				stagingSuccess = `Tiket otonom #${json.ticket_no || 'STAGED'} berhasil dimasukkan ke PostgreSQL Approval Queue!`;
				sound.playActionChime();
				cockpit.fetchTickets();
			} else {
				stagingError = json.error || "Gagal memasukkan tiket ke antrian database";
			}
		} catch (e: any) {
			stagingError = e.message;
		} finally {
			stagingLoading = false;
		}
	}

	onMount(() => {
		customPrompt = taskRegistry[0].defaultPrompt;
		// Initial honest probe
		probeGateway();
	});
</script>

<div class="space-y-6 font-sans">
	<!-- ========================================================================= -->
	<!-- 1. HONEST TELEMETRY & SERVICE STATUS                                      -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
		<!-- 1. OpenClaw Gateway Status -->
		<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1.5">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Gateway Service</span>
				<BrandIcon name="openclaw" class="h-4 w-4" />
			</div>
			<div class="text-sm font-semibold flex items-center gap-1.5 font-mono">
				{#if gatewayOnline}
					<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
					<span class="text-emerald-600 dark:text-emerald-400">ONLINE</span>
					{#if probeLatencyMs !== null}
						<span class="text-[11px] text-muted-foreground font-normal">({probeLatencyMs}ms)</span>
					{/if}
				{:else}
					<span class="h-2 w-2 rounded-full bg-amber-500"></span>
					<span class="text-amber-600 dark:text-amber-400">DISCONNECTED</span>
				{/if}
			</div>
			<div class="text-[11px] text-muted-foreground font-mono truncate">
				{gatewayUrl}
			</div>
		</div>

		<!-- 2. Browser CDP Connection -->
		<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1.5">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Browser Driver</span>
				<ComputerDesktop class="h-4 w-4 text-muted-foreground" />
			</div>
			<div class="text-sm font-semibold text-foreground font-mono">
				Playwright Chromium
			</div>
			<div class="text-[11px] text-muted-foreground font-mono">
				Port {cdpPort} • Mode: {browserMode}
			</div>
		</div>

		<!-- 3. Safety Approval Gate -->
		<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1.5">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Supervisor Gate</span>
				<ShieldCheck class="h-4 w-4 text-emerald-500" />
			</div>
			<div class="text-sm font-semibold text-foreground flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
				HITL Enforcement
			</div>
			<div class="text-[11px] text-muted-foreground">
				Persetujuan ganda operator sebelum mutasi
			</div>
		</div>

		<!-- 4. Max Concurrent Workers -->
		<div class="p-4 rounded-xl bg-card border border-border shadow-xs space-y-1.5">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Task Capacity</span>
				<Server class="h-4 w-4 text-muted-foreground" />
			</div>
			<div class="text-sm font-semibold text-foreground font-mono">
				{maxConcurrentTasks} Worker Slots
			</div>
			<div class="text-[11px] text-muted-foreground">
				Isolated browser context pool
			</div>
		</div>
	</div>

	<!-- Honest Warning if OpenClaw is Disconnected -->
	{#if !gatewayOnline}
		<div class="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div class="flex items-start gap-2.5">
				<InformationCircle class="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
				<div class="space-y-0.5">
					<div class="font-semibold text-foreground">
						OpenClaw Gateway belum terdeteksi aktif di {gatewayUrl}
					</div>
					<p class="text-muted-foreground leading-relaxed">
						NovaPilot siap mengintegrasikan alur tugas otonom. Untuk mengaktifkan eksekusi browser Playwright lokal, jalankan perintah berikut di terminal:
					</p>
					<div class="mt-1 font-mono text-[11px] bg-background/80 px-2.5 py-1 rounded border border-border inline-block text-foreground">
						npm install -g openclaw && openclaw gateway --port 18789
					</div>
				</div>
			</div>
			<button
				type="button"
				onclick={probeGateway}
				disabled={isProbing}
				class="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
			>
				<ArrowPath class="h-3.5 w-3.5 {isProbing ? 'animate-spin' : ''}" />
				<span>{isProbing ? 'Mengecek...' : 'Cek Ulang Koneksi'}</span>
			</button>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. CONFIGURATION & ENVIRONMENT SETUP                                      -->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
		<div class="flex items-center justify-between border-b border-border/60 pb-3">
			<div>
				<h3 class="text-sm font-semibold text-foreground">Konfigurasi Gateway &amp; Driver Browser</h3>
				<p class="text-xs text-muted-foreground">Parameter koneksi ke service OpenClaw dan instance headless browser.</p>
			</div>
			<button
				type="button"
				onclick={probeGateway}
				disabled={isProbing}
				class="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
			>
				<ArrowPath class="h-3.5 w-3.5 {isProbing ? 'animate-spin' : ''}" />
				<span>Test Endpoint</span>
			</button>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
			<div class="space-y-1">
				<label for="gatewayInput" class="font-medium text-muted-foreground">Gateway URL (HTTP / WebSocket)</label>
				<input
					id="gatewayInput"
					type="text"
					bind:value={gatewayUrl}
					class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
					placeholder="http://127.0.0.1:18789"
				/>
			</div>

			<div class="space-y-1">
				<label for="cdpPortInput" class="font-medium text-muted-foreground">Playwright CDP Port</label>
				<input
					id="cdpPortInput"
					type="number"
					bind:value={cdpPort}
					class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
					placeholder="9222"
				/>
			</div>

			<div class="space-y-1">
				<label for="browserModeSelect" class="font-medium text-muted-foreground">Mode Browser Chromium</label>
				<select
					id="browserModeSelect"
					bind:value={browserMode}
					class="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
				>
					<option value="headless">Headless (Background Service)</option>
					<option value="headed">Headed (Jendela Browser Terlihat)</option>
				</select>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. AUTONOMOUS TASKS REGISTRY & DISPATCHER                                 -->
	<!-- ========================================================================= -->
	<div class="grid lg:grid-cols-12 gap-6 items-start">
		<!-- Left: Task Registry Table (7 Cols) -->
		<div class="lg:col-span-7 space-y-4">
			<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-3">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-semibold text-foreground">Daftar Tugas Otonom (Task Registry)</h3>
						<p class="text-xs text-muted-foreground">Pilih skenario tugas untuk pengujian automasi atau staging ke approval queue.</p>
					</div>
					<span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
						{taskRegistry.length} HANDLERS
					</span>
				</div>

				<div class="divide-y divide-border/60 border border-border/80 rounded-lg overflow-hidden">
					{#each taskRegistry as task, i}
						<button
							type="button"
							onclick={() => selectTask(i)}
							class="w-full p-3 text-left transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer {selectedTaskIndex === i ? 'bg-muted/70 font-medium' : 'hover:bg-muted/30 bg-card'}"
						>
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-mono text-[11px] text-muted-foreground">{task.id}</span>
									<span class="font-semibold text-foreground">{task.name}</span>
									{#if task.requiresBrowser}
										<span class="text-[10px] px-1.5 py-0.2 rounded font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
											Browser
										</span>
									{:else}
										<span class="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
											Socket Hub
										</span>
									{/if}
								</div>
								<div class="text-[11px] text-muted-foreground font-mono truncate">
									Target: {task.targetUrl}
								</div>
							</div>

							<div class="flex items-center gap-1 shrink-0">
								{#each task.channels as ch}
									<BrandIcon name={ch as any} class="h-3.5 w-3.5" />
								{/each}
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Right: Dispatch Console & Approval Staging (5 Cols) -->
		<div class="lg:col-span-5 space-y-4">
			<div class="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4">
				<div class="flex items-center justify-between border-b border-border/60 pb-3">
					<div class="flex items-center gap-2">
						<CommandLine class="h-4 w-4 text-muted-foreground" />
						<h3 class="text-sm font-semibold text-foreground">Task Dispatch &amp; Staging</h3>
					</div>
					<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
						{taskRegistry[selectedTaskIndex].id}
					</span>
				</div>

				<div class="space-y-2 text-xs">
					<label for="taskInstructionInput" class="font-medium text-muted-foreground block">
						Instruksi Tugas (Prompt Eksekusi)
					</label>
					<textarea
						id="taskInstructionInput"
						bind:value={customPrompt}
						rows="4"
						class="w-full p-2.5 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed resize-none"
					></textarea>
				</div>

				<!-- Target Params Metadata Box -->
				<div class="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-1.5 text-xs font-mono">
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Document Ref:</span>
						<span class="font-semibold text-foreground">{taskRegistry[selectedTaskIndex].docNo}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Proposed Value:</span>
						<span class="font-semibold text-foreground">{taskRegistry[selectedTaskIndex].proposedValue}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Safety Mode:</span>
						<span class="text-emerald-600 dark:text-emerald-400 font-medium">HITL Required (No Direct DB Write)</span>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="space-y-2 pt-1">
					<div class="grid grid-cols-2 gap-2">
						<button
							type="button"
							onclick={dispatchTaskToOpenClaw}
							disabled={isDispatching}
							class="h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
						>
							<Play class="h-3.5 w-3.5 text-primary" />
							<span>{isDispatching ? 'Mengirim...' : 'Kirim ke OpenClaw'}</span>
						</button>

						<button
							type="button"
							onclick={stageTaskToNovaPilot}
							disabled={stagingLoading}
							class="h-9 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
						>
							<Bolt class="h-3.5 w-3.5" />
							<span>{stagingLoading ? 'Menyimpan...' : 'Stage ke Approval'}</span>
						</button>
					</div>

					{#if dispatchSuccess}
						<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
							<CheckCircle class="h-4 w-4 shrink-0" />
							<span>{dispatchSuccess}</span>
						</div>
					{/if}

					{#if dispatchError}
						<div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
							<ExclamationTriangle class="h-4 w-4 shrink-0 mt-0.5" />
							<span>{dispatchError}</span>
						</div>
					{/if}

					{#if stagingSuccess}
						<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
							<CheckCircle class="h-4 w-4 shrink-0" />
							<span>{stagingSuccess}</span>
						</div>
					{/if}

					{#if stagingError}
						<div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
							<ExclamationTriangle class="h-4 w-4 shrink-0" />
							<span>{stagingError}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
