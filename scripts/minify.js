import { readdir, readFile, writeFile } from 'fs/promises';
import { relative, resolve } from 'path';
import { gzipSync } from 'zlib';

import * as terser from 'terser';

async function minifyBuildFiles() {
    const buildDir = resolve('dist'); // Adjust based on your output directory
    const files = await readdir(buildDir);

    for (const file of files) {
        if (file.endsWith('js')) {
            const filePath = resolve(buildDir, file);
            const code = await readFile(filePath, 'utf-8');

            const minified = await terser.minify(code, {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
                mangle: true,
                format: {
                    comments: false,
                },
            });

            if (minified.code) {
                const targetPath = filePath.replace('.js', '.prod.js');
                await writeFile(targetPath, minified.code, 'utf-8');
                const minifiedSize = Buffer.from(minified.code).length;
                const gzippedSize = Buffer.byteLength(gzipSync(minified.code), 'utf-8');
                const green = '\x1b[32m';
                const gray = '\x1b[90m'; // Gray color for subtle details
                const reset = '\x1b[0m'; // Reset color back to default

                console.log(
                    `${green}✅   Minified ${reset}${relative(process.cwd(), targetPath).replaceAll('\\', '/')} ${gray}${(minifiedSize / 1024).toFixed(2)} kB │ gzip: ${(gzippedSize / 1024).toFixed(2)} kB${reset}`,
                );
            }
        }
    }
}

minifyBuildFiles().catch(console.error);
