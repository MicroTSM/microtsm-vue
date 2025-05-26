import {defineConfig} from 'vite'
import dtsPlugin from "vite-plugin-dts";

export default defineConfig({
    define: {
        process: {
            env: {
                'MICROTSM_STANDALONE': JSON.stringify(true)
            }
        }
    },
    build: {
        lib: {
            entry: './lib/microtsm-vue.ts',
            name: 'MicroTSMVue',
            formats: ['es'],
            fileName: 'microtsm-vue',
        },
    },
    plugins: [
        dtsPlugin({'entryRoot': 'lib'})
    ]
})