import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = process.env.VALORA_API_KEY;
  if (!apiKey) {
    console.error('API key not configured on server.');
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res
      .status(401)
      .json({ error: 'Unauthorized: Missing or invalid authorization header.' });
    return;
  }

  const providedKey = authHeader.split(' ')[1];
  if (providedKey !== apiKey) {
    res.status(401).json({ error: 'Unauthorized: Invalid API key.' });
    return;
  }

  next();
}; 