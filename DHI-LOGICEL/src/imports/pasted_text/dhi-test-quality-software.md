
DHI
Digital House International

CAHIER DES CHARGES
Logiciel de Suivi des Tests et de la Qualité Logiciel

Entreprise d'accueil	DHI (Digital House International)
Stagiaires	JIPNANG RYAN, NGOUNOU PHAREL
Encadrant	
Durée du stage	2 mois ( pratiquement )
Nature du projet	Développement d'un logiciel de suivi des tests et de la qualité logiciel

Document interne — Stage Informatique 2025/2026
 
1. Contexte et présentation du projet
1.1 Présentation de l'entreprise DHI
DHI (Digital House International) est une entreprise spécialisée dans le développement de logiciels et de solutions numériques. La qualité de ses livrables constitue un enjeu central : chaque projet logiciel est soumis à un processus rigoureux de tests avant livraison. Plusieurs équipes de testeurs et de développeurs interviennent en parallèle sur différents projets, et le suivi des campagnes de tests représente un défi organisationnel croissant.
1.2 Problème identifié
Actuellement, le suivi des tests logiciels chez DHI repose sur des outils non spécialisés et des pratiques informelles. Cette organisation génère plusieurs problèmes concrets :
•	Aucun outil centralisé ne permet de gérer plusieurs projets et plusieurs campagnes de test simultanément.
•	Les anomalies détectées par les testeurs sont communiquées aux développeurs de façon informelle (e-mail, messagerie), sans traçabilité fiable.
•	Le chef de l'équipe testeur n'a pas d'outil dédié pour assigner les tâches à ses membres ni pour suivre leur avancement en temps réel.
•	Les développeurs ne savent pas toujours quelles anomalies leur sont assignées ni quel est leur état de prise en charge.
•	Il n'existe aucun mécanisme formel permettant aux testeurs de valider qu'une anomalie signalée comme résolue est effectivement corrigée.
•	La communication entre testeurs et développeurs passe souvent uniquement par les chefs d'équipe, ce qui crée des goulots d'étranglement.
1.3 Objectif du projet
C'est dans ce contexte que DHI a décidé de confier à deux stagiaires ingénieurs en informatique de l'institut UCAC-ICAM la conception et le développement d'un logiciel de suivi des tests et de la qualité logiciel. Ce logiciel devra permettre à toutes les équipes concernées de :
•	Gérer plusieurs projets simultanément, chacun disposant de ses propres campagnes de test.
•	Organiser les équipes testeurs et développeurs au sein de chaque campagne de test.
•	Permettre au chef de l'équipe testeur d'assigner les tâches de test à ses membres directement via le logiciel.
•	Suivre le statut de chaque fonctionnalité testée (conforme ou anomalie détectée).
•	Permettre aux testeurs de notifier directement un développeur d'une anomalie, sans passer systématiquement par le chef d'équipe.
•	Permettre aux développeurs de signaler la résolution d'une anomalie, sans pouvoir modifier le statut dans le logiciel — ce droit restant exclusivement réservé aux testeurs.
•	Consulter l'historique des actions et générer des rapports de campagne.
1.4 Périmètre du projet
Ce logiciel est développé dans le cadre du stage au sein de DHI, qui constitue le premier client et le terrain d'expérimentation du projet. Cependant, il est conçu dès le départ de façon suffisamment générique pour pouvoir être déployé dans d'autres entreprises souhaitant structurer leur processus de tests logiciels internes.
L'objectif à terme est de proposer une solution réutilisable, adaptable aux besoins spécifiques de chaque organisation, quelle que soit la taille de ses équipes ou la nature de ses projets logiciels. Les fonctionnalités développées ne sont donc pas figées sur le fonctionnement propre à DHI, mais pensées pour être configurables et transposables.

 
2. État des lieux — Ce qui existe aujourd'hui
Avant de concevoir le logiciel, il est important de comprendre comment DHI gère actuellement le suivi de ses campagnes de tests logiciels. Cette section décrit les outils et pratiques en place, ainsi que leurs limites.
2.1 Outils actuellement utilisés

Outil / Pratique	Usage actuel	Limites observées
Fichiers Excel	Utilisés par les chefs d'équipe pour lister les fonctionnalités à tester et noter manuellement les résultats.	Non partagés en temps réel, versions multiples, risque d'erreur et de perte de données.
E-mails et messageries	Utilisés pour signaler les anomalies aux développeurs et pour les échanges entre équipes.	Informations dispersées, aucune traçabilité centralisée, risque d'oubli ou de mauvaise transmission.
Réunions informelles	Remontée orale des bugs et anomalies lors de points d'équipe.	Pas de trace écrite, oublis fréquents, délais de communication importants.
Outils de messagerie (WhatsApp, Slack…)	Notifications informelles entre testeurs et développeurs pour signaler une anomalie ou une résolution.	Aucune structuration des informations, mélange avec d'autres conversations, non exploitable pour un suivi.

2.2 Processus actuel de suivi des tests
Aujourd'hui, lorsqu'une campagne de test démarre chez DHI, voici ce qui se passe dans l'ordre :
•	Le chef de l'équipe testeur communique oralement ou par e-mail la répartition des tâches à ses membres.
•	Chaque testeur effectue ses tests et note les résultats dans un fichier Excel personnel ou partagé.
•	En cas d'anomalie, le testeur prévient le développeur concerné par messagerie instantanée ou par e-mail.
•	Le développeur corrige le bug et répond par messagerie pour informer le testeur de la résolution.
•	Le testeur effectue une nouvelle vérification et met à jour son fichier Excel manuellement.
•	Un bilan de fin de campagne est produit manuellement par le chef d'équipe, ce qui peut prendre plusieurs heures.

Ce processus, bien qu'utilisé au quotidien, montre ses limites à mesure que le nombre de projets et la taille des équipes augmentent. Il devient difficile à maintenir sans risque de perte d'information, de doublons ou de retards dans la prise en charge des anomalies.

 
3. Analyse des écarts — Gap Analysis
L'analyse des écarts consiste à comparer ce qui existe aujourd'hui (l'existant) avec ce que l'on souhaite atteindre grâce au nouveau logiciel (la cible). Elle permet d'identifier précisément ce qui doit être amélioré ou créé.

Domaine	Situation actuelle	Situation cible	Niveau d'écart
Gestion multi-projets	Aucun outil centralisé. Chaque projet est suivi dans des fichiers séparés, sans lien entre eux.	Un logiciel unique permettant de gérer plusieurs projets et campagnes de test en parallèle.	ÉLEVÉ
Assignation des tâches	Le chef testeur communique les tâches oralement ou par e-mail. Aucun suivi de qui fait quoi.	Assignation directe via le logiciel. Chaque testeur voit ses tâches et leur statut en temps réel.	ÉLEVÉ
Suivi du statut des fonctionnalités	Noté manuellement dans Excel, sans garantie d'intégrité ni de mise à jour cohérente.	Statut mis à jour directement dans le logiciel par les testeurs, avec horodatage et traçabilité.	ÉLEVÉ
Gestion des anomalies	Signalement informel par e-mail ou messagerie. Aucune fiche structurée, aucune traçabilité du traitement.	Fiche anomalie numérique structurée avec description, développeur notifié, statut et historique complet.	ÉLEVÉ
Communication testeur → développeur	Passe toujours par le chef d'équipe ou par des outils non structurés. Risque de délai et d'oubli.	Un testeur peut notifier directement un développeur depuis le logiciel, sans passer par le chef d'équipe.	ÉLEVÉ
Validation de la résolution	Aucun mécanisme formel. Le développeur dit que c'est résolu, le testeur vérifie ou non.	Le développeur notifie la résolution. Seul le testeur peut valider et mettre à jour le statut de la fonctionnalité.	ÉLEVÉ
Tableau de bord	Inexistant. Les indicateurs sont calculés à la main dans Excel.	Tableau de bord automatique par projet et par campagne, mis à jour en temps réel.	ÉLEVÉ
Gestion des accès	Aucun système d'accès formalisé. Les fichiers Excel sont partagés sans restriction de droits.	Comptes individuels avec rôles définis : administrateur, chef testeur, testeur, développeur.	MOYEN
Rapports de campagne	Produits manuellement par le chef d'équipe. Processus long, source d'erreurs.	Génération automatique en PDF ou Excel en quelques secondes.	MOYEN
Historique et traçabilité	Archivage dans des fichiers locaux peu fiables, difficile à consulter ou à retrouver.	Historique complet et immuable de toutes les actions, consultable à tout moment.	MOYEN

Légende — 

ÉLEVÉ : fonctionnalité inexistante ou très insuffisante.   

MOYEN : fonctionnalité partielle à améliorer.   


 
4. Bénéfices attendus du projet
La mise en place du logiciel de suivi des tests et de la qualité logiciel va apporter des améliorations concrètes à plusieurs niveaux. Ces bénéfices concernent aussi bien les testeurs et les développeurs que les chefs d'équipe et la direction de DHI.
4.1 Bénéfices opérationnels — Au quotidien

Bénéfice	Ce que cela change concrètement
Gain de temps sur l'assignation	Le chef testeur assigne les tâches en quelques clics. Plus besoin de réunions ou d'e-mails pour savoir qui teste quoi.
Clarté pour les testeurs	Chaque testeur voit directement ses tâches assignées dès sa connexion, avec la description et la priorité de chaque test.
Réactivité face aux anomalies	Un testeur peut notifier directement un développeur d'une anomalie sans attendre une réunion ou l'intervention du chef d'équipe.
Clarté pour les développeurs	Chaque développeur voit en un coup d'œil les anomalies qui lui sont adressées, avec la description complète du problème.
Intégrité du processus de validation	Seul le testeur peut valider qu'une anomalie est réellement corrigée en mettant à jour le statut de la fonctionnalité. Aucune confusion possible.

4.2 Bénéfices pour le management

Bénéfice	Ce que cela change concrètement
Vision en temps réel	Le tableau de bord affiche l'état de chaque campagne à l'instant T : fonctionnalités testées, anomalies ouvertes, résolutions en attente de validation.
Meilleure prise de décision	Des indicateurs fiables et à jour permettent de prioriser les actions, d'anticiper les retards et d'ajuster la charge des équipes.
Traçabilité complète	Chaque action (changement de statut, notification d'anomalie, signalement de résolution) est enregistrée avec la date, l'heure et l'identité de l'acteur.
Rapports automatisés	La production d'un rapport de campagne qui prenait plusieurs heures se fait désormais en quelques secondes, en PDF ou Excel.

4.3 Bénéfices stratégiques pour DHI
•	Une meilleure image de sérieux et de rigueur vis-à-vis des clients : les livrables sont soumis à un processus de tests formalisé et traçable.
•	Une réduction des coûts liés aux anomalies non détectées ou traitées trop tard dans le cycle de développement.
•	Une base de données de tests structurée et exploitable pour les bilans de projet, les audits internes et les retours d'expérience.
•	Un socle numérique solide et réutilisable sur lequel DHI pourra s'appuyer pour de futurs projets internes ou à destination de clients.

 
5. Parties prenantes
Le logiciel implique quatre profils d'utilisateurs aux rôles bien distincts. Ces rôles sont définis au niveau de chaque campagne de test et déterminent les droits et les actions disponibles dans le logiciel.

Profil	Rôle dans le logiciel	Droits principaux
Administrateur / Chef de projet	Crée et gère les projets, les campagnes de test et les comptes utilisateurs.	Création/suppression de projets et campagnes, gestion de tous les comptes utilisateurs, accès à toutes les données.
Chef de l'équipe testeur	Pilote la campagne de test, enregistre les équipes, assigne les tâches à ses membres et supervise l'avancement global.	Création de campagnes, enregistrement des membres des deux équipes, assignation des tâches, consultation et modification de tous les statuts de la campagne.
Membre de l'équipe testeur	Effectue les tests selon les tâches assignées, déclare le statut d'une fonctionnalité et gère les anomalies éventuelles.	Consultation de ses tâches assignées, changement du statut d'une fonctionnalité (Conforme / Anomalie), description et notification directe d'une anomalie à un développeur.
Membre de l'équipe développeur	Reçoit les anomalies qui lui sont notifiées, corrige les bugs et notifie les testeurs de la résolution.	Consultation des anomalies notifiées, notification de résolution vers les testeurs. Ne peut en aucun cas modifier le statut d'une fonctionnalité.

 
6. Description des modules fonctionnels
Le logiciel est organisé en six modules fonctionnels complémentaires, couvrant l'ensemble du processus de suivi des tests, de la gestion des projets jusqu'à la génération des rapports.
Module 1 — Gestion des projets
Le logiciel permet de gérer plusieurs projets en parallèle. Chaque projet constitue un espace de travail indépendant avec ses propres campagnes de test, ses équipes et son historique.
•	L'administrateur ou le chef de projet peut créer, modifier et archiver des projets.
•	Chaque projet possède un nom, une description, une date de début et une date de fin prévisionnelle.
•	La liste des projets actifs est accessible depuis le tableau de bord principal.
•	Chaque projet peut contenir plusieurs campagnes de test indépendantes.

Module 2 — Gestion des campagnes de test
Une campagne de test est l'unité de base du suivi. Elle peut être organisée par fonctionnalités ou par modules, selon le choix de l'équipe testeur.
•	Le chef de l'équipe testeur crée une campagne et choisit son mode d'organisation : par fonctionnalités ou par modules.
•	Chaque campagne a un nom, un objectif, une date de début et une date de fin.
•	Au démarrage d'une campagne, le chef de l'équipe testeur enregistre :
◦	La liste des membres de l'équipe testeur participants à cette campagne.
◦	La liste des membres de l'équipe développeur associés à cette campagne.
•	Chaque campagne dispose d'une liste de fonctionnalités ou de modules à tester.
•	L'avancement global de la campagne est visible en temps réel (fonctionnalités testées, anomalies ouvertes, résolutions en attente).

Module 3 — Gestion des équipes
Ce module permet d'enregistrer et de gérer les membres des équipes testeur et développeur au sein d'une campagne.
•	À l'ouverture d'une campagne, le chef de l'équipe testeur saisit les noms des membres des deux équipes.
•	Chaque membre dispose d'un compte personnel permettant de se connecter et d'accéder à son espace.
•	Le chef de l'équipe testeur peut ajouter ou retirer des membres en cours de campagne.
•	Les membres de l'équipe testeur et les développeurs sont clairement distingués dans l'interface.

Module 4 — Assignation des tâches de test
Ce module permet au chef de l'équipe testeur de répartir les tâches de test entre les membres de son équipe, directement via le logiciel.
•	Le chef assigne à chaque membre une ou plusieurs fonctionnalités ou modules à tester.
•	Chaque membre voit uniquement les tâches qui lui ont été assignées dans son espace personnel.
•	Une tâche indique la fonctionnalité/module concerné, la description du test à effectuer et la priorité.
•	Le statut de chaque tâche est visible par le chef (en attente, en cours, terminée).
•	Une notification est envoyée au membre concerné lors de l'assignation d'une nouvelle tâche.

Module 5 — Suivi du statut des fonctionnalités et gestion des anomalies
C'est le cœur du logiciel. Il permet aux testeurs de déclarer le statut d'une fonctionnalité et de gérer les anomalies détectées tout au long du cycle.
5.1 Déclaration du statut d'une fonctionnalité
•	Après avoir effectué son test, le testeur renseigne le statut de la fonctionnalité :
◦	Conforme : la fonctionnalité fonctionne correctement.
◦	Anomalie détectée : un problème a été constaté.
•	Seuls les membres de l'équipe testeur (y compris le chef) peuvent modifier le statut d'une fonctionnalité.
•	Les développeurs ne peuvent en aucun cas modifier ce statut, même après avoir résolu une anomalie.
5.2 Description et notification d'une anomalie
•	Lorsqu'un testeur déclare une anomalie, il saisit une description détaillée du problème constaté.
•	Le testeur peut notifier directement un membre de l'équipe développeur, sans passer obligatoirement par le chef de l'équipe testeur.
•	La notification envoie une alerte au développeur concerné avec la description complète de l'anomalie.
•	Le chef de l'équipe testeur est automatiquement informé de toutes les anomalies notifiées dans sa campagne.
•	Chaque anomalie est enregistrée avec : la fonctionnalité concernée, la description, le testeur auteur, le développeur notifié et la date.
5.3 Résolution d'une anomalie par le développeur
•	Lorsqu'un développeur a corrigé une anomalie, il notifie les testeurs de la résolution depuis la fiche anomalie.
•	Cette notification inclut une description optionnelle des actions correctives effectuées.
•	Le statut de l'anomalie passe à « Résolution signalée ; en attente de validation testeur ».
•	Le testeur qui avait signalé l'anomalie reçoit une alerte et effectue un nouveau test.
•	Si la correction est validée, le testeur met à jour le statut de la fonctionnalité à « Conforme ».
•	Si le problème persiste, le testeur maintient le statut « Anomalie » et peut notifier à nouveau un développeur.

Module 6 — Tableau de bord et rapports
Ce module offre une vue d'ensemble de l'avancement des campagnes de test à destination des chefs de projet et chefs d'équipe.
•	Tableau de bord par projet : nombre de campagnes actives, taux d'avancement global.
•	Tableau de bord par campagne : nombre de fonctionnalités testées / en attente, anomalies ouvertes / résolues / validées.
•	Historique complet et immuable des actions (changements de statut, notifications, résolutions) avec horodatage et auteur.
•	Export de rapport de campagne en PDF ou Excel : récapitulatif des fonctionnalités testées, liste des anomalies et leur état.

 
7. Cycle de vie d'une anomalie
Le cycle de vie d'une anomalie décrit toutes les étapes par lesquelles elle passe, depuis sa détection par le testeur jusqu'à sa validation finale. Comprendre ce cycle est essentiel pour bien concevoir le logiciel et garantir qu'aucune anomalie ne reste sans traitement.

N°	Étape	Description	Acteur
1	Détection	Le testeur effectue son test et constate un dysfonctionnement. Il déclare le statut « Anomalie détectée » sur la fonctionnalité et saisit une description détaillée du problème.	Testeur
2	Notification	Le testeur notifie directement un membre de l'équipe développeur depuis la fiche anomalie. Une alerte est envoyée au développeur et le chef testeur est informé en copie. L'anomalie est enregistrée avec toutes ses métadonnées.	Testeur
3	Prise en charge	Le développeur notifié consulte la description de l'anomalie depuis son tableau de bord. Le statut de l'anomalie passe à « En cours de traitement ».	Développeur
4	Résolution signalée	Le développeur corrige le bug et notifie les testeurs que l'anomalie est traitée, avec une description optionnelle des correctifs appliqués. Le statut passe à « Résolution signalée ».	Développeur
5	Vérification	Le testeur concerné reçoit une alerte et effectue un nouveau test suite à la notification du développeur. Il vérifie que la correction est effective.	Testeur
6a	Validation — Clôture	Si la correction est validée, le testeur met à jour le statut de la fonctionnalité à « Conforme ». L'anomalie est clôturée et archivée dans l'historique.	Testeur
6b	Rejet — Réouverture	Si le problème persiste, le testeur maintient le statut « Anomalie » et peut notifier à nouveau un développeur. Le cycle reprend à l'étape 2.	Testeur

Règle fondamentale : seul un membre de l'équipe testeur peut modifier le statut d'une fonctionnalité dans le logiciel. Les développeurs peuvent uniquement notifier la résolution d'une anomalie. Cette règle garantit l'intégrité du processus de validation et préserve l'indépendance des équipes de test.

 
8. Cas d'usage — User Stories
Les User Stories ci-dessous décrivent les besoins du logiciel du point de vue de chaque type d'utilisateur. Elles couvrent l'ensemble des profils et constituent la base de référence pour le développement et la recette du logiciel.

Administrateur / Chef de projet
US-01 — Administrateur
Objectif	Je veux m'authentifier avec mon identifiant et mon mot de passe pour accéder à mon espace personnel sécurisé.
Raison	Pour garantir que seuls les utilisateurs autorisés peuvent accéder au logiciel et à ses données.
Critères d'acceptation :
•	Le système refuse tout accès sans identifiants valides.
•	Un message d'erreur clair s'affiche en cas d'identifiant incorrect.
•	Le compte est verrouillé temporairement après 5 tentatives échouées.
•	Chaque connexion est journalisée (date, heure, identifiant).

US-02 — Administrateur
Objectif	Je veux créer un nouveau projet dans le logiciel et y renseigner les informations générales (nom, description, dates).
Raison	Pour organiser le travail de test autour d'un périmètre clairement défini, accessible à toutes les équipes concernées.
Critères d'acceptation :
•	Je peux saisir le nom, la description, la date de début et la date de fin prévisionnelle.
•	Le projet créé apparaît immédiatement dans la liste des projets actifs.
•	Je peux modifier ou archiver un projet à tout moment.
•	Un projet archivé n'est plus visible par défaut mais reste accessible via un filtre dédié.

US-03 — Administrateur
Objectif	Je veux gérer les comptes utilisateurs (création, modification, désactivation) pour tous les membres intervenant sur les projets.
Raison	Pour contrôler les accès au logiciel et garantir que chaque utilisateur dispose uniquement des droits correspondant à son rôle.
Critères d'acceptation :
•	La création d'un compte prend moins de 2 minutes.
•	Je peux attribuer un rôle à chaque compte : administrateur, chef testeur, testeur ou développeur.
•	Un compte désactivé ne peut plus se connecter immédiatement.
•	L'historique des modifications de comptes est conservé dans les logs.

Chef de l'équipe testeur
US-04 — Chef de l'équipe testeur
Objectif	Je veux créer une campagne de test dans un projet, choisir son mode d'organisation et enregistrer les membres des deux équipes.
Raison	Pour cadrer le travail de test dès le départ et permettre à chaque participant de savoir qui intervient sur la campagne.
Critères d'acceptation :
•	Je peux saisir le nom, l'objectif, les dates et le mode d'organisation (par fonctionnalités ou par modules).
•	Je peux enregistrer la liste des membres de l'équipe testeur participants à cette campagne.
•	Je peux enregistrer la liste des membres de l'équipe développeur associés à cette campagne.
•	La campagne est immédiatement visible par tous les membres enregistrés.
•	Je peux ajouter ou retirer des membres en cours de campagne.

US-05 — Chef de l'équipe testeur
Objectif	Je veux assigner des tâches de test à chaque membre de mon équipe directement depuis le logiciel.
Raison	Pour éviter les confusions sur qui teste quoi et avoir une vision claire de la répartition de la charge de travail.
Critères d'acceptation :
•	Je peux sélectionner une fonctionnalité ou un module et l'assigner à un membre de mon équipe.
•	Chaque membre voit uniquement les tâches qui lui ont été assignées dans son espace personnel.
•	Une notification est envoyée au membre concerné lors de l'assignation d'une nouvelle tâche.
•	Je peux consulter en temps réel le statut de chaque tâche (en attente, en cours, terminée).
•	Je peux réassigner une tâche à un autre membre si nécessaire.

US-06 — Chef de l'équipe testeur
Objectif	Je veux avoir une vue synthétique de l'avancement de la campagne : fonctionnalités testées, anomalies ouvertes et en attente de validation.
Raison	Pour piloter la campagne efficacement et prendre des décisions rapides en cas de blocage ou de retard.
Critères d'acceptation :
•	Le tableau de bord de campagne affiche en temps réel le nombre de fonctionnalités testées, en attente et en anomalie.
•	Je peux voir la liste complète des anomalies notifiées, le développeur assigné et le statut actuel.
•	Je suis notifié de toutes les anomalies créées par mon équipe, même si elles ont été notifiées directement à un développeur.
•	Je peux filtrer les anomalies par statut, par testeur ou par développeur assigné.

Membre de l'équipe testeur
US-07 — Membre de l'équipe testeur
Objectif	Je veux consulter la liste des tâches de test qui m'ont été assignées par le chef de mon équipe.
Raison	Pour savoir exactement quoi tester, dans quel ordre et avec quelles priorités, sans avoir à demander à chaque fois.
Critères d'acceptation :
•	Mes tâches assignées sont affichées dès ma connexion sur mon tableau de bord personnel.
•	Chaque tâche indique la fonctionnalité ou le module à tester, sa description et sa priorité.
•	Je reçois une notification lorsqu'une nouvelle tâche m'est assignée.
•	Je peux marquer une tâche comme « en cours » pour indiquer que je l'ai prise en charge.

US-08 — Membre de l'équipe testeur
Objectif	Je veux déclarer le statut d'une fonctionnalité après l'avoir testée : conforme ou anomalie détectée.
Raison	Pour tracer formellement le résultat de mon test et déclencher les actions qui s'imposent en cas de problème.
Critères d'acceptation :
•	Je peux sélectionner « Conforme » ou « Anomalie détectée » pour chaque fonctionnalité testée.
•	Si je sélectionne « Conforme », la fonctionnalité est marquée comme validée et ma tâche est clôturée.
•	Si je sélectionne « Anomalie détectée », le logiciel m'impose de saisir une description du problème avant de valider.
•	La date, l'heure et mon identité sont automatiquement enregistrés avec chaque changement de statut.
•	Seul un testeur peut modifier le statut d'une fonctionnalité 
— les développeurs n'ont pas accès à cette action.

US-09 — Membre de l'équipe testeur
Objectif	Je veux notifier directement un membre de l'équipe développeur d'une anomalie, sans passer obligatoirement par le chef de mon équipe.
Raison	Pour accélérer la prise en charge des anomalies et éviter les délais liés à la hiérarchie sur les cas urgents.
Critères d'acceptation :
•	Depuis la fiche anomalie, je peux sélectionner un développeur parmi la liste des membres enregistrés dans la campagne.
•	La notification est envoyée immédiatement avec la description complète de l'anomalie.
•	Le chef de mon équipe est automatiquement informé de cette notification.
•	Je peux notifier un autre développeur si le premier n'a pas pris en charge l'anomalie.
•	L'historique de toutes les notifications est enregistré dans la fiche anomalie.

US-10 — Membre de l'équipe testeur
Objectif	Je veux être notifié lorsqu'un développeur signale qu'une anomalie que j'ai détectée est résolue.
Raison	Pour ne pas manquer les corrections à valider et conclure le cycle de vie de l'anomalie dans les meilleurs délais.
Critères d'acceptation :
•	Je reçois une notification claire lorsqu'un développeur signale la résolution d'une anomalie que j'ai déclarée.
•	La notification inclut la description des correctifs appliqués par le développeur (si renseignée).
•	Je peux accéder directement à la fonctionnalité concernée depuis la notification.
•	Après vérification, je peux mettre à jour le statut : « Conforme » (anomalie validée) ou maintenir « Anomalie » (correction insuffisante).

Membre de l'équipe développeur
US-11 — Membre de l'équipe développeur
Objectif	Je veux consulter la liste des anomalies qui m'ont été notifiées par les testeurs.
Raison	Pour avoir une vision claire et centralisée des problèmes à corriger, sans dépendre des e-mails ou des messageries.
Critères d'acceptation :
•	Depuis mon tableau de bord, je vois toutes les anomalies qui me sont adressées.
•	Chaque anomalie affiche : la fonctionnalité concernée, la description du problème, le testeur auteur et la date.
•	Je peux filtrer les anomalies par statut : nouvelles, en cours, en attente de validation testeur.
•	Je reçois une notification à chaque nouvelle anomalie qui m'est adressée.

US-12 — Membre de l'équipe développeur
Objectif	Je veux signaler aux testeurs qu'une anomalie est corrigée, en décrivant les actions correctives effectuées.
Raison	Pour informer les testeurs que la correction est prête et qu'ils peuvent procéder à la vérification, sans délai.
Critères d'acceptation :
•	Depuis la fiche anomalie, je peux cliquer sur « Signaler la résolution » et saisir une description de la correction.
•	La notification est envoyée automatiquement au testeur ayant déclaré l'anomalie et au chef testeur.
•	Le statut de l'anomalie passe à « Résolution signalée ; en attente de validation testeur ».
•	Je ne peux pas modifier le statut de la fonctionnalité ; cette action reste réservée aux testeurs.
•	Une fois la validation confirmée par le testeur, l'anomalie est visible comme clôturée dans mon historique.

US-13 — Membre de l'équipe développeur
Objectif	Je veux consulter l'historique des anomalies d'une campagne pour identifier les zones du logiciel les plus problématiques.
Raison	Pour améliorer la qualité du code à long terme en analysant les patterns de bugs récurrents.
Critères d'acceptation :
•	Je peux accéder à l'historique complet des anomalies de la campagne à laquelle je suis associé.
•	L'historique indique pour chaque anomalie : la fonctionnalité, la description, les dates et le testeur validant.
•	Je peux filtrer l'historique par fonctionnalité, par statut ou par période.
•	Je ne peux pas modifier les données historiques.

 
9. Règles métier et contraintes

Règle	Description	Portée
RG-01	Seuls les membres de l'équipe testeur peuvent modifier le statut d'une fonctionnalité (Conforme / Anomalie). Les développeurs n'ont accès à aucune action de modification de statut.	Statut fonctionnalité
RG-02	Un testeur peut notifier directement un développeur d'une anomalie sans passer par le chef de l'équipe testeur. Le chef testeur est systématiquement informé en copie.	Gestion anomalies
RG-03	Un développeur peut uniquement signaler la résolution d'une anomalie. Ce signalement ne clôture pas automatiquement l'anomalie ,seule la validation du testeur le fait.	Cycle de vie anomalie
RG-04	Chaque campagne de test est indépendante. Les équipes, tâches et anomalies d'une campagne ne sont pas visibles depuis une autre campagne.	Isolation des données
RG-05	L'historique de chaque action (changement de statut, notification, résolution) est immuable. Il conserve la date, l'heure et l'identité de l'utilisateur ayant effectué l'action.	Traçabilité
RG-06	Un développeur ne peut accéder qu'aux anomalies des campagnes auxquelles il a été rattaché. Il ne voit pas les données des autres projets ni des autres campagnes.	Contrôle d'accès

 
10. Exigences non fonctionnelles
Les exigences non fonctionnelles décrivent le comportement attendu du logiciel au-delà de ses fonctionnalités. Ce sont des critères de qualité technique que le logiciel doit respecter pour être fiable et réellement utilisable au quotidien.
10.1 Performance — La rapidité du logiciel
Un logiciel lent est un logiciel que les utilisateurs abandonnent. Voici les objectifs en termes de temps de réponse :

Exigence	Objectif	Raison
Connexion au logiciel	< 3 secondes	Ne pas bloquer les testeurs en cours de session de test.
Chargement d'une page	< 2 secondes	Garantir une navigation fluide lors des campagnes.
Enregistrement d'un statut	< 1 seconde	Ne pas interrompre le flux de travail des testeurs.
Envoi d'une notification	< 30 secondes	Garantir la réactivité dans la prise en charge des anomalies.
Génération d'un rapport	< 30 secondes	Permettre des exports rapides même sur des campagnes longues.

10.2 Disponibilité et sécurité
•	Le logiciel doit être disponible pendant les heures ouvrées avec un taux de disponibilité d'au moins 99 %.
•	Chaque utilisateur dispose d'un compte sécurisé avec identifiant et mot de passe.
•	Les données de chaque projet et campagne sont isolées : un utilisateur n'accède qu'aux projets et campagnes auxquels il est rattaché.
•	Le compte est verrouillé temporairement après 5 tentatives de connexion échouées.
•	Toutes les actions sensibles (changement de statut, notification d'anomalie, signalement de résolution) sont journalisées.

10.3 Ergonomie et accessibilité
•	L'interface doit être accessible depuis un navigateur web sur ordinateur, tablette et smartphone.
•	La navigation vers une fonctionnalité clé (tâches, déclaration de statut, notification) doit être réalisable en moins de 3 clics.
•	Les notifications doivent être visibles dès la connexion, avec un indicateur de comptage.
•	Les messages d'erreur doivent être clairs et orienter l'utilisateur vers l'action corrective.
•	L'interface doit être disponible en français.

10.4 Maintenabilité et évolutivité
•	Le code source doit être documenté et versionné (Git).
•	L'architecture doit permettre d'ajouter de nouvelles fonctionnalités sans refonte majeure.
•	La solution doit être déployable sur un serveur standard et configurable pour d'autres organisations.

 
11. Perspectives technologiques
Cette section présente les technologies envisagées pour la conception et le développement du logiciel. Ces choix ont été faits en tenant compte de la facilité de maintenance, de la compatibilité avec les environnements de DHI, et de la capacité à faire évoluer le logiciel dans le futur. Les technologies mentionnées restent des orientations à valider avec l'encadrant avant le début du développement.
11.1 L'interface utilisateur — Ce que l'utilisateur voit et utilise
L'interface du logiciel est la partie visible par les utilisateurs : formulaires, tableaux de bord, fiches tâches, fiches anomalies. Elle sera développée avec des technologies web modernes permettant une application fluide et réactive, utilisable sur ordinateur, tablette et smartphone sans installation.
•	Technologies envisagées : React.js ou Vue.js combinés avec Tailwind CSS. Ces outils sont largement utilisés dans l'industrie, bien documentés, et facilitent la reprise du projet par d'autres développeurs.
11.2 Le moteur du logiciel — Ce qui fonctionne en coulisse
La partie back-end traite les données, gère les connexions, envoie les notifications, applique les règles métier (droits de modification des statuts, isolation des campagnes…) et communique avec la base de données.
•	Technologies envisagées : Node.js avec Express.js, ou Python avec Django. Ces technologies permettent de construire des applications robustes, sécurisées et capables de gérer plusieurs utilisateurs simultanément.
11.3 Le stockage des données — La mémoire du logiciel
Toutes les informations du logiciel (projets, campagnes, tâches, statuts, anomalies, historiques, comptes) sont stockées dans une base de données organisée, fiable et interrogeable rapidement.
•	Technologies envisagées : PostgreSQL ou MySQL. Ces bases de données éprouvées et gratuites garantissent l'intégrité des données et facilitent les requêtes complexes comme la génération des rapports de campagne.
11.4 L'hébergement et le déploiement — Où vivra le logiciel ?
Une fois développé, le logiciel sera installé pour être accessible à tous les utilisateurs. Deux options sont envisagées selon les infrastructures de DHI :
•	Hébergement local (on-premise) : le logiciel est installé sur un serveur DHI, à l'intérieur de ses locaux. Contrôle total sur les données.
•	Hébergement cloud (VPS) : le logiciel est déployé sur une plateforme en ligne. Facilite l'accès à distance et l'ouverture vers d'autres entreprises à l'avenir.
Dans les deux cas, Docker pourra être utilisé pour faciliter l'installation et garantir un fonctionnement identique quel que soit l'environnement.
11.5 La sécurité technique
Les mesures de sécurité suivantes seront intégrées dès la conception du logiciel :
•	HTTPS : communications chiffrées entre l'utilisateur et le logiciel (optionnel selon l'infrastructure disponible).
•	JWT (Jeton d'authentification) : chaque utilisateur connecté reçoit un identifiant numérique temporaire prouvant son identité à chaque action.
•	Chiffrement des mots de passe (bcrypt) : les mots de passe ne sont jamais stockés lisibles en base de données.
•	Sauvegardes automatiques : copies de sécurité programmées régulièrement pour prévenir toute perte de données.
11.6 Tableau récapitulatif des technologies

Composant	Technologie envisagée	Rôle dans le logiciel
Interface utilisateur	React.js ou Vue.js + Tailwind CSS	Ce que l'utilisateur voit et utilise au quotidien.
Moteur (back-end)	Node.js / Express.js ou Python / Django	Traitement des données, logique métier, gestion des accès et droits.
Base de données	PostgreSQL ou MySQL	Stockage et organisation de toutes les données du logiciel.
Hébergement	Serveur local ou VPS cloud + Docker	Mise à disposition du logiciel pour les utilisateurs finaux.
Sécurité	HTTPS + JWT + bcrypt	Protection des données, authentification et contrôle des accès.

 
12. Planning prévisionnel
Le projet est prévu sur une durée de 2 mois. Voici le découpage indicatif des grandes phases de travail, de l'analyse des besoins jusqu'à la livraison du logiciel.

Phase	Activités	Résultat attendu	Durée
1	Analyse des besoins, rédaction du cahier des charges, validation avec l'encadrant.	Cahier des charges validé.	Semaines 1 – 2
2	Conception de l'architecture technique, modélisation de la base de données, maquettes des écrans.	Architecture validée, maquettes approuvées.	Semaines 3 – 4
3	Développement des modules 1, 2 et 3 : gestion des projets et campagnes, gestion des équipes, assignation des tâches.	Modules fonctionnels et testés.	Semaines 5 – 6
4	Développement des modules 4, 5 et 6 : suivi des statuts et anomalies, notifications, tableau de bord et rapports. Tests globaux.	Logiciel complet, testé et corrigé.	Semaine 7
5	Déploiement, formation des utilisateurs clés, rédaction de la documentation technique et du guide utilisateur.	Logiciel livré, documenté et opérationnel.	Semaine 8

 
13. Livrables
À l'issue de ce stage, les éléments suivants seront remis à DHI :

N°	Livrable	Description
L-01	Cahier des charges	Le présent document, version finale validée par l'encadrant, servant de référence pour tout le projet.
L-02	Maquettes des écrans	Les maquettes de l'interface utilisateur pour les principaux écrans : tableau de bord, fiches tâches, fiches anomalies, gestion des campagnes.
L-03	Logiciel installé et fonctionnel	Le logiciel de suivi des tests déployé sur l'environnement DHI et opérationnel pour tous les profils d'utilisateurs.
L-04	Guide utilisateur	Un guide simple et illustré destiné aux testeurs, développeurs et chefs d'équipe, décrivant les fonctionnalités principales du logiciel.
L-05	Documentation technique	Un document décrivant l'architecture du logiciel, la structure de la base de données et les choix d'implémentation, pour faciliter les évolutions futures.
L-06	Code source complet	L'intégralité du code source, versionné sur Git, commenté et accompagné d'un fichier README pour l'installation.

 
14. Glossaire

Terme	Définition
Projet	Espace de travail de niveau supérieur regroupant plusieurs campagnes de test liées à un même logiciel ou produit à livrer.
Campagne de test	Cycle de test structuré au sein d'un projet, organisé par fonctionnalités ou par modules, avec des équipes et un périmètre définis.
Fonctionnalité	Unité de test élémentaire. Peut représenter une feature du logiciel (ex. : connexion utilisateur) ou un module fonctionnel entier.
Statut	Résultat du test d'une fonctionnalité. Deux valeurs : « Conforme » ou « Anomalie détectée ». Seuls les testeurs peuvent le modifier.
Anomalie	Problème constaté sur une fonctionnalité lors d'un test. Fait l'objet d'une fiche dédiée et d'un cycle de résolution formel.
Notification	Alerte envoyée par le logiciel à un ou plusieurs utilisateurs pour les informer d'un événement (nouvelle anomalie, résolution signalée…).
Chef testeur	Responsable de l'équipe testeur au sein d'une campagne. Il crée la campagne, enregistre les équipes, assigne les tâches et supervise l'avancement.
Tâche de test	Assignation d'une fonctionnalité ou d'un module à tester à un membre de l'équipe testeur, avec sa description et sa priorité.
Validation testeur	Action par laquelle un testeur confirme (ou infirme) la correction d'une anomalie, en mettant à jour le statut de la fonctionnalité.
Gap Analysis	Analyse des écarts entre la situation actuelle et la situation cible. Permet d'identifier précisément ce qui doit être créé ou amélioré.
Back-end	Partie invisible du logiciel qui traite les données, gère la logique métier, les accès et les communications avec la base de données.
JWT	JSON Web Token — identifiant numérique temporaire attribué à chaque utilisateur connecté pour prouver son identité sans ressaisir son mot de passe.

— Fin du document —




