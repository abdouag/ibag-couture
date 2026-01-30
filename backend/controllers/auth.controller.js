const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware');
const config = require('../config');

/**
 * Génère un token JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Envoie la réponse avec token
 */
const sendTokenResponse = (user, statusCode, message, res) => {
  const token = generateToken(user._id);

  // Retirer le mot de passe de la réponse
  const userData = {
    _id: user._id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: userData,
      token,
    },
  });
};

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Cet email est déjà utilisé', 400));
    }

    // Créer l'utilisateur (role: client par défaut)
    const user = await User.create({
      email,
      password,
      fullName,
      role: 'client',
    });

    sendTokenResponse(user, 201, 'Inscription réussie', res);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    next(error);
  }
};

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return next(new AppError('Email et mot de passe requis', 400));
    }

    // Trouver l'utilisateur avec le mot de passe
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new AppError('Email ou mot de passe incorrect', 401));
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return next(new AppError('Ce compte a été désactivé', 401));
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Email ou mot de passe incorrect', 401));
    }

    sendTokenResponse(user, 200, 'Connexion réussie', res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('Utilisateur non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Profil récupéré avec succès',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
