import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createQuizApi } from "./server/quiz-api.mjs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), {
    name: 'quiz-lanes-api',
    configureServer(server) {
      const api = createQuizApi({ ...process.env, ...loadEnv(mode, process.cwd(), '') });
      server.middlewares.use((req, res, next) => { void api(req, res).then(handled => { if (!handled) next(); }).catch(next); });
    },
    configurePreviewServer(server) {
      const api = createQuizApi({ ...process.env, ...loadEnv(mode, process.cwd(), '') });
      server.middlewares.use((req, res, next) => { void api(req, res).then(handled => { if (!handled) next(); }).catch(next); });
    },
  }].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
