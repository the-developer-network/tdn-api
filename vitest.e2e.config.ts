import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        environment: "node",
        include: ["tests/e2e/**/*.test.ts", "tests/e2e/**/*.spec.ts"],
        setupFiles: ["tests/e2e/setup.ts"],
        testTimeout: 30000,
        hookTimeout: 30000,
        fileParallelism: false,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "dist/",
                "src/index.ts",
                "tests/**",
                "tests/e2e/**",
                "**/*.d.ts",
                "**/*.schema.ts",
            ],
        },
    },
});
