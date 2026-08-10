import type { KeyboardEvent } from 'react';

/**
 * Rends un élément cliquable (div, span, etc.) accessible au clavier.
 * Simule le comportement natif d'un bouton : Entrée et Espace déclenchent l'action.
 */
export function pressableProps(onClick: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
  };
}

/**
 * Variante pour une ligne cliquable contenant déjà des éléments interactifs
 * (ex. un bouton imbriqué) : ajoute la navigation clavier sans rôle de bouton
 * pour éviter les éléments interactifs imbriqués.
 */
export function keyboardActivateProps(onClick: () => void) {
  return {
    tabIndex: 0,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onClick();
      }
    },
  };
}
