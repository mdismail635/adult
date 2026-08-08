import React from 'react';
import { Play, Calendar, Clock, DollarSign, ShieldAlert } from 'lucide-react';

export default function VideoCard({ video, onPlayClick }) {
  // Format seconds to readable format MM:SS
  const formatDuration = (secs) => {
    if (!secs || isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format date to local readable string
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-panel-interactive video-card" onClick={() => onPlayClick(video)}>
      {/* Thumbnail with overlay badge & controls */}
      <div className="video-card-thumbnail-container">
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="video-card-thumbnail"
            loading="lazy"
            onError={(e) => {
              // Fallback image if thumbnail load fails (e.g. wrong format or loading state in Cloudinary)
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop";
            }}
          />
        ) : (
          <div className="video-card-thumbnail" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)' }} />
        )}
        
        {/* Ad Tag Overlay */}
        {video.adsEnabled && (
          <div className="video-card-ad-badge">
            <DollarSign size={10} style={{ strokeWidth: 3 }} /> AD Required
          </div>
        )}

        {/* Video Duration */}
        {video.duration > 0 && (
          <div className="video-card-duration">
            <Clock size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Hover Play Button Overlay */}
        <div className="video-card-play-overlay">
          <div className="play-overlay-button">
            <Play size={20} style={{ fill: 'currentColor', marginLeft: '2px' }} />
          </div>
        </div>
      </div>

      {/* Info details */}
      <div className="video-card-info">
        <h3 className="video-card-title" title={video.title}>
          {video.title}
        </h3>
        
        <p className="video-card-desc">
          {video.description || "No description provided."}
        </p>

        <div className="video-card-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={12} /> {formatDate(video.createdAt)}
          </span>
          <span style={{ color: 'var(--accent-pink)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ShieldAlert size={12} /> Ads Active
          </span>
        </div>
      </div>
    </div>
  );
}
