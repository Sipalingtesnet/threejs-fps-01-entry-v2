/**
 * TIDEWATCH - Tactical FPS Competition Entry Builder
 * Build script packing game/ into dossier.json via makefun-threejs.ts kit
 */

import { buildDossier } from './vendor/makefun-threejs.ts';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
  console.log(`Building TIDEWATCH dossier into ${outputDir}...`);

  const dossierBytes = buildDossier(import.meta.dirname, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648
  });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'dossier.json'), dossierBytes);

  // Also copy game/ and screenshots/ to outputDir for serving test
  const copyDir = (src: string, dest: string) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const sPath = path.join(src, entry.name);
      const dPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(sPath, dPath);
      } else if (entry.isFile()) {
        fs.copyFileSync(sPath, dPath);
      }
    }
  };

  copyDir(path.join(import.meta.dirname, 'game'), path.join(outputDir, 'game'));
  copyDir(path.join(import.meta.dirname, 'screenshots'), path.join(outputDir, 'screenshots'));

  console.log('Dossier build completed successfully.');
}

main().catch(err => {
  console.error('Failed to build dossier:', err);
  process.exit(1);
});
