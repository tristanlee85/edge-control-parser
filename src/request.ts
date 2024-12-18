import { parse } from 'cookie';

export class RequestContext {
	private obj;
	private request;

	constructor(obj) {
		this.obj = obj;

		this.request = {
			get(value) {
				// console.log(">> Get request param:", value)
				return obj[value];
			},

			cookie: {
				get(value) {
					// console.log(">> Get request cookie:", value)
					return obj.cookies.get(value);
				},
			},

			header: {
				get(value) {
					// console.log(">> Get request header:", value)
					return obj.headers.get(value);
				},
			},

			origin_query: {
				get(value) {
					return new URLSearchParams(obj.path).get(value);
				},
			},
		};
	}

	// See https://docs.harperdb.io/docs/developers/components/writing-extensions#module-initialization
	static fromRequest(request: any) {
		const { protocol: scheme, method, pathname: path, headers } = request;
		const cookies = new Map(Object.entries(parse(headers.get('cookie') || '')));

		return new RequestContext({
			scheme,
			path,
			method,
			headers,
			cookies,
		});
	}

	resolveKey(key) {
		let resolved;

		Object.entries(key).forEach(([name, value]) => {
			resolved = name
				.split('.')
				.reduce((a, b) => a[b], this)
				.get(value);
		});

		return resolved;
	}
}
