import {defineConfig} from 'vite'
import dtsPlugin from "vite-plugin-dts";

export default defineConfig({
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