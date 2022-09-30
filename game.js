import { countries as allCountries } from "https://countries.ekmwest.io/countries.js";

const gameElement = document.querySelector('#game');

const DB = {
    countries: allCountries.filter(country => country.independent)
};

DB.continents = [...new Set(DB.countries.map(country => country.continent))]

const State = {
    countries: [],
    possibleCountries: [],
    step: 0,
    points: 0
}

window.initGame = function () {
    gameElement.innerHTML = selectContinentsFormHTML();
}

window.onload = initGame;

function initState(countries, possibleCountries) {
    State.countries = countries;
    State.possibleCountries = possibleCountries;
    State.step = null;
    State.points = 0;
}



/* =====================================================================
    ACTIONS
    ===================================================================== */

window.start = function () {
    const checkedContinents = document.querySelectorAll('input:checked');

    const continents = [...checkedContinents].map(cc => cc.name);

    const possibleCountries = DB.countries.filter(country => continents.includes(country.continent));

    const countries = getRandom(possibleCountries, 20);

    initState(countries, possibleCountries);

    next();
}

window.guess = function (guessedCountryCode, correctCountryCode) {
    const correctAnswer = guessedCountryCode === correctCountryCode;
    State.points = correctAnswer ? State.points + 1 : State.points;
    const wait = correctAnswer ? 1000 : 3000;

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

    gameElement.innerHTML = stepHTML(country, selectableCountries, State.points, State.step, guessFlag, State.step, State.countries.length);
}

window.finish = function () {
    gameElement.innerHTML = resultsHTML(State.points, State.step);
}



/* =====================================================================
    HTML
    ===================================================================== */

function stepHTML(country, selectableCountries, points, possiblePoints, guessFlag, progressValue, progressMax) {
    let html = '';

    html += `<p class="score">${points} / ${possiblePoints}</p>`;
    html += `<br>`;
    html += `<progress class="game-progress" value="${progressValue}" max="${progressMax}"></progress>`;
    html += '<hr>';

    if (guessFlag) {
        html += `<h1 class="guess-country">${country.common_name}</h1>`;
    } else {
        html += `<img class="guess-flag" src="${country.flag_url}">`;
    }

    selectableCountries.forEach(selectableCountry => {
        if (guessFlag) {
            html += `<img class="select-flag" data-country-code="${selectableCountry.code}" src="${selectableCountry.flag_url}" onclick="guess('${selectableCountry.code}', '${country.code}')" />`;
        } else {
            html += `<span class="select-country" data-country-code="${selectableCountry.code}" onclick="guess('${selectableCountry.code}', '${country.code}')">${selectableCountry.common_name}</span>`;
        }
    });

    return html;
}

function resultsHTML(points, possiblePoints) {
    let html = '';

    html += '<h1>FINISH</h1>';
    html += `${points}/${possiblePoints}`;
    html += '<br><br>';
    html += '<button onclick="initGame()">New game</button>';

    return html;
}

function selectContinentsFormHTML() {
    let html = '';

    html += '<h1 class="game-of-flags">Game <span>of</span> Flags</h1>';

    DB.continents.forEach(continent => {
        html += `
            <label>
                <input type="checkbox" name="${continent}">
                <span>${continent}</span>
            </label>
        `;
    });

    html += '<br><br>';

    html += `
        <button onclick="start()">Start</button>
    `;

    return html;
}



/* =====================================================================
    UTILS
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
