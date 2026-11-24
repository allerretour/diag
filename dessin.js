// Écouteur mis à jour pour piloter l'intégralité de la palette (P, T, Z, 0, 9)
const boutonsOutils = document.querySelectorAll('.tool-btn');

function gererLogiquePalette(btn, e) {

	// SÉCURITÉ : Si c'est le bouton couleur, on stoppe la logique d'outil de tracé
	if (btn.id === 'indicateur-couleur-tactique' || btn.id === 'btn-start-playlist') return;
	
	
	// NOUVEAU : Si c'est le bouton annuler ou effacer, on ne change pas l'outil actif de la palette
	if (btn.id === 'btn-undo-lines' || btn.id === 'btn-clear-lines') return;
	
	if (e.cancelable) e.preventDefault();

	const toolSelected = btn.getAttribute('data-tool');

	const cyclerOption = (valeurActuelle, tableauOptions) => {
		const indexActuel = tableauOptions.indexOf(valeurActuelle);
		const indexSuivant = (indexActuel + 1) % tableauOptions.length;
		return tableauOptions[indexSuivant];
	};

	// --- CE BLOC S'EXÉCUTE UNIQUEMENT À PARTIR DU DEUXIÈME CLIC CONSÉCUTIF ---
	if (window.outilTraceActif === toolSelected) {
		if (toolSelected === 'pointContact') {
			window.pourcentageContactCourant -= 10;
			if (window.pourcentageContactCourant < 0) {
				window.coteContactCourant = window.coteContactCourant * -1;
				window.pourcentageContactCourant = 100;
			}
		} else if (toolSelected === 'cible') {
			window.quadrantCibleCourant = cyclerOption(window.quadrantCibleCourant, [0, 1, 2, 3]);
		} else if (toolSelected === 'carre') {
			window.tailleCarreCourante = cyclerOption(window.tailleCarreCourante, [95, 135, 180]);
		} else if (toolSelected === 'effetBlanche') {
			window.niveauForceCourant = cyclerOption(window.niveauForceCourant, [0, 1, 2, 3, 4]);

			if (window.niveauForceCourant === 0) {
				const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
				if (btnSelect) {
					window.outilTraceActif = "select";
					boutonsOutils.forEach(b => b.classList.remove('active'));
					btnSelect.classList.add('active');
					const canvas = document.getElementById('drawing-canvas');
					if (canvas) canvas.style.pointerEvents = 'none';
				}
				rafraichirTexteBoutonsPalette();
				if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
				return;
			}
		} else if (toolSelected === 'repereX') {
			// ÉTAPE 1 : Si on est à 4 branches, on passe à 6 branches
			if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 4 && window.repereXTexte === null) {
				window.nombreBranchesRepereX = 6;
			}
			// ÉTAPE 2 : Si on est à 6 branches, on bascule sur le Cercle
			else if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 6 && window.repereXTexte === null) {
				window.repereXEstUnCercle = true;
			}
			// ÉTAPE 3 : Si on est sur le Cercle, on commence le cycle des lettres avec "A"
			else if (window.repereXEstUnCercle && window.repereXTexte === null) {
				window.repereXEstUnCercle = false;
				window.repereXTexte = cycleCaracteres[0];
			}
			// ÉTAPE 4 : Si on a du texte, on avance dans le tableau ou on réinitialise à 4 branches
			else if (window.repereXTexte !== null) {
				const indexActuel = cycleCaracteres.indexOf(window.repereXTexte);
				if (indexActuel >= 0 && indexActuel < cycleCaracteres.length - 1) {
					window.repereXTexte = cycleCaracteres[indexActuel + 1];
				} else {
					// Retour au point de départ parfait (Étoile à 4 branches)
					window.repereXTexte = null;
					window.nombreBranchesRepereX = 4;
					window.repereXEstUnCercle = false;
				}
			}
		}
		rafraichirTexteBoutonsPalette();
		if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
		return;

	}

		// --- TOUT PREMIER CLIC : INITIALISATION DE L'OUTIL ---
	// Sauvegarde l'outil comme précédent s'il ne s'agit pas de l'outil de sélection par défaut
	if (window.outilTraceActif !== "select") {
		window.dernierOutilValide = window.outilTraceActif;
	}

	boutonsOutils.forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	window.outilTraceActif = toolSelected;


	// Application stricte des configurations de base sans rotation
	if (toolSelected === 'pointContact') {
		window.pourcentageContactCourant = 100;
		window.coteContactCourant = 1;
	}
	if (toolSelected === 'repereX') {
		window.nombreBranchesRepereX = 4;
		window.repereXEstUnCercle = false;
		window.repereXTexte = null;
	}
	if (toolSelected === 'effetBlanche') {
		window.niveauForceCourant = 2;
	}

        // --- TOUT PREMIER CLIC : INITIALISATION DE L'OUTIL ---
	// ... (vos lignes existantes pointContact, repereX, effetBlanche) ...

	if (toolSelected === 'zoneTactique') {
        // Permet d'indiquer à l'utilisateur l'état global actuel (ex: édition active)
 	   btn.innerText = "🎲 Zone : Active";
	}


		const canvas = document.getElementById('drawing-canvas');
	if (canvas) {
		// CORRECTION : L'outil paintPocket a besoin de laisser passer le clic à travers le canvas ou d'activer le pointeur
		if (window.outilTraceActif !== "select") {
			canvas.style.pointerEvents = 'auto';
		} else {
			canvas.style.pointerEvents = 'none';
		}
	}


	rafraichirTexteBoutonsPalette();
	if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
}

// Trouvez ce bloc à la fin de la configuration de votre palette (Source 2)
// et remplacez-le par cette version sécurisée :

boutonsOutils.forEach(btn => {
	// ÉCHAPPE COMPLÈTEMENT LE BOUTON COULEUR POUR ÉVITER LES CONFLITS IOS
	if (btn.id === 'indicateur-couleur-tactique' || btn.id === 'btn-start-playlist') return;

	// Pour l'iPad / iPhone
	btn.addEventListener('touchstart', (e) => {
		gererLogiquePalette(btn, e);
	}, {
		passive: false
	});

	// Pour l'ordinateur de bureau (PC/Mac)
	btn.addEventListener('click', (e) => {
		if (e.pointerType === 'touch' || (e.clientX === 0 && e.clientY === 0)) return;
		gererLogiquePalette(btn, e);
	});
});

// Fonction utilitaire pour convertir le format rgb(r, g, b) du DOM en hexadécimal #ffffff requis par l'input color
function rgb2hex(rgb) {
	if (!rgb) return null;
	const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	if (!match) return null;
	return "#" + match.slice(1).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// [MODIFICATION] Remplacer le début de la fonction rafraichirTexteBoutonsPalette() par ceci :

function rafraichirTexteBoutonsPalette() {
	// --- 1. RÉCUPÉRATION DYNAMIQUE DE LA COULEUR ---
	const colorSelect = document.getElementById('marker-color');

	// NOUVEAU : Si une bille est sélectionnée, on convertit son style de couleur RGB en HEX pour mettre à jour la valeur de l'input
	if (colorSelect && window.billeSelectionneeCourante) {
		const rgbCouleur = window.billeSelectionneeCourante.style.backgroundColor;
		const hexCouleur = rgb2hex(rgbCouleur);
		if (hexCouleur) {
			colorSelect.value = hexCouleur;
		}
	}


	const btnPocket = document.querySelector('.tool-btn[data-tool="paintPocket"]');
	if (btnPocket && window.outilTraceActif !== 'paintPocket') {
		btnPocket.innerText = "💧 Poches";
	}



	let couleurSelectionnee = colorSelect ? colorSelect.value : '#ffffff';

	if (window.billeSelectionneeCourante) {
		couleurSelectionnee = window.billeSelectionneeCourante.style.backgroundColor;
	}

	// --- 2. MISE À JOUR DU NOUVEAU BOUTON INDICATEUR UNIQUE ---
	const boutonCouleur = document.getElementById('indicateur-couleur-tactique');
	if (boutonCouleur) {
		const previewBox = boutonCouleur.querySelector('.color-preview-box');
		if (previewBox) {
			// Animation fluide sur le changement de couleur de fond et d'ombre
			previewBox.style.transition = "background-color 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease";

			previewBox.style.backgroundColor = couleurSelectionnee;
			previewBox.style.boxShadow = `0 0 6px ${couleurSelectionnee}`;
		}
	}

	// --- 3. LOGIQUE DES AUTRES BOUTONS DE LA PALETTE ---
	const btnRepere = document.querySelector('.tool-btn[data-tool="repereX"]');
	if (btnRepere) {
		if (window.repereXTexte) {
			btnRepere.innerText = `❌ Repère : ${window.repereXTexte}`;
		} else if (window.repereXEstUnCercle) {
			btnRepere.innerText = "❌ Repère : Cercle";
		} else {
			btnRepere.innerText = `❌ Repère : ${window.nombreBranchesRepereX} Br.`;
		}
	}

	const btnCible = document.querySelector('.tool-btn[data-tool="cible"]');
	if (btnCible) {
		const correspondanceQuadrants = {
			0: "BD",
			1: "BG",
			2: "HG",
			3: "HD"
		};
		const labelQuadrant = correspondanceQuadrants[window.quadrantCibleCourant] || "BD";
		btnCible.innerText = `🎯 Cible : ${labelQuadrant}`;
	}

	const btnCarre = document.querySelector('.tool-btn[data-tool="carre"]');
	if (btnCarre) {
		let labelTaille = "P";
		if (window.tailleCarreCourante === 135) labelTaille = "M";
		if (window.tailleCarreCourante === 180) labelTaille = "G";
		btnCarre.innerText = `🔲 Carré : ${labelTaille}`;
	}

	const btnContact = document.querySelector('.tool-btn[data-tool="pointContact"]');
	if (btnContact) {
		if (window.pourcentageContactCourant === 100) {
			btnContact.innerText = "🎯 Contact : Plein";
		} else {
			const coteStr = window.coteContactCourant === 1 ? "G" : "D";
			btnContact.innerText = `🎯 Contact : ${window.pourcentageContactCourant}% (${coteStr})`;
		}
	}

	const btnEffet = document.querySelector('.tool-btn[data-tool="effetBlanche"]');
	if (btnEffet) {
		if (window.niveauForceCourant === 0) {
			btnEffet.innerText = "🔮 Effet : Aucun";
		} else {
			const pourcentageForce = window.niveauForceCourant * 25;
			btnEffet.innerText = `🔮 Effet : ${pourcentageForce}%`;
		}
	}

        const btnZone = document.querySelector('.tool-btn[data-tool="zoneTactique"]');
	if (btnZone && window.outilTraceActif !== 'zoneTactique') {
    		btnZone.innerText = "🎲 Zone";
	}


}

// Fonction universelle pour cycler dans un tableau d'options
function cyclerOption(valeurActuelle, tableauOptions) {
	const indexActuel = tableauOptions.indexOf(valeurActuelle);
	// Trouve l'index suivant, s'il dépasse la taille du tableau, il revient à 0
	const indexSuivant = (indexActuel + 1) % tableauOptions.length;
	return tableauOptions[indexSuivant];
}

// Extraction universelle des coordonnées qu'il s'agisse d'un clic (PC) ou d'un Touch (iPad)
function obtenirCoordonneesEvenement(e, tableElement) {
	const rect = tableElement.getBoundingClientRect();
	let clientX, clientY;

	if (e.touches && e.touches.length > 0) {
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	} else {
		clientX = e.clientX;
		clientY = e.clientY;
	}

	return {
		x: Math.round(clientX - rect.left),
		y: Math.round(clientY - rect.top)
	};
}

document.addEventListener("DOMContentLoaded", () => {
	const canvas = document.getElementById('drawing-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	const table = document.getElementById('pool-table');

	const colorSelect = document.getElementById('marker-color');
	const clearBtn = document.getElementById('btn-clear-lines');
	const undoBtn = document.getElementById('btn-undo-lines');
	const dashedCheck = document.getElementById('chk-dashed-lines');
	const toggleDrawingsCheck = document.getElementById('chk-toggle-drawings');

	let isDrawing = false;

	let isDraggingForme = false;
	let dragOffsetFormeX = 0;
	let dragOffsetFormeY = 0;
	window.formeTactiqueSelectionnee = null;



	let currentLine = null;
	let startPoint = null;
	let isCtrlPressed = false;
	let isShiftPressed = false;

	if (typeof chkMagnetism !== "undefined" && chkMagnetism) {
		chkMagnetism.addEventListener('change', () => {
			if (typeof rafraichirListeLateraleBilles === "function") {
				rafraichirListeLateraleBilles();
			}
		});
	}

	// === ADAPTATION APERÇU FANTÔME ===
	let outilActif = null;
	let mouseX = 0;
	let mouseY = 0;
	let animationFrameId = null;

	table.addEventListener('mousemove', (e) => {
		const rect = table.getBoundingClientRect();
		mouseX = Math.round(e.clientX - rect.left);
		mouseY = Math.round(e.clientY - rect.top);

		// Modifié pour réagir si la palette OU le clavier est utilisé
		const aUnOutilActif = outilActif || ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact', 'ghostBall'].includes(window.outilTraceActif);
		if (!aUnOutilActif) return;
		if (animationFrameId) return;

		animationFrameId = requestAnimationFrame(() => {
			window.redessinerToutesLesLignes();
			animationFrameId = null;
		});
	});

		// === BARRE DE RÉGLAGE TACTILE POUR L'ANGLE DU GHOST ===
	function pivoterGhostSelectionne(deltaDegres) {
		const formeGhost = window.formeTactiqueSelectionnee;
		if (!formeGhost || !formeGhost.estGhostBall || !formeGhost.cibleCentre || !formeGhost.points || !formeGhost.points.length) return;

		const ptActuel = formeGhost.points[0];
		let angleActuel = Math.atan2(ptActuel.y - formeGhost.cibleCentre.y, ptActuel.x - formeGhost.cibleCentre.x);
		angleActuel += (deltaDegres * Math.PI) / 180;

		const resultatGhost = dessinerBilleFantome(0, 0, formeGhost.couleur, formeGhost, angleActuel);
		formeGhost.points = [{ x: resultatGhost.x, y: resultatGhost.y }];
		formeGhost.expireBadgeLe = Date.now() + 2500;

		if (resultatGhost.pctImpact !== null) {
			const panneauImpact = window.dessinsSauvegardes.find(
				d => d.estPointContact && d.lieAGhostId === formeGhost.ghostId
			);
			if (panneauImpact) {
				panneauImpact.pourcentage = resultatGhost.pctImpact;
				panneauImpact.cote = resultatGhost.coteImpact;
			}
		}
		window.redessinerToutesLesLignes();
	}

	function majBarreReglageGhost() {
		let barre = document.getElementById('ghost-angle-tuner');
		const f = window.formeTactiqueSelectionnee;

		if (!f || !f.estGhostBall || !f.cibleCentre || window.isViewMode) {
			if (barre) barre.style.display = 'none';
			return;
		}

		if (!barre) {
			barre = document.createElement('div');
			barre.id = 'ghost-angle-tuner';
			barre.style.cssText = `
				position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
				background: rgba(11, 15, 23, 0.94); border: 1px solid rgba(255, 255, 255, 0.25);
				border-radius: 24px; padding: 6px 12px; display: flex; align-items: center; gap: 8px;
				z-index: 1005; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5); touch-action: manipulation;
			`;

			const pasBoutons = [
				{ label: '⏪ -1°', delta: -1.0 },
				{ label: '◀ -0.2°', delta: -0.2 },
				{ label: '+0.2° ▶', delta: 0.2 },
				{ label: '+1° ⏩', delta: 1.0 }
			];

			pasBoutons.forEach(item => {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.innerText = item.label;
				btn.style.cssText = `
					background: rgba(255, 255, 255, 0.14); color: #fff; border: none;
					border-radius: 14px; padding: 7px 12px; font-size: 13px; font-weight: 700;
					cursor: pointer; font-family: system-ui, -apple-system, sans-serif;
					user-select: none; -webkit-user-select: none;
				`;
				const action = (e) => {
					e.preventDefault();
					e.stopPropagation();
					pivoterGhostSelectionne(item.delta);
				};
				btn.addEventListener('touchstart', action, { passive: false });
				btn.addEventListener('mousedown', (e) => {
					if (e.button === 0) action(e);
				});
				barre.appendChild(btn);
			});


			table.appendChild(barre);
		}

		barre.style.display = 'flex';
	}



		// 1. DÉBUT DU DÉPLACEMENT D'UNE FORME (Souris & Tactile)
	function gererDebutDeplacementForme(e) {
		if (window.isViewMode || window.outilTraceActif !== "select") return;
		if (e.type === 'mousedown' && e.button !== 0) return;

		// Si l'utilisateur clique sur une bille, on laisse la bille gérer son propre drag
		if (e.target.closest('.ball')) {
			window.formeTactiqueSelectionnee = null;
			window.redessinerToutesLesLignes();
			return;
		}
		// Si l'utilisateur appuie sur la barre de réglage d'angle du Ghost, on ne désélectionne pas
		if (e.target.closest('#ghost-angle-tuner')) {
			return;
		}


		const coords = obtenirCoordonneesEvenement(e, table);
		const formeTrouvee = window.trouverFormeTactiqueProche(coords.x, coords.y);

				if (formeTrouvee) {
			if (e.cancelable) e.preventDefault();

			// --- DÉTECTION D'UN CLIC SUR LES 9 POINTS D'EFFET OU SUR LA JAUGE DE FORCE ---
			if (formeTrouvee.estEffetBlanche && formeTrouvee.points && formeTrouvee.points.length > 0) {
				const centreForme = formeTrouvee.points[0];
				const jaugeActive = (formeTrouvee.force || 0) > 0;
				const demiLargeur = (jaugeActive ? 150 : 110) / 2;
				const cadreX = centreForme.x - demiLargeur;
				
				// Calcul exact du centre de la bille blanche à l'intérieur du cadre
				const billeX = jaugeActive ? (cadreX + 48) : centreForme.x;
				const billeY = centreForme.y;
				const rayonBille = 36;

				// 1. Vérification du clic sur la zone de la jauge FORCE (à droite de la bille)
				if (jaugeActive) {
					const jaugeCentreX = cadreX + 122;
					// Zone cliquable autour de la jauge (largeur +/- 18px, hauteur de la bille + marge)
					if (Math.abs(coords.x - jaugeCentreX) <= 18 && Math.abs(coords.y - billeY) <= rayonBille + 18) {
						const basJaugeY = billeY + rayonBille;
						const hautJaugeY = billeY - rayonBille;

						if (coords.y > basJaugeY + 4) {
							// Clic sur le pourcentage en bas : désactive la jauge (0%)
							formeTrouvee.force = 0;
						} else {
							// Calcul du niveau de 1 (25%) à 4 (100%) selon la hauteur cliquée
							const ratio = Math.max(0, Math.min(1, (basJaugeY - coords.y) / (rayonBille * 2)));
							formeTrouvee.force = Math.max(1, Math.min(4, Math.ceil(ratio * 4)));
						}

						window.niveauForceCourant = formeTrouvee.force;
						window.formeTactiqueSelectionnee = formeTrouvee;

						if (window.billeSelectionneeCourante) {
							window.billeSelectionneeCourante.style.outline = 'none';
							window.billeSelectionneeCourante = null;
							if (typeof rafraichirListeLateraleBilles === "function") rafraichirListeLateraleBilles();
						}

						if (typeof rafraichirTexteBoutonsPalette === "function") rafraichirTexteBoutonsPalette();
						window.redessinerToutesLesLignes();
						return; // Stoppe ici pour modifier la force sans déplacer le panneau
					}
				} else {
					// Si la jauge est masquée (0%), un clic sur la bordure droite du cadre l'active à 25%
					if (coords.x >= billeX + rayonBille - 2 && coords.x <= cadreX + 110 && Math.abs(coords.y - billeY) <= rayonBille + 12) {
						formeTrouvee.force = 1;
						window.niveauForceCourant = 1;
						window.formeTactiqueSelectionnee = formeTrouvee;

						if (window.billeSelectionneeCourante) {
							window.billeSelectionneeCourante.style.outline = 'none';
							window.billeSelectionneeCourante = null;
							if (typeof rafraichirListeLateraleBilles === "function") rafraichirListeLateraleBilles();
						}

						if (typeof rafraichirTexteBoutonsPalette === "function") rafraichirTexteBoutonsPalette();
						window.redessinerToutesLesLignes();
						return;
					}
				}

				// 2. Vérification du clic sur l'un des 9 points d'effet
				const d = 24;
				const diag = d * Math.cos(Math.PI / 4);
				const offsets = [
					{ dx: 0, dy: 0 },                   // 0 : Centre
					{ dx: 0, dy: -d },                  // 1 : Haut (Coulé)
					{ dx: 0, dy: d },                   // 2 : Bas (Rétro)
					{ dx: -d, dy: 0 },                  // 3 : Gauche
					{ dx: d, dy: 0 },                   // 4 : Droite
					{ dx: -diag, dy: -diag },           // 5 : Haut-Gauche
					{ dx: diag, dy: -diag },            // 6 : Haut-Droite
					{ dx: -diag, dy: diag },            // 7 : Bas-Gauche
					{ dx: diag, dy: diag }              // 8 : Bas-Droite
				];

				for (let i = 0; i < offsets.length; i++) {
					const px = billeX + offsets[i].dx;
					const py = billeY + offsets[i].dy;
					if (Math.hypot(coords.x - px, coords.y - py) <= 11) {
						formeTrouvee.pointEffet = i;
						window.indexPointEffetCourant = i;
						window.formeTactiqueSelectionnee = formeTrouvee;

						if (window.billeSelectionneeCourante) {
							window.billeSelectionneeCourante.style.outline = 'none';
							window.billeSelectionneeCourante = null;
							if (typeof rafraichirListeLateraleBilles === "function") rafraichirListeLateraleBilles();
						}

						window.redessinerToutesLesLignes();
						return; // Stoppe ici pour changer le point sans déplacer le panneau
					}
				}
			}


			window.formeTactiqueSelectionnee = formeTrouvee;
			isDraggingForme = true;

			// Désélectionne la bille active s'il y en avait une
			if (window.billeSelectionneeCourante) {
				window.billeSelectionneeCourante.style.outline = 'none';
				window.billeSelectionneeCourante = null;
				if (typeof rafraichirListeLateraleBilles === "function") rafraichirListeLateraleBilles();
			}

			// Mémorise le décalage entre le curseur et le centre de la forme pour éviter tout saut
			dragOffsetFormeX = coords.x - formeTrouvee.points[0].x;
			dragOffsetFormeY = coords.y - formeTrouvee.points[0].y;

			window.redessinerToutesLesLignes();
		} else if (window.formeTactiqueSelectionnee) {
			// Clic dans le vide : désélectionne la forme
			window.formeTactiqueSelectionnee = null;
			window.redessinerToutesLesLignes();
		}

	}
		// 2. MOUVEMENT DE LA FORME
	function gererMouvementDeplacementForme(e) {
		if (!isDraggingForme || !window.formeTactiqueSelectionnee) return;
		if (e.cancelable) e.preventDefault();

		const coords = obtenirCoordonneesEvenement(e, table);
		let newX = coords.x - dragOffsetFormeX;
		let newY = coords.y - dragOffsetFormeY;

		// Applique les limites de la table
		const posClampee = clampPositionDessin(newX, newY);
		newX = posClampee.x;
		newY = posClampee.y;

			// --- SI C'EST UNE BILLE FANTÔME EN DÉPLACEMENT (BRAS DE LEVIER) ---
		if (window.formeTactiqueSelectionnee.estGhostBall) {
			// On passe directement coords.x / coords.y (sans offset ni clamp) pour permettre d'éloigner le doigt/curseur
			const resultatGhost = dessinerBilleFantome(coords.x, coords.y, window.formeTactiqueSelectionnee.couleur);

			window.formeTactiqueSelectionnee.points = [{ x: resultatGhost.x, y: resultatGhost.y }];
			window.formeTactiqueSelectionnee.cibleCentre = resultatGhost.cibleCentre;
			window.formeTactiqueSelectionnee.blancheCentre = resultatGhost.blancheCentre;
			window.formeTactiqueSelectionnee.couleurCible = resultatGhost.couleurCible;
			window.formeTactiqueSelectionnee.enDeplacement = true;
			window.formeTactiqueSelectionnee.curseurLevier = { x: coords.x, y: coords.y };

			// --- SYNCHRONISATION DU PANNEAU QUANTITÉ D'IMPACT ---
			if (resultatGhost.pctImpact !== null) {
				let panneauImpact = window.dessinsSauvegardes.find(
					d => d.estPointContact && d.lieAGhostId === window.formeTactiqueSelectionnee.ghostId
				);

				if (!panneauImpact) {
					const panneaux = window.dessinsSauvegardes.filter(d => d.estPointContact);
					if (panneaux.length > 0) panneauImpact = panneaux[panneaux.length - 1];
				}

				if (panneauImpact) {
					panneauImpact.pourcentage = resultatGhost.pctImpact;
					panneauImpact.cote = resultatGhost.coteImpact;
					if (resultatGhost.couleurCible) {
						panneauImpact.couleur = resultatGhost.couleurCible;
					}
				}
			}

			window.redessinerToutesLesLignes();
			return;
		}



		// Magnétisme sur la grille pour les autres formes (Cible, Carré, Repère...)
		if (typeof calculerSnapGrille === "function" && !e.shiftKey) {
			const snap = calculerSnapGrille(newX - 12, newY - 12, null, true);
			newX = snap.x + 12;
			newY = snap.y + 12;
		}

		window.formeTactiqueSelectionnee.points[0] = { x: newX, y: newY };
		window.redessinerToutesLesLignes();
	}


		// 3. FIN DU DÉPLACEMENT
	function gererFinDeplacementForme() {
		if (isDraggingForme) {
			isDraggingForme = false;

			// --- NOUVEAU : RELANCE LE COMPTE À REBOURS DU BADGE POUR LA BILLE FANTÔME ---
			if (window.formeTactiqueSelectionnee && window.formeTactiqueSelectionnee.estGhostBall) {
				const formeGhost = window.formeTactiqueSelectionnee;
				formeGhost.enDeplacement = false;

				const DUREE_AFFICHAGE_MS = 2500;
				formeGhost.expireBadgeLe = Date.now() + DUREE_AFFICHAGE_MS;

				setTimeout(() => {
					const animerFondu = () => {
						if (typeof window.redessinerToutesLesLignes === "function") {
							window.redessinerToutesLesLignes();
						}
						if (Date.now() < formeGhost.expireBadgeLe || formeGhost.enDeplacement) {
							requestAnimationFrame(animerFondu);
						}
					};
					requestAnimationFrame(animerFondu);
				}, DUREE_AFFICHAGE_MS - 400);

				window.redessinerToutesLesLignes();
			}
		}
	}


	// Attachement des écouteurs hybrides sur la table
	table.addEventListener('mousedown', gererDebutDeplacementForme);
	table.addEventListener('touchstart', gererDebutDeplacementForme, { passive: false });

	document.addEventListener('mousemove', gererMouvementDeplacementForme);
	document.addEventListener('touchmove', gererMouvementDeplacementForme, { passive: false });

	document.addEventListener('mouseup', gererFinDeplacementForme);
	document.addEventListener('touchend', gererFinDeplacementForme);








	// Fonction d'assistance pour assombrir/saturer dynamiquement la couleur choisie pour le contour 3D
	function obtenirOmbre3DCouleur(couleurHex) {
		// Si la couleur n'est pas au format hexadécimal (ex: '#f1c40f'), on retourne un repli sombre générique
		if (!couleurHex || couleurHex.indexOf('#') !== 0) return "rgba(0, 0, 0, 0.4)";

		// Extraction des composants RGB
		let r = parseInt(couleurHex.substring(1, 3), 16);
		let g = parseInt(couleurHex.substring(3, 5), 16);
		let b = parseInt(couleurHex.substring(5, 7), 16);

		// Assombrissement progressif et sélectif pour créer une belle ombre de matière (résine)
		r = Math.floor(r * 0.45);
		g = Math.floor(g * 0.45);
		b = Math.floor(b * 0.45);

		return `rgb(${r}, ${g}, ${b})`;
	}

function dessinerPointContact(x, y, couleur, pctFige, coteFige) {
	ctx.save();

	// --- FORCE LE LISSAGE ET LES LIGNES PLEINES POUR L'OUTIL CONTACT ---
	ctx.setLineDash([]);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	const pct = (pctFige !== undefined) ? pctFige : window.pourcentageContactCourant;
	const cote = (coteFige !== undefined) ? coteFige : window.coteContactCourant;
	const couleurMarqueur = couleur || (colorSelect ? colorSelect.value : '#ffffff');

	// === DIMENSIONS IDENTIQUES AU PANNEAU EFFET (150 x 125) ===
	const largeurCadre = 150;
	const hauteurCadre = 125;

	// Calage géométrique sur la grille de pixels pour un rendu de contour parfait
	const adj = (ctx.lineWidth % 2 === 1) ? 0.5 : 0;
	const cadreX = Math.floor(x - (largeurCadre / 2)) + adj;
	const cadreY = Math.floor(y - (hauteurCadre / 2)) + adj;
	const arrondiCoins = 12;

	ctx.beginPath();
	ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arrondiCoins);
	ctx.fillStyle = "rgba(11, 15, 23, 0.94)";
	ctx.fill();
	ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
	ctx.lineWidth = 1;
	ctx.stroke();

	// === BILLES CALIBRÉES AU MAXIMUM SANS DÉBORDEMENT À 0% (Rayon 23px) ===
	const centreCadreX = Math.floor(x) + adj;
	const centreCadreY = Math.floor(y) + adj;
	const rayonBille = 23;
	const diametreBille = rayonBille * 2;
	const decalageX = diametreBille * (1 - (pct / 100));

	// --- LIGNE D'AXE HORIZONTALE DE RÉFÉRENCE ---
	ctx.beginPath();
	ctx.moveTo(cadreX + 10, centreCadreY);
	ctx.lineTo(cadreX + largeurCadre - 10, centreCadreY);
	ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
	ctx.lineWidth = 1;
	ctx.stroke();

	// --- 1. RENDU DE LA BILLE CIBLE ARRIÈRE (Dégradé 3D lissé) ---
	ctx.save();
	const gradCible = ctx.createRadialGradient(
		centreCadreX - (rayonBille * 0.22), centreCadreY - (rayonBille * 0.22), rayonBille * 0.08,
		centreCadreX, centreCadreY, rayonBille
	);
	gradCible.addColorStop(0, "#ffffff");
	gradCible.addColorStop(0.35, couleurMarqueur);
	gradCible.addColorStop(0.85, couleurMarqueur);
	gradCible.addColorStop(1, obtenirOmbre3DCouleur(couleurMarqueur));

	ctx.beginPath();
	ctx.arc(centreCadreX, centreCadreY, rayonBille, 0, 2 * Math.PI);
	ctx.fillStyle = gradCible;
	ctx.fill();

	ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.restore();

	// --- 2. RENDU DE LA BILLE BLANCHE AVANT ---
	const blancheX = Math.floor(centreCadreX - (decalageX * cote)) + adj;

	ctx.save();
	const gradBlanche = ctx.createRadialGradient(
		blancheX - (rayonBille * 0.22), centreCadreY - (rayonBille * 0.22), rayonBille * 0.08,
		blancheX, centreCadreY, rayonBille
	);
	gradBlanche.addColorStop(0, "#ffffff");
	gradBlanche.addColorStop(0.3, "#f7f9fa");
	gradBlanche.addColorStop(0.85, "#e1e5eb");
	gradBlanche.addColorStop(1, "#b5bdc9");

	ctx.beginPath();
	ctx.arc(blancheX, centreCadreY, rayonBille, 0, 2 * Math.PI);
	ctx.fillStyle = gradBlanche;
	ctx.fill();

	// Contour sombre subtil pour découper la blanche sur la bille arrière
	ctx.strokeStyle = "rgba(11, 15, 23, 0.45)";
	ctx.lineWidth = 1.2;
	ctx.stroke();
	ctx.restore();

	// --- 3. LABELS ET TEXTES EXPLICATIFS ---
	ctx.fillStyle = "rgba(150, 165, 185, 0.85)";
	ctx.font = "600 10px system-ui, -apple-system, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "bottom";
	ctx.fillText("QUANTITÉ D'IMPACT", centreCadreX, centreCadreY - rayonBille - 21);

	ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
	ctx.textBaseline = "top";
	ctx.fillStyle = "#ffffff";
	if (pct === 100) {
		ctx.fillText("IMPACT PLEIN", centreCadreX, centreCadreY + rayonBille + 18);
	} else {
		const coteTexte = cote === 1 ? "GAUCHE" : "DROITE";
		ctx.fillText(`${pct}% - ${coteTexte}`, centreCadreX, centreCadreY + rayonBille + 18);
	}

	ctx.restore();
}


function dessinerBilleFantome(mouseX, mouseY, couleur, donneeFigee = null, angleForce = null) {
	ctx.save();
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	const rayon = 12; // Rayon exact d'une bille (diamètre 24px)
	const distanceContact = rayon * 2; // 24px entre les deux centres
	const couleurRepli = couleur || (colorSelect ? colorSelect.value : '#ffffff');

		// === PARAMÈTRES D'AIMANTATION ===
	const TOLERANCE_IMPACT_PLEIN_DEGRES = 0.8; // Aimant fin pour le 100%
	const TOLERANCE_AIMANT_ZERO_DEGRES = 1.8;  // Aimant fin pour la coupe rasante à 0% (90°)
	const TOLERANCE_AIMANT_POCHE_DEGRES = 4.0; // Aimantation franche vers les 6 poches



	const seuilPleinRadian = Math.sin((TOLERANCE_IMPACT_PLEIN_DEGRES * Math.PI) / 180);
	const seuilZeroRadian = (TOLERANCE_AIMANT_ZERO_DEGRES * Math.PI) / 180;
	const seuilPocheRadian = Math.sin((TOLERANCE_AIMANT_POCHE_DEGRES * Math.PI) / 180);

	// --- LIMITES INTÉRIEURES DES BANDES ---
	const minX = 19 + rayon;       // 31px
	const maxX = 19 + 754 - rayon; // 761px
	const minY = 18 + rayon;       // 30px
	const maxY = 18 + 364 - rayon; // 370px

		// --- COORDONNÉES DES 6 POCHES DU TAPIS ---
	const pochesTapis = [
		{ x: 24, y: 23 },             // Haut-Gauche
		{ x: 19 + 377, y: 16 },       // Milieu-Haut
		{ x: 19 + 754 - 5, y: 23 },   // Haut-Droit
		{ x: 24, y: 18 + 364 - 5 },   // Bas-Gauche
		{ x: 19 + 377, y: 18 + 366 }, // Milieu-Bas
		{ x: 19 + 754 - 5, y: 18 + 364 - 5 } // Bas-Droit
	];


	function limiterAuTapis(startX, startY, angle, longueurMax, ignorerBordures = false) {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		let distMax = longueurMax;

		if (!ignorerBordures) {
			if (cos > 0.0001) distMax = Math.min(distMax, (maxX - 4 - startX) / cos);
			else if (cos < -0.0001) distMax = Math.min(distMax, (minX + 4 - startX) / cos);

			if (sin > 0.0001) distMax = Math.min(distMax, (maxY - 4 - startY) / sin);
			else if (sin < -0.0001) distMax = Math.min(distMax, (minY + 4 - startY) / sin);
		}

		distMax = Math.max(0, distMax);
		return {
			x: startX + cos * distMax,
			y: startY + sin * distMax,
			longueur: distMax
		};
	}

	// 1. Recherche de la bille blanche sur le tapis
	let blancheCentre = null;
	if (Array.isArray(activeBalls)) {
		const cueBall = activeBalls.find(b => b.getAttribute('data-id') === '0');
		if (cueBall && cueBall.style.display !== 'none') {
			blancheCentre = {
				x: (parseFloat(cueBall.style.left) || 0) + rayon,
				y: (parseFloat(cueBall.style.top) || 0) + rayon
			};
		}
	}
	if (!blancheCentre && donneeFigee && donneeFigee.blancheCentre) {
		blancheCentre = donneeFigee.blancheCentre;
	}

	let ghostX = mouseX;
	let ghostY = mouseY;
	let cibleCentre = null;
	let couleurCible = couleurRepli;

		// 2. Récupération ou détection de la bille cible la plus proche
		if (donneeFigee && donneeFigee.cibleCentre && donneeFigee.points && donneeFigee.points.length > 0 && angleForce === null) {
		ghostX = donneeFigee.points[0].x;
		ghostY = donneeFigee.points[0].y;
		cibleCentre = donneeFigee.cibleCentre;
		couleurCible = donneeFigee.couleurCible || couleurRepli;
	} else {
		if (donneeFigee && donneeFigee.cibleCentre) {
			cibleCentre = donneeFigee.cibleCentre;
			couleurCible = donneeFigee.couleurCible || couleurRepli;
		} else {
			let distanceMin = 65;
			if (Array.isArray(activeBalls)) {
				activeBalls.forEach(ball => {
					const ballId = ball.getAttribute('data-id');
					if (ballId !== '0' && ball.style.display !== 'none') {
						const bx = (parseFloat(ball.style.left) || 0) + rayon;
						const by = (parseFloat(ball.style.top) || 0) + rayon;
						const dist = Math.hypot(mouseX - bx, mouseY - by);

						if (dist < distanceMin) {
							distanceMin = dist;
							cibleCentre = { x: bx, y: by };
							couleurCible = ball.style.backgroundColor || couleurRepli;
						}
					}
				});
			}
		}

		if (cibleCentre) {
			if (angleForce !== null) {
				ghostX = cibleCentre.x + Math.cos(angleForce) * distanceContact;
				ghostY = cibleCentre.y + Math.sin(angleForce) * distanceContact;
			} else {
				let angleDepuisCible = Math.atan2(mouseY - cibleCentre.y, mouseX - cibleCentre.x);
				let estAimante = false;

				if (blancheCentre) {
					const distBlancheCible = Math.hypot(blancheCentre.x - cibleCentre.x, blancheCentre.y - cibleCentre.y);
					const anglePleinContact = Math.atan2(blancheCentre.y - cibleCentre.y, blancheCentre.x - cibleCentre.x);

					// A. Aimantation à 100% (Impact plein)
					if (Math.cos(angleDepuisCible - anglePleinContact) > 0 && Math.abs(Math.sin(angleDepuisCible - anglePleinContact)) <= seuilPleinRadian) {
						angleDepuisCible = anglePleinContact;
						estAimante = true;
					}

					// B. Aimantation à 0% (Coupe rasante exacte à 90°)
					if (!estAimante && distBlancheCible > distanceContact) {
						const ecartTangence = Math.acos(distanceContact / distBlancheCible);
						const anglesTangence = [anglePleinContact + ecartTangence, anglePleinContact - ecartTangence];

						for (const angleZero of anglesTangence) {
							const diffAngle = Math.atan2(Math.sin(angleDepuisCible - angleZero), Math.cos(angleDepuisCible - angleZero));
							if (Math.abs(diffAngle) <= seuilZeroRadian) {
								angleDepuisCible = angleZero;
								estAimante = true;
								break;
							}
						}
					}
				}

				// C. Aimantation douce vers les 6 poches du tapis
				if (!estAimante) {
					const angleTirActuel = angleDepuisCible + Math.PI;
					let ecartMinPoche = seuilPocheRadian;
					let angleVersPocheRetenu = null;

					pochesTapis.forEach(poche => {
						const angleVersPoche = Math.atan2(poche.y - cibleCentre.y, poche.x - cibleCentre.x);
						if (Math.cos(angleTirActuel - angleVersPoche) > 0) {
							const ecart = Math.abs(Math.sin(angleTirActuel - angleVersPoche));
							if (ecart < ecartMinPoche) {
								ecartMinPoche = ecart;
								angleVersPocheRetenu = angleVersPoche;
							}
						}
					});

					if (angleVersPocheRetenu !== null) {
						angleDepuisCible = angleVersPocheRetenu + Math.PI;
					}
				}

				ghostX = cibleCentre.x + Math.cos(angleDepuisCible) * distanceContact;
				ghostY = cibleCentre.y + Math.sin(angleDepuisCible) * distanceContact;
			}
		}
	}


	ghostX = Math.max(minX, Math.min(maxX, ghostX));
	ghostY = Math.max(minY, Math.min(maxY, ghostY));
	let texteBadgeImpact = null;
	let estCoupImpossible = false;
	let pctCalcule = null;
	let coteCalcule = 1; // 1 = Gauche, -1 = Droite

	// 3. Calcul géométrique exact de la fraction de bille (Autorise 0% et coupe rasante à 90°)
	if (cibleCentre) {
		const angleImpact = Math.atan2(cibleCentre.y - ghostY, cibleCentre.x - ghostX);

		if (blancheCentre) {
			const distTir = Math.hypot(ghostX - blancheCentre.x, ghostY - blancheCentre.y);
			const distCentreACentre = Math.hypot(cibleCentre.x - blancheCentre.x, cibleCentre.y - blancheCentre.y);

			if (distTir > 0.1 && distCentreACentre > 0.1) {
				const dirTirX = (ghostX - blancheCentre.x) / distTir;
				const dirTirY = (ghostY - blancheCentre.y) / distTir;

				const vecCibleX = cibleCentre.x - ghostX;
				const vecCibleY = cibleCentre.y - ghostY;

				const projLongitudinale = vecCibleX * dirTirX + vecCibleY * dirTirY;

				const dirCentreX = (cibleCentre.x - blancheCentre.x) / distCentreACentre;
				const dirCentreY = (cibleCentre.y - blancheCentre.y) / distCentreACentre;

								const decalageLateral = vecCibleX * dirCentreY - vecCibleY * dirCentreX;

				// Calcul de l'angle de coupe en degrés
				const cosAngleCoupe = Math.max(-1, Math.min(1, (dirTirX * (vecCibleX / distanceContact)) + (dirTirY * (vecCibleY / distanceContact))));
				const angleCoupeDegres = (Math.acos(cosAngleCoupe) * 180 / Math.PI).toFixed(1);

				if (projLongitudinale < -0.5) {
					estCoupImpossible = true;
					texteBadgeImpact = "Angle impossible (>90°)";
				} else {
					const diametre = rayon * 2;
					const chevauchementPx = Math.max(0, diametre - Math.abs(decalageLateral));
					const pctBrut = (projLongitudinale <= 0.1) ? 0 : Math.round((chevauchementPx / diametre) * 100);

					const coteStr = decalageLateral > 0 ? "D" : "G";
					pctCalcule = pctBrut;
					coteCalcule = decalageLateral > 0 ? -1 : 1;

					if (pctBrut >= 99) {
						texteBadgeImpact = "100% (Plein) · 0.0°";
						pctCalcule = 100;
					} else if (pctBrut === 0) {
						texteBadgeImpact = `0% · Finesse (${coteStr}) · ${angleCoupeDegres}°`;
					} else {
						let fraction = "";
						if (Math.abs(pctBrut - 75) <= 3) fraction = " · 3/4";
						else if (Math.abs(pctBrut - 50) <= 3) fraction = " · 1/2";
						else if (Math.abs(pctBrut - 25) <= 3) fraction = " · 1/4";

						texteBadgeImpact = `${pctBrut}%${fraction} (${coteStr}) · ${angleCoupeDegres}°`;
					}
				}

			}

			ctx.save();
			ctx.beginPath();
			ctx.setLineDash(estCoupImpossible ? [4, 4] : []);
			ctx.strokeStyle = estCoupImpossible ? "rgba(231, 76, 60, 0.85)" : "rgba(255, 255, 255, 0.75)";
			ctx.lineWidth = 2;
			ctx.moveTo(blancheCentre.x, blancheCentre.y);
			ctx.lineTo(ghostX, ghostY);
			ctx.stroke();
			ctx.restore();
		}

		// B. Trajectoire projetée de la bille objet (jusqu'aux bandes ou la poche)
		let pocheAlignee = null;
		let ecartPocheMin = seuilPocheRadian;

		pochesTapis.forEach(poche => {
			const angleVersPoche = Math.atan2(poche.y - cibleCentre.y, poche.x - cibleCentre.x);
			if (Math.cos(angleImpact - angleVersPoche) > 0) {
				const ecart = Math.abs(Math.sin(angleImpact - angleVersPoche));
				if (ecart <= ecartPocheMin) {
					ecartPocheMin = ecart;
					pocheAlignee = poche;
				}
			}
		});

		const longueurTrajectoire = pocheAlignee
			? Math.max(10, Math.hypot(pocheAlignee.x - cibleCentre.x, pocheAlignee.y - cibleCentre.y) - 10)
			: 2000;

		const finCible = limiterAuTapis(cibleCentre.x, cibleCentre.y, angleImpact, longueurTrajectoire, Boolean(pocheAlignee));
		const longueurFinale = !pocheAlignee ? Math.max(0, finCible.longueur + 12) : finCible.longueur;

		if (longueurFinale > 6) {
			const finX = cibleCentre.x + Math.cos(angleImpact) * longueurFinale;
			const finY = cibleCentre.y + Math.sin(angleImpact) * longueurFinale;

			ctx.save();
			ctx.beginPath();
			ctx.setLineDash([]);
			ctx.strokeStyle = couleurCible;
			ctx.lineWidth = 2.5;
			ctx.moveTo(cibleCentre.x, cibleCentre.y);
			ctx.lineTo(finX, finY);
			ctx.stroke();
			dessinerPointeFleche(cibleCentre.x, cibleCentre.y, finX, finY, couleurCible);
			ctx.restore();
		}

		// C. Ligne tangente à 90° (Depuis le centre du ghost vers le côté de la déviation)
		let afficherTangente = !estCoupImpossible;
		let angleTangente = angleImpact + Math.PI / 2;
		let sensRotation = 1;

		if (blancheCentre && afficherTangente) {
			const angleArrivee = Math.atan2(ghostY - blancheCentre.y, ghostX - blancheCentre.x);
			const diff = Math.sin(angleArrivee - angleImpact);
			sensRotation = diff >= 0 ? 1 : -1;

			if (Math.cos(angleArrivee - angleImpact) > 0 && Math.abs(diff) <= seuilPleinRadian) {
				afficherTangente = false;
			} else {
				angleTangente = angleImpact + (sensRotation * Math.PI / 2);
			}
		}

		if (afficherTangente) {
			const longueurTangente = 55;
			const finTangenteAvant = limiterAuTapis(ghostX, ghostY, angleTangente, longueurTangente);

			if (finTangenteAvant.longueur > 6) {
				ctx.save();
				ctx.beginPath();
				ctx.setLineDash([3, 3]);
				ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
				ctx.lineWidth = 2;
				ctx.moveTo(ghostX, ghostY);
				ctx.lineTo(finTangenteAvant.x, finTangenteAvant.y);
				ctx.stroke();
				ctx.restore();
			}
		}
	}

	// 4. Dessin de la Bille Fantôme
	ctx.save();
	ctx.beginPath();
	ctx.arc(ghostX, ghostY, rayon, 0, 2 * Math.PI);
	ctx.fillStyle = estCoupImpossible ? "rgba(231, 76, 60, 0.25)" : "rgba(255, 255, 255, 0.18)";
	ctx.fill();

	ctx.lineWidth = 2;
	ctx.strokeStyle = estCoupImpossible ? "#e74c3c" : "#ffffff";
	ctx.setLineDash([3, 3]);
	ctx.stroke();

	ctx.beginPath();
	ctx.setLineDash([]);
	ctx.arc(ghostX, ghostY, 2, 0, 2 * Math.PI);
	ctx.fillStyle = estCoupImpossible ? "#e74c3c" : "#ffffff";
	ctx.fill();
	ctx.restore();


	// 4 bis. Fil de précision (Bras de levier) affiché uniquement pendant le déplacement
	if (donneeFigee && donneeFigee.enDeplacement && donneeFigee.curseurLevier) {
		const distLevier = Math.hypot(donneeFigee.curseurLevier.x - ghostX, donneeFigee.curseurLevier.y - ghostY);
		if (distLevier > 20) {
			ctx.save();
			ctx.beginPath();
			ctx.setLineDash([2, 4]);
			ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
			ctx.lineWidth = 1.5;
			ctx.moveTo(ghostX, ghostY);
			ctx.lineTo(donneeFigee.curseurLevier.x, donneeFigee.curseurLevier.y);
			ctx.stroke();

			ctx.beginPath();
			ctx.setLineDash([]);
			ctx.arc(donneeFigee.curseurLevier.x, donneeFigee.curseurLevier.y, 4, 0, 2 * Math.PI);
			ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
			ctx.fill();
			ctx.restore();
		}
	}



	// 5. Affichage du badge de pourcentage d'impact
	const maintenant = Date.now();
	const estApercuEnDirect = !donneeFigee || donneeFigee.enDeplacement;
	const badgeEncoreVisible = estApercuEnDirect || (donneeFigee.expireBadgeLe && maintenant < donneeFigee.expireBadgeLe);

	if (texteBadgeImpact && badgeEncoreVisible) {
		ctx.save();

		if (!estApercuEnDirect && donneeFigee.expireBadgeLe) {
			const tempsRestant = donneeFigee.expireBadgeLe - maintenant;
			if (tempsRestant < 400) ctx.globalAlpha = Math.max(0, tempsRestant / 400);
		}

		ctx.setLineDash([]);
		ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
		const largeurTexte = ctx.measureText(texteBadgeImpact).width;

		const padX = 14;
		const hauteurBadge = 32;
		const largeurBadge = largeurTexte + padX * 2;
		const ecartementVertical = 38;

		let badgeY = ghostY - rayon - hauteurBadge - ecartementVertical;
		if (badgeY < 24) badgeY = ghostY + rayon + ecartementVertical;

		let badgeX = ghostX - largeurBadge / 2;
		badgeX = Math.max(24, Math.min(792 - 24 - largeurBadge, badgeX));

		ctx.beginPath();
		ctx.roundRect(badgeX, badgeY, largeurBadge, hauteurBadge, 8);
		ctx.fillStyle = estCoupImpossible ? "rgba(180, 35, 24, 0.96)" : "rgba(11, 15, 23, 0.95)";
		ctx.fill();
		ctx.strokeStyle = estCoupImpossible ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.3)";
		ctx.lineWidth = 1.5;
		ctx.stroke();

		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(texteBadgeImpact, badgeX + largeurBadge / 2, badgeY + hauteurBadge / 2 + 1);
		ctx.restore();
	}

	ctx.restore();

	return {
		x: ghostX,
		y: ghostY,
		cibleCentre: cibleCentre,
		blancheCentre: blancheCentre,
		couleurCible: couleurCible,
		pctImpact: pctCalcule,
		coteImpact: coteCalcule
	};
}







	function configurerStyleDessin(couleur, estPointille) {
		if (couleur) {
			ctx.strokeStyle = couleur;
		} else if (window.billeSelectionneeCourante) {
			ctx.strokeStyle = window.billeSelectionneeCourante.style.backgroundColor;
		} else {
			ctx.strokeStyle = colorSelect ? colorSelect.value : '#ffffff';
		}
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		if (estPointille) {
			ctx.setLineDash([4, 8]);
		} else {
			ctx.setLineDash([]);
		}
	}

	function dessinerEffetsBilleBlanche(x, y, couleur, forceFige, pointIndexFige) {
	ctx.save();
	
	// === CONFIGURATION DU LISSAGE ET SÉCURITÉ ANTI-ALIASING ===
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.setLineDash([]); // Lignes pleines et continues obligatoires ici

	const marge = 18;
	ctx.beginPath();
	ctx.rect(marge, marge, ctx.canvas.width - (marge * 2), ctx.canvas.height - (marge * 2));

	const forceActuelle = (forceFige !== undefined) ? forceFige : window.niveauForceCourant;
	const jaugeActive = forceActuelle > 0;

	// === GÉOMÉTRIE DU CADRE RÉDUIT ===
	const largeurCadre = jaugeActive ? 150 : 110;
	const hauteurCadre = 125;
	const demiLargeur = largeurCadre / 2;
	const demiHauteur = hauteurCadre / 2;
	const rayonBille = 36;

	// Alignement sous-pixel pour éliminer le flou sur les tracés de cadres fins
	const adj = (ctx.lineWidth % 2 === 1) ? 0.5 : 0;
	const cadreX = Math.floor(x - demiLargeur) + adj;
	
	// === CORRECTIF CRITIQUE : CENTRAGE VERTICAL PARFAIT SUR L'AXE Y ===
	const cadreY = Math.floor(y - demiHauteur) + adj; // Cadre calé précisément autour du centre y
	const arrondiCoins = 12;

	ctx.beginPath();
	ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arrondiCoins);
	ctx.fillStyle = "rgba(11, 15, 23, 0.94)";
	ctx.fill();
	ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
	ctx.lineWidth = 1;
	ctx.stroke();

	// === CENTRAGE HORIZONTAL DES ÉLÉMENTS (BILLE ET JAUGE) ===
	let billeX, jaugeX;
	const jaugeWidth = 8;

	if (jaugeActive) {
		// La zone utile (150px) est segmentée pour équilibrer la bille et la jauge
		billeX = Math.floor(cadreX + 48) + adj;
		jaugeX = Math.floor(cadreX + 122 - (jaugeWidth / 2)) + adj;
	} else {
		// Sans jauge, la bille occupe le centre horizontal absolu
		billeX = Math.floor(cadreX + demiLargeur) + adj;
	}
	
	// L'axe Y de la bille correspond maintenant fidèlement au centre Y du pointeur
	const billeY = Math.floor(y) + adj;

	// --- RENDU 3D ULTRA-LISSE DE LA BILLE BLANCHE (Dégradés adoucis) ---
	ctx.save();
	const degre3D = ctx.createRadialGradient(
		billeX - (rayonBille * 0.28), billeY - (rayonBille * 0.28), rayonBille * 0.05,
		billeX, billeY, rayonBille
	);
	degre3D.addColorStop(0, "#ffffff");
	degre3D.addColorStop(0.25, "#fcfdfe");
	degre3D.addColorStop(0.85, "#e4e9f0");
	degre3D.addColorStop(1, "#b9c3d0");

	ctx.beginPath();
	ctx.arc(billeX, billeY, rayonBille, 0, 2 * Math.PI);
	ctx.fillStyle = degre3D;
	ctx.fill();
	
	// Contour fin de la bille pour détacher les bords proprement
	ctx.strokeStyle = "rgba(16, 22, 34, 0.25)";
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.restore();

	// --- GRILLE DE REPÈRES FINES ET ADOUCIES (Réticule tactique) ---
	ctx.strokeStyle = "rgba(110, 120, 140, 0.25)";
	ctx.lineWidth = 1;
	const cos45 = Math.cos(Math.PI / 4);
	const decalageDiag = rayonBille * cos45;

	ctx.beginPath();
	// Axe vertical
	ctx.moveTo(billeX, billeY - rayonBille);
	ctx.lineTo(billeX, billeY + rayonBille);
	// Axe horizontal
	ctx.moveTo(billeX - rayonBille, billeY);
	ctx.lineTo(billeX + rayonBille, billeY);
	// Diagonale descendante
	ctx.moveTo(billeX - decalageDiag, billeY - decalageDiag);
	ctx.lineTo(billeX + decalageDiag, billeY + decalageDiag);
	// Diagonale montante
	ctx.moveTo(billeX - decalageDiag, billeY + decalageDiag);
	ctx.lineTo(billeX + decalageDiag, billeY - decalageDiag);
	ctx.stroke();

	// --- POINTS D'EFFETS TACTIQUES (Petits boutons de visée contrastés) ---
	const pointActif = (pointIndexFige !== undefined) ? pointIndexFige : (window.indexPointEffetCourant || 0);

	const distanceCentre = 24; 
	const diagPoint = distanceCentre * cos45;
	const pointsEffets = [
		{ dx: 0, dy: 0 },                   // 0 : Centre
		{ dx: 0, dy: -distanceCentre },     // 1 : Haut (Coulé)
		{ dx: 0, dy: distanceCentre },      // 2 : Bas (Rétro)
		{ dx: -distanceCentre, dy: 0 },     // 3 : Gauche
		{ dx: distanceCentre, dy: 0 },      // 4 : Droite
		{ dx: -diagPoint, dy: -diagPoint }, // 5 : Haut-Gauche
		{ dx: diagPoint, dy: -diagPoint },  // 6 : Haut-Droite
		{ dx: -diagPoint, dy: diagPoint },  // 7 : Bas-Gauche
		{ dx: diagPoint, dy: diagPoint }    // 8 : Bas-Droite
	];

				// --- DÉTERMINATION DE LA COULEUR DU POINT ACTIF SELON LA TRAJECTOIRE ---
	let couleurPointActif = "#38bdf8"; // Bleu clair par défaut (Milieu : 0, 3, 4)
	if ([1, 5, 6].includes(pointActif)) {
		couleurPointActif = "#2ecc71"; // Vert (Haut / Coulé : 1, 5, 6)
	} else if ([2, 7, 8].includes(pointActif)) {
		couleurPointActif = "#e74c3c"; // Rouge (Bas / Rétro : 2, 7, 8)
	}


	pointsEffets.forEach((pt, index) => {
		const ptX = billeX + pt.dx;
		const ptY = billeY + pt.dy;
		const estSelectionne = (index === pointActif);
		
		ctx.beginPath();
		// Point actif à 6.5px, repères inactifs réduits à 1.8px
		ctx.arc(ptX, ptY, estSelectionne ? 6.5 : 1.8, 0, 2 * Math.PI);
		
		// Applique la couleur synchronisée avec le tracé de trajectoire
		ctx.fillStyle = estSelectionne ? couleurPointActif : "rgba(100, 116, 139, 0.22)";
		ctx.fill();
		
		// Contour blanc sur le point actif pour le détacher proprement sur la bille blanche
		ctx.strokeStyle = estSelectionne ? "#ffffff" : "rgba(15, 23, 42, 0.12)";
		ctx.lineWidth = estSelectionne ? 1.8 : 0.8;
		ctx.stroke();
	});



		// --- LABELS ET TYPOGRAPHIE SYSTEM-UI ---
	ctx.fillStyle = "rgba(150, 165, 185, 0.85)";
	ctx.font = "600 10px system-ui, -apple-system, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "bottom";
	ctx.fillText("EFFET", billeX, billeY - rayonBille - 8);

	// --- NOUVEAU : LIBELLÉ DE L'EFFET SOUS LA BILLE BLANCHE ---
	const nomsEffets = [
		"AUCUN",       // 0
		"COULÉ",        // 1
		"RÉTRO",        // 2
		"GAUCHE",       // 3
		"DROITE",       // 4
		"COULÉ G.",     // 5
		"COULÉ D.",     // 6
		"RÉTRO G.",     // 7
		"RÉTRO D."      // 8
	];
	const texteEffet = nomsEffets[pointActif] || "CENTRE";

	ctx.fillStyle = couleurPointActif;
	ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	ctx.fillText(texteEffet, billeX, billeY + rayonBille + 8);


	// --- JAUGE DE PUISSANCE COMPACTE ET CENTRÉE VERTICALEMENT ---
	if (jaugeActive) {
		const jaugeHeight = rayonBille * 2;

		ctx.fillStyle = "rgba(150, 165, 185, 0.85)";
		ctx.textBaseline = "bottom";
		ctx.fillText("FORCE", jaugeX + (jaugeWidth / 2), billeY - rayonBille - 8);

		const grad = ctx.createLinearGradient(jaugeX, billeY + rayonBille, jaugeX, billeY - rayonBille);
		grad.addColorStop(0, "#2ecc71");
		grad.addColorStop(0.4, "#f1c40f");
		grad.addColorStop(0.7, "#e67e22");
		grad.addColorStop(1, "#e74c3c");

		ctx.save();
		ctx.beginPath();
		ctx.roundRect(jaugeX, billeY - rayonBille, jaugeWidth, jaugeHeight, 4);
		ctx.fillStyle = grad;
		ctx.fill();
		ctx.restore();

		const hauteurCibleY = Math.floor((billeY + rayonBille) - ((forceActuelle / 4) * jaugeHeight)) + adj;

		// Curseur flèche indicateur de force (repositionné à gauche de la jauge)
		ctx.fillStyle = "#ffffff";
		ctx.beginPath();
		ctx.moveTo(jaugeX - 3, hauteurCibleY);
		ctx.lineTo(jaugeX - 7, hauteurCibleY - 3);
		ctx.lineTo(jaugeX - 7, hauteurCibleY + 3);
		ctx.closePath();
		ctx.fill();

		// Ligne de coupe blanche sur la jauge
		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(jaugeX, hauteurCibleY);
		ctx.lineTo(jaugeX + jaugeWidth, hauteurCibleY);
		ctx.stroke();

		// Valeur numérique de la puissance
		ctx.fillStyle = couleursForce[forceActuelle];
		ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
		ctx.textBaseline = "top";
		ctx.fillText(`${forceActuelle * 25}%`, jaugeX + (jaugeWidth / 2), billeY + rayonBille + 8);
	}

	ctx.restore();
}


	function dessinerRepereXGras(x, y, couleur, texteFige) {
		ctx.save();

		// --- 1. CONFIGURATION DES BANDES DE SÉCURITÉ ---
		const marge = 18;
		let zoneUtileX = marge;
		let zoneUtileY = marge;
		let zoneUtileLargeur = ctx.canvas.width - (marge * 2);
		let zoneUtileHauteur = ctx.canvas.height - (marge * 2);

		ctx.save();
		ctx.beginPath();
		ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
		ctx.clip();
		ctx.restore();

		// --- 2. CONFIGURATION DU STYLE ET SÉLECTION DU MODE ---
		const couleurTrace = couleur || (colorSelect ? colorSelect.value : '#ffffff');
		ctx.setLineDash([]);

		// Extraction du texte à afficher (figé pour sauvegarde ou dynamique pour l'aperçu)
		const texteAAfficher = (texteFige !== undefined) ? texteFige : window.repereXTexte;
		const estUnCercle = (texteFige === undefined) ? window.repereXEstUnCercle : (texteFige === null && window.repereXEstUnCercle);

		// --- 3. AIGUILLAGE LOGIQUE NETTOYÉ ---
		if (texteAAfficher) {
			// CAS 1 : Affichage de texte (A-F, 1-6)
			rendreTexteRepere(x, y, texteAAfficher, couleurTrace);
		} else if (estUnCercle) {
			// CAS 2 : Affichage du cercle pointillé (0 pointe)
			rendreCercleRepere(x, y, couleurTrace);
		} else {
			// CAS 3 : Affichage de l'étoile (4 ou 6 branches)
			const branches = (texteFige === undefined) ? window.nombreBranchesRepereX : (window.nombreBranchesRepereX || 4);
			rendreEtoileRepere(x, y, couleurTrace, branches);
		}

		ctx.restore();
	}

	// === SOUS-FONCTIONS DE RENDU SPÉCIALISÉES POUR LE REPÈRE X ===

	function rendreTexteRepere(x, y, texte, couleur) {
		ctx.fillStyle = couleur;
		ctx.font = "bold 24px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(texte, x, y);
	}

	function rendreCercleRepere(x, y, couleur) {
		const rayon = 12; // Équivalent à 12px
		ctx.beginPath();
		ctx.arc(x, y, rayon, 0, 2 * Math.PI);
		ctx.closePath();

		// Remplissage du fond avec plus de transparence (Opacité baissée de 0.80 à 0.25)
		ctx.save();
		ctx.globalAlpha = 0.25; // <-- Ajustez cette valeur (ex: 0.10 pour encore plus transparent)
		ctx.fillStyle = couleur;
		ctx.fill();
		ctx.restore();

		// Tracé du contour en pointillés fins serrés (Reste bien visible et net)
		ctx.strokeStyle = couleur;
		ctx.lineWidth = 1.5;
		ctx.setLineDash([2, 2]);
		ctx.stroke();

		ctx.setLineDash([]); // Réinitialisation du style de tracé
	}

	function rendreEtoileRepere(x, y, couleur, branches) {
		ctx.strokeStyle = couleur;
		ctx.lineWidth = 2.5;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		ctx.beginPath();

		const rayonExterne = 12; // 12px
		const rayonInterne = 5.5;

		for (let i = 0; i < 2 * branches; i++) {
			const rayon = (i % 2 === 0) ? rayonExterne : rayonInterne;
			const angle = (i * Math.PI) / branches - (Math.PI / 2);

			const coordX = x + Math.cos(angle) * rayon;
			const coordY = y + Math.sin(angle) * rayon;

			if (i === 0) {
				ctx.moveTo(coordX, coordY);
			} else {
				ctx.lineTo(coordX, coordY);
			}
		}
		ctx.closePath();

		ctx.globalAlpha = 0.80;
		ctx.fillStyle = couleur;
		ctx.fill();
		ctx.globalAlpha = 1.0;
		ctx.stroke();
	}

	function dessinerPointeFleche(fromX, fromY, toX, toY, couleur) {
		const arrowLength = 14;
		const arrowAngle = Math.PI / 6;
		const angle = Math.atan2(toY - fromY, toX - fromX);

		// Ajustement : Augmentez cette valeur pour avancer la pointe (ex: 2 ou 3 pixels, ou ctx.lineWidth / 2)
		const offset = 4;
		const tipX = toX + offset * Math.cos(angle);
		const tipY = toY + offset * Math.sin(angle);

		ctx.save();
		ctx.setLineDash([]);

		ctx.fillStyle = couleur || (colorSelect ? colorSelect.value : '#ffffff');

		ctx.beginPath();
		// On part du nouveau point ajusté (tipX, tipY) au lieu de (toX, toY)
		ctx.moveTo(tipX, tipY);
		ctx.lineTo(
			tipX - arrowLength * Math.cos(angle - arrowAngle),
			tipY - arrowLength * Math.sin(angle - arrowAngle)
		);
		ctx.lineTo(
			tipX - arrowLength * Math.cos(angle + arrowAngle),
			tipY - arrowLength * Math.sin(angle + arrowAngle)
		);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	function dessinerCible(x, y, couleur) {
	ctx.save(); // Sauvegarde l'état global du canvas

	// === FORCE LE LISSAGE ET LES LIGNES PLEINES POUR LA CIBLE ===
	ctx.setLineDash([]);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	// --- 1. DÉFINITION DES BANDES DE SÉCURITÉ ---
	let bandeGauche = 18;
	let bandeDroite = 18;
	let bandeHaut = 18;
	let bandeBas = 18;

	// --- 2. CRÉATION DE LA ZONE DE DÉCOUPE AVEC DIMENSIONS LOGIQUES ---
	const dpr = window.devicePixelRatio || 1;
	const canvasLogicalWidth = ctx.canvas.width / dpr;
	const canvasLogicalHeight = ctx.canvas.height / dpr;

	let zoneUtileX = bandeGauche;
	let zoneUtileY = bandeHaut;
	let zoneUtileLargeur = canvasLogicalWidth - bandeGauche - bandeDroite;
	let zoneUtileHauteur = canvasLogicalHeight - bandeHaut - bandeBas;

	ctx.beginPath();
	ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
	ctx.clip(); 

	// Ajustement de 0.5px pour éviter le flou de pixel-straddling sur les lignes fines
	const adjX = (ctx.lineWidth % 2 === 1) ? 0.5 : 0;
	const posX = x + adjX;
	const posY = y + adjX;

	// --- 3. DESSIN DU FOND ULTRA-DOUX A 20% (Plus élégant que 30%) ---
	ctx.save();
	ctx.fillStyle = couleur;
	ctx.globalAlpha = 0.20;

	ctx.beginPath();
	ctx.roundRect(posX - 87.5, posY - 87.5, 175, 175, 8);
	ctx.fill();
	ctx.restore();

	// --- 4. DESSIN DES CONTOURS DE LA CIBLE ---
	ctx.strokeStyle = couleur;
	ctx.lineWidth = 1.5; // Légèrement affiné pour un rendu plus net et soigné
	ctx.lineCap = 'round';

	// Carré extérieur avec coins arrondis
	ctx.beginPath();
	ctx.roundRect(posX - 87.5, posY - 87.5, 175, 175, 8);
	ctx.stroke();

	// Cercles de la cible
	let r1 = 87.5;
	let r2 = r1 * (2 / 3);
	let r3 = r1 * (1 / 3);

	ctx.beginPath();
	ctx.arc(posX, posY, r1, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(posX, posY, r2, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(posX, posY, r3, 0, 2 * Math.PI);
	ctx.stroke();

	// Lignes réticulaires se croisant au centre
	ctx.beginPath();
	ctx.moveTo(posX - r1, posY);
	ctx.lineTo(posX + r1, posY);
	ctx.moveTo(posX, posY - r1);
	ctx.lineTo(posX, posY + r1);
	ctx.stroke();

	// --- 5. CONFIGURATION ET ROTATION DU CADRAN DES CHIFFRES ---
	ctx.fillStyle = couleur;
	ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	let distCoin = r1 * Math.sqrt(2);
	let dist1 = r1 + (distCoin - r1) / 2;
	let dist2 = r2 + (r1 - r2) / 2;
	let dist3 = r3 + (r2 - r3) / 2;
	let dist5 = r3 / 2;

	const indexQuadrant = window.quadrantCibleCourant || 0;
	const angleRotation = (Math.PI / 4) + (indexQuadrant * (Math.PI / 2));

	const cosAngle = Math.cos(angleRotation);
	const sinAngle = Math.sin(angleRotation);

	ctx.fillText("1", posX + dist1 * cosAngle, posY + dist1 * sinAngle);
	ctx.fillText("2", posX + dist2 * cosAngle, posY + dist2 * sinAngle);
	ctx.fillText("3", posX + dist3 * cosAngle, posY + dist3 * sinAngle);
	ctx.fillText("5", posX + dist5 * cosAngle, posY + dist5 * sinAngle);

	ctx.restore(); 
}



	function dessinerCarre(x, y, couleur) {
		ctx.save();

		// --- 1. CONFIGURATION DES BANDES DE SÉCURITÉ (CORRIGÉ POUR LE ZOOM) ---
		const marge = 18;
		const dpr = window.devicePixelRatio || 1;
		const canvasLogicalWidth = ctx.canvas.width / dpr;
		const canvasLogicalHeight = ctx.canvas.height / dpr;

		let zoneUtileX = marge;
		let zoneUtileY = marge;
		let zoneUtileLargeur = canvasLogicalWidth - (marge * 2);
		let zoneUtileHauteur = canvasLogicalHeight - (marge * 2);

		ctx.beginPath();
		ctx.rect(zoneUtileX, zoneUtileY, zoneUtileLargeur, zoneUtileHauteur);
		ctx.clip();

		// --- 2. CONFIGURATION DU STYLE ---
		ctx.setLineDash([]);
		ctx.strokeStyle = couleur;
		ctx.lineWidth = 2;

		const taille = window.tailleCarreCourante || 95;
		const demiTaille = taille / 2;
		const rayonCoins = 15;

		ctx.beginPath();
		ctx.roundRect(x - demiTaille, y - demiTaille, taille, taille, rayonCoins);

		// Configurer et appliquer le fond pâle (20% d'opacité)
		ctx.globalAlpha = 0.20;
		ctx.fillStyle = couleur;
		ctx.fill();

		ctx.restore();
	}

	function dessinerBreakBoxMatchroom() {
		ctx.save();

		// --- 1. CONFIGURATION DU STYLE FIN ET TRANSPARENT (STYLE TRANSVERSALE UNIQUE) ---
		ctx.setLineDash([]); // Lignes pleines et continues
		ctx.strokeStyle = "rgba(255, 255, 255, 0.35)"; // Blanc semi-transparent très doux pour s'harmoniser avec votre ligne existante
		ctx.lineWidth = 1; // Épaisseur stricte de 1 pixel

		// Repères géométriques réels issus de votre application (754x364, Origine X=19, Y=18)
		const gridLeft = 19;
		const gridTop = 18;
		const gridWidth = 754;

		// --- 2. CALCUL DES LIMITES GÉOMÉTRIQUES CORRIGÉES ---
		// La ligne transversale existante (Head String) est située à 1/4 du tapis de jeu
		const headStringX = gridLeft + (gridWidth / 4); // 207.5px

		// Coordonnées verticales réduites pour correspondre à vos repères
		const limiteHauteY = gridTop + 122;
		const limiteBasseY = gridTop + 242;

		// --- 3. RENDU DES DEUX LIGNES HORIZONTALES ---
		ctx.beginPath();
		// Ligne de délimitation haute
		ctx.moveTo(gridLeft, limiteHauteY);
		ctx.lineTo(headStringX, limiteHauteY);

		// Ligne de délimitation basse
		ctx.moveTo(gridLeft, limiteBasseY);
		ctx.lineTo(headStringX, limiteBasseY);

		ctx.stroke();

		ctx.restore();
	}

	function dessinerTriangle14_1() {
		ctx.save();

		// ====================================================================
		// 🛠️ ZONE D'AJUSTEMENT MANUEL (Modifiez ces valeurs en pixels)
		// ====================================================================
		const ajustementX = 8; // Valeur positive = Droite, Valeur négative = Gauche
		const ajustementY = 13; // Valeur positive = Bas, Valeur négative = Haut
		// ====================================================================

		// --- CONFIGURATION DU STYLE EXTRA-FIN EN 1PX ---
		ctx.setLineDash([]);
		ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
		ctx.lineWidth = 1;

		// Constantes de positionnement issues de votre code (Source 2 & 3)
		const apexX = 573;
		const apexY = 185;
		const dx = 20.8;
		const dy = 24;
		const r = 12; // Rayon exact d'une bille

		// --- CALCUL DE LA BASE EXTÉRIEURE D'ORIGINE ---
		const angleOblique = Math.atan2(dy, 2 * dx);
		const correctionVerticale = r / Math.cos(angleOblique);
		const baseArriereX = apexX + (4 * dx) + r;

		// --- ENVELOPPEMENT ET RETRAIT DE 4 PIXELS PÉRIQUÉRIQUES ---
		const margeAgrandissement = 6;

		// Calcul des coordonnées des sommets (points d'ancrage théoriques pour les arcs)
		const sommetAvantX = (apexX - correctionVerticale) + ajustementX - margeAgrandissement;
		const sommetAvantY = apexY + ajustementY;

		const sommetArriereHautX = baseArriereX + ajustementX + margeAgrandissement;
		const sommetArriereHautY = (apexY - (2 * dy) - correctionVerticale) + ajustementY - margeAgrandissement;

		const sommetArriereBasX = baseArriereX + ajustementX + margeAgrandissement;
		const sommetArriereBasY = (apexY + (2 * dy) + correctionVerticale) + ajustementY + margeAgrandissement;

		// Rayon de la courbure des angles (ajustable)
		const rayonArrondi = 6;

		// --- TRACÉ DU CADRE DU TRIANGLE AVEC COINS ARRONDIS ---
		ctx.beginPath();

		// On commence le tracé au milieu du côté arrière vertical pour dessiner proprement les virages
		const milieuArriereY = (sommetArriereHautY + sommetArriereBasY) / 2;
		ctx.moveTo(sommetArriereHautX, milieuArriereY);

		// Angle arrière-haut
		ctx.arcTo(sommetArriereHautX, sommetArriereHautY, sommetAvantX, sommetAvantY, rayonArrondi);

		// Angle de la pointe avant (Apex)
		ctx.arcTo(sommetAvantX, sommetAvantY, sommetArriereBasX, sommetArriereBasY, rayonArrondi);

		// Angle arrière-bas
		ctx.arcTo(sommetArriereBasX, sommetArriereBasY, sommetArriereHautX, sommetArriereHautY, rayonArrondi);

		ctx.closePath();

		ctx.stroke();
		ctx.restore();
	}

	function dessinerZoneGrille(zoneIndex, couleur, mode) {
		ctx.save();
		ctx.setLineDash([]); // Réinitialisation par sécurité

		// Désactiver la bordure
		ctx.strokeStyle = "transparent";
		ctx.lineWidth = 0;

		// Configuration géométrique de la table
		const gridLeft = 19;
		const gridTop = 18;
		const gridWidth = 754;
		const gridHeight = 364;

		// Grille : 4 horizontales par 2 verticales
		const cols = 4;
		const rows = 2;
		const pasX = gridWidth / cols;
		const pasY = gridHeight / rows;

		// Convertir l'index (1 à 8) en index de tableau (0 à 7)
		const idx = zoneIndex - 1;
		const r = Math.floor(idx / cols);
		const c = idx % cols;

		// Calcul des positions physiques du coin haut-gauche de la zone
		const x = gridLeft + (c * pasX);
		const y = gridTop + (r * pasY);
		const rayonCoins = 20;

		// Crée le chemin de la zone avec coins arrondis
		ctx.beginPath();
		ctx.roundRect(x, y, pasX, pasY, rayonCoins);

		const couleurBlanche = "#ffffff";

				if (mode === 'alternatif') {
			// === CAS ZONE ARRIVÉE (ZA) : REMPLISSAGE HACHURES ÉPAISSES & LÉGÈRES ===
			ctx.save();
			const patternCanvas = document.createElement('canvas');
			const pCtx = patternCanvas.getContext('2d');

			patternCanvas.width = 16;
			patternCanvas.height = 16;

			pCtx.strokeStyle = couleurBlanche;
			pCtx.lineWidth = 4;
			pCtx.beginPath();
			pCtx.moveTo(0, 16);
			pCtx.lineTo(16, 0);
			pCtx.stroke();

			const pattern = ctx.createPattern(patternCanvas, 'repeat');
			ctx.fillStyle = pattern;
			ctx.globalAlpha = 0.18;
			ctx.fill();
			ctx.restore();
		} else if (mode === 'sans-inscription-hachure') {
			// === NOUVEAU : CAS ZA SANS ANNOTATION (HACHURES SEULES) ===
			ctx.save();
			const patternCanvas = document.createElement('canvas');
			const pCtx = patternCanvas.getContext('2d');

			patternCanvas.width = 16;
			patternCanvas.height = 16;

			pCtx.strokeStyle = couleurBlanche;
			pCtx.lineWidth = 4;
			pCtx.beginPath();
			pCtx.moveTo(0, 16);
			pCtx.lineTo(16, 0);
			pCtx.stroke();

			const pattern = ctx.createPattern(patternCanvas, 'repeat');
			ctx.fillStyle = pattern;
			ctx.globalAlpha = 0.18;
			ctx.fill();
			ctx.restore();
		} else if (mode === 'sans-inscription') {
			// === CAS ZONE ANONYME (SANS CHIFFRE NI LETTRE) : REMPLISSAGE SOLIDE SEUL ===
			ctx.globalAlpha = 0.18;
			ctx.fillStyle = couleurBlanche;
			ctx.fill();
		} else {
			// === CAS ZONE DÉPART (ZD) : REMPLISSAGE SOLIDE BLANC PÂLE ===
			ctx.globalAlpha = 0.18;
			ctx.fillStyle = couleurBlanche;
			ctx.fill();
		}

		// --- MODIFIÉ : LE BLOC CI-DESSOUS S'EXÉCUTE UNIQUEMENT SI LE MODE N'EST PAS ANONYME ---
		if (mode !== 'sans-inscription' && mode !== 'sans-inscription-hachure') {
			ctx.fillStyle = couleurBlanche;
			ctx.font = "bold 20px sans-serif";
			const marge = 18;
			const opaciteTexte = 0.2;

			// 1. DESSIN DU TEXTE « ZD » OU « ZA » (PETIT, EN HAUT À DROITE)
			ctx.save();
			ctx.globalAlpha = opaciteTexte;
			ctx.textAlign = "right";
			ctx.textBaseline = "top";

			const textPrefixe = (mode === 'alternatif') ? "ZA" : "ZD";
			ctx.fillText(textPrefixe, x + pasX - marge, y + marge);
			ctx.restore();

			// 2. DESSIN DU CHIFFRE UNIQUE IDENTIQUE (EN BAS À GAUCHE)
			ctx.save();
			ctx.globalAlpha = opaciteTexte;
			ctx.textAlign = "left";
			ctx.textBaseline = "bottom";

			const positionChiffreX = x + marge;
			const positionChiffreY = y + pasY - marge;

			ctx.fillText(zoneIndex, positionChiffreX, positionChiffreY);
			ctx.restore();
		}


		ctx.restore();
	}

	function resizeCanvas() {
		// 1. Récupérer le facteur de zoom (pixel ratio) du navigateur
		const dpr = window.devicePixelRatio || 1;

		// 2. Définir la taille d'affichage CSS (ce que l'utilisateur voit)
		canvas.style.width = table.clientWidth + 'px';
		canvas.style.height = table.clientHeight + 'px';

		// 3. Multiplier la résolution interne du canvas par le DPR pour éviter le flou
		canvas.width = table.clientWidth * dpr;
		canvas.height = table.clientHeight * dpr;

		// 4. Normaliser le contexte de dessin pour ne pas avoir à réécrire vos fonctions
		ctx.scale(dpr, dpr);

		// 5. Appliquer les styles et redessiner
		const modeDashed = dashedCheck ? dashedCheck.checked : false;
		configurerStyleDessin(null, modeDashed);
		window.redessinerToutesLesLignes();
	}

	window.addEventListener('resize', resizeCanvas);

	// Écoute de manière agressive les changements de pixel ratio (Zoom navigateur)
	matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', function() {
		resizeCanvas();
	}, {
		once: true
	});

	// Redessine l'ensemble des calques de dessin (lignes, flèches et cibles)
	window.redessinerToutesLesLignes = function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// --- NOUVEAU : Affichage automatique de la Breakbox Matchroom ---
		const ballsCountSelect = document.getElementById('select-balls-count');
		if (ballsCountSelect && ballsCountSelect.value === "9-matchroom") {
			dessinerBreakBoxMatchroom();
		}

		// NOUVEAU : Affichage du contour du triangle pour le 14.1
		if (ballsCountSelect && ballsCountSelect.value === "14.1") {
			dessinerTriangle14_1();
		}

		window.dessinsSauvegardes.forEach(dessin => {

			if (dessin.estCible) {
				if (dessin.points && dessin.points.length > 0) {
					const centre = dessin.points[0];
					const tempQuadrant = window.quadrantCibleCourant;
					window.quadrantCibleCourant = dessin.hasOwnProperty('quadrant') ? dessin.quadrant : 0;
					
					dessinerCible(centre.x, centre.y, window.COULEUR_CIBLE_TACTIQUE || '#cbd5e1');
					window.quadrantCibleCourant = tempQuadrant;
				}
				return;
			}
			
		if (dessin.estGhostBall) {
			if (dessin.points && dessin.points.length > 0) {
				dessinerBilleFantome(dessin.points[0].x, dessin.points[0].y, dessin.couleur, dessin);
		}
		return;
	}


			if (dessin.estPointContact) {
				if (dessin.points && dessin.points.length > 0) {
					const centre = dessin.points[0]; // Extraction du premier point du tableau [{x, y}]
					dessinerPointContact(centre.x, centre.y, dessin.couleur, dessin.pourcentage, dessin.cote);
				}
				return;
			}

			if (dessin.estCarre) {
				if (dessin.points && dessin.points.length > 0) {
					const centre = dessin.points[0];
					const tempTaille = window.tailleCarreCourante;
					window.tailleCarreCourante = dessin.taille || 95;
					dessinerCarre(centre.x, centre.y, window.COULEUR_CARRE_TACTIQUE || '#cbd5e1');
					window.tailleCarreCourante = tempTaille;
				}
				return;
			}

			// === GESTION DE LA FORME D'EFFETS BILLE BLANCHE SAUVEGARDÉE ===
			if (dessin.estEffetBlanche) {
	if (dessin.points && dessin.points.length > 0) {
		const centre = dessin.points[0];
		const forceDuDessin = dessin.hasOwnProperty('force') ? dessin.force : 0;
		const pointDuDessin = dessin.hasOwnProperty('pointEffet') ? dessin.pointEffet : 0;
		dessinerEffetsBilleBlanche(centre.x, centre.y, dessin.couleur, forceDuDessin, pointDuDessin);
	}
	return;
}



			if (dessin.estRepereX) {
				if (dessin.points && dessin.points[0]) {
					const centre = dessin.points[0];
					const tempCercle = window.repereXEstUnCercle;
					const tempBranches = window.nombreBranchesRepereX;
					window.repereXEstUnCercle = dessin.hasOwnProperty('estUnCercle') ? dessin.estUnCercle : false;
					window.nombreBranchesRepereX = dessin.branches || 8;

					dessinerRepereXGras(centre.x, centre.y, dessin.couleur, dessin.texte);

					window.repereXEstUnCercle = tempCercle;
					window.nombreBranchesRepereX = tempBranches;
				}
				return;
			}

			if (dessin.estZoneGrille) {
				dessinerZoneGrille(dessin.zoneId, dessin.couleur, dessin.mode);
				return;
			}

			// Gestion des tracés standards et lignes droites
			if (dessin.points.length < 2) return;
			configurerStyleDessin(dessin.couleur, dessin.estPointille);
			ctx.beginPath();
			ctx.moveTo(dessin.points[0].x, dessin.points[0].y);

			if (dessin.estDroite) {
				const d_point = dessin.points[dessin.points.length - 1];
				ctx.lineTo(d_point.x, d_point.y);
				ctx.stroke();

				if (dessin.avecFleche) {
					dessinerPointeFleche(dessin.points[0].x, dessin.points[0].y, d_point.x, d_point.y, dessin.couleur);
				}
			} else {
				for (let i = 1; i < dessin.points.length; i++) {
					ctx.lineTo(dessin.points[i].x, dessin.points[i].y);
				}
				ctx.stroke();
			}
		});


				// === SURBRILLANCE ADAPTATIVE SELON LA FORME TACTIQUE SÉLECTIONNÉE ===
				if (window.formeTactiqueSelectionnee && window.formeTactiqueSelectionnee.points && window.formeTactiqueSelectionnee.points.length > 0) {
			const f = window.formeTactiqueSelectionnee;
			const pt = f.points[0];
			
			ctx.save();
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 1.5;
			ctx.setLineDash([4, 4]); // Pointillés fins blancs
			ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
			ctx.shadowBlur = 4;

			if (f.estCible) {
				// Épouse exactement le carré extérieur de 175x175 (marge de 3px)
				ctx.beginPath();
				ctx.roundRect(pt.x - 90.5, pt.y - 90.5, 181, 181, 10);
				ctx.stroke();
			} 
			else if (f.estCarre) {
				// Épouse la taille exacte du carré sélectionné (95, 135 ou 180)
				const taille = (f.taille || 95) + 6;
				const demi = taille / 2;
				ctx.beginPath();
				ctx.roundRect(pt.x - demi, pt.y - demi, taille, taille, 17);
				ctx.stroke();
			} 
			else if (f.estPointContact) {
				// Épouse le panneau Contact (150x125 + 6px de marge)
				ctx.beginPath();
				ctx.roundRect(pt.x - 78, pt.y - 65.5, 156, 131, 14);
				ctx.stroke();
			}

			else if (f.estEffetBlanche) {
				// Épouse le panneau Effets selon la présence de la jauge (150x125 ou 110x125)
				const largeur = (f.force > 0 ? 150 : 110) + 6;
				const hauteur = 125 + 6;
				ctx.beginPath();
				ctx.roundRect(pt.x - (largeur / 2), pt.y - (hauteur / 2), largeur, hauteur, 14);
				ctx.stroke();
			} 
			else if (f.estRepereX) {
				// Cercle ajusté autour de l'étoile, du cercle ou de la lettre
				ctx.beginPath();
				ctx.arc(pt.x, pt.y, 17, 0, 2 * Math.PI);
				ctx.stroke();
			}
			else if (f.estGhostBall) {
				// Cercle ajusté autour de la bille fantôme (rayon bille 12px + marge 4px)
				ctx.beginPath();
				ctx.arc(pt.x, pt.y, 16, 0, 2 * Math.PI);
				ctx.stroke();
			}

			ctx.restore();
		}





		// === RENDU EN DIRECT DE L'APERÇU FANTÔME (SOUS LE CURSEUR) ===
		// CORRECTION : On détermine l'outil actif qu'il vienne de la palette OU du clavier
		const formeActive = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
		const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact', 'ghostBall'];

		if (listeFormesTactiques.includes(formeActive)) {
			ctx.save();
			ctx.globalAlpha = 0.40; // Translucide pour l'aperçu dynamique

			let couleurActive = colorSelect ? colorSelect.value : '#ffffff';
			if (window.billeSelectionneeCourante) {
				couleurActive = window.billeSelectionneeCourante.style.backgroundColor;
			}
			
			if (formeActive === 'ghostBall') dessinerBilleFantome(mouseX, mouseY, couleurActive);

			if (formeActive === 'cible') dessinerCible(mouseX, mouseY, window.COULEUR_CIBLE_TACTIQUE || '#cbd5e1');
			if (formeActive === 'carre') dessinerCarre(mouseX, mouseY, window.COULEUR_CARRE_TACTIQUE || '#cbd5e1');
			if (formeActive === 'repereX') dessinerRepereXGras(mouseX, mouseY, couleurActive);
			if (formeActive === 'effetBlanche') {
	dessinerEffetsBilleBlanche(
		mouseX, 
		mouseY, 
		couleurActive, 
		window.niveauForceCourant, 
		window.indexPointEffetCourant || 0
	);
}

			if (formeActive === 'pointContact') dessinerPointContact(mouseX, mouseY, couleurActive, window.pourcentageContactCourant, window.coteContactCourant);

			ctx.restore();
		}
		
		if (typeof majBarreReglageGhost === "function") majBarreReglageGhost();


		const modeDashed = dashedCheck ? dashedCheck.checked : false;
		configurerStyleDessin(null, modeDashed);
	};

	function annulerDernierTrace() {
		if (window.dessinsSauvegardes.length > 0) {
			window.dessinsSauvegardes.pop();
			window.redessinerToutesLesLignes();
		}
	}

	const colorSelectElement = document.getElementById('marker-color');
	if (colorSelectElement) {
		const mettreAJourCouleurPalette = () => {
			// 1. Assigne la couleur au contexte du canvas
			ctx.strokeStyle = colorSelectElement.value;

			// ====================================================================
			// CORRECTION : NETTOYAGE COMPLET DES SÉLECTIONS ET DES CONTOURS (.ball)
			// ====================================================================
			// Supprime l'outline de la variable mémorisée
			if (window.billeSelectionneeCourante) {
				window.billeSelectionneeCourante.style.outline = 'none';
				window.billeSelectionneeCourante.style.outlineOffset = '';
				window.billeSelectionneeCourante = null;
			}

			// Sécurité : Nettoie graphiquement toutes les billes du tapis
			if (Array.isArray(activeBalls)) {
				activeBalls.forEach(b => {
					b.style.outline = 'none';
					b.style.outlineOffset = '';
				});
			}

			// Met à jour l'affichage de la liste latérale pour enlever la surbrillance active
			if (typeof rafraichirListeLateraleBilles === "function") {
				rafraichirListeLateraleBilles();
			}

			// 3. Force le rafraîchissement immédiat du bouton couleur et des libellés
			if (typeof rafraichirTexteBoutonsPalette === "function") {
				rafraichirTexteBoutonsPalette();
			}
		};

		// 'input' capte le changement en temps réel pendant le glissement sur PC/Mac
		colorSelectElement.addEventListener('input', mettreAJourCouleurPalette);
		// 'change' valide la sélection définitive (notamment sur iPad/iPhone)
		colorSelectElement.addEventListener('change', mettreAJourCouleurPalette);
	}

	if (clearBtn) {

		// Fonction utilitaire pour nettoyer les poches en cascade
		const viderToutesLesPoches = () => {
			const toutesLesPoches = document.querySelectorAll('.pocket');
			toutesLesPoches.forEach(p => {
				p.style.setProperty('--pocket-color', '#000000');
			});
		};

		// Événement pour l'iPad / iPhone
		clearBtn.addEventListener('touchstart', (e) => {
			if (e.cancelable) e.preventDefault();
			e.stopPropagation(); // Sécurité tactile active

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			window.dessinsSauvegardes = [];

			// NOUVEAU : Réinitialise le cœur de toutes les poches
			viderToutesLesPoches();

			if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();

			clearBtn.blur();
			const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
			if (btnSelect) btnSelect.click();
		}, {
			passive: false
		});

		// Événement pour le PC / Mac
		clearBtn.addEventListener('click', (e) => {
			if (e.pointerType === 'touch' || (e.clientX === 0 && e.clientY === 0)) return; 
			e.stopPropagation();

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			window.dessinsSauvegardes = [];

			// NOUVEAU : Réinitialise le cœur de toutes les poches
			viderToutesLesPoches();

			if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();

			clearBtn.blur();
			const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
			if (btnSelect) btnSelect.click();
		});
	}


			if (undoBtn) {
		// Événement pour l'iPad / iPhone (Tactile)
		undoBtn.addEventListener('touchstart', (e) => {
			if (e.cancelable) e.preventDefault();
			e.stopPropagation(); // Bloque le tracé parasite sous le bouton

			// 1. On mémorise l'outil qui était actif JUSTE AVANT le clic
			const outilAcocher = window.outilTraceActif;

			// 2. On effectue l'annulation
			annulerDernierTrace();

			// 3. On force l'interface à remettre le focus sur l'outil précédent
			if (outilAcocher) {
				const btnPrecedent = document.querySelector(`.tool-btn[data-tool="${outilAcocher}"]`);
				if (btnPrecedent) {
					btnPrecedent.click();
				}
			}
			undoBtn.blur();
		}, {
			passive: false
		});

		// Événement pour le PC / Mac (Souris)
		undoBtn.addEventListener('click', (e) => {
			if (e.pointerType === 'touch' || (e.clientX === 0 && e.clientY === 0)) return; 
			e.stopPropagation();

			const outilAcocher = window.outilTraceActif;

			annulerDernierTrace();

			if (outilAcocher) {
				const btnPrecedent = document.querySelector(`.tool-btn[data-tool="${outilAcocher}"]`);
				if (btnPrecedent) {
					btnPrecedent.click();
				}
			}
			undoBtn.blur();
		});
	}



	// === GESTION AUTONOME DE LA CASE À COCHER "DESSINS/TRACÉS" ===
	if (toggleDrawingsCheck) {
		toggleDrawingsCheck.addEventListener('change', () => {
			canvas.style.visibility = toggleDrawingsCheck.checked ? 'visible' : 'hidden';
		});
	}

// --- LOGIQUE DE CLAVIER ET RACCOURCIS CORRIGÉE ---
document.addEventListener('keydown', (e) => {
	if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
		return;
	}

	// [FIX SÉCURITÉ ULTRA-STRICTE] : Verrouillage total du mode lecture seule
	if (window.isViewMode) {
		const toucheMinuscule = e.key.toLowerCase();
		
		// On autorise UNIQUEMENT la touche 'H' (Masquer/Afficher les tracés)
		if (toucheMinuscule !== 'h') {
			// Bloque l'action native (ex: le défilement de page avec les flèches du clavier)
			if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'escape'].includes(toucheMinuscule)) {
				e.preventDefault();
			}
			return; // Fin de l'exécution immédiate pour toutes les autres touches (chiffres, T, Z, P, 0...)
		}
	}

	// 1. Gestion de l'annulation (S'exécute uniquement si isViewMode est faux grâce au return précédent)
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
		e.preventDefault();
		annulerDernierTrace();
		return;
	}
    
    

	if (e.key === 'Shift') {
		isShiftPressed = true;
		canvas.style.pointerEvents = 'auto';
	}
	if (e.key === 'Control') {
		isCtrlPressed = true;
	}

	if (e.key.toLowerCase() === 't') {
		e.preventDefault();
		if (outilActif === 'cible') {
			window.quadrantCibleCourant = (window.quadrantCibleCourant + 1) % 4;
		} else {
			outilActif = 'cible';
		}
		if (outilActif) canvas.style.pointerEvents = 'auto';
		window.redessinerToutesLesLignes();
	}
	
	if (e.key.toLowerCase() === 'g') {
		e.preventDefault();
		outilActif = (outilActif === 'ghostBall') ? null : 'ghostBall';
		if (outilActif) canvas.style.pointerEvents = 'auto';
		window.redessinerToutesLesLignes();
	}


	if (e.key.toLowerCase() === 'p') {
		e.preventDefault();
		if (outilActif !== 'pointContact') {
			outilActif = 'pointContact';
			window.pourcentageContactCourant = 100;
			window.coteContactCourant = 1;
		} else {
			window.pourcentageContactCourant -= 10;
			if (window.pourcentageContactCourant < 0) {
				window.coteContactCourant = window.coteContactCourant * -1;
				window.pourcentageContactCourant = 100;
			}
		}
		if (outilActif) canvas.style.pointerEvents = 'auto';
		window.redessinerToutesLesLignes();
	}

	if (e.key === 'Shift' && outilActif === 'pointContact') {
		e.preventDefault();
		window.coteContactCourant = window.coteContactCourant * -1;
		window.redessinerToutesLesLignes();
	}

		// ROTATION MICRO-MÉTRIQUE DE LA BILLE FANTÔME AUX FLÈCHES GAUCHE / DROITE
	if (['ArrowLeft', 'ArrowRight'].includes(e.key) && window.formeTactiqueSelectionnee && window.formeTactiqueSelectionnee.estGhostBall) {
		const formeGhost = window.formeTactiqueSelectionnee;
				if (formeGhost.cibleCentre && formeGhost.points && formeGhost.points.length > 0) {
			e.preventDefault();

			const ptActuel = formeGhost.points[0];
			let angleActuel = Math.atan2(ptActuel.y - formeGhost.cibleCentre.y, ptActuel.x - formeGhost.cibleCentre.x);


			const pasDegres = e.shiftKey ? 1.0 : 0.2;
			const direction = (e.key === 'ArrowRight') ? 1 : -1;
			angleActuel += direction * ((pasDegres * Math.PI) / 180);

			const resultatGhost = dessinerBilleFantome(0, 0, formeGhost.couleur, formeGhost, angleActuel);
			formeGhost.points = [{ x: resultatGhost.x, y: resultatGhost.y }];
			formeGhost.expireBadgeLe = Date.now() + 2500;

			if (resultatGhost.pctImpact !== null) {
				const panneauImpact = window.dessinsSauvegardes.find(
					d => d.estPointContact && d.lieAGhostId === formeGhost.ghostId
				);
				if (panneauImpact) {
					panneauImpact.pourcentage = resultatGhost.pctImpact;
					panneauImpact.cote = resultatGhost.coteImpact;
				}
			}

			window.redessinerToutesLesLignes();
			return;
		}
	}

	
	
	// DÉPLACEMENT MICRO-MÉTRIQUE DES BILLES AUX FLÈCHES DU CLAVIER
	if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
		if (!window.billeSelectionneeCourante || window.billeSelectionneeCourante.style.display === 'none') {
			return;
		}
		
		// Sécurité existante pour les billes verrouillées manuellement
		const ballId = window.billeSelectionneeCourante.getAttribute('data-id');
		if (window.billesVerrouillees && window.billesVerrouillees.has(ballId)) {
			return;
		}
		
		e.preventDefault();

		let currentX = parseFloat(window.billeSelectionneeCourante.style.left) || 0;
		let currentY = parseFloat(window.billeSelectionneeCourante.style.top) || 0;

		const gridWidth = 754;
		const gridHeight = 364;
		const pasX = gridWidth / 16;
		const pasY = gridHeight / 8;

		const multiplicateur = e.shiftKey ? 1.0 : 0.1;
		const incrementX = pasX * multiplicateur;
		const incrementY = pasY * multiplicateur;

		switch (e.key) {
			case 'ArrowLeft':
				currentX -= incrementX;
				break;
			case 'ArrowRight':
				currentX += incrementX;
				break;
			case 'ArrowUp':
				currentY -= incrementY;
				break;
			case 'ArrowDown':
				currentY += incrementY;
				break;
		}

				const positionClampee = clampPosition(currentX, currentY);
		window.billeSelectionneeCourante.style.left = `${positionClampee.x}px`;
		window.billeSelectionneeCourante.style.top = `${positionClampee.y}px`;

		if (typeof resolveCollisions === "function") {
			// On récupère les coordonnées finales réelles après résolution des collisions et magnétisme
			const coordFinales = resolveCollisions(window.billeSelectionneeCourante);
			
			// NOUVEAU : On affiche et met à jour le badge flottant en direct
			if (typeof mettreAJourAffichagePosition === "function") {
				mettreAJourAffichagePosition(window.billeSelectionneeCourante, coordFinales.x, coordFinales.y);
			}
		}
		if (typeof rafraichirListeLateraleBilles === "function") {
			rafraichirListeLateraleBilles();
		}

	}
    
    // ... reste de votre logique keydown (touche h, z, 9, 0, etc.)


		if (e.key.toLowerCase() === 'h') {
			e.preventDefault();
			if (canvas.style.visibility === 'hidden') {
				canvas.style.visibility = 'visible';
				if (toggleDrawingsCheck) toggleDrawingsCheck.checked = true;
			} else {
				canvas.style.visibility = 'hidden';
				if (toggleDrawingsCheck) toggleDrawingsCheck.checked = false;
			}
		}

		if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
			e.preventDefault();
			if (outilActif === 'carre') {
				if (window.tailleCarreCourante === 95) window.tailleCarreCourante = 135;
				else if (window.tailleCarreCourante === 135) window.tailleCarreCourante = 180;
				else window.tailleCarreCourante = 95;
			} else {
				outilActif = 'carre';
			}
			if (outilActif) canvas.style.pointerEvents = 'auto';
			window.redessinerToutesLesLignes();
		}

		if (e.key === '9') {
			e.preventDefault();
			if (outilActif === 'repereX') {
				if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 4 && window.repereXTexte === null) {
					window.nombreBranchesRepereX = 6;
				} else if (!window.repereXEstUnCercle && window.nombreBranchesRepereX === 6 && window.repereXTexte === null) {
					window.repereXEstUnCercle = true;
				} else if (window.repereXEstUnCercle && window.repereXTexte === null) {
					window.repereXEstUnCercle = false;
					window.repereXTexte = cycleCaracteres[0];
				} else if (window.repereXTexte !== null) {
					const indexActuel = cycleCaracteres.indexOf(window.repereXTexte);
					if (indexActuel >= 0 && indexActuel < cycleCaracteres.length - 1) {
						window.repereXTexte = cycleCaracteres[indexActuel + 1];
					} else {
						window.repereXTexte = null;
						window.nombreBranchesRepereX = 4;
						window.repereXEstUnCercle = false;
					}
				}
			} else {
				outilActif = 'repereX';
				window.nombreBranchesRepereX = 4;
				window.repereXEstUnCercle = false;
				window.repereXTexte = null;
			}
			if (outilActif) canvas.style.pointerEvents = 'auto';
			window.redessinerToutesLesLignes();
		}

		if (e.key === '0') {
			e.preventDefault();
			if (outilActif !== 'effetBlanche') {
				outilActif = 'effetBlanche';
				window.niveauForceCourant = 2;
			} else {
				window.niveauForceCourant++;
				if (window.niveauForceCourant > 4) {
					outilActif = null;
					window.niveauForceCourant = 0;
				}
			}
			if (outilActif) canvas.style.pointerEvents = 'auto';
			window.redessinerToutesLesLignes();
		}

		if (e.key === 'Escape') {
			outilActif = null;
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			window.redessinerToutesLesLignes();
		}

		if (e.key.toLowerCase() === 'e' || e.key === 'Delete') {
			e.preventDefault();
			canvas.style.pointerEvents = 'auto';
			const aEteEfface = window.detecterEtEffacerDessin(mouseX, mouseY);
			if (!aEteEfface) {
				canvas.style.pointerEvents = 'none';
			}
		}

		// Gestion des zones de grille (1 à 8) avec cycle à 4 états
		if (e.key >= '1' && e.key <= '8') {
			const zoneId = parseInt(e.key, 10);
			const indexZoneExistante = window.dessinsSauvegardes.findIndex(dessin => dessin.estZoneGrille && dessin.zoneId === zoneId);

			if (indexZoneExistante !== -1) {
				const zoneActive = window.dessinsSauvegardes[indexZoneExistante];
				if (!zoneActive.mode || zoneActive.mode === 'standard') {
					zoneActive.mode = 'alternatif'; // État 2 : ZA hachurée
				} else if (zoneActive.mode === 'alternatif') {
					zoneActive.mode = 'sans-inscription-hachure'; // NOUVEAU État 3 : ZA hachures sans texte
				} else if (zoneActive.mode === 'sans-inscription-hachure') {
					zoneActive.mode = 'sans-inscription'; // État 4 : Zone unie sans texte
				} else {
					window.dessinsSauvegardes.splice(indexZoneExistante, 1); // État 5 : Suppression
				}
			} else {
				// État 1 : Premier clic, création de la Zone de Départ (ZD)
				const couleurActive = colorSelect ? colorSelect.value : '#ffffff';
				window.dessinsSauvegardes.push({
					couleur: couleurActive,
					estZoneGrille: true,
					zoneId: zoneId,
					mode: 'standard',
					points: []
				});
			}
			window.redessinerToutesLesLignes();
		}

	});

		// À déclarer un peu plus haut dans votre code avec vos variables d'état (ex: let isDrawing = false;)
	let timerMasquageBadgeClavier = null;

	document.addEventListener('keyup', (e) => {
		if (e.key === 'Shift') {
			isShiftPressed = false;
			canvas.style.pointerEvents = 'none';
			if (isDrawing) finTrace();
		}
		if (e.key === 'Control') {
			isCtrlPressed = false;
		}
		
		// MODIFIÉ : Lance un fondu (fadeout) fluide après un léger délai au relâchement des flèches
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
			if (timerMasquageBadgeClavier) clearTimeout(timerMasquageBadgeClavier);
			
			timerMasquageBadgeClavier = setTimeout(() => {
				const badge = document.getElementById('ball-drag-live-badge');
				if (badge) {
					// 1. Déclenche la transition CSS d'opacité (300ms)
					badge.style.transition = "opacity 0.3s ease";
					badge.style.opacity = "0";
					
					// 2. Supprime physiquement l'élément du DOM à la fin du fondu
					setTimeout(() => {
						// Sécurité : s'assure que l'utilisateur n'a pas réappuyé entre-temps
						if (badge.style.opacity === "0") {
							badge.remove();
						}
					}, 300);
				}
				timerMasquageBadgeClavier = null;
			}, 400); // Délai de 400ms avant d'amorcer le fondu
		}
	});


	window.addEventListener('blur', () => {
		isShiftPressed = false;
		isCtrlPressed = false;
		if (canvas) canvas.style.pointerEvents = 'none';
		if (isDrawing) finTrace();
	});

	function declencherDebutTrace(e) {
	if (window.outilTraceActif !== "select") {
		if (e.cancelable) e.preventDefault();
	}

	const coords = obtenirCoordonneesEvenement(e, table);
	const localX = coords.x;
	const localY = coords.y;

	// === 1. MODE GOMME / ERASE ===
	if (window.outilTraceActif === "erase") {
		const elementSupprime = window.detecterEtEffacerDessin(localX, localY);
		if (elementSupprime) {
			const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
			if (btnSelect) btnSelect.click();
		}
		return;
	}

	// NOUVEAU - SÉCURITÉ & INTERCEPTION OUTIL POCHES : Récupère la poche sous le canvas
	if (window.outilTraceActif === "paintPocket") {
		if (e.cancelable) e.preventDefault();

		// 1. On désactive temporairement les événements sur le canvas pour lire en dessous
		const canvasTemp = document.getElementById('drawing-canvas');
		if (canvasTemp) canvasTemp.style.pointerEvents = 'none';

		// 2. Récupération des coordonnées physiques de l'écran (Souris ou iPad)
		const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
		const elementSousCurseur = document.elementFromPoint(clientX, clientY);

		// 3. On réactive immédiatement le canvas pour ne pas bloquer les autres outils
		if (canvasTemp) canvasTemp.style.pointerEvents = 'auto';

		// 4. Si l'élément sous le curseur est une poche (ou est à l'intérieur), on lui transmet l'événement
		const pocheCible = elementSousCurseur ? elementSousCurseur.closest('.pocket') : null;
		if (pocheCible) {
			// On déclenche l'événement personnalisé configuré ci-dessous
			pocheCible.dispatchEvent(new CustomEvent('pocheTraversee', { detail: { originalEvent: e } }));
		}
		return;
	}




	// === 2. NOUVEAU : LOGIQUE TACTILE POUR L'OUTIL ZONE ===
	if (window.outilTraceActif === "zoneTactique") {
		// Repères géométriques réels du tapis de jeu
		const gridLeft = 19;
		const gridTop = 18;
		const gridWidth = 754;
		const gridHeight = 364;
		const cols = 4;
		const rows = 2;

		// Sécurité : On s'assure que le clic a bien lieu dans l'espace utile du tapis
		if (localX >= gridLeft && localX <= (gridLeft + gridWidth) && localY >= gridTop && localY <= (gridTop + gridHeight)) {
			
			const pasX = gridWidth / cols;
			const pasY = gridHeight / rows;

			// Déduction automatique des index de cases (0 à 3 horizontales, 0 à 1 verticales)
			const c = Math.floor((localX - gridLeft) / pasX);
			const r = Math.floor((localY - gridTop) / pasY);

			// Conversion en ID unique de zone (1 à 8) basé sur votre formule de grille originale
			const zoneId = (r * cols) + c + 1;

			// Recherche si la zone cliquée possède déjà un calque enregistré
			const indexZoneExistante = window.dessinsSauvegardes.findIndex(dessin => dessin.estZoneGrille && dessin.zoneId === zoneId);

			if (indexZoneExistante !== -1) {
				const zoneActive = window.dessinsSauvegardes[indexZoneExistante];
				if (!zoneActive.mode || zoneActive.mode === 'standard') {
					zoneActive.mode = 'alternatif'; // État 2 : ZA hachurée
				} else if (zoneActive.mode === 'alternatif') {
					zoneActive.mode = 'sans-inscription-hachure'; // NOUVEAU État 3 : ZA hachures sans texte
				} else if (zoneActive.mode === 'sans-inscription-hachure') {
					zoneActive.mode = 'sans-inscription'; // État 4 : Zone unie sans texte
				} else {
					window.dessinsSauvegardes.splice(indexZoneExistante, 1); // État 5 : Suppression
				}
			} else {
				// État 1 : Premier clic, création de la Zone de Départ (ZD)
				const colorSelect = document.getElementById('marker-color');
				const couleurActive = colorSelect ? colorSelect.value : '#ffffff';
				window.dessinsSauvegardes.push({
					couleur: couleurActive,
					estZoneGrille: true,
					zoneId: zoneId,
					mode: 'standard',
					points: []
				});
			}

			// Force le rafraîchissement immédiat du canvas et de l'interface
			window.redessinerToutesLesLignes();
			if (typeof rafraichirListeLateraleBilles === "function") {
				rafraichirListeLateraleBilles();
			}
		}
		return; // On stoppe le script pour cet outil afin d'éviter tout conflit avec le dessin libre
	}

	// === 3. MODE FORMES TACTIQUES (Aperçus fantômes : Cible, Carré, Effet, Contact, Repère X) ===
	const outilTactiqueActif = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
	if (['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact', 'ghostBall'].includes(outilTactiqueActif)) {
		isDrawing = true;

		// APPLICATION DU BRIDAGE DÈS LE PREMIER CLIC DE DÉPÔT
		const posClampee = clampPositionDessin(localX, localY);
		mouseX = posClampee.x;
		mouseY = posClampee.y;

		// Force le premier rendu instantané directement sous le doigt/stylet
		if (!animationFrameId) {
			animationFrameId = requestAnimationFrame(() => {
				window.redessinerToutesLesLignes();
				animationFrameId = null;
			});
		}
		return;
	}

	// === 4. DESSIN LIBRE ET TRACÉS (Crayon, Ligne, Flèche) ===
	if (window.outilTraceActif !== "select") {
		commencerDessin(e);
	}
}



function clampPositionDessin(x, y) {
    // Permet au tracé de déborder légèrement sur le cadre en bois (ex: de 0 à la taille complète de la table)
    let minX = 0 + 16,
        maxX = 792 -15,
        minY = 0 + 16,
        maxY = 400 -16;

    if (x < minX) x = minX;
    if (x > maxX) x = maxX;
    if (y < minY) y = minY;
    if (y > maxY) y = maxY;

    return { x, y };
}



	function declencherMouvementTrace(e) {
    // Extrait les coordonnées exactes sous le doigt ou le stylet
    const coords = obtenirCoordonneesEvenement(e, table);
    let x = coords.x;
    let y = coords.y;

    // === EN DIRECT SUR IPAD - RAFRAÎCHIT L'APERÇU FANTÔME AU GLISSEMENT ===
    const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact', 'ghostBall'];
    if (listeFormesTactiques.includes(window.outilTraceActif) || outilActif) {
        if (e.cancelable) e.preventDefault();

        // On applique le bridage spécial dessin pour les aperçus d'outils tactiques
        const posClampee = clampPositionDessin(x, y);
        mouseX = posClampee.x;
        mouseY = posClampee.y;

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(() => {
                window.redessinerToutesLesLignes();
                animationFrameId = null;
            });
        }
        return;
    }

    // === LOGIQUE DE TRACÉ DE LIGNES CLASSIQUE MODIFIÉE ===
    if (!isDrawing || !currentLine) return;
    if (e.cancelable) e.preventDefault();

    // Application stricte de la nouvelle limite sur le tracé actif
    const posClampee = clampPositionDessin(x, y);
    x = posClampee.x;
    y = posClampee.y;

    if (currentLine.estDroite) {
        let targetX = x;
        let targetY = y;
        if (typeof calculerSnapGrille === "function") {
            const pointAimante = calculerSnapGrille(x - 12, y - 12, null, true);
            targetX = pointAimante.x + 12;
            targetY = pointAimante.y + 12;
        }

        window.redessinerToutesLesLignes();
        configurerStyleDessin(currentLine.couleur, currentLine.estPointille);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        if (currentLine.avecFleche) {
            dessinerPointeFleche(startPoint.x, startPoint.y, targetX, targetY, currentLine.couleur);
        }
        currentLine.points = [startPoint, { x: targetX, y: targetY }];
    } else {
        ctx.lineTo(x, y);
        ctx.stroke();
        currentLine.points.push({ x, y });
    }
}


	function declencherFinTrace(e) {
		// === VALIDATION DU DÉPÔT AU RELÂCHEMENT SUR LA TABLE UNIQUEMENT ===
		const outilTactiqueActif = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
		const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact', 'ghostBall'];

		if (listeFormesTactiques.includes(outilTactiqueActif)) {
			// Sécurité : si isDrawing est faux (ex: clic sur un bouton de la palette pour faire tourner), on ne fait rien !
			if (!isDrawing) return;

			// Sécurité supplémentaire : on vérifie que le relâchement a bien lieu sur la table/canvas
			if (e && e.target && !table.contains(e.target)) {
				isDrawing = false;
				return;
			}

			const couleurActive = window.billeSelectionneeCourante ?
				window.billeSelectionneeCourante.style.backgroundColor :
				(colorSelect ? colorSelect.value : '#ffffff');

			let nouvelElement = {
				couleur: couleurActive,
				points: [{
					x: mouseX,
					y: mouseY
				}]
			};
				
if (outilTactiqueActif === 'ghostBall') {
	const resultatGhost = dessinerBilleFantome(mouseX, mouseY, couleurActive);
	const idLiaisonGhost = Date.now(); // Identifiant unique de liaison

	nouvelElement.estGhostBall = true;
	nouvelElement.ghostId = idLiaisonGhost;
	nouvelElement.points = [{ x: resultatGhost.x, y: resultatGhost.y }];
	nouvelElement.cibleCentre = resultatGhost.cibleCentre;
	nouvelElement.blancheCentre = resultatGhost.blancheCentre;
	nouvelElement.couleurCible = resultatGhost.couleurCible;

	// --- DÉPÔT AUTOMATIQUE DES PANNEAUX IMPACT ET EFFET LIÉS À CE GHOST ---
	if (resultatGhost.pctImpact !== null) {
		const milieuTableY = 200;

		// 1. Panneau Quantité d'Impact (décalé légèrement à gauche : X = 310)
		window.dessinsSauvegardes.push({
			couleur: resultatGhost.couleurCible || couleurActive,
			estPointContact: true,
			lieAGhostId: idLiaisonGhost,
			pourcentage: resultatGhost.pctImpact,
			cote: resultatGhost.coteImpact,
			points: [{ x: 310, y: milieuTableY }]
		});

		// 2. Panneau Effets Bille Blanche (décalé légèrement à droite : X = 480)
		// S'ajoute uniquement s'il n'y en a pas déjà un sur le tapis
		const effetExistant = window.dessinsSauvegardes.find(d => d.estEffetBlanche);
		if (!effetExistant) {
			window.dessinsSauvegardes.push({
				couleur: '#ffffff',
				estEffetBlanche: true,
				lieAGhostId: idLiaisonGhost,
				force: window.niveauForceCourant || 2,
				pointEffet: window.indexPointEffetCourant || 0,
				points: [{ x: 480, y: milieuTableY }]
			});
		}
	}

	// Durée d'affichage du badge après le dépôt (2500 ms = 2,5 secondes)
	const DUREE_AFFICHAGE_MS = 2500;
	nouvelElement.expireBadgeLe = Date.now() + DUREE_AFFICHAGE_MS;

	setTimeout(() => {
		const animerFondu = () => {
			if (typeof window.redessinerToutesLesLignes === "function") {
				window.redessinerToutesLesLignes();
			}
			if (Date.now() < nouvelElement.expireBadgeLe) {
				requestAnimationFrame(animerFondu);
			}
		};
		requestAnimationFrame(animerFondu);
	}, DUREE_AFFICHAGE_MS - 400);
}




				if (outilTactiqueActif === 'cible') {
					nouvelElement.estCible = true;
					nouvelElement.quadrant = window.quadrantCibleCourant || 0;
				}
				if (outilTactiqueActif === 'carre') {
					nouvelElement.estCarre = true;
					nouvelElement.taille = window.tailleCarreCourante || 95;
				}
				if (outilTactiqueActif === 'repereX') {
					nouvelElement.estRepereX = true;
					nouvelElement.estUnCercle = window.repereXEstUnCercle;
					nouvelElement.branches = window.nombreBranchesRepereX;
					nouvelElement.texte = window.repereXTexte;
				}
				if (outilTactiqueActif === 'effetBlanche') {
					nouvelElement.estEffetBlanche = true;
					nouvelElement.force = window.niveauForceCourant;
					nouvelElement.pointEffet = window.indexPointEffetCourant || 0;
				}
				if (outilTactiqueActif === 'pointContact') {
					nouvelElement.estPointContact = true;
					nouvelElement.pourcentage = window.pourcentageContactCourant;
					nouvelElement.cote = window.coteContactCourant;
				}

				window.dessinsSauvegardes.push(nouvelElement);
			// Nettoyage des états
			isDrawing = false;
			outilActif = null;

			// Retour systématique à l'outil Sélection après le dépôt de n'importe quelle forme tactique
			const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
			if (btnSelect) {
				if (typeof gererLogiquePalette === "function") {
					gererLogiquePalette(btnSelect, { preventDefault: () => {}, cancelable: false });
				} else {
					btnSelect.click();
				}
			}

			if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
			return;
		}

		// Fin de tracé standard (Crayon, Ligne, Flèche) pour PC/iPad
		finTrace();
		if (window.outilTraceActif === "select") {
			canvas.style.pointerEvents = 'none';
		} else {
			canvas.style.pointerEvents = 'auto';
		}
	}


function commencerDessin(e) {
	// CORRECTION ESSENTIELLE : Nettoie l'aperçu clavier pour éviter la superposition parasite de formes
	outilActif = null;
	isDrawing = true;

	const coords = obtenirCoordonneesEvenement(e, table);
	let x = coords.x;
	let y = coords.y;

	// APPLICATION DU BRIDAGE SUR LE POINT DE DÉPART INITIAL
	const posClampee = clampPositionDessin(x, y);
	x = posClampee.x;
	y = posClampee.y;

	// --- [NOUVEAU] : AIMANTATION AU CENTRE SI PROCHE DU BORD DE LA BILLE (Seuil : 8px) OU D'UN GHOST ---
	const forceLigneDroite = (window.outilTraceActif === "line" || window.outilTraceActif === "arrow") || (window.outilTraceActif === "select" && (e.ctrlKey || e.metaKey || isCtrlPressed));
	
	if (forceLigneDroite) {
		let billeProche = null;
		let distanceMinBord = 8; // Tolérance de 8 pixels par rapport au contour

		activeBalls.forEach(ball => {
			if (ball.style.display !== 'none') {
				// Centre exact de la bille (Position + Rayon de 12px)
				const ballX = (parseFloat(ball.style.left) || 0) + 12;
				const ballY = (parseFloat(ball.style.top) || 0) + 12;

				// Distance absolue entre le clic et le centre de la bille
				const distanceAuCentre = Math.sqrt(Math.pow(x - ballX, 2) + Math.pow(y - ballY, 2));
				
				// Distance par rapport au bord de la bille (valeur absolue pour gérer l'intérieur et l'extérieur)
				const distanceAuBord = Math.abs(distanceAuCentre - 12);

				if (distanceAuBord < distanceMinBord) {
					distanceMinBord = distanceAuBord;
					billeProche = { x: ballX, y: ballY };
				}
			}
		});

		// 1. Si le clic est proche du bord d'une bille réelle, on commence au centre de celle-ci
		if (billeProche) {
			x = billeProche.x;
			y = billeProche.y;
		} 
		// 2. SINON, vérification de la proximité avec une bille fantôme (Ghost)
		else {
			let ghostProche = null;
			let distMinGhost = 18; // Rayon d'attraction autour du centre du ghost

			window.dessinsSauvegardes.forEach(dessin => {
				if (dessin.estGhostBall && dessin.points && dessin.points.length > 0) {
					const ptGhost = dessin.points[0];
					const dist = Math.hypot(x - ptGhost.x, y - ptGhost.y);
					if (dist < distMinGhost) {
						distMinGhost = dist;
						ghostProche = ptGhost;
					}
				}
			});

			if (ghostProche) {
				x = ghostProche.x;
				y = ghostProche.y;
			} 
			// 3. SINON, repli sur les anciennes logiques (extrémités de lignes ou snapping de grille)
			else {
				let pointExtremiteProche = null;
				let distanceMinimale = 8; 

				window.dessinsSauvegardes.forEach(dessin => {
					if (dessin.points && dessin.points.length >= 2 && (dessin.estDroite || dessin.avecFleche)) {
						const ptDepart = dessin.points[0];
						const ptArrivee = dessin.points[dessin.points.length - 1];

						const distDepart = Math.sqrt(Math.pow(x - ptDepart.x, 2) + Math.pow(y - ptDepart.y, 2));
						if (distDepart < distanceMinimale) {
							distanceMinimale = distDepart;
							pointExtremiteProche = ptDepart;
						}

						const distArrivee = Math.sqrt(Math.pow(x - ptArrivee.x, 2) + Math.pow(y - ptArrivee.y, 2));
						if (distArrivee < distanceMinimale) {
							distanceMinimale = distArrivee;
							pointExtremiteProche = ptArrivee;
						}
					}
				});

				if (pointExtremiteProche) {
					x = pointExtremiteProche.x;
					y = pointExtremiteProche.y;
				} else if (typeof calculerSnapGrille === "function") {
					const pointAimante = calculerSnapGrille(x - 12, y - 12, null, true);
					x = pointAimante.x + 12;
					y = pointAimante.y + 12;
				}
			}
		}
	}

	canvas.style.pointerEvents = 'none';
	const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
	const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
	const elementSousCurseur = document.elementFromPoint(clientX, clientY);
	canvas.style.pointerEvents = 'auto';

	let billeSousCurseur = elementSousCurseur ? elementSousCurseur.closest('.ball') : null;
	let couleurActive = colorSelect ? colorSelect.value : '#ffffff';

	if (billeSousCurseur) {
		if (window.billeSelectionneeCourante && window.billeSelectionneeCourante !== billeSousCurseur) {
			window.billeSelectionneeCourante.style.outline = 'none';
		}
		window.billeSelectionneeCourante = billeSousCurseur;
		billeSousCurseur.style.outline = '2px solid #ffffff';
		billeSousCurseur.style.outlineOffset = '2px';
		couleurActive = billeSousCurseur.style.backgroundColor;
	} else {
		if (window.billeSelectionneeCourante) {
			couleurActive = window.billeSelectionneeCourante.style.backgroundColor;
		}
	}

	

	
	const modeDashed = dashedCheck ? dashedCheck.checked : false;
	configurerStyleDessin(couleurActive, modeDashed);
	ctx.beginPath();
	ctx.moveTo(x, y);
	startPoint = {
		x,
		y
	};

	let forceFleche = false;
	if (window.outilTraceActif !== "select") {
		forceFleche = (window.outilTraceActif === "arrow");
	} else {
		forceFleche = forceLigneDroite && (e.shiftKey || isShiftPressed);
	}

	currentLine = {
		couleur: couleurActive,
		estDroite: forceLigneDroite,
		avecFleche: forceFleche,
		estPointille: modeDashed,
		points: [{
			x,
			y
		}]
	};
}

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

	// === ATTACHEMENT DES ÉCOUTEURS DYNAMIQUES HYBRIDES ===
	canvas.addEventListener('mousedown', (e) => {
		if (e.button === 0 || e.button === 2) declencherDebutTrace(e);
	});
	canvas.addEventListener('touchstart', declencherDebutTrace, {
		passive: false
	});

	table.addEventListener('mousedown', (e) => {
		
		// [CORRECTIF SÉCURITÉ CLICK DROIT] : Bloque le dessin libre au clic droit en mode lecture seule
		if (window.isViewMode) {
			if (e.button === 2) e.preventDefault();
			return;
		}
		
		if (window.outilTraceActif === "select" && e.button === 2) {
			canvas.style.pointerEvents = 'auto';
			commencerDessin(e);
		}
		if (e.target === table && e.button === 0) {
			if (window.billeSelectionneeCourante) {
				window.billeSelectionneeCourante.style.outline = 'none';
				window.billeSelectionneeCourante = null;

				if (typeof rafraichirListeLateraleBilles === "function") {
					rafraichirListeLateraleBilles();
				}

				const displayEl = document.getElementById('ball-position-display');
				if (displayEl) {
					displayEl.innerText = "Position de la bille : Aucune sélectionnée";
				}
			}
		}
	});

	document.addEventListener('mousemove', declencherMouvementTrace);
	document.addEventListener('touchmove', declencherMouvementTrace, {
		passive: false
	});
	document.addEventListener('mouseup', declencherFinTrace);
	document.addEventListener('touchend', declencherFinTrace);

	table.addEventListener('contextmenu', e => e.preventDefault());
	canvas.addEventListener('contextmenu', e => e.preventDefault());

	setTimeout(resizeCanvas, 100);
});