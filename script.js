document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const gameContainer = document.getElementById('gameContainer');
    const loadingElement = document.getElementById('loading');
    const gameElement = document.getElementById('game');
    const gameOverElement = document.getElementById('gameOver');
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const scoreElement = document.getElementById('score');
    const questionNumberElement = document.getElementById('questionNumber');
    const finalScoreElement = document.getElementById('finalScore');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const goodbyeMessage = document.getElementById('goodbyeMessage');

    // Game state
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let answerSelected = false;
    let userAnswers = [];
    let isPaused = false;
    let timer = null;
    let timeLeft = 10;
    let highScore = 0;

    // API Config
    const API_URL = 'https://opentdb.com/api.php';
    let settings = {
        amount: 10,
        difficulty: 'medium',
        category: '',
        type: 'multiple' // Only multiple choice questions
    };

    // Settings elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const questionCountSelect = document.getElementById('questionCount');
    const difficultySelect = document.getElementById('difficulty');
    const categorySelect = document.getElementById('category');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // Web Audio API context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    /**
     * Play a success/positive sound (ascending tones)
     */
    function playCorrectSound() {
        try {
            // Resume context if suspended (browser autoplay policy)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play two ascending notes (C5 to E5)
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log("Audio playback failed:", e);
        }
    }
    
    /**
     * Play game over sound based on performance (score percentage)
     * < 50%: Low descending tones (disappointing)
     * 50-79%: Medium neutral tones
     * >= 80%: High ascending celebration tones
     */
    function playGameOverSound(score, totalQuestions) {
        try {
            // Resume context if suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const percentage = (score / totalQuestions) * 100;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            
            if (percentage < 50) {
                // Low score: descending sad tones (C4 to A3)
                oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
                oscillator.frequency.setValueAtTime(220.00, audioContext.currentTime + 0.2); // A3
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            } else if (percentage < 80) {
                // Medium score: neutral repeating tone (E4)
                oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime); // E4
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            } else {
                // High score: celebration - ascending arpeggio (C5-E5-G5)
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }
        } catch (e) {
            console.log("Audio playback failed:", e);
        }
    }
    
    /**
     * Play an error/negative sound (descending tones)
     */
    function playIncorrectSound() {
        try {
            // Resume context if suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play two descending notes (A4 to F4)
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.15); // F4
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.35);
        } catch (e) {
            console.log("Audio playback failed:", e);
        }
    }

    // Toggle settings panel
    function toggleSettings() {
        const isOpening = !settingsPanel.classList.contains('open');
        settingsPanel.classList.toggle('open');
        
        // Pause game when opening settings, resume when closing
        if (isOpening) {
            pauseGame();
        } else {
            // Only resume if not paused by other means (check if pause overlay is open)
            const pauseOverlay = document.getElementById('pauseOverlay');
            if (pauseOverlay && pauseOverlay.classList.contains('open')) {
                // Keep it paused if pause overlay is manually opened
            } else {
                resumeGame();
            }
        }
    }

    // Save settings
    function saveSettings() {
        settings.amount = parseInt(questionCountSelect.value);
        settings.difficulty = difficultySelect.value === 'any' ? '' : difficultySelect.value;
        settings.category = categorySelect.value;
        
        // Save to localStorage
        localStorage.setItem('triviaSettings', JSON.stringify(settings));
        
        // Hide settings panel
        settingsPanel.classList.remove('open');
        
        // Resume game if it was paused by settings
        if (window.isPaused) {
            const pauseOverlay = document.getElementById('pauseOverlay');
            if (pauseOverlay && !pauseOverlay.classList.contains('open')) {
                resumeGame();
            }
        }
        
        // Restart game with new settings
        initGame();
    }

    // Load saved settings
    function loadSettings() {
        const savedSettings = localStorage.getItem('triviaSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            settings = { ...settings, ...parsed };
            
            // Update select elements
            questionCountSelect.value = settings.amount || 10;
            difficultySelect.value = settings.difficulty || 'medium';
            categorySelect.value = settings.category || '';
        }
    }

    // Initialize the game
    function initGame() {
        currentQuestionIndex = 0;
        score = 0;
        answerSelected = false;
        timeLeft = 10;
        
        // Load high score from localStorage
        const savedHighScore = localStorage.getItem('triviaHighScore');
        if (savedHighScore !== null) {
            highScore = parseInt(savedHighScore);
        }
        
        // Show loading screen
        loadingElement.style.display = 'block';
        gameElement.style.display = 'none';
        gameOverElement.style.display = 'none';
        goodbyeMessage.style.display = 'none';
        
        // Reset score display
        scoreElement.textContent = '0';
        questionNumberElement.textContent = '0';
        document.getElementById('timer').textContent = timeLeft;
        document.getElementById('highScore').textContent = highScore;
        
        // Fetch questions from API
        fetchQuestions();
    }

    // Fetch questions from Open Trivia API with retry logic
    function fetchQuestions(retries = 3, delay = 1000) {
        console.log('Fetching questions from API...');
        
        // Build API URL with settings
        const queryParams = new URLSearchParams(settings);
        const url = `${API_URL}?${queryParams.toString()}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('API Response:', data);
                
                if (data.response_code === 0 && data.results.length > 0) {
                    questions = data.results;
                    showNextQuestion();
                } else {
                    console.error('Failed to fetch questions:', data);
                    if (retries > 0) {
                        console.log(`Retrying... ${retries} attempts left`);
                        setTimeout(() => fetchQuestions(retries - 1, delay * 2), delay);
                    } else {
                        alert('Failed to load questions after multiple attempts. Please try again later.');
                        loadingElement.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching questions:', error);
                
                if (window.location.protocol === 'file:') {
                    alert(
                        'The trivia game cannot load questions when opened locally (file://). ' +
                        'Please run it using a local web server (e.g. http://localhost).'
                    );
                } else {
                    if (retries > 0) {
                        console.log(`Retrying due to network error... ${retries} attempts left`);
                        setTimeout(() => fetchQuestions(retries - 1, delay * 2), delay);
                    } else {
                        alert('Failed to connect to the trivia API after multiple attempts. Check your internet connection.');
                    }
                }
                loadingElement.style.display = 'none';
            });
    }

    // Show the next question
    function showNextQuestion() {
        if (currentQuestionIndex < questions.length) {
            // Hide loading and show game
            loadingElement.style.display = 'none';
            gameElement.style.display = 'block';

            const question = questions[currentQuestionIndex];
            
            // Reset answer state
            answerSelected = false;
            
            // Reset timer
            timeLeft = 10;
            document.getElementById('timer').textContent = timeLeft;
            startTimer();

            // Display question number
            questionNumberElement.textContent = currentQuestionIndex + 1;
            
            // Update progress bar
            const progress = ((currentQuestionIndex) / questions.length) * 100;
            document.getElementById('progressBar').style.width = progress + '%';

            // Display question
            let decodedQuestion = decodeHTMLEntities(question.question);
            questionElement.textContent = decodedQuestion;
            
            // Display category and difficulty
            const categoryElement = document.getElementById('questionCategory');
            const difficultyElement = document.getElementById('questionDifficulty');
            categoryElement.textContent = question.category;
            difficultyElement.textContent = question.difficulty;
            difficultyElement.className = 'difficulty-badge ' + question.difficulty;

            // Clear previous options
            optionsElement.innerHTML = '';

            // Create and shuffle answer options
            const answerOptions = shuffleAnswers([
                ...question.incorrect_answers,
                question.correct_answer
            ]);

            // Create option buttons directly in optionsElement
            answerOptions.forEach((option, index) => {
                const button = document.createElement('button');
                let decodedOption = decodeHTMLEntities(option);
                button.textContent = decodedOption;
                button.className = 'option';
                button.onclick = () => selectAnswer(button, option, question.correct_answer);
                optionsElement.appendChild(button);
            });
        } else {
            // Game over
            endGame();
        }
    }

    // Shuffle answers array
    function shuffleAnswers(array) {
        let shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Timer functions
    function startTimer() {
        if (timer) {
            clearInterval(timer);
        }
        timer = setInterval(() => {
            timeLeft--;
            document.getElementById('timer').textContent = timeLeft;
            
            if (timeLeft <= 0) {
                stopTimer();
                // Time's up - automatically select an answer as incorrect
                if (!answerSelected) {
                    answerSelected = true;
                    // Disable all option buttons
                    if (optionsElement) {
                        const allButtons = optionsElement.querySelectorAll('.option');
                        allButtons.forEach(btn => {
                            btn.disabled = true;
                            btn.classList.add('disabled');
                        });
                    }
                    // Play incorrect sound for timeout
                    playIncorrectSound();
                    
                    // Store user's answer as incorrect (null/empty indicates no answer)
                    const currentQuestion = questions[currentQuestionIndex];
                    userAnswers.push({
                        question: currentQuestion.question,
                        userAnswer: 'No answer (timeout)',
                        correctAnswer: currentQuestion.correct_answer,
                        isCorrect: false
                    });
                    
                    // Automatically show next question after 2 seconds
                    const indexAtSelection = currentQuestionIndex;
                    setTimeout(() => {
                        if (currentQuestionIndex === indexAtSelection) {
                            nextQuestion();
                        }
                    }, 2000);
                }
            }
        }, 1000);
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    // Select an answer
    function selectAnswer(button, selectedOption, correctAnswer) {
        if (answerSelected) return;

        answerSelected = true;
        stopTimer();

        // Mark selected button as yellow (pending verification)
        button.classList.add('selected');

        // Check if answer is correct
        const isCorrect = selectedOption === correctAnswer;

        // Store user's answer for summary
        const currentQuestion = questions[currentQuestionIndex];
        userAnswers.push({
            question: currentQuestion.question,
            userAnswer: selectedOption,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect
        });

        if (isCorrect) {
            score++;
            scoreElement.textContent = score;
            button.classList.add('correct');
            // Play correct sound
            playCorrectSound();
        } else {
            button.classList.add('incorrect');

            // Show correct answer
            const allButtons = optionsElement.querySelectorAll('.option');
            allButtons.forEach(btn => {
                let decodedText = decodeHTMLEntities(btn.textContent);
                if (decodedText === correctAnswer) {
                    btn.classList.add('correct');
                }
            });
            // Play incorrect sound
            playIncorrectSound();
        }

        // Update question number
        questionNumberElement.textContent = currentQuestionIndex + 1;

        // Disable all option buttons
        const allButtons = optionsElement.querySelectorAll('.option');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });

        // Automatically show next question after 2 seconds
        const indexAtSelection = currentQuestionIndex;
        setTimeout(() => {
            if (currentQuestionIndex === indexAtSelection) {
                nextQuestion();
            }
        }, 2000);
    }

    // Move to next question
    function nextQuestion() {
        currentQuestionIndex++;
        showNextQuestion();
    }

    // End game
    function endGame() {
        gameElement.style.display = 'none';
        gameOverElement.style.display = 'block';
        finalScoreElement.textContent = score;
        
        // Update and save high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('triviaHighScore', highScore);
            document.getElementById('highScore').textContent = highScore;
        }
        
        // Play game over sound based on score percentage
        playGameOverSound(score, questions.length);
        
        // Display answer summary
        displayAnswerSummary();
    }

    // Display answer summary
  /**
 * Displays a summary of the user's answers.
 */
function displayAnswerSummary() {
  const summaryContainer = document.getElementById('answerSummary');
  if (!summaryContainer) {
    console.error('Element with id "answerSummary" not found.');
    return;
  }

  summaryContainer.innerHTML = '<h3>Your Answers:</h3>';

  userAnswers.forEach((answer, index) => {
    const answerItem = createAnswerItem(answer, index);
    summaryContainer.appendChild(answerItem);
  });
}

/**
 * Creates a single answer item element.
 *
 * @param {Object} answer - The answer object.
 * @param {number} index - The index of the answer.
 * @returns {HTMLElement} The answer item element.
 */
function createAnswerItem(answer, index) {
  const item = document.createElement('div');
  item.className = `answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;

  const questionText = document.createElement('div');
  questionText.className = 'question-text';
  questionText.innerHTML = `Q${index + 1}: ${decodeHTMLEntities(answer.question.substring(0, 50))}${answer.question.length > 50 ? '...' : ''}`;

  const yourAnswer = document.createElement('div');
  yourAnswer.className = `your-answer ${answer.isCorrect ? 'correct' : 'incorrect'}`;
  yourAnswer.innerHTML = `
    Your answer: ${decodeHTMLEntities(answer.userAnswer)}
    ${!answer.isCorrect ? '<br>Correct: ' + decodeHTMLEntities(answer.correctAnswer) : ''}
  `;

  item.appendChild(questionText);
  item.appendChild(yourAnswer);

  return item;
}


    // Share score
    function shareScore() {
        const shareText = `I scored ${score}/${questions.length} in the Trivia Challenge! Can you beat my score? https://enricjake.github.io/SimpleTriviaGame/`;
        
        // Try to copy to clipboard with multiple fallback methods
        let copySuccess = false;
        
        // Method 1: Modern Clipboard API (secure contexts only)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareText).then(() => {
                updateShareButton('Copied!');
                copySuccess = true;
            }).catch(err => {
                console.log('Clipboard API failed, trying fallback:', err);
                tryFallbackCopy(shareText);
            });
        } else {
            // Method 2: Direct fallback for non-secure contexts
            tryFallbackCopy(shareText);
        }
        
        // Show social sharing options
        showSocialSharingOptions(shareText);
    }

    // Fallback copy method
    function tryFallbackCopy(text) {
        try {
            // Create a hidden textarea
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            
            // Select and copy
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            
            // Clean up
            document.body.removeChild(textArea);
            
            if (successful) {
                updateShareButton('Copied!');
            } else {
                showManualCopyDialog(text);
            }
        } catch (err) {
            console.error('All copy methods failed:', err);
            showManualCopyDialog(text);
        }
    }

    // Update share button with feedback
    function updateShareButton(message) {
        const shareBtn = document.getElementById('shareScoreBtn');
        const originalText = shareBtn.textContent;
        shareBtn.textContent = message;
        setTimeout(() => {
            shareBtn.textContent = originalText;
        }, 2000);
    }

    // Show manual copy dialog
    function showManualCopyDialog(text) {
        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            text-align: center;
        `;
        
        content.innerHTML = `
            <h3>Copy Your Score</h3>
            <p>Automatic copy failed. Please copy the text below manually:</p>
            <textarea readonly style="width: 100%; height: 60px; margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">${text}</textarea>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Auto-select the text
        const textarea = content.querySelector('textarea');
        textarea.select();
        textarea.focus();
        
        // Close on background click
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }
    
    // Show social sharing options
    function showSocialSharingOptions(shareText) {
        // Create social sharing container
        let socialContainer = document.getElementById('socialSharingContainer');
        if (!socialContainer) {
            socialContainer = document.createElement('div');
            socialContainer.id = 'socialSharingContainer';
            socialContainer.className = 'social-sharing-container';
            socialContainer.innerHTML = `
                <div class="social-sharing-content">
                    <h3>Share your score:</h3>
                    <div class="social-sharing-buttons">
                         <button onclick="shareToWhatsApp('${encodeURIComponent(shareText)}')" class="social-btn whatsapp">
                             <i class="fa-brands fa-whatsapp"></i> WhatsApp
                         </button>
                         <button onclick="shareToX('${encodeURIComponent(shareText)}')" class="social-btn x">
                             <i class="fa-brands fa-x-twitter"></i> X
                         </button>
                         <button onclick="shareToReddit('${encodeURIComponent(shareText)}')" class="social-btn reddit">
                             <i class="fa-brands fa-reddit"></i> Reddit
                         </button>
                    </div>
                </div>
            `;
            document.body.appendChild(socialContainer);
            
            // Add CSS styles for social sharing container
            const style = document.createElement('style');
            style.textContent = `
                .social-sharing-container {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .social-sharing-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    max-width: 90%;
                    width: 300px;
                }
                .social-sharing-content h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    color: #333;
                }
                .social-sharing-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .social-btn {
                    padding: 12px;
                    font-size: 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-weight: bold;
                    transition: background-color 0.3s ease;
                }
                 .social-btn.whatsapp {
                     background-color: #25d366;
                     color: white;
                     gap: 8px;
                 }
                 .social-btn.whatsapp:hover {
                     background-color: #1ebe5d;
                 }
                 .social-btn.x {
                     background-color: #000000;
                     color: white;
                     gap: 8px;
                 }
                 .social-btn.x:hover {
                     background-color: #333333;
                 }
                 .social-btn.reddit {
                     background-color: #ff4500;
                     color: white;
                     gap: 8px;
                 }
                 .social-btn.reddit:hover {
                     background-color: #e63900;
                 }
                .fab {
                    font-size: 20px;
                }
            `;
            document.head.appendChild(style);
    }

    // Show the container
    socialContainer.style.display = 'flex';

    // Hide when clicking outside the content
    socialContainer.onclick = function(e) {
        if (e.target === socialContainer) {
            socialContainer.style.display = 'none';
        }
    };
}

// Social sharing functions
function shareToWhatsApp(text) {
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    hideSocialSharing();
}

function shareToX(text) {
    const url = `https://x.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'width=500,height=300');
    hideSocialSharing();
}

function shareToReddit(text) {
    const url = `https://www.reddit.com/submit?title=My Trivia Score&text=${text}`;
    window.open(url, '_blank');
    hideSocialSharing();
}

function hideSocialSharing() {
    const socialContainer = document.getElementById('socialSharingContainer');
    if (socialContainer) {
        socialContainer.style.display = 'none';
    }
}

// Play again
function playAgain() {
    if (typeof window.initGame === 'function') {
        window.initGame();
    }
}

// Show goodbye message
function showGoodbye() {
    const gameOverElement = document.getElementById('gameOver');
    const goodbyeMessage = document.getElementById('goodbyeMessage');
    gameOverElement.style.display = 'none';
    goodbyeMessage.style.display = 'block';
    
    // Optional: Add a timeout to automatically close the page after a few seconds
    // setTimeout(() => window.close(), 5000);
}

// Pause game
function pauseGame() {
    if (window.isPaused) return;
    window.isPaused = true;
    if (typeof window.stopTimer === 'function') {
        window.stopTimer();
    }
    document.getElementById('pauseOverlay').classList.add('open');
}

// Resume game
function resumeGame() {
    if (!window.isPaused) return;
    window.isPaused = false;
    document.getElementById('pauseOverlay').classList.remove('open');
    if (typeof window.startTimer === 'function') {
        window.startTimer();
    }
}

    // Decode HTML entities (convert &quot; to " etc.)
    function decodeHTMLEntities(text) {
        const doc = new DOMParser().parseFromString(text, "text/html");
        return doc.documentElement.textContent;
    }

    // Keyboard navigation for accessibility
    function handleKeyboardNavigation(event) {
        // Only handle keyboard events when a question is active and answer can be selected
        if (gameElement.style.display === 'block' && !answerSelected && optionsElement.children.length > 0) {
            const options = Array.from(optionsElement.querySelectorAll('.option'));
            
            // Handle number keys 1-4 to select options
            if (event.key >= '1' && event.key <= '4') {
                const index = parseInt(event.key) - 1;
                if (options[index]) {
                    options[index].click();
                }
            }
            
            // Handle Enter key to proceed to next question if button is enabled
            if (event.key === 'Enter' && !nextBtn.disabled) {
                nextBtn.click();
            }
            
            // Handle Escape key to show goodbye message
            if (event.key === 'Escape') {
                showGoodbye();
            }
        }
    }

    // Event listeners
    playAgainBtn.addEventListener('click', playAgain);
    
    // Add share score event listener
    const shareScoreBtn = document.getElementById('shareScoreBtn');
    if (shareScoreBtn) {
        shareScoreBtn.addEventListener('click', shareScore);
    }

    // Add pause/resume event listeners
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseGame);
    }
    if (resumeBtn) {
        resumeBtn.addEventListener('click', resumeGame);
    }

    // Add event listener for goodbye button
    const goodbyeBtn = document.getElementById('goodbyeBtn');
    if (goodbyeBtn) {
        goodbyeBtn.addEventListener('click', showGoodbye);
    }

    // Settings event listeners
    settingsBtn.addEventListener('click', toggleSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    
    // Load saved theme preference
    function loadTheme() {
        const savedTheme = localStorage.getItem('triviaTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        }
    }
    
    // Toggle theme
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('triviaTheme', isDark ? 'dark' : 'light');
    }
    
    themeToggle.addEventListener('click', toggleTheme);

    // Keyboard navigation for accessibility
    document.addEventListener('keydown', handleKeyboardNavigation);

    // Load saved settings and theme, then start the game
    loadSettings();
    loadTheme();
    initGame();

    // Expose necessary functions and variables to global scope
    window.initGame = initGame;
    window.startTimer = startTimer;
    window.stopTimer = stopTimer;
    window.isPaused = isPaused;
    window.shareToWhatsApp = shareToWhatsApp;
    window.shareToX = shareToX;
    window.shareToReddit = shareToReddit;
});
