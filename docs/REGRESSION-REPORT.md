# Rapport de régression pré-déploiement — Jannat Bloudan (PFE)

**Date :** 2026-05-07  
**Périmètre :** revue statique du dépôt + `npm run build` + `npm run typecheck`.  
**Limite :** aucun test navigateur automatisé (Playwright/Cypress) ni parcours manuel complet des 170+ routes dans cet environnement.

---

## 1. Rôles et redirections

### Ce qui est vérifié (code)

| Rôle | Cible après login (`dashboardPathForRole`) | Route app existante |
|------|------------------------------------------|---------------------|
| ADMIN | `/admin` | Oui (`app/admin/page.tsx`, sous-routes) |
| CLIENT | `/account` | Oui |
| SERVER | `/server/tables` | Oui (`/server` → redirect, `/server/tables`, `/server/[tableId]`) |
| KITCHEN | `/kitchen/orders` | Oui |
| BAR | `/bar/orders` | Oui |
| SHISHA | `/shisha/orders` | Oui |
| CASHIER | `/caisse` | Oui (`/caisse`, `/cashier/dashboard` existe en plus) |
| DELIVERY | `/delivery/dashboard` | Oui (`/driver` existe en parallèle) |

- **Login / signup** (`app/login/page.tsx`, `app/signup/page.tsx`) : redirection via `dashboardPathForRole(normalizeRole(loggedRole))`, avec respect optionnel de `?next=` si chemin absolu.
- **Signup public** : `role: "CLIENT"` fixé dans `signup/page.tsx` et branche register du login — aligné avec la règle « signup = CLIENT seulement » (renfort DB : `APPLY-ROLE-HARDENING.sql` / triggers).
- **Layout admin** (`app/admin/layout.tsx`) : `RequireAuth roles={["ADMIN"]}` — seul le rôle **ADMIN** entre dans l’ERP ; les autres rôles sont renvoyés vers **`/403`** (ou login).
- **Sous-pages admin** : plusieurs écrans gardent encore `RequireAuth` redondant ; l’accès effectif est **bloqué au layout** pour les non-admins.
- **Lien retour « Admin »** : `SiteHeader` + `getStaffPortalBackNav` évitent d’envoyer les non-admins vers `/admin` (403).

### Écarts / risques

- **`/account`** : pas de `RequireAuth` sur `app/account/page.tsx` — la page fonctionne en mode **« Invité »** (profil vide) si non connecté. À trancher produit : forcer `/login?next=/account` pour l’espace client uniquement.
- **Paramètre `?next=`** : un utilisateur pourrait demander `/admin/...` après login ; le layout admin finit par **403** si le rôle ne convient pas — OK, mais UX à valider (message, lien retour).
- **Pas de `middleware.ts`** : la protection repose sur les **composants client** `RequireAuth` et les **API** — cohérent pour une app largement client-side, mais une requête directe d’URL peut afficher brièvement un shell avant redirection.

### Statut section 1

**Partiellement validé (code).** À compléter par tests manuels par rôle (comptes seed : `npm run seed:test-accounts`).

---

## 2. UI/UX (boutons, formulaires, responsive, thème, langue, RTL)

### Vérifié statiquement

- **Thème** : `ThemeToggle`, `next-themes`.
- **Langue** : `I18nProvider` met `document.documentElement.lang` et **`dir`** (RTL pour `ar` via `LOCALE_META`).
- **Traduction runtime** : `MachineTranslateProvider` + `POST /api/translate-page` (DeepL / Google selon env).

### Non vérifié dans ce rapport

- Parcours clic par clic, vrais mobiles/tablettes, tous les modales/dropdowns.

### Statut section 2

**Non couvert** — exiger une **checklist QA manuelle** ou une suite E2E avant mise en prod.

---

## 3. Régression fonctionnelle (features)

| Domaine | Observation rapide |
|---------|---------------------|
| Login / signup / confirmation | Flux Supabase dans `AuthContext`, pages dédiées, erreurs mappées. |
| Portail client | Riche UI ; **données démo** mélangées au live (voir §4). |
| Admin | Nombreuses routes sous `/admin` + APIs `/api/admin/*`. |
| Menu / QR / table | Routes `/table/[tableId]/*`, `/api/orders/qr`, `/api/qr`. |
| Stations | `/kitchen`, `/bar`, `/shisha`, APIs `/api/stations/*`. |
| Caisse | `/caisse`, nombreuses APIs `/api/caisse/*` (paiement, transfert table, offres, etc.). |
| Réservations / événements | Pages + `/api/events/*`, `/api/reservations/*`. |
| Stock | `/api/stock/*`, admin inventory. |
| OCR factures | Config `env-providers` + routes admin factures. |
| Rapports / audit | `/admin/reports`, `/admin/audit-log`, APIs associées. |
| Traduction | `/api/translate-page`, `/api/i18n/translate`, cache SQL optionnel. |
| Avis / Maps | `GOOGLE_MAPS_*`, embed homepage si env. |

**Mode dégradé** : nombreuses routes API retombent sur **mémoire / mock** si Supabase ou autre env manque (`hasServerSupabaseEnv`, etc.) — **normal en dev**, à **désactiver ou surveiller** en prod.

### Statut section 3

**Architecture présente** ; **validation métier end-to-end non exécutée** ici.

---

## 4. Cohérence design & données

### Points relevés dans le code

- **`components/account/client-portal-panels.tsx`** : jeux `DEMO_*` — affichés **seulement** si `isPortalDemoEnabled()` (dev par défaut, ou `NEXT_PUBLIC_SHOW_PORTAL_DEMO=1`).
- **`PortalNotificationsPanel.tsx`** : notifications **demo** concaténées au flux réel.
- **`AccountDashboardOverview.tsx`** : références type `EVT-DEMO-ORIENT-01`.
- **`app/delivery/page.tsx`**, **`app/api/ai/kitchen/route.ts`**, etc. : commentaires / mocks.

### Recommandation avant prod

- Flag : `NEXT_PUBLIC_SHOW_PORTAL_DEMO` / `NEXT_PUBLIC_SHOW_DEMO` (voir `lib/config/portal-demo.ts`).

### Statut section 4

**Risque affichage « fake »** — à traiter si l’exigence est « aucune donnée démo visible ».

---

## 5. Sécurité & production

| Contrôle | Résultat |
|----------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` dans composants `.tsx` | **Non trouvé** (usage réservé serveur : `lib/auth/admin-api`, routes API). |
| Build production | **`npm run build` : succès** (Next 16, Turbopack). |
| TypeScript | **`npm run typecheck` : succès** (`tsc --noEmit`). |
| Build + types | **`typescript.ignoreBuildErrors: false`** — le build exécute la validation TypeScript. |
| Secrets front | Variables `NEXT_PUBLIC_*` attendues ; ne jamais y mettre la service role ni clés DeepL brutes. |
| Doc env | `.env.local` commenté, `scripts/README.md` pour DB / seeds. |

### Statut section 5

**Partiellement sain** — `ignoreBuildErrors` est désactivé ; compléter par revue secrets et QA manuelle.

---

## 6. Synthèse

### Passé (dans le cadre de cet audit)

- Build Next.js production **OK**.
- Typecheck **OK**.
- Cartographie rôles ↔ URLs **cohérente** avec le code ; garde-fous **CLIENT vs admin** via `RequireAuth`.
- Signup **CLIENT** explicite ; staff via **admin** (API + métadonnées).
- RTL **ar** géré au niveau document.
- Pas d’import évident de **service role** côté client.

### Échoué / non testé

- **Toute l’UI** (responsive, chaque formulaire, chaque table).
- **Tous les flux métier** (paiement réel Stripe, e-mail, impression, etc.).
- **Comportement invité sur `/account`**.
- **Données démo** : le build production les masque par défaut ; rester vigilant si `NEXT_PUBLIC_SHOW_PORTAL_DEMO=1` est défini.

### Risques résiduels (priorisés)

1. **Données démo** : désactivées en build prod par défaut (`isPortalDemoEnabled`) ; ne pas laisser `NEXT_PUBLIC_SHOW_PORTAL_DEMO=1` sur un site réel par erreur.
2. **`/account` sans auth obligatoire**.
3. **Pas de middleware** centralisé — dépendance aux garde-fous par page.
4. **APIs en mode mock** si variables d’environnement incomplètes en prod.

### Correctifs recommandés avant hébergement

1. Suivre **`docs/HEBERGEMENT.md`** (build, env, Supabase, Stripe, migrations).
2. Décider du comportement **`/account`** (redirection login si route « privée »).
3. Checklist manuelle **par rôle** (ou E2E) : login → URL d’accueil → 403 sur routes interdites.
4. Vérifier **toutes** les variables d’environnement sur l’hébergeur (Supabase, Stripe, traduction, maps, etc.).
5. Surveiller les logs serveur sur les **parcours critiques** (commande, paiement, inscription).

---

*Généré par audit statique + commandes locales ; à compléter par QA humaine et tests d’intégration.*
