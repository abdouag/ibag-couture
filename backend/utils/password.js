const bcrypt = require('bcryptjs');

/**
 * Hachage des mots de passe.
 *
 * Mongoose hachait le mot de passe dans un hook `pre('save')`. Prisma n'ayant
 * pas de hooks, l'operation devient explicite : tout code qui cree ou modifie
 * un mot de passe doit passer par `hashPassword`. Un oubli enregistrerait le
 * mot de passe en clair, d'ou le regroupement ici plutot que dans un
 * controleur.
 */

const SALT_ROUNDS = 12;

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

const comparePassword = (plainPassword, hash) => bcrypt.compare(plainPassword, hash);

module.exports = { hashPassword, comparePassword, SALT_ROUNDS };
