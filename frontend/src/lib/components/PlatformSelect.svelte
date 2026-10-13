<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { ChevronDown, Check } from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";

	let isOpen = $state(false);
	let selectRef: HTMLDivElement | null = $state(null);

	const platforms = [
		{
			id: "whatsapp" as ChatPlatform,
			name: "WhatsApp",
			sub: "Baileys / Hook",
			icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
		},
		{
			id: "telegram" as ChatPlatform,
			name: "Telegram",
			sub: "Bot API",
			icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
		},
		{
			id: "discord" as ChatPlatform,
			name: "Discord",
			sub: "Webhook / Bot",
			icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png"
		},
		{
			id: "slack" as ChatPlatform,
			name: "Slack",
			sub: "Enterprise Events",
			icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png"
		}
	];

	let activePlatform = $derived(
		platforms.find(p => p.id === cockpit.chatPlatform) || platforms[0]
	);

	function toggleOpen() {
		isOpen = !isOpen;
	}

	function selectPlatform(id: ChatPlatform) {
		cockpit.chatPlatform = id;
		isOpen = false;
	}

	function handleWindowClick(e: MouseEvent) {
		if (selectRef && !selectRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			isOpen = false;
		}
	}

	onMount(() => {
		window.addEventListener("click", handleWindowClick);
		window.addEventListener("keydown", handleKeyDown);
	});

	onDestroy(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener("click", handleWindowClick);
			window.removeEventListener("keydown", handleKeyDown);
		}
	});
</script>

<div class="relative" bind:this={selectRef}>
	<!-- Shadcn-style Select Trigger Button -->
	<button
		type="button"
		onclick={toggleOpen}
		class="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-input bg-background/90 hover:bg-accent/60 text-foreground text-xs font-semibold shadow-2xs flex items-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		title="Active ChatOps Ingestion Platform: {activePlatform.name}"
	>
		<!-- Original Official Platform Logo Icon -->
		<img
			src={activePlatform.icon}
			alt={activePlatform.name}
			class="h-4 w-4 object-contain shrink-0"
		/>
		
		<span class="truncate font-medium">{activePlatform.name}</span>

		<ChevronDown class="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-70 ml-0.5 {isOpen ? 'rotate-180' : ''} transition-transform duration-150" />
	</button>

	<!-- Shadcn-style Popover Menu -->
	{#if isOpen}
		<div
			class="absolute left-0 mt-1.5 w-56 rounded-xl bg-popover border border-border/80 text-popover-foreground shadow-xl p-1 z-50 animate-in fade-in-80 zoom-in-95 duration-150 backdrop-blur-xl"
			role="listbox"
			tabindex="-1"
		>
			<div class="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1">
				ChatOps Ingress Platform
			</div>

			<div class="space-y-0.5">
				{#each platforms as platform}
					<button
						type="button"
						role="option"
						aria-selected={cockpit.chatPlatform === platform.id}
						onclick={() => selectPlatform(platform.id)}
						class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer {cockpit.chatPlatform === platform.id ? 'bg-accent text-accent-foreground font-semibold' : 'hover:bg-muted text-foreground'}"
					>
						<div class="flex items-center gap-2.5 min-w-0">
							<img
								src={platform.icon}
								alt={platform.name}
								class="h-4 w-4 object-contain shrink-0"
							/>
							<div class="flex flex-col text-left min-w-0">
								<span class="truncate text-xs">{platform.name}</span>
								<span class="text-[9px] font-mono text-muted-foreground truncate">{platform.sub}</span>
							</div>
						</div>

						{#if cockpit.chatPlatform === platform.id}
							<Check class="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
