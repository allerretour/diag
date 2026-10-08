document.addEventListener("DOMContentLoaded", () => {
    // Initialise les éléments visuels de la table
    initialiserBilles();

    const exportBtn = document.getElementById('btn-export');
    const importTriggerBtn = document.getElementById('btn-import-trigger');
    const fileImportInput = document.getElementById('file-import');
    const ballsCountSelect = document.getElementById('select-balls-count');
    
    // Nouveaux éléments de texte
    const titleInput = document.getElementById('input-title');
    const descInput = document.getElementById('input-desc');

    // Mettre à jour l'affichage et le placement selon le sélecteur (Jeu officiel du 8, 9 ou 10)
    // Mettre à jour l'affichage et le placement selon le sélecteur
// Mettre à jour uniquement la visibilité selon le nombre de billes requis
// ====================================================================
// GESTION DU CHANGEMENT DE MODE ET DE VISIBILITÉ (SCRIPT 2)
// ====================================================================

function updateVisibleBalls() {
    if (!ballsCountSelect) return;
    const value = ballsCountSelect.value;
    
    // Si c'est le mode 14.1, on a besoin de voir 15 billes au total (14 dans le rack + 1 de break)
    const maxBallsAllowed = (value === "14.1") ? 15 : parseInt(value, 10);

    activeBalls.forEach(ball => {
        const ballId = parseInt(ball.getAttribute('data-id'), 10);
        if (ballId === 0) {
            ball.style.display = 'flex'; // La blanche reste toujours visible
        } else {
            ball.style.display = ballId <= maxBallsAllowed ? 'flex' : 'none';
        }
    });
}

// Écouteur d'événement intelligent sur le changement du dropdown
if (ballsCountSelect) {
    ballsCountSelect.addEventListener('change', (event) => {
        // 1. On ajuste d'abord la visibilité des billes sur le tapis
        updateVisibleBalls();

        // 2. On récupère l'élément <option> qui vient d'être cliqué
        const optionSelectionnee = ballsCountSelect.options[ballsCountSelect.selectedIndex];
        // On remonte au parent <optgroup> pour voir s'il s'agit du groupe officiel
        const parentOptgroup = optionSelectionnee.parentNode;
        
        if (parentOptgroup && parentOptgroup.getAttribute('data-placement') === 'auto') {
            const val = ballsCountSelect.value;
            
            // MODIFICATION ICI : On gère les modes textuels spécifiques "14.1" et "9-matchroom"
            if (val === "14.1" || val === "9-matchroom") {
                placerRackOfficiel(val);
            } else {
                // Gestion des modes numériques classiques (8, 9 classique, 10)
                const maxBallsAllowed = parseInt(val, 10);
                if ([9, 10, 15].includes(maxBallsAllowed)) {
                    placerRackOfficiel(maxBallsAllowed);
                }
            }
        }
        rafraichirListeLateraleBilles();
    });
}


// ====================================================================
// FONCTION DE PLACEMENT GÉOMÉTRIQUE MISE À JOUR
// ====================================================================
function placerRackOfficiel(mode) {
    // Le CENTRE théorique de l'apex (Foot Spot)
    let apexX = 573; 
    const apexY = 185; 
    
    // Espacements géométriques standards (diamètre 24px + imbrication)
    const dx = 20.8; 
    const dy = 24;    

    let schéma = {};

    if (mode === 15) {
        // --- JEU DU 8 classique (Triangle complet de 15 billes) ---
        schéma = {
            1:  { col: 0, row: 0 },
            2:  { col: 1, row: -0.5 }, 3: { col: 1, row: 0.5 },
            4:  { col: 2, row: -1 },   8: { col: 2, row: 0 },   5: { col: 2, row: 1 },
            6:  { col: 3, row: -1.5 }, 7: { col: 3, row: -0.5 }, 9: { col: 3, row: 0.5 }, 10: { col: 3, row: 1.5 },
            11: { col: 4, row: -2 },   12: { col: 4, row: -1 },  13: { col: 4, row: 0 },  14: { col: 4, row: 1 }, 15: { col: 4, row: 2 }
        };
    } 
    else if (mode === "14.1") {
        // --- JEU DU 14.1 (Triangle de 14 billes, APEX VIDE, Bille 15 à côté) ---
        schéma = {
            1:  { col: 1, row: -0.5 }, 2: { col: 1, row: 0.5 },
            3:  { col: 2, row: -1 },   8: { col: 2, row: 0 },   4: { col: 2, row: 1 },
            5:  { col: 3, row: -1.5 }, 6: { col: 3, row: -0.5 }, 7: { col: 3, row: 0.5 }, 9: { col: 3, row: 1.5 },
            10: { col: 4, row: -2 },   11: { col: 4, row: -1 },  12: { col: 4, row: 0 },  13: { col: 4, row: 1 }, 14: { col: 4, row: 2 },
            15: { col: 1.5, row: -2.5 } 
        };
    }
    else if (mode === 9) {
        // --- JEU DE LA 9 CLASSIQUE (1 sur l'apex) ---
        schéma = {
            1: { col: 0, row: 0 },
            2: { col: 1, row: -0.5 }, 3: { col: 1, row: 0.5 },
            4: { col: 2, row: -1 },   9: { col: 2, row: 0 },   5: { col: 2, row: 1 },
            6: { col: 3, row: -0.5 }, 7: { col: 3, row: 0.5 },
            8: { col: 4, row: 0 }
        };
    } 
    else if (mode === "9-matchroom") {
        // --- JEU DE LA 9 MATCHROOM (Losange standard glissé pour caler la 9 sur le Foot Spot) ---
        schéma = {
            1: { col: 0, row: 0 },
            2: { col: 1, row: -0.5 }, 3: { col: 1, row: 0.5 },
            4: { col: 2, row: -1 },   9: { col: 2, row: 0 },   5: { col: 2, row: 1 }, // La 9 est col 2, elle sera pile sur (573, 185)
            6: { col: 3, row: -0.5 }, 7: { col: 3, row: 0.5 },
            8: { col: 4, row: 0 }
        };
        // On décale l'origine globale vers la gauche de deux colonnes pour ce mode spécifique
        apexX = apexX - (2 * dx); 
    }
    else if (mode === 10) {
        schéma = {
            1:  { col: 0, row: 0 },
            2:  { col: 1, row: -0.5 }, 3: { col: 1, row: 0.5 },
            4:  { col: 2, row: -1 },   10: { col: 2, row: 0 },  5: { col: 2, row: 1 },
            6:  { col: 3, row: -1.5 }, 7:  { col: 3, row: -0.5 }, 8: { col: 3, row: 0.5 }, 9: { col: 3, row: 1.5 }
        };
    }

    // Application des positions physiques calculées aux éléments HTML
    Object.keys(schéma).forEach(id => {
        const ballEl = activeBalls.find(b => b.getAttribute('data-id') === id);
        if (ballEl) {
            const pos = schéma[id];
            const posX = apexX + (pos.col * dx);
            const posY = apexY + (pos.row * dy);

            ballEl.style.left = `${posX}px`;
            ballEl.style.top = `${posY}px`;
        }
    });

    // Gestion de la bille blanche (id '0')
    const cueBall = activeBalls.find(b => b.getAttribute('data-id') === '0');
    if (cueBall) {
        if (mode === "14.1") {
            cueBall.style.left = '195px';
            cueBall.style.top = '140px'; 
        } else {
            cueBall.style.left = '195px';
            cueBall.style.top = '184px';
        }
    }
}



    if (ballsCountSelect) {
        ballsCountSelect.addEventListener('change', updateVisibleBalls);
    }

    // EXPORTATION : Sauvegarde positions, sélecteur, titre et description
    // EXPORTATION JSON : Sauvegarde positions, état de visibilité, sélecteur, titre, description et tracés
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const listBilles = [];
            activeBalls.forEach(ball => {
                listBilles.push({
                    id: ball.getAttribute('data-id'),
                    x: ball.style.left,
                    y: ball.style.top,
                    // AJOUT : Sauvegarde de l'état de visibilité de la bille
                    visible: ball.style.display !== 'none'
                });
            });

            // Récupération des valeurs textuelles nettoyées
            const configTitle = titleInput ? titleInput.value.trim() : "configuration_billard";
            const configDesc = descInput ? descInput.value : "";

            // On crée l'objet global intégrant le tableau des dessins
            const donneesExport = {
                titre: configTitle,
                description: configDesc,
                nombreBillesVisibles: ballsCountSelect ? parseInt(ballsCountSelect.value, 10) : 15,
                billes: listBilles,
                lignesDessinees: window.dessinsSauvegardes || [] 
            };

            // Nettoyage du titre pour le nom du fichier
            const nomFichierSecurise = configTitle.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 100) || "configuration_billard";

            const blob = new Blob([JSON.stringify(donneesExport, null, 4)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${nomFichierSecurise}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }


// EXPORTATION TEXTE MIS À JOUR : Sauvegarde la liste complète des billes et des zones actives au format TXT
const exportTxtBtn = document.getElementById('btn-export-text');
if (exportTxtBtn) {
    exportTxtBtn.addEventListener('click', () => {
        const configTitle = titleInput ? titleInput.value.trim() : "Configuration Billard";
        const configDesc = descInput ? descInput.value.trim() : "";
        
        // 1. GENERATION DU CODE UNIQUE AUX SECONDES ET DE L'HORODATAGE LISIBLE
        const uniqueIdSec = Math.floor(Date.now() / 1000); // Code unique tronqué aux secondes (ex: 1791295940)
        
        const maintenant = new Date();
        const annee = maintenant.getFullYear();
        const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
        const jour = String(maintenant.getDate()).padStart(2, '0');
        const heures = String(maintenant.getHours()).padStart(2, '0');
        const minutes = String(maintenant.getMinutes()).padStart(2, '0');
        const horodatageEnTete = `${jour}/${mois}/${annee} à ${heures}h${minutes}`;

        // 2. CONSTRUCTION DU CONTENU TEXTE
        let contenuTexte = `=== CONFIGURATION DE BILLARD ===\n`;
        contenuTexte += `Titre       : ${configTitle}\n`;
        if (configDesc) contenuTexte += `Description : ${configDesc}\n`;
        contenuTexte += `Généré le   : ${horodatageEnTete} (Code : ${uniqueIdSec})\n`;
        contenuTexte += `--------------------------------\n`;
        contenuTexte += `Positions des billes (Grille 16x8, Origine Bas-Gauche) :\n\n`;

        let compteurBillesTexte = 0;
        let compteurBillesCouleur = 0; // Compteur excluant la blanche (id 0)

        activeBalls.forEach(ball => {
            if (ball.style.display !== 'none') {
                compteurBillesTexte++;
                const ballId = ball.getAttribute('data-id');
                const numEl = ball.querySelector('.ball-num');
                
                // Incrémente uniquement s'il ne s'agit pas de la bille blanche
                if (ballId !== '0') {
                    compteurBillesCouleur++;
                }

                let nomBille = "";
                if (ballId === '0') {
                    nomBille = "Bille Blanche";
                } else {
                    const numTexte = numEl ? numEl.innerText : ballId;
                    const estRayee = ball.classList.contains('striped');
                    nomBille = `Bille N°${numTexte} (${estRayee ? 'Rayée' : 'Pleine'})`;
                }

                const pixelX = parseFloat(ball.style.left) || 0;
                const pixelY = parseFloat(ball.style.top) || 0;
                const coordsGrille = obtenirCoordonneesGrille(pixelX, pixelY, ball);

                contenuTexte += `- ${nomBille.padEnd(25)} : X = ${coordsGrille.x.padStart(4)}, Y = ${coordsGrille.y.padStart(4)}\n`;
            }
        });

        contenuTexte += `\nTotal : ${compteurBillesTexte} billes présentes sur le tapis.\n`;
        
        // === EXPORTATION DES ZONES DE LA GRILLE ACTIVÉES ===
        contenuTexte += `--------------------------------\n`;
        contenuTexte += `Zones de jeu actives (Filtres tactiques) :\n\n`;

        let compteurZones = 0;
        if (window.dessinsSauvegardes && window.dessinsSauvegardes.length > 0) {
            const zonesActives = window.dessinsSauvegardes.filter(dessin => dessin.estZoneGrille);
            zonesActives.sort((a, b) => a.zoneId - b.zoneId);

            zonesActives.forEach(zone => {
                compteurZones++;
                const typeZone = (zone.mode === 'alternatif') ? "Zone Arrivée" : "Zone Départ";
                const codeZone = (zone.mode === 'alternatif') ? `ZA${zone.zoneId}` : `ZD${zone.zoneId}`;
                
                contenuTexte += `- Code : ${codeZone.padEnd(6)} | Type : ${typeZone.padEnd(15)}\n`;
            });
        }

        if (compteurZones === 0) {
            contenuTexte += `Aucune zone (ZD/ZA) affichée sur le tapis.\n`;
        } else {
            contenuTexte += `\nTotal : ${compteurZones} zone(s) affichée(s) sur la table.\n`;
        }
        
        contenuTexte += `================================\n`;

        const blob = new Blob([contenuTexte], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        // MODIFICATION : Utilisation du code unique calibré à la seconde près
        a.download = `${uniqueIdSec}_aleatoires_${compteurBillesCouleur}-billes.txt`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}




// --- GESTION DE L'AFFICHAGE DU LOGO SUR LE TAPIS ---
const chkShowLogo = document.getElementById('chk-show-logo');
const tableLogoOverlay = document.getElementById('table-logo-overlay');

if (chkShowLogo && tableLogoOverlay) {
    // Écouteur d'événement pour intercepter le clic sur la case à cocher
    chkShowLogo.addEventListener('change', () => {
        if (chkShowLogo.checked) {
            // Si coché, on affiche l'élément (l'attribut HTML onerror prendra le relais si logo.png est absent)
            tableLogoOverlay.style.visibility = 'visible';
        } else {
            // Si décoché, on masque le logo
            tableLogoOverlay.style.visibility = 'hidden';
        }
    });
}




   // IMPORTATION : Lit et réinjecte le titre, la description et la table de billard
if (importTriggerBtn && fileImportInput) {
    importTriggerBtn.addEventListener('click', () => fileImportInput.click());

    fileImportInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const donneesImportees = JSON.parse(e.target.result);
            
            let listeBilles = [];
            let nbVisibles = 15;
            let titreImported = "Configuration importée";
            let descImported = "";

            // Analyse du format de fichier et extraction des données
            if (donneesImportees.billes && Array.isArray(donneesImportees.billes)) {
                listeBilles = donneesImportees.billes;
                nbVisibles = donneesImportees.nombreBillesVisibles;
                titreImported = donneesImportees.titre || "Configuration sans titre";
                descImported = donneesImportees.description || "";
                
                // Restauration de tous les tracés (lignes, flèches, cibles, carrés et zones de grille)
                if (donneesImportees.lignesDessinees && Array.isArray(donneesImportees.lignesDessinees)) {
                    window.dessinsSauvegardes = donneesImportees.lignesDessinees;
                } else {
                    window.dessinsSauvegardes = [];
                }
            } else if (Array.isArray(donneesImportees)) {
                listeBilles = donneesImportees;
                nbVisibles = donneesImportees.filter(b => parseInt(b.id, 10) > 0).length;
                window.dessinsSauvegardes = [];
            } else {
                throw new Error("Format JSON non reconnu");
            }

                  // À remplacer à l'intérieur de reader.onload dans le Script 2 :

            // 1. Ajuster la valeur affichée dans le menu déroulant
            if (ballsCountSelect) {
                ballsCountSelect.value = nbVisibles;
            }

            // 2 & 3. MODIFICATION : Restaurer la position ET la visibilité précise de chaque bille
            activeBalls.forEach(ball => {
                const ballId = ball.getAttribute('data-id');
                // Trouver si cette bille possède des données enregistrées dans le fichier
                const savedBall = listeBilles.find(b => b.id === ballId);

                if (savedBall) {
                    // Restaure sa position personnalisée
                    ball.style.left = savedBall.x;
                    ball.style.top = savedBall.y;

                    // Si le fichier contient l'état de visibilité explicite, on l'applique
                    if (savedBall.hasOwnProperty('visible')) {
                        ball.style.display = savedBall.visible ? 'flex' : 'none';
                    } else {
                        // Compatibilité avec vos anciens fichiers JSON qui n'avaient pas l'option
                        const idNum = parseInt(ballId, 10);
                        if (idNum === 0) {
                            ball.style.display = 'flex';
                        } else {
                            ball.style.display = idNum <= nbVisibles ? 'flex' : 'none';
                        }
                    }
                } else {
                    // Si la bille n'est pas dans le fichier, comportement par défaut du menu déroulant
                    const idNum = parseInt(ballId, 10);
                    if (idNum === 0) {
                        ball.style.display = 'flex';
                    } else {
                        ball.style.display = idNum <= nbVisibles ? 'flex' : 'none';
                    }
                }
            });
			
			// ==========================================
            // AJOUT ICI : FORCER LA MISE À JOUR DE LA LISTE
            // ==========================================
            if (typeof rafraichirListeLateraleBilles === "function") {
                rafraichirListeLateraleBilles();
            }

            // 4. Mettre à jour les champs de texte éditables du menu et du tapis de billard
            if (titleInput) titleInput.value = titreImported;
            if (typeof rafraichirTitreSurTapis === "function") rafraichirTitreSurTapis();
            if (descInput) descInput.value = descImported;

            // 5. Forcer le canvas à redessiner immédiatement toutes les formes géométriques et zones chargées
            if (typeof window.redessinerToutesLesLignes === "function") {
                window.redessinerToutesLesLignes();
            }

            alert(`Configuration "${titreImported}" restaurée avec succès !`);
			
			// ====================================================================
            // AJOUT : FERMETURE AUTOMATIQUE DE L'ACCORDÉON <details>
            // ====================================================================
            const controlsAccordion = document.querySelector('.controls-accordion');
            if (controlsAccordion) {
                controlsAccordion.open = false; // Ferme nativement le volet d'options
            }

        } catch (error) {
            alert("Erreur lors de la lecture du fichier JSON. Vérifiez sa structure.");
        }

        // Réinitialisation du champ de fichier pour autoriser une ré-importation immédiate du même fichier
        fileImportInput.value = "";
    };
    reader.readAsText(file);
});

}




    // --- GESTION DE LA GRILLE VISUELLE ALIGNÉE SUR LES DIAMANDS (Bandes incluses, sans contour externe) ---
    const gridOverlay = document.getElementById('grid-overlay');
    const chkToggleGrid = document.getElementById('chk-toggle-grid');
    const poolTable = document.getElementById('pool-table');
    
    // NOUVEAU : Récupération de la case à cocher pour la grille haute densité 16x8
    const chkHighDensityGrid = document.getElementById('chk-high-density-grid'); 

    if (gridOverlay && chkToggleGrid && poolTable) {
        
function genererGrille() {
    // Si la case haute densité est cochée, on utilise 16x8, sinon la grille 8x4 par défaut
    const mode16x8 = chkHighDensityGrid ? chkHighDensityGrid.checked : false;
    const cols = mode16x8 ? 16 : 8;
    const rows = mode16x8 ? 8 : 4;
    
    gridOverlay.style.position = 'absolute';
    gridOverlay.style.left = '19px';      // Bordure gauche d'origine
    gridOverlay.style.top = '17px';       // Bordure haute d'origine
    gridOverlay.style.width = '754px';    // Largeur totale de la zone de jeu
    gridOverlay.style.height = '364px';   // Hauteur totale de la zone de jeu
    gridOverlay.style.border = 'none';
    gridOverlay.style.overflow = 'visible'; // Permet aux chiffres de déborder sur les diamants extérieurs
    
    // === CRITIQUE : FORCER LA PRIORITÉ DE L'OVERLAY GLOBAL AU-DESSUS DE TOUT ===
    gridOverlay.style.zIndex = '99999';   // Passe au-dessus du tapis, des billes et du canvas de dessin

    // Répartition dynamique des colonnes et rangées
    gridOverlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridOverlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Nettoyage et injection des cases avec lignes intérieures uniquement
    gridOverlay.innerHTML = '';
    gridOverlay.style.pointerEvents = 'none'; 
    
    // === MODIFICATION : ON LAISSE LES DIAMANTS TOUJOURS VISIBLES ===
    const anciensDiamants = document.querySelectorAll('.diamond, .repere, [class*="diamond"]');
    anciensDiamants.forEach(d => {
        d.style.visibility = 'visible'; // Forcé à toujours visible, peu importe le mode de grille
    });

    // 1. Génération des lignes de repère intérieures uniquement
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.style.boxSizing = 'border-box';
            
            // On applique la ligne verticale SEULEMENT si ce n'est pas la dernière colonne à droite
            if (c < cols - 1) {
                cell.style.borderRight = '1px dashed rgba(255, 255, 255, 0.25)';
            }
            
            // On applique la ligne horizontale SEULEMENT si ce n'est pas la dernière rangée en bas
            if (r < rows - 1) {
                cell.style.borderBottom = '1px dashed rgba(255, 255, 255, 0.25)';
            }

            gridOverlay.appendChild(cell);
        }
    }

    // ====================================================================
    // 2. GENERATION DES CHIFFRES SUR L'OVERLAY GLOBAL (PREMIÈRE LAYER)
    // ====================================================================
    if (mode16x8) {
        const styleChiffreCommun = `
            position: absolute;
            color: #ffffff;
            font-family: sans-serif;
            font-weight: bold;
            font-size: 12px; 
            transform: translate(-50%, -50%);
            z-index: 100000;
            background-color: #000000; /* Couleur de fond de votre frame bois */
            padding: 3px 6px;
            border-radius: 4px;
        `;

        const pasX = 754 / cols; // Espacement physique horizontal d'une cellule
        const pasY = 364 / rows; // Espacement physique vertical d'une cellule

        // --- AXE HORIZONTAL (Bandes du haut et du bas) ---
        const valeursX = { 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13", 14: "14", 15: "15", 16: "16" };
        
        Object.keys(valeursX).forEach(index => {
            const indexGrilleX = parseInt(index, 10);
            const posX = indexGrilleX * pasX; // Coordonnée X précise sur la grille

            // Label Bas
            const labelBas = document.createElement('div');
            labelBas.style.cssText = styleChiffreCommun + `top: 364px; left: ${posX}px; margin-top: 32px;`;
            labelBas.innerText = valeursX[index];
            gridOverlay.appendChild(labelBas);

            // Label Haut
          //  const labelHaut = document.createElement('div');
          //  labelHaut.style.cssText = styleChiffreCommun + `top: 0px; left: ${posX}px; margin-top: -31px;`;
          //  labelHaut.innerText = valeursX[index];
          //  gridOverlay.appendChild(labelHaut);
        });

        // --- AXE VERTICAL (Bandes de gauche et de droite) ---
        const valeursY = { 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8" };
        
        Object.keys(valeursY).forEach(index => {
            const indexGrilleY = parseInt(index, 10);
            // Inversion pour calculer la position Y en partant du bas gauche vers le haut
            const posY = (rows - indexGrilleY) * pasY; 

            // Label Gauche
            const labelGauche = document.createElement('div');
            labelGauche.style.cssText = styleChiffreCommun + `top: ${posY}px; left: 0px; margin-left: -34px;`;
            labelGauche.innerText = valeursY[index];
            gridOverlay.appendChild(labelGauche);

            // Label Droite
         //   const labelDroite = document.createElement('div');
         //   labelDroite.style.cssText = styleChiffreCommun + `top: ${posY}px; left: 754px; margin-left: 34px;`;
         //   labelDroite.innerText = valeursY[index];
         //   gridOverlay.appendChild(labelDroite);
        });
    }
}



        // Premier rendu au chargement initial
        genererGrille();

        // Gestion de l'affichage global (Afficher / Masquer)
        chkToggleGrid.addEventListener('change', () => {
            gridOverlay.style.display = chkToggleGrid.checked ? 'grid' : 'none';
        });

        // NOUVEAU : Régénère instantanément la grille lors du clic sur la case 16x8
        if (chkHighDensityGrid) {
            chkHighDensityGrid.addEventListener('change', genererGrille);
        }
    }


const btnRandomHD = document.getElementById('btn-random-hd');

if (btnRandomHD) {
    btnRandomHD.addEventListener('click', () => {
        // Dimensions géométriques de la table identiques au magnétisme
        const gridLeft = 19;
        const gridTop = 17;
        const gridWidth = 754;
        const gridHeight = 364;

        // Grille haute densité 16x8
        const cols = 16;
        const rows = 8;
        const pasX = gridWidth / cols;  
        const pasY = gridHeight / rows; 

        // 1. Générer la liste de toutes les intersections uniques disponibles sur la grille
        const intersectionsDisponibles = [];
        for (let c = 0; c <= cols; c++) {
            for (let r = 0; r <= rows; r++) {
                // Calcul de la position physique (x, y) en pixels pour le COIN haut-gauche d'une bille
                const centreX = gridLeft + (c * pasX);
                const centreY = gridTop + (r * pasY);
                
                let localCentreX = c * pasX;
                let localCentreY = r * pasY;

                // Application de votre sécurité anti-chevauchement des bandes
                if (c === 0) localCentreX = 12;
                if (c === cols) localCentreX = gridWidth - 12;
                if (r === 0) localCentreY = 12;
                if (r === rows) localCentreY = gridHeight - 12;

                const finalX = (gridLeft + localCentreX) - 12;
                const finalY = (gridTop + localCentreY) - 12;

                intersectionsDisponibles.push({ x: finalX, y: finalY });
            }
        }

        // 2. Mélanger la liste des intersections (Algorithme de Fisher-Yates)
        for (let i = intersectionsDisponibles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [intersectionsDisponibles[i], intersectionsDisponibles[j]] = [intersectionsDisponibles[j], intersectionsDisponibles[i]];
        }

        // 3. Assigner une coordonnée unique à chaque bille visible (Sauf la bille blanche)
        let indexIntersection = 0;
        activeBalls.forEach(ball => {
            const ballId = ball.getAttribute('data-id');
            // On ne déplace de manière totalement aléatoire que les billes de couleur visibles (id > 0)
            if (ballId !== '0' && ball.style.display !== 'none' && indexIntersection < intersectionsDisponibles.length) {
                const pos = intersectionsDisponibles[indexIntersection];
                
                ball.style.left = `${pos.x}px`;
                ball.style.top = `${pos.y}px`;
                
                indexIntersection++;
            }
        });

        // ====================================================================
        // GÉNERATION DES ZONES UNIQUE ZD ET ZA + PLACEMENT DE LA BLANCHE
        // ====================================================================
        
        // 1. Nettoyer les anciennes zones déjà présentes pour éviter les duplicatas
        window.dessinsSauvegardes = window.dessinsSauvegardes.filter(dessin => !dessin.estZoneGrille);

        // 2. Initialisation dynamique de la liste pour les IDs de zone (1 à 8)
        const listeIdsZones = Array.from({ length: 8 }, (v, k) => k + 1);
        
        // Mélange de la liste des IDs (Fisher-Yates)
        for (let i = listeIdsZones.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [listeIdsZones[i], listeIdsZones[j]] = [listeIdsZones[j], listeIdsZones[i]];
        }

        const nbZD = 1; 
        const nbZA = 1; 

        // Couleur par défaut requise par la structure des objets
        const couleurActive = (document.getElementById('marker-color')) ? document.getElementById('marker-color').value : '#ffffff';

        // 4. Générer l'unique Zone de Départ (ZD)
        let savedZdId = 1;
        for (let i = 0; i < nbZD; i++) {
            const zoneId = listeIdsZones.pop(); 
            savedZdId = zoneId; // On mémorise l'ID de la ZD pour y téléporter la bille blanche
            window.dessinsSauvegardes.push({
                couleur: couleurActive,
                estZoneGrille: true,
                zoneId: zoneId,
                mode: 'standard', // 'standard' = Zone Départ (ZD)
                points: []
            });
        }

        // 5. Générer l'unique Zone d'Arrivée (ZA)
        for (let i = 0; i < nbZA; i++) {
            const zoneId = listeIdsZones.pop(); 
            window.dessinsSauvegardes.push({
                couleur: couleurActive,
                estZoneGrille: true,
                zoneId: zoneId,
                mode: 'alternatif', // 'alternatif' = Zone Arrivée (ZA)
                points: []
            });
        }

        // ====================================================================
        // NOUVEAU : ALIGNEMENT AUTOMATIQUE DE LA BILLE BLANCHE AU CENTRE DE LA ZD
        // ====================================================================
        const cueBall = activeBalls.find(b => b.getAttribute('data-id') === '0');
        if (cueBall) {
            // Configuration de la grille à gros blocs (4 colonnes, 2 rangées)
            const zoneCols = 4;
            const zonePasX = 754 / zoneCols; // Largeur physique d'une zone (188.5px)
            const zonePasY = 364 / 2;        // Hauteur physique d'une zone (182px)

            // Convertir l'index mémorisé (1 à 8) en coordonnées de grille (0 à 3 et 0 à 1)
            const idx = savedZdId - 1;
            const r = Math.floor(idx / zoneCols);
            const c = idx % zoneCols;

            // Coordonnées physiques du coin haut-gauche de la zone sélectionnée (Marge haute incluse à 18px pour s'aligner sur la fonction de dessin)
            const zoneX = 19 + (c * zonePasX);
            const zoneY = 18 + (r * zonePasY);

            // Calcul du milieu parfait de la zone en pixels
            const centreZoneX = zoneX + (zonePasX / 2);
            const centreZoneY = zoneY + (zonePasY / 2);

            // Positionnement CSS (Top / Left) en retirant le rayon de la bille (12px) pour la centrer
            const finalBlancheX = centreZoneX - 12;
            const finalBlancheY = centreZoneY - 12;

            cueBall.style.left = `${finalBlancheX}px`;
            cueBall.style.top = `${finalBlancheY}px`;
            
            // Forcer la détection de collision finale pour s'assurer qu'aucune autre bille ne lui a été assignée dessus
            if (typeof resolveCollisions === "function") {
                resolveCollisions(cueBall);
            }
        }

        // 6. Forcer le rafraîchissement immédiat du canvas pour dessiner les nouvelles zones
        if (typeof window.redessinerToutesLesLignes === "function") {
            window.redessinerToutesLesLignes();
        }

        // 7. Mettre à jour l'affichage de texte de la bille active
        const displayEl = document.getElementById('ball-position-display');
        if (displayEl) {
            displayEl.innerText = "Position : Aléatoire, Blanche centrée dans l'unique ZD";
        }
		rafraichirListeLateraleBilles();
    });
}

rafraichirListeLateraleBilles();


});
