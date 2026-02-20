import type { RequestHandler } from "express";
import { z } from "zod";
import { Art } from "../models/Art";
import { Event } from "../models/Event";
import { TalkShowVideo } from "../models/TalkShowVideo";
import { Blog } from "../models/Blog";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(120),
  scope: z.enum(["all", "art", "events", "talkshow", "blogs"]).optional().default("all"),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

type SearchScope = "all" | "art" | "events" | "talkshow" | "blogs";
type SearchSuggestion = {
  id: string;
  type: "art" | "event" | "talkshow" | "blog";
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
};

function splitLimit(total: number, scope: SearchScope): Record<Exclude<SearchScope, "all">, number> {
  if (scope !== "all") {
    return {
      art: scope === "art" ? total : 0,
      events: scope === "events" ? total : 0,
      talkshow: scope === "talkshow" ? total : 0,
      blogs: scope === "blogs" ? total : 0,
    };
  }

  const perType = total;
  return {
    art: perType,
    events: perType,
    talkshow: perType,
    blogs: perType,
  };
}

function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const unifiedSearch: RequestHandler = async (req, res, next) => {
  try {
    const { q, scope, limit } = searchQuerySchema.parse(req.query);
    const limits = splitLimit(limit, scope);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const safe = escapeRegex(q);
    const startsWith = new RegExp(`^${safe}`, "i");
    const contains = new RegExp(safe, "i");

    const [artResults, eventResults, talkShowResults, blogResults] = await Promise.all([
      limits.art > 0
        ? Art.find({
            isAvailable: true,
            $or: [
              { title: startsWith },
              { artist: startsWith },
              { category: startsWith },
              { title: contains },
              { artist: contains },
              { category: contains },
              { description: contains },
            ],
          })
            .select("title artist images")
            .sort({ createdAt: -1 })
            .limit(limits.art)
            .lean()
        : Promise.resolve([]),
      limits.events > 0
        ? Event.find({
            date: { $gte: now },
            seatsLeft: { $gt: 0 },
            $or: [
              { title: startsWith },
              { venue: startsWith },
              { title: contains },
              { venue: contains },
              { description: contains },
            ],
          })
            .select("title venue coverImage")
            .sort({ date: 1, createdAt: -1 })
            .limit(limits.events)
            .lean()
        : Promise.resolve([]),
      limits.talkshow > 0
        ? TalkShowVideo.find({
            $or: [
              { title: startsWith },
              { title: contains },
              { description: contains },
            ],
          })
            .select("title season episodeNumber thumbnail")
            .sort({ createdAt: -1 })
            .limit(limits.talkshow)
            .lean()
        : Promise.resolve([]),
      limits.blogs > 0
        ? Blog.find({
            isPublished: true,
            $or: [
              { title: startsWith },
              { subject: startsWith },
              { title: contains },
              { subject: contains },
              { excerpt: contains },
              { tags: contains },
            ],
          })
            .select("title subject coverImage slug")
            .sort({ createdAt: -1 })
            .limit(limits.blogs)
            .lean()
        : Promise.resolve([]),
    ]);

    const suggestions: SearchSuggestion[] = [
      ...artResults.map((item) => ({
        id: String(item._id),
        type: "art" as const,
        title: item.title,
        subtitle: truncate(item.artist || "Art"),
        image: item.images?.[0] || null,
        href: `/art/${String(item._id)}`,
      })),
      ...eventResults.map((item) => ({
        id: String(item._id),
        type: "event" as const,
        title: item.title,
        subtitle: truncate(item.venue || "Event"),
        image: item.coverImage || null,
        href: `/events/${String(item._id)}`,
      })),
      ...talkShowResults.map((item) => ({
        id: String(item._id),
        type: "talkshow" as const,
        title: item.title,
        subtitle: `Season ${item.season}${item.episodeNumber ? ` · Ep ${item.episodeNumber}` : ""}`,
        image: item.thumbnail || null,
        href: "/talkshow",
      })),
      ...blogResults.map((item) => ({
        id: String(item._id),
        type: "blog" as const,
        title: item.title,
        subtitle: truncate(item.subject || "Blog"),
        image: item.coverImage || null,
        href: `/blog/${item.slug}`,
      })),
    ];

    const ordered = suggestions.slice(0, limit);

    return res.json({
      query: q,
      scope,
      suggestions: ordered,
      total: ordered.length,
    });
  } catch (err) {
    next(err);
  }
};
