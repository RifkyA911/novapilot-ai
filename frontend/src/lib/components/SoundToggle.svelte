<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		SpeakerWave, 
		SpeakerXMark, 
		AdjustmentsHorizontal, 
		Check, 
		MusicalNote, 
		CursorArrowRays, 
		XMark 
	} from "svelte-heros-v2";
	import { sound } from "$lib/audio";

	let isSoundEnabled = $state(sound.enabled);
	let isNavSoundEnabled = $state(sound.navEnabled);
	let volumePercent = $state(Math.round(sound.volume * 100));
	let popoverOpen = $state(false);

	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		unsubscribe = sound.subscribe(() => {
			isSoundEnabled = sound.enabled;
			isNavSoundEnabled = sound.navEnabled;
			volumePercent = Math.round(sound.volume * 100);
		});
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	function toggle() {
		sound.enabled = !sound.enabled;
		if (sound.enabled) {
			sound.playNavClick();
		}
	}

	function handleVolumeChange(e: Event) {
		const val = Number((e.target as HTMLInputElement).value);
		volumePercent = val;
		sound.volume = val / 100;
	}

	function toggleNavSound() {
		sound.navEnabled = !sound.navEnabled;
		if (sound.navEnabled) {
			sound.playNavClick();
		}
	}

	function testPing() {
		sound.playInboundPing();
	}

	function testNavClick() {
		sound.playNavClick();
	}

	function closePopover() {
		popoverOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest(".sound-control-wrapper")) {
			popoverOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative inline-flex items-center sound-control-wrapper">
	<!-- Primary Sound Toggle Button (Left Click = Toggle Mute) -->
	<div class="inline-flex items-center rounded-lg border border-border/80 bg-background hover:bg-secondary transition-all shadow-2xs">
		<button
			type="button"
			onclick={toggle}
			class="h-9 px-2.5 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all cursor-pointer relative"
			title={isSoundEnabled ? "Sound Aktif (Klik untuk Mute)" : "Sound Muted (Klik untuk Aktifkan)"}
			aria-label="Toggle Sound"
		>
			{#if isSoundEnabled}
				<SpeakerWave class="h-4 w-4 text-primary shrink-0" />
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
			{:else}
				<SpeakerXMark class="h-4 w-4 opacity-50 shrink-0" />
				<span class="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
			{/if}
		</button>

		<!-- Divider -->
		<div class="w-px h-5 bg-border/60"></div>

		<!-- Quick Config Popover Trigger -->
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				popoverOpen = !popoverOpen;
			}}
			class="h-9 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-r-lg transition-colors cursor-pointer flex items-center justify-center"
			title="Pengaturan Audio & Navigasi"
			aria-label="Audio Configuration"
		>
			<AdjustmentsHorizontal class="h-3.5 w-3.5" />
		</button>
	</div>

	<!-- Quick Audio Config Popover Modal -->
	{#if popoverOpen}
		<div 
			class="absolute right-0 top-11 w-72 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3 font-sans"
			role="dialog"
		>
			<!-- Header -->
			<div class="flex items-center justify-between pb-2 border-b border-border/50">
				<div class="flex items-center gap-2">
					<MusicalNote class="h-4 w-4 text-primary" />
					<span class="text-xs font-bold text-foreground">Pengaturan Efek Suara</span>
				</div>
				<button
					type="button"
					onclick={closePopover}
					class="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
				>
					<XMark class="h-3.5 w-3.5" />
				</button>
			</div>

			<!-- Master Mute Toggle -->
			<div class="flex items-center justify-between py-1">
				<span class="text-xs font-medium text-foreground">Master Audio</span>
				<button
					type="button"
					onclick={toggle}
					class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer {isSoundEnabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}"
				>
					{isSoundEnabled ? "AKTIF" : "MUTED"}
				</button>
			</div>

			<!-- Volume Slider -->
			<div class="space-y-1.5 py-1">
				<div class="flex items-center justify-between text-xs">
					<span class="text-muted-foreground">Volume Level</span>
					<span class="font-mono font-bold text-foreground">{volumePercent}%</span>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					step="5"
					value={volumePercent}
					oninput={handleVolumeChange}
					disabled={!isSoundEnabled}
					class="w-full h-1.5 rounded-lg bg-secondary appearance-none cursor-pointer accent-primary disabled:opacity-40"
				/>
			</div>

			<!-- Menu Nav Sound Toggle -->
			<div class="p-2.5 rounded-xl bg-secondary/40 border border-border/50 space-y-1">
				<label class="flex items-center justify-between cursor-pointer">
					<div class="flex items-center gap-2">
						<CursorArrowRays class="h-3.5 w-3.5 text-primary" />
						<span class="text-xs font-medium text-foreground">Suara Klik Navigasi</span>
					</div>
					<input
						type="checkbox"
						checked={isNavSoundEnabled}
						onchange={toggleNavSound}
						disabled={!isSoundEnabled}
						class="h-4 w-4 rounded border-input text-primary focus:ring-primary shrink-0 cursor-pointer disabled:opacity-40"
					/>
				</label>
				<p class="text-[10px] text-muted-foreground pl-5.5">
					Haptic micro-click halus saat berpindah menu sidebar &amp; navigasi.
				</p>
			</div>

			<!-- Test Sound Buttons -->
			<div class="grid grid-cols-2 gap-2 pt-1">
				<button
					type="button"
					onclick={testPing}
					disabled={!isSoundEnabled}
					class="h-7 px-2 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary text-[11px] font-medium text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
				>
					<SpeakerWave class="h-3 w-3 text-emerald-500" />
					<span>Uji Ping</span>
				</button>
				<button
					type="button"
					onclick={testNavClick}
					disabled={!isSoundEnabled || !isNavSoundEnabled}
					class="h-7 px-2 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary text-[11px] font-medium text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
				>
					<CursorArrowRays class="h-3 w-3 text-primary" />
					<span>Uji Klik</span>
				</button>
			</div>
		</div>
	{/if}
</div>
