const {
  shuffleAnswers,
  decodeHTMLEntities,
  buildApiUrl,
  validateApiResponse,
  createAnswerRecord,
  calculateProgress,
  isNewHighScore,
  generateShareText,
  mergeSettings,
} = require('../game-logic');

// ---------------------------------------------------------------------------
// shuffleAnswers
// ---------------------------------------------------------------------------
describe('shuffleAnswers', () => {
  test('returns an array of the same length', () => {
    const input = ['A', 'B', 'C', 'D'];
    const result = shuffleAnswers(input);
    expect(result).toHaveLength(input.length);
  });

  test('contains all original elements', () => {
    const input = ['A', 'B', 'C', 'D'];
    const result = shuffleAnswers(input);
    expect(result.sort()).toEqual(input.sort());
  });

  test('does not mutate the original array', () => {
    const input = ['A', 'B', 'C', 'D'];
    const copy = [...input];
    shuffleAnswers(input);
    expect(input).toEqual(copy);
  });

  test('handles an empty array', () => {
    expect(shuffleAnswers([])).toEqual([]);
  });

  test('handles a single-element array', () => {
    expect(shuffleAnswers(['A'])).toEqual(['A']);
  });

  test('produces different orderings over many runs (probabilistic)', () => {
    const input = ['A', 'B', 'C', 'D'];
    const results = new Set();
    for (let i = 0; i < 50; i++) {
      results.add(JSON.stringify(shuffleAnswers(input)));
    }
    // With 4 elements there are 24 permutations; over 50 runs we should see
    // more than 1 unique ordering.
    expect(results.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// decodeHTMLEntities
// ---------------------------------------------------------------------------
describe('decodeHTMLEntities', () => {
  test('decodes &amp; entity', () => {
    expect(decodeHTMLEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });

  test('decodes &lt; and &gt; entities', () => {
    expect(decodeHTMLEntities('5 &lt; 10 &gt; 3')).toBe('5 < 10 > 3');
  });

  test('decodes &quot; entity', () => {
    expect(decodeHTMLEntities('She said &quot;hello&quot;')).toBe(
      'She said "hello"'
    );
  });

  test('decodes &#039; entity', () => {
    expect(decodeHTMLEntities("It&#039;s fine")).toBe("It's fine");
  });

  test('returns plain text unchanged', () => {
    expect(decodeHTMLEntities('Hello World')).toBe('Hello World');
  });

  test('handles empty string', () => {
    expect(decodeHTMLEntities('')).toBe('');
  });

  test('decodes multiple mixed entities', () => {
    const input = '&lt;b&gt;Bold &amp; &quot;Italic&quot;&lt;/b&gt;';
    expect(decodeHTMLEntities(input)).toBe('<b>Bold & "Italic"</b>');
  });
});

// ---------------------------------------------------------------------------
// buildApiUrl
// ---------------------------------------------------------------------------
describe('buildApiUrl', () => {
  const baseUrl = 'https://opentdb.com/api.php';

  test('builds URL with all settings', () => {
    const settings = { amount: 10, difficulty: 'medium', category: '9', type: 'multiple' };
    const url = buildApiUrl(baseUrl, settings);
    expect(url).toContain(baseUrl);
    expect(url).toContain('amount=10');
    expect(url).toContain('difficulty=medium');
    expect(url).toContain('category=9');
    expect(url).toContain('type=multiple');
  });

  test('omits empty string values as empty params', () => {
    const settings = { amount: 10, difficulty: '', category: '', type: 'multiple' };
    const url = buildApiUrl(baseUrl, settings);
    expect(url).toContain('amount=10');
    expect(url).toContain('type=multiple');
    // Empty values are still present as params with empty values
    expect(url).toContain('difficulty=');
  });

  test('handles empty settings object', () => {
    const url = buildApiUrl(baseUrl, {});
    expect(url).toBe(`${baseUrl}?`);
  });
});

// ---------------------------------------------------------------------------
// validateApiResponse
// ---------------------------------------------------------------------------
describe('validateApiResponse', () => {
  test('returns valid for correct response', () => {
    const data = { response_code: 0, results: [{ question: 'Test?' }] };
    expect(validateApiResponse(data)).toEqual({ valid: true });
  });

  test('returns invalid for null data', () => {
    const result = validateApiResponse(null);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No data received');
  });

  test('returns invalid for undefined data', () => {
    const result = validateApiResponse(undefined);
    expect(result.valid).toBe(false);
  });

  test('returns invalid for non-zero response_code', () => {
    const data = { response_code: 1, results: [] };
    const result = validateApiResponse(data);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('API response code: 1');
  });

  test('returns invalid for empty results array', () => {
    const data = { response_code: 0, results: [] };
    const result = validateApiResponse(data);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No results in response');
  });

  test('returns invalid when results is missing', () => {
    const data = { response_code: 0 };
    const result = validateApiResponse(data);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createAnswerRecord
// ---------------------------------------------------------------------------
describe('createAnswerRecord', () => {
  const question = {
    question: 'What is 2+2?',
    correct_answer: '4',
    incorrect_answers: ['3', '5', '6'],
  };

  test('marks correct answer as isCorrect: true', () => {
    const record = createAnswerRecord(question, '4');
    expect(record.isCorrect).toBe(true);
    expect(record.userAnswer).toBe('4');
    expect(record.correctAnswer).toBe('4');
    expect(record.question).toBe('What is 2+2?');
  });

  test('marks incorrect answer as isCorrect: false', () => {
    const record = createAnswerRecord(question, '3');
    expect(record.isCorrect).toBe(false);
    expect(record.userAnswer).toBe('3');
    expect(record.correctAnswer).toBe('4');
  });
});

// ---------------------------------------------------------------------------
// calculateProgress
// ---------------------------------------------------------------------------
describe('calculateProgress', () => {
  test('returns 0 at the start', () => {
    expect(calculateProgress(0, 10)).toBe(0);
  });

  test('returns 50 at halfway', () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  test('returns 100 at the end', () => {
    expect(calculateProgress(10, 10)).toBe(100);
  });

  test('returns 0 when totalQuestions is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  test('returns 0 when totalQuestions is negative', () => {
    expect(calculateProgress(3, -1)).toBe(0);
  });

  test('calculates fractional progress correctly', () => {
    const result = calculateProgress(1, 3);
    expect(result).toBeCloseTo(33.33, 1);
  });
});

// ---------------------------------------------------------------------------
// isNewHighScore
// ---------------------------------------------------------------------------
describe('isNewHighScore', () => {
  test('returns true when score exceeds high score', () => {
    expect(isNewHighScore(10, 5)).toBe(true);
  });

  test('returns false when score equals high score', () => {
    expect(isNewHighScore(5, 5)).toBe(false);
  });

  test('returns false when score is below high score', () => {
    expect(isNewHighScore(3, 5)).toBe(false);
  });

  test('returns true when high score is 0 and score is positive', () => {
    expect(isNewHighScore(1, 0)).toBe(true);
  });

  test('returns false when both are 0', () => {
    expect(isNewHighScore(0, 0)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateShareText
// ---------------------------------------------------------------------------
describe('generateShareText', () => {
  test('includes score and total', () => {
    const text = generateShareText(7, 10, 'https://example.com');
    expect(text).toContain('7/10');
  });

  test('includes the URL', () => {
    const url = 'https://enricjake.github.io/SimpleTriviaGame/';
    const text = generateShareText(5, 10, url);
    expect(text).toContain(url);
  });

  test('includes the challenge phrase', () => {
    const text = generateShareText(5, 10, 'https://example.com');
    expect(text).toContain('Can you beat my score?');
  });
});

// ---------------------------------------------------------------------------
// mergeSettings
// ---------------------------------------------------------------------------
describe('mergeSettings', () => {
  const defaults = { amount: 10, difficulty: 'medium', category: '', type: 'multiple' };

  test('returns defaults when saved is null', () => {
    expect(mergeSettings(defaults, null)).toEqual(defaults);
  });

  test('returns defaults when saved is undefined', () => {
    expect(mergeSettings(defaults, undefined)).toEqual(defaults);
  });

  test('overrides defaults with saved values', () => {
    const saved = { amount: 20, difficulty: 'hard' };
    const result = mergeSettings(defaults, saved);
    expect(result.amount).toBe(20);
    expect(result.difficulty).toBe('hard');
    expect(result.category).toBe('');
    expect(result.type).toBe('multiple');
  });

  test('does not mutate defaults object', () => {
    const defaultsCopy = { ...defaults };
    mergeSettings(defaults, { amount: 5 });
    expect(defaults).toEqual(defaultsCopy);
  });

  test('adds extra keys from saved', () => {
    const saved = { customKey: 'value' };
    const result = mergeSettings(defaults, saved);
    expect(result.customKey).toBe('value');
  });
});
