/**
 * Utility Functions
 * Safe HTML decoding, debouncing, and other helpers
 */

const TriviaUtils = (function() {
    // Safe HTML entity mapping for decodeHTMLEntities
    const htmlEntities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#60;': '<',
        '&#62;': '>',
        '&#34;': '"',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™',
        '&hellip;': '...',
        '&mdash;': '—',
        '&ndash;': '–',
        '&ldquo;': '"',
        '&rdquo;': '"',
        '&lsquo;': '\'',
        '&rsquo;': '\'',
        '&euro;': '€',
        '&pound;': '£',
        '&yen;': '¥',
        '&cent;': '¢',
        '&deg;': '°',
        '&plusmn;': '±',
        '&frac12;': '½',
        '&frac14;': '¼',
        '&frac34;': '¾',
        '&times;': '×',
        '&divide;': '÷',
        '&infin;': '∞',
        '&there4;': '∴',
        '&sum;': '∑',
        '&prod;': '∏',
        '&int;': '∫',
        '&radic;': '√',
        '&sim;': '∼',
        '&asymp;': '≈',
        '&ne;': '≠',
        '&equiv;': '≡',
        '&le;': '≤',
        '&ge;': '≥',
        '&sub;': '⊂',
        '&sup;': '⊃',
        '&nsub;': '⊄',
        '&sube;': '⊆',
        '&supe;': '⊇',
        '&oplus;': '⊕',
        '&otimes;': '⊗',
        '&perp;': '⊥',
        '&larr;': '←',
        '&uarr;': '↑',
        '&rarr;': '→',
        '&darr;': '↓',
        '&harr;': '↔',
        '&lArr;': '⇐',
        '&uArr;': '⇑',
        '&rArr;': '⇒',
        '&dArr;': '⇓',
        '&hArr;': '⇔',
        '&crarr;': '↵',
        '&lceil;': '⌈',
        '&rceil;': '⌉',
        '&lfloor;': '⌊',
        '&rfloor;': '⌋',
        '&spades;': '♠',
        '&clubs;': '♣',
        '&hearts;': '♥',
        '&diams;': '♦',
        '&Alpha;': 'Α',
        '&Beta;': 'Β',
        '&Gamma;': 'Γ',
        '&Delta;': 'Δ',
        '&Epsilon;': 'Ε',
        '&Zeta;': 'Ζ',
        '&Eta;': 'Η',
        '&Theta;': 'Θ',
        '&Iota;': 'Ι',
        '&Kappa;': 'Κ',
        '&Lambda;': 'Λ',
        '&Mu;': 'Μ',
        '&Nu;': 'Ν',
        '&Xi;': 'Ξ',
        '&Omicron;': 'Ο',
        '&Pi;': 'Π',
        '&Rho;': 'Ρ',
        '&Sigma;': 'Σ',
        '&Tau;': 'Τ',
        '&Upsilon;': 'Υ',
        '&Phi;': 'Φ',
        '&Chi;': 'Χ',
        '&Psi;': 'Ψ',
        '&Omega;': 'Ω',
        '&alpha;': 'α',
        '&beta;': 'β',
        '&gamma;': 'γ',
        '&delta;': 'δ',
        '&epsilon;': 'ε',
        '&zeta;': 'ζ',
        '&eta;': 'η',
        '&theta;': 'θ',
        '&iota;': 'ι',
        '&kappa;': 'κ',
        '&lambda;': 'λ',
        '&mu;': 'μ',
        '&nu;': 'ν',
        '&xi;': 'ξ',
        '&omicron;': 'ο',
        '&pi;': 'π',
        '&rho;': 'ρ',
        '&sigmaf;': 'ς',
        '&sigma;': 'σ',
        '&tau;': 'τ',
        '&upsilon;': 'υ',
        '&phi;': 'φ',
        '&chi;': 'χ',
        '&psi;': 'ψ',
        '&omega;': 'ω',
        '&thetasym;': 'ϑ',
        '&upsih;': 'ϒ',
        '&piv;': 'ϖ'
    };

    // Numeric entity regex
    const numericEntityRegex = /&#(\d+);/g;
    const hexEntityRegex = /&#x([0-9a-fA-F]+);/g;

    /**
     * Safely decode HTML entities without XSS risk
     * Uses a whitelist approach instead of DOMParser
     */
    function decodeHTMLEntities(text) {
        if (typeof text !== 'string') return '';
        
        let decoded = text;
        
        // Replace named entities
        for (const [entity, char] of Object.entries(htmlEntities)) {
            decoded = decoded.split(entity).join(char);
        }
        
        // Replace decimal numeric entities
        decoded = decoded.replace(numericEntityRegex, (match, dec) => {
            const code = parseInt(dec, 10);
            // Only allow safe unicode ranges
            if (code > 31 && (code < 127 || code > 159)) {
                return String.fromCharCode(code);
            }
            return match;
        });
        
        // Replace hex numeric entities
        decoded = decoded.replace(hexEntityRegex, (match, hex) => {
            const code = parseInt(hex, 16);
            // Only allow safe unicode ranges
            if (code > 31 && (code < 127 || code > 159)) {
                return String.fromCharCode(code);
            }
            return match;
        });
        
        return decoded;
    }

    /**
     * Debounce function to prevent rapid-fire execution
     */
    function debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Safe localStorage wrapper with error handling for private browsing
     */
    const safeStorage = {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('localStorage get failed:', e);
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('localStorage set failed:', e);
                return false;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('localStorage remove failed:', e);
                return false;
            }
        }
    };

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Format time from milliseconds to HH:MM:SS
     */
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Check if user prefers reduced motion
     */
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Generate random ID
     */
    function generateId(prefix = 'id') {
        return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    }

    /**
     * Deep clone an object
     */
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    return {
        decodeHTMLEntities,
        debounce,
        safeStorage,
        shuffleArray,
        formatTime,
        prefersReducedMotion,
        generateId,
        deepClone
    };
})();

// Export for global use
window.TriviaUtils = TriviaUtils;
