# Parcours fonctionnel PFE — Jannat Bloudan (Next.js + Supabase)

Document de référence pour la **démonstration** et le **rapport** : ce qui est **dans le codebase** `pfe-main/`, par niveau de maturité.

**Légende**

- **Implémenté** : pages et/ou API utilisables (soumis à config Supabase, migrations `scripts/`, variables d’environnement).
- **Partiel** : UI seule, données de démo, ou chaîne incomplète sans intégration externe configurée.

---

## 1. MVP démo PFE

*Fonctionnalités suffisantes pour une présentation propre (boucle métier visible).*

| Fonctionnalité | Statut | Emplacements principaux |
|----------------|--------|-------------------------|
| Homepage premium | Implémenté | `app/page.tsx`, i18n `lib/i18n/messages/*` |
| Menu dynamique | Implémenté | `app/menu/page.tsx`, `GET /api/menu`, admin `app/admin/menu/` |
| QR table ordering | Implémenté | `app/table/[tableId]/menu/page.tsx`, `POST /api/orders/qr`, suivi `app/table/.../order/page.tsx`, `GET /api/orders/[id]` |
| Stations cuisine / bar / chicha | Implémenté | `app/kitchen/`, `app/bar/`, `app/shisha/`, APIs `app/api/stations/*` |
| Serveur | Implémenté | `app/server/`, `app/server/[tableId]/page.tsx` |
| Caisse simple (POS) | Implémenté | `app/pos/`, `app/cashier/dashboard/` |
| Admin menu / stock | Implémenté | `app/admin/menu/`, `app/admin/inventory/`, APIs `app/api/admin/*`, `app/api/stock/*` |
| Authentification + rôles | Implémenté | `app/login/`, `components/auth/RequireAuth.tsx`, `lib/auth/roles.ts`, redirections dashboards |

**Scénario de démo conseillé (MVP)**  
Accueil → menu client → commande depuis une table QR → affichage file cuisine/bar/chicha → vue serveur → encaissement POS → retour admin (produit ou stock). Prévoir **un compte par rôle** (admin, serveur, cuisine…).

---

## 2. Version avancée

*Forte valeur métier ; utile après le MVP mais pas indispensable pour une première passe jury.*

| Fonctionnalité | Statut | Emplacements principaux |
|----------------|--------|-------------------------|
| Caisse intelligente | Implémenté | `app/caisse/page.tsx`, `app/api/caisse/*` (factures, paiement, sessions, clôture, exports, dashboard…) |
| Split payment | Implémenté | `app/api/caisse/batch-pay/route.ts` |
| Transfert de table | Implémenté | `app/api/caisse/transfer-table/route.ts` |
| Hospitality / offres | Implémenté | `invoice-hospitality`, `invoice-apply-offer`, `app/api/admin/promotional-offers/route.ts` |
| OCR factures fournisseur + validation | Partiel | `app/admin/supplier-invoices/`, upload/validation `app/api/admin/supplier-invoices/*` — vérifier le pipeline OCR réel selon environnement |
| Stock intelligent | Partiel | `app/api/stock/adjust`, `alerts`, couche IA `app/api/ai/stock/route.ts` |
| Avances employés | Implémenté | `app/api/caisse/employee-advance/route.ts`, mouvements `app/api/staff/cash-register-movements/route.ts` |
| Suivi livraison | Implémenté | `app/delivery/track/`, `app/driver/`, `app/api/deliveries/*` |
| Événements | Implémenté | `app/events/`, `app/admin/events/`, `app/api/events/*`, billets, événements privés |
| Google Reviews | Partiel | Avis rédactionnels + CTA Google ; carte **optionnelle** si `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` (voir `.env.example`) |
| Traduction automatique | Partiel | `app/api/translate/`, `app/api/i18n/translate/`, cache SQL `scripts/16-translation-cache.sql` — selon clés et activation |

---

## 3. Très avancée — IA / ERP profond

*Vision produit ; démo ciblée plutôt que promesse « tout automatique » sans données réelles.*

| Fonctionnalité | Statut | Emplacements principaux |
|----------------|--------|-------------------------|
| AI agents | Implémenté | `app/admin/ai/`, nombreuses sous-pages, `app/api/ai/*`, `app/api/agents/stats/route.ts` |
| Copilot admin | Implémenté* | **`/admin/copilot`** + `POST /api/chatbot` rôle **`admin`** (LLM si clé configurée, sinon message d’orientation) |
| Prédiction / forecast | Partiel | `app/api/ai/forecast/route.ts`, `app/admin/ai/forecast/` |
| Détection d’anomalies | Partiel | `app/api/ai/anomalies/route.ts`, `app/admin/ai/anomalies/` |
| Rapports avancés | Implémenté* | `app/admin/reports/` appelle **`GET /api/admin/reports-data`** (agrégats `orders`) + carte fournisseur ; jeu de démo si Supabase vide |
| Supplier intelligence | Implémenté* | **`/admin/supplier-intelligence`** + **`GET /api/admin/supplier-stats`** ; OCR/validation dans `app/admin/supplier-invoices/` |
| Computer vision | Partiel | `app/api/ai/vision/route.ts`, `app/admin/ai/vision/` |
| Pricing dynamique | Partiel | `app/api/ai/pricing/route.ts`, `app/admin/ai/pricing/` |

---

## Périmètre technique (rappel)

- **App principale** : Next.js (App Router) sous `pfe-main/`.
- **Données / auth** : Supabase (schémas et politiques dans `scripts/*.sql`).
- **Audits** : table `audit_logs`, UI `app/admin/audit-log/`, API `app/api/admin/audit-logs/route.ts`.

---

## Prochaines actions possibles (hors scope de ce document)

- Renseigner **`assigned_to`** sur les commandes pour activer le **classement serveur** dans les rapports.
- Brancher **`NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL`** ou une **API officielle Google Places** pour des avis à jour.
- **Traduction auto** : `NEXT_PUBLIC_I18N_AUTO` + `GOOGLE_TRANSLATE_API_KEY` (déjà câblé dans `lib/i18n`).
- Documenter **un scénario E2E** par rôle (checklist veille soutenance).

*\* Fonctionnalité désormais câblée dans le code ; qualité donnée = remplissage Supabase.*

*Dernière mise à jour : alignée sur le dépôt au moment de la rédaction.*
