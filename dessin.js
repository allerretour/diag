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

    // Variables pour suivre la position du curseur sur la table de billard
    let mouseX = 0;
    let mouseY = 0;

    // Suivi permanent de la souris pour positionner la cible au pixel près
    table.addEventListener('mousemove', (e) => {
        const rect = table.getBoundingClientRect();
        mouseX = Math.round(e.clientX - rect.left);
        mouseY = Math.round(e.clientY - rect.top);
    });

    // MODIFICATION : Ajout du paramètre "estPointille" pour configurer les pointillés
    function configurerStyleDessin(couleur, estPointille) {
        ctx.strokeStyle = couleur || (colorSelect ? colorSelect.value : '#ffffff');
        ctx.lineWidth = 3;           
        ctx.lineCap = 'round';       
        ctx.lineJoin = 'round';

        // Si la ligne doit être en pointillés, on définit un motif [longueur_trait, espace]
        // Sinon, on réinitialise le tableau de tirets à vide []
        if (estPointille) {
            ctx.setLineDash([4, 8]); 
        } else {
            ctx.setLineDash([]);
        }
    }

    // Dessine la pointe géométrique au bout d'une ligne standard
    function dessinerPointeFleche(fromX, fromY, toX, toY, couleur) {
        const arrowLength = 12; 
        const arrowAngle = Math.PI / 6; 
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.save(); // Sauvegarde pour isoler le style de la flèche
        ctx.setLineDash([]); // On force la flèche à rester pleine (esthétique)
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

    // Dessine une cible de 100x100 pixels centrée sur (x, y)
    function dessinerCible(x, y, couleur) {
        ctx.save();
        ctx.setLineDash([]); // Les cibles restent en lignes pleines
        ctx.strokeStyle = couleur;
        ctx.lineWidth = 2;

        // 1. Cercle extérieur (Rayon 50 -> Diamètre 100)
        ctx.beginPath();
        ctx.arc(x, y, 50, 0, 2 * Math.PI);
        ctx.stroke();

        // 2. Cercle intérieur (Rayon 25 -> Diamètre 50)
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, 2 * Math.PI);
        ctx.stroke();

        // 3. Ligne réticulaire horizontale (Déborde de 5px de chaque côté)
        ctx.beginPath();
        ctx.moveTo(x - 55, y);
        ctx.lineTo(x + 55, y);
        ctx.stroke();

        // 4. Ligne réticulaire verticale (Déborde de 5px de chaque côté)
        ctx.beginPath();
        ctx.moveTo(x, y - 55);
        ctx.lineTo(x, y + 55);
        ctx.stroke();

        ctx.restore();
    }
	
	// Dessine un carré de 150x150 pixels centré sur (x, y)
function dessinerCarre(x, y, couleur) {
    ctx.save();
    ctx.setLineDash([]); // Les carrés restent en lignes pleines
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2;

    // MODIFICATION : Taille passée de 200 à 150 pixels
    const taille = 150;
    const demiTaille = taille / 2;
    
    ctx.beginPath();
    ctx.rect(x - demiTaille, y - demiTaille, taille, taille);
    ctx.stroke();

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

     // --- LOGIQUE DE CLAVIER ET RACCOURCIS ---
    document.addEventListener('keydown', (e) => {
        // AJOUT : Si l'utilisateur est en train d'écrire dans un champ de texte, on ignore les raccourcis
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return; 
        }

        if (e.key === 'Shift') {
            isShiftPressed = true;
            canvas.style.pointerEvents = 'auto';
        }
        if (e.key === 'Control') {
            isCtrlPressed = true;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault(); 
            annulerDernierTrace();
        }

        // Interception du raccourci de la touche 'T' pour injecter une cible
        if (e.key.toLowerCase() === 't') {
            const couleurActive = colorSelect ? colorSelect.value : '#ffffff';

            const nouvelleCible = {
                couleur: couleurActive,
                estCible: true,
                points: [{ x: mouseX, y: mouseY }]
            };

            window.dessinsSauvegardes.push(nouvelleCible);
            window.redessinerToutesLesLignes();
        }
		
		// AJOUT : Interception du raccourci de la touche 'Z' (sans Ctrl) pour injecter un carré
    if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
        const couleurActive = colorSelect ? colorSelect.value : '#ffffff';

        const nouveauCarre = {
            couleur: couleurActive,
            estCarre: true,
            points: [{ x: mouseX, y: mouseY }]
        };

        window.dessinsSauvegardes.push(nouveauCarre);
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

    table.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            canvas.style.pointerEvents = 'auto';
            commencerDessin(e);
        }
    });

    function commencerDessin(e) {
        isDrawing = true;
        const rect = table.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        
        const couleurActive = colorSelect ? colorSelect.value : '#ffffff';
        // AJOUT : Vérification si le mode pointillé est actif au moment du clic
        const modeDashed = dashedCheck ? dashedCheck.checked : false;
        configurerStyleDessin(couleurActive, modeDashed);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        startPoint = { x, y }; 

        const activeCtrl = isCtrlPressed || e.ctrlKey;
        const activeShift = isShiftPressed || e.shiftKey;

        const forceLigneDroite = activeCtrl;
        const forceFleche = activeCtrl && activeShift;

        currentLine = {
            couleur: couleurActive,
            estDroite: forceLigneDroite, 
            avecFleche: forceFleche,
            estPointille: modeDashed, // AJOUT : On sauvegarde le style pour le rendu futur
            points: [{ x, y }]
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        if (e.shiftKey || e.button === 2) commencerDessin(e);
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
});