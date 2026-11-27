import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  resolve: {
    // Rollup's injected imports must resolve from this example for linked packages.
    alias: command === 'build' ? Object.fromEntries(['buffer', 'global', 'process'].map(name => {
      const shim = `vite-plugin-node-polyfills/shims/${name}`
      return [shim, require.resolve(shim)]
    })) : {},
  },
  plugins: [
    nodePolyfills({
      include: ['crypto', 'stream', 'vm'] ,
      globals:{
        Buffer: true,
        global: true,
      }
    }),
    wasm(),
    topLevelAwait(),
    react()
  ],
  optimizeDeps: {
    esbuildOptions: {
        external: ['*.ttf'],
    },
    rollupOptions: {
      // Exclude files with the *.cy.tsx extension from being processed by Vite
      external: [
        "*.ttf",
        "*/vite-plugin-node-polyfills/*"
      ],
    }
  },
  exclude: ['*.ttf'],
}))
