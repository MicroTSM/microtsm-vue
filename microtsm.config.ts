import { defineConfig, UserConfig } from '@microtsm/cli';
import dtsPlugin from 'vite-plugin-dts';

const banner = `/*
 * 🚀 MicroTSM Vue Micro-App Framework
 * ------------------------------------
 * Modular lifecycle-driven micro-app architecture for Vue 3.
 *
 * ✅ Provides standardized lifecycle methods (\`bootstrap\`, \`mount\`, \`update\`, \`unmount\`).
 * ✅ Supports dynamic mounting, customizable instances, and standalone execution.
 * ✅ Ensures correct Vue Router resolution after remounting.
 * ✅ Implements flexible app configurations via \`MicroAppProps\` and \`setupInstance\` hooks.
 *
 * 🔥 Designed for scalable micro-frontend integration with Vue 3.
 * 🏍️ Engineered for smooth app mounting and dynamic customization.
 */`;

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';

    const config: UserConfig = {
        build: {
            emptyOutDir: true,
            lib: {
                entry: './lib/microtsm-vue.ts',
                name: 'MicroTSMVue',
                formats: ['es'],
                fileName: isProd ? 'microtsm-vue.prod' : 'microtsm-vue',
            },
            rollupOptions: {
                input: './lib/microtsm-vue.ts',
                external: ['vue'],
                output: {
                    banner,
                },
            },
            // In production, minify using Terser; in development, output as is.
            minify: isProd ? 'esbuild' : false,
            // Disable source maps in prod; enable in dev for easier debugging.
            sourcemap: !isProd,
        },
        esbuild: isProd
            ? {
                  drop: ['console', 'debugger'],
                  legalComments: 'none',
              }
            : undefined,
        plugins: [
            !isProd
                ? dtsPlugin({
                      entryRoot: 'lib',
                  })
                : undefined,
        ],
    };

    return config;
});
