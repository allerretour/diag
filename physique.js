
const table = document.getElementById('pool-table');
const ballDiameter = 24;
const activeBalls = [];

// Éléments UI pour le magnétisme et la grille
const chkMagnetism = document.getElementById('chk-magnetism');
const chkHighDensityGrid = document.getElementById('chk-high-density-grid');

function initialiserBilles() {
	if (!table) return;
	const ballsData = [];

	// Paramètres géométriques de la grille haute densité 16x8
	const gridLeft = 19;
	const gridTop = 17;
	const gridWidth = 754;
	const gridHeight = 364;
	const cols = 16;
	const rows = 8;

	const pasX = gridWidth / cols; // Espacement horizontal d'une cellule (~47.12px)
	const pasY = gridHeight / rows; // Espacement vertical d'une cellule (~45.5px)
	const rayonBille = 12; // Rayon pour le centrage CSS (24px / 2)

	// ====================================================================
	// 1. GÉNÉRATION DES COORDONNÉES SUR 2 LIGNES (A partir de X=1, Y=1)
	// ====================================================================
	// Nous avons 16 billes au total à placer (la blanche + 15 de couleur)
	// Elles occuperont les intersections de X=1 à X=8 sur les lignes Y=1 et Y=2
	const positionsGrille = [];

	for (let y = 1; y <= 2; y++) { // Ligne 1 puis Ligne 2
		for (let x = 1; x <= 8; x++) { // Colonnes de 1 à 8
			positionsGrille.push({
				gridX: x,
				gridY: y
			});
		}
	}

	// ====================================================================
	// 2. ASSIGNATION DES POSITIONS AUX BILLES
	// ====================================================================
	// Index 0 : Bille Blanche
	const posBlanche = positionsGrille[0];
	const cuePixelX = gridLeft + (posBlanche.gridX * pasX) - rayonBille;
	const cuePixelY = gridTop + ((rows - posBlanche.gridY) * pasY) - rayonBille;
	ballsData.push({
		id: 0,
		num: '',
		color: '#ffffff',
		isStriped: false,
		x: cuePixelX,
		y: cuePixelY
	});

	// Index 1 à 15 : Billes de couleur
	for (let i = 1; i <= 15; i++) {
		const colorIndex = i <= 8 ? i : i - 8;
		const color = ballColors[colorIndex];
		const isStriped = i > 8;

		// Récupération de la position pré-calculée suivante (index i)
		const pos = positionsGrille[i];

		// Conversion en pixels Top/Left (Origine inversée pour Y pour correspondre au bas-gauche)
		const ballPixelX = gridLeft + (pos.gridX * pasX) - rayonBille;
		const ballPixelY = gridTop + ((rows - pos.gridY) * pasY) - rayonBille;

		ballsData.push({
			id: i,
			num: i,
			color: color,
			isStriped: isStriped,
			x: ballPixelX,
			y: ballPixelY
		});
	}

	// ====================================================================
	// 3. INJECTION ET CRÉATION DES ÉLÉMENTS HTML
	// ====================================================================
	ballsData.forEach(b => {
		const ballEl = document.createElement('div');
		ballEl.classList.add('ball');
		ballEl.style.setProperty('--ball-color', b.color);

		if (b.isStriped) ballEl.classList.add('striped');

		ballEl.setAttribute('data-id', b.id);
		ballEl.style.backgroundColor = b.color;
		ballEl.style.left = b.x + 'px';
		ballEl.style.top = b.y + 'px';

		if (b.num !== '') {
			const numEl = document.createElement('div');
			numEl.classList.add('ball-num');
			numEl.innerText = b.num;
			ballEl.appendChild(numEl);
		}

		table.appendChild(ballEl);
		activeBalls.push(ballEl);
		makeDraggable(ballEl);

		ballEl.addEventListener('dblclick', function() {
    // [CORRECTIF SÉCURITÉ] : Bloque instantanément la suppression si le mode visualisateur (lecture seule) est actif
    if (window.isViewMode) {
        return;
    }

    // --- SÉCURITÉ DE DOUBLE-CLIC SUR TAPIS ---
    const ballId = this.getAttribute('data-id');
    if (window.billesVerrouillees && window.billesVerrouillees.has(ballId)) {
        return; // Ignore l'action et laisse la bille visible si elle est verrouillée
    }
            
    this.style.display = 'none';
    const displayEl = document.getElementById('ball-position-display');
    if (displayEl) {
        displayEl.innerText = "Position de la bille : Aucune sélectionnée";
    }
    rafraichirListeLateraleBilles();
	});

	});
}

function clampPosition(x, y) {
	let minX = 17.6,
		maxX = 749,
		minY = 17.6,
		maxY = 356;
	const pocketSize = 34;

	if (x >= 364 && x <= 408) {
		minY = -10;
		maxY = 382;
	} else if (x < pocketSize && y < pocketSize) {
		minX = -10;
		minY = -10;
	} else if (x < pocketSize && y > 400 - pocketSize - 24) {
		minX = -10;
		maxY = 382;
	} else if (x > 800 - pocketSize - 24 && y < pocketSize) {
		maxX = 782;
		minY = -10;
	} else if (x > 800 - pocketSize - 24 && y > 400 - pocketSize - 24) {
		maxX = 782;
		maxY = 382;
	} else {
		minX = 17.6;
		maxX = 749;
		minY = 17.6;
		maxY = 356;
	}

	if (x < minX) x = minX;
	if (x > maxX) x = maxX;
	if (y < minY) y = minY;
	if (y > maxY) y = maxY;

	return {
		x,
		y
	};
}

/**
 * Calcule la position magnétique alignée sur les lignes de la grille
 * en centrant le milieu de la bille sur les intersections.
 * Empêche le débordement sur les lignes de contour en repoussant la bille vers l'intérieur.
 */
function calculerSnapGrille(x, y, element, estDessin = false) {
	// Si le magnétisme existe et qu'elle est décochée, on n'applique aucun filtre
	if (chkMagnetism && !chkMagnetism.checked) {
		return {
			x,
			y
		};
	}

	// Vraies dimensions du tapis de jeu (Source 1 & 2)
	const gridLeft = 19;
	const gridTop = 17;
	const gridWidth = 754;
	const gridHeight = 364;

	const modeHD = chkHighDensityGrid ? chkHighDensityGrid.checked : false;
	const cols = modeHD ? 16 : 8;
	const rows = modeHD ? 8 : 4;

	const pasX = gridWidth / cols;
	const pasY = gridHeight / rows;

	// Calcul du rayon de la bille (utilise sa taille réelle ou 12px par défaut)
	const rayonBille = element ? element.offsetWidth / 2 : 12;

	// 1. Coordonnées théoriques du CENTRE de la bille
	const centreX = x + rayonBille;
	const centreY = y + rayonBille;

	// 2. Position locale par rapport à la grille de jeu
	const localCentreX = centreX - gridLeft;
	const localCentreY = centreY - gridTop;

	// 3. Magnétisme du CENTRE sur l'intersection la plus proche
	let snappedLocalCentreX = Math.round(localCentreX / pasX) * pasX;
	let snappedLocalCentreY = Math.round(localCentreY / pasY) * pasY;

	// 4. MODIFICATION : Appliquer le bridage uniquement s'il ne s'agit pas d'un dessin de ligne
	if (!estDessin) {
		if (snappedLocalCentreX <= 0) {
			snappedLocalCentreX = rayonBille;
		} else if (snappedLocalCentreX >= gridWidth) {
			snappedLocalCentreX = gridWidth - rayonBille;
		}

		if (snappedLocalCentreY <= 0) {
			snappedLocalCentreY = rayonBille;
		} else if (snappedLocalCentreY >= gridHeight) {
			snappedLocalCentreY = gridHeight - rayonBille;
		}
	}

	// 5. Reconvertir en coordonnées CSS de positionnement
	const finalX = (gridLeft + snappedLocalCentreX) - rayonBille;
	const finalY = (gridTop + snappedLocalCentreY) - rayonBille;

	return {
		x: finalX,
		y: finalY
	};
}

function resolveCollisions(currentBall) {
	let currentX = parseFloat(currentBall.style.left);
	let currentY = parseFloat(currentBall.style.top);
	let collisionDetected = true;
	let iterations = 0;

	while (collisionDetected && iterations < 20) {
		collisionDetected = false;

		for (let otherBall of activeBalls) {
			// === SÉCURITÉ ULTRA-RAPIDE : Évite les accès au DOM inutiles ===
			if (otherBall.style.display === 'none' || otherBall === currentBall) continue;

			let otherX = parseFloat(otherBall.style.left);
			let otherY = parseFloat(otherBall.style.top);
			let dx = currentX - otherX;
			let dy = currentY - otherY;
			let distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < ballDiameter) {
				collisionDetected = true;
				if (distance === 0) {
					dx = 1;
					dy = 0;
					distance = 1;
				}

				let overlap = ballDiameter - distance;
				currentX += (dx / distance) * overlap;
				currentY += (dy / distance) * overlap;
			}
		}
		iterations++;
	}

	const clamped = clampPosition(currentX, currentY);
	const finalPos = calculerSnapGrille(clamped.x, clamped.y, currentBall);

	currentBall.style.left = finalPos.x + 'px';
	currentBall.style.top = finalPos.y + 'px';

	return finalPos;
}

function makeDraggable(element) {
	let currentX, currentY, initialX, initialY;
	let isDragging = false;

	element.addEventListener('mousedown', dragStart);
	element.addEventListener('touchstart', dragStart, {
		passive: true
	});
	document.addEventListener('mousemove', drag);
	document.addEventListener('touchmove', drag, {
		passive: false
	});
	document.addEventListener('mouseup', dragEnd);
	document.addEventListener('touchend', dragEnd);

	function dragStart(e) {
		if (element.style.display === 'none') return;

                // NOUVEAU : Sécurité mode visualisateur
    		if (window.isViewMode) {
        		return; // Bloque instantanément toute tentative de déplacement
   		 }

		
		// --- NOUVEAU : SÉCURITÉ DE VERROUILLAGE DE POSITION ---
		const ballId = element.getAttribute('data-id');
		if (window.billesVerrouillees.has(ballId)) {
			return; // Bloque instantanément le glissement si la bille est verrouillée
		}
		
		// --- SÉCURITÉ ANTICORRUPTION : BLOQUE LE GLISSEMENT DES BILLES SI UN OUTIL EST ACTIF ---
		if (window.outilTraceActif !== "select") {
			return; // Bloque instantanément le drag-and-drop si on est en mode dessin (crayon, ligne, flèche, gomme...)
		}

		const xOffset = parseInt(element.style.left) || 0;
		const yOffset = parseInt(element.style.top) || 0;

		if (e.type === 'touchstart') {
			initialX = e.touches[0].clientX - xOffset;
			initialY = e.touches[0].clientY - yOffset;
		} else {
			initialX = e.clientX - xOffset;
			initialY = e.clientY - yOffset;
		}

		if (e.target === element || element.contains(e.target)) {
			isDragging = true;

			// ====================================================================
			// CORRECTION DU BLOCAGE : NETTOYAGE AGRESSIF DE TOUS LES OUTLINES
			// ====================================================================
			// Supprime l'outline de la variable mémorisée
			if (window.billeSelectionneeCourante) {
				window.billeSelectionneeCourante.style.outline = 'none';
				window.billeSelectionneeCourante.style.outlineOffset = '';
			}

			// Sécurité subsidiaire : Nettoie graphiquement toutes les billes du tapis
			// pour éliminer les contours résiduels laissés par l'ouverture du picker
			if (Array.isArray(activeBalls)) {
				activeBalls.forEach(b => {
					b.style.outline = 'none';
					b.style.outlineOffset = '';
				});
			}

			// Mémorise la nouvelle bille sélectionnée
			window.billeSelectionneeCourante = element;

			// Applique le nouveau repère visuel actif
			element.style.outline = '2px solid #ffffff';
			element.style.outlineOffset = '2px';

			// Mettre à jour l'affichage et synchroniser la couleur de la palette
			mettreAJourAffichagePosition(element, xOffset, yOffset);

			if (typeof rafraichirTexteBoutonsPalette === "function") {
				rafraichirTexteBoutonsPalette();
			}
		}
	}

	function drag(e) {
		if (isDragging) {
			if (e.cancelable) e.preventDefault();
			if (e.type === 'touchmove') {
				currentX = e.touches[0].clientX - initialX;
				currentY = e.touches[0].clientY - initialY;
			} else {
				currentX = e.clientX - initialX;
				currentY = e.clientY - initialY;
			}

			const clamped = clampPosition(currentX, currentY);
			const finalPos = calculerSnapGrille(clamped.x, clamped.y, element);

			element.style.left = finalPos.x + 'px';
			element.style.top = finalPos.y + 'px';

			resolveCollisions(element);

			// ÉTAPE B : Mettre à jour l'affichage en temps réel pendant le déplacement
			mettreAJourAffichagePosition(element, finalPos.x, finalPos.y);
			rafraichirListeLateraleBilles();
		}
	}

		function dragEnd() {
		if (isDragging) {
			const finalPos = resolveCollisions(element);
			isDragging = false;

			// === APPLICATION DU FADEOUT SUR LE BADGE FLOUTANT (SOURIS / TACTILE) ===
			const badge = document.getElementById('ball-drag-live-badge');
			if (badge) {
				// Utilise la même logique de délai (400ms) et de fondu (300ms)
				setTimeout(() => {
					// On vérifie que l'utilisateur n'a pas repris un drag entre-temps
					if (!isDragging && document.getElementById('ball-drag-live-badge') === badge) {
						badge.style.transition = "opacity 0.3s ease";
						badge.style.opacity = "0";

						setTimeout(() => {
							if (badge.style.opacity === "0") {
								badge.remove();
							}
						}, 300);
					}
				}, 400);
			}

			// 2. MISE À JOUR SILENCIEUSE DES COORDONNÉES INTERNES
			rafraichirListeLateraleBilles();
		}
	}




}

// --- GESTION DE L'AFFICHAGE DU TITRE SUR LE TAPIS ---
const chkShowTitle = document.getElementById('chk-show-title');
const tableTitleOverlay = document.getElementById('table-title-overlay');
const titleInput = document.getElementById('input-title');

function rafraichirTitreSurTapis() {
	if (!tableTitleOverlay) return;

	const texteTitre = titleInput ? titleInput.value.trim() : "";
	tableTitleOverlay.innerText = texteTitre;

	if (chkShowTitle && chkShowTitle.checked && texteTitre !== "") {
		tableTitleOverlay.style.position = 'absolute';
		
		// --- ALIGNEMENT À GAUCHE : Aligné sur le début utile du tapis (19px) ---
		tableTitleOverlay.style.left = '19px';
		tableTitleOverlay.style.top = '-12px'; 
		tableTitleOverlay.style.transform = 'none'; // Supprime le décalage de centrage antérieur
		
		// Largeur élastique en fonction du texte
		tableTitleOverlay.style.width = 'max-content';
		tableTitleOverlay.style.whiteSpace = 'nowrap';
		
		// Style du badge
		tableTitleOverlay.style.backgroundColor = 'rgba(26, 26, 26, 0.75)';
		tableTitleOverlay.style.padding = '2px 10px';
		tableTitleOverlay.style.borderRadius = '4px';
		tableTitleOverlay.style.border = '1px solid rgba(255, 255, 255, 0.1)';
		tableTitleOverlay.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.4)';
		tableTitleOverlay.style.margin = '0';
		
		// Typographie
		tableTitleOverlay.style.zIndex = '6'; 
		tableTitleOverlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';
		tableTitleOverlay.style.fontWeight = 'bold';
		tableTitleOverlay.style.fontSize = '11px';
		tableTitleOverlay.style.textTransform = 'uppercase';
		tableTitleOverlay.style.letterSpacing = '0.5px';
		tableTitleOverlay.style.color = 'rgba(255, 255, 255, 0.95)';
		tableTitleOverlay.style.textShadow = 'none';
		
		tableTitleOverlay.style.display = 'block';
	} else {
		tableTitleOverlay.style.display = 'none';
	}
}

if (chkShowTitle && tableTitleOverlay) {
	chkShowTitle.addEventListener('change', rafraichirTitreSurTapis);
	if (titleInput) {
		titleInput.addEventListener('input', rafraichirTitreSurTapis);
	}
}

function rafraichirListeLateraleBilles() {
	const sidebarList = document.getElementById('visible-balls-list');
	if (!sidebarList) return;

	const fragment = document.createDocumentFragment();

	// --- [NOUVEAU] RÉCUPÉRATION DU NOMBRE MAXIMUM DE BILLES AUTORISÉES PAR LE JEU ---
	const ballsCountSelect = document.getElementById('select-balls-count');
	let maxBallsAllowed = 15; // Valeur par défaut
	if (ballsCountSelect) {
		const value = ballsCountSelect.value;
		maxBallsAllowed = (value === "14.1") ? 15 : parseInt(value, 10);
	}

	activeBalls.forEach(ball => {
		const ballId = parseInt(ball.getAttribute('data-id'), 10);
		const numEl = ball.querySelector('.ball-num');
		const estRayee = ball.classList.contains('striped');
		const couleurBille = ball.style.backgroundColor;
		
		// --- [NOUVEAU] CLASSIFICATION STRICTE DES DEUX ÉTATS DE VISIBILITÉ ---
		// 1. Est-ce que la bille appartient au mode de jeu sélectionné ?
		const appartientAuJeuChoisi = (ballId === 0 || ballId <= maxBallsAllowed);
		
		// 2. Si elle appartient au jeu, a-t-elle été masquée manuellement par l'utilisateur ?
		const estEnleveeManuellement = appartientAuJeuChoisi && ball.style.display === 'none';

		// SÉCURITÉ : Si la bille n'appartient pas du tout au jeu choisi, on l'ignore (Hiding total)
		if (!appartientAuJeuChoisi) {
			return; 
		}

		const itemRow = document.createElement('div');
		itemRow.classList.add('sidebar-ball-item');
		
		itemRow.style.cursor = window.isViewMode ? 'default' : 'pointer';
		itemRow.style.position = 'relative';
		
		itemRow.style.webkitUserSelect = "none";  
		itemRow.style.userSelect = "none";        
		itemRow.style.webkitTouchCallout = "none"; 

		// Highlight actif uniquement si la bille n'est pas enlevée
		if (window.billeSelectionneeCourante === ball && !estEnleveeManuellement) {
			itemRow.classList.add('active-highlight');
		}

		// Conserve la classe pour appliquer le style grisé du CSS existant
		if (estEnleveeManuellement) {
			itemRow.classList.add('is-hidden-ball');
		}
		
		const estVerrouillee = window.billesVerrouillees.has(String(ballId));
		if (estVerrouillee) {
			itemRow.style.opacity = "0.85";
			itemRow.style.borderLeft = "3px solid #e74c3c"; 
		}

		// --- LOGIQUE TACTILE AVANCÉE POUR IPAD ---
		let timerAppuiLong = null;
		let appuiLongDeclenche = false;

		const alternerVerrouillage = (e) => {
			if (timerAppuiLong) { clearTimeout(timerAppuiLong); timerAppuiLong = null; }
			if (window.timersSelectionBilles[ballId]) { clearTimeout(window.timersSelectionBilles[ballId]); delete window.timersSelectionBilles[ballId]; }
			
			e.stopPropagation();
			e.preventDefault();
			
			if (window.isViewMode || estEnleveeManuellement) return;

			if (window.billesVerrouillees.has(String(ballId))) {
				window.billesVerrouillees.delete(String(ballId));
			} else {
				window.billesVerrouillees.add(String(ballId));
				if (window.billeSelectionneeCourante === ball) {
					ball.style.outline = 'none';
					window.billeSelectionneeCourante = null;
				}
			}
			rafraichirListeLateraleBilles();
		};

		const executerMasquageBille = () => {
			if (window.isViewMode || window.billesVerrouillees.has(String(ballId))) return; 
			
			ball.style.display = 'none';
			if (window.billeSelectionneeCourante === ball) {
				ball.style.outline = 'none';
				window.billeSelectionneeCourante = null;
				const displayEl = document.getElementById('ball-position-display');
				if (displayEl) displayEl.innerText = "Position de la bille : Aucune sélectionnée";
			}
			rafraichirListeLateraleBilles();
		};

		const executerSelectionBille = () => {
			if (window.isViewMode) return;

			if (ball.style.display === 'none') {
				ball.style.display = 'flex';
				if (window.billeSelectionneeCourante) window.billeSelectionneeCourante.style.outline = 'none';
				window.billeSelectionneeCourante = ball;
				if (!estVerrouillee) {
					ball.style.outline = '2px solid #ffffff';
					ball.style.outlineOffset = '2px';
				}
			} else {
				if (window.billeSelectionneeCourante) window.billeSelectionneeCourante.style.outline = 'none';
				window.billeSelectionneeCourante = ball;
				if (!estVerrouillee) {
					ball.style.outline = '2px solid #ffffff';
					ball.style.outlineOffset = '2px';
				}
			}
			rafraichirListeLateraleBilles();

			if (typeof rafraichirTexteBoutonsPalette === "function") {
				rafraichirTexteBoutonsPalette();
			}
		};

		// 1. PC : Clic droit
		itemRow.addEventListener('contextmenu', alternerVerrouillage);

		// 2. iPad : Touchstart
		itemRow.addEventListener('touchstart', (e) => {
			appuiLongDeclenche = false;
			timerAppuiLong = setTimeout(() => {
				alternerVerrouillage(e);
				appuiLongDeclenche = true;
				timerAppuiLong = null;
			}, 600);
		}, { passive: true });

		itemRow.addEventListener('touchend', (e) => {
			if (timerAppuiLong) {
				clearTimeout(timerAppuiLong);
				timerAppuiLong = null;
			}
			
			if (!appuiLongDeclenche) {
				e.preventDefault();
				e.stopPropagation();
				
				const tempsActuel = new Date().getTime();
				const dernierTap = window.historiqueTapsBilles[ballId] || 0;
				const intervalle = tempsActuel - dernierTap;
				
				window.historiqueTapsBilles[ballId] = tempsActuel;

				if (intervalle > 40 && intervalle < 300) {
					if (window.timersSelectionBilles[ballId]) {
						clearTimeout(window.timersSelectionBilles[ballId]);
						delete window.timersSelectionBilles[ballId];
					}
					executerMasquageBille();
				} else {
					if (window.timersSelectionBilles[ballId]) clearTimeout(window.timersSelectionBilles[ballId]);
					
					window.timersSelectionBilles[ballId] = setTimeout(() => {
						executerSelectionBille();
						delete window.timersSelectionBilles[ballId];
					}, 200);
				}
			}
		});

		// 3. PC : Événements Souris classiques
		itemRow.addEventListener('click', (e) => {
			e.stopPropagation();
			executerSelectionBille();
		});

		itemRow.addEventListener('dblclick', (e) => {
			e.stopPropagation();
			executerMasquageBille();
		});

		// --- RENDU GRAPHIQUE ---
		const miniBall = document.createElement('div');
		miniBall.classList.add('ball');
		miniBall.style.backgroundColor = couleurBille;
		miniBall.style.setProperty('--ball-color', couleurBille);

		if (estRayee) miniBall.classList.add('striped');

		if (ballId !== 0 && numEl) {
			const miniNum = document.createElement('div');
			miniNum.classList.add('ball-num');
			miniNum.innerText = numEl.innerText;
			miniBall.appendChild(miniNum);
		}

		const pixelX = parseFloat(ball.style.left) || 0;
		const pixelY = parseFloat(ball.style.top) || 0;
		const coords = obtenirCoordonneesGrille(pixelX, pixelY, ball);

		const coordsText = document.createElement('div');
		coordsText.classList.add('sidebar-ball-coords');

		// Affichage différencié selon le statut d'enlèvement manuel
		if (estEnleveeManuellement) {
			coordsText.innerHTML = `<span style="font-style: italic; opacity: 0.6;">(enlevée)</span>`;
		} else {
			coordsText.innerHTML = `X = ${coords.x}, Y = ${coords.y}`;
		}

		itemRow.appendChild(miniBall);
		itemRow.appendChild(coordsText);
		
		if (estVerrouillee) {
			const lockIcon = document.createElement('span');
			lockIcon.innerText = "🔒";
			lockIcon.style.cssText = `
				position: absolute;
				right: 1px;
				top: 20%;
				transform: translateY(-50%);
				font-size: 12px;
			`;
			itemRow.appendChild(lockIcon);
		}

		fragment.appendChild(itemRow);
	});

	const btnToggleLockAll = document.getElementById('btn-toggle-lock-all');
	if (btnToggleLockAll && window.billesVerrouillees) {
		const billesVisibles = activeBalls.filter(ball => ball.style.display !== 'none');
		const aAuMoinsUneBilleBloquee = billesVisibles.some(ball => window.billesVerrouillees.has(ball.getAttribute('data-id')));

		if (aAuMoinsUneBilleBloquee) {
			btnToggleLockAll.innerText = "🔒 Tout Débloquer";
		} else {
			btnToggleLockAll.innerText = "🔓 Tout Bloquer";
		}
		
		if (window.isViewMode) {
			btnToggleLockAll.style.display = 'none';
		}
	}

	sidebarList.innerHTML = ""; 
	sidebarList.appendChild(fragment); 
}



function obtenirCoordonneesGrille(x, y, element) {
	// Repères géométriques identiques à la grille et au magnétisme
	const gridLeft = 19;
	const gridTop = 17;
	const gridWidth = 754;
	const gridHeight = 364;

	const cols = 16;
	const rows = 8;

	const rayonBille = element ? element.offsetWidth / 2 : 12;

	// Position du CENTRE de la bille
	const centreX = x + rayonBille;
	const centreY = y + rayonBille;

	// Calcul du ratio de position (0 à 1) à l'intérieur de la zone utile
	const ratioX = (centreX - gridLeft) / gridWidth;
	const ratioY = (centreY - gridTop) / gridHeight;

	// Transformation en index de grille brut
	let grilleX = ratioX * cols;
	let grilleY = (1 - ratioY) * rows; // Inversion pour avoir l'origine (0,0) en bas à gauche

	// Bornage strict pour rester dans la grille
	grilleX = Math.max(0, Math.min(cols, grilleX));
	grilleY = Math.max(0, Math.min(rows, grilleY));

	// Vérification de l'activation du magnétisme
	const magnetismeActif = chkMagnetism ? chkMagnetism.checked : false;

	let nbDecimalesX = 1;
	let nbDecimalesY = 1;

	// --- CONDITION : S'applique UNIQUEMENT si le magnétisme est activé ---
	if (magnetismeActif) {
		const tolerance = 0.4; // Seuil pour capter le contact avec la bande

		// Traitement de l'axe X aux extrémités
		if (grilleX <= tolerance) {
			grilleX = 0;
			nbDecimalesX = 0;
		} else if (grilleX >= cols - tolerance) {
			grilleX = cols;
			nbDecimalesX = 0;
		}

		// Traitement de l'axe Y aux extrémités
		if (grilleY <= tolerance) {
			grilleY = 0;
			nbDecimalesY = 0;
		} else if (grilleY >= rows - tolerance) {
			grilleY = rows;
			nbDecimalesY = 0;
		}
	}

	return {
		x: grilleX.toFixed(nbDecimalesX),
		y: grilleY.toFixed(nbDecimalesY)
	};
}

/**
 * Met à jour l'affichage UI et positionne un badge flottant
 * juste au-dessus de la bille en cours de déplacement.
 */
function mettreAJourAffichagePosition(element, x, y) {
	// 1. Mise à jour optionnelle de l'élément de texte classique sous le tapis
	const displayEl = document.getElementById('ball-position-display');
	if (displayEl) {
		displayEl.innerHTML = "";
		displayEl.style.display = "none";
	}

	const table = document.getElementById('pool-table');
	if (!table) return;

	// 2. Récupération des coordonnées sur la grille 16x8
	const coords = obtenirCoordonneesGrille(x, y, element);

	// 3. Gestion du badge flottant unique dans le tapis de jeu
	let badgeFlottant = document.getElementById('ball-drag-live-badge');
	if (!badgeFlottant) {
		badgeFlottant = document.createElement('div');
		badgeFlottant.id = 'ball-drag-live-badge';
		
		// Styles graphiques avancés pour un rendu moderne, contrasté et lisible
		badgeFlottant.style.cssText = `
			position: absolute;
			background-color: rgba(11, 15, 23, 0.92);
			color: #ffffff;
			font-family: system-ui, -apple-system, sans-serif;
			font-weight: bold;
			font-size: 11px;
			padding: 3px 7px;
			border-radius: 4px;
			border: 1px solid rgba(255, 255, 255, 0.2);
			box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
			pointer-events: none; /* Évite les micro-saccades sous le curseur */
			white-space: nowrap;
			z-index: 1000; /* Passe au-dessus des autres billes et de la grille */
			transform: translate(-50%, -100%); /* Centre le badge horizontalement */
		`;
		table.appendChild(badgeFlottant);
	}

	// 4. Calcul de la position physique du badge (Centré horizontalement, 12px au-dessus de la bille)
	// element.offsetWidth correspond au diamètre (24px), le milieu est donc à x + 12px
	const centreBilleX = x + (element.offsetWidth / 2);
	const positionBadgeY = y - 12;

	// 5. Injection de la position CSS et du texte rafraîchi
	badgeFlottant.style.left = centreBilleX + 'px';
	badgeFlottant.style.top = positionBadgeY + 'px';
	badgeFlottant.innerText = `${coords.x} ; ${coords.y}`;
}




// --- OUTILS DE SÉLECTION / COLLISION ---

// Vérifie si le clic est proche d'un point (Cible, Carré, Effet, Repère)
function estProchePoint(clicX, clicY, pointX, pointY, tolerance = 15) {
	const dx = clicX - pointX;
	const dy = clicY - pointY;
	return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

// Vérifie si le clic est proche d'un segment de droite (Lignes et Flèches)
function estProcheLigne(clicX, clicY, p1, p2, tolerance = 5) {
	const A = clicX - p1.x;
	const B = clicY - p1.y;
	const C = p2.x - p1.x;
	const D = p2.y - p1.y;

	const dot = A * C + B * D;
	const lenSq = C * C + D * D;
	let param = -1;

	if (lenSq !== 0) param = dot / lenSq;

	let xx, yy;

	if (param < 0) {
		xx = p1.x;
		yy = p1.y;
	} else if (param > 1) {
		xx = p2.x;
		yy = p2.y;
	} else {
		xx = p1.x + param * C;
		yy = p1.y + param * D;
	}

	const dx = clicX - xx;
	const dy = clicY - yy;
	return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

window.detecterEtEffacerDessin = function(clicX, clicY) {
	for (let i = window.dessinsSauvegardes.length - 1; i >= 0; i--) {
		const dessin = window.dessinsSauvegardes[i];

		// 1. Cas des formes ponctuelles standards
		if (dessin.estCible || dessin.estCarre || dessin.estEffetBlanche || dessin.estRepereX) {
			if (dessin.points) {
				const pt = Array.isArray(dessin.points) ? dessin.points[0] : dessin.points;
				if (pt && estProchePoint(clicX, clicY, pt.x, pt.y, 30)) {
					window.dessinsSauvegardes.splice(i, 1);
					window.redessinerToutesLesLignes();
					return true;
				}
			}
		}

		// 2. CAS SPÉCIFIQUE : Point de Contact (Détection centrée sur le grand panneau visuel)
		else if (dessin.estPointContact) {
			if (dessin.points) {
				const pt = Array.isArray(dessin.points) ? dessin.points[0] : dessin.points;
				// Détection standard basée sur le centre parfait du panneau
				if (pt && estProchePoint(clicX, clicY, pt.x, pt.y, 45)) {
					window.dessinsSauvegardes.splice(i, 1);
					window.redessinerToutesLesLignes();
					return true;
				}
			}
		} else if (dessin.estDroite && dessin.points.length >= 2) {
			if (estProcheLigne(clicX, clicY, dessin.points[0], dessin.points[dessin.points.length - 1], 6)) {
				window.dessinsSauvegardes.splice(i, 1);
				window.redessinerToutesLesLignes();
				return true;
			}
		} else if (dessin.points && dessin.points.length >= 2) {
			for (let j = 0; j < dessin.points.length - 1; j++) {
				if (estProcheLigne(clicX, clicY, dessin.points[j], dessin.points[j + 1], 6)) {
					window.dessinsSauvegardes.splice(i, 1);
					window.redessinerToutesLesLignes();
					return true;
				}
			}
		}
	}
	return false;
};



function appliquerRestrictionsModeVue() {
    if (!window.isViewMode) {
        console.log("✏️ Mode Édition Actif.");
        return;
    }

    console.log("👁️ Mode Visualisateur Actif (Par défaut) : Verrouillage des commandes.");

    // 1. Liste exhaustive de vos composants d'édition à masquer
    const elementsAMasquer = [
        'drawing-tools-palette',
        'btn-toggle-palette',
        'modal-options',
        'btn-ouvrir-options',
        'btn-ouvrir-guide',
        'btn-export',
        'btn-export-text',
        'btn-export-serie-aleatoire'
        
    ];

    elementsAMasquer.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Masquer les boutons de contrôles de la palette et boutons d'actions
    document.querySelectorAll('.tool-btn, .config-actions, #input-title, #input-desc, #btn-toggle-notes, #btn-reset-logo, #input-logo-file').forEach(el => {
        el.style.display = 'none';
    });

    // 2. Garantir que la zone de notes textuelle reste visible pour lire les instructions tactiques
    const notesPanel = document.getElementById('tactical-notes-area');
    if (notesPanel) {
        notesPanel.style.display = 'block';
        const btnShowNotes = document.getElementById('btn-show-notes');
        if (btnShowNotes) btnShowNotes.style.display = 'none';
    }

    // 3. Verrouiller le canvas pour interdire le dessin libre au pointeur
    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
        canvas.style.pointerEvents = 'none';
    }
	
	// 4. Masquer le toggle HD 16x8 et son label parent (.control-item)
    const chkHD = document.getElementById('chk-high-density-grid');
    if (chkHD) {
        const labelParent = chkHD.closest('.control-item');
        if (labelParent) labelParent.style.display = 'none';
    }
}

