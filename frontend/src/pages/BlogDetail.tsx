import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/shared/PageTransition';
import { Spinner } from '@/components/shared/Spinner';
import { fadeInUp } from '@/utils/animations';
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

interface BlogDetail {
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
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Content Block Renderer
// ─────────────────────────────────────────────────────────────

function BlockRenderer({ block, idx }: { block: ContentBlock; idx: number }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          key={idx}
          className="text-[1.05rem] leading-[1.85] text-(--color-text) text-justify"
          style={{ marginBottom: '1.25em' }}
        >
          {block.text}
        </p>
      );

    case 'heading': {
      const level = block.level ?? 2;
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
      const cls =
        level === 1
          ? 'text-3xl font-extrabold tracking-tight text-(--color-soft-black) mt-10 mb-4'
          : level === 2
          ? 'text-2xl font-bold tracking-tight text-(--color-soft-black) mt-8 mb-3'
          : 'text-xl font-semibold text-(--color-soft-black) mt-6 mb-2';
      return <Tag key={idx} className={cls}>{block.text}</Tag>;
    }

    case 'quote':
      return (
        <blockquote
          key={idx}
          className="relative border-l-4 border-red-500 bg-red-50 rounded-r-xl px-6 py-4 my-6 italic text-[1.05rem] text-(--color-soft-black) leading-relaxed"
        >
          <span className="absolute -top-3 left-4 text-red-400 text-5xl leading-none select-none">"</span>
          {block.text}
        </blockquote>
      );

    case 'divider':
      return (
        <div key={idx} className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-black/8" />
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <div className="flex-1 h-px bg-black/8" />
        </div>
      );

    case 'image': {
      const align = block.align ?? 'center';

      // Float left / right for magazine text-wrap effect
      if (align === 'left' || align === 'right') {
        const floatCls =
          align === 'left'
            ? 'float-left mr-6 mb-4 clear-left'
            : 'float-right ml-6 mb-4 clear-right';
        return (
          <figure key={idx} className={`${floatCls} max-w-xs w-[38%] min-w-45`}>
            <img
              src={block.url}
              alt={block.caption ?? ''}
              className="w-full rounded-xl object-cover shadow-md"
              style={{ maxHeight: '280px', objectFit: 'cover' }}
            />
            {block.caption && (
              <figcaption className="mt-1.5 text-xs text-(--color-muted) text-center italic">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      }

      // Full-width
      if (align === 'full') {
        return (
          <figure key={idx} className="my-8 -mx-4 sm:-mx-8 lg:-mx-12 clear-both">
            <img
              src={block.url}
              alt={block.caption ?? ''}
              className="w-full object-cover rounded-2xl shadow-lg"
              style={{ maxHeight: '480px', objectFit: 'cover' }}
            />
            {block.caption && (
              <figcaption className="mt-2 text-xs text-(--color-muted) text-center italic px-4">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      }

      // Center
      return (
        <figure key={idx} className="my-8 flex flex-col items-center clear-both">
          <img
            src={block.url}
            alt={block.caption ?? ''}
            className="max-w-2xl w-full rounded-2xl object-cover shadow-md"
            style={{ maxHeight: '400px', objectFit: 'cover' }}
          />
          {block.caption && (
            <figcaption className="mt-2 text-xs text-(--color-muted) italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get(`/blogs/slug/${slug}`, { signal: controller.signal });
        setBlog(res.data);
      } catch (err) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <PageTransition>
        <div className="lux-container py-24 text-center">
          <p className="text-red-600 font-semibold">{error || 'Blog not found'}</p>
          <Link to="/blog" className="mt-4 inline-flex items-center gap-2 text-sm text-(--color-muted) hover:text-red-600 transition">
            <ArrowLeft size={14} /> Back to Blog
          </Link>
        </div>
      </PageTransition>
    );
  }

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageTransition>
      <article className="bg-(--color-background) min-h-screen">
        {/* ── Hero Cover ── */}
        <div className="relative w-full overflow-hidden" style={{ maxHeight: '520px' }}>
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full object-cover"
            style={{ maxHeight: '520px', objectFit: 'cover' }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

          {/* Title overlay on hero */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lux-container">
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-white/70 text-sm hover:text-white transition mb-4"
              >
                <ArrowLeft size={14} /> All Blogs
              </Link>
              <div className="flex items-center gap-3 mb-3">
                {blog.logo && (
                  <div className="w-10 h-10 rounded-full bg-white overflow-hidden ring-2 ring-white/40 shadow-lg shrink-0">
                    <img src={blog.logo} alt="logo" className="w-full h-full object-contain p-1" />
                  </div>
                )}
                <span className="text-red-400 text-sm font-semibold uppercase tracking-wider">
                  {blog.subject}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight max-w-3xl">
                {blog.title}
              </h1>
            </motion.div>
          </div>
        </div>

        {/* ── Meta bar ── */}
        <div className="border-b border-black/6 bg-white">
          <div className="lux-container py-4 flex flex-wrap items-center gap-4 text-sm text-(--color-muted)">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
            {blog.isFeatured && (
              <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                Featured
              </span>
            )}
            {blog.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={13} />
                {blog.tags.map(tag => (
                  <span key={tag} className="bg-black/5 text-(--color-soft-black) text-xs rounded-full px-2.5 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Article Body ── */}
        <div className="lux-container py-12">
          <div className="max-w-3xl mx-auto">
            {/* Excerpt / lead paragraph */}
            <p className="text-lg leading-relaxed font-medium text-(--color-soft-black) mb-8 border-l-4 border-red-500 pl-5 italic">
              {blog.excerpt}
            </p>

            {/* Extra Images strip (if any, shown before main content) */}
            {blog.extraImages.length > 0 && (
              <div className={`grid gap-4 mb-8 ${blog.extraImages.length === 1 ? 'grid-cols-1' : blog.extraImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {blog.extraImages.map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-4/3">
                    <img src={img} alt={`extra-${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* ── Rich Content ── */}
            <div className="prose-content">
              {/* clearfix wrapper so floats don't overflow the column */}
              <div className="after:content-[''] after:block after:clear-both">
                {blog.content.map((block, i) => (
                  <BlockRenderer key={i} block={block} idx={i} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Back link ── */}
        <div className="lux-container pb-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/10 bg-white text-sm font-medium text-(--color-soft-black) hover:bg-black/4 transition"
          >
            <ArrowLeft size={15} />
            Back to Blog
          </Link>
        </div>
      </article>
    </PageTransition>
  );
}
