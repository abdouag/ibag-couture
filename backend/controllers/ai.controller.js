const cloudinary = require('../config/cloudinary');
const { AppError } = require('../middleware');
const {
  generateSecondaryImagesFromReference,
  analyzeProductImage,
  generateProductText,
} = require('../services/geminiImageGenerator');

// Log API key status at startup
console.log(`[AI] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'configuree' : 'ABSENTE'}`);

// Rate limiting: track requests per day
const dailyRequestLog = new Map(); // key: date string, value: count
const MAX_REQUESTS_PER_DAY = 50;

function checkRateLimit() {
  const today = new Date().toISOString().slice(0, 10);
  const count = dailyRequestLog.get(today) || 0;

  // Clean old entries
  for (const key of dailyRequestLog.keys()) {
    if (key !== today) dailyRequestLog.delete(key);
  }

  if (count >= MAX_REQUESTS_PER_DAY) {
    return false;
  }

  dailyRequestLog.set(today, count + 1);
  return true;
}

/**
 * Upload a base64 image buffer to Cloudinary
 */
async function uploadToCloudinary(imageBuffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ibag/products/ai',
        public_id: filename,
        format: 'png',
        transformation: [
          { width: 1024, height: 1536, crop: 'limit', quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(imageBuffer);
  });
}

/**
 * Build Cloudinary crop/zoom URLs from a reference image URL.
 * Returns [secondaryUrl, detailUrl] or null if the URL is not a valid Cloudinary URL.
 */
function buildCloudinaryCrops(referenceImageUrl) {
  const match = referenceImageUrl.match(
    /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*?)(?:\.[a-z]{3,4})?$/i
  );

  if (!match) return null;

  const cloudinaryBase = match[1];
  const pathAfterUpload = match[2];

  // Split path segments — transformation segments contain commas, folder/file segments don't
  const segments = pathAfterUpload.split('/');
  const publicIdSegments = segments.filter(seg => !seg.includes(','));
  const publicId = publicIdSegments.join('/');

  if (!publicId) return null;

  const secondaryUrl = `${cloudinaryBase}w_1024,h_1536,c_fill,g_auto,q_auto/${publicId}`;
  const detailUrl = `${cloudinaryBase}w_1024,h_1024,c_crop,g_center,z_2.0,q_auto/${publicId}`;

  return [secondaryUrl, detailUrl];
}

/**
 * @desc    Analyze a product image with Gemini Vision
 * @route   POST /api/admin/ai/analyze-image
 */
const analyzeImage = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return next(new AppError('Cle API Gemini non configuree. Ajoutez GEMINI_API_KEY dans les variables d\'environnement.', 500));
    }

    if (!checkRateLimit()) {
      return next(new AppError('Limite quotidienne de requetes IA atteinte (50/jour). Reessayez demain.', 429));
    }

    const { imageUrl } = req.body;

    if (!imageUrl) {
      return next(new AppError('L\'URL de l\'image est requise.', 400));
    }

    console.log(`[AI] Requete analyze-image: ${imageUrl}`);

    const analysis = await analyzeProductImage(imageUrl);

    res.status(200).json({
      success: true,
      message: 'Analyse terminee',
      data: analysis,
    });
  } catch (error) {
    console.error('[AI] Erreur analyse:', error.message);
    next(new AppError('Erreur lors de l\'analyse de l\'image. Reessayez.', 500));
  }
};

/**
 * @desc    Generer des suggestions produit via IA (texte + images)
 * @route   POST /api/admin/ai/generate-product
 */
const generateProduct = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return next(new AppError('Cle API Gemini non configuree. Ajoutez GEMINI_API_KEY dans les variables d\'environnement.', 500));
    }

    if (!checkRateLimit()) {
      return next(new AppError('Limite quotidienne de requetes IA atteinte (50/jour). Reessayez demain.', 429));
    }

    const { name, category, basePrice, isCustomAvailable, generateImages, referenceImageUrl, imageAnalysis } = req.body;

    if (!category) {
      return next(new AppError('La categorie est requise pour generer des suggestions.', 400));
    }

    const categoryLabels = {
      homme: 'Homme',
      femme: 'Femme',
      traditionnel: 'Traditionnel',
      moderne: 'Moderne',
    };

    const typeLabel = isCustomAvailable ? 'sur-mesure' : 'pret-a-porter';
    const catLabel = categoryLabels[category] || category;

    console.log(`[AI] Requete generate-product - categorie: ${category}, type: ${typeLabel}, nom: ${name || 'non fourni'}, images: ${generateImages ? 'oui' : 'non'}, reference: ${referenceImageUrl ? 'oui' : 'non'}, analysis: ${imageAnalysis ? 'oui' : 'non'}`);

    // Step 1: Generate text content using Gemini
    const textResult = await generateProductText({
      category,
      isCustomAvailable,
      name,
      basePrice,
      imageAnalysis: imageAnalysis || null,
    });

    console.log(`[AI] Texte OK - nom suggere: "${textResult.name}"`);

    const responseData = {
      name: textResult.name || '',
      description: textResult.description || '',
      imageSuggestion: textResult.imageSuggestion || '',
      tags: textResult.tags || [],
      images: [],
      provider: null,
    };

    // Step 2: Generate images if requested
    if (generateImages) {
      const productName = textResult.name || name || `vetement ${catLabel}`;

      if (referenceImageUrl) {
        // ── Reference-based image generation ──
        if (process.env.GEMINI_API_KEY) {
          console.log(`[AI][GEMINI] Generation via Gemini depuis: ${referenceImageUrl}`);

          try {
            const geminiResult = await generateSecondaryImagesFromReference({
              referenceImageUrl,
              productName,
              category: catLabel,
            });

            responseData.images = geminiResult.images;
            responseData.referenceUsed = true;
            responseData.provider = geminiResult.provider;
            console.log(`[AI][GEMINI] success - ${geminiResult.images.length} images Gemini generees`);
          } catch (geminiErr) {
            console.error(`[AI][GEMINI] failure - ${geminiErr.message}`);
            console.log('[AI] Fallback vers Cloudinary crop/zoom...');

            const cloudinaryImages = buildCloudinaryCrops(referenceImageUrl);
            if (cloudinaryImages) {
              responseData.images = cloudinaryImages;
              responseData.referenceUsed = true;
              responseData.provider = 'cloudinary';
              console.log('[AI] 2 variantes Cloudinary creees (fallback)');
            } else {
              console.error('[AI] URL Cloudinary invalide, aucune image de secours');
            }
          }
        } else {
          // Fallback: Cloudinary crop/zoom (no AI)
          console.log(`[AI] GEMINI_API_KEY absente. Fallback Cloudinary crop/zoom depuis: ${referenceImageUrl}`);

          const cloudinaryImages = buildCloudinaryCrops(referenceImageUrl);
          if (cloudinaryImages) {
            responseData.images = cloudinaryImages;
            responseData.referenceUsed = true;
            responseData.provider = 'cloudinary';
            console.log('[AI] 2 variantes Cloudinary creees (crop + detail)');
          } else {
            console.error('[AI] URL Cloudinary invalide:', referenceImageUrl);
            return next(new AppError('L\'image de reference doit etre une URL Cloudinary valide.', 400));
          }
        }
      }
      // Note: free generation (without reference) removed — Gemini image generation requires a reference image
    }

    res.status(200).json({
      success: true,
      message: 'Suggestions generees avec succes',
      data: responseData,
    });
  } catch (error) {
    console.error('[AI] Erreur:', error.message);

    if (error?.status === 429) {
      return next(new AppError('Limite de requetes Gemini atteinte. Reessayez plus tard.', 429));
    }
    if (error?.status === 500 || error?.status === 503) {
      return next(new AppError('Service Gemini temporairement indisponible. Reessayez.', 503));
    }

    next(new AppError('Erreur lors de la generation IA. Reessayez.', 500));
  }
};

module.exports = {
  generateProduct,
  analyzeImage,
};
