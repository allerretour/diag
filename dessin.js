// Variable globale pour stocker les lignes et les cibles tracées
window.dessinsSauvegardes = [];
// Variable globale pour suivre le nombre de pointes du repère X (ex: alterne entre 4, 6)
window.nombreBranchesRepereX = 6; // Garde la mémoire des branches
window.repereXEstUnCercle = false; // Permet de savoir si on bascule en mode cercle
 
// Variable globale pour suivre la dimension actuelle du carré (3 tailles en pixels)
window.tailleCarreCourante = 95; 
// Variable globale pour suivre le quadrant d'affichage des chiffres (0: Bas-Droite, 1: Bas-Gauche, 2: Haut-Gauche, 3: Haut-Droite)
window.quadrantCibleCourant = 0; 



document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const table = document.getElementById('pool-table');
    
    const colorSelect = document.getElementById('marker-color');
    const clearBtn = document.getElementById('btn-clear-lines');
    const undoBtn = document.getElementById('btn-undo-lines'); 
    // AJOUT : Récupération de la case à cocher
    const dashedCheck = document.getElementById('chk-dashed-lines');

    let isDrawing = false;
    let currentLine = null; 
    let startPoint = null; 
    let isCtrlPressed = false;
    let isShiftPressed = false;
	
	// Rafraîchir instantanément les coordonnées de la liste latérale au changement du magnétisme
if (chkMagnetism) {
    chkMagnetism.addEventListener('change', () => {
        if (typeof rafraichirListeLateraleBilles === "function") {
            rafraichirListeLateraleBilles();
        }
    });
}




// === AJOUT POUR L'APERÇU FANTÔME ===
let outilActif = null; // Peut valoir: 'cible', 'carre', 'effetBlanche', 'repereX'

    // Variables pour suivre la position du curseur sur la table de billard
    let mouseX = 0;
    let mouseY = 0;

    // Suivi permanent de la souris pour positionner la cible au pixel près
    table.addEventListener('mousemove', (e) => {
    const rect = table.getBoundingClientRect();
    mouseX = Math.round(e.clientX - rect.left);
    mouseY = Math.round(e.clientY - rect.top);

    // === AJOUT POUR L'APERÇU FANTÔME ===
    if (outilActif) {
        window.redessinerToutesLesLignes();
    }
});

	
	
	
	
	

 function configurerStyleDessin(couleur, estPointille) {
    if (couleur) {
        ctx.strokeStyle = couleur;
    } else if (window.billeSelectionneeCourante) {
        ctx.strokeStyle = window.billeSelectionneeCourante.style.backgroundColor;
    } else {
        ctx.strokeStyle = colorSelect ? colorSelect.value : '#ffffff';
    }

    ctx.lineWidth = 3;           
    ctx.lineCap = 'round';       
    ctx.lineJoin = 'round';

    if (estPointille) {
        ctx.setLineDash([4, 8]); // Restauration du motif [4, 8] d'origine
    } else {
        ctx.setLineDash([]);
    }
}

// Dessine un GRAND diagramme d'effets de bille blanche TOUJOURS NOIR (cercles vides + réticule complet) à la position (x, y)
function dessinerEffetsBilleBlanche(x, y, couleur) {
    ctx.save(); // Sauvegarde l'état global du canvas

    // --- 1. CONFIGURATION DES BANDES DE SÉCURITÉ ---
    const marge = 18;
    let zoneUtileX = marge;
    let zoneUtileY = marge;
    let zoneUtileLargeur = ctx.canvas.width - (marge * 2);
    let zoneUtileHauteur = ctx.canvas.height - (marge * 2);

    ctx.beginPath();
    ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
    // ctx.clip(); // Tronque si la forme déborde sur les bandes

    // ====================================================================
    // AJOUT : CONTOUR RECTANGULAIRE GLOBAL (BOÎTE DE CONTENEUR DU BLOC)
    // ====================================================================
    ctx.save();
    const rayonBille = 60;
    
    // Dimensions calculées pour envelopper le texte supérieur ET la bille
    const largeurCadre = 150;
    const hauteurCadre = 175;
    const demiLargeur = largeurCadre / 2;
    
    // Positionnement du coin haut-gauche pour que l'ensemble soit centré sur (x, y)
    const cadreX = x - demiLargeur;
    const cadreY = y - rayonBille - 32; // Incorpore l'espace du texte au-dessus
    const arrondiCoins = 10;

    // Tracé du fond de la boîte (Noir translucide pour détacher du tapis)
    ctx.beginPath();
    ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arrondiCoins);
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)"; 
    ctx.fill();

    // Tracé de la bordure extérieure de la boîte
    // ctx.strokeStyle = "#ffffff";
    // ctx.lineWidth = 1.5;
    // ctx.stroke();
    ctx.restore();

    // --- 2. DESSIN DU CORPS DE LA BILLE BLANCHE (EFFET BILLARD SANS CONTOUR + OMBRE) ---
    // Configuration de l'ombre portée de la bille
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)"; // Ombre douce noire transparente
    ctx.shadowBlur = 10;                     // Flou de l'ombre
    ctx.shadowOffsetX = 3;                   // Décalage horizontal (lumière venant du haut/gauche)
    ctx.shadowOffsetY = 3;                   // Décalage vertical

    ctx.fillStyle = "#ffffff"; // Fond blanc opaque de la bille
    
    ctx.beginPath();
    ctx.arc(x, y, rayonBille, 0, 2 * Math.PI);
    ctx.fill(); // Remplissage uniquement (pas de stroke pour éviter le contour)

    // Désactivation de l'ombre pour éviter qu'elle ne bave sur les tracés internes
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // --- 3. DESSIN DES LIGNES RÉTICULAIRES JUSQU'AU BORD ---
    ctx.strokeStyle = "#e0e0e0"; 
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]); // Petits pointillés fins alternés précis
    
    // Calcul des coordonnées exactes sur le cercle extérieur (Trigonométrie)
    const cos45 = Math.cos(Math.PI / 4); // ~0.707
    const décalageDiag = rayonBille * cos45;

    ctx.beginPath();
    // Axe vertical complet (Du bord haut au bord bas)
    ctx.moveTo(x, y - rayonBille); ctx.lineTo(x, y + rayonBille);
    // Axe horizontal complet (Du bord gauche au bord droite)
    ctx.moveTo(x - rayonBille, y); ctx.lineTo(x + rayonBille, y);
    // Diagonale 1 complète (Haut/Gauche - Bas/Droite)
    ctx.moveTo(x - décalageDiag, y - décalageDiag); ctx.lineTo(x + décalageDiag, y + décalageDiag);
    // Diagonale 2 complète (Bas/Gauche - Haut/Droite)
    ctx.moveTo(x - décalageDiag, y + décalageDiag); ctx.lineTo(x + décalageDiag, y - décalageDiag);
    ctx.stroke();

    // Réinitialisation des pointillés pour tracer les cercles proprement
    ctx.setLineDash([]);

    // --- 4. DESSIN DES 9 CERCLES SANS COULEUR (CONTOURS NOIRS FORCÉS) ---
    const rayonPointExterieur = 4.5; // Taille adaptée au ratio de la bille
    const rayonPointCentral = 6.5;   // Centre d'effet plus grand
    const distanceCentre = 42;       // Éloignement proportionnel des points extérieurs
    const diagPoint = distanceCentre * cos45;

    // Coordonnées relatives des 9 repères
    const pointsEffets = [
        { dx: 0, dy: 0, estCentre: true },                                
        { dx: 0, dy: -distanceCentre, estCentre: false },                 
        { dx: 0, dy: distanceCentre, estCentre: false },                  
        { dx: -distanceCentre, dy: 0, estCentre: false },                 
        { dx: distanceCentre, dy: 0, estCentre: false },                  
        { dx: -diagPoint, dy: -diagPoint, estCentre: false },     
        { dx: diagPoint, dy: -diagPoint, estCentre: false },      
        { dx: -diagPoint, dy: diagPoint, estCentre: false },      
        { dx: diagPoint, dy: diagPoint, estCentre: false }        
    ];

    // Remplissage des ronds blancs pour effacer les pointillés en dessous
    ctx.fillStyle = "#ffffff"; 
    pointsEffets.forEach(pt => {
        const rayonActuel = pt.estCentre ? rayonPointCentral : rayonPointExterieur;
        ctx.beginPath();
        ctx.arc(x + pt.dx, y + pt.dy, rayonActuel, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Application des bordures grises internes sur les repères
    ctx.strokeStyle = "#e0e0e0";
    pointsEffets.forEach(pt => {
        const rayonActuel = pt.estCentre ? rayonPointCentral : rayonPointExterieur;
        ctx.lineWidth = pt.estCentre ? 1.5 : 1.3;
        ctx.beginPath();
        ctx.arc(x + pt.dx, y + pt.dy, rayonActuel, 0, 2 * Math.PI);
        ctx.stroke();
    });

    ctx.restore(); // Restaure le clip géométrique initial
	
	// ====================================================================
    // ÉTIQUETTE "POINT DE CONTACT" : TEXTE BLANC
    // ====================================================================
    ctx.save();
    
    // Le texte profite désormais du fond sombre du conteneur pour sa lisibilité
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    
    // Positionné à 12 pixels au-dessus du sommet de la bille blanche
    ctx.fillText("POINT DE CONTACT", x, y - rayonBille - 12);
    
    ctx.restore();
}



// Dessine un repère en forme d'étoile stylisée, très grasse et opaque à 60% à la position (x, y)
function dessinerRepereXGras(x, y, couleur) {
    ctx.save(); // Sauvegarde l'état global du canvas

    // --- 1. CONFIGURATION DES BANDES DE SÉCURITÉ ---
    const marge = 18;
    let zoneUtileX = marge;
    let zoneUtileY = marge;
    let zoneUtileLargeur = ctx.canvas.width - (marge * 2);
    let zoneUtileHauteur = ctx.canvas.height - (marge * 2);

    ctx.beginPath();
    ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);

    // --- 2. CONFIGURATION DU STYLE EXTRA-GRAS ---
    const couleurTrace = couleur || (colorSelect ? colorSelect.value : '#ffffff');
    ctx.strokeStyle = couleurTrace;
    ctx.lineWidth = 2;         // Épaisseur de ligne pour un contour bien visible
    ctx.lineCap = 'round';     // Extrémités arrondies pour le style
    ctx.lineJoin = 'round';    // Angles adoucis
    ctx.setLineDash([]);       // Lignes pleines

    ctx.beginPath();

    // === 3. CAS DU CERCLE (TAILLE RÉDUITE À 10PX) ===
    if (window.repereXEstUnCercle) {
        const rayonCercle = 8; // Réduit de 13px à 10px
        ctx.arc(x, y, rayonCercle, 0, 2 * Math.PI);
    } 
    // === CAS DE L'ÉTOILE (TAILLE RÉDUITE) ===
    else {
        const branches = window.nombreBranchesRepereX || 8; 
        const rayonExterne = 12;   // Réduit de 13px à 10px
        const rayonInterne = 5;  // Réduit de 6.2px à 4.5px pour garder de belles proportions cambrées

        // Calcul géométrique des pointes et des creux de l'étoile
        for (let i = 0; i < 2 * branches; i++) {
            const rayon = (i % 2 === 0) ? rayonExterne : rayonInterne;
            const angle = (i * Math.PI) / branches - (Math.PI / 2); // Pointe vers le haut
            
            const coordX = x + Math.cos(angle) * rayon;
            const coordY = y + Math.sin(angle) * rayon;

            if (i === 0) {
                ctx.moveTo(coordX, coordY);
            } else {
                ctx.lineTo(coordX, coordY);
            }
        }
    }

    ctx.closePath();
    
    // --- 4. RAPPORT D'OPACITÉ AJUSTÉ POUR LE REMPLISSAGE ---
    ctx.globalAlpha = 0.80; // Remplissage opaque à 80%
    ctx.fillStyle = couleurTrace;
    ctx.fill();
    
    // --- 5. CONTOUR ET NETTETÉ À 100% ---
    ctx.globalAlpha = 1.0;  // Le contour reste entièrement opaque pour la visibilité
    ctx.stroke();
    
    ctx.restore(); // Restaure l'état du canvas
}




function dessinerPointeFleche(fromX, fromY, toX, toY, couleur) {
    const arrowLength = 14; 
    const arrowAngle = Math.PI / 6; 
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Ajustement : Augmentez cette valeur pour avancer la pointe (ex: 2 ou 3 pixels, ou ctx.lineWidth / 2)
    const offset = 4; 
    const tipX = toX + offset * Math.cos(angle);
    const tipY = toY + offset * Math.sin(angle);

    ctx.save(); 
    ctx.setLineDash([]); 
    
    ctx.fillStyle = couleur || (colorSelect ? colorSelect.value : '#ffffff');
    
    ctx.beginPath();
    // On part du nouveau point ajusté (tipX, tipY) au lieu de (toX, toY)
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
        tipX - arrowLength * Math.cos(angle - arrowAngle),
        tipY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
        tipX - arrowLength * Math.cos(angle + arrowAngle),
        tipY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill(); 
    ctx.restore();
}



// Dessine une cible carrée et la TRONQUE si elle dépasse sur les bandes de sécurité
// Dessine une cible carrée et la TRONQUE si elle dépasse sur les bandes de sécurité
// Dessine une cible carrée et la TRONQUE si elle dépasse sur les bandes de sécurité
function dessinerCible(x, y, couleur) {
    ctx.save(); // Sauvegarde l'état global du canvas

    // --- 1. DÉFINITION DES BANDES DE SÉCURITÉ ---
    let bandeGauche = 18;
    let bandeDroite = 18;
    let bandeHaut = 18;
    let bandeBas = 18;

    // --- 2. CRÉATION DE LA ZONE DE DÉCOUPE AVEC DIMENSIONS LOGIQUES (CORRIGÉ POUR LE ZOOM) ---
    const dpr = window.devicePixelRatio || 1;
    const canvasLogicalWidth = ctx.canvas.width / dpr;
    const canvasLogicalHeight = ctx.canvas.height / dpr;

    let zoneUtileX = bandeGauche;
    let zoneUtileY = bandeHaut;
    let zoneUtileLargeur = canvasLogicalWidth - bandeGauche - bandeDroite;
    let zoneUtileHauteur = canvasLogicalHeight - bandeHaut - bandeBas;

    ctx.beginPath();
    ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
    ctx.clip(); // Tronque parfaitement si la forme déborde au zoom
    // --- 3. DESSIN DU FOND OPAQUE A 30% ---
    ctx.save(); 
    ctx.setLineDash([]);
    ctx.fillStyle = couleur;
    ctx.globalAlpha = 0.30; 

    ctx.beginPath();
    ctx.roundRect(x - 92.5, y - 92.5, 185, 185, 8);
    ctx.fill();
    ctx.restore(); 

    // --- 4. DESSIN DES CONTOURS DE LA CIBLE ---
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2;

    // Carré extérieur avec coins arrondis
    ctx.beginPath();
    ctx.roundRect(x - 92.5, y - 92.5, 185, 185, 8);
    ctx.stroke();

    // Cercles de la cible
    let r1 = 92.5;         
    let r2 = 92.5 * (2/3); 
    let r3 = 92.5 * (1/3); 

    ctx.beginPath(); ctx.arc(x, y, r1, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r2, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r3, 0, 2 * Math.PI); ctx.stroke();

    // Lignes réticulaires se croisant au centre
    ctx.beginPath();
    ctx.moveTo(x - r1, y); ctx.lineTo(x + r1, y);
    ctx.moveTo(x, y - r1); ctx.lineTo(x, y + r1);
    ctx.stroke();

    // --- 5. CONFIGURATION ET ROTATION DU CADRAN DES CHIFFRES ---
    ctx.fillStyle = couleur;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let distCoin = r1 * Math.sqrt(2); 
    let dist1 = r1 + (distCoin - r1) / 2;
    let dist2 = r2 + (r1 - r2) / 2;
    let dist3 = r3 + (r2 - r3) / 2;
    let dist5 = r3 / 2; 

    // MODIFICATION : Calcul de l'angle selon le quadrant courant (0, 1, 2 ou 3)
    // Au repos (0), l'angle de départ est à 45° (Math.PI / 4) pour le quadrant Bas-Droite
    const indexQuadrant = window.quadrantCibleCourant || 0;
    const angleRotation = (Math.PI / 4) + (indexQuadrant * (Math.PI / 2));

    const cosAngle = Math.cos(angleRotation);
    const sinAngle = Math.sin(angleRotation);

    // Affichage des chiffres projetés sur la diagonale active
    ctx.fillText("1", x + dist1 * cosAngle, y + dist1 * sinAngle);
    ctx.fillText("2", x + dist2 * cosAngle, y + dist2 * sinAngle);
    ctx.fillText("3", x + dist3 * cosAngle, y + dist3 * sinAngle);
    ctx.fillText("5", x + dist5 * cosAngle, y + dist5 * sinAngle);

    ctx.restore(); // Annule le clip global
}




	
// Dessine un carré de 95x95 pixels avec coins arrondis, un fond pâle, et le TRONQUE si besoin
// Dessine un carré avec coins arrondis, un fond pâle, et le TRONQUE si besoin
function dessinerCarre(x, y, couleur) {
    ctx.save(); 

    // --- 1. CONFIGURATION DES BANDES DE SÉCURITÉ (CORRIGÉ POUR LE ZOOM) ---
    const marge = 18;
    const dpr = window.devicePixelRatio || 1;
    const canvasLogicalWidth = ctx.canvas.width / dpr;
    const canvasLogicalHeight = ctx.canvas.height / dpr;

    let zoneUtileX = marge;
    let zoneUtileY = marge;
    let zoneUtileLargeur = canvasLogicalWidth - (marge * 2);
    let zoneUtileHauteur = canvasLogicalHeight - (marge * 2);

    ctx.beginPath();
    ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
    ctx.clip(); 
    // --- 2. CONFIGURATION DU STYLE ---
    ctx.setLineDash([]); 
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2;

    // MODIFICATION : Utilisation de la dimension dynamique issue du cycle de rotation
    const taille = window.tailleCarreCourante || 95;
    const demiTaille = taille / 2;
    const rayonCoins = 15; 
    
    ctx.beginPath();
    ctx.roundRect(x - demiTaille, y - demiTaille, taille, taille, rayonCoins);

    // Configurer et appliquer le fond pâle (20% d'opacité)
    ctx.globalAlpha = 0.20; 
    ctx.fillStyle = couleur;
    ctx.fill();

    ctx.restore(); 
}


// Dessine un rectangle sans bordure avec des coins arrondis qui recouvre une zone de la grille
// MODIFICATION : ZD/ZA blancs, ZA hachures épaisses/pâles, textes harmonisés (20px, marge 18px)
function dessinerZoneGrille(zoneIndex, couleur, mode) {
    ctx.save();
    ctx.setLineDash([]); // Réinitialisation par sécurité
    
    // Désactiver la bordure
    ctx.strokeStyle = "transparent";
    ctx.lineWidth = 0;

    // Configuration géométrique de la table (parfaitement alignée)
    const gridLeft = 19;
    const gridTop = 18;
    const gridWidth = 754;
    const gridHeight = 364;

    // Grille : 4 horizontales par 2 verticales
    const cols = 4;
    const rows = 2;
    const pasX = gridWidth / cols;  
    const pasY = gridHeight / rows; 

    // Convertir l'index (1 à 8) en index de tableau (0 à 7)
    const idx = zoneIndex - 1;
    const r = Math.floor(idx / cols);
    const c = idx % cols;

    // Calcul des positions physiques du coin haut-gauche de la zone
    const x = gridLeft + (c * pasX);
    const y = gridTop + (r * pasY);
    
    // Paramètres de l'arrondi (20 pixels pour épouser les bandes)
    const rayonCoins = 20; 

    // Crée le chemin de la zone avec coins arrondis
    ctx.beginPath();
    ctx.roundRect(x, y, pasX, pasY, rayonCoins);

    // --- FORCE LA COULEUR BLANCHE POUR TOUTES LES ZONES ---
    const couleurBlanche = "#ffffff";

    if (mode === 'alternatif') {
        // === CAS ZONE ARRIVÉE (ZA) : REMPLISSAGE HACHURES ÉPAISSES & LÉGÈRES ===
        ctx.save();
        const patternCanvas = document.createElement('canvas');
        const pCtx = patternCanvas.getContext('2d');
        
        patternCanvas.width = 16;
        patternCanvas.height = 16;
        
        pCtx.strokeStyle = couleurBlanche;
        pCtx.lineWidth = 4; 
        pCtx.beginPath();
        pCtx.moveTo(0, 16);
        pCtx.lineTo(16, 0);
        pCtx.stroke();
        
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        ctx.fillStyle = pattern;
        ctx.globalAlpha = 0.18; 
        ctx.fill();
        ctx.restore();
    } else {
        // === CAS ZONE DÉPART (ZD) : REMPLISSAGE SOLIDE BLANC PÂLE ===
        ctx.globalAlpha = 0.18; 
        ctx.fillStyle = couleurBlanche;
        ctx.fill();
    }

    // --- CONFIGURATION COMMUNE ET HARMONISÉE DU FILIGRANE BLANC ---
    ctx.fillStyle = couleurBlanche;
    ctx.font = "bold 20px sans-serif"; // Même taille pour tous les textes de la zone
    const marge = 18;                  // Même marge pour les quatre coins
    const opaciteTexte = 0.2;          // Même opacité pour une intensité égale

    // 1. DESSIN DU TEXTE « ZD » OU « ZA » (PETIT, EN HAUT À DROITE)
    ctx.save();
    ctx.globalAlpha = opaciteTexte; 
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    
    const textPrefixe = (mode === 'alternatif') ? "ZA" : "ZD";
    ctx.fillText(textPrefixe, x + pasX - marge, y + marge);
    ctx.restore();

    // 2. MODIFICATION : DESSIN DU CHIFFRE UNIQUE IDENTIQUE (20px, EN BAS À GAUCHE)
    ctx.save();
    ctx.globalAlpha = opaciteTexte; 
    ctx.textAlign = "left";        
    ctx.textBaseline = "bottom";    
    
    // Même calcul d'alignement avec les proportions des lettres
    const positionChiffreX = x + marge;
    const positionChiffreY = y + pasY - marge;
    
    ctx.fillText(zoneIndex, positionChiffreX, positionChiffreY);
    ctx.restore();

    ctx.restore();
}





    function resizeCanvas() {
    // 1. Récupérer le facteur de zoom (pixel ratio) du navigateur
    const dpr = window.devicePixelRatio || 1;
    
    // 2. Définir la taille d'affichage CSS (ce que l'utilisateur voit)
    canvas.style.width = table.clientWidth + 'px';
    canvas.style.height = table.clientHeight + 'px';
    
    // 3. Multiplier la résolution interne du canvas par le DPR pour éviter le flou
    canvas.width = table.clientWidth * dpr;
    canvas.height = table.clientHeight * dpr;
    
    // 4. Normaliser le contexte de dessin pour ne pas avoir à réécrire vos fonctions
    ctx.scale(dpr, dpr);
    
    // 5. Appliquer les styles et redessiner
    const modeDashed = dashedCheck ? dashedCheck.checked : false;
    configurerStyleDessin(null, modeDashed);
    window.redessinerToutesLesLignes(); 
}


    window.addEventListener('resize', resizeCanvas);

    // Écoute de manière agressive les changements de pixel ratio (Zoom navigateur)
matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', function () {
    resizeCanvas();
}, { once: true });


    // Redessine l'ensemble des calques de dessin (lignes, flèches et cibles)
    window.redessinerToutesLesLignes = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        window.dessinsSauvegardes.forEach(dessin => {
            
			if (dessin.estCible) {
    if (dessin.points && dessin.points.length > 0) {
        const centre = dessin.points[0];
        
        // Sauvegarde temporaire de l'outil fantôme
        const tempQuadrant = window.quadrantCibleCourant;
        
        // Application du quadrant enregistré pour cette cible précise
        window.quadrantCibleCourant = dessin.hasOwnProperty('quadrant') ? dessin.quadrant : 0;
        
        dessinerCible(centre.x, centre.y, dessin.couleur);
        
        // Restauration pour l'aperçu dynamique sous le curseur
        window.quadrantCibleCourant = tempQuadrant;
    }
    return;
}

			
			if (dessin.estCarre) {
    if (dessin.points && dessin.points.length > 0) {
        const centre = dessin.points[0];
        
        // Sauvegarde temporaire de l'outil fantôme
        const tempTaille = window.tailleCarreCourante;
        
        // Application de la taille enregistrée pour ce carré précis
        window.tailleCarreCourante = dessin.taille || 95;
        
        dessinerCarre(centre.x, centre.y, dessin.couleur);
        
        // Restauration de la dimension pour l'aperçu sous le curseur
        window.tailleCarreCourante = tempTaille;
    }
    return;
}


// === AJOUT ICI : Gestion exclusive de la forme d'effets bille blanche ===
if (dessin.estEffetBlanche) {
    if (dessin.points && dessin.points.length > 0) {
        const centre = dessin.points[0];
        dessinerEffetsBilleBlanche(centre.x, centre.y, dessin.couleur);
    }
    return;
}

if (dessin.estRepereX) {
    if (dessin.points && dessin.points[0]) {
        const centre = dessin.points[0];
        
        // Sauvegarde temporaire du mode actif pour l'aperçu fantôme
        const tempCercle = window.repereXEstUnCercle;
        const tempBranches = window.nombreBranchesRepereX;
        
        // Application des propriétés figées du dessin
        window.repereXEstUnCercle = dessin.hasOwnProperty('estUnCercle') ? dessin.estUnCercle : false;
        window.nombreBranchesRepereX = dessin.branches || 8;
        
        dessinerRepereXGras(centre.x, centre.y, dessin.couleur);
        
        // Restauration pour l'aperçu sous la souris
        window.repereXEstUnCercle = tempCercle;
        window.nombreBranchesRepereX = tempBranches;
    }
    return;
}





// === AJOUT ICI : Gestion exclusive des formes de Zone de Grille ===
if (dessin.estZoneGrille) {
    dessinerZoneGrille(dessin.zoneId, dessin.couleur, dessin.mode);
    return;
}



            // Gestion des tracés standards et lignes droites
            if (dessin.points.length < 2) return;
            // MODIFICATION : On transmet la propriété "estPointille" sauvegardée dans l'objet
            configurerStyleDessin(dessin.couleur, dessin.estPointille);
            ctx.beginPath();
            ctx.moveTo(dessin.points[0].x, dessin.points[0].y);
            
            if (dessin.estDroite) {
                const dernierPoint = dessin.points[dessin.points.length - 1];
                ctx.lineTo(dernierPoint.x, dernierPoint.y);
                ctx.stroke();
                
                if (dessin.avecFleche) {
                    dessinerPointeFleche(dessin.points[0].x, dessin.points[0].y, dernierPoint.x, dernierPoint.y, dessin.couleur);
                }
            } else {
                for (let i = 1; i < dessin.points.length; i++) {
                    ctx.lineTo(dessin.points[i].x, dessin.points[i].y);
                }
                ctx.stroke();
            }
        });

        // === AJOUT ICI : RENDU DE L'APERÇU FANTÔME ===
    if (outilActif) {
        ctx.save();
        ctx.globalAlpha = 0.40; // Rapproche la forme d'un aspect "fantôme" translucide
        
        let couleurActive = colorSelect ? colorSelect.value : '#ffffff';
        if (window.billeSelectionneeCourante) {
            couleurActive = window.billeSelectionneeCourante.style.backgroundColor;
        }

        // Dessine la bonne forme en temps réel sous le curseur
        if (outilActif === 'cible') dessinerCible(mouseX, mouseY, couleurActive);
        if (outilActif === 'carre') dessinerCarre(mouseX, mouseY, couleurActive);
        if (outilActif === 'repereX') dessinerRepereXGras(mouseX, mouseY, couleurActive);
        if (outilActif === 'effetBlanche') dessinerEffetsBilleBlanche(mouseX, mouseY, couleurActive);
        
        ctx.restore();
    }

        const modeDashed = dashedCheck ? dashedCheck.checked : false;
        configurerStyleDessin(null, modeDashed); 
    };

    function annulerDernierTrace() {
        if (window.dessinsSauvegardes.length > 0) {
            window.dessinsSauvegardes.pop(); 
            window.redessinerToutesLesLignes(); 
        }
    }

    if (colorSelect) {
        colorSelect.addEventListener('change', () => {
            ctx.strokeStyle = colorSelect.value;
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            window.dessinsSauvegardes = []; 
        });
    }

    if (undoBtn) {
        undoBtn.addEventListener('click', annulerDernierTrace);
    }

    // --- LOGIQUE DE CLAVIER ET RACCOURCIS CORRIGÉE ---
     // --- LOGIQUE DE CLAVIER ET RACCOURCIS CORRIGÉE ---
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return; 
        }

        // 1. Gestion de l'annulation
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault(); 
            annulerDernierTrace();
            return; 
        }

        if (e.key === 'Shift') {
            isShiftPressed = true;
            canvas.style.pointerEvents = 'auto';
        }
        if (e.key === 'Control') {
            isCtrlPressed = true;
        }

        if (e.key.toLowerCase() === 't') {
			e.preventDefault();
    
			if (outilActif === 'cible') {
			// Si l'outil est déjà actif, on passe au quadrant suivant (0 ➔ 1 ➔ 2 ➔ 3 ➔ 0)
			window.quadrantCibleCourant = (window.quadrantCibleCourant + 1) % 4;
		} else {
        // Si l'outil n'était pas actif, on l'active
			outilActif = 'cible';
    }

    if (outilActif) canvas.style.pointerEvents = 'auto';
    window.redessinerToutesLesLignes();
}


// Raccourci pour masquer / afficher le canvas (Touche H)
if (e.key.toLowerCase() === 'h') {
    e.preventDefault();
    if (canvas.style.visibility === 'hidden') {
        canvas.style.visibility = 'visible';
    } else {
        canvas.style.visibility = 'hidden';
    }
}



        if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    
    if (outilActif === 'carre') {
        // Si l'outil est déjà actif, on fait tourner les dimensions (3 tailles)
        if (window.tailleCarreCourante === 95) window.tailleCarreCourante = 135;
        else if (window.tailleCarreCourante === 135) window.tailleCarreCourante = 180;
        else window.tailleCarreCourante = 95; // Retour au début du cycle
		} else {
        // Si l'outil n'était pas actif, on l'active
        outilActif = 'carre';
		}

		if (outilActif) canvas.style.pointerEvents = 'auto';
		window.redessinerToutesLesLignes();
	}


       if (e.key === '9') {
    e.preventDefault();
    
    if (outilActif === 'repereX') {
        if (window.repereXEstUnCercle) {
            // Si c'était un cercle, on repasse sur une étoile à 4 branches
            window.repereXEstUnCercle = false;
            window.nombreBranchesRepereX = 4;
        } else if (window.nombreBranchesRepereX === 4) window.nombreBranchesRepereX = 6;
        else {
            // Après l'étoile à 6 branches, on bascule sur le mode cercle
            window.repereXEstUnCercle = true;
        }
    } else {
        outilActif = 'repereX';
    }

    if (outilActif) canvas.style.pointerEvents = 'auto';
    window.redessinerToutesLesLignes();
}



        if (e.key === '0') {
            e.preventDefault();
            outilActif = (outilActif === 'effetBlanche') ? null : 'effetBlanche';
            if (outilActif) canvas.style.pointerEvents = 'auto';
            window.redessinerToutesLesLignes();
        }

        // Touche Échap pour annuler l'aperçu en cours
        if (e.key === 'Escape') {
            outilActif = null;
            window.redessinerToutesLesLignes();
        }

        if (e.key.toLowerCase() === 'e' || e.key === 'Delete') {
            window.detecterEtEffacerDessin(mouseX, mouseY);
        }

        // 3. Gestion des zones de grille (1 à 8)
        if (e.key >= '1' && e.key <= '8') {
            const zoneId = parseInt(e.key, 10);
            const indexZoneExistante = window.dessinsSauvegardes.findIndex(dessin => dessin.estZoneGrille && dessin.zoneId === zoneId);

            if (indexZoneExistante !== -1) {
                const zoneActive = window.dessinsSauvegardes[indexZoneExistante];
                if (!zoneActive.mode || zoneActive.mode === 'standard') {
                    zoneActive.mode = 'alternatif';
                } else {
                    window.dessinsSauvegardes.splice(indexZoneExistante, 1);
                }
            } else {
                const couleurActive = colorSelect ? colorSelect.value : '#ffffff';
                const nouvelleZone = {
                    couleur: couleurActive,
                    estZoneGrille: true,
                    zoneId: zoneId,
                    mode: 'standard',
                    points: [] 
                };
                window.dessinsSauvegardes.push(nouvelleZone);
            }
            window.redessinerToutesLesLignes();
        }
    });


    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            isShiftPressed = false;
            canvas.style.pointerEvents = 'none';
            if (isDrawing) finTrace();
        }
        if (e.key === 'Control') {
            isCtrlPressed = false;
        }
    });

    // Sécurité additionnelle : Si l'utilisateur change de fenêtre, on réinitialise les touches
    window.addEventListener('blur', () => {
        isShiftPressed = false;
        isCtrlPressed = false;
        if (canvas) canvas.style.pointerEvents = 'none';
        if (isDrawing) finTrace();
    });

    table.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            canvas.style.pointerEvents = 'auto';
            commencerDessin(e);
        }
    });

function commencerDessin(e) {

    // === AJOUT : CLIC POUR PLACER LA FORME FANTÔME ===
    if (outilActif && e.button === 0) { // Clic gauche
        const couleurActive = window.billeSelectionneeCourante ? 
            window.billeSelectionneeCourante.style.backgroundColor : 
            (colorSelect ? colorSelect.value : '#ffffff');

        let nouvelElement = {
            couleur: couleurActive,
            points: [{ x: mouseX, y: mouseY }]
        };

        // On assigne le bon drapeau selon l'outil actif
        if (outilActif === 'cible') {
    nouvelElement.estCible = true;
    // On fige l'index de quadrant sélectionné au moment précis du clic
    nouvelElement.quadrant = window.quadrantCibleCourant || 0; 
}

        if (outilActif === 'carre') {
			nouvelElement.estCarre = true;
		// On fige la taille sélectionnée au moment précis du clic
			nouvelElement.taille = window.tailleCarreCourante || 95; 
		}

        if (outilActif === 'repereX') {
			nouvelElement.estRepereX = true;
		// On sauvegarde l'état exact (étoile ou cercle) pour ce dessin
			nouvelElement.estUnCercle = window.repereXEstUnCercle;
			nouvelElement.branches = window.nombreBranchesRepereX;
		}

        if (outilActif === 'effetBlanche') nouvelElement.estEffetBlanche = true;

        window.dessinsSauvegardes.push(nouvelElement);
        outilActif = null; // Désactive l'outil après la pose
        window.redessinerToutesLesLignes();
        return; // Évite de déclencher un tracé de ligne classique en même temps
    }

    isDrawing = true;
    const rect = table.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    
    // 1. Percer le canvas pour trouver ce qu'il y a en dessous
    canvas.style.pointerEvents = 'none';
    const elementSousCurseur = document.elementFromPoint(e.clientX, e.clientY);
    canvas.style.pointerEvents = 'auto';

    let billeSousCurseur = elementSousCurseur ? elementSousCurseur.closest('.ball') : null;
    let couleurActive;

    if (billeSousCurseur) {
        // --- CLIC SUR UNE BILLE ---
        if (window.billeSelectionneeCourante && window.billeSelectionneeCourante !== billeSousCurseur) {
            window.billeSelectionneeCourante.style.outline = 'none';
        }
        window.billeSelectionneeCourante = billeSousCurseur;
        billeSousCurseur.style.outline = '2px solid #ffffff';
        billeSousCurseur.style.outlineOffset = '2px';
        
        couleurActive = billeSousCurseur.style.backgroundColor;
    } else {
        // --- CLIC SUR LE TAPIS VIDE ---
        if (e.button === 2 || e.shiftKey) {
            // Clic droit ou Shift+Clic : On dessine ! On garde la couleur de la bille mémorisée
            if (window.billeSelectionneeCourante) {
                couleurActive = window.billeSelectionneeCourante.style.backgroundColor;
            } else {
                couleurActive = colorSelect ? colorSelect.value : '#ffffff';
            }
        } else {
            // Clic gauche normal sur le tapis vide : On désélectionne TOUT
            if (window.billeSelectionneeCourante) {
                window.billeSelectionneeCourante.style.outline = 'none';
            }
            window.billeSelectionneeCourante = null;
            couleurActive = colorSelect ? colorSelect.value : '#ffffff';
            
            const displayEl = document.getElementById('ball-position-display');
            if (displayEl) displayEl.innerText = "Position de la bille : Aucune sélectionnée";
        }
    }
    
    const modeDashed = dashedCheck ? dashedCheck.checked : false;
    configurerStyleDessin(couleurActive, modeDashed);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    startPoint = { x, y }; 

    const forceLigneDroite = e.ctrlKey || e.metaKey || isCtrlPressed;
    const forceFleche = forceLigneDroite && (e.shiftKey || isShiftPressed);

    currentLine = {
        couleur: couleurActive,
        estDroite: forceLigneDroite, 
        avecFleche: forceFleche,
        estPointille: modeDashed, 
        points: [{ x, y }]
    };
}



    canvas.addEventListener('mousedown', (e) => {
    // Si un outil fantôme est actif, on autorise le clic gauche pour valider
    if (outilActif && e.button === 0) {
        commencerDessin(e);
    } 
    // Garde votre comportement d'origine pour le dessin classique au clic droit ou Shift+Clic
    else if (e.shiftKey || e.button === 2) {
        commencerDessin(e);
    }
});


    document.addEventListener('mousemove', (e) => {
        if (!isDrawing || !currentLine) return;

        const rect = table.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        if (currentLine.estDroite) {
            window.redessinerToutesLesLignes();
            
            // MODIFICATION : Passage du mode pointillé lors du dessin en direct
            configurerStyleDessin(currentLine.couleur, currentLine.estPointille);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();

            if (currentLine.avecFleche) {
                dessinerPointeFleche(startPoint.x, startPoint.y, x, y, currentLine.couleur);
            }

            currentLine.points = [startPoint, { x, y }];
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
            currentLine.points.push({ x, y });
        }
    });

    function finTrace() {
    if (isDrawing && currentLine) {
        if (currentLine.points.length >= 2) {
            window.dessinsSauvegardes.push(currentLine); 
        }
        isDrawing = false;
        currentLine = null;
        startPoint = null; 
        
        
    }
}


    document.addEventListener('mouseup', () => {
        finTrace();
        canvas.style.pointerEvents = 'none';
    });

    table.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    setTimeout(resizeCanvas, 100);

// AJOUT : Permet de désélectionner la bille active en cliquant n'importe où sur le tapis vide
table.addEventListener('mousedown', (e) => {
    // Si on clique sur le tapis directement (et pas sur une bille) avec le clic gauche
    if (e.target === table && e.button === 0) {
        if (window.billeSelectionneeCourante) {
            window.billeSelectionneeCourante.style.outline = 'none';
            window.billeSelectionneeCourante = null;
			
			// === AJOUT ICI : Met à jour la liste pour enlever la surbrillance ===
            if (typeof rafraichirListeLateraleBilles === "function") {
                rafraichirListeLateraleBilles();
            }
            
            // Réinitialise l'affichage textuel
            const displayEl = document.getElementById('ball-position-display');
            if (displayEl) {
                displayEl.innerText = "Position de la bille : Aucune sélectionnée";
            }
        }
    }
});


});