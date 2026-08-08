import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, CheckCircle2, ShieldAlert, ShieldCheck, Info } from 'lucide-react';

export default function VideoUpload({ onUploadSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    
    if (!selectedFile.type.startsWith('video/')) {
      setUploadError('অনুগ্রহ করে একটি ভিডিও ফাইল (.mp4, .mov, .avi, .webm) সিলেক্ট করুন।');
      setFile(null);
      return;
    }

    if (selectedFile.size > 500 * 1024 * 1024) {
      setUploadError('ভিডিও ফাইল সাইজ ৫০০ মেগাবাইটের নিচে হতে হবে।');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setUploadError('');
    const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
    setTitle(nameWithoutExt);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setUploadError('অনুগ্রহ করে একটি ভিডিও ফাইল নির্বাচন করুন।');
      return;
    }
    if (!title.trim()) {
      setUploadError('ভিডিওর জন্য একটি শিরোনাম দেওয়া আবশ্যক।');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);

    // Function to execute server fallback upload
    const uploadToServerProxy = () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title.trim());
        formData.append('description', description.trim());

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.video) {
                finishUploadSuccess(response.video);
              } else {
                setUploadError(response.error || 'ভিডিও আপলোড করতে সমস্যা হয়েছে।');
                setIsUploading(false);
              }
            } catch {
              setUploadError('রেসপন্স প্রসেস করতে ত্রুটি হয়েছে।');
              setIsUploading(false);
            }
          } else {
            let errorMsg = '';
            try {
              const errRes = JSON.parse(xhr.responseText);
              errorMsg = errRes.error || errRes.message;
            } catch {
              // If server returned non-JSON string/HTML
              if (xhr.status === 413) {
                errorMsg = 'ভিডিও ফাইলের আকার খুব বড় (500MB এর কম ফাইল আপলোড করুন)।';
              } else if (xhr.status === 400) {
                errorMsg = 'আপলোড রিকোয়েস্টটি সঠিকভাবে জমা নেওয়া যায়নি (স্ট্যাটাস: 400)। অনুগ্রহ করে আবার ট্রাই করুন।';
              } else {
                errorMsg = `সার্ভার ত্রুটি (স্ট্যাটাস: ${xhr.status})`;
              }
            }
            setUploadError(errorMsg || `আপলোড ব্যর্থ হয়েছে (স্ট্যাটাস: ${xhr.status})`);
            setIsUploading(false);
          }
        };

        xhr.onerror = () => {
          setUploadError('নেটওয়ার্ক সংযোগে সমস্যা। সার্ভারে কানেক্ট করা যাচ্ছে না।');
          setIsUploading(false);
        };

        xhr.open('POST', '/api/upload-video', true);
        xhr.send(formData);
      } catch (err) {
        setUploadError('আপলোড প্রসেসিং ব্যর্থ হয়েছে: ' + err.message);
        setIsUploading(false);
      }
    };

    const finishUploadSuccess = (newVideo) => {
      setUploadSuccess(true);
      setIsUploading(false);
      setFile(null);
      setTitle('');
      setDescription('');

      if (onUploadSuccess) {
        onUploadSuccess(newVideo);
      }

      setTimeout(() => {
        setUploadSuccess(false);
      }, 4000);
    };

    // Attempt direct Cloudinary signed upload first
    try {
      const sigRes = await fetch('/api/cloudinary-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'vibeplayer_videos' })
      });

      if (sigRes.ok) {
        const sigData = await sigRes.json();
        const { signature, timestamp, folder, cloudName, apiKey } = sigData;

        if (cloudName && apiKey && signature) {
          const cFormData = new FormData();
          cFormData.append('file', file);
          cFormData.append('api_key', apiKey);
          cFormData.append('timestamp', timestamp);
          cFormData.append('signature', signature);
          cFormData.append('folder', folder);

          const cXhr = new XMLHttpRequest();
          xhrRef.current = cXhr;

          cXhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percentComplete);
            }
          };

          cXhr.onload = async () => {
            if (cXhr.status === 200) {
              try {
                const cData = JSON.parse(cXhr.responseText);
                const videoUrl = cData.secure_url;
                const publicId = cData.public_id;
                const duration = cData.duration || 0;
                const thumbnailUrl = videoUrl.includes('/video/upload/')
                  ? videoUrl.replace('/video/upload/', '/video/upload/so_0/').replace(/\.[^/.]+$/, ".jpg")
                  : videoUrl.replace(/\.[^/.]+$/, ".jpg");

                // Save metadata to server database
                const saveRes = await fetch('/api/videos', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: publicId,
                    title: title.trim(),
                    description: description.trim(),
                    videoUrl,
                    thumbnailUrl,
                    duration
                  })
                });

                if (saveRes.ok) {
                  const saveResult = await saveRes.json();
                  finishUploadSuccess(saveResult.video);
                } else {
                  uploadToServerProxy();
                }
              } catch {
                uploadToServerProxy();
              }
            } else {
              // Direct Cloudinary upload returned error, fallback to server proxy
              uploadToServerProxy();
            }
          };

          cXhr.onerror = () => {
            uploadToServerProxy();
          };

          cXhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);
          cXhr.send(cFormData);
          return;
        }
      }
      
      // Fallback if signature fetching failed
      uploadToServerProxy();
    } catch {
      uploadToServerProxy();
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError('আপলোড বাতিল করা হয়েছে।');
    }
  };

  return (
    <div className="upload-container view-container">
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 className="section-title" style={{ color: '#fff', margin: 0 }}>
            <UploadCloud className="brand-icon" size={28} />
            Upload New Video
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '20px', color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: '500' }}>
            <ShieldCheck size={14} /> High Speed CDN Active
          </div>
        </div>

        <p className="form-label" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          আপনার ভিডিও ফাইল সিলেক্ট করুন। ভিডিওটি সার্ভারের মাধ্যমে বিশ্বমানের হাই-স্পিড নেটওয়ার্কে আপলোড হয়ে এইচডি কোয়ালিটিতে প্লে হবে।
        </p>

        <form onSubmit={handleUploadSubmit}>
          {/* File Dropzone */}
          {!file && !isUploading && (
            <div 
              className={`drag-drop-area ${isDragging ? 'dragover' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              style={{ cursor: 'pointer', padding: '3rem 1.5rem', textAlign: 'center' }}
            >
              <UploadCloud className="upload-icon" size={56} style={{ color: 'var(--accent-purple)', marginBottom: '1rem' }} />
              <div>
                <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff' }}>
                  Drag and drop your video file here
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  or click to browse from your device (MP4, MOV, WEBM, AVI)
                </p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="file-input"
                accept="video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Selected File Details */}
          {file && !isUploading && (
            <div className="settings-info-box" style={{ background: 'rgba(124, 58, 237, 0.08)', borderColor: 'rgba(124, 58, 237, 0.3)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileVideo className="brand-icon" size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '600', color: '#fff', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    File Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => setFile(null)}
                >
                  Change File
                </button>
              </div>
            </div>
          )}

              {/* Uploading progress state */}
              {isUploading && (
                <div className="upload-progress-container glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', marginBottom: '1.5rem' }}>
                  <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="pulse-glow" style={{ width: '10px', height: '10px', background: 'var(--accent-purple)', borderRadius: '50%', display: 'inline-block' }} />
                      Uploading Video...
                    </span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-purple)', fontSize: '1.1rem' }}>{uploadProgress}%</span>
                  </div>
                  <div className="progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="progress-bar" style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))', transition: 'width 0.2s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Please wait, processing video for global streaming...
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                      onClick={cancelUpload}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

          {/* Metadata Fields */}
          {(file || isUploading) && (
            <>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="videoTitle">Video Title *</label>
                <input
                  id="videoTitle"
                  type="text"
                  className="form-input"
                  placeholder="Enter video title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="videoDesc">Description</label>
                <textarea
                  id="videoDesc"
                  className="form-textarea"
                  placeholder="Enter video description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  rows={3}
                />
              </div>

              <div className="form-group" style={{ background: 'rgba(219, 39, 119, 0.05)', border: '1px solid rgba(219, 39, 119, 0.15)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-pink)', fontWeight: '600', fontSize: '0.9rem' }}>
                  <Info size={16} /> Auto Monetization Active
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.5' }}>
                  এই ভিডিওটি স্ট্রিম করার সময় অটোমেটিক ব্যানার ও সোশাল অ্যাড ডিসপ্লে করা হবে।
                </p>
              </div>

              {uploadError && (
                <div className="settings-info-box" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-red)', marginBottom: '1.25rem' }}>
                  <div className="settings-info-title" style={{ color: 'var(--accent-red)' }}>
                    <ShieldAlert size={18} /> Upload Error
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{uploadError}</p>
                </div>
              )}

              {uploadSuccess && (
                <div className="settings-info-box" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)', marginBottom: '1.25rem' }}>
                  <div className="settings-info-title" style={{ color: 'var(--accent-green)' }}>
                    <CheckCircle2 size={18} /> Upload Successful!
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>আপনার ভিডিওটি সফলভাবে আপলোড হয়েছে এবং ভিডিও লাইব্রেরিতে যোগ করা হয়েছে!</p>
                </div>
              )}

              {!isUploading && (
                <button type="submit" className="btn" style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                  <UploadCloud size={20} /> Upload Video
                </button>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
