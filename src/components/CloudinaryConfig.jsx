import React, { useState } from 'react';
import { Settings, CheckCircle2, ShieldCheck, Globe, Sliders, Volume2 } from 'lucide-react';

export default function CloudinaryConfig() {
  const [autoPlay, setAutoPlay] = useState(true);
  const [quality, setQuality] = useState('1080p');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="settings-container view-container">
      <div className="glass-panel settings-card">
        <h2 className="section-title" style={{ color: '#fff', marginBottom: '1rem' }}>
          <Settings className="brand-icon" size={24} />
          Platform Settings & Preferences
        </h2>
        
        <div className="settings-info-box" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)', marginBottom: '1.5rem' }}>
          <div className="settings-info-title" style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} /> Global Fast Streaming CDN Active
          </div>
          <p style={{ color: 'var(--text-primary)', marginTop: '0.5rem', lineHeight: '1.6' }}>
            আপনার সমস্ত ভিডিও বিশ্বের যে কোনো প্রান্ত থেকে তাৎক্ষণিকভাবে এবং উচ্চ গতির সিডিএন নেটওয়ার্কের মাধ্যমে প্লে হবে।
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={16} className="brand-icon" /> Default Video Quality
            </label>
            <select 
              className="form-input" 
              value={quality} 
              onChange={(e) => setQuality(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}
            >
              <option value="1080p">Full HD (1080p) - High Quality</option>
              <option value="720p">HD (720p) - Balanced Data</option>
              <option value="auto">Adaptive Auto Quality</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={16} className="brand-icon" /> Player Autoplay Preference
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <input 
                type="checkbox" 
                id="autoplay-check" 
                checked={autoPlay} 
                onChange={(e) => setAutoPlay(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
              <label htmlFor="autoplay-check" style={{ color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
                Auto-play video immediately when selected from showcase
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent-green)' }} /> Server Security Status
            </label>
            <div style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-green)', fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} /> Credentials Fully Secured Server-Side (.env)
            </div>
          </div>

          {saved && (
            <div className="settings-info-box" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)' }}>
              <div className="settings-info-title" style={{ color: 'var(--accent-green)' }}>
                <CheckCircle2 size={18} /> Settings Updated
              </div>
              <p style={{ marginTop: '0.25rem' }}>আপনার পছন্দগুলো সফলভাবে সেভ করা হয়েছে।</p>
            </div>
          )}

          <button type="submit" className="btn" style={{ marginTop: '0.5rem' }}>
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
}
