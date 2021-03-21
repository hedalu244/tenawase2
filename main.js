"use strict";
var handles = [];
var answers = [];
var log = [];
var n = 8;
var colors = [[10, 10, 10], [255, 0, 0], [210, 210, 0], [0, 190, 0], [0, 190, 230], [0, 0, 255], [210, 0, 210], [10, 10, 10]];
var canvas, context, width, height;
var canvas2, context2, height2;
var playMode;
var animationCount = 0;
var timer = 0;
const strokes = [];
function assure(a, b) {
    if (a instanceof b)
        return a;
    throw new TypeError(`${a} is not ${b.name}.`);
}
function euclid(dx, dy) { return Math.sqrt(dx * dx + dy * dy); }
function calcScore(handles, answers) {
    var sum = 0;
    for (var i = 0; i < n; i++)
        sum += euclid(handles[i].x - answers[i].x, handles[i].y - answers[i].y);
    return Math.floor(10000 / (1 + 10 * sum / height / (n - 1))) / 100;
}
function countUpTimer() {
    log.push(JSON.parse(JSON.stringify(handles)));
    if (playMode !== "play")
        return;
    timer++;
    assure(document.getElementById("timer"), HTMLSpanElement).innerText = pad("" + Math.floor(timer / 60)) + ":" + pad("" + timer % 60);
    setTimeout(countUpTimer, 1000);
    function pad(s) {
        if (s.length == 0)
            return "00";
        if (s.length == 1)
            return "0" + s;
        return s;
    }
}
//擬似正規分布
function normalRamdom() {
    return Math.log(1 / Math.random() - 1) / 0.58763;
}
function init() {
    height2 = Math.random() * 200 + 400;
    canvas2.height = height2;
    canvas2.width = height2 * width / height;
    canvas2.style.marginLeft = (Math.random() * (window.innerWidth - canvas2.width)) + "px";
    log = [];
    timer = 0;
    let answerA = { x: Math.floor(Math.random() * (width - 24) + 12), y: 12 };
    let answerB = { x: Math.floor(Math.random() * (width - 24) + 12), y: height - 12 };
    let preAnswers = [];
    while (preAnswers.length < n - 2) {
        var x = Math.random() * (width - 24) + 12;
        var y = Math.random() * (height - 24) + 12;
        var d = y + normalRamdom() * 20;
        if ([...preAnswers, answerA, answerB].every(a => (50 < euclid(a.x - x, a.y - y))))
            preAnswers.push({ x, y, d });
    }
    answers = [answerA, ...preAnswers.sort((a, b) => a.d - b.d), answerB];
    const offset = (width - Math.min(...answers.map(coord => coord.x)) - Math.max(...answers.map(coord => coord.x))) / 2;
    answers = answers.map(coord => ({ x: coord.x + offset, y: coord.y }));
    handles = answers.map(coord => {
        return {
            x: Math.max(0, Math.min(width, coord.x + normalRamdom() * 0.05 * height)),
            y: Math.max(0, Math.min(height, coord.y + normalRamdom() * 0.05 * height))
        };
    });
    handles[0].y = 12;
    handles[n - 1].y = height - 12;
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
    let control = assure(document.getElementById("colors"), HTMLUListElement);
    control.innerHTML = "";
    for (let i = 0; i < colors.length; i++) {
        let li = document.createElement("li");
        control.appendChild(li);
        let a = document.createElement("input");
        a.type = "radio";
        a.id = "color" + i;
        a.name = "colors";
        a.checked = i === 0;
        li.appendChild(a);
        let b = document.createElement("label");
        b.setAttribute("for", a.id);
        b.innerHTML = "<span></span>";
        b.style.color = "rgb(" + colors[i] + ")";
        b.classList.add("colorSelect");
        li.appendChild(b);
    }
    assure(document.getElementById("pitch"), HTMLInputElement).value = "100";
    assure(document.getElementById("timer"), HTMLSpanElement).innerText = "00:00";
    setPlayMode("ready");
}
function getPitch() {
    var x = +assure(document.getElementById("pitch"), HTMLInputElement).value * 0.01;
    var a = 20;
    var b = 3;
    return a * (Math.exp(b * x) - 1) / b + 1;
}
function getSelected() {
    return Array.from(document.getElementsByName("colors")).findIndex(item => item instanceof HTMLInputElement && item.checked);
}
function left() {
    const selected = getSelected();
    handles[selected].x -= getPitch();
    if (handles[selected].x < 0)
        handles[selected].x = 0;
    navigator.vibrate(100);
    setPlayMode("play");
}
function right() {
    const selected = getSelected();
    handles[selected].x += getPitch();
    if (width < handles[selected].x)
        handles[selected].x = width;
    navigator.vibrate(100);
    setPlayMode("play");
}
function up() {
    const selected = getSelected();
    if (selected === 0 || selected === n - 1)
        return;
    handles[selected].y -= getPitch();
    if (handles[selected].y < 0)
        handles[selected].y = 0;
    navigator.vibrate(100);
    setPlayMode("play");
}
function down() {
    const selected = getSelected();
    if (selected === 0 || selected === n - 1)
        return;
    handles[selected].y += getPitch();
    if (height < handles[selected].y)
        handles[selected].y = height;
    navigator.vibrate(100);
    setPlayMode("play");
}
const minFlick = 30;
function move(stroke) {
    setPlayMode("play");
    const dx = stroke.log[stroke.log.length - 1].x - stroke.log[0].x;
    const dy = stroke.log[stroke.log.length - 1].y - stroke.log[0].y;
    const d = euclid(dx, dy);
    if (minFlick < d) {
        const selected = getSelected();
        const speed = getPitch() / 60;
        const cos = dx / d;
        const sin = dy / d;
        handles[selected].x += speed * cos;
        handles[selected].x = Math.max(0, Math.min(width, handles[selected].x));
        if (selected !== 0 && selected !== n - 1) {
            handles[selected].y += speed * sin;
            handles[selected].y = Math.max(0, Math.min(height, handles[selected].y));
        }
    }
}
function draw2() {
    context2.clearRect(0, 0, width, height);
    for (var i = 0; i < n; i++) {
        context2.fillStyle = "rgba(" + colors[i] + ", 0.8)";
        context2.beginPath();
        context2.arc(answers[i].x * height2 / height, answers[i].y * height2 / height, 10 * height2 / height, 0, 2 * Math.PI);
        context2.fill();
    }
}
function setPlayMode(mode) {
    let compareButton = assure(document.getElementById("compare"), HTMLButtonElement);
    let backButton = assure(document.getElementById("back"), HTMLButtonElement);
    let nextButton = assure(document.getElementById("next"), HTMLButtonElement);
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
                context.clearRect(0, 0, width, height);
                for (var i = 0; i < n; i++) {
                    context.fillStyle = "rgba(" + colors[i] + ", 0.8)";
                    context.beginPath();
                    context.arc(handles[i].x, handles[i].y, 10, 0, 2 * Math.PI);
                    context.fill();
                }
            }
            break;
        case "compare":
            {
                animationCount++;
                let frame = Math.min(log.length - 1, Math.floor(animationCount / 3));
                context.clearRect(0, 0, width, height);
                context.font = "140px sans-serif";
                context.textAlign = "center";
                context.fillStyle = "lightgray";
                context.fillText("" + calcScore(handles, answers), canvas.width / 2, 200);
                function graphArea(x, y) {
                    return [x * canvas.width, y * (canvas.height)];
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
                for (var i = 0; i <= frame; i++) {
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
                context.fillRect(0, 0, width, height);
                for (var i = 0; i < n; i++) {
                    context.fillStyle = "rgba(" + colors[i] + ", 0.5)";
                    context.beginPath();
                    context.arc(answers[i].x, answers[i].y, 10, 0, 2 * Math.PI);
                    context.fill();
                    context.fillStyle = "rgba(" + colors[i] + ", 0.8)";
                    context.beginPath();
                    context.arc(log[frame][i].x, log[frame][i].y, 10, 0, 2 * Math.PI);
                    context.fill();
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
function update() {
    strokes.forEach(stroke => move(stroke));
    draw();
    drawVirtualStick();
    requestAnimationFrame(update);
}
window.onload = () => {
    canvas = assure(document.getElementById("canvas"), HTMLCanvasElement);
    context = assure(canvas.getContext("2d"), CanvasRenderingContext2D);
    width = canvas.width;
    height = canvas.height;
    canvas2 = assure(document.getElementById("canvas2"), HTMLCanvasElement);
    context2 = assure(canvas2.getContext("2d"), CanvasRenderingContext2D);
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
    init();
    update();
};
