import apiClient from '@/api/client';

export type SearchScope = 'all' | 'art' | 'events' | 'talkshow' | 'blogs' | 'gallery';

export type SearchSuggestion = {
  id: string;
  type: 'art' | 'event' | 'talkshow' | 'blog' | 'gallery';
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
};

type SearchResponse = {
  query: string;
  scope: SearchScope;
  suggestions: SearchSuggestion[];
  total: number;
};

export async function fetchSearchSuggestions(params: {
  q: string;
  scope: SearchScope;
  limit?: number;
}): Promise<SearchSuggestion[]> {
  const response = await apiClient.get<SearchResponse>('/search', {
    params: {
      q: params.q,
      scope: params.scope,
      limit: params.limit ?? 8,
    },
  });

  return response.data?.suggestions ?? [];
}
