const ballColors = {
    1: '#f1c40f', 2: '#2980b9', 3: '#e74c3c', 4: '#8e44ad',
    5: '#e67e22', 6: '#27ae60', 7: '#7f8c8d', 8: '#000000'
};

const table = document.getElementById('pool-table');
const ballDiameter = 24; 
const activeBalls = [];

function initialiserBilles() {
    if (!table) return;
    const ballsData = [];

       // Position de départ exacte sur le Head Spot (X: 200px moins le rayon de la bille pour centrer, soit 200 - 14 = 186)
    // Nous décalons légèrement à 180 pour des raisons esthétiques afin que l'ombre ne masque pas le point blanc.
    ballsData.push({ id: 0, num: '', color: '#ffffff', isStriped: false, x: 186, y: 186 });

    // Le rack de départ (le sommet du triangle) va maintenant s'aligner par rapport au Foot Spot (X: 600px)
    for (let i = 1; i <= 15; i++) {
        const colorIndex = i <= 8 ? i : i - 8;
        const color = ballColors[colorIndex];
        const isStriped = i > 8;
        
        const row = Math.floor((i - 1) / 5);
        const col = (i - 1) % 5;
        // Aligné pour démarrer juste après le Foot Spot à droite
        const startX = 560 + (col * 35);
        const startY = 110 + (row * 42);

        ballsData.push({ id: i, num: i, color: color, isStriped: isStriped, x: startX, y: startY });
    }


       // Dans physique.js, localisez la boucle d'injection des billes et modifiez-la ainsi :
    ballsData.forEach(b => {
        const ballEl = document.createElement('div');
        ballEl.classList.add('ball');
        
        // AJOUT : On passe la couleur au CSS via une variable d'environnement locale
        ballEl.style.setProperty('--ball-color', b.color);
        
        if (b.isStriped) ballEl.classList.add('striped');
        
        ballEl.setAttribute('data-id', b.id);
        ballEl.style.backgroundColor = b.color; // Reste utile pour les billes pleines
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

// Ajoutez cette référence au début du fichier avec vos autres sélecteurs
const chkMagnetism = document.getElementById('chk-magnetism');

// ... (conservez vos fonctions initialiserBilles et clampPosition intactes) ...

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
    
    // MODIFICATION : Appliquer le magnétisme final seulement si la case est cochée
    let finalX = clamped.x;
    let finalY = clamped.y;

    if (!chkMagnetism || chkMagnetism.checked) {
        const gridSize = 3; 
        finalX = Math.round(clamped.x / gridSize) * gridSize;
        finalY = Math.round(clamped.y / gridSize) * gridSize;
    }

    currentBall.style.left = finalX + 'px';
    currentBall.style.top = finalY + 'px';
    
    return { x: finalX, y: finalY };
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

            // MODIFICATION : Calcul du magnétisme pendant le déplacement seulement si activé
            if (!chkMagnetism || chkMagnetism.checked) {
                const gridSize = 1; 
                currentX = Math.round(currentX / gridSize) * gridSize;
                currentY = Math.round(currentY / gridSize) * gridSize;
            }

            const clamped = clampPosition(currentX, currentY);
            element.style.left = clamped.x + 'px';
            element.style.top = clamped.y + 'px';
            
            resolveCollisions(element);
        }
    }

    function dragEnd() {
        if (isDragging) {
            resolveCollisions(element);
            isDragging = false;
        }
    }
}


// --- GESTION DE L'AFFICHAGE DU TITRE SUR LE TAPIS ---
const chkShowTitle = document.getElementById('chk-show-title');
const tableTitleOverlay = document.getElementById('table-title-overlay');
const titleInput = document.getElementById('input-title'); // Déjà présent dans votre code

function rafraichirTitreSurTapis() {
    if (!tableTitleOverlay) return;
    
    // Récupère la valeur de l'input titre ou met une valeur par défaut
    const texteTitre = titleInput ? titleInput.value.trim() : "";
    tableTitleOverlay.innerText = texteTitre;

    // Affiche ou masque selon la case à cocher et la présence d'un texte
    if (chkShowTitle && chkShowTitle.checked && texteTitre !== "") {
        tableTitleOverlay.style.display = 'block';
    } else {
        tableTitleOverlay.style.display = 'none';
    }
}

if (chkShowTitle && tableTitleOverlay) {
    // Écoute le clic sur la case à cocher
    chkShowTitle.addEventListener('change', rafraichirTitreSurTapis);
    
    // Écoute la saisie en direct dans l'input pour mettre à jour le tapis instantanément
    if (titleInput) {
        titleInput.addEventListener('input', rafraichirTitreSurTapis);
    }
}




