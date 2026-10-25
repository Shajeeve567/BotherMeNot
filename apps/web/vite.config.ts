import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The OAuth flow redirects back to this exact port, so never silently fall back to another.
    strictPort: true,
    proxy: {
      // Backend routes are forwarded unchanged, so frontend paths match the API's own routes.
      // The browser only ever talks to this origin, so the API's session cookie is first-party.
      "^/(api|auth)/": {
        target: "http://localhost:3000",
      },
    },
  },
});
