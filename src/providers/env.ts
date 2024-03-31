export const env = process.env.NODE_ENV ?? "production ";
export const development = env === "development";
export const production = env === "production";
