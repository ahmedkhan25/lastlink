import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dedicated port — HSAI dev servers occupy 5173/5174; strictPort prevents any collision.
  server: { port: 5273, strictPort: true, host: "127.0.0.1" },
});
