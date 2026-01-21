import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle, GripVertical } from 'lucide-react';

interface MultiImageUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
  label?: string;
  maxImages?: number;
  accept?: string;
}

export function MultiImageUploader({ 
  value = [], 
  onChange, 
  label = 'Images',
  maxImages = 10,
  accept = 'image/*'
}: MultiImageUploaderProps) {
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URLs for files
  const previews = useMemo(() => {
    return value.map(file => URL.createObjectURL(file));
  }, [value]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');
    
    if (files.length + value.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Some files exceed 10MB and were skipped');
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChange([...value, ...validFiles]);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError('');

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    
    if (files.length + value.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Some files exceed 10MB and were skipped');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChange([...value, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const newFiles = [...value];
    const [moved] = newFiles.splice(from, 1);
    newFiles.splice(to, 0, moved);
    onChange(newFiles);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {value.length > 0 && <span className="text-gray-400">({value.length}/{maxImages})</span>}
        </label>
        {value.length > 0 && (
          <span className="text-xs text-indigo-600 font-medium">
            First image is the main display
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {previews.map((preview, index) => (
            <motion.div
              key={`${value[index].name}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50"
            >
              <img
                src={preview}
                alt={value[index].name}
                className="h-full w-full object-cover"
              />
              
              {/* Main Image Badge */}
              {index === 0 && (
                <div className="absolute left-2 top-2">
                  <span className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
                    Main
                  </span>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-full items-center justify-center gap-2">
                  {/* Move left */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                      title="Move left"
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </button>
                  )}
                  
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  {/* Move right */}
                  {index < value.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                      title="Move right"
                    >
                      <GripVertical className="h-4 w-4 -rotate-90" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {value.length < maxImages && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all
            ${dragOver 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-200 bg-gray-50/50 hover:border-indigo-400 hover:bg-gray-50'}
          `}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            dragOver ? 'bg-indigo-100' : 'bg-gray-100'
          }`}>
            {dragOver ? (
              <ImageIcon className="h-5 w-5 text-indigo-600" />
            ) : (
              <Upload className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <p className="mt-2 text-xs font-semibold text-gray-700">
            {dragOver ? 'Drop images' : 'Add more images'}
          </p>
          <p className="mt-1 text-[10px] text-gray-400">
            {maxImages - value.length} remaining
          </p>
        </motion.div>
      )}

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
