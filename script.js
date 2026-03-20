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
    const restartBtn = document.getElementById('restartBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const goodbyeMessage = document.getElementById('goodbyeMessage');

    // Game state
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let answerSelected = false;

    // API Config
    const API_URL = 'https://opentdb.com/api.php';
    const CONFIG = {
        amount: 10,
        difficulty: 'medium',
        type: 'multiple' // Only multiple choice questions
    };

    // Initialize the game
    function initGame() {
        currentQuestionIndex = 0;
        score = 0;
        answerSelected = false;
        
        // Show loading screen
        loadingElement.style.display = 'block';
        gameElement.style.display = 'none';
        gameOverElement.style.display = 'none';
        goodbyeMessage.style.display = 'none';
        
        // Reset score display
        scoreElement.textContent = '0';
        questionNumberElement.textContent = '0';

        // Fetch questions from API
        fetchQuestions();
    }

    // Fetch questions from Open Trivia API
    function fetchQuestions() {
        console.log('Fetching questions from API...');
        
        // Build API URL with config
        const queryParams = new URLSearchParams(CONFIG);
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
                    alert('Failed to load questions. Please try again.');
                    loadingElement.style.display = 'none';
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
                    alert('Failed to connect to the trivia API. Check your internet connection.');
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

            // Display question number
            questionNumberElement.textContent = currentQuestionIndex + 1;

            // Display question
            let decodedQuestion = decodeHTMLEntities(question.question);
            questionElement.textContent = decodedQuestion;

            // Clear previous options
            optionsElement.innerHTML = '';

            // Create and shuffle answer options
            const answerOptions = shuffleAnswers([
                ...question.incorrect_answers,
                question.correct_answer
            ]);

            // Create option buttons
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options';

            answerOptions.forEach((option, index) => {
                const button = document.createElement('button');
                let decodedOption = decodeHTMLEntities(option);
                button.textContent = decodedOption;
                button.className = 'option';
                button.onclick = () => selectAnswer(button, option, question.correct_answer);
                optionsContainer.appendChild(button);
            });

            optionsElement.appendChild(optionsContainer);
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

    // Select an answer
    function selectAnswer(button, selectedOption, correctAnswer) {
        if (answerSelected) return;

        answerSelected = true;

        // Mark selected button as yellow (pending verification)
        button.classList.add('selected');

        // Check if answer is correct
        const isCorrect = selectedOption === correctAnswer;

        if (isCorrect) {
            score++;
            scoreElement.textContent = score;
            button.classList.add('correct');
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
        }

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

    // Restart game
    function restartGame() {
        initGame();
    }

    // Decode HTML entities (convert &quot; to " etc.)
    function decodeHTMLEntities(text) {
        const doc = new DOMParser().parseFromString(text, "text/html");
        return doc.documentElement.textContent;
    }

    // Event listeners
    nextBtn.addEventListener('click', nextQuestion);
    playAgainBtn.addEventListener('click', playAgain);

    // Add event listener for goodbye button
    const goodbyeBtn = document.getElementById('goodbyeBtn');
    if (goodbyeBtn) {
        goodbyeBtn.addEventListener('click', showGoodbye);
    }

    // Start the game
    initGame();
});
