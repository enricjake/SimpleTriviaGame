# Changes — Code Review Fixes

Review-driven fixes applied on `main`. All JS files pass `node --check`.

## Critical bugs fixed

### 1. Daily trivia never highlighted the correct answer (`daily-trivia.js`)
`selectDailyAnswer` compared a *double-decoded* button label against the *raw*
(still HTML-encoded) `correctAnswer`:
```js
const decodedText = decodeHTMLEntities(btn.textContent); // already decoded
if (decodedText === correctAnswer) { ... }               // correctAnswer still encoded
```
For any answer containing entities (e.g. `Tom &amp; Jerry`, `&quot;...`) the
correct option was never marked. Fixed to compare against the decoded correct
answer, matching the (correct) approach already used in `game.js`:
```js
if (btn.textContent === decodeHTMLEntities(correctAnswer)) { ... }
```

### 2. Daily trivia played no sound (`daily-trivia.js`)
`tryPlayCorrectSound` / `tryPlayIncorrectSound` called
`window.playCorrectSound` / `window.playIncorrectSound`, which were **never
defined**. `audio.js` only exposes `window.TriviaAudio.playCorrect/playIncorrect`.
Daily mode was therefore silent. Fixed to call `window.TriviaAudio` directly.

## Warnings fixed

### 3. XSS via `innerHTML` with decoded / untrusted content
- `game.js` `displayAnswerSummary` built `questionText` and `yourAnswer` with
  `innerHTML` from decoded API strings. Switched to `textContent` + a `<br>`
  node so a question like `&lt;img onerror=...&gt;` can no longer execute.
- `script.js` `displayHighScores` interpolated `localStorage`-backed values
  (`date`, `difficulty`) into `innerHTML`. Added `TriviaUtils.escapeHtml` and
  escape those values before insertion.

### 4. Division-by-zero → `NaN%` (`script.js`)
`displayFinalStats` computed `Math.round((score / totalQuestions) * 100)` which
rendered `NaN%` when no questions were loaded. Guarded with
`totalQuestions ? ... : 0`.

### 5. In-flight fetch not aborted on re-init / quit (`game.js`)
`fetchQuestions` could leave a previous request/retry chain running after
"Play Again" or "Regular Trivia" restarted the game, whose `.then(showNextQuestion)`
could fire against a hidden/reset game. The abort controller + timeout are now
module-scoped and aborted at the start of every `fetchQuestions` call.

### 6. Stale daily summary screen (`daily-trivia.js`)
`selectDailyAnswer` scheduled a `setTimeout(2000)` to show the summary screen.
If the user navigated Home during those 2s, the timeout still ran and popped the
summary over the home view. The timeout is now tracked (`dailySummaryTimeout`)
and cleared at the start of `showDailyTrivia`.

### 7. Number-key selection skipped removed 50/50 options (`game.js`)
In `handleKeyboard`, number keys 1–4 selected from the *filtered* option list
(excluding 50/50-removed), so "2" could select the 2nd *remaining* option rather
than the 2nd visually. Now selects by visual position using
`elements.options.children` and ignores disabled buttons.

### 8. Question-count display out of sync (`game.js`)
The `X/10` total was only set from settings (`amount`) and could disagree with
the actual fetched count. `showNextQuestion` now updates `totalQuestions` and
`endGame` updates `totalQuestionsFinal` from `questions.length`.

## Code-quality cleanups

- Removed dead code: `game.js` `startTimer`/`stopTimer`/`updateTimerDisplay`/
  `handleTimeUp`; `audio.js` `playTimerWarning`; `utils.js` `formatTime`,
  `generateId`, `deepClone` (all unused).
- Added `TriviaUtils.escapeHtml` for safe `innerHTML` interpolation.

## Not changed (data / follow-up)
- `daily-question.json` is stale (`date: 2026-04-02` vs today), so
  `fetchSharedDailyQuestion` always rejects and falls back to the per-user API —
  defeating the "same question for everyone" goal. Verify the GitHub Action that
  regenerates it is running. (Left as-is; regenerating question content is a
  separate data task.)
- Helper duplication (`formatTime`, `getTimeUntilNextMidnightPacific`,
  `getPacificDate`, `shuffleAnswers`/`decodeHTMLEntities`) remains across
  `script.js` and `daily-trivia.js` to keep this change focused; consolidating
  into `TriviaUtils` is recommended as a follow-up.
