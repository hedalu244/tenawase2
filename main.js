"use strict";
var handles = [];
var answers = [];
var log = [];
var n = 8;
var colors = [[10, 10, 10], [10, 10, 10], [255, 0, 0], [210, 210, 0], [0, 190, 0], [0, 190, 230], [0, 0, 255], [210, 0, 210]];
var colorName = ["", "black", "red", "yellow", "green", "sky", "blue", "violet"];
var canvas, context, width, height;
var canvas2, context2, height2;
var canvas, context;
var selected;
var playMode;
var animationCount = 0;
var timer = 0;
function euclid(dx, dy) { return Math.sqrt(dx * dx + dy * dy); }
function calcScore(handles, answers) {
    var sum = 0;
    for (var i = 0; i < n; i++)
        sum += euclid(handles[i].x - answers[i].x, handles[i].y - answers[i].y);
    return Math.floor(10000 / (1 + 10 * sum / height / (n - 1))) / 100;
}
function countUpTimer() {
    if (playMode !== "play")
        return;
    timer++;
    document.getElementById("timer").innerText = pad("" + Math.floor(timer / 60)) + ":" + pad("" + timer % 60);
    setTimeout(countUpTimer, 1000);
    function pad(s) {
        if (s.length == 0)
            return "00";
        if (s.length == 1)
            return "0" + s;
        return s;
    }
}
function init() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;
    canvas2 = document.getElementById("canvas2");
    context2 = canvas2.getContext("2d");
    height2 = Math.random() * 200 + 400;
    canvas2.height = height2;
    canvas2.width = height2 * width / height;
    canvas2.style.marginLeft = (Math.random() * (window.innerWidth - canvas2.width)) + "px";
    handles = [];
    answers = [];
    log = [];
    selected = 0;
    timer = 0;
    var x = Math.floor(Math.random() * (width - 24) + 12);
    handles.push({ x, y: 12 });
    answers.push({ x, y: 12 });
    handles.push({ x: Math.floor(Math.random() * (width - 24) + 12), y: height - 12 });
    answers.push({ x: Math.floor(Math.random() * (width - 24) + 12), y: height - 12 });
    while (handles.length < n) {
        var x = Math.floor(Math.random() * (width - 24) + 12);
        var y = Math.floor(Math.random() * (height - 24) + 12);
        if (handles.every(a => (50 < euclid(a.x - x, a.y - y))))
            handles.push({ x, y });
    }
    while (answers.length < n) {
        var x = Math.floor(Math.random() * (width - 24) + 12);
        var y = Math.floor(Math.random() * (height - 24) + 12);
        if (answers.every(a => (50 < euclid(a.x - x, a.y - y))))
            answers.push({ x, y });
    }
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
    let control = document.getElementById("colors");
    control.innerHTML = "";
    for (let i = 1; i < colors.length; i++) {
        let li = document.createElement("li");
        control.appendChild(li);
        let a = document.createElement("input");
        a.type = "radio";
        a.id = "color" + i;
        a.name = "colors";
        li.appendChild(a);
        a.onchange = () => {
            selected = i;
            console.log(i);
        };
        let b = document.createElement("label");
        b.setAttribute("for", a.id);
        b.innerHTML = "<span></span>";
        b.style.color = "rgb(" + colors[i] + ")";
        b.classList.add("colorSelect");
        li.appendChild(b);
    }
    document.getElementById("pitch").value = "100";
    document.getElementById("timer").innerText = "00:00";
    canvas.addEventListener("touchstart", (event) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        Array.from(event.changedTouches).forEach(touch => {
            const stroke = {
                id: touch.identifier,
                log: [{ x: touch.clientX - rect.left, y: touch.clientY - rect.top }],
            };
            strokes.push(stroke);
            strokeStart(stroke);
        });
    }, false);
    canvas.addEventListener("touchmove", (event) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        Array.from(event.changedTouches).forEach(touch => {
            const stroke = strokes.find(x => x.id === touch.identifier);
            if (stroke === undefined)
                return;
            stroke.log.push({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
            strokeMove(stroke);
        });
    }, false);
    canvas.addEventListener("touchend", (event) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            const strokeIndex = strokes.findIndex(x => x.id === touch.identifier);
            if (strokeIndex === -1)
                return;
            const stroke = strokes[strokeIndex];
            strokes.splice(strokeIndex, 1); // remove it; we're done
            strokeEnd(stroke);
        });
    }, false);
    canvas.addEventListener("touchcancel", (event) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            const strokeIndex = strokes.findIndex(x => x.id === touch.identifier);
            if (strokeIndex === -1)
                return;
            strokes.splice(strokeIndex, 1); // remove it; we're done
        });
    }, false);
    setPlayMode("ready");
}
function getPitch() {
    var x = +document.getElementById("pitch").value * 0.01;
    var a = 20;
    var b = 3;
    return a * (Math.exp(b * x) - 1) / b + 1;
}
function left() {
    if (selected === 0)
        return;
    handles[selected].x -= getPitch();
    if (handles[selected].x < 0)
        handles[selected].x = 0;
    navigator.vibrate(100);
    setPlayMode("play");
    log.push(JSON.parse(JSON.stringify(handles)));
}
function right() {
    if (selected === 0)
        return;
    handles[selected].x += getPitch();
    if (width < handles[selected].x)
        handles[selected].x = width;
    navigator.vibrate(100);
    setPlayMode("play");
    log.push(JSON.parse(JSON.stringify(handles)));
}
function up() {
    if (selected === 0 || selected === 1)
        return;
    handles[selected].y -= getPitch();
    if (handles[selected].y < 0)
        handles[selected].y = 0;
    navigator.vibrate(100);
    setPlayMode("play");
    log.push(JSON.parse(JSON.stringify(handles)));
}
function down() {
    if (selected === 0 || selected === 1)
        return;
    handles[selected].y += getPitch();
    if (height < handles[selected].y)
        handles[selected].y = height;
    navigator.vibrate(100);
    setPlayMode("play");
    log.push(JSON.parse(JSON.stringify(handles)));
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
    if (mode == "play" && playMode !== "play") {
        playMode = mode;
        countUpTimer();
    }
    if (mode === "compare")
        animationCount = 0;
    playMode = mode;
    draw();
}
window.onload = init;
const strokes = [];
function strokeStart(stroke) {
}
function strokeMove(stroke) {
    draw();
}
function strokeEnd(stroke) {
    draw();
    switch (isFrick(stroke)) {
        case "left":
            left();
            break;
        case "right":
            right();
            break;
        case "up":
            up();
            break;
        case "down":
            down();
            break;
    }
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
                context.font = "100px sans-serif";
                context.textAlign = "center";
                if (frame === log.length - 1) {
                    context.fillStyle = "gray";
                    context.fillText("" + score, canvas.width / 2, 200);
                }
                for (var i = 0; i < n; i++) {
                    /*
                    context.fillStyle = "rgba(" + colors[i] + ", 0.8)";
                    context.beginPath();
                    context.arc(handles[i][0], handles[i][1], 10, 0, 2 * Math.PI);
                    context.fill();
                    */
                    context.fillStyle = "rgba(" + colors[i] + ", 0.5)";
                    context.beginPath();
                    context.arc(answers[i].x, answers[i].y, 10, 0, 2 * Math.PI);
                    context.fill();
                    context.fillStyle = "rgba(" + colors[i] + ", 0.8)";
                    context.beginPath();
                    context.arc(log[frame][i].x, log[frame][i].y, 10, 0, 2 * Math.PI);
                    context.fill();
                }
                if (frame < log.length - 1)
                    requestAnimationFrame(draw);
            }
            break;
    }
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    strokes.forEach((stroke) => {
        switch (isFrick(stroke)) {
            case "left":
                {
                    context.beginPath();
                    context.moveTo(stroke.log[0].x, stroke.log[0].y);
                    context.lineTo(stroke.log[0].x - 50, stroke.log[0].y - 50);
                    context.lineTo(stroke.log[0].x - 50, stroke.log[0].y + 50);
                    context.closePath();
                    context.fill();
                }
                break;
            case "right":
                {
                    context.beginPath();
                    context.moveTo(stroke.log[0].x, stroke.log[0].y);
                    context.lineTo(stroke.log[0].x + 50, stroke.log[0].y - 50);
                    context.lineTo(stroke.log[0].x + 50, stroke.log[0].y + 50);
                    context.closePath();
                    context.fill();
                }
                break;
            case "up":
                {
                    context.beginPath();
                    context.moveTo(stroke.log[0].x, stroke.log[0].y);
                    context.lineTo(stroke.log[0].x - 50, stroke.log[0].y - 50);
                    context.lineTo(stroke.log[0].x + 50, stroke.log[0].y - 50);
                    context.closePath();
                    context.fill();
                }
                break;
            case "down":
                {
                    context.beginPath();
                    context.moveTo(stroke.log[0].x, stroke.log[0].y);
                    context.lineTo(stroke.log[0].x - 50, stroke.log[0].y + 50);
                    context.lineTo(stroke.log[0].x + 50, stroke.log[0].y + 50);
                    context.closePath();
                    context.fill();
                }
                break;
        }
    });
}
const flickRange = 50;
function isFrick(stroke) {
    const dx = stroke.log[stroke.log.length - 1].x - stroke.log[0].x;
    const dy = stroke.log[stroke.log.length - 1].y - stroke.log[0].y;
    if (dx * dx + dy * dy < flickRange * flickRange)
        return null;
    if (Math.abs(dy) < Math.abs(dx)) {
        return (0 < dx) ? "right" : "left";
    }
    else {
        return (0 < dy) ? "down" : "up";
    }
}
