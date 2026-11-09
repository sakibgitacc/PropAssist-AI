async function inspectScripts() {
  const res = await fetch('https://realestate.anuragstudio.com/');
  const html = await res.text();
  const inlineScripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  console.log('Inline script count:', inlineScripts.length);
  inlineScripts.forEach((s, idx) => {
    console.log(`Script ${idx} length:`, s.length, s.slice(0, 180));
  });
}
inspectScripts();
