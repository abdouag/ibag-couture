const { AppError } = require('./errorHandler');

const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} non trouvée`, 404));
};

module.exports = notFound;
