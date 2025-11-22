import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import helmet from "helmet";

// XSS Protection - Sanitize data
// export const sanitizeData = mongoSanitize();
export const safeSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      for (let key in obj) {
        if (/^\$/.test(key)) {
          delete obj[key]; // remove malicious Mongo operators
        } else if (typeof obj[key] === "object") {
          sanitize(obj[key]);
        }
      }
    }
  };

  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.headers);

  // 🚀 IMPORTANT: Do NOT try to modify req.query (Express 5 readonly)
  // sanitize(req.query);  <-- DO NOT TOUCH

  next();
};

// HPP Protection - Prevent HTTP Parameter Pollution
export const preventParamPollution = hpp();

// Helmet - Set security HTTP headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameGuard: {
    action: "deny",
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
});

export default {
  // sanitizeData,
  safeSanitize,
  preventParamPollution,
  securityHeaders,
};
