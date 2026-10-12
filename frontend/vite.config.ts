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
			'/api/upload': 'http://127.0.0.1:8088',
			'/uploads': 'http://127.0.0.1:8088'
			// NOTE: /api/auth is NOT proxied — handled directly by SvelteKit & Better Auth
		}
	}
});
