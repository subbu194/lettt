import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Calendar, Tag, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { PageTransition } from '@/components/shared/PageTransition';
import { Spinner } from '@/components/shared/Spinner';
import { fadeInUp } from '@/utils/animations';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  subject: string;
  coverImage: string;
  logo?: string;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─────────────────────────────────────────────────────────────
// Blog Card
// ─────────────────────────────────────────────────────────────

function BlogCard({ blog, index }: { blog: BlogItem; index: number }) {
  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link
        to={`/blog/${blog.slug}`}
        className="group block rounded-2xl overflow-hidden bg-white border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300"
      >
        {/* Cover Image */}
        <div className="relative overflow-hidden aspect-video">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {blog.isFeatured && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              Featured
            </span>
          )}
          {blog.logo && (
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white shadow-md overflow-hidden ring-2 ring-white">
              <img src={blog.logo} alt="logo" className="w-full h-full object-contain p-1" />
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Subject label */}
          <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
            {blog.subject}
          </span>

          {/* Title */}
          <h3 className="mt-1.5 text-[1.05rem] font-bold text-(--color-soft-black) leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
            {blog.title}
          </h3>

          {/* Excerpt */}
          <p className="mt-2 text-sm text-(--color-muted) line-clamp-3 leading-relaxed">
            {blog.excerpt}
          </p>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-(--color-muted)">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
            {blog.tags.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-(--color-muted)">
                <Tag size={12} />
                <span className="truncate max-w-30">{blog.tags.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, limit: 9 };
      if (search) params.search = search;

      const { data } = await apiClient.get('/blogs', { params });
      setBlogs(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <PageTransition>
      <section className="bg-(--color-background) min-h-screen">
        {/* ── Hero ── */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-20 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-red-600/20 blur-[120px]" />
          <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-red-600/10 blur-[100px]" />
          <div className="lux-container relative">
            <motion.div
              className="max-w-3xl"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                <BookOpen size={13} />
                Blog
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                Stories, People &amp; <span className="text-gradient-red">Talent</span>
              </h1>
              <p className="mt-3 max-w-xl text-white/60 leading-relaxed">
                In-depth articles about the artists, companies and creative minds shaping the world of talent.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="lux-container py-8">
          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-muted)" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search blogs…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm text-(--color-soft-black) placeholder:text-(--color-muted) focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* ── Grid ── */}
        <div className="lux-container pb-20">
          {loading ? (
            <div className="flex justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-8 text-center text-red-600">
              {error}
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-2xl bg-white border border-black/5 p-16 text-center shadow-sm">
              <BookOpen size={40} className="mx-auto text-(--color-muted) mb-4" />
              <p className="text-lg font-semibold text-(--color-soft-black)">No blogs yet</p>
              <p className="mt-1 text-sm text-(--color-muted)">Check back soon for stories and features.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog, i) => (
                  <BlogCard key={blog._id} blog={blog} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 bg-white text-sm font-medium text-(--color-soft-black) hover:bg-black/4 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <span className="text-sm text-(--color-muted)">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 bg-white text-sm font-medium text-(--color-soft-black) hover:bg-black/4 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
