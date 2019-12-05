var handles = [];
var answers = [];
var n = 8;
var colors = [[0, 0, 0], [0, 0, 0], [255, 0, 0], [0, 190, 0], [0, 0, 255], [0, 190, 230], [210, 0, 210], [210, 210, 0]];
var colorName = ["", "", "red", "green", "blue", "sky", "violet", "yellow"]
var canvas, ctx, width, height;
var canvas2, ctx2, height2;
var holding;
var mouseX, mouseY;

function euclid(dx, dy){ return Math.sqrt(dx*dx + dy*dy); }

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  width = canvas.width;
  height = canvas.height;


  canvas2 = document.getElementById("canvas2");
  ctx2 = canvas2.getContext("2d");
  height2 = Math.random() * 200 + 400;
  canvas2.height = height2;
  canvas2.width = height2 * width / height;
  canvas2.style.marginLeft = (Math.random()*700 + 100)+"px";

  handles = [];
  answers = []

  var x = Math.floor(Math.random()* width);
  handles.push([x, 10]);
  answers.push([x, 10])
  x = Math.floor(Math.random()* width);
  handles.push([x, height - 10]);
  answers.push([x, height - 10])
  for(var i=2; i < n; i++) {
    var x = Math.floor(Math.random()* width);
    var y = Math.floor(Math.random()* height);
    handles.push([x, y]);
    var x = Math.floor(Math.random()* width);
    var y = Math.floor(Math.random()* height);
    answers.push([x, y]);
  }
  draw2();

  canvas.onmousedown = (event)=>{
    event.preventDefault();
    mouseX = event.offsetX;
    mouseY = event.offsetY;
    for(var i=2; i < n; i++) {
      if(euclid(handles[i][0] - mouseX, handles[i][1] - mouseY) < 10) holding = handles[i];
    }
    update();
  };
  canvas.onmousemove = (event)=>{
    event.preventDefault();
    mouseX = event.offsetX;
    mouseY = event.offsetY;
  }
	canvas.onmouseup = canvas.ontouchend = (event)=>{
    event.preventDefault();
    holding = null;
  };
  let control = document.getElementById("control");
  control.innerText = "";
  for(var i = 2; i < colors.length; i++) {
    a = document.createElement("option")
    a.innerText = colorName[i]
    a.style.backgroundColor = "rgb(" + colors[i] + ")";
    a.value = "" + i;
    if(i==2) a.selected = true;
    control.appendChild(a);
  }
  control.onchange = () => {
    var select = +document.getElementById("control").value;
    control.style.backgroundColor = "rgb(" + colors[select] + ")";
  }
  control.style.backgroundColor = "rgb(" + colors[2] + ")";

  document.getElementById("pitch").value = "25";
  draw();
}

function left(){
  var select = +document.getElementById("control").value;
  var pitch = Math.pow(1.15, +document.getElementById("pitch").value);
  handles[select][0] -= pitch;
  if(handles[select][0] < 0) handles[select][0] = 0;
  draw();
}
function right(){
  var select = +document.getElementById("control").value;
  var pitch = Math.pow(1.15, +document.getElementById("pitch").value);
  handles[select][0] += pitch;
  if(width < handles[select][0]) handles[select][0] = width;
  draw();
}
function up(){
  var select = +document.getElementById("control").value;
  var pitch = Math.pow(1.15, +document.getElementById("pitch").value);
  handles[select][1] -= pitch;
  if(handles[select][1] < 0) handles[select][1] = 0;
  draw();
}
function down(){
  var select = +document.getElementById("control").value;
  var pitch = Math.pow(1.15, +document.getElementById("pitch").value);
  handles[select][1] += pitch;
  if(height < handles[select][1]) handles[select][1] = height;
  draw();
}

function update(){
  if(!holding) return;

  holding[0] = mouseX;
  holding[1] = mouseY;
  draw();

  setTimeout(update, 16);
}

function draw(){
  ctx.clearRect(0, 0, width, height);
  for(var i=0; i < n; i++) {
    ctx.fillStyle = "rgba(" + colors[i] + ", 0.8)";
    ctx.beginPath();
    ctx.arc(handles[i][0], handles[i][1], 10, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function draw2(){
  ctx2.clearRect(0, 0, width, height);
  for(var i=0; i < n; i++) {
    ctx2.fillStyle = "rgba(" + colors[i] + ", 0.8)";
    ctx2.beginPath();
    ctx2.arc(answers[i][0] * height2 / height, answers[i][1] * height2 / height, 10 * height2 / height, 0, 2 * Math.PI);
    ctx2.fill();
  }
}

function test(){
  var sum = 0;
  ctx.clearRect(0, 0, width, height);
  for(var i=0; i < n; i++) {
    ctx.fillStyle = "rgba(" + colors[i] + ", 0.8)";
    ctx.beginPath();
    ctx.arc(handles[i][0], handles[i][1], 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "rgba(" + colors[i] + ", 0.5)";
    ctx.beginPath();
    ctx.arc(answers[i][0], answers[i][1], 10, 0, 2 * Math.PI);
    ctx.fill();
    sum += euclid(handles[i][0] - answers[i][0], handles[i][1] - answers[i][1]);
  }
  score = Math.floor(10000 / (1 + 10 * sum / height / (n - 2))) / 100;
  setTimeout(()=>alert(Math.floor(sum * 100) / 100 + "px の誤差\n" + score + "点"), 10);
}

window.onload = init;
