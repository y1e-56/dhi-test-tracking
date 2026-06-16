# Diagrammes UML — DHI Test Tracking

Diagrammes en **PlantUML**. Pour les visualiser :

- VS Code : extension *PlantUML* (jebbs.plantuml) → `Alt+D`
- En ligne : copier le contenu sur https://www.plantuml.com/plantuml/uml/
- CLI : `plantuml *.puml` (génère des PNG/SVG)

## Fichiers

| Fichier | Diagramme |
|---|---|
| `use-case.puml` | Cas d'utilisation (acteurs : Admin, Chef de test, Testeur, Développeur) |
| `sequence-login.puml` | Séquence — Authentification |
| `sequence-anomaly.puml` | Séquence — Cycle de vie d'une anomalie |
| `package.puml` | Diagramme de packages (architecture en couches) |

## Acteurs

- **Administrateur** — gestion globale, supervision
- **Chef de test (test_lead)** — projets, campagnes, équipes, assignation
- **Testeur** — exécute les tests, déclare les anomalies, valide les corrections
- **Développeur** — corrige les anomalies, signale la résolution

## Modules métier

1. Authentification & utilisateurs
2. Projets
3. Campagnes de test
4. Équipes (membres de campagne)
5. Tâches & fonctionnalités
6. Anomalies & notifications
7. Tableau de bord & rapports
