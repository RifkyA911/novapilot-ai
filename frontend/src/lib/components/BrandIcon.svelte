<script lang="ts">
	let { name, class: className = "h-5 w-5" } = $props<{
		name: "hermes" | "openclaw" | "whatsapp" | "telegram" | "discord" | "slack" | "ollama" | "postgresql";
		class?: string;
	}>();

	const iconMap: Record<string, string> = {
		hermes: "/icons/hermes-agent.svg",
		openclaw: "/icons/openclaw.svg",
		ollama: "/icons/ollama.svg",
		whatsapp: "/icons/whatsapp.svg",
		telegram: "/icons/telegram.svg",
		discord: "/icons/discord.svg",
		slack: "/icons/slack.svg",
		postgresql: "/icons/postgresql.svg"
	};
</script>

<img
	src={iconMap[name] || "/icons/hermes-agent.svg"}
	alt="{name} icon"
	class="{className} object-contain inline-block select-none pointer-events-none"
	loading="lazy"
/>
