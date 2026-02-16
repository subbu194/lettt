import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Calendar, ShoppingBag, Ticket, TrendingUp,
  Plus, Edit2, Trash2, Search, X, ChevronLeft,
  ChevronRight, LogOut, IndianRupee, AlertCircle,
  CheckCircle2, Clock, XCircle, RefreshCw, ImageIcon,
  LayoutDashboard, Package, ArrowUpRight, Sparkles,
  Activity, Users, Star, Video
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import { SingleImageUploader } from '@/components/admin/SingleImageUploader';
import { useAdminStore } from '@/store/useAdminStore';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { VideoFormModal } from './AdminDashboard_Videos';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ArtItem {
  _id: string;
  title: string;
  artist: string;
  price: number;
  images: string[];
  frameSizes?: { name: string; width: number; height: number; unit: string }[];
  category?: string;
  isFeatured: boolean;
  isAvailable: boolean;
  quantity?: number;
  createdAt: string;
}

interface EventItem {
  _id: string;
  title: string;
  venue: string;
  date: string;
  ticketPrice: number;
  totalSeats: number;
  seatsLeft: number;
  bookedSeats?: number;
  isFeatured: boolean;
  coverImage?: string;
  galleryImages?: string[];
  createdAt: string;
}

interface OrderItem {
  _id: string;
  orderNumber?: string;
  items: { itemType: string; title: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentStatus: 'created' | 'paid' | 'failed';
  createdAt: string;
  user?: { name: string; email: string };
}

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

interface Stats {
  totalArts: number;
  totalEvents: number;
  totalOrders: number;
  totalRevenue: number;
  activeTickets: number;
  recentOrders: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type Tab = 'overview' | 'art' | 'events' | 'orders' | 'videos';

// ─────────────────────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};

// ─────────────────────────────────────────────────────────────
// Modern Stat Card Component
// ─────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  gradient,
  delay = 0
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-lg hover:ring-black/10"
    >
      {/* Background gradient blur */}
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${gradient} opacity-20 blur-3xl transition-all group-hover:opacity-30`} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${gradient} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"
            >
              <TrendingUp className="h-3 w-3" />
              {trend}
            </motion.span>
          )}
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className="mt-1 text-3xl font-bold tracking-tight text-gray-900"
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modern Status Badge Component
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const config: Record<string, { icon: React.ElementType; label: string; className: string }> = {
    paid: { icon: CheckCircle2, label: 'Paid', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
    created: { icon: Clock, label: 'Pending', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
    failed: { icon: XCircle, label: 'Failed', className: 'bg-red-50 text-red-700 ring-red-600/20' },
    true: { icon: CheckCircle2, label: 'Yes', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
    false: { icon: XCircle, label: 'No', className: 'bg-gray-50 text-gray-500 ring-gray-500/20' },
  };

  const { icon: Icon, label, className } = config[status] || config.created;
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${className} ${sizeClasses}`}>
      <Icon className={size === 'md' ? 'h-4 w-4' : 'h-3 w-3'} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Modern Modal Wrapper
// ─────────────────────────────────────────────────────────────

function Modal({
  children,
  onClose,
  title,
  subtitle,
  size = 'md'
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
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
        transition={{ type: 'spring', duration: 0.5 }}
        className={`relative flex w-full ${sizeClasses[size]} max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modern Input Component
// ─────────────────────────────────────────────────────────────

function Input({
  label,
  type = 'text',
  required,
  value,
  onChange,
  placeholder,
  min,
  icon: Icon
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  icon?: React.ElementType;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // For number inputs, handle leading zeros and empty values
    if (type === 'number') {
      // Allow empty string
      if (newValue === '') {
        onChange(newValue);
        return;
      }
      // Remove leading zeros but preserve "0" and decimal values
      if (newValue !== '0' && !newValue.includes('.')) {
        newValue = newValue.replace(/^0+/, '') || '0';
      }
    }

    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        )}
        <input
          type={type}
          required={required}
          value={value}
          onChange={handleChange}
          min={min}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10 ${Icon ? 'pl-11' : ''}`}
        />
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// Modern Toggle Component
// ─────────────────────────────────────────────────────────────

function Toggle({
  label,
  checked,
  onChange,
  description
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-gray-300 hover:bg-gray-100/50">
      <div>
        <span className="font-medium text-gray-900">{label}</span>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`h-6 w-11 rounded-full transition-colors ${checked ? 'bg-red-600' : 'bg-gray-300'}`}>
          <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
        </div>
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Art Form Modal
// ─────────────────────────────────────────────────────────────

function ArtFormModal({
  art,
  onClose,
  onSuccess
}: {
  art?: ArtItem | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<{
    title: string;
    artist: string;
    description: string;
    price: string | number;
    quantity: string | number;
    category: string;
    imageFiles: File[];
    existingImages: string[];
    frameSizes: { name: string; width: number; height: number; unit: string }[];
    isFeatured: boolean;
    isAvailable: boolean;
  }>({
    title: art?.title || '',
    artist: art?.artist || '',
    description: '',
    price: art?.price ?? '',
    quantity: art?.quantity ?? '',
    category: art?.category || '',
    imageFiles: [] as File[],
    existingImages: art?.images || [],
    frameSizes: art?.frameSizes || [{ name: 'Small', width: 30, height: 40, unit: 'cm' }],
    isFeatured: art?.isFeatured || false,
    isAvailable: art?.isAvailable ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));

      // Get presigned URL
      const urlResponse = await apiClient.post('/upload/url', {
        fileType: file.type,
        fileName: file.name,
        folder: 'art',
      });

      if (!urlResponse.data?.success || !urlResponse.data?.uploadUrl) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = urlResponse.data;

      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      uploadedUrls.push(publicUrl);
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    return uploadedUrls;
  };

  const addFrameSize = () => {
    setForm({
      ...form,
      frameSizes: [...form.frameSizes, { name: 'Medium', width: 0, height: 0, unit: 'cm' }]
    });
  };

  const updateFrameSize = (index: number, field: string, value: string | number) => {
    const newSizes = [...form.frameSizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setForm({ ...form, frameSizes: newSizes });
  };

  const removeFrameSize = (index: number) => {
    const newSizes = form.frameSizes.filter((_, i) => i !== index);
    setForm({ ...form, frameSizes: newSizes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);
    setError('');

    try {
      // Validate frame sizes
      const validFrameSizes = form.frameSizes.filter(size => size.name.trim() !== '');
      if (validFrameSizes.length === 0) {
        setError('At least one frame size with a name is required');
        setLoading(false);
        return;
      }

      // Validate price and quantity
      const price = form.price === '' ? 0 : Number(form.price);
      const quantity = form.quantity === '' ? 1 : Number(form.quantity);

      if (price < 0) {
        setError('Price must be a positive number');
        setLoading(false);
        return;
      }

      // Upload new images if any
      let imageUrls = [...form.existingImages];
      if (form.imageFiles.length > 0) {
        const newUrls = await uploadImages(form.imageFiles);
        imageUrls = [...imageUrls, ...newUrls];
      }

      setUploading(false);

      const payload = {
        title: form.title,
        artist: form.artist,
        description: form.description || 'Beautiful artwork piece',
        price,
        quantity,
        category: form.category,
        images: imageUrls,
        frameSizes: validFrameSizes,
        isFeatured: form.isFeatured,
        isAvailable: form.isAvailable,
      };

      if (art?._id) {
        await apiClient.put(`/art/${art._id}`, payload);
      } else {
        await apiClient.post('/art', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={art ? 'Edit Artwork' : 'Add New Artwork'}
      subtitle={art ? 'Update the artwork details below' : 'Fill in the details to add a new artwork'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="Enter artwork title"
          />
          <Input
            label="Artist"
            required
            value={form.artist}
            onChange={(v) => setForm({ ...form, artist: v })}
            placeholder="Artist name"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Price"
            type="number"
            required
            min={0}
            value={form.price}
            onChange={(v) => setForm({ ...form, price: v })}
            placeholder="0"
            icon={IndianRupee}
          />
          <Input
            label="Quantity"
            type="number"
            required
            min={0}
            value={form.quantity}
            onChange={(v) => setForm({ ...form, quantity: v })}
            placeholder="1"
            icon={Package}
          />
          <Input
            label="Art Type"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
            placeholder="e.g., Painting, Sculpture, Digital Art"
          />
        </div>

        <MultiImageUploader
          value={form.imageFiles}
          onChange={(files) => setForm({ ...form, imageFiles: files })}
          label="Artwork Images (Max 10)"
          maxImages={10}
        />

        {form.existingImages.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Existing Images</label>
            <div className="grid grid-cols-5 gap-2">
              {form.existingImages.map((url, idx) => (
                <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const newExisting = form.existingImages.filter((_, i) => i !== idx);
                      setForm({ ...form, existingImages: newExisting });
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frame Sizes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Frame Sizes (Custom for this artwork)
            </label>
            <button
              type="button"
              onClick={addFrameSize}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              + Add Size
            </button>
          </div>
          {form.frameSizes.map((size, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={size.name}
                  onChange={(e) => updateFrameSize(index, 'name', e.target.value)}
                  placeholder="Size name (e.g., Small)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  value={size.width || ''}
                  onChange={(e) => updateFrameSize(index, 'width', e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="Width"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  min={0}
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  value={size.height || ''}
                  onChange={(e) => updateFrameSize(index, 'height', e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="Height"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  min={0}
                />
              </div>
              <div className="w-20">
                <select
                  value={size.unit}
                  onChange={(e) => updateFrameSize(index, 'unit', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="cm">cm</option>
                  <option value="inch">inch</option>
                </select>
              </div>
              {form.frameSizes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFrameSize(index)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            label="Featured"
            checked={form.isFeatured}
            onChange={(v) => setForm({ ...form, isFeatured: v })}
            description="Show on homepage"
          />
          <Toggle
            label="Available"
            checked={form.isAvailable}
            onChange={(v) => setForm({ ...form, isAvailable: v })}
            description="Ready for purchase"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-inset ring-red-600/20"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </motion.div>
        )}

        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            <div className="flex-1">
              <p className="font-medium">Uploading images... {uploadProgress}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-red-200">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="gold" disabled={loading} className="flex-1">
            {loading ? <Spinner size="sm" /> : art ? 'Save Changes' : 'Create Artwork'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Event Form Modal
// ─────────────────────────────────────────────────────────────

function EventFormModal({
  event,
  onClose,
  onSuccess
}: {
  event?: EventItem | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<{
    title: string;
    description: string;
    venue: string;
    date: string;
    startTime: string;
    ticketPrice: string | number;
    totalSeats: string | number;
    isFeatured: boolean;
  }>({
    title: event?.title || '',
    description: '',
    venue: event?.venue || '',
    date: event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
    startTime: '18:00',
    ticketPrice: event?.ticketPrice ?? '',
    totalSeats: event?.totalSeats ?? '',
    isFeatured: event?.isFeatured || false,
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [existingCoverImage, setExistingCoverImage] = useState(event?.coverImage || '');
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>(event?.galleryImages || []);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const urlResponse = await apiClient.post('/upload/url', {
      fileType: file.type,
      fileName: file.name,
      folder,
    });

    if (!urlResponse.data?.success || !urlResponse.data?.uploadUrl) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl, publicUrl } = urlResponse.data;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate numeric fields
      const ticketPrice = form.ticketPrice === '' ? 0 : Number(form.ticketPrice);
      const totalSeats = form.totalSeats === '' ? 1 : Number(form.totalSeats);

      if (ticketPrice < 0) {
        setError('Ticket price must be a positive number');
        setLoading(false);
        return;
      }

      if (totalSeats < 1) {
        setError('Total seats must be at least 1');
        setLoading(false);
        return;
      }

      let coverImage = existingCoverImage;
      const galleryImages = [...existingGalleryImages];

      // Upload cover image if new one selected
      if (coverImageFile) {
        setUploadProgress(25);
        coverImage = await uploadImage(coverImageFile, 'events');
      }

      // Upload gallery images if any
      if (galleryImageFiles.length > 0) {
        for (let i = 0; i < galleryImageFiles.length; i++) {
          setUploadProgress(25 + Math.round(((i + 1) / galleryImageFiles.length) * 75));
          const url = await uploadImage(galleryImageFiles[i], 'events');
          galleryImages.push(url);
        }
      }

      setUploadProgress(100);

      const payload = {
        title: form.title,
        description: form.description || 'An amazing event experience',
        venue: form.venue,
        date: form.date,
        startTime: form.startTime,
        ticketPrice,
        totalSeats,
        coverImage,
        galleryImages,
        isFeatured: form.isFeatured,
      };

      if (event?._id) {
        await apiClient.put(`/events/${event._id}`, payload);
      } else {
        await apiClient.post('/events', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={event ? 'Edit Event' : 'Create New Event'}
      subtitle={event ? 'Update the event details below' : 'Fill in the details to create a new event'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Event Title"
          required
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          placeholder="Enter event title"
        />

        <Input
          label="Venue"
          required
          value={form.venue}
          onChange={(v) => setForm({ ...form, venue: v })}
          placeholder="Event location"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            required
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
          />
          <Input
            label="Start Time"
            type="time"
            value={form.startTime}
            onChange={(v) => setForm({ ...form, startTime: v })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Ticket Price"
            type="number"
            required
            min={0}
            value={form.ticketPrice}
            onChange={(v) => setForm({ ...form, ticketPrice: v })}
            icon={IndianRupee}
          />
          <Input
            label="Total Seats"
            type="number"
            required
            min={1}
            value={form.totalSeats}
            onChange={(v) => setForm({ ...form, totalSeats: v })}
            icon={Users}
          />
        </div>

        <SingleImageUploader
          value={coverImageFile}
          onChange={setCoverImageFile}
          existingImage={existingCoverImage}
          onRemoveExisting={() => setExistingCoverImage('')}
          label="Cover Image *"
        />

        <div className="space-y-3">
          <MultiImageUploader
            value={galleryImageFiles}
            onChange={setGalleryImageFiles}
            maxImages={10}
          />
          {existingGalleryImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Existing gallery images:</p>
              <div className="grid grid-cols-4 gap-3">
                {existingGalleryImages.map((url, index) => (
                  <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200">
                    <img
                      src={url}
                      alt={`Existing ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setExistingGalleryImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Toggle
          label="Featured Event"
          checked={form.isFeatured}
          onChange={(v) => setForm({ ...form, isFeatured: v })}
          description="Highlight this event on the homepage"
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-inset ring-red-600/20"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </motion.div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading images...</span>
              <span className="font-medium text-red-600">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-linear-to-r from-red-500 to-red-600"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="red" disabled={loading} className="flex-1">
            {loading ? <Spinner size="sm" /> : event ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete Confirmation Modal
// ─────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  title,
  onConfirm,
  onClose
}: {
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title="Confirm Delete" size="sm">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">Delete {title}?</h3>
        <p className="mt-2 text-sm text-gray-500">
          This action cannot be undone. This will permanently delete the item and remove all associated data.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="red" onClick={onConfirm} className="flex-1">
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Modern Data Table Component
// ─────────────────────────────────────────────────────────────

function DataTable({
  columns,
  data,
  renderRow,
  emptyMessage = 'No items found'
}: {
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
  data: unknown[];
  renderRow: (item: unknown, index: number) => React.ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? (
              data.map((item, index) => renderRow(item, index))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <Package className="h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm font-medium text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pagination Component
// ─────────────────────────────────────────────────────────────

function Pagination({
  pagination,
  onPageChange
}: {
  pagination: PaginationData | null;
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
        <span className="font-medium text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
        <span className="font-medium text-gray-900">{pagination.total}</span> results
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrev}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
          let pageNum = i + 1;
          if (pagination.totalPages > 5) {
            if (pagination.page <= 3) {
              pageNum = i + 1;
            } else if (pagination.page >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i;
            } else {
              pageNum = pagination.page - 2 + i;
            }
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${pagination.page === pageNum
                ? 'bg-red-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNext}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Admin Dashboard Component
// ─────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { logoutAdmin } = useAdminStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats>({
    totalArts: 0,
    totalEvents: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeTickets: 0,
    recentOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  // Art state
  const [arts, setArts] = useState<ArtItem[]>([]);
  const [artPagination, setArtPagination] = useState<PaginationData | null>(null);
  const [artSearch, setArtSearch] = useState('');
  const [artModal, setArtModal] = useState<{ open: boolean; item?: ArtItem | null }>({ open: false });
  const [deleteArtModal, setDeleteArtModal] = useState<{ open: boolean; item?: ArtItem }>({ open: false });

  // Event state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventPagination, setEventPagination] = useState<PaginationData | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [eventModal, setEventModal] = useState<{ open: boolean; item?: EventItem | null }>({ open: false });
  const [deleteEventModal, setDeleteEventModal] = useState<{ open: boolean; item?: EventItem }>({ open: false });

  // Orders state
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderPagination, setOrderPagination] = useState<PaginationData | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Videos state
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoPagination, setVideoPagination] = useState<PaginationData | null>(null);
  const [videoSearch] = useState('');
  const [videoModal, setVideoModal] = useState<{ open: boolean; item?: VideoItem | null }>({ open: false });
  const [deleteVideoModal, setDeleteVideoModal] = useState<{ open: boolean; item?: VideoItem }>({ open: false });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const [artResp, eventResp, orderResp, ticketResp] = await Promise.all([
        apiClient.get<{ pagination: { total: number } }>('/art?limit=1'),
        apiClient.get<{ pagination: { total: number } }>('/events?limit=1'),
        apiClient.get<{ stats: { totalOrders: number; totalRevenue: number; recentOrders: number } }>('/orders/admin/stats').catch(() => ({ data: { stats: { totalOrders: 0, totalRevenue: 0, recentOrders: 0 } } })),
        apiClient.get<{ stats: { activeTickets: number } }>('/tickets/admin/stats').catch(() => ({ data: { stats: { activeTickets: 0 } } })),
      ]);

      setStats({
        totalArts: artResp.data?.pagination?.total || 0,
        totalEvents: eventResp.data?.pagination?.total || 0,
        totalOrders: orderResp.data?.stats?.totalOrders || 0,
        totalRevenue: orderResp.data?.stats?.totalRevenue || 0,
        activeTickets: ticketResp.data?.stats?.activeTickets || 0,
        recentOrders: orderResp.data?.stats?.recentOrders || 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch arts
  const fetchArts = useCallback(async (page: number = 1) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (artSearch) params.set('search', artSearch);

      const resp = await apiClient.get<{ items: ArtItem[]; pagination: PaginationData }>(`/art?${params.toString()}`);
      setArts(resp.data?.items || []);
      setArtPagination(resp.data?.pagination || null);
    } catch (err) {
      console.error('Failed to fetch arts:', err);
    }
  }, [artSearch]);

  // Fetch events
  const fetchEvents = useCallback(async (page: number = 1) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (eventSearch) params.set('search', eventSearch);

      const resp = await apiClient.get<{ items: EventItem[]; pagination: PaginationData }>(`/events?${params.toString()}`);
      setEvents(resp.data?.items || []);
      setEventPagination(resp.data?.pagination || null);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, [eventSearch]);

  // Fetch orders
  const fetchOrders = useCallback(async (page: number = 1) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (orderStatusFilter) params.set('status', orderStatusFilter);

      const resp = await apiClient.get<{ orders: OrderItem[]; pagination: PaginationData }>(`/orders/admin?${params.toString()}`);
      setOrders(resp.data?.orders || []);
      setOrderPagination(resp.data?.pagination || null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [orderStatusFilter]);

  // Fetch videos
  const fetchVideos = useCallback(async (page: number = 1) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (videoSearch) params.set('search', videoSearch);

      const resp = await apiClient.get<{ items: VideoItem[]; pagination: PaginationData }>(`/talkshow?${params.toString()}`);
      setVideos(resp.data?.items || []);
      setVideoPagination(resp.data?.pagination || null);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  }, [videoSearch]);

  // Delete art
  const handleDeleteArt = async () => {
    if (!deleteArtModal.item) return;
    try {
      await apiClient.delete(`/art/${deleteArtModal.item._id}`);
      setDeleteArtModal({ open: false });
      fetchArts();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete art:', err);
    }
  };

  // Delete event
  const handleDeleteEvent = async () => {
    if (!deleteEventModal.item) return;
    try {
      await apiClient.delete(`/events/${deleteEventModal.item._id}`);
      setDeleteEventModal({ open: false });
      fetchEvents();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  // Delete video
  const handleDeleteVideo = async () => {
    if (!deleteVideoModal.item) return;
    try {
      await apiClient.delete(`/talkshow/${deleteVideoModal.item._id}`);
      setDeleteVideoModal({ open: false });
      fetchVideos();
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    };
    load();
  }, [fetchStats]);

  // Tab data loading - use microtask to avoid sync setState in effect
  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === 'art') await fetchArts(1);
      else if (activeTab === 'events') await fetchEvents(1);
      else if (activeTab === 'orders') await fetchOrders(1);
      else if (activeTab === 'videos') await fetchVideos(1);
    };
    loadTabData();
  }, [activeTab, fetchArts, fetchEvents, fetchOrders, fetchVideos]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'art', label: 'Art Gallery', icon: Palette },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'videos', label: 'Talk Show', icon: Video },
  ];

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-red-600 to-red-700 shadow-lg shadow-red-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">LTTT Admin</h1>
            <p className="text-xs text-gray-500">Management Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Menu</p>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-red-600' : 'text-gray-400'}`} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="ml-auto h-2 w-2 rounded-full bg-red-600"
                  />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
          <button
            onClick={logoutAdmin}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-sm text-gray-500">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-8"
                >
                  {/* Page Header */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard Overview</h1>
                    <p className="mt-2 text-gray-500">Welcome back! Here's what's happening with your store.</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      icon={IndianRupee}
                      label="Total Revenue"
                      value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
                      gradient="bg-linear-to-br from-emerald-500 to-teal-600"
                      delay={0}
                    />
                    <StatCard
                      icon={ShoppingBag}
                      label="Total Orders"
                      value={stats.totalOrders}
                      trend={stats.recentOrders > 0 ? `+${stats.recentOrders} today` : undefined}
                      gradient="bg-linear-to-br from-red-500 to-red-600"
                      delay={0.1}
                    />
                    <StatCard
                      icon={Palette}
                      label="Art Pieces"
                      value={stats.totalArts}
                      gradient="bg-linear-to-br from-amber-500 to-orange-600"
                      delay={0.2}
                    />
                    <StatCard
                      icon={Calendar}
                      label="Events"
                      value={stats.totalEvents}
                      gradient="bg-linear-to-br from-rose-500 to-pink-600"
                      delay={0.3}
                    />
                  </div>

                  {/* Quick Actions & Insights */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Quick Actions Card */}
                    <motion.div
                      variants={fadeInUp}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div className="mt-5 space-y-3">
                        <button
                          onClick={() => { setActiveTab('art'); setArtModal({ open: true }); }}
                          className="flex w-full items-center gap-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40"
                        >
                          <Plus className="h-5 w-5" />
                          Add New Artwork
                          <ArrowUpRight className="ml-auto h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setActiveTab('events'); setEventModal({ open: true }); }}
                          className="flex w-full items-center gap-3 rounded-xl bg-linear-to-r from-rose-500 to-pink-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-rose-500/25 transition-all hover:shadow-rose-500/40"
                        >
                          <Plus className="h-5 w-5" />
                          Create New Event
                          <ArrowUpRight className="ml-auto h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>

                    {/* Active Tickets Card */}
                    <motion.div
                      variants={fadeInUp}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Active Tickets</h3>
                        <Ticket className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="mt-5 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50">
                          <Ticket className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-4xl font-bold text-gray-900">{stats.activeTickets}</p>
                          <p className="text-sm text-gray-500">tickets available</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Activity Card */}
                    <motion.div
                      variants={fadeInUp}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Today's Activity</h3>
                        <Activity className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                              <ShoppingBag className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">New Orders</span>
                          </div>
                          <span className="text-lg font-bold text-gray-900">{stats.recentOrders}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Art Tab */}
              {activeTab === 'art' && (
                <motion.div
                  key="art"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Page Header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Art Gallery</h1>
                      <p className="mt-1 text-gray-500">Manage your artwork collection</p>
                    </div>
                    <Button
                      variant="gold"
                      onClick={() => setArtModal({ open: true })}
                      className="shadow-lg shadow-amber-500/25"
                    >
                      <Plus className="h-4 w-4" />
                      Add Artwork
                    </Button>
                  </div>

                  {/* Search & Filters */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative min-w-60 max-w-md flex-1">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search artworks..."
                        value={artSearch}
                        onChange={(e) => setArtSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchArts(1)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                    <button
                      onClick={() => fetchArts(1)}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Art Table */}
                  <DataTable
                    columns={[
                      { key: 'art', label: 'Artwork' },
                      { key: 'artist', label: 'Artist' },
                      { key: 'price', label: 'Price' },
                      { key: 'quantity', label: 'Stock' },
                      { key: 'featured', label: 'Featured' },
                      { key: 'available', label: 'Status' },
                      { key: 'actions', label: 'Actions', align: 'right' },
                    ]}
                    data={arts}
                    emptyMessage="No artworks found. Add your first artwork!"
                    renderRow={(item) => {
                      const art = item as ArtItem;
                      const quantity = art.quantity ?? 1;
                      const isSoldOut = quantity === 0 || !art.isAvailable;
                      return (
                        <tr key={art._id} className="group transition-colors hover:bg-gray-50/80">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                                {art.images?.[0] ? (
                                  <img src={art.images[0]} alt={art.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{art.title}</p>
                                <p className="text-sm text-gray-500">{art.category || 'Uncategorized'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{art.artist}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">₹{art.price.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${isSoldOut ? 'text-red-600' : quantity < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {art.isFeatured ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                <Star className="h-3 w-3" />
                                Featured
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isSoldOut ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                Sold Out
                              </span>
                            ) : (
                              <StatusBadge status={String(art.isAvailable)} />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setArtModal({ open: true, item: art })}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteArtModal({ open: true, item: art })}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }}
                  />

                  {/* Pagination */}
                  <Pagination
                    pagination={artPagination}
                    onPageChange={(page) => fetchArts(page)}
                  />
                </motion.div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <motion.div
                  key="events"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Page Header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                      <p className="mt-1 text-gray-500">Manage your events and ticket sales</p>
                    </div>
                    <Button
                      variant="red"
                      onClick={() => setEventModal({ open: true })}
                      className="shadow-lg shadow-rose-500/25"
                    >
                      <Plus className="h-4 w-4" />
                      Create Event
                    </Button>
                  </div>

                  {/* Search & Filters */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative min-w-60 max-w-md flex-1">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchEvents(1)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                    <button
                      onClick={() => fetchEvents(1)}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Events Table */}
                  <DataTable
                    columns={[
                      { key: 'event', label: 'Event' },
                      { key: 'venue', label: 'Venue' },
                      { key: 'date', label: 'Date' },
                      { key: 'price', label: 'Price' },
                      { key: 'seats', label: 'Seats' },
                      { key: 'actions', label: 'Actions', align: 'right' },
                    ]}
                    data={events}
                    emptyMessage="No events found. Create your first event!"
                    renderRow={(item) => {
                      const event = item as EventItem;
                      const seatsLeft = event.seatsLeft ?? (event.totalSeats - (event.bookedSeats || 0));
                      const seatPercentage = Math.round((seatsLeft / event.totalSeats) * 100);
                      return (
                        <tr key={event._id} className="group transition-colors hover:bg-gray-50/80">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                                {event.coverImage ? (
                                  <img src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-rose-100 to-pink-100">
                                    <Calendar className="h-6 w-6 text-rose-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{event.title}</p>
                                {event.isFeatured && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                                    <Star className="h-3 w-3" />
                                    Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{event.venue}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(event.date).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">₹{event.ticketPrice.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-32">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-600">{seatsLeft}/{event.totalSeats}</span>
                                <span className="text-gray-400">{seatPercentage}%</span>
                              </div>
                              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full rounded-full transition-all ${seatPercentage > 50 ? 'bg-emerald-500' : seatPercentage > 20 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                  style={{ width: `${seatPercentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEventModal({ open: true, item: event })}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteEventModal({ open: true, item: event })}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }}
                  />

                  {/* Pagination */}
                  <Pagination
                    pagination={eventPagination}
                    onPageChange={(page) => fetchEvents(page)}
                  />
                </motion.div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Page Header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                      <p className="mt-1 text-gray-500">Track and manage customer orders</p>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1">
                      {['', 'paid', 'created', 'failed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setOrderStatusFilter(status)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${orderStatusFilter === status
                            ? 'bg-red-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => fetchOrders(1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Orders Table */}
                  <DataTable
                    columns={[
                      { key: 'order', label: 'Order' },
                      { key: 'items', label: 'Items' },
                      { key: 'total', label: 'Total' },
                      { key: 'status', label: 'Status' },
                      { key: 'date', label: 'Date' },
                    ]}
                    data={orders}
                    emptyMessage="No orders found"
                    renderRow={(item) => {
                      const order = item as OrderItem;
                      return (
                        <tr key={order._id} className="group transition-colors hover:bg-gray-50/80">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-mono text-sm font-semibold text-gray-900">
                                #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                              </p>
                              {order.user && (
                                <p className="text-sm text-gray-500">{order.user.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {order.items.slice(0, 2).map((itm, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                                >
                                  {itm.title} × {itm.quantity}
                                </span>
                              ))}
                              {order.items.length > 2 && (
                                <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-400">
                                  +{order.items.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{order.totalAmount.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={order.paymentStatus} size="md" />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </td>
                        </tr>
                      );
                    }}
                  />

                  {/* Pagination */}
                  <Pagination
                    pagination={orderPagination}
                    onPageChange={(page) => fetchOrders(page)}
                  />
                </motion.div>
              )}

              {/* Videos Tab */}
              {activeTab === 'videos' && (
                <motion.div
                  key="videos"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Talk Show Videos</h1>
                      <p className="mt-1 text-gray-500">Manage YouTube videos organized by seasons</p>
                    </div>
                    <button
                      onClick={() => setVideoModal({ open: true })}
                      className="flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/30 transition-all hover:shadow-red-500/40"
                    >
                      <Plus className="h-5 w-5" />
                      Add Video
                    </button>
                  </div>

                  {videos.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                      <Video className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 font-semibold text-gray-900">No videos yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by adding your first talk show video</p>
                      <button
                        onClick={() => setVideoModal({ open: true })}
                        className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Add Video
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {videos.map((video) => {
                        const getYouTubeId = (url: string) => {
                          const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                          const match = url.match(regex);
                          return match ? match[1] : null;
                        };
                        const videoId = getYouTubeId(video.youtubeUrl);
                        const thumb = video.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '');

                        return (
                          <div key={video._id} className="group rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                            <div className="relative aspect-video bg-gray-100">
                              {thumb && <img src={thumb} alt={video.title} className="h-full w-full object-cover" />}
                              <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                                S{video.season}{video.episodeNumber ? ` E${video.episodeNumber}` : ''}
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-gray-900 line-clamp-1">{video.title}</h3>
                              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{video.description}</p>
                              <div className="mt-4 flex items-center gap-2">
                                <button
                                  onClick={() => setVideoModal({ open: true, item: video })}
                                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteVideoModal({ open: true, item: video })}
                                  className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {videoPagination && videoPagination.totalPages > 1 && (
                    <Pagination
                      pagination={videoPagination}
                      onPageChange={(page) => fetchVideos(page)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {artModal.open && (
          <ArtFormModal
            art={artModal.item}
            onClose={() => setArtModal({ open: false })}
            onSuccess={() => { fetchArts(); fetchStats(); }}
          />
        )}

        {deleteArtModal.open && deleteArtModal.item && (
          <DeleteConfirmModal
            title={deleteArtModal.item.title}
            onConfirm={handleDeleteArt}
            onClose={() => setDeleteArtModal({ open: false })}
          />
        )}

        {eventModal.open && (
          <EventFormModal
            event={eventModal.item}
            onClose={() => setEventModal({ open: false })}
            onSuccess={() => { fetchEvents(); fetchStats(); }}
          />
        )}

        {deleteEventModal.open && deleteEventModal.item && (
          <DeleteConfirmModal
            title={deleteEventModal.item.title}
            onConfirm={handleDeleteEvent}
            onClose={() => setDeleteEventModal({ open: false })}
          />
        )}

        {videoModal.open && (
          <VideoFormModal
            video={videoModal.item}
            onClose={() => setVideoModal({ open: false })}
            onSuccess={() => { fetchVideos(); }}
          />
        )}

        {deleteVideoModal.open && deleteVideoModal.item && (
          <DeleteConfirmModal
            title={deleteVideoModal.item.title}
            onConfirm={handleDeleteVideo}
            onClose={() => setDeleteVideoModal({ open: false })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
