const NUMBER_OF_GUESSES = 6;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let letterColors = [];
let guesses = [];
var nextLetter = 0;
let rightGuessString = "";
let gameReady = false;
let gameCompleted = false;

// Loading overlay helpers
function showLoadingOverlay() {
  const el = document.getElementById('loading-overlay');
  if (!el) return;
  const spinner = document.getElementById('loading-spinner');
  const text = document.getElementById('loading-text');
  const err = document.getElementById('loading-error');
  const retry = document.getElementById('retry-button');
  if (spinner) spinner.style.display = 'block';
  if (text) text.style.display = 'block';
  if (err) err.style.display = 'none';
  if (retry) retry.style.display = 'none';
  el.style.display = 'flex';
}
function showErrorOverlay(message) {
  const el = document.getElementById('loading-overlay');
  if (!el) return;
  const spinner = document.getElementById('loading-spinner');
  const text = document.getElementById('loading-text');
  const err = document.getElementById('loading-error');
  const retry = document.getElementById('retry-button');
  if (spinner) spinner.style.display = 'none';
  if (text) text.style.display = 'none';
  if (err) { err.textContent = message; err.style.display = 'block'; }
  if (retry) retry.style.display = 'inline-block';
  el.style.display = 'flex';
}
function hideLoadingOverlay() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

// Save game state to localStorage
function saveGameState() {
  const state = {
    guessesRemaining,
    letterColors,
    guesses,
    gameCompleted
  };
  localStorage.setItem('gameState', JSON.stringify(state));
}

// Load game state from localStorage
function loadGameState() {
  const state = JSON.parse(localStorage.getItem('gameState'));
  if (!state) return null;
  return state;
}

// Restore UI from saved game state
function restoreGameUI() {
  const state = loadGameState();
  if (!state) return;

  guessesRemaining = state.guessesRemaining;
  letterColors = state.letterColors;
  guesses = state.guesses;
  gameCompleted = state.gameCompleted;

  // Restore the board with completed guesses
  for (let rowIndex = 0; rowIndex < guesses.length; rowIndex++) {
    const row = document.getElementsByClassName("letter-row")[rowIndex];
    const guess = guesses[rowIndex];
    const colors = letterColors[rowIndex];
    
    for (let i = 0; i < 5; i++) {
      const box = row.children[i];
      const letter = guess[i];
      
      // Restore the letter
      box.textContent = letter ? letter.toUpperCase() : "";
      if (letter) {
        box.classList.add("filled-box");
      }
      
      // Restore the color
      box.style.backgroundColor = colors[i];
      box.style.borderColor = colors[i];
      
      // Shade the keyboard to match
      shadeKeyBoard(letter, colors[i]);
    }
  }

  // If game is completed, disable keyboard interaction
  if (gameCompleted) {
    disableKeyboard();
  }
}

// Disable keyboard for completed games
function disableKeyboard() {
  document.removeEventListener("keyup", handleKeyup);
  const keyboardCont = document.getElementById("keyboard-cont");
  if (keyboardCont) {
    keyboardCont.removeEventListener("click", handleKeyboardClick);
  }
}

// Get today's local timezone date as a string (YYYY-MM-DD format)
function getTodayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if game was completed today
function isGameCompletedToday() {
  const cachedDate = localStorage.getItem('wordOfDayDate');
  const todayLocal = getTodayLocal();
  const wordOfDay = localStorage.getItem('wordOfDay');
  
  return cachedDate === todayLocal && wordOfDay;
}

// Load the right guess (word of the day) from the backend — no local fallback
async function loadRightGuess() {
  showLoadingOverlay();
  
  // If game is completed today, use cached word instead of making network call
  if (isGameCompletedToday()) {
    rightGuessString = JSON.parse(localStorage.getItem('wordOfDay')).toLowerCase();
    console.log("Using cached rightGuessString:", rightGuessString);
    gameReady = true;
    hideLoadingOverlay();
    restoreGameUI();
    return;
  }
  
  try {
    const res = await fetch("https://urbwordbackend.onrender.com/daily-word");
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    rightGuessString = (data.word || data.wordOfDay || data.word_of_day || data).toString().toLowerCase();
    
    // Cache the date and word from server
    const todayLocal = getTodayLocal();
    localStorage.setItem('wordOfDayDate', todayLocal);
    localStorage.setItem('wordOfDay', JSON.stringify(rightGuessString));
    
    // Clear previous game state for new day
    localStorage.removeItem('gameState');
    gameCompleted = false;
    guessesRemaining = NUMBER_OF_GUESSES;
    currentGuess = [];
    letterColors = [];
    guesses = [];
    nextLetter = 0;
    
    console.log("Loaded rightGuessString:", rightGuessString);
    toastr.success("Word of the day loaded.");
    gameReady = true;
    hideLoadingOverlay();
  } catch (err) {
    console.error("Failed to fetch word of the day:", err);
    toastr.error("Failed to load word of the day from server.");
    showErrorOverlay("Failed to load word of the day. Please check your network or try again.");
    gameReady = false;
  }
}



function initBoard() {
  let board = document.getElementById("game-board");

  for (let i = 0; i < 5; i++) {
    let row = document.createElement("div");
    row.className = "letter-row";

    for (let j = 0; j < 5; j++) {
      let box = document.createElement("div");
      box.className = "letter-box";
      row.appendChild(box);
    }

    board.appendChild(row);
  }
}

function shadeKeyBoard(letter, color) {
  const targetLetter = (letter || "").toString().trim().toLowerCase();
  for (const elem of document.getElementsByClassName("keyboard-button")) {
    const btnLetter = (elem.textContent || "").toString().trim().toLowerCase();
    if (btnLetter === targetLetter) {
      let oldColor = elem.style.backgroundColor;
      if (oldColor === "green") {
        return;
      }

      // previous code checked for "yellow" but we use "gold" in letter colors
      if (oldColor === "gold" && color !== "green") {
        return;
      }

      elem.style.backgroundColor = color;
      break;
    }
  }
}

function deleteLetter() {
  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
  let box = row.children[nextLetter - 1];
  box.textContent = "";
  box.classList.remove("filled-box");
  currentGuess.pop();
  nextLetter -= 1;
}

function checkGuess() {
  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
  let guessString = "";
  let rightGuess = Array.from(rightGuessString);

  for (const val of currentGuess) {
    guessString += val;
  }

  if (guessString.length != 5) {
    toastr.error("Not enough letters!");
    return;
  }

  var letterColor = ["gray", "gray", "gray", "gray", "gray"];

  //check green
  for (let i = 0; i < 5; i++) {
    if (rightGuess[i] == currentGuess[i]) {
      letterColor[i] = "green";
      rightGuess[i] = "#";
    }
  }

  //check yellow
  //checking guess letters
  for (let i = 0; i < 5; i++) {
    if (letterColor[i] == "green") continue;

    //checking right letters
    for (let j = 0; j < 5; j++) {
      if (rightGuess[j] == currentGuess[i]) {
        letterColor[i] = "gold";
        rightGuess[j] = "#";
      }
    }
  }

  for (let i = 0; i < 5; i++) {
    let box = row.children[i];
    let delay = 250 * i;
    setTimeout(() => {
      //flip box
      animateCSS(box, "flipInX");
      //shade box
      box.style.backgroundColor = letterColor[i];
      box.style.borderColor = letterColor[i];
      shadeKeyBoard(guessString.charAt(i) + "", letterColor[i]);
    }, delay);
  }
  letterColors.push(letterColor);
  
  // Store the guess
  guesses.push(guessString);
  
  if (guessString === rightGuessString) {
    toastr.success("You guessed right! Game over!");
    gameCompleted = true;
    saveGameState();
    recordGameResult(true, 6 - guessesRemaining);
    guessesRemaining = 0;
    return;
  } else {
    guessesRemaining -= 1;
    currentGuess = [];
    nextLetter = 0;
    saveGameState();

    if (guessesRemaining === 0) {
      toastr.error("You've run out of guesses! Game over!");
      toastr.info(`The right word was: "${rightGuessString}"`);
      gameCompleted = true;
      saveGameState();
      recordGameResult(false, 0);
    }
  }
}

function insertLetter(pressedKey) {
  if (nextLetter === 5) {
    return;
  }
  pressedKey = pressedKey.toLowerCase();

  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
  let box = row.children[nextLetter];
  animateCSS(box, "pulse");
  // display letters as uppercase for clarity, but store them lowercase
  box.textContent = pressedKey.toUpperCase();
  box.classList.add("filled-box");
  currentGuess.push(pressedKey);
  nextLetter += 1;
}

// Update the users stats
function recordGameResult(isWin, guessNumber) {
  // Retrieve stats from localStorage or initialize if not present
  var stats = JSON.parse(localStorage.getItem('gameStats')) || {
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: [0, 0, 0, 0, 0, 0]
  };

  // Update stats based on game result
  stats.gamesPlayed++;
  if (isWin) {
      stats.wins++;
      stats.currentStreak++;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      stats.guessDistribution[guessNumber - 1] += 1
  } else {
      stats.currentStreak = 0;
  }

  // Save updated stats to localStorage
  localStorage.setItem('gameStats', JSON.stringify(stats));
  localStorage.setItem('guessNumber', JSON.stringify(guessNumber));
  localStorage.setItem('letterColors', JSON.stringify(letterColors));
  localStorage.setItem('wordOfDay', JSON.stringify(rightGuessString));
  
  // Go to the stats page
  setTimeout(function() {
    window.location.href = "statistics.html?word=" + rightGuessString;
  }, 2500);
}

const animateCSS = (element, animation, prefix = "animate__") =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    // const node = document.querySelector(element);
    const node = element;
    node.style.setProperty("--animate-duration", "0.3s");

    node.classList.add(`${prefix}animated`, animationName);

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve("Animation ended");
    }

    node.addEventListener("animationend", handleAnimationEnd, { once: true });
  });

function handleKeyup(e) {
  if (!gameReady) {
    return;
  }
  if (guessesRemaining === 0) {
    return;
  }

  let pressedKey = String(e.key);
  if (pressedKey === "Backspace" && nextLetter !== 0) {
    deleteLetter();
    return;
  }

  if (pressedKey === "Enter") {
    checkGuess();
    return;
  }

  let found = pressedKey.match(/[a-z]/gi);
  if (!found || found.length > 1) {
    return;
  } else {
    insertLetter(pressedKey);
  }
}

function handleKeyboardClick(e) {
  const target = e.target;

  if (!target.classList.contains("keyboard-button")) {
    return;
  }
  if (!gameReady) {
    return;
  }
  let key = target.textContent.trim();

  if (key === "Del") {
    key = "Backspace";
  } else if (key.length === 1) {
    // normalize single-letter keys to lowercase so behavior is consistent
    key = key.toLowerCase();
  }

  document.dispatchEvent(new KeyboardEvent("keyup", { key: key }));
}

document.addEventListener("keyup", handleKeyup);
document.getElementById("keyboard-cont").addEventListener("click", handleKeyboardClick);

initBoard();
const retryBtn = document.getElementById('retry-button');
if (retryBtn) {
  retryBtn.addEventListener('click', () => {
    loadRightGuess();
  });
}

loadRightGuess();