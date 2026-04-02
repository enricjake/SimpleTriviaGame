/**
 * Settings Module
 * Game settings management with localStorage persistence
 */

const TriviaSettings = (function() {
    // Default settings
    const defaults = {
        amount: 10,
        difficulty: 'medium',
        category: '',
        type: 'multiple'
    };

    let currentSettings = { ...defaults };

    /**
     * Load settings from localStorage
     */
    function load() {
        const saved = TriviaUtils.safeStorage.get('triviaSettings', null);
        if (saved) {
            currentSettings = { ...defaults, ...saved };
        }
        
        // Update UI elements
        updateUI();
        
        return currentSettings;
    }

    /**
     * Save settings to localStorage
     */
    function save(settings) {
        currentSettings = { ...currentSettings, ...settings };
        TriviaUtils.safeStorage.set('triviaSettings', currentSettings);
        updateUI();
        return currentSettings;
    }

    /**
     * Get current settings
     */
    function get() {
        return { ...currentSettings };
    }

    /**
     * Update settings from form inputs
     */
    function updateFromForm() {
        const questionCount = document.getElementById('questionCount');
        const difficulty = document.getElementById('difficulty');
        const category = document.getElementById('category');
        
        const newSettings = {
            amount: questionCount ? parseInt(questionCount.value) : defaults.amount,
            difficulty: difficulty && difficulty.value !== 'any' ? difficulty.value : '',
            category: category ? category.value : ''
        };
        
        return save(newSettings);
    }

    /**
     * Update UI elements with current settings
     */
    function updateUI() {
        const questionCount = document.getElementById('questionCount');
        const difficulty = document.getElementById('difficulty');
        const category = document.getElementById('category');
        const totalQuestions = document.getElementById('totalQuestions');
        const totalQuestionsFinal = document.getElementById('totalQuestionsFinal');
        
        if (questionCount) questionCount.value = currentSettings.amount;
        if (difficulty) difficulty.value = currentSettings.difficulty || 'any';
        if (category) category.value = currentSettings.category;
        
        if (totalQuestions) totalQuestions.textContent = currentSettings.amount;
        if (totalQuestionsFinal) totalQuestionsFinal.textContent = currentSettings.amount;
    }

    /**
     * Toggle settings panel visibility
     */
    function togglePanel() {
        const panel = document.getElementById('settingsPanel');
        if (panel) {
            panel.classList.toggle('open');
        }
    }

    /**
     * Close settings panel
     */
    function closePanel() {
        const panel = document.getElementById('settingsPanel');
        if (panel) {
            panel.classList.remove('open');
        }
    }

    /**
     * Reset settings to defaults
     */
    function reset() {
        currentSettings = { ...defaults };
        TriviaUtils.safeStorage.set('triviaSettings', currentSettings);
        updateUI();
        return currentSettings;
    }

    /**
     * Get API query parameters
     */
    function getQueryParams() {
        const params = new URLSearchParams();
        
        if (currentSettings.amount) {
            params.append('amount', currentSettings.amount);
        }
        if (currentSettings.difficulty) {
            params.append('difficulty', currentSettings.difficulty);
        }
        if (currentSettings.category) {
            params.append('category', currentSettings.category);
        }
        if (currentSettings.type) {
            params.append('type', currentSettings.type);
        }
        
        return params;
    }

    return {
        load,
        save,
        get,
        updateFromForm,
        updateUI,
        togglePanel,
        closePanel,
        reset,
        getQueryParams,
        defaults
    };
})();

// Export for global use
window.TriviaSettings = TriviaSettings;
