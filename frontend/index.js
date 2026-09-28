import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// ✅ ES Module setup for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 🔧 CRITICAL: Set MIME types for all static files
const mimeTypeMiddleware = (req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  } else if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
  } else if (req.path.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  } else if (req.path.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
};

app.use(mimeTypeMiddleware);

// Serve public static assets
app.use(express.static(path.join(__dirname, 'public')));

// Serve styles at both /styles and legacy /css
app.use('/styles', express.static(path.join(__dirname, 'src', 'styles')));
app.use('/css', express.static(path.join(__dirname, 'src', 'styles')));

// Serve ES modules from /src
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve page templates from public/pages
app.use('/pages', express.static(path.join(__dirname, 'public', 'pages')));

// Backend API URL (defaults to http://localhost:5000 in local dev)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Reverse proxy /api to backend server
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    return res.json({ status: 'Frontend OK', timestamp: new Date().toISOString() });
  }

  try {
    const targetUrl = `${BACKEND_URL}${req.originalUrl}`;
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
        headers[key] = value;
      }
    }

    const fetchOptions = {
      method: req.method,
      headers
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    const backendRes = await fetch(targetUrl, fetchOptions);
    const contentType = backendRes.headers.get('content-type') || '';

    res.status(backendRes.status);
    if (contentType.includes('application/json')) {
      const data = await backendRes.json();
      return res.json(data);
    } else {
      const text = await backendRes.text();
      return res.send(text);
    }
  } catch (proxyErr) {
    console.error(`[API Proxy Error] ${req.method} ${req.originalUrl}:`, proxyErr.message);
    res.status(502).json({ error: `Backend service unavailable: ${proxyErr.message}. Please try again in a moment.` });
  }
});

// 🔧 CRITICAL: SPA fallback - serve index.html for unknown routes
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Failed to load page');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message });
});

// Start server with fallback if port is busy
const startServer = (portToUse) => {
  const server = app.listen(portToUse, '0.0.0.0', () => {
    console.log(`✅ STREAKO Frontend running on http://localhost:${portToUse}`);
    console.log(`📍 Visit: http://localhost:${portToUse}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${portToUse} is in use, trying http://localhost:${portToUse + 1}...`);
      startServer(portToUse + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(Number(PORT));
