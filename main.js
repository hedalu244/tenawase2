"use strict";
let handles = [];
let answers = [];
let log = [];
const n = 8;
let colors = [[10, 10, 10], [255, 0, 0], [210, 210, 0], [0, 190, 0], [0, 190, 230], [0, 0, 255], [210, 0, 210], [10, 10, 10]];
let canvas, context;
let canvas2, context2;
let pitch, timer;
let playMode;
let animationCount = 0;
let timerCount = 0;
const strokes = [];
function assure(a, b) {
    if (a instanceof b)
        return a;
    throw new TypeError(`${a} is not ${b.name}.`);
}
function euclid(dx, dy) { return Math.sqrt(dx * dx + dy * dy); }
function calcScore(handles, answers) {
    let sum = 0;
    for (let i = 0; i < n; i++)
        sum += euclid(handles[i].x - answers[i].x, handles[i].y - answers[i].y);
    return 100 / (1 + 11.4 * sum / canvas.height / n);
}
function countUpTimer() {
    log.push(JSON.parse(JSON.stringify(handles)));
    if (playMode !== "play")
        return;
    timerCount++;
    timer.innerText = pad("" + Math.floor(timerCount / 60)) + ":" + pad("" + timerCount % 60);
    setTimeout(countUpTimer, 1000);
    function pad(s) {
        if (s.length == 0)
            return "00";
        if (s.length == 1)
            return "0" + s;
        return s;
    }
}
//正規分布
function normalRamdom() {
    return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
}
function init() {
    const height2 = Math.random() * 200 + 400;
    canvas2.height = height2;
    canvas2.width = height2 * canvas.width / canvas.height;
    canvas2.style.marginLeft = (Math.random() * (window.innerWidth - canvas2.width)) + "px";
    log = [];
    timerCount = 0;
    const answerA = { x: Math.floor(Math.random() * (canvas.width - 24) + 12), y: 12 };
    const answerB = { x: Math.floor(Math.random() * (canvas.width - 24) + 12), y: canvas.height - 12 };
    const preAnswers = [];
    while (preAnswers.length < n - 2) {
        let x = Math.random() * (canvas.width - 24) + 12;
        let y = Math.random() * (canvas.height - 24) + 12;
        let d = y + normalRamdom() * 20;
        if ([...preAnswers, answerA, answerB].every(a => (50 < euclid(a.x - x, a.y - y))))
            preAnswers.push({ x, y, d });
    }
    const offset = (canvas.width
        - Math.min(...[...preAnswers, answerA, answerB].map(coord => coord.x))
        - Math.max(...[...preAnswers, answerA, answerB].map(coord => coord.x))) / 2;
    answers = [answerA, ...preAnswers.sort((a, b) => a.d - b.d), answerB]
        .map(coord => ({ x: coord.x + offset, y: coord.y }));
    handles = answers.map(coord => {
        return {
            x: Math.max(0, Math.min(canvas.width, coord.x + normalRamdom() * 0.1 * canvas.height)),
            y: Math.max(0, Math.min(canvas.height, coord.y + normalRamdom() * 0.1 * canvas.height))
        };
    });
    handles[0].y = answers[0].y;
    handles[n - 1].y = answers[n - 1].y;
    log.push(JSON.parse(JSON.stringify(handles)));
    draw2();
    document.onkeydown = (event) => {
        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                up();
                break;
            case "ArrowDown":
                event.preventDefault();
                down();
                break;
            case "ArrowLeft":
                event.preventDefault();
                left();
                break;
            case "ArrowRight":
                event.preventDefault();
                right();
                break;
        }
    };
    pitch.value = "100";
    timer.innerText = "00:00";
    setPlayMode("ready");
}
function getPitch() {
    const x = +pitch.value / +pitch.max;
    const a = 2.1;
    const b = 1.7;
    return a * (Math.exp(b * x) - 1) / (Math.exp(b) - 1);
}
function getSelected() {
    return Array.from(document.getElementsByName("colors")).findIndex(item => item instanceof HTMLInputElement && item.checked);
}
function left() {
    const selected = getSelected();
    handles[selected].x -= getPitch() * 60;
    if (handles[selected].x < 0)
        handles[selected].x = 0;
    navigator.vibrate(100);
    setPlayMode("play");
}
function right() {
    const selected = getSelected();
    handles[selected].x += getPitch() * 60;
    if (canvas.width < handles[selected].x)
        handles[selected].x = canvas.width;
    navigator.vibrate(100);
    setPlayMode("play");
}
function up() {
    const selected = getSelected();
    if (selected === 0 || selected === n - 1)
        return;
    handles[selected].y -= getPitch() * 60;
    if (handles[selected].y < 0)
        handles[selected].y = 0;
    navigator.vibrate(100);
    setPlayMode("play");
}
function down() {
    const selected = getSelected();
    if (selected === 0 || selected === n - 1)
        return;
    handles[selected].y += getPitch() * 60;
    if (canvas.height < handles[selected].y)
        handles[selected].y = canvas.height;
    navigator.vibrate(100);
    setPlayMode("play");
}
const minFlick = 30;
function move(stroke) {
    setPlayMode("play");
    const dx = stroke.log[stroke.log.length - 1].x - stroke.log[0].x;
    const dy = stroke.log[stroke.log.length - 1].y - stroke.log[0].y;
    const d = euclid(dx, dy);
    if (d < minFlick)
        return false;
    const selected = getSelected();
    const speed = getPitch();
    const cos = dx / d;
    const sin = dy / d;
    handles[selected].x += speed * cos;
    handles[selected].x = Math.max(0, Math.min(canvas.width, handles[selected].x));
    if (selected !== 0 && selected !== n - 1) {
        handles[selected].y += speed * sin;
        handles[selected].y = Math.max(0, Math.min(canvas.height, handles[selected].y));
    }
    return true;
}
function draw2() {
    context2.clearRect(0, 0, canvas2.width, canvas2.height);
    for (let i = 0; i < n; i++) {
        context2.fillStyle = "rgba(" + colors[i] + ", 0.8)";
        context2.beginPath();
        context2.arc(answers[i].x * canvas2.height / canvas.height, answers[i].y * canvas2.height / canvas.height, 10 * canvas2.height / canvas.height, 0, 2 * Math.PI);
        context2.fill();
    }
}
function setPlayMode(mode) {
    const compareButton = assure(document.getElementById("compare"), HTMLButtonElement);
    const backButton = assure(document.getElementById("back"), HTMLButtonElement);
    const nextButton = assure(document.getElementById("next"), HTMLButtonElement);
    if (mode !== "compare") {
        compareButton.disabled = false;
        compareButton.style.display = "inline-block";
        backButton.disabled = true;
        backButton.style.display = "none";
        nextButton.disabled = true;
        nextButton.style.display = "none";
    }
    if (mode == "play" && playMode !== "play") {
        playMode = mode;
        countUpTimer();
    }
    if (mode === "compare") {
        compareButton.disabled = true;
        compareButton.style.display = "none";
        backButton.disabled = false;
        backButton.style.display = "inline-block";
        nextButton.disabled = false;
        nextButton.style.display = "inline-block";
        animationCount = 0;
    }
    playMode = mode;
}
function draw() {
    switch (playMode) {
        case "ready":
        case "play":
            {
                context.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < n; i++) {
                    context.fillStyle = "rgba(" + colors[i] + ", 0.8)";
                    context.beginPath();
                    context.arc(handles[i].x, handles[i].y, 10, 0, 2 * Math.PI);
                    context.fill();
                }
            }
            break;
        case "compare":
            {
                const frame = Math.min(log.length - 1, Math.floor(animationCount / 3));
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.font = "140px sans-serif";
                context.textAlign = "center";
                context.fillStyle = "lightgray";
                context.fillText(calcScore(handles, answers).toFixed(2), canvas.width / 2, 200);
                function graphArea(x, y) {
                    return [x * canvas.width, y * canvas.height];
                }
                context.strokeStyle = "gray";
                context.beginPath();
                context.moveTo(...graphArea(0, 0.1));
                context.lineTo(...graphArea(1, 0.1));
                context.stroke();
                context.beginPath();
                context.moveTo(...graphArea(0, 0.2));
                context.lineTo(...graphArea(1, 0.2));
                context.stroke();
                context.beginPath();
                context.moveTo(...graphArea(0, 0.3));
                context.lineTo(...graphArea(1, 0.3));
                context.stroke();
                context.strokeStyle = "black";
                context.beginPath();
                context.moveTo(...graphArea(0, 1));
                let highest = 0;
                let score = 0;
                for (let i = 0; i <= frame; i++) {
                    score = calcScore(log[i], answers);
                    highest = Math.max(highest, score);
                    context.lineTo(...graphArea(i / log.length, 1 - score / 100));
                }
                context.stroke();
                context.strokeStyle = "red";
                context.beginPath();
                context.moveTo(...graphArea(0, 1 - highest / 100));
                context.lineTo(...graphArea(1, 1 - highest / 100));
                context.stroke();
                context.strokeStyle = "green";
                context.beginPath();
                context.moveTo(...graphArea(0, 1 - score / 100));
                context.lineTo(...graphArea(1, 1 - score / 100));
                context.stroke();
                context.fillStyle = "rgba(255, 255, 255, 0.2)";
                context.fillRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < n; i++) {
                    context.fillStyle = "rgba(" + colors[i] + ", 0.5)";
                    context.beginPath();
                    context.arc(answers[i].x, answers[i].y, 10, 0, 2 * Math.PI);
                    context.fill();
                    context.fillStyle = "rgba(" + colors[i] + ", 0.8)";
                    context.beginPath();
                    context.arc(log[frame][i].x, log[frame][i].y, 10, 0, 2 * Math.PI);
                    context.fill();
                }
                for (let i = 60; i <= frame; i += 60) {
                    context.strokeStyle = "#00000033";
                    context.beginPath();
                    context.moveTo(...graphArea(i / log.length, 0));
                    context.lineTo(...graphArea(i / log.length, 1));
                    context.stroke();
                    context.font = "30px sans-serif";
                    context.textAlign = "right";
                    context.fillStyle = "gray";
                    context.fillText("" + i / 60 + ":00", graphArea(i / log.length, 1)[0], canvas.height - 80);
                    context.fillText(calcScore(log[i], answers).toFixed(2), graphArea(i / log.length, 1)[0], canvas.height - 40);
                }
            }
            break;
    }
}
function drawVirtualStick() {
    const outerStick = assure(document.getElementById("outerstick"), HTMLDivElement);
    const innerStick = assure(document.getElementById("innerstick"), HTMLDivElement);
    if (strokes.length === 0)
        outerStick.style.display = "none";
    else {
        outerStick.style.display = "block";
        const stroke = strokes[0];
        const dx = stroke.log[stroke.log.length - 1].x - stroke.log[0].x;
        const dy = stroke.log[stroke.log.length - 1].y - stroke.log[0].y;
        const d = euclid(dx, dy);
        outerStick.style.left = stroke.log[0].x + "px";
        outerStick.style.top = stroke.log[0].y + "px";
        if (d < minFlick) {
            innerStick.style.left = "0px";
            innerStick.style.top = "0px";
        }
        else {
            const x = dx / d * Math.min(d, 100);
            const y = dy / d * Math.min(d, 100);
            innerStick.style.left = x + "px";
            innerStick.style.top = y + "px";
        }
    }
}
let moved = false;
function update() {
    animationCount++;
    if (0 < strokes.length && move(strokes[0])) {
        if (!moved)
            navigator.vibrate(80);
        moved = true;
    }
    else {
        if (moved)
            navigator.vibrate(60);
        moved = false;
    }
    draw();
    drawVirtualStick();
    requestAnimationFrame(update);
}
window.onload = () => {
    canvas = assure(document.getElementById("canvas"), HTMLCanvasElement);
    context = assure(canvas.getContext("2d"), CanvasRenderingContext2D);
    canvas2 = assure(document.getElementById("canvas2"), HTMLCanvasElement);
    context2 = assure(canvas2.getContext("2d"), CanvasRenderingContext2D);
    pitch = assure(document.getElementById("pitch"), HTMLInputElement);
    timer = assure(document.getElementById("timer"), HTMLSpanElement);
    const toucharea = assure(document.getElementById("toucharea"), HTMLDivElement);
    toucharea.addEventListener("touchstart", (event) => {
        event.preventDefault();
        const rect = toucharea.getBoundingClientRect();
        Array.from(event.changedTouches).forEach(touch => {
            const stroke = {
                id: touch.identifier,
                log: [{ x: touch.clientX - rect.left, y: touch.clientY - rect.top }],
            };
            strokes.push(stroke);
        });
    }, false);
    toucharea.addEventListener("touchmove", (event) => {
        event.preventDefault();
        const rect = toucharea.getBoundingClientRect();
        Array.from(event.changedTouches).forEach(touch => {
            const stroke = strokes.find(x => x.id === touch.identifier);
            if (stroke === undefined)
                return;
            stroke.log.push({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
        });
    }, false);
    toucharea.addEventListener("touchend", (event) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            const strokeIndex = strokes.findIndex(x => x.id === touch.identifier);
            if (strokeIndex === -1)
                return;
            const stroke = strokes[strokeIndex];
            strokes.splice(strokeIndex, 1); // remove it; we're done
        });
    }, false);
    toucharea.addEventListener("touchcancel", (event) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            const strokeIndex = strokes.findIndex(x => x.id === touch.identifier);
            if (strokeIndex === -1)
                return;
            strokes.splice(strokeIndex, 1); // remove it; we're done
        });
    }, false);
    const select = assure(document.getElementById("select"), HTMLUListElement);
    for (let i = 0; i < colors.length; i++) {
        const li = document.createElement("li");
        select.appendChild(li);
        const a = document.createElement("input");
        a.type = "radio";
        a.id = "color" + i;
        a.name = "colors";
        a.checked = i === 0;
        a.onchange = () => navigator.vibrate(60);
        li.appendChild(a);
        const b = document.createElement("label");
        b.setAttribute("for", a.id);
        b.innerHTML = "<span></span>";
        b.style.color = "rgb(" + colors[i] + ")";
        b.classList.add("colorSelect");
        li.appendChild(b);
    }
    init();
    update();
};
