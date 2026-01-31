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
 * Generate 2 secondary images from a reference image using Google Gemini.
 *
 * Uses gemini-2.5-flash-image model with image-to-image generation.
 *
 * IMPORTANT LIMITATION: Gemini is a generative model. It regenerates pixels
 * and CANNOT guarantee pixel-level fidelity to the reference image.
 *
 * @param {Object} params
 * @param {string} params.referenceImageUrl - Cloudinary URL of the reference image
 * @param {string} params.productName - Product name for context
 * @param {string} params.category - Product category
 * @returns {Promise<{images: string[], provider: string}>}
 */
async function generateSecondaryImagesFromReference({
  referenceImageUrl,
  productName,
  category,
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non configuree.');
  }

  console.log('[AI][GEMINI] start - Generation de 2 images secondaires');
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

  const fidelityRules = `CRITICAL RULES:
- This is the SAME garment from the reference image
- Same outfit, same fabric, same color, same cut, same proportions
- Same embroidery pattern, same design details
- No redesign, no style change, no artistic interpretation
- Photorealistic, natural imperfections, real fabric texture
- Camera-like lighting, not stylized, not illustration
- Must look like a real camera photograph, not AI-generated`;

  const prompts = [
    {
      label: 'secondaire',
      text: `Look at this fashion product photo. Generate a NEW photograph of this EXACT SAME garment from a slightly different angle (three-quarter view). Full body photo, head to toe visible, no cropping, centered framing. ${fidelityRules}. Professional e-commerce fashion photography, neutral background, natural studio lighting. No text, no watermark.`,
    },
    {
      label: 'detail',
      text: `Look at this fashion product photo. Generate a CLOSE-UP detail photograph of the fabric, embroidery and stitching visible in this EXACT SAME garment. Focus on textile texture, thread work, and material quality. Same fabric, same color, same pattern as the reference. ${fidelityRules}. Macro photography style, natural studio lighting. No text, no watermark.`,
    },
  ];

  const imageReference = {
    inlineData: {
      mimeType,
      data: refBase64,
    },
  };

  const results = await Promise.allSettled(
    prompts.map(async ({ label, text }, index) => {
      console.log(`[AI][GEMINI] Generation image ${index + 1}/2 (${label})...`);

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

  if (successfulImages.length === 0) {
    throw new Error(`Gemini: aucune image generee. Erreurs: ${errors.join('; ')}`);
  }

  console.log(`[AI][GEMINI] success - ${successfulImages.length}/2 images generees`);

  return {
    images: successfulImages,
    provider: 'gemini',
  };
}

module.exports = {
  generateSecondaryImagesFromReference,
};
