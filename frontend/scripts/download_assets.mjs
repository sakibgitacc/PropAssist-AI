import fs from 'fs';
import path from 'path';

const ASSETS = [
  'plan-3bhk.jpg',
  'plan-4bhk.jpg',
  'plan-villa.jpg',
  'pool.jpg',
  'garden-dusk.jpg',
  'lounge.jpg',
  'kids-garden.jpg',
  'fitness.jpg',
  'lobby.jpg',
  'hero-ending.jpg',
  'view-30.jpg'
];

async function downloadAssets() {
  const destDir = path.join(process.cwd(), 'public', 'assets');
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of ASSETS) {
    const url = `https://realestate.anuragstudio.com/assets/${file}`;
    const dest = path.join(destDir, file);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buffer);
        console.log(`✓ Downloaded ${file} (${buffer.length} bytes)`);
      } else {
        console.warn(`Failed ${file}: status ${res.status}`);
      }
    } catch (e) {
      console.error(`Error downloading ${file}:`, e.message);
    }
  }
}

downloadAssets();
