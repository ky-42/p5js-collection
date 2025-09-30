//Class of the squares that are being drawn
class squareSection {
  constructor(xpos, ypos, rotation) {
    //Positions, rotation and lengths
    this.xpos = xpos;
    this.ypos = ypos;
    this.rotation = rotation;
    this.diagonalLength = getHype(
      squareSection.prototype.size / 2,
      squareSection.prototype.size / 2
    );
    //Sets up lines in square and makes a copy that will be changed when running
    this.originalLines = this.createLines(
      squareSection.prototype.linePerSide,
      squareSection.prototype.size
    );
    this.changedLines = JSON.parse(JSON.stringify(this.originalLines));
  }
  draw() {
    //Draws square and changes translate for easier rotation and drawing
    push();
    translate(this.xpos, this.ypos);
    rotate(this.rotation);
    push();
    noStroke();
    square(0, 0, squareSection.prototype.size);
    pop();
    //Draws lines
    for (var i = 0; i < this.changedLines.length; i++) {
      let linePos = this.changedLines[i];
      line(linePos.start.x, linePos.start.y, linePos.end.x, linePos.end.y);
    }
    pop();
  }
  createLines() {
    //Sets up needed variables
    let squareSize = squareSection.prototype.size;
    let linesPerSide = squareSection.prototype.linePerSide;
    let wallPosition = squareSize / 2;
    let linesCreated = [];
    //creates line on left wall of square
    for (
      var i = squareSize / linesPerSide / 2;
      i < squareSize;
      i += squareSize / linesPerSide
    ) {
      let linePos = {};
      linePos.start = { x: -wallPosition, y: i - squareSize / 2 };
      let ranX = random(1, 3) * (i / 3);
      //After straight line with length is made on left side it is rotated 45 degrees
      linePos.end = rotatePoint(
        linePos.start.x,
        linePos.start.y,
        ranX + -wallPosition,
        linePos.start.y,
        -45
      );
      linesCreated.push(linePos);
    }
    //creates line on bottom wall of square
    for (
      var i = squareSize / linesPerSide / 2;
      i < squareSize;
      i += squareSize / linesPerSide
    ) {
      let linePos = {};
      linePos.start = { x: i - squareSize / 2, y: wallPosition };
      let ranY = random(1, 3) * ((squareSize - i) / 3);
      //After straight line with length is made on bottom it is rotated 45 degrees
      linePos.end = rotatePoint(
        linePos.start.x,
        linePos.start.y,
        linePos.start.x,
        ranY + wallPosition,
        -135
      );
      linesCreated.push(linePos);
    }
    return linesCreated;
  }
}

//squares
let squaresToDraw;

//GUI element variables
let sizeInput;
let linesInput;
let inputButton;
let mouseEffect;
let invertEffect;
let resetButton;

function setup() {
  //Init setup
  createCanvas(800, 800);
  background(0);
  rectMode(CENTER);
  angleMode(DEGREES);

  //Square class setup
  squareSection.prototype.size = 50;
  squareSection.prototype.linePerSide = 10;
  squareSection.prototype.diagonalLength = getHype(
    squareSection.prototype.size / 2,
    squareSection.prototype.size / 2
  );

  //GUI
  createGUI();

  //Square creation
  generateSquares();
}

function draw() {
  background(220);
  //Goes through every line
  for (var i = 0; i < squaresToDraw.length; i += 1) {
    //Checks if mouse effect is on
    if (mouseEffect.checked()) {
      //Sets up values for lines to be changed in square then call change line on each line
      let distanceMouse =
        dist(mouseX, mouseY, squaresToDraw[i].xpos, squaresToDraw[i].ypos) /
        getHype(width, height);
      for (var j = 0; j < squaresToDraw[i].originalLines.length; j++) {
        let line = squaresToDraw[i].originalLines[j];
        squaresToDraw[i].changedLines[j].end = changeLine(
          line.start.x,
          line.start.y,
          line.end.x,
          line.end.y,
          distanceMouse
        );
      }
    }
    //Draws the line currently in loop
    squaresToDraw[i].draw();
  }
}

function rotatePoint(ox, oy, cx, cy, angle) {
  //Rotates one point around another
  //Sets values needed
  let c = cos(angle);
  let s = sin(angle);
  //Does rotation math
  let qx = ox + c * (cx - ox) - s * (cy - oy);
  let qy = oy + s * (cx - ox) + c * (cy - oy);
  return { x: qx, y: qy };
}

function getHype(x, y) {
  //Gets hypotenuse of 2 lines
  return sqrt(x ** 2 + y ** 2);
}

function makeColumn(x, start, angelWidth) {
  //Draws column of squares
  for (var i = 0; i < height + angelWidth; i += angelWidth * 2) {
    //sets angle
    let angle = !(round(i / (angelWidth * 2) + start) % 2) ? -135 : -315;
    squaresToDraw.push(new squareSection(x, i, angle));
  }
}

function makeRow(y, start, angelWidth) {
  //Draws rows of squares
  for (var i = angelWidth; i < width + angelWidth; i += angelWidth * 2) {
    //Sets angle
    let angle = !(round((i - angelWidth) / (angelWidth * 2) + start) % 2)
      ? -45
      : -225;
    squaresToDraw.push(new squareSection(y, i, angle));
  }
}

function changeLine(posX, posY, posXX, posYY, distance) {
  //Sets up distance var to be used is changing length of line
  distance = distance > 1 ? 1 : distance;
  distance = invertEffect.checked()
    ? exponential(1 - distance)
    : logarithmic(distance);
  distance = distance > 1 ? 1 : distance;
  distance = distance < 0 ? 0 : distance;

  // Finds slope and b value in y=mx+b
  let slope = (posYY - posY) / (posXX - posX);
  let add = posYY - slope * posX;

  //Gets point along line based on distance then returns that point
  let computedX = (posXX - posX) * distance + posX;
  let computedY = slope * (computedX - posX) + posY;
  return { x: computedX, y: computedY };
}

function generateSquares() {
  //Generates base squares to be drawn
  squaresToDraw = [];
  let angelWidth = squareSection.prototype.diagonalLength;
  //Draws from top to bottom
  for (var i = angelWidth; i < height + angelWidth; i += angelWidth * 2) {
    //Start sets rotation of starting square
    let start = !(round((i - angelWidth) / (angelWidth * 2)) % 2) ? 0 : 1;
    makeRow(i, start, angelWidth);
  }
  //draws from left to right
  for (var i = 0; i < width + angelWidth; i += angelWidth * 2) {
    //Start sets rotation of starting square
    let start = !(round(i / (angelWidth * 2)) % 2) ? 0 : 1;
    makeColumn(i, start, angelWidth);
  }
}

function logarithmic(distance) {
  //logarithmic function used for mouse effect
  return 0.35 * log(0.5 * distance + 0.003) + 1.2;
}

function exponential(distance) {
  //Exponential function used for inverted mouse effect
  return -0.35 * log(-0.5 * distance + 0.5) - 0.23;
}

function createGUI() {
  //Sets up GUI
  resetButton = createButton("Reset");
  resetButton.mousePressed(generateSquares);
  sizeInput = createInput("Square size");
  linesInput = createInput("Lines per side");
  inputButton = createButton("Change Lines and Size");
  inputButton.mousePressed(sizeLinesChanged);
  mouseEffect = createCheckbox("Mouse Effect");
  mouseEffect.changed(generateSquares);
  invertEffect = createCheckbox("Invert Mouse Effect");
  invertEffect.changed(generateSquares);
}

function sizeLinesChanged() {
  //Runs when GUI is used to change size and lines per side
  //Makes sure values are entered
  if (
    Number.isInteger(int(sizeInput.value())) &&
    Number.isInteger(int(linesInput.value()))
  ) {
    //Changes values
    squareSection.prototype.size = sizeInput.value();
    squareSection.prototype.linePerSide = linesInput.value();
    squareSection.prototype.diagonalLength = getHype(
      squareSection.prototype.size / 2,
      squareSection.prototype.size / 2
    );
    //Reloads with new values
    generateSquares();
  }
}
