import { defineConfig } from "vite";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserOrOrgPagesRepo = repoName.toLowerCase().endsWith(".github.io");
const pagesBase = process.env.GITHUB_ACTIONS
    ? (isUserOrOrgPagesRepo || repoName.length === 0 ? "/" : `/${repoName}/`)
    : "/";

export default defineConfig({
    root: ".",
    base: pagesBase,
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