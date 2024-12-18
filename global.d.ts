declare global {
	var logInfo: (message: string) => void;
	var logDebug: (message: string) => void;
	var logError: (message: string) => void;
	var logWarn: (message: string) => void;
	var logger: any;
}

export {};
