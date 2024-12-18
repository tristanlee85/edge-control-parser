/**
 * @typedef {Object} ExtensionOptions - The configuration options for the extension.
 * @property {string} edgeControlPath - The path to the edge control file.
 * @property {Object} handlers - The handlers to be used for the extension.
 */
export type ExtensionOptions = Partial<{
	edgeControlPath: string;
	handlers: {
		[key: string]: string;
	};
}> & {
	[key: string]: any;
};
