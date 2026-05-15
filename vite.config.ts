import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "Public",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react/jsx-runtime") || id.includes("react")) {
              return "react-vendor";
            }
            if (id.includes("react-router")) {
              return "router-vendor";
            }
            if (id.includes("date-fns")) {
              return "datefns-vendor";
            }
            if (id.includes("@radix-ui")) {
              return "radix-vendor";
            }
            if (id.includes("lucide-react")) {
              return "icons-vendor";
            }
          }
        },
      },
    },
  },
});
