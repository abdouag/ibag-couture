/**
 * Generation de slug produit.
 *
 * Mongoose generait le slug dans un hook `pre('save')`. Prisma n'a pas de
 * hooks : la generation est explicite ici, et appelee par le controleur.
 *
 * Effet de bord corrige au passage : avec Mongoose, la mise a jour passait par
 * `findByIdAndUpdate`, qui ne declenche pas le hook. Renommer un produit
 * laissait donc l'ancien slug, et l'URL ne correspondait plus au nom.
 */

/**
 * Transforme un nom en slug : minuscules, accents retires, tout ce qui n'est
 * pas alphanumerique devient un tiret.
 */
const slugify = (name) =>
  String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

module.exports = { slugify };
