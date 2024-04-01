export class IllegalStateError extends Error {
	override name = "IllegalStateError";
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
	}
}
export class StopCommandExecution extends Error {
	override name = "StopCommandExecution";
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
	}
}