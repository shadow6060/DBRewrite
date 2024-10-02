/**
 * Represents an error that occurs when the application is in an illegal state.
 */
export class IllegalStateError extends Error {
	override name = "IllegalStateError";
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
	}
}

/**
 * Custom error that can be used to stop command execution.
 */
export class StopCommandExecution extends Error {
	override name = "StopCommandExecution";
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
	}
}
