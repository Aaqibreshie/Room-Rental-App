import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import helmet from 'helmet';

// XSS Protection - Sanitize data
export const sanitizeData = mongoSanitize();

// HPP Protection - Prevent HTTP Parameter Pollution
export const preventParamPollution = hpp();

// Helmet - Set security HTTP headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameGuard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

export default {
  sanitizeData,
  preventParamPollution,
  securityHeaders
};
