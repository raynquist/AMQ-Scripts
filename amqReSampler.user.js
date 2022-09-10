// ==UserScript==
// @name         AMQ ReSampler
// @namespace    https://github.com/TheJoseph98
// @version      0.0.1
// @description  Listen to shorter samples without decreasing the guess time
// @author       raynquist
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqReSampler.user.js
// ==/UserScript==

// don't load on login page
if (document.getElementById("startPage")) return;

// Wait until the LOADING... screen is hidden and load script
let loadInterval = setInterval(() => {
    if (document.getElementById("loadingScreen").classList.contains("hidden")) {
        setup();
        clearInterval(loadInterval);
    }
}, 500);

let enabled = false;
let songStartTime = 0;
let buzzerTime = 0;
let listenTime = 2000;
let initialSilenceTime = 1000;

let answerHandler;


function showBuzzMessage(buzzTime) {
    gameChat.systemMessage(`Song ${parseInt($("#qpCurrentSongCount").text())}, buzz: ${buzzTime}`);
}

function formatTime(time) {
    let formattedTime = "";
    let milliseconds = Math.floor(time % 1000);
    let seconds = Math.floor(time / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let secondsLeft = seconds - minutes * 60;
    let minutesLeft = minutes - hours * 60;
    if (hours > 0) {
        formattedTime += hours + ":";
    }
    if (minutes > 0) {
        formattedTime += (minutesLeft < 10 && hours > 0) ? "0" + minutesLeft + ":" : minutesLeft + ":";
    }
    formattedTime += (secondsLeft < 10 && minutes > 0) ? "0" + secondsLeft + "." : secondsLeft + ".";
    if (milliseconds < 10) {
        formattedTime += "00" + milliseconds;
    }
    else if (milliseconds < 100) {
        formattedTime += "0" + milliseconds;
    }
    else {
        formattedTime += milliseconds;
    }
    return formattedTime;
}

function unmute() {
    volumeController.muted = false;
    volumeController.adjustVolume();
}

function mute() {
    volumeController.muted = true;
    volumeController.adjustVolume();
}

function playSample() {
    unmute();
    songStartTime = Date.now();
    setTimeout(() => {
         mute();
         buzzerTime = Date.now();
         showBuzzMessage(formatTime(buzzerTime - songStartTime));
    }, listenTime)
}

function displaySampleLength() {
    gameChat.systemMessage(`Sample Length = ${formatTime(listenTime)}`);
}

function setup() {
    let quizReadyListener = new Listener("quiz ready", data => {
        // reset the event listener
        $("#qpAnswerInput").off("keypress", answerHandler);
        $("#qpAnswerInput").on("keypress", answerHandler);
    });

    let quizPlayNextSongListener = new Listener("play next song", data => {
        if (!enabled) {
            return;
        }

        // initial silence
        mute();

        // play sample
        setTimeout(() => {
            playSample();
        }, initialSilenceTime)
    });

    let quizAnswerResultsListener = new Listener("answer results", result => {
        if (!enabled) {
            return;
        }

        // unmute for the show answer phase
        unmute();
    });

    answerHandler = function (event) {
        if (!enabled) {
            return;
        }

        // on enter key, listen again
        if (event.which === 13) {
            if ($(this).val() === "") {
                playSample();
            }
        }
    };

    let oldWidth = $("#qpOptionContainer").width();
    $("#qpOptionContainer").width(oldWidth + 35 * 3);

    $("#qpOptionContainer > div").append($(`<div id="qpReSampleToggle" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-wheelchair-alt qpMenuItem"></i></div>`)
        .click(function () {
            if (enabled) {
                enabled = false;
                gameChat.systemMessage(`ReSampler disabled`);
                unmute();
            }
            else {
                enabled = true;
                gameChat.systemMessage(`ReSampler enabled`);
                displaySampleLength();
            }
        })
        .popover({
            placement: "bottom",
            content: "Toggle ReSampler",
            trigger: "hover"
        })
    );

    $("#qpOptionContainer > div").append($(`<div id="qpReSamplerDecreaseLength" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-minus qpMenuItem"></i></div>`)
        .click(function () {
            listenTime -= 100;
            displaySampleLength();
        })
        .popover({
            placement: "bottom",
            content: "Decrease ReSampler Sample Length",
            trigger: "hover"
        })
    );

    $("#qpOptionContainer > div").append($(`<div id="qpReSamplerIncreaseLength" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-plus qpMenuItem"></i></div>`)
        .click(function () {
            listenTime += 100;
            displaySampleLength();
        })
        .popover({
            placement: "bottom",
            content: "Increase ReSampler Sample Length",
            trigger: "hover"
        })
    );

    AMQ_addStyle(`
        #qpReSampleToggle {
            width: 30px;
            margin-right: 5px;
        }
        #qpReSamplerDecreaseLength {
            width: 30px;
            margin-right: 5px;
        }
        #qpReSamplerIncreaseLength {
            width: 30px;
            margin-right: 5px;
        }
    `);

    quizReadyListener.bindListener();
    quizAnswerResultsListener.bindListener();
    quizPlayNextSongListener.bindListener();

    AMQ_addScriptData({
        name: "ReSampler",
        author: "raynquist",
        description: `
            <p>Listen to shorter samples without decreasing the guess time</p>
            <p>Based on Buzzer by TheJoseph98 & Anopob</p>
        `
    });
}
