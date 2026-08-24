import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ root: 'demo', base: './', plugins: [react()], build: { outDir: '../.demo-dist' } });
