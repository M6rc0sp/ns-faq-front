import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    optimizeDeps: {
        include: [
            '@nimbus-ds/patterns',
            '@nimbus-ds/components',
            '@nimbus-ds/styles',
        ],
    },
    define: {
        global: 'globalThis',
    },
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/public': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
});
