"use client";

import { useState, useEffect, useCallback } from 'react';
import { NewsItem } from './types';

interface AdvancedNewsReaderProps {
  onClose: () => void;
  initialArticle?: NewsItem;
}

interface TranslationState {
  [key: string]: {
    translatedTitle: string;
    translatedContent: string;
    loading: boolean;
  };
}

export default function AdvancedNewsReader({ onClose, initialArticle }: AdvancedNewsReaderProps) {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [currentArticle, setCurrentArticle] = useState<NewsItem | null>(initialArticle || null);
  const [loading, setLoading] = useState(!initialArticle);
  const [selectedSource, setSelectedSource] = useState('all');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [translations, setTranslations] = useState<TranslationState>({});
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [error, setError] = useState<string | null>(null);

  const newsSources = [
    { id: 'all', name: 'All Live Sources', language: 'multi' },
    { id: 'timesofindia', name: 'Times of India', language: 'en' },
    { id: 'thehindu', name: 'The Hindu', language: 'en' },
    { id: 'indianexpress', name: 'Indian Express', language: 'en' },
    { id: 'reuters', name: 'Reuters', language: 'en' },
    { id: 'bbc', name: 'BBC News', language: 'en' }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'ta', name: 'Tamil' },
    { code: 'hi', name: 'Hindi' }
  ];

  // Fetch live news from API
  const fetchNews = useCallback(async (source: string = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/News?source=${source}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newsData: NewsItem[] = await response.json();

      if (newsData.length === 0) {
        setError('No live news available at the moment. Please try again later.');
      }

      setArticles(newsData);

      // Set current article if we don't have one
      setCurrentArticle(prev => prev ?? (newsData.length > 0 ? newsData[0] : null));

    } catch (err) {
      console.error('Error fetching live news:', err);
      setError('Failed to load live news. Please check your internet connection and try again.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Translate article content
  const translateArticle = async (article: NewsItem, targetLang: string) => {
    if (targetLang === 'en' || targetLang === article.language) {
      setTranslations(prev => {
        const newTranslations = { ...prev };
        delete newTranslations[article.id];
        return newTranslations;
      });
      return;
    }

    setTranslations(prev => ({
      ...prev,
      [article.id]: {
        translatedTitle: '',
        translatedContent: '',
        loading: true
      }
    }));

    try {
      const [titleResponse, contentResponse] = await Promise.all([
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: article.title, 
            targetLang: targetLang 
          })
        }),
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: article.excerpt + ' ' + (article.content || ''), 
            targetLang: targetLang 
          })
        })
      ]);

      if (titleResponse.ok && contentResponse.ok) {
        const titleData = await titleResponse.json();
        const contentData = await contentResponse.json();

        setTranslations(prev => ({
          ...prev,
          [article.id]: {
            translatedTitle: titleData.translatedText || article.title,
            translatedContent: contentData.translatedText || article.excerpt,
            loading: false
          }
        }));
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslations(prev => ({
        ...prev,
        [article.id]: {
          translatedTitle: article.title,
          translatedContent: article.excerpt,
          loading: false
        }
      }));
    }
  };

  useEffect(() => {
    if (initialArticle) {
      setCurrentArticle(initialArticle);
    }
    fetchNews(selectedSource);
  }, [selectedSource, initialArticle, fetchNews]);

  useEffect(() => {
    if (currentArticle && targetLanguage !== currentArticle.language) {
      translateArticle(currentArticle, targetLanguage);
    }
  }, [currentArticle, targetLanguage]);

  const currentTranslation = currentArticle ? translations[currentArticle.id] : null;

  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-white',
    sepia: 'bg-amber-50 text-amber-900'
  };

  if (loading && !currentArticle) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live news from multiple sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 ${themeClasses[theme]} transition-colors duration-300`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold">Live News Reader</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time news from multiple sources
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Source Selector */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              {newsSources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>

            {/* Language Selector */}
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>

            {/* Font Size */}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as 'sm' | 'base' | 'lg' | 'xl')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="sm">Small</option>
              <option value="base">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>

            {/* Theme */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'sepia')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="sepia">Sepia</option>
            </select>

            <button
              onClick={() => fetchNews(selectedSource)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh live news"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Article List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Live News ({articles.length})</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                LIVE
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => fetchNews(selectedSource)}
                  className="text-red-600 text-xs mt-2 hover:text-red-800"
                >
                  Try Again
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No live news available</p>
                <button
                  onClick={() => fetchNews(selectedSource)}
                  className="text-blue-600 text-sm mt-2 hover:text-blue-800"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => setCurrentArticle(article)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentArticle?.id === article.id
                        ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {article.source}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(article.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm leading-tight mb-1">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(article.date).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Article Reader */}
        <div className="flex-1 overflow-y-auto">
          {currentArticle ? (
            <div className="max-w-4xl mx-auto p-8">
              <article className={`${fontSizeClasses[fontSize]} leading-relaxed`}>
                {/* Translation Indicator */}
                {currentTranslation?.loading && (
                  <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span className="text-sm">Translating to {languages.find(l => l.code === targetLanguage)?.name}...</span>
                    </div>
                  </div>
                )}

                {/* Article Header */}
                <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                        {currentArticle.category}
                      </span>
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        LIVE
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(currentArticle.date).toLocaleString()}
                    </span>
                  </div>
                  
                  <h1 className="text-3xl font-bold mb-4 leading-tight">
                    {currentTranslation?.translatedTitle || currentArticle.title}
                  </h1>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Source: {currentArticle.source}</span>
                    <span>Language: {languages.find(l => l.code === (currentArticle.language || 'en'))?.name}</span>
                  </div>
                </header>

                {/* Article Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">
                    {currentTranslation?.translatedContent || currentArticle.excerpt}
                  </p>
                  
                  {currentArticle.content && (
                    <div className="whitespace-pre-line">
                      {currentTranslation?.translatedContent ? currentTranslation.translatedContent : currentArticle.content}
                    </div>
                  )}
                </div>

                {/* Original Language Notice */}
                {currentTranslation && (
                  <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Note:</strong> This article has been automatically translated from {
                        languages.find(l => l.code === (currentArticle.language || 'en'))?.name
                      } to {
                        languages.find(l => l.code === targetLanguage)?.name
                      }. Some meanings may not be perfectly preserved.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => window.open(currentArticle.url, '_blank')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Read Full Article at Source
                  </button>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Share:</span>
                    <button className="hover:text-blue-500">📱</button>
                    <button className="hover:text-blue-500">📧</button>
                    <button className="hover:text-blue-500">🔗</button>
                  </div>
                </div>
              </article>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-4">Select a live news article to read</p>
                {articles.length === 0 && (
                  <button
                    onClick={() => fetchNews(selectedSource)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Load Live News
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}