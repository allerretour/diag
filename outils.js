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
function updateVisibleBalls() {
    if (!ballsCountSelect) return;
    const maxBallsAllowed = parseInt(ballsCountSelect.value, 10);

    // Gérer la visibilité des billes sans modifier leur position x/y
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
            const maxBallsAllowed = parseInt(ballsCountSelect.value, 10);
            // On déclenche le placement géométrique automatique uniquement pour ce groupe
            if ([9, 10, 15].includes(maxBallsAllowed)) {
                placerRackOfficiel(maxBallsAllowed);
            }
        }
    });
}



       // Fonction technique de placement géométrique officiel corrigée
    function placerRackOfficiel(mode) {
        // Le CENTRE de la bille de tête doit être sur le Foot Spot (X: 600).
        // On soustrait le rayon de la bille (14px) + l'ajustement de 2px pour un alignement parfait.
        const apexX = 573; 
        const apexY = 185; // Ajustement vertical également (186px - 14px de rayon)
        
        // Espacements géométriques standards basés sur le diamètre de la bille (28px)
        const dx = 20.8; // Décalage horizontal par colonne (28 * cos(30°) ajusté pour l'imbrication)
        const dy = 24;    // Décalage vertical entre deux billes d'une même colonne

        // Définition des coordonnées relatives par bille (colonne, rangée) selon le mode
        let schéma = {};

        if (mode === 15) {
            // --- JEU DU 8 (Triangle complet de 5 lignes) ---
            schéma = {
                1:  { col: 0, row: 0 },
                2:  { col: 1, row: -0.5 }, 3: { col: 1, row: 0.5 },
                4:  { col: 2, row: -1 },   8: { col: 2, row: 0 },   5: { col: 2, row: 1 },
                6:  { col: 3, row: -1.5 }, 7: { col: 3, row: -0.5 }, 9: { col: 3, row: 0.5 }, 10: { col: 3, row: 1.5 },
                11: { col: 4, row: -2 },   12: { col: 4, row: -1 },  13: { col: 4, row: 0 },  14: { col: 4, row: 1 }, 15: { col: 4, row: 2 }
            };
        } 
        else if (mode === 9) {
            // --- JEU DU 9 (Format Losange : 1-2-3-2-1) ---
            schéma = {
                1: { col: 0, row: 0 },
                2: { col: 1, row: -0.5 }, 3: { col: 1, row: 0.5 },
                4: { col: 2, row: -1 },   9: { col: 2, row: 0 },   5: { col: 2, row: 1 },
                6: { col: 3, row: -0.5 }, 7: { col: 3, row: 0.5 },
                8: { col: 4, row: 0 }
            };
        } 
        else if (mode === 10) {
            // --- JEU DU 10 (Triangle de 4 lignes) ---
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
                // Calcul de la position absolue pixel
                const posX = apexX + (pos.col * dx);
                const posY = apexY + (pos.row * dy);

                ballEl.style.left = `${posX}px`;
                ballEl.style.top = `${posY}px`;
            }
        });

        // Remettre la bille blanche à sa place de départ (Head Spot : 186 - 14 = 172 pour être centrée verticalement)
        const cueBall = activeBalls.find(b => b.getAttribute('data-id') === '0');
        if (cueBall) {
            cueBall.style.left = '195px';
            cueBall.style.top = '184px';
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


    // EXPORTATION TEXTE : Sauvegarde la liste complète des billes visibles au format TXT
        // EXPORTATION TEXTE MIS À JOUR : Sauvegarde avec la date et l'heure dans l'en-tête et le nom de fichier
    const exportTxtBtn = document.getElementById('btn-export-text');
    if (exportTxtBtn) {
        exportTxtBtn.addEventListener('click', () => {
            const configTitle = titleInput ? titleInput.value.trim() : "Configuration Billard";
            const configDesc = descInput ? descInput.value.trim() : "";
            
            // 1. CALCULS DES DATES ET HEURES
            const maintenant = new Date();
            const annee = maintenant.getFullYear();
            const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
            const jour = String(maintenant.getDate()).padStart(2, '0');
            const heures = String(maintenant.getHours()).padStart(2, '0');
            const minutes = String(maintenant.getMinutes()).padStart(2, '0');
            
            // Format pour le nom de fichier (Ex: 2026-10-02_14h35)
            const horodatageFichier = `${annee}-${mois}-${jour}_${heures}h${minutes}`;
            // Format pour l'en-tête lisible (Ex: 02/10/2026 à 14h35)
            const horodatageEnTete = `${jour}/${mois}/${annee} à ${heures}h${minutes}`;

            // 2. CONSTRUCTION DU CONTENU TEXTE
            let contenuTexte = `=== CONFIGURATION DE BILLARD ===\n`;
            contenuTexte += `Titre       : ${configTitle}\n`;
            if (configDesc) contenuTexte += `Description : ${configDesc}\n`;
            contenuTexte += `Généré le   : ${horodatageEnTete}\n`; // AJOUT DANS L'EN-TÊTE
            contenuTexte += `--------------------------------\n`;
            contenuTexte += `Positions des billes (Grille 16x8, Origine Bas-Gauche) :\n\n`;

            let compteurBilles = 0;
            activeBalls.forEach(ball => {
                if (ball.style.display !== 'none') {
                    compteurBilles++;
                    const ballId = ball.getAttribute('data-id');
                    const numEl = ball.querySelector('.ball-num');
                    
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

            contenuTexte += `\nTotal : ${compteurBilles} billes présentes sur le tapis.\n`;
            contenuTexte += `================================\n`;

            // Sécurisation du nom de fichier
            const nomFichierSecurise = configTitle.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 100) || "configuration_billard";
            
            const blob = new Blob([contenuTexte], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            // MODIFICATION : Nom de fichier incluant la date et l'heure pour éviter les doublons d'export
            a.download = `${horodatageFichier}_${nomFichierSecurise}_positions.txt`;
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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

            // 4. Mettre à jour les champs de texte éditables du menu et du tapis de billard
            if (titleInput) titleInput.value = titreImported;
            if (typeof rafraichirTitreSurTapis === "function") rafraichirTitreSurTapis();
            if (descInput) descInput.value = descImported;

            // 5. Forcer le canvas à redessiner immédiatement toutes les formes géométriques et zones chargées
            if (typeof window.redessinerToutesLesLignes === "function") {
                window.redessinerToutesLesLignes();
            }

            alert(`Configuration "${titreImported}" restaurée avec succès !`);

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
        
        // Fonction isolée pour générer la grille dynamiquement
        function genererGrille() {
            // Si la case haute densité est cochée, on utilise 16x8, sinon la grille 8x4 par défaut
            const mode16x8 = chkHighDensityGrid ? chkHighDensityGrid.checked : false;
            const cols = mode16x8 ? 16 : 8;
            const rows = mode16x8 ? 8 : 4;
            
           // Dans la fonction genererGrille() du Script 2
gridOverlay.style.position = 'absolute';
gridOverlay.style.left = '19px';      // Bordure gauche d'origine
gridOverlay.style.top = '17px';       // Bordure haute d'origine
gridOverlay.style.width = '754px';    // Largeur totale de la zone de jeu
gridOverlay.style.height = '364px';   // Hauteur totale de la zone de jeu
gridOverlay.style.border = 'none';



            // Répartition dynamique des colonnes et rangées
            gridOverlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            gridOverlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

            // Nettoyage et injection des cases avec lignes intérieures uniquement
            gridOverlay.innerHTML = '';
            gridOverlay.style.pointerEvents = 'none'; 
            
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
                // Les billes font 24px de diamètre (rayon 12px), on ajuste par rapport au centre de l'intersection
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

        // 3. Assigner une coordonnée unique à chaque bille visible
        let indexIntersection = 0;
        activeBalls.forEach(ball => {
            // On ne déplace que les billes qui ne sont pas cachées
            if (ball.style.display !== 'none' && indexIntersection < intersectionsDisponibles.length) {
                const pos = intersectionsDisponibles[indexIntersection];
                
                ball.style.left = `${pos.x}px`;
                ball.style.top = `${pos.y}px`;
                
                indexIntersection++;
            }
        });

        // 4. Mettre à jour l'affichage de texte de la bille active si nécessaire
        const displayEl = document.getElementById('ball-position-display');
        if (displayEl) {
            displayEl.innerText = "Position de la bille : Aléatoire appliquée";
        }
    });
}




});
