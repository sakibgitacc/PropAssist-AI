async function inspectCSS() {
  const res = await fetch('https://realestate.anuragstudio.com/');
  const html = await res.text();
  const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
  console.log('Inline style tags:', inlineStyles.length);
  inlineStyles.forEach((s, i) => {
    console.log(`Style ${i} length:`, s.length, s.slice(0, 300));
  });
}
inspectCSS();
