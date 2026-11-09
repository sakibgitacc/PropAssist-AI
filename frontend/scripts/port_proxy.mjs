import http from 'http';

const PROXY_PORT = 5174;
const TARGET_PORT = 5173;

const server = http.createServer((req, res) => {
  // Simple redirect to 5173 or proxy
  res.writeHead(302, { Location: `http://localhost:${TARGET_PORT}${req.url}` });
  res.end();
});

server.listen(PROXY_PORT, () => {
  console.log(`Port 5174 redirector listening -> http://localhost:${TARGET_PORT}`);
});
