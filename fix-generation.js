// Fix generation record
const https = require('https');

const data = JSON.stringify({
  generationId: 'a0c42389-d045-43bf-b436-2b7fbe0ffd33',
  resultUrl: 'https://pub-b73a86bd5ccf4cc7bba9daf3c7fb363e.r2.dev/videos/minimax-video-MiniMax-Hailuo-02-a0c42389-d045-43bf-b436-2b7fbe0ffd33-2025-08-02T20-51-53-922Z.mp4'
});

const options = {
  hostname: 'localhost',
  port: 3443, // Use HTTPS port
  path: '/api/admin/fix-generation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
  // Certificate validation enabled by default for security
  // For development with self-signed certs, use NODE_TLS_REJECT_UNAUTHORIZED=0 environment variable
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (d) => {
    console.log('Response:', JSON.parse(d.toString()));
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(data);
req.end();
