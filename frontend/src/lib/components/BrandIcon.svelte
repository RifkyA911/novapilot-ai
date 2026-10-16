<script lang="ts">
	export type BrandIconName = 
		| "hermes" 
		| "openclaw" 
		| "whatsapp" 
		| "telegram" 
		| "discord" 
		| "slack" 
		| "ollama" 
		| "postgresql"
		| "oracle"
		| "sap"
		| "mysql"
		| "mssql"
		| "sqlite"
		| "mongodb"
		| "redis"
		| "rest"
		| "custom_rest";

	let { name, class: className = "h-5 w-5" } = $props<{
		name: BrandIconName | string;
		class?: string;
	}>();

	const imgMap: Record<string, string> = {
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

{#if name === "oracle"}
	<!-- Official Oracle Brand Vector -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Oracle">
		<rect width="24" height="24" rx="5" fill="#f80000" fill-opacity="0.12" />
		<path d="M12 4C7.03 4 3 7.58 3 12s4.03 8 9 8 9-3.58 9-8-4.03-8-9-8zm0 13c-3.31 0-6-2.24-6-5s2.69-5 6-5 6 2.24 6 5-2.69 5-6 5z" fill="#f80000" />
	</svg>
{:else if name === "sap"}
	<!-- Official SAP S/4HANA Vector -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SAP">
		<rect width="24" height="24" rx="5" fill="#008fd3" fill-opacity="0.12" />
		<path d="M2 5h10l8 7-8 7H2V5z" fill="#008fd3" />
		<text x="5" y="14" fill="#ffffff" font-size="7" font-weight="900" font-family="sans-serif">SAP</text>
	</svg>
{:else if name === "mysql"}
	<!-- Official MySQL Dolphin Vector -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MySQL">
		<rect width="24" height="24" rx="5" fill="#00758f" fill-opacity="0.12" />
		<path d="M18.8 9.3c-.6-.7-1.4-1.2-2.3-1.4.1-.4.2-.8.2-1.2 0-1.8-1.5-3.2-3.3-3.2-.8 0-1.5.3-2.1.8-.4-.3-.9-.4-1.5-.4-1.4 0-2.5 1.1-2.5 2.5 0 .3.1.6.2.8C6.3 7.7 5.2 8.9 4.6 10.3c-.8 1.9-.6 4 .5 5.7.9 1.4 2.4 2.4 4 2.8 2.6.7 5.4.1 7.6-1.4.7-.5 1.3-1.1 1.8-1.8.8-1.1 1.1-2.5.8-3.8-.1-.9-.5-1.7-1.1-2.4l.6-.1z" fill="#00758f" />
		<path d="M14.5 15.2c-1.8 1.2-4.1 1.7-6.2 1.1-1.3-.3-2.4-1.1-3.2-2.2-.8-1.3-1-3-.3-4.5.5-1.1 1.4-2 2.5-2.5" stroke="#f29111" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === "mssql"}
	<!-- Official Microsoft SQL Server Vector -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Microsoft SQL Server">
		<rect width="24" height="24" rx="5" fill="#cc292b" fill-opacity="0.12" />
		<path d="M4 6c0-1.1 3.58-2 8-2s8 .9 8 2v4c0 1.1-3.58 2-8 2s-8-.9-8-2V6z" fill="#cc292b" />
		<path d="M4 10c0 1.1 3.58 2 8 2s8-.9 8-2v4c0 1.1-3.58 2-8 2s-8-.9-8-2v-4z" fill="#cc292b" fill-opacity="0.8" />
		<path d="M4 14c0 1.1 3.58 2 8 2s8-.9 8-2v4c0 1.1-3.58 2-8 2s-8-.9-8-2v-4z" fill="#cc292b" fill-opacity="0.6" />
	</svg>
{:else if name === "sqlite"}
	<!-- Official SQLite Feather Vector -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SQLite">
		<rect width="24" height="24" rx="5" fill="#003b57" fill-opacity="0.12" />
		<path d="M6 19.5c6-2 11-7 13-14-3 1-8 4-11 7-2 2-3 4-2 7z" fill="#003b57" />
		<path d="M7 18c3-3 7-6 10-8" stroke="#37a7df" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === "mongodb"}
	<!-- Official MongoDB Leaf Vector -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MongoDB">
		<rect width="24" height="24" rx="5" fill="#13aa52" fill-opacity="0.12" />
		<path d="M12 2C11.5 3 7 7.5 7 13.5c0 4 3 6.8 5 8.5 2-1.7 5-4.5 5-8.5C17 7.5 12.5 3 12 2z" fill="#13aa52" />
		<path d="M12 2v20" stroke="#ffffff" stroke-width="1" stroke-linecap="round" />
	</svg>
{:else if name === "redis"}
	<!-- Official Redis Layers Vector -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Redis">
		<rect width="24" height="24" rx="5" fill="#d82c20" fill-opacity="0.12" />
		<path d="M12 3L3 7.5 12 12l9-4.5L12 3z" fill="#d82c20" />
		<path d="M3 11.5l9 4.5 9-4.5M3 15.5l9 4.5 9-4.5" stroke="#d82c20" stroke-width="1.5" stroke-linecap="round" />
	</svg>
{:else if name === "rest" || name === "custom_rest"}
	<!-- REST API / GraphQL Vector -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="REST API">
		<rect width="24" height="24" rx="5" fill="#8b5cf6" fill-opacity="0.12" />
		<circle cx="12" cy="12" r="8" stroke="#8b5cf6" stroke-width="1.6" />
		<path d="M4 12h16M12 4a12 12 0 0 1 0 16 12 12 0 0 1 0-16" stroke="#8b5cf6" stroke-width="1.4" />
	</svg>
{:else if name === "postgresql"}
	<img
		src="/icons/postgresql.svg"
		alt="PostgreSQL"
		class="{className} object-contain inline-block select-none pointer-events-none shrink-0"
		loading="lazy"
	/>
{:else if imgMap[name]}
	<img
		src={imgMap[name]}
		alt="{name} icon"
		class="{className} object-contain inline-block select-none pointer-events-none shrink-0"
		loading="lazy"
	/>
{:else}
	<!-- Generic Database Cylinder Fallback -->
	<svg viewBox="0 0 24 24" class="{className} inline-block select-none pointer-events-none shrink-0 text-primary" fill="none" stroke="currentColor" stroke-width="1.8">
		<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
	</svg>
{/if}
