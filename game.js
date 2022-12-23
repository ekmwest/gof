import { countries as allCountries } from "https://countries.ekmwest.io/countries.js";



/* =====================================================================
   Database
   ===================================================================== */

const DB = {
    countries: allCountries.filter(country => country.independent),
    continents: [...new Set(allCountries.filter(country => country.independent).map(country => country.continent))].sort()
};

window.DB = DB;



/* =====================================================================
   Constants
   ===================================================================== */

const rounds = 10;



/* =====================================================================
   Elements
   ===================================================================== */

const gameElement = document.querySelector('#game');



/* =====================================================================
   State
   ===================================================================== */

const State = {
    countries: [],
    possibleCountries: [],
    continents: [],
    step: 0,
    points: 0,
    guesses: [],
    startTime: 0,
    endTime: 0
}

window.State = State;



/* =====================================================================
   Load
   ===================================================================== */

window.onload = () => initGame();



/* =====================================================================
   Actions
   ===================================================================== */

function initState(countries, possibleCountries, continents) {
    State.countries = countries;
    State.possibleCountries = possibleCountries;
    State.continents = continents;
    State.step = null;
    State.points = 0;
    State.guesses = [];
    State.startTime = Date.now();
    State.endTime = 0;
}

window.initGame = function () {
    gameElement.innerHTML = selectContinentsFormHTML();
}

window.continentChecboxChange = function () {
    const checkedContinents = document.querySelectorAll('input:checked');
    const startGameButton = document.querySelector('[data-element=start-game-button]');

    if (checkedContinents.length < 1) {
        startGameButton.classList.add('DISABLED');
    } else {
        startGameButton.classList.remove('DISABLED');
    }
}

window.start = function () {
    const checkedContinents = document.querySelectorAll('input:checked');

    if (checkedContinents.length < 1) {
        return;
    }

    const continents = [...checkedContinents].map(cc => cc.name);

    const possibleCountries = DB.countries.filter(country => continents.includes(country.continent));

    const countries = getRandom(possibleCountries, rounds * continents.length);

    initState(countries, possibleCountries, continents);

    next();
}

window.guess = function (guessedCountryCode, correctCountryCode) {
    const correctAnswer = guessedCountryCode === correctCountryCode;

    State.points = correctAnswer ? State.points + 1 : State.points;
    const wait = correctAnswer ? 300 : 3000;
    correctAnswer ? State.guesses.push(true) : State.guesses.push(false);

    const correctElement = document.querySelector(`[data-country-code="${correctCountryCode}"]`);
    correctElement.classList.add('CORRECT');

    if (!correctAnswer) {
        const guessedElement = document.querySelector(`[data-country-code="${guessedCountryCode}"]`);
        guessedElement.classList.add('WRONG');
    }

    setTimeout(() => {
        next();
    }, wait);
}

window.next = function () {
    State.step = State.step === null ? 0 : State.step + 1;

    if (State.step === State.countries.length) {
        finish();
        return;
    }

    const country = State.countries[State.step];
    let selectableCountries = getRandom(State.possibleCountries, 20);

    if (!selectableCountries.some(c => c.name === country.name)) {
        let x = Math.floor(Math.random() * selectableCountries.length);
        selectableCountries[x] = country;
    }

    const guessFlag = Math.random() < 0.5;

    if (!guessFlag) {
        selectableCountries = selectableCountries.sort((a, b) => {
            if (a.common_name < b.common_name) {
                return -1;
            }
            if (a.common_name > b.common_name) {
                return 1;
            }
            return 0;
        });

        let sorted = selectableCountries.map(x => x.common_name);
    }

    gameElement.innerHTML = stepHTML(country, selectableCountries, State.points, State.step, guessFlag, State.step, State.countries.length, State.guesses);
}

window.finish = function () {
    State.endTime = Date.now();
    gameElement.innerHTML = resultsHTML(State.continents.length, State.points, State.step, State.endTime - State.startTime, State.countries.length, State.guesses);
}



/* =====================================================================
   Html
   ===================================================================== */

function stepHTML(country, selectableCountries, points, possiblePoints, guessFlag, progressValue, progressMax, guesses) {

    let html = "<div class='progress-bar'>";

    for (let s = 0; s < progressMax; s++) {
        if (guesses[s] === true) {
            html += "<span class='correct'></span>";
        } else if (guesses[s] === false) {
            html += "<span class='wrong'></span>";
        } else {
            html += "<span></span>";
        }
    }

    html += "</div>";

    if (guessFlag) {
        html += `<h1 class="guess-country">${country.common_name}</h1>`;
    } else {
        html += `<img class="guess-flag" src="${country.flag_url}">`;
    }

    selectableCountries.forEach(selectableCountry => {
        if (guessFlag) {
            html += `<img class="select-flag" data-country-code="${selectableCountry.code}" src="${selectableCountry.flag_url}" onclick="guess('${selectableCountry.code}', '${country.code}')" />`;
        } else {
            html += `<button class="select-country" data-country-code="${selectableCountry.code}" onclick="guess('${selectableCountry.code}', '${country.code}')">${selectableCountry.common_name}</button>`;
        }
    });

    html += `<div class="quit-game-panel">
                 <button class="quit-game-button" onclick="initGame()">Quit</button>
             </div>`;

    return html;
}

function resultsHTML(level, points, possiblePoints, time, progressMax, guesses) {
    let html = "<div class='progress-bar'>";

    for (let s = 0; s < progressMax; s++) {
        if (guesses[s] === true) {
            html += "<span class='correct'></span>";
        } else if (guesses[s] === false) {
            html += "<span class='wrong'></span>";
        } else {
            html += "<span></span>";
        }
    }

    html += "</div>";

    html += `<h1>${points}/${possiblePoints}</h1>
            <button onclick="initGame()" class="button" style="margin-top: 8px;">New Game</button>`;

    return html;
}

function selectContinentsFormHTML() {
    let html = '<h1 class="game-of-flags">Game <span>of</span> Flags</h1>';

    DB.continents.forEach(continent => {
        html += `
            <label class="switch" onchange="continentChecboxChange()">
                <input type="checkbox" name="${continent}" ${State.continents.includes(continent) ? "checked" : ""}>
                <span class="slider"></span>
                <span>${continent}</span>
            </label>
        `;
    });

    html += '<br><br>';

    const anyContinentSelected = DB.continents.some(c => State.continents.includes(c));

    html += `<button onclick="start()" data-element="start-game-button" class="button ${anyContinentSelected ? "" : "DISABLED"}">Start Game</button>`;

    return html;
}



/* =====================================================================
   Utils
   ===================================================================== */

function getRandom(arr, n) {
    let len = arr.length;

    if (n > len) {
        n = len;
    }

    let result = new Array(n);
    let taken = new Array(len);

    while (n--) {
        let x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }

    return result;
}

function totalScore(level, points, time) {
    return Math.floor(1000 * level * points / (90 + (time / 1000)));
}
