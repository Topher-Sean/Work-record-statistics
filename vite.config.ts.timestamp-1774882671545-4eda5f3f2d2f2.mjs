// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.15/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vite@5.4.21_@types+node@22.19.15__vue@3.5.31_typescript@5.3.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import Inspector from "file:///C:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/node_modules/.pnpm/unplugin-vue-dev-locator@1.0.3_vite@5.4.21_@types+node@22.19.15_/node_modules/unplugin-vue-dev-locator/dist/vite.mjs";
import traeBadgePlugin from "file:///C:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/node_modules/.pnpm/vite-plugin-trae-solo-badge@1.0.0_vite@5.4.21_@types+node@22.19.15_/node_modules/vite-plugin-trae-solo-badge/dist/vite-plugin.esm.js";
var __vite_injected_original_dirname = "C:\\Users\\Administrator\\Desktop\\\u4E2A\u4EBA\u5E94\u7528\\Work-record-statistics";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    build: {
      sourcemap: "hidden"
    },
    plugins: [
      vue(),
      Inspector(),
      traeBadgePlugin({
        variant: "dark",
        position: "bottom-right",
        prodOnly: true,
        clickable: true,
        clickUrl: "https://www.trae.ai/solo?showJoin=1",
        autoTheme: true,
        autoThemeTarget: "#app"
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
        // ✅ 定义 @ = src
      }
    },
    define: {
      // 把重要的环境变量在构建时直接注入到代码里，避免 Vercel 部署后拿不到
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL || "https://xteiwynqlrvdkgtkguuw.supabase.co"),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZWl3eW5xbHJ2ZGtndGtndXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODU3NTgsImV4cCI6MjA5MDM2MTc1OH0._Rx1YSKcxM8rrGyzA4648J7QwA7JkgoczCyxTHcF8JA"),
      "import.meta.env.VITE_VERCEL_URL": JSON.stringify(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : ""),
      "process.env.OPENAI_API_KEY": JSON.stringify(env.OPENAI_API_KEY || ""),
      "process.env.OPENAI_BASE_URL": JSON.stringify(env.OPENAI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1"),
      "process.env.OPENAI_MODEL_NAME": JSON.stringify(env.OPENAI_MODEL_NAME || "qwen-turbo")
    },
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${env.API_PORT || env.PORT || 3001}`,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("Sending Request to the Target:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
            });
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBZG1pbmlzdHJhdG9yXFxcXERlc2t0b3BcXFxcXHU0RTJBXHU0RUJBXHU1RTk0XHU3NTI4XFxcXFdvcmstcmVjb3JkLXN0YXRpc3RpY3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFkbWluaXN0cmF0b3JcXFxcRGVza3RvcFxcXFxcdTRFMkFcdTRFQkFcdTVFOTRcdTc1MjhcXFxcV29yay1yZWNvcmQtc3RhdGlzdGljc1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQWRtaW5pc3RyYXRvci9EZXNrdG9wLyVFNCVCOCVBQSVFNCVCQSVCQSVFNSVCQSU5NCVFNyU5NCVBOC9Xb3JrLXJlY29yZC1zdGF0aXN0aWNzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBJbnNwZWN0b3IgZnJvbSAndW5wbHVnaW4tdnVlLWRldi1sb2NhdG9yL3ZpdGUnXG5pbXBvcnQgdHJhZUJhZGdlUGx1Z2luIGZyb20gJ3ZpdGUtcGx1Z2luLXRyYWUtc29sby1iYWRnZSdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICByZXR1cm4ge1xuICAgIGJ1aWxkOiB7XG4gICAgICBzb3VyY2VtYXA6ICdoaWRkZW4nLFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgdnVlKCksXG4gICAgICBJbnNwZWN0b3IoKSxcbiAgICAgIHRyYWVCYWRnZVBsdWdpbih7XG4gICAgICAgIHZhcmlhbnQ6ICdkYXJrJyxcbiAgICAgICAgcG9zaXRpb246ICdib3R0b20tcmlnaHQnLFxuICAgICAgICBwcm9kT25seTogdHJ1ZSxcbiAgICAgICAgY2xpY2thYmxlOiB0cnVlLFxuICAgICAgICBjbGlja1VybDogJ2h0dHBzOi8vd3d3LnRyYWUuYWkvc29sbz9zaG93Sm9pbj0xJyxcbiAgICAgICAgYXV0b1RoZW1lOiB0cnVlLFxuICAgICAgICBhdXRvVGhlbWVUYXJnZXQ6ICcjYXBwJyxcbiAgICAgIH0pLFxuICAgIF0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSwgLy8gXHUyNzA1IFx1NUI5QVx1NEU0OSBAID0gc3JjXG4gICAgICB9LFxuICAgIH0sXG4gICAgZGVmaW5lOiB7XG4gICAgICAvLyBcdTYyOEFcdTkxQ0RcdTg5ODFcdTc2ODRcdTczQUZcdTU4ODNcdTUzRDhcdTkxQ0ZcdTU3MjhcdTY3ODRcdTVFRkFcdTY1RjZcdTc2RjRcdTYzQTVcdTZDRThcdTUxNjVcdTUyMzBcdTRFRTNcdTc4MDFcdTkxQ0NcdUZGMENcdTkwN0ZcdTUxNEQgVmVyY2VsIFx1OTBFOFx1N0Y3Mlx1NTQwRVx1NjJGRlx1NEUwRFx1NTIzMFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX1NVUEFCQVNFX1VSTCc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCAnaHR0cHM6Ly94dGVpd3lucWxydmRrZ3RrZ3V1dy5zdXBhYmFzZS5jbycpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgJ2V5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpwYzNNaU9pSnpkWEJoWW1GelpTSXNJbkpsWmlJNkluaDBaV2wzZVc1eGJISjJaR3RuZEd0bmRYVjNJaXdpY205c1pTSTZJbUZ1YjI0aUxDSnBZWFFpT2pFM056UTNPRFUzTlRnc0ltVjRjQ0k2TWpBNU1ETTJNVGMxT0gwLl9SeDFZU0tjeE04cnJHeXpBNDY0OEo3UXdBN0prZ29jekN5eFRIY0Y4SkEnKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9WRVJDRUxfVVJMJzogSlNPTi5zdHJpbmdpZnkoZW52LlZFUkNFTF9VUkwgPyBgaHR0cHM6Ly8ke2Vudi5WRVJDRUxfVVJMfWAgOiAnJyksXG4gICAgICAncHJvY2Vzcy5lbnYuT1BFTkFJX0FQSV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuT1BFTkFJX0FQSV9LRVkgfHwgJycpLFxuICAgICAgJ3Byb2Nlc3MuZW52Lk9QRU5BSV9CQVNFX1VSTCc6IEpTT04uc3RyaW5naWZ5KGVudi5PUEVOQUlfQkFTRV9VUkwgfHwgJ2h0dHBzOi8vZGFzaHNjb3BlLmFsaXl1bmNzLmNvbS9jb21wYXRpYmxlLW1vZGUvdjEnKSxcbiAgICAgICdwcm9jZXNzLmVudi5PUEVOQUlfTU9ERUxfTkFNRSc6IEpTT04uc3RyaW5naWZ5KGVudi5PUEVOQUlfTU9ERUxfTkFNRSB8fCAncXdlbi10dXJibycpLFxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwcm94eToge1xuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGBodHRwOi8vbG9jYWxob3N0OiR7ZW52LkFQSV9QT1JUIHx8IGVudi5QT1JUIHx8IDMwMDF9YCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIF9yZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3Byb3h5IGVycm9yJywgZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVxJywgKHByb3h5UmVxLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NlbmRpbmcgUmVxdWVzdCB0byB0aGUgVGFyZ2V0OicsIHJlcS5tZXRob2QsIHJlcS51cmwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgX3JlcykgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjZWl2ZWQgUmVzcG9uc2UgZnJvbSB0aGUgVGFyZ2V0OicsIHByb3h5UmVzLnN0YXR1c0NvZGUsIHJlcS51cmwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFksU0FBUyxjQUFjLGVBQWU7QUFDbGIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUNqQixPQUFPLGVBQWU7QUFDdEIsT0FBTyxxQkFBcUI7QUFKNUIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQzNDLFNBQU87QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNMLFdBQVc7QUFBQSxJQUNiO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxJQUFJO0FBQUEsTUFDSixVQUFVO0FBQUEsTUFDVixnQkFBZ0I7QUFBQSxRQUNkLFNBQVM7QUFBQSxRQUNULFVBQVU7QUFBQSxRQUNWLFVBQVU7QUFBQSxRQUNWLFdBQVc7QUFBQSxRQUNYLFVBQVU7QUFBQSxRQUNWLFdBQVc7QUFBQSxRQUNYLGlCQUFpQjtBQUFBLE1BQ25CLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUE7QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQTtBQUFBLE1BRU4scUNBQXFDLEtBQUssVUFBVSxJQUFJLHFCQUFxQiwwQ0FBMEM7QUFBQSxNQUN2SCwwQ0FBMEMsS0FBSyxVQUFVLElBQUksMEJBQTBCLGtOQUFrTjtBQUFBLE1BQ3pTLG1DQUFtQyxLQUFLLFVBQVUsSUFBSSxhQUFhLFdBQVcsSUFBSSxVQUFVLEtBQUssRUFBRTtBQUFBLE1BQ25HLDhCQUE4QixLQUFLLFVBQVUsSUFBSSxrQkFBa0IsRUFBRTtBQUFBLE1BQ3JFLCtCQUErQixLQUFLLFVBQVUsSUFBSSxtQkFBbUIsbURBQW1EO0FBQUEsTUFDeEgsaUNBQWlDLEtBQUssVUFBVSxJQUFJLHFCQUFxQixZQUFZO0FBQUEsSUFDdkY7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVEsb0JBQW9CLElBQUksWUFBWSxJQUFJLFFBQVEsSUFBSTtBQUFBLFVBQzVELGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxVQUNSLFdBQVcsQ0FBQyxPQUFPLGFBQWE7QUFDOUIsa0JBQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxNQUFNLFNBQVM7QUFDckMsc0JBQVEsSUFBSSxlQUFlLEdBQUc7QUFBQSxZQUNoQyxDQUFDO0FBQ0Qsa0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFNBQVM7QUFDNUMsc0JBQVEsSUFBSSxrQ0FBa0MsSUFBSSxRQUFRLElBQUksR0FBRztBQUFBLFlBQ25FLENBQUM7QUFDRCxrQkFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEtBQUssU0FBUztBQUM1QyxzQkFBUSxJQUFJLHNDQUFzQyxTQUFTLFlBQVksSUFBSSxHQUFHO0FBQUEsWUFDaEYsQ0FBQztBQUFBLFVBQ0g7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
