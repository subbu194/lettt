import React, { useState, useCallback, useRef } from 'react';
import { Cropper, CircleStencil, RectangleStencil } from 'react-advanced-cropper';
import type { CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Upload, Check } from 'lucide-react';

interface LocalImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  CircularCrop?: boolean;
}

const LocalImageCropModal: React.FC<LocalImageCropModalProps> = ({
  isOpen,
  onClose,
  onCropComplete,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  CircularCrop = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<CropperRef>(null);

  // Read file as data URL
  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!acceptedFileTypes.includes(file.type)) {
      setError('Invalid file type. Please select JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`);
      return;
    }

    try {
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    } catch {
      setError('Failed to read the image. Please try again.');
    }
  };

  const handleCrop = useCallback(() => {
    if (!cropperRef.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      const canvas = cropperRef.current.getCanvas();
      if (!canvas) {
        setError('Failed to process the image. Please try again.');
        setIsProcessing(false);
        return;
      }

      canvas.toBlob(
        (blob: Blob | null) => {
          setIsProcessing(false);
          
          if (!blob) {
            setError('Failed to process the image. Please try again.');
            return;
          }

          const croppedImageUrl = URL.createObjectURL(blob);
          onCropComplete(blob, croppedImageUrl);
          
          // Reset state and close modal
          setImageSrc(null);
          setError(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onClose();
        },
        'image/jpeg',
        0.9
      );
    } catch {
      setError('Failed to crop the image. Please try again.');
      setIsProcessing(false);
    }
  }, [onCropComplete, onClose]);

  const handleClose = () => {
    setImageSrc(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleZoomIn = () => {
    if (cropperRef.current) {
      cropperRef.current.zoomImage(1.1);
    }
  };

  const handleZoomOut = () => {
    if (cropperRef.current) {
      cropperRef.current.zoomImage(0.9);
    }
  };

  const handleRotate = () => {
    if (cropperRef.current) {
      cropperRef.current.rotateImage(90);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Crop Image</h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {!imageSrc ? (
                // File Upload Area
                <div className="flex flex-col items-center justify-center py-20">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center cursor-pointer hover:from-red-100 hover:to-red-200 transition-all duration-300 group"
                  >
                    <Upload className="w-10 h-10 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">
                    Upload an image to crop
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Supports JPEG, PNG, and WebP up to {Math.round(maxFileSize / (1024 * 1024))}MB
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors duration-200"
                  >
                    Choose Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFileTypes.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                // Cropper Area
                <div className="relative">
                  <div className="relative h-80 bg-gray-900 rounded-2xl overflow-hidden">
                    <Cropper
                      ref={cropperRef}
                      src={imageSrc}
                      stencilComponent={CircularCrop ? CircleStencil : RectangleStencil}
                      stencilProps={{
                        movable: true,
                        resizable: true,
                        lines: true,
                        grid: true,
                      }}
                      className="h-full w-full"
                      backgroundClassName="bg-gray-900"
                    />
                  </div>

                  {/* Hint text */}
                  <p className="text-center text-xs text-gray-500 mt-3">
                    Drag edges/corners to resize • Drag inside to move crop area
                  </p>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                      <button
                        onClick={handleZoomOut}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        type="button"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                      
                      <span className="text-xs text-gray-500 font-medium px-2">Zoom</span>

                      <button
                        onClick={handleZoomIn}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        type="button"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    <button
                      onClick={handleRotate}
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    >
                      <RotateCw className="w-4 h-4 text-gray-700" />
                      <span className="text-sm text-gray-700 font-medium">Rotate</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setImageSrc(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                      Choose Different
                    </button>
                    <button
                      type="button"
                      onClick={handleCrop}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Crop & Apply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocalImageCropModal;
