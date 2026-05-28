# Préparation hébergement (production)

Checklist avant de pointer un nom de domaine ou d’ouvrir le site au public.

## 1. Build local (obligatoire)

```bash
npm run verify:deploy
```

Équivalent : `npm run typecheck` puis `npm run build`. Le build Next exécute maintenant la validation TypeScript (`ignoreBuildErrors: false`).

## 2. Variables d’environnement

- Copier `.env.example` vers les secrets de la plateforme (Vercel, Docker, etc.). Ne jamais committer `.env.local`.
- **Obligatoire** : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **URL publique** : `NEXT_PUBLIC_SITE_URL` = URL finale HTTPS (QR codes, redirections auth). Dans Supabase Auth, ajouter les redirect URLs : `{SITE}/auth/confirm`, `{SITE}/login`.
- **Stripe** (paiement livraison / intents) : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`.
- **Données démo portail** : en production, les blocs fictifs sont **désactivés** par défaut. Pour une démo publique uniquement : `NEXT_PUBLIC_SHOW_PORTAL_DEMO=1`. Voir `lib/config/portal-demo.ts`.
- Désactiver après usage : `ALLOW_SETUP_ADMIN`, `FIRST_ADMIN_SETUP_SECRET` (premier admin).

## 3. Base de données

- Appliquer les migrations documentées (`scripts/README.md`, `npm run db:migrate:env`), y compris **`24-restaurant-tables-qr-admin.sql`** pour les colonnes Tables QR (`table_code`, plan, `is_active`).
- Ne pas laisser les comptes de test seedés en prod sauf besoin explicite (`seed:test-accounts`).

## 4. Déploiement cible

### Vercel (recommandé pour Next.js)

- Projet Node **20+** (voir `engines` dans `package.json`).
- Renseigner toutes les variables ; build : `npm run build`, output par défaut Next.

### Docker (VPS / cloud)

- `output: "standalone"` est activé dans `next.config.mjs`.
- Build image : `docker build -t jannat-app .`
- Run : monter les env (fichier ou secrets), port **3000**.

## 5. Après mise en ligne

- Parcours critiques : login, signup, `/admin` (rôle admin), caisse, commande / réservation.
- Vérifier les logs serveur (erreurs 500, Stripe, Supabase).
- QA complémentaire : `docs/DEMO-FINALE.md`, risques : `docs/REGRESSION-REPORT.md`.
