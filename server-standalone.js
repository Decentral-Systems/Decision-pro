#!/usr/bin/env node

/**
 * Decision PRO - Custom Standalone Server
 * This server properly serves static files from the public directory
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Always bind to all interfaces
const port = parseInt(process.env.PORT || '4009', 10);

// For standalone mode, we need to handle static files manually
const publicDir = path.join(__dirname, 'public');

console.log('🚀 Starting Decision PRO Server...');
console.log(`📁 Public directory: ${publicDir}`);
console.log(`🌐 Server: http://${hostname}:${port}`);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Serve static files from public directory
      if (pathname.startsWith('/logos/') || pathname.startsWith('/icon.')) {
        const filePath = path.join(publicDir, pathname);
        
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const contentTypes = {
            '.jpeg': 'image/jpeg',
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.webp': 'image/webp'
          };

          const contentType = contentTypes[ext] || 'application/octet-stream';
          const fileContent = fs.readFileSync(filePath);

          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': fileContent.length
          });
          res.end(fileContent);
          return;
        }
      }

      // Let Next.js handle everything else
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`✅ Server ready on http://${hostname}:${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
});
