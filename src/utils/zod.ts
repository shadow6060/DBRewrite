import type { ZodError, ZodIssue } from "zod";
import pc from "picocolors";

/**
 * Formats a ZodError object into a human-readable string representation.
 * @param err The ZodError object to format.
 * @returns A formatted string representation of the ZodError.
 */
export const formatZodError = (err: ZodError) =>
	`${pc.red(`${err.issues.length} issue(s) found.`)}\n${err.issues
		.map(formatZodIssue)
		.join("\n")}`;

/**
 * Formats a ZodIssue into an error message string.
 *
 * @param iss - The ZodIssue to format.
 * @returns The formatted error message string.
 */
export const formatZodIssue = (iss: ZodIssue) =>
	`${pc.red(
		`Error at ${pc.bold(iss.path.join(".")) || "Unknown"}: `
	)}${getZodIssueMessage(iss)}`;

/**
 * Returns an issue message based on the ZodIssue code.
 * @param iss The ZodIssue object.
 * @returns The corresponding issue message.
 */
export const getZodIssueMessage = (iss: ZodIssue) => {
	switch (iss.code) {
		case "invalid_type":
			return `Expected ${pc.green(iss.expected)}, received ${pc.yellow(
				iss.received
			)}`;
		case "unrecognized_keys":
			return `Unrecognized keys: ${iss.keys
				.map((x) => pc.yellow(x))
				.join(", ")}`;
		case "invalid_enum_value":
			return `Invalid enum value. Valid entries are ${iss.options
				.map((x) => pc.green(x))
				.join(", ")}`;
	}
	return iss.message;
};
