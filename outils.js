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

    // Mettre à jour l'affichage selon le sélecteur
    function updateVisibleBalls() {
        if (!ballsCountSelect) return;
        const maxBallsAllowed = parseInt(ballsCountSelect.value, 10);

        activeBalls.forEach(ball => {
            const ballId = parseInt(ball.getAttribute('data-id'), 10);
            if (ballId === 0) {
                ball.style.display = 'flex'; // La blanche reste toujours là
            } else {
                ball.style.display = ballId <= maxBallsAllowed ? 'flex' : 'none';
            }
        });
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

       // --- GESTION DE LA GRILLE VISUELLE COMPLÈTE CORRIGÉE (17x9) ---
    const gridOverlay = document.getElementById('grid-overlay');
    const chkToggleGrid = document.getElementById('chk-toggle-grid');
    const poolTable = document.getElementById('pool-table');

    if (gridOverlay && chkToggleGrid && poolTable) {
        const cols = 17;
        const rows = 9;
        const totalCells = cols * rows;

        // Position de départ exacte du tapis vert (limites minimales physiques)
        const offsetLeft = 19;  // minX
        const offsetTop = 18;   // minY

        // Diamètre de la bille défini dans le moteur physique (28px)
        const ballDiameter = 28;

        // Ajustement : On ajoute le diamètre de la bille pour obtenir les bords réels de la surface
        // Largeur totale : 754 - 18 + 28 = 764px
        // Hauteur totale : 354 - 18 + 28 = 364px
        const playWidth = (754 - offsetLeft) + ballDiameter -8;  
        const playHeight = (354 - offsetTop) + ballDiameter ; 

        // Application stricte des dimensions de surface sur l'overlay
        gridOverlay.style.position = 'absolute';
        gridOverlay.style.left = `${offsetLeft}px`;
        gridOverlay.style.top = `${offsetTop}px`;
        gridOverlay.style.width = `${playWidth}px`;
        gridOverlay.style.height = `${playHeight}px`;

        // Répartition parfaite des 17x9 cases sur toute la surface étendue
        gridOverlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridOverlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        // Nettoyage et injection des 153 cases
        gridOverlay.innerHTML = '';
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            gridOverlay.appendChild(cell);
        }

        // Gestion de l'affichage (Toggle)
        chkToggleGrid.addEventListener('change', () => {
            gridOverlay.style.display = chkToggleGrid.checked ? 'grid' : 'none';
        });
    }
    // --------------------------------------------------------------





});
