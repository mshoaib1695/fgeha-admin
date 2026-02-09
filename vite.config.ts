import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["admin.fgeha.online"],
  },
  preview: {
    allowedHosts: ["admin.fgeha.online"],
  },
});
