'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';

import NewsSidebar from './NewsSidebar';
import AuthModal from './AuthModal';

import { useAuth } from '@/lib/auth-context';
import { NewsItem, Attraction, Transport, Contact, SocialPost, Fact } from './types';
import { getWeatherIcon, getWeatherDescription, WeatherData } from '@/lib/weather';

// --- Types for Dashboard ---
type CardId = 'weather' | 'places' | 'transport' | 'emergency' | 'social' | 'classified' | 'stores';

interface DashboardCardProps {
  id: CardId;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  onInteract: () => void;
  icon?: string;
  colorTheme?: string;
}

// --- Helper Components ---
const DashboardCard = ({ id, title, description, className = '', children, onInteract, icon, colorTheme = 'blue' }: DashboardCardProps) => {
  const themeClasses: Record<string, string> = {
    blue: 'bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/30 border-blue-100/50 hover:border-blue-200/70',
    green: 'bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/30 border-green-100/50 hover:border-green-200/70',
    red: 'bg-gradient-to-br from-slate-50 via-rose-50/40 to-red-50/30 border-red-100/50 hover:border-red-200/70',
    purple: 'bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/30 border-purple-100/50 hover:border-purple-200/70',
    orange: 'bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/30 border-orange-100/50 hover:border-orange-200/70',
    teal: 'bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50/30 border-teal-100/50 hover:border-teal-200/70',
  };

  return (
    <div
      onClick={onInteract}
      className={`rounded-3xl p-7 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(0,0,0,0.12)] cursor-pointer flex flex-col h-full relative overflow-hidden group backdrop-blur-sm ${themeClasses[colorTheme]} ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onInteract()}
    >
      {/* Subtle animated background element */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
      </div>

      <div className="flex-1 relative z-10">
        {children}
      </div>
    </div>
  );
};

export default function DearKochi() {
  const [showNewsSidebar, setShowNewsSidebar] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const { user } = useAuth();
  const router = useRouter();

  // Data State
  type SiteData = {
    socialPosts?: SocialPost[];
    attractions?: Attraction[];
    transportation?: Transport[];
    emergencyContacts?: Contact[];
    quickFacts?: Fact[];
  };

  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [topNews, setTopNews] = useState<NewsItem[] | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dashboard State
  const [cardOrder, setCardOrder] = useState<CardId[]>([
    'weather', 'places', 'transport', 'social', 'classified', 'emergency', 'stores'
  ]);
  const [interactionCounts, setInteractionCounts] = useState<Record<CardId, number>>({
    weather: 0, places: 0, transport: 0, social: 0, classified: 0, emergency: 0, stores: 0
  });

  // Load preferences from localStorage
  useEffect(() => {
    const savedCounts = localStorage.getItem('dashboard_interactions');
    if (savedCounts) {
      try {
        const counts = JSON.parse(savedCounts);
        setInteractionCounts(counts);

        // Sort cards based on counts (descending)
        // We create a copy of the default order to ensure all keys are present
        const defaultOrder: CardId[] = ['weather', 'places', 'transport', 'social', 'classified', 'emergency', 'stores'];
        const sorted = [...defaultOrder].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));

        setCardOrder(sorted);
      } catch (e) {
        console.error("Failed to parse interaction counts", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const handleInteraction = (id: CardId) => {
    const newCounts = { ...interactionCounts, [id]: (interactionCounts[id] || 0) + 1 };
    setInteractionCounts(newCounts);
    localStorage.setItem('dashboard_interactions', JSON.stringify(newCounts));

    // Navigation Logic
    const routes: Record<CardId, string> = {
      weather: '/weather',
      places: '/Places',
      transport: '/transport',
      emergency: '/emergency',
      social: '/social',
      classified: '/classified',
      stores: '/stores',
    };

    if (routes[id]) {
      router.push(routes[id]);
    }
  };

  // Fetch Data
  const fetchSiteData = async () => {
    try {
      const res = await fetch('/api/site-data');
      if (res.ok) setSiteData(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchTopNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch('/api/News');
      if (res.ok) setTopNews((await res.json()).slice(0, 3));
    } catch (e) { console.error(e); }
    finally { setLoadingNews(false); }
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/weather');
      if (res.ok) setWeatherData(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchSiteData();
    fetchTopNews();
    fetchWeather();
  }, []);

  // --- Renderers for each Card Type ---

  const renderPackingCard = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tighter mb-1">Packing</h3>
        <p className="text-teal-600 font-bold tracking-tight text-sm">Essentials</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {[
          { label: 'Shoes', icon: '/pack-shoes.svg' },
          { label: 'Cotton', icon: '/pack-tshirt.svg' },
          { label: 'SPF', icon: '/pack-sunscreen.svg' },
          { label: 'Umbrella', icon: '/pack-umbrella.svg' }
        ].map((item, i) => (
          <span key={i} className="bg-white/60 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm backdrop-blur-sm flex items-center gap-1">
            <div className="relative w-4 h-4">
              <NextImage src={item.icon} alt={item.label} fill className="object-contain" />
            </div>
            {item.label}
          </span>
        ))}
      </div>
    </div >
  );

  const renderPlacesCard = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tighter mb-2">Must Visit</h3>
        <p className="text-orange-600 font-semibold text-sm leading-relaxed">Where every corner holds timeless stories and warmth</p>
      </div>
      <div className="flex items-center gap-3 mt-auto pt-4">
        <div className="flex -space-x-3">
          {['/cat-all.svg', '/cat-historical.svg', '/cat-scenic.svg'].map((icon, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-white flex items-center justify-center text-lg shadow-sm relative overflow-hidden">
              <div className="relative w-6 h-6">
                <NextImage src={icon} alt="Place" fill className="object-contain" />
              </div>
            </div>
          ))}
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Spots</span>
      </div>
    </div>
  );

  const renderWeatherCard = () => {
    if (!weatherData) return <div className="text-center py-8 text-gray-400">Loading...</div>;
    const { current } = weatherData;

    return (
      <div className="flex flex-col justify-between h-full">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Right Now in Fort Kochi</p>
          <div className="flex items-baseline gap-2">
            <div className="text-6xl font-bold text-gray-900 tracking-tighter">{Math.round(current.temperature)}°</div>
            <div className="text-blue-600 font-semibold">{getWeatherDescription(current.weatherCode)}</div>
          </div>
        </div>
        <div className="flex items-end justify-between mt-6">
          <div className="flex gap-4 text-xs font-bold text-gray-600">
            <div className="bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-1">
              <div className="relative w-4 h-4"><NextImage src="/weather-fog.svg" alt="Humidity" fill className="object-contain" /></div>
              {current.humidity}%
            </div>
            <div className="bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-1">
              <div className="relative w-4 h-4"><NextImage src="/weather-storm.svg" alt="Wind" fill className="object-contain" /></div>
              {current.windSpeed}
            </div>
          </div>
          <div className="relative w-16 h-16 filter drop-shadow-sm">
            <NextImage src={getWeatherIcon(current.weatherCode, current.isDay)} alt="Weather" fill className="object-contain" />
          </div>
        </div>
      </div>
    );
  };

  const renderTransportCard = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tighter mb-2">Transport</h3>
        <p className="text-blue-600 font-semibold text-sm leading-relaxed">Move through the city with ease and grace</p>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">Metro</span>
            <span className="bg-gradient-to-r from-green-100 to-teal-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">Bus</span>
          </div>
          <p className="text-[11px] text-gray-600 font-medium">Information about Kochi transport</p>
        </div>
        <div className="relative w-16 h-16 filter drop-shadow-sm">
          <NextImage src="/card-transport.svg" alt="Transport" fill className="object-contain" />
        </div>
      </div>
    </div>
  );

  const renderEmergencyCard = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tighter mb-2">Emergency</h3>
        <p className="text-red-600 font-semibold text-sm leading-relaxed">Help is just a call away, anytime</p>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="bg-gradient-to-r from-red-100 to-rose-100 px-3 py-2 rounded-lg">
              <p className="text-[10px] text-gray-600 font-semibold uppercase">Police</p>
              <p className="text-lg font-bold text-red-700">100</p>
            </div>
            <div className="bg-gradient-to-r from-orange-100 to-red-100 px-3 py-2 rounded-lg">
              <p className="text-[10px] text-gray-600 font-semibold uppercase">Ambulance</p>
              <p className="text-lg font-bold text-red-700">108</p>
            </div>
          </div>
        </div>
        <div className="relative w-16 h-16 filter drop-shadow-sm">
          <NextImage src="/card-emergency.svg" alt="Emergency" fill className="object-contain" />
        </div>
      </div>
    </div>
  );

  const renderSocialCard = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tighter mb-2">Social</h3>
        <p className="text-purple-600 font-semibold text-sm leading-relaxed">Connect with neighbors and friends</p>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-white shadow-sm"></div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 border-2 border-white shadow-sm"></div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-700 shadow-sm">+8</div>
          </div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Active Now</p>
        </div>
        <div className="relative w-16 h-16 filter drop-shadow-sm">
          <NextImage src="/card-social.svg" alt="Social" fill className="object-contain" />
        </div>
      </div>
    </div>
  );

  const renderClassifiedCard = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tighter mb-2">Classifieds</h3>
        <p className="text-amber-600 font-semibold text-sm leading-relaxed">Buy, sell, and share with the community</p>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-lg">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">New Listings</p>
          <p className="text-xl font-bold text-amber-800 mt-1">24+</p>
        </div>
        <div className="relative w-16 h-16 filter drop-shadow-sm">
          <NextImage src="/card-classified.svg" alt="Classifieds" fill className="object-contain" />
        </div>
      </div>
    </div>
  );

  const renderStoresCard = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tighter mb-2">Stores</h3>
        <p className="text-indigo-600 font-semibold text-sm leading-relaxed">Discover local businesses</p>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="bg-gradient-to-r from-indigo-100 to-blue-100 px-4 py-2 rounded-lg">
          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Open Now</p>
          <p className="text-xl font-bold text-indigo-800 mt-1">Explore</p>
        </div>
        <div className="relative w-16 h-16 filter drop-shadow-sm">
          <NextImage src="/card-stores.svg" alt="Stores" fill className="object-contain" />
        </div>
      </div>
    </div>
  );

  const cardRenderers: Record<CardId, () => React.ReactNode> = {
    weather: renderWeatherCard,
    places: renderPlacesCard,
    transport: renderTransportCard,
    emergency: renderEmergencyCard,
    social: renderSocialCard,
    classified: renderClassifiedCard,
    stores: renderStoresCard,
  };

  const cardConfig: Record<CardId, { title: string; icon: string; theme: string }> = {
    weather: { title: 'Weather', icon: '/card-weather.svg', theme: 'blue' },
    places: { title: 'Must Visit', icon: '/card-places.svg', theme: 'orange' },
    transport: { title: 'Transport', icon: '/card-transport.svg', theme: 'blue' },
    emergency: { title: 'Emergency', icon: '/card-emergency.svg', theme: 'red' },
    social: { title: 'Social Feed', icon: '/card-social.svg', theme: 'purple' },
    classified: { title: 'Classifieds', icon: '/card-classified.svg', theme: 'teal' },
    stores: { title: 'Stores', icon: '/card-stores.svg', theme: 'blue' },
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/10 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gradient-to-r from-blue-100 to-cyan-100 rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/10 font-sans pb-20 relative overflow-hidden">
      {/* Animated background wave pattern */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(56,189,248,0.1),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.1),transparent_50%)]"></div>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 320">
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(148,163,184,0.05)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0.05)" />
            </linearGradient>
          </defs>
          <path fill="url(#wave1)" d="M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,154.7C672,149,768,139,864,128C960,117,1056,107,1152,101.3C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Sidebar */}
      {showNewsSidebar && <NewsSidebar onClose={() => setShowNewsSidebar(false)} />}

      <div className={`transition-all duration-300 ${showNewsSidebar ? 'lg:ml-80' : ''}`}>
        {/* Header */}
        <header className="bg-white/50 backdrop-blur-xl border-b border-white/40 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 overflow-hidden relative">
                <NextImage
                  src="/logo.png"
                  alt="DearKochi Logo"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-[#e81a1d] leading-none tracking-tight">DearKochi</h1>
                <p className="text-[10px] font-semibold text-amber-600 mt-0.5 uppercase tracking-widest">Experience Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewsSidebar(!showNewsSidebar)}
                className={`p-2 rounded-full transition-all duration-300 relative ${showNewsSidebar ? 'text-blue-600 bg-blue-50 shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Toggle News"
              >
                <div className="relative w-6 h-6">
                  <NextImage src="/action-refresh.svg" alt="News" fill className="object-contain" />
                </div>
                {topNews && topNews.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-sm font-bold text-gray-700 hover:text-gray-900 bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-2 rounded-full hover:shadow-md transition-all duration-300 border border-white/60"
              >
                {user ? user.email?.split('@')[0] : 'Sign In'}
              </button>
            </div>
          </div>
        </header>

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero Section */}
          <div className="mb-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-1">
              Kochi welcomes you
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              where every lane has a story
            </p>
            <div className="h-1 w-16 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full mx-auto mt-3 shadow-lg"></div>
            <p className="text-gray-500 font-medium mt-2 italic text-sm">Explore the city we love</p>
          </div>

          {/* Dynamic Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
            {cardOrder.map((id) => (
              <DashboardCard
                key={id}
                id={id}
                title={cardConfig[id].title}
                icon={cardConfig[id].icon}
                colorTheme={cardConfig[id].theme}
                onInteract={() => handleInteraction(id)}
                className={id === 'weather' ? 'md:col-span-2 md:row-span-2 auto-rows-[340px]' : ''}
              >
                {cardRenderers[id]()}
              </DashboardCard>
            ))}
          </div>

          {/* Footer Section */}
          <div className="mt-16 pt-8 border-t border-white/30 text-center">
            <p className="text-sm text-gray-600 font-medium">
              ✨ Discover Kochi&apos;s soul — one experience at a time
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Made with 💙 for the people of Fort Kochi
            </p>
          </div>
        </main>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "DearKochi",
            "url": "https://dearkochi.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://dearkochi.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "description": "Your ultimate guide to Fort Kochi and Ernakulam. Local news, classifieds, and tourism.",
            "areaServed": {
              "@type": "City",
              "name": "Kochi",
              "sameAs": "https://en.wikipedia.org/wiki/Kochi"
            }
          })
        }}
      />
    </div>
  );
}