const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const server = http.createServer(app); 
const { Server } = require("socket.io");
const io = new Server(server);
const port = 8080;

// const cors = require('cors');
// app.use(cors());
// app.use(express.static(path.join(__dirname, 'public')));

// Game State
const players = {};
let ballPosition = { x: 0, y: 0 };
let ballVelocity = { x: 0, y: 0 };
let mapCreated = false;
let maze;

app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname,'public','index.html'));
    res.sendFile(path.join(__dirname, 'ball_test.html'));
});

// Socket.IO Handling
io.on('connection', (socket) => {
    const playerId = socket.id; 
    console.log(`New user connected. Current player id:: ${playerId}`);
  
    // Initialize player data
    players[playerId] = {
        socket: socket, // Reference to socket
        ballPosition: { x: 0, y: 0 }, // Initial position (adjust)
        ballVelocity: { x: 0, y: 0 }
    };

    console.log(`Player count: ${Object.keys(players).length}`);

    // Immediately send initial data
    socket.emit('initialUpdate', { 
        message: 'Welcome to the game!',
        ballPosition: players[playerId].ballPosition 
    });

    socket.on('sensorData', (data) => {
        // players.array.forEach(element => {
        //     io.emit('ballUpdate', {
        //         playerId: element,
        //         ballPosition: updatedBallPosition
        //     });
        // });
        console.log(JSON.stringify(data));
  });

  socket.on('sendDifficulty', (difficulty) => {
    console.log('Difficulty received');

    // Don't create map again
    if (!mapCreated) {
        maze = new Maze(difficulty, difficulty);
        maze = {map:maze.map, endCoord:maze.endCoord, startCoord:maze.startCoord};
        mapCreated = true;
    }

    // console.log(maze);
    if (Object.keys(players).length >= 2) {
        socket.emit('mazeBroadcast', maze);
    }
    console.log('Emitting maze to client.');

  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', playerId);
    delete players[playerId];
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Map generation
function rand(max) {
    return Math.floor(Math.random() * max);
  }
  
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  
  function Maze(Width, Height) {
    var mazeMap;
    var width = Width;
    var height = Height;
    var startCoord, endCoord;
    var dirs = ["n", "s", "e", "w"];
    var modDir = {
      n: {
        y: -1,
        x: 0,
        o: "s",
      },
      s: {
        y: 1,
        x: 0,
        o: "n",
      },
      e: {
        y: 0,
        x: 1,
        o: "w",
      },
      w: {
        y: 0,
        x: -1,
        o: "e",
      },
    };
  
    // this.map = function () {
    //   return mazeMap;
    // };
    // this.startCoord = function () {
    //   return startCoord;
    // };
    // this.endCoord = function () {
    //   return endCoord;
    // };
  
    function genMap() {
      mazeMap = new Array(height);
      for (y = 0; y < height; y++) {
        mazeMap[y] = new Array(width);
        for (x = 0; x < width; ++x) {
          mazeMap[y][x] = {
            n: false,
            s: false,
            e: false,
            w: false,
            visited: false,
            priorPos: null,
          };
        }
      }
    }
  
    function defineMaze() {
      var isComp = false;
      var move = false;
      var cellsVisited = 1;
      var numLoops = 0;
      var maxLoops = 0;
      var pos = {
        x: 0,
        y: 0,
      };
      var numCells = width * height;
      while (!isComp) {
        move = false;
        mazeMap[pos.x][pos.y].visited = true;
  
        if (numLoops >= maxLoops) {
          shuffle(dirs);
          maxLoops = Math.round(rand(height / 8));
          numLoops = 0;
        }
        numLoops++;
        for (index = 0; index < dirs.length; index++) {
          var direction = dirs[index];
          var nx = pos.x + modDir[direction].x;
          var ny = pos.y + modDir[direction].y;
  
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            //Check if the tile is already visited
            if (!mazeMap[nx][ny].visited) {
              //Carve through walls from this tile to next
              mazeMap[pos.x][pos.y][direction] = true;
              mazeMap[nx][ny][modDir[direction].o] = true;
  
              //Set Currentcell as next cells Prior visited
              mazeMap[nx][ny].priorPos = pos;
              //Update Cell position to newly visited location
              pos = {
                x: nx,
                y: ny,
              };
              cellsVisited++;
              //Recursively call this method on the next tile
              move = true;
              break;
            }
          }
        }
  
        if (!move) {
          //  If it failed to find a direction,
          //  move the current position back to the prior cell and Recall the method.
          pos = mazeMap[pos.x][pos.y].priorPos;
        }
        if (numCells == cellsVisited) {
          isComp = true;
        }
      }
    }
  
    function defineStartEnd() {
      switch (rand(4)) {
        case 0:
          startCoord = {
            x: 0,
            y: 0,
          };
          endCoord = {
            x: height - 1,
            y: width - 1,
          };
          break;
        case 1:
          startCoord = {
            x: 0,
            y: width - 1,
          };
          endCoord = {
            x: height - 1,
            y: 0,
          };
          break;
        case 2:
          startCoord = {
            x: height - 1,
            y: 0,
          };
          endCoord = {
            x: 0,
            y: width - 1,
          };
          break;
        case 3:
          startCoord = {
            x: height - 1,
            y: width - 1,
          };
          endCoord = {
            x: 0,
            y: 0,
          };
          break;
      }
    }
  
    genMap();
    defineStartEnd();
    defineMaze();

    this.map = mazeMap;
    this.startCoord = startCoord;
    this.endCoord = endCoord;
  }  
  
// Map