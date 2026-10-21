const jwt = require('jsonwebtoken');

const { prisma } = require('../../config/prisma');
const { AppError } = require('../../middleware');
const config = require('../../config');
const { serializeUser } = require('../../utils/serialize');
const { hashPassword, comparePassword } = require('../../utils/password');

/**
 * Genere un token JWT
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/**
 * Envoie la reponse avec token
 */
const sendTokenResponse = (user, statusCode, message, res) => {
  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: {
        _id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      token: generateToken(user.id),
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

    if (!email || !password) {
      return next(new AppError('Email et mot de passe requis', 400));
    }
    if (String(password).length < 6) {
      return next(new AppError('Le mot de passe doit contenir au moins 6 caractères', 400));
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return next(new AppError('Cet email est déjà utilisé', 400));
    }

    // Le role n'est jamais lu depuis la requete : une inscription cree
    // toujours un compte client.
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: await hashPassword(password),
        fullName: fullName || null,
        role: 'client',
      },
    });

    sendTokenResponse(user, 201, 'Inscription réussie', res);
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new AppError('Cet email est déjà utilisé', 400));
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

    if (!email || !password) {
      return next(new AppError('Email et mot de passe requis', 400));
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    // Message volontairement identique que l'email existe ou non : distinguer
    // les deux permettrait d'enumerer les comptes.
    if (!user) {
      return next(new AppError('Email ou mot de passe incorrect', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Ce compte a été désactivé', 401));
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return next(new AppError('Email ou mot de passe incorrect', 401));
    }

    sendTokenResponse(user, 200, 'Connexion réussie', res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir le profil de l'utilisateur connecte
 * @route   GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      return next(new AppError('Utilisateur non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Profil récupéré avec succès',
      data: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
