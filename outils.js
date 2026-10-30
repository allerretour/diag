// Variable globale pour stocker la chaîne Base64 du logo
window.logoBase64Courant = null;

const inputLogoFile = document.getElementById('input-logo-file');
const tableLogoOverlay = document.getElementById('table-logo-overlay');
// NOUVEAU : Récupération du bouton Reset
const btnResetLogo = document.getElementById('btn-reset-logo');

// 1. ÉCOUTEUR : Convertir l'image locale en Base64 au moment du choix
// 1. ÉCOUTEUR OPTIMISÉ : Traitement instantané du logo via ObjectURL
if (inputLogoFile && tableLogoOverlay) {
    inputLogoFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // --- QUICK WIN : Génération d'une URL de flux mémoire directe sans FileReader ---
        const imageObjectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            const canvasTemp = document.createElement('canvas');
            const ctxTemp = canvasTemp.getContext('2d');

            // --- BRIDAGE STRICT À 300X300 ---
            const MAX_DIMENSION = 300;
            let largeur = img.width;
            let hauteur = img.height;

            if (largeur > MAX_DIMENSION || hauteur > MAX_DIMENSION) {
                const ratio = Math.min(MAX_DIMENSION / largeur, MAX_DIMENSION / hauteur);
                largeur = Math.round(largeur * ratio);
                hauteur = Math.round(hauteur * ratio);
            }

            canvasTemp.width = largeur;
            canvasTemp.height = hauteur;
            ctxTemp.drawImage(img, 0, 0, largeur, hauteur);

            // Exportation finale propre pour la sauvegarde JSON
            const logoOptimiseBase64 = canvasTemp.toDataURL('image/png');
            
            // 1. On écrase la variable globale lue par l'export JSON simple
            window.logoBase64Courant = logoOptimiseBase64;
            
            // 2. On écrase le .src HTML lu par l'export de séries ZIP/TXT
            tableLogoOverlay.src = logoOptimiseBase64;
            tableLogoOverlay.style.display = 'block';

            // --- NETTOYAGE : Libération immédiate de la ressource mémoire ---
            URL.revokeObjectURL(imageObjectUrl);
        };

        // On affecte l'adresse virtuelle locale, le chargement est immédiat
        img.src = imageObjectUrl;
    });
}





// NOUVEAU : ÉCOUTEUR pour restaurer le logo original
if (btnResetLogo && tableLogoOverlay) {
    btnResetLogo.addEventListener('click', () => {
        // 1. On vide la variable globale pour les futurs exports
        window.logoBase64Courant = null; 
        
        // 2. On remet la source par défaut
        tableLogoOverlay.src = "logo.png"; 
        
        // 3. FORCE l'affichage au cas où les styles CSS bloquent l'élément
        tableLogoOverlay.style.display = 'block';
        tableLogoOverlay.style.visibility = 'visible';
        
        // 4. On réinitialise l'input file pour enlever l'ancien fichier de la mémoire de l'input
        const inputLogoFile = document.getElementById('input-logo-file');
        if (inputLogoFile) {
            inputLogoFile.value = ""; 
        }
    });
}


// --- GESTION DES FENÊTRES MODALES (<dialog>) ---
const modalGuide = document.getElementById('modal-guide');
const btnOuvrirGuide = document.getElementById('btn-ouvrir-guide');
const btnFermerGuide = document.getElementById('btn-fermer-guide');

if (btnOuvrirGuide && modalGuide) {
    btnOuvrirGuide.addEventListener('click', () => modalGuide.showModal());
}
if (btnFermerGuide && modalGuide) {
    btnFermerGuide.addEventListener('click', () => modalGuide.close());
}

// Nouvelle gestion de la fenêtre modale des Options
const modalOptions = document.getElementById('modal-options');
const btnOuvrirOptions = document.getElementById('btn-ouvrir-options');
const btnFermerOptions = document.getElementById('btn-fermer-options');

if (btnOuvrirOptions && modalOptions) {
    btnOuvrirOptions.addEventListener('click', () => modalOptions.showModal());
}
if (btnFermerOptions && modalOptions) {
    btnFermerOptions.addEventListener('click', () => modalOptions.close());
}

// Fonction générique pour détecter précisément un clic à l'extérieur du cadre visible
function configurerFermetureExterieure(modalElement) {
    if (!modalElement) return;
    
    modalElement.addEventListener('click', (e) => {
        const rect = modalElement.getBoundingClientRect();
        const clicExterieur = (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
        );
        
        if (clicExterieur) {
            modalElement.close();
        }
    });
}

// Activation de la fermeture au clic extérieur pour les deux modales
configurerFermetureExterieure(modalGuide);
configurerFermetureExterieure(modalOptions);


// --- GESTION DE LA BOÎTE D'OUTILS TACTIQUES (AFFICHER/MASQUER) ---
const btnTogglePalette = document.getElementById('btn-toggle-palette');
const paletteContainer = document.getElementById('drawing-tools-palette');

if (btnTogglePalette && paletteContainer) {
    btnTogglePalette.addEventListener('click', () => {
        // Alterne la classe de réduction sur le bloc de la palette d'outils
        paletteContainer.classList.toggle('is-collapsed');
        
        // Adapte le glyphe de l'œil et l'infobulle selon le nouvel état obtenu
        if (paletteContainer.classList.contains('is-collapsed')) {
            btnTogglePalette.innerText = '🙈';
            btnTogglePalette.title = "Afficher les outils";
        } else {
            btnTogglePalette.innerText = '👁️';
            btnTogglePalette.title = "Masquer les outils";
        }
    });
}


// --- GESTION DE LA BARRE LATÉRALE DES BILLES (AFFICHER/MASQUER) ---
const btnToggleBalls = document.getElementById('btn-toggle-balls-sidebar');
const ballsSidebarContainer = document.getElementById('balls-sidebar');
const chkBallsListSync = document.getElementById('chk-toggle-balls-list');

if (btnToggleBalls && ballsSidebarContainer) {
    btnToggleBalls.addEventListener('click', () => {
        // Alterne la visibilité en vérifiant l'état actuel
        const estMasque = ballsSidebarContainer.style.display === 'none';
        
        if (estMasque) {
            // On l'affiche (Flex/Grid par défaut)
            ballsSidebarContainer.style.display = "";
            btnToggleBalls.innerText = '🔮'; // Émoji quand la liste est ouverte (à adapter selon vos goûts)
            btnToggleBalls.title = "Masquer la liste des billes";
            if (chkBallsListSync) chkBallsListSync.checked = true;
        } else {
            // On la masque
            ballsSidebarContainer.style.display = 'none';
            btnToggleBalls.innerText = '🎱'; // Émoji quand la liste est fermée
            btnToggleBalls.title = "Afficher la liste des billes";
            if (chkBallsListSync) chkBallsListSync.checked = false;
        }
    });
}







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

// ====================================================================
// CONFIGURATION DYNAMIQUE DES NUANCES DU TAPIS ET DU CADRE EN BOIS
// ====================================================================
const feltRadios = document.querySelectorAll('input[name="felt-color"]');

// Définition des palettes de couleurs selon les essences demandées
const palettesTapis = {
        vert: {
        "--tapis-couleur-principale": "#1e7e43",
        "--tapis-eclat-centre":       "#27ae60",
        "--tapis-ombre-profonde":     "#165b30",
        "--bande-dessus-lumineux":    "#22924e",
        "--bande-ombre-exterieure":   "#1a633a",
        "--bande-ombre-interieure":   "#1d6f40",
        // BOIS CHÂTAIGNIER CUIVRÉ (Auburn & Intense)
        "--bois-clair":               "#a0532d", // Cuivre chaud / Sienne brillant
        "--bois-fonce":               "#783616", // Brun auburn de fond
        "--bois-bordure":             "#4a1f0a"  // Liseré terre d'ombre brûlée
    },

    bleu: {
        "--tapis-couleur-principale": "#1f4e79",
        "--tapis-eclat-centre":       "#2a6ba2",
        "--tapis-ombre-profonde":     "#183b5c",
        "--bande-dessus-lumineux":    "#245c8f",
        "--bande-ombre-exterieure":   "#1c4469",
        "--bande-ombre-interieure":   "#204d77",
        // BOIS NOYER (Chocolat & Élégant)
        "--bois-clair":               "#4a3321", // Noyer satiné éclairé
        "--bois-fonce":               "#2d1e13", // Brun chocolat de fond
        "--bois-bordure":             "#19100a"  // Contour ultra sombre
    },
    gris: {
        "--tapis-couleur-principale": "#5d6d7e",
        "--tapis-eclat-centre":       "#6c7a89",
        "--tapis-ombre-profonde":     "#495562",
        "--bande-dessus-lumineux":    "#707b7c",
        "--bande-ombre-exterieure":   "#4f5d6c",
        "--bande-ombre-interieure":   "#546475",
        // BOIS ÉBÈNE
        "--bois-clair":               "#212121", // Noir ébène satiné
        "--bois-fonce":               "#0d0d0d", // Profondeur sombre
        "--bois-bordure":             "#050505"
    }
};





feltRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        const choix = event.target.value;
        const palette = palettesTapis[choix];

        if (palette) {
            // On applique les nouvelles variables directement sur le :root (document.documentElement)
            Object.keys(palette).forEach(variable => {
                document.documentElement.style.setProperty(variable, palette[variable]);
            });
        }
    });
});







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
        
        // 3. Rafraîchir la liste des billes à côté
        rafraichirListeLateraleBilles();

        // --- NOUVEAU : Force le canvas à se rafraîchir pour afficher/masquer la breakbox ---
        if (typeof window.redessinerToutesLesLignes === "function") {
            window.redessinerToutesLesLignes();
        }
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

// EXPORTATION : Sauvegarde positions, sélecteur, titre, description, tracés et options d'affichage
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const listBilles = [];
        activeBalls.forEach(ball => {
            listBilles.push({
                id: ball.getAttribute('data-id'),
                x: ball.style.left,
                y: ball.style.top,
                visible: ball.style.display !== 'none'
            });
        });

        // Récupération des valeurs textuelles nettoyées
        const configTitle = titleInput ? titleInput.value.trim() : "configuration_billard";
        const configDesc = descInput ? descInput.value : "";

        // Récupération des éléments DOM pour les toggles
        const chkToggleGrid = document.getElementById('chk-toggle-grid');
        const chkHighDensityGrid = document.getElementById('chk-high-density-grid');
        const chkMagnetism = document.getElementById('chk-magnetism');
        const chkShowLogo = document.getElementById('chk-show-logo');
        const chkShowTitle = document.getElementById('chk-show-title');
		const chkToggleBallsList = document.getElementById('chk-toggle-balls-list');

        // On crée l'objet global intégrant toutes les données
        // Trouvez ce bloc dans le gestionnaire d'export (exportBtn.addEventListener) :
const donneesExport = {
    titre: configTitle,
    description: configDesc,
    nombreBillesVisibles: ballsCountSelect ? ballsCountSelect.value : "15",
    logoImageRaw: window.logoBase64Courant,
    billes: listBilles,
    lignesDessinees: window.dessinsSauvegardes || [],
    optionsVisuelles: {
        grille: chkToggleGrid ? chkToggleGrid.checked : false,
        hd: chkHighDensityGrid ? chkHighDensityGrid.checked : false,
        magnetisme: chkMagnetism ? chkMagnetism.checked : true,
        logo: chkShowLogo ? chkShowLogo.checked : false,
        titreVisible: chkShowTitle ? chkShowTitle.checked : false,
        // --- CONSERVATION DE LA COULEUR DU TAPIS ---
        couleurTapis: document.querySelector('input[name="felt-color"]:checked') ? document.querySelector('input[name="felt-color"]:checked').value : "bleu",
		 // --- SAUVEGARDE DE L'ÉTAT DE LA BARRE LATÉRALE ---
        listeBillesVisible: chkToggleBallsList ? chkToggleBallsList.checked : true

    }
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




 // IMPORTATION : Lit et réinjecte la configuration complète
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
                let nbVisibles = "15";
                let titreImported = "Configuration importée";
                let descImported = "";

                if (donneesImportees.billes && Array.isArray(donneesImportees.billes)) {
                    listeBilles = donneesImportees.billes;
                    nbVisibles = donneesImportees.nombreBillesVisibles;
                    titreImported = donneesImportees.titre || "Configuration sans titre";
                    descImported = donneesImportees.description || "";
                    
                    if (donneesImportees.lignesDessinees && Array.isArray(donneesImportees.lignesDessinees)) {
                        window.dessinsSauvegardes = donneesImportees.lignesDessinees;
                    } else {
                        window.dessinsSauvegardes = [];
                    }
                } else if (Array.isArray(donneesImportees)) {
                    listeBilles = donneesImportees;
                    nbVisibles = donneesImportees.filter(b => parseInt(b.id, 10) > 0).length.toString();
                    window.dessinsSauvegardes = [];
                } else {
                    throw new Error("Format JSON non reconnu");
                }

                // 1. Ajuster la valeur affichée dans le menu déroulant
                if (ballsCountSelect) {
                    ballsCountSelect.value = nbVisibles;
                }

                // 2. Restaurer la position ET la visibilité de chaque bille
                activeBalls.forEach(ball => {
                    const ballId = ball.getAttribute('data-id');
                    const savedBall = listeBilles.find(b => b.id === ballId);

                    if (savedBall) {
                        ball.style.left = savedBall.x;
                        ball.style.top = savedBall.y;

                        if (savedBall.hasOwnProperty('visible')) {
                            ball.style.display = savedBall.visible ? 'flex' : 'none';
                        } else {
                            const idNum = parseInt(ballId, 10);
                            if (idNum === 0) {
                                ball.style.display = 'flex';
                            } else {
                                ball.style.display = idNum <= parseInt(nbVisibles, 10) ? 'flex' : 'none';
                            }
                        }
                    } else {
                        const idNum = parseInt(ballId, 10);
                        if (idNum === 0) {
                            ball.style.display = 'flex';
                        } else {
                            ball.style.display = idNum <= parseInt(nbVisibles, 10) ? 'flex' : 'none';
                        }
                    }
                });
                
                if (typeof rafraichirListeLateraleBilles === "function") {
                    rafraichirListeLateraleBilles();
                }

                // 3. Mettre à jour les champs de texte éditables
                if (titleInput) titleInput.value = titreImported;
                if (descInput) descInput.value = descImported;

                // ====================================================================
                // AJOUT ICI : RESTAURATION ET DÉCLENCHEMENT DES TOGGLES VISUELS
                // ====================================================================
                if (donneesImportees.optionsVisuelles) {
                    const opts = donneesImportees.optionsVisuelles;
                    
                    const chkToggleGrid = document.getElementById('chk-toggle-grid');
                    const chkHighDensityGrid = document.getElementById('chk-high-density-grid');
                    const chkMagnetism = document.getElementById('chk-magnetism');
                    const chkShowLogo = document.getElementById('chk-show-logo');
                    const chkShowTitle = document.getElementById('chk-show-title');
					// On récupère notre nouvelle case à cocher
					const chkToggleBallsList = document.getElementById('chk-toggle-balls-list');

                    // Restauration de la Grille HD d'abord (pour que la grille sache s'il faut générer en 16x8 ou 8x4)
                    if (chkHighDensityGrid && opts.hasOwnProperty('hd')) {
                        chkHighDensityGrid.checked = opts.hd;
                        chkHighDensityGrid.dispatchEvent(new Event('change'));
                    }

                    // Restauration de l'affichage de la Grille globale
                    if (chkToggleGrid && opts.hasOwnProperty('grille')) {
                        chkToggleGrid.checked = opts.grille;
                        chkToggleGrid.dispatchEvent(new Event('change'));
                    }

                    // Restauration du Magnétisme
                    if (chkMagnetism && opts.hasOwnProperty('magnetisme')) {
                        chkMagnetism.checked = opts.magnetisme;
                        chkMagnetism.dispatchEvent(new Event('change'));
                    }

                    // Restauration du Logo
                    if (chkShowLogo && opts.hasOwnProperty('logo')) {
                        chkShowLogo.checked = opts.logo;
                        chkShowLogo.dispatchEvent(new Event('change'));
                    }

                    // Restauration de l'affichage du Titre
                    if (chkShowTitle && opts.hasOwnProperty('titreVisible')) {
                        chkShowTitle.checked = opts.titreVisible;
                    }
					
					// --- RESTAURATION DE LA BARRE LATÉRALE ---
					if (chkToggleBallsList && opts.hasOwnProperty('listeBillesVisible')) {
						chkToggleBallsList.checked = opts.listeBillesVisible;
					// Déclenche l'événement de changement pour masquer/afficher la structure HTML immédiatement
						chkToggleBallsList.dispatchEvent(new Event('change'));
					} else if (chkToggleBallsList) {
					// Optionnel : Comportement par défaut si un ancien JSON ne possède pas l'option
						chkToggleBallsList.checked = true;
						chkToggleBallsList.dispatchEvent(new Event('change'));
					}


                    if (donneesImportees.hasOwnProperty('logoImageRaw') && donneesImportees.logoImageRaw) {
    window.logoBase64Courant = donneesImportees.logoImageRaw;
    if (tableLogoOverlay) {
        tableLogoOverlay.src = window.logoBase64Courant; // Réinjecte l'image brute sauvegardée sur le tapis
    }
} else {
    // Si la configuration importée n'a pas de logo personnalisé, on remet l'image par défaut
    window.logoBase64Courant = null;
    if (tableLogoOverlay) {
        tableLogoOverlay.src = "logo.png"; 
    }
}

					
					// --- RESTAURATION DE LA COULEUR DU TAPIS DEPUIS LE JSON ---
    if (opts.hasOwnProperty('couleurTapis')) {
        // Remplacer "bleu" par "vert" en cas d'absence dans le fichier JSON importé
		const couleurEnregistree = opts.couleurTapis || "vert"; 

        
        // 1. Coche le bouton radio correspondant dans l'interface utilisateur
        const radioAcocher = document.querySelector(`input[name="felt-color"][value="${couleurEnregistree}"]`);
        if (radioAcocher) {
            radioAcocher.checked = true;
        }

        // 2. Réinjecte instantanément la bonne palette de variables CSS (:root)
        const palette = palettesTapis[couleurEnregistree];
        if (palette) {
            Object.keys(palette).forEach(variable => {
                document.documentElement.style.setProperty(variable, palette[variable]);
            });
        }
    }
					
                }
				
				

                // Forcer l'écriture du titre sur le tapis après configuration du toggle
                if (typeof rafraichirTitreSurTapis === "function") {
                    rafraichirTitreSurTapis();
                }

                // 4. Forcer le canvas à redessiner immédiatement
                if (typeof window.redessinerToutesLesLignes === "function") {
                    window.redessinerToutesLesLignes();
                }

                // alert(`Configuration "${titreImported}" restaurée avec succès !`);
                
                if (modalGuide) {
					modalGuide.close();
				}

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
    
    // NOUVEAU : Récupération de la case à cocher pour la grille haute densité 16x8
    const chkHighDensityGrid = document.getElementById('chk-high-density-grid'); 

    if (gridOverlay && chkToggleGrid && poolTable) {
        
function genererGrille() {
    // Si la case haute densité est cochée, on utilise 16x8, sinon la grille 8x4 par défaut
    const mode16x8 = chkHighDensityGrid ? chkHighDensityGrid.checked : false;
    const cols = mode16x8 ? 16 : 8;
    const rows = mode16x8 ? 8 : 4;
    
    gridOverlay.style.position = 'absolute';
    gridOverlay.style.left = '19px';      
    gridOverlay.style.top = '17px';       
    gridOverlay.style.width = '754px';    
    gridOverlay.style.height = '364px';   
    gridOverlay.style.border = 'none';
    
    // On permet aux chiffres de déborder librement autour du cadre
    gridOverlay.style.overflow = 'visible'; 
    
    // ÉTAPE 1 : On force l'overlay global à passer au-dessus de la structure en bois et des poches
    gridOverlay.style.zIndex = '5'; 

    gridOverlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridOverlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    gridOverlay.innerHTML = '';
    gridOverlay.style.pointerEvents = 'none'; 
    
    const anciensDiamants = document.querySelectorAll('.diamond, .repere, [class*="diamond"]');
    anciensDiamants.forEach(d => {
        d.style.visibility = 'visible'; 
    });

    // 2. Génération des lignes de repère intérieures (Grille)
    for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.style.boxSizing = 'border-box';
        
        // Utilisation d'une opacité à 0.15 et ajout du mix-blend-mode pour fusionner avec le tapis
        if (c < cols - 1) {
            cell.style.borderRight = '1px dashed rgba(255, 255, 255, 0.15)';
        }
        if (r < rows - 1) {
            cell.style.borderBottom = '1px dashed rgba(255, 255, 255, 0.15)';
        }
        cell.style.mixBlendMode = 'overlay'; 

        gridOverlay.appendChild(cell);
    }
}

    // 3. Génération des chiffres sur les bandes (Toujours dans l'overlay de niveau 5)
    if (mode16x8) {
    const styleChiffreCommun = `
        position: absolute;
        color: rgba(255, 255, 255, 0.95);
        font-family: sans-serif;
        font-weight: bold;
        font-size: 11px; 
        transform: translate(-50%, -50%);
        z-index: 6; 
        /* Remplacement du noir uni par un anthracite élégant et semi-transparent */
        background-color: rgba(26, 26, 26, 0.85); 
        padding: 2px 5px;
        border-radius: 4px;
        /* Léger liseré pour détacher le chiffre du cadre en bois */
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    `;

    const pasX = 754 / cols; 
    const pasY = 364 / rows; 

    const valeursX = { 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13", 14: "14", 15: "15", 16: "16" };
    
    Object.keys(valeursX).forEach(index => {
        const indexGrilleX = parseInt(index, 10);
        const posX = indexGrilleX * pasX; 

        const labelBas = document.createElement('div');
        labelBas.style.cssText = styleChiffreCommun + `top: 364px; left: ${posX}px; margin-top: 32px;`;
        labelBas.innerText = valeursX[index];
        gridOverlay.appendChild(labelBas);
    });

    const valeursY = { 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8" };
    
    Object.keys(valeursY).forEach(index => {
        const indexGrilleY = parseInt(index, 10);
        const posY = (rows - indexGrilleY) * pasY; 

        const labelGauche = document.createElement('div');
        labelGauche.style.cssText = styleChiffreCommun + `top: ${posY}px; left: 0px; margin-left: -34px;`;
        labelGauche.innerText = valeursY[index];
        gridOverlay.appendChild(labelGauche);
    });
}

    // ====================================================================
    // ÉTAPE 2 : APPLIQUER LA PRIORITÉ AUX ANCIENS ÉLÉMENTS DE LA TABLE
    // ====================================================================
    // On recule la structure des poches et le tapis en arrière-plan (Niveau 0)
    if (poolTable) {
        poolTable.style.position = "relative";
        poolTable.style.zIndex = "0";
    }

    // On s'assure que toutes les billes restent tout en haut (Niveau 10)
    activeBalls.forEach(ball => {
        ball.style.position = "absolute";
        ball.style.zIndex = "10";
    });
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


// --- GESTION DU MASQUAGE DE LA SECTION COMPLETE (TITRE + TABLEAU) ---
const chkToggleBallsList = document.getElementById('chk-toggle-balls-list');
// On cible la barre latérale complète définie dans votre HTML
const ballsSidebar = document.getElementById('balls-sidebar'); 

if (chkToggleBallsList && ballsSidebar) {
    chkToggleBallsList.addEventListener('change', () => {
        if (chkToggleBallsList.checked) {
            // Restaure la disposition CSS d'origine (Flex/Grid) en colonnes sans la briser
            ballsSidebar.style.display = ""; 
        } else {
            // Masque l'ensemble du bloc (le titre H3 et le tableau inclus)
            ballsSidebar.style.display = 'none';
        }
    });
}











// ====================================================================
// GÉNÉRATION D'UNE SÉRIE DE SESSIONS AVEC NUMÉRO DE MATCH UNIQUE
// ====================================================================
const btnExportSerieAleatoire = document.getElementById('btn-export-serie-aleatoire');

if (btnExportSerieAleatoire) {
    btnExportSerieAleatoire.addEventListener('click', () => {
        // Initialisation de JSZip
        const zip = new JSZip();

        // Génère un code unique de 4 lettres majuscules (ex: JFTX)
        const matchUniqueId = Array.from({length: 4}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');

        // Création des deux sous-dossiers virtuels à la racine de l'archive
        const dossierJson = zip.folder("Configuration JSON");
        const dossierTxt = zip.folder("Positionnement TXT");

        // Le titre par défaut devient "Aleatoire progressif" si le champ input est vide
        const configTitle = "Aleatoire progressif";
        
        // Récupération de la description et du champ de description
        const descInput = document.getElementById('input-desc');
        const baseDesc = descInput ? descInput.value.trim() : "Série progressive générée aléatoirement.";

        // --- GÉNÉRATION DE L'HORODATAGE LISIBLE ---
        const maintenant = new Date();
        const annee = maintenant.getFullYear();
        const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
        const jour = String(maintenant.getDate()).padStart(2, '0');
        const heures = String(maintenant.getHours()).padStart(2, '0');
        const minutes = String(maintenant.getMinutes()).padStart(2, '0');
        const horodatage = `${jour}/${mois}/${annee} à ${heures}h${minutes}`;
        
        // INCLUSION DU NUMÉRO DE MATCH DANS LA DESCRIPTION GÉNÉRALE
        const configDesc = `${baseDesc}\nMatch unique N° : ${matchUniqueId}\nCréé le : ${horodatage}`;

        const chkToggleGrid = document.getElementById('chk-toggle-grid');
        const chkHighDensityGrid = document.getElementById('chk-high-density-grid');
        const chkShowTitle = document.getElementById('chk-show-title');
        const tableLogoOverlay = document.getElementById('table-logo-overlay');
        const rangeLogoSize = document.getElementById('range-logo-size');
		const chkToggleBallsList = document.getElementById('chk-toggle-balls-list');

        const gridLeft = 19;
        const gridTop = 17;
        const gridWidth = 754;
        const gridHeight = 364;
        const cols = 16;
        const rows = 8;
        const pasX = gridWidth / cols;  
        const pasY = gridHeight / rows; 

        // Sauvegarde temporaire de l'état du magnétisme de l'interface graphique
        const etatMagnetismeUI = chkMagnetism ? chkMagnetism.checked : false;

        // FORCE l'activation globale du magnétisme pour le calcul de l'export
        if (chkMagnetism) chkMagnetism.checked = true;

        // 1. On récupère l'élément HTML créé
        const inputNbManches = document.getElementById('input-nb-manches');

        // 2. À l'intérieur de l'événement 'click' du bouton, lisez sa valeur :
        const totalManchesSouhaitees = inputNbManches ? parseInt(inputNbManches.value, 10) : 10;

        // Récupération de la source du logo en priorité depuis la mémoire globale Base64, sinon depuis la balise image
        let logoAExporter = window.logoBase64Courant;
        if (!logoAExporter && tableLogoOverlay && tableLogoOverlay.src && !tableLogoOverlay.src.endsWith('logo.png')) {
            logoAExporter = tableLogoOverlay.src;
        }

        // 3. Modifiez la boucle pour qu'elle s'adapte dynamiquement
        for (let i = 2; i <= (totalManchesSouhaitees + 1); i++) {
            const nbBillesCouleurRequises = i - 1;
            
            // 1. Générer les intersections de la grille HD 16x8
            const intersectionsDisponibles = [];
            for (let c = 0; c <= cols; c++) {
                for (let r = 0; r <= rows; r++) {
                    let localCentreX = c * pasX;
                    let localCentreY = r * pasY;

                    if (c === 0) localCentreX = 12;
                    if (c === cols) localCentreX = gridWidth - 12;
                    if (r === 0) localCentreY = 12;
                    if (r === rows) localCentreY = gridHeight - 12;

                    const finalX = (gridLeft + localCentreX) - 12;
                    const finalY = (gridTop + localCentreY) - 12;

                    intersectionsDisponibles.push({ x: `${finalX}px`, y: `${finalY}px` });
                }
            }

            // 2. Mélanger les intersections (Fisher-Yates)
            for (let m = intersectionsDisponibles.length - 1; m > 0; m--) {
                const j = Math.floor(Math.random() * (m + 1));
                [intersectionsDisponibles[m], intersectionsDisponibles[j]] = [intersectionsDisponibles[j], intersectionsDisponibles[m]];
            }

            // 3. Choix des Zones ZD et ZA
            const listeIdsZones = Array.from({ length: 8 }, (v, k) => k + 1);
            for (let m = listeIdsZones.length - 1; m > 0; m--) {
                const j = Math.floor(Math.random() * (m + 1));
                [listeIdsZones[m], listeIdsZones[j]] = [listeIdsZones[j], listeIdsZones[m]];
            }

            const savedZdId = listeIdsZones.pop(); 
            const savedZaId = listeIdsZones.pop(); 

            const zonesDessinees = [
                { couleur: "#ffffff", estZoneGrille: true, zoneId: savedZdId, mode: 'standard', points: [] },
                { couleur: "#ffffff", estZoneGrille: true, zoneId: savedZaId, mode: 'alternatif', points: [] }
            ];

            // 4. Centrage de la bille Blanche dans la ZD
            const zoneCols = 4;
            const zonePasX = 754 / zoneCols; 
            const zonePasY = 364 / 2;        

            const idxZd = savedZdId - 1;
            const rZd = Math.floor(idxZd / zoneCols);
            const cZd = idxZd % zoneCols;

            const centreZoneX = (19 + (cZd * zonePasX)) + (zonePasX / 2);
            const centreZoneY = (18 + (rZd * zonePasY)) + (zonePasY / 2);

            const cueX = `${centreZoneX - 12}px`;
            const cueY = `${centreZoneY - 12}px`;

            // 5. Remplissage des données géométriques
            const listBillesExport = [];
            listBillesExport.push({ id: "0", x: cueX, y: cueY, visible: true });

            let intersectionIdx = 0;
            
            // Préparation de la structure du fichier TXT avec magnétisme actif
            let contenuTexte = `=== CONFIGURATION DE BILLARD ===\n`;
            contenuTexte += `Titre       : ${configTitle}_MATCH-${matchUniqueId}_manche_${String(nbBillesCouleurRequises).padStart(2, '0')}\n`;
            if (baseDesc) contenuTexte += `Description : ${baseDesc} (Match unique N° : ${matchUniqueId})\n`;
            contenuTexte += `Généré le   : ${horodatage}\n`;
            contenuTexte += `--------------------------------\n`;
            contenuTexte += `Positions des billes (Grille 16x8) :\n\n`;

            contenuTexte += `- Bille Blanche             : Zone de Départ = ZD${savedZdId}\n`;

            activeBalls.forEach(ball => {
                const ballId = parseInt(ball.getAttribute('data-id'), 10);
                
                if (ballId > 0) {
                    if (ballId <= nbBillesCouleurRequises) {
                        const posAleatoire = intersectionsDisponibles[intersectionIdx];
                        listBillesExport.push({
                            id: String(ballId),
                            x: posAleatoire.x,
                            y: posAleatoire.y,
                            visible: true
                        });

                        const numEl = ball.querySelector('.ball-num');
                        const numTexte = numEl ? numEl.innerText : String(ballId);
                        const estRayee = ball.classList.contains('striped');
                        const nomBille = `Bille N°${numTexte} (${estRayee ? 'Rayée' : 'Pleine'})`;

                        const pX = parseFloat(posAleatoire.x);
                        const pY = parseFloat(posAleatoire.y);
                        const coordsGrille = obtenirCoordonneesGrille(pX, pY, ball);

                        contenuTexte += `- ${nomBille.padEnd(25)} : X = ${coordsGrille.x.padStart(4)}, Y = ${coordsGrille.y.padStart(4)}\n`;

                        intersectionIdx++;
                    } else {
                        listBillesExport.push({
                            id: String(ballId),
                            x: ball.style.left || "0px",
                            y: ball.style.top || "0px",
                            visible: false
                        });
                    }
                }
            });

            contenuTexte += `\nTotal : ${nbBillesCouleurRequises + 1} billes présentes sur le tapis.\n`;
            
            contenuTexte += `--------------------------------\n`;
            contenuTexte += `Zones de jeu actives (Filtres tactiques) :\n\n`;
            contenuTexte += `- Code : ZD${savedZdId.toString().padEnd(3)} | Type : Zone Départ   \n`;
            contenuTexte += `- Code : ZA${savedZaId.toString().padEnd(3)} | Type : Zone Arrivée  \n`;
            contenuTexte += `\nTotal : 2 zone(s) affichée(s) sur la table.\n`;
            contenuTexte += `================================\n`;

            // CONFIGURATION INTÉGRANT DÉFINITIVEMENT LE LOGO DANS CHAQUE FICHIER DE L'ARCHIVE
            const donneesExport = {
                titre: `${configTitle}_MATCH-${matchUniqueId}_manche_${String(nbBillesCouleurRequises).padStart(2, '0')}`,
                description: configDesc,
                nombreBillesVisibles: String(i), 
                logoImageRaw: logoAExporter, // <--- AJOUT SÉCURISÉ ICI : Transmet la chaîne Base64
                billes: listBillesExport,
                lignesDessinees: zonesDessinees,
                optionsVisuelles: {

                    grille: chkToggleGrid ? chkToggleGrid.checked : true,
                    hd: chkHighDensityGrid ? chkHighDensityGrid.checked : true,
                    magnetisme: true,
                    logo: true,
                    titreVisible: chkShowTitle ? chkShowTitle.checked : false,
                    
                    couleurTapis: document.querySelector('input[name="felt-color"]:checked') ? document.querySelector('input[name="felt-color"]:checked').value : "bleu",
					// --- APPLIQUE LA PRÉFÉRENCE SUR TOUS LES FICHIERS DE LA SÉRIE ---
					listeBillesVisible: chkToggleBallsList ? chkToggleBallsList.checked : true

                }
            };

            const indexFichier = String(nbBillesCouleurRequises).padStart(2, '0');
            const nomFichierSecurise = configTitle.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 60);
            
            const nomFinalJson = `${nomFichierSecurise}_M${matchUniqueId}_manche_${indexFichier}.json`;
            const nomFinalTxt = `${nomFichierSecurise}_M${matchUniqueId}_manche_${indexFichier}.txt`;

            // Ajout des fichiers générés dans les sous-dossiers ZIP correspondants
            dossierJson.file(nomFinalJson, JSON.stringify(donneesExport, null, 4));
            dossierTxt.file(nomFinalTxt, contenuTexte);
        }

        // Restauration de l'état initial du magnétisme sur l'interface utilisateur
        if (chkMagnetism) chkMagnetism.checked = etatMagnetismeUI;

        // --- GÉNÉRATION ET TÉLÉCHARGEMENT DE L'ARCHIVE UNIQUE COMPLÉTÉE ---
        const anneeFichier = maintenant.getFullYear();
        const moisFichier = String(maintenant.getMonth() + 1).padStart(2, '0');
        const jourFichier = String(maintenant.getDate()).padStart(2, '0');
        const heuresFichier = String(maintenant.getHours()).padStart(2, '0');
        const minutesFichier = String(maintenant.getMinutes()).padStart(2, '0');
        const horodatageFichier = `${anneeFichier}${moisFichier}${jourFichier}_${heuresFichier}${minutesFichier}`;

        const nomArchiveFinale = `${horodatageFichier}_MATCH-${matchUniqueId}_SERIE_${totalManchesSouhaitees}_manches.zip`;

        zip.generateAsync({ type: "blob" }).then((content) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = nomArchiveFinale;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        });
    });
}


// 1. Définition d'une fonction globale ou locale d'application de couleur
function appliquerCouleurTapis(couleur) {
    const palette = palettesTapis[couleur];
    if (palette) {
        // Applique les variables CSS sur le :root
        Object.keys(palette).forEach(variable => {
            document.documentElement.style.setProperty(variable, palette[variable]);
        });
        
        // Coche le bon bouton radio dans l'interface
        const radioAcocher = document.querySelector(`input[name="felt-color"][value="${couleur}"]`);
        if (radioAcocher) {
            radioAcocher.checked = true;
        }
    }
}

// 2. FORCER L'INITIALISATION EN VERT AU CHARGEMENT DE LA PAGE
appliquerCouleurTapis("vert");



rafraichirListeLateraleBilles();


});
