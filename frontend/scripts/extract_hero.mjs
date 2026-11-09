async function extractHeroCode() {
  const res = await fetch('https://realestate.anuragstudio.com/');
  const html = await res.text();
  const inlineScripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const s2 = inlineScripts[2];

  // Search around 'primeVideo' or 'canvas' or 'hero'
  const pos = s2.indexOf('primeVideo');
  console.log('Snippet around primeVideo:\n', s2.slice(Math.max(0, pos - 400), pos + 1000));
}
extractHeroCode();
