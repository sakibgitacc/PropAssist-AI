async function inspectVideo() {
  const res = await fetch('https://realestate.anuragstudio.com/');
  const html = await res.text();
  const videos = [...html.matchAll(/<video[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]);
  console.log('Video src tags:', videos);
  const sources = [...html.matchAll(/<source[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]);
  console.log('Source src tags:', sources);
}
inspectVideo();
