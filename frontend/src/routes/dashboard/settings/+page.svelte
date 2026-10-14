<script lang="ts">
	import { onMount } from "svelte";
	import { 
		AdjustmentsHorizontal, 
		Check, 
		ShieldCheck, 
		CircleStack, 
		ChatBubbleLeftRight, 
		Bell, 
		Eye, 
		CpuChip, 
		LockClosed,
		ArrowPath
	} from "svelte-heros-v2";

	// Settings State
	let pgHost = $state("localhost");
	let pgPort = $state("5432");
	let pgDB = $state("postgres");
	let pgUser = $state("postgres");
	let pgMaxConns = $state(25);
	let pgIdleConns = $state(10);

	let autoReplyEnabled = $state(true);
	let autoOcrEnabled = $state(true);
	let whitelistedGroups = $state("120363001@g.us, 120363002@g.us, 120363003@g.us");

	let highValueThreshold = $state("50000000"); // 50 juta IDR
	let requireSupervisorAboveThreshold = $state(true);
	let blockRawSqlInjection = $state(true);

	let sseEnabled = $state(true);
	let discordWebhook = $state("");
	let telegramBotToken = $state("");

	let compactTable = $state(false);
	let soundAlerts = $state(false);

	let saveSuccess = $state(false);
	let isSaving = $state(false);

	onMount(() => {
		try {
			const saved = localStorage.getItem("novapilot_settings");
			if (saved) {
				const s = JSON.parse(saved);
				if (s.autoReplyEnabled !== undefined) autoReplyEnabled = s.autoReplyEnabled;
				if (s.whitelistedGroups) whitelistedGroups = s.whitelistedGroups;
				if (s.highValueThreshold) highValueThreshold = s.highValueThreshold;
				if (s.compactTable !== undefined) compactTable = s.compactTable;
				if (s.soundAlerts !== undefined) soundAlerts = s.soundAlerts;
			}
		} catch {}
	});

	function saveSettings() {
		isSaving = true;
		try {
			localStorage.setItem("novapilot_settings", JSON.stringify({
				autoReplyEnabled,
				whitelistedGroups,
				highValueThreshold,
				compactTable,
				soundAlerts
			}));
			setTimeout(() => {
				isSaving = false;
				saveSuccess = true;
				setTimeout(() => { saveSuccess = false; }, 3000);
			}, 300);
		} catch {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>System Settings & Gatekeeper Preferences • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full font-sans">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
					<AdjustmentsHorizontal class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						System Settings & Gatekeeper Policies
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Konfigurasi preferensi pipeline, batas threshold mutasi faktur, parameter Dual-DB, dan notifikasi.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2.5">
			<button
				type="button"
				onclick={saveSettings}
				disabled={isSaving}
				class="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
			>
				{#if isSaving}
					<ArrowPath class="h-3.5 w-3.5 animate-spin" />
					<span>Menyimpan...</span>
				{:else if saveSuccess}
					<Check class="h-3.5 w-3.5 text-emerald-400" />
					<span>Tersimpan!</span>
				{:else}
					<span>Simpan Perubahan</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Save Toast Notification -->
	{#if saveSuccess}
		<div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
			<Check class="h-4 w-4 text-emerald-500" />
			<span>Pengaturan sistem dan gatekeeper rules berhasil disimpan ke konfigurasi lokal.</span>
		</div>
	{/if}

	<div class="space-y-6">
		<!-- 1. Gatekeeper Guardrails & Security Policies -->
		<div class="p-6 rounded-3xl border border-border/80 bg-card/70 space-y-4 shadow-xs">
			<div class="flex items-center gap-2 pb-2 border-b border-border/40 text-sm font-bold text-foreground">
				<ShieldCheck class="h-4 w-4 text-emerald-500" />
				<span>Gatekeeper & Kebijakan Mutasi Faktur</span>
			</div>

			<div class="space-y-4 text-xs">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1">
						<label for="high-val-threshold" class="font-semibold text-foreground">Batas Threshold Nilai Faktur Tinggi (Rupiah):</label>
						<input
							id="high-val-threshold"
							type="text"
							bind:value={highValueThreshold}
							class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono font-bold"
						/>
						<p class="text-[11px] text-muted-foreground">
							Faktur dengan nominal di atas batas ini mewajibkan persetujuan ganda (Supervisor Override).
						</p>
					</div>

					<div class="space-y-3 pt-2">
						<label class="flex items-center gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={requireSupervisorAboveThreshold}
								class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
							/>
							<span class="font-semibold text-foreground">Wajibkan Verifikasi Supervisor untuk Faktur Tertutup (CLOSED)</span>
						</label>
						<label class="flex items-center gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={blockRawSqlInjection}
								class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
							/>
							<span class="font-semibold text-foreground">Aktifkan Sanitasi Heuristik Prompt Injection pada Pesan Chat</span>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- 2. ChatOps Ingestion Rules -->
		<div class="p-6 rounded-3xl border border-border/80 bg-card/70 space-y-4 shadow-xs">
			<div class="flex items-center gap-2 pb-2 border-b border-border/40 text-sm font-bold text-foreground">
				<ChatBubbleLeftRight class="h-4 w-4 text-primary" />
				<span>Kanal ChatOps & WhatsApp Gateway</span>
			</div>

			<div class="space-y-4 text-xs">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-3">
						<label class="flex items-center gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={autoReplyEnabled}
								class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
							/>
							<span class="font-semibold text-foreground">Kirim Balasan Otomatis WhatsApp (Auto-Reply Ack)</span>
						</label>
						<p class="text-[11px] text-muted-foreground pl-6">
							Kirim konfirmasi penerimaan tiket dan estimasi penanganan langsung ke grup WhatsApp asal.
						</p>

						<label class="flex items-center gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={autoOcrEnabled}
								class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
							/>
							<span class="font-semibold text-foreground">Eksekusi OCR Otomatis pada Lampiran Gambar (Tesseract.js)</span>
						</label>
					</div>

					<div class="space-y-1">
						<label for="wa-whitelist-groups" class="font-semibold text-foreground">Daftar Whitelist Grup WhatsApp (JID, pisahkan koma):</label>
						<textarea
							id="wa-whitelist-groups"
							bind:value={whitelistedGroups}
							rows={3}
							class="w-full p-2.5 rounded-lg border border-input bg-background text-xs font-mono"
						></textarea>
						<p class="text-[11px] text-muted-foreground">
							Hanya grup dengan JID di atas yang akan diproses tiketnya oleh bot gateway. Kosongkan untuk menerima semua grup.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- 3. Dual-DB Connection Profiles -->
		<div class="p-6 rounded-3xl border border-border/80 bg-card/70 space-y-4 shadow-xs">
			<div class="flex items-center gap-2 pb-2 border-b border-border/40 text-sm font-bold text-foreground">
				<CircleStack class="h-4 w-4 text-amber-500" />
				<span>Profil Koneksi Database Sistem (DB 1)</span>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
				<div class="space-y-1">
					<label for="pg-cfg-host" class="font-semibold text-muted-foreground">Host:</label>
					<input id="pg-cfg-host" type="text" bind:value={pgHost} class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono" />
				</div>
				<div class="space-y-1">
					<label for="pg-cfg-port" class="font-semibold text-muted-foreground">Port:</label>
					<input id="pg-cfg-port" type="text" bind:value={pgPort} class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono" />
				</div>
				<div class="space-y-1">
					<label for="pg-cfg-db" class="font-semibold text-muted-foreground">Database:</label>
					<input id="pg-cfg-db" type="text" bind:value={pgDB} class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono" />
				</div>
				<div class="space-y-1">
					<label for="pg-cfg-conns" class="font-semibold text-muted-foreground">Max Open Conns:</label>
					<input id="pg-cfg-conns" type="number" bind:value={pgMaxConns} class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono" />
				</div>
			</div>
		</div>

		<!-- 4. Tampilan & Audio Feedback -->
		<div class="p-6 rounded-3xl border border-border/80 bg-card/70 space-y-4 shadow-xs">
			<div class="flex items-center gap-2 pb-2 border-b border-border/40 text-sm font-bold text-foreground">
				<Eye class="h-4 w-4 text-purple-500" />
				<span>Preferensi Cockpit & Antarmuka</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
				<label class="flex items-center gap-2.5 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={compactTable}
						class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
					/>
					<div>
						<div class="font-semibold text-foreground">Mode Tabel Ramping (Compact View)</div>
						<div class="text-[11px] text-muted-foreground">Kurangi padding baris pada daftar antrean dan log pesan.</div>
					</div>
				</label>

				<label class="flex items-center gap-2.5 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={soundAlerts}
						class="h-4 w-4 rounded border-input text-primary focus:ring-primary"
					/>
					<div>
						<div class="font-semibold text-foreground">Efek Suara Notifikasi (Audio Cue)</div>
						<div class="text-[11px] text-muted-foreground">Bunyikan nada lembut saat tiket baru masuk ke antrean.</div>
					</div>
				</label>
			</div>
		</div>
	</div>
</div>
