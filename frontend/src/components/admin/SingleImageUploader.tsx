import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface SingleImageUploaderProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingImage?: string;
  onRemoveExisting?: () => void;
  label?: string;
  accept?: string;
}

export function SingleImageUploader({ 
  value, 
  onChange,
  existingImage,
  onRemoveExisting,
  label = 'Image',
  accept = 'image/*'
}: SingleImageUploaderProps) {
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => {
    return value ? URL.createObjectURL(value) : null;
  }, [value]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    onChange(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError('');

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    onChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const hasImage = preview || existingImage;
  const displayImage = preview || existingImage;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {hasImage ? (
        <div className="relative aspect-video overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50">
          <img
            src={displayImage}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <div className="flex h-full items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  if (onRemoveExisting) onRemoveExisting();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all
            ${dragOver 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-200 bg-gray-50/50 hover:border-indigo-400 hover:bg-gray-50'}
          `}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
            dragOver ? 'bg-indigo-100' : 'bg-gray-100'
          }`}>
            {dragOver ? (
              <ImageIcon className="h-6 w-6 text-indigo-600" />
            ) : (
              <Upload className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-700">
            {dragOver ? 'Drop image' : 'Click or drag to upload'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            PNG, JPG, GIF, WebP • Max 10MB
          </p>
        </div>
      )}

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
