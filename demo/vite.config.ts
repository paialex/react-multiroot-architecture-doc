import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    root: '.',
    base: './',
    plugins: [react()],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
        },
    },

    build: {
        outDir: 'dist',
        manifest: true,
        rollupOptions: {
            input: './src/main.tsx',
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
                // Vendor splitting for optimal caching
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                },
            },
        },
    },
});
