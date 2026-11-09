async function inspect() {
  const res = await fetch('https://realestate.anuragstudio.com/');
  const html = await res.text();
  console.log('HTML Length:', html.length);
  const images = [...html.matchAll(/src=["']([^"']+\.(?:jpg|png|webp|svg))["']/gi)].map(m => m[1]);
  console.log('Images found:', images.slice(0, 20));
  const canvas = html.includes('<canvas');
  console.log('Has canvas:', canvas);
  const sections = [...html.matchAll(/<section[^>]*id=["']([^"']+)["']/gi)].map(m => m[1]);
  console.log('Section IDs:', sections);
}
inspect();
