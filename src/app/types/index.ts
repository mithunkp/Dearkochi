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