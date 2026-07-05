import { useNetworkStore } from '../store/networkStore';

export interface GeneratedContent {
  captions: {
    id: string;
    text: string;
    style: 'PERSUASIVE' | 'CASUAL' | 'EDUCATIONAL';
  }[];
  hashtags: string[];
  marketplaceDescription: string;
}

const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Use local on-device AI engine exclusively
export const isLocalOnDeviceAi = true;

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
      console.warn(`[AI API] Rate limited (429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    
    useNetworkStore.getState().setOnline(true);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[AI API] Network error. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    
    useNetworkStore.getState().setOnline(false);
    throw error;
  }
}

export type ProductCategory = 'FASHION' | 'KULINER' | 'KECANTIKAN' | 'ELEKTRONIK' | 'UMUM';

/**
 * Detects the product category based on name and description to customize local AI generation.
 */
const detectCategory = (name: string, desc: string): ProductCategory => {
  const text = `${name} ${desc}`.toLowerCase();
  if (/\b(baju|kaos|hijab|mukena|gamis|batik|celana|rok|sepatu|sandal|jaket|topi|tas|fashion|clothing|kain|kebaya|jersey|daster)\b/.test(text)) {
    return 'FASHION';
  }
  if (/\b(makan|minum|kopi|teh|snack|keripik|roti|kue|cemilan|pedas|manis|gurih|keju|cokelat|kuliner|warung|resep|bumbu|sambal|kripik|bakso|mie|nasi)\b/.test(text)) {
    return 'KULINER';
  }
  if (/\b(skincare|kosmetik|sabun|shampoo|parfum|wajah|kulit|cantik|glowing|lipstik|body|lotion|serum|creme|cream|masker)\b/.test(text)) {
    return 'KECANTIKAN';
  }
  if (/\b(hp|laptop|komputer|tv|kabel|casan|charger|headphone|earphone|gadget|elektronik|speaker|powerbank|mouse)\b/.test(text)) {
    return 'ELEKTRONIK';
  }
  return 'UMUM';
};

export const aiService = {
  /**
   * Generates captions (Persuasive, Casual, Educational), hashtags, and a marketplace description.
   * Prioritizes the local on-device NLP engine.
   */
  async generateMarketingContent(name: string, description: string, forceCategory?: ProductCategory, subCategory?: string): Promise<GeneratedContent> {
    // Simulate natural processing delay for the local on-device model (e.g. Gemini Nano simulation)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (isLocalOnDeviceAi) {
      console.log('[AI] Using local on-device AI engine for generation.');
      return this.generateContentLocally(name, description, forceCategory, subCategory);
    }

    try {
      if (openaiApiKey) {
        return await this.callOpenAiApi(name, description);
      } else if (geminiApiKey) {
        return await this.callGeminiApi(name, description);
      } else {
        return this.generateContentLocally(name, description, forceCategory, subCategory);
      }
    } catch (error) {
      console.warn('[AI] Cloud API failed, falling back to local on-device AI engine:', error);
      return this.generateContentLocally(name, description, forceCategory, subCategory);
    }
  },

  /**
   * Calls OpenAI GPT API to generate marketing content
   */
  async callOpenAiApi(name: string, description: string): Promise<GeneratedContent> {
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
            content: `You are an expert copywriter for Indonesian MSMEs. Generate marketing content based on product details. 
            You must return a JSON object with the following schema:
            {
              "captions": [
                {"id": "c1", "text": "...", "style": "PERSUASIVE"},
                {"id": "c2", "text": "...", "style": "CASUAL"},
                {"id": "c3", "text": "...", "style": "EDUCATIONAL"}
              ],
              "hashtags": ["#tag1", "#tag2", ...],
              "marketplaceDescription": "..."
            }
            All texts must be written in fluent, engaging Indonesian.`
          },
          {
            role: 'user',
            content: `Product Name: ${name}\nDescription: ${description}`
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
    const resultText = data.choices[0].message.content;
    return JSON.parse(resultText) as GeneratedContent;
  },

  /**
   * Calls Gemini API to generate marketing content
   */
  async callGeminiApi(name: string, description: string): Promise<GeneratedContent> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const response = await fetchWithBackoff(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert copywriter for Indonesian MSMEs. Generate marketing content based on product details.
            Return ONLY a raw JSON object (do not wrap it in markdown codeblocks) with the exact schema:
            {
              "captions": [
                {"id": "c1", "text": "...", "style": "PERSUASIVE"},
                {"id": "c2", "text": "...", "style": "CASUAL"},
                {"id": "c3", "text": "...", "style": "EDUCATIONAL"}
              ],
              "hashtags": ["#tag1", "#tag2", ...],
              "marketplaceDescription": "..."
            }
            All texts must be in fluent, engaging Indonesian.
            
            Product Name: ${name}
            Description: ${description}`
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
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText) as GeneratedContent;
  },

  /**
   * Smart local copywriting engine running entirely on-device (offline-ready)
   */
  generateContentLocally(name: string, description: string, forceCategory?: ProductCategory, subCategory?: string): GeneratedContent {
    const cleanName = name.trim();
    const cleanDesc = description.trim() || 'kualitas terbaik dan terjamin untuk Anda';
    const keyword = cleanName.replace(/[^a-zA-Z0-9]/g, '');
    const category = forceCategory || detectCategory(cleanName, cleanDesc);
    const subType = subCategory ? subCategory.trim().toLowerCase() : '';
    const specificTypeLabel = subType ? ` ${subType}` : '';

    let persuasiveText = '';
    let casualText = '';
    let educationalText = '';

    switch (category) {
      case 'KULINER':
        persuasiveText = `🤤 LAPAR ATAU INGIN MENCARI${specificTypeLabel ? specificTypeLabel.toUpperCase() : ' CEMILAN LEZAT'}? 🤤\n\nNikmati kelezatan ${cleanName} sekarang! Dibuat dengan bahan pilihan berkualitas: ${cleanDesc}. Rasanya dijamin bikin ketagihan dan pas untuk dinikmati kapan saja. Yuk pesan sekarang sebelum kehabisan! Hubungi admin atau klik link di bio kami! 🍽️✨`;
        casualText = `Hai foodies! Ada ${subType || 'camilan/minuman'} baru nih buat kamu: ${cleanName} 😍\n\nCocok banget buat nemenin waktu santai kamu atau pas lagi kerja karena ${cleanDesc}. Rasanya mantap, harganya juga bersahabat banget! Yuk buruan pesan sekarang biar hari kamu makin seru! 🥳🍕`;
        educationalText = `💡 TAHUKAH KAMU? 💡\n\nMemilih ${subType || 'makanan ringan'} yang lezat sekaligus higienis itu penting lho. ${cleanName} diolah secara bersih menggunakan resep khas Nusantara sehingga ${cleanDesc}. Selain rasanya yang nikmat, ${subType || 'camilan'} ini juga bebas pengawet berbahaya. Pilihan cerdas untuk keluarga pintar! 🇮🇩🌱`;
        break;

      case 'FASHION':
        persuasiveText = `✨ UPGRADE GAYA KAMU HARI INI! ✨\n\nDapatkan koleksi${specificTypeLabel} ${cleanName} eksklusif dengan kenyamanan maksimal! Dirancang khusus dengan spesifikasi: ${cleanDesc}. Stok sangat terbatas, miliki sekarang dan tampil percaya diri di setiap momen! Chat admin kami sekarang untuk pemesanan! 🛍️💃`;
        casualText = `Hai Kak! Tampil trendi pakai ${subType || 'outfit'} kece gak perlu mahal lho. Kenalin nih ${cleanName} dari koleksi terbaru kami 😍\n\nBahannya adem, potongannya pas, dan pastinya ${cleanDesc}. Cocok buat gaya kasual maupun acara formal. Yuk langsung check out sebelum kehabisan ukuran kamu! 🥳👕`;
        educationalText = `💡 TIPS FASHION TERBARU 💡\n\nTahukah kamu kalau bahan ${subType || 'pakaian'} menentukan kenyamanan aktivitasmu seharian? ${cleanName} terbuat dari bahan pilihan berkualitas tinggi sehingga ${cleanDesc}. Produk ini awet dan warnanya tidak mudah pudar. Investasi fashion lokal yang wajib ada di lemarimu! 🇮🇩👔`;
        break;

      case 'KECANTIKAN':
        persuasiveText = `✨ RAHASIA PENAMPILAN SEMPURNA! ✨\n\nWujudkan impianmu dengan ${subType || 'produk'} ${cleanName}! Mengandung formula terbaik untuk ${cleanDesc}. Hasil nyata, aman BPOM, dan cocok untuk perawatan rutin. Dapatkan promo bundling spesial hari ini saja! Hubungi admin atau klik link bio! 🌸💖`;
        casualText = `Hai Bestie! Waktunya manjakan diri kamu dengan ${subType || 'perawatan'} ${cleanName} terbaru dari kami 😍\n\nPraktis digunakan dan bermanfaat banget karena ${cleanDesc}. Bikin kamu segar seharian dan makin percaya diri. Yuk cobain sekarang dan rasakan perbedaannya! 🥳💄`;
        educationalText = `💡 EDUKASI PRODUK KECANTIKAN 💡\n\nMenjaga penampilan membutuhkan ${subType || 'perawatan'} yang konsisten dengan kandungan yang tepat. ${cleanName} diformulasikan khusus sehingga ${cleanDesc}. Bebas bahan kimia berbahaya, menjadikannya pilihan aman untuk jangka panjang. Yuk sayangi dirimu dari sekarang! 🌸🌿`;
        break;

      case 'ELEKTRONIK':
        persuasiveText = `⚡ TEKNOLOGI TERBARU UNTUK KEMUDAHAN ANDA! ⚡\n\nDapatkan ${subType || 'perangkat'} ${cleanName} dengan performa terbaik dan garansi resmi! Keunggulan utama: ${cleanDesc}. Memudahkan semua pekerjaan dan kebutuhan harian Anda. Jangan lewatkan harga promo peluncuran hari ini! Pesan sekarang! 📱🔌`;
        casualText = `Halo Sobat Gadget! Hari gini masih pakai perangkat lama? Yuk beralih ke ${subType || 'gadget'} ${cleanName} terbaru ini 😎\n\nDesainnya super kece, praktis, dan pastinya ${cleanDesc}. Bikin aktivitas harian kamu makin cepat dan produktif. Stok promo terbatas, yuk langsung di-order sekarang! 🥳💻`;
        educationalText = `💡 TIPS TEKNOLOGI PINTAR 💡\n\nMenggunakan ${subType || 'perangkat elektronik'} berkualitas tidak hanya mempermudah pekerjaan, tapi juga tahan lama. ${cleanName} dirancang dengan spesifikasi canggih sehingga ${cleanDesc}. Pilihan pintar untuk gaya hidup modern yang ramah lingkungan! ⚡🌱`;
        break;

      case 'UMUM':
      default:
        persuasiveText = `🔥 SOLUSI TERBAIK UNTUK ANDA! 🔥\n\nIngin memiliki ${subType || 'produk'} ${cleanName} berkualitas premium? Produk ini dirancang khusus dengan keunggulan: ${cleanDesc}. Jangan sampai kehabisan, dapatkan sekarang juga sebelum promo minggu ini berakhir! Hubungi admin kami atau klik link di bio ya! 🛒✨`;
        casualText = `Hai Kak! Ada yang baru nih, kenalan dulu sama ${subType || 'produk'} ${cleanName} 😍\n\nCocok banget buat nemenin hari-hari kamu karena produk ini ${cleanDesc}. Kualitas oke, desainnya kekinian, pokoknya wajib punya deh! Yuk kepoin sekarang dan langsung check out ya, stok terbatas! 🥳🙌`;
        educationalText = `💡 TAHUKAH ANDA? 💡\n\nBanyak orang mencari ${subType || 'produk'} berkualitas tinggi tapi bingung memilih. ${cleanName} hadir untuk menjawab kebutuhan Anda karena ${cleanDesc}. Dengan standar terbaik, produk ini menjadi pilihan yang cerdas dan ramah kantong. Yuk dukung produk lokal berkualitas! 🇮🇩🌱`;
        break;
    }

    return {
      captions: [
        { id: 'local-cap-1', style: 'PERSUASIVE', text: persuasiveText },
        { id: 'local-cap-2', style: 'CASUAL', text: casualText },
        { id: 'local-cap-3', style: 'EDUCATIONAL', text: educationalText }
      ],
      hashtags: [
        `#${keyword}`,
        `#Jual${keyword}`,
        `#UMKMPintar`,
        `#NusantaraJualan`,
        `#ProdukLokal`,
        `#BisnisUMKM`,
        `#BelanjaLokal`,
        `#AILokal`
      ],
      marketplaceDescription: `Spesifikasi Produk:\n- Nama: ${cleanName}\n- Deskripsi Utama: ${cleanDesc}\n- Keunggulan: Dibuat dari bahan pilihan berkualitas tinggi, awet, dan ramah lingkungan.\n\nKenapa Belanja di Toko Kami?\n1. Respon Cepat & Ramah\n2. Garansi Produk Original\n3. Pengemasan Aman\n4. Mendukung Gerakan UMKM Lokal\n\nCatatan: Harap tanyakan stok sebelum memesan. Selamat berbelanja!`
    };
  }
};
