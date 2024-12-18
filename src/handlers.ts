import { IncomingMessage, ClientRequest } from 'node:http';
import { spawnSync } from 'child_process';
import path from 'node:path';
import { tmpdir } from 'os';
import fs from 'fs/promises';
import { Rule } from './rules';
import type { ExtensionOptions } from './utils/types';

type BaseHandler = {
	handleRequest: (request: ClientRequest, response: IncomingMessage) => Promise<void>;
};

type ProxyHandler = BaseHandler & {
	transformRequest?: (request: ClientRequest) => Promise<IncomingMessage>;
	transformResponse?: (
		rawBody: Buffer,
		response: IncomingMessage,
		request: ClientRequest
	) => Promise<Buffer | string | undefined>;
};

type ComputeHandler = BaseHandler & {};

const handlerBuildCache: Map<string, Promise<any>> = new Map();

class ProxyHandlerImpl implements ProxyHandler {
	static HINT = 'proxy';

	private handlerName: string;
	private handler: Promise<any>;

	constructor(handlerName: string, handlerPath: string) {
		this.handlerName = handlerName;
		this.handler = buildAndImportHandler(handlerPath).then((handler) => {
			logger.info(`Handler '${handlerName}' built successfully.`);
			return handler;
		});
	}

	get transformRequest() {
		return async (request: ClientRequest) => {
			const handlerModule = await this.handler;
			return handlerModule.transformRequest(request);
		};
	}

	get transformResponse() {
		return async (rawBody: Buffer, response: IncomingMessage, request: ClientRequest) => {
			const handlerModule = await this.handler;
			return handlerModule.transformResponse(rawBody, response, request);
		};
	}

	async handleRequest(request: ClientRequest, response: IncomingMessage) {
		// TODO perhaps this could do the proxy instead of the other extension??
	}
}

class ComputeHandlerImpl implements ComputeHandler {
	static HINT = 'compute';

	async handleRequest(request: ClientRequest, response: IncomingMessage) {
		console.log('ComputeHandler handling request.');
	}
}

export class Handler {
	private _handler: BaseHandler;

	constructor(handler: BaseHandler) {
		this._handler = handler;
	}

	/**
	 * Validate rules and return handlers matching the defined hint types.
	 * @param rules Array of rules to validate
	 * @param config Configuration object
	 * @returns Matched handlers
	 */
	static validateHandlers(rules: Rule[], config: ExtensionOptions['handlers']): Record<string, BaseHandler> {
		const handlerTypes = [ProxyHandlerImpl, ComputeHandlerImpl];

		return rules.reduce(
			(acc, rule) => {
				const handlerName = rule.features?.headers?.set_request_headers?.['+x-cloud-functions-hint'];
				if (!handlerName) return acc;

				const [handlerType, handlerId] = handlerName.split(':');
				if (!handlerType || !handlerId) return acc;

				const MatchedHandler = handlerTypes.find((handler) => handler.HINT === handlerType);

				if (MatchedHandler) {
					const configHandler = config?.[handlerName];
					if (!configHandler) {
						//@ts-ignore
						logger.warn(`Missing handler '${handlerName}' in config.yaml.`);
						return acc;
					}

					acc[handlerName] = new MatchedHandler(handlerName, configHandler);
				}

				return acc;
			},
			{} as Record<string, BaseHandler>
		);
	}
}

async function buildAndImportHandler(handlerPath: string): Promise<any> {
	// Check if the handler is already built and cached
	if (handlerBuildCache.has(handlerPath)) {
		return handlerBuildCache.get(handlerPath);
	}

	// Otherwise, start building and add it to the cache
	const buildPromise = (async () => {
		const tmpOutputPath = path.join(tmpdir(), `handler_${Date.now()}.mjs`);
		handlerPath = path.resolve(handlerPath);

		const buildResult = spawnSync(
			'bun',
			['build', handlerPath, '--target', 'node', '--format', 'esm', '--outfile', tmpOutputPath],
			{
				encoding: 'utf-8',
			}
		);

		if (buildResult.error || buildResult.status !== 0) {
			throw new Error(`Bun build failed: ${buildResult.stderr || buildResult.error?.message}`);
		}

		const module = await import(`file://${tmpOutputPath}`);

		await fs.unlink(tmpOutputPath).catch(() => {});

		return module.default || module;
	})();

	handlerBuildCache.set(handlerPath, buildPromise);

	try {
		const result = await buildPromise;
		return result;
	} catch (err) {
		// Handler import likely failed, delete from cache
		handlerBuildCache.delete(handlerPath);
		throw err;
	}
}
