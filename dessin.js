// Variable globale pour stocker les lignes tracées
window.dessinsSauvegardes = [];

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const table = document.getElementById('pool-table');
    
    const colorSelect = document.getElementById('marker-color');
    const clearBtn = document.getElementById('btn-clear-lines');
    const undoBtn = document.getElementById('btn-undo-lines'); 

    let isDrawing = false;
    let currentLine = null; 
    let startPoint = null; 
    let isCtrlPressed = false;
    let isShiftPressed = false;

    function configurerStyleDessin(couleur) {
        ctx.strokeStyle = couleur || (colorSelect ? colorSelect.value : '#ffffff');
        ctx.lineWidth = 3;           
        ctx.lineCap = 'round';       
        ctx.lineJoin = 'round';
    }

    // Dessine la pointe géométrique au bout de la ligne
    function dessinerPointeFleche(fromX, fromY, toX, toY, couleur) {
        const arrowLength = 12; 
        const arrowAngle = Math.PI / 6; 
        const angle = Math.atan2(toY - fromY, toX - fromX);

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
    }

    function resizeCanvas() {
        canvas.width = table.clientWidth;
        canvas.height = table.clientHeight;
        configurerStyleDessin();
        window.redessinerToutesLesLignes(); 
    }
    window.addEventListener('resize', resizeCanvas);

    // Redessine l'ensemble des calques de dessin
    window.redessinerToutesLesLignes = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.dessinsSauvegardes.forEach(ligne => {
            if (ligne.points.length < 2) return;
            configurerStyleDessin(ligne.couleur);
            ctx.beginPath();
            ctx.moveTo(ligne.points[0].x, ligne.points[0].y);
            
            if (ligne.estDroite) {
                const dernierPoint = ligne.points[ligne.points.length - 1];
                ctx.lineTo(dernierPoint.x, dernierPoint.y);
                ctx.stroke();
                
                // Si la ligne a été enregistrée avec l'option flèche
                if (ligne.avecFleche) {
                    dessinerPointeFleche(ligne.points[0].x, ligne.points[0].y, dernierPoint.x, dernierPoint.y, ligne.couleur);
                }
            } else {
                for (let i = 1; i < ligne.points.length; i++) {
                    ctx.lineTo(ligne.points[i].x, ligne.points[i].y);
                }
                ctx.stroke();
            }
        });
        configurerStyleDessin(); 
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
        configurerStyleDessin(couleurActive);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        startPoint = { x, y }; 

        // Détermination du mode selon les combinaisons de touches enfoncées
        const activeCtrl = isCtrlPressed || e.ctrlKey;
        const activeShift = isShiftPressed || e.shiftKey;

        // Ctrl seul ou Ctrl+Shift forcent une ligne droite
        const forceLigneDroite = activeCtrl;
        // Il y a une flèche uniquement si Ctrl ET Shift sont actifs en même temps
        const forceFleche = activeCtrl && activeShift;

        currentLine = {
            couleur: couleurActive,
            estDroite: forceLigneDroite, 
            avecFleche: forceFleche,
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
            
            configurerStyleDessin(currentLine.couleur);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Rendu de la flèche en temps réel si l'option est active
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
