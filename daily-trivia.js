/* Daily Trivia Module */

// State variables
let dailyTriviaActive = false;
let dailyQuestion = null;
let dailyAnswerSelected = false;
let dailyTimerInterval = null;
let apiToken = localStorage.getItem('daily_opentdb_token') || null;
let focusedDailyOptionIndex = -1;

// Fallback questions for when API is unavailable
const fallbackQuestions = [
    {
        category: "General Knowledge",
        type: "multiple",
        difficulty: "easy",
        question: "What is the largest planet in our solar system?",
        correct_answer: "Jupiter",
        incorrect_answers: ["Saturn", "Neptune", "Uranus"]
    },
    {
        category: "Science",
        type: "multiple",
        difficulty: "medium",
        question: "What is the chemical symbol for gold?",
        correct_answer: "Au",
        incorrect_answers: ["Ag", "Fe", "Cu"]
    },
    {
        category: "Geography",
        type: "multiple",
        difficulty: "easy",
        question: "What is the capital of France?",
        correct_answer: "Paris",
        incorrect_answers: ["London", "Berlin", "Madrid"]
    },
    {
        category: "History",
        type: "multiple",
        difficulty: "medium",
        question: "In what year did World War II end?",
        correct_answer: "1945",
        incorrect_answers: ["1944", "1946", "1943"]
    },
    {
        category: "Entertainment",
        type: "multiple",
        difficulty: "easy",
        question: "Who painted the Mona Lisa?",
        correct_answer: "Leonardo da Vinci",
        incorrect_answers: ["Vincent van Gogh", "Pablo Picasso", "Michelangelo"]
    },
    {
        category: "Sports",
        type: "multiple",
        difficulty: "medium",
        question: "How many players are on a basketball team on the court at one time?",
        correct_answer: "5",
        incorrect_answers: ["6", "7", "4"]
    },
    {
        category: "Science",
        type: "multiple",
        difficulty: "hard",
        question: "What is the powerhouse of the cell?",
        correct_answer: "Mitochondria",
        incorrect_answers: ["Nucleus", "Ribosome", "Golgi apparatus"]
    },
    {
        category: "General Knowledge",
        type: "multiple",
        difficulty: "easy",
        question: "How many continents are there on Earth?",
        correct_answer: "7",
        incorrect_answers: ["6", "5", "8"]
    },
    {
        category: "Geography",
        type: "multiple",
        difficulty: "medium",
        question: "What is the largest ocean on Earth?",
        correct_answer: "Pacific Ocean",
        incorrect_answers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]
    },
    {
        category: "Technology",
        type: "multiple",
        difficulty: "medium",
        question: "What does CPU stand for?",
        correct_answer: "Central Processing Unit",
        incorrect_answers: ["Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"]
    }
];

// Helper: decode HTML entities
function decodeHTMLEntities(text) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    return doc.documentElement.textContent;
}

// Helper: shuffle array
function shuffleAnswers(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Helper: play correct sound (if available)
function tryPlayCorrectSound() {
    if (typeof window.playCorrectSound === 'function') {
        window.playCorrectSound();
    }
}

// Helper: play incorrect sound (if available)
function tryPlayIncorrectSound() {
    if (typeof window.playIncorrectSound === 'function') {
        window.playIncorrectSound();
    }
}

/**
 * Get the current date in Pacific Time (YYYY-MM-DD format)
 */
function getPacificDate() {
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    return pacificTime.toISOString().split('T')[0];
}

/**
 * Get time until next midnight Pacific Time in milliseconds
 */
function getTimeUntilNextMidnightPacific() {
    const now = new Date();
    const pacificNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const nextMidnight = new Date(pacificNow);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    return nextMidnight.getTime() - pacificNow.getTime();
}

/**
 * Format milliseconds to HH:MM:SS
 */
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Check if user has already answered today's question
 */
function hasAnsweredDailyToday() {
    const lastAnsweredDate = localStorage.getItem('dailyTriviaLastAnswered');
    const today = getPacificDate();
    return lastAnsweredDate === today;
}

/**
 * Mark today's question as answered
 */
function markDailyAnswered() {
    const today = getPacificDate();
    localStorage.setItem('dailyTriviaLastAnswered', today);
}

/**
 * Get today's daily question from storage or fetch new one
 */
function getTodaysDailyQuestion() {
    const today = getPacificDate();
    const stored = localStorage.getItem(`dailyTrivia_${today}`);
    if (stored) {
        return JSON.parse(stored);
    }
    return null;
}

/**
 * Save today's question to storage
 */
function saveDailyQuestion(question) {
    const today = getPacificDate();
    localStorage.setItem(`dailyTrivia_${today}`, JSON.stringify(question));
}

/**
 * Get or refresh API token from OpenTDB
 */
function getApiToken() {
    return fetch('https://opentdb.com/api_token.php?command=request')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get API token');
            }
            return response.json();
        })
        .then(data => {
            if (data.response_code === 0 && data.token) {
                return data.token;
            }
            throw new Error('Failed to get API token');
        })
        .catch(error => {
            console.error('Error getting API token:', error);
            return null;
        });
}

/**
 * Get a random fallback question
 */
function getFallbackQuestion() {
    const today = getPacificDate();
    // Use day of year for consistent daily rotation
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const index = dayOfYear % fallbackQuestions.length;
    return fallbackQuestions[index];
}

/**
 * Fetch a single random question from the API with exponential backoff retry logic
 */
function fetchDailyQuestion(retries = 5, delay = 2000) {
    console.log('Fetching daily question from API...');
    
    // Build API URL with token if available
    let apiUrl = 'https://opentdb.com/api.php?amount=1&type=multiple';
    if (apiToken) {
        apiUrl += `&token=${apiToken}`;
    }
    
    return fetch(apiUrl)
        .then(response => {
            if (response.status === 429) {
                throw new Error('API rate limit exceeded');
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Daily API Response:', data);
            
            // Handle token-related errors
            if (data.response_code === 4) {
                // Token empty - get a new one and retry
                console.log('Token exhausted, getting new token...');
                return getApiToken().then(newToken => {
                    apiToken = newToken;
                    localStorage.setItem('daily_opentdb_token', newToken);
                    return fetchDailyQuestion(retries - 1, delay);
                });
            }
            
            if (data.response_code === 0 && data.results.length > 0) {
                return data.results[0];
            }
            
            // Handle rate limit response code
            if (data.response_code === 5) {
                throw new Error('API rate limit exceeded');
            }
            
            throw new Error('Failed to fetch daily question: ' + (data.response_message || 'Unknown error'));
        })
        .catch(error => {
            console.error('Error fetching daily question:', error);
            if (retries > 0 && (error.message.includes('rate limit') || error.message.includes('Network'))) {
                const nextDelay = delay * 2; // Exponential backoff
                console.log(`Retrying daily question fetch in ${delay}ms... ${retries} attempts left`);
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        fetchDailyQuestion(retries - 1, nextDelay)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                });
            }
            // If no more retries or not a rate limit error, use fallback
            console.log('Using fallback question due to API failure');
            return getFallbackQuestion();
        });
}

/**
 * Fetch today's shared question from the committed daily-question.json file.
 * This file is updated daily by GitHub Actions so all users get the same question.
 */
function fetchSharedDailyQuestion() {
    return fetch('daily-question.json?v=' + getPacificDate())
        .then(response => {
            if (!response.ok) throw new Error('daily-question.json not available');
            return response.json();
        })
        .then(data => {
            // Validate the file is for today
            const today = getPacificDate();
            if (data.date !== today) {
                throw new Error(`daily-question.json is dated ${data.date}, expected ${today}`);
            }
            console.log('Loaded shared daily question from daily-question.json');
            return data;
        });
}

/**
 * Load today's daily question:
 * 1. Return localStorage cache if already loaded today
 * 2. Try daily-question.json (shared by GitHub Actions — same for all users)
 * 3. Fall back to direct OpenTDB API call
 */
function loadDailyQuestion() {
    const cached = getTodaysDailyQuestion();
    if (cached) {
        return Promise.resolve(cached);
    }

    return fetchSharedDailyQuestion()
        .catch(err => {
            console.warn('Shared daily-question.json unavailable, falling back to API:', err.message);
            return fetchDailyQuestion();
        })
        .then(question => {
            saveDailyQuestion(question);
            return question;
        });
}

/**
 * Display the daily question
 */
function displayDailyQuestion(question) {
    const dailyQuestionEl = document.getElementById('dailyQuestion');
    const dailyCategoryEl = document.getElementById('dailyCategory');
    const dailyDifficultyEl = document.getElementById('dailyDifficulty');
    const dailyOptionsEl = document.getElementById('dailyOptions');
    const dailyResultEl = document.getElementById('dailyResult');
    const dailyResultTextEl = document.getElementById('dailyResultText');
    const dailySummaryScreen = document.getElementById('dailySummaryScreen');
    
    // Check if all elements exist
    if (!dailyQuestionEl || !dailyCategoryEl || !dailyDifficultyEl || !dailyOptionsEl || !dailyResultEl || !dailyResultTextEl || !dailySummaryScreen) {
        console.error('Missing daily trivia elements');
        return;
    }
    
    // Reset state
    dailyAnswerSelected = false;
    focusedDailyOptionIndex = -1;
    
    // Hide result, show question
    dailyResultEl.style.display = 'none';
    dailySummaryScreen.style.display = 'none';
    document.getElementById('dailyQuestionContainer').style.display = 'block';
    
    // Display question
    const decodedQuestion = decodeHTMLEntities(question.question);
    dailyQuestionEl.textContent = decodedQuestion;
    
    // Display category and difficulty
    dailyCategoryEl.textContent = decodeHTMLEntities(question.category);
    dailyDifficultyEl.textContent = question.difficulty;
    dailyDifficultyEl.className = 'difficulty-badge ' + question.difficulty;
    
    // Clear and create options
    dailyOptionsEl.innerHTML = '';
    const answerOptions = shuffleAnswers([...question.incorrect_answers, question.correct_answer]);
    
    answerOptions.forEach((option, index) => {
        const button = document.createElement('button');
        const decodedOption = decodeHTMLEntities(option);
        button.textContent = decodedOption;
        button.className = 'option';
        button.onclick = () => selectDailyAnswer(button, option, question.correct_answer);
        dailyOptionsEl.appendChild(button);
    });
}

/**
 * Handle daily answer selection
 */
function selectDailyAnswer(button, selectedOption, correctAnswer) {
    if (dailyAnswerSelected) return;
    
    dailyAnswerSelected = true;
    stopDailyTimer();
    
    // Mark selected button
    button.classList.add('selected');
    
    // Check if correct
    const isCorrect = selectedOption === correctAnswer;
    
    // Show result
    const dailyResultEl = document.getElementById('dailyResult');
    const dailyResultTextEl = document.getElementById('dailyResultText');
    const dailySummaryScreen = document.getElementById('dailySummaryScreen');
    
    dailyResultEl.style.display = 'block';
    dailyResultTextEl.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect!';
    dailyResultEl.className = 'daily-result ' + (isCorrect ? 'correct' : 'incorrect');
    
    // Mark correct/incorrect on buttons
    const allButtons = document.getElementById('dailyOptions').querySelectorAll('.option');
    allButtons.forEach(btn => {
        btn.disabled = true;
        const decodedText = decodeHTMLEntities(btn.textContent);
        if (decodedText === correctAnswer) {
            btn.classList.add('correct');
        } else if (btn === button && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Mark as answered and save
    if (isCorrect) {
        tryPlayCorrectSound();
    } else {
        tryPlayIncorrectSound();
    }
    
    markDailyAnswered();
    
    // Show summary screen
    setTimeout(() => {
        document.getElementById('dailyQuestionContainer').style.display = 'none';
        dailySummaryScreen.style.display = 'block';
        startDailyCountdown();
    }, 2000);
}

/**
 * Start the daily timer (countdown to midnight)
 */
function startDailyTimer() {
    stopDailyTimer();
    updateDailyCountdownDisplay();
    dailyTimerInterval = setInterval(updateDailyCountdownDisplay, 1000);
}

/**
 * Stop the daily timer
 */
function stopDailyTimer() {
    if (dailyTimerInterval) {
        clearInterval(dailyTimerInterval);
        dailyTimerInterval = null;
    }
}

/**
 * Update the daily countdown display
 */
function updateDailyCountdownDisplay() {
    const timeLeft = getTimeUntilNextMidnightPacific();
    const formatted = formatTime(timeLeft);
    const dailyTimeLeftEl = document.getElementById('dailyTimeLeft');
    const dailyCountdownEl = document.getElementById('dailyCountdown');
    const dailySummaryCountdownEl = document.getElementById('dailySummaryCountdown');
    
    if (dailyTimeLeftEl) {
        dailyTimeLeftEl.textContent = formatted;
    }
    if (dailyCountdownEl) {
        dailyCountdownEl.textContent = formatted;
    }
    if (dailySummaryCountdownEl) {
        dailySummaryCountdownEl.textContent = formatted;
    }
}

/**
 * Start the countdown after answering (shows time until next question)
 */
function startDailyCountdown() {
    // The countdown display is already being updated by startDailyTimer
    // Just ensure it's running
    if (!dailyTimerInterval) {
        startDailyTimer();
    }
}

/**
 * Show the daily trivia section
 */
function showDailyTrivia() {
    // Hide other sections
    const gameContainer = document.getElementById('gameContainer');
    const goodbyeMessage = document.getElementById('goodbyeMessage');
    if (gameContainer) gameContainer.style.display = 'none';
    if (goodbyeMessage) goodbyeMessage.style.display = 'none';
    
    // Show daily trivia
    const dailyTrivia = document.getElementById('dailyTrivia');
    if (dailyTrivia) {
        dailyTrivia.style.display = 'block';
        dailyTriviaActive = true;
    } else {
        console.error('Daily trivia element not found');
        return;
    }

    if (hasAnsweredDailyToday()) {
        const dailyQuestionContainer = document.getElementById('dailyQuestionContainer');
        const dailySummaryScreen = document.getElementById('dailySummaryScreen');
        if (dailyQuestionContainer) dailyQuestionContainer.style.display = 'none';
        if (dailySummaryScreen) dailySummaryScreen.style.display = 'block';
        startDailyTimer();
        return;
    }
    
    // Load and display the question
    loadDailyQuestion()
        .then(question => {
            dailyQuestion = question;
            displayDailyQuestion(question);
            startDailyTimer();
        })
        .catch(error => {
            console.error('Failed to load daily question:', error);
            const dailyQuestionEl = document.getElementById('dailyQuestion');
            if (dailyQuestionEl) {
                dailyQuestionEl.textContent = 'Error loading question. Please try again later.';
            }
            alert('Unable to load today\'s question. Please try again later.');
            if (dailyTrivia) {
                dailyTrivia.style.display = 'none';
                dailyTriviaActive = false;
            }
        });
}

// Export functions for external use
window.showDailyTrivia = showDailyTrivia;
window.loadDailyQuestion = loadDailyQuestion;
window.displayDailyQuestion = displayDailyQuestion;
window.startDailyTimer = startDailyTimer;
window.stopDailyTimer = stopDailyTimer;
window.updateDailyCountdownDisplay = updateDailyCountdownDisplay;

/**
 * Handle keyboard navigation for daily trivia
 */
function handleDailyKeyboardNavigation(event) {
    const dailyTrivia = document.getElementById('dailyTrivia');
    if (!dailyTrivia || dailyTrivia.style.display !== 'block') return;

    const dailyOptionsEl = document.getElementById('dailyOptions');
    if (!dailyOptionsEl || dailyOptionsEl.children.length === 0) return;

    const options = Array.from(dailyOptionsEl.querySelectorAll('.option'));

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (options.length === 0) return;

        options.forEach(btn => btn.classList.remove('focused'));

        if (event.key === 'ArrowUp') {
            focusedDailyOptionIndex = focusedDailyOptionIndex <= 0 ? options.length - 1 : focusedDailyOptionIndex - 1;
        } else {
            focusedDailyOptionIndex = focusedDailyOptionIndex >= options.length - 1 ? 0 : focusedDailyOptionIndex + 1;
        }

        options[focusedDailyOptionIndex].classList.add('focused');
        options[focusedDailyOptionIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
    }

    if (event.key === 'Enter' && focusedDailyOptionIndex >= 0 && !dailyAnswerSelected) {
        options[focusedDailyOptionIndex].click();
        focusedDailyOptionIndex = -1;
        return;
    }

    if (!dailyAnswerSelected && event.key >= '1' && event.key <= '4') {
        const index = parseInt(event.key) - 1;
        if (options[index]) {
            options[index].click();
            focusedDailyOptionIndex = -1;
        }
    }
}

/**
 * Initialize daily trivia on page load
 */
window.addEventListener('DOMContentLoaded', () => {
    // Initialize API token for better rate limiting
    getApiToken().then(token => {
        if (token) {
            apiToken = token;
            localStorage.setItem('daily_opentdb_token', token);
            console.log('Daily trivia API token initialized');
        }
    });
    
    // Auto-load daily trivia if enabled
    if (localStorage.getItem('dailyTriviaAutoLoad') === 'true') {
        showDailyTrivia();
    }
    
    // Note: Daily trivia button event listener is handled in script.js

    // Add keyboard navigation for daily trivia
    document.addEventListener('keydown', handleDailyKeyboardNavigation);
});