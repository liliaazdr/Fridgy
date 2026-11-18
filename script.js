// données

// aliment du frigo : nom, quantite, date 
let frigo = [];
let recetteChoisie = null;

// planning de la semaine : "Lundi midi": "Salade de tomates"
let planning = {};

const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// trois magasins: prix inventés pour l'exemple
// coef = le magasin est plus ou moins cher, promos = produits à -20%
const magasins = [
  { nom: "Lidl", coef: 0.9, promos: ["tomates", "lait"] },
  { nom: "Carrefour", coef: 1, promos: ["oeufs", "riz"] },
  { nom: "Auchan", coef: 1.05, promos: ["pâtes", "pommes"] }
];

// quelques recettes pour l'exemple
const recettes = [
  { nom: "Salade de tomates", temps: 10, calories: 250, objectifs: ["maigrir", "stabiliser"], contient: [],
    ingredients: [{ nom: "tomates", prix: 1.5 }, { nom: "concombre", prix: 1 }, { nom: "huile d'olive", prix: 0.5 }] },

  { nom: "Omelette aux champignons", temps: 15, calories: 380, objectifs: ["maigrir", "stabiliser"], contient: ["oeufs", "lait"],
    ingredients: [{ nom: "oeufs", prix: 2 }, { nom: "champignons", prix: 1.8 }, { nom: "beurre", prix: 0.4 }] },

  { nom: "Soupe de carottes", temps: 35, calories: 220, objectifs: ["maigrir"], contient: [],
    ingredients: [{ nom: "carottes", prix: 1 }, { nom: "pommes de terre", prix: 1 }, { nom: "oignon", prix: 0.5 }] },

  { nom: "Pâtes aux légumes", temps: 25, calories: 650, objectifs: ["stabiliser", "grossir"], contient: ["gluten"],
    ingredients: [{ nom: "pâtes", prix: 1.2 }, { nom: "courgettes", prix: 1.5 }, { nom: "tomates", prix: 1.5 }] },

  { nom: "Riz au poulet et brocolis", temps: 30, calories: 800, objectifs: ["grossir"], contient: [],
    ingredients: [{ nom: "riz", prix: 1 }, { nom: "poulet", prix: 3.5 }, { nom: "brocolis", prix: 1.5 }] }
];

//est-ce que cet aliment est dans le frigo ?
function auFrigo(nom) {
  return frigo.some(a => a.nom === nom);
}

// nombre de jours avant la péremption (négatif = déjà périmé)
function joursRestants(date) {
  const aujourdhui = new Date().setHours(0, 0, 0, 0);
  return Math.round((new Date(date) - aujourdhui) / 86400000);
}

// la date d'aujourd'hui + n jours
function dansJours(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// transforme "lait, gluten" en ["lait", "gluten"]
function lireListe(id) {
  return document.getElementById(id).value.toLowerCase().split(",")
    .map(x => x.trim()).filter(x => x !== "");
}

// frigo et alertes

function afficherFrigo() {
  frigo.sort((a, b) => a.date.localeCompare(b.date)); // le plus pressé en premier

  const liste = document.getElementById("liste-frigo");
  const alertes = document.getElementById("alertes");
  liste.innerHTML = "";
  alertes.innerHTML = "";

  frigo.forEach(function (aliment, i) {
    const reste = joursRestants(aliment.date);

    // les alertes de péremption
    if (reste < 0) {
      alertes.innerHTML += '<p class="alerte rouge">' + aliment.nom + " est périmé !</p>";
    } else if (reste <= 3) {
      alertes.innerHTML += '<p class="alerte">' + aliment.nom + " périme dans " + reste + " jour(s).</p>";
    }

    const li = document.createElement("li");
    if (reste <= 3) li.className = "bientot";
    li.textContent = aliment.nom + " x" + aliment.quantite + " (" + (reste < 0 ? "périmé" : reste + " j") + ") ";

    const bouton = document.createElement("button");
    bouton.textContent = "×";
    bouton.setAttribute("aria-label", "Supprimer " + aliment.nom);
    bouton.onclick = function () {
      frigo.splice(i, 1);
      afficherFrigo();
    };

    li.appendChild(bouton);
    liste.appendChild(li);
  });

  // si une recette est choisie, on remet les courses à jour
  if (recetteChoisie) afficherCourses();
}

// ajouter un aliment à la main
document.getElementById("form-aliment").onsubmit = function (e) {
  e.preventDefault();
  frigo.push({
    nom: document.getElementById("nom-aliment").value.toLowerCase().trim(),
    quantite: Number(document.getElementById("quantite").value),
    date: document.getElementById("date").value
  });
  this.reset();
  afficherFrigo();
};

// simulation: une vraie analyse de photo demande une API de reconnaissance
// d'image, ici on ajoute juste quelques aliments d'exemple (dont un périmé).
document.getElementById("btn-analyser").onclick = function () {
  const trouves = [
    { nom: "tomates", quantite: 4, date: dansJours(2) },
    { nom: "oeufs", quantite: 6, date: dansJours(10) },
    { nom: "carottes", quantite: 5, date: dansJours(7) },
    { nom: "lait", quantite: 1, date: dansJours(-1) }
  ];

  trouves.forEach(function (aliment) {
    if (!auFrigo(aliment.nom)) frigo.push(aliment);
  });
  afficherFrigo();
};

// préférences et recettes

document.getElementById("form-pref").onsubmit = function (e) {
  e.preventDefault();
  afficherRecettes();
};

function afficherRecettes() {
  const objectif = document.getElementById("objectif").value;
  const temps = Number(document.getElementById("temps").value);
  const allergies = lireListe("allergies");
  const aimes = lireListe("aimes");
  const evites = lireListe("evites");

  // une recette contient-elle un aliment aimé ?
  const aime = r => r.ingredients.some(ing => aimes.includes(ing.nom));

  // on garde seulement les recettes qui conviennent
  const choix = recettes.filter(function (r) {
    return r.objectifs.includes(objectif)
      && r.temps <= temps
      && !r.contient.some(a => allergies.includes(a))
      && !r.ingredients.some(ing => evites.includes(ing.nom));
  });

  // recettes avec des aliments aimés passent en premier
  choix.sort((a, b) => aime(b) - aime(a));

  const zone = document.getElementById("liste-recettes");
  zone.innerHTML = "";

  if (choix.length === 0) {
    zone.innerHTML = "<p>Aucune recette ne correspond. Essaie d'augmenter le temps.</p>";
    return;
  }

  choix.forEach(function (recette, i) {
    const possedes = recette.ingredients.filter(ing => auFrigo(ing.nom)).length;

    const div = document.createElement("div");
    div.className = recette === recetteChoisie ? "recette choisie" : "recette";
    div.innerHTML =
      '<div class="photo photo-' + (i % 2 + 1) + '"></div>' +
      "<div><h3>" + recette.nom + (aime(recette) ? " ★" : "") + "</h3>" +
      "<p>" + recette.temps + " min - " + recette.calories + " kcal</p>" +
      "<p>Dans ton frigo : " + possedes + " sur " + recette.ingredients.length + "</p></div>";

    const bouton = document.createElement("button");
    bouton.textContent = "Choisir";
    bouton.onclick = function () {
      recetteChoisie = recette;
      afficherRecettes();
      afficherCourses();
    };

    div.appendChild(bouton);
    zone.appendChild(div);
  });
}

// courses et comparateurs de prix 

function afficherCourses() {
  const budget = Number(document.getElementById("budget").value);
  const manquants = recetteChoisie.ingredients.filter(i => !auFrigo(i.nom));
  let html = "<h3>" + recetteChoisie.nom + "</h3>";

  if (manquants.length === 0) {
    document.getElementById("zone-courses").innerHTML = html + '<p class="ok">Tu as déjà tout ce qu\'il faut !</p>';
    return;
  }

  // la liste de ce qu'il faut acheter
  html += '<ul class="courses">';
  manquants.forEach(i => html += "<li>" + i.nom + "</li>");
  html += "</ul>";

  // le total dans chaque magasin
  const totaux = magasins.map(function (m) {
    let total = 0;
    let promos = 0;
    manquants.forEach(function (i) {
      let prix = i.prix * m.coef;
      if (m.promos.includes(i.nom)) {
        prix = prix * 0.8; // -20%
        promos++;
      }
      total += prix;
    });
    return { nom: m.nom, total: total, promos: promos };
  });

  const moinsCher = Math.min(...totaux.map(t => t.total));

  html += "<table><tr><th>Magasin</th><th>Total</th><th>Promotions</th></tr>";
  totaux.forEach(function (t) {
    const classe = t.total === moinsCher ? ' class="moins-cher"' : "";
    html += "<tr" + classe + "><td>" + t.nom + "</td><td>" + t.total.toFixed(2) + " €</td><td>" + t.promos + "</td></tr>";
  });
  html += "</table>";

  // on compare le magasin le moins cher au budget
  if (moinsCher > budget) {
    html += '<p class="depasse">Même le moins cher dépasse ton budget de ' + budget + " €.</p>";
  } else {
    html += '<p class="ok">Tu restes dans ton budget de ' + budget + " € en allant chez le moins cher.</p>";
  }

  document.getElementById("zone-courses").innerHTML = html;
}

// planning semaine

function afficherPlanning() {
  const tableau = document.getElementById("planning");
  tableau.innerHTML = "<tr><th>Jour</th><th>Midi</th><th>Soir</th></tr>";

  jours.forEach(function (jour) {
    const ligne = document.createElement("tr");
    ligne.innerHTML = "<td>" + jour + "</td>";

    ["midi", "soir"].forEach(function (moment) {
      const select = document.createElement("select");
      select.setAttribute("aria-label", jour + " " + moment);
      select.innerHTML = '<option value="">-</option>' + recettes.map(r => "<option>" + r.nom + "</option>").join("");

      // on garde le choix dans l'objet planning
      select.onchange = function () {
        planning[jour + " " + moment] = select.value;
      };

      const cellule = document.createElement("td");
      cellule.appendChild(select);
      ligne.appendChild(cellule);
    });

    tableau.appendChild(ligne);
  });
}

afficherPlanning();