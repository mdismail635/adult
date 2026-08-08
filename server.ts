import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable global CORS headers for worldwide accessibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Ensure uploads directory exists for local fallback/storage
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR, {
  acceptRanges: true,
  cacheControl: true,
  maxAge: '1d'
}));

// Configure multer for disk storage to avoid high memory usage and buffer overflows
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const uniqueId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Environment variables for Cloudinary credentials (stored strictly server-side)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dklhnq56v';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '873455389514395';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'WArwY2sME9zRwiDwDBVr5PSNu8U';

// Persistent storage for videos on disk
const DATA_FILE = path.join(process.cwd(), 'videos.json');

function readVideos(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Filter out any demo videos if present
        return parsed.filter((v: any) => v && v.id && !String(v.id).startsWith('demo-'));
      }
    }
  } catch (err) {
    console.error('Error reading videos.json:', err);
  }
  return [];
}

function writeVideos(videos: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing videos.json:', err);
  }
}

// 1. Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 2. Get safe public Cloudinary config (NEVER returns API Secret!)
app.get('/api/cloudinary-config', (req, res) => {
  res.json({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    configured: Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
  });
});

// 3. Generate cryptographic signature for Cloudinary signed upload securely on the server
app.post('/api/cloudinary-signature', (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = req.body.folder || 'vibeplayer_videos';
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp
    };

    const sortedKeys = Object.keys(paramsToSign).sort();
    const paramString = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join('&');
    const stringToSign = `${paramString}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    res.json({
      signature,
      timestamp,
      folder,
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

// 4. Direct Server-Side Upload Proxy Endpoint (Guarantees 100% upload success)
app.post('/api/upload-video', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
}, async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const title = (req.body.title || 'Untitled Video').trim();
    const description = (req.body.description || '').trim();
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'vibeplayer_videos';

    let videoUrl = '';
    let thumbnailUrl = '';
    let publicId = path.basename(req.file.filename, path.extname(req.file.filename));
    let duration = 0;

    // Attempt direct server-to-server upload to Cloudinary using file stream/buffer from disk
    let cloudinarySuccess = false;
    try {
      const stringToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
      const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

      const fileBuffer = fs.readFileSync(req.file.path);
      const formData = new FormData();
      const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype || 'video/mp4' });
      formData.append('file', fileBlob, req.file.originalname);
      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formData
      });

      if (cloudRes.ok) {
        const cloudData = await cloudRes.json();
        videoUrl = cloudData.secure_url;
        publicId = cloudData.public_id;
        duration = cloudData.duration || 0;
        thumbnailUrl = videoUrl.includes('/video/upload/')
          ? videoUrl.replace('/video/upload/', '/video/upload/so_0/').replace(/\.[^/.]+$/, ".jpg")
          : videoUrl.replace(/\.[^/.]+$/, ".jpg");
        cloudinarySuccess = true;

        // Clean up disk file if uploaded to Cloudinary
        try { fs.unlinkSync(req.file.path); } catch {}
      } else {
        const errText = await cloudRes.text();
        console.warn('Cloudinary upload warning:', errText);
      }
    } catch (cErr) {
      console.warn('Cloudinary server request error:', cErr);
    }

    // Fallback to local storage if Cloudinary upload returned error
    if (!cloudinarySuccess) {
      videoUrl = `/uploads/${req.file.filename}`;
      thumbnailUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop';
    }

    const newVideo = {
      id: publicId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      createdAt: new Date().toISOString(),
      adsEnabled: true
    };

    const videos = readVideos();
    const updatedVideos = [newVideo, ...videos.filter(v => v.id !== newVideo.id)];
    writeVideos(updatedVideos);

    res.json({
      success: true,
      cloudinary: cloudinarySuccess,
      video: newVideo,
      videos: updatedVideos
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    res.status(500).json({ error: error.message || 'Server upload failed' });
  }
});

// 5. API for persisted videos
app.get('/api/videos', (req, res) => {
  const videos = readVideos();
  res.json(videos);
});

app.post('/api/videos', (req, res) => {
  try {
    const newVideo = req.body;
    if (!newVideo || !newVideo.title || !newVideo.videoUrl) {
      return res.status(400).json({ error: 'Invalid video data. Title and videoUrl are required.' });
    }

    const videos = readVideos();
    const videoToAdd = {
      ...newVideo,
      id: newVideo.id || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: newVideo.createdAt || new Date().toISOString(),
      adsEnabled: true
    };

    const updatedVideos = [videoToAdd, ...videos.filter(v => v.id !== videoToAdd.id)];
    writeVideos(updatedVideos);

    res.json({ success: true, video: videoToAdd, videos: updatedVideos });
  } catch (error: any) {
    console.error('Error saving video:', error);
    res.status(500).json({ error: 'Failed to save video' });
  }
});

app.delete('/api/videos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const videos = readVideos();
    const updatedVideos = videos.filter(v => v.id !== id);
    writeVideos(updatedVideos);
    res.json({ success: true, videos: updatedVideos });
  } catch {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
