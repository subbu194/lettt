import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Tag, ArrowLeft, Star } from 'lucide-react';
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
// Text helpers
//
// Many CMS/DB entries store bullet points as newline-separated
// text inside a single paragraph block, e.g.:
//   "• Point one\n• Point two\n- Point three\n1. Point four"
//
// renderTextLines() detects this pattern and renders each line
// as its own visual item instead of running them together.
// Plain prose paragraphs (no list markers) are rendered normally.
// ─────────────────────────────────────────────────────────────

// Matches common list-marker prefixes: •, -, *, ◦, 1., a), etc.
const LIST_MARKER_RE = /^(\s*(•|‣|◦|[-*]|\d+[.)]\s|[a-z][.)]\s))/i;

function isListLine(line: string) {
  return LIST_MARKER_RE.test(line.trim());
}

function stripMarker(line: string) {
  return line.trim().replace(LIST_MARKER_RE, '').trim();
}

/**
 * Split raw text on newlines, filter blank lines, then decide:
 * - If ALL non-empty lines look like list items → render as <ul>
 * - If SOME lines look like list items → render mixed (list items
 *   get bullets, plain lines get their own <p>)
 * - If NO lines are list items → render as a single flowing <p>
 *   (join lines with a space so pre-wrap line breaks don't show)
 */
function RichParagraph({ text, style }: { text: string; style?: React.CSSProperties }) {
  if (!text) return null;
  const rawLines = text.split('\n');
  const blocks: { isList: boolean; content: string }[] = [];
  
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (isListLine(trimmed)) {
      blocks.push({ isList: true, content: stripMarker(trimmed) });
    } else {
      if (blocks.length > 0 && blocks[blocks.length - 1].isList) {
        // Append hard-wrapped line to the previous list item
        blocks[blocks.length - 1].content += ' ' + trimmed;
      } else if (blocks.length > 0 && !blocks[blocks.length - 1].isList) {
        // Append hard-wrapped line to the previous paragraph
        blocks[blocks.length - 1].content += ' ' + trimmed;
      } else {
        blocks.push({ isList: false, content: trimmed });
      }
    }
  }

  if (blocks.length === 0) return null;

  return (
    <div style={{ margin: '0 0 1.1em 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', ...style }}>
      {blocks.map((b, i) => b.isList ? (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          fontSize: '1.05rem', lineHeight: 1.75, color: '#374151',
        }}>
          <span style={{
            marginTop: '0.55rem', width: '6px', height: '6px',
            borderRadius: '50%', background: '#ef4444', flexShrink: 0,
          }} />
          <span>{b.content}</span>
        </div>
      ) : (
        <p key={i} style={{
          fontSize: '1.05rem', lineHeight: 1.85, color: '#374151', margin: 0,
        }}>
          {b.content}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Grouping: convert flat block array into render units
// ─────────────────────────────────────────────────────────────

type FloatGroup = {
  kind: 'float';
  align: 'left' | 'right';
  image: ContentBlock;
  textBlocks: ContentBlock[];
};
type SingleBlock = {
  kind: 'single';
  block: ContentBlock;
};
type RenderUnit = FloatGroup | SingleBlock;

function buildRenderUnits(blocks: ContentBlock[]): RenderUnit[] {
  const units: RenderUnit[] = [];
  let i = 0;

  while (i < blocks.length) {
    const b = blocks[i];
    const isFloatImage =
      b.type === 'image' &&
      (b.align === 'left' || b.align === 'right') &&
      !!b.url;

    if (isFloatImage) {
      const textBlocks: ContentBlock[] = [];
      i++;
      while (i < blocks.length) {
        const next = blocks[i];
        if (next.type === 'image' || next.type === 'divider') break;
        textBlocks.push(next);
        i++;
      }
      if (textBlocks.length === 0) {
        units.push({ kind: 'single', block: { ...b, align: 'center' } });
      } else {
        units.push({ kind: 'float', align: b.align as 'left' | 'right', image: b, textBlocks });
      }
    } else {
      units.push({ kind: 'single', block: b });
      i++;
    }
  }

  return units;
}

// ─────────────────────────────────────────────────────────────
// Shared text-block renderer
// ─────────────────────────────────────────────────────────────

function TextBlock({ block }: { block: ContentBlock }) {
  if (block.type === 'paragraph') {
    // Use RichParagraph so newline-separated bullets render correctly
    return <RichParagraph text={block.text ?? ''} />;
  }

  if (block.type === 'heading') {
    const lvl = block.level ?? 2;
    const st: React.CSSProperties = {
      fontSize: lvl === 1 ? '1.75rem' : lvl === 2 ? '1.375rem' : '1.15rem',
      fontWeight: lvl === 1 ? 800 : lvl === 2 ? 700 : 600,
      color: '#111827',
      letterSpacing: '-0.02em',
      lineHeight: 1.3,
      // No whiteSpace:pre-wrap — headings should never have forced line breaks
      margin: `${lvl === 1 ? '1.5rem' : lvl === 2 ? '1.25rem' : '1rem'} 0 0.45rem 0`,
    };
    if (lvl === 1) return <h1 style={st}>{block.text}</h1>;
    if (lvl === 2) return <h2 style={st}>{block.text}</h2>;
    return <h3 style={st}>{block.text}</h3>;
  }

  if (block.type === 'quote') {
    return (
      <blockquote style={{
        borderLeft: '3px solid #ef4444',
        background: '#fff7f7',
        borderRadius: '0 0.6rem 0.6rem 0',
        padding: '0.8rem 1rem 0.8rem 0.9rem',
        margin: '0.75rem 0 1rem 0',
        fontStyle: 'italic',
        fontSize: '1rem',
        color: '#1f2937',
        lineHeight: 1.7,
        // Quotes can preserve intentional line breaks
        whiteSpace: 'pre-wrap',
      }}>
        {block.text}
      </blockquote>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Float group — responsive CSS Grid, stacks on mobile
// ─────────────────────────────────────────────────────────────

function FloatGroupRenderer({ unit }: { unit: FloatGroup }) {
  const imageFirst = unit.align === 'left';

  return (
    <div style={{
      margin: '2rem 0',
      overflow: 'hidden', // Clears the float so subsequent blocks start cleanly below
    }}>
      <figure style={{
        margin: imageFirst ? '0.4rem 2rem 1.5rem 0' : '0.4rem 0 1.5rem 2rem',
        float: imageFirst ? 'left' : 'right',
        width: '100%',
        maxWidth: '340px',
      }}>
        <img
          src={unit.image.url}
          alt={unit.image.caption ?? ''}
          style={{
            width: '100%',
            borderRadius: '0.75rem',
            display: 'block',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        />
        {unit.image.caption && (
          <figcaption style={{
            marginTop: '0.6rem',
            fontSize: '0.75rem',
            color: '#9ca3af',
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}>
            {unit.image.caption}
          </figcaption>
        )}
      </figure>

      <div>
        {unit.textBlocks.map((tb, i) => <TextBlock key={i} block={tb} />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Single block renderer — full width
// ─────────────────────────────────────────────────────────────

function SingleBlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote') {
    return <TextBlock block={block} />;
  }

  if (block.type === 'divider') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
        <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
      </div>
    );
  }

  if (block.type === 'image' && block.url) {
    const align = block.align ?? 'center';

    if (align === 'full') {
      return (
        <figure style={{ margin: '2rem -1.5rem' }}>
          <img
            src={block.url} alt={block.caption ?? ''}
            style={{
              width: '100%', borderRadius: '1rem',
              display: 'block',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            }}
          />
          {block.caption && (
            <figcaption style={{
              marginTop: '0.6rem', fontSize: '0.75rem', color: '#9ca3af',
              textAlign: 'center', fontStyle: 'italic',
            }}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    return (
      <figure style={{ margin: '2rem 0', textAlign: 'center' }}>
        <img
          src={block.url} alt={block.caption ?? ''}
          style={{
            width: '100%', borderRadius: '1rem',
            display: 'block',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}
        />
        {block.caption && (
          <figcaption style={{
            marginTop: '0.6rem', fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic',
          }}>
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return null;
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
    (async () => {
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
    })();
    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <PageTransition>
        <div className="lux-container" style={{ paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>{error || 'Blog not found'}</p>
          <Link to="/blog" style={{
            marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none',
          }}>
            <ArrowLeft size={14} /> Back to Blog
          </Link>
        </div>
      </PageTransition>
    );
  }

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const units = buildRenderUnits(blog.content ?? []);

  return (
    <PageTransition>
      <article style={{ background: 'var(--color-background, #f9fafb)', minHeight: '100vh', position: 'relative' }}>

        {/* ── Back button ── */}
        <Link to="/blog" style={{
          position: 'fixed', top: '1.25rem', left: '1.25rem', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '2.5rem', height: '2.5rem', borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          color: '#fff', textDecoration: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          transition: 'background 0.2s',
        }}>
          <ArrowLeft size={18} />
        </Link>

        {/* ── Hero ── */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', maxHeight: '560px' }}>
          <div style={{ display: 'flex', width: '100%', maxHeight: '560px' }}>
            {blog.logo && (
              <div style={{
                width: '20%', minWidth: '120px', maxWidth: '280px', flexShrink: 0,
                background: '#111827',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2rem',
              }}>
                <img
                  src={blog.logo} alt="logo"
                  style={{
                    maxWidth: '80%', maxHeight: '60%', objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                  }}
                />
              </div>
            )}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <img
                src={blog.coverImage} alt={blog.title}
                style={{ width: '100%', height: '100%', minHeight: '360px', maxHeight: '560px', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              />
            </div>
          </div>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 2rem 2.25rem 2rem' }}>
              <motion.div variants={fadeInUp} initial="initial" animate="animate">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#fb7185', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {blog.subject}
                  </span>
                  {blog.isFeatured && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                      background: 'rgba(239,68,68,0.85)', color: '#fff',
                      fontSize: '0.62rem', fontWeight: 700, padding: '0.18rem 0.55rem',
                      borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>
                      <Star size={8} fill="currentColor" /> Featured
                    </span>
                  )}
                </div>
                <h1 style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', fontWeight: 800, color: '#fff',
                  lineHeight: 1.2, margin: 0,
                  textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                }}>
                  {blog.title}
                </h1>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Meta bar ── */}
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{
            maxWidth: '100%', margin: '0 auto',
            paddingTop: '0.8rem', paddingBottom: '0.8rem',
            paddingLeft: '2rem', paddingRight: '2rem',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem',
            fontSize: '0.8rem', color: '#6b7280',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} /><span>{formattedDate}</span>
            </div>
            {blog.tags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Tag size={12} />
                {blog.tags.map(tag => (
                  <span key={tag} style={{
                    background: 'rgba(0,0,0,0.05)', color: '#374151',
                    fontSize: '0.7rem', borderRadius: '9999px',
                    padding: '0.15rem 0.5rem', fontWeight: 500,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Article body ── */}
        <div style={{ paddingTop: '2.75rem', paddingBottom: '4rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <div style={{ maxWidth: '100%', margin: '0 auto' }}>

            {/* Excerpt lead */}
            <p style={{
              fontSize: '1.1rem', lineHeight: 1.8, fontWeight: 500, color: '#111827',
              borderLeft: '4px solid #ef4444', paddingLeft: '1.1rem',
              fontStyle: 'italic', marginBottom: '2.25rem', marginTop: 0,
            }}>
              {blog.excerpt}
            </p>

            {/* Content */}
            {units.length === 0 ? (
              <p style={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '3rem 0' }}>
                No content available for this article yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {units.map((unit, i) =>
                  unit.kind === 'float'
                    ? <FloatGroupRenderer key={i} unit={unit} />
                    : <SingleBlockRenderer key={i} block={unit.block} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Back link ── */}
        <div style={{ maxWidth: '100%', margin: '0 auto', paddingBottom: '4rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <Link to="/blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.2rem', borderRadius: '0.75rem',
            border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
            fontSize: '0.875rem', fontWeight: 500, color: '#374151', textDecoration: 'none',
          }}>
            <ArrowLeft size={15} /> All Blogs
          </Link>
        </div>

      </article>
    </PageTransition>
  );
}