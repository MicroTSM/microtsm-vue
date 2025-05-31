import { defineConfig } from 'vite';
import dtsPlugin from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';

    return {
        build: {
            emptyOutDir: false,
            lib: {
                entry: './lib/microtsm-vue.ts',
                name: 'MicroTSMVue',
                formats: ['es'],
                fileName: isProd ? 'microtsm-vue.prod' : 'microtsm-vue',
            },
            rollupOptions: {
                external: ['vue'],
            },
            // In production, minify using Terser; in development, output as is.
            minify: isProd ? 'terser' : false,
            // Disable source maps in prod; enable in dev for easier debugging.
            sourcemap: !isProd,
            // Remove console and debugger statements in production via Terser options.
            terserOptions: isProd
                ? {
                      compress: {
                          drop_console: true,
                          drop_debugger: true,
                      },
                  }
                : {},
        },
        plugins: [
            !isProd
                ? dtsPlugin({
                      entryRoot: 'lib',
                  })
                : undefined,
        ],
    };
});
