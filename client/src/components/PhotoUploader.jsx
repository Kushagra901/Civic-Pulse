import { useState, useRef, useCallback } from 'react';
import { api } from '../api';

const MAX_PHOTOS = 5;

export default function PhotoUploader({ onChange }) {
  const [files,     setFiles]     = useState([]);  // { file, preview, url, status }
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef();

  // Upload a single file to Cloudinary using a signed URL
  const uploadFile = useCallback(async (file) => {
    // 1. Ask your API for a signed URL
    const { signature, timestamp, cloudName, apiKey, folder, eager }
      = await api.get('/uploads/sign?folder=incidents');

    // 2. Build the FormData Cloudinary expects
    const formData = new FormData();
    formData.append('file',      file);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);
    formData.append('api_key',   apiKey);
    formData.append('folder',    folder);
    formData.append('eager',     eager);

    // 3. POST directly to Cloudinary — NOT your own server
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData },
    );

    if (!res.ok) throw new Error('Upload failed');

    const data = await res.json();

    // Return the secure CDN URL of the uploaded image
    return data.secure_url;
  }, []);

  const processFiles = useCallback(async (newFiles) => {
    const remaining = MAX_PHOTOS - files.length;
    const toProcess = Array.from(newFiles).slice(0, remaining);

    if (toProcess.length === 0) return;

    // Validate client-side before uploading
    const invalid = toProcess.find(f => {
      if (!f.type.startsWith('image/')) return true;
      if (f.size > 8 * 1024 * 1024) return true;
      return false;
    });

    if (invalid) {
      alert('Only images under 8 MB are allowed.');
      return;
    }

    // Create placeholder entries with local previews immediately
    const placeholders = toProcess.map(file => ({
      id:      crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      url:     null,
      status:  'uploading',  // uploading | done | error
      error:   null,
    }));

    setFiles(prev => [...prev, ...placeholders]);

    // Upload each file and update its entry as results come in
    const results = await Promise.allSettled(
      placeholders.map(p => uploadFile(p.file))
    );

    setFiles(prev => {
      const next = prev.map(entry => {
        const idx = placeholders.findIndex(p => p.id === entry.id);
        if (idx === -1) return entry;

        const result = results[idx];
        if (result.status === 'fulfilled') {
          return { ...entry, url: result.value, status: 'done' };
        }
        return { ...entry, status: 'error', error: 'Upload failed' };
      });

      // Notify parent with successfully uploaded URLs
      onChange(next.filter(e => e.status === 'done').map(e => e.url));
      return next;
    });
  }, [files.length, uploadFile, onChange]);

  const removeFile = (id) => {
    setFiles(prev => {
      const next = prev.filter(e => e.id !== id);
      // Release object URL to avoid memory leak
      const removed = prev.find(e => e.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      onChange(next.filter(e => e.status === 'done').map(e => e.url));
      return next;
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">

      {/* Drop zone — hidden once max photos reached */}
      {files.length < MAX_PHOTOS && (
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-colors
            ${dragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
        >
          <p className="text-sm font-medium text-gray-600">
            Drag photos here or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Up to {MAX_PHOTOS} photos · JPG, PNG, WebP · max 8 MB each
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => processFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {files.map((entry) => (
            <div key={entry.id} className="relative aspect-square rounded-lg overflow-hidden
                                           bg-gray-100 group">
              <img
                src={entry.preview}
                alt=""
                className={`w-full h-full object-cover transition-opacity
                  ${entry.status === 'uploading' ? 'opacity-50' : 'opacity-100'}`}
              />

              {/* Uploading spinner */}
              {entry.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {entry.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/60 flex items-center
                                justify-center">
                  <span className="text-white text-xs font-medium">Failed</span>
                </div>
              )}

              {/* Done — remove button on hover */}
              {entry.status === 'done' && (
                <button
                  type="button"
                  onClick={() => removeFile(entry.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full
                             text-white text-xs flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      {files.length > 0 && (
        <p className="text-xs text-gray-400">
          {files.filter(f => f.status === 'done').length} of {MAX_PHOTOS} photos uploaded
        </p>
      )}
    </div>
  );
}
