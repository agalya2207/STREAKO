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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Frontend OK', timestamp: new Date().toISOString() });
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ STREAKO Frontend running on http://localhost:${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}/login`);
  console.log(`📂 Public folder: ${path.join(__dirname, 'public')}`);
  console.log(`📂 Src folder: ${path.join(__dirname, 'src')}`);
});
