# eServices

Machine d'etat TypeScript pour la gestion des statuts d'un dossier passeport / e-NIF.

## Objectif

Ce projet implemente une logique metier de transitions de statuts pour un dossier.
Il expose une machine d'etat avec des regles explicites sur :

- les statuts autorises
- les transitions possibles
- les roles autorises a effectuer une transition
- les cas necessitant une justification

## Structure du projet

```text
src/
	services/
		dossier/
			dossier-state-machine.ts
			dossier-state-machine.example.ts
tests/
	dossier-state-machine.test.ts
package.json
tsconfig.json
vitest.config.ts
```

Fichiers principaux :

- `src/services/dossier/dossier-state-machine.ts` : implementation de la machine d'etat.
- `src/services/dossier/dossier-state-machine.example.ts` : exemple d'utilisation.
- `tests/dossier-state-machine.test.ts` : tests unitaires Vitest.

## Statuts et roles

### Statuts

- `BROUILLON`
- `EN_COURS`
- `ERREUR`
- `CLOTURE`

### Roles

- `AGENT`
- `SYSTEME`

## Table de transitions

Transitions declarees dans `DOSSIER_TRANSITIONS` :

1. `BROUILLON` -> `EN_COURS` (roles: `AGENT`, `SYSTEME`)
2. `EN_COURS` -> `ERREUR` (roles: `AGENT`, `SYSTEME`)
3. `EN_COURS` -> `CLOTURE` (role: `AGENT`)
4. `ERREUR` -> `EN_COURS` (role: `AGENT`, justification obligatoire)

Regles metier complementaires :

- Toute transition absente de la table est refusee.
- Les transitions depuis `CLOTURE` vers `BROUILLON`, `EN_COURS` ou `ERREUR` sont refusees.
- La sortie de `ERREUR` vers `EN_COURS` exige une justification non vide.

## API exposee

La classe `DossierStateMachine` expose deux methodes :

- `canTransition(input): boolean`
	- Retourne `true` si la transition est autorisee.
	- Retourne `false` sinon.

- `transition(input): DossierStatut`
	- Retourne le statut cible si la transition est valide.
	- Lance une erreur si la transition est interdite.

Une instance prete a l'emploi est exportee :

- `dossierStateMachine`

## Installation

Prerequis :

- Node.js 20+
- npm

Installer les dependances :

```bash
npm install
```

## Connexion Claude

Pour utiliser Claude AI dans ce projet :

1. Verifier l'installation de la CLI :

```bash
claude --version
```

2. Verifier l'etat de connexion :

```bash
claude auth status
```

3. Si non connecte, lancer la connexion :

```bash
claude auth login
```

### Connexion avec les comptes deja presents sur le peripherique

Cette option utilise le navigateur du peripherique. Si vous etes deja connecte a Claude dans ce navigateur, la connexion est generalement immediate.

```bash
npm run claude:auth:device
```

Pour un environnement entreprise (SSO) :

```bash
npm run claude:auth:sso
```

Verification rapide :

```bash
npm run claude:status
```

4. Ouvrir Claude dans le dossier du projet :

```bash
npm run claude:start
```

Note : en environnement conteneurise, la redirection navigateur peut echouer sur localhost.
Dans ce cas, copier le code OAuth affiche dans le navigateur et le coller dans le prompt terminal.

## Tests et verification

Executer les tests :

```bash
npm test
```

Lancer les tests en mode watch :

```bash
npm run test:watch
```

Verifier le typage TypeScript :

```bash
npm run typecheck
```

## Couverture des tests existants

Le fichier `tests/dossier-state-machine.test.ts` couvre :

- transition valide
- transition invalide
- sortie de `ERREUR` sans justification (echec)
- sortie de `ERREUR` par un agent avec justification (succes)
- transition de `CLOTURE` vers `ERREUR` (echec)

## Exemple rapide

Le fichier `src/services/dossier/dossier-state-machine.example.ts` montre une transition `BROUILLON` -> `EN_COURS` par un `AGENT`.

Vous pouvez l'adapter pour vos scenarios metier (workflow dossier passeport / e-NIF).