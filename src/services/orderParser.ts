import { useNetworkStore } from '../store/networkStore';
import { Product } from '../store/contentStore';

export interface ExtractedOrder {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  variant: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED';
}

const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Use local on-device order parser exclusively
export const isLocalOnDeviceParser = true;

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
      console.warn(`[Order Parser API] Rate limited (429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    
    useNetworkStore.getState().setOnline(true);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Order Parser API] Network error. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    
    useNetworkStore.getState().setOnline(false);
    throw error;
  }
}

export const orderParserService = {
  /**
   * Main entry point to extract structured order data from unstructured message text.
   * Prioritizes the local on-device parser engine.
   */
  async extractOrderFromText(text: string, availableProducts: Product[]): Promise<ExtractedOrder | null> {
    // Check if the message actually sounds like an order
    const lowercaseText = text.toLowerCase();
    const orderKeywords = ['beli', 'pesan', 'order', 'mau', 'ambil', 'checkout', 'bks', 'bungkus', 'buah', 'pcs', 'kirim', 'tambah'];
    const hasOrderKeyword = orderKeywords.some(keyword => lowercaseText.includes(keyword));
    
    // Check if there are numbers representing quantity
    const hasNumber = /\d+/.test(lowercaseText);

    if (!hasOrderKeyword && !hasNumber) {
      return null; // Not an order message
    }

    // Simulate short processing delay for the local on-device parser
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (isLocalOnDeviceParser) {
      console.log('[AI Parser] Using local on-device parser.');
      return this.parseLocally(text, availableProducts);
    }

    try {
      if (openaiApiKey) {
        return await this.callOpenAiParser(text, availableProducts);
      } else if (geminiApiKey) {
        return await this.callGeminiParser(text, availableProducts);
      } else {
        return this.parseLocally(text, availableProducts);
      }
    } catch (error) {
      console.warn('[AI Parser] Cloud API failed, falling back to local on-device parser:', error);
      return this.parseLocally(text, availableProducts);
    }
  },

  /**
   * OpenAI API Call for order parsing
   */
  async callOpenAiParser(text: string, availableProducts: Product[]): Promise<ExtractedOrder | null> {
    const productsJson = JSON.stringify(availableProducts.map(p => ({ id: p.id, name: p.name })));
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
            content: `You are an AI order parser for Indonesian MSME chats. Extract order details.
            Available products: ${productsJson}
            Return a JSON object:
            {
              "isOrder": true/false,
              "productId": "matched product id (or 'mock-prod-id' if not matched)",
              "productName": "matched product name (or extracted name)",
              "quantity": number (default 1),
              "variant": "extracted variant (e.g. 'Merah', 'L') or 'Standard'"
            }
            Only return isOrder = true if the text expresses clear intent to purchase.`
          },
          {
            role: 'user',
            content: `Chat text: "${text}"`
          }
        ]
      })
    });

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch (_) {}
      throw new Error(`OpenAI error ${response.status}: ${errMsg}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (!parsed.isOrder) return null;

    return {
      orderId: `ord-${Date.now()}`,
      productId: parsed.productId,
      productName: parsed.productName,
      quantity: parsed.quantity || 1,
      variant: parsed.variant || 'Standard',
      status: 'PENDING',
    };
  },

  /**
   * Gemini API Call for order parsing
   */
  async callGeminiParser(text: string, availableProducts: Product[]): Promise<ExtractedOrder | null> {
    const productsJson = JSON.stringify(availableProducts.map(p => ({ id: p.id, name: p.name })));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    
    const response = await fetchWithBackoff(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI order parser for Indonesian MSME chats. Extract order details.
            Available products: ${productsJson}
            Return ONLY a raw JSON object (do not wrap in codeblocks):
            {
              "isOrder": true/false,
              "productId": "matched product id (or 'mock-prod-id' if not matched)",
              "productName": "matched product name (or extracted name)",
              "quantity": number (default 1),
              "variant": "extracted variant (e.g. 'Merah', 'L') or 'Standard'"
            }
            Only set isOrder = true if clear intent to buy is expressed.
            
            Chat text: "${text}"`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        } else if (errJson?.[0]?.error?.message) {
          errMsg = errJson[0].error.message;
        }
      } catch (_) {}
      throw new Error(`Gemini error ${response.status}: ${errMsg}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);

    if (!parsed.isOrder) return null;

    return {
      orderId: `ord-${Date.now()}`,
      productId: parsed.productId,
      productName: parsed.productName,
      quantity: parsed.quantity || 1,
      variant: parsed.variant || 'Standard',
      status: 'PENDING',
    };
  },

  /**
   * Rule-based local parser in Indonesian (running on-device)
   */
  parseLocally(text: string, availableProducts: Product[]): ExtractedOrder | null {
    const lowercaseText = text.toLowerCase();

    // 1. Extract quantity
    // Matches patterns like "3x", "3 pcs", "beli 3", "order 3", "3 bungkus"
    let quantity = 1;
    const qtyRegex = /(?:(\d+)\s*(?:x|pcs|bks|bungkus|buah|unit|lembar|porsi|pasang|pasg))|(?:\b(?:beli|pesan|order|ambil|tambah)\s+(\d+)\b)/i;
    const match = lowercaseText.match(qtyRegex);
    if (match) {
      const parsedQty = parseInt(match[1] || match[2]);
      if (!isNaN(parsedQty)) {
        quantity = parsedQty;
      }
    }

    // 2. Extract variant
    // Look for common sizes and colors
    let variant = 'Standard';
    const sizeMatch = lowercaseText.match(/\b(s|m|l|xl|xxl)\b/i);
    const colorMatch = lowercaseText.match(/\b(merah|biru|kuning|hijau|hitam|putih|cokelat|abu-abu|pink|oranye)\b/i);
    
    if (sizeMatch && colorMatch) {
      variant = `${colorMatch[1].toUpperCase()} (${sizeMatch[1].toUpperCase()})`;
    } else if (sizeMatch) {
      variant = `Ukuran ${sizeMatch[1].toUpperCase()}`;
    } else if (colorMatch) {
      variant = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1);
    }

    // 3. Match product
    let matchedProduct: Product | undefined;
    
    for (const prod of availableProducts) {
      const prodNameWords = prod.name.toLowerCase().split(' ');
      // If the message contains any keyword from the product name (longer than 3 chars)
      const matches = prodNameWords.some(word => word.length > 3 && lowercaseText.includes(word));
      if (matches) {
        matchedProduct = prod;
        break;
      }
    }

    const productId = matchedProduct ? matchedProduct.id : 'mock-prod-id';
    const productName = matchedProduct ? matchedProduct.name : 'Baju Batik Nusantara';

    return {
      orderId: `ord-${Date.now()}`,
      productId,
      productName,
      quantity,
      variant,
      status: 'PENDING',
    };
  }
};
