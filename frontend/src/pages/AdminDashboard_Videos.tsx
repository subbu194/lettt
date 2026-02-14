// This file contains the video management components for AdminDashboard
// Import this into the main AdminDashboard.tsx file

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';

interface VideoItem {
  _id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  season: number;
  episodeNumber?: number;
  thumbnail?: string;
  isFeatured: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Video Form Modal
// ─────────────────────────────────────────────────────────────

export function VideoFormModal({ 
  video, 
  onClose, 
  onSuccess 
}: { 
  video?: VideoItem | null; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: video?.title || '',
    description: video?.description || '',
    youtubeUrl: video?.youtubeUrl || '',
    season: video?.season || 1,
    episodeNumber: video?.episodeNumber || '',
    thumbnail: video?.thumbnail || '',
    isFeatured: video?.isFeatured || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        youtubeUrl: form.youtubeUrl,
        season: Number(form.season),
        episodeNumber: form.episodeNumber ? Number(form.episodeNumber) : undefined,
        thumbnail: form.thumbnail || undefined,
        isFeatured: form.isFeatured,
      };

      if (video?._id) {
        await apiClient.put(`/talkshow/${video._id}`, payload);
      } else {
        await apiClient.post('/talkshow', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl my-8"
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {video ? 'Edit Video' : 'Add New Video'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {video ? 'Update the video details below' : 'Fill in the details to add a new talk show video'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
              placeholder="Enter video title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
              placeholder="Enter video description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.season}
                onChange={(e) => setForm({ ...form, season: Number(e.target.value) })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Episode Number
              </label>
              <input
                type="number"
                min={1}
                value={form.episodeNumber}
                onChange={(e) => setForm({ ...form, episodeNumber: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Thumbnail URL (Optional)
            </label>
            <input
              type="url"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
              placeholder="Leave empty to use YouTube thumbnail"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Feature this video
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}
        </form>

        <div className="flex gap-3 border-t border-gray-100 p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : video ? 'Update Video' : 'Add Video'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
