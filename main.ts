var handles: Coord[] = [];
var answers: Coord[] = [];
var log: Coord[][] = [];
var n = 8;
var colors = [[10, 10, 10], [255, 0, 0], [210, 210, 0], [0, 190, 0], [0, 190, 230], [0, 0, 255], [210, 0, 210], [10, 10, 10]];
var canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, width: number, height: number;
var canvas2: HTMLCanvasElement, context2: CanvasRenderingContext2D, height2: number;
var playMode: "ready" | "play" | "compare";
var animationCount: number = 0;
var timer: number = 0;

function euclid(dx: number, dy: number): number { return Math.sqrt(dx * dx + dy * dy); }

function calcOffsettedAnswers(handles: Coord[], answers: Coord[]) {
    //横ズレ平均を算出
    var ave = 0;
    for (var i = 0; i < n; i++)
        ave += (handles[i].x - answers[i].x) / n;
    return answers.map(coord => ({ x: coord.x + ave, y: coord.y }));
}

function calcScore(handles: Coord[], answers: Coord[]) {
    let offsetted = calcOffsettedAnswers(handles, answers);
    var sum = 0;
    for (var i = 0; i < n; i++)
        sum += euclid(handles[i].x - offsetted[i].x, handles[i].y - offsetted[i].y);
    return Math.floor(10000 / (1 + 10 * sum / height / (n - 1))) / 100;
}

function countUpTimer() {
    log.push(JSON.parse(JSON.stringify(handles)));

    if (playMode !== "play") return;
    timer++;
    document.getElementById("timer").innerText = pad("" + Math.floor(timer / 60)) + ":" + pad("" + timer % 60);
    setTimeout(countUpTimer, 1000);
    function pad(s: string): string {
        if (s.length == 0) return "00";
        if (s.length == 1) return "0" + s;
        return s;
    }
}

//擬似正規分布
function normalRamdom() {
    return Math.log(1 / Math.random() - 1) / 0.58763;
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
            case "ArrowUp": event.preventDefault(); up(); break;
            case "ArrowDown": event.preventDefault(); down(); break;
            case "ArrowLeft": event.preventDefault(); left(); break;
            case "ArrowRight": event.preventDefault(); right(); break;
        }
    };

    let control = document.getElementById("colors");
    control.innerHTML = "";
    for (let i = 0; i < colors.length; i++) {
        let li = document.createElement("li");
        control.appendChild(li);

        let a = document.createElement("input");
        a.type = "radio";
        a.id = "color" + i;
        a.name = "colors";
        li.appendChild(a);

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
function getSelected() {
    return Array.from(document.getElementsByName("colors")).findIndex(item =>
        item instanceof HTMLInputElement && item.checked);
}

function left() {
    const selected = getSelected();
    handles[selected].x -= getPitch();
    if (handles[selected].x < 0) handles[selected].x = 0;
    navigator.vibrate(100);
    setPlayMode("play");
}
function right() {
    const selected = getSelected();
    handles[selected].x += getPitch();
    if (width < handles[selected].x) handles[selected].x = width;
    navigator.vibrate(100);
    setPlayMode("play");
}
function up() {
    const selected = getSelected();
    if (selected === 0 || selected === n - 1) return;
    handles[selected].y -= getPitch();
    if (handles[selected].y < 0) handles[selected].y = 0;
    navigator.vibrate(100);
    setPlayMode("play");
}
function down() {
    const selected = getSelected();
    if (selected === 0 || selected === n - 1) return;
    handles[selected].y += getPitch();
    if (height < handles[selected].y) handles[selected].y = height;
    navigator.vibrate(100);
    setPlayMode("play");
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

function setPlayMode(mode: "ready" | "play" | "compare") {
    let compareButton = document.getElementById("compare") as HTMLButtonElement;
    let backButton = document.getElementById("back") as HTMLButtonElement;
    let nextButton = document.getElementById("next") as HTMLButtonElement;

    if(mode !== "compare") {
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
    if (mode === "compare"){
        compareButton.disabled = true;
        compareButton.style.display = "none";

        backButton.disabled = false;
        backButton.style.display = "inline-block";
        nextButton.disabled = false;
        nextButton.style.display = "inline-block";

        animationCount = 0;
    }

    playMode = mode;

    draw();
}

window.onload = init;

interface Coord {
    x: number;
    y: number;
}
interface Stroke {
    log: Coord[];
    id: number;
}

const strokes: Stroke[] = [];
function strokeStart(stroke: Stroke) {
}
function strokeMove(stroke: Stroke) {
    draw();
}
function strokeEnd(stroke: Stroke) {
    draw();
    switch (isFrick(stroke)) {
        case "left": left(); break;
        case "right": right(); break;
        case "up": up(); break;
        case "down": down(); break;
    }
}
function draw() {
    switch (playMode) {
        case "ready":
        case "play": {
            context.clearRect(0, 0, width, height);
            for (var i = 0; i < n; i++) {
                context.fillStyle = "rgba(" + colors[i] + ", 0.8)";
                context.beginPath();
                context.arc(handles[i].x, handles[i].y, 10, 0, 2 * Math.PI);
                context.fill();
            }
        } break;
        case "compare": {
            animationCount++;
            let frame = Math.min(log.length - 1, Math.floor(animationCount / 3));
            context.clearRect(0, 0, width, height);

            context.font = "140px sans-serif";
            context.textAlign = "center";
            context.fillStyle = "lightgray";
            context.fillText("" + calcScore(handles, answers), canvas.width / 2, 200);

            function graphArea(x: number, y: number): [number, number] {
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

            let offsetted = calcOffsettedAnswers(log[frame], answers);

            for (var i = 0; i < n; i++) {
                context.fillStyle = "rgba(" + colors[i] + ", 0.5)";
                context.beginPath();
                context.arc(offsetted[i].x, offsetted[i].y, 10, 0, 2 * Math.PI);
                context.fill();

                context.fillStyle = "rgba(" + colors[i] + ", 0.8)";
                context.beginPath();
                context.arc(log[frame][i].x, log[frame][i].y, 10, 0, 2 * Math.PI);
                context.fill();
            }

            if (frame < log.length - 1) requestAnimationFrame(draw);
        } break;
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
function isFrick(stroke: Stroke) {
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
