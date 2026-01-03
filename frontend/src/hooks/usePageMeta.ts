import { useEffect } from 'react';

type Meta = {
  title: string;
  description?: string;
};

function upsertMeta(nameOrProp: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${nameOrProp}="${key}"]`;
  let tag = document.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(nameOrProp, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function usePageMeta(meta: Meta) {
  useEffect(() => {
    document.title = meta.title;
    if (meta.description) {
      upsertMeta('name', 'description', meta.description);
      upsertMeta('property', 'og:title', meta.title);
      upsertMeta('property', 'og:description', meta.description);
      upsertMeta('property', 'twitter:title', meta.title);
      upsertMeta('property', 'twitter:description', meta.description);
    } else {
      upsertMeta('property', 'og:title', meta.title);
      upsertMeta('property', 'twitter:title', meta.title);
    }
  }, [meta.description, meta.title]);
}


