document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const gameContainer = document.getElementById('gameContainer');
    const loadingElement = document.getElementById('loading');
    const gameElement = document.getElementById('game');
    const gameOverElement = document.getElementById('gameOver');
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const nextBtn = document.getElementById('nextBtn');
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

    // Toggle settings panel
    function toggleSettings() {
        settingsPanel.classList.toggle('open');
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
            nextBtn.disabled = true;
            
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
                    const allButtons = optionsElement.querySelectorAll('.option');
                    allButtons.forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add('disabled');
                    });
                    // Enable next button
                    nextBtn.disabled = false;
                    // Show time's up alert
                    alert('Time\'s up! Moving to next question.');
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
            document.getElementById('correctSound').play().catch(e => console.log("Audio play failed:", e));
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
            document.getElementById('incorrectSound').play().catch(e => console.log("Audio play failed:", e));
        }

        // Update question number
        questionNumberElement.textContent = currentQuestionIndex + 1;

        // Disable all option buttons
        const allButtons = optionsElement.querySelectorAll('.option');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });

        // Enable next button
        nextBtn.disabled = false;
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
        
        // Display answer summary
        displayAnswerSummary();
    }

    // Display answer summary
    function displayAnswerSummary() {
        const summaryContainer = document.getElementById('answerSummary');
        summaryContainer.innerHTML = '<h3>Your Answers:</h3>';
        
        userAnswers.forEach((answer, index) => {
            const item = document.createElement('div');
            item.className = 'answer-item ' + (answer.isCorrect ? 'correct' : 'incorrect');
            item.innerHTML = `
                <div class="question-text">Q${index + 1}: ${decodeHTMLEntities(answer.question.substring(0, 50))}${answer.question.length > 50 ? '...' : ''}</div>
                <div class="your-answer ${answer.isCorrect ? 'correct' : 'incorrect'}">
                    Your answer: ${decodeHTMLEntities(answer.userAnswer)}
                    ${!answer.isCorrect ? '<br>Correct: ' + decodeHTMLEntities(answer.correctAnswer) : ''}
                </div>
            `;
            summaryContainer.appendChild(item);
        });
    }

    // Share score
    function shareScore() {
        const shareText = `I scored ${score}/${questions.length} in the Trivia Challenge! Can you beat my score?`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                const shareBtn = document.getElementById('shareScoreBtn');
                const originalText = shareBtn.textContent;
                shareBtn.textContent = 'Copied!';
                setTimeout(() => {
                    shareBtn.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const shareBtn = document.getElementById('shareScoreBtn');
            const originalText = shareBtn.textContent;
            shareBtn.textContent = 'Copied!';
            setTimeout(() => {
                shareBtn.textContent = originalText;
            }, 2000);
        }
    }

    // Play again
    function playAgain() {
        initGame();
    }

    // Show goodbye message
    function showGoodbye() {
        gameOverElement.style.display = 'none';
        goodbyeMessage.style.display = 'block';
        
        // Optional: Add a timeout to automatically close the page after a few seconds
        // setTimeout(() => window.close(), 5000);
    }

    // Pause game
    function pauseGame() {
        if (isPaused) return;
        isPaused = true;
        stopTimer();
        document.getElementById('pauseOverlay').classList.add('open');
    }

    // Resume game
    function resumeGame() {
        if (!isPaused) return;
        isPaused = false;
        document.getElementById('pauseOverlay').classList.remove('open');
        startTimer();
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
    nextBtn.addEventListener('click', nextQuestion);
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
});
