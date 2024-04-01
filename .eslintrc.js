// eslint-disable-next-line no-undef
module.exports = {
	ignorePatterns: ["*.js", "*.mjs"],
	env: {
		browser: true,
		es2021: true,
	},
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:regexp/recommended"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 12,
		sourceType: "module",
	},
	plugins: ["@typescript-eslint", "regexp"],
	rules: {
		indent: ["error", "tab", { SwitchCase: 1 }],
		"linebreak-style": ["error", "windows"],
		quotes: ["error", "double"],
		semi: ["error", "always"],
		"no-debugger": "warn",
		"@typescript-eslint/consistent-type-imports": "warn",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-restricted-imports": ["error", "discord-api-types"],
	},
};
