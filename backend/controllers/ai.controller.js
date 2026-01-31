const OpenAI = require('openai');
const cloudinary = require('../config/cloudinary');
const { AppError } = require('../middleware');
const { generateSecondaryImagesFromReference } = require('../services/geminiImageGenerator');

// Log API key status at startup
console.log(`[AI] OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'configuree' : 'ABSENTE'}`);
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
 * @desc    Generer des suggestions produit via IA (texte + images)
 * @route   POST /api/admin/ai/generate-product
 */
const generateProduct = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return next(new AppError('Cle API OpenAI non configuree. Ajoutez OPENAI_API_KEY dans les variables d\'environnement.', 500));
    }

    if (!checkRateLimit()) {
      return next(new AppError('Limite quotidienne de requetes IA atteinte (50/jour). Reessayez demain.', 429));
    }

    const { name, category, basePrice, isCustomAvailable, generateImages, referenceImageUrl } = req.body;

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
    const priceInfo = basePrice ? `Prix de base: ${basePrice} FCFA.` : '';
    const nameInfo = name ? `Nom actuel: "${name}".` : '';

    const textPrompt = `Tu es le directeur artistique d'Ibag Couture, une maison de couture africaine haut de gamme specialisee dans le sur-mesure et l'artisanat textile.

Genere une fiche produit professionnelle pour un vetement avec ces caracteristiques:
- Categorie: ${catLabel}
- Type: ${typeLabel}
${nameInfo}
${priceInfo}

Reponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "name": "Nom du produit elegant et professionnel (max 80 caracteres)",
  "description": "Description haut de gamme du produit (150-300 mots). Mets en valeur le savoir-faire artisanal, les details de confection, le confort et l'elegance. Ton professionnel, francais soigne. Adapte au marche africain haut de gamme. Ne jamais inventer de matiere non fournie. Oriente sur-mesure et artisanat.",
  "imageSuggestion": "Description detaillee pour une photo professionnelle du produit: type de studio, eclairage, mannequin, pose, mise en scene du tissu, ambiance generale (50-100 mots)"
}

Regles:
- Francais elegant, pas de familiarite
- Ton maison de couture haut de gamme
- Ne pas inventer de matieres ou tissus specifiques sauf si mentionnes
- Mettre en avant l'artisanat et le savoir-faire
- La description doit donner envie tout en restant professionnelle`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log(`[AI] Requete generate-product - categorie: ${category}, type: ${typeLabel}, nom: ${name || 'non fourni'}, images: ${generateImages ? 'oui' : 'non'}, reference: ${referenceImageUrl ? 'oui' : 'non'}`);

    // Step 1: Generate text content
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: textPrompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return next(new AppError('Reponse IA vide. Reessayez.', 500));
    }

    let textResult;
    try {
      textResult = JSON.parse(content);
    } catch {
      console.error('[AI] Erreur parsing JSON:', content);
      return next(new AppError('Format de reponse IA invalide. Reessayez.', 500));
    }

    console.log(`[AI] Texte OK - nom suggere: "${textResult.name}"`);

    const responseData = {
      name: textResult.name || '',
      description: textResult.description || '',
      imageSuggestion: textResult.imageSuggestion || '',
      images: [],
      provider: null,
    };

    // Step 2: Generate images if requested
    if (generateImages) {
      const productName = textResult.name || name || `vetement ${catLabel}`;
      const timestamp = Date.now();
      const slug = (textResult.name || name || category)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);

      const labels = ['principale', 'secondaire', 'detail'];

      if (referenceImageUrl) {
        // ── Reference-based image generation ──
        // The admin's original image stays as mainImage (never replaced).
        // Strategy: Try Gemini AI first, fallback to Cloudinary crop/zoom.

        if (process.env.GEMINI_API_KEY) {
          // ── Primary: Gemini image-to-image generation ──
          // LIMITATION: Gemini regenerates pixels. It cannot guarantee
          // pixel-level fidelity to the reference. Results may vary.
          console.log(`[AI][GEMINI] Generation via Gemini depuis: ${referenceImageUrl}`);

          try {
            const geminiResult = await generateSecondaryImagesFromReference({
              referenceImageUrl,
              productName: textResult.name || name || `vetement ${catLabel}`,
              category: catLabel,
            });

            responseData.images = geminiResult.images;
            responseData.referenceUsed = true;
            responseData.provider = geminiResult.provider;
            console.log(`[AI][GEMINI] success - ${geminiResult.images.length} images Gemini generees`);
          } catch (geminiErr) {
            // Gemini failed — fallback to Cloudinary crop/zoom
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
          // ── Fallback: Cloudinary crop/zoom (no AI) ──
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

      } else {
        // ── Free generation: text-only prompts ──
        console.log('[AI] Generation de 3 images (libre, sans reference)...');

        const fullBodyRules = 'Full body photo, head to toe visible, no cropping, no zoom, no close-up, centered framing, entire garment fully visible, feet included, realistic proportions.';
        const baseImagePrompt = `Professional fashion e-commerce photography of an elegant African haute couture garment: ${productName}. Category: ${catLabel}. Style: luxury African fashion house, artisanal craftsmanship, high-end African couture. Studio setting with neutral background, soft professional lighting. No text, no watermark, no logos.`;

        const imagePrompts = [
          `${baseImagePrompt} Front view on a model facing camera. ${fullBodyRules}`,
          `${baseImagePrompt} Three-quarter angle view on a model, slight turn showing movement and draping. ${fullBodyRules}`,
          `${baseImagePrompt} Close-up detail shot focusing on fabric texture, embroidery details, stitching craftsmanship, and material quality. Centered framing, no cropping. No text, no watermark.`,
        ];

        const imageResults = await Promise.allSettled(
          imagePrompts.map(async (prompt, index) => {
            console.log(`[AI] Generation image ${index + 1}/3 (${labels[index]})...`);

            const response = await openai.images.generate({
              model: 'gpt-image-1',
              prompt,
              n: 1,
              size: index === 2 ? '1024x1024' : '1024x1536',
            });

            const imageData = response.data[0]?.b64_json;
            if (!imageData) {
              throw new Error(`Pas de donnees image pour l'image ${index + 1}`);
            }

            const imageBuffer = Buffer.from(imageData, 'base64');
            const filename = `${slug}-${labels[index]}-${timestamp}`;

            console.log(`[AI] Upload Cloudinary image ${index + 1}...`);
            const url = await uploadToCloudinary(imageBuffer, filename);
            console.log(`[AI] Image ${index + 1} uploadee: ${url}`);

            return url;
          })
        );

        const successfulImages = [];
        for (const result of imageResults) {
          if (result.status === 'fulfilled') {
            successfulImages.push(result.value);
          } else {
            console.error('[AI] Erreur image:', result.reason?.message || result.reason);
          }
        }

        responseData.images = successfulImages;
        console.log(`[AI] ${successfulImages.length}/3 images generees avec succes`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Suggestions generees avec succes',
      data: responseData,
    });
  } catch (error) {
    console.error('[AI] Erreur:', error.message);

    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return next(new AppError('Cle API OpenAI invalide. Verifiez la configuration.', 500));
    }
    if (error?.status === 429) {
      return next(new AppError('Limite de requetes OpenAI atteinte. Reessayez plus tard.', 429));
    }
    if (error?.status === 500 || error?.status === 503) {
      return next(new AppError('Service OpenAI temporairement indisponible. Reessayez.', 503));
    }

    next(new AppError('Erreur lors de la generation IA. Reessayez.', 500));
  }
};

module.exports = {
  generateProduct,
};
