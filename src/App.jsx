import React, { useState, useEffect } from 'react';
import { 
  Tv, Film, UploadCloud, Settings, Search, 
  CheckCircle, ShieldAlert, Sparkles, BarChart2, Video
} from 'lucide-react';
import CloudinaryConfig from './components/CloudinaryConfig';
import VideoUpload from './components/VideoUpload';
import VideoPlayerWithAds from './components/VideoPlayerWithAds';
import VideoCard from './components/VideoCard';
import AdBanner from './components/AdBanner';

// Default configuration provided by user with server-side environment variables fallback
const DEFAULT_USER_CONFIG = {
  mode: 'signed',
  cloudName: 'dklhnq56v',
  apiKey: '873455389514395',
  configured: true
};

export default function App() {
  const [currentTab, setCurrentTab] = useState('library');
  const [cloudinaryConfig, setCloudinaryConfig] = useState(DEFAULT_USER_CONFIG);
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Load server configuration & video library from API on mount
  useEffect(() => {
    // 1. Fetch server-side Cloudinary config
    fetch('/api/cloudinary-config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.configured) {
          setCloudinaryConfig({
            mode: 'signed',
            cloudName: data.cloudName,
            apiKey: data.apiKey,
            configured: true
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load server config, falling back:', err);
      });

    // 2. Fetch persisted video library from server or fallback to localStorage (for Netlify)
    fetch('/api/videos')
      .then((res) => {
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          throw new Error('Server API not returning JSON (Netlify or static host)');
        }
        return res.json();
      })
      .then((serverVideos) => {
        if (Array.isArray(serverVideos)) {
          const cleanVideos = serverVideos.filter(v => v && v.id && !String(v.id).startsWith('demo-'));
          setVideos(cleanVideos);
          localStorage.setItem('cloudinary_videos', JSON.stringify(cleanVideos));
        }
      })
      .catch(() => {
        const savedVideos = localStorage.getItem('cloudinary_videos');
        if (savedVideos) {
          try {
            const parsed = JSON.parse(savedVideos);
            const filtered = Array.isArray(parsed) ? parsed.filter(v => v && v.id && !String(v.id).startsWith('demo-')) : [];
            setVideos(filtered);
          } catch {
            setVideos([]);
          }
        }
      });
  }, []);

  // Sync videos list to local storage and server
  const updateVideosList = (newVideosList) => {
    setVideos(newVideosList);
    localStorage.setItem('cloudinary_videos', JSON.stringify(newVideosList));
  };

  // Dynamic SEO Page Title & Meta description update
  useEffect(() => {
    if (selectedVideo) {
      document.title = `Watch ${selectedVideo.title} - VibePlayer HD Video`;
    } else if (currentTab === 'upload') {
      document.title = `Upload Video - VibePlayer Cloud Hosting`;
    } else if (currentTab === 'settings') {
      document.title = `Cloud Settings - VibePlayer Video Platform`;
    } else if (searchQuery.trim()) {
      document.title = `Search results for "${searchQuery}" - VibePlayer`;
    } else {
      document.title = `VibePlayer - Watch HD Videos, Viral Media & Streaming Platform`;
    }
  }, [selectedVideo, currentTab, searchQuery]);

  // Callback after saving Cloudinary config
  const handleConfigSave = (config) => {
    setCloudinaryConfig(config);
    showToast('Settings saved successfully!', 'success');
    setCurrentTab('library');
  };

  // Callback after uploading a video
  const handleUploadSuccess = (newVideo) => {
    const updatedVideos = [newVideo, ...videos];
    updateVideosList(updatedVideos);
    showToast(`"${newVideo.title}" uploaded and ad-monetized!`, 'success');
    setCurrentTab('library');
  };

  // Trigger toast alert helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Filter video library
  const filteredVideos = videos.filter(vid => 
    vid.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    vid.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalVideos = videos.length;
  const totalDurationSeconds = videos.reduce((acc, v) => acc + (v.duration || 0), 0);
  const totalDurationMin = Math.round(totalDurationSeconds / 60);

  return (
    <div className="app-container">
      {/* Header and Branding Navigation */}
      <header className="glass-panel main-header">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('library')}>
          <Tv className="brand-icon" size={32} />
          <span>VibePlayer</span>
        </div>

        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${currentTab === 'library' ? 'active' : ''}`}
            onClick={() => setCurrentTab('library')}
          >
            <Film size={16} /> Library
          </button>
          <button 
            className={`nav-tab ${currentTab === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentTab('upload')}
          >
            <UploadCloud size={16} /> Upload Video
          </button>
          <button 
            className={`nav-tab ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('settings')}
          >
            <Settings size={16} /> Settings
          </button>
        </nav>

        <div className="user-controls">
          <div className="settings-indicator">
            <CheckCircle size={14} /> Server Active
          </div>
        </div>
      </header>

      {/* Main Tab Render Views */}
      <main className="view-container">
        {currentTab === 'library' && (
          <div className="dashboard-grid view-container">
            {/* Left Main Content */}
            <div className="dashboard-main">
              {/* Leaderboard Horizontal Ad (728x90) */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <AdBanner bannerKey="e72872f3ed67b48725149e3ab09e20ff" width={728} height={90} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 className="section-title">
                  <Film className="brand-icon" size={24} />
                  Video Showcase
                </h2>
                
                {/* Search Bar */}
                <div className="search-bar">
                  <Search size={18} className="text-secondary" />
                  <input 
                    type="text" 
                    placeholder="Search videos..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredVideos.length > 0 ? (
                <div className="video-grid">
                  {filteredVideos.map((video) => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      onPlayClick={(vid) => setSelectedVideo(vid)}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-panel empty-state">
                  <Video className="empty-state-icon" size={60} />
                  <h3>No Videos Found</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
                    {searchQuery ? 'আপনার সার্চ কুয়েরির সাথে মিলছে এমন কোনো ভিডিও পাওয়া যায়নি।' : 'আপনার লাইব্রেরিতে কোনো ভিডিও নেই। নিচে ক্লিক করে ভিডিও আপলোড করুন।'}
                  </p>
                  {!searchQuery && (
                    <button className="btn" onClick={() => setCurrentTab('upload')} style={{ marginTop: '0.5rem' }}>
                      <UploadCloud size={16} /> First Video Upload
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="sidebar-panel">
              {/* Statistics Card */}
              <div className="glass-panel stats-card">
                <h3 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                  <BarChart2 className="brand-icon" size={18} /> Platform Stats
                </h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{totalVideos}</span>
                    <span className="stat-label">Videos</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{totalDurationMin}m</span>
                    <span className="stat-label">Playtime</span>
                  </div>
                </div>
                
                <div className="settings-info-box" style={{ marginTop: '1.25rem', border: '1px solid rgba(124, 58, 237, 0.15)', background: 'rgba(124, 58, 237, 0.03)' }}>
                  <div className="settings-info-title" style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    <Sparkles size={14} className="brand-icon" /> Automated Ads
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    প্রতিটি ভিডিওতে বিজ্ঞাপন অ্যাক্টিভেটেড। দর্শকরা প্রি-রোল ভিডিও ও ব্যানার বিজ্ঞাপন বাইপাস করতে পারবে না।
                  </p>
                </div>
              </div>

              {/* Skyscraper Vertical Ad in Sidebar (160x600) */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <AdBanner bannerKey="3edccdd43d3285847582bd8b37177eb4" width={160} height={600} />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'upload' && (
          <VideoUpload 
            cloudinaryConfig={cloudinaryConfig} 
            onUploadSuccess={handleUploadSuccess} 
            navigateToSettings={() => setCurrentTab('settings')}
          />
        )}

        {currentTab === 'settings' && (
          <CloudinaryConfig 
            onConfigSave={handleConfigSave} 
            currentConfig={cloudinaryConfig}
          />
        )}
      </main>

      {/* Focus Fullscreen Ad Player Overlay */}
      {selectedVideo && (
        <VideoPlayerWithAds 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Elegant Notification Toast System */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <ShieldAlert size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
      
      {/* Footer Branding */}
      <footer style={{ marginTop: 'auto', padding: '2rem 0 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
        <p>© {new Date().getFullYear()} VibePlayer - Cloudinary Video Player with Ad Integration.</p>
      </footer>
    </div>
  );
}
