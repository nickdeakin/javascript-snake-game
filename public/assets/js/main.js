const Main = () => {
  const arrowKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
  const typingKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    , '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '.', ' ', '!', '?', '/'];
  const redrawRate = 1000 / 30;
  let direction = 0;
  let mousePosition = {x: 0, y: 0};
  let player = {};

  let points = 0;
  let faceOverride = null;

  const setup = () => {
    destroy();
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener("mousemove", handleMouseMove);
    drawChatBox();
  };
  const destroy = () => {
    document.removeEventListener('keydown', handleKeyPress);
    document.removeEventListener("mousemove", handleMouseMove);
  };

  const handleMouseMove = e => {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
  };

  const handleKeyPress = e => {
    if ('Enter' === e.key) {
      handleEnterPress(e.key);
      return;
    }
    if ('Backspace' === e.key) {
      handleBackspacePress(e.key);
      return;
    }
    if (arrowKeys.find(i => i === e.key)) {
      handleArrowPress(e.key);
      return;
    }
    if (typingKeys.some(i => i === e.key || i.toLocaleUpperCase() === e.key)) {
      handleTypingPress(e.key);
    }
  };

  const move = () => {
    const absoluteCenter = {x: window.innerWidth / 2, y: window.innerHeight / 2};
    const mouseOffsetFromCenter = {x: mousePosition.x - absoluteCenter.x, y: mousePosition.y - absoluteCenter.y};

    let angle = mouseOffsetFromCenter.y / Math.sqrt((mouseOffsetFromCenter.x ** 2) + (mouseOffsetFromCenter.y ** 2));
    let degrees = 0;
    if (mouseOffsetFromCenter.x > 0) {
      if (mouseOffsetFromCenter.y < 0) {
        degrees = (1 - (angle * -1)) * 90;
      } else {
        degrees = (angle * 90) + 90;
      }
    } else {
      degrees = ((1 - angle) * 90) + 180;
    }
    socket.emit('look', {angle: Math.ceil(degrees)});
  };

  const drawLine = (id, x, y, w, h, color) => {
    let l = document.getElementById(id);
    if (!l) {
      l = document.createElement('div');
      l.id = id;
      l.style.borderWidth = '1px';
      l.style.borderStyle = 'solid';
      l.style.borderColor = color;
      l.style.position = 'absolute';
      mainEl().appendChild(l);
    }
    l.style.left = x;
    l.style.top = y;
    l.style.width = w;
    l.style.height = h;
  };

  const handleArrowPress = key => {
    if (key === 'ArrowLeft') {
    }
    if (key === 'ArrowRight') {
    }
    if (key === 'ArrowDown') {
    }
    if (key === 'ArrowUp') {
    }
  };

  const handleTypingPress = key => {
    const i = document.getElementById('command');
    i.value += key;
  };

  const handleBackspacePress = _ => {
    const i = document.getElementById('command');
    if (i.value.length > 0) {
      i.value = i.value.slice(0, -1);
    }
  };

  const handleEnterPress = _ => {
    const i = document.getElementById('command');
    if (i.value.length > 0) {
      executeCommand(i.value);
      i.value = '';
    }
  };

  const executeCommand = command => {
    socket.emit('user message', command);
  };

  const redraw = (objects) => {
    player = objects.players[socket.id];
    drawPlayer(socket.id, player.color, player.x, player.y, player.angle, player.face, player.name, player.score, player.units);
    delete objects.players[socket.id];

    Object.entries(objects.players).forEach(box => {
      drawEnemy(box[0], box[1].color, box[1].x, box[1].y, box[1].face, box[1].name);
    });

    Object.entries(objects.goodies).forEach(goody => {
      drawGoody(goody[0], goody[1].x, goody[1].y, goody[1].value);
    });
  };

  socket.on('user connected', function(msg) {
    addChatMessage(`${msg.user}: ${msg.message}`);
  });

  socket.on('user disconnected', function(msg) {
    let b = document.getElementById(msg.id);
    if (b) {
      mainEl().removeChild(b);
    }
    addChatMessage(`${msg.user}: ${msg.message}`);
  });

  socket.on('redraw', function(msg) {
    redraw(msg);
  });

  socket.on('setup', function(msg) {
  });

  socket.on('user message', function(msg) {
    addChatMessage(`${msg.user}: ${msg.message}`);
  });

  socket.on('pm received', function(msg) {
    addChatMessage(`(FROM) ${msg.user}: ${msg.message}`);
  });

  socket.on('pm sent', function(msg) {
    addChatMessage(`(TO) ${msg.user}: ${msg.message}`);
  });

  socket.on('remove goody', function(msg) {
    let b = document.getElementById(msg.id);
    if (b) {
      mainEl().removeChild(b);
    }
  });

  const mainEl = () => {
    return document.getElementsByTagName('main')[0];
  };

  const addChatMessage = msg => {
    const cb = document.getElementById('chat-box');
    const line = document.createElement('div');
    line.innerText = msg;
    cb.appendChild(line);
    //line.scrollIntoView();
  };

  const drawChatBox = () => {
    const cb = document.createElement('div');
    cb.id = 'chat-box';
    cb.classList.add('chat-box');
    mainEl().appendChild(cb);
  };

  const drawPlayer = (boxId, color, x, y, angle, face, name, score, units) => {
    let b = document.getElementById(boxId);
    if (!b) {
      b = document.createElement('div');
      b.id = boxId;
      b.classList.add('player');
      b.style.background = `${color}`;
      mainEl().appendChild(b);
    }
    b.innerHTML = (name) ? `<span class="name--container"><span class="name">${name}</span></span>` : '';
    b.innerHTML += `<span class="face" style="transform: rotate(${angle - 90}deg)">${boxId === socket.id ? faceOverride ?? face : face}</span>`;
    for (let i = 0; i < units; i++) {
      b.innerHTML += `<span class="player--unit" style="background-color: ${color}; transform: translate(-${i+1}00%, -${i+1}00%);"></span>`;
    }

    updateScore(score)
  };

  const drawEnemy = (boxId, color, x, y, face, name) => {
    let b = document.getElementById(boxId);
    if (!b) {
      b = document.createElement('div');
      b.id = boxId;
      b.classList.add('enemy');
      b.style.background = `${color}`;
      mainEl().appendChild(b);
    }
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.innerHTML = (name) ? `<span class="name--container"><span class="name">${name}</span></span>` : '';
    b.innerHTML += `<span class="face">${boxId === socket.id ? faceOverride ?? face : face}</span>`;
  };

  const drawGoody = (goodyId, x, y, value) => {
    const xVisible = (x > player.x - (window.innerWidth/2) && x < player.x + (window.innerWidth/2));
    const yVisible = (y > player.y - (window.innerHeight/2) && y < player.y + (window.innerHeight/2));

    let b = document.getElementById(goodyId);

    if (xVisible && yVisible) {
      if (!b) {
        b = document.createElement('div');
        b.id = goodyId;
        b.classList.add('goody');
        b.classList.add(`goody-value-${value}`);
        mainEl().appendChild(b);
      }
      b.style.left = `${x - (player.x - (window.innerWidth/2))}px`;
      b.style.top = `${y - (player.y - (window.innerHeight/2))}px`;
    } else {
      if (b) {
        mainEl().removeChild(b);
      }
    }
  };

  const updateScore = score => {
    points = score;
    document.getElementById('points').innerHTML = points;
    setTimeout(() => {
      faceOverride = null;
    }, 500);
  };

  setInterval(() => {
    move();
  }, redrawRate);

  setup();
};

export default Main;
