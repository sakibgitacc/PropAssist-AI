async function inspectScript2() {
  const res = await fetch('https://realestate.anuragstudio.com/');
  const html = await res.text();
  const inlineScripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const s2 = inlineScripts[2];
  
  // Search for keywords
  const keywords = ['canvas', 'frames', 'scroll', 'season', 'floor', 'tower', 'budget', 'apartment', 'three', 'orbit'];
  keywords.forEach(kw => {
    const idx = s2.indexOf(kw);
    console.log(`Keyword "${kw}": found at ${idx}, snippet:`, s2.slice(idx, idx + 150).replace(/\n/g, ' '));
  });
}
inspectScript2();
