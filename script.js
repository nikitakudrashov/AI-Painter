// Инициализация Canvas
const canvas = new fabric.Canvas('drawing-canvas', {
  isDrawingMode: true,
  backgroundColor: 'white',
});

// Настройка размеров
function resizeCanvas() {
  canvas.setWidth(window.innerWidth - 250);
  canvas.setHeight(window.innerHeight);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// === 🖌️ Настройка кистей ===
const brushType = document.getElementById('brush-type');
const brushSize = document.getElementById('brush-size');
const colorPicker = document.getElementById('color-picker');

function updateBrush() {
  const size = parseInt(brushSize.value);
  const color = colorPicker.value;

  switch (brushType.value) {
    case 'marker':
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = size;
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.opacity = 0.7;
      break;
    case 'spray':
      canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
      canvas.freeDrawingBrush.width = size;
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.density = 4;
      break;
    default: // Карандаш
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = size;
      canvas.freeDrawingBrush.color = color;
  }
}
brushType.addEventListener('change', updateBrush);
brushSize.addEventListener('input', updateBrush);
colorPicker.addEventListener('input', updateBrush);
updateBrush();

// === 🌄 Изменение фона ===
document.getElementById('bg-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    fabric.Image.fromURL(event.target.result, function(img) {
      img.scaleToWidth(canvas.width);
      img.scaleToHeight(canvas.height);
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
  };
  reader.readAsDataURL(file);
});

// === 🎨 Стикеры ===
const stickers = document.querySelectorAll('.sticker');
stickers.forEach(sticker => {
  sticker.addEventListener('click', function() {
    // Создаём стикер
    const text = new fabric.Text(sticker.textContent, {
      left: 100,
      top: 100,
      fontSize: 40,
      fill: colorPicker.value,
      selectable: true, // Можно выделять и перемещать
      hasControls: true // Показываем элементы управления
    });
    
    // Добавляем на холст
    canvas.add(text);
    
    // Временно отключаем рисование при клике на стикер
    text.on('mousedown', () => {
      canvas.isDrawingMode = false;
    });
    
    // Возвращаем рисование при клике на пустую область
    canvas.on('mouse:down', (opt) => {
      if (!opt.target) {
        canvas.isDrawingMode = true;
      }
    });
  });
});


// === 🎮 Игра "Крокодил" ===
let gameInterval;
let timeLeft = 60;
let scores = { player: 0, ai: 0 };
const words = ["яблоко", "ракета", "динозавр", "телефон", "кошка", "дом", "солнце"];
let currentWord = "";
let isAIDrawing = false;

// Элементы интерфейса
const gameStateElement = document.getElementById('game-state');
const timerElement = document.getElementById('timer');
const scoresElement = document.getElementById('scores');
const startGameBtn = document.getElementById('start-game-btn');
const aiDrawBtn = document.getElementById('ai-draw-btn');
const checkGuessBtn = document.getElementById('check-guess-btn');
const userGuessInput = document.getElementById('user-guess');

// Таймер
function updateTimer() {
  timerElement.textContent = `Время: ${timeLeft}`;
  if (timeLeft <= 0) {
    clearInterval(gameInterval);
    if (isAIDrawing) {
      gameStateElement.textContent = "Время вышло! ИИ не угадал.";
      scores.player += 1;
    } else {
      gameStateElement.textContent = "Время вышло! Вы не угадали.";
      scores.ai += 1;
    }
    updateScores();
    resetGame();
  }
  timeLeft -= 1;
}

// Обновление очков
function updateScores() {
  scoresElement.textContent = `Очки: Вы ${scores.player} - ${scores.ai} ИИ`;
}

// Сброс игры
function resetGame() {
  clearInterval(gameInterval);
  timeLeft = 60;
  startGameBtn.disabled = false;
  aiDrawBtn.disabled = false;
  checkGuessBtn.disabled = true;
  userGuessInput.disabled = true;
  userGuessInput.value = '';
  canvas.isDrawingMode = true;
  isAIDrawing = false;
  updateTimer();
}

// Начать игру
startGameBtn.addEventListener('click', function() {
  currentWord = words[Math.floor(Math.random() * words.length)];
  gameStateElement.textContent = `Рисуйте: "${currentWord}"`;
  startGameBtn.disabled = true;
  aiDrawBtn.disabled = true;
  checkGuessBtn.disabled = false;
  userGuessInput.disabled = true;
  canvas.clear();
  canvas.isDrawingMode = true;
  isAIDrawing = false;
  timeLeft = 60;
  gameInterval = setInterval(updateTimer, 1000);
});

// Режим "ИИ рисует"
aiDrawBtn.addEventListener('click', function() {
  isAIDrawing = true;
  currentWord = words[Math.floor(Math.random() * words.length)];
  gameStateElement.textContent = `ИИ рисует... Угадайте слово!`;
  startGameBtn.disabled = true;
  aiDrawBtn.disabled = true;
  checkGuessBtn.disabled = false;
  userGuessInput.disabled = false;
  canvas.clear();
  canvas.isDrawingMode = false;

  // ИИ "рисует" (упрощённо — добавляет текст)
  const aiText = new fabric.Text(currentWord, {
    left: 50,
    top: 50,
    fontSize: 40,
    fill: 'red',
    opacity: 0.5,
  });
  canvas.add(aiText);
  timeLeft = 60;
  gameInterval = setInterval(updateTimer, 1000);
});

// Проверить ответ
checkGuessBtn.addEventListener('click', function() {
  const userGuess = userGuessInput.value.toLowerCase().trim();
  
  if (isAIDrawing) {
    if (userGuess === currentWord) {
      gameStateElement.textContent = "Правильно! +1 очко вам!";
      scores.player += 1;
    } else {
      gameStateElement.textContent = `Неверно! Правильно: "${currentWord}". +1 очко ИИ.`;
      scores.ai += 1;
    }
  } else {
    // Здесь можно добавить вызов ML5.js или OpenAI для угадывания
    gameStateElement.textContent = `ИИ думает... (В реальности тут будет API-вызов)`;
    checkGuessBtn.disabled = true;
    
    setTimeout(() => {
      const isCorrect = Math.random() > 0.5; // Эмуляция ИИ
      if (isCorrect) {
        gameStateElement.textContent = `ИИ угадал: "${currentWord}". +1 очко ИИ.`;
        scores.ai += 1;
      } else {
        gameStateElement.textContent = `ИИ не угадал. +1 очко вам!`;
        scores.player += 1;
      }
      updateScores();
      resetGame();
    }, 2000);
    return;
  }
  
  updateScores();
  resetGame();
});

// === 🛠️ Дополнительные функции ===
document.getElementById('clear-btn').addEventListener('click', function() {
  canvas.clear();
  canvas.setBackgroundColor('white', canvas.renderAll.bind(canvas));
  canvas.isDrawingMode = true;
});

document.getElementById('export-btn').addEventListener('click', function() {
  const link = document.createElement('a');
  link.download = 'drawing.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// Инициализация игры
resetGame();