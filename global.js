// --- Nuancier Officiel des Billes de Billard ---
const ballColors = {
	1: '#f1c40f', // Jaune
	2: '#2980b9', // Bleu
	3: '#e74c3c', // Rouge
	4: '#8e44ad', // Violet
	5: '#e67e22', // Orange
	6: '#27ae60', // Vert
	7: '#a0522d', // Marron (Sienna)
	8: '#000000'  // Noir
};

// --- Ordre de Défilement Tactique (Touche 9 / Repère X) ---
const cycleCaracteres = ["A", "B", "C", "D", "E", "F", "🎯", "🔵", "1", "2", "3", "4", "5", "6"];

// --- Paramètres de Rendu de Force (Touche 0 / Effets) ---
const labelsForce = {
	1: "DOUX",
	2: "MOYEN",
	3: "FORT",
	4: "MAX"
};

const couleursForce = {
	1: "#2ecc71", // Vert
	2: "#f1c40f", // Jaune
	3: "#e67e22", // Orange
	4: "#e74c3c"  // Rouge
};


/**
 * ====================================================================
 * CENTRALISATION DES VARIABLES GLOBALES TACTIQUES & CONFIGURATION
 * ====================================================================
 */

// --- Sauvegardes et États des Éléments du Tapis ---
window.dessinsSauvegardes = [];       // Stocke l'historique des tracés, cibles et zones
window.billeSelectionneeCourante = null; // Mémorise la bille HTML sous le focus actif
window.billesVerrouillees = new Set(); // Contient les IDs des billes verrouillées (bloquées au mouvement)

// --- Gestion des Outils et de la Palette ---
window.outilTraceActif = "select";    // Outil actif en cours d'utilisation
window.dernierOutilValide = "select"; // Mémoire de l'outil précédent pour les retours automatiques

// --- Configuration de l'Outil : Repère X (Touche 9) ---
window.nombreBranchesRepereX = 6;     // Stocke le nombre de branches courant (4 ou 6)
window.repereXEstUnCercle = false;    // Indique si le repère a basculé en mode cercle
window.repereXTexte = null;           // Stocke la lettre ou le symbole actif du cycle

// --- Configuration de l'Outil : Carré (Touche Z) ---
window.tailleCarreCourante = 95;      // Dimension active du carré en pixels (95, 135 ou 180)

// --- Configuration de l'Outil : Cible (Touche T) ---
window.quadrantCibleCourant = 0;      // Index du quadrant actif (0: BD, 1: BG, 2: HG, 3: HD)

// --- Configuration de l'Outil : Effet Blanche (Touche 0) ---
window.niveauForceCourant = 0;        // Force sélectionnée (0: désactivé, 1: 25%, 2: 50%, 3: 75%, 4: 100%)

// --- Configuration de l'Outil : Point de Contact (Touche P) ---
window.pourcentageContactCourant = 100; // Quantité d'impact courante (0 à 100%)
window.coteContactCourant = 1;        // Côté de l'impact (1 = Gauche, -1 = Droite)

// --- Identité Visuelle ---
window.logoBase64Courant = null;      // Stocke la chaîne Base64 du logo personnalisé

// --- Mémoire Tactile (Spécifique iPad / Gestes) ---
window.historiqueTapsBilles = {};     // Enregistre l'horodatage des taps pour la détection du double-tap
window.timersSelectionBilles = {};    // Stocke les instances de timers pour discriminer tap simple et double-tap
