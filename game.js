/**
 * Game Module
 * Main game logic with timer, streaks, hints, high scores
 */

const TriviaGame = (function() {
    // Game state
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let answerSelected = false;
    let userAnswers = [];
    let focusedOptionIndex = -1;
    let timerInterval = null;
    let timeLeft = 30;
    const QUESTION_TIME = 30;
    let streak = 0;
    let maxStreak = 0;
    let fiftyFiftyUsed = false;
    let fiftyFiftyCount = 0;
    
    // High scores
    const HIGH_SCORES_KEY = 'triviaHighScores';
    const MAX_HIGH_SCORES = 10;

    // DOM elements cache
    const elements = {};

    /**
     * Cache DOM elements
     */
    function cacheElements() {
        elements.gameContainer = document.getElementById('gameContainer');
        elements.loading = document.getElementById('loading');
        elements.game = document.getElementById('game');
        elements.gameOver = document.getElementById('gameOver');
        elements.question = document.getElementById('question');
        elements.options = document.getElementById('options');
        elements.nextBtn = document.getElementById('nextBtn');
        elements.score = document.getElementById('score');
        elements.questionNumber = document.getElementById('questionNumber');
        elements.finalScore = document.getElementById('finalScore');
        elements.totalQuestions = document.getElementById('totalQuestions');
        elements.totalQuestionsFinal = document.getElementById('totalQuestionsFinal');
        elements.progressBar = document.getElementById('progressBar');
        elements.questionCategory = document.getElementById('questionCategory');
        elements.questionDifficulty = document.getElementById('questionDifficulty');
        elements.selectionMessage = document.getElementById('selectionMessage');
        elements.answerSummary = document.getElementById('answerSummary');
        elements.goodbyeMessage = document.getElementById('goodbyeMessage');
        elements.quitOverlay = document.getElementById('quitOverlay');
        
        // Create timer element if it doesn't exist
        elements.timer = document.getElementById('questionTimer');
        if (!elements.timer) {
            const timerEl = document.createElement('div');
            timerEl.id = 'questionTimer';
            timerEl.className = 'question-timer';
            const questionContainer = document.getElementById('questionContainer');
            if (questionContainer && questionContainer.parentNode) {
                questionContainer.parentNode.insertBefore(timerEl, questionContainer);
            }
            elements.timer = timerEl;
        }
        
        // Create streak element if it doesn't exist
        elements.streak = document.getElementById('streakDisplay');
        if (!elements.streak) {
            const scoreContainer = document.querySelector('.score-container');
            if (scoreContainer) {
                const streakEl = document.createElement('p');
                streakEl.id = 'streakDisplay';
                streakEl.className = 'streak-display';
                streakEl.innerHTML = 'Streak: <span id="streakValue">0</span> 🔥';
                scoreContainer.appendChild(streakEl);
                elements.streak = streakEl;
            }
        }
        
        // Create 50/50 hint button if it doesn't exist
        elements.fiftyFiftyBtn = document.getElementById('fiftyFiftyBtn');
        if (!elements.fiftyFiftyBtn) {
            const controls = document.querySelector('.controls');
            if (controls) {
                const hintBtn = document.createElement('button');
                hintBtn.id = 'fiftyFiftyBtn';
                hintBtn.className = 'fifty-fifty-btn';
                hintBtn.innerHTML = '50/50';
                hintBtn.title = 'Remove 2 wrong answers';
                hintBtn.addEventListener('click', useFiftyFifty);
                controls.insertBefore(hintBtn, controls.firstChild);
                elements.fiftyFiftyBtn = hintBtn;
            }
        }
    }

    /**
     * Initialize the game
     */
    function init() {
        cacheElements();
        resetGame();
        
        // Show loading
        if (elements.loading) elements.loading.style.display = 'block';
        if (elements.game) elements.game.style.display = 'none';
        if (elements.gameOver) elements.gameOver.style.display = 'none';
        if (elements.goodbyeMessage) elements.goodbyeMessage.style.display = 'none';
        
        // Reset display
        updateScoreDisplay();
        
        // Fetch questions
        fetchQuestions();
    }

    /**
     * Reset game state
     */
    function resetGame() {
        currentQuestionIndex = 0;
        score = 0;
        answerSelected = false;
        userAnswers = [];
        focusedOptionIndex = -1;
        streak = 0;
        maxStreak = 0;
        fiftyFiftyCount = 0;
        fiftyFiftyUsed = false;
        stopTimer();
        
        updateScoreDisplay();
        resetFiftyFifty();
    }

    /**
     * Fetch questions from API with timeout and retry
     */
    function fetchQuestions(retries = 3, delay = 1000) {
        console.log('Fetching questions from API...');
        
        const API_URL = 'https://opentdb.com/api.php';
        const params = TriviaSettings.getQueryParams();
        const url = `${API_URL}?${params.toString()}`;
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        fetch(url, { signal: controller.signal })
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    if (response.status === 429) {
                        throw new Error('Rate limit exceeded (429)');
                    }
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('API Response:', data);
                
                if (data.response_code === 0 && data.results && data.results.length > 0) {
                    questions = data.results;
                    showNextQuestion();
                } else if (data.response_code === 5) {
                    throw new Error('Rate limit exceeded (Code 5)');
                } else {
                    console.error('Failed to fetch questions:', data);
                    if (retries > 0) {
                        console.log(`Retrying... ${retries} attempts left`);
                        setTimeout(() => fetchQuestions(retries - 1, delay * 2), delay);
                    } else {
                        alert('Failed to load questions after multiple attempts. Please try again later.');
                        if (elements.loading) elements.loading.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error('Error fetching questions:', error);
                
                if (error.name === 'AbortError') {
                    console.log('Request timed out');
                }
                
                if (window.location.protocol === 'file:') {
                    alert(
                        'The trivia game cannot load questions when opened locally (file://). ' +
                        'Please run it using a local web server (e.g. http://localhost).'
                    );
                    if (elements.loading) elements.loading.style.display = 'none';
                } else {
                    if (retries > 0) {
                        let waitTime = delay;
                        if (error.message && error.message.includes('Rate limit')) {
                            waitTime = 5000;
                        }
                        console.log(`Retrying... ${retries} attempts left. Waiting ${waitTime}ms`);
                        setTimeout(() => fetchQuestions(retries - 1, waitTime === 5000 ? 5000 : waitTime * 2), waitTime);
                    } else {
                        alert('Failed to connect to the trivia API after multiple attempts. Check your internet connection.');
                        if (elements.loading) elements.loading.style.display = 'none';
                    }
                }
            });
    }

    /**
     * Show the next question
     */
    function showNextQuestion() {
        if (currentQuestionIndex >= questions.length) {
            endGame();
            return;
        }
        
        // Hide loading, show game
        if (elements.loading) elements.loading.style.display = 'none';
        if (elements.game) elements.game.style.display = 'block';
        
        const question = questions[currentQuestionIndex];
        
        // Reset state
        answerSelected = false;
        focusedOptionIndex = -1;
        fiftyFiftyUsed = false;
        hideSelectionMessage();
        resetFiftyFifty();
        
        // Disable next button
        if (elements.nextBtn) elements.nextBtn.disabled = true;
        
        // Update question number
        if (elements.questionNumber) {
            elements.questionNumber.textContent = currentQuestionIndex + 1;
        }
        
        // Update progress bar
        if (elements.progressBar) {
            const progress = ((currentQuestionIndex) / questions.length) * 100;
            elements.progressBar.style.width = progress + '%';
        }
        
        // Display question
        if (elements.question) {
            elements.question.textContent = TriviaUtils.decodeHTMLEntities(question.question);
        }
        
        // Display category and difficulty
        if (elements.questionCategory) {
            elements.questionCategory.textContent = TriviaUtils.decodeHTMLEntities(question.category);
        }
        if (elements.questionDifficulty) {
            elements.questionDifficulty.textContent = question.difficulty;
            elements.questionDifficulty.className = 'difficulty-badge ' + question.difficulty;
        }
        
        // Clear and create options
        if (elements.options) {
            elements.options.innerHTML = '';
            
            const answerOptions = TriviaUtils.shuffleArray([
                ...question.incorrect_answers,
                question.correct_answer
            ]);
            
            answerOptions.forEach((option, index) => {
                const button = document.createElement('button');
                button.textContent = TriviaUtils.decodeHTMLEntities(option);
                button.className = 'option';
                button.dataset.value = option;
                button.addEventListener('click', () => selectAnswer(button, option, question.correct_answer));
                elements.options.appendChild(button);
            });
        }
        
        // Start timer
        startTimer();
    }

    /**
     * Start question timer
     */
    function startTimer() {
        stopTimer();
        timeLeft = QUESTION_TIME;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 5 && timeLeft > 0) {
                TriviaAudio.playTimerWarning();
            }
            
            if (timeLeft <= 0) {
                stopTimer();
                handleTimeUp();
            }
        }, 1000);
    }

    /**
     * Stop question timer
     */
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /**
     * Update timer display
     */
    function updateTimerDisplay() {
        if (elements.timer) {
            elements.timer.textContent = `Time: ${timeLeft}s`;
            elements.timer.className = 'question-timer' + 
                (timeLeft <= 5 ? ' timer-critical' : timeLeft <= 10 ? ' timer-warning' : '');
        }
    }

    /**
     * Handle time up (no answer selected)
     */
    function handleTimeUp() {
        if (answerSelected) return;
        
        const question = questions[currentQuestionIndex];
        const correctAnswer = question.correct_answer;
        
        // Store as incorrect/no-answer
        userAnswers.push({
            question: question.question,
            userAnswer: '(Time out)',
            correctAnswer: correctAnswer,
            isCorrect: false,
            timeExpired: true
        });
        
        // Reset streak
        streak = 0;
        updateScoreDisplay();
        
        // Highlight correct answer
        const decodedCorrect = TriviaUtils.decodeHTMLEntities(correctAnswer);
        const allButtons = elements.options.querySelectorAll('.option');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
            if (btn.textContent === decodedCorrect) {
                btn.classList.add('highlighted-correct');
            }
        });
        
        TriviaAudio.playIncorrect();
        
        answerSelected = true;
        if (elements.nextBtn) elements.nextBtn.disabled = false;
    }

    /**
     * Debounced answer selection
     */
    const debouncedSelectAnswer = TriviaUtils.debounce(function(button, selectedOption, correctAnswer) {
        if (answerSelected) return;
        
        stopTimer();
        answerSelected = true;
        hideSelectionMessage();
        
        button.classList.add('selected');
        
        const isCorrect = selectedOption === correctAnswer;
        
        userAnswers.push({
            question: questions[currentQuestionIndex].question,
            userAnswer: selectedOption,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect
        });
        
        if (isCorrect) {
            // Calculate points based on difficulty and time bonus
            const difficulty = questions[currentQuestionIndex].difficulty;
            const difficultyMultiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
            const timeBonus = Math.ceil(timeLeft / 5);
            const points = difficultyMultiplier + (timeBonus > 0 ? 1 : 0);
            
            score += points;
            streak++;
            if (streak > maxStreak) maxStreak = streak;
            
            TriviaAudio.playCorrect();
            TriviaAudio.playStreak(streak);
            button.classList.add('correct');
        } else {
            streak = 0;
            button.classList.add('incorrect');
            
            const decodedCorrect = TriviaUtils.decodeHTMLEntities(correctAnswer);
            const allButtons = elements.options.querySelectorAll('.option');
            allButtons.forEach(btn => {
                if (btn.textContent === decodedCorrect) {
                    btn.classList.add('correct');
                }
            });
            
            TriviaAudio.playIncorrect();
        }
        
        updateScoreDisplay();
        
        const allButtons = elements.options.querySelectorAll('.option');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        
        if (elements.nextBtn) elements.nextBtn.disabled = false;
    }, 300);

    /**
     * Select an answer
     */
    function selectAnswer(button, selectedOption, correctAnswer) {
        debouncedSelectAnswer(button, selectedOption, correctAnswer);
    }

    /**
     * Use 50/50 hint
     */
    function useFiftyFifty() {
        if (answerSelected || fiftyFiftyUsed) return;
        
        const question = questions[currentQuestionIndex];
        const options = Array.from(elements.options.querySelectorAll('.option'));
        
        // Find wrong answers
        const wrongOptions = options.filter(btn => btn.dataset.value !== question.correct_answer);
        
        if (wrongOptions.length >= 2) {
            // Remove 2 wrong answers
            const toRemove = TriviaUtils.shuffleArray(wrongOptions).slice(0, 2);
            toRemove.forEach(btn => {
                btn.style.opacity = '0.2';
                btn.disabled = true;
                btn.classList.add('fifty-fifty-removed');
            });
            
            fiftyFiftyUsed = true;
            fiftyFiftyCount++;
            
            if (elements.fiftyFiftyBtn) {
                elements.fiftyFiftyBtn.disabled = true;
                elements.fiftyFiftyBtn.classList.add('used');
            }
            
            TriviaAudio.playFiftyFifty();
        }
    }

    /**
     * Reset 50/50 button state
     */
    function resetFiftyFifty() {
        if (elements.fiftyFiftyBtn) {
            elements.fiftyFiftyBtn.disabled = false;
            elements.fiftyFiftyBtn.classList.remove('used');
        }
        
        // Clear any fifty-fifty styling
        if (elements.options) {
            const options = elements.options.querySelectorAll('.option');
            options.forEach(btn => {
                btn.style.opacity = '';
                btn.classList.remove('fifty-fifty-removed');
            });
        }
    }

    /**
     * Update score and streak display
     */
    function updateScoreDisplay() {
        if (elements.score) elements.score.textContent = score;
        
        const streakValue = document.getElementById('streakValue');
        if (streakValue) streakValue.textContent = streak;
        
        // Add animation class when streak increases
        if (streak > 1 && elements.streak) {
            elements.streak.classList.add('streak-animate');
            setTimeout(() => {
                if (elements.streak) elements.streak.classList.remove('streak-animate');
            }, 500);
        }
    }

    /**
     * Move to next question
     */
    function nextQuestion() {
        if (!answerSelected) {
            handleNoAnswer();
            return;
        }
        
        currentQuestionIndex++;
        showNextQuestion();
    }

    /**
     * Handle no answer selected
     */
    function handleNoAnswer() {
        const question = questions[currentQuestionIndex];
        const correctAnswer = question.correct_answer;
        
        userAnswers.push({
            question: question.question,
            userAnswer: '(No answer)',
            correctAnswer: correctAnswer,
            isCorrect: false
        });
        
        streak = 0;
        updateScoreDisplay();
        
        const decodedCorrect = TriviaUtils.decodeHTMLEntities(correctAnswer);
        const allButtons = elements.options.querySelectorAll('.option');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
            if (btn.textContent === decodedCorrect) {
                btn.classList.add('highlighted-correct');
            }
        });
        
        TriviaAudio.playIncorrect();
        showSelectionMessage();
        
        answerSelected = true;
        if (elements.nextBtn) elements.nextBtn.disabled = false;
    }

    /**
     * Show/hide selection message
     */
    function showSelectionMessage() {
        if (elements.selectionMessage) {
            elements.selectionMessage.style.display = 'block';
        }
    }

    function hideSelectionMessage() {
        if (elements.selectionMessage) {
            elements.selectionMessage.style.display = 'none';
        }
    }

    /**
     * End game
     */
    function endGame() {
        stopTimer();
        
        if (elements.game) elements.game.style.display = 'none';
        if (elements.gameOver) elements.gameOver.style.display = 'block';
        
        // Count correct answers for display (score contains total points with multipliers)
        const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
        if (elements.finalScore) elements.finalScore.textContent = correctAnswers;
        
        TriviaAudio.playGameOver(score, questions.length);
        
        displayAnswerSummary();
        saveHighScore();
        
        // Check for perfect score
        if (correctAnswers === questions.length) {
            showConfetti();
        }
    }

    /**
     * Display answer summary
     */
    function displayAnswerSummary() {
        const summaryContainer = elements.answerSummary;
        if (!summaryContainer) return;
        
        summaryContainer.innerHTML = '<h3>Your Answers:</h3>';
        
        userAnswers.forEach((answer, index) => {
            const item = document.createElement('div');
            item.className = `answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;
            
            const decodedQuestion = TriviaUtils.decodeHTMLEntities(answer.question);
            const questionText = document.createElement('div');
            questionText.className = 'question-text';
            questionText.innerHTML = `Q${index + 1}: ${decodedQuestion.substring(0, 50)}${decodedQuestion.length > 50 ? '...' : ''}`;
            
            const yourAnswer = document.createElement('div');
            yourAnswer.className = `your-answer ${answer.isCorrect ? 'correct' : 'incorrect'}`;
            yourAnswer.innerHTML = `
                Your answer: ${TriviaUtils.decodeHTMLEntities(answer.userAnswer)}
                ${!answer.isCorrect ? '<br>Correct: ' + TriviaUtils.decodeHTMLEntities(answer.correctAnswer) : ''}
            `;
            
            item.appendChild(questionText);
            item.appendChild(yourAnswer);
            summaryContainer.appendChild(item);
        });
    }

    /**
     * Save high score
     */
    function saveHighScore() {
        const correctCount = userAnswers.filter(a => a.isCorrect).length;
        const scoreData = {
            date: new Date().toISOString(),
            score: score,
            correct: correctCount,
            total: questions.length,
            maxStreak: maxStreak,
            difficulty: TriviaSettings.get().difficulty || 'mixed',
            fiftyFiftyUsed: fiftyFiftyCount > 0
        };
        
        let highScores = TriviaUtils.safeStorage.get(HIGH_SCORES_KEY, []);
        highScores.push(scoreData);
        
        // Sort by score descending
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top scores
        highScores = highScores.slice(0, MAX_HIGH_SCORES);
        
        TriviaUtils.safeStorage.set(HIGH_SCORES_KEY, highScores);
    }

    /**
     * Get high scores
     */
    function getHighScores() {
        return TriviaUtils.safeStorage.get(HIGH_SCORES_KEY, []);
    }

    /**
     * Clear high scores
     */
    function clearHighScores() {
        TriviaUtils.safeStorage.remove(HIGH_SCORES_KEY);
    }

    /**
     * Show confetti animation for perfect score
     */
    function showConfetti() {
        if (TriviaUtils.prefersReducedMotion()) return;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff'];
        
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        
        let animationId;
        let frameCount = 0;
        const maxFrames = 300; // 5 seconds at 60fps
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });
            
            frameCount++;
            if (frameCount < maxFrames) {
                animationId = requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        }
        
        animate();
        
        // Remove after timeout as fallback
        setTimeout(() => {
            if (animationId) cancelAnimationFrame(animationId);
            const c = document.getElementById('confetti-canvas');
            if (c) c.remove();
        }, 5500);
    }

    /**
     * Keyboard navigation
     */
    function handleKeyboard(event) {
        if (!elements.game || elements.game.style.display !== 'block') return;
        if (!elements.options || elements.options.children.length === 0) return;
        
        const options = Array.from(elements.options.querySelectorAll('.option:not(.disabled):not(.fifty-fifty-removed)'));
        
        // Arrow navigation
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            if (options.length === 0) return;
            
            options.forEach(btn => btn.classList.remove('focused'));
            
            if (event.key === 'ArrowUp') {
                focusedOptionIndex = focusedOptionIndex <= 0 ? options.length - 1 : focusedOptionIndex - 1;
            } else {
                focusedOptionIndex = focusedOptionIndex >= options.length - 1 ? 0 : focusedOptionIndex + 1;
            }
            
            options[focusedOptionIndex].classList.add('focused');
            options[focusedOptionIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            return;
        }
        
        // Enter to select focused option
        if (event.key === 'Enter' && focusedOptionIndex >= 0 && !answerSelected) {
            options[focusedOptionIndex].click();
            focusedOptionIndex = -1;
            return;
        }
        
        // Number keys 1-4 to select options
        if (!answerSelected && event.key >= '1' && event.key <= '4') {
            const index = parseInt(event.key) - 1;
            if (options[index]) {
                options[index].click();
                focusedOptionIndex = -1;
            }
            return;
        }
        
        // H key for 50/50 hint
        if (event.key.toLowerCase() === 'h' && !answerSelected && !fiftyFiftyUsed) {
            useFiftyFifty();
            return;
        }
        
        // Enter to proceed to next question
        if (event.key === 'Enter' && elements.nextBtn && !elements.nextBtn.disabled) {
            nextQuestion();
            return;
        }
        
        // Spacebar to proceed (alternative)
        if (event.key === ' ' && elements.nextBtn && !elements.nextBtn.disabled) {
            event.preventDefault();
            nextQuestion();
            return;
        }
        
        // Escape to quit
        if (event.key === 'Escape') {
            showQuitConfirmation();
        }
    }

    /**
     * Show quit confirmation
     */
    function showQuitConfirmation() {
        if (elements.quitOverlay) {
            elements.quitOverlay.classList.add('open');
            trapFocus(elements.quitOverlay);
        }
    }

    /**
     * Confirm quit
     */
    function confirmQuit() {
        if (elements.quitOverlay) {
            elements.quitOverlay.classList.remove('open');
        }
        stopTimer();
        goHome();
    }

    /**
     * Cancel quit
     */
    function cancelQuit() {
        if (elements.quitOverlay) {
            elements.quitOverlay.classList.remove('open');
        }
    }

    /**
     * Go home to mode selection
     */
    function goHome() {
        stopTimer();
        
        const modeSelection = document.getElementById('modeSelection');
        if (elements.gameContainer) elements.gameContainer.style.display = 'none';
        if (elements.gameOver) elements.gameOver.style.display = 'none';
        
        const dailyTrivia = document.getElementById('dailyTrivia');
        if (dailyTrivia) dailyTrivia.style.display = 'none';
        
        if (modeSelection) {
            modeSelection.style.display = 'block';
            modeSelection.classList.add('fade-in');
        }
    }

    /**
     * Focus trap for modal dialogs
     */
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (firstFocusable) firstFocusable.focus();
        
        element.addEventListener('keydown', function(e) {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
    }

    /**
     * Get current game state for sharing
     */
    function getShareData() {
        return {
            score: score,
            totalQuestions: questions.length,
            streak: maxStreak,
            hasHints: fiftyFiftyCount > 0
        };
    }

    return {
        init,
        resetGame,
        selectAnswer,
        nextQuestion,
        handleKeyboard,
        showQuitConfirmation,
        confirmQuit,
        cancelQuit,
        goHome,
        getShareData,
        getHighScores,
        clearHighScores,
        useFiftyFifty
    };
})();

// Export for global use
window.TriviaGame = TriviaGame;
