import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Inspector from 'unplugin-vue-dev-locator/vite'
import traeBadgePlugin from 'vite-plugin-trae-solo-badge'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBasePath = env.VITE_API_BASE_PATH || '/wr-api'
  const port = Number(env.VITE_PORT || 5179)
  return {
    build: {
      sourcemap: 'hidden',
    },
    plugins: [
      vue(),
      Inspector(),
      traeBadgePlugin({
        variant: 'dark',
        position: 'bottom-right',
        prodOnly: true,
        clickable: true,
        clickUrl: 'https://www.trae.ai/solo?showJoin=1',
        autoTheme: true,
        autoThemeTarget: '#app',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // ✅ 定义 @ = src
      },
    },
    define: {
      // 把重要的环境变量在构建时直接注入到代码里，避免 Vercel 部署后拿不到
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://xteiwynqlrvdkgtkguuw.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZWl3eW5xbHJ2ZGtndGtndXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODU3NTgsImV4cCI6MjA5MDM2MTc1OH0._Rx1YSKcxM8rrGyzA4648J7QwA7JkgoczCyxTHcF8JA'),
      'import.meta.env.VITE_VERCEL_URL': JSON.stringify(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : ''),
    },
    server: {
      port,
      strictPort: true,
      proxy: {
        [apiBasePath]: {
          target: `http://localhost:${env.API_PORT || env.PORT || 3001}`,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
    }
  }
})
