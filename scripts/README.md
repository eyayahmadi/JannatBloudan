# Scripts SQL — Comment appliquer les migrations

## ✨ Déjà appliqué

- ✅ `APPLY-ALL-NEW.sql` (= 04 + 05) : QR flow, events tickets, AI memory, chatbot, rôles étendus
- ✅ `06-commercial-ready.sql` : staff, invoices, payments, stock, loyalty, reviews, promotions, RLS
- ✅ `08-advanced.sql` : événements privés, finance, RH, AI paper-grade (pgvector, ML registry, AB tests, audit)

## ⚠️ Inscription : « Database error updating user »

Après **`06-commercial-ready`** (sync `auth.users` → `public.users`) + **`08-advanced`** (RLS sur `audit_logs`), le trigger **`audit_users_trg`** peut voir ses `INSERT` dans `audit_logs` **refusés** par la RLS (politiques souvent `SELECT`-only).

1. Dans Supabase → **SQL Editor**, exécute **`scripts/fix-signup-database-error-updating-user.sql`** (met à jour `log_audit_event`, `sync_auth_user_to_public`, `handle_profile_after_email_confirmed` avec `SET row_security = off`, et corrige `enforce_client_role_on_signup` pour les créations avec e-mail déjà confirmé — API admin / seed comptes test).
2. Réessaie l’inscription. Les installs déjà migrées peuvent garder leur `08` et ne lancer **que** ce correctif une fois.

## Comptes de test (un par rôle)

Pour tester chaque espace (CLIENT, ADMIN, SERVEUR, CUISINE, BAR, SHISHA, CAISSE, LIVRAISON) sans créer les comptes à la main dans le dashboard :

1. Vérifie que **`.env.local`** (à la racine du projet Next, dossier `pfe-main`) contient `NEXT_PUBLIC_SUPABASE_URL` et **`SUPABASE_SERVICE_ROLE_KEY`** (clé **service_role**, pas l’anon).
2. Depuis ce même dossier :

```powershell
npm run seed:test-accounts
```

Équivalent : `node --env-file=.env.local scripts/seed-test-accounts.mjs` (Node 20.6+).

3. **E-mails** générés : `client@test.local`, `admin@test.local`, `server@test.local`, etc. (domaine modifiable avec `TEST_EMAIL_DOMAIN`).
4. **Mot de passe** par défaut : `TestAllRoles1!` — surcharge avec `TEST_ACCOUNTS_PASSWORD` (minimum 8 caractères).

Le script est **idempotent** : une seconde exécution met à jour mot de passe et métadonnées. **Réservé au développement**, pas à la production.

## 🎁 NOUVEAU : 09 — Demo Data 30 jours (visuel démo)

Rempli les tables de 08 avec des données **réalistes** pour que tous les dashboards soient **vivants** :

- 📈 30 jours de `daily_metrics` (avec pics week-end)
- 💸 ~60 `expenses` (loyer, salaires, matières premières, marketing, maintenance)
- 🤖 ~300 `agent_executions` (10 agents, succès/erreurs, latence, tokens, coût)
- 🚨 5 `anomalies_detected` (doublon facture, stock mismatch, fraude, etc.)
- 🎯 200 `customer_journey_events` (funnel page_view → order → paid)

**Idempotent** : re-lançable, supprime et ré-insère les données taggées "demo".

### Pour l'appliquer
1. Supabase SQL Editor → New query
2. Copie `scripts/09-demo-data.sql`, Run
3. Notice : `Seed 09 (demo data) applique : daily_metrics 30, expenses ~60, agent_executions ~300...`

## 🧠 Ingestion RAG (embeddings vectoriels)

Script Node qui embed les données clients (commandes, avis, mémoire, événements) dans `client_memory_embeddings` via OpenAI :

```powershell
# Variables requises
$env:SUPABASE_URL="https://<ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
$env:OPENAI_API_KEY="sk-..."

# Lancer (toutes les sources, 100 docs chacune)
node scripts/ingest-embeddings.mjs

# Options
node scripts/ingest-embeddings.mjs --source orders --limit 50
node scripts/ingest-embeddings.mjs --dry-run
```

Le script est **idempotent** (upsert sur `source_type + source_id`). Une fois lancé, teste depuis SQL :

```sql
SELECT * FROM match_client_memory(
  (SELECT embedding FROM client_memory_embeddings LIMIT 1),
  0.7,   -- similarity threshold
  5      -- top-k
);
```

## 🎨 Pages UI ajoutées (branchées sur les nouvelles APIs)

| Route | Fonction | API |
|---|---|---|
| `/admin/finance` | Profit/perte live, graphique journalier, ajout dépense | `/api/expenses/summary`, `/api/expenses` |
| `/admin/events/private` | Demandes d'événements privés, envoi devis, confirmation | `/api/events/private` + `[id]/quotes` |
| `/admin/settings` | Config système (toggle flags, édition JSON) | `/api/settings` |
| `/admin/agents` | **Observability IA** : exécutions, latence, tokens, erreurs | `/api/agents/stats` |

## 🔍 Observability Agents IA

Chaque appel `chatCompletion()` est maintenant **automatiquement loggué** dans `agent_executions` (fire-and-forget, non-bloquant) avec :
- latence (ms)
- tokens utilisés
- coût estimé (USD)
- statut success/error
- trace_id

Helper réutilisable : `withAgentTracking(agentName, fn)` dans `lib/ai/observability.ts`.

## 🔥 NOUVEAU : 08 — Advanced (Niveau 1 + Niveau 2)

Ajoute la couche **commercial ops pro** et **AI paper-grade** :

### Niveau 1 — Commercial ops
| Table | Rôle |
|---|---|
| `event_requests` + `event_packages` + `event_quotes` + `event_assignments` | **Événements privés** (anniversaire, mariage, entreprise) — différent des events publics |
| `expense_categories` + `expenses` + `budgets` | Finance : dépenses (loyer, salaires, taxes…) + budgets prévisionnels |
| `shifts` + `attendance` | RH : planning + pointage du staff |
| `restaurant_settings` | Config clé-valeur (horaires, TVA, devise, flags AI…) |
| `integrations` | Statut des intégrations externes (Stripe, OpenAI, Redis…) |
| `audit_logs` | **Traçabilité complète** — trigger auto sur `invoices`, `payments`, `products`, `users` |

### Niveau 2 — AI paper-grade
| Élément | Rôle |
|---|---|
| `EXTENSION vector` (pgvector) | Activée pour les vrais embeddings |
| `client_memory_embeddings` + `match_client_memory()` RPC | **RAG réelle** (alternative à Pinecone) |
| `model_registry` + `model_versions` | 15 agents pré-enregistrés, versioning |
| `agent_executions` | Log de chaque appel d'agent (latency, tokens, cost) |
| `agent_feedback` | Signaux de récompense pour Reinforcement Learning |
| `ab_tests` + `ab_test_variants` + `ab_test_results` | Experimentation continue |
| `customer_journey_events` | Funnel entrée → commande → paiement → sortie |
| `anomalies_detected` | Log Agent Anomalies (fraude, doublons factures…) |
| `daily_metrics` | Agrégats pré-calculés (dashboards instantanés) |

### Vues ajoutées par 08
- `v_daily_pnl` — **Profit quotidien** (revenus − dépenses)
- `v_agent_stats` — Stats d'utilisation des agents sur 30 jours
- `v_pending_event_requests` — Demandes d'événements privés en attente

### Seeds automatiques
- 10 catégories de dépenses
- 12 settings par défaut (nom, devise, TVA, horaires, flags AI…)
- 6 intégrations en mode `disabled` (à activer plus tard)
- **15 agents ML** enregistrés dans `model_registry` (chatbot, recommandation, pricing, RL…)
- 4 packs événements (Anniversaire, Mariage Prestige, Entreprise, Soirée privée)

### APIs connectées par 08
| Route | Table |
|---|---|
| `POST/GET /api/events/private` | `event_requests` + `event_packages` |
| `GET/PATCH /api/events/private/[id]` | + `event_quotes` + `event_assignments` |
| `POST/GET /api/events/private/[id]/quotes` | `event_quotes` |
| `POST/GET /api/expenses` | `expenses` + `expense_categories` |
| `GET /api/expenses/summary` | `v_daily_pnl` + agrégats |
| `GET/PATCH /api/settings` | `restaurant_settings` (key-value) |

### Pour l'appliquer
1. Supabase SQL Editor → New query
2. Copie `scripts/08-advanced.sql`, Run
3. Résultat attendu : `Migration 08 appliquee avec succes | Tables totales: ~55 | Vues totales: ~8 | Agents ML: 15`

⚠️ **pgvector** : si tu obtiens `extension "vector" is not available`, active-le d'abord via **Database → Extensions → vector → Enable**, puis relance.

## 🎁 Optionnel : 07 — Données de démo

Pour remplir la base avec des ingrédients, promotions et récompenses fidélité visibles immédiatement dans l'UI :

1. SQL Editor → **New query**
2. Colle `scripts/07-demo-seed.sql`, **Run**
3. Notice attendu : `Seed 07: 15 ingredients, 3 promos actives, 4 recompenses fidelite, X liens produit-ingredient`

Cela alimente **`/admin/stock`** (Poulet et Tahini en alerte), **`/admin/promos`**, et le programme fidélité.

## APIs désormais branchées sur Supabase

| API route | Table / vue | Fallback |
|-----------|-------------|----------|
| `POST/GET /api/invoices` | `invoices` + `invoice_items` | mémoire |
| `GET/PATCH /api/invoices/[id]` | `invoices` | mémoire |
| `GET /api/stock/alerts` | `v_low_stock` | mock |
| `POST /api/stock/adjust` | `stock_movements` + `ingredients` | mock |
| `GET /api/pos/daily-summary` | `v_daily_revenue` + `orders` | mock |
| `POST/GET /api/reservations/reminders` | `reservation_reminders` | mock |
| `POST/GET /api/events/tickets` (via store) | `event_tickets` | Redis → mémoire |
| `POST/GET/PATCH /api/table-alerts` | `table_alerts` | localStorage (hook) |
| `POST /api/orders/qr` | `orders` + `order_items` + `table_sessions` | optimistic local |

> Chaque route teste `hasServerSupabaseEnv()` avant d'appeler Supabase. Si `NEXT_PUBLIC_SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` manquent, elle continue en mode mock. Le front-end reste fonctionnel en toutes circonstances.

## 🚀 À appliquer : 06 — Commercial-Ready

Cette migration complète le schéma pour un **usage commercial en production** (facturation, paiements Stripe, stock, loyalty, reviews, promotions, RLS…).

1. Ouvre [Supabase Dashboard](https://app.supabase.com) → **SQL Editor** → **New query**
2. Ouvre `scripts/06-commercial-ready.sql`, copie **tout**, colle, **Run**
3. Tu verras en bas : `Migration 06 appliquee avec succes | total_tables: ~25 | total_views: ~5`

### Ce que 06 ajoute

| Table | Rôle |
|-------|------|
| `staff` | Table RH alignée avec `/api/admin/staff` (colonnes `position`, `hire_date`, `status`, KPI) |
| `invoices` + `invoice_items` | Facturation officielle (TVA 19%, PDF, statuts draft/validated/paid/cancelled) |
| `payments` | Paiements unifiés (Stripe `pi_*`, cash, wallet, carte), statuts, remboursements |
| `ingredients` | Stock matières premières avec seuils low/critical |
| `stock_movements` | Mouvements entrées/sorties/ajustements/pertes |
| `product_ingredients` | Recette = produit ↔ ingrédients (pour le calcul auto de stock) |
| `reorder_requests` | Propositions de réapprovisionnement (Agent Stock) |
| `notifications` | Système (order_new, payment_received, stock_alert…) |
| `loyalty_accounts` + `loyalty_transactions` + `loyalty_rewards` | Programme fidélité (Agent Loyalty) |
| `reviews` | Avis clients (ratings service/food/speed/cleanliness + sentiment IA) |
| `promotions` + `coupons` | Offres marketing (Agent Marketing / Pricing) |
| `reservation_reminders` | Log des SMS/email de rappel de réservation |

### Fonctions & triggers

- **Synchro `auth.users` → `public.users`** : quand un user s'inscrit via Supabase Auth, il est automatiquement copié dans `public.users` (plus besoin d'écrire à la main)
- Triggers `updated_at` auto sur toutes les tables

### Vues

- `v_daily_revenue` — CA du jour par méthode de paiement
- `v_low_stock` — ingrédients en alerte
- `v_top_products` — classement des plats

### RLS (Row Level Security) activée sur 11 tables sensibles

- Un **client** ne voit que ses propres factures, notifications, loyalty, memory, chat, tickets
- Les **reviews** publiées sont publiques en lecture
- Le **staff/admin** (via JWT claim `role`) voit tout
- Le **service_role** (API server-side) bypasse tout automatiquement

## ⚙️ Méthode script Node (optionnelle)

Si tu préfères la ligne de commande :

```powershell
# 1. Installe pg (local, non commité)
npm install --no-save pg

# 2. Recupere la DATABASE_URL depuis Supabase :
#    Project Settings > Database > Connection string (URI)
$env:DATABASE_URL="postgres://postgres:<PASSWORD>@db.<REF>.supabase.co:5432/postgres"

# 3. Lance
node scripts/run-migrations.mjs
```

Le script applique **l'ordre canonique** défini dans `run-migrations.mjs` (01 → 23, puis `APPLY-ROLE-HARDENING.sql` et `fix-signup-database-error-updating-user.sql`), puis affiche un résumé.

## 📋 Ordre complet des scripts

Si tu pars de zéro (nouvelle base), tu dois exécuter dans cet ordre :

| # | Fichier | Rôle | À relancer ? |
|---|---------|------|--------------|
| 1 | `01-create-database-schema.sql`    | Schéma de base (produits, users, orders, reservations…) | idempotent ✅ |
| 2 | `02-seed-initial-data.sql`         | Données de démo (catégories, plats, events…) | une seule fois |
| 3 | `03-create-rpc-functions.sql`      | Fonctions RPC / triggers métier | idempotent ✅ |
| 4 | `04-qr-flow-and-ai-schema.sql`     | **NOUVEAU** — tables QR, alertes, event tickets, AI memory, chat sessions, analytics | idempotent ✅ |
| 5 | `05-roles-and-auth-alignment.sql`  | Aligne `user_roles` + colonne `users.role` + table `staff_profiles` | idempotent ✅ |
| 6 | `06-commercial-ready.sql`          | **COMMERCIAL** — staff, invoices, payments, stock, loyalty, reviews, promotions, RLS, auth sync | idempotent ✅ |
| 7 | `07-demo-seed.sql`                 | **OPTIONNEL** — seed ingrédients, promotions, récompenses fidélité, liens produit-ingrédient | idempotent ✅ |
| 8 | `08-advanced.sql`                  | **NIVEAU PRO** — événements privés, finance, RH, AI paper-grade (pgvector, ML registry, AB tests, audit) | idempotent ✅ |
| 9 | `09-demo-data.sql`                 | **OPTIONNEL** — métriques / agents / funnel démo (30 jours) | idempotent ✅ |
| 10 | `10-stations.sql`                 | Stations cuisine / bar / chicha (`order_items`, files KDS) | idempotent ✅ |
| 11 | `11-delivery-tracking.sql`        | Livraisons, chauffeurs, carte | idempotent ✅ |
| 12 | `12-supplier-invoices.sql`        | Factures fournisseurs | idempotent ✅ |
| 13a | `13-cash-register-movements.sql` | Mouvements de caisse | idempotent ✅ |
| 13b | `13-digital-menu-and-stock.sql`  | Menu digital, colonnes produits / stock recette | idempotent ✅ |
| 14 | `14-caisse-intelligence-complete.sql` | Caisse (intelligence) | idempotent ✅ |
| 15 | `15-caisse-complete.sql`          | Caisse complète | idempotent ✅ |
| 16 | `16-translation-cache.sql`        | Cache traductions | idempotent ✅ |
| 17 | `17-sortie-caisse-trace.sql`      | Traçabilité sorties caisse | idempotent ✅ |
| 18 | `18-advanced-table-pos.sql`       | Tables / POS avancé | idempotent ✅ |
| 19 | `19-private-events-calendar.sql`  | Calendrier événements privés | idempotent ✅ |
| 20a | `20-events-professional.sql`    | Événements publics (tarifs, attente, liste d’attente) | idempotent ✅ |
| 20b | `20-menu-product-images-storage.sql` | Bucket Storage `menu-product-images` + RLS | idempotent ✅ |
| 21a | `21-audit-products-api-actor.sql` | Audit API produits / acteur | idempotent ✅ |
| 21b | `21-promotions-module.sql`       | Module promos (extensions) | idempotent ✅ |
| 22 | `22-categories-menu-columns.sql`  | Colonnes menu / catégories | idempotent ✅ |
| 23 | `23-client-profiles-confirm.sql` | **Auth client** — table `profiles` + trigger après `email_confirmed_at` (Supabase) | idempotent ✅ |
| 24 | `24-restaurant-tables-qr-admin.sql` | **Tables QR admin** — `table_code`, `display_name`, `plan_zone`, positions plan, `is_active` | idempotent ✅ |
| — | `APPLY-ROLE-HARDENING.sql`         | Force rôle CLIENT à l’inscription publique (sécurité) | idempotent ✅ |
| — | `fix-signup-database-error-updating-user.sql` | Corrige triggers audit / sync users / signup (après 06+08+RLS) | idempotent ✅ |
| ⚙ | `create_admin.sql`                 | Création d'un compte admin | à exécuter ponctuellement |

**En une commande (tout le tableau ci-dessus sauf `create_admin`)** : définis `DATABASE_URL` (URI Postgres Supabase), installe `pg` si besoin, puis `npm run db:migrate` ou `npm run db:migrate:env` si `DATABASE_URL` est dans `.env.local`. Voir `scripts/run-migrations.mjs`.

> Ne pas enchaîner `APPLY-TODAY.sql` **et** `10` + `11` : le premier regroupe déjà stations + livraison (doublon). Même logique pour `APPLY-ALL-NEW.sql` vs `04` + `05`.

## Que contient la migration 04 ?

| Table | Objet |
|-------|-------|
| `restaurant_tables`  | Identité des tables (numéro, zone, QR token, **statut canonique** : FREE / OCCUPIED / ORDERING / IN_KITCHEN / READY / SERVED / PAYMENT_REQUESTED / PAID / CALL_SERVER). Seed automatique de 20 tables. |
| `table_sessions`     | Une session = un client assis, plusieurs commandes possibles, total & paiement. |
| `table_alerts`       | `call_server`, `request_bill`, `payment_done`, `help`. Utilisé par le serveur + caisse. |
| `event_tickets`      | Participations aux événements publics (buffet, karaoké, soirée) avec QR + statut check-in. |
| `client_memory`      | Agent Memory : `taste_vector`, `order_summaries`, `reactions`, `chunks` RAG. |
| `chat_sessions`      | Historique des conversations chatbot (multi-turn). |
| `product_analytics`  | Menu Engineering (star / cash cow / puzzle / dog). |
| `agent_decisions`    | Log des décisions autonomes (Pricing, Upsell, Stock, Marketing…). |

Extensions ajoutées à `orders` :
- `table_id`, `table_number`, `session_id`, `source` (qr_self_service / server / pos / delivery)

Vue pratique : `v_tables_to_cashout` — ce que montre `/pos/tables`.

## Que contient la migration 05 ?

### Rôles alignés sur l'application

| `user_roles.name` | `auth_level` (JWT) | Usage app |
|---|---|---|
| `client`     | `CUSTOMER` | Commandes, réservations, QR |
| `serveur`    | `STAFF`    | `/server`, `/server/[tableId]` |
| `cuisinier`  | `STAFF`    | `/kitchen` (KDS) — **ajouté** |
| `caissier`   | `STAFF`    | `/pos`, `/pos/tables` |
| `livreur`    | `STAFF`    | Suivi livraisons — **ajouté** |
| `manager`    | `ADMIN`    | Gestion RH, finance — **ajouté** |
| `admin`      | `ADMIN`    | Accès total |

### Colonnes ajoutées

- `user_roles.auth_level` (`CUSTOMER` / `STAFF` / `ADMIN`) — lien direct avec le JWT Supabase
- `user_roles.description` — texte lisible
- `users.role` — miroir auth (synchronisé par trigger depuis `role_id`)

### Tables ajoutées

- `staff_profiles` — données RH (job_role, hire_date, rating, hourly_rate…) utilisées par `/admin/staff` et `/admin/hr`

### Vue

- `v_users_with_role` — jointure pratique users + job_role + auth_role

## Est-ce obligatoire ?

**Non.** Toute l'application **fonctionne déjà sans cette migration** :
- Les alertes table passent par `localStorage` (synchro inter-onglets via `storage` events)
- Les commandes realtime passent par le hook `useRealtimeOrders`
- Les tickets d'événements sont stockés en **Redis** (si `REDIS_URL` configuré) ou en mémoire
- La mémoire agent est en **Redis** ou mémoire
- L'historique chat est en **Redis** ou mémoire

La migration 04 rend tout ça **persistant** et **multi-serveur** (prod, scale-out, logs).

## Lancer en local

```bash
# Option A — Supabase hosted : ouvre le SQL Editor et colle chaque fichier dans l'ordre.

# Option B — Postgres local via Docker :
docker compose -f compose.local.yaml up -d   # lance Redis (optionnel)
psql "$DATABASE_URL" -f scripts/01-create-database-schema.sql
psql "$DATABASE_URL" -f scripts/02-seed-initial-data.sql
psql "$DATABASE_URL" -f scripts/03-create-rpc-functions.sql
psql "$DATABASE_URL" -f scripts/04-qr-flow-and-ai-schema.sql
```

## Après la migration

- Vérifie `NEXT_PUBLIC_SITE_URL` dans `.env.local` — c'est ce qui est encodé dans les QR codes (`/admin/qr`).
- Redémarre le serveur Next.js.
- Tout reste rétro-compatible : les écrans qui ne lisent pas encore la base continueront d'utiliser le fallback temps réel côté client.
