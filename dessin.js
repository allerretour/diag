// Variable globale pour stocker les lignes et les cibles tracées
window.dessinsSauvegardes = [];
// Variable globale pour suivre le nombre de pointes du repère X (ex: alterne entre 4, 6)
window.nombreBranchesRepereX = 6; // Garde la mémoire des branches
window.repereXEstUnCercle = false; // Permet de savoir si on bascule en mode cercle

// NOUVEAU : Liste ordonnée pour le cycle de la touche 9
window.repereXTexte = null;
const cycleCaracteres = ["A", "B", "C", "D", "E", "F", "●", "🔵", "1", "2", "3", "4", "5", "6"];

// Variable globale pour suivre la dimension actuelle du carré (3 tailles en pixels)
window.tailleCarreCourante = 95;
// Variable globale pour suivre le quadrant d'affichage des chiffres (0: Bas-Droite, 1: Bas-Gauche, 2: Haut-Gauche, 3: Haut-Droite)
window.quadrantCibleCourant = 0;

// Variable globale pour suivre la force du coup (0: désactivé, 1: 25%, 2: 50%, 3: 75%, 4: 100%)
window.niveauForceCourant = 0;
const labelsForce = {
	1: "DOUX",
	2: "MOYEN",
	3: "FORT",
	4: "MAX"
};
const couleursForce = {
	1: "#2ecc71",
	2: "#f1c40f",
	3: "#e67e22",
	4: "#e74c3c"
}; // Vert, Jaune, Orange, Rouge

window.pourcentageContactCourant = 100;
window.coteContactCourant = 1; // 1 = Frappe par la gauche, -1 = Frappe par la droite

// Variable globale pour suivre l'outil sélectionné dans la palette
window.outilTraceActif = "select";

// Écouteur mis à jour pour piloter l'intégralité de la palette (P, T, Z, 0, 9)
const boutonsOutils = document.querySelectorAll('.tool-btn');

function gererLogiquePalette(btn, e) {

	// SÉCURITÉ : Si c'est le bouton couleur, on stoppe la logique d'outil de tracé
	if (btn.id === 'indicateur-couleur-tactique') return;
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
		window.niveauForceCourant = 0;
	}

	const canvas = document.getElementById('drawing-canvas');
	if (canvas) {
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
	if (btn.id === 'indicateur-couleur-tactique') return;

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
		const aUnOutilActif = outilActif || ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'].includes(window.outilTraceActif);
		if (!aUnOutilActif) return;
		if (animationFrameId) return;

		animationFrameId = requestAnimationFrame(() => {
			window.redessinerToutesLesLignes();
			animationFrameId = null;
		});
	});

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

		// --- FORCE LES LIGNES PLEINES POUR L'OUTIL CONTACT ---
		ctx.setLineDash([]);

		const pct = (pctFige !== undefined) ? pctFige : window.pourcentageContactCourant;
		const cote = (coteFige !== undefined) ? coteFige : window.coteContactCourant;
		const couleurMarqueur = couleur || (colorSelect ? colorSelect.value : '#ffffff');

		// Dimensions réduites d'environ 15% pour libérer de l'espace visuel
		const largeurCadre = 185;
		const hauteurCadre = 140;
		const cadreX = x - (largeurCadre / 2);
		const cadreY = y - (hauteurCadre / 2);
		const arrondiCoins = 12;

		ctx.beginPath();
		ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arrondiCoins);
		ctx.fillStyle = "rgba(11, 15, 23, 0.94)";
		ctx.fill();
		ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
		ctx.lineWidth = 1;
		ctx.stroke();

		// Billes proportionnellement réduites (22px au lieu de 26px)
		const centreCadreX = x;
		const centreCadreY = y - 8;
		const rayonBille = 22;
		const diametreBille = rayonBille * 2;
		const decalageX = diametreBille * (1 - (pct / 100));

		// --- LIGNE D'AXE HORIZONTALE DE RÉFÉRENCE ---
		ctx.beginPath();
		ctx.moveTo(cadreX + 12, centreCadreY);
		ctx.lineTo(cadreX + largeurCadre - 12, centreCadreY);
		ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
		ctx.lineWidth = 1;
		ctx.stroke();

		// --- 1. RENDU DE LA BILLE CIBLE ARRIÈRE ---
		ctx.save();
		const gradCible = ctx.createRadialGradient(
			centreCadreX - 5, centreCadreY - 5, 2,
			centreCadreX, centreCadreY, rayonBille
		);
		gradCible.addColorStop(0, "#ffffff");
		gradCible.addColorStop(0.4, couleurMarqueur);
		gradCible.addColorStop(1, couleurMarqueur);

		ctx.beginPath();
		ctx.arc(centreCadreX, centreCadreY, rayonBille, 0, 2 * Math.PI);
		ctx.fillStyle = gradCible;
		ctx.fill();

		ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.restore();

		// --- 2. RENDU DE LA BILLE BLANCHE AVANT ---
		const blancheX = centreCadreX - (decalageX * cote);

		ctx.save();
		const gradBlanche = ctx.createRadialGradient(
			blancheX - 5, centreCadreY - 5, 2,
			blancheX, centreCadreY, rayonBille
		);
		gradBlanche.addColorStop(0, "#ffffff");
		gradBlanche.addColorStop(0.4, "#f2f4f7");
		gradBlanche.addColorStop(1, "#d1d5db");

		ctx.beginPath();
		ctx.arc(blancheX, centreCadreY, rayonBille, 0, 2 * Math.PI);
		ctx.fillStyle = gradBlanche;
		ctx.fill();

		ctx.strokeStyle = "rgba(11, 15, 23, 0.6)";
		ctx.lineWidth = 1.5;
		ctx.stroke();
		ctx.restore();

		// --- 3. LABELS ET TEXTES EXPLICATIFS ÉCHELONNÉS ---
		ctx.fillStyle = "rgba(150, 165, 185, 0.75)";
		ctx.font = "600 10px system-ui, -apple-system, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillText("QUANTITÉ D'IMPACT", centreCadreX, cadreY + 10);

		ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
		ctx.textBaseline = "bottom";
		if (pct === 100) {
			ctx.fillStyle = "#ffffff";
			ctx.fillText("IMPACT PLEIN", centreCadreX, cadreY + hauteurCadre - 10);
		} else {
			ctx.fillStyle = "#ffffff";
			const coteTexte = cote === 1 ? "GAUCHE" : "DROITE";
			ctx.fillText(`${pct}% - ${coteTexte}`, centreCadreX, cadreY + hauteurCadre - 10);
		}

		ctx.restore();
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

	function dessinerEffetsBilleBlanche(x, y, couleur, forceFige) {
		ctx.save();
		const marge = 18;
		ctx.beginPath();
		ctx.rect(marge, marge, ctx.canvas.width - (marge * 2), ctx.canvas.height - (marge * 2));

		const forceActuelle = (forceFige !== undefined) ? forceFige : window.niveauForceCourant;
		const jaugeActive = forceActuelle > 0;

		// Échelle réduite pour correspondre au panneau d'impact (185px de large)
		const largeurCadre = jaugeActive ? 185 : 135;
		const hauteurCadre = 155;
		const demiLargeur = largeurCadre / 2;
		const rayonBille = 48; // Réduit pour un rendu plus compact

		const cadreX = x - demiLargeur;
		const cadreY = y - rayonBille - 30;
		const arrondiCoins = 12;

		ctx.beginPath();
		ctx.roundRect(cadreX, cadreY, largeurCadre, hauteurCadre, arrondiCoins);
		ctx.fillStyle = "rgba(11, 15, 23, 0.94)";
		ctx.fill();
		ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
		ctx.lineWidth = 1;
		ctx.stroke();

		const shiftX = jaugeActive ? -18 : 0;
		const billeX = x + shiftX;

		// Rendu 3D compact de la blanche
		ctx.save();
		const degre3D = ctx.createRadialGradient(
			billeX - (rayonBille * 0.25), y - (rayonBille * 0.25), rayonBille * 0.1,
			billeX, y, rayonBille
		);
		degre3D.addColorStop(0, "#ffffff");
		degre3D.addColorStop(0.2, "#f7f9fa");
		degre3D.addColorStop(0.85, "#e1e5eb");
		degre3D.addColorStop(1, "#b5bdc9");

		ctx.beginPath();
		ctx.arc(billeX, y, rayonBille, 0, 2 * Math.PI);
		ctx.fillStyle = degre3D;
		ctx.fill();
		ctx.restore();

		// Grille de repères fine
		ctx.strokeStyle = "rgba(110, 120, 140, 0.2)";
		ctx.lineWidth = 1;
		const cos45 = Math.cos(Math.PI / 4);
		const decalageDiag = rayonBille * cos45;

		ctx.beginPath();
		ctx.moveTo(billeX, y - rayonBille);
		ctx.lineTo(billeX, y + rayonBille);
		ctx.moveTo(billeX - rayonBille, y);
		ctx.lineTo(billeX + rayonBille, y);
		ctx.moveTo(billeX - decalageDiag, y - decalageDiag);
		ctx.lineTo(billeX + decalageDiag, y + decalageDiag);
		ctx.moveTo(billeX - decalageDiag, y + decalageDiag);
		ctx.lineTo(billeX + decalageDiag, y - decalageDiag);
		ctx.stroke();

		// Points d'effets tactiques
		const distanceCentre = 32;
		const diagPoint = distanceCentre * cos45;
		const pointsEffets = [{
				dx: 0,
				dy: 0,
				estCentre: true
			},
			{
				dx: 0,
				dy: -distanceCentre,
				estCentre: false
			},
			{
				dx: 0,
				dy: distanceCentre,
				estCentre: false
			},
			{
				dx: -distanceCentre,
				dy: 0,
				estCentre: false
			},
			{
				dx: distanceCentre,
				dy: 0,
				estCentre: false
			},
			{
				dx: -diagPoint,
				dy: -diagPoint,
				estCentre: false
			},
			{
				dx: diagPoint,
				dy: -diagPoint,
				estCentre: false
			},
			{
				dx: -diagPoint,
				dy: diagPoint,
				estCentre: false
			},
			{
				dx: diagPoint,
				dy: diagPoint,
				estCentre: false
			}
		];

		pointsEffets.forEach(pt => {
			ctx.beginPath();
			ctx.arc(billeX + pt.dx, y + pt.dy, pt.estCentre ? 5 : 3, 0, 2 * Math.PI);
			ctx.fillStyle = pt.estCentre ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)";
			ctx.fill();
			ctx.strokeStyle = "rgba(15, 23, 42, 0.5)";
			ctx.stroke();
		});

		ctx.fillStyle = "rgba(150, 165, 185, 0.75)";
		ctx.font = "600 10px system-ui, -apple-system, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		ctx.fillText("CONTACT", billeX, y - rayonBille - 10);

		// Jauge de puissance compacte
		if (jaugeActive) {
			const jaugeWidth = 10;
			const jaugeHeight = rayonBille * 2;
			const jaugeX = cadreX + largeurCadre - 35;
			const jaugeY = y - rayonBille;

			ctx.fillStyle = "rgba(150, 165, 185, 0.75)";
			ctx.fillText("FORCE", jaugeX + (jaugeWidth / 2), jaugeY - 10);

			const grad = ctx.createLinearGradient(jaugeX, jaugeY + jaugeHeight, jaugeX, jaugeY);
			grad.addColorStop(0, "#2ecc71");
			grad.addColorStop(0.4, "#f1c40f");
			grad.addColorStop(0.7, "#e67e22");
			grad.addColorStop(1, "#e74c3c");

			ctx.save();
			ctx.beginPath();
			ctx.roundRect(jaugeX, jaugeY, jaugeWidth, jaugeHeight, 4);
			ctx.fillStyle = grad;
			ctx.fill();
			ctx.restore();

			const hauteurCibleY = jaugeY + jaugeHeight - ((forceActuelle / 4) * jaugeHeight);

			ctx.fillStyle = "#ffffff";
			ctx.beginPath();
			ctx.moveTo(jaugeX - 3, hauteurCibleY);
			ctx.lineTo(jaugeX - 8, hauteurCibleY - 3);
			ctx.lineTo(jaugeX - 8, hauteurCibleY + 3);
			ctx.closePath();
			ctx.fill();

			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(jaugeX, hauteurCibleY);
			ctx.lineTo(jaugeX + jaugeWidth, hauteurCibleY);
			ctx.stroke();

			ctx.fillStyle = couleursForce[forceActuelle];
			ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
			ctx.textBaseline = "top";
			ctx.fillText(`${forceActuelle * 25}%`, jaugeX + (jaugeWidth / 2), jaugeY + jaugeHeight + 6);
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

	// === FORCE LES LIGNES PLEINES POUR LA CIBLE ===
	ctx.setLineDash([]);

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

	// --- 3. DESSIN DU FOND OPAQUE A 30% (Dimensions réduites de 10px) ---
	ctx.save();
	ctx.fillStyle = couleur;
	ctx.globalAlpha = 0.30;

	ctx.beginPath();
	ctx.roundRect(x - 87.5, y - 87.5, 175, 175, 8);
	ctx.fill();
	ctx.restore();

	// --- 4. DESSIN DES CONTOURS DE LA CIBLE ---
	ctx.strokeStyle = couleur;
	ctx.lineWidth = 2;

	// Carré extérieur avec coins arrondis (Dimensions réduites de 10px)
	ctx.beginPath();
	ctx.roundRect(x - 87.5, y - 87.5, 175, 175, 8);
	ctx.stroke();

	// Cercles de la cible (Rayon r1 réduit de 5px pour enlever 10px sur le diamètre)
	let r1 = 87.5;
	let r2 = r1 * (2 / 3);
	let r3 = r1 * (1 / 3);

	ctx.beginPath();
	ctx.arc(x, y, r1, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(x, y, r2, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(x, y, r3, 0, 2 * Math.PI);
	ctx.stroke();

	// Lignes réticulaires se croisant au centre
	ctx.beginPath();
	ctx.moveTo(x - r1, y);
	ctx.lineTo(x + r1, y);
	ctx.moveTo(x, y - r1);
	ctx.lineTo(x, y + r1);
	ctx.stroke();

	// --- 5. CONFIGURATION ET ROTATION DU CADRAN DES CHIFFRES ---
	ctx.fillStyle = couleur;
	ctx.font = "bold 12px sans-serif";
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

	ctx.fillText("1", x + dist1 * cosAngle, y + dist1 * sinAngle);
	ctx.fillText("2", x + dist2 * cosAngle, y + dist2 * sinAngle);
	ctx.fillText("3", x + dist3 * cosAngle, y + dist3 * sinAngle);
	ctx.fillText("5", x + dist5 * cosAngle, y + dist5 * sinAngle);

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

		// --- LE BLOC CI-DESSOUS S'EXÉCUTE UNIQUEMENT SI LE MODE N'EST PAS 'sans-inscription' ---
		if (mode !== 'sans-inscription') {
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
					dessinerCible(centre.x, centre.y, dessin.couleur);
					window.quadrantCibleCourant = tempQuadrant;
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
					dessinerCarre(centre.x, centre.y, dessin.couleur);
					window.tailleCarreCourante = tempTaille;
				}
				return;
			}

			// === GESTION DE LA FORME D'EFFETS BILLE BLANCHE SAUVEGARDÉE ===
			if (dessin.estEffetBlanche) {
				if (dessin.points && dessin.points.length > 0) {
					const centre = dessin.points[0];
					// On passe dessin.force qui a été figé au moment du clic
					dessinerEffetsBilleBlanche(centre.x, centre.y, dessin.couleur, dessin.force);
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

		// === RENDU EN DIRECT DE L'APERÇU FANTÔME (SOUS LE CURSEUR) ===
		// CORRECTION : On détermine l'outil actif qu'il vienne de la palette OU du clavier
		const formeActive = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
		const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];

		if (listeFormesTactiques.includes(formeActive)) {
			ctx.save();
			ctx.globalAlpha = 0.40; // Translucide pour l'aperçu dynamique

			let couleurActive = colorSelect ? colorSelect.value : '#ffffff';
			if (window.billeSelectionneeCourante) {
				couleurActive = window.billeSelectionneeCourante.style.backgroundColor;
			}

			if (formeActive === 'cible') dessinerCible(mouseX, mouseY, couleurActive);
			if (formeActive === 'carre') dessinerCarre(mouseX, mouseY, couleurActive);
			if (formeActive === 'repereX') dessinerRepereXGras(mouseX, mouseY, couleurActive);
			if (formeActive === 'effetBlanche') dessinerEffetsBilleBlanche(mouseX, mouseY, couleurActive, window.niveauForceCourant);
			if (formeActive === 'pointContact') dessinerPointContact(mouseX, mouseY, couleurActive, window.pourcentageContactCourant, window.coteContactCourant);

			ctx.restore();
		}

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

	// === CORRECTIF HYBRIDE IOS POUR EFFACER ET ANNULER ===
	if (clearBtn) {
		// Événement pour l'iPad / iPhone
		clearBtn.addEventListener('touchstart', (e) => {
			if (e.cancelable) e.preventDefault();
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			window.dessinsSauvegardes = [];
			if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
		}, {
			passive: false
		});

		// Événement pour le PC / Mac
		clearBtn.addEventListener('click', (e) => {
			if (e.pointerType === 'touch' || (e.clientX === 0 && e.clientY === 0)) return; // Évite le double déclenchement
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			window.dessinsSauvegardes = [];
			if (typeof window.redessinerToutesLesLignes === "function") window.redessinerToutesLesLignes();
		});
	}

	if (undoBtn) {
		// Événement pour l'iPad / iPhone
		undoBtn.addEventListener('touchstart', (e) => {
			if (e.cancelable) e.preventDefault();
			annulerDernierTrace();
		}, {
			passive: false
		});

		// Événement pour le PC / Mac
		undoBtn.addEventListener('click', (e) => {
			if (e.pointerType === 'touch' || (e.clientX === 0 && e.clientY === 0)) return; // Évite le double déclenchement
			annulerDernierTrace();
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

		// 1. Gestion de l'annulation
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

		if (e.key.toLowerCase() === 'p') {
			e.preventDefault();
			if (outilActif !== 'pointContact') {
				outilActif = 'pointContact';
				window.pourcentageContactCourant = 100;
				window.coteContactCourant = 1;
			} else {
				window.pourcentageContactCourant -= 10;
				// Si on descend en dessous de 0, on change de côté et on recommence à 90%
				if (window.pourcentageContactCourant < 0) {
					window.coteContactCourant = window.coteContactCourant * -1; // Inverse GAUCHE <-> DROITE
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

		// DÉPLACEMENT MICRO-MÉTRIQUE DES BILLES AUX FLÈCHES DU CLAVIER
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
			if (!window.billeSelectionneeCourante || window.billeSelectionneeCourante.style.display === 'none') {
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
				resolveCollisions(window.billeSelectionneeCourante);
			}
			if (typeof rafraichirListeLateraleBilles === "function") {
				rafraichirListeLateraleBilles();
			}
		}

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
				window.niveauForceCourant = 0;
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
					// État 2 : Bascule vers Zone d'Arrivée (ZA) hachurée
					zoneActive.mode = 'alternatif';
				} else if (zoneActive.mode === 'alternatif') {
					// État 3 (Nouveau) : Bascule vers la zone colorée pure sans texte ni chiffre
					zoneActive.mode = 'sans-inscription';
				} else {
					// État 4 : Suppression définitive au clic suivant
					window.dessinsSauvegardes.splice(indexZoneExistante, 1);
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

	window.addEventListener('blur', () => {
		isShiftPressed = false;
		isCtrlPressed = false;
		if (canvas) canvas.style.pointerEvents = 'none';
		if (isDrawing) finTrace();
	});

	// === GESTION INTERACTION DESSIN IPAD ET PC ===
	function declencherDebutTrace(e) {
		if (window.outilTraceActif !== "select") {
			if (e.cancelable) e.preventDefault();
		}

		const coords = obtenirCoordonneesEvenement(e, table);
		const localX = coords.x;
		const localY = coords.y;

		// Mode Gomme
		if (window.outilTraceActif === "erase") {
			const elementSupprime = window.detecterEtEffacerDessin(localX, localY);
			if (elementSupprime) {
				const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
				if (btnSelect) btnSelect.click();
			}
			return;
		}

		// Armement de la position de départ pour les formes tactiques (Palette ou Clavier)
		const outilTactiqueActif = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
		if (['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'].includes(outilTactiqueActif)) {
			isDrawing = true;

			// CORRECTION CRITIQUE : Armement immédiat des coordonnées globales pour l'iPad
			mouseX = localX;
			mouseY = localY;

			// CORRECTION CONFORT : Force le premier rendu instantané sous le doigt
			if (!animationFrameId) {
				animationFrameId = requestAnimationFrame(() => {
					window.redessinerToutesLesLignes();
					animationFrameId = null;
				});
			}
			return;
		}

		// Dessin Libre
		if (window.outilTraceActif !== "select") {
			commencerDessin(e);
		}
	}

	function declencherMouvementTrace(e) {
		// Extrait les coordonnées exactes sous le doigt ou le stylet de l'iPad
		const coords = obtenirCoordonneesEvenement(e, table);
		const x = coords.x;
		const y = coords.y;

		// === EN DIRECT SUR IPAD - RAFRAÎCHIT L'APERÇU FANTÔME AU GLISSEMENT ===
		const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];
		if (listeFormesTactiques.includes(window.outilTraceActif) || outilActif) {
			if (e.cancelable) e.preventDefault(); // Empêche la page iPad de trembler ou défiler

			// Met à jour les positions globales lues par window.redessinerToutesLesLignes()
			mouseX = x;
			mouseY = y;

			// Planifie un rendu synchronisé avec le taux de rafraîchissement de l'écran de l'iPad
			if (!animationFrameId) {
				animationFrameId = requestAnimationFrame(() => {
					window.redessinerToutesLesLignes();
					animationFrameId = null;
				});
			}
			return; // Évite de tracer une ligne au crayon en même temps
		}

		// === LOGIQUE DE TRACÉ DE LIGNES CLASSIQUE EXISTANTE ===
		if (!isDrawing || !currentLine) return;
		if (e.cancelable) e.preventDefault();

		if (currentLine.estDroite) {
			let targetX = x;
			let targetY = y;
			if (typeof calculerSnapGrille === "function") {
				// Le 4e paramètre passé à true supprime la marge sur la bande
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
			currentLine.points = [startPoint, {
				x: targetX,
				y: targetY
			}];
		} else {
			ctx.lineTo(x, y);
			ctx.stroke();
			currentLine.points.push({
				x,
				y
			});
		}
	}

	function declencherFinTrace(e) {
		// === VALIDATION DU DÉPÔT AU RELÂCHEMENT DU DOIGT SUR IPAD ===
		const outilTactiqueActif = (window.outilTraceActif !== "select") ? window.outilTraceActif : outilActif;
		const listeFormesTactiques = ['cible', 'carre', 'effetBlanche', 'repereX', 'pointContact'];

		if (listeFormesTactiques.includes(outilTactiqueActif)) {
			if (isDrawing) {
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
				}
				if (outilTactiqueActif === 'pointContact') {
					nouvelElement.estPointContact = true;
					nouvelElement.pourcentage = window.pourcentageContactCourant;
					nouvelElement.cote = window.coteContactCourant;
				}

				window.dessinsSauvegardes.push(nouvelElement);
			}

			// Nettoyage des états
			isDrawing = false;
			outilActif = null;

			// Auto-retour au mode sélection
			const btnSelect = document.querySelector('.tool-btn[data-tool="select"]');
			if (btnSelect) btnSelect.click();

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

		// --- NOUVEAU : AIMANTATION DU POINT DE DÉPART DE LA LIGNE SANS PADDING ---
		const forceLigneDroite = (window.outilTraceActif === "line" || window.outilTraceActif === "arrow") || (window.outilTraceActif === "select" && (e.ctrlKey || e.metaKey || isCtrlPressed));
		if (forceLigneDroite && typeof calculerSnapGrille === "function") {
			// AJOUT DU 4E PARAMÈTRE (true) : Désactive la restriction des bandes pour les lignes
			const pointAimante = calculerSnapGrille(x - 12, y - 12, null, true);
			x = pointAimante.x + 12;
			y = pointAimante.y + 12;
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