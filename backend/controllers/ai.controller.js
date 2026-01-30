const OpenAI = require('openai');
const { AppError } = require('../middleware');

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
 * @desc    Generer des suggestions produit via IA
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

    const { name, category, basePrice, isCustomAvailable } = req.body;

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

    const prompt = `Tu es le directeur artistique d'Ibag Couture, une maison de couture africaine haut de gamme specialisee dans le sur-mesure et l'artisanat textile.

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

    console.log(`[AI] Requete generate-product - categorie: ${category}, type: ${typeLabel}, nom: ${name || 'non fourni'}`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return next(new AppError('Reponse IA vide. Reessayez.', 500));
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      console.error('[AI] Erreur parsing JSON:', content);
      return next(new AppError('Format de reponse IA invalide. Reessayez.', 500));
    }

    console.log(`[AI] Reponse OK - nom suggere: "${result.name}"`);

    res.status(200).json({
      success: true,
      message: 'Suggestions generees avec succes',
      data: {
        name: result.name || '',
        description: result.description || '',
        imageSuggestion: result.imageSuggestion || '',
      },
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
