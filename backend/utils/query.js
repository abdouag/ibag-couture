/**
 * Helpers de lecture des parametres de requete, partages par les controleurs.
 *
 * MongoDB acceptait une chaine de tri telle quelle ("-createdAt"). Prisma
 * attend un objet, et surtout : passer un nom de champ non verifie a `orderBy`
 * fait echouer la requete. Le tri est donc restreint a une liste explicite de
 * champs autorises.
 */

/**
 * Convertit une chaine de tri facon Mongoose en clause `orderBy` Prisma.
 *
 * @param {string} sort - par exemple "-createdAt" ou "amount"
 * @param {string[]} allowedFields - champs sur lesquels le tri est autorise
 * @param {object} fallback - tri applique si la demande est absente ou refusee
 */
const parseSort = (sort, allowedFields, fallback = { createdAt: 'desc' }) => {
  if (!sort || typeof sort !== 'string') return fallback;

  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  const field = sort.replace(/^-/, '');

  if (!allowedFields.includes(field)) return fallback;

  return { [field]: direction };
};

/**
 * Normalise page et limite, en bornant la limite pour qu'une requete ne puisse
 * pas demander la base entiere.
 */
const parsePagination = ({ page = 1, limit = 20 }, maxLimit = 100) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 20));

  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

/**
 * Enveloppe de reponse paginee, identique a celle des controleurs Mongoose.
 */
const paginated = (res, { message, data, total, pageNum, limitNum }) =>
  res.status(200).json({
    success: true,
    message,
    count: data.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data,
  });

module.exports = { parseSort, parsePagination, paginated };
