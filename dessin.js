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

window.pourcentageContactCourant = 100; 
window.coteContactCourant = 1; // 1 = Frappe par la gauche, -1 = Frappe par la droite

// Variable globale pour suivre l'outil sélectionné dans la palette
window.outilTraceActif = "select"; // 'select', 'pencil', 'line', 'arrow', 'erase', etc.

// Écouteur mis à jour pour piloter l'intégralité de la palette, du cycle et des inversions de côté
const boutonsOutils = document.querySelectorAll('.tool-btn');
const btnConfigAction = document.getElementById('btn-rotate-tool-options');
const btnInvertSideAction = document.getElementById('btn-invert-contact-side');

// Fonction partagée pour appliquer la rotation/le cycle des options de l'outil
function cyclerOptionsOutilActif(outil) {
    if (outil === 'pointContact') {
        window.pourcentageContactCourant -= 10;
        if (window.pourcentageContactCourant < 0) {
            window.pourcentageContactCourant = 100;
        }
    }
    else if (outil === 'cible') {
        window.quadrantCibleCourant = (window.quadrantCibleCourant + 1) % 4;
    }
    else if (outil === 'carre') {
        if (window.tailleCarreCourante === 95) window.tailleCarreCourante = 135;
        else if (window.tailleCarreCourante === 135) window.tailleCarreCourante = 180;
        else window.tailleCarreCourante = 95;
    }
    else if (outil === 'effetBlanche') {
        window.niveauForceCourant++;
        if (window.niveauForceCourant > 4) {
            window.niveauForceCourant = 0;
        }
    }
    else if (outil === 'repereX') {
        if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 6 && window.repereXTexte === null) window.repereXEstUnCercle = true;
        else if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 4 && window.repereXTexte === null) window.nombreBranchesRepereX = 6;
        else if (window.repereXEstUnCercle && window.repereXTexte === null) { window.repereXEstUnCercle = false; window.repereXTexte = cycleCaracteres; }
        else if (window.repereXTexte !== null) {
            const indexActuel = cycleCaracteres.indexOf(window.repereXTexte);
            if (indexActuel >= 0 && indexActuel < cycleCaracteres.length - 1) window.repereXTexte = cycleCaracteres[indexActuel + 1];
            else { window.repereXTexte = null; window.nombreBranchesRepereX = 4; window.repereXEstUnCercle = false; }
        }
    }
    if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
}

// 1. Écouteur sur les boutons de sélection de la palette
boutonsOutils.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const toolSelected = btn.getAttribute('data-tool');
        
        if (window.outilTraceActif === toolSelected) {
            cyclerOptionsOutilActif(toolSelected);
            return;
        }

        boutonsOutils.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.outilTraceActif = toolSelected;
        
        if (toolSelected === 'pointContact') { window.pourcentageContactCourant = 100; window.coteContactCourant = 1; }
        if (toolSelected === 'repereX') { window.nombreBranchesRepereX = 4; window.repereXEstUnCercle = false; window.repereXTexte = null; }
        if (toolSelected === 'effetBlanche') { window.niveauForceCourant = 0; }

        // Affichage dynamique du bouton vert de configuration générale
        const outilsConfigurables = ['pointContact', 'cible', 'carre', 'effetBlanche', 'repereX'];
        if (btnConfigAction) {
            if (outilsConfigurables.includes(toolSelected)) {
                btnConfigAction.style.display = "block";
                btnConfigAction.innerText = `⚙️ Configurer : ${btn.innerText.trim()}`;
            } else {
                btnConfigAction.style.display = "none";
            }
        }

        // Affichage dynamique du bouton orange d'inversion de côté exclusif au point de contact
        if (btnInvertSideAction) {
            if (toolSelected === 'pointContact') {
                btnInvertSideAction.style.display = "block";
            } else {
                btnInvertSideAction.style.display = "none";
            }
        }

        const canvas = document.getElementById('drawing-canvas');
        if (canvas) {
            if (window.outilTraceActif !== "select") {
                canvas.style.pointerEvents = 'auto';
            } else {
                canvas.style.pointerEvents = 'none';
            }
        }
        if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
    });
});

// 2. Écouteur sur le bouton de configuration vert
if (btnConfigAction) {
    btnConfigAction.addEventListener('click', () => {
        cyclerOptionsOutilActif(window.outilTraceActif);
    });
}

// 3. Écouteur sur le bouton d'inversion orange (Alternative à Shift pour iPad)
if (btnInvertSideAction) {
    btnInvertSideAction.addEventListener('click', () => {
        if (window.outilTraceActif === 'pointContact') {
            window.coteContactCourant *= -1;
            if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
        }
    });
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
        const pct = (pctFige !== undefined) ? pctFige : window.pourcentageContactCourant;
        const cote = (coteFige !== undefined) ? coteFige : window.coteContactCourant;
        const couleurMarqueur = couleur || (colorSelect ? colorSelect.value : '#ffffff');

        const largeurCadre = 180;
        const hauteurCadre = 110;
        const cadreX = x - (largeurCadre / 2);
        const cadreY = y - hauteurCadre - 25; 
        const arrondiCoins = 12;

        ctx.beginPath();
        ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arrondiCoins);
        ctx.fillStyle = "rgba(16, 20, 30, 0.88)";
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const centreCadreX = cadreX + (largeurCadre / 2);
        const centreCadreY = cadreY + (hauteurCadre / 2) + 8; 
        const rayonBilleAgrandie = 22; 
        const diametreAgrandie = rayonBilleAgrandie * 2;
        const decalageX = diametreAgrandie * (1 - (pct / 100));

        ctx.beginPath();
        ctx.arc(centreCadreX, centreCadreY, rayonBilleAgrandie, 0, 2 * Math.PI);
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = couleurMarqueur;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = couleurMarqueur;
        ctx.lineWidth = 2;
        ctx.stroke();

        const blancheX = centreCadreX - (decalageX * cote);
        ctx.beginPath();
        ctx.arc(blancheX, centreCadreY, rayonBilleAgrandie, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(centreCadreX - (rayonBilleAgrandie * 2) - 10, centreCadreY);
        ctx.lineTo(centreCadreX + (rayonBilleAgrandie * 2) + 10, centreCadreY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]); 

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "bold 12px sans-serif";
        ctx.textBaseline = "top";

        if (pct === 100) {
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText("IMPACT PLEIN", cadreX + (largeurCadre / 2), cadreY + 10); 
        } else {
            ctx.textAlign = "left";
            ctx.fillText(cote === 1 ? "IMPACT GAUCHE" : "IMPACT DROITE", cadreX + 12, cadreY + 12);
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "right";
            ctx.fillText(`${pct}%`, cadreX + largeurCadre - 12, cadreY + 10);
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

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("CONTACT", billeX, y - rayonBille - 12);

        if (jaugeActive) {
            const jaugeWidth = 14;
            const jaugeHeight = rayonBille * 2; 
            const jaugeX = cadreX + largeurCadre - 48; 
            const jaugeY = y - rayonBille;

            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText("FORCE", jaugeX + (jaugeWidth / 2), jaugeY - 12);

            const grad = ctx.createLinearGradient(jaugeX, jaugeY + jaugeHeight, jaugeX, jaugeY);
            grad.addColorStop(0, "#2ecc71");   
            grad.addColorStop(0.4, "#f1c40f"); 
            grad.addColorStop(0.7, "#e67e22"); 
            grad.addColorStop(1, "#e74c3c");   

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(jaugeX, jaugeY, jaugeWidth, jaugeHeight, 6);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.beginPath();
            ctx.roundRect(jaugeX, jaugeY, jaugeWidth / 2, jaugeHeight, { topLeft: 6, bottomLeft: 6 });
            ctx.fill();

            const hauteurCibleY = jaugeY + jaugeHeight - ((forceActuelle / 4) * jaugeHeight);

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

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(jaugeX, hauteurCibleY);
            ctx.lineTo(jaugeX + jaugeWidth, hauteurCibleY);
            ctx.stroke();

            ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(jaugeX, jaugeY, jaugeWidth, jaugeHeight, 6);
            ctx.stroke();

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

        const couleurTrace = couleur || (colorSelect ? colorSelect.value : '#ffffff');
        ctx.setLineDash([]);       

        const texteAAfficher = (texteFige !== undefined) ? texteFige : window.repereXTexte;
        const estUnCercle = (texteFige === undefined) ? window.repereXEstUnCercle : (texteFige === null && window.repereXEstUnCercle);

        if (texteAAfficher) {
            rendreTexteRepere(x, y, texteAAfficher, couleurTrace);
        } 
        else if (estUnCercle) {
            rendreCercleRepere(x, y, couleurTrace);
        }
        else {
            const branches = (texteFige === undefined) ? window.nombreBranchesRepereX : (window.nombreBranchesRepereX || 4);
            rendreEtoileRepere(x, y, couleurTrace, branches);
        }
        ctx.restore(); 
    }

    function rendreTexteRepere(x, y, texte, couleur) {
        ctx.fillStyle = couleur;
        ctx.font = "bold 18px sans-serif"; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(texte, x, y);
    }

    function rendreCercleRepere(x, y, couleur) {
        const rayon = 12; 
        ctx.beginPath(); 
        ctx.arc(x, y, rayon, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.globalAlpha = 0.80;
        ctx.fillStyle = couleur;
        ctx.fill();
        ctx.strokeStyle = couleur;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]); 
        ctx.globalAlpha = 1.0;
        ctx.stroke();
    }

    function rendreEtoileRepere(x, y, couleur, branches) {
        ctx.strokeStyle = couleur;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath(); 

        const rayonExterne = 12; 
        const rayonInterne = 5.5; 

        for (let i = 0; i < 2 * branches; i++) {
            const rayon = (i % 2 === 0) ? rayonExterne : rayonInterne;
            const angle = (i * Math.PI) / branches - (Math.PI / 2);
            const coordX = x + Math.cos(angle) * rayon;
            const coordY = y + Math.sin(angle) * rayon;

            if (i === 0) ctx.moveTo(coordX, coordY);
            else ctx.lineTo(coordX, coordY);
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
        const offset = 4; 
        const tipX = toX + offset * Math.cos(angle);
        const tipY = toY + offset * Math.sin(angle);

        ctx.save(); 
        ctx.setLineDash([]); 
        ctx.fillStyle = couleur || (colorSelect ? colorSelect.value : '#ffffff');
        
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - arrowLength * Math.cos(angle - arrowAngle), tipY - arrowLength * Math.sin(angle - arrowAngle));
        ctx.lineTo(tipX - arrowLength * Math.cos(angle + arrowAngle), tipY - arrowLength * Math.sin(angle + arrowAngle));
        ctx.closePath();
        ctx.fill(); 
        ctx.restore();
    }

    function dessinerCible(x, y, couleur) {
        ctx.save(); 
        ctx.setLineDash([]); 

        let bandeGauche = 18;
        let bandeDroite = 18;
        let bandeHaut = 18;
        let bandeBas = 18;

        const dpr = window.devicePixelRatio || 1;
        const canvasLogicalWidth = ctx.canvas.width / dpr;
        const canvasLogicalHeight = ctx.canvas.height / dpr;

        let zoneUtileX = bandeGauche;
        let zoneUtileY = bandeHaut;
        let zoneUtileLargeur = canvasLogicalWidth - bandeGauche - bandeDroite;
        let zoneUtileHauteur = canvasLogicalHeight - bandeHaut - bandeBas;

        ctx.beginPath();
        ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
        ctx.clip(); 
        
        ctx.save(); 
        ctx.fillStyle = couleur;
        ctx.globalAlpha = 0.30; 
        ctx.beginPath();
        ctx.roundRect(x - 92.5, y - 92.5, 185, 185, 8);
        ctx.fill();
        ctx.restore(); 

        ctx.strokeStyle = couleur;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 92.5, y - 92.5, 185, 185, 8);
        ctx.stroke();

        let r1 = 92.5;         
        let r2 = 92.5 * (2/3); 
        let r3 = 92.5 * (1/3); 

        ctx.beginPath(); ctx.arc(x, y, r1, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r2, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r3, 0, 2 * Math.PI); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - r1, y); ctx.lineTo(x + r1, y);
        ctx.moveTo(x, y - r1); ctx.lineTo(x, y + r1);
        ctx.stroke();

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

        ctx.fillText("1", x + dist1 * Math.cos(angleRotation), y + dist1 * Math.sin(angleRotation));
        ctx.fillText("2", x + dist2 * Math.cos(angleRotation), y + dist2 * Math.sin(angleRotation));
        ctx.fillText("3", x + dist3 * Math.cos(angleRotation), y + dist3 * Math.sin(angleRotation));
        ctx.fillText("5", x + dist5 * Math.cos(angleRotation), y + dist5 * Math.sin(angleRotation));
        ctx.restore(); 
    }

    function dessinerCarre(x, y, couleur) {
        ctx.save(); 
        const marge = 18;
        const dpr = window.devicePixelRatio || 1;
        const canvasLogicalWidth = ctx.canvas.width / dpr;
        const canvasLogicalHeight = ctx.canvas.height / dpr;

        ctx.beginPath();
        ctx.rect(marge, marge, canvasLogicalWidth - (marge * 2), canvasLogicalHeight - (marge * 2));
        ctx.clip(); 

        ctx.setLineDash([]); 
        ctx.strokeStyle = couleur;
        ctx.lineWidth = 2;

        const taille = window.tailleCarreCourante || 95;
        ctx.beginPath();
        ctx.roundRect(x - taille / 2, y - taille / 2, taille, taille, 15);
        ctx.globalAlpha = 0.20; 
        ctx.fillStyle = couleur;
        ctx.fill();
        ctx.restore(); 
    }

    function dessinerZoneGrille(zoneIndex, couleur, mode) {
        ctx.save();
        ctx.setLineDash([]); 
        ctx.strokeStyle = "transparent";
        ctx.lineWidth = 0;

        const gridLeft = 19;
        const gridTop = 18;
        const gridWidth = 754;
        const gridHeight = 364;
        const cols = 4;
        const pasX = gridWidth / cols;  
        const pasY = gridHeight / 2; 

        const idx = zoneIndex - 1;
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const x = gridLeft + (c * pasX);
        const y = gridTop + (r * pasY);
        
        ctx.beginPath();
        ctx.roundRect(x, y, pasX, pasY, 20);
        const couleurBlanche = "#ffffff";

        if (mode === 'alternatif') {
            ctx.save();
            const patternCanvas = document.createElement('canvas');
            const pCtx = patternCanvas.getContext('2d');
            patternCanvas.width = 16; patternCanvas.height = 16;
            pCtx.strokeStyle = couleurBlanche; pCtx.lineWidth = 4; 
            pCtx.beginPath(); pCtx.moveTo(0, 16); pCtx.lineTo(16, 0); pCtx.stroke();
            ctx.fillStyle = ctx.createPattern(patternCanvas, 'repeat');
            ctx.globalAlpha = 0.18; ctx.fill(); ctx.restore();
        } else {
            ctx.globalAlpha = 0.18; ctx.fillStyle = couleurBlanche; ctx.fill();
        }

        ctx.fillStyle = couleurBlanche;
        ctx.font = "bold 20px sans-serif"; 
        const marge = 18;                  

        ctx.save();
        ctx.globalAlpha = 0.2; ctx.textAlign = "right"; ctx.textBaseline = "top";
        ctx.fillText((mode === 'alternatif') ? "ZA" : "ZD", x + pasX - marge, y + marge);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.2; ctx.textAlign = "left"; ctx.textBaseline = "bottom";    
        ctx.fillText(zoneIndex, x + marge, y + pasY - marge);
        ctx.restore();
        ctx.restore();
    }

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = table.clientWidth + 'px';
        canvas.style.height = table.clientHeight + 'px';
        canvas.width = table.clientWidth * dpr;
        canvas.height = table.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        configurerStyleDessin(null, dashedCheck ? dashedCheck.checked : false);
        window.redessinerToutesLesLignes(); 
    }

    window.addEventListener('resize', resizeCanvas);
    matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => resizeCanvas(), { once: true });

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
                    const centre = dessin.points[0];
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
            if (dessin.estEffetBlanche) {
                if (dessin.points && dessin.points.length > 0) {
                    const centre = dessin.points[0];
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

            if (dessin.points.length < 2) return;
            configurerStyleDessin(dessin.couleur, dessin.estPointille);
            ctx.beginPath();
            ctx.moveTo(dessin.points[0].x, dessin.points[0].y);
            
            if (dessin.estDroite) {
                const d_point = dessin.points[dessin.points.length - 1];
                ctx.lineTo(d_point.x, d_point.y);
                ctx.stroke();
                if (dessin.avecFleche) dessinerPointeFleche(dessin.points[0].x, dessin.points[0].y, d_point.x, d_point.y, dessin.couleur);
            } else {
                for (let i = 1; i < dessin.points.length; i++) ctx.lineTo(dessin.points[i].x, dessin.points[i].y);
                ctx.stroke();
            }
        });

        // === RENDU EN DIRECT DE L'APERÇU FANTÔME (SUIT LA PALETTE) ===
        const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];
        if (listeFormesTactiques.includes(window.outilTraceActif) || outilActif) {
            ctx.save(); ctx.globalAlpha = 0.40; 
            let couleurActive = colorSelect ? colorSelect.value : '#ffffff';
            if (window.billeSelectionneeCourante) couleurActive = window.billeSelectionneeCourante.style.backgroundColor;

            const outilCourant = window.outilTraceActif !== "select" ? window.outilTraceActif : outilActif;

            if (outilCourant === 'cible') dessinerCible(mouseX, mouseY, couleurActive);
            if (outilCourant === 'carre') dessinerCarre(mouseX, mouseY, couleurActive);
            if (outilCourant === 'repereX') dessinerRepereXGras(mouseX, mouseY, couleurActive);
            if (outilCourant === 'effetBlanche') dessinerEffetsBilleBlanche(mouseX, mouseY, couleurActive, window.niveauForceCourant);
            if (outilCourant === 'pointContact') dessinerPointContact(mouseX, mouseY, couleurActive, window.pourcentageContactCourant, window.coteContactCourant);
            ctx.restore();
        }
        configurerStyleDessin(null, dashedCheck ? dashedCheck.checked : false); 
    };

    function annulerDernierTrace() {
        if (window.dessinsSauvegardes.length > 0) {
            window.dessinsSauvegardes.pop(); 
            window.redessinerToutesLesLignes(); 
        }
    }

    if (colorSelect) colorSelect.addEventListener('change', () => { ctx.strokeStyle = colorSelect.value; });
    if (clearBtn) clearBtn.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); window.dessinsSauvegardes = []; });
    if (undoBtn) undoBtn.addEventListener('click', annulerDernierTrace);

    if (toggleDrawingsCheck) {
        toggleDrawingsCheck.addEventListener('change', () => {
            canvas.style.visibility = toggleDrawingsCheck.checked ? 'visible' : 'hidden';
        });
    }

    // --- CLAVIER & RACCOURCIS ---
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return; 

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); annulerDernierTrace(); return; }
        if (e.key === 'Shift') { isShiftPressed = true; canvas.style.pointerEvents = 'auto'; }
        if (e.key === 'Control') isCtrlPressed = true;

        if (e.key.toLowerCase() === 't') {
            e.preventDefault();
            if (outilActif === 'cible') window.quadrantCibleCourant = (window.quadrantCibleCourant + 1) % 4;
            else outilActif = 'cible';
            if (outilActif) canvas.style.pointerEvents = 'auto';
            window.redessinerToutesLesLignes();
        }
        if (e.key.toLowerCase() === 'p') {
            e.preventDefault();
            if (outilActif !== 'pointContact') { outilActif = 'pointContact'; window.pourcentageContactCourant = 100; window.coteContactCourant = 1; }
            else { window.pourcentageContactCourant -= 10; if (window.pourcentageContactCourant < 0) window.pourcentageContactCourant = 100; }
            if (outilActif) canvas.style.pointerEvents = 'auto';
            window.redessinerToutesLesLignes();
        }
        if (e.key === 'Shift' && outilActif === 'pointContact') {
            e.preventDefault(); window.coteContactCourant *= -1; window.redessinerToutesLesLignes();
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (!window.billeSelectionneeCourante || window.billeSelectionneeCourante.style.display === 'none') return;
            e.preventDefault();

            let currentX = parseFloat(window.billeSelectionneeCourante.style.left) || 0;
            let currentY = parseFloat(window.billeSelectionneeCourante.style.top) || 0;
            const multiplicateur = e.shiftKey ? 1.0 : 0.1;
            const incrementX = (754 / 16) * multiplicateur;
            const incrementY = (364 / 8) * multiplicateur;

            if (e.key === 'ArrowLeft') currentX -= incrementX;
            if (e.key === 'ArrowRight') currentX += incrementX;
            if (e.key === 'ArrowUp') currentY -= incrementY;
            if (e.key === 'ArrowDown') currentY += incrementY;

            const positionClampee = clampPosition(currentX, currentY);
            window.billeSelectionneeCourante.style.left = `${positionClampee.x}px`;
            window.billeSelectionneeCourante.style.top = `${positionClampee.y}px`;

            if (typeof resolveCollisions === "function") resolveCollisions(window.billeSelectionneeCourante);
            if (typeof rafraichirListeLateraleBilles === "function") rafraichirListeLateraleBilles();
        }

        if (e.key.toLowerCase() === 'h') {
            e.preventDefault();
            if (canvas.style.visibility === 'hidden') { canvas.style.visibility = 'visible'; if (toggleDrawingsCheck) toggleDrawingsCheck.checked = true; }
            else { canvas.style.visibility = 'hidden'; if (toggleDrawingsCheck) toggleDrawingsCheck.checked = false; }
        }
        if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (outilActif === 'carre') {
                if (window.tailleCarreCourante === 95) window.tailleCarreCourante = 135;
                else if (window.tailleCarreCourante === 135) window.tailleCarreCourante = 180;
                else window.tailleCarreCourante = 95;
            } else outilActif = 'carre';
            if (outilActif) canvas.style.pointerEvents = 'auto';
            window.redessinerToutesLesLignes();
        }
        if (e.key === '9') {
            e.preventDefault();
            if (outilActif === 'repereX') {
                if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 4 && window.repereXTexte === null) window.nombreBranchesRepereX = 6;
                else if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 6 && window.repereXTexte === null) window.repereXEstUnCercle = true;
                else if (window.repereXEstUnCercle && window.repereXTexte === null) { window.repereXEstUnCercle = false; window.repereXTexte = cycleCaracteres[0]; }
                else if (window.repereXTexte !== null) {
                    const indexActuel = cycleCaracteres.indexOf(window.repereXTexte);
                    if (indexActuel >= 0 && indexActuel < cycleCaracteres.length - 1) window.repereXTexte = cycleCaracteres[indexActuel + 1];
                    else { window.repereXTexte = null; window.nombreBranchesRepereX = 4; window.repereXEstUnCercle = false; }
                }
            } else { outilActif = 'repereX'; window.nombreBranchesRepereX = 4; window.repereXEstUnCercle = false; window.repereXTexte = null; }
            if (outilActif) canvas.style.pointerEvents = 'auto';
            window.redessinerToutesLesLignes();
        }
        if (e.key === '0') {
            e.preventDefault();
            if (outilActif !== 'effetBlanche') { outilActif = 'effetBlanche'; window.niveauForceCourant = 0; }
            else { window.niveauForceCourant++; if (window.niveauForceCourant > 4) { outilActif = null; window.niveauForceCourant = 0; } }
            if (outilActif) canvas.style.pointerEvents = 'auto';
            window.redessinerToutesLesLignes();
        }
        if (e.key === 'Escape') {
            outilActif = null; if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; } window.redessinerToutesLesLignes();
        }
        if (e.key.toLowerCase() === 'e' || e.key === 'Delete') {
            e.preventDefault(); canvas.style.pointerEvents = 'auto';
            const aEteEfface = window.detecterEtEffacerDessin(mouseX, mouseY);
            if (!aEteEfface) canvas.style.pointerEvents = 'none';
        }

        if (e.key >= '1' && e.key <= '8') {
            const zoneId = parseInt(e.key, 10);
            const indexZoneExistante = window.dessinsSauvegardes.findIndex(dessin => dessin.estZoneGrille && dessin.zoneId === zoneId);
            if (indexZoneExistante !== -1) {
                const zoneActive = window.dessinsSauvegardes[indexZoneExistante];
                if (!zoneActive.mode || zoneActive.mode === 'standard') zoneActive.mode = 'alternatif';
                else window.dessinsSauvegardes.splice(indexZoneExistante, 1);
            } else {
                window.dessinsSauvegardes.push({ couleur: colorSelect ? colorSelect.value : '#ffffff', estZoneGrille: true, zoneId: zoneId, mode: 'standard', points: [] });
            }
            window.redessinerToutesLesLignes();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') { isShiftPressed = false; canvas.style.pointerEvents = 'none'; if (isDrawing) finTrace(); }
        if (e.key === 'Control') isCtrlPressed = false;
    });

    window.addEventListener('blur', () => { isShiftPressed = false; isCtrlPressed = false; if (canvas) canvas.style.pointerEvents = 'none'; if (isDrawing) finTrace(); });

    // === GESTION INTERACTION DESSIN IPAD ET PC ===
    function declencherDebutTrace(e) {
        if (window.outilTraceActif !== "select") {
            if (e.cancelable) e.preventDefault();
        }

        const coords = obtenirCoordonneesEvenement(e, table);
        const localX = coords.x;
        const localY = coords.y;

        // Mode Gomme Tactile / Clic
        if (window.outilTraceActif === "erase") {
            const elementSupprime = window.detecterEtEffacerDessin(localX, localY);
            if (elementSupprime) {
                const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
                if (btnSelect) btnSelect.click();
            }
            return; 
        }

        // Armement de la position de départ pour le déplacement d'une forme tactique
        const outilTactiqueActif = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
        if (['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'].includes(outilTactiqueActif)) {
            isDrawing = true; // Permet d'ouvrir la porte au suivi du mouvement dans touchmove
            mouseX = localX;
            mouseY = localY;
            window.redessinerToutesLesLignes();
            return;
        }

        // Dessin Libre
        if (window.outilTraceActif !== "select") {
            commencerDessin(e);
        }
    }

    function declencherMouvementTrace(e) {
        const coords = obtenirCoordonneesEvenement(e, table);
        const x = coords.x;
        const y = coords.y;

        // === EN DIRECT IPAD/PC : ÉCOUTE ET RE-REND L'APERÇU SANS POSER L'ELEMENT ===
        const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];
        if (listeFormesTactiques.includes(window.outilTraceActif) || outilActif) {
            if (e.cancelable) e.preventDefault();
            mouseX = x;
            mouseY = y;

            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(() => {
                    window.redessinerToutesLesLignes();
                    animationFrameId = null;
                });
            }
            return;
        }

        if (!isDrawing || !currentLine) return;
        if (e.cancelable) e.preventDefault();

        if (currentLine.estDroite) {
            window.redessinerToutesLesLignes();
            configurerStyleDessin(currentLine.couleur, currentLine.estPointille);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            if (currentLine.avecFleche) dessinerPointeFleche(startPoint.x, startPoint.y, x, y, currentLine.couleur);
            currentLine.points = [startPoint, { x, y }];
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
            currentLine.points.push({ x, y });
        }
    }

    function declencherFinTrace() {
        const outilTactiqueActif = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
        const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];

        // === POSE DÉFINITIVE UNIQUEMENT QUAND LE DOIGT QUITTE L'ÉCRAN DE L'IPAD ===
        if (listeFormesTactiques.includes(outilTactiqueActif) && isDrawing) {
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
            
            isDrawing = false;
            outilActif = null;
            
            const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
            if (btnSelect) btnSelect.click();
            return;
        }

        finTrace();
        if (window.outilTraceActif === "select") {
            canvas.style.pointerEvents = 'none';
        } else {
            canvas.style.pointerEvents = 'auto'; 
        }
    }

    function commencerDessin(e) {
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
                if (typeof rafraichirListeLateraleBilles === "function") rafraichirListeLateraleBilles();
                const displayEl = document.getElementById('ball-position-display');
                if (displayEl) displayEl.innerText = "Position de la bille : Aucune sélectionnée";
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
