import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Search, X, RefreshCw, ImageIcon,
  AlertCircle, ChevronLeft, ChevronRight, Upload
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';

interface GalleryItem {
  _id: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─────────────────────────────────────────────────────────────
// Upload Modal
// ─────────────────────────────────────────────────────────────

interface CategoryWithCount {
  category: string;
  count: number;
}

function GalleryUploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('');
  const [useExistingCategory, setUseExistingCategory] = useState(true);
  const [existingCategories, setExistingCategories] = useState<CategoryWithCount[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await apiClient.get<{ categories: CategoryWithCount[] }>('/gallery/admin/categories-with-counts');
        const cats = resp.data?.categories || [];
        setExistingCategories(cats);
        if (cats.length > 0) {
          setCategory(cats[0].category);
          setUseExistingCategory(true);
        } else {
          setUseExistingCategory(false);
        }
      } catch {
        setUseExistingCategory(false);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
      );
      setFiles((prev) => [...prev, ...newFiles].slice(0, 20));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadedImages: { imageUrl: string; category: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(Math.round(((i + 0.3) / files.length) * 100));

        // Get presigned URL
        const urlResp = await apiClient.post('/upload/url', {
          fileType: file.type,
          fileName: file.name,
          folder: 'gallery',
        });

        if (!urlResp.data?.success || !urlResp.data?.uploadUrl) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, publicUrl } = urlResp.data;

        // Upload to R2
        const uploadResp = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadResp.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        uploadedImages.push({
          imageUrl: publicUrl,
          category: category.trim() || 'General',
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Bulk create gallery entries
      await apiClient.post('/gallery/bulk', { images: uploadedImages });

      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload to Gallery</h2>
            <p className="mt-1 text-sm text-gray-500">Add images to your gallery collection</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Category <span className="text-gray-400">(Optional)</span>
            </label>
            
            {loadingCategories ? (
              <div className="flex items-center gap-2 py-3">
                <Spinner size="sm" />
                <span className="text-sm text-gray-500">Loading categories...</span>
              </div>
            ) : existingCategories.length > 0 ? (
              <div className="space-y-3">
                {/* Toggle between existing and new category */}
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseExistingCategory(true);
                      if (existingCategories.length > 0) {
                        setCategory(existingCategories[0].category);
                      }
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      useExistingCategory
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Existing Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseExistingCategory(false);
                      setCategory('');
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      !useExistingCategory
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    New Category
                  </button>
                </div>

                {useExistingCategory ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  >
                    {existingCategories.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category} ({cat.count} image{cat.count !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Events, Art, Behind the Scenes"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Events, Art, Behind the Scenes"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Images <span className="text-red-500">*</span>
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-red-400 hover:bg-red-50/30">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-600">Click to select images</p>
              <p className="mt-1 text-xs text-gray-400">Max 20 images, 10MB each</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{files.length} image(s) selected</p>
              <div className="grid grid-cols-4 gap-2">
                {files.map((file, idx) => (
                  <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="font-medium text-red-600">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="red" disabled={loading || files.length === 0} className="flex-1">
              {loading ? <Spinner size="sm" /> : `Upload ${files.length} Image${files.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Gallery Admin Tab
// ─────────────────────────────────────────────────────────────

export function GalleryAdminTab() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchImages = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter) params.set('category', categoryFilter);

      const resp = await apiClient.get<{ items: GalleryItem[]; pagination: PaginationData }>(
        `/gallery?${params.toString()}`
      );
      setImages(resp.data?.items || []);
      setPagination(resp.data?.pagination || null);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const resp = await apiClient.get<{ categories: string[] }>('/gallery/categories');
      setCategories(resp.data?.categories || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchImages(1);
    fetchCategories();
  }, [fetchImages, fetchCategories]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await apiClient.delete('/gallery/bulk', { data: { ids: Array.from(selectedIds) } });
      setSelectedIds(new Set());
      fetchImages();
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await apiClient.delete(`/gallery/${id}`);
      fetchImages();
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <motion.div
      key="gallery"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="mt-1 text-gray-500">Manage your gallery image collection</p>
        </div>
        <Button
          variant="red"
          onClick={() => setUploadModal(true)}
          className="shadow-lg shadow-red-500/25"
        >
          <Plus className="h-4 w-4" />
          Upload Images
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-60 max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchImages(1)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1">
            <button
              onClick={() => setCategoryFilter('')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                !categoryFilter ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === cat ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => fetchImages(1)}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-xl bg-red-50 p-4 ring-1 ring-inset ring-red-600/20">
          <span className="text-sm font-medium text-red-700">{selectedIds.size} image(s) selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Selected'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Image Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 font-semibold text-gray-900">No images yet</h3>
          <p className="mt-1 text-sm text-gray-500">Upload images to your gallery to get started</p>
          <button
            onClick={() => setUploadModal(true)}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Upload Images
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {images.map((img) => (
            <div
              key={img._id}
              className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                selectedIds.has(img._id)
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleSelect(img._id)}
            >
              <img
                src={img.imageUrl}
                alt={img.category}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Category badge */}
              <div className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {img.category}
              </div>
              {/* Select checkbox */}
              <div
                className={`absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${
                  selectedIds.has(img._id)
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-white/70 bg-white/30 opacity-0 group-hover:opacity-100'
                }`}
              >
                {selectedIds.has(img._id) && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSingle(img._id);
                }}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium text-gray-900">{pagination.total}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchImages(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchImages(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModal && (
          <GalleryUploadModal
            onClose={() => setUploadModal(false)}
            onSuccess={() => {
              fetchImages();
              fetchCategories();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
