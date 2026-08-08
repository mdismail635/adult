import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  SkipForward, ShoppingBag, DollarSign, ArrowLeft
} from 'lucide-react';
import AdBanner from './AdBanner';
import SocialAdContainer from './SocialAdContainer';

const DEFAULT_AD_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";

export default function VideoPlayerWithAds({ video, onClose }) {
  // Set isAdPlaying to false to turn off the 30-60s pre-roll video ads countdown
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [totalAdTime] = useState(0); 
  const [adCountdown, setAdCountdown] = useState(0);
  const [canSkipAd, setCanSkipAd] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mainVideoRef = useRef(null);
  const adVideoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const bannerTimerRef = useRef(null);

  // Auto-play main video on mount when pre-roll ads are off
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
      }, 300);
      return () => clearTimeout(playTimer);
    }
  }, [isAdPlaying]);

  // Handle Play/Pause
  const handlePlayPause = () => {
    if (isAdPlaying) {
      const adVid = adVideoRef.current;
      if (adVid) {
        if (isPlaying) {
          adVid.pause();
        } else {
          adVid.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
      }
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

  // Handle Skip Ad (Keep helper in case pre-rolls are turned back on)
  const handleSkipAd = () => {
    setIsAdPlaying(false);
    setIsPlaying(true);
    setAdCountdown(0);
    setCanSkipAd(false);
    
    // Open user's Direct Link popunder in a new tab when ad is skipped
    try {
      window.open("https://www.effectivecpmnetwork.com/jf5hm6pecw?key=fce7c69f35907acc5fda26e628d9e73f", "_blank");
    } catch (e) {
      console.warn("Popup blocked by browser security settings.", e);
    }
    
    // Play main video after switching
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
    const activeVideo = isAdPlaying ? adVideoRef.current : mainVideoRef.current;
    if (activeVideo) {
      activeVideo.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, isAdPlaying]);

  // Update Progress / Time
  const handleTimeUpdate = () => {
    const videoEl = isAdPlaying ? adVideoRef.current : mainVideoRef.current;
    if (videoEl && !isAdPlaying) {
      setCurrentTime(videoEl.currentTime);
      setProgress((videoEl.currentTime / videoEl.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    const videoEl = isAdPlaying ? adVideoRef.current : mainVideoRef.current;
    if (videoEl && !isAdPlaying) {
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
        <div className="video-player-container" ref={playerContainerRef}>
          {isAdPlaying ? (
            /* Pre-roll Ad Screen */
            <div className="ad-overlay-screen">
              <video
                ref={adVideoRef}
                className="ad-video"
                src={DEFAULT_AD_VIDEO}
                autoPlay
                playsInline
                loop
                onClick={handlePlayPause}
                onTimeUpdate={handleTimeUpdate}
              />
              <div className="ad-info-bar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="ad-badge-indicator">
                    <ShoppingBag size={12} /> Sponsored Ad
                  </div>
                  <div className="ad-countdown-pill">
                    Ad ends in: {adCountdown}s
                  </div>
                </div>

                {canSkipAd ? (
                  <button className="ad-skip-btn" onClick={handleSkipAd}>
                    Skip Ad <SkipForward size={16} />
                  </button>
                ) : (
                  <div className="ad-skip-locked-btn">
                    Skip Ad in {30 - (totalAdTime - adCountdown)}s
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Main Content Video */
            <>
              <video
                ref={mainVideoRef}
                className="html5-video"
                src={video.videoUrl}
                onClick={handlePlayPause}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Video Play Overlay Button (Middle) */}
              {!isPlaying && (
                <div className="video-card-play-overlay" style={{ opacity: 1, pointerEvents: 'none' }}>
                  <div className="play-overlay-button" style={{ pointerEvents: 'auto' }} onClick={handlePlayPause}>
                    <Play size={24} style={{ fill: 'currentColor' }} />
                  </div>
                </div>
              )}

              {/* Custom Player Controls Skin */}
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
            </>
          )}
        </div>

        {/* Video Info Detail Container */}
        {!isAdPlaying && (
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
        )}
      </div>
    </div>
  );
}
