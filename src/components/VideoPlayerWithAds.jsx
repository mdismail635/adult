import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  SkipForward, ShoppingBag, DollarSign, ArrowLeft
} from 'lucide-react';
import AdBanner from './AdBanner';
import SocialAdContainer from './SocialAdContainer';

export default function VideoPlayerWithAds({ video, onClose }) {
  // Interstitial Ad Overlay state
  const [isAdPlaying, setIsAdPlaying] = useState(video.adsEnabled !== false);
  const [adCountdown, setAdCountdown] = useState(3);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mainVideoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const bannerTimerRef = useRef(null);

  // 3-Second Auto-dismiss timer for Interstitial Ad
  useEffect(() => {
    if (isAdPlaying) {
      const timer = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto close ad and play video after 3 seconds
            setIsAdPlaying(false);
            setTimeout(() => {
              if (mainVideoRef.current) {
                mainVideoRef.current.play()
                  .then(() => setIsPlaying(true))
                  .catch(() => setIsPlaying(false));
              }
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAdPlaying]);

  // Auto-play main video when ad overlay is closed
  useEffect(() => {
    if (!isAdPlaying) {
      const playTimer = setTimeout(() => {
        const mainVid = mainVideoRef.current;
        if (mainVid) {
          mainVid.play()
            .then(() => setIsPlaying(true))
            .catch((e) => {
              console.log("Auto-play blocked by browser. User interaction required.", e);
              setIsPlaying(false);
            });
        }
      }, 200);
      return () => clearTimeout(playTimer);
    }
  }, [isAdPlaying]);

  // Handle Play/Pause
  const handlePlayPause = () => {
    if (isAdPlaying) {
      handleSkipAd();
    } else {
      const mainVid = mainVideoRef.current;
      if (mainVid) {
        if (isPlaying) {
          mainVid.pause();
        } else {
          mainVid.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
      }
    }
  };

  // Handle Skip Ad / Start Video
  const handleSkipAd = () => {
    setIsAdPlaying(false);
    setIsPlaying(true);
    
    // Attempt playback directly
    setTimeout(() => {
      const mainVid = mainVideoRef.current;
      if (mainVid) {
        mainVid.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }, 50);
  };

  // Sync Volume
  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Update Progress / Time
  const handleTimeUpdate = () => {
    const videoEl = mainVideoRef.current;
    if (videoEl) {
      setCurrentTime(videoEl.currentTime);
      if (videoEl.duration) {
        setProgress((videoEl.currentTime / videoEl.duration) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    const videoEl = mainVideoRef.current;
    if (videoEl) {
      setDuration(videoEl.duration);
    }
  };

  // Seek Progress
  const handleSeek = (e) => {
    if (isAdPlaying) return; // Cannot seek during ads
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const mainVid = mainVideoRef.current;
    if (mainVid) {
      mainVid.currentTime = pos * mainVid.duration;
      setProgress(pos * 100);
    }
  };

  // Format Time
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error(err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="player-overlay">
      <div className="player-content-wrapper">
        <div className="player-header">
          {/* Obvious "Back to Library" Navigation Button */}
          <button 
            className="btn btn-secondary" 
            style={{ 
              padding: '0.5rem 1.25rem', 
              fontSize: '0.85rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              borderRadius: '8px'
            }}
            onClick={() => {
              if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
              onClose();
            }}
            aria-label="Back to Library"
          >
            <ArrowLeft size={16} /> Back to Library
          </button>
          
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isAdPlaying ? 'Playing Sponsored Ad...' : video.title}
          </h2>
        </div>

        {/* Custom Video Player Container */}
        <div className="video-player-container" ref={playerContainerRef} style={{ position: 'relative' }}>
          {/* Main Content Video - Always rendered so it buffers and plays smoothly */}
          <video
            ref={mainVideoRef}
            className="html5-video"
            src={video.videoUrl}
            onClick={handlePlayPause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            controls={false}
            playsInline
          />

          {/* Interstitial (ইন্ডাস্ট্রিয়াল) Ad Screen Overlay on top of video */}
          {isAdPlaying && (
            <div 
              className="ad-overlay-screen" 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 30, 
                background: 'rgba(10, 10, 22, 0.92)', 
                backdropFilter: 'blur(8px)',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justify: 'center', 
                padding: '1rem',
                overflowY: 'auto'
              }}
            >
              <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(236, 72, 153, 0.2)', color: 'var(--accent-pink)', border: '1px solid var(--accent-pink)', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingBag size={13} /> স্পন্সর এড (Sponsored Ad)
              </div>

              {/* Interstitial Ad Banner Component */}
              <div style={{ margin: '1.5rem 0 0.75rem 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <AdBanner bannerKey="e72872f3ed67b48725149e3ab09e20ff" width={468} height={60} />
              </div>

              {/* High-Converting Direct Link Card */}
              <div 
                onClick={handleSkipAd}
                style={{ 
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)',
                  border: '2px solid var(--accent-purple)',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  maxWidth: '460px',
                  width: '90%',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
                  marginBottom: '1rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                  🔥 বিশেষ স্পন্সর অফার (Click to Play Video)
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                  সরাসরি ভিডিও প্লে করতে বা অফার দেখতে এখানে ক্লিক করুন
                </div>
                <div style={{ background: 'var(--accent-purple)', color: '#fff', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <DollarSign size={15} /> ভিডিও প্লে করুন / Skip Ad
                </div>
              </div>

              {/* Timer Bar & Skip Action */}
              <div className="ad-info-bar" style={{ width: '90%', maxWidth: '460px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.08)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <div className="ad-countdown-pill" style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>
                  {adCountdown > 0 ? `অটো-প্লে হতে বাকি: ${adCountdown}s` : 'ভিডিও প্লে হচ্ছে...'}
                </div>

                <button 
                  className="ad-skip-btn" 
                  onClick={handleSkipAd} 
                  style={{ 
                    background: 'var(--accent-pink)', 
                    color: '#fff', 
                    padding: '0.45rem 0.9rem', 
                    borderRadius: '6px', 
                    fontWeight: '600', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Skip Ad / ভিডিও প্লে করুন <SkipForward size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Video Play Overlay Button (Middle) */}
          {!isPlaying && !isAdPlaying && (
            <div className="video-card-play-overlay" style={{ opacity: 1, pointerEvents: 'none' }}>
              <div className="play-overlay-button" style={{ pointerEvents: 'auto' }} onClick={handlePlayPause}>
                <Play size={24} style={{ fill: 'currentColor' }} />
              </div>
            </div>
          )}

          {/* Custom Player Controls Skin */}
          {!isAdPlaying && (
            <div className="player-controls-bar">
              {/* Timeline slider */}
              <div className="timeline-slider-container" onClick={handleSeek}>
                <div className="timeline-progress" style={{ width: `${progress}%` }}>
                  <div className="timeline-handle" />
                </div>
              </div>

              {/* Buttons Row */}
              <div className="controls-buttons">
                <div className="left-controls">
                  <button className="control-btn" onClick={handlePlayPause}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <div className="volume-container">
                    <button className="control-btn" onClick={() => setIsMuted(!isMuted)}>
                      {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <div 
                      className="volume-slider" 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const val = (e.clientX - rect.left) / rect.width;
                        setVolume(Math.max(0, Math.min(1, val)));
                        setIsMuted(false);
                      }}
                    >
                      <div className="volume-progress" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                    </div>
                  </div>

                  <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="right-controls">
                  <button className="control-btn" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Info Detail Container */}
        <div className="player-video-info">
          <div className="player-video-meta">
            <span>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span style={{ color: 'var(--accent-pink)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <DollarSign size={12} /> Real Ads Active
            </span>
          </div>
          <h1 className="player-video-title" style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>
            {video.title}
          </h1>
          <p className="player-video-desc">{video.description || "No description provided."}</p>
          
          {/* Embed actual Social & Banner Ads below video details */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                Bottom Banner Ad
              </div>
              <AdBanner bannerKey="2c37dfa939d7829280b17bf0481a3a06" width={468} height={60} />
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                Sponsored Native Content
              </div>
              <SocialAdContainer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
