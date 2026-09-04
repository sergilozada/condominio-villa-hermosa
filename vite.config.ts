import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: "mgx",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/minutas-service": {
        target: "http://127.0.0.1:8010",
        changeOrigin: true,
        rewrite: (proxyPath) => {
          const rewrittenPath = proxyPath.replace(/^\/minutas-service/, "");
          if (!rewrittenPath) return "/";
          return rewrittenPath.startsWith("?") ? `/${rewrittenPath}` : rewrittenPath;
        },
      },
      "/minutas-api": {
        target: "http://127.0.0.1:8010",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/minutas-api/, "/api"),
      },
    },
  },
}));
