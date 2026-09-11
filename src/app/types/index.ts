export interface LocalEvent {
  id: string;
  title: string;
  description: string;
  event_type: 'scheduled' | 'live';
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number | null;
  is_private: boolean;
  is_closed: boolean;
  creator_id: string;
  /** Derived from event_participants, not a column. */
  participant_count?: number;
  requires_approval: boolean;
  area: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  url: string;
  source: string;
  language: string;
  content: string;
}

export interface Attraction {
  name: string;
  description: string;
  type: string;
  icon: string;
}

export interface Transport {
  mode: string;
  details: string;
  icon: string;
}

export interface Contact {
  label: string;
  number: string;
}

export interface SocialPost {
  id: number;
  user: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
}



export interface Fact {
  value: string;
  label: string;
  color: string;
}

export interface Tab {
  id: string;
  label: string;
  icon: string;
}

export interface QuickLink {
  label: string;
  icon: string;
  url: string;
}