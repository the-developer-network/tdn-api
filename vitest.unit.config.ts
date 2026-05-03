import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        environment: "node",
        include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.spec.ts"],
        fileParallelism: true,
        testTimeout: 5000,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: [
                "src/core/domain/**",
                "src/core/use-cases/**",
                "src/infrastructure/persistence/mappers/**",
                "src/infrastructure/security/**",
                "src/infrastructure/realtime/**",
            ],
            exclude: [
                "node_modules/",
                "dist/",
                "**/*.d.ts",
                "**/*.schema.ts",
                "**/index.ts",
                "**/*.input.ts",
                "**/*.output.ts",
            ],
        },
    },
});
