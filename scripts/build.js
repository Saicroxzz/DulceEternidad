import fs from 'fs';
import path from 'path';
import { minify } from 'terser';

const srcDir = 'src/js';
const distDir = 'js';
const isDev = process.argv.includes('--dev');

async function build() {
  console.log(`[BUILD] Iniciando compilación (${isDev ? 'Modo Desarrollo' : 'Modo Producción - Minificado'})...`);

  if (!fs.existsSync(srcDir)) {
    console.error(`Error: El directorio fuente ${srcDir} no existe.`);
    process.exit(1);
  }

  fs.mkdirSync(distDir, { recursive: true });
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

  let totalSrc = 0;
  let totalDist = 0;

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    const code = fs.readFileSync(srcPath, 'utf8');
    totalSrc += code.length;

    if (isDev) {
      fs.writeFileSync(distPath, code, 'utf8');
      totalDist += code.length;
      console.log(`  ✓ ${file} (Copia sin minificar para depuración)`);
    } else {
      const minified = await minify(code, {
        module: true,
        compress: {
          passes: 2,
          dead_code: true,
          drop_debugger: true
        },
        mangle: {
          toplevel: false
        },
        format: {
          comments: false
        },
        sourceMap: false
      });

      fs.writeFileSync(distPath, minified.code, 'utf8');
      totalDist += minified.code.length;
      const percent = Math.round((1 - minified.code.length / code.length) * 100);
      console.log(`  ✓ ${file}: ${code.length}B -> ${minified.code.length}B (-${percent}%)`);
    }
  }

  const reduction = isDev ? 0 : Math.round((1 - totalDist / totalSrc) * 100);
  console.log(`\n[BUILD EXITOSO] ${files.length} archivos compilados en /${distDir}`);
  if (!isDev) {
    console.log(`  Tamaño total: ${totalSrc}B -> ${totalDist}B (-${reduction}%)`);
    console.log(`  Código protegido: 0 comentarios, variables internas ofuscadas, 1 sola línea por archivo.`);
  }
}

build().catch(err => {
  console.error('[ERROR EN BUILD]', err);
  process.exit(1);
});
