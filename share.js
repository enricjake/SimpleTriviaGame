/**
 * Share Module
 * Social sharing functionality and score sharing
 */

const TriviaShare = (function() {
    /**
     * Share score to WhatsApp
     */
    function shareToWhatsApp(text) {
        const url = `https://wa.me/?text=${text}`;
        window.open(url, '_blank');
        hideSocialSharing();
    }

    /**
     * Share score to X (Twitter)
     */
    function shareToX(text) {
        const url = `https://x.com/intent/tweet?text=${text}`;
        window.open(url, '_blank', 'width=500,height=300');
        hideSocialSharing();
    }

    /**
     * Share score to Reddit
     */
    function shareToReddit(text) {
        const url = `https://www.reddit.com/submit?title=My Trivia Score&text=${text}`;
        window.open(url, '_blank');
        hideSocialSharing();
    }

    /**
     * Hide social sharing container
     */
    function hideSocialSharing() {
        const socialContainer = document.getElementById('socialSharingContainer');
        if (socialContainer) {
            socialContainer.style.display = 'none';
        }
    }

    /**
     * Show social sharing modal
     */
    function showSocialSharing(shareText) {
        let socialContainer = document.getElementById('socialSharingContainer');
        if (!socialContainer) {
            // Create container if it doesn't exist
            socialContainer = document.createElement('div');
            socialContainer.id = 'socialSharingContainer';
            socialContainer.className = 'social-sharing-container';
            document.body.appendChild(socialContainer);
        }
        
        socialContainer.innerHTML = `
            <div class="social-sharing-content">
                <h3>Share your score:</h3>
                <div class="social-sharing-buttons">
                    <button class="social-btn whatsapp" data-platform="whatsapp">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                    </button>
                    <button class="social-btn x" data-platform="x">
                        <i class="fa-brands fa-x-twitter"></i> X
                    </button>
                    <button class="social-btn reddit" data-platform="reddit">
                        <i class="fa-brands fa-reddit"></i> Reddit
                    </button>
                    <button class="social-btn close-btn" data-action="close">Close</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        socialContainer.querySelectorAll('[data-platform]').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                const encodedText = encodeURIComponent(shareText);
                
                switch(platform) {
                    case 'whatsapp':
                        shareToWhatsApp(encodedText);
                        break;
                    case 'x':
                        shareToX(encodedText);
                        break;
                    case 'reddit':
                        shareToReddit(encodedText);
                        break;
                }
            });
        });
        
        socialContainer.querySelector('[data-action="close"]').addEventListener('click', hideSocialSharing);
        
        // Show container
        socialContainer.style.display = 'flex';
        
        // Hide on background click
        socialContainer.addEventListener('click', function(e) {
            if (e.target === socialContainer) {
                hideSocialSharing();
            }
        });
    }

    /**
     * Copy text to clipboard with fallback
     */
    async function copyToClipboard(text) {
        // Try modern Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return { success: true, method: 'clipboard' };
            } catch (err) {
                console.log('Clipboard API failed, trying fallback:', err);
            }
        }
        
        // Fallback: Create hidden textarea
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.cssText = `
                position: fixed;
                left: -999999px;
                top: -999999px;
                opacity: 0;
            `;
            document.body.appendChild(textArea);
            
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                return { success: true, method: 'fallback' };
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        return { success: false, method: 'none' };
    }

    /**
     * Show manual copy dialog when automatic copy fails
     */
    function showManualCopyDialog(text) {
        const modal = document.createElement('div');
        modal.className = 'copy-dialog-modal';
        modal.innerHTML = `
            <div class="copy-dialog-content">
                <h3>Copy Your Score</h3>
                <p>Automatic copy failed. Please copy the text below manually:</p>
                <textarea readonly class="copy-dialog-textarea">${text}</textarea>
                <button class="copy-dialog-close">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-select text
        const textarea = modal.querySelector('.copy-dialog-textarea');
        textarea.select();
        textarea.focus();
        
        // Close handlers
        const closeBtn = modal.querySelector('.copy-dialog-close');
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Generate share text for a score
     */
    function generateShareText(score, totalQuestions, streak = 0, hasHints = false) {
        let emoji = '🏆';
        const percentage = (score / totalQuestions) * 100;
        
        if (percentage === 100) {
            emoji = '🏆🌟';
        } else if (percentage >= 80) {
            emoji = '🎉';
        } else if (percentage >= 60) {
            emoji = '👍';
        } else if (percentage >= 40) {
            emoji = '🙂';
        } else {
            emoji = '😅';
        }
        
        let text = `I scored ${score}/${totalQuestions} ${emoji} in the Trivia Challenge!`;
        
        if (streak > 2) {
            text += ` ${streak} question streak! 🔥`;
        }
        
        if (hasHints) {
            text += ' (Used 50/50 hints)';
        }
        
        text += ' Can you beat my score? https://enricjake.github.io/SimpleTriviaGame/';
        
        return text;
    }

    /**
     * Main share function - combines copy and social sharing
     */
    async function shareScore(scoreData) {
        const { score, totalQuestions, streak, hasHints } = scoreData;
        const shareText = generateShareText(score, totalQuestions, streak, hasHints);
        
        // Try to copy to clipboard
        const copyResult = await copyToClipboard(shareText);
        
        // Show feedback on share button
        const shareBtn = document.getElementById('shareScoreBtn');
        if (shareBtn) {
            const originalText = shareBtn.textContent;
            shareBtn.textContent = copyResult.success ? 'Copied!' : 'Share Score';
            shareBtn.disabled = true;
            
            setTimeout(() => {
                shareBtn.textContent = originalText;
                shareBtn.disabled = false;
            }, 2000);
        }
        
        // If copy failed, show manual dialog
        if (!copyResult.success) {
            showManualCopyDialog(shareText);
        }
        
        // Always show social sharing options
        showSocialSharing(shareText);
        
        return copyResult.success;
    }

    return {
        shareToWhatsApp,
        shareToX,
        shareToReddit,
        hideSocialSharing,
        showSocialSharing,
        copyToClipboard,
        showManualCopyDialog,
        generateShareText,
        shareScore
    };
})();

// Export for global use
window.TriviaShare = TriviaShare;
