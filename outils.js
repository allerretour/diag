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
            const donneesExport = {
                titre: configTitle,
                description: configDesc,
                nombreBillesVisibles: ballsCountSelect ? parseInt(ballsCountSelect.value, 10) : 15,
                billes: listBilles
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

                    // Analyse du format de fichier (nouveau format complet vs ancien format simple)
                    if (donneesImportees.billes && Array.isArray(donneesImportees.billes)) {
                        listeBilles = donneesImportees.billes;
                        nbVisibles = donneesImportees.nombreBillesVisibles;
                        titreImported = donneesImportees.titre || "Configuration sans titre";
                        descImported = donneesImportees.description || "";
                    } else if (Array.isArray(donneesImportees)) {
                        listeBilles = donneesImportees;
                        nbVisibles = donneesImportees.filter(b => parseInt(b.id, 10) > 0).length;
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

                    alert(`Configuration "${titreImported}" restaurée avec succès !`);
                } catch (error) {
                    alert("Erreur lors de la lecture du fichier JSON. Vérifiez sa structure.");
                }
                fileImportInput.value = "";
            };
            reader.readAsText(file);
        });
    }

    // --- GESTION DE LA GRILLE VISUELLE ---
    const gridOverlay = document.getElementById('grid-overlay');
    const chkToggleGrid = document.getElementById('chk-toggle-grid');

    if (gridOverlay && chkToggleGrid) {
        // 1. Générer dynamiquement les cases de la grille (9 * 17 = 153 cases)
        const totalCells = 9 * 17;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            gridOverlay.appendChild(cell);
        }

        // 2. Écouter le changement d'état du bouton Toggle
        chkToggleGrid.addEventListener('change', () => {
            if (chkToggleGrid.checked) {
                gridOverlay.style.display = 'grid';
            } else {
                gridOverlay.style.display = 'none';
            }
        });
    }
    // -------------------------------------


});
