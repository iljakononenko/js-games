const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.font = '50px Impact';

const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

let timeToNextPoint = 0;
let pointInterval = 1000;
let lastTime = 0;
let stopped = false;
let score = 0;
let gameOver = false;

let points = [];
let explosions = [];
let particles = [];

class Point {
    constructor() {
        this.spriteWidth = 3474;
        this.spriteHeight = 1821;
        this.sizeModifier = Math.random() * 0.06 + 0.05;
        this.width = this.spriteWidth * this.sizeModifier
        this.height = this.spriteHeight * this.sizeModifier;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.speedX = Math.random() * 3 + 3;
        this.directionY = Math.random() * 5 - 2.5;
        this.markedForDeletion = false;
        this.image = new Image();
        this.image.src = 'star_destroyer.png';
        this.timeSinceLastFrame = 0;
        this.frameInterval = Math.random() * 50 + 50;
        this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
        this.color = `rgb(${this.randomColors[0]}, ${this.randomColors[1]}, ${this.randomColors[2]})`;
        this.hasTrail = Math.random() > 0.5 || true;
        this.hasTrail = true;
    }

    update(deltaTime) {
        this.x -= this.speedX;
        if (this.x < 0 - this.width) {
            this.markedForDeletion = true;
            gameOver = true
        }
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            this.timeSinceLastFrame = 0;
            if (this.hasTrail) {
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(this.x, this.y, this.width, this.color));
                }
            }
        }
    }

    draw() {
        collisionCtx.fillStyle = this.color;
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, 0, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

class Explosion {
    constructor(x, y, size) {
        this.image = new Image();
        this.image.src = 'boom.png';
        this.spriteWidth = 200;
        this.spriteHeight = 179;
        this.size = size;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.timeSinceLastFrame = 0;
        this.frameInterval = 125;
        this.markedForDeletion = false;
        this.sound = new Audio();
        this.sound.src = 'explosion_1.mp3';
    }

    update(deltaTime) {
        if (this.frame === 0) {
            this.sound.play();
        }
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            this.frame++;
            this.timeSinceLastFrame = 0;
            if (this.frame > 5) {
                this.markedForDeletion = true;
            }
        }

    }

    draw() {
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y - this.size/4, this.size, this.size);
    }
}

class Particle {
    constructor(x, y, size, color) {
        this.size = size;
        this.x = x + this.size/2;
        this.y = y + this.size/5;
        this.radius = Math.random() * this.size/10;
        this.maxRadius = Math.random() * 20 + 35;
        this.markedForDeletion = false;
        this.speedX = Math.random() * 1 + 0.5;
        this.color = color;
    }

    update() {
        this.x += this.speedX;
        this.radius += 0.5;
        if (this.radius > this.maxRadius - 5) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = 1 - this.radius/this.maxRadius;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

window.addEventListener('click', function(e) {
    const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
    console.log(detectPixelColor);
    const pixelColor = detectPixelColor.data;
    points.forEach(point => {
        if (point.randomColors[0] === pixelColor[0]
            && point.randomColors[1] === pixelColor[1]
            && point.randomColors[2] === pixelColor[2]) {
            point.markedForDeletion = true;
            score++;
            explosions.push(new Explosion(point.x, point.y, point.width));
        }
    })
})

let stopButton = document.getElementById('stopButton');

stopButton.addEventListener('click', function() {
    stopped = !stopped;
    if (!stopped) {
        animate(0);
    }
})

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.fillText('Score: ' + score, 125, 50);
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 130, 55);
}

function drawGameOver() {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText('GAME OVER, your score is ' + score, canvas.width/2, canvas.height/2);
    ctx.fillStyle = 'white';
    ctx.fillText('GAME OVER, your score is ' + score, canvas.width/2 + 5, canvas.height/2 + 5);
}

function animate(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextPoint += deltaTime;
    if (timeToNextPoint > pointInterval) {
        points.push(new Point());
        timeToNextPoint = 0;
        // remove point if it is out of the canvas
        points.sort(function(a, b) {
            return a.width - b.width;
        })
    }
    drawScore();
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    })
    points.forEach(point => {
        point.update(deltaTime);
        point.draw();
    });
    explosions.forEach(explosion => {
        explosion.update(deltaTime);
        explosion.draw();
    })
    particles = particles.filter(particle => !particle.markedForDeletion);
    points = points.filter(point => !point.markedForDeletion);
    explosions = explosions.filter(explosion => !explosion.markedForDeletion);
    console.log(points.length);

    if (!stopped && !gameOver) {
        requestAnimationFrame(animate);
    }

    if (gameOver) {
        drawGameOver();
    }
}

animate(0);

