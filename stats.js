// Retrieve stats from localStorage or initialize if not present
var stats = JSON.parse(localStorage.getItem('gameStats')) || {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0]
};

// Get the share button
const shareButton = document.getElementById('shareButton');

function initStats() {
    // Update stats

    // Get the <th> element by its ID
    var gamesPlayed = document.getElementById('played');
    var winPercentage = document.getElementById('wins');
    var currentStreak = document.getElementById('streak');
    var maxStreak = document.getElementById('maxstreak');
    var firstGuess = document.getElementById('firstguess');
    var secondGuess = document.getElementById('secondguess');
    var thirdGuess = document.getElementById('thirdguess');
    var fourthGuess = document.getElementById('fourthguess');
    var fifthGuess = document.getElementById('fifthguess');
    var sixthGuess = document.getElementById('sixthguess');

    // Update the text content of the <th> element
    gamesPlayed.textContent = stats.gamesPlayed.toString();
    // Check if there have been no games played
    if (stats.gamesPlayed == 0) {
        winPercentage.textContent = "0"
    } else {
        // ~~ rounds the percentage to a whole number
        winPercentage.textContent = ~~(stats.wins/stats.gamesPlayed * 100).toString();
    }
    currentStreak.textContent = stats.currentStreak.toString();
    maxStreak.textContent = stats.maxStreak.toString();
    // firstGuess.textContent = '1: ${firstGuess} game(s)';
    firstGuess.textContent = '1: ' + stats.guessDistribution[0].toString() + ' game(s)';
    secondGuess.textContent = '2: ' + stats.guessDistribution[1].toString() + ' game(s)';
    thirdGuess.textContent = '3: ' + stats.guessDistribution[2].toString() + ' game(s)';
    fourthGuess.textContent = '4: ' + stats.guessDistribution[3].toString() + ' game(s)';
    fifthGuess.textContent = '5: ' + stats.guessDistribution[4].toString() + ' game(s)';
    sixthGuess.textContent = '6: ' + stats.guessDistribution[5].toString() + ' game(s)';
}

// Add click event listener to the copy button
shareButton.addEventListener('click', async () => {
    try {
        // Get the stats for the share button
        const game = stats.gamesPlayed.toString();
        const guess = JSON.parse(localStorage.getItem('guessNumber'));
        const letterColors = JSON.parse(localStorage.getItem('letterColors'));
        const wordOfDay = JSON.parse(localStorage.getItem('wordOfDay')).toUpperCase();

        // Our variables for the Guess Distribution string
        var guessDistributionString = "";
        var guesses = 0;
        letterColors.forEach(subArray => {
            subArray.forEach(element => {
                if (element === "gray") {
                    guessDistributionString += "⬛"
                } else if (element === "gold") {
                    guessDistributionString += "🟨"
                } else if (element === "green") {
                    guessDistributionString += "🟩"
                }
            });
            guessDistributionString += "\n";
            guesses += 1
        });

        // Add the additional black rows
        if (guesses < 6) {
            const additionalRows = 6 - guesses;
            const blackRow = "⬛⬛⬛⬛⬛\n";
            const blackRows = blackRow.repeat(additionalRows);
            guessDistributionString += blackRows;
        }

        // Create the stats string
        const definitionURL = "https://www.urbandictionary.com/define.php?term=" + wordOfDay
        const statsString = "urbWord of the Day " + game.toString() + " " + guess.toString() + " / 6 \n" + guessDistributionString + wordOfDay + " Definition: " + definitionURL;

        // Add to the users clipboard
        await navigator.clipboard.writeText(statsString);
        alert('Text copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
});

initStats();
