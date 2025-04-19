import rateLimit from 'express-rate-limit';

// Create a rate limiter middleware
export const limiter = rateLimit({
    windowMs:  60 * 1000, // 1 minutes
    max: 90000, 
    message: 'Demasiadas peticiones, intente de nuevo más tarde',
});

// Stricter rate limiter for login 
export const loginLimiter = rateLimit({
  windowMs: 6*60 * 60 * 1000, // 6 horas
  max: 10000, 
  message: 'Demasiados intentos fallidos, intente de nuevo más tarde.',
});
