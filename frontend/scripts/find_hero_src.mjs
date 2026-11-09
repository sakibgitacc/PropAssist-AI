async function findHeroSrc() {
  const res = await fetch('https://realestate.anuragstudio.com/');
  const html = await res.text();
  const inlineScripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const s2 = inlineScripts[2];

  const pos = s2.indexOf('heroSrc');
  console.log('Snippet around heroSrc:\n', s2.slice(Math.max(0, pos - 200), pos + 600));
}
findHeroSrc();
