/**
 * Audio Module
 * Web Audio API sound effects with context management
 */

const TriviaAudio = (function() {
    let audioContext = null;
    let isInitialized = false;

    /**
     * Initialize audio context (call on first user interaction)
     */
    function init() {
        if (isInitialized) return;
        
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            isInitialized = true;
            
            // Resume context if suspended (browser autoplay policy)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Ensure audio context is ready
     */
    function ensureContext() {
        if (!isInitialized) {
            init();
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    /**
     * Play a success/positive sound (ascending tones)
     */
    function playCorrect() {
        if (!isInitialized) return;
        ensureContext();
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play two ascending notes (C5 to E5)
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }

    /**
     * Play an error/negative sound (descending tones)
     */
    function playIncorrect() {
        if (!isInitialized) return;
        ensureContext();
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play two descending notes (A4 to F4)
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.15);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.35);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }

    /**
     * Play game over sound based on performance
     * < 50%: Losing tone (descending)
     * >= 50%: Winning tone (ascending arpeggio)
     */
    function playGameOver(score, totalQuestions) {
        if (!isInitialized) return;
        ensureContext();
        
        try {
            const percentage = (score / totalQuestions) * 100;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(audioContext.destination);

            gain.gain.setValueAtTime(0.35, audioContext.currentTime);

            if (percentage < 50) {
                // Losing tone: descending notes
                osc.frequency.setValueAtTime(329.63, audioContext.currentTime);
                osc.frequency.setValueAtTime(261.63, audioContext.currentTime + 0.2);
                osc.frequency.setValueAtTime(220.00, audioContext.currentTime + 0.4);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.7);
            } else {
                // Winning tone: ascending arpeggio
                osc.frequency.setValueAtTime(523.25, audioContext.currentTime);
                osc.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.12);
                osc.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.24);
                osc.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.36);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.65);
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.65);
            }
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }

    /**
     * Play 50/50 hint sound
     */
    function playFiftyFifty() {
        if (!isInitialized) return;
        ensureContext();
        
        try {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(440, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.2);
            
            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }

    /**
     * Play timer warning sound (when time is running low)
     */
    function playTimerWarning() {
        if (!isInitialized) return;
        ensureContext();
        
        try {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(800, audioContext.currentTime);
            gain.gain.setValueAtTime(0.15, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.15);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }

    /**
     * Play streak sound (escalating pitch based on streak)
     */
    function playStreak(streak) {
        if (!isInitialized || streak < 2) return;
        ensureContext();
        
        try {
            const baseFreq = 440;
            const multiplier = Math.min(streak, 5);
            
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(baseFreq * multiplier, audioContext.currentTime);
            gain.gain.setValueAtTime(0.25, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.25);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }

    return {
        init,
        playCorrect,
        playIncorrect,
        playGameOver,
        playFiftyFifty,
        playTimerWarning,
        playStreak
    };
})();

// Export for global use
window.TriviaAudio = TriviaAudio;
