export type DossierStatut = 'BROUILLON' | 'EN_COURS' | 'ERREUR' | 'CLOTURE';

export type DossierActorRole = 'AGENT' | 'SYSTEME';

export interface DossierTransitionActor {
  role: DossierActorRole;
  identifiant?: string;
}

export interface DossierTransitionInput {
  from: DossierStatut;
  to: DossierStatut;
  actor: DossierTransitionActor;
  justification?: string;
}

export interface DossierTransitionDefinition {
  from: DossierStatut;
  to: DossierStatut;
  actorRoles: DossierActorRole[];
  requiresJustification?: boolean;
}

export const DOSSIER_TRANSITIONS: readonly DossierTransitionDefinition[] = [
  {
    from: 'BROUILLON',
    to: 'EN_COURS',
    actorRoles: ['AGENT', 'SYSTEME']
  },
  {
    from: 'EN_COURS',
    to: 'ERREUR',
    actorRoles: ['AGENT', 'SYSTEME']
  },
  {
    from: 'EN_COURS',
    to: 'CLOTURE',
    actorRoles: ['AGENT']
  },
  {
    from: 'ERREUR',
    to: 'EN_COURS',
    actorRoles: ['AGENT'],
    requiresJustification: true
  }
] as const;

const CLOTURE_TRANSITIONS = new Set(['BROUILLON', 'EN_COURS', 'ERREUR']);

export class DossierStateMachine {
  canTransition(input: DossierTransitionInput): boolean {
    const definition = DOSSIER_TRANSITIONS.find(
      (transition) => transition.from === input.from && transition.to === input.to
    );

    if (!definition) {
      return false;
    }

    if (!definition.actorRoles.includes(input.actor.role)) {
      return false;
    }

    if (input.from === 'CLOTURE' && CLOTURE_TRANSITIONS.has(input.to)) {
      return false;
    }

    if (definition.requiresJustification) {
      return Boolean(input.justification?.trim());
    }

    return true;
  }

  transition(input: DossierTransitionInput): DossierStatut {
    if (!this.canTransition(input)) {
      throw new Error(
        `Transition interdite de ${input.from} vers ${input.to} pour un acteur ${input.actor.role}`
      );
    }

    return input.to;
  }
}

export const dossierStateMachine = new DossierStateMachine();