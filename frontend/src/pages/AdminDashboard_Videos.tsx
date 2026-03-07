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
  duration?: string;
  isFeatured: boolean;
  createdAt: string;
}

function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:shorts\/|live\/|v\/|embed\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
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
  const [title, setTitle] = useState(video?.title || '');
  const [description, setDescription] = useState(video?.description || '');
  const [youtubeUrl, setYoutubeUrl] = useState(video?.youtubeUrl || '');
  const [season, setSeason] = useState(video?.season || 1);
  const [episodeNumber, setEpisodeNumber] = useState<string | number>(video?.episodeNumber || '');
  const [duration, setDuration] = useState(video?.duration || '');
  const [isFeatured, setIsFeatured] = useState(video?.isFeatured || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const videoId = extractYouTubeId(youtubeUrl);
  const ytThumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        youtubeUrl,
        season: Number(season),
        episodeNumber: episodeNumber ? Number(episodeNumber) : undefined,
        duration: duration || undefined,
        isFeatured,
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
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
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                placeholder="e.g. 15:30"
              />
            </div>
          </div>

          {/* Thumbnail Preview */}
          {ytThumb && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Preview
              </label>
              <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                <img
                  src={ytThumb}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
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

          <div className="flex gap-3 pt-4">
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
              disabled={loading}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : video ? 'Update Video' : 'Add Video'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
