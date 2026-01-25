// Common email typos and corrections
const EMAIL_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cpm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  
  // Outlook typos
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  
  // Other common providers
  'live.con': 'live.com',
  'icloud.con': 'icloud.com',
  'aol.con': 'aol.com',
  'protonmail.con': 'protonmail.com',
};

// Valid email domains (top providers)
const VALID_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
];

/**
 * Validate email format and check for common typos
 * @param email - Email address to validate
 * @returns Object with validation result and suggestions
 */
export function validateEmail(email: string): {
  isValid: boolean;
  correctedEmail?: string;
  error?: string;
  suggestion?: string;
} {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  // Extract domain
  const [localPart, domain] = trimmedEmail.split('@');
  
  if (!localPart || !domain) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  // Check for spaces (common mistake)
  if (email.includes(' ')) {
    return {
      isValid: false,
      error: 'Email cannot contain spaces',
    };
  }

  // Check for consecutive dots
  if (localPart.includes('..') || domain.includes('..')) {
    return {
      isValid: false,
      error: 'Email cannot have consecutive dots',
    };
  }

  // Check if domain is a known typo
  if (EMAIL_TYPOS[domain]) {
    const correctedDomain = EMAIL_TYPOS[domain];
    const correctedEmail = `${localPart}@${correctedDomain}`;
    return {
      isValid: false,
      error: `Did you mean "${correctedEmail}"? "${domain}" looks like a typo.`,
      suggestion: correctedEmail,
      correctedEmail,
    };
  }

  // Check for domain with no TLD
  if (!domain.includes('.')) {
    return {
      isValid: false,
      error: 'Email domain must have a valid extension (e.g., .com, .org)',
    };
  }

  // Check for invalid TLD
  const tld = domain.split('.').pop();
  if (tld && tld.length < 2) {
    return {
      isValid: false,
      error: 'Email domain extension is too short',
    };
  }

  // Warn about non-standard domains (but still allow them)
  const isCommonDomain = VALID_DOMAINS.includes(domain);
  
  return {
    isValid: true,
    correctedEmail: trimmedEmail,
    ...((!isCommonDomain && domain.endsWith('.com')) && {
      suggestion: `Using "${domain}" - if this is a typo, common providers are: gmail.com, yahoo.com, outlook.com`,
    }),
  };
}

/**
 * Sanitize email for safe storage
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
