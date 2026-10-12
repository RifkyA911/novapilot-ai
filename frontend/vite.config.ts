import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 3000,
		proxy: {
			// Backend Go API endpoints (Clean Architecture service)
			'/api/tickets': 'http://localhost:8080',
			'/api/invoices': 'http://localhost:8080',
			'/api/audit-logs': 'http://localhost:8080',
			'/api/events': 'http://localhost:8080',
			'/api/health': 'http://localhost:8080',
			'/api/upload': 'http://localhost:8080',
			'/uploads': 'http://localhost:8080'
			// NOTE: /api/auth is NOT proxied — handled directly by SvelteKit & Better Auth
		}
	}
});
