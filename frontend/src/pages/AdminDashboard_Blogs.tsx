// AdminDashboard_Blogs.tsx
// Blog management components for AdminDashboard

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, AlertCircle, Plus, Trash2, GripVertical,
  Image as ImageIcon, Quote, Minus, ChevronUp, ChevronDown,
  Eye, EyeOff, Star, HeadingIcon, AlignLeft, AlignCenter,
  AlignRight, Maximize2, BookOpen, Edit2
} from 'lucide-react';
import { SingleImageUploader } from '@/components/admin/SingleImageUploader';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type BlockType = 'paragraph' | 'heading' | 'image' | 'quote' | 'divider';
type ImageAlign = 'left' | 'right' | 'center' | 'full';

interface ContentBlock {
  type: BlockType;
  text?: string;
  level?: 1 | 2 | 3;
  url?: string;
  caption?: string;
  align?: ImageAlign;
}

export interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  subject: string;
  coverImage: string;
  logo?: string;
  extraImages: string[];
  content: ContentBlock[];
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Upload helper (same pattern as art form)
// ─────────────────────────────────────────────────────────────

async function uploadFile(file: File, folder: string): Promise<string> {
  const { data } = await apiClient.post('/upload/url', {
    fileType: file.type,
    fileName: file.name,
    folder,
  });
  if (!data?.success || !data?.uploadUrl) throw new Error('Failed to get upload URL');
  const uploadResp = await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!uploadResp.ok) throw new Error(`Failed to upload ${file.name}`);
  return data.publicUrl as string;
}

async function uploadFiles(files: File[], folder: string): Promise<string[]> {
  const results: string[] = [];
  for (const f of files) results.push(await uploadFile(f, folder));
  return results;
}

// ─────────────────────────────────────────────────────────────
// Block helpers
// ─────────────────────────────────────────────────────────────

const newBlock = (type: BlockType): ContentBlock => {
  if (type === 'heading') return { type, text: '', level: 2 };
  if (type === 'paragraph') return { type, text: '' };
  if (type === 'quote') return { type, text: '' };
  if (type === 'image') return { type, url: '', caption: '', align: 'center' };
  return { type }; // divider
};

const blockLabel: Record<BlockType, string> = {
  paragraph: 'Paragraph', heading: 'Heading', image: 'Image', quote: 'Quote', divider: 'Divider',
};

const blockIcon: Record<BlockType, React.ElementType> = {
  paragraph: AlignLeft, heading: HeadingIcon, image: ImageIcon, quote: Quote, divider: Minus,
};

// ─────────────────────────────────────────────────────────────
// Single Content Block Editor
// ─────────────────────────────────────────────────────────────

function BlockEditor({
  block, index, total, onChange, onRemove, onMoveUp, onMoveDown,
}: {
  block: ContentBlock; index: number; total: number;
  onChange: (u: ContentBlock) => void; onRemove: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
}) {
  const Icon = blockIcon[block.type];
  return (
    <div className="group rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 bg-gray-50 border-b border-gray-200 px-3 py-2">
        <GripVertical size={14} className="text-gray-300 cursor-grab" />
        <Icon size={14} className="text-gray-500" />
        <span className="flex-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">{blockLabel[block.type]}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onMoveUp} disabled={index === 0}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronUp size={13} /></button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronDown size={13} /></button>
          <button type="button" onClick={onRemove}
            className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {block.type === 'paragraph' && (
          <textarea value={block.text ?? ''} onChange={e => onChange({ ...block, text: e.target.value })}
            placeholder="Write your paragraph here…" rows={4}
            className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition" />
        )}
        {block.type === 'heading' && (
          <div className="flex gap-2">
            <select value={block.level ?? 2} onChange={e => onChange({ ...block, level: Number(e.target.value) as 1|2|3 })}
              className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30">
              <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
            </select>
            <input type="text" value={block.text ?? ''} onChange={e => onChange({ ...block, text: e.target.value })}
              placeholder="Heading text…"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 transition" />
          </div>
        )}
        {block.type === 'quote' && (
          <textarea value={block.text ?? ''} onChange={e => onChange({ ...block, text: e.target.value })}
            placeholder="Quote text…" rows={3}
            className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm italic text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400/30 transition" />
        )}
        {block.type === 'divider' && (
          <div className="flex items-center gap-3 py-1 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" /><span>decorative divider</span><div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
        {block.type === 'image' && (
          <div className="space-y-2">
            <input type="text" value={block.url ?? ''} onChange={e => onChange({ ...block, url: e.target.value })}
              placeholder="Image URL (upload via the Upload section and paste the URL here)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 transition" />
            <input type="text" value={block.caption ?? ''} onChange={e => onChange({ ...block, caption: e.target.value })}
              placeholder="Caption (optional)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 transition" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Align / Wrap:</span>
              {([
                { val: 'left' as ImageAlign, label: 'Float Left', icon: AlignLeft },
                { val: 'center' as ImageAlign, label: 'Center', icon: AlignCenter },
                { val: 'right' as ImageAlign, label: 'Float Right', icon: AlignRight },
                { val: 'full' as ImageAlign, label: 'Full Width', icon: Maximize2 },
              ]).map(opt => (
                <button key={opt.val} type="button" onClick={() => onChange({ ...block, align: opt.val })}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    block.align === opt.val ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  <opt.icon size={12} />{opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Float Left / Right wraps text around the image (magazine style). Center = standard. Full Width = spans entire article.
            </p>
            {block.url && <img src={block.url} alt="preview" className="mt-1 max-h-40 rounded-lg object-cover" onError={() => {}} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Blog Form Modal
// ─────────────────────────────────────────────────────────────

export function BlogFormModal({
  blog, onClose, onSuccess,
}: { blog?: BlogItem | null; onClose: () => void; onSuccess: () => void; }) {
  const isEditing = !!blog?._id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(blog?.title ?? '');
  const [subject, setSubject] = useState(blog?.subject ?? '');
  const [excerpt, setExcerpt] = useState(blog?.excerpt ?? '');
  const [tags, setTags] = useState(blog?.tags?.join(', ') ?? '');
  const [isFeatured, setIsFeatured] = useState(blog?.isFeatured ?? false);
  const [isPublished, setIsPublished] = useState(blog?.isPublished ?? false);

  // Cover image — new file or existing URL
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [existingCoverImage, setExistingCoverImage] = useState(blog?.coverImage ?? '');

  // Logo — new file or existing URL
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogo, setExistingLogo] = useState(blog?.logo ?? '');

  // Extra images
  const [extraImageFiles, setExtraImageFiles] = useState<File[]>([]);
  const [existingExtraImages, setExistingExtraImages] = useState<string[]>(blog?.extraImages ?? []);

  // Content blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>(blog?.content ?? []);

  const addBlock = (type: BlockType) => setBlocks(prev => [...prev, newBlock(type)]);
  const updateBlock = (i: number, updated: ContentBlock) => setBlocks(prev => prev.map((b, idx) => idx === i ? updated : b));
  const removeBlock = (i: number) => setBlocks(prev => prev.filter((_, idx) => idx !== i));
  const moveBlock = (i: number, dir: 'up' | 'down') => {
    setBlocks(prev => {
      const arr = [...prev];
      const t = dir === 'up' ? i - 1 : i + 1;
      if (t < 0 || t >= arr.length) return arr;
      [arr[i], arr[t]] = [arr[t], arr[i]];
      return arr;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverImageFile && !existingCoverImage) { setError('Cover image is required'); return; }

    setLoading(true); setUploading(true); setError('');
    try {
      let coverImageUrl = existingCoverImage;
      if (coverImageFile) coverImageUrl = await uploadFile(coverImageFile, 'blogs');

      let logoUrl: string | undefined = existingLogo || undefined;
      if (logoFile) logoUrl = await uploadFile(logoFile, 'blogs');

      let extraUrls = [...existingExtraImages];
      if (extraImageFiles.length > 0) {
        const newUrls = await uploadFiles(extraImageFiles, 'blogs');
        extraUrls = [...extraUrls, ...newUrls];
      }

      setUploading(false);

      const payload = {
        title: title.trim(), subject: subject.trim(), excerpt: excerpt.trim(),
        coverImage: coverImageUrl, logo: logoUrl,
        extraImages: extraUrls.slice(0, 3),
        content: blocks,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        isFeatured, isPublished,
      };

      if (isEditing) await apiClient.put(`/blogs/${blog!._id}`, payload);
      else await apiClient.post('/blogs', payload);

      onSuccess(); onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false); setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }} transition={{ type: 'spring', duration: 0.4 }}
        className="relative w-full max-w-4xl my-6 rounded-3xl bg-gray-50 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-3xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white"><BookOpen size={18} /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Blog' : 'New Blog'}</h2>
              <p className="text-xs text-gray-500">Magazine-style article editor</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={16} />{error}
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-blue-700" />
              Uploading images, please wait…
            </div>
          )}

          {/* Basic Info */}
          <section>
            <h3 className="mb-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Basic Info</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-600">Title *</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Blog title"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition" />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-600">Subject / Person / Company *</label>
                <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. John Doe, Acme Corp"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition" />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 text-xs font-semibold text-gray-600">Excerpt * <span className="text-gray-400 font-normal">(max 400 chars — shown on blog cards)</span></label>
                <textarea required value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description…" maxLength={400} rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 transition" />
                <p className="mt-1 text-right text-xs text-gray-400">{excerpt.length}/400</p>
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-600">Tags <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="talent, music, startup"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 transition" />
              </div>
              <div className="flex items-center gap-6 pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-red-600 w-4 h-4" />
                  <span className="text-sm text-gray-700 font-medium flex items-center gap-1">
                    {isPublished ? <Eye size={15} className="text-green-600" /> : <EyeOff size={15} className="text-gray-400" />} Published
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="accent-red-600 w-4 h-4" />
                  <span className="text-sm text-gray-700 font-medium flex items-center gap-1">
                    <Star size={15} className={isFeatured ? 'text-amber-500' : 'text-gray-400'} /> Featured
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Cover Image */}
          <section>
            <h3 className="mb-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Cover Image *</h3>
            <SingleImageUploader
              value={coverImageFile} onChange={setCoverImageFile}
              existingImage={existingCoverImage || undefined}
              onRemoveExisting={() => setExistingCoverImage('')}
              label="Cover Image"
            />
          </section>

          {/* Logo */}
          <section>
            <h3 className="mb-1 text-sm font-bold text-gray-700 uppercase tracking-wider">Logo <span className="text-gray-400 font-normal text-xs">(optional)</span></h3>
            <p className="mb-3 text-xs text-gray-500">Company / person logo — shown as a small circle badge on the blog card and in the article header.</p>
            <SingleImageUploader
              value={logoFile} onChange={setLogoFile}
              existingImage={existingLogo || undefined}
              onRemoveExisting={() => setExistingLogo('')}
              label="Logo"
            />
          </section>

          {/* Extra Images */}
          <section>
            <h3 className="mb-1 text-sm font-bold text-gray-700 uppercase tracking-wider">Extra Images <span className="text-gray-400 font-normal text-xs">(max 3 total)</span></h3>
            <p className="mb-3 text-xs text-gray-500">Displayed as a photo strip at the top of the blog article.</p>
            {existingExtraImages.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {existingExtraImages.map((url, i) => (
                  <div key={i} className="group relative w-24 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setExistingExtraImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {(existingExtraImages.length + extraImageFiles.length) < 3 && (
              <MultiImageUploader
                value={extraImageFiles} onChange={setExtraImageFiles}
                label={`Add Extra Images (${existingExtraImages.length + extraImageFiles.length}/3)`}
                maxImages={3 - existingExtraImages.length}
              />
            )}
            {(existingExtraImages.length + extraImageFiles.length) >= 3 && (
              <p className="text-xs text-gray-500 bg-gray-100 rounded-xl px-3 py-2">Maximum 3 extra images reached.</p>
            )}
          </section>

          {/* Content Blocks */}
          <section>
            <h3 className="mb-1 text-sm font-bold text-gray-700 uppercase tracking-wider">Article Content</h3>
            <p className="mb-4 text-xs text-gray-500">
              Build your article block by block. Use <strong>Float Left / Float Right</strong> on Image blocks to wrap text around them — magazine style.
            </p>
            <div className="space-y-3">
              {blocks.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                  No content yet — add blocks using the toolbar below
                </div>
              )}
              {blocks.map((block, i) => (
                <BlockEditor key={i} block={block} index={i} total={blocks.length}
                  onChange={updated => updateBlock(i, updated)} onRemove={() => removeBlock(i)}
                  onMoveUp={() => moveBlock(i, 'up')} onMoveDown={() => moveBlock(i, 'down')} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['paragraph', 'heading', 'image', 'quote', 'divider'] as BlockType[]).map(type => {
                const Icon = blockIcon[type];
                return (
                  <button key={type} type="button" onClick={() => addBlock(type)}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition">
                    <Plus size={12} /><Icon size={12} />{blockLabel[type]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition">
              {loading ? (uploading ? 'Uploading…' : 'Saving…') : isEditing ? 'Save Changes' : 'Create Blog'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────────────────────────

export function DeleteBlogModal({
  blog, onClose, onSuccess,
}: { blog: BlogItem; onClose: () => void; onSuccess: () => void; }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try { await apiClient.delete(`/blogs/${blog._id}`); onSuccess(); onClose(); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 mx-auto">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-4 text-center text-lg font-bold text-gray-900">Delete Blog?</h3>
        <p className="mt-2 text-center text-sm text-gray-500">
          "<span className="font-medium text-gray-700">{blog.title}</span>" will be permanently deleted.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

interface PaginationData {
  page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean;
}

function Pagination({ pagination, onPageChange }: { pagination: PaginationData; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
      <p className="text-gray-500">{pagination.total} blog{pagination.total !== 1 ? 's' : ''} · page {pagination.page} of {pagination.totalPages}</p>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPrev}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Prev</button>
        <button onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNext}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Next</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Blogs Admin Tab
// ─────────────────────────────────────────────────────────────

export function BlogsAdminTab() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [blogModal, setBlogModal] = useState<{ open: boolean; item?: BlogItem | null }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item?: BlogItem }>({ open: false });

  const fetchBlogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '10' });
      if (search) params.set('search', search);
      const { data } = await apiClient.get<{ items: BlogItem[]; pagination: PaginationData }>(`/blogs/admin/all?${params}`);
      setBlogs(data.items ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchBlogs(page); }, [page, fetchBlogs]);

  const handleTogglePublished = async (blog: BlogItem) => {
    try { await apiClient.patch(`/blogs/${blog._id}/toggle-published`); fetchBlogs(page); } catch (err) { console.error(err); }
  };
  const handleToggleFeatured = async (blog: BlogItem) => {
    try { await apiClient.patch(`/blogs/${blog._id}/toggle-featured`); fetchBlogs(page); } catch (err) { console.error(err); }
  };

  return (
    <motion.div key="blogs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Articles</h1>
          <p className="mt-1 text-gray-500">Write magazine-style articles about talent, people &amp; companies</p>
        </div>
        <button onClick={() => setBlogModal({ open: true })}
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transition">
          <Plus className="h-5 w-5" /> New Blog
        </button>
      </div>

      <div className="flex gap-3">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchBlogs(1); } }}
          placeholder="Search blogs…"
          className="flex-1 max-w-xs rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition" />
        <button onClick={() => { setPage(1); fetchBlogs(1); }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Search</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="font-semibold text-gray-900">No blogs yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first blog article</p>
          <button onClick={() => setBlogModal({ open: true })}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition">New Blog</button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Blog</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-center">Published</th>
                <th className="px-4 py-3 text-center">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {blogs.map(blog => (
                <tr key={blog._id} className="hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <img src={blog.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{blog.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{blog.subject}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleTogglePublished(blog)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        blog.isPublished ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {blog.isPublished ? <Eye size={11} /> : <EyeOff size={11} />}
                      {blog.isPublished ? 'Live' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleFeatured(blog)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        blog.isFeatured ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}>
                      <Star size={11} />{blog.isFeatured ? 'Featured' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setBlogModal({ open: true, item: blog })}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteModal({ open: true, item: blog })}
                        className="rounded-lg border border-red-100 p-1.5 text-red-500 hover:bg-red-50 transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination pagination={pagination} onPageChange={p => { setPage(p); fetchBlogs(p); }} />
      )}

      <AnimatePresence>
        {blogModal.open && (
          <BlogFormModal blog={blogModal.item} onClose={() => setBlogModal({ open: false })} onSuccess={() => fetchBlogs(page)} />
        )}
        {deleteModal.open && deleteModal.item && (
          <DeleteBlogModal blog={deleteModal.item} onClose={() => setDeleteModal({ open: false })} onSuccess={() => fetchBlogs(page)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
