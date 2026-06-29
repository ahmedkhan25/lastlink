import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dedicated port (HSAI uses 5173/5174; LastLink app uses 5273).
  server: { port: 5274, strictPort: true, host: "127.0.0.1" },
});
