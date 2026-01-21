import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';

interface ProfileImageUploaderProps {
  currentImage?: string;
  userName?: string;
  onImageUpdate: (imageUrl: string) => void;
}

export function ProfileImageUploader({ currentImage, userName, onImageUpdate }: ProfileImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (!userName) return '?';
    return userName.charAt(0).toUpperCase();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload to R2
    await uploadImage(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError('');

      // Step 1: Get presigned upload URL
      const { data: urlData } = await apiClient.post<{
        uploadUrl: string;
        publicUrl: string;
      }>('/upload/profile-image', {
        fileType: file.type,
        fileName: file.name,
      });

      // Step 2: Upload file to R2 using presigned URL
      const uploadResponse = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Step 3: Update profile with new image URL
      const { data: profileData } = await apiClient.put<{ user: { profileImage: string } }>(
        '/user/profile/details',
        { profileImage: urlData.publicUrl }
      );

      onImageUpdate(profileData.user.profileImage);
      setPreview(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      setError('');

      // Update profile to remove image
      await apiClient.put('/user/profile/details', { profileImage: '' });
      
      onImageUpdate('');
      setPreview(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="flex items-center gap-6">
        {/* Avatar Display */}
        <div className="relative">
          {displayImage ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src={displayImage}
                alt="Profile"
                className="h-full w-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-linear-to-br from-(--color-primary-red) to-(--color-primary-gold) text-3xl font-bold text-white shadow-lg">
              {getInitials()}
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-(--color-primary-red) px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {currentImage ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </button>
            
            {currentImage && !uploading && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
          
          <p className="text-xs text-(--color-text)/60">
            PNG, JPG, GIF • Max 5MB
          </p>
        </div>
      </div>

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
