// Variable globale pour stocker les lignes et les cibles tracées
window.dessinsSauvegardes = [];
// Variable globale pour suivre le nombre de pointes du repère X (ex: alterne entre 4, 6)
window.nombreBranchesRepereX = 6; // Garde la mémoire des branches
window.repereXEstUnCercle = false; // Permet de savoir si on bascule en mode cercle

// NOUVEAU : Liste ordonnée pour le cycle de la touche 9
window.repereXTexte = null; 
const cycleCaracteres = ["A", "B", "C", "D", "E", "F","●","⚫", "1", "2", "3", "4", "5", "6"];
 
// Variable globale pour suivre la dimension actuelle du carré (3 tailles en pixels)
window.tailleCarreCourante = 95; 
// Variable globale pour suivre le quadrant d'affichage des chiffres (0: Bas-Droite, 1: Bas-Gauche, 2: Haut-Gauche, 3: Haut-Droite)
window.quadrantCibleCourant = 0;

// Variable globale pour suivre la force du coup (0: désactivé, 1: 25%, 2: 50%, 3: 75%, 4: 100%)
window.niveauForceCourant = 0; 
const labelsForce = { 1: "DOUX", 2: "MOYEN", 3: "FORT", 4: "MAX" };
const couleursForce = { 1: "#2ecc71", 2: "#f1c40f", 3: "#e67e22", 4: "#e74c3c" }; // Vert, Jaune, Orange, Rouge

window.pourcentageContactCourant = 100; 
window.coteContactCourant = 1; // 1 = Frappe par la gauche, -1 = Frappe par la droite


// Variable globale pour suivre l'outil sélectionné dans la palette
window.outilTraceActif = "select"; 

// Écouteur mis à jour pour piloter l'intégralité de la palette (P, T, Z, 0, 9)
const boutonsOutils = document.querySelectorAll('.tool-btn');

function gererLogiquePalette(btn, e) {
    if (e.cancelable) e.preventDefault();
    
    const toolSelected = btn.getAttribute('data-tool');
    
    const cyclerOption = (valeurActuelle, tableauOptions) => {
        const indexActuel = tableauOptions.indexOf(valeurActuelle);
        const indexSuivant = (indexActuel + 1) % tableauOptions.length;
        return tableauOptions[indexSuivant];
    };
    
    // --- CE BLOC S'EXÉCUTE UNIQUEMENT À PARTIR DU DEUXIÈME CLIC CONSÉCUTIF ---
    if (window.outilTraceActif === toolSelected) {
        if (toolSelected === 'pointContact') {
            window.pourcentageContactCourant -= 10;
            if (window.pourcentageContactCourant < 0) {
                window.coteContactCourant = window.coteContactCourant * -1;
                window.pourcentageContactCourant = 100; 
            }
        }
        else if (toolSelected === 'cible') {
            window.quadrantCibleCourant = cyclerOption(window.quadrantCibleCourant, [0, 1, 2, 3]);
        }
        else if (toolSelected === 'carre') {
            window.tailleCarreCourante = cyclerOption(window.tailleCarreCourante, [95, 135, 180]);
        }
        else if (toolSelected === 'effetBlanche') {
            window.niveauForceCourant = cyclerOption(window.niveauForceCourant, [0, 1, 2, 3, 4]);
            
            if (window.niveauForceCourant === 0) {
                const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
                if (btnSelect) {
                    window.outilTraceActif = "select";
                    boutonsOutils.forEach(b => b.classList.remove('active'));
                    btnSelect.classList.add('active');
                    const canvas = document.getElementById('drawing-canvas');
                    if (canvas) canvas.style.pointerEvents = 'none';
                }
                rafraichirTexteBoutonsPalette();
                if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
                return;
            }
        }
        else if (toolSelected === 'repereX') {
    // ÉTAPE 1 : Si on est à 4 branches, on passe à 6 branches
    if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 4 && window.repereXTexte === null) {
        window.nombreBranchesRepereX = 6;
    }
    // ÉTAPE 2 : Si on est à 6 branches, on bascule sur le Cercle
    else if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 6 && window.repereXTexte === null) {
        window.repereXEstUnCercle = true;
    }
    // ÉTAPE 3 : Si on est sur le Cercle, on commence le cycle des lettres avec "A"
    else if (window.repereXEstUnCercle && window.repereXTexte === null) {
        window.repereXEstUnCercle = false;
        window.repereXTexte = cycleCaracteres[0];
    }
    // ÉTAPE 4 : Si on a du texte, on avance dans le tableau ou on réinitialise à 4 branches
    else if (window.repereXTexte !== null) {
        const indexActuel = cycleCaracteres.indexOf(window.repereXTexte);
        if (indexActuel >= 0 && indexActuel < cycleCaracteres.length - 1) {
            window.repereXTexte = cycleCaracteres[indexActuel + 1];
        } else {
            // Retour au point de départ parfait (Étoile à 4 branches)
            window.repereXTexte = null;
            window.nombreBranchesRepereX = 4;
            window.repereXEstUnCercle = false;
        }
    }
}
rafraichirTexteBoutonsPalette();
if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
return;

    }

    // --- TOUT PREMIER CLIC : INITIALISATION DE L'OUTIL ---
    boutonsOutils.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.outilTraceActif = toolSelected;
    
    // Application stricte des configurations de base sans rotation
    if (toolSelected === 'pointContact') { window.pourcentageContactCourant = 100; window.coteContactCourant = 1; }
    if (toolSelected === 'repereX') { window.nombreBranchesRepereX = 4; window.repereXEstUnCercle = false; window.repereXTexte = null; }
    if (toolSelected === 'effetBlanche') { window.niveauForceCourant = 0; }

    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
        if (window.outilTraceActif !== "select") {
            canvas.style.pointerEvents = 'auto';
        } else {
            canvas.style.pointerEvents = 'none';
        }
    }
    
    rafraichirTexteBoutonsPalette(); 
    if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
}




// Double attachement : tactile (touchstart) ET souris (click)
boutonsOutils.forEach(btn => {
    // Pour l'iPad / iPhone
    btn.addEventListener('touchstart', (e) => {
        gererLogiquePalette(btn, e);
    }, { passive: false });

    // Pour l'ordinateur de bureau (PC/Mac)
    btn.addEventListener('click', (e) => {
        // Si l'événement vient d'un doigt, on ignore le clic fantôme généré par le navigateur
        if (e.pointerType === 'touch' || (e.clientX === 0 && e.clientY === 0)) return;
        gererLogiquePalette(btn, e);
    });
});


// Nouvelle fonction pour mettre à jour l'affichage dynamique avec libellé fixe
function rafraichirTexteBoutonsPalette() {
    // 1. Libellé pour le bouton "Repère X"
    const btnRepere = document.querySelector('.tool-btn[data-tool="repereX"]');
    if (btnRepere) {
        if (window.repereXTexte) {
            btnRepere.innerText = `❌ Repère : ${window.repereXTexte}`;
        } else if (window.repereXEstUnCercle) {
            btnRepere.innerText = "❌ Repère : Cercle";
        } else {
            btnRepere.innerText = `❌ Repère : ${window.nombreBranchesRepereX} Br.`;
        }
    }

    // Libellé pour le bouton "Cible" avec abréviations des quadrants (BD, BG, HG, HD)
    const btnCible = document.querySelector('.tool-btn[data-tool="cible"]');
    if (btnCible) {
        // Table de correspondance basée sur votre variable (0: Bas-Droite, 1: Bas-Gauche, 2: Haut-Gauche, 3: Haut-Droite)
        const correspondanceQuadrants = { 0: "BD", 1: "BG", 2: "HG", 3: "HD" };
        const labelQuadrant = correspondanceQuadrants[window.quadrantCibleCourant] || "BD";
        

        btnCible.innerText = `🎯 Cible : ${labelQuadrant}`;
    }

    // 3. Libellé pour le bouton "Carré" (Taille P, M, G + Orientation)
    const btnCarre = document.querySelector('.tool-btn[data-tool="carre"]');
    if (btnCarre) {
        let labelTaille = "P";
        if (window.tailleCarreCourante === 135) labelTaille = "M";
        if (window.tailleCarreCourante === 180) labelTaille = "G";

        const rotationCarreDegres = (window.quadrantCibleCourant || 0) * 90;
        btnCarre.innerText = `🔲 Carré : ${labelTaille}`;
    }

    // 4. Libellé pour le bouton "Contact"
    const btnContact = document.querySelector('.tool-btn[data-tool="pointContact"]');
    if (btnContact) {
        if (window.pourcentageContactCourant === 100) {
            btnContact.innerText = "🎯 Contact : Plein";
        } else {
            const coteStr = window.coteContactCourant === 1 ? "G" : "D";
            btnContact.innerText = `🎯 Contact : ${window.pourcentageContactCourant}% (${coteStr})`;
        }
    }

    // 5. Libellé pour le bouton "Effet"
    const btnEffet = document.querySelector('.tool-btn[data-tool="effetBlanche"]');
    if (btnEffet) {
        if (window.niveauForceCourant === 0) {
            btnEffet.innerText = "🔮 Effet : Aucun";
        } else {
            const pourcentageForce = window.niveauForceCourant * 25;
            btnEffet.innerText = `🔮 Effet : ${pourcentageForce}%`;
        }
    }
}





// Fonction universelle pour cycler dans un tableau d'options
function cyclerOption(valeurActuelle, tableauOptions) {
    const indexActuel = tableauOptions.indexOf(valeurActuelle);
    // Trouve l'index suivant, s'il dépasse la taille du tableau, il revient à 0
    const indexSuivant = (indexActuel + 1) % tableauOptions.length;
    return tableauOptions[indexSuivant];
}



// Extraction universelle des coordonnées qu'il s'agisse d'un clic (PC) ou d'un Touch (iPad)
function obtenirCoordonneesEvenement(e, tableElement) {
    const rect = tableElement.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: Math.round(clientX - rect.left),
        y: Math.round(clientY - rect.top)
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const table = document.getElementById('pool-table');
    
    const colorSelect = document.getElementById('marker-color');
    const clearBtn = document.getElementById('btn-clear-lines');
    const undoBtn = document.getElementById('btn-undo-lines'); 
    const dashedCheck = document.getElementById('chk-dashed-lines');
    const toggleDrawingsCheck = document.getElementById('chk-toggle-drawings');

    let isDrawing = false;
    let currentLine = null; 
    let startPoint = null; 
    let isCtrlPressed = false;
    let isShiftPressed = false;
	
    if (typeof chkMagnetism !== "undefined" && chkMagnetism) {
        chkMagnetism.addEventListener('change', () => {
            if (typeof rafraichirListeLateraleBilles === "function") {
                rafraichirListeLateraleBilles();
            }
        });
    }

    // === ADAPTATION APERÇU FANTÔME ===
    let outilActif = null; 
    let mouseX = 0;
    let mouseY = 0;
    let animationFrameId = null;

    table.addEventListener('mousemove', (e) => {
        const rect = table.getBoundingClientRect();
        mouseX = Math.round(e.clientX - rect.left);
        mouseY = Math.round(e.clientY - rect.top);

        // Modifié pour réagir si la palette OU le clavier est utilisé
        const aUnOutilActif = outilActif || ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'].includes(window.outilTraceActif);
        if (!aUnOutilActif) return;
        if (animationFrameId) return;

        animationFrameId = requestAnimationFrame(() => {
            window.redessinerToutesLesLignes();
            animationFrameId = null; 
        });
    });

	
function dessinerPointContact(x, y, couleur, pctFige, coteFige) {
    ctx.save();
    
    // === FORCE LES LIGNES PLEINES POUR LES BILLES D'IMPACT ===
    ctx.setLineDash([]); 

    const pct = (pctFige !== undefined) ? pctFige : window.pourcentageContactCourant;
    const cote = (coteFige !== undefined) ? coteFige : window.coteContactCourant;
    const couleurMarqueur = couleur || (colorSelect ? colorSelect.value : '#ffffff');

    // Dimensions du panneau de fond
    const largeurCadre = 180;
    const hauteurCadre = 140;
    const cadreX = x - (largeurCadre / 2);
    const cadreY = y - (hauteurCadre / 2); 
    const arrondiCoins = 12;

    // Dessin du fond opaque arrondi
    ctx.beginPath();
    ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arrondiCoins);
    ctx.fillStyle = "rgba(16, 20, 30, 0.88)";
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // La bille fantôme/cible est centrée exactement sur l'axe X et Y du curseur
    const centreCadreX = x;
    const centreCadreY = y - 8; 
    const rayonBilleAgrandie = 22; 
    const diametreAgrandie = rayonBilleAgrandie * 2;
    const decalageX = diametreAgrandie * (1 - (pct / 100));

    // 1. Tracé de la bille cible / visée (Moins transparente : Opacité augmentée à 0.80)
    ctx.beginPath();
    ctx.arc(centreCadreX, centreCadreY, rayonBilleAgrandie, 0, 2 * Math.PI);
    ctx.save();
    ctx.globalAlpha = 0.80; // <-- Changé de 0.35 à 0.80 pour moins de transparence
    ctx.fillStyle = couleurMarqueur;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = couleurMarqueur;
    ctx.lineWidth = 2.5; // Légèrement plus épais pour mieux la détacher
    ctx.stroke();

    // 2. Tracé de la bille blanche d'impact (Opacité renforcée à 0.90)
    const blancheX = centreCadreX - (decalageX * cote);
    ctx.beginPath();
    ctx.arc(blancheX, centreCadreY, rayonBilleAgrandie, 0, 2 * Math.PI);
    ctx.save();
    ctx.globalAlpha = 0.90; // <-- Changé à 0.90 pour que la blanche soit quasi-opaque
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Ligne d'axe horizontale en pointillés
    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.moveTo(centreCadreX - (rayonBilleAgrandie * 2) - 10, centreCadreY);
    ctx.lineTo(centreCadreX + (rayonBilleAgrandie * 2) + 10, centreCadreY);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); 

    // 4. Affichage des textes explicatifs
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 11px sans-serif";
    
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("QUANTITÉ D'IMPACT", centreCadreX, cadreY + 10);

    ctx.font = "bold 12px sans-serif";
    ctx.textBaseline = "bottom";
    if (pct === 100) {
        ctx.fillStyle = "#ffffff";
        ctx.fillText("IMPACT PLEIN", centreCadreX, cadreY + hauteurCadre - 10); 
    } else {
        ctx.fillStyle = "#ffffff";
        const coteTexte = cote === 1 ? "GAUCHE" : "DROITE";
        ctx.fillText(`${pct}% - ${coteTexte}`, centreCadreX, cadreY + hauteurCadre - 10);
    }
    ctx.restore();
}




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
            ctx.setLineDash([4, 8]); 
        } else {
            ctx.setLineDash([]);
        }
    }

    function dessinerEffetsBilleBlanche(x, y, couleur, forceFige) {
        ctx.save(); 
        const marge = 18;
        let zoneUtileX = marge;
        let zoneUtileY = marge;
        let zoneUtileLargeur = ctx.canvas.width - (marge * 2);
        let zoneUtileHauteur = ctx.canvas.height - (marge * 2);

        ctx.beginPath();
        ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);

        const forceActuelle = (forceFige !== undefined) ? forceFige : window.niveauForceCourant;
        const jaugeActive = forceActuelle > 0;
        
        const largeurCadre = jaugeActive ? 210 : 150; 
        const hauteurCadre = 175;
        const demiLargeur = largeurCadre / 2;
        const rayonBille = 60;
        
        const cadreX = x - demiLargeur;
        const cadreY = y - rayonBille - 32; 
        const arronsCoins = 12; 

        ctx.beginPath();
        ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arronsCoins);
        ctx.fillStyle = "rgba(16, 20, 30, 0.85)"; 
        ctx.fill();

        const shiftX = jaugeActive ? -20 : 0;
        const billeX = x + shiftX;

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
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("CONTACT", billeX, y - rayonBille - 12);

    // ====================================================================
    // JAUGE DE PUISSANCE MODERNISÉE (REPOSITIONNÉE ET CENTRÉE)
    // ====================================================================
    if (jaugeActive) {
        const jaugeWidth = 14;
        const jaugeHeight = rayonBille * 2; // 120px
        
        // Décalage vers la gauche de l'ensemble de la jauge pour l'intégrer harmonieusement
        const jaugeX = cadreX + largeurCadre - 48; 
        const jaugeY = y - rayonBille;

        // Label 2 : "FORCE" placé de façon parfaitement symétrique au-dessus de la jauge
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "bold 12px sans-serif";
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

        // Aiguille indicatrice (Triangle blanc repositionné par rapport à la nouvelle jauge)
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

        // Label numérique en pourcentage (ex: 25%, 50%, etc.) repositionné sous l'axe de la jauge
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

    // --- 2. CONFIGURATION DU STYLE ET SÉLECTION DU MODE ---
    const couleurTrace = couleur || (colorSelect ? colorSelect.value : '#ffffff');
    ctx.setLineDash([]);       

    // Extraction du texte à afficher (figé pour sauvegarde ou dynamique pour l'aperçu)
    const texteAAfficher = (texteFige !== undefined) ? texteFige : window.repereXTexte;
    const estUnCercle = (texteFige === undefined) ? window.repereXEstUnCercle : (texteFige === null && window.repereXEstUnCercle);

    // --- 3. AIGUILLAGE LOGIQUE NETTOYÉ ---
    if (texteAAfficher) {
        // CAS 1 : Affichage de texte (A-F, 1-6)
        rendreTexteRepere(x, y, texteAAfficher, couleurTrace);
    } 
    else if (estUnCercle) {
        // CAS 2 : Affichage du cercle pointillé (0 pointe)
        rendreCercleRepere(x, y, couleurTrace);
    }
    else {
        // CAS 3 : Affichage de l'étoile (4 ou 6 branches)
        const branches = (texteFige === undefined) ? window.nombreBranchesRepereX : (window.nombreBranchesRepereX || 4);
        rendreEtoileRepere(x, y, couleurTrace, branches);
    }
    
    ctx.restore(); 
}

// === SOUS-FONCTIONS DE RENDU SPÉCIALISÉES POUR LE REPÈRE X ===

function rendreTexteRepere(x, y, texte, couleur) {
    ctx.fillStyle = couleur;
    ctx.font = "bold 24px sans-serif"; 
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, x, y);
}

function rendreCercleRepere(x, y, couleur) {
    const rayon = 12; // Équivalent à 12px
    ctx.beginPath(); 
    ctx.arc(x, y, rayon, 0, 2 * Math.PI);
    ctx.closePath();
    
    // Remplissage du fond avec plus de transparence (Opacité baissée de 0.80 à 0.25)
    ctx.save();
    ctx.globalAlpha = 0.25; // <-- Ajustez cette valeur (ex: 0.10 pour encore plus transparent)
    ctx.fillStyle = couleur;
    ctx.fill();
    ctx.restore();

    // Tracé du contour en pointillés fins serrés (Reste bien visible et net)
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]); 
    ctx.stroke();
    
    ctx.setLineDash([]); // Réinitialisation du style de tracé
}


function rendreEtoileRepere(x, y, couleur, branches) {
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath(); 

    const rayonExterne = 12; // 12px
    const rayonInterne = 5.5; 

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
    ctx.fillStyle = couleur;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.stroke();
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

    // === FORCE LES LIGNES PLEINES POUR LA CIBLE ===
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

function dessinerZoneGrille(zoneIndex, couleur, mode) {
    ctx.save();
    ctx.setLineDash([]); // Réinitialisation par sécurité
    
    // Désactiver la bordure
    ctx.strokeStyle = "transparent";
    ctx.lineWidth = 0;

    // Configuration géométrique de la table
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
    const rayonCoins = 20; 

    // Crée le chemin de la zone avec coins arrondis
    ctx.beginPath();
    ctx.roundRect(x, y, pasX, pasY, rayonCoins);

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
    } else if (mode === 'sans-inscription') {
        // === CAS ZONE ANONYME (SANS CHIFFRE NI LETTRE) : REMPLISSAGE SOLIDE SEUL ===
        ctx.globalAlpha = 0.18; 
        ctx.fillStyle = couleurBlanche;
        ctx.fill();
    } else {
        // === CAS ZONE DÉPART (ZD) : REMPLISSAGE SOLIDE BLANC PÂLE ===
        ctx.globalAlpha = 0.18; 
        ctx.fillStyle = couleurBlanche;
        ctx.fill();
    }

    // --- LE BLOC CI-DESSOUS S'EXÉCUTE UNIQUEMENT SI LE MODE N'EST PAS 'sans-inscription' ---
    if (mode !== 'sans-inscription') {
        ctx.fillStyle = couleurBlanche;
        ctx.font = "bold 20px sans-serif"; 
        const marge = 18;                  
        const opaciteTexte = 0.2;          

        // 1. DESSIN DU TEXTE « ZD » OU « ZA » (PETIT, EN HAUT À DROITE)
        ctx.save();
        ctx.globalAlpha = opaciteTexte; 
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        
        const textPrefixe = (mode === 'alternatif') ? "ZA" : "ZD";
        ctx.fillText(textPrefixe, x + pasX - marge, y + marge);
        ctx.restore();

        // 2. DESSIN DU CHIFFRE UNIQUE IDENTIQUE (EN BAS À GAUCHE)
        ctx.save();
        ctx.globalAlpha = opaciteTexte; 
        ctx.textAlign = "left";        
        ctx.textBaseline = "bottom";    
        
        const positionChiffreX = x + marge;
        const positionChiffreY = y + pasY - marge;
        
        ctx.fillText(zoneIndex, positionChiffreX, positionChiffreY);
        ctx.restore();
    }

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

        if (dessin.estPointContact) {
            if (dessin.points && dessin.points.length > 0) {
                const centre = dessin.points[0]; // Extraction du premier point du tableau [{x, y}]
                dessinerPointContact(centre.x, centre.y, dessin.couleur, dessin.pourcentage, dessin.cote);
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
// CORRECTION : On détermine l'outil actif qu'il vienne de la palette OU du clavier
const formeActive = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];

if (listeFormesTactiques.includes(formeActive)) {
    ctx.save();
    ctx.globalAlpha = 0.40; // Translucide pour l'aperçu dynamique
    
    let couleurActive = colorSelect ? colorSelect.value : '#ffffff';
    if (window.billeSelectionneeCourante) {
        couleurActive = window.billeSelectionneeCourante.style.backgroundColor;
    }

    if (formeActive === 'cible') dessinerCible(mouseX, mouseY, couleurActive);
    if (formeActive === 'carre') dessinerCarre(mouseX, mouseY, couleurActive);
    if (formeActive === 'repereX') dessinerRepereXGras(mouseX, mouseY, couleurActive);
    if (formeActive === 'effetBlanche') dessinerEffetsBilleBlanche(mouseX, mouseY, couleurActive, window.niveauForceCourant);
    if (formeActive === 'pointContact') dessinerPointContact(mouseX, mouseY, couleurActive, window.pourcentageContactCourant, window.coteContactCourant);
    
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

// === GESTION AUTONOME DE LA CASE À COCHER "DESSINS/TRACÉS" ===
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
            window.quadrantCibleCourant = (window.quadrantCibleCourant + 1) % 4;
        } else {
            outilActif = 'cible';
        }
        if (outilActif) canvas.style.pointerEvents = 'auto';
        window.redessinerToutesLesLignes();
    }

    if (e.key.toLowerCase() === 'p') {
    e.preventDefault();
    if (outilActif !== 'pointContact') {
        outilActif = 'pointContact';
        window.pourcentageContactCourant = 100;
        window.coteContactCourant = 1; 
    } else {
        window.pourcentageContactCourant -= 10;
        // Si on descend en dessous de 0, on change de côté et on recommence à 90%
        if (window.pourcentageContactCourant < 0) {
            window.coteContactCourant = window.coteContactCourant * -1; // Inverse GAUCHE <-> DROITE
            window.pourcentageContactCourant = 100; 
        }
    }
    if (outilActif) canvas.style.pointerEvents = 'auto';
    window.redessinerToutesLesLignes();
}


    if (e.key === 'Shift' && outilActif === 'pointContact') {
        e.preventDefault();
        window.coteContactCourant = window.coteContactCourant * -1;
        window.redessinerToutesLesLignes();
    }

    // DÉPLACEMENT MICRO-MÉTRIQUE DES BILLES AUX FLÈCHES DU CLAVIER
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!window.billeSelectionneeCourante || window.billeSelectionneeCourante.style.display === 'none') {
            return;
        }
        e.preventDefault();

        let currentX = parseFloat(window.billeSelectionneeCourante.style.left) || 0;
        let currentY = parseFloat(window.billeSelectionneeCourante.style.top) || 0;

        const gridWidth = 754;
        const gridHeight = 364;
        const pasX = gridWidth / 16;  
        const pasY = gridHeight / 8;  

        const multiplicateur = e.shiftKey ? 1.0 : 0.1;
        const incrementX = pasX * multiplicateur;
        const incrementY = pasY * multiplicateur;

        switch (e.key) {
            case 'ArrowLeft':  currentX -= incrementX; break;
            case 'ArrowRight': currentX += incrementX; break;
            case 'ArrowUp':    currentY -= incrementY; break;
            case 'ArrowDown':  currentY += incrementY; break;
        }

        const positionClampee = clampPosition(currentX, currentY);
        window.billeSelectionneeCourante.style.left = `${positionClampee.x}px`;
        window.billeSelectionneeCourante.style.top = `${positionClampee.y}px`;

        if (typeof resolveCollisions === "function") {
            resolveCollisions(window.billeSelectionneeCourante);
        }
        if (typeof rafraichirListeLateraleBilles === "function") {
            rafraichirListeLateraleBilles();
        }
    }

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
            if (window.tailleCarreCourante === 95) window.tailleCarreCourante = 135;
            else if (window.tailleCarreCourante === 135) window.tailleCarreCourante = 180;
            else window.tailleCarreCourante = 95; 
        } else {
            outilActif = 'carre';
        }
        if (outilActif) canvas.style.pointerEvents = 'auto';
        window.redessinerToutesLesLignes();
    }
    
    if (e.key === '9') {
        e.preventDefault();
        if (outilActif === 'repereX') {
            if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 4 && window.repereXTexte === null) {
                window.nombreBranchesRepereX = 6;
            } 
            else if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 6 && window.repereXTexte === null) {
                window.repereXEstUnCercle = true;
            } 
            else if (window.repereXEstUnCercle && window.repereXTexte === null) {
                window.repereXEstUnCercle = false;
                window.repereXTexte = cycleCaracteres[0]; 
            } 
            else if (window.repereXTexte !== null) {
                const indexActuel = cycleCaracteres.indexOf(window.repereXTexte);
                if (indexActuel >= 0 && indexActuel < cycleCaracteres.length - 1) {
                    window.repereXTexte = cycleCaracteres[indexActuel + 1];
                } else {
                    window.repereXTexte = null;
                    window.nombreBranchesRepereX = 4;
                    window.repereXEstUnCercle = false;
                }
            }
        } else {
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
            outilActif = 'effetBlanche';
            window.niveauForceCourant = 0;
        } else {
            window.niveauForceCourant++;
            if (window.niveauForceCourant > 4) {
                outilActif = null;
                window.niveauForceCourant = 0;
            }
        }
        if (outilActif) canvas.style.pointerEvents = 'auto';
        window.redessinerToutesLesLignes();
    }

    if (e.key === 'Escape') {
        outilActif = null;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        window.redessinerToutesLesLignes();
    }

    if (e.key.toLowerCase() === 'e' || e.key === 'Delete') {
        e.preventDefault();
        canvas.style.pointerEvents = 'auto';
        const aEteEfface = window.detecterEtEffacerDessin(mouseX, mouseY);
        if (!aEteEfface) {
            canvas.style.pointerEvents = 'none';
        }
    }

        // Gestion des zones de grille (1 à 8) avec cycle à 4 états
    if (e.key >= '1' && e.key <= '8') {
        const zoneId = parseInt(e.key, 10);
        const indexZoneExistante = window.dessinsSauvegardes.findIndex(dessin => dessin.estZoneGrille && dessin.zoneId === zoneId);

        if (indexZoneExistante !== -1) {
            const zoneActive = window.dessinsSauvegardes[indexZoneExistante];
            if (!zoneActive.mode || zoneActive.mode === 'standard') {
                // État 2 : Bascule vers Zone d'Arrivée (ZA) hachurée
                zoneActive.mode = 'alternatif';
            } else if (zoneActive.mode === 'alternatif') {
                // État 3 (Nouveau) : Bascule vers la zone colorée pure sans texte ni chiffre
                zoneActive.mode = 'sans-inscription';
            } else {
                // État 4 : Suppression définitive au clic suivant
                window.dessinsSauvegardes.splice(indexZoneExistante, 1);
            }
        } else {
            // État 1 : Premier clic, création de la Zone de Départ (ZD)
            const couleurActive = colorSelect ? colorSelect.value : '#ffffff';
            window.dessinsSauvegardes.push({
                couleur: couleurActive,
                estZoneGrille: true,
                zoneId: zoneId,
                mode: 'standard',
                points: [] 
            });
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

window.addEventListener('blur', () => {
    isShiftPressed = false;
    isCtrlPressed = false;
    if (canvas) canvas.style.pointerEvents = 'none';
    if (isDrawing) finTrace();
});

// === GESTION INTERACTION DESSIN IPAD ET PC ===
function declencherDebutTrace(e) {
    if (window.outilTraceActif !== "select") {
        if (e.cancelable) e.preventDefault();
    }

    const coords = obtenirCoordonneesEvenement(e, table);
    const localX = coords.x;
    const localY = coords.y;

    // Mode Gomme
    if (window.outilTraceActif === "erase") {
        const elementSupprime = window.detecterEtEffacerDessin(localX, localY);
        if (elementSupprime) {
            const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
            if (btnSelect) btnSelect.click();
        }
        return; 
    }

    // Armement de la position de départ pour les formes tactiques (Palette ou Clavier)
    const outilTactiqueActif = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
    if (['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'].includes(outilTactiqueActif)) {
        isDrawing = true; 
        
        // CORRECTION CRITIQUE : Armement immédiat des coordonnées globales pour l'iPad
        mouseX = localX;
        mouseY = localY;

        // CORRECTION CONFORT : Force le premier rendu instantané sous le doigt
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(() => {
                window.redessinerToutesLesLignes();
                animationFrameId = null;
            });
        }
        return;
    }

    // Dessin Libre
    if (window.outilTraceActif !== "select") {
        commencerDessin(e);
    }
}

function declencherMouvementTrace(e) {
    // Extrait les coordonnées exactes sous le doigt ou le stylet de l'iPad
    const coords = obtenirCoordonneesEvenement(e, table);
    const x = coords.x;
    const y = coords.y;

    // === EN DIRECT SUR IPAD - RAFRAÎCHIT L'APERÇU FANTÔME AU GLISSEMENT ===
    const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];
    if (listeFormesTactiques.includes(window.outilTraceActif) || outilActif) {
        if (e.cancelable) e.preventDefault(); // Empêche la page iPad de trembler ou défiler
        
        // Met à jour les positions globales lues par window.redessinerToutesLesLignes()
        mouseX = x;
        mouseY = y;

        // Planifie un rendu synchronisé avec le taux de rafraîchissement de l'écran de l'iPad
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(() => {
                window.redessinerToutesLesLignes();
                animationFrameId = null;
            });
        }
        return; // Évite de tracer une ligne au crayon en même temps
    }

    // === LOGIQUE DE TRACÉ DE LIGNES CLASSIQUE EXISTANTE ===
    if (!isDrawing || !currentLine) return;
    if (e.cancelable) e.preventDefault();

    if (currentLine.estDroite) {
        window.redessinerToutesLesLignes();
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
}

function declencherFinTrace(e) {
    // === VALIDATION DU DÉPÔT AU RELÂCHEMENT DU DOIGT SUR IPAD ===
    const outilTactiqueActif = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
    const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];

    if (listeFormesTactiques.includes(outilTactiqueActif)) {
        if (isDrawing) {
            const couleurActive = window.billeSelectionneeCourante ? 
                window.billeSelectionneeCourante.style.backgroundColor : 
                (colorSelect ? colorSelect.value : '#ffffff');

            let nouvelElement = {
                couleur: couleurActive,
                points: [{ x: mouseX, y: mouseY }]
            };

            if (outilTactiqueActif === 'cible') { nouvelElement.estCible = true; nouvelElement.quadrant = window.quadrantCibleCourant || 0; }
            if (outilTactiqueActif === 'carre') { nouvelElement.estCarre = true; nouvelElement.taille = window.tailleCarreCourante || 95; }
            if (outilTactiqueActif === 'repereX') { nouvelElement.estRepereX = true; nouvelElement.estUnCercle = window.repereXEstUnCercle; nouvelElement.branches = window.nombreBranchesRepereX; nouvelElement.texte = window.repereXTexte; }
            if (outilTactiqueActif === 'effetBlanche') { nouvelElement.estEffetBlanche = true; nouvelElement.force = window.niveauForceCourant; }
            if (outilTactiqueActif === 'pointContact') { nouvelElement.estPointContact = true; nouvelElement.pourcentage = window.pourcentageContactCourant; nouvelElement.cote = window.coteContactCourant; }

            window.dessinsSauvegardes.push(nouvelElement);
        }
        
        // Nettoyage des états
        isDrawing = false;
        outilActif = null;
        
        // Auto-retour au mode sélection
        const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
        if (btnSelect) btnSelect.click();
        
        if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
        return;
    }

    // Fin de tracé standard (Crayon, Ligne, Flèche) pour PC/iPad
    finTrace();
    if (window.outilTraceActif === "select") {
        canvas.style.pointerEvents = 'none';
    } else {
        canvas.style.pointerEvents = 'auto'; 
    }
}

function commencerDessin(e) {
    // CORRECTION ESSENTIELLE : Nettoie l'aperçu clavier pour éviter la superposition parasite de formes
    outilActif = null; 
    isDrawing = true;
    
    const coords = obtenirCoordonneesEvenement(e, table);
    const x = coords.x;
    const y = coords.y;
    
    canvas.style.pointerEvents = 'none';
    const elementSousCurseur = document.elementFromPoint(e.touches ? e.touches[0].clientX : e.clientX, e.touches ? e.touches[0].clientY : e.clientY);
    canvas.style.pointerEvents = 'auto';

    let billeSousCurseur = elementSousCurseur ? elementSousCurseur.closest('.ball') : null;
    let couleurActive = colorSelect ? colorSelect.value : '#ffffff';

    if (billeSousCurseur) {
        if (window.billeSelectionneeCourante && window.billeSelectionneeCourante !== billeSousCurseur) {
            window.billeSelectionneeCourante.style.outline = 'none';
        }
        window.billeSelectionneeCourante = billeSousCurseur;
        billeSousCurseur.style.outline = '2px solid #ffffff';
        billeSousCurseur.style.outlineOffset = '2px';
        couleurActive = billeSousCurseur.style.backgroundColor;
    } else {
        if (window.billeSelectionneeCourante) {
            couleurActive = window.billeSelectionneeCourante.style.backgroundColor;
        }
    }
    
    const modeDashed = dashedCheck ? dashedCheck.checked : false;
    configurerStyleDessin(couleurActive, modeDashed);
    ctx.beginPath();
    ctx.moveTo(x, y);
    startPoint = { x, y }; 

    let forceLigneDroite = false;
    let forceFleche = false;

    if (window.outilTraceActif !== "select") {
        forceLigneDroite = (window.outilTraceActif === "line" || window.outilTraceActif === "arrow");
        forceFleche = (window.outilTraceActif === "arrow");
    } else {
        forceLigneDroite = e.ctrlKey || e.metaKey || isCtrlPressed;
        forceFleche = forceLigneDroite && (e.shiftKey || isShiftPressed);
    }

    currentLine = {
        couleur: couleurActive,
        estDroite: forceLigneDroite, 
        avecFleche: forceFleche,
        estPointille: modeDashed, 
        points: [{ x, y }]
    };
}

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

// === ATTACHEMENT DES ÉCOUTEURS DYNAMIQUES HYBRIDES ===
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 || e.button === 2) declencherDebutTrace(e);
});
canvas.addEventListener('touchstart', declencherDebutTrace, { passive: false });

table.addEventListener('mousedown', (e) => {
    if (window.outilTraceActif === "select" && e.button === 2) {
        canvas.style.pointerEvents = 'auto';
        commencerDessin(e);
    }
    if (e.target === table && e.button === 0) {
        if (window.billeSelectionneeCourante) {
            window.billeSelectionneeCourante.style.outline = 'none';
            window.billeSelectionneeCourante = null;
            
            if (typeof rafraichirListeLateraleBilles === "function") {
                rafraichirListeLateraleBilles();
            }
            
            const displayEl = document.getElementById('ball-position-display');
            if (displayEl) {
                displayEl.innerText = "Position de la bille : Aucune sélectionnée";
            }
        }
    }
});

document.addEventListener('mousemove', declencherMouvementTrace);
document.addEventListener('touchmove', declencherMouvementTrace, { passive: false });
document.addEventListener('mouseup', declencherFinTrace);
document.addEventListener('touchend', declencherFinTrace);

table.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('contextmenu', e => e.preventDefault());

setTimeout(resizeCanvas, 100);
});
