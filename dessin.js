// Variable globale pour stocker les lignes tracées
window.dessinsSauvegardes = [];

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const table = document.getElementById('pool-table');
    
    const colorSelect = document.getElementById('marker-color');
    const clearBtn = document.getElementById('btn-clear-lines');
    
    let isDrawing = false;
    let currentLine = null; // Ligne en cours de tracé

    function configurerStyleDessin(couleur) {
        ctx.strokeStyle = couleur || (colorSelect ? colorSelect.value : '#ffffff');
        ctx.lineWidth = 3;           
        ctx.lineCap = 'round';       
        ctx.lineJoin = 'round';
    }

    function resizeCanvas() {
        canvas.width = table.clientWidth;
        canvas.height = table.clientHeight;
        configurerStyleDessin();
        window.redessinerToutesLesLignes(); // Redessine si la fenêtre change de taille
    }
    window.addEventListener('resize', resizeCanvas);

    // Fonction globale pour redessiner tout le tableau depuis la mémoire
    window.redessinerToutesLesLignes = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.dessinsSauvegardes.forEach(ligne => {
            if (ligne.points.length < 2) return;
            configurerStyleDessin(ligne.couleur);
            ctx.beginPath();
            ctx.moveTo(ligne.points[0].x, ligne.points[0].y);
            for (let i = 1; i < ligne.points.length; i++) {
                ctx.lineTo(ligne.points[i].x, ligne.points[i].y);
            }
            ctx.stroke();
        });
        configurerStyleDessin(); // Remet la couleur active du sélecteur
    };

    if (colorSelect) {
        colorSelect.addEventListener('change', () => {
            ctx.strokeStyle = colorSelect.value;
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            window.dessinsSauvegardes = []; // Vide la mémoire
        });
    }

    // --- LOGIQUE DE TRACÉ ET CAPTURE DES POINTS ---
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') canvas.style.pointerEvents = 'auto';
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            canvas.style.pointerEvents = 'none';
            if (isDrawing) finTrace();
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
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const couleurActive = colorSelect ? colorSelect.value : '#ffffff';
        configurerStyleDessin(couleurActive);
        
        ctx.beginPath();
        ctx.moveTo(x, y);

        // Initialise la nouvelle ligne en mémoire
        currentLine = {
            couleur: couleurActive,
            points: [{ x: Math.round(x), y: Math.round(y) }]
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        if (e.shiftKey || e.button === 2) commencerDessin(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDrawing || !currentLine) return;

        const rect = table.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();

        // Ajoute le point actuel à la ligne
        currentLine.points.push({ x: Math.round(x), y: Math.round(y) });
    });

    function finTrace() {
        if (isDrawing && currentLine) {
            if (currentLine.points.length >= 2) {
                window.dessinsSauvegardes.push(currentLine); // Sauvegarde définitive de la ligne
            }
            isDrawing = false;
            currentLine = null;
        }
    }

    document.addEventListener('mouseup', () => {
        finTrace();
        canvas.style.pointerEvents = 'none';
    });

    table.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Premier allumage
    setTimeout(resizeCanvas, 100);
});
