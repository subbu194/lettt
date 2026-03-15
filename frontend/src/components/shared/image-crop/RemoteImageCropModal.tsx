import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Cropper, CircleStencil, RectangleStencil } from 'react-advanced-cropper';
import type { CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface RemoteImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageBlob: Blob) => Promise<void>;
  onDeleteOldImage?: () => Promise<void>;
  circularCrop?: boolean;
  title?: string;
}

const RemoteImageCropModal: React.FC<RemoteImageCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
  onDeleteOldImage,
  circularCrop = false,
  title = 'Edit Image',
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const cropperRef = useRef<CropperRef>(null);

  // Fetch image as data URL
  const fetchImageAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to data URL'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  // Load image when modal opens or URL changes
  useEffect(() => {
    if (isOpen && imageUrl) {
      loadImage();
    }
    return () => {
      setImageSrc(null);
      setError(null);
    };
  }, [isOpen, imageUrl]);

  const loadImage = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dataUrl = await fetchImageAsDataUrl(imageUrl);
      setImageSrc(dataUrl);
    } catch {
      setError('Failed to load the image. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrop = useCallback(async () => {
    if (!cropperRef.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Get cropped canvas
      setProcessingStep('Cropping image...');
      const canvas = cropperRef.current.getCanvas();
      if (!canvas) {
        setError('Failed to process the image. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Step 2: Convert to blob
      setProcessingStep('Processing...');
      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert canvas to blob'));
          },
          'image/jpeg',
          0.9
        );
      });

      // Step 3: Delete old image if handler provided
      if (onDeleteOldImage) {
        setProcessingStep('Removing old image...');
        await onDeleteOldImage();
      }

      // Step 4: Upload new cropped image
      setProcessingStep('Uploading new image...');
      await onCropComplete(croppedBlob);

      // Close modal on success
      handleClose();
    } catch (err) {
      console.error('Crop error:', err);
      setError('Failed to process the image. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [onCropComplete, onDeleteOldImage]);

  const handleClose = () => {
    if (isProcessing) return;
    setImageSrc(null);
    setError(null);
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-4xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {isLoading ? (
                // Loading State
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                  </div>
                  <p className="mt-4 text-gray-600">Loading image...</p>
                </div>
              ) : error && !imageSrc ? (
                // Error State (when image fails to load)
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="mt-4 text-gray-900 font-medium">Failed to load image</p>
                  <p className="mt-2 text-sm text-gray-500">{error}</p>
                  <button
                    onClick={loadImage}
                    className="mt-6 px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              ) : imageSrc ? (
                // Cropper Area
                <div className="relative">
                  <div className="relative h-80 bg-gray-900 rounded-2xl overflow-hidden">
                    <Cropper
                      ref={cropperRef}
                      src={imageSrc}
                      stencilComponent={circularCrop ? CircleStencil : RectangleStencil}
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
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                      <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={isProcessing}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                      
                      <span className="text-xs text-gray-500 font-medium px-2">Zoom</span>

                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={isProcessing}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRotate}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCw className="w-4 h-4 text-gray-700" />
                      <span className="text-sm text-gray-700 font-medium">Rotate</span>
                    </button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isProcessing}
                      className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCrop}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {processingStep || 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RemoteImageCropModal;
