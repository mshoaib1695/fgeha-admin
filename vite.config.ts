import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["admin.fgeha.online"],
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: ["admin.fgeha.online"],
  },
});
