export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.quu4U7Ay.js",app:"_app/immutable/entry/app.wfpwVolq.js",imports:["_app/immutable/entry/start.quu4U7Ay.js","_app/immutable/chunks/BsO9BuoE.js","_app/immutable/chunks/Bsr-plSo.js","_app/immutable/chunks/CUjOhvwA.js","_app/immutable/chunks/CAd8Keme.js","_app/immutable/entry/app.wfpwVolq.js","_app/immutable/chunks/Bsr-plSo.js","_app/immutable/chunks/BwHivz_D.js","_app/immutable/chunks/BBY5v3g2.js","_app/immutable/chunks/CAd8Keme.js","_app/immutable/chunks/vKgzRqgm.js","_app/immutable/chunks/BZauFHss.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/auth",
				pattern: /^\/auth\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
