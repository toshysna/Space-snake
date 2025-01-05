const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("scoreText");
const highScoreText = document.getElementById("highScoreText");

const gridSize = 34;
const tileCount = canvas.width / gridSize;

const collectSound = document.getElementById("collectSound");
const hitSound = document.getElementById("hitSound");
const gameOverSound = document.getElementById("gameOverSound");
const explosionSound = document.getElementById("explosionSound");

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let gameSpeed = 100;
let gameLoop;
let collectAnimation = null;
let collectAnimationFrame = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
highScoreText.textContent = highScore;

// Ajouter une variable pour gérer l'état du jeu
let gameState = "playing"; // 'playing', 'gameover'

let gameOverAnim = {
  progress: 0,
  startTime: 0,
  isAnimating: false,
};

// Ajouter une variable pour l'animation de disparition
let snakeFadeOut = {
  progress: 0,
  isActive: false,
  duration: 1000, // 1 seconde en millisecondes
  startTime: 0,
};

// Ajouter une variable pour suivre le temps de l'animation de pulsation
let restartTextPulseStartTime = 0;

// Ajouter une variable pour le clignotement
let blinkValue = 0;

// Ajouter les variables pour la fusée
let rocket = {
  x: window.innerWidth + 100,
  y: Math.random() * (window.innerHeight - 100),
  speed: 3,
  width: 80,
  height: 40,
  active: false,
};

// Ajouter une variable pour suivre les jalons déjà atteints
let reachedMilestones =
  JSON.parse(localStorage.getItem("snakeMilestones")) || [];

// Ajouter une variable pour l'explosion
let explosion = {
  active: false,
  x: 0,
  y: 0,
  particles: [],
  startTime: 0,
  duration: 1000, // durée de l'explosion en ms
};

// Ajouter une variable pour l'animation de reset
let resetScoreAnim = {
  active: false,
  startTime: 0,
  duration: 500, // 500ms pour l'animation
};

// Au début du fichier, ajouter une variable pour gérer l'état du son
let soundEnabled = false;

// Ajouter la gestion du bouton de son
document.getElementById("enableSound").addEventListener("click", function () {
  soundEnabled = true;
  this.parentElement.style.display = "none";

  // Jouer un son court pour tester/initialiser l'audio
  playSound(collectSound, 0.1);
});

document.addEventListener("keydown", changeDirection);
document.addEventListener("mousedown", handleMouseClick);

function playSound(sound, volume = 0.5) {
  if (sound && soundEnabled) {
    // Vérifier si le son est activé
    try {
      sound.currentTime = 0;
      sound.volume = volume;
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => console.log("Audio error:", error));
      }
    } catch (error) {
      console.log("Audio error:", error);
    }
  }
}

function startGame() {
  if (gameLoop) {
    clearInterval(gameLoop);
  }
  gameLoop = setInterval(update, gameSpeed);
}

function update() {
  moveSnake();
  if (checkCollision()) {
    gameOver();
    return;
  }
  checkFoodCollision();
  draw();
}

function moveSnake() {
  const input = getInputDirection();
  const head = {
    x: snake[0].x + input.x,
    y: snake[0].y + input.y,
  };
  snake.unshift(head);
  if (!checkFoodCollision()) {
    snake.pop();
  }
}

function changeDirection(event) {
  const LEFT = 37;
  const RIGHT = 39;
  const UP = 38;
  const DOWN = 40;

  const keyPressed = event.keyCode;

  if (gameState === "gameover") {
    if ([LEFT, RIGHT, UP, DOWN].includes(keyPressed)) {
      // Redémarrage manuel
      resetGame();
      return;
    }
  }

  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingRight = dx === 1;
  const goingLeft = dx === -1;

  if (keyPressed === LEFT && !goingRight) {
    dx = -1;
    dy = 0;
  }
  if (keyPressed === UP && !goingDown) {
    dx = 0;
    dy = -1;
  }
  if (keyPressed === RIGHT && !goingLeft) {
    dx = 1;
    dy = 0;
  }
  if (keyPressed === DOWN && !goingUp) {
    dx = 0;
    dy = 1;
  }
}

function checkCollision() {
  const head = snake[0];
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    snakeFadeOut.isActive = true;
    snakeFadeOut.progress = 0;
    snakeFadeOut.startTime = performance.now();
    try {
      playSound(hitSound, 0.4);
    } catch (error) {
      console.log("Audio error:", error);
    }
    return true;
  }

  for (let i = 4; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      snakeFadeOut.isActive = true;
      snakeFadeOut.progress = 0;
      snakeFadeOut.startTime = performance.now();
      try {
        playSound(hitSound, 0.4);
      } catch (error) {
        console.log("Audio error:", error);
      }
      return true;
    }
  }
  return false;
}

function checkFoodCollision() {
  const head = snake[0];
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreText.textContent = score;

    if (score > highScore) {
      const highScoreElement = document.querySelector(".high-score");
      highScore = score;
      localStorage.setItem("snakeHighScore", highScore);
      highScoreText.textContent = highScore;

      highScoreElement.classList.remove("animate");
      void highScoreElement.offsetWidth;
      highScoreElement.classList.add("animate");
    }

    try {
      playSound(collectSound, 0.3);
    } catch (error) {
      console.log("Erreur audio:", error);
    }

    collectAnimation = {
      x: food.x,
      y: food.y,
      frame: 0,
    };

    generateFood();
    return true;
  }
  return false;
}

function generateFood() {
  food.x = Math.floor(Math.random() * tileCount);
  food.y = Math.floor(Math.random() * tileCount);
}

function draw() {
  ctx.fillStyle = "rgba(0, 0, 20, 0.4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dessin du serpent avec effet de fondu
  snake.forEach((segment, index) => {
    ctx.save();

    if (snakeFadeOut.isActive) {
      const currentTime = performance.now();
      const elapsed = currentTime - snakeFadeOut.startTime;
      snakeFadeOut.progress = Math.min(1, elapsed / snakeFadeOut.duration);

      const scale = 1 + snakeFadeOut.progress;
      const opacity = 1 - snakeFadeOut.progress;

      ctx.globalAlpha = opacity;
      ctx.translate(
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2
      );
      ctx.scale(scale, scale);
      ctx.translate(
        -(segment.x * gridSize + gridSize / 2),
        -(segment.y * gridSize + gridSize / 2)
      );
    }

    // Dessin du segment
    ctx.fillStyle = index === 0 ? "#8B4513" : "#696969";
    ctx.beginPath();
    ctx.arc(
      segment.x * gridSize + gridSize / 2,
      segment.y * gridSize + gridSize / 2,
      gridSize / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Ajout de cratères sur chaque segment
    const numCraters = 3;
    for (let i = 0; i < numCraters; i++) {
      const craterX =
        segment.x * gridSize +
        gridSize / 2 +
        Math.cos((i * Math.PI * 2) / numCraters) * (gridSize / 3);
      const craterY =
        segment.y * gridSize +
        gridSize / 2 +
        Math.sin((i * Math.PI * 2) / numCraters) * (gridSize / 3);

      ctx.fillStyle = index === 0 ? "#654321" : "#4A4A4A";
      ctx.beginPath();
      ctx.arc(craterX, craterY, gridSize / 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Effet de trainée de feu
    if (index < 3) {
      const gradient = ctx.createRadialGradient(
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        0,
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        gridSize * 1.5
      );
      gradient.addColorStop(0, "rgba(255, 69, 0, 0.6)");
      gradient.addColorStop(0.4, "rgba(255, 140, 0, 0.3)");
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        gridSize * 1.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  });

  // Animation de collecte
  if (collectAnimation) {
    const centerX = collectAnimation.x * gridSize + gridSize / 2;
    const centerY = collectAnimation.y * gridSize + gridSize / 2;

    ctx.save();
    const progress = collectAnimation.frame / 10; // 10 frames d'animation
    const scale = 1 + progress * 2;
    const opacity = 1 - progress;

    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(centerX, centerY, gridSize * scale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(135, 206, 250, 0.3)";
    ctx.fill();

    collectAnimation.frame++;
    if (collectAnimation.frame >= 10) {
      collectAnimation = null;
    }
    ctx.restore();
  }

  // Dessin de la nourriture (fragment de planète)
  const centerX = food.x * gridSize + gridSize / 2;
  const centerY = food.y * gridSize + gridSize / 2;

  // Base du fragment de planète
  ctx.fillStyle = "#4169E1"; // Bleu royal pour une planète type terre
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - gridSize / 2);

  // Création d'une forme irrégulière pour le fragment
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = (gridSize / 2) * (0.8 + Math.random() * 0.4);
    ctx.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    );
  }
  ctx.closePath();
  ctx.fill();

  // Ajout de détails sur le fragment
  ctx.fillStyle = "#1E90FF"; // Bleu plus clair pour les "continents"
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = gridSize / 4;
    const detailX = centerX + Math.cos(angle) * distance;
    const detailY = centerY + Math.sin(angle) * distance;

    ctx.beginPath();
    ctx.arc(detailX, detailY, gridSize / 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Effet de brillance atmosphérique
  const planetGlow = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    gridSize
  );
  planetGlow.addColorStop(0, "rgba(135, 206, 250, 0.4)");
  planetGlow.addColorStop(0.5, "rgba(135, 206, 250, 0.1)");
  planetGlow.addColorStop(1, "transparent");
  ctx.fillStyle = planetGlow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, gridSize, 0, Math.PI * 2);
  ctx.fill();

  // Animer le reset du high score sans requestAnimationFrame
  if (resetScoreAnim.active) {
    const currentTime = performance.now();
    const progress =
      (currentTime - resetScoreAnim.startTime) / resetScoreAnim.duration;

    if (progress < 1) {
      const highScoreElement = document.querySelector(".high-score");
      const intensity = Math.sin(progress * Math.PI) * 255;
      highScoreElement.style.textShadow = `0 0 21px rgba(255, 0, 0, ${
        1 - progress
      })`;
      highScoreElement.style.color = `rgb(255, ${215 - intensity}, 0)`;
    } else {
      const highScoreElement = document.querySelector(".high-score");
      highScoreElement.style.textShadow = "0 0 21px #4a4a8a";
      highScoreElement.style.color = "#ffd700";
      resetScoreAnim.active = false;
    }
  }
}

function gameOver() {
  clearInterval(gameLoop);
  gameState = "gameover";

  if (snakeFadeOut.isActive && snakeFadeOut.progress < 1) {
    requestAnimationFrame(draw);
    requestAnimationFrame(gameOver);
    return;
  }

  // Vérifier les jalons après la mort
  const milestones = [100, 200, 400, 600, 800, 1000];
  for (const milestone of milestones) {
    if (score >= milestone && !reachedMilestones.includes(milestone)) {
      reachedMilestones.push(milestone);
      localStorage.setItem(
        "snakeMilestones",
        JSON.stringify(reachedMilestones)
      );

      // Activer la fusée seulement après la mort si un nouveau jalon est atteint
      rocket.active = true;
      rocket.x = window.innerWidth + 100;
      rocket.y = Math.random() * (window.innerHeight - 100);
      break;
    }
  }

  gameOverAnim.startTime = performance.now();
  gameOverAnim.isAnimating = true;

  // Modifier le délai à 500ms (0.5 seconde)
  setTimeout(() => {
    try {
      playSound(gameOverSound, 0.5);
    } catch (error) {
      console.log("Audio error:", error);
    }
  }, 500);

  animateGameOver();
}

function animateGameOver() {
  const currentTime = performance.now();
  const elapsed = currentTime - gameOverAnim.startTime;
  gameOverAnim.progress = Math.min(1, elapsed / 2000);

  // Effacer le canvas
  ctx.fillStyle = "rgba(0, 0, 20, 0.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";

  // Animation du GAME OVER
  const scale = gameOverAnim.progress * (1 + Math.sin(elapsed / 50) * 0.1); // Effet de pulsation
  const shake = (1 - gameOverAnim.progress) * Math.sin(elapsed / 30) * 10; // Tremblement qui diminue
  const redIntensity = Math.floor(gameOverAnim.progress * 255);

  ctx.save();
  ctx.translate(
    canvas.width / 2 + shake * Math.random(),
    canvas.height / 2 - 85 + shake * Math.random()
  );
  ctx.scale(scale, scale);

  // Texte principal GAME OVER avec effet rouge
  ctx.fillStyle = `rgb(${redIntensity}, 0, 0)`;
  ctx.font = "900 43px 'Chakra Petch'";
  ctx.fillText("GAME OVER", 0, 0);

  ctx.restore();

  // Afficher les autres textes une fois l'animation principale terminée
  if (gameOverAnim.progress >= 0.8) {
    const fadeIn = (gameOverAnim.progress - 0.8) * 5;

    // Score et High Score normaux
    ctx.fillStyle = `rgba(106, 106, 170, ${fadeIn})`;
    ctx.font = "32px 'Righteous'";
    ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2);

    const highScoreY = canvas.height / 2 + 43;
    ctx.fillStyle = `rgba(255, 215, 0, ${fadeIn})`;
    ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, highScoreY);

    // Message de redémarrage avec clignotement simple
    const distanceFromHighScoreToBottom = canvas.height - highScoreY;
    const middlePoint = highScoreY + distanceFromHighScoreToBottom / 2;

    if (fadeIn >= 1) {
      blinkValue += 0.05;
      const opacity = 0.4 + Math.abs(Math.sin(blinkValue)) * 0.6;
      ctx.fillStyle = `rgba(127, 127, 255, ${opacity})`;
    } else {
      ctx.fillStyle = `rgba(127, 127, 255, ${fadeIn})`;
    }

    ctx.font = "26px 'Righteous'";
    ctx.fillText("PRESS ANY ARROW KEY TO START", canvas.width / 2, middlePoint);
  }

  if (gameOverAnim.progress < 1) {
    requestAnimationFrame(animateGameOver);
  }
}

// Créer une fonction de réinitialisation
function resetGame() {
  // Réinitialiser les variables de base
  snake = [{ x: 10, y: 10 }];
  dx = 0;
  dy = 0;
  score = 0;
  scoreText.textContent = score;

  // Réinitialiser les animations
  snakeFadeOut = {
    progress: 0,
    isActive: false,
    duration: 1000,
    startTime: 0,
  };
  gameOverAnim = {
    progress: 0,
    startTime: 0,
    isAnimating: false,
  };
  collectAnimation = null;
  collectAnimationFrame = 0;

  // Générer une nouvelle position de nourriture
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
  };

  // Réinitialiser l'état du jeu et redémarrer
  gameState = "playing";
  startGame();

  // Réinitialiser le timing de pulsation
  restartTextPulseStartTime = 0;

  // Réinitialiser la valeur de clignotement
  blinkValue = 0;

  // Désactiver la fusée quand le jeu recommence
  rocket.active = false;
}

// Ajouter la fonction de gestion du clic
function handleMouseClick(event) {
  // Supprimer la gestion du clic pour redémarrer le jeu
  return;
}

// Ajouter la fonction de dessin de la fusée
function drawRocket() {
  const rocketCanvas = document.getElementById("rocketCanvas");
  rocketCanvas.width = window.innerWidth;
  rocketCanvas.height = window.innerHeight;
  const rctx = rocketCanvas.getContext("2d");
  rctx.clearRect(0, 0, rocketCanvas.width, rocketCanvas.height);

  if (explosion.active) {
    const currentTime = performance.now();
    const progress = (currentTime - explosion.startTime) / explosion.duration;

    if (progress < 1) {
      // Dessiner l'explosion
      explosion.particles.forEach((particle) => {
        rctx.save();
        rctx.globalAlpha = 1 - progress;
        rctx.fillStyle = particle.color;
        rctx.beginPath();
        rctx.arc(
          explosion.x + particle.x,
          explosion.y + particle.y,
          particle.size * (1 - progress * 0.5),
          0,
          Math.PI * 2
        );
        rctx.fill();
        rctx.restore();

        // Mettre à jour la position des particules
        particle.x += particle.vx * 5;
        particle.y += particle.vy * 5;
        particle.vy += 0.1; // Gravité
      });
    } else {
      explosion.active = false;
    }
  }

  if (rocket.active) {
    // Déplacer la fusée
    rocket.x -= rocket.speed;

    // Dessiner la fusée
    rctx.save();

    // Dessiner la bulle de texte
    rctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    rctx.beginPath();
    rctx.moveTo(rocket.x + rocket.width - 40, rocket.y - 10);
    rctx.lineTo(rocket.x + rocket.width - 30, rocket.y - 30);
    rctx.lineTo(rocket.x + rocket.width + 100, rocket.y - 30);
    rctx.lineTo(rocket.x + rocket.width + 100, rocket.y - 70);
    rctx.lineTo(rocket.x + rocket.width - 40, rocket.y - 70);
    rctx.lineTo(rocket.x + rocket.width - 40, rocket.y - 30);
    rctx.lineTo(rocket.x + rocket.width - 30, rocket.y - 30);
    rctx.closePath();
    rctx.fill();

    // Texte dans la bulle
    rctx.fillStyle = "#000";
    rctx.font = '16px "Righteous"';
    rctx.textAlign = "center";
    rctx.fillText(
      "don't click on me!",
      rocket.x + rocket.width + 30,
      rocket.y - 45
    );

    // Corps principal de la fusée
    rctx.fillStyle = "#3498db"; // Bleu plus moderne
    rctx.beginPath();
    rctx.moveTo(rocket.x + rocket.width, rocket.y); // Inverser les points
    rctx.lineTo(rocket.x, rocket.y + rocket.height / 2);
    rctx.lineTo(rocket.x + rocket.width, rocket.y + rocket.height);
    rctx.closePath();
    rctx.fill();

    // Reflets sur le corps
    rctx.fillStyle = "#2980b9"; // Bleu plus foncé pour les ombres
    rctx.beginPath();
    rctx.moveTo(rocket.x + rocket.width * 0.7, rocket.y + rocket.height * 0.2);
    rctx.lineTo(rocket.x + rocket.width * 0.2, rocket.y + rocket.height / 2);
    rctx.lineTo(rocket.x + rocket.width * 0.7, rocket.y + rocket.height * 0.8);
    rctx.closePath();
    rctx.fill();

    // Hublot
    rctx.fillStyle = "#ecf0f1"; // Blanc cassé
    rctx.beginPath();
    rctx.arc(
      rocket.x + rocket.width * 0.4,
      rocket.y + rocket.height / 2,
      rocket.height * 0.2,
      0,
      Math.PI * 2
    );
    rctx.fill();

    // Reflet du hublot
    rctx.fillStyle = "#bdc3c7";
    rctx.beginPath();
    rctx.arc(
      rocket.x + rocket.width * 0.38,
      rocket.y + rocket.height / 2 - 2,
      rocket.height * 0.1,
      0,
      Math.PI * 2
    );
    rctx.fill();

    // Flammes de la fusée avec plusieurs couches
    const flameColors = ["#e74c3c", "#e67e22", "#f1c40f"];
    flameColors.forEach((color, i) => {
      const size = (3 - i) * 0.4;
      rctx.fillStyle = color;
      rctx.beginPath();
      rctx.moveTo(rocket.x + rocket.width, rocket.y + rocket.height * 0.2);
      rctx.quadraticCurveTo(
        rocket.x + rocket.width + rocket.width * size,
        rocket.y + rocket.height / 2,
        rocket.x + rocket.width,
        rocket.y + rocket.height * 0.8
      );
      rctx.closePath();
      rctx.fill();
    });

    // Particules de flammes
    for (let i = 0; i < 5; i++) {
      const particleX =
        rocket.x + rocket.width + Math.random() * rocket.width * 0.5;
      const particleY =
        rocket.y +
        rocket.height / 2 +
        (Math.random() - 0.5) * rocket.height * 0.4;
      const size = Math.random() * 5 + 2;

      rctx.fillStyle =
        flameColors[Math.floor(Math.random() * flameColors.length)];
      rctx.beginPath();
      rctx.arc(particleX, particleY, size, 0, Math.PI * 2);
      rctx.fill();
    }

    rctx.restore();

    // Réinitialiser quand la fusée sort de l'écran
    if (rocket.x < -rocket.width - 200) {
      rocket.x = window.innerWidth + 100;
      rocket.y = Math.random() * (window.innerHeight - 100);
    }
  }

  requestAnimationFrame(drawRocket);
}

// Ajouter la gestion du clic sur la fusée
const rocketCanvas = document.getElementById("rocketCanvas");
rocketCanvas.style.pointerEvents = "auto"; // Permettre les clics sur le canvas

rocketCanvas.addEventListener("click", (event) => {
  const rect = rocketCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (rocket.active && isClickOnRocket(x, y)) {
    // Jouer le son d'explosion
    try {
      playSound(explosionSound, 0.5);
    } catch (error) {
      console.log("Audio error:", error);
    }

    // Créer l'explosion
    explosion.active = true;
    explosion.x = rocket.x + rocket.width / 2;
    explosion.y = rocket.y + rocket.height / 2;
    explosion.startTime = performance.now();
    explosion.particles = createExplosionParticles();

    // Activer l'animation de reset du score
    resetScoreAnim.active = true;
    resetScoreAnim.startTime = performance.now();

    // Réinitialiser le high score et les jalons
    highScore = 0;
    localStorage.setItem("snakeHighScore", 0);
    highScoreText.textContent = "0";
    reachedMilestones = [];
    localStorage.setItem("snakeMilestones", JSON.stringify([]));

    // Ajouter une animation plus dramatique pour le reset
    const highScoreElement = document.querySelector(".high-score");
    highScoreElement.style.animation = "resetHighScore 1s ease-in-out";

    setTimeout(() => {
      highScoreElement.style.animation = "";
    }, 1000);

    // Désactiver la fusée
    rocket.active = false;
  }
});

// Fonction pour vérifier si le clic est sur la fusée
function isClickOnRocket(x, y) {
  return (
    x >= rocket.x &&
    x <= rocket.x + rocket.width &&
    y >= rocket.y &&
    y <= rocket.y + rocket.height
  );
}

// Fonction pour créer les particules de l'explosion
function createExplosionParticles() {
  const particles = [];
  for (let i = 0; i < 50; i++) {
    const angle = (Math.PI * 2 * i) / 50;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x: 0,
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: `hsl(${Math.random() * 30 + 10}, 100%, 50%)`, // Couleurs de feu
      size: Math.random() * 8 + 4,
    });
  }
  return particles;
}

// Variables pour la gestion des swipes
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30; // Distance minimale pour détecter un swipe

// Gestionnaires d'événements tactiles
canvas.addEventListener("touchstart", handleTouchStart, false);
canvas.addEventListener("touchmove", handleTouchMove, false);
canvas.addEventListener("touchend", handleTouchEnd, false);

function handleTouchStart(event) {
  event.preventDefault();
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function handleTouchMove(event) {
  if (!touchStartX || !touchStartY) {
    return;
  }

  event.preventDefault();

  const touch = event.touches[0];
  const touchEndX = touch.clientX;
  const touchEndY = touch.clientY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (
    Math.abs(deltaX) > minSwipeDistance ||
    Math.abs(deltaY) > minSwipeDistance
  ) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Mouvement horizontal
      if (deltaX > 0 && lastInputDirection.x !== -1) {
        inputDirection = { x: 1, y: 0 };
      } else if (deltaX < 0 && lastInputDirection.x !== 1) {
        inputDirection = { x: -1, y: 0 };
      }
    } else {
      // Mouvement vertical
      if (deltaY > 0 && lastInputDirection.y !== -1) {
        inputDirection = { x: 0, y: 1 };
      } else if (deltaY < 0 && lastInputDirection.y !== 1) {
        inputDirection = { x: 0, y: -1 };
      }
    }

    touchStartX = touchEndX;
    touchStartY = touchEndY;
  }
}

function handleTouchEnd() {
  touchStartX = 0;
  touchStartY = 0;
}

// À ajouter au début du fichier, avec les autres variables globales
let inputDirection = { x: 0, y: 0 };
let lastInputDirection = { x: 0, y: 0 };

// À ajouter avant la fonction update()
function getInputDirection() {
  lastInputDirection = inputDirection;
  return inputDirection;
}

startGame();
drawRocket(); // Démarrer l'animation de la fusée
