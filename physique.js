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

    // Paramètres géométriques de la grille haute densité 16x8
    const gridLeft = 19;
    const gridTop = 17;
    const gridWidth = 754;
    const gridHeight = 364;
    const cols = 16;
    const rows = 8;

    const pasX = gridWidth / cols;  // Espacement horizontal d'une cellule (~47.12px)
    const pasY = gridHeight / rows; // Espacement vertical d'une cellule (~45.5px)
    const rayonBille = 12;          // Rayon pour le centrage CSS (24px / 2)

    // ====================================================================
    // 1. GÉNÉRATION DES COORDONNÉES SUR 2 LIGNES (A partir de X=1, Y=1)
    // ====================================================================
    // Nous avons 16 billes au total à placer (la blanche + 15 de couleur)
    // Elles occuperont les intersections de X=1 à X=8 sur les lignes Y=1 et Y=2
    const positionsGrille = [];
    
    for (let y = 1; y <= 2; y++) {       // Ligne 1 puis Ligne 2
        for (let x = 1; x <= 8; x++) {   // Colonnes de 1 à 8
            positionsGrille.push({ gridX: x, gridY: y });
        }
    }

    // ====================================================================
    // 2. ASSIGNATION DES POSITIONS AUX BILLES
    // ====================================================================
    // Index 0 : Bille Blanche
    const posBlanche = positionsGrille[0];
    const cuePixelX = gridLeft + (posBlanche.gridX * pasX) - rayonBille;
    const cuePixelY = gridTop + ((rows - posBlanche.gridY) * pasY) - rayonBille;
    ballsData.push({ id: 0, num: '', color: '#ffffff', isStriped: false, x: cuePixelX, y: cuePixelY });

    // Index 1 à 15 : Billes de couleur
    for (let i = 1; i <= 15; i++) {
        const colorIndex = i <= 8 ? i : i - 8;
        const color = ballColors[colorIndex];
        const isStriped = i > 8;
        
        // Récupération de la position pré-calculée suivante (index i)
        const pos = positionsGrille[i];

        // Conversion en pixels Top/Left (Origine inversée pour Y pour correspondre au bas-gauche)
        const ballPixelX = gridLeft + (pos.gridX * pasX) - rayonBille;
        const ballPixelY = gridTop + ((rows - pos.gridY) * pasY) - rayonBille;

        ballsData.push({ id: i, num: i, color: color, isStriped: isStriped, x: ballPixelX, y: ballPixelY });
    }

    // ====================================================================
    // 3. INJECTION ET CRÉATION DES ÉLÉMENTS HTML
    // ====================================================================
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

        ballEl.addEventListener('dblclick', function() {
            this.style.display = 'none';
            const displayEl = document.getElementById('ball-position-display');
            if (displayEl) {
                displayEl.innerText = "Position de la bille : Aucune sélectionnée";
            }
            rafraichirListeLateraleBilles();
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
 * Calcule la position magnétique alignée sur les lignes de la grille.
 * Si l'intersection la plus proche est occupée, cherche l'emplacement autorisé
 * libre le plus proche pour y envoyer la bille.
 */
function calculerSnapGrille(x, y, element) {
    if (chkMagnetism && !chkMagnetism.checked) {
        return { x, y };
    }

    const gridLeft = 19;
    const gridTop = 17;
    const gridWidth = 754;
    const gridHeight = 364;

    const modeHD = chkHighDensityGrid ? chkHighDensityGrid.checked : false;
    const cols = modeHD ? 16 : 8;
    const rows = modeHD ? 8 : 4;

    const pasX = gridWidth / cols;  
    const pasY = gridHeight / rows; 
    const rayonBille = element ? element.offsetWidth / 2 : 12;

    // 1. Liste des positions occupées par les AUTRES billes (en pixels top/left)
    const emplacementsOccupes = [];
    if (element) {
        activeBalls.forEach(otherBall => {
            if (otherBall !== element && otherBall.style.display !== 'none') {
                emplacementsOccupes.push({
                    x: Math.round(parseFloat(otherBall.style.left) || 0),
                    y: Math.round(parseFloat(otherBall.style.top) || 0)
                });
            }
        });
    }

    // 2. Générer et tester toutes les intersections de la grille, triées par distance avec la souris
    const intersectionsCandidat = [];

    for (let gX = 0; gX <= cols; gX++) {
        for (let gY = 0; gY <= rows; gY++) {
            let localX = gX * pasX;
            let localY = gY * pasY;

            // Sécurité anti-débordement des bandes
            if (gX === 0) localX = rayonBille;
            if (gX === cols) localX = gridWidth - rayonBille;
            if (gY === 0) localY = rayonBille;
            if (gY === rows) localY = gridHeight - rayonBille;

            const pixelX = (gridLeft + localX) - rayonBille;
            const pixelY = (gridTop + localY) - rayonBille;

            // Calcul de la distance brute entre cette intersection et le curseur (x, y)
            const dx = pixelX - x;
            const dy = pixelY - y;
            const distanceCurseur = dx * dx + dy * dy; // Pas besoin de Math.sqrt pour comparer des carrés (gain de performance)

            intersectionsCandidat.push({ x: pixelX, y: pixelY, dist: distanceCurseur });
        }
    }

    // Tri des intersections de la plus proche à la plus lointaine du curseur
    intersectionsCandidat.sort((a, b) => a.dist - b.dist);

    // 3. Trouver la première intersection la plus proche qui n'est PAS occupée
    for (let candidat of intersectionsCandidat) {
        const estOccupe = emplacementsOccupes.some(occupe => 
            Math.abs(occupe.x - Math.round(candidat.x)) < 5 && 
            Math.abs(occupe.y - Math.round(candidat.y)) < 5
        );

        if (!estOccupe) {
            // Emplacement autorisé libre le plus proche trouvé !
            return { x: candidat.x, y: candidat.y };
        }
    }

    // Si par un cas extrême tout est occupé, on retourne la position initiale clampée
    return { x, y };
}

function resolveCollisions(currentBall) {
    let currentX = parseFloat(currentBall.style.left) || 0;
    let currentY = parseFloat(currentBall.style.top) || 0;
    let collisionDetected = true;
    let iterations = 0;

    // 1. MISE EN CACHE UNIQUE : On extrait les données numériques des autres billes AVANT le while
    const otherBallsCache = [];
    for (let otherBall of activeBalls) {
        if (otherBall === currentBall || otherBall.style.display === 'none') continue;
        
        otherBallsCache.push({
            x: parseFloat(otherBall.style.left) || 0, // Lecture unique ici
            y: parseFloat(otherBall.style.top) || 0
        });
    }

    // 2. BOUCLE DE CALCUL GÉOMÉTRIQUE PUREMENT MATHÉMATIQUE (Zéro lecture DOM à l'intérieur)
    while (collisionDetected && iterations < 15) { 
        collisionDetected = false;

        for (let other of otherBallsCache) {
            let dx = currentX - other.x;
            let dy = currentY - other.y;
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

    // 3. ÉCRITURE UNIQUE DANS LE DOM : On applique les styles une seule fois à la toute fin
    const clamped = clampPosition(currentX, currentY);
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
			rafraichirListeLateraleBilles();
        }
    }

    function dragEnd() {
        if (isDragging) {
            const finalPos = resolveCollisions(element);
            isDragging = false;

            


            // ÉTAPE C : Ajustement final de l'affichage une fois les collisions résolues
            mettreAJourAffichagePosition(element, finalPos.x, finalPos.y);
			rafraichirListeLateraleBilles();
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


function rafraichirListeLateraleBilles() {
    const sidebarList = document.getElementById('visible-balls-list');
    if (!sidebarList) return;

    // 1. MÉMOIRE TAMPON : Création d'un fragment invisible pour stocker le rendu en mémoire RAM
    const fragment = document.createDocumentFragment();

    // Cache des variables globales fréquemment accédées pour éviter les lookups répétés
    const currentSelectedBall = window.billeSelectionneeCourante;
    const isMagnetismActive = chkMagnetism ? chkMagnetism.checked : false;

    // 2. CONSTRUCIION VISUELLE SYNCHRONE
    activeBalls.forEach(ball => {
        const ballId = ball.getAttribute('data-id');
        const numEl = ball.querySelector('.ball-num');
        const estRayee = ball.classList.contains('striped');
        const couleurBille = ball.style.backgroundColor;
        const estMasquee = ball.style.display === 'none';

        // Création de la ligne d'item
        const itemRow = document.createElement('div');
        itemRow.classList.add('sidebar-ball-item');
        itemRow.style.cursor = 'pointer'; 

        // Gestion des classes d'état optimisée (sans duplication)
        if (currentSelectedBall === ball && !estMasquee) {
            itemRow.classList.add('active-highlight');
        }
        if (estMasquee) {
            itemRow.classList.add('is-hidden-ball');
        }

        // ====================================================================
        // ÉCOUTEUR DE CLIC UNIQUE (SÉLECTION OU RÉAPPARITION)
        // ====================================================================
        itemRow.addEventListener('click', (e) => {
            e.stopPropagation(); 

            if (ball.style.display === 'none') {
                ball.style.display = 'flex';
                if (window.billeSelectionneeCourante) {
                    window.billeSelectionneeCourante.style.outline = 'none';
                }
                window.billeSelectionneeCourante = ball;
                ball.style.outline = '2px solid #ffffff';
                ball.style.outlineOffset = '2px';
            } else {
                if (window.billeSelectionneeCourante) {
                    window.billeSelectionneeCourante.style.outline = 'none';
                }
                window.billeSelectionneeCourante = ball;
                ball.style.outline = '2px solid #ffffff';
                ball.style.outlineOffset = '2px';
            }
            rafraichirListeLateraleBilles();
        });

        // ====================================================================
        // ÉCOUTEUR DE DOUBLE-CLIC POUR MASQUER / RETIRER LA BILLE
        // ====================================================================
        itemRow.addEventListener('dblclick', (e) => {
            e.stopPropagation(); 
            ball.style.display = 'none';

            if (window.billeSelectionneeCourante === ball) {
                ball.style.outline = 'none';
                window.billeSelectionneeCourante = null;

                const displayEl = document.getElementById('ball-position-display');
                if (displayEl) {
                    displayEl.innerText = "Position de la bille : Aucune sélectionnée";
                }
            }
            rafraichirListeLateraleBilles();
        });

        // Duplication et dessin de la bille miniature
        const miniBall = document.createElement('div');
        miniBall.classList.add('ball');
        miniBall.style.backgroundColor = couleurBille;
        miniBall.style.setProperty('--ball-color', couleurBille);

        if (estRayee) {
            miniBall.classList.add('striped');
        }

        if (ballId !== '0' && numEl) {
            const miniNum = document.createElement('div');
            miniNum.classList.add('ball-num');
            miniNum.innerText = numEl.innerText;
            miniBall.appendChild(miniNum);
        }

        // 3. OPTIMISATION GÉOMÉTRIQUE : Extraction directe des styles existants
        const pixelX = parseFloat(ball.style.left) || 0;
        const pixelY = parseFloat(ball.style.top) || 0;
        
        // On passe directement l'état du magnétisme en paramètre si nécessaire,
        // ou on laisse la fonction obtenirCoordonneesGrille s'exécuter en lisant notre cache
        const coords = obtenirCoordonneesGrille(pixelX, pixelY, ball);

        const coordsText = document.createElement('div');
        coordsText.classList.add('sidebar-ball-coords');
        
        if (estMasquee) {
            coordsText.innerHTML = `<span style="font-style: italic; opacity: 0.6;">(enlevée)</span>`;
        } else {
            coordsText.textContent = `X = ${coords.x}, Y = ${coords.y}`; // textContent est plus rapide que innerHTML
        }

        itemRow.appendChild(miniBall);
        itemRow.appendChild(coordsText);
        
        // Ajout dans la mémoire tampon (zéro impact sur l'affichage pour le moment)
        fragment.appendChild(itemRow);
    });

    // 4. ÉCRITURE ATOMIQUE UNIQUE DANS LE DOM
    sidebarList.innerHTML = ""; // Vidage rapide de l'ancien contenu
    sidebarList.appendChild(fragment); // Injection instantanée de la nouvelle liste
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

    // Transformation en index de grille brut
    let grilleX = ratioX * cols;
    let grilleY = (1 - ratioY) * rows; // Inversion pour avoir l'origine (0,0) en bas à gauche

    // Bornage strict pour rester dans la grille
    grilleX = Math.max(0, Math.min(cols, grilleX));
    grilleY = Math.max(0, Math.min(rows, grilleY));

    // Vérification de l'activation du magnétisme
    const magnetismeActif = chkMagnetism ? chkMagnetism.checked : false;

    let nbDecimalesX = 1;
    let nbDecimalesY = 1;

    // --- CONDITION : S'applique UNIQUEMENT si le magnétisme est activé ---
    if (magnetismeActif) {
        const tolerance = 0.4; // Seuil pour capter le contact avec la bande

        // Traitement de l'axe X aux extrémités
        if (grilleX <= tolerance) {
            grilleX = 0;
            nbDecimalesX = 0;
        } else if (grilleX >= cols - tolerance) {
            grilleX = cols;
            nbDecimalesX = 0;
        }

        // Traitement de l'axe Y aux extrémités
        if (grilleY <= tolerance) {
            grilleY = 0;
            nbDecimalesY = 0;
        } else if (grilleY >= rows - tolerance) {
            grilleY = rows;
            nbDecimalesY = 0;
        }
    }

    return { 
        x: grilleX.toFixed(nbDecimalesX), 
        y: grilleY.toFixed(nbDecimalesY) 
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

    // Suppression complète du texte et masquage du bloc sous la table
    displayEl.innerHTML = "";
    displayEl.style.display = "none";
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

