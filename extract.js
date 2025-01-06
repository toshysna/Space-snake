// Créer un canvas temporaire pour l'extraction
const tempCanvas = document.createElement("canvas");
tempCanvas.width = 68; // Taille du gridSize (34) * 2
tempCanvas.height = 68;
const tempCtx = tempCanvas.getContext("2d");

// Extraire la météorite
function extractMeteor() {
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Dessiner le corps de la météorite
  tempCtx.fillStyle = "#696969";
  tempCtx.beginPath();
  tempCtx.arc(34, 34, 15, 0, Math.PI * 2);
  tempCtx.fill();

  // Ajouter les cratères
  const numCraters = 3;
  for (let i = 0; i < numCraters; i++) {
    const craterX = 34 + Math.cos((i * Math.PI * 2) / numCraters) * 8;
    const craterY = 34 + Math.sin((i * Math.PI * 2) / numCraters) * 8;

    tempCtx.fillStyle = "#4A4A4A";
    tempCtx.beginPath();
    tempCtx.arc(craterX, craterY, 3, 0, Math.PI * 2);
    tempCtx.fill();
  }

  // Ajouter l'effet de trainée de feu
  const gradient = tempCtx.createRadialGradient(34, 34, 0, 34, 34, 40);
  gradient.addColorStop(0, "rgba(255, 69, 0, 0.6)");
  gradient.addColorStop(0.4, "rgba(255, 140, 0, 0.3)");
  gradient.addColorStop(1, "transparent");

  tempCtx.fillStyle = gradient;
  tempCtx.beginPath();
  tempCtx.arc(34, 34, 40, 0, Math.PI * 2);
  tempCtx.fill();

  return tempCanvas.toDataURL("image/png");
}

// Extraire le fragment de planète
function extractPlanetFragment() {
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  const centerX = 34;
  const centerY = 34;

  // Base du fragment
  tempCtx.fillStyle = "#4169E1";
  tempCtx.beginPath();
  tempCtx.moveTo(centerX, centerY - 15);

  // Création de la forme irrégulière
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 15 * (0.8 + 0.2 * Math.sin(i));
    tempCtx.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    );
  }
  tempCtx.closePath();
  tempCtx.fill();

  // Détails sur le fragment
  tempCtx.fillStyle = "#1E90FF";
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const distance = 8;
    const detailX = centerX + Math.cos(angle) * distance;
    const detailY = centerY + Math.sin(angle) * distance;

    tempCtx.beginPath();
    tempCtx.arc(detailX, detailY, 3, 0, Math.PI * 2);
    tempCtx.fill();
  }

  // Effet de brillance
  const planetGlow = tempCtx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    25
  );
  planetGlow.addColorStop(0, "rgba(135, 206, 250, 0.4)");
  planetGlow.addColorStop(0.5, "rgba(135, 206, 250, 0.1)");
  planetGlow.addColorStop(1, "transparent");

  tempCtx.fillStyle = planetGlow;
  tempCtx.beginPath();
  tempCtx.arc(centerX, centerY, 25, 0, Math.PI * 2);
  tempCtx.fill();

  return tempCanvas.toDataURL("image/png");
}

// Pour utiliser ces fonctions et sauvegarder les images :
const meteorImage = extractMeteor();
const planetFragmentImage = extractPlanetFragment();

// Vous pouvez maintenant utiliser ces URLs de données pour créer des images
console.log("Meteor Image URL:", meteorImage);
console.log("Planet Fragment Image URL:", planetFragmentImage);
