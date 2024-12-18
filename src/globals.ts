const extensionPrefix = '[edge-control-parser]';

global.logInfo = (message: string) => {
	logger.info(`${extensionPrefix} ${message}`);
};

global.logDebug = (message: string) => {
	logger.debug(`${extensionPrefix} ${message}`);
};

global.logError = (message: string) => {
	logger.error(`${extensionPrefix} ${message}`);
};

global.logWarn = (message: string) => {
	logger.warn(`${extensionPrefix} ${message}`);
};
