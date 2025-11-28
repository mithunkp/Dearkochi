// app/api/live-news/route.ts
import { NextResponse } from "next/server";
import { NewsItem } from "@/app/types";

// ---- Types ----
interface ExtendedNewsItem extends NewsItem {
  fullContent?: string;
}

// ---- Config ----
const RSS_FEEDS = [
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://rss.cnn.com/rss/edition.rss",
  "https://feeds.reuters.com/reuters/topNews",
  "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  "https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml",
  "https://indianexpress.com/feed/",
  "https://www.onmanorama.com/news/kerala.feed", // Fixed Manorama feed
  "https://www.mathrubhumi.com/rss/kerala.rss",
  "https://english.mathrubhumi.com/rss/kerala-news.xml",
  "https://www.asianetnews.com/rss/kerala"
];

// ---- Constants ----
const MAX_ITEMS = 25;
const FETCH_TIMEOUT = 10000; // Increased timeout
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ---- Simple in-memory cache ----
let cachedNews: ExtendedNewsItem[] | null = null;
let cacheTimestamp = 0;

// ---- Route ----
export async function GET() {
  try {
    // ✅ Use cached version if still valid
    if (cachedNews && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedNews, {
        headers: defaultHeaders(),
      });
    }

    const newsData = await fetchLiveNewsFromReliableSources();
    cachedNews = newsData;
    cacheTimestamp = Date.now();

    return NextResponse.json(newsData, {
      headers: defaultHeaders(),
    });
  } catch (error) {
    console.error("❌ Live news error:", error);
    const fallbackData = await getFallbackNews();
    return NextResponse.json(fallbackData, {
      headers: defaultHeaders(),
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: defaultHeaders(),
  });
}

function defaultHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };
}

// ---- Fetch multiple feeds concurrently ----
async function fetchLiveNewsFromReliableSources(): Promise<ExtendedNewsItem[]> {
  const limitedFeeds = RSS_FEEDS.slice(0, 8);
  const results = await Promise.allSettled(
    limitedFeeds.map((url) => fetchRSSFeedWithTimeout(url, FETCH_TIMEOUT))
  );

  let allItems: ExtendedNewsItem[] = [];
  for (const [i, res] of results.entries()) {
    if (res.status === "fulfilled" && res.value.length) {

      allItems.push(...res.value);
    } else {

    }
  }

  if (!allItems.length) {
    console.warn("⚠️ No feeds succeeded, using fallback data");
    allItems = await getFallbackNews();
  }

  return processNewsItems(allItems);
}

// ---- Fetch one RSS feed safely ----
async function fetchRSSFeedWithTimeout(url: string, timeout: number): Promise<ExtendedNewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml"
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xmlText = await response.text();

    // More flexible RSS detection
    if (!xmlText.includes("<rss") && !xmlText.includes("<feed") && !xmlText.includes("<?xml")) {
      throw new Error("Invalid RSS/XML structure");
    }

    return parseRSSFeed(xmlText, url).slice(0, 10);
  } catch (error) {
    console.error(`❌ RSS error for ${url}:`, (error as Error).message);
    return [];
  }
}

// ---- Improved RSS Parsing with Full Content ----
function parseRSSFeed(xml: string, sourceUrl: string): ExtendedNewsItem[] {
  // Try different parsing strategies
  const strategies = [
    parseStandardRSS,
    parseAtomFeed,
    parseManoramaFormat
  ];

  for (const strategy of strategies) {
    const result = strategy(xml, sourceUrl);
    if (result.length > 0) {

      return result;
    }
  }


  return [];
}

// ---- Standard RSS 2.0 Parser ----
function parseStandardRSS(xml: string, sourceUrl: string): ExtendedNewsItem[] {
  const items: ExtendedNewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;

  let match;
  while ((match = itemRegex.exec(xml)) && items.length < 15) {
    const content = match[1];

    const title = extractValue(content, ["title"]);
    const link = extractValue(content, ["link"]) || extractValue(content, ["guid"]) || "#";
    const description = extractValue(content, ["description"]);
    const contentEncoded = extractValue(content, ["content:encoded"]);
    const pubDate = extractValue(content, ["pubDate", "dc:date"]);

    if (!title) continue;

    const fullContent = contentEncoded || description || title;

    const item: ExtendedNewsItem = {
      id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: decodeEntities(title),
      date: parseDate(pubDate),
      excerpt: decodeEntities(description || title).slice(0, 160) + '...',
      category: extractCategory(title, description),
      url: link.startsWith("http") ? link : "#",
      source: getSource(sourceUrl),
      language: "en",
      content: decodeEntities(fullContent).slice(0, 500) + (fullContent.length > 500 ? '...' : ''),
      fullContent: decodeEntities(fullContent)
    };
    items.push(item);
  }
  return items;
}

// ---- Atom Feed Parser ----
function parseAtomFeed(xml: string, sourceUrl: string): ExtendedNewsItem[] {
  const items: ExtendedNewsItem[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;

  let match;
  while ((match = entryRegex.exec(xml)) && items.length < 15) {
    const content = match[1];

    const title = extractValue(content, ["title"]);
    const linkMatch = /<link[^>]*href="([^"]*)"[^>]*\/?>/i.exec(content);
    const link = linkMatch ? linkMatch[1] : "#";
    const summary = extractValue(content, ["summary"]);
    const contentText = extractValue(content, ["content"]);
    const updated = extractValue(content, ["updated", "published"]);

    if (!title) continue;

    const fullContent = contentText || summary || title;

    const item: ExtendedNewsItem = {
      id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: decodeEntities(title),
      date: parseDate(updated),
      excerpt: decodeEntities(summary || title).slice(0, 160) + '...',
      category: extractCategory(title, summary),
      url: link.startsWith("http") ? link : "#",
      source: getSource(sourceUrl),
      language: "en",
      content: decodeEntities(fullContent).slice(0, 500) + (fullContent.length > 500 ? '...' : ''),
      fullContent: decodeEntities(fullContent)
    };
    items.push(item);
  }
  return items;
}

// ---- Special Parser for Manorama ----
function parseManoramaFormat(xml: string, sourceUrl: string): ExtendedNewsItem[] {
  const items: ExtendedNewsItem[] = [];

  // Try to find any content between tags that might be news items
  const potentialItems = xml.match(/<item[^>]*>[\s\S]*?<\/item>|<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];

  for (const itemXml of potentialItems.slice(0, 15)) {
    try {
      const title = extractValue(itemXml, ["title"]);
      if (!title) continue;

      const link = extractValue(itemXml, ["link", "guid"]) || "#";
      const description = extractValue(itemXml, ["description", "summary"]);
      const content = extractValue(itemXml, ["content:encoded", "content"]);
      const pubDate = extractValue(itemXml, ["pubDate", "dc:date", "updated"]);

      const fullContent = content || description || title;

      const item: ExtendedNewsItem = {
        id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: decodeEntities(title),
        date: parseDate(pubDate),
        excerpt: decodeEntities(description || title).slice(0, 160) + '...',
        category: extractCategory(title, description),
        url: link.startsWith("http") ? link : "#",
        source: getSource(sourceUrl),
        language: "en",
        content: decodeEntities(fullContent).slice(0, 500) + (fullContent.length > 500 ? '...' : ''),
        fullContent: decodeEntities(fullContent)
      };
      items.push(item);
    } catch (err) {

      continue;
    }
  }

  return items;
}

// ---- Improved Value Extraction ----
function extractValue(xml: string, tags: string[]): string {
  for (const tag of tags) {
    // Try CDATA first
    const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
    const cdataMatch = cdataRegex.exec(xml);
    if (cdataMatch) return cleanText(cdataMatch[1]);

    // Try normal tag
    const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
    const tagMatch = tagRegex.exec(xml);
    if (tagMatch) return cleanText(tagMatch[1]);

    // Try self-closing tag with attributes
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\\s+href=["']([^"']+)["'][^>]*\\/?>`, "i");
    const selfClosingMatch = selfClosingRegex.exec(xml);
    if (selfClosingMatch) return selfClosingMatch[1];
  }
  return "";
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// ---- Improved Entity Decoding ----
function decodeEntities(text: string): string {
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#039;': "'",
    '&nbsp;': ' ',
  };

  return text
    .replace(/&[#a-zA-Z0-9]+;/g, (match) => entityMap[match] || match)
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function parseDate(date: string): string {
  if (!date) return new Date().toISOString();

  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function getSource(url: string): string {
  const sourceMap: Record<string, string> = {
    "bbc": "BBC News",
    "cnn": "CNN",
    "reuters": "Reuters",
    "timesofindia": "Times of India",
    "hindustantimes": "Hindustan Times",
    "indianexpress": "Indian Express",
    "onmanorama": "Manorama Online",
    "mathrubhumi": "Mathrubhumi",
    "asianetnews": "Asianet News",
  };

  for (const [key, value] of Object.entries(sourceMap)) {
    if (url.includes(key)) return value;
  }
  return "News Source";
}

function extractCategory(title: string, description?: string): string {
  const text = (title + ' ' + (description || '')).toLowerCase();

  const categories = [
    { key: ["kochi", "ernakulam"], label: "Kochi Local" },
    { key: ["kerala", "trivandrum", "thiruvananthapuram"], label: "Kerala" },
    { key: ["india", "delhi", "mumbai"], label: "India" },
    { key: ["tech", "software", "ai", "artificial intelligence"], label: "Technology" },
    { key: ["sports", "cricket", "football"], label: "Sports" },
    { key: ["business", "economy", "market"], label: "Business" },
    { key: ["health", "medical", "hospital"], label: "Health" },
    { key: ["education", "school", "college"], label: "Education" },
    { key: ["weather", "rain", "monsoon"], label: "Weather" },
    { key: ["politics", "election", "minister"], label: "Politics" },
  ];

  for (const category of categories) {
    if (category.key.some(keyword => text.includes(keyword))) {
      return category.label;
    }
  }

  return "General";
}

// ---- Post-processing ----
function processNewsItems(items: ExtendedNewsItem[]) {
  const unique: Record<string, ExtendedNewsItem> = {};

  items.forEach((item) => {
    // Create a unique key based on title and first few words of content
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (!unique[key]) {
      unique[key] = item;
    }
  });

  return Object.values(unique)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_ITEMS);
}

// ---- Improved Fallback ----
async function getFallbackNews(): Promise<ExtendedNewsItem[]> {
  return [
    {
      id: "fallback-1",
      title: "Kochi Metro Extension to Kakkanad Approved by State Government",
      date: new Date().toISOString(),
      excerpt: "The long-awaited Metro expansion will connect the IT hub of Kakkanad with the city center, reducing travel time significantly.",
      category: "Kochi Local",
      url: "#",
      source: "Smart City News",
      language: "en",
      content: "The project, spanning 11 km and 11 stations, is expected to reduce congestion and improve connectivity for thousands of tech professionals. The extension will pass through major residential and commercial areas, providing a much-needed public transport solution for the growing population.",
      fullContent: "The Kochi Metro Rail Corporation has received final approval from the state government for the much-anticipated extension to Kakkanad. The 11-kilometer stretch will include 11 new stations connecting the city center to the IT hub. This project is expected to be completed within three years and will significantly reduce traffic congestion in the area. The extension will serve major tech parks, residential complexes, and commercial centers, providing seamless connectivity for daily commuters."
    },
    {
      id: "fallback-2",
      title: "Smart City Kochi Launches Urban Command Center",
      date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      excerpt: "A step toward making Kochi one of India's most digitally managed cities with real-time monitoring of urban services.",
      category: "Kochi Local",
      url: "#",
      source: "Smart City Mission",
      language: "en",
      content: "The integrated control center will monitor traffic, utilities, and emergency services, marking a major leap in Kochi's smart city transformation. The facility uses AI and IoT sensors to optimize urban management.",
      fullContent: "Kochi Smart City Mission today inaugurated the Integrated Urban Command Center, a state-of-the-art facility that will monitor and manage city services in real-time. The center uses artificial intelligence, Internet of Things sensors, and data analytics to optimize traffic flow, utility distribution, and emergency response systems. This initiative positions Kochi as a leader in urban digital transformation in India. The command center will coordinate with various municipal departments to ensure efficient service delivery and quick response to citizen needs."
    },
  ];
}