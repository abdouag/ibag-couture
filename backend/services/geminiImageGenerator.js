const { GoogleGenAI } = require('@google/genai');
const cloudinary = require('../config/cloudinary');

/**
 * Upload a base64 image buffer to Cloudinary
 */
async function uploadToCloudinary(imageBuffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ibag/products/ai-gemini',
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
 * Generate 3 secondary images from a reference image using Google Gemini.
 *
 * Structure: 2 images "portees" (full human, front view) + 1 zoom detail couture.
 * The admin-uploaded image remains the main image and is NEVER replaced.
 *
 * Uses gemini-2.5-flash-image model with image-to-image generation.
 *
 * @param {Object} params
 * @param {string} params.referenceImageUrl - Cloudinary URL of the reference image
 * @param {string} params.productName - Product name for context
 * @param {string} params.category - Product category
 * @returns {Promise<{images: string[], rejectedCount: number, provider: string}>}
 */
async function generateSecondaryImagesFromReference({
  referenceImageUrl,
  productName,
  category,
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non configuree.');
  }

  console.log('[AI][GEMINI] start - Generation de 3 images secondaires');
  console.log(`[AI][GEMINI] Reference: ${referenceImageUrl}`);
  console.log(`[AI][GEMINI] Produit: ${productName}, Categorie: ${category}`);

  // Download the reference image
  const refResponse = await fetch(referenceImageUrl);
  if (!refResponse.ok) {
    throw new Error(`Echec telechargement image reference: ${refResponse.status}`);
  }
  const refBuffer = Buffer.from(await refResponse.arrayBuffer());
  const refBase64 = refBuffer.toString('base64');

  // Detect mime type from URL
  const mimeType = referenceImageUrl.match(/\.png/i) ? 'image/png' : 'image/jpeg';

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const timestamp = Date.now();
  const slug = (productName || category || 'produit')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  const fidelityRules = `ABSOLUTE FIDELITY RULES (NON-NEGOTIABLE):
- This is the EXACT SAME garment from the reference image
- Same outfit, same fabric, same color, same cut, same proportions
- Same embroidery pattern, same design details — NOTHING invented
- No redesign, no style change, no artistic interpretation
- If a detail is NOT visible on the reference image, do NOT create it
- NEVER invent a pattern, embroidery, or back design
- NEVER modify the cut or silhouette
- Photorealistic, natural imperfections, real fabric texture
- Camera-like lighting, not stylized, not illustration
- Must look like a real premium boutique photograph

MANDATORY POSE RULES (NON-NEGOTIABLE):
- STRICTLY FRONT VIEW ONLY — face the camera directly
- Maximum slight angle: 30 degrees from front
- NEVER show the back of the garment
- NEVER show a rear view or back view
- NEVER rotate the body away from camera
- NO back view, NO rear angle, NO turning around, NO 3/4 back
- Do NOT invent or create any details on the back of the garment
- Only show what is visible from the FRONT of the reference image

VISUAL STYLE:
- Premium couture boutique aesthetic
- Neutral background (studio, light grey, beige)
- Soft, professional studio lighting
- No parasitic decor, no text, no watermark`;

  // 2 images "portees" (full human worn) + 1 zoom detail couture
  const prompts = [
    {
      label: 'portee-1',
      type: 'worn',
      text: `Look at this fashion product photo. Generate a NEW premium e-commerce photograph of this EXACT SAME garment WORN BY A COMPLETE HUMAN MODEL.

MANDATORY — the model must be:
- Full body visible: head, bust, legs, feet — ALL visible, nothing cropped
- Facing the camera DIRECTLY (strict front view)
- Elegant, natural posture — premium e-commerce pose
- Standing centered in frame

${fidelityRules}`,
    },
    {
      label: 'portee-2',
      type: 'worn',
      text: `Look at this fashion product photo. Generate a NEW premium e-commerce photograph of this EXACT SAME garment WORN BY A COMPLETE HUMAN MODEL, with a slightly different elegant pose.

MANDATORY — the model must be:
- Full body visible: head, bust, legs, feet — ALL visible, nothing cropped
- Facing the camera DIRECTLY (strict front view, max 30 degrees)
- Different pose from the first image but still elegant and natural
- Standing centered in frame

${fidelityRules}`,
    },
    {
      label: 'zoom-detail',
      type: 'detail',
      text: `Look at this fashion product photo. Generate a CLOSE-UP DETAIL photograph focusing STRICTLY on the craftsmanship visible on the FRONT of this EXACT SAME garment.

ZOOM MUST FOCUS ON:
- Embroidery, stitching, collar, sleeves, fabric texture
- Only details VISIBLE on the reference image front
- The model body may be partially visible but NO FACE

STRICT PROHIBITIONS:
- NO face visible
- NO back view
- NO invented pattern or design
- NO embroidery or motif not present in the reference
- Focus ONLY on the garment craftsmanship

${fidelityRules}
Macro photography style, shallow depth of field.`,
    },
  ];

  const imageReference = {
    inlineData: {
      mimeType,
      data: refBase64,
    },
  };

  // Helper: verify generated image compliance using Gemini Vision
  async function verifyImageCompliance(imageBuffer, label, promptType) {
    try {
      const imgBase64 = imageBuffer.toString('base64');

      const checkPrompt = promptType === 'detail'
        ? `Analyze this fashion detail photo. Check these criteria and answer ONLY with a JSON object:
1. Is a human face clearly visible? (faceVisible: true/false)
2. Is the garment shown from the BACK or REAR view? (isBackView: true/false)
Answer: {"faceVisible": bool, "isBackView": bool}`
        : `Analyze this fashion photo. Check these criteria and answer ONLY with a JSON object:
1. Is the person shown from the BACK or REAR view? (isBackView: true/false) — back of body/garment visible = true
2. Is the FULL body visible (head, torso, legs, feet)? (isFullBody: true/false)
A front view or slight side angle (less than 90 degrees from front) is NOT a back view.
Answer: {"isBackView": bool, "isFullBody": bool}`;

      const verifyResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: imgBase64,
            },
          },
          { text: checkPrompt },
        ],
      });

      const verifyParts = verifyResponse.candidates?.[0]?.content?.parts || [];
      const verifyText = verifyParts.filter((p) => p.text).map((p) => p.text).join('');
      const jsonMatch = verifyText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);

        if (result.isBackView === true) {
          console.log(`[AI][GEMINI] REJECTED - Image ${label}: vue arriere detectee`);
          return { ok: false, reason: 'vue arriere' };
        }

        if (promptType === 'detail' && result.faceVisible === true) {
          console.log(`[AI][GEMINI] REJECTED - Image ${label}: visage visible sur zoom detail`);
          return { ok: false, reason: 'visage visible sur zoom detail' };
        }

        if (promptType === 'worn' && result.isFullBody === false) {
          console.log(`[AI][GEMINI] WARNING - Image ${label}: corps non complet`);
          // Warning only, don't reject — Gemini may partially crop
        }
      }
      return { ok: true };
    } catch (err) {
      console.warn(`[AI][GEMINI] Verification skipped for ${label}: ${err.message}`);
      return { ok: true }; // Allow if verification fails
    }
  }

  const results = await Promise.allSettled(
    prompts.map(async ({ label, type, text }, index) => {
      console.log(`[AI][GEMINI] Generation image ${index + 1}/3 (${label})...`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [imageReference, { text }],
      });

      // Extract image from response
      const parts = response.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));

      if (!imagePart) {
        const textParts = parts.filter((p) => p.text).map((p) => p.text).join(' ');
        throw new Error(`Gemini n'a pas genere d'image pour ${label}. Reponse: ${textParts.slice(0, 200)}`);
      }

      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

      // Verify compliance before uploading
      const compliance = await verifyImageCompliance(imageBuffer, label, type);
      if (!compliance.ok) {
        throw new Error(`Image rejetee : non conforme au modele couture Ibag (${compliance.reason}) - ${label}`);
      }

      const filename = `${slug}-gemini-${label}-${timestamp}`;

      console.log(`[AI][GEMINI] Upload Cloudinary image ${index + 1} (${label})...`);
      const url = await uploadToCloudinary(imageBuffer, filename);
      console.log(`[AI][GEMINI] success - Image ${index + 1} uploadee: ${url}`);

      return url;
    })
  );

  const successfulImages = [];
  const errors = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      successfulImages.push(r.value);
    } else {
      const reason = r.reason?.message || String(r.reason);
      console.error(`[AI][GEMINI] failure - ${reason}`);
      errors.push(reason);
    }
  }

  const rejectedCount = errors.length;

  if (successfulImages.length === 0) {
    throw new Error(`Gemini: aucune image generee. Erreurs: ${errors.join('; ')}`);
  }

  if (rejectedCount > 0) {
    console.log(`[AI][GEMINI] ${rejectedCount} image(s) rejetee(s) : non conforme(s) au modele couture Ibag`);
  }
  console.log(`[AI][GEMINI] success - ${successfulImages.length}/3 images generees`);

  return {
    images: successfulImages,
    rejectedCount,
    provider: 'gemini',
  };
}

/**
 * Analyze a product image using Gemini Vision.
 * Returns structured analysis: garment type, style, material, target, color.
 *
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeProductImage(imageUrl) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non configuree.');
  }

  console.log(`[AI][GEMINI-VISION] Analyse image: ${imageUrl}`);

  // Download image
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) {
    throw new Error(`Echec telechargement image: ${imgResponse.status}`);
  }
  const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
  const imgBase64 = imgBuffer.toString('base64');
  const mimeType = imageUrl.match(/\.png/i) ? 'image/png' : 'image/jpeg';

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType,
          data: imgBase64,
        },
      },
      {
        text: `Tu es un expert en mode africaine et couture haut de gamme.
Analyse cette image de vetement et reponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "garmentType": "type de vetement (ex: boubou, ensemble, robe, costume, caftan, dashiki, agbada...)",
  "style": "style general (ex: traditionnel, moderne, brode, luxe, casual chic, ceremonial...)",
  "material": "matiere probable (ex: bazin riche, wax, lin, soie, coton, brocart, super 100...)",
  "targetGender": "homme ou femme",
  "dominantColor": "couleur dominante en francais (ex: blanc casse, bleu royal, dore...)",
  "details": "details visuels notables en 1-2 phrases (broderies, motifs, finitions...)",
  "confidence": "high, medium ou low selon la qualite de l'image"
}
Sois precis et objectif. Ne fabule pas sur des details non visibles.`
      }
    ],
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  const textContent = parts.filter((p) => p.text).map((p) => p.text).join('');

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Gemini Vision: reponse non-JSON: ${textContent.slice(0, 200)}`);
  }

  const analysis = JSON.parse(jsonMatch[0]);
  console.log(`[AI][GEMINI-VISION] Analyse OK: ${analysis.garmentType}, ${analysis.style}, ${analysis.dominantColor}`);

  return analysis;
}

/**
 * Generate product text (name + description) using Gemini.
 *
 * @param {Object} params
 * @param {string} params.category - Product category
 * @param {boolean} params.isCustomAvailable - Whether custom is available
 * @param {string} [params.name] - Current product name
 * @param {number} [params.basePrice] - Base price
 * @param {Object} [params.imageAnalysis] - Vision analysis result
 * @returns {Promise<Object>} { name, description, imageSuggestion }
 */
async function generateProductText({
  category,
  isCustomAvailable,
  name,
  basePrice,
  imageAnalysis,
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non configuree.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

  // Build context from image analysis if available
  let analysisContext = '';
  if (imageAnalysis) {
    analysisContext = `
Analyse visuelle du produit (obtenue par IA):
- Type de vetement: ${imageAnalysis.garmentType || 'non determine'}
- Style: ${imageAnalysis.style || 'non determine'}
- Matiere probable: ${imageAnalysis.material || 'non determine'}
- Couleur dominante: ${imageAnalysis.dominantColor || 'non determine'}
- Details: ${imageAnalysis.details || 'aucun'}
Utilise ces informations pour creer une fiche produit fidele et precise.`;
  }

  const textPrompt = `Tu es le directeur artistique d'Ibag Couture, une maison de couture africaine haut de gamme specialisee dans le sur-mesure et l'artisanat textile.

Genere une fiche produit professionnelle pour un vetement avec ces caracteristiques:
- Categorie: ${catLabel}
- Type: ${typeLabel}
${nameInfo}
${priceInfo}
${analysisContext}

Reponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "name": "Nom du produit elegant et professionnel (max 80 caracteres)",
  "description": "Description haut de gamme du produit (150-300 mots). Mets en valeur le savoir-faire artisanal, les details de confection, le confort et l'elegance. Ton professionnel, francais soigne. Adapte au marche africain haut de gamme. Ne jamais inventer de matiere non fournie sauf si l'analyse visuelle la mentionne. Oriente sur-mesure et artisanat.",
  "imageSuggestion": "Description detaillee pour une photo professionnelle du produit: type de studio, eclairage, mannequin, pose, mise en scene du tissu, ambiance generale (50-100 mots)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Regles:
- Francais elegant, pas de familiarite
- Ton maison de couture haut de gamme
- Ne pas inventer de matieres ou tissus specifiques sauf si mentionnes dans l'analyse visuelle
- Mettre en avant l'artisanat et le savoir-faire
- La description doit donner envie tout en restant professionnelle
- Les tags doivent etre des mots-cles SEO pertinents en francais (ex: boubou, bazin, broderie, sur-mesure...)`;

  console.log(`[AI][GEMINI-TEXT] Generation texte - categorie: ${category}, type: ${typeLabel}`);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ text: textPrompt }],
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  const textContent = parts.filter((p) => p.text).map((p) => p.text).join('');

  // Extract JSON from response
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Gemini Text: reponse non-JSON: ${textContent.slice(0, 200)}`);
  }

  const result = JSON.parse(jsonMatch[0]);
  console.log(`[AI][GEMINI-TEXT] Texte OK - nom suggere: "${result.name}"`);

  return result;
}

module.exports = {
  generateSecondaryImagesFromReference,
  analyzeProductImage,
  generateProductText,
};
