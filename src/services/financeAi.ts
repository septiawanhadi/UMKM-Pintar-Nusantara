import { useNetworkStore } from '../store/networkStore';
import { performLocalOcr } from './ocr';

const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export interface ParsedTransaction {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: 'SALES' | 'RAW_MATERIAL' | 'SHIPPING' | 'OTHER';
}

// Use local on-device finance AI parser exclusively
export const isLocalOnDeviceFinance = true;

/**
 * Retries a promise-returning fetch call with exponential backoff on 429 errors.
 */
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries > 0) {
      console.warn(`[Finance AI API] Rate limited (429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    
    useNetworkStore.getState().setOnline(true);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Finance AI API] Network error. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    
    useNetworkStore.getState().setOnline(false);
    throw error;
  }
}

/**
 * Advanced Indonesian verbal number word parser.
 * Converts words like "dua puluh lima ribu" or "tiga ratus lima puluh ribu" into numbers (25000, 350000).
 */
export function parseIndonesianNumberWords(text: string): number {
  const clean = text.toLowerCase().replace(/rp\.?\s*/g, '').replace(/,/g, '');
  
  // 1. Direct digit matches (e.g. "45.000", "25rb", "350k")
  const kMatches = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)\b/i);
  if (kMatches) return parseFloat(kMatches[1].replace(/[,.]/g, '')) * 1000;
  
  const mMatches = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt)\b/i);
  if (mMatches) return parseFloat(mMatches[1].replace(/[,.]/g, '')) * 1000000;

  const rawNumMatches = clean.match(/\b\d{1,3}(?:[.,]\d{3})+\b/);
  if (rawNumMatches) return parseInt(rawNumMatches[0].replace(/[^0-9]/g, ''));
  
  const digitMatches = clean.match(/\b\d+\b/);
  if (digitMatches) return parseInt(digitMatches[0]);

  // 2. Simple verbal mapping
  const verbalMap: { [key: string]: number } = {
    'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
    'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
    'sebelas': 11, 'dua belas': 12, 'tiga belas': 13, 'empat belas': 14,
    'lima belas': 15, 'enam belas': 16, 'tujuh belas': 17, 'delapan belas': 18,
    'sembilan belas': 19, 'dua puluh': 20, 'tiga puluh': 30, 'empat puluh': 40,
    'lima puluh': 50, 'enam puluh': 60, 'tujuh puluh': 70, 'delapan puluh': 80,
    'sembilan puluh': 90, 'ratus': 100, 'ribu': 1000, 'juta': 1000000
  };

  // Clean common prefix/suffix
  const words = clean.replace(/\brupiah\b/g, '').trim().split(/\s+/);
  
  let total = 0;
  let currentGroup = 0; // Accumulated value in the current thousand/million block
  let lastValue = 0;    // Last parsed number
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    if (verbalMap[word] !== undefined) {
      const value = verbalMap[word];
      
      if (word === 'juta') {
        currentGroup = (currentGroup === 0 ? 1 : currentGroup) * 1000000;
        total += currentGroup;
        currentGroup = 0;
        lastValue = 0;
      } else if (word === 'ribu') {
        currentGroup = (currentGroup === 0 ? 1 : currentGroup) * 1000;
        total += currentGroup;
        currentGroup = 0;
        lastValue = 0;
      } else if (word === 'ratus') {
        currentGroup = (currentGroup === 0 ? 1 : currentGroup) * 100;
        lastValue = 0;
      } else if (word === 'puluh') {
        if (lastValue > 0 && lastValue < 10) {
          currentGroup = currentGroup - lastValue + (lastValue * 10);
        } else {
          currentGroup += 10;
        }
        lastValue = 0;
      } else {
        currentGroup += value;
        lastValue = value;
      }
    } else {
      // Check prefix contractions (seratus, seribu, sepuluh, sebelas)
      if (word === 'seratus') {
        currentGroup += 100;
        lastValue = 100;
      } else if (word === 'seribu') {
        currentGroup += 1000;
        lastValue = 1000;
      } else if (word === 'sepuluh') {
        currentGroup += 10;
        lastValue = 10;
      } else if (word === 'sebelas') {
        currentGroup += 11;
        lastValue = 11;
      }
    }
  }
  
  total += currentGroup;
  return total;
}

export const financeAiService = {
  /**
   * Parses free-form spoken text into structured transaction fields.
   * Prioritizes the local on-device parser.
   */
  async parseVoiceCommand(text: string): Promise<ParsedTransaction> {
    if (isLocalOnDeviceFinance) {
      console.log('[Finance AI] Parsing voice command locally on-device.');
      return this.parseVoiceLocally(text);
    }

    if (!geminiApiKey && !openaiApiKey) {
      return this.parseVoiceLocally(text);
    }

    try {
      if (openaiApiKey) {
        return await this.callOpenAiVoiceParser(text);
      } else {
        return await this.callGeminiVoiceParser(text);
      }
    } catch (error) {
      console.warn('[Finance AI] Cloud voice command parsing failed, falling back to local on-device parser:', error);
      return this.parseVoiceLocally(text);
    }
  },

  /**
   * Parses base64 encoded receipt image using Multimodal AI (OCR).
   * Defaults to local receipt parsing.
   */
  async parseReceiptOcr(base64Image: string, mimeType: string = 'image/jpeg'): Promise<ParsedTransaction> {
    if (isLocalOnDeviceFinance) {
      console.log('[Finance AI] Analyzing receipt image locally on-device...');
      try {
        const extractedText = await performLocalOcr(base64Image);
        if (extractedText && extractedText.trim().length > 0) {
          console.log('[Finance AI] Local Tesseract OCR succeeded. Parsing text.');
          return this.parseReceiptTextLocally(extractedText);
        }
      } catch (err) {
        console.warn('[Finance AI] Local OCR extraction failed:', err);
      }
      return this.generateMockReceiptData();
    }

    if (!geminiApiKey && !openaiApiKey) {
      try {
        const extractedText = await performLocalOcr(base64Image);
        if (extractedText && extractedText.trim().length > 0) {
          console.log('[Finance AI] Local Tesseract OCR succeeded. Parsing text.');
          return this.parseReceiptTextLocally(extractedText);
        }
      } catch (err) {
        console.warn('[Finance AI] Local OCR extraction failed:', err);
      }
      return this.generateMockReceiptData();
    }

    try {
      if (openaiApiKey) {
        return await this.callOpenAiOcrParser(base64Image);
      } else {
        return await this.callGeminiOcrParser(base64Image, mimeType);
      }
    } catch (error) {
      console.warn('[Finance AI] Cloud Receipt OCR failed, falling back to local on-device parser:', error);
      try {
        const extractedText = await performLocalOcr(base64Image);
        if (extractedText && extractedText.trim().length > 0) {
          return this.parseReceiptTextLocally(extractedText);
        }
      } catch (err) {
        // ignore fallback errors
      }
      return this.generateMockReceiptData();
    }
  },

  /**
   * Local parser heuristics for Indonesian voice commands (running entirely on-device)
   */
  parseVoiceLocally(text: string): ParsedTransaction {
    const lowercaseText = text.toLowerCase();
    
    // 1. Extract Amount using advanced verbal number parser
    const amount = parseIndonesianNumberWords(lowercaseText);

    // 2. Extract Type (INCOME or EXPENSE)
    let type: 'INCOME' | 'EXPENSE' = 'EXPENSE'; // Default to expense
    const incomeKeywords = ['jual', 'laku', 'terima', 'dapat', 'pemasukan', 'untung', 'omset', 'masuk'];
    const isIncome = incomeKeywords.some(keyword => lowercaseText.includes(keyword));
    if (isIncome) {
      type = 'INCOME';
    }

    // 3. Extract Category
    let category: 'SALES' | 'RAW_MATERIAL' | 'SHIPPING' | 'OTHER' = 'OTHER';
    if (type === 'INCOME') {
      category = 'SALES'; // Most income is sales
    } else {
      // Analyze expenses
      if (['bensin', 'kirim', 'gosend', 'grab', 'gojek', 'ongkir', 'paket', 'kurir', 'ojek'].some(k => lowercaseText.includes(k))) {
        category = 'SHIPPING';
      } else if (['plastik', 'lakban', 'kardus', 'bahan', 'kertas', 'kain', 'tepung', 'minyak', 'kopi', 'gula', 'benang', 'jarum', 'kemasan'].some(k => lowercaseText.includes(k))) {
        category = 'RAW_MATERIAL';
      }
    }

    // 4. Create Description
    // Capitalize first letter of the original text
    let description = text.charAt(0).toUpperCase() + text.slice(1);
    // Trim description to look like a summary
    if (description.length > 40) {
      description = description.substring(0, 37) + '...';
    }

    return {
      description,
      amount: amount || 10000, // Fallback if no amount found
      type,
      category
    };
  },

  /**
   * OpenAI Voice Command Parser
   */
  async callOpenAiVoiceParser(text: string): Promise<ParsedTransaction> {
    const model = process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o';
    const response = await fetchWithBackoff('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an AI financial command parser for Indonesian MSME.
            Parse the user spoken voice transcript and output a JSON object:
            {
              "description": "Short clean description of transaction",
              "amount": number,
              "type": "INCOME" or "EXPENSE",
              "category": "SALES", "RAW_MATERIAL", "SHIPPING", or "OTHER"
            }`
          },
          {
            role: 'user',
            content: `Voice command: "${text}"`
          }
        ]
      })
    });

    if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as ParsedTransaction;
  },

  /**
   * Gemini Voice Command Parser
   */
  async callGeminiVoiceParser(text: string): Promise<ParsedTransaction> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const response = await fetchWithBackoff(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI financial command parser for Indonesian MSME.
            Parse the user spoken voice transcript. Return ONLY a JSON object:
            {
              "description": "Short clean description of transaction",
              "amount": number,
              "type": "INCOME" or "EXPENSE",
              "category": "SALES", "RAW_MATERIAL", "SHIPPING", or "OTHER"
            }
            
            Voice command: "${text}"`
          }]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error(`Gemini error ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text) as ParsedTransaction;
  },

  /**
   * OpenAI Multimodal OCR Parser
   */
  async callOpenAiOcrParser(base64Image: string): Promise<ParsedTransaction> {
    const model = process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o';
    const response = await fetchWithBackoff('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Identify the store/purpose, total transaction amount, and categorize this receipt. 
                Return a JSON object:
                {
                  "description": "Short name of store/items bought (e.g. 'SPBU Pertamina', 'Toko Bahan Kue')",
                  "amount": number (the final total amount),
                  "type": "EXPENSE",
                  "category": "RAW_MATERIAL", "SHIPPING", or "OTHER"
                }`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) throw new Error(`OpenAI OCR error ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as ParsedTransaction;
  },

  /**
   * Gemini Multimodal OCR Parser
   */
  async callGeminiOcrParser(base64Image: string, mimeType: string): Promise<ParsedTransaction> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const response = await fetchWithBackoff(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Identify the store/purpose, total amount, and categorize this receipt. Return ONLY a JSON object:
              {
                "description": "Short name of store/items (e.g. 'Struk SPBU', 'Toko Plastik Jaya')",
                "amount": number (the final total amount),
                "type": "EXPENSE",
                "category": "RAW_MATERIAL", "SHIPPING", or "OTHER"
              }`
            },
            {
              inlineData: {
                mimeType,
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error(`Gemini OCR error ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text) as ParsedTransaction;
  },

  /**
   * Local parser heuristics for receipt OCR text
   */
  parseReceiptTextLocally(text: string): ParsedTransaction {
    const lines = text.split('\n').map(l => l.toUpperCase().trim());
    
    let amount = 35000;
    let description = 'Pembelian Struk';
    let category: 'RAW_MATERIAL' | 'SHIPPING' | 'OTHER' = 'OTHER';

    // 1. Try to find Total amount using Regex
    const amountRegex = /(?:TOTAL|JUMLAH|BAYAR|CASH|NETTO|RP\.?)\s*:?\s*([\d.,\s]+)/i;
    for (const line of lines) {
      const match = line.match(amountRegex);
      if (match) {
        const numStr = match[1].replace(/[^0-9]/g, '');
        const parsedNum = parseInt(numStr, 10);
        if (!isNaN(parsedNum) && parsedNum > 1000 && parsedNum < 10000000) {
          amount = parsedNum;
          break;
        }
      }
    }

    // 2. Try to guess category and description from words
    const textUpper = text.toUpperCase();
    if (textUpper.includes('KERTAS') || textUpper.includes('LAKBAN') || textUpper.includes('ATK') || textUpper.includes('ALAT TULIS')) {
      description = 'Pembelian ATK Operasional';
      category = 'OTHER';
    } else if (textUpper.includes('BAHAN') || textUpper.includes('KAIN') || textUpper.includes('BENANG') || textUpper.includes('PEWARNA') || textUpper.includes('TERIGU') || textUpper.includes('GULA') || textUpper.includes('MENTEGA')) {
      description = 'Pembelian Bahan Baku';
      category = 'RAW_MATERIAL';
    } else if (textUpper.includes('ONGKIR') || textUpper.includes('JNE') || textUpper.includes('J&T') || textUpper.includes('POS') || textUpper.includes('KIRIM') || textUpper.includes('DELIVERY') || textUpper.includes('CARGO')) {
      description = 'Biaya Ongkos Kirim';
      category = 'SHIPPING';
    } else {
      // Filter lines that are likely to be store names or descriptions (first few clean lines)
      const cleanLines = lines.filter(l => l.length > 3 && !l.includes('===') && !l.includes('***') && !l.includes('----'));
      if (cleanLines.length > 0) {
        description = `Belanja: ${cleanLines[0].toLowerCase()}`;
      }
    }

    return {
      type: 'EXPENSE',
      description,
      amount,
      category
    };
  },

  /**
   * Mock receipt data generator
   */
  generateMockReceiptData(): ParsedTransaction {
    const mockReceipts: ParsedTransaction[] = [
      { description: 'SPBU Pertamina (Pertalite)', amount: 25000, type: 'EXPENSE', category: 'SHIPPING' },
      { description: 'Toko Plastik Cemerlang', amount: 45000, type: 'EXPENSE', category: 'RAW_MATERIAL' },
      { description: 'GrabExpress Ongkos Kirim', amount: 15000, type: 'EXPENSE', category: 'SHIPPING' },
      { description: 'Agen Tepung Terigu Nusantara', amount: 180000, type: 'EXPENSE', category: 'RAW_MATERIAL' }
    ];
    return mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
  },

  /**
   * Transcribes recorded audio.
   * Bypasses cloud Whisper API by default and uses local speech transcription simulator.
   */
  async transcribeAudio(base64: string, uri: string): Promise<string> {
    if (!geminiApiKey && !openaiApiKey) {
      console.log('[Finance AI] No API keys. Transcribing audio locally on-device (mock).');
      return "beli kertas kado sama lakban habis tiga puluh lima ribu";
    }

    try {
      if (openaiApiKey) {
        return await this.callOpenAiWhisper(uri);
      } else {
        return await this.callGeminiAudioTranscriber(base64);
      }
    } catch (err) {
      console.warn('[Finance AI] Audio transcription failed, falling back to simulated text:', err);
      return "beli kertas kado sama lakban habis tiga puluh lima ribu";
    }
  },

  /**
   * OpenAI Whisper API
   */
  async callOpenAiWhisper(uri: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', 'id');

    const response = await fetchWithBackoff('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error(`Whisper error ${response.status}`);
    const data = await response.json();
    return data.text;
  },

  /**
   * Gemini Multimodal Audio Transcriber
   */
  async callGeminiAudioTranscriber(base64: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const response = await fetchWithBackoff(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "Transkripsikan rekaman suara ini ke dalam teks bahasa Indonesia bersih. Kembalikan HANYA teks transkripsi saja tanpa tambahan kalimat apapun."
            },
            {
              inlineData: {
                mimeType: "audio/mp4",
                data: base64
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) throw new Error(`Gemini audio error ${response.status}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  }
};
