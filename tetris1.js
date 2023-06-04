const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

const colors = [
    null,
    'purple', // T
    'yellow', // O
    'orange', // L
    'blue',   // J
    'aqua',   // I
    'green',  // S
    'red'     // Z
];

let score = 0;

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
               arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        arenaSweep(); // Add this line
        playerReset();
        return false; // Indicate that we couldn't move
    }
    dropCounter = 0;
    return true; // Indicate that we moved successfully
}


function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        alert('Game Over');
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;
function update(time = 0) {
    const deltaTime = time - lastTime;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    lastTime = time;
    draw();
    requestAnimationFrame(update);
}

function getDropPosition(arena, player) {
    let pos = Object.assign({}, player.pos); // Copy the player's current position
    while (!collide(arena, { pos: pos, matrix: player.matrix })) { // Drop the piece until it collides
        pos.y++;
    }
    pos.y--; // Step back up one space after the collision
    return pos;
}

function colorToRgba(color, opacity) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = tempCanvas.height = 1;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.fillStyle = color;
    tempContext.fillRect(0, 0, 1, 1);
    const data = tempContext.getImageData(0, 0, 1, 1).data;
    return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${opacity})`; // Return the rgba equivalent
}


function drawShadow(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const color = colors[value];
                const rgbaColor = colorToRgba(color, 0.25); // Convert the color to rgba with 50% opacity
                context.fillStyle = rgbaColor;
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}



function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    
    const dropPos = getDropPosition(arena, player);
    drawShadow(player.matrix, dropPos);
    
    drawMatrix(player.matrix, player.pos);

    context.fillStyle = 'white'; // score color
    context.font = '1px Arial';
    context.fillText(`Score: ${score}`, 0.1, 0.9); // display score
}


function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        score += 10; // update score when a line is cleared
    }
}



let isPaused = false;

function update(time = 0) {
    if(isPaused) return; // Skip update if the game is paused

    const deltaTime = time - lastTime;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    lastTime = time;
    draw();
    requestAnimationFrame(update);
}

// Add a keyboard event listener to pause/unpause the game with 'P' key
document.addEventListener('keydown', event => {
    if(event.keyCode === 80) { // 'P' key
        isPaused = !isPaused;
        if(!isPaused) {
            // Game was unpaused, call update to continue the game
            requestAnimationFrame(update);
        }
    }
});



let downPressed = false;
let downPressTimer;

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        // Make sure to check if the one-step downward move is valid
        if (playerDrop()) {
            downPressed = true;
            downPressTimer = setTimeout(() => {
                if (downPressed) {
                    while(playerDrop()) {}
                }
            }, 200);
        }
    } else if (event.keyCode === 81) {
        playerRotate(-1); // Q key for rotate left
    } else if (event.keyCode === 87) {
        playerRotate(1);  // W key for rotate right
    }
});


document.addEventListener('keyup', event => {
    if (event.keyCode === 40) {
        downPressed = false;
        clearTimeout(downPressTimer);
    }
});

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', event => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}, false);

document.addEventListener('touchend', event => {
    let deltaX = touchStartX - event.changedTouches[0].clientX;
    let deltaY = touchStartY - event.changedTouches[0].clientY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe detected
        if (deltaX > 0) {
            // Swipe to the left
            playerMove(-1);
        } else {
            // Swipe to the right
            playerMove(1);
        }
    } else {
        // Vertical swipe or tap detected
        if (deltaY > 0) {
            // Swipe down
            while(playerDrop()) {}
        } else {
            // Tap detected
            playerRotate(1);
        }
    }

    touchStartX = 0;
    touchStartY = 0;
}, false);


const arena = createMatrix(12, 20);

const player = {
    pos: {x: 5, y: 5},
    matrix: createPiece('T'),
}

update();
