import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Proxy /api et /auth vers le backend pour rester same-origin (cookie de session).
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:3001",
            "/auth": "http://localhost:3001",
        },
    },
});
