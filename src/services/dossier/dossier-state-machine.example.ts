import { dossierStateMachine } from './dossier-state-machine';

const resultat = dossierStateMachine.transition({
  from: 'BROUILLON',
  to: 'EN_COURS',
  actor: { role: 'AGENT', identifiant: 'agent-001' }
});

console.log({ resultat });