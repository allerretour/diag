// Variable globale pour stocker les lignes et les cibles tracées
window.dessinsSauvegardes = [];
// Variable globale pour suivre le nombre de pointes du repère X (ex: alterne entre 4, 6)
window.nombreBranchesRepereX = 6; // Garde la mémoire des branches
window.repereXEstUnCercle = false; // Permet de savoir si on bascule en mode cercle

// NOUVEAU : Liste ordonnée pour le cycle de la touche 9
window.repereXTexte = null; 
const cycleCaracteres = ["A", "B", "C", "D", "E", "F", "1", "2", "3", "4", "5", "6"];
 
// Variable globale pour suivre la dimension actuelle du carré (3 tailles en pixels)
window.tailleCarreCourante = 95; 
// Variable globale pour suivre le quadrant d'affichage des chiffres (0: Bas-Droite, 1: Bas-Gauche, 2: Haut-Gauche, 3: Haut-Droite)
window.quadrantCibleCourant = 0;

// Variable globale pour suivre la force du coup (0: désactivé, 1: 25%, 2: 50%, 3: 75%, 4: 100%)
window.niveauForceCourant = 0; 
const labelsForce = { 1: "DOUX", 2: "MOYEN", 3: "FORT", 4: "MAX" };
const couleursForce = { 1: "#2ecc71", 2: "#f1c40f", 3: "#e67e22", 4: "#e74c3c" }; // Vert, Jaune, Orange, Rouge




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
	// === AJOUT : Récupération de la nouvelle case à cocher ===
    const toggleDrawingsCheck = document.getElementById('chk-toggle-drawings');

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

        // === SUIVI EN DIRECT OPTIMISÉ POUR L'APERÇU FANTÔME ===
    let animationFrameId = null;

    table.addEventListener('mousemove', (e) => {
        const rect = table.getBoundingClientRect();
        mouseX = Math.round(e.clientX - rect.left);
        mouseY = Math.round(e.clientY - rect.top);

        // Si aucun outil fantôme n'est actif, inutile de surcharger le processeur
        if (!outilActif) return;

        // Si un rafraîchissement graphique est déjà planifié pour le prochain cycle de l'écran, on attend
        if (animationFrameId) return;

        // Planification du dessin synchronisé avec l'écran
        animationFrameId = requestAnimationFrame(() => {
            window.redessinerToutesLesLignes();
            animationFrameId = null; // Libère le verrou une fois le rendu terminé
        });
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

function dessinerEffetsBilleBlanche(x, y, couleur, forceFige) {
    ctx.save(); 

    // --- 1. CONFIGURATION DES BANDES DE SÉCURITÉ ---
    const marge = 18;
    let zoneUtileX = marge;
    let zoneUtileY = marge;
    let zoneUtileLargeur = ctx.canvas.width - (marge * 2);
    let zoneUtileHauteur = ctx.canvas.height - (marge * 2);

    ctx.beginPath();
    ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);

    const forceActuelle = (forceFige !== undefined) ? forceFige : window.niveauForceCourant;
    const jaugeActive = forceActuelle > 0;
    
    // Proportions du panneau adaptées
    const largeurCadre = jaugeActive ? 210 : 150; 
    const hauteurCadre = 175;
    const demiLargeur = largeurCadre / 2;
    const rayonBille = 60;
    
    const cadreX = x - demiLargeur;
    const cadreY = y - rayonBille - 32; 
    const arronsCoins = 12; 

    // 1. Fond du cadre (Teinte anthracite sombre translucide)
    ctx.beginPath();
    ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arronsCoins);
    ctx.fillStyle = "rgba(16, 20, 30, 0.85)"; 
    ctx.fill();

    // Décalage de la bille vers la gauche si la jauge s'affiche
    const shiftX = jaugeActive ? -20 : 0;
    const billeX = x + shiftX;

    // 2. Corps de la bille blanche
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#ffffff"; 
    ctx.beginPath();
    ctx.arc(billeX, y, rayonBille, 0, 2 * Math.PI);
    ctx.fill(); 
    ctx.restore();

    // 3. Réticule (lignes en pointillés fins)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)"; 
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]); 
    
    const cos45 = Math.cos(Math.PI / 4);
    const decalageDiag = rayonBille * cos45;

    ctx.beginPath();
    ctx.moveTo(billeX, y - rayonBille); ctx.lineTo(billeX, y + rayonBille);
    ctx.moveTo(billeX - rayonBille, y); ctx.lineTo(billeX + rayonBille, y);
    ctx.moveTo(billeX - decalageDiag, y - decalageDiag); ctx.lineTo(billeX + decalageDiag, y + decalageDiag);
    ctx.moveTo(billeX - decalageDiag, y + decalageDiag); ctx.lineTo(billeX + decalageDiag, y - decalageDiag);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Points d'effets (Rond central et extérieurs)
    const rayonPointExterieur = 4.5;
    const rayonPointCentral = 6.5;
    const distanceCentre = 42;
    const diagPoint = distanceCentre * cos45;

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

    ctx.fillStyle = "#ffffff"; 
    pointsEffets.forEach(pt => {
        const rayonActuel = pt.estCentre ? rayonPointCentral : rayonPointExterieur;
        ctx.beginPath();
        ctx.arc(billeX + pt.dx, y + pt.dy, rayonActuel, 0, 2 * Math.PI);
        ctx.fill();
    });

    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    pointsEffets.forEach(pt => {
        const rayonActuel = pt.estCentre ? rayonPointCentral : rayonPointExterieur;
        ctx.lineWidth = pt.estCentre ? 1.5 : 1.2;
        ctx.beginPath();
        ctx.arc(billeX + pt.dx, y + pt.dy, rayonActuel, 0, 2 * Math.PI);
        ctx.stroke();
    });

    // Label 1 : "CONTACT" (Fluide et épuré au-dessus de la bille blanche)
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("CONTACT", billeX, y - rayonBille - 12);

    // ====================================================================
    // JAUGE DE PUISSANCE MODERNISÉE
    // ====================================================================
    if (jaugeActive) {
        const jaugeWidth = 14;
        const jaugeHeight = rayonBille * 2; // 120px
        const jaugeX = cadreX + largeurCadre - 32;
        const jaugeY = y - rayonBille;

        // Label 2 : "FORCE" ou "PUISSANCE" placé de façon symétrique au-dessus du curseur
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("FORCE", jaugeX + (jaugeWidth / 2), jaugeY - 12);

        // Dégradé linéaire vertical fluide
        const grad = ctx.createLinearGradient(jaugeX, jaugeY + jaugeHeight, jaugeX, jaugeY);
        grad.addColorStop(0, "#2ecc71");   // Vert
        grad.addColorStop(0.4, "#f1c40f"); // Jaune
        grad.addColorStop(0.7, "#e67e22"); // Orange
        grad.addColorStop(1, "#e74c3c");   // Rouge

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(jaugeX, jaugeY, jaugeWidth, jaugeHeight, 6);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Effet vitré par-dessus la jauge
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.beginPath();
        ctx.roundRect(jaugeX, jaugeY, jaugeWidth / 2, jaugeHeight, { topLeft: 6, bottomLeft: 6 });
        ctx.fill();

        // Calcul de l'emplacement vertical de l'indicateur
        const hauteurCibleY = jaugeY + jaugeHeight - ((forceActuelle / 4) * jaugeHeight);

        // Aiguille indicatrice (Triangle blanc)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(jaugeX - 6, hauteurCibleY);       
        ctx.lineTo(jaugeX - 12, hauteurCibleY - 4);  
        ctx.lineTo(jaugeX - 12, hauteurCibleY + 4);  
        ctx.closePath();
        
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();

        // Ligne de coupe sur la jauge
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(jaugeX, hauteurCibleY);
        ctx.lineTo(jaugeX + jaugeWidth, hauteurCibleY);
        ctx.stroke();

        // Contour extérieur discret
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(jaugeX, jaugeY, jaugeWidth, jaugeHeight, 6);
        ctx.stroke();

        // Label numérique en pourcentage (ex: 25%, 50%, etc.)
        const valeurPourcentage = forceActuelle * 25;
        ctx.fillStyle = couleursForce[forceActuelle];
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`${valeurPourcentage}%`, jaugeX + (jaugeWidth / 2), jaugeY + jaugeHeight + 8);
    }

    ctx.restore(); 
}


function dessinerRepereXGras(x, y, couleur, texteFige) {
    ctx.save(); 

    // --- 1. CONFIGURATION DES BANDES DE SÉCURITÉ ---
    const marge = 18;
    let zoneUtileX = marge;
    let zoneUtileY = marge;
    let zoneUtileLargeur = ctx.canvas.width - (marge * 2);
    let zoneUtileHauteur = ctx.canvas.height - (marge * 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
    ctx.clip(); 
    ctx.restore();

    // --- 2. CONFIGURATION DU STYLE EXTRA-GRAS ALIGNÉ SUR LES BILLES ---
    const couleurTrace = couleur || (colorSelect ? colorSelect.value : '#ffffff');
    ctx.setLineDash([]);       

    // Extraction du texte à afficher (figé ou dynamique pour l'aperçu)
    const texteAAfficher = (texteFige !== undefined) ? texteFige : window.repereXTexte;

    // === CAS 1 : DU TEXTE (A-F, 1-6) ===
    if (texteAAfficher) {
        ctx.fillStyle = couleurTrace;
        ctx.font = "bold 18px sans-serif"; // Ajusté pour s'inscrire harmonieusement dans les 24px
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(texteAAfficher, x, y);
    } 
        // === CAS 2 : DU CERCLE (0 pointe) ===
    else if ((texteFige === undefined && window.repereXEstUnCercle) || (texteFige === null && window.repereXEstUnCercle)) {
        ctx.beginPath(); 
        ctx.arc(x, y, 12, 0, 2 * Math.PI); // Diamètre de 24px (Taille d'une bille)
        ctx.closePath();
        
        // 1. REMPLISSAGE DU FOND (Identique aux étoiles, lignes pleines)
        ctx.globalAlpha = 0.80;
        ctx.fillStyle = couleurTrace;
        ctx.fill();

        // 2. TRACÉ DU CONTOUR EN POINTILLÉ PLUS FIN
        ctx.strokeStyle = couleurTrace;
        ctx.lineWidth = 1.5; // Ligne plus fine pour un rendu plus précis
        ctx.setLineDash([2, 2]); // Pointillés serrés (2px de tiret, 2px d'espace)
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        
        // RECONSTRUCTION DU CANVAS : Réinitialise pour les autres formes
        ctx.setLineDash([]); 
    }


    // === CAS 3 : DE L'ÉTOILE (4 ou 6 branches) ===
    else {
        ctx.strokeStyle = couleurTrace;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath(); 

        const branches = (texteFige === undefined) ? window.nombreBranchesRepereX : (window.nombreBranchesRepereX || 4); 
        const rayonExterne = 12; // Le rayon maximal passe à 12px (Enveloppe de 24px de large)  
        const rayonInterne = 5.5; // Ajusté proportionnellement pour conserver un bel effet visuel

        for (let i = 0; i < 2 * branches; i++) {
            const rayon = (i % 2 === 0) ? rayonExterne : rayonInterne;
            const angle = (i * Math.PI) / branches - (Math.PI / 2);
            
            const coordX = x + Math.cos(angle) * rayon;
            const coordY = y + Math.sin(angle) * rayon;

            if (i === 0) {
                ctx.moveTo(coordX, coordY);
            } else {
                ctx.lineTo(coordX, coordY);
            }
        }
        ctx.closePath();
        
        ctx.globalAlpha = 0.80;
        ctx.fillStyle = couleurTrace;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
    }
    
    ctx.restore(); 
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



function dessinerCible(x, y, couleur) {
    ctx.save(); // Sauvegarde l'état global du canvas

    // === AJOUT TECHNIQUE : FORCE LES LIGNES PLEINES POUR LA CIBLE ===
    ctx.setLineDash([]); 

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

    const indexQuadrant = window.quadrantCibleCourant || 0;
    const angleRotation = (Math.PI / 4) + (indexQuadrant * (Math.PI / 2));

    const cosAngle = Math.cos(angleRotation);
    const sinAngle = Math.sin(angleRotation);

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
                    const tempQuadrant = window.quadrantCibleCourant;
                    window.quadrantCibleCourant = dessin.hasOwnProperty('quadrant') ? dessin.quadrant : 0;
                    dessinerCible(centre.x, centre.y, dessin.couleur);
                    window.quadrantCibleCourant = tempQuadrant;
                }
                return;
            }
			
            if (dessin.estCarre) {
                if (dessin.points && dessin.points.length > 0) {
                    const centre = dessin.points[0];
                    const tempTaille = window.tailleCarreCourante;
                    window.tailleCarreCourante = dessin.taille || 95;
                    dessinerCarre(centre.x, centre.y, dessin.couleur);
                    window.tailleCarreCourante = tempTaille;
                }
                return;
            }

            // === GESTION DE LA FORME D'EFFETS BILLE BLANCHE SAUVEGARDÉE ===
            if (dessin.estEffetBlanche) {
                if (dessin.points && dessin.points.length > 0) {
                    const centre = dessin.points[0];
                    // On passe dessin.force qui a été figé au moment du clic
                    dessinerEffetsBilleBlanche(centre.x, centre.y, dessin.couleur, dessin.force);
                }
                return;
            }

            if (dessin.estRepereX) {
                if (dessin.points && dessin.points[0]) {
                    const centre = dessin.points[0];
                    const tempCercle = window.repereXEstUnCercle;
                    const tempBranches = window.nombreBranchesRepereX;
                    window.repereXEstUnCercle = dessin.hasOwnProperty('estUnCercle') ? dessin.estUnCercle : false;
                    window.nombreBranchesRepereX = dessin.branches || 8;
                    
                    dessinerRepereXGras(centre.x, centre.y, dessin.couleur, dessin.texte);
                    
                    window.repereXEstUnCercle = tempCercle;
                    window.nombreBranchesRepereX = tempBranches;
                }
                return;
            }

            if (dessin.estZoneGrille) {
                dessinerZoneGrille(dessin.zoneId, dessin.couleur, dessin.mode);
                return;
            }

            // Gestion des tracés standards et lignes droites
            if (dessin.points.length < 2) return;
            configurerStyleDessin(dessin.couleur, dessin.estPointille);
            ctx.beginPath();
            ctx.moveTo(dessin.points[0].x, dessin.points[0].y);
            
            if (dessin.estDroite) {
                const d_point = dessin.points[dessin.points.length - 1];
                ctx.lineTo(d_point.x, d_point.y);
                ctx.stroke();
                
                if (dessin.avecFleche) {
                    dessinerPointeFleche(dessin.points[0].x, dessin.points[0].y, d_point.x, d_point.y, dessin.couleur);
                }
            } else {
                for (let i = 1; i < dessin.points.length; i++) {
                    ctx.lineTo(dessin.points[i].x, dessin.points[i].y);
                }
                ctx.stroke();
            }
        });

        // === RENDU EN DIRECT DE L'APERÇU FANTÔME (SOUS LE CURSEUR) ===
        if (outilActif) {
            ctx.save();
            ctx.globalAlpha = 0.40; // Translucide pour l'aperçu dynamique
            
            let couleurActive = colorSelect ? colorSelect.value : '#ffffff';
            if (window.billeSelectionneeCourante) {
                couleurActive = window.billeSelectionneeCourante.style.backgroundColor;
            }

            if (outilActif === 'cible') dessinerCible(mouseX, mouseY, couleurActive);
            if (outilActif === 'carre') dessinerCarre(mouseX, mouseY, couleurActive);
            if (outilActif === 'repereX') dessinerRepereXGras(mouseX, mouseY, couleurActive);
            
            // MODIFICATION ICI : On envoie la variable de force globale pour l'aperçu sous la souris
            if (outilActif === 'effetBlanche') {
                dessinerEffetsBilleBlanche(mouseX, mouseY, couleurActive, window.niveauForceCourant);
            }
            
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

   // ====================================================================
// GESTION AUTONOME DE LA CASE À COCHER "DESSINS/TRACÉS"
// ====================================================================
if (toggleDrawingsCheck) {
    toggleDrawingsCheck.addEventListener('change', () => {
        canvas.style.visibility = toggleDrawingsCheck.checked ? 'visible' : 'hidden';
    });
}

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


    // ====================================================================
    // DÉPLACEMENT MICRO-MÉTRIQUE DES BILLES AUX FLÈCHES DU CLAVIER
    // ====================================================================
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Si aucune bille n'est sélectionnée, on ne fait rien
        if (!window.billeSelectionneeCourante || window.billeSelectionneeCourante.style.display === 'none') {
            return;
        }

        // Bloque le défilement par défaut de la page web dans le navigateur
        e.preventDefault();

        // 1. Récupération des positions physiques actuelles en pixels
        let currentX = parseFloat(window.billeSelectionneeCourante.style.left) || 0;
        let currentY = parseFloat(window.billeSelectionneeCourante.style.top) || 0;

        // 2. Définition des pas géométriques basés sur votre grille 16x8
        const gridWidth = 754;
        const gridHeight = 364;
        const pasX = gridWidth / 16;  // ~47.12px (1 unité de grille X)
        const pasY = gridHeight / 8;  // ~45.5px  (1 unité de grille Y)

        // Si SHIFT est enfoncé, on déplace d'une case entière, sinon d'un micro-pas (1/10ème de case)
        const multiplicateur = e.shiftKey ? 1.0 : 0.1;
        const incrementX = pasX * multiplicateur;
        const incrementY = pasY * multiplicateur;

        // 3. Calcul des nouvelles coordonnées selon la flèche pressée
        switch (e.key) {
            case 'ArrowLeft':
                currentX -= incrementX;
                break;
            case 'ArrowRight':
                currentX += incrementX;
                break;
            case 'ArrowUp':
                currentY -= incrementY; // En CSS, diminuer 'top' fait monter l'élément
                break;
            case 'ArrowDown':
                currentY += incrementY; // Augmenter 'top' fait descendre l'élément
                break;
        }

        // 4. Sécurité anti-débordement des bandes et poches
        const positionClampee = clampPosition(currentX, currentY);

        // 5. Application directe des coordonnées physiques (sans snap magnétique forcé pour permettre le hors-piste au millimètre)
        window.billeSelectionneeCourante.style.left = `${positionClampee.x}px`;
        window.billeSelectionneeCourante.style.top = `${positionClampee.y}px`;

        // 6. Résolution des collisions à la volée avec les autres billes du tapis
        if (typeof resolveCollisions === "function") {
            resolveCollisions(window.billeSelectionneeCourante);
        }

        // 7. Rafraîchissement des modules d'information (HUD latéral et affichage texte)
        if (typeof rafraichirListeLateraleBilles === "function") {
            rafraichirListeLateraleBilles();
        }
    }


    // === LOGIQUE DU RACCOURCI TOUCHE H SYNCED AVEC LA CASE À COCHER ===
    if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (canvas.style.visibility === 'hidden') {
            canvas.style.visibility = 'visible';
            if (toggleDrawingsCheck) toggleDrawingsCheck.checked = true;
        } else {
            canvas.style.visibility = 'hidden';
            if (toggleDrawingsCheck) toggleDrawingsCheck.checked = false;
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
            if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 4 && window.repereXTexte === null) {
                // Étoile 4 -> Étoile 6
                window.nombreBranchesRepereX = 6;
            } 
            else if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 6 && window.repereXTexte === null) {
                // Étoile 6 -> Cercle
                window.repereXEstUnCercle = true;
            } 
            else if (window.repereXEstUnCercle && window.repereXTexte === null) {
                // Cercle -> Lettre A (On désactive le cercle instantanément)
                window.repereXEstUnCercle = false;
                window.repereXTexte = cycleCaracteres[0]; // "A"
            } 
            else if (window.repereXTexte !== null) {
                // Progression dans le tableau des caractères (A-F, 1-6)
                const indexActuel = cycleCaracteres.indexOf(window.repereXTexte);
                if (indexActuel >= 0 && indexActuel < cycleCaracteres.length - 1) {
                    window.repereXTexte = cycleCaracteres[indexActuel + 1];
                } else {
                    // Fin de la liste -> Retour à la configuration de départ
                    window.repereXTexte = null;
                    window.nombreBranchesRepereX = 4;
                    window.repereXEstUnCercle = false;
                }
            }
        } else {
            // Premier appui sur la touche : Initialisation de l'outil fantôme
            outilActif = 'repereX';
            window.nombreBranchesRepereX = 4;
            window.repereXEstUnCercle = false;
            window.repereXTexte = null;
        }

        if (outilActif) canvas.style.pointerEvents = 'auto';
        window.redessinerToutesLesLignes();
    }




        if (e.key === '0') {
        e.preventDefault();

        if (outilActif !== 'effetBlanche') {
            // 1er appui : On ouvre l'outil (Bille Blanche seule, pas de jauge)
            outilActif = 'effetBlanche';
            window.niveauForceCourant = 0;
        } else {
            // Appuis suivants : On incrémente la puissance (de 1 à 4)
            window.niveauForceCourant++;
            
            // Si on dépasse le niveau MAX (4), on ferme l'outil
            if (window.niveauForceCourant > 4) {
                outilActif = null;
                window.niveauForceCourant = 0;
            }
        }

        if (outilActif) canvas.style.pointerEvents = 'auto';
        // RECOLLÉ : Correction de la fonction de rafraîchissement
        window.redessinerToutesLesLignes();
    }


        // Touche Échap pour annuler l'aperçu en cours
    if (e.key === 'Escape') {
        outilActif = null;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
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
            // On fige l'état exact au moment du clic
            nouvelElement.estUnCercle = window.repereXEstUnCercle;
            nouvelElement.branches = window.nombreBranchesRepereX;
            nouvelElement.texte = window.repereXTexte; // <--- AJOUT : Sauvegarde le texte posé
        }


                if (outilActif === 'effetBlanche') {
            nouvelElement.estEffetBlanche = true;
            nouvelElement.force = window.niveauForceCourant; // <--- SÉCURISÉ : On fige la force choisie !
        }


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