import {defineConfig} from 'vite'
import dtsPlugin from "vite-plugin-dts";

const isBuild = process.argv.includes('build')

export default defineConfig({
    define: {
        ...(!isBuild ? {
            process: {
                env: {
                    'MICROTSM_STANDALONE': JSON.stringify(true)
                }
            }
        } : {}),
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