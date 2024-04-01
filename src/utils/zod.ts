import type { ZodError, ZodIssue } from "zod";
import pc from "picocolors";

export const formatZodError = (err: ZodError) =>
	`${pc.red(`${err.issues.length} issue(s) found.`)}\n${err.issues.map(formatZodIssue).join("\n")}`;

export const formatZodIssue = (iss: ZodIssue) => 
	`${pc.red(`Error at ${pc.bold(iss.path.join(".")) || "Unknown"}: `)}${getZodIssueMessage(iss)}`;

export const getZodIssueMessage = (iss: ZodIssue) => {
	switch (iss.code) {
		case "invalid_type": return `Expected ${pc.green(iss.expected)}, received ${pc.yellow(iss.received)}`;
		case "unrecognized_keys": return `Unrecognized keys: ${iss.keys.map(x => pc.yellow(x)).join(", ")}`;
		case "invalid_enum_value": return `Invalid enum value. Valid entries are ${iss.options.map(x => pc.green(x)).join(", ")}`;
	}
	return iss.message;
};