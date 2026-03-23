/**
 * DOM integration tests for the trivia game.
 * These tests verify that the HTML structure and script.js wire up correctly.
 *
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Read the actual HTML file
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Helper: set up the DOM and mock globals before loading script.js
function setupDOM() {
  document.documentElement.innerHTML = '';
  document.write(html);
  document.close();

  // Mock localStorage
  const store = {};
  const localStorageMock = {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

  // Mock Audio elements (they won't actually play in jsdom)
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);

  // Mock fetch to avoid real network calls
  global.fetch = jest.fn();

  // Mock alert
  window.alert = jest.fn();
}

// Helper: simulate a successful API response
function mockFetchSuccess(questions) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({
        response_code: 0,
        results: questions,
      }),
  });
}

// Sample question data
const sampleQuestions = [
  {
    category: 'General Knowledge',
    type: 'multiple',
    difficulty: 'medium',
    question: 'What is the capital of France?',
    correct_answer: 'Paris',
    incorrect_answers: ['London', 'Berlin', 'Madrid'],
  },
  {
    category: 'Science',
    type: 'multiple',
    difficulty: 'easy',
    question: 'What planet is closest to the Sun?',
    correct_answer: 'Mercury',
    incorrect_answers: ['Venus', 'Earth', 'Mars'],
  },
];

// ---------------------------------------------------------------------------
// Tests for HTML structure
// ---------------------------------------------------------------------------
describe('HTML structure', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('contains the game container', () => {
    expect(document.getElementById('gameContainer')).not.toBeNull();
  });

  test('contains the loading element', () => {
    expect(document.getElementById('loading')).not.toBeNull();
  });

  test('contains the game element', () => {
    expect(document.getElementById('game')).not.toBeNull();
  });

  test('contains the game over element', () => {
    expect(document.getElementById('gameOver')).not.toBeNull();
  });

  test('contains the question element', () => {
    expect(document.getElementById('question')).not.toBeNull();
  });

  test('contains the options container', () => {
    expect(document.getElementById('options')).not.toBeNull();
  });

  test('contains the score display', () => {
    expect(document.getElementById('score')).not.toBeNull();
  });

  test('contains the question number display', () => {
    expect(document.getElementById('questionNumber')).not.toBeNull();
  });

  test('contains the timer display', () => {
    expect(document.getElementById('timer')).not.toBeNull();
  });

  test('contains the high score display', () => {
    expect(document.getElementById('highScore')).not.toBeNull();
  });

  test('contains the play again button', () => {
    expect(document.getElementById('playAgainBtn')).not.toBeNull();
  });

  test('contains the share score button', () => {
    expect(document.getElementById('shareScoreBtn')).not.toBeNull();
  });

  test('contains the goodbye button', () => {
    expect(document.getElementById('goodbyeBtn')).not.toBeNull();
  });

  test('contains the settings button', () => {
    expect(document.getElementById('settingsBtn')).not.toBeNull();
  });

  test('contains the settings panel', () => {
    expect(document.getElementById('settingsPanel')).not.toBeNull();
  });

  test('contains the theme toggle button', () => {
    expect(document.getElementById('themeToggle')).not.toBeNull();
  });

  test('contains the pause button', () => {
    expect(document.getElementById('pauseBtn')).not.toBeNull();
  });

  test('contains the resume button', () => {
    expect(document.getElementById('resumeBtn')).not.toBeNull();
  });

  test('contains the progress bar', () => {
    expect(document.getElementById('progressBar')).not.toBeNull();
  });

  test('contains the answer summary container', () => {
    expect(document.getElementById('answerSummary')).not.toBeNull();
  });

  test('contains the goodbye message element', () => {
    expect(document.getElementById('goodbyeMessage')).not.toBeNull();
  });

  test('contains audio elements for sound effects', () => {
    expect(document.getElementById('correctSound')).not.toBeNull();
    expect(document.getElementById('incorrectSound')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests for settings panel
// ---------------------------------------------------------------------------
describe('Settings panel', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('question count select has correct options', () => {
    const select = document.getElementById('questionCount');
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(['5', '10', '15', '20']);
  });

  test('difficulty select has correct options', () => {
    const select = document.getElementById('difficulty');
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(['any', 'easy', 'medium', 'hard']);
  });

  test('category select has "Any Category" as first option', () => {
    const select = document.getElementById('category');
    expect(select.options[0].text).toBe('Any Category');
    expect(select.options[0].value).toBe('');
  });

  test('question count defaults to 10', () => {
    const select = document.getElementById('questionCount');
    expect(select.value).toBe('10');
  });

  test('difficulty defaults to medium', () => {
    const select = document.getElementById('difficulty');
    expect(select.value).toBe('medium');
  });

  test('settings panel is initially hidden', () => {
    const panel = document.getElementById('settingsPanel');
    expect(panel.classList.contains('open')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests for accessibility attributes
// ---------------------------------------------------------------------------
describe('Accessibility', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('game container has role="application"', () => {
    const container = document.getElementById('gameContainer');
    expect(container.getAttribute('role')).toBe('application');
  });

  test('game container has aria-label', () => {
    const container = document.getElementById('gameContainer');
    expect(container.getAttribute('aria-label')).toBe('Trivia Game');
  });

  test('game area has role="region"', () => {
    const game = document.getElementById('game');
    expect(game.getAttribute('role')).toBe('region');
  });

  test('loading element has role="status"', () => {
    const loading = document.getElementById('loading');
    expect(loading.getAttribute('role')).toBe('status');
  });

  test('loading element has aria-live="polite"', () => {
    const loading = document.getElementById('loading');
    expect(loading.getAttribute('aria-live')).toBe('polite');
  });

  test('options container has role="group"', () => {
    const options = document.getElementById('options');
    expect(options.getAttribute('role')).toBe('group');
  });

  test('theme toggle has aria-label', () => {
    const btn = document.getElementById('themeToggle');
    expect(btn.getAttribute('aria-label')).toBe('Toggle Dark/Light Mode');
  });

  test('pause button has aria-label', () => {
    const btn = document.getElementById('pauseBtn');
    expect(btn.getAttribute('aria-label')).toBe('Pause Game');
  });
});

// ---------------------------------------------------------------------------
// Tests for game initialization via script.js
// ---------------------------------------------------------------------------
describe('Game initialization', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setupDOM();
    mockFetchSuccess(sampleQuestions);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('script.js triggers fetch on DOMContentLoaded', async () => {
    // Load the script (which attaches a DOMContentLoaded listener)
    require('../script.js');

    // Manually fire DOMContentLoaded
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // Wait for fetch to resolve
    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalled();
    const callUrl = global.fetch.mock.calls[0][0];
    expect(callUrl).toContain('opentdb.com');
  });
});
