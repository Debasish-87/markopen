// src/hooks/useSEO.ts
import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object | object[];
  noIndex?: boolean;
}

const SITE_NAME = 'Markopen';
const SITE_URL  = 'https://markopen.app'; // update to your domain
const DEFAULT_DESC = 'Find open shops near you — browse local businesses by category, check hours, and discover what\'s open right now.';
const DEFAULT_IMG  = `${SITE_URL}/og-default.png`;

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setStructuredData(id: string, data: object | object[]) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(Array.isArray(data) ? data : data);
}

export function useSEO({
  title,
  description = DEFAULT_DESC,
  canonical,
  ogImage = DEFAULT_IMG,
  ogType = 'website',
  structuredData,
  noIndex = false,
}: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Find Open Shops Near You`;
    const url = canonical ?? SITE_URL;

    // Basic
    document.title = fullTitle;
    setMeta('description', description);
    setMeta('robots', noIndex ? 'noindex,nofollow' : 'index,follow');

    // Canonical
    setLink('canonical', url);

    // Open Graph
    setMeta('og:title',       fullTitle,   'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url',         url,         'property');
    setMeta('og:type',        ogType,      'property');
    setMeta('og:image',       ogImage,     'property');
    setMeta('og:site_name',   SITE_NAME,   'property');

    // Twitter Card
    setMeta('twitter:card',        'summary_large_image');
    setMeta('twitter:title',       fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image',       ogImage);

    // Structured data
    if (structuredData) {
      setStructuredData('structured-data', structuredData);
    }
  }, [title, description, canonical, ogImage, ogType, structuredData, noIndex]);
}

// ── Structured data builders ──────────────────────────────────────────────────

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESC,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}?search={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildLocalBusinessSchema(shop: {
  name: string; description: string; address: string;
  phone: string; hours: string; category: string;
  photo_url?: string; map_query?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: shop.name,
    description: shop.description || `${shop.name} — ${shop.category} in ${shop.address}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.address,
      addressLocality: 'Bhubaneswar',
      addressRegion: 'Odisha',
      addressCountry: 'IN',
    },
    telephone: shop.phone,
    openingHours: shop.hours,
    image: shop.photo_url || undefined,
    hasMap: shop.map_query ? `https://maps.google.com/?q=${encodeURIComponent(shop.map_query)}` : undefined,
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildItemListSchema(shops: { name: string; url: string; description: string; image?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: shops.slice(0, 20).map((shop, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: shop.name,
      description: shop.description,
      image: shop.image || undefined,
      url: shop.url,
    })),
  };
}