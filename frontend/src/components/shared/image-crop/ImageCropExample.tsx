/**
 * Example usage of LocalImageCropModal and RemoteImageCropModal
 * This file demonstrates how to integrate the crop modals in your components
 */

import React, { useState } from 'react';
import { LocalImageCropModal, RemoteImageCropModal } from './index';
import apiClient from '../../../api/client';

// ============================================
// EXAMPLE 1: Local Image Crop (Before Upload)
// ============================================
export const LocalCropExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleCropComplete = async (blob: Blob, previewUrl: string) => {
    // Set preview immediately
    setCroppedImage(previewUrl);

    // Upload to R2/backend
    const formData = new FormData();
    formData.append('image', blob, 'cropped-image.jpg');

    try {
      const response = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Upload successful:', response.data);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Upload Profile Picture</h2>
      
      {croppedImage && (
        <img
          src={croppedImage}
          alt="Cropped"
          className="w-32 h-32 rounded-full object-cover mb-4"
        />
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-red-500 text-white rounded-lg"
      >
        {croppedImage ? 'Change Image' : 'Upload Image'}
      </button>

      <LocalImageCropModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={1} // Square crop
        CircularCrop={true} // Circular preview for profile pics
        maxFileSize={5 * 1024 * 1024} // 5MB limit
      />
    </div>
  );
};

// ============================================
// EXAMPLE 2: Remote Image Crop (R2 Stored Image)
// ============================================
export const RemoteCropExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(
    'https://your-r2-bucket.example.com/images/original.jpg'
  );

  const handleDeleteOldImage = async () => {
    // Delete the old image from R2
    try {
      await apiClient.delete('/upload/image', {
        data: { url: currentImageUrl },
      });
      console.log('Old image deleted');
    } catch (error) {
      console.error('Failed to delete old image:', error);
      throw error; // Re-throw to stop the crop process
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    // Upload the new cropped image to R2
    const formData = new FormData();
    formData.append('image', blob, 'cropped-image.jpg');

    try {
      const response = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Update the current image URL with the new one
      setCurrentImageUrl(response.data.url);
      console.log('New image uploaded:', response.data.url);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Edit Event Banner</h2>
      
      <div className="relative group">
        <img
          src={currentImageUrl}
          alt="Event Banner"
          className="w-full h-48 object-cover rounded-xl"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium rounded-xl"
        >
          Edit Image
        </button>
      </div>

      <RemoteImageCropModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={currentImageUrl}
        onCropComplete={handleCropComplete}
        onDeleteOldImage={handleDeleteOldImage}
        aspectRatio={16 / 9} // Banner aspect ratio
        circularCrop={false}
        title="Edit Event Banner"
      />
    </div>
  );
};

// ============================================
// PROPS REFERENCE
// ============================================

/**
 * LocalImageCropModal Props:
 * --------------------------
 * isOpen: boolean - Controls modal visibility
 * onClose: () => void - Called when modal should close
 * onCropComplete: (blob: Blob, previewUrl: string) => void - Called with cropped image
 * aspectRatio?: number - Crop aspect ratio (default: 1)
 * maxFileSize?: number - Max file size in bytes (default: 10MB)
 * acceptedFileTypes?: string[] - Accepted MIME types (default: ['image/jpeg', 'image/png', 'image/webp'])
 * CircularCrop?: boolean - Use circular crop shape (default: false)
 */

/**
 * RemoteImageCropModal Props:
 * ---------------------------
 * isOpen: boolean - Controls modal visibility
 * onClose: () => void - Called when modal should close
 * imageUrl: string - URL of the image to crop (R2 URL)
 * onCropComplete: (blob: Blob) => Promise<void> - Called with cropped image blob
 * onDeleteOldImage?: () => Promise<void> - Called before upload to delete old image
 * aspectRatio?: number - Crop aspect ratio (default: 1)
 * circularCrop?: boolean - Use circular crop shape (default: false)
 * title?: string - Modal title (default: 'Edit Image')
 */

export default { LocalCropExample, RemoteCropExample };
