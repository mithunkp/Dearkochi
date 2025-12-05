'use client';

import { useState, useEffect } from 'react';
import { NewsItem } from "./types";
import AdvancedNewsReader from './AdvancedNewsReader';
import Image from 'next/image';

interface NewsSidebarProps {
  onClose: () => void;
}

export default function NewsSidebar({ onClose }: NewsSidebarProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAdvancedReader, setShowAdvancedReader] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch live news
  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/News?source=all');

      if (response.ok) {
        const newsData = await response.json();
        setNews(newsData);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch live news ');
        setNews([]); // Empty array instead of static data
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]); // Empty array on error
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(news.map(item => item.category))];
  const filteredNews = selectedCategory === 'all'
    ? news
    : news.filter(item => item.category === selectedCategory);

  useEffect(() => {
    fetchNews();

    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openArticleInReader = (article: NewsItem) => {
    setSelectedArticle(article);
    setShowAdvancedReader(true);
  };

  if (showAdvancedReader) {
    return (
      <AdvancedNewsReader
        onClose={() => {
          setShowAdvancedReader(false);
          setSelectedArticle(null);
        }}
        initialArticle={selectedArticle || undefined}
      />
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto z-40 shadow-xl transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Live News</h2>
            {lastUpdated && (
              <p className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={fetchNews}
            className="text-blue-500 hover:text-blue-700 transition-colors text-sm"
            title="Refresh news"
            disabled={loading}
          >
            {loading ? (
              <div className="relative w-4 h-4 animate-spin">
                <Image src="/action-refresh.svg" alt="Loading" fill className="object-contain" />
              </div>
            ) : (
              <div className="relative w-4 h-4">
                <Image src="/action-refresh.svg" alt="Refresh" fill className="object-contain" />
              </div>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvancedReader(true)}
            className="text-blue-500 hover:text-blue-700 transition-colors text-sm"
            title="Open full news reader"
          >
            <div className="relative w-4 h-4">
              <Image src="/action-fullscreen.svg" alt="Full Screen" fill className="object-contain" />
            </div>
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">
            <div className="relative w-4 h-4">
              <Image src="/action-close.svg" alt="Close" fill className="object-contain" />
            </div>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {categories.slice(0, 6).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 text-xs rounded capitalize ${selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No live news available</p>
          <button
            onClick={fetchNews}
            className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNews.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-lg p-3 hover:shadow-sm transition-all border border-gray-200 cursor-pointer"
              onClick={() => openArticleInReader(item)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                  {item.category}
                </span>
                <div className="flex items-center space-x-1">
                  <div className="relative w-2 h-2">
                    <Image src="/status-live.svg" alt="Live" fill className="object-contain" />
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(item.date).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2 leading-tight line-clamp-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-2">
                {item.excerpt}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">{item.source}</span>
                <span className="text-blue-600 text-xs font-medium">
                  Read
                  <div className="relative w-3 h-3 ml-1">
                    <Image src="/arrow-right.svg" alt="Read" fill className="object-contain" />
                  </div>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 space-y-4">
        <button
          onClick={() => setShowAdvancedReader(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Open Full News Reader
        </button>

        <div className="bg-blue-50 rounded-lg p-3">
          <h3 className="font-semibold text-blue-800 text-sm mb-2">Live Sources</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• NDTV • Times of India</div>
            <div>• The Hindu • Reuters</div>
            <div>• BBC News • Indian Express</div>
          </div>
        </div>
      </div>
    </aside>
  );
}