import fs from 'fs';
import path from 'path';

async function downloadHeroVideo() {
  const destDir = path.join(process.cwd(), 'public', 'assets');
  fs.mkdirSync(destDir, { recursive: true });

  const items = [
    { url: 'https://realestate.anuragstudio.com/assets/hero-scrub.mp4', file: 'hero-scrub.mp4' },
    { url: 'https://realestate.anuragstudio.com/assets/hero-poster.jpg', file: 'hero-poster.jpg' }
  ];

  for (const item of items) {
    const dest = path.join(destDir, item.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`Already exists: ${item.file}`);
      continue;
    }
    console.log(`Downloading ${item.file}...`);
    const res = await fetch(item.url);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      console.log(`✓ Downloaded ${item.file} (${buffer.length} bytes)`);
    } else {
      console.error(`Failed ${item.file}: status ${res.status}`);
    }
  }
}

downloadHeroVideo();
