import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dedicated port — HSAI dev servers occupy 5173/5174; strictPort prevents any collision.
  // Proxy auth + GraphQL to the API so the browser stays same-origin (first-party cookies, no CORS).
  server: {
    port: 5273,
    strictPort: true,
    host: "127.0.0.1",
    proxy: {
      "/api": { target: "http://localhost:10000", changeOrigin: true },
      "/graphql": { target: "http://localhost:10000", changeOrigin: true },
    },
  },
});
