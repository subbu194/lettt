import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: 'art' | 'events' | 'gallery' | 'uploads';
  label?: string;
  accept?: string;
}

interface UploadResponse {
  success: boolean;
  uploadUrl: string;
  publicUrl: string;
}

export function ImageUploader({ 
  value, 
  onChange, 
  folder = 'uploads',
  label = 'Image',
  accept = 'image/*'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // Simulate progress while getting URL
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 40));
      }, 100);

      // 1. Get presigned URL from backend
      let urlResponse;
      try {
        urlResponse = await apiClient.post<UploadResponse>('/upload/url', {
          fileType: file.type,
          fileName: file.name,
          folder,
        });
      } catch {
        clearInterval(progressInterval);
        throw new Error('Failed to get upload URL. Check if R2 storage is configured.');
      }

      clearInterval(progressInterval);
      setProgress(50);

      if (!urlResponse.data?.success || !urlResponse.data?.uploadUrl) {
        throw new Error('Invalid upload URL response from server');
      }

      const { uploadUrl, publicUrl } = urlResponse.data;

      // Validate the upload URL
      if (!uploadUrl.startsWith('https://')) {
        throw new Error('Invalid R2 upload URL. Please check R2 configuration.');
      }

      // 2. Upload file directly to R2 using presigned URL
      const uploadProgressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      try {
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }
      } catch (fetchErr) {
        clearInterval(uploadProgressInterval);
        if (fetchErr instanceof TypeError && fetchErr.message === 'Failed to fetch') {
          throw new Error('Failed to connect to storage. Check R2 endpoint configuration.');
        }
        throw fetchErr;
      }

      clearInterval(uploadProgressInterval);
      setProgress(100);

      // 3. Update the form with the public URL
      setTimeout(() => {
        onChange(publicUrl);
        setUploading(false);
        setProgress(0);
      }, 300);
    } catch (err) {
      console.error('Upload error:', err);
      const message = err instanceof Error ? err.message : getApiErrorMessage(err);
      setError(message);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      uploadFile(file);
    } else {
      setError('Please drop an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const clearImage = () => {
    onChange('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {!value && (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Link2 className="h-3.5 w-3.5" />
            {showUrlInput ? 'Upload file' : 'Use URL'}
          </button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {value ? (
          /* Preview uploaded image */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative aspect-video overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
          >
            <img
              src={value}
              alt="Uploaded"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            
            {/* Success badge and remove button */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Uploaded
              </span>
              <button
                type="button"
                onClick={clearImage}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-lg backdrop-blur-sm transition-colors hover:bg-red-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : showUrlInput ? (
          /* URL Input */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm placeholder:text-gray-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
            <p className="text-xs text-gray-400">Enter a direct URL to an image</p>
          </motion.div>
        ) : (
          /* Upload dropzone */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all
              ${dragOver 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 bg-gray-50/50 hover:border-indigo-400 hover:bg-gray-50'}
              ${uploading ? 'pointer-events-none' : ''}
            `}
          >
            {/* Progress overlay */}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm">
                <div className="relative">
                  <svg className="h-16 w-16" viewBox="0 0 100 100">
                    <circle
                      className="stroke-gray-200"
                      strokeWidth="8"
                      fill="none"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="stroke-indigo-600 transition-all duration-300"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="none"
                      r="42"
                      cx="50"
                      cy="50"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * progress) / 100}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-600">
                    {progress}%
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-600">Uploading...</p>
              </div>
            )}

            {!uploading && (
              <>
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                  dragOver ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  {dragOver ? (
                    <ImageIcon className="h-7 w-7 text-indigo-600" />
                  ) : (
                    <Upload className="h-7 w-7 text-gray-400" />
                  )}
                </div>
                <p className="mt-4 text-sm font-semibold text-gray-700">
                  {dragOver ? 'Drop to upload' : 'Click or drag to upload'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  PNG, JPG, GIF, WebP up to 10MB
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/20"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
