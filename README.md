# SimpleTriviaGame

A fun and interactive web-based trivia game that tests your knowledge with questions fetched from the Open Trivia Database API. Challenge yourself with various difficulty levels, categories, and customize your gaming experience!

## 🎮 Features

- **Dynamic Question Loading**: Trivia questions fetched from [Open Trivia DB](https://opentdb.com)
- **Customizable Game Settings**:
  - Choose number of questions (5, 10, 15, or 20)
  - Select difficulty level (Easy, Medium, Hard, or Any)
  - Pick your favorite category (13+ categories available)
- **Interactive Gameplay**:
  - 10-second timer per question
  - Real-time score tracking
  - Progress bar to visualize game progress
  - Sound effects for correct/incorrect answers
- **Game Controls**:
  - Pause/Resume functionality
  - Answer summary after game completion
  - Share your score with others
  - Play again option
- **Visual Enhancements**:
  - Dark/Light theme toggle
  - Responsive design for mobile and desktop
  - Category and difficulty badges for each question
  - Smooth animations and transitions
- **Accessibility**:
  - Keyboard navigation support
  - ARIA labels for screen readers
  - High score tracking with localStorage
  - Theme preference persistence

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (to fetch trivia questions)

### Installation

1. **Clone the repository** or download the files:
```bash
git clone https://github.com/enricjake/SimpleTriviaGame.git
cd SimpleTriviaGame
```

2. **Run a local server** (important - the game won't work with `file://` protocol):
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (with http-server)
npx http-server

# Using Live Server in VS Code
# Install the Live Server extension and right-click index.html
```

3. **Open in browser**:
Navigate to `http://localhost:8000` in your web browser

## 📖 How to Play

1. **Configure Settings** (Optional):
   - Click the ⚙️ Settings button
   - Choose number of questions, difficulty level, and category
   - Click "Save Settings" to apply

2. **Answer Questions**:
   - Read the trivia question carefully
   - Click on your answer before the 10-second timer runs out
   - Correct answers are highlighted in green, incorrect in red
   - You'll hear audio feedback for each answer

3. **Advance**:
   - After answering, click "Next Question" to proceed
   - Watch the progress bar fill as you complete more questions

4. **End Game**:
   - View your final score and answer summary
   - Click "Play Again" to restart with the same settings
   - Click "Share Score" to copy your score to clipboard
   - Click "Quit" to exit the game

## ⌨️ Keyboard Controls

- **Number Keys 1-4**: Select answers
- **Enter**: Proceed to next question (when enabled)
- **Escape**: Show goodbye message and exit

## 🎯 Game Features Explained

### Score System
- 1 point per correct answer
- High score is saved automatically
- Your high score persists even after closing the browser

### Timer
- 10 seconds per question
- Timer counts down visually
- Automatically moves to next question if time expires

### Categories Available
- General Knowledge
- Entertainment (Books, Film, Music, Television, Video Games)
- Science (General, Computers, Mathematics)
- Sports
- Geography
- History
- Animals

## 🔧 Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with dark/light theme support
- **JavaScript (ES6+)**: Game logic and interactivity
- **Open Trivia DB API**: Question source
- **Mixkit**: Sound effects

## 📁 Project Structure

```
SimpleTriviaGame/
├── index.html      # Main HTML file with game layout
├── styles.css      # Styling and theme definitions
├── script.js       # Game logic and interactivity
├── LICENSE         # MIT License
└── README.md       # This file
```

## 🔌 API Details

The game uses the **Open Trivia Database API**:
- **Endpoint**: `https://opentdb.com/api.php`
- **Query Parameters**:
  - `amount`: Number of questions (5-50)
  - `difficulty`: Question difficulty (easy, medium, hard)
  - `category`: Category ID (see categories above)
  - `type`: Question type (multiple - multiple choice only)

### Response Handling
- Includes retry logic for failed API calls
- Handles HTML entity encoding in questions/answers
- Graceful error messages for connection issues

## 🎨 Customization

### Modifying Timer Duration
Edit line 24 in `script.js`:
```javascript
let timeLeft = 10; // Change to desired seconds
```

### Changing Default Settings
Edit the `settings` object in `script.js` (lines 29-34):
```javascript
let settings = {
    amount: 10,        // Default number of questions
    difficulty: 'medium', // Default difficulty
    category: '',      // Default category ('' = any)
    type: 'multiple'
};
```

## 🐛 Troubleshooting

### Questions Won't Load
- Ensure you're running a local server, not opening the file directly
- Check your internet connection
- Try refreshing the page
- Check browser console for error messages

### Audio Not Playing
- Some browsers require user interaction before playing audio
- Check browser volume settings
- Allow audio permissions when prompted

### Game Not Saving Settings
- Check if browser has localStorage enabled
- Clear browser cache and try again
- Some private/incognito modes disable localStorage

## 📱 Browser Compatibility

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ Internet Explorer (not supported)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙌 Acknowledgments

- [Open Trivia Database](https://opentdb.com) for providing free trivia questions
- [Mixkit](https://mixkit.co) for royalty-free sound effects
- All trivia enthusiasts who enjoy testing their knowledge!

## 💡 Future Enhancements

- Leaderboard system
- Multiplayer mode
- Custom question sets
- More sound effect options
- Question explanations
- Achievement badges
- Different question types (true/false, multiple answer)
- Time attack mode

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

## 📧 Contact

For questions or feedback, please reach out through GitHub issues.

---

**Enjoy the game and test your knowledge! 🧠✨**