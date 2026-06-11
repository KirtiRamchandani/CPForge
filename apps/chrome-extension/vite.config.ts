import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "popup.html",
        options: "options.html",
        content: "src/content.ts",
        background: "src/background.ts"
      },
      output: {
        entryFileNames: "src/[name].js"
      }
    }
  }
});
