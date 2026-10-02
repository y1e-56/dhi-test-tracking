# Bilan des travaux réalisés

Ce document résume, sans entrer dans les détails techniques, tout ce qui a été
fait sur l'application de suivi des tests, ensemble, jusqu'à aujourd'hui.

---

## 1. L'application change de visage (logotype)

L'icône de l'application (celle qu'on voit dans l'onglet du navigateur et dans
le menu) a été retravaillée : une petite pastille foncée avec une coche verte,
simple et propre. Elle est visible sur toutes les pages.

## 2. L'application est plus rapide

La reconnexion d'un utilisateur à déjà vu ses informations : la page d'accueil
s'affiche maintenant presque instantanément au lieu de recharger toutes les
données. Un gain de temps visible au quotidien.

## 3. Les décisions « Go / No-Go » gardent leurs preuves

Chaque décision de lancement (feu vert ou feu rouge) peut désormais être
accompagnée de captures d'écran qui restent attachées à la décision et sont
consultables ensuite dans l'historique. On sait toujours **pourquoi** on a
validé ou refusé un lancement.

## 4. Le testeur est rattaché au bon projet en base

Quand une campagne est préparée, le testeur responsable est maintenant bien
enregistré dans la base de données et apparaît correctement dans le suivi.

## 5. Un guide d'utilisation

Un guide a été rédigé pour expliquer comment utiliser l'application au
quotidien (comment créer un projet, une campagne, signaler une anomalie, suivre
les tests...). Il est disponible dans le dossier `docs/`.

## 6. Dernières corrections de bon sens

Plusieurs petits problèmes de logique ont été corrigés :

- **Mot de passe d'exemple retiré de l'écran de connexion.** On ne voit plus de
  mot de passe affiché en clair sur la page d'arrivée ; il faut se connecter
  avec son propre compte.
- **Les dates d'un projet doivent avoir du sens.** Impossible de mettre une
  date de fin avant la date de début. Une campagne ne peut pas non plus
  commencer avant son projet officiel ni se terminer après lui.
- **On ne peut plus être son propre responsable.** Lorsqu'on crée ou modifie un
  projet, la personne connectée n'apparaît plus dans les listes de responsables
  qualité ou de gestion (ce serait illogique de se valider soi-même).
- **Pas de section vide.** La zone « fonctionnalités couvertes » des exigences
  ne s'affiche plus si rien n'y a été renseigné.

## 7. Les anomalies avec preuves à l'appui

C'est le grand chantier de ces derniers jours, pensé pour faciliter la vie des
testeurs et des développeurs :

- **Le testeur qui signale une anomalie doit joindre une ou plusieurs captures
  d'écran** qui montrent le problème. Ces images sont enregistrées avec
  l'anomalie.
- **Le développeur qui confirme avoir corrigé doit aussi joindre une capture**
  qui prouve que le problème est réglé. Sans cette preuve, il n'est pas possible
  de passer l'anomalie à l'étape « à retester ».
- Toutes ces captures sont visibles sur la page de détail de l'anomalie et
  peuvent être téléchargées. On garde ainsi la même exigence de preuve que pour
  les décisions de lancement.
- Au maximum 5 images par anomalie, et uniquement des fichiers image : les
  autres types de fichiers sont ignorés automatiquement.

## 8. Les textes et libellés dans les deux langues

Toutes les nouvelles fonctions sont traduites en français et en anglais ; la
langue s'affiche automatiquement selon le réglage de l'utilisateur. Un problème
d'affichage des accents français (lettres mélangées) a également été réparé.

## 9. Ce qui reste à faire (pour être complètement honnête)

Rien n'est caché, voici les points encore en attente :

- Sur les dix règles de qualité affichées dans le référentiel, seules trois
  influencent réellement la note de couleur de la qualité. Les autres sont en
  cours de raccordement pour qu'elles participent vraiment au calcul.
- La barre de qualité et certains seuils (taux d'exécution, anomalies ouvertes)
  doivent encore être mis en cohérence avec ces règles, pour que l'affichage
  reflète exactement ce qui est appliqué.

Ce bilan a été écrit sans jargon pour être lisible par tous. Il sera mis à jour
au fil des prochaines avancées.