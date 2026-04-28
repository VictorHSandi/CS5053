import { defineConfig } from "vite";

export default defineConfig({
    root: ".",
    publicDir: "public",
    build: {
        outDir: "dist",
        sourcemap: true,
    },
    server: {
        open: true,
        // Serve .wasm files with the correct MIME type for Havok physics
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
            // Allow Havok WASM to use eval() internally
            "Content-Security-Policy": "script-src 'self' 'unsafe-eval'; worker-src 'self' blob:",
        },
    },
    // Tell Vite to handle .wasm files as assets, not try to parse them
    optimizeDeps: {
        exclude: ["@babylonjs/havok"],
    },
    assetsInclude: ["**/*.wasm"],
});