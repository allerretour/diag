const ballColors = {
    1: '#f1c40f', 2: '#2980b9', 3: '#e74c3c', 4: '#8e44ad',
    5: '#e67e22', 6: '#27ae60', 7: '#7f8c8d', 8: '#000000'
};

const table = document.getElementById('pool-table');
const ballDiameter = 24; 
const activeBalls = [];

// Éléments UI pour le magnétisme et la grille
const chkMagnetism = document.getElementById('chk-magnetism');
const chkHighDensityGrid = document.getElementById('chk-high-density-grid');

function initialiserBilles() {
    if (!table) return;
    const ballsData = [];

    // Position de départ sur le Head Spot
    ballsData.push({ id: 0, num: '', color: '#ffffff', isStriped: false, x: 186, y: 186 });

    // Le rack de départ
    for (let i = 1; i <= 15; i++) {
        const colorIndex = i <= 8 ? i : i - 8;
        const color = ballColors[colorIndex];
        const isStriped = i > 8;
        
        const row = Math.floor((i - 1) / 5);
        const col = (i - 1) % 5;
        const startX = 560 + (col * 35);
        const startY = 110 + (row * 42);

        ballsData.push({ id: i, num: i, color: color, isStriped: isStriped, x: startX, y: startY });
    }

    ballsData.forEach(b => {
        const ballEl = document.createElement('div');
        ballEl.classList.add('ball');
        ballEl.style.setProperty('--ball-color', b.color);
        
        if (b.isStriped) ballEl.classList.add('striped');
        
        ballEl.setAttribute('data-id', b.id);
        ballEl.style.backgroundColor = b.color;
        ballEl.style.left = b.x + 'px';
        ballEl.style.top = b.y + 'px';

        if (b.num !== '') {
            const numEl = document.createElement('div');
            numEl.classList.add('ball-num');
            numEl.innerText = b.num;
            ballEl.appendChild(numEl);
        }

        table.appendChild(ballEl);
        activeBalls.push(ballEl);
        makeDraggable(ballEl);
    });
}

function clampPosition(x, y) {
    let minX = 17.6, maxX = 749, minY = 17.6, maxY = 356;
    const pocketSize = 34; 

    if (x >= 364 && x <= 408) {
        minY = -10; maxY = 382; 
    } 
    else if (x < pocketSize && y < pocketSize) {
        minX = -10; minY = -10;
    }
    else if (x < pocketSize && y > 400 - pocketSize - 24) {
        minX = -10; maxY = 382;
    }
    else if (x > 800 - pocketSize - 24 && y < pocketSize) {
        maxX = 782; minY = -10;
    }
    else if (x > 800 - pocketSize - 24 && y > 400 - pocketSize - 24) {
        maxX = 782; maxY = 382;
    }
    else {
        minX = 17.6; maxX = 749; 
        minY = 17.6; maxY = 356;
    }

    if (x < minX) x = minX;
    if (x > maxX) x = maxX;
    if (y < minY) y = minY;
    if (y > maxY) y = maxY;

    return { x, y };
}

/**
 * Calcule la position magnétique alignée sur les lignes de la grille
 * en centrant le milieu de la bille sur les intersections.
 * Empêche le débordement sur les lignes de contour en repoussant la bille vers l'intérieur.
 */
function calculerSnapGrille(x, y, element) {
    // Si la case de magnétisme existe et qu'elle est décochée, on n'applique aucun filtre
    if (chkMagnetism && !chkMagnetism.checked) {
        return { x, y };
    }

    // Configuration géométrique calquée sur gridOverlay (source 1)
    const gridLeft = 19;
    const gridTop = 17;
    const gridWidth = 754;
    const gridHeight = 364;

    // Détermination dynamique des colonnes/rangées (source 1)
    const modeHD = chkHighDensityGrid ? chkHighDensityGrid.checked : false;
    const cols = modeHD ? 16 : 8;
    const rows = modeHD ? 8 : 4;

    const pasX = gridWidth / cols;  
    const pasY = gridHeight / rows; 

    // Calcul du rayon de la bille (utilise sa taille réelle ou 12px par défaut)
    const rayonBille = element ? element.offsetWidth / 2 : 12;

    // 1. Déterminer les coordonnées théoriques du CENTRE de la bille
    const centreX = x + rayonBille;
    const centreY = y + rayonBille;

    // 2. Travailler en repère local (sans les bordures/offsets du meuble de billard)
    const localCentreX = centreX - gridLeft;
    const localCentreY = centreY - gridTop;

    // 3. Magnétiser le CENTRE sur la ligne ou l'intersection la plus proche
    let snappedLocalCentreX = Math.round(localCentreX / pasX) * pasX;
    let snappedLocalCentreY = Math.round(localCentreY / pasY) * pasY;

    // 4. AJOUT : Forcer le repli d'une demi-bille si le centre touche le contour extérieur
    // Correction sur l'axe X (Gauche / Droite)
    if (snappedLocalCentreX <= 0) {
        snappedLocalCentreX = rayonBille; // Repousse vers la droite
    } else if (snappedLocalCentreX >= gridWidth) {
        snappedLocalCentreX = gridWidth - rayonBille; // Repousse vers la gauche
    }

    // Correction sur l'axe Y (Haut / Bas)
    if (snappedLocalCentreY <= 0) {
        snappedLocalCentreY = rayonBille; // Repousse vers le bas
    } else if (snappedLocalCentreY >= gridHeight) {
        snappedLocalCentreY = gridHeight - rayonBille; // Repousse vers le haut
    }

    // 5. Reconvertir le point magnétisé en coordonnées CSS Top/Left pour le coin de la bille
    const finalX = (gridLeft + snappedLocalCentreX) - rayonBille;
    const finalY = (gridTop + snappedLocalCentreY) - rayonBille;

    return { x: finalX, y: finalY };
}


function resolveCollisions(currentBall) {
    let currentX = parseFloat(currentBall.style.left);
    let currentY = parseFloat(currentBall.style.top);
    let collisionDetected = true;
    let iterations = 0;

    while (collisionDetected && iterations < 20) { 
        collisionDetected = false;

        for (let otherBall of activeBalls) {
            if (otherBall === currentBall || otherBall.style.display === 'none') continue;

            let otherX = parseFloat(otherBall.style.left);
            let otherY = parseFloat(otherBall.style.top);
            let dx = currentX - otherX;
            let dy = currentY - otherY;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ballDiameter) {
                collisionDetected = true;
                if (distance === 0) { dx = 1; dy = 0; distance = 1; }

                let overlap = ballDiameter - distance;
                currentX += (dx / distance) * overlap;
                currentY += (dy / distance) * overlap;
            }
        }
        iterations++;
    }

    const clamped = clampPosition(currentX, currentY);
    
    // Alignement magnétique basé sur le centre de la bille et la grille active
    const finalPos = calculerSnapGrille(clamped.x, clamped.y, currentBall);

    currentBall.style.left = finalPos.x + 'px';
    currentBall.style.top = finalPos.y + 'px';
    
    return finalPos;
}

function makeDraggable(element) {
    let currentX, currentY, initialX, initialY;
    let isDragging = false;

    element.addEventListener('mousedown', dragStart);
    element.addEventListener('touchstart', dragStart, { passive: true });
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (element.style.display === 'none') return;

        const xOffset = parseInt(element.style.left) || 0;
        const yOffset = parseInt(element.style.top) || 0;

        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset; 
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset; 
            initialY = e.clientY - yOffset;
        }
        
        if (e.target === element || element.contains(e.target)) {
            isDragging = true;
            
            // ÉTAPE A : Mettre à jour l'affichage dès la sélection / clic initial
            mettreAJourAffichagePosition(element, xOffset, yOffset);
        }
    }

    function drag(e) {
        if (isDragging) {
            if (e.cancelable) e.preventDefault(); 
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX; 
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX; 
                currentY = e.clientY - initialY;
            }

            const clamped = clampPosition(currentX, currentY);
            const finalPos = calculerSnapGrille(clamped.x, clamped.y, element);
            
            element.style.left = finalPos.x + 'px';
            element.style.top = finalPos.y + 'px';
            
            resolveCollisions(element);

            // ÉTAPE B : Mettre à jour l'affichage en temps réel pendant le déplacement
            mettreAJourAffichagePosition(element, finalPos.x, finalPos.y);
        }
    }

    function dragEnd() {
        if (isDragging) {
            const finalPos = resolveCollisions(element);
            isDragging = false;

            // ÉTAPE C : Ajustement final de l'affichage une fois les collisions résolues
            mettreAJourAffichagePosition(element, finalPos.x, finalPos.y);
        }
    }
}


// --- GESTION DE L'AFFICHAGE DU TITRE SUR LE TAPIS ---
const chkShowTitle = document.getElementById('chk-show-title');
const tableTitleOverlay = document.getElementById('table-title-overlay');
const titleInput = document.getElementById('input-title'); 

function rafraichirTitreSurTapis() {
    if (!tableTitleOverlay) return;
    
    const texteTitre = titleInput ? titleInput.value.trim() : "";
    tableTitleOverlay.innerText = texteTitre;

    if (chkShowTitle && chkShowTitle.checked && texteTitre !== "") {
        tableTitleOverlay.style.display = 'block';
    } else {
        tableTitleOverlay.style.display = 'none';
    }
}

if (chkShowTitle && tableTitleOverlay) {
    chkShowTitle.addEventListener('change', rafraichirTitreSurTapis);
    if (titleInput) {
        titleInput.addEventListener('input', rafraichirTitreSurTapis);
    }
}


/**
 * Convertit les coordonnées pixel CSS (left/top) d'une bille en coordonnées 
 * sur une grille de 16x8 avec le point (0,0) en bas à gauche (avec 1 décimale).
 */
/**
 * Convertit les coordonnées pixel CSS (left/top) d'une bille en coordonnées 
 * sur une grille de 16x8 avec le point (0,0) en bas à gauche.
 * Masque la décimale si le magnétisme est actif.
 */
function obtenirCoordonneesGrille(x, y, element) {
    const minX = 17.6;
    const maxX = 749;
    const minY = 17.6;
    const maxY = 356;

    const cols = 16;
    const rows = 8;

    // 1. Calculer la position relative de la bille (de 0 à 1)
    const ratioX = (x - minX) / (maxX - minX);
    const ratioY = (y - minY) / (maxY - minY);

    // 2. Multiplier par le nombre de colonnes/rangées
    let grilleX = ratioX * cols;
    let grilleY = (1 - ratioY) * rows;

    // 3. Sécurisation stricte des limites (0 à 16 et 0 à 8)
    grilleX = Math.max(0, Math.min(cols, grilleX));
    grilleY = Math.max(0, Math.min(rows, grilleY));

    // 4. Détermination dynamique du nombre de décimales selon le magnétisme
    // Si chkMagnetism existe et est coché, on affiche 0 décimale (entier), sinon 1 décimale
    const magnetismeActif = chkMagnetism ? chkMagnetism.checked : false;
    const nbDecimales = magnetismeActif ? 0 : 1;

    return { 
        x: grilleX.toFixed(nbDecimales), 
        y: grilleY.toFixed(nbDecimales) 
    };
}


/**
 * Met à jour l'affichage UI avec le nom/numéro de la bille et ses coordonnées à 1 décimale.
 */
function mettreAJourAffichagePosition(element, x, y) {
    const displayEl = document.getElementById('ball-position-display');
    if (!displayEl) return;

    if (!element) {
        displayEl.innerText = "Position de la bille : Aucune sélectionnée";
        return;
    }

    const ballId = element.getAttribute('data-id');
    const numEl = element.querySelector('.ball-num');
    const nomBille = ballId === '0' ? "Blanche" : `N°${numEl ? numEl.innerText : ballId}`;

    const coords = obtenirCoordonneesGrille(x, y, element);
    displayEl.innerText = `Bille active : ${nomBille} | Position grille : X = ${coords.x}, Y = ${coords.y}`;
}

