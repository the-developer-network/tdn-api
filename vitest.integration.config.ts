import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        environment: "node",
        include: ["tests/integration/**/*.test.ts"],
        globalSetup: ["tests/integration/global-setup.ts"],
        testTimeout: 30000,
        hookTimeout: 30000,
        fileParallelism: false,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/infrastructure/persistence/repositories/**"],
            exclude: [
                "node_modules/",
                "dist/",
                "tests/**",
                "**/*.d.ts",
            ],
        },
    },
});
