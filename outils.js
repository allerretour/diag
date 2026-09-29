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
    function updateVisibleBalls() {
        if (!ballsCountSelect) return;
        const maxBallsAllowed = parseInt(ballsCountSelect.value, 10);

        // 1. Gérer la visibilité des billes
        activeBalls.forEach(ball => {
            const ballId = parseInt(ball.getAttribute('data-id'), 10);
            if (ballId === 0) {
                ball.style.display = 'flex'; // La blanche reste toujours là
            } else {
                ball.style.display = ballId <= maxBallsAllowed ? 'flex' : 'none';
            }
        });

        // 2. Si le nombre correspond à un jeu officiel, appliquer le placement automatique
        if ([9, 10, 15].includes(maxBallsAllowed)) {
            placerRackOfficiel(maxBallsAllowed);
        }
    }

       // Fonction technique de placement géométrique officiel corrigée
    function placerRackOfficiel(mode) {
        // Le CENTRE de la bille de tête doit être sur le Foot Spot (X: 600).
        // On soustrait le rayon de la bille (14px) + l'ajustement de 2px pour un alignement parfait.
        const apexX = 587; 
        const apexY = 189; // Ajustement vertical également (186px - 14px de rayon)
        
        // Espacements géométriques standards basés sur le diamètre de la bille (28px)
        const dx = 24.25; // Décalage horizontal par colonne (28 * cos(30°) ajusté pour l'imbrication)
        const dy = 28;    // Décalage vertical entre deux billes d'une même colonne

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
            cueBall.style.left = '187px';
            cueBall.style.top = '188px';
        }
    }



    if (ballsCountSelect) {
        ballsCountSelect.addEventListener('change', updateVisibleBalls);
    }

    // EXPORTATION : Sauvegarde positions, sélecteur, titre et description
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const listBilles = [];
            activeBalls.forEach(ball => {
                listBilles.push({
                    id: ball.getAttribute('data-id'),
                    x: ball.style.left,
                    y: ball.style.top
                });
            });

            // Récupération des valeurs textuelles nettoyées
            const configTitle = titleInput ? titleInput.value.trim() : "configuration_billard";
            const configDesc = descInput ? descInput.value : "";

            // On crée l'objet global intégrant vos nouveaux champs éditables
            // On intègre le tableau des dessins à l'objet global exporté
const donneesExport = {
    titre: configTitle,
    description: configDesc,
    nombreBillesVisibles: ballsCountSelect ? parseInt(ballsCountSelect.value, 10) : 15,
    billes: listBilles,
    lignesDessinees: window.dessinsSauvegardes || [] // AJOUT : capture des lignes
};


            // Nettoyage du titre pour en faire un nom de fichier système valide (enlève les caractères interdits)
            const nomFichierSecurise = configTitle.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 100) || "configuration_billard";

            const blob = new Blob([JSON.stringify(donneesExport, null, 4)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${nomFichierSecurise}.json`; // Le nom du fichier prend la valeur du titre
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
            const file = event.target.files[0]; // Correction pour lire le premier fichier de la liste
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
    const donneesImportees = JSON.parse(e.target.result);
    
    let listeBilles = [];
    let nbVisibles = 15;
    let titreImported = "Configuration importée";
    let descImported = "";

    // Analyse du format de fichier
    if (donneesImportees.billes && Array.isArray(donneesImportees.billes)) {
        listeBilles = donneesImportees.billes;
        nbVisibles = donneesImportees.nombreBillesVisibles;
        titreImported = donneesImportees.titre || "Configuration sans titre";
        descImported = donneesImportees.description || "";
        
        // AJOUT : Restauration des lignes de dessin
        if (donneesImportees.lignesDessinees && Array.isArray(donneesImportees.lignesDessinees)) {
            window.dessinsSauvegardes = donneesImportees.lignesDessinees;
        } else {
            window.dessinsSauvegardes = [];
        }
    } else if (Array.isArray(donneesImportees)) {
        listeBilles = donneesImportees;
        nbVisibles = donneesImportees.filter(b => parseInt(b.id, 10) > 0).length;
        window.dessinsSauvegardes = []; // Ancien format sans dessin
    } else {
        throw new Error();
    }

    // 1. Restaurer la position de toutes les billes
    listeBilles.forEach(savedBall => {
        const ballEl = activeBalls.find(b => b.getAttribute('data-id') === savedBall.id);
        if (ballEl) {
            ballEl.style.left = savedBall.x;
            ballEl.style.top = savedBall.y;
        }
    });

    // 2. Ajuster le sélecteur numérique et masquer les billes en trop
    if (ballsCountSelect) {
        ballsCountSelect.value = nbVisibles;
        updateVisibleBalls();
    }

    // 3. Mettre à jour les champs de texte éditables du HTML
    if (titleInput) titleInput.value = titreImported;
    if (descInput) descInput.value = descImported;

    // AJOUT : Forcer le canvas à redessiner les lignes chargées
    if (typeof window.redessinerToutesLesLignes === "function") {
        window.redessinerToutesLesLignes();
    }

    alert(`Configuration "${titreImported}" restaurée avec succès !`);
} catch (error) {
    alert("Erreur lors de la lecture du fichier JSON. Vérifiez sa structure.");
}

                fileImportInput.value = "";
            };
            reader.readAsText(file);
        });
    }


     // --- GESTION DE LA GRILLE VISUELLE ALIGNÉE SUR LES DIAMANDS (Bandes incluses, sans contour externe) ---
    const gridOverlay = document.getElementById('grid-overlay');
    const chkToggleGrid = document.getElementById('chk-toggle-grid');
    const poolTable = document.getElementById('pool-table');

    if (gridOverlay && chkToggleGrid && poolTable) {
        const cols = 8;
        const rows = 4;
        
        // Configuration de l'overlay de la grille (Aucune bordure externe ici)
        gridOverlay.style.position = 'absolute';
        gridOverlay.style.left = '6px';
        gridOverlay.style.top = '6px';
        gridOverlay.style.width = '786px';
        gridOverlay.style.height = '394px';
        gridOverlay.style.border = 'none'; // Assure que le grand cadre extérieur est invisible

        // Répartition en 8x4 cases
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

        // Gestion de l'affichage (Toggle)
        chkToggleGrid.addEventListener('change', () => {
            gridOverlay.style.display = chkToggleGrid.checked ? 'grid' : 'none';
        });
    }





});
