import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dedicated port (app 5273, advocate 5274, message 5275).
  server: { port: 5275, strictPort: true, host: "127.0.0.1" },
});
