/**
 * Pure game logic functions extracted for testability.
 * These are used by script.js at runtime and by tests directly.
 */

/**
 * Shuffle an array using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} A new shuffled array.
 */
function shuffleAnswers(array) {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Decode HTML entities in a string (e.g. &amp; -> &).
 * Uses DOMParser when available, falls back to regex replacement.
 * @param {string} text - Text containing HTML entities.
 * @returns {string} Decoded text.
 */
function decodeHTMLEntities(text) {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.documentElement.textContent;
  }
  // Fallback for environments without DOMParser
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Build the API URL from settings.
 * @param {string} baseUrl - The base API URL.
 * @param {Object} settings - Game settings (amount, difficulty, category, type).
 * @returns {string} The full API URL with query parameters.
 */
function buildApiUrl(baseUrl, settings) {
  const queryParams = new URLSearchParams(settings);
  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Validate API response data.
 * @param {Object} data - The API response data.
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateApiResponse(data) {
  if (!data) {
    return { valid: false, reason: 'No data received' };
  }
  if (data.response_code !== 0) {
    return { valid: false, reason: `API response code: ${data.response_code}` };
  }
  if (!data.results || data.results.length === 0) {
    return { valid: false, reason: 'No results in response' };
  }
  return { valid: true };
}

/**
 * Create an answer record for the summary.
 * @param {Object} question - The question object from the API.
 * @param {string} selectedOption - The user's selected answer.
 * @returns {Object} Answer record with question, userAnswer, correctAnswer, isCorrect.
 */
function createAnswerRecord(question, selectedOption) {
  return {
    question: question.question,
    userAnswer: selectedOption,
    correctAnswer: question.correct_answer,
    isCorrect: selectedOption === question.correct_answer,
  };
}

/**
 * Calculate the progress percentage.
 * @param {number} currentIndex - Current question index (0-based).
 * @param {number} totalQuestions - Total number of questions.
 * @returns {number} Progress percentage (0-100).
 */
function calculateProgress(currentIndex, totalQuestions) {
  if (totalQuestions <= 0) return 0;
  return (currentIndex / totalQuestions) * 100;
}

/**
 * Determine if the high score should be updated.
 * @param {number} score - Current game score.
 * @param {number} highScore - Existing high score.
 * @returns {boolean}
 */
function isNewHighScore(score, highScore) {
  return score > highScore;
}

/**
 * Generate the share text for social sharing.
 * @param {number} score - The user's score.
 * @param {number} totalQuestions - Total number of questions.
 * @param {string} url - The game URL.
 * @returns {string}
 */
function generateShareText(score, totalQuestions, url) {
  return `I scored ${score}/${totalQuestions} in the Trivia Challenge! Can you beat my score? ${url}`;
}

/**
 * Merge saved settings with defaults.
 * @param {Object} defaults - Default settings.
 * @param {Object|null} saved - Saved settings from storage.
 * @returns {Object} Merged settings.
 */
function mergeSettings(defaults, saved) {
  if (!saved) return { ...defaults };
  return { ...defaults, ...saved };
}

// Export for Node.js / test environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    shuffleAnswers,
    decodeHTMLEntities,
    buildApiUrl,
    validateApiResponse,
    createAnswerRecord,
    calculateProgress,
    isNewHighScore,
    generateShareText,
    mergeSettings,
  };
}
