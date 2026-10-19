const { PrismaClient } = require('@prisma/client');

/**
 * Client Prisma partage par toute l'application.
 *
 * Une seule instance par processus : chaque PrismaClient ouvre son propre pool
 * de connexions, et en creer plusieurs epuiserait les connexions disponibles
 * cote base.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Ferme proprement le pool de connexions (arret du serveur, fin d'un script).
 */
const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

module.exports = { prisma, disconnectPrisma };
