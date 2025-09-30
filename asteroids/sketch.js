//Stores all physics objects used in main game loop
var Objs;

let score;

let lives;

let gameRunning = false;

//layers used for menu and button interaction
let currentLayer = 0;

let layerCount = 20;

let layers = {};

let buttonLayers = {};

let sliderLayers = {};

//Stores setInterval object of spawning rocks
let rockSpawner;

//Reference to main ship object
let mainShip;

//sounds
let pewSound;

let boomSound;

//stores game settings
let settings = {
  lives: 3,
  shipSpeed: 5,
  rockSpawnSpeed: 5,
  bulletSpeed: 5,
  bulletDist: 500,
  turnSpeed: 4,
  rockSpeed: 1.5,
};

//Base class of all main menu ui
class layerUI {
  constructor(layer, position) {
    this.layer = layer;
    this.position = position;
    //Adds to object for drawing
    layers[layer].push(this);
  }
  draw() {
    return null;
  }
}

//Button class for menu works with layers
class squareLayerButton extends layerUI {
  constructor(
    layer,
    position,
    width,
    height,
    text,
    pressFunc,
    param,
    tSize,
    backgroundCol,
    textColor
  ) {
    super(layer, position);
    this.width = width;
    this.height = height;
    this.text = text;
    this.pressFunc = pressFunc;
    this.param = param;
    this.tSize = tSize;
    this.backgroundCol = backgroundCol;
    this.textColor = textColor;
    //Adds to object for interactions and drawing
    buttonLayers[this.layer].push(this);
  }
  draw() {
    push();
    translate(this.position);
    fill(this.backgroundCol);
    rect(0, 0, this.width, this.height);
    textSize(this.tSize);
    fill(this.textColor);
    text(this.text, 0, 0);
    pop();
  }
  checkPush() {
    if (
      mouseX > this.position.x - this.width / 2 &&
      mouseX < this.position.x + this.width / 2 &&
      mouseY > this.position.y - this.height / 2 &&
      mouseY < this.position.y + this.height / 2
    ) {
      this.pressFunc(this.param);
    }
  }
}

//Text class for menu works with layers
class layerText extends layerUI {
  constructor(layer, position, text, color, size) {
    super(layer, position);
    this.text = text;
    this.color = color;
    this.size = size;
  }
  draw() {
    push();
    fill(this.color);
    textSize(this.size);
    text(this.text, this.position.x, this.position.y);
    pop();
  }
}

//Slider class for menu works with layers
class layerSlider extends layerUI {
  constructor(layer, position, start, home, end, setting) {
    super(layer, position);
    this.slider = createSlider(home, end, start);
    this.slider.position(this.position.x, this.position.y);
    this.setting = setting;

    sliderLayers[this.layer].push(this);
  }
  show() {
    this.slider.show();
  }
  hide() {
    this.slider.hide();
  }
  draw() {
    this.hide();
  }
}

//Base class for objects that will collide
// Used only circle hitbox, and will only collide with objects passed in objects array
class collisionObject {
  constructor(position, radius, objects) {
    this.position = position;
    this.radius = radius;
    this.objects = objects;
    this.collisionOn = true;
  }
  //Called in main loop
  collide() {
    this.physicsUpdate();
    if (this.collisionOn) {
      //Goes through object to collide with array
      for (var objType = 0; objType < this.objects.length; objType++) {
        for (
          var objCurrentNum = 0;
          objCurrentNum < Objs[this.objects[objType]].length;
          objCurrentNum++
        ) {
          //Checks current objects hitbox against all other objects in it collision objects array
          let otherObj = Objs[this.objects[objType]][objCurrentNum];
          if (
            checkCollision(
              this.position,
              this.radius,
              otherObj.position,
              otherObj.radius
            ) &&
            otherObj.collisionOn
          ) {
            //Calls when there is collision
            this.hit();
            otherObj.hit();
          }
        }
      }
    }
    this.draw();
  }
  changeCollision() {
    this.collisionOn = !this.collisionOn;
  }
  //Functions that may be called but does not need to be defined
  hit() {
    return undefined;
  }
  physicsUpdate() {
    return undefined;
  }
  draw() {
    return undefined;
  }
}

//Class that handles some physics properties like friction, ect. and also handles drawing and circling
class physicsObject extends collisionObject {
  constructor(position, radius, objects, friction) {
    super(position, radius, objects);
    this.friction = friction;
    this.rotation = 0;
    this.velocity = createVector(0, 0);
    this.drawFunction;
    this.drawFrame = true;
    //Adds object to objs
    this.convertedNum = stringToNum(this.constructor.name);
    Objs[this.convertedNum] = [this];
  }
  physicsUpdate() {
    this._physicsUpdate();
    //Calculates friction
    this.velocity.lerp(createVector(0, 0), this.friction);
    this.position.add(this.velocity);
    //Changes side when leaving canvas
    if (this.position.x > width || this.position.x < 0) {
      this.position.x = width - this.position.x;
    }
    if (this.position.y > height || this.position.y < 0) {
      this.position.y = height - this.position.y;
    }
  }
  _physicsUpdate() {
    return;
  }
  draw() {
    push();
    translate(this.position.x, this.position.y);
    rotate(this.rotation);
    this.drawFunction(this);
    pop();
  }
}

//Class handles object that only move in a straight line
class directionalPhysicsObject extends collisionObject {
  constructor(
    position,
    radius,
    objects,
    movementVector,
    speedMulti,
    neverLeave
  ) {
    super(position, radius, objects);
    this.drawFunction;
    this.movementVector = movementVector;
    this.speedMulti = speedMulti;
    this.distMoved = createVector(0, 0);
    this.convertedNum = stringToNum(this.constructor.name);
    Objs[this.convertedNum].push(this);
  }
  physicsUpdate() {
    this._physicsUpdate();
    //Creates new movement vector so it does not multiply
    this.velocity = createVector(this.movementVector.x, this.movementVector.y);
    this.velocity.mult(this.speedMulti);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.distMoved.x += abs(this.velocity.x);
    this.distMoved.y += abs(this.velocity.y);
    //Changes side when leaving canvas
    if (this.position.x > width) {
      this.position.x = 1;
    } else if (this.position.x < 0) {
      this.position.x = width - 1;
    }
    if (this.position.y > height) {
      this.position.y = 1;
    } else if (this.position.y < 0) {
      this.position.y = height - 1;
    }
  }
  _physicsUpdate() {
    return;
  }
  draw() {
    push();
    translate(this.position.x, this.position.y);
    this.drawFunction(this);
    pop();
  }
}

//Ship that moves with keyboard and shoots
class ship extends physicsObject {
  constructor(
    position,
    radius,
    objects,
    friction,
    speedMulti,
    bulletSpeed,
    bulletDist
  ) {
    super(position, radius, objects, friction);
    this.drawFunction = this.drawShip;
    this.drawFrame = true;
    this.flicker = false;
    this.speedMulti = speedMulti;
    this.bulletSpeed = bulletSpeed;
    this.bulletDist = bulletDist;
  }
  _physicsUpdate() {
    let facing = findFacing(this.rotation).mult(15);
    //creates flicker when hit
    if (this.flicker) {
      if (!(frameCount % 5)) {
        this.drawFrame = true;
      } else {
        this.drawFrame = false;
      }
    }
    //Handles key inputs for movement
    if (keyIsDown(87)) {
      this.velocity.lerp(facing.mult(this.speedMulti), 0.001);
    }
    if (keyIsDown(68)) {
      this.rotation += settings.turnSpeed;
    }
    if (keyIsDown(65)) {
      this.rotation -= settings.turnSpeed;
    }
  }
  drawShip() {
    push();
    if (this.drawFrame) {
      stroke(255);
      line(0, 5, -5, -5);
      line(0, 5, 5, -5);
      line(0, 5, -5, -5);
      line(3, -2, -3, -2);
    }
    pop();
  }
  shoot() {
    pewSound.play();
    new bullet(
      createVector(this.position.x, this.position.y),
      2,
      [stringToNum(rock.name)],
      findFacing(this.rotation),
      this.bulletSpeed,
      true,
      this.bulletDist
    );
  }
  hit() {
    //Changes lives
    lives -= 1;
    if (lives < 1) {
      endGame();
    }
    //Sets flicker and invincibility
    this.changeCollision();
    setTimeout(this.changeCollision.bind(this), 3000);
    this.changeFlicker();
    setTimeout(this.changeFlicker.bind(this), 3000);
  }
  changeFlicker() {
    this.flicker = !this.flicker;
    this.drawFrame = true;
  }
}

//Bullet that moves in one direction and collides with rocks
class bullet extends directionalPhysicsObject {
  constructor(
    position,
    radius,
    objects,
    movementVector,
    speedMulti,
    neverLeave,
    range
  ) {
    super(position, radius, objects, movementVector, speedMulti, neverLeave);
    this.drawFunction = this.drawBullet;
    this.range = range;
  }
  _physicsUpdate() {
    //Deletes bullet once it travels certain range
    if (this.distMoved.x + this.distMoved.y > this.range) {
      this.hit();
    }
  }
  hit() {
    deleteObj(this);
  }
  drawBullet() {
    circle(0, 0, this.radius * 2);
  }
}

//Rock that moves in one direction and splits in two when colliding with anything
class rock extends directionalPhysicsObject {
  constructor(
    position,
    radius,
    objects,
    movementVector,
    speedMulti,
    neverLeave,
    lives
  ) {
    super(position, radius, objects, movementVector, speedMulti, neverLeave);
    this.drawFunction = this.drawRock;
    this.lives = lives;
    this.rockPoints = createRockPoints(this.radius);
  }
  hit() {
    score += random(this.radius * 3, this.radius * 3 + 100);
    boomSound.play();
    //Creates to smaller rocks that move in different direction if there are lives left
    if (this.lives > 1) {
      new rock(
        createVector(this.position.x, this.position.y),
        this.radius / 1.7,
        [stringToNum(ship.name)],
        createVector(this.movementVector.x, this.movementVector.y)
          .rotate(30)
          .normalize(),
        this.speedMulti,
        true,
        this.lives - 1
      );
      new rock(
        createVector(this.position.x, this.position.y),
        this.radius / 1.7,
        [stringToNum(ship.name)],
        createVector(this.movementVector.x, this.movementVector.y)
          .rotate(-30)
          .normalize(),
        this.speedMulti,
        true,
        this.lives - 1
      );
    }
    deleteObj(this);
  }
  drawRock() {
    beginShape();
    for (var i = 0; i < this.rockPoints.length; i++) {
      vertex(this.rockPoints[i].x, this.rockPoints[i].y);
    }
    endShape();
  }
}

function preload() {
  //Loads sounds
  pewSound = loadSound("./assets/sounds/pew.wav");
  boomSound = loadSound("./assets/sounds/boom.wav");
}

function setup() {
  //Sets up variables
  createCanvas(500, 500);
  angleMode(DEGREES);
  rectMode(CENTER);
  noStroke();

  //Sets up layer objects and layers
  for (i = 0; i < layerCount; i++) {
    layers[i] = [];
    buttonLayers[i] = [];
    sliderLayers[i] = [];
  }
  createMenuUI();
}

function draw() {
  background(0);
  if (gameRunning) {
    //Goes through all objects in Objs then calls collide and checks for null objects to clear
    for (const property in Objs) {
      for (var i = 0; i < Objs[property].length; i++) {
        if (Objs[property][i] != null) {
          Objs[property][i].collide();
          continue;
        }
        Objs[property].splice(i, 1);
      }
    }
    drawUI();
  } else {
    //Draws menu when not in game loop
    drawMenu();
  }
}

function mousePressed() {
  if (gameRunning) {
    //Shots from ship
    mainShip.shoot();
  } else {
    //Checks if button is pushed when in menu
    for (var i = 0; i < buttonLayers[currentLayer].length; i++) {
      buttonLayers[currentLayer][i].checkPush();
    }
  }
}

//Spawns rock on random side and gives it a random vector towards the middle
function spawnRock() {
  let rand = floor(random(0, 4));
  let dict = {
    0: [0, random(0, height)],
    1: [width, random(0, height)],
    2: [random(0, width), 0],
    3: [random(0, width), height],
  };
  //Picks random side to spawn rock
  let position = dict[rand];
  let moveTo = [random(100, width - 100), random(100, height + 100)];
  //Generates a vector to move to a point randomly chosen in line above
  let moveVec = createVector(
    moveTo[0] - position[0],
    moveTo[1] - position[1]
  ).normalize();
  new rock(
    createVector(position[0], position[1]),
    random(32, 38),
    [stringToNum(ship.name)],
    moveVec,
    settings.rockSpeed,
    true,
    3
  );
}

//Gets a vector point in direction of rotation
function findFacing(rotation) {
  return createVector(cos(rotation + 90), sin(rotation + 90)).normalize();
}

//converts string to number using ascii
function stringToNum(str) {
  let a = 0;
  for (var i = 0; i < str.length; i++) {
    a += str[i].charCodeAt();
  }
  return a;
}

//Deletes object from obj array meaning it won't be updated in  main loop
function deleteObj(instance) {
  let a = Objs[instance.convertedNum].indexOf(instance);
  delete Objs[instance.convertedNum][a];
  Objs[instance.convertedNum].splice(a, 1);
}

//Creates points of rock shape given a radius
function createRockPoints(radius) {
  let points = [];
  let numPoints = floor(random(8, 15));
  //Generates points on X 0 then rotates them around the center point
  for (var i = 0; i < numPoints; i++) {
    points.push(
      createVector(0, random(radius - radius / 1.8, radius)).rotate(
        ((360 - 360 / numPoints) / numPoints) * i
      )
    ); //
  }
  return points;
}

//Checks collision of two circles using radius and position
function checkCollision(positionOne, radiusOne, positionTwo, radiusTwo) {
  if (positionOne.dist(positionTwo) < radiusOne + radiusTwo) {
    return true;
  }
  return false;
}

//Draws ui in game loop
function drawUI() {
  push();
  fill(255);
  text("Lives: " + lives, 20, 20);
  text("Score: " + round(score), 20, 60);
  pop();
}

//Sets up variables and objects for game loop including ship, rock spawner, obj object
function startGame() {
  gameRunning = true;
  lives = settings.lives;
  score = 0;
  Objs = {};
  //adds the classes to objs
  Objs[stringToNum(bullet.name)] = [];
  Objs[stringToNum(rock.name)] = [];
  Objs[stringToNum(ship.name)] = [];
  mainShip = new ship(
    createVector(width / 2, height / 2),
    5,
    [],
    0.02,
    settings.shipSpeed,
    settings.bulletSpeed,
    settings.bulletDist
  );
  rockSpawner = setInterval(spawnRock, settings.rockSpawnSpeed * 1000);
  spawnRock();
}

//Checks for delete key to end game early
function keyPressed() {
  if (keyIsDown(46)) {
    endGame();
  }
}

//Ends game by changing, clearing and setting variables to prepare for next game and menu
function endGame() {
  gameRunning = false;
  deleteObj(mainShip);
  mainShip = undefined;
  clearObjs();
  clearInterval(rockSpawner);
  currentLayer = 0;
}

//Clears all objects for main objects object
function clearObjs() {
  for (const property in Objs) {
    for (var i = 0; i < Objs[property].length; i++) {
      if (Objs[property][i] != null) {
        delete Objs[property][i];
      }
    }
  }
}

//Draws menu
function drawMenu() {
  push();
  textAlign(CENTER, CENTER);
  textSize(50);
  fill(255);
  text("Asteroids", width / 2, 75);
  //Draws normal layers objects like text and buttons
  for (var i = 0; i < layers[currentLayer].length; i++) {
    layers[currentLayer][i].draw();
  }
  //Draws sliders as they needed to be handled differently
  for (const property in sliderLayers) {
    for (var i = 0; i < sliderLayers[property].length; i++) {
      if (property == currentLayer) {
        sliderLayers[property][i].show();
        continue;
      }
      sliderLayers[property][i].hide();
    }
  }
  pop();
}

/*Updates settings when settings is left by going through all sliders and change the settings values to those of the sliders then changes off settings layer*/
function settingsLeft(params) {
  for (var i = 0; i < sliderLayers[currentLayer].length; i++) {
    settings[sliderLayers[currentLayer][i].setting] =
      sliderLayers[currentLayer][i].slider.value();
  }
  changeLayer(params);
}

//changes menu layer given object with change property
function changeLayer(params) {
  currentLayer = params.change;
}

//Creates menu objects
function createMenuUI() {
  //Main menu buttons
  new squareLayerButton(
    0,
    createVector(width / 2, height / 2 - 50),
    150,
    40,
    "Play",
    startGame,
    {},
    30,
    255,
    0
  );
  new squareLayerButton(
    0,
    createVector(width / 2, height / 2 + 50),
    200,
    40,
    "How to play",
    changeLayer,
    { change: 1 },
    30,
    255,
    0
  );
  new squareLayerButton(
    0,
    createVector(width / 2, height / 2 + 150),
    150,
    40,
    "Setting",
    changeLayer,
    { change: 2 },
    30,
    255,
    0
  );

  //Exit layer buttons for how to play and settings
  new squareLayerButton(
    1,
    createVector(width - 50, 50),
    60,
    60,
    "X",
    changeLayer,
    { change: 0 },
    20,
    255,
    0
  );
  new squareLayerButton(
    2,
    createVector(width - 50, 50),
    60,
    60,
    "X",
    settingsLeft,
    { change: 0 },
    20,
    255,
    0
  );

  //Settings page sliders and text
  new layerText(
    2,
    createVector(width / 2, height / 2 - 125),
    "rockSpeed:",
    255,
    20
  );
  new layerSlider(
    2,
    createVector(width / 2 - 80, height / 2 - 110),
    settings.rockSpeed,
    0.1,
    10,
    "rockSpeed"
  );
  new layerText(2, createVector(width / 2, height / 2 - 75), "Lives:", 255, 20);
  new layerSlider(
    2,
    createVector(width / 2 - 80, height / 2 - 60),
    settings.lives,
    1,
    20,
    "lives"
  );
  new layerText(
    2,
    createVector(width / 2, height / 2 - 25),
    "Ship Speed:",
    255,
    20
  );
  new layerSlider(
    2,
    createVector(width / 2 - 80, height / 2 - 10),
    settings.shipSpeed,
    1,
    20,
    "shipSpeed"
  );
  new layerText(
    2,
    createVector(width / 2, height / 2 + 25),
    "Rock Spawn Speed:",
    255,
    20
  );
  new layerSlider(
    2,
    createVector(width / 2 - 80, height / 2 + 40),
    settings.rockSpawnSpeed,
    0.5,
    20,
    "rockSpawnSpeed"
  );
  new layerText(
    2,
    createVector(width / 2, height / 2 + 75),
    "Bullet Speed:",
    255,
    20
  );
  new layerSlider(
    2,
    createVector(width / 2 - 80, height / 2 + 90),
    settings.bulletSpeed,
    1,
    30,
    "bulletSpeed"
  );
  new layerText(
    2,
    createVector(width / 2, height / 2 + 125),
    "Bullet Distance:",
    255,
    20
  );
  new layerSlider(
    2,
    createVector(width / 2 - 80, height / 2 + 140),
    settings.bulletDist,
    100,
    2000,
    "bulletDist"
  );
  new layerText(
    2,
    createVector(width / 2, height / 2 + 175),
    "Turn Speed:",
    255,
    20
  );
  new layerSlider(
    2,
    createVector(width / 2 - 80, height / 2 + 190),
    settings.turnSpeed,
    1,
    20,
    "turnSpeed"
  );

  //How to play text
  new layerText(
    1,
    createVector(width / 2, height / 2),
    "Destroy the asteroids and do not get hit \n click to shoot \n W to move forward  \n D to spin right \n A to spin left \n DEL to end game",
    255,
    20
  );
}
