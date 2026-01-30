const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, adminOnly } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
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

// Configure multer
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

    // Return the path to the uploaded file
    const imageUrl = `/uploads/products/${req.file.filename}`;

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
      url: `/uploads/products/${file.filename}`,
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

// DELETE /api/uploads/product/:filename - Delete a product image
router.delete(
  '/product/:filename',
  protect,
  adminOnly,
  (req, res, next) => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return next(new AppError('Nom de fichier invalide', 400));
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return next(new AppError('Fichier non trouve', 404));
    }

    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        return next(new AppError('Erreur lors de la suppression', 500));
      }

      res.json({
        success: true,
        message: 'Image supprimee avec succes'
      });
    });
  }
);

module.exports = router;
