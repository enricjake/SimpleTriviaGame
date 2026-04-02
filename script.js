/**
 * Main Entry Point
 * Initializes all modules and sets up event listeners
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize modules
    TriviaAudio.init();
    TriviaSettings.load();
    
    // Cache DOM elements
    const elements = {
        gameContainer: document.getElementById('gameContainer'),
        modeSelection: document.getElementById('modeSelection'),
        dailyTrivia: document.getElementById('dailyTrivia'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsPanel: document.getElementById('settingsPanel'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        themeToggle: document.getElementById('themeToggle'),
        regularTriviaBtn: document.getElementById('regularTriviaBtn'),
        dailyTriviaModeBtn: document.getElementById('dailyTriviaModeBtn'),
        homeBtnRegular: document.getElementById('homeBtnRegular'),
        homeBtnDailySummary: document.getElementById('homeBtnDailySummary'),
        playAgainBtn: document.getElementById('playAgainBtn'),
        shareScoreBtn: document.getElementById('shareScoreBtn'),
        nextBtn: document.getElementById('nextBtn'),
        quitBtn: document.getElementById('quitBtn'),
        confirmQuitBtn: document.getElementById('confirmQuitBtn'),
        cancelQuitBtn: document.getElementById('cancelQuitBtn'),
        highScoresList: document.getElementById('highScoresList')
    };

    /**
     * Show mode selection screen
     */
    function showModeSelection() {
        if (elements.modeSelection) {
            elements.modeSelection.style.display = 'block';
            elements.modeSelection.classList.add('fade-in');
        }
        if (elements.gameContainer) elements.gameContainer.style.display = 'none';
        if (elements.dailyTrivia) elements.dailyTrivia.style.display = 'none';
        
        // Update daily button state
        if (elements.dailyTriviaModeBtn && typeof window.hasAnsweredDailyToday === 'function') {
            if (window.hasAnsweredDailyToday()) {
                elements.dailyTriviaModeBtn.classList.add('disabled');
                elements.dailyTriviaModeBtn.disabled = true;
                const p = elements.dailyTriviaModeBtn.querySelector('p');
                if (p) p.textContent = 'Already played today!';
            } else {
                elements.dailyTriviaModeBtn.classList.remove('disabled');
                elements.dailyTriviaModeBtn.disabled = false;
                const p = elements.dailyTriviaModeBtn.querySelector('p');
                if (p) p.textContent = "Answer today's special question";
            }
        }
        
        // Update high scores display
        displayHighScores();
    }

    /**
     * Display high scores on the mode selection screen
     */
    function displayHighScores() {
        if (!elements.highScoresList) return;
        
        const highScores = TriviaGame.getHighScores();
        
        if (highScores.length === 0) {
            elements.highScoresList.innerHTML = '<p class="no-scores">No scores yet. Play to set a record!</p>';
            return;
        }
        
        elements.highScoresList.innerHTML = highScores.slice(0, 5).map((score, index) => {
            const date = new Date(score.date).toLocaleDateString();
            const difficulty = score.difficulty || 'mixed';
            const hintsUsed = score.fiftyFiftyUsed ? ' 💡' : '';
            
            return `
                <div class="high-score-item rank-${index + 1}">
                    <span class="high-score-rank">${index + 1}.</span>
                    <span class="high-score-info">
                        ${date} - ${score.correct}/${score.total} correct (${difficulty})${hintsUsed}
                    </span>
                    <span class="high-score-points">${score.score} pts</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Start regular trivia game
     */
    function startRegularTrivia() {
        if (elements.modeSelection) elements.modeSelection.style.display = 'none';
        if (elements.gameContainer) {
            elements.gameContainer.style.display = 'block';
            elements.gameContainer.classList.add('fade-in');
        }
        
        TriviaGame.init();
    }

    /**
     * Start daily trivia
     */
    function startDailyTrivia() {
        if (elements.modeSelection) elements.modeSelection.style.display = 'none';
        if (elements.dailyTrivia) {
            elements.dailyTrivia.style.display = 'block';
            elements.dailyTrivia.classList.add('fade-in');
        }
        
        if (typeof window.showDailyTrivia === 'function') {
            window.showDailyTrivia();
        }
    }

    /**
     * Toggle settings panel
     */
    function toggleSettings() {
        if (elements.settingsPanel) {
            elements.settingsPanel.classList.toggle('open');
        }
    }

    /**
     * Save settings and restart game
     */
    function saveSettings() {
        TriviaSettings.updateFromForm();
        toggleSettings();
        
        // Only restart if we're in a game
        const game = document.getElementById('game');
        if (game && game.style.display === 'block') {
            TriviaGame.init();
        }
    }

    /**
     * Load saved theme
     */
    function loadTheme() {
        const savedTheme = TriviaUtils.safeStorage.get('triviaTheme', null);
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (elements.themeToggle) elements.themeToggle.textContent = '☀️';
        }
    }

    /**
     * Toggle theme
     */
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        if (elements.themeToggle) elements.themeToggle.textContent = isDark ? '☀️' : '🌙';
        TriviaUtils.safeStorage.set('triviaTheme', isDark ? 'dark' : 'light');
    }

    /**
     * Display final stats on game over
     */
    function displayFinalStats() {
        const finalStats = document.getElementById('finalStats');
        if (!finalStats) return;
        
        const shareData = TriviaGame.getShareData();
        
        finalStats.innerHTML = `
            <div class="final-stat-item">
                <div class="final-stat-value">${shareData.streak}</div>
                <div class="final-stat-label">Best Streak</div>
            </div>
            <div class="final-stat-item">
                <div class="final-stat-value">${shareData.hasHints ? 'Yes' : 'No'}</div>
                <div class="final-stat-label">Hints Used</div>
            </div>
            <div class="final-stat-item">
                <div class="final-stat-value">${Math.round((shareData.score / shareData.totalQuestions) * 100)}%</div>
                <div class="final-stat-label">Accuracy</div>
            </div>
        `;
    }

    /**
     * Event Listeners
     */
    
    // Mode selection
    if (elements.regularTriviaBtn) {
        elements.regularTriviaBtn.addEventListener('click', startRegularTrivia);
    }
    
    if (elements.dailyTriviaModeBtn) {
        elements.dailyTriviaModeBtn.addEventListener('click', startDailyTrivia);
    }

    // Settings
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', toggleSettings);
    }
    
    if (elements.saveSettingsBtn) {
        elements.saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // Enter key in settings panel
    if (elements.settingsPanel) {
        elements.settingsPanel.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                saveSettings();
            }
        });
    }

    // Theme
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }

    // Navigation
    if (elements.homeBtnRegular) {
        elements.homeBtnRegular.addEventListener('click', showModeSelection);
    }
    
    if (elements.homeBtnDailySummary) {
        elements.homeBtnDailySummary.addEventListener('click', showModeSelection);
    }

    // Game controls
    if (elements.playAgainBtn) {
        elements.playAgainBtn.addEventListener('click', startRegularTrivia);
    }
    
    if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', TriviaGame.nextQuestion);
    }
    
    if (elements.quitBtn) {
        elements.quitBtn.addEventListener('click', TriviaGame.showQuitConfirmation);
    }
    
    if (elements.confirmQuitBtn) {
        elements.confirmQuitBtn.addEventListener('click', TriviaGame.confirmQuit);
    }
    
    if (elements.cancelQuitBtn) {
        elements.cancelQuitBtn.addEventListener('click', TriviaGame.cancelQuit);
    }

    // Share
    if (elements.shareScoreBtn) {
        elements.shareScoreBtn.addEventListener('click', async function() {
            const shareData = TriviaGame.getShareData();
            displayFinalStats();
            await TriviaShare.shareScore(shareData);
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', TriviaGame.handleKeyboard);

    // Initialize audio on first user interaction (browser autoplay policy)
    document.addEventListener('click', function initAudioOnInteraction() {
        TriviaAudio.init();
        document.removeEventListener('click', initAudioOnInteraction);
    }, { once: true });

    // Initialize
    loadTheme();
    showModeSelection();

    // Expose functions for daily trivia module
    window.showModeSelection = showModeSelection;
    window.startRegularTrivia = startRegularTrivia;
    window.startDailyTrivia = startDailyTrivia;
});
