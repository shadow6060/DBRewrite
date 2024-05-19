/** The current development environment, will default to production if `process.env.NODE_ENV` is unset. */
export const env = process.env.NODE_ENV ?? "production";
/** Whether the current environment is development. */
export const development = env === "development";
/** Whether the current environment is production. */
export const production = env === "production";
