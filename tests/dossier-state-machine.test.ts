import { describe, expect, it } from 'vitest';
import { dossierStateMachine } from '../src/services/dossier/dossier-state-machine';

describe('DossierStateMachine', () => {
  it('accepte une transition valide', () => {
    expect(
      dossierStateMachine.transition({
        from: 'BROUILLON',
        to: 'EN_COURS',
        actor: { role: 'AGENT' }
      })
    ).toBe('EN_COURS');
  });

  it('refuse une transition invalide', () => {
    expect(
      dossierStateMachine.canTransition({
        from: 'BROUILLON',
        to: 'CLOTURE',
        actor: { role: 'AGENT' }
      })
    ).toBe(false);
  });

  it('échoue pour une sortie d ERREUR sans justification', () => {
    expect(() =>
      dossierStateMachine.transition({
        from: 'ERREUR',
        to: 'EN_COURS',
        actor: { role: 'AGENT' },
        justification: '   '
      })
    ).toThrow('Transition interdite');
  });

  it('réussit pour une sortie d ERREUR par un agent avec justification', () => {
    expect(
      dossierStateMachine.transition({
        from: 'ERREUR',
        to: 'EN_COURS',
        actor: { role: 'AGENT' },
        justification: 'Correction du dossier après contrôle'
      })
    ).toBe('EN_COURS');
  });

  it('échoue pour une transition de CLOTURE vers ERREUR', () => {
    expect(
      dossierStateMachine.canTransition({
        from: 'CLOTURE',
        to: 'ERREUR',
        actor: { role: 'AGENT' }
      })
    ).toBe(false);
  });
});