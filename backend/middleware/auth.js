const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const config = require('../config');

/**
 * Middleware de protection des routes
 * Vérifie la présence et validité du token JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Récupérer le token depuis le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Accès non autorisé. Veuillez vous connecter.', 401));
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Session expirée. Veuillez vous reconnecter.', 401));
      }
      return next(new AppError('Token invalide', 401));
    }

    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('Utilisateur non trouvé', 401));
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return next(new AppError('Ce compte a été désactivé', 401));
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware de restriction par rôle
 * @param  {...string} roles - Rôles autorisés
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Accès refusé. Permissions insuffisantes.', 403));
    }
    next();
  };
};

/**
 * Middleware admin uniquement (raccourci)
 */
const adminOnly = restrictTo('admin');

module.exports = {
  protect,
  restrictTo,
  adminOnly,
};
