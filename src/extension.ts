import assert from 'node:assert';
import { EdgeControlParser } from './parser.js';
import { RequestContext } from './request.js';
import type { Rule } from './rules.js';
import { deepMerge } from './utils/deepMerge.js';
import { Handler } from './handlers.js';
import type { ExtensionOptions } from './utils/types.js';
import './globals.js';

/**
 * Assert that a given option is a specific type.
 * @param {string} name The name of the option.
 * @param {any=} option The option value.
 * @param {string} expectedType The expected type (i.e. `'string'`, `'number'`, `'boolean'`, etc.).
 */
function assertType(name: string, option: any, expectedType: string) {
	if (option) {
		const found = typeof option;
		assert.strictEqual(found, expectedType, `${name} must be type ${expectedType}. Received: ${found}`);
	}
}

/**
 * Resolves the incoming extension options into a config for use throughout the extension.
 * @param {ExtensionOptions} options - The options object to be resolved into a configuration.
 * @returns {Required<ExtensionOptions>}
 */
function resolveConfig(options: ExtensionOptions) {
	assertType('edgeControlPath', options.edgeControlPath, 'string');
	assertType('handlers', options.handlers, 'object');

	if (options.handlers) {
		Object.entries(options.handlers).forEach(([key, value]) => {
			assertType(key, value, 'string');
		});
	}

	return {
		edgeControlPath: options.edgeControlPath,
		handlers: options.handlers,
	};
}

/**
 * This method is executed once, on the main thread, and is responsible for
 * returning a Resource Extension that will subsequently be executed once,
 * on the main thread.
 *
 * The Resource Extension is responsible for...
 *
 * @param {ExtensionOptions} options
 * @returns
 */
export function startOnMainThread(options: ExtensionOptions) {
	const config = resolveConfig(options);

	return {
		async setupDirectory(_: any, componentPath: string) {
			return true;
		},
	};
}

/**
 * This method is executed on each worker thread, and is responsible for
 * returning a Resource Extension that will subsequently be executed on each
 * worker thread.
 *
 * @param {ExtensionOptions} options
 * @returns
 */
export function start(options: ExtensionOptions) {
	const config = resolveConfig(options);

	logInfo(`Starting extension...`);

	return {
		async handleDirectory(_: any, componentPath: string) {
			const parser = new EdgeControlParser(config.edgeControlPath!);
			const { rules } = await parser.parse();

			const handlers = await Handler.validateHandlers(rules, config.handlers);
			console.log(handlers);

			// Hook into `options.server.http`
			options.server.http(async (request: any, nextHandler: any) => {
				const { _nodeRequest: req, _nodeResponse: res } = request;
				request.edgio = { ...request.edgio, ...{ proxyHandler: null } };

				const context = RequestContext.fromRequest(request);

				const applicableRules = rules
					.filter((r: Rule) => {
						return r.evaluate(context);
					})
					.map((r: Rule) => r.features);

				const mergedRules = applicableRules.reduce((acc: any, value: any) => deepMerge(acc, value), {});

				logDebug(`>> Applicable rules: ${JSON.stringify(mergedRules, null, 2)}`);

				// /foo
				if (mergedRules.headers?.set_request_headers?.['+x-cloud-functions-hint']) {
					const handlerName = mergedRules.headers?.set_request_headers?.['+x-cloud-functions-hint'];
					const handler = handlers[handlerName];
					request.edgio.proxyHandler = handler;
				}

				nextHandler(request);
			});

			return true;
		},
	};
}
