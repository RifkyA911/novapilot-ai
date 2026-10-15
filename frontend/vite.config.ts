import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 3000,
		proxy: {
			// Backend Go API endpoints (Clean Architecture service)
			'/api/tickets': 'http://127.0.0.1:8088',
			'/api/invoices': 'http://127.0.0.1:8088',
			'/api/audit-logs': 'http://127.0.0.1:8088',
			'/api/events': 'http://127.0.0.1:8088',
			'/api/health': 'http://127.0.0.1:8088',
			'/api/telemetry': 'http://127.0.0.1:8088',
			'/api/upload': 'http://127.0.0.1:8088',
			'/api/storage': 'http://127.0.0.1:8088',
			'/api/inbound-messages': 'http://127.0.0.1:8088',
			'/api/learned-patterns': 'http://127.0.0.1:8088',
			'/api/database': 'http://127.0.0.1:8088',
			'/api/mcp': 'http://127.0.0.1:8088',
			'/api/llm': 'http://127.0.0.1:8088',
			'/api/channels': 'http://127.0.0.1:8088',
			'/api/gateway': 'http://127.0.0.1:8088',
			'/api/auto-reply': 'http://127.0.0.1:8088',
			'/uploads': 'http://127.0.0.1:8088',
			// WhatsApp Gateway daemon exec & logs (Bun on port 3002)
			'/api/wa-gateway': {
				target: 'http://127.0.0.1:3002',
				changeOrigin: true,
				rewrite: (path: string) => path.replace(/^\/api\/wa-gateway/, '/api')
			}
			// NOTE: /api/auth is NOT proxied — handled directly by SvelteKit & Better Auth
		}
	},
	ssr: {
		noExternal: ['@tanstack/svelte-table', '@tanstack/table-core']
	}
});
