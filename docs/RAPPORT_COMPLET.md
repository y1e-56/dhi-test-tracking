Rapport de stage Académique

Rédigé et présenté par :
NGOUNOU MOMI Pharel & JIPNANG Ryan
Étudiants ingénieurs en 2e Année — Formation Informatique

Encadreur en Entreprise : Ing. TSAMENE Steve Jordan
Encadreur Académique : M. ABOUDI Christian

---

Résumé

Ce projet de stage, réalisé au sein de DHI (Digital House International) dans le cadre d'une formation en ingénierie informatique à l'UCAC-ICAM, porte sur la conception et le développement d'un logiciel de suivi des tests et de la qualité logicielle. Il répond à une problématique concrète identifiée dans le fonctionnement de DHI : l'absence d'un outil centralisé pour gérer les campagnes de tests logiciels, les anomalies et la communication entre les équipes testeurs et développeurs.

Actuellement, DHI s'appuie sur des pratiques informelles — fichiers Excel, e-mails, messageries instantanées — pour coordonner ses activités de test. Ces pratiques génèrent des pertes de traçabilité, des risques d'oubli et un manque de visibilité globale sur l'avancement des campagnes. Le logiciel développé dans le cadre de ce stage vise à remédier à ces dysfonctionnements en proposant une solution numérique structurée, sécurisée et générique.

La solution proposée comprend six modules fonctionnels : gestion des projets, gestion des campagnes de test, gestion des équipes, assignation des tâches, suivi des anomalies avec cycle de vie formalisé, et tableau de bord avec génération de rapports. Elle s'articule autour de quatre profils utilisateurs distincts — administrateur, chef testeur, testeur et développeur — avec des droits différenciés.

Sur le plan technique, le logiciel est développé selon une architecture client-serveur trois tiers, avec React.js pour le frontend, Node.js/Express pour le backend, et PostgreSQL comme système de gestion de base de données. La modélisation a été réalisée selon la méthode Merise. La sécurité est assurée par JWT et bcrypt.

Ce rapport retrace les étapes de conception, de modélisation et de développement du projet, ainsi que les apports professionnels et techniques de cette expérience de stage.

---

Remerciements

À l'issue de ce travail et de cette période de stage, nous tenons à exprimer notre profonde gratitude à toutes les personnes qui ont contribué, directement ou indirectement, à la réalisation de ce projet et à son bon déroulement.

Nos remerciements s'adressent particulièrement à :

- La direction de DHI (Digital House International), pour nous avoir accordé l'opportunité d'effectuer ce stage au sein de leur structure et pour la confiance placée en nous.
- Ing. TSAMENE Steve Jordan, notre encadreur en entreprise, pour son accompagnement quotidien, ses conseils techniques et sa disponibilité tout au long de la mission.
- M. ADIANG Martial, Directeur de l'Institut UCAC-ICAM, pour son engagement envers l'excellence académique.
- M. ABOUDI Christian, notre encadreur académique, pour son suivi pédagogique rigoureux et ses orientations méthodologiques.
- L'ensemble du staff administratif et professoral de l'UCAC-ICAM, pour la qualité des enseignements dispensés et les valeurs transmises au cours de notre formation.
- Les équipes testeurs et développeurs de DHI, qui ont accepté de partager leur quotidien et leurs pratiques, permettant de mener une analyse des besoins ancrée dans la réalité du terrain.
- Chacun des membres de nos familles respectives, pour leur soutien moral et leur encouragement constant.

Nous exprimons enfin notre sincère gratitude aux lecteurs de ce rapport, pour l'attention portée à ce travail.

---

Sommaire

Résumé ........................................................................................................................................... I
Remerciements .............................................................................................................................. II
Sommaire ....................................................................................................................................... III
Liste des figures ............................................................................................................................. IV
Introduction .................................................................................................................................... 1

Chapitre 1 — Présentation de l'entreprise DHI ........................................................................ 3
  1.1 Historique et évolution ............................................................................................................. 3
  1.2 Missions et valeurs ................................................................................................................... 4
  1.3 Profils des postes et organisation ........................................................................................... 5
  1.4 Organigramme de l'entreprise ................................................................................................. 6

Chapitre 2 — Déroulement du stage ........................................................................................ 7
  2.1 Arrivée et accueil ..................................................................................................................... 7
  2.2 Cadre de travail ........................................................................................................................ 7
  2.3 Missions confiées .................................................................................................................... 8
  2.4 Appréciations générales .......................................................................................................... 9

Chapitre 3 — Analyse des besoins et conception ................................................................... 10
  3.1 Contexte et problème identifié ............................................................................................... 10
  3.2 État des lieux — outils existants ............................................................................................ 10
  3.3 Analyse des écarts (Gap Analysis) ......................................................................................... 11
  3.4 Parties prenantes et profils utilisateurs .................................................................................. 12
  3.5 Description fonctionnelle des modules ................................................................................... 13
  3.6 Cycle de vie d'une anomalie ................................................................................................... 15
  3.7 Règles métier et User Stories ................................................................................................. 16

Chapitre 4 — Réalisation technique ......................................................................................... 18
  4.1 Architecture technique et choix technologiques .................................................................... 18
  4.2 Modélisation des données (Merise / MCD) ............................................................................ 19
  4.3 Développement des modules — phases de réalisation ........................................................... 20
  4.4 Planning prévisionnel et planning réel ..................................................................................... 21
  4.5 Budget du projet ..................................................................................................................... 22
  4.6 Captures d'écran — interfaces développées .......................................................................... 23
  4.7 Sécurité de l'application ......................................................................................................... 24
  4.8 Notifications et communication temps réel ............................................................................. 26
  4.9 Assistance par intelligence artificielle ...................................................................................... 27
  4.10 Déploiement de l'application ................................................................................................ 28

Chapitre 5 — Diagrammes UML et modélisation ..................................................................... 25
  5.1 Diagramme de cas d'utilisation (Use Case) ............................................................................ 25
  5.2 Diagramme de classes ........................................................................................................... 26
  5.3 Diagramme de séquence ........................................................................................................ 27

Difficultés rencontrées ................................................................................................................. 28
Perspectives ................................................................................................................................. 29
Conclusion .................................................................................................................................... 30
Lexique / Glossaire ....................................................................................................................... 31
Webographie ................................................................................................................................. 33

---

Liste des figures

Figure 1 — Organigramme de DHI
Figure 2 — Organisation du département technique de DHI
Figure 3 — Planning prévisionnel du projet (Diagramme de Gantt)
Figure 4 — Planning réel du projet (Diagramme de Gantt)
Figure 5 — Modèle Conceptuel de Données (MCD — méthode Merise)
Figure 6 — Interface de connexion du logiciel DHI
Figure 7 — Tableau de bord principal : vue administrateur
Figure 8 — Page de gestion des projets
Figure 9 — Page de gestion des campagnes
Figure 10 — Page de détail d'une campagne (onglets fonctionnalités / anomalies / équipe)
Figure 11 — Page « Mes tâches » (vue testeur)
Figure 12 — Page « Mes anomalies » (vue développeur)
Figure 13 — Page de reporting et export PDF/Excel
Figure 14 — Diagramme de cas d'utilisation (Use Case — UML)
Figure 15 — Diagramme de classes (UML)
Figure 16 — Diagramme de séquence : cycle de vie d'une anomalie (UML)

---

Introduction

La qualité logicielle constitue aujourd'hui un enjeu stratégique majeur pour toute entreprise de développement informatique. Dans un contexte où les cycles de développement s'accélèrent et où les exigences clients se renforcent, disposer d'outils adaptés pour structurer et tracer les campagnes de tests logiciels est devenu une nécessité opérationnelle incontournable.

C'est précisément dans ce contexte que DHI (Digital House International), entreprise camerounaise spécialisée dans le développement de logiciels et de solutions numériques, a identifié une problématique centrale au sein de ses équipes : l'absence d'un outil centralisé et dédié pour gérer le suivi de ses campagnes de tests logiciels. La gestion des anomalies se fait par e-mail, le suivi des fonctionnalités testées se réalise manuellement dans des fichiers Excel, et la communication entre les équipes testeurs et développeurs repose sur des messageries non structurées. Cette organisation génère des pertes de traçabilité, des risques d'oubli et un manque de visibilité globale.

Face à ces enjeux, DHI a confié à deux stagiaires ingénieurs en informatique de l'UCAC-ICAM la conception et le développement d'un logiciel de suivi des tests et de la qualité logicielle. Ce projet constitue à la fois une réponse concrète aux besoins internes de DHI et un outil générique pensé pour être réutilisable par d'autres organisations souhaitant formaliser leur processus qualité.

Sur le plan technique, le projet mobilise plusieurs compétences issues de la formation : modélisation des données avec la méthode Merise, conception d'architectures applicatives web, développement frontend et backend, sécurisation des accès, et conception orientée objet illustrée par des diagrammes UML.

Le présent rapport retrace les différentes étapes de ce projet, de l'analyse du contexte et des besoins jusqu'à la réalisation technique. Il s'organise en cinq chapitres : la présentation de l'entreprise DHI (Chapitre 1), le déroulement du stage (Chapitre 2), l'analyse des besoins et la conception (Chapitre 3), la réalisation technique avec plannings, budget et captures d'écran (Chapitre 4), et enfin la modélisation UML complète du système (Chapitre 5).

---

Chapitre 1 — Présentation de l'entreprise DHI

1.1 Historique et évolution

DHI est une entreprise de services numériques (ESN) présente en Afrique et en Europe, spécialisée en transformation digitale, Data & IA, cybersécurité, solutions ERP & GED et formation exécutive. DHI connaît depuis 2018 une croissance remarquable portée par des valeurs fondatrices qui guident ses attitudes et ses prises de décision. Elle apporte des solutions informatiques innovantes et durables pour faire du système d'information un véritable levier de performance des entreprises. Son approche client est fondée sur la proximité. DHI est le partenaire de référence des entreprises et organisations qui recherchent le meilleur usage du numérique pour assurer leur développement et leur compétitivité.

1.2 Missions et valeurs

Les missions de DHI s'inscrivent dans une volonté de fournir des solutions numériques de qualité, adaptées aux besoins spécifiques de chaque client. L'entreprise agit sur plusieurs axes :

- Développement de logiciels sur mesure et d'applications web et mobiles
- Conseil en transformation digitale et accompagnement des systèmes d'information
- Maintenance et évolution des solutions développées, avec un support technique de proximité
- Formation des équipes clientes à l'utilisation des outils développés

Ses valeurs fondamentales sont : l'innovation continue, l'excellence opérationnelle, l'impact social et économique, et l'éthique avec un engagement durable.

1.3 Profils des postes et organisation

- Direction générale : Dr FOTSING Césaire
- Responsable administrative et financière : Mme FEUDJIO Linda
- Chef de projets / Responsable technique : Ing. TSAMENE Steve Jordan

1.4 Organigramme de l'entreprise

[Insérer ici : Figure 1 — Organigramme de DHI]

---

Chapitre 2 — Déroulement du stage

2.1 Arrivée et accueil

Arrivés le 11 mai pour la première journée de stage, l'accueil a été formel et chaleureux. Dès les premiers jours, nous avons pris connaissance de l'organisation interne de DHI, rencontré notre responsable de stage et les membres des équipes avec lesquelles nous allions travailler.

Tout s'est passé correctement et nous nous sommes assez rapidement intégrés parmi les membres du personnel, tous très sympathiques. Nous avons fait rapidement connaissance, notamment avec notre encadreur de stage, Ing. TSAMENE Steve Jordan, responsable technique et QA, ainsi que les membres de DHI et de l'administration.

2.2 Cadre de travail

DHI s'appuie sur une organisation structurée autour de ses équipes techniques. Le département informatique est organisé de la façon suivante :

[Insérer ici : Figure 2 — Organisation du département technique de DHI]

L'environnement de travail est calme, dynamique et agile. Nous disposions d'un poste de travail dédié au sein de l'entreprise. L'encadrement technique est assuré par Ing. TSAMENE Steve Jordan, qui est resté disponible pour répondre à nos questions tout en nous laissant une autonomie suffisante pour favoriser notre apprentissage.

La méthodologie de travail adoptée pour ce projet est agile, avec des points hebdomadaires avec le tuteur pour valider l'avancement et ajuster les priorités.

2.3 Missions confiées

La mission principale confiée dans le cadre de ce stage est la conception et le développement du logiciel de suivi des tests et de la qualité logicielle pour DHI. Cette mission couvre l'ensemble du cycle de développement : de l'analyse des besoins jusqu'à la livraison du logiciel opérationnel.

Des tâches complémentaires ont également été confiées en cours de stage, selon les besoins de DHI :

- Participation aux réunions techniques de l'équipe
- Rédaction de la documentation technique et du guide utilisateur

2.4 Appréciations générales

Le cadre de stage chez DHI est correct et l'ambiance y est professionnelle, avec des échanges réguliers et constructifs. Le projet confié est à la fois stimulant sur le plan technique — par la diversité des compétences mobilisées — et formateur sur le plan professionnel, par la réalité des contraintes de livraison et d'interaction avec les utilisateurs finaux.

L'aspect humain de ce stage est également enrichissant : la collaboration avec les équipes de DHI, la découverte du monde professionnel de l'entreprise informatique camerounaise et la gestion d'un projet en binôme constituent des expériences précieuses pour la suite de notre parcours.

---

Chapitre 3 — Analyse des besoins et conception

3.1 Contexte et problème identifié

DHI développe plusieurs projets logiciels en parallèle, chacun soumis à un processus de tests avant livraison au client. Plusieurs équipes de testeurs et de développeurs interviennent simultanément, et la coordination de ces équipes représente un défi organisationnel croissant.

L'analyse du contexte a révélé plusieurs dysfonctionnements majeurs dans les pratiques actuelles :

- Aucun outil centralisé ne permet de gérer plusieurs projets et plusieurs campagnes de test simultanément
- Les anomalies détectées par les testeurs sont communiquées aux développeurs de façon informelle (e-mail, messagerie), sans traçabilité fiable
- Le chef de l'équipe testeur ne dispose d'aucun outil dédié pour assigner les tâches ni suivre leur avancement en temps réel
- Il n'existe aucun mécanisme formel permettant aux testeurs de valider qu'une anomalie signalée comme résolue est effectivement corrigée
- La communication entre testeurs et développeurs crée des goulots d'étranglement et des pertes d'information

3.2 État des lieux — outils existants

Avant de concevoir le logiciel, nous avons conduit une analyse approfondie des pratiques en place. Le tableau ci-dessous présente les outils actuellement utilisés et leurs limites :

| Outil / Pratique | Usage actuel | Limites observées |
|---|---|---|
| Fichiers Excel | Lister les fonctionnalités à tester et noter les résultats. | Non partagés en temps réel, versions multiples, risques d'erreur et de perte de données. |
| E-mails et messageries | Signaler les anomalies et coordonner les échanges entre équipes. | Informations dispersées, aucune traçabilité centralisée, risque d'oubli. |
| Réunions informelles | Remontée orale des bugs lors de points d'équipe. | Pas de trace écrite, oublis fréquents, délais de communication. |
| WhatsApp / Slack | Notifications informelles entre testeurs et développeurs. | Aucune structuration des informations, mélange avec d'autres conversations. |

Tableau 1 — Outils actuellement utilisés chez DHI et leurs limites

3.3 Analyse des écarts (Gap Analysis)

La Gap Analysis compare la situation actuelle avec la cible visée, afin d'identifier précisément ce qui doit être créé ou amélioré dans le cadre du projet :

| Domaine | Situation actuelle | Situation cible | Écart |
|---|---|---|---|
| Gestion multi-projets | Fichiers séparés, aucun outil centralisé. | Un logiciel unique pour plusieurs projets et campagnes. | ÉLEVÉ |
| Assignation des tâches | Communication orale ou par e-mail. | Assignation directe, statut visible en temps réel. | ÉLEVÉ |
| Suivi des fonctionnalités | Noté manuellement dans Excel. | Statut mis à jour avec horodatage et traçabilité. | ÉLEVÉ |
| Gestion des anomalies | Signalement informel, sans traçabilité. | Fiche anomalie structurée, cycle formel. | ÉLEVÉ |
| Validation des corrections | Aucun mécanisme formel. | Seul le testeur peut valider et clôturer. | ÉLEVÉ |
| Tableau de bord | Inexistant. | Tableau de bord automatique en temps réel. | ÉLEVÉ |
| Rapports de campagne | Produits manuellement. | Génération automatique PDF/Excel. | MOYEN |
| Gestion des accès | Aucun système formalisé. | Comptes individuels avec rôles définis. | MOYEN |

Tableau 2 — Gap Analysis : situation actuelle vs situation cible

3.4 Parties prenantes et profils utilisateurs

Le logiciel implique quatre profils d'utilisateurs aux rôles bien distincts. Ces rôles sont définis au niveau de chaque campagne de test et déterminent les droits et les actions disponibles :

| Profil | Rôle | Droits principaux |
|---|---|---|
| Administrateur / Chef de projet | Crée et gère les projets, campagnes et comptes utilisateurs. | Création/suppression de projets, gestion des comptes, accès à toutes les données. |
| Chef de l'équipe testeur | Pilote la campagne, constitue les équipes, assigne les tâches. | Création de campagnes, assignation des tâches, consultation et modification des statuts. |
| Membre testeur | Effectue les tests, déclare les statuts, gère les anomalies. | Modification du statut d'une fonctionnalité, signalement d'anomalie directe. |
| Membre développeur | Reçoit les anomalies, corrige les bugs, notifie la résolution. | Consultation des anomalies, notification de résolution. Ne peut PAS modifier les statuts. |

Tableau 3 — Profils utilisateurs et droits associés

3.5 Description fonctionnelle des modules

Le logiciel est organisé en six modules fonctionnels complémentaires, couvrant l'ensemble du processus de suivi des tests.

**Module 1 — Gestion des projets**

Ce module permet à l'administrateur de créer, modifier et archiver des projets. Chaque projet constitue un espace de travail indépendant avec ses propres campagnes, équipes et historique. Un projet dispose d'un nom, d'une description, d'une date de début et d'une date de fin prévisionnelle. La liste des projets actifs est accessible depuis le tableau de bord principal.

**Module 2 — Gestion des campagnes de test**

Une campagne de test constitue l'unité de base du suivi. Elle peut être organisée par fonctionnalités ou par modules. À la création d'une campagne, le chef testeur enregistre les membres des deux équipes et saisit la liste des fonctionnalités à tester. L'avancement global est visible en temps réel : fonctionnalités testées, anomalies ouvertes, résolutions en attente.

**Module 3 — Gestion des équipes**

Ce module permet d'enregistrer et de gérer les membres des équipes testeur et développeur au sein d'une campagne. Chaque membre dispose d'un compte personnel avec identifiant et mot de passe. Le chef testeur peut ajouter ou retirer des membres en cours de campagne. Les membres des deux équipes sont clairement distingués dans l'interface.

**Module 4 — Assignation des tâches de test**

Ce module permet au chef testeur de répartir les tâches entre les membres de son équipe directement via le logiciel. Chaque membre voit uniquement ses tâches assignées. Une notification est envoyée lors de l'assignation d'une nouvelle tâche. Le statut de chaque tâche (en attente, en cours, terminée) est visible en temps réel par le chef.

**Module 5 — Suivi des statuts et gestion des anomalies**

Cœur du logiciel, ce module permet aux testeurs de déclarer le statut d'une fonctionnalité : « Conforme » ou « Anomalie détectée ». En cas d'anomalie, le testeur saisit une description détaillée et peut notifier directement un développeur sans passer par le chef d'équipe. Le chef testeur est automatiquement informé en copie. Le développeur notifie ensuite la résolution. Seul le testeur peut valider la correction et clôturer l'anomalie.

**Module 6 — Tableau de bord et rapports**

Ce module offre une vue d'ensemble : tableau de bord par projet et par campagne avec indicateurs en temps réel, historique complet et immuable de toutes les actions avec horodatage et identité de l'acteur, et génération automatique de rapports de campagne en PDF ou Excel récapitulant les fonctionnalités testées et les anomalies.

3.6 Cycle de vie d'une anomalie

Le cycle de vie d'une anomalie décrit toutes les étapes par lesquelles elle passe, depuis sa détection jusqu'à sa clôture. La règle fondamentale est que seul un testeur peut modifier le statut d'une fonctionnalité — les développeurs peuvent uniquement notifier la résolution.

| N° | Étape | Description | Acteur |
|---|---|---|---|
| 1 | Détection | Le testeur effectue son test, constate un dysfonctionnement et déclare le statut « Anomalie détectée » avec description détaillée. | Testeur |
| 2 | Notification | Le testeur notifie directement un développeur. Le chef testeur est informé en copie. L'anomalie est enregistrée avec toutes ses métadonnées. | Testeur |
| 3 | Prise en charge | Le développeur consulte l'anomalie depuis son tableau de bord. Le statut passe à « En cours de traitement ». | Développeur |
| 4 | Résolution signalée | Le développeur corrige le bug et notifie les testeurs avec description optionnelle des correctifs. Statut : « Résolution signalée ». | Développeur |
| 5 | Vérification | Le testeur reçoit une alerte et effectue un nouveau test pour vérifier que la correction est effective. | Testeur |
| 6a | Validation / Clôture | Si corrigée : le testeur met le statut à « Conforme ». L'anomalie est archivée dans l'historique. | Testeur |
| 6b | Rejet / Réouverture | Si le problème persiste : statut maintenu « Anomalie ». Le testeur peut notifier à nouveau un développeur. Le cycle reprend. | Testeur |

Tableau 4 — Cycle de vie d'une anomalie

3.7 Règles métier et User Stories

| Règle | Description | Portée |
|---|---|---|
| RG-01 | Seuls les testeurs peuvent modifier le statut d'une fonctionnalité. Les développeurs n'ont pas accès à cette action. | Statut fonctionnalité |
| RG-02 | Un testeur peut notifier directement un développeur. Le chef est informé en copie automatiquement. | Gestion anomalies |
| RG-03 | Le développeur peut notifier la résolution, mais ce signalement ne clôture pas l'anomalie sans validation du testeur. | Cycle anomalie |
| RG-04 | Chaque campagne est indépendante : ses données ne sont pas visibles depuis une autre campagne. | Isolation données |
| RG-05 | L'historique de chaque action est immuable : date, heure, identité de l'utilisateur. | Traçabilité |
| RG-06 | Un développeur n'accède qu'aux anomalies des campagnes auxquelles il est rattaché. | Contrôle d'accès |

Tableau 5 — Règles métier

| Réf. | Profil | Objectif | Critère clé |
|---|---|---|---|
| US-01 | Admin | S'authentifier pour accéder à son espace sécurisé. | Compte bloqué après 5 tentatives. |
| US-02 | Admin | Créer un projet et le gérer (modifier, archiver). | Projet visible immédiatement dans la liste. |
| US-03 | Admin | Gérer les comptes utilisateurs (création, rôle, désactivation). | Rôle attribuable en moins de 2 minutes. |
| US-04 | Chef testeur | Créer une campagne et enregistrer les équipes. | Campagne visible par tous les membres. |
| US-05 | Chef testeur | Assigner des tâches de test via le logiciel. | Notification envoyée à l'assigné. |
| US-06 | Chef testeur | Voir l'avancement de la campagne en temps réel. | Tableau de bord mis à jour en continu. |
| US-08 | Testeur | Déclarer le statut d'une fonctionnalité après test. | Seul le testeur peut modifier le statut. |
| US-09 | Testeur | Notifier directement un développeur d'une anomalie. | Chef informé automatiquement en copie. |
| US-11 | Développeur | Consulter les anomalies qui lui sont assignées. | Filtrage par statut disponible. |
| US-12 | Développeur | Signaler la résolution d'une anomalie. | Ne peut pas modifier le statut. |

Tableau 6 — User Stories principales par profil utilisateur

---

Chapitre 4 — Réalisation technique

4.1 Architecture technique et choix technologiques

Les choix technologiques ont été effectués en tenant compte de la facilité de maintenance, de la compatibilité avec les environnements de DHI et de la capacité à faire évoluer le logiciel. L'architecture adoptée est une architecture client-serveur trois tiers, garantissant la séparation des responsabilités.

| Composant | Technologie retenue | Rôle |
|---|---|---|
| Interface utilisateur (Frontend) | React.js + Tailwind CSS | Interface visible par les utilisateurs : tableaux de bord, fiches tâches, fiches anomalies. |
| Moteur applicatif (Backend) | Node.js / Express.js | Logique métier, gestion des droits, API REST, envoi des notifications. |
| Base de données | PostgreSQL | Stockage structuré de toutes les données : projets, campagnes, anomalies, historiques. |
| Authentification / Sécurité | JWT + bcrypt | Authentification par jeton, hachage sécurisé des mots de passe. |
| Hébergement | Serveur local ou VPS + Docker | Déploiement flexible selon les infrastructures de DHI. |
| Versioning du code | Git (GitHub / GitLab) | Gestion du code source, collaboration et traçabilité des modifications. |

Tableau 7 — Choix technologiques

4.2 Modélisation des données (Merise / MCD)

La modélisation des données a été réalisée selon la méthode Merise, produisant un Modèle Conceptuel de Données (MCD). Le MCD identifie neuf entités principales et leurs associations.

[Insérer ici : Figure 5 — Modèle Conceptuel de Données (MCD — méthode Merise)]

4.3 Développement des modules — phases de réalisation

| Ph. | Durée | Activités | Livrable attendu |
|---|---|---|---|
| 1 | Semaines 1-2 | Analyse des besoins, entretiens avec les équipes DHI, rédaction et validation du cahier des charges. | Cahier des charges validé. |
| 2 | Semaines 3-4 | Conception de l'architecture, MCD Merise, diagrammes UML, maquettes des écrans. | Architecture et maquettes approuvées. |
| 3 | Semaines 5-6 | Développement des modules 1, 2 et 3 : projets, campagnes, gestion des équipes et connexion. | Modules de base fonctionnels. |
| 4 | Semaine 7 | Développement des modules 4, 5, 6 : assignation, anomalies, tableau de bord, rapports. Tests globaux. | Logiciel complet et testé. |
| 5 | Semaine 8 | Déploiement, formation des utilisateurs, documentation technique et guide utilisateur. | Logiciel livré et opérationnel. |

Tableau 8 — Phases de réalisation

4.4 Planning prévisionnel et planning réel

Deux plannings ont été élaborés pour structurer et suivre l'avancement du projet : un planning prévisionnel établi en début de stage, et un planning réel mettant en évidence les écarts et ajustements apportés en cours de projet.

[Insérer ici : Figure 3 — Planning prévisionnel du projet (Diagramme de Gantt)]

[Insérer ici : Figure 4 — Planning réel du projet (Diagramme de Gantt)]

4.5 Budget du projet

Le budget du projet couvre les ressources humaines, les licences logicielles éventuelles et les frais de développement. Le tableau ci-dessous en présente le détail estimatif :

| Poste de dépense | Quantité | Coût unitaire (FCFA) | Coût total (FCFA) |
|---|---|---|---|
| Ressources humaines — Stagiaires | 2 | 0 FCFA | 0 FCFA |
| Outils de développement | 1 | 0 FCFA | 0 FCFA |
| Base de données (PostgreSQL — open source) | 1 | 0 FCFA | 0 FCFA |
| Tests et recette | 1 | 0 FCFA | 0 FCFA |
| Documentation et matériel informatique | 1 | 0 FCFA | 0 FCFA |
| **TOTAL ESTIMÉ** | | | **0 FCFA** |

Tableau 9 — Budget estimatif du projet

4.6 Captures d'écran — interfaces développées

Les captures d'écran ci-dessous illustrent les principales interfaces du logiciel développé, correspondant aux modules les plus importants.

[Insérer ici : Figure 6 — Interface de connexion du logiciel DHI (authentification JWT)]

[Insérer ici : Figure 7 — Tableau de bord principal : vue administrateur — projets actifs et indicateurs]

[Insérer ici : Figure 8 — Page de gestion des projets]

[Insérer ici : Figure 9 — Page de gestion des campagnes]

[Insérer ici : Figure 10 — Page de détail d'une campagne]

[Insérer ici : Figure 11 — Page « Mes tâches » (vue testeur)]

[Insérer ici : Figure 12 — Page « Mes anomalies » (vue développeur)]

[Insérer ici : Figure 13 — Page de reporting et export PDF/Excel]

4.7 Sécurité de l'application

La sécurité de l'application a été traitée comme une préoccupation transversale, appliquée à plusieurs niveaux complémentaires plutôt qu'à un seul point d'entrée.

**Authentification par jeton JWT**

À la connexion, le serveur génère un jeton JWT (JSON Web Token) signé avec une clé secrète et transmis au client. Ce jeton est ensuite joint à chaque requête HTTP dans l'en-tête `Authorization`. Un middleware vérifie la validité du jeton à chaque appel d'API protégé : s'il est absent, expiré ou altéré, la requête est rejetée avec une erreur 401. Ce mécanisme permet une authentification sans état (stateless) : le serveur n'a pas besoin de conserver de session en mémoire pour identifier l'utilisateur. Le même mécanisme est appliqué à la connexion WebSocket : le jeton JWT est vérifié lors du handshake initial de Socket.IO.

**Hachage des mots de passe**

Les mots de passe ne sont jamais stockés en clair en base de données. À la création d'un compte ou lors d'un changement de mot de passe, le mot de passe est haché avec l'algorithme bcrypt avant d'être enregistré. bcrypt intègre un sel aléatoire et un facteur de coût qui rend les attaques par dictionnaire ou par tables arc-en-ciel non rentables. À la connexion, le mot de passe saisi est comparé au hachage stocké via la fonction `bcrypt.compare`, sans jamais déchiffrer le hachage.

**Verrouillage de compte progressif**

Pour protéger les comptes contre les attaques par force brute, nous avons mis en place un mécanisme de verrouillage automatique après cinq tentatives de connexion infructueuses. La durée de blocage est progressive : elle double à chaque nouveau verrouillage du même compte (15 min, 30 min, 1h, 2h, jusqu'à un plafond de 24h). Ce comportement nécessite le suivi d'un compteur de verrouillages (`lock_count`) en base de données. Un administrateur peut déverrouiller manuellement un compte depuis l'interface d'administration, ce qui réinitialise également ce compteur. Par mesure de sécurité, le message d'erreur affiché à l'utilisateur est toujours générique (« Email ou mot de passe incorrect »), que le compte soit verrouillé ou que les identifiants soient faux, afin de ne pas révéler à un attaquant l'existence d'un compte.

**Limitation du débit par adresse IP (Rate Limiting)**

Le verrouillage par compte ne protège pas contre un attaquant ciblant de nombreux comptes différents depuis une même machine. Nous avons donc ajouté un middleware `express-rate-limit` sur les routes sensibles `/auth/login` et `/auth/register`, limitant chaque adresse IP à un nombre raisonnable de requêtes sur une fenêtre de 15 minutes. La configuration du proxy inverse de la plateforme d'hébergement (option `trust proxy`) a été nécessaire pour que le middleware détecte correctement l'adresse IP réelle du client et non celle du proxy.

**Flux de récupération de mot de passe**

En l'absence de système d'envoi de lien de réinitialisation autonome, nous avons conçu un flux adapté au contexte de DHI : l'utilisateur soumet son adresse e-mail via un formulaire dédié sur la page de connexion ; le serveur notifie tous les administrateurs (notification in-app et e-mail) sans révéler au demandeur si l'adresse correspond à un compte existant ; l'administrateur génère depuis son interface un mot de passe temporaire aléatoire, qui est haché avant stockage et transmis par e-mail à l'utilisateur concerné.

**En-têtes de sécurité HTTP**

Le middleware Helmet est activé sur l'ensemble de l'API : il configure automatiquement des en-têtes HTTP de sécurité (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, etc.) qui protègent contre les attaques courantes côté navigateur (clickjacking, MIME-sniffing, injection de contenu).

---

4.8 Notifications et communication temps réel

La communication en temps réel entre le serveur et les clients est assurée par Socket.IO, une bibliothèque construite sur le protocole WebSocket. Elle permet au serveur d'envoyer des informations aux navigateurs connectés sans que ceux-ci aient à formuler une requête.

**Architecture événementielle (Event Bus)**

Nous avons adopté une architecture orientée événements pour découpler la logique métier des effets de bord. Les services métier (gestion des anomalies, des assignations, des campagnes) publient des événements nommés sur un bus interne basé sur l'`EventEmitter` de Node.js — par exemple `anomaly:created`, `assignment:reassigned`, `feature:conforme`. Un module centralisé (`eventSubscribers.js`) s'abonne à ces événements et déclenche pour chacun les trois effets attendus : création d'une notification en base de données, émission WebSocket vers l'utilisateur concerné, et envoi d'un e-mail. Ce découplage présente un avantage important : ajouter, modifier ou supprimer un effet de bord ne nécessite pas de toucher au service métier, mais uniquement au fichier d'abonnement.

**Organisation des connexions Socket.IO**

Chaque utilisateur connecté rejoint automatiquement une « room » Socket.IO personnelle (identifiée par son `userId`). Lorsqu'une campagne est consultée, le client rejoint également la room de la campagne. Cela permet au serveur d'envoyer des notifications ciblées à un utilisateur précis, ou de diffuser une mise à jour de données à tous les utilisateurs qui consultent la même campagne au même moment, sans envoyer d'information superflue à des utilisateurs non concernés.

**Types d'événements notifiés**

Les événements déclenchant une notification sont les suivants : signalement d'une anomalie (→ développeur assigné), résolution signalée (→ testeur déclarant), validation d'une anomalie (→ chefs testeurs de la campagne), rejet d'une résolution (→ testeur déclarant), fonctionnalité marquée conforme (→ chefs testeurs), assignation ou réassignation d'une tâche (→ testeur concerné), ajout à l'équipe d'une campagne (→ membre ajouté), demande de réinitialisation de mot de passe (→ tous les administrateurs). Chaque notification est persistée en base de données et peut être relue depuis le panneau de notifications de l'interface, même après déconnexion.

**Notifications par e-mail**

En complément des notifications in-app, chaque événement déclenche l'envoi d'un e-mail formaté avec un template HTML dédié par type d'événement, via Nodemailer et le service Resend. Un mécanisme anti-doublon limite les envois répétés pour les événements fréquents (connexions successives rapprochées) afin de ne pas saturer la boîte de réception des utilisateurs.

---

4.9 Assistance par intelligence artificielle

Une assistance par intelligence artificielle a été intégrée à plusieurs points stratégiques de l'application, selon deux approches techniques distinctes selon le type de suggestion.

**Suggestion de priorité d'anomalie (traitement local, sans appel réseau)**

Lors de la création d'une anomalie, dès que l'utilisateur saisit le titre et la description, une suggestion de niveau de priorité est calculée instantanément côté client, sans aucun appel réseau. L'algorithme analyse les mots présents dans le texte et attribue un score à chacun des quatre niveaux de priorité : `critique`, `haute`, `moyenne` et `basse`. Des mots comme « bloquant », « crash », « inaccessible » ou « urgent » orientent vers `critique` ; des termes comme « lent », « incorrect » ou « partiel » vers `haute` ; et ainsi de suite. Le niveau ayant le score le plus élevé est affiché comme suggestion, que l'utilisateur peut confirmer ou modifier. Cette approche garantit une réponse immédiate sans dépendance à une connexion ou à un service tiers.

**Suggestion du développeur le plus pertinent (algorithme de similarité)**

Pour recommander le développeur le plus adapté à traiter une nouvelle anomalie, nous avons mis en place un algorithme de similarité basé sur le coefficient de Jaccard. L'algorithme extrait les mots significatifs de la description de la nouvelle anomalie (après suppression des mots vides courants : articles, prépositions, etc.), puis compare cet ensemble de mots aux anomalies déjà résolues par chaque développeur présent dans l'équipe de la campagne. Le développeur ayant traité le plus d'anomalies dont le contenu est similaire à la nouvelle est recommandé en priorité. En l'absence d'historique comparable, le développeur le plus actif dans la campagne est suggéré en repli.

**Assistant conversationnel contextuel (LLM — Ollama)**

Un assistant de chat est intégré dans l'interface et permet aux utilisateurs de poser des questions en langage naturel sur l'état de la campagne en cours. Côté serveur, à chaque message reçu, nous construisons un prompt système enrichi qui injecte dans la requête au modèle de langage le contexte complet de l'utilisateur connecté : son rôle, son nom, les campagnes et projets récents, la distribution des statuts des anomalies et des fonctionnalités, ainsi que — selon le rôle — sa charge de travail personnelle (tâches assignées pour un testeur, anomalies à traiter pour un développeur, campagnes gérées pour un chef testeur). Ce contexte est transmis au modèle `qwen2.5:7b` exécuté localement via Ollama, avec une température de 0.3 pour des réponses précises et cohérentes. Si Ollama n'est pas disponible, un mécanisme de repli répond aux questions les plus fréquentes par correspondance de mots-clés, assurant une dégradation gracieuse sans message d'erreur technique pour l'utilisateur.

---

4.10 Déploiement de l'application

L'application est configurée pour être déployée sur la plateforme Render via un fichier de configuration déclaratif `render.yaml` versionné dans le dépôt Git. Ce fichier décrit en une seule déclaration les trois composants de l'infrastructure :

- **Service statique** (frontend React) : Render exécute la commande de build (`npm run build`) et sert les fichiers statiques générés depuis un CDN mondial, avec HTTPS automatique.
- **Service web** (backend Node.js/Express) : Render démarre le serveur Node.js et expose l'API REST ainsi que le serveur Socket.IO sur une URL dédiée.
- **Base de données PostgreSQL** : Render provisionne une instance PostgreSQL gérée, avec sauvegardes automatiques, dont l'URL de connexion est injectée comme variable d'environnement dans le service backend.

Les variables d'environnement sensibles (clé secrète JWT, identifiants e-mail, URL de la base de données) sont configurées dans le tableau de bord Render et ne sont jamais incluses dans le dépôt Git. Cette approche de déploiement par configuration déclarative présente l'avantage de rendre l'infrastructure reproductible et documentée : tout redéploiement sur un nouvel environnement se fait sans intervention manuelle.

---

Chapitre 5 — Diagrammes UML et modélisation

Lors de la phase de conception, plusieurs diagrammes UML ont été réalisés, chacun avec un rôle distinct. Ils permettent de définir avec précision les différents aspects fonctionnels, structurels et comportementaux du logiciel DHI.

5.1 Diagramme de cas d'utilisation (Use Case)

Le diagramme de cas d'utilisation représente les interactions entre les acteurs (Administrateur, Chef testeur, Testeur, Développeur) et les fonctionnalités du système. Il offre une vue synthétique de ce que le logiciel permet à chaque profil d'utilisateur d'accomplir, sans entrer dans les détails techniques de la mise en œuvre.

Les cas d'utilisation principaux identifiés sont : s'authentifier, gérer les projets, créer et piloter une campagne, constituer une équipe, assigner des tâches, déclarer une anomalie, signaler une résolution, valider ou rejeter une correction, et consulter le tableau de bord et les rapports.

[Insérer ici : Figure 14 — Diagramme de cas d'utilisation (Use Case — UML)]

5.2 Diagramme de classes

Le diagramme de classes représente les entités manipulées dans le système et les relations qui les lient. Il correspond à la vue structurelle du logiciel et s'appuie directement sur le MCD Merise réalisé en amont.

Les classes principales sont : Utilisateur, Projet, Campagne, MembreCampagne, Assignation, Fonctionnalité, Anomalie, Notification et Historique. Chaque classe regroupe ses attributs et ses méthodes principales. Les relations modélisent les cardinalités définies dans le MCD : une campagne appartient à un projet, un utilisateur peut être membre de plusieurs campagnes avec des rôles différents, une anomalie est liée à une fonctionnalité et peut déclencher plusieurs notifications.

[Insérer ici : Figure 15 — Diagramme de classes (UML)]

5.3 Diagramme de séquence

Le diagramme de séquence décrit les interactions entre les composants du système dans le temps, en mettant l'accent sur l'ordre chronologique des messages échangés pour réaliser une fonctionnalité précise.

Le diagramme ci-dessous illustre le scénario le plus représentatif du système : le cycle complet de gestion d'une anomalie, depuis la détection par le testeur jusqu'à la validation de la correction. Ce scénario implique quatre acteurs : le Testeur, le Chef testeur, le Développeur et le Système (logiciel DHI).

Les étapes représentées sont : (1) le testeur déclare une anomalie via l'interface ; (2) le système enregistre l'anomalie et envoie une notification au développeur sélectionné et une copie au chef testeur ; (3) le développeur accuse réception et passe le statut à « En cours de traitement » ; (4) le développeur notifie la résolution ; (5) le testeur reçoit l'alerte et effectue un nouveau test ; (6) le testeur valide ou rejette la correction.

[Insérer ici : Figure 16 — Diagramme de séquence : cycle de vie d'une anomalie (UML)]

---

Difficultés rencontrées

La réalisation de ce projet s'est déroulée dans un contexte présentant plusieurs défis, aussi bien d'ordre environnemental que technique. Ces difficultés nous ont conduits à adapter notre organisation et notre méthode de travail tout au long du stage.

**Coupures de courant intempestives**

La difficulté la plus récurrente et la plus contraignante rencontrée durant ce stage est sans conteste les coupures de courant fréquentes, inhérentes au contexte énergétique camerounais. Ces interruptions électriques, parfois plusieurs fois par jour et d'une durée imprévisible, ont régulièrement interrompu nos sessions de développement en plein travail, provoquant des pertes de données non sauvegardées et des redémarrages forcés de nos environnements de développement. Nous avons dû adapter notre méthode de travail en conséquence : sauvegardes très fréquentes du code, commits Git réguliers pour ne jamais perdre plus de quelques minutes de travail, et utilisation systématique de la fonctionnalité de sauvegarde automatique de l'éditeur de code. Ces interruptions ont également affecté notre productivité globale et allongé certaines phases de développement initialement planifiées sur des créneaux qui se sont révélés inutilisables.

**Instabilité de la connexion internet**

En lien direct avec les coupures de courant, la connexion internet a également été source de difficultés. Certaines fonctionnalités du projet nécessitent un accès réseau stable : consultation des documentations techniques en ligne, installation des dépendances Node.js et npm, tests des envois d'e-mails via le service Resend, et intégration du modèle de langage Ollama qui requiert le téléchargement de fichiers de plusieurs gigaoctets. Nous avons dû planifier ces opérations aux moments de meilleure disponibilité réseau et télécharger à l'avance les ressources nécessaires pour poursuivre le travail hors connexion lorsque c'était possible.

**Montée en compétence sur une stack technique variée**

Le projet a mobilisé simultanément plusieurs technologies que nous n'avions pas toutes pratiquées en formation : React.js avec la gestion d'état via des contextes, Node.js/Express pour la conception d'une API REST complète, PostgreSQL avec des migrations SQL versionnées, et Socket.IO pour la communication temps réel. Cette montée en compétence rapide sur un environnement full-stack a demandé un investissement personnel important, appuyé sur la documentation officielle — principalement en anglais — et sur des phases de test et d'expérimentation par essais-erreurs.

**Complexité de la gestion des droits d'accès par rôle**

S'assurer que chaque profil utilisateur ne peut accéder qu'aux données et aux actions qui lui sont autorisées a représenté un défi de conception important. Chaque endpoint de l'API a dû faire l'objet d'une validation explicite du rôle de l'utilisateur connecté côté serveur, et chaque interface frontend a dû masquer ou désactiver les éléments non accessibles selon le profil. La définition précise, pour chaque événement métier, des utilisateurs à notifier et du bon moment dans le cycle de vie pour le faire a également nécessité plusieurs révisions pour atteindre un comportement cohérent.

**Coordination du travail en binôme avec Git**

Travailler à deux sur une même base de code a nécessité une organisation rigoureuse avec Git : découpage clair des tâches, nommage des branches par fonctionnalité, revue mutuelle avant fusion, et résolution de conflits lors des merges. Cette discipline, bien que coûteuse en temps au départ, s'est révélée indispensable pour maintenir une base de code cohérente et éviter les régressions dues à des modifications simultanées sur les mêmes fichiers.

---

Perspectives

À l'issue de ce stage, plusieurs axes d'amélioration et d'évolution peuvent être envisagés pour enrichir le logiciel :

- **Tests automatisés** : la mise en place de tests unitaires et d'intégration sur le backend permettrait de fiabiliser les évolutions futures et de détecter rapidement les régressions.
- **Application mobile** : le développement d'une application mobile complémentaire faciliterait la consultation des notifications et des tâches en dehors du poste de travail.
- **Statistiques avancées** : l'ajout d'indicateurs de performance par testeur et par développeur (temps moyen de résolution, taux d'anomalies rejetées) permettrait un pilotage plus fin de la qualité.
- **Intégration à des outils existants** : des connecteurs vers des outils de gestion de projet comme Jira ou Trello étendraient la portée du logiciel pour les équipes déjà équipées.
- **Modèle SaaS** : l'ouverture du logiciel à d'autres entreprises sous forme de solution SaaS (Software as a Service) est une perspective réaliste, le logiciel ayant été conçu de façon générique dès le départ.

---

Conclusion

Au terme de ce stage de deux mois au sein de DHI, nous avons mené à bien un projet informatique complet — de l'analyse des besoins jusqu'à la livraison d'un logiciel opérationnel — répondant à une problématique réelle et concrète identifiée dans le fonctionnement quotidien de l'entreprise.

Le logiciel de suivi des tests et de la qualité logicielle développé apporte une réponse structurée aux dysfonctionnements identifiés lors de l'état des lieux : centralisation de la gestion des projets et des campagnes, traçabilité complète et immuable des actions, formalisation du cycle de vie des anomalies, séparation stricte des rôles entre testeurs et développeurs, et génération automatique de rapports. Il constitue un outil fiable, sécurisé et évolutif, conçu pour être déployé au-delà de DHI.

Sur le plan technique, ce projet nous a permis de mobiliser et d'approfondir des compétences clés : modélisation Merise, conception UML, développement web full-stack avec React.js, Node.js et PostgreSQL, sécurisation des accès par JWT et bcrypt. La rigueur imposée par la rédaction du cahier des charges et la conception des diagrammes UML a structuré notre démarche et nous a appris l'importance de la phase de conception dans la réussite d'un projet logiciel.

Sur le plan humain et professionnel, ce stage a développé notre capacité à travailler en binôme, à interagir avec des équipes métier aux profils variés, à gérer des délais de livraison et à nous adapter aux contraintes d'un environnement professionnel réel.

Cette expérience constitue une base solide pour la suite de notre parcours en ingénierie informatique, en nous ancrant davantage dans les réalités du développement logiciel professionnel.

---

Lexique / Glossaire

| Terme | Définition |
|---|---|
| Anomalie | Problème ou dysfonctionnement constaté sur une fonctionnalité lors d'un test. Fait l'objet d'un cycle de résolution formalisé. |
| API (Application Programming Interface) | Interface permettant à deux logiciels de communiquer entre eux en échangeant des données via des requêtes standardisées. |
| Architecture trois tiers | Architecture logicielle séparant la présentation (frontend), la logique métier (backend) et le stockage (base de données). |
| Backend | Partie serveur d'une application web, invisible à l'utilisateur, qui traite les données et applique les règles métier. |
| bcrypt | Algorithme de hachage utilisé pour chiffrer les mots de passe de manière sécurisée avant leur stockage en base de données. |
| Campagne de test | Cycle de test structuré au sein d'un projet, organisé par fonctionnalités ou modules, avec des équipes et un périmètre défini. |
| Fonctionnalité | Unité de test élémentaire. Peut représenter une fonction du logiciel ou un module complet. Deux statuts : Conforme ou Anomalie détectée. |
| Frontend | Partie client d'une application web, visible par l'utilisateur, comprenant l'interface graphique et les interactions. |
| Gap Analysis | Analyse des écarts entre la situation actuelle et la situation cible d'un système ou processus. |
| Git | Système de contrôle de version distribué permettant de suivre les modifications du code source et de collaborer. |
| JWT (JSON Web Token) | Jeton d'accès sécurisé et temporaire attribué à chaque utilisateur connecté pour authentifier ses requêtes. |
| MCD (Modèle Conceptuel de Données) | Représentation abstraite des entités et de leurs associations dans un système d'information (méthode Merise). |
| Node.js | Environnement d'exécution JavaScript côté serveur, permettant de construire des applications web rapides et évolutives. |
| PostgreSQL | Système de gestion de bases de données relationnelles open source, connu pour sa robustesse et ses performances. |
| React.js | Bibliothèque JavaScript open source développée par Meta, utilisée pour construire des interfaces utilisateur réactives. |
| Socket.IO | Bibliothèque permettant la communication en temps réel entre le serveur et les navigateurs clients via des WebSockets. |
| WebSocket | Protocole de communication bidirectionnel permettant au serveur d'envoyer des données au client sans qu'il les demande. |

---

Webographie

- https://react.dev/ — Documentation officielle React.js
- https://vitejs.dev/ — Documentation Vite (outil de build)
- https://expressjs.com/ — Documentation Express.js
- https://www.postgresql.org/docs/ — Documentation PostgreSQL
- https://socket.io/docs/ — Documentation Socket.IO
- https://tailwindcss.com/docs — Documentation Tailwind CSS
- https://jwt.io/introduction — Introduction aux JSON Web Tokens
- https://www.npmjs.com/package/bcryptjs — Documentation bcrypt.js
- https://zod.dev/ — Documentation Zod (validation de schémas)
- https://www.radix-ui.com/ — Documentation Radix UI
- https://www.i18next.com/ — Documentation i18next (internationalisation)
- https://merise.fr/ — Ressources sur la méthode Merise
- [Ajouter ici les autres ressources et tutoriels consultés pendant le stage]
