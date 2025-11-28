import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
    }

    // Detect source language
    const detectedLang = detectLanguage(text);

    // Try multiple free translation services
    const translatedText = await tryTranslationServices(text, detectedLang, targetLang);
    
    return NextResponse.json({
      translatedText: translatedText || text // Fallback to original text
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ translatedText: '' }, { status: 500 });
  }
}

async function tryTranslationServices(text: string, sourceLang: string, targetLang: string): Promise<string> {
  // Service 1: LibreTranslate
  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.translatedText) {
        return data.translatedText;
      }
    }
  } catch (err) {
    console.log('LibreTranslate failed', err);
  }

  // Service 2: MyMemory Translation
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (err) {
    console.log('MyMemory failed', err);
  }

  // Service 3: Google Translate (free unofficial API)
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        // data[0] is an array of translation chunks; coerce safely
        return data[0].map((item: unknown[]) => String(item[0] ?? '')).join(' ').trim();
      }
    }
  } catch (err) {
    console.log('Google Translate failed', err);
  }

  return ''; // Return empty string if all services fail
}

function detectLanguage(text: string): string {
  // Simple language detection based on character ranges
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
  if (/[\u0A80-\u0AFF]/.test(text)) return 'pa'; // Punjabi
  
  return 'en'; // Default to English
}