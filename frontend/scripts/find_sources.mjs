async function findSources() {
  const res = await fetch('https://realestate.anuragstudio.com/');
  const html = await res.text();
  const inlineScripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const s2 = inlineScripts[2];

  const pos = s2.indexOf('SOURCES');
  console.log('Snippet around SOURCES:\n', s2.slice(pos, pos + 400));
}
findSources();
