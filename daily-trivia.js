/* Daily Trivia Module */

// State variables
let dailyTriviaActive = false;
let dailyQuestion = null;
let dailyAnswerSelected = false;
let dailyTimerInterval = null;

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
function playCorrectSound() {
    if (typeof window.playCorrectSound === 'function') {
        window.playCorrectSound();
    }
}

// Helper: play incorrect sound (if available)
function playIncorrectSound() {
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
 * Fetch a single random question from the API with retry logic
 */
function fetchDailyQuestion(retries = 3, delay = 1000) {
    console.log('Fetching daily question from API...');
    return fetch('https://opentdb.com/api.php?amount=1&type=multiple')
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
            if (data.response_code === 0 && data.results.length > 0) {
                return data.results[0];
            }
            throw new Error('Failed to fetch daily question: ' + (data.response_message || 'Unknown error'));
        })
        .catch(error => {
            console.error('Error fetching daily question:', error);
            if (retries > 0 && error.message.includes('rate limit')) {
                console.log(`Retrying daily question fetch... ${retries} attempts left`);
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        fetchDailyQuestion(retries - 1, delay * 2)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                });
            }
            throw error;
        });
}

/**
 * Load or fetch today's daily question
 */
function loadDailyQuestion() {
    let question = getTodaysDailyQuestion();
    if (!question) {
        return fetchDailyQuestion()
            .then(newQuestion => {
                saveDailyQuestion(newQuestion);
                return newQuestion;
            });
    }
    return Promise.resolve(question);
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
    const dailyNextContainer = document.getElementById('dailyNextContainer');
    
    // Reset state
    dailyAnswerSelected = false;
    
    // Hide result, show question
    dailyResultEl.style.display = 'none';
    dailyNextContainer.style.display = 'none';
    
    // Display question
    const decodedQuestion = decodeHTMLEntities(question.question);
    dailyQuestionEl.textContent = decodedQuestion;
    
    // Display category and difficulty
    dailyCategoryEl.textContent = question.category;
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
    const dailyNextContainer = document.getElementById('dailyNextContainer');
    
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
        playCorrectSound();
    } else {
        playIncorrectSound();
    }
    
    markDailyAnswered();
    
    // Show countdown to next question
    dailyNextContainer.style.display = 'block';
    startDailyCountdown();
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
    
    if (dailyTimeLeftEl) {
        dailyTimeLeftEl.textContent = formatted;
    }
    if (dailyCountdownEl) {
        dailyCountdownEl.textContent = formatted;
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
 * Initialize daily trivia on page load
 */
window.addEventListener('DOMContentLoaded', () => {
    // Auto-load daily trivia if enabled
    if (localStorage.getItem('dailyTriviaAutoLoad') === 'true') {
        showDailyTrivia();
    }
    
    // Wire up the daily trivia button click handler
    const dailyTriviaBtn = document.getElementById('dailyTriviaBtn');
    if (dailyTriviaBtn) {
        dailyTriviaBtn.addEventListener('click', showDailyTrivia);
    }
});