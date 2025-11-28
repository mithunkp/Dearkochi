import { NextResponse } from 'next/server';
import { NewsItem } from '@/app/types';

// ✅ Single source for Manorama Online RSS feed
const MANORAMA_FEED = 'https://www.onmanorama.com/news/kerala.feed';

export async function GET() {
  try {

    const news = await fetchManoramaNews();


    return NextResponse.json(news, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching Manorama feed:', error);
    return NextResponse.json(await getFallbackNews(), { status: 200 });
  }
}

async function fetchManoramaNews(): Promise<NewsItem[]> {
  const response = await fetch(MANORAMA_FEED, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();

  return parseRSSFeed(xml).slice(0, 15);
}
function parseRSSFeed(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  let count = 0;

  while ((match = itemRegex.exec(xml)) !== null && count < 20) {
    const itemContent = match[1];
    const title = extractTag(itemContent, 'title');
    const link = extractTag(itemContent, 'link');
    const description = extractTag(itemContent, 'description');
    const pubDate = extractTag(itemContent, 'pubDate');

    if (title && link) {
      items.push({
        id: `manorama-${Date.now()}-${count}`,
        title: decodeHtml(title),
        date: new Date(pubDate || Date.now()).toISOString(),
        excerpt: decodeHtml(description).slice(0, 120) + '...',
        category: 'Kochi Local',
        url: link,
        source: 'Manorama Online',
        language: 'en',
        content: decodeHtml(description),
      });
      count++;
    }
  }

  return items;
}

function extractTag(text: string, tag: string): string {
  const match = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? cleanText(match[1]) : '';
}

function decodeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

async function getFallbackNews(): Promise<NewsItem[]> {
  return [
    {
      id: `fallback-${Date.now()}`,
      title: 'Kochi witnesses record tourist inflow during Diwali week',
      date: new Date().toISOString(),
      excerpt:
        'Tourism officials report a surge in domestic and international visitors exploring Kochi’s heritage and backwaters.',
      category: 'Kochi Local',
      url: '#',
      source: 'Fallback News',
      language: 'en',
      content:
        'Kochi’s tourism industry experienced a major boost as thousands of travelers arrived for Diwali festivities, contributing to the local economy.',
    },
  ];
}
