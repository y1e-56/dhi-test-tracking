export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err?.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: 'Fichier trop volumineux. Taille maximale : 10 Mo' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
}
