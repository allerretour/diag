// Variable globale pour stocker les lignes et les cibles tracées
window.dessinsSauvegardes = [];

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

    // --- 2. DESSIN DU CORPS DE LA BILLE BLANCHE (EFFET BILLARD SANS CONTOUR + OMBRE) ---
    const rayonBille = 60; // Forme agrandie à 60px de rayon
    
    // Configuration de l'ombre portée de la bille
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)"; // Ombre douce noire transparente
    ctx.shadowBlur = 10;                     // Flou de l'ombre
    ctx.shadowOffsetX = 3;                   // Décalage horizontal (lumière venant du haut/gauche)
    ctx.shadowOffsetY = 3;                   // Décalage vertical

    ctx.fillStyle = "#ffffff"; // Fond blanc opaque de la bille
    
    ctx.beginPath();
    ctx.arc(x, y, rayonBille, 0, 2 * Math.PI);
    ctx.fill(); // Remplissage uniquement (pas de stroke pour éviter le contour)


    // --- 3. DESSIN DES LIGNES RÉTICULAIRES JUSQU'AU BORD ---
    // FORCE LA COULEUR NOIRE INTERNE : Remplacement de "couleur" par "#000000"
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

    pointsEffets.forEach(pt => {
        const rayonActuel = pt.estCentre ? rayonPointCentral : rayonPointExterieur;

        ctx.beginPath();
        ctx.arc(x + pt.dx, y + pt.dy, rayonActuel, 0, 2 * Math.PI);
        
        // Tous les cercles sont "sans couleur" (remplis du blanc opaque de la bille)
        ctx.fillStyle = "#ffffff"; 
        ctx.fill();
        
        // FORCE LA COULEUR NOIRE DU CONTOUR : Remplacement de "couleur" par "#000000"
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = pt.estCentre ? 1.5 : 1.3;
        ctx.stroke();
    });

    ctx.restore(); // Restaure le clip géométrique
	
	// ====================================================================
    // ÉTIQUETTE "POINT DE CONTACT" : TEXTE BLANC AVEC OMBRE NOIRE
    // ====================================================================
    ctx.save();
    
    // Configuration de l'ombre portée noire pour détacher le texte du tapis
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 4;          // Flou de l'ombre pour la douceur
    ctx.shadowOffsetX = 2;       // Décalage horizontal léger
    ctx.shadowOffsetY = 2;       // Décalage vertical léger

    // Style du texte : Blanc pur, gras et légèrement plus grand pour la lisibilité
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
    // ctx.clip(); // Tronque si l'étoile dépasse sur les bandes de sécurité

    // --- 2. CONFIGURATION DU STYLE EXTRA-GRAS ---
    const couleurTrace = couleur || (colorSelect ? colorSelect.value : '#ffffff');
    ctx.strokeStyle = couleurTrace;
    ctx.lineWidth = 2;         // Épaisseur de ligne pour un contour bien visible
    ctx.lineCap = 'round';     // Extrémités arrondies pour le style
    ctx.lineJoin = 'round';    // Angles adoucis
    ctx.setLineDash([]);       // Lignes pleines

    // MODIFICATION : Dimensions de l'étoile augmentées de 20% (Diamètre total ~22px)
    const branches = 8;
    const rayonExterne = 13;   // Passage de 9 à 11 (Augmentation de ~22%)
    const rayonInterne = 6.2;  // Passage de 3.5 à 4.2 pour garder les proportions cambrées


    ctx.beginPath();
    
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

    ctx.closePath();
    
    // --- 3. RAPPORT D'OPACITÉ AJUSTÉ POUR LE REMPLISSAGE ---
    ctx.globalAlpha = 0.80; // MODIFICATION : Intérieur opaque à 60%
    ctx.fillStyle = couleurTrace;
    ctx.fill();
    
    // --- 4. CONTOUR ET NETTETÉ À 100% ---
    ctx.globalAlpha = 1.0;  // Le contour reste entièrement opaque pour la visibilité
    ctx.stroke();
    
    ctx.restore(); // Restaure l'état du canvas
}



 function dessinerPointeFleche(fromX, fromY, toX, toY, couleur) {
    const arrowLength = 14; 
    const arrowAngle = Math.PI / 6; 
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save(); 
    ctx.setLineDash([]); 
    
    // CORRECTION : Utilise uniquement la couleur transmise par le tracé de la ligne,
    // ou la valeur actuelle du sélecteur si aucune couleur n'est fournie.
    ctx.fillStyle = couleur || (colorSelect ? colorSelect.value : '#ffffff');
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
        toX - arrowLength * Math.cos(angle - arrowAngle),
        toY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
        toX - arrowLength * Math.cos(angle + arrowAngle),
        toY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill(); 
    ctx.restore();
}



// Dessine une cible carrée et la TRONQUE si elle dépasse sur les bandes de sécurité
function dessinerCible(x, y, couleur) {
    ctx.save(); // Sauvegarde l'état global du canvas

    // --- 1. DÉFINITION DES BANDES DE SÉCURITÉ ---
    let bandeGauche = 18;
    let bandeDroite = 18;
    let bandeHaut = 18;
    let bandeBas = 18;

    // --- 2. CRÉATION DE LA ZONE DE DÉCOUPE (CLIP) ---
    let zoneUtileX = bandeGauche;
    let zoneUtileY = bandeHaut;
    let zoneUtileLargeur = ctx.canvas.width - bandeGauche - bandeDroite;
    let zoneUtileHauteur = ctx.canvas.height - bandeHaut - bandeBas;

    ctx.beginPath();
    ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
    ctx.clip(); 

    // --- 3. DESSIN DU FOND OPAQUE A 50% ---
    ctx.save(); // Sauvegarde l'état pour l'opacité du fond
    ctx.setLineDash([]);
    ctx.fillStyle = couleur;
    ctx.globalAlpha = 0.30; // Configuration de l'opacité à 50%

    // Option A : Remplir le grand cercle extérieur (Recommandé pour une cible)
    // ctx.beginPath();
    // ctx.arc(x, y, 92.5, 0, 2 * Math.PI);
    // ctx.fill();

    // Option B : Si vous préférez remplir TOUT le carré extérieur, remplacez l'Option A par :
    ctx.beginPath();
    ctx.roundRect(x - 92.5, y - 92.5, 185, 185, 8);
    ctx.fill();

    ctx.restore(); // Restaure l'opacité à 1.0 pour les tracés et contours suivants

    // --- 4. DESSIN DES CONTOURS DE LA CIBLE ---
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2;

    // Carré extérieur avec coins arrondis (Rayon de coin : 8px)
    ctx.beginPath();
    ctx.roundRect(x - 92.5, y - 92.5, 185, 185, 8);
    ctx.stroke();

    // Cercles de la cible
    let r1 = 92.5;         // Grand cercle extérieur
    let r2 = 92.5 * (2/3); // Premier cercle intérieur (~61.6)
    let r3 = 92.5 * (1/3); // Deuxième cercle intérieur (~30.8)
    let r4 = 4;            // Petit cercle central

    ctx.beginPath(); ctx.arc(x, y, r1, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r2, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r3, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r4, 0, 2 * Math.PI); ctx.stroke();

    // Lignes réticulaires horizontales
    ctx.beginPath();
    ctx.moveTo(x - r1, y); ctx.lineTo(x - r4, y);
    ctx.moveTo(x + r4, y); ctx.lineTo(x + r1, y);
    ctx.stroke();

    // Lignes réticulaires verticales
    ctx.beginPath();
    ctx.moveTo(x, y - r1); ctx.lineTo(x, y - r4);
    ctx.moveTo(x, y + r4); ctx.lineTo(x, y + r1);
    ctx.stroke();

    // Configuration du texte pour les chiffres
    ctx.fillStyle = couleur;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let cos45 = Math.cos(Math.PI / 4);
    let distCoin = r1 * Math.sqrt(2); 

    let dist1 = r1 + (distCoin - r1) / 2;
    let dist2 = r2 + (r1 - r2) / 2;
    let dist3 = r3 + (r2 - r3) / 2;
    let dist5 = r4 + (r3 - r4) / 2;

    // Affichage unique en diagonale bas-droite
    ctx.fillText("1", x + dist1 * cos45, y + dist1 * cos45);
    ctx.fillText("2", x + dist2 * cos45, y + dist2 * cos45);
    ctx.fillText("3", x + dist3 * cos45, y + dist3 * cos45);
    ctx.fillText("5", x + dist5 * cos45, y + dist5 * cos45);

    ctx.restore(); // Annule le clip global
}


	
// Dessine un carré de 95x95 pixels avec coins arrondis, un fond pâle, et le TRONQUE si besoin
function dessinerCarre(x, y, couleur) {
    ctx.save(); // Sauvegarde l'état global du canvas

    // --- 1. CONFIGURATION DES BANDES DE SÉCURITÉ (MARGE 20PX) ---
    const marge = 18;

    // --- 2. CRÉATION DE LA ZONE DE DÉCOUPE (CLIP) ---
    let zoneUtileX = marge;
    let zoneUtileY = marge;
    let zoneUtileLargeur = ctx.canvas.width - (marge * 2);
    let zoneUtileHauteur = ctx.canvas.height - (marge * 2);

    ctx.beginPath();
    ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
    ctx.clip(); // Tout ce qui dépasse de ce rectangle sera automatiquement tronqué

    // --- 3. DESSIN DU CARRÉ ---
    ctx.setLineDash([]); // Les carrés restent en lignes pleines
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2;

    const taille = 95;
    const demiTaille = taille / 2;
    const rayonCoins = 15; // Rayon de l'arrondi en pixels
    
    ctx.beginPath();
    // Utilisation de roundRect pour créer les coins arrondis automatiquement
    ctx.roundRect(x - demiTaille, y - demiTaille, taille, taille, rayonCoins);

    // 1. Appliquer le contour (décommenter si besoin d'un contour visible)
    // ctx.stroke();

    // 2. Configurer et appliquer le fond pâle (20% d'opacité)
    ctx.globalAlpha = 0.20; 
    ctx.fillStyle = couleur;
    ctx.fill();

    ctx.restore(); // Annule le clip pour que le reste du jeu puisse s'afficher normalement
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
        canvas.width = table.clientWidth;
        canvas.height = table.clientHeight;
        const modeDashed = dashedCheck ? dashedCheck.checked : false;
        configurerStyleDessin(null, modeDashed);
        window.redessinerToutesLesLignes(); 
    }

    window.addEventListener('resize', resizeCanvas);

    // Redessine l'ensemble des calques de dessin (lignes, flèches et cibles)
    window.redessinerToutesLesLignes = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        window.dessinsSauvegardes.forEach(dessin => {
            
			// === SÉCURITÉ : On s'assure que les formes fixes ne subissent pas les pointillés globaux ===
			if (dessin.estCible || dessin.estCarre || dessin.estEffetBlanche || dessin.estRepereX || dessin.estZoneGrille) {
				ctx.setLineDash([]); // Force les lignes pleines pour les cibles/formes posées
			}
			
			// Gestion exclusive des éléments de type Cible
            if (dessin.estCible) {
                if (dessin.points && dessin.points.length > 0) {
                    const centre = dessin.points[0];
                    dessinerCible(centre.x, centre.y, dessin.couleur);
                }
                return;
            }
			
			// AJOUT : Gestion exclusive des éléments de type Carré
if (dessin.estCarre) {
    if (dessin.points && dessin.points.length > 0) {
        const centre = dessin.points[0];
        dessinerCarre(centre.x, centre.y, dessin.couleur);
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

// === AJOUT : Gestion exclusive des formes de repère X gras ===
if (dessin.estRepereX) {
    if (dessin.points && dessin.points.length > 0) {
        const centre = dessin.points[0];
        dessinerRepereXGras(centre.x, centre.y, dessin.couleur);
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

        // 2. Gestion des modes "Aperçu Fantôme" (Bascule ON/OFF)
        if (e.key.toLowerCase() === 't') {
            e.preventDefault();
            outilActif = (outilActif === 'cible') ? null : 'cible';
            if (outilActif) canvas.style.pointerEvents = 'auto';
            window.redessinerToutesLesLignes();
        }

        if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            outilActif = (outilActif === 'carre') ? null : 'carre';
            if (outilActif) canvas.style.pointerEvents = 'auto';
            window.redessinerToutesLesLignes();
        }

        if (e.key === '9') {
            e.preventDefault();
            outilActif = (outilActif === 'repereX') ? null : 'repereX';
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
        if (outilActif === 'cible') nouvelElement.estCible = true;
        if (outilActif === 'carre') nouvelElement.estCarre = true;
        if (outilActif === 'repereX') nouvelElement.estRepereX = true;
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
            
            // Réinitialise l'affichage textuel
            const displayEl = document.getElementById('ball-position-display');
            if (displayEl) {
                displayEl.innerText = "Position de la bille : Aucune sélectionnée";
            }
        }
    }
});


});