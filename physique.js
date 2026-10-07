const ballColors = {
    1: '#f1c40f', // Jaune
    2: '#2980b9', // Bleu
    3: '#e74c3c', // Rouge
    4: '#8e44ad', // Violet
    5: '#e67e22', // Orange
    6: '#27ae60', // Vert
    7: '#a0522d', // Marron (Sienna / Marron officiel)
    8: '#000000'  // Noir
};

const table = document.getElementById('pool-table');
const ballDiameter = 24; 
const activeBalls = [];
window.billeSelectionneeCourante = null;

// Éléments UI pour le magnétisme et la grille
const chkMagnetism = document.getElementById('chk-magnetism');
const chkHighDensityGrid = document.getElementById('chk-high-density-grid');

function initialiserBilles() {
    if (!table) return;
    const ballsData = [];

    // Position de départ sur le Head Spot
    ballsData.push({ id: 0, num: '', color: '#ffffff', isStriped: false, x: 196, y: 186 });

    // Le rack de départ
    for (let i = 1; i <= 15; i++) {
        const colorIndex = i <= 8 ? i : i - 8;
        const color = ballColors[colorIndex];
        const isStriped = i > 8;
        
        const row = Math.floor((i - 1) / 5);
        const col = (i - 1) % 5;
        const startX = 500 + (col * 35);
        const startY = 40 + (row * 42);

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

        // MODIFICATION : Toutes les billes (y compris la blanche) se cachent au double-clic
        ballEl.addEventListener('dblclick', function() {
            this.style.display = 'none';
            
            // Nettoie l'affichage textuel de la bille active
            const displayEl = document.getElementById('ball-position-display');
            if (displayEl) {
                displayEl.innerText = "Position de la bille : Aucune sélectionnée";
            }
        });
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
    // Si le magnétisme existe et qu'elle est décochée, on n'applique aucun filtre
    if (chkMagnetism && !chkMagnetism.checked) {
        return { x, y };
    }

    // Vraies dimensions du tapis de jeu (Source 1 & 2)
    const gridLeft = 19;
    const gridTop = 17;
    const gridWidth = 754;
    const gridHeight = 364;

    const modeHD = chkHighDensityGrid ? chkHighDensityGrid.checked : false;
    const cols = modeHD ? 16 : 8;
    const rows = modeHD ? 8 : 4;

    const pasX = gridWidth / cols;  
    const pasY = gridHeight / rows; 

    // Calcul du rayon de la bille (utilise sa taille réelle ou 12px par défaut)
    const rayonBille = element ? element.offsetWidth / 2 : 12;

    // 1. Coordonnées théoriques du CENTRE de la bille
    const centreX = x + rayonBille;
    const centreY = y + rayonBille;

    // 2. Position locale par rapport à la grille de jeu
    const localCentreX = centreX - gridLeft;
    const localCentreY = centreY - gridTop;

    // 3. Magnétisme du CENTRE sur l'intersection la plus proche
    let snappedLocalCentreX = Math.round(localCentreX / pasX) * pasX;
    let snappedLocalCentreY = Math.round(localCentreY / pasY) * pasY;

    // 4. MODIFICATION : Empêcher le chevauchement sur les bandes extérieures
    // Si le centre est aimanté sur le bord 0, on le repousse vers l'intérieur d'un rayon de bille.
    // Si le centre est aimanté sur le bord maximum, on le ramène vers l'intérieur d'un rayon de bille.
    if (snappedLocalCentreX <= 0) {
        snappedLocalCentreX = rayonBille;
    } else if (snappedLocalCentreX >= gridWidth) {
        snappedLocalCentreX = gridWidth - rayonBille;
    }

    if (snappedLocalCentreY <= 0) {
        snappedLocalCentreY = rayonBille;
    } else if (snappedLocalCentreY >= gridHeight) {
        snappedLocalCentreY = gridHeight - rayonBille;
    }

    // 5. Reconvertir en coordonnées CSS de positionnement (Top/Left de la bille)
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
        
        // MODIFICATION : On retire l'éventuel contour de l'ancienne bille sélectionnée
        if (window.billeSelectionneeCourante) {
            window.billeSelectionneeCourante.style.outline = 'none';
        }
        
        // Mémorise la bille comme sélectionnée de façon permanente
        window.billeSelectionneeCourante = element; 
        
        // OPTIONNEL : Ajoute un repère visuel (ex: un contour blanc de 2px) pour savoir quelle bille est active
        element.style.outline = '2px solid #ffffff';
        element.style.outlineOffset = '2px';

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


function obtenirCoordonneesGrille(x, y, element) {
    // Repères géométriques identiques à la grille et au magnétisme
    const gridLeft = 19;
    const gridTop = 17;
    const gridWidth = 754;
    const gridHeight = 364;

    const cols = 16;
    const rows = 8;

    const rayonBille = element ? element.offsetWidth / 2 : 12;
    
    // Position du CENTRE de la bille
    const centreX = x + rayonBille;
    const centreY = y + rayonBille;

    // Calcul du ratio de position (0 à 1) à l'intérieur de la zone utile
    const ratioX = (centreX - gridLeft) / gridWidth;
    const ratioY = (centreY - gridTop) / gridHeight;

    // Transformation en index de grille (0 à 16 et 0 à 8)
    let grilleX = ratioX * cols;
    let grilleY = (1 - ratioY) * rows; // Inversion pour avoir l'origine (0,0) en bas à gauche

    // Correction des arrondis JavaScript sur les intersections magnétisées
    const magnetismeActif = chkMagnetism ? chkMagnetism.checked : false;
    if (magnetismeActif) {
        grilleX = Math.round(grilleX);
        grilleY = Math.round(grilleY);
    }

    // Bornage strict pour rester dans la grille
    grilleX = Math.max(0, Math.min(cols, grilleX));
    grilleY = Math.max(0, Math.min(rows, grilleY));

    const nbDecimales = magnetismeActif ? 0 : 1;

    return { 
        x: grilleX.toFixed(nbDecimales), 
        y: grilleY.toFixed(nbDecimales) 
    };
}


/**
 * Met à jour l'affichage UI avec le nom/numéro de la bille et ses coordonnées à 1 décimale.
 */
/**
 * Met à jour l'affichage UI avec le visuel de la bille active et ses coordonnées.
 */
function mettreAJourAffichagePosition(element, x, y) {
    const displayEl = document.getElementById('ball-position-display');
    if (!displayEl) return;

    // Vider le conteneur textuel pour insérer des éléments HTML
    displayEl.innerHTML = "";
    displayEl.style.display = "flex";
    displayEl.style.alignItems = "center";
    displayEl.style.gap = "10px"; // Espace entre la bille visuelle et le texte

    if (!element) {
        displayEl.innerText = "Position de la bille : Aucune sélectionnée";
        return;
    }

    const ballId = element.getAttribute('data-id');
    const numEl = element.querySelector('.ball-num');
    const estRayee = element.classList.contains('striped');
    const couleurBille = element.style.backgroundColor;

    // --- CRÉATION DE LA BILLE MINIATURE ---
    const miniBall = document.createElement('div');
    miniBall.classList.add('ball'); // Réutilise vos styles CSS existants (.ball)
    
    // Ajustements pour l'affichage en ligne (miniature)
    miniBall.style.position = 'relative';
    miniBall.style.left = '0';
    miniBall.style.top = '0';
    miniBall.style.display = 'flex';
    miniBall.style.cursor = 'default';
    miniBall.style.backgroundColor = couleurBille;
    miniBall.style.setProperty('--ball-color', couleurBille);

    if (estRayee) {
        miniBall.classList.add('striped');
    }

    // Réinjection du numéro s'il existe (Bille de couleur)
    if (ballId !== '0' && numEl) {
        const miniNum = document.createElement('div');
        miniNum.classList.add('ball-num');
        miniNum.innerText = numEl.innerText;
        miniBall.appendChild(miniNum);
    }

    // --- CRÉATION DU TEXTE DES COORDONNÉES ---
    const coords = obtenirCoordonneesGrille(x, y, element);
    const textLabel = document.createElement('span');
    textLabel.style.fontWeight = "bold";
    textLabel.style.color = "#ffffff";
    
    const nomBille = ballId === '0' ? "Blanche" : `N°${numEl ? numEl.innerText : ballId}`;
    textLabel.innerText = `Bille active : ${nomBille} | Position grille : X = ${coords.x}, Y = ${coords.y}`;

    // --- INJECTION DANS L'INTERFACE ---
    displayEl.appendChild(miniBall);
    displayEl.appendChild(textLabel);
}


// --- OUTILS DE SÉLECTION / COLLISION ---

// Vérifie si le clic est proche d'un point (Cible, Carré, Effet, Repère)
function estProchePoint(clicX, clicY, pointX, pointY, tolerance = 15) {
    const dx = clicX - pointX;
    const dy = clicY - pointY;
    return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

// Vérifie si le clic est proche d'un segment de droite (Lignes et Flèches)
function estProcheLigne(clicX, clicY, p1, p2, tolerance = 5) {
    const A = clicX - p1.x;
    const B = clicY - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = p1.x;
        yy = p1.y;
    } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
    } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
    }

    const dx = clicX - xx;
    const dy = clicY - yy;
    return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

// Fonction maîtresse pour trouver et effacer un dessin au clic
window.detecterEtEffacerDessin = function(clicX, clicY) {
    // On parcourt à l'envers (du plus récent au plus ancien)
    for (let i = window.dessinsSauvegardes.length - 1; i >= 0; i--) {
        const dessin = window.dessinsSauvegardes[i];

        // 1. Cas des formes ponctuelles (Cible, Carré, Bille Blanche, Repère X)
        if (dessin.estCible || dessin.estCarre || dessin.estEffetBlanche || dessin.estRepereX) {
            if (dessin.points && dessin.points[0]) {
                if (estProchePoint(clicX, clicY, dessin.points[0].x, dessin.points[0].y, 20)) {
                    window.dessinsSauvegardes.splice(i, 1); // Supprime l'élément
                    window.redessinerToutesLesLignes();     // Actualise le canvas
                    return true; // Forme trouvée et effacée
                }
            }
        }
        
        // 2. Cas des lignes droites ou flèches
        else if (dessin.estDroite && dessin.points.length >= 2) {
            if (estProcheLigne(clicX, clicY, dessin.points[0], dessin.points[dessin.points.length - 1], 6)) {
                window.dessinsSauvegardes.splice(i, 1);
                window.redessinerToutesLesLignes();
                return true;
            }
        }

        // 3. Cas du dessin libre (Tracé continu)
        else if (dessin.points && dessin.points.length >= 2) {
            for (let j = 0; j < dessin.points.length - 1; j++) {
                if (estProcheLigne(clicX, clicY, dessin.points[j], dessin.points[j+1], 6)) {
                    window.dessinsSauvegardes.splice(i, 1);
                    window.redessinerToutesLesLignes();
                    return true;
                }
            }
        }
    }
    return false; // Rien n'était assez proche
};

