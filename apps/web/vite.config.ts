import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The OAuth flow redirects back to this exact port, so never silently fall back to another.
    strictPort: true,
    proxy: {
      // The browser only ever talks to this origin, so the API's session cookie is first-party.
      "/api": {
        target: "http://localhost:3000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
