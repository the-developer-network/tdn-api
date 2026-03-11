import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "coverage/**",
            "prisma/**",
            "prisma.config.ts",
            "vitest.config.ts",
            "tests/**/*",
        ],
    },

    js.configs.recommended,

    ...tseslint.configs.recommended,
    eslintConfigPrettier,

    {
        files: ["**/*.ts"],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
        rules: {
            "no-console": "warn",

            "@typescript-eslint/no-explicit-any": "warn",

            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
            "prefer-const": "error",

            eqeqeq: ["error", "always"],

            "@typescript-eslint/explicit-function-return-type": "warn",

            "@typescript-eslint/no-floating-promises": "error",

            "@typescript-eslint/require-await": "error",

            "@typescript-eslint/consistent-type-imports": [
                "warn",
                {
                    prefer: "type-imports",
                    fixStyle: "separate-type-imports",
                },
            ],
        },
    },
]);
