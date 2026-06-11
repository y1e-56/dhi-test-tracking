# Intégration IA - Guide d'utilisation

## Vue d'ensemble

Ce projet intègre désormais une IA pour assister les testeurs lors de la création d'anomalies. Deux fonctionnalités principales ont été ajoutées :

### Fonctionnalité A : Suggestion automatique de priorité
L'IA analyse automatiquement le titre et la description de l'anomalie pour suggérer une priorité appropriée (critique, haute, moyenne, basse).

### Fonctionnalité B : Suggestion du développeur à assigner
L'IA suggère le développeur le plus approprié basé sur l'historique des résolutions d'anomalies similaires.

## Emplacement du code

### Service IA
- **Fichier** : `src/app/services/aiService.ts`
- **Fonctions** :
  - `suggerePriorite(titre, description)` : Analyse le texte et retourne une priorité suggérée
  - `suggereDeveloppeur(anomalie, anomaliesExistantes, developpeurs)` : Analyse l'historique et suggère un développeur

### Intégration dans l'interface
- **Fichier** : `src/app/pages/TesteurTachesPage.tsx`
- **Modifications** :
  - Ajout des imports du service IA
  - Ajout des états pour les suggestions IA
  - Effets `useEffect` pour déclencher les suggestions en temps réel
  - Boutons d'acceptation des suggestions dans le formulaire de création d'anomalie

## Fonctionnement

### Suggestion de priorité

L'IA utilise une analyse de mots-clés pour déterminer la priorité :

- **Critique** : crash, plantage, sécurité, perte de données, authentification, etc.
- **Haute** : bug, erreur, performance, interface utilisateur, etc.
- **Moyenne** : amélioration, optimisation, refactor, design, etc.
- **Basse** : optionnel, cosmétique, détail, futur, etc.

### Suggestion de développeur

L'IA utilise plusieurs approches :

1. **Analyse de similarité** : Compare les mots-clés de la nouvelle anomalie avec les anomalies résolues
2. **Historique de résolution** : Identifie quel développeur résout le plus ce type d'anomalies
3. **Index de Jaccard** : Calcule la similarité entre les descriptions d'anomalies

## Utilisation

1. Connectez-vous en tant que **testeur**
2. Accédez à la page "Mes tâches de test"
3. Cliquez sur le bouton "Anomalie" pour une fonctionnalité
4. Remplissez le titre et la description de l'anomalie
5. Les suggestions IA apparaissent automatiquement sous les champs :
   - **Priorité** : Bouton "IA suggère : [priorité]" avec icône Sparkles
   - **Développeur** : Bouton "IA suggère : [nom développeur]" avec icône UserCheck
6. Cliquez sur les boutons de suggestion pour accepter les recommandations
7. Validez la création de l'anomalie

## Interface utilisateur

Les suggestions IA sont affichées avec :
- **Icône Sparkles** (✨) pour les suggestions de priorité
- **Icône UserCheck** (👤) pour les suggestions de développeur
- **Couleur violette** pour distinguer les suggestions IA
- **Boutons cliquables** pour accepter rapidement les suggestions

## Personnalisation

### Ajouter de nouveaux mots-clés

Pour ajouter de nouveaux mots-clés pour la classification de priorité, modifiez le fichier `src/app/services/aiService.ts` :

```typescript
const PRIORITE_KEYWORDS = {
  critique: [
    // Ajoutez vos mots-clés ici
    'nouveau_mot_clé',
    // ...
  ],
  // ...
};
```

### Ajuster l'algorithme de suggestion de développeur

Vous pouvez modifier les fonctions dans `aiService.ts` pour :
- Changer la méthode de calcul de similarité
- Ajuster les poids des différents facteurs
- Ajouter des critères supplémentaires (module, projet, etc.)

## Notes techniques

- Les suggestions sont calculées en temps réel lors de la saisie
- Aucune API externe n'est requise (tout est côté client)
- L'algorithme s'améliore avec le temps à mesure que plus d'anomalies sont résolues
- Les suggestions sont purement indicatives et peuvent être ignorées par l'utilisateur

## Améliorations futures

Possibles évolutions de l'intégration IA :

1. **Intégration d'une API d'IA réelle** (OpenAI, Claude, etc.) pour des suggestions plus précises
2. **Apprentissage automatique** : Entraînement d'un modèle sur l'historique du projet
3. **Classification multi-labels** : Suggérer des tags/catégories en plus de la priorité
4. **Suggestions de solutions** : Proposer des solutions potentielles basées sur l'historique
5. **Dashboard IA** : Interface pour visualiser les statistiques et performances de l'IA
