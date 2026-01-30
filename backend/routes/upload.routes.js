const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { protect, adminOnly } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ibag-couture/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1500, crop: 'limit', quality: 'auto' }],
  },
});

// File filter - only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Type de fichier non autorise. Utilisez JPG, PNG ou WebP.', 400), false);
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

// POST /api/uploads/product - Upload a product image
router.post(
  '/product',
  protect,
  adminOnly,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Le fichier est trop volumineux. Taille max: 5MB', 400));
        }
        return next(new AppError(`Erreur upload: ${err.message}`, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  },
  (req, res, next) => {
    if (!req.file) {
      return next(new AppError('Aucun fichier fourni', 400));
    }

    // Cloudinary returns the full URL in req.file.path
    const imageUrl = req.file.path;

    res.status(201).json({
      success: true,
      message: 'Image uploadee avec succes',
      data: {
        filename: req.file.filename,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  }
);

// POST /api/uploads/products - Upload multiple product images (max 6)
router.post(
  '/products',
  protect,
  adminOnly,
  (req, res, next) => {
    upload.array('images', 6)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Un fichier est trop volumineux. Taille max: 5MB', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError('Maximum 6 images autorisees', 400));
        }
        return next(new AppError(`Erreur upload: ${err.message}`, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  },
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('Aucun fichier fourni', 400));
    }

    const uploaded = req.files.map((file) => ({
      filename: file.filename,
      url: file.path, // Cloudinary full URL
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.status(201).json({
      success: true,
      message: `${uploaded.length} image(s) uploadee(s) avec succes`,
      data: uploaded,
    });
  }
);

// DELETE /api/uploads/product/:filename - Delete a product image from Cloudinary
router.delete(
  '/product/:filename',
  protect,
  adminOnly,
  async (req, res, next) => {
    try {
      const { filename } = req.params;

      // Security: prevent directory traversal
      if (filename.includes('..') || filename.includes('/')) {
        return next(new AppError('Nom de fichier invalide', 400));
      }

      // Cloudinary public_id is folder/filename (without extension)
      const publicId = `ibag-couture/products/${filename}`;

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'not found') {
        return next(new AppError('Fichier non trouve', 404));
      }

      res.json({
        success: true,
        message: 'Image supprimee avec succes'
      });
    } catch (err) {
      return next(new AppError('Erreur lors de la suppression', 500));
    }
  }
);

module.exports = router;
