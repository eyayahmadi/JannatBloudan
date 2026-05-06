# Architecture — IA factures, stock, rôles, caisse intelligente

Ce document relie le cahier des charges (facture ↓ stock ↓ commandes ↓ caisse) au code dans `pfe-main`.

## 1. Facture fournisseur → OCR + IA

| Étape | Implémentation |
|--------|----------------|
| Upload image / PDF | `/api/admin/supplier-invoices`, upload `[id]/upload` |
| Texte PDF | `extractTextFromPdfBuffer` → `lib/supplier-invoices/extract.ts` |
| Vision image | `extractInvoiceFromImage` (GPT-4o-mini vision) |
| Parsing structuré JSON | Même module (schéma lignes + totaux TVA) |
| Format « produit » simple | `invoiceLinesToProductSpec`, `lib/supplier-invoices/spec-lines.ts` → `[{ produit, quantite, prix, total }]` |

Variables : `OPENAI_API_KEY`, optionnel `OPENAI_INVOICE_MODEL` / `OPENAI_INVOICE_VISION_MODEL`.

## 2. Validation admin → stock + dépense

Après lecture IA, les lignes peuvent être appariées aux **ingrédients** ou **créées**.

`POST /api/admin/supplier-invoices/[id]/validate` :

- crée mouvements `stock_movements` (entrées), met à jour `ingredients.stock_quantity`;
- écrit une **dépense** `expenses` (catégorie matières premières si présente).

## 3. Rôles (ADMIN uniquement pour création employé)

- Rôles : `ADMIN`, `SERVER`, `KITCHEN`, `BAR`, `SHISHA`, `CASHIER`, `DELIVERY`, `CLIENT`.
- Inscription publique : **toujours** `CLIENT` (`lib/context/AuthContext.tsx`).
- Création d’un autre rôle : API `/api/admin/users` (ADMIN), `ASSIGNABLE_ROLES` dans `lib/auth/roles.ts`.
- Redirection après login : `dashboardPathForRole` (caisse → **`/caisse`**).

## 4. Caisse (cashier)

- POS : `/pos`, accès `RequireAuth` : `ADMIN`, `STAFF`, **CASHIER**.
- Totaux jour (local démo) : barre du bas du POS.
- **Sortie de caisse / avance / ajustement** (journal serveur) :
  - migration SQL : `scripts/13-cash-register-movements.sql`
  - API : `GET|POST /api/staff/cash-register-movements` (rôles `ADMIN` ou `CASHIER`)
  - UI : `components/caisse/CashRegisterMovementForm.tsx` sur le POS.

Formule cible (à rapprocher des `payments` + ventes enregistrées) :

`caisse ≈ encaissements espèces + avances − sorties_caisse` (hors agrégation complète déjà couverte par `invoices` / `payments` si branchés).

## 5. Chaîne bout-en-bout (cible)

```
Facture achat (scan)
  → IA extraction (OpenAI)
  → Admin valide + match ingrédients
  → Stock ↑ + expense
Produits menu (si liés stock/ingrédients)
  → visibilité / rupture
Commandes
  → stations KITCHEN / BAR / SHISHA
  → service tables
  → encaissement POS / caisse
```

## 6. Pistes suivantes

- Brancher encaissements POS sur `payments` + `invoices` (remplacer totaux localStorage).
- Alertes « sortie élevée » : requête sur `cash_register_movements` + seuils.
- Option Tesseract / Google Vision : alternative si pas d’OpenAI (non branchée par défaut).

## 7. Gestion caisse intelligente et fiscalité (migration 2026)

- Script SQL : `scripts/14-caisse-intelligence-complete.sql` (réglages `finance_tax_settings`, avances RH `employee_advances`, lignes figées `cash_day_closings`, champ `payment_stage` sur les factures, enrichissement mouvements caisse + lien `expenses`).
- Interfaces : **`/caisse`** (ADMIN + caissiers), **`/admin/taxes`** (ADMIN — scope TVA : online uniquement ou online + partie cash déclaré en clôture).
- Principales routes API : `GET /api/caisse/dashboard`, `POST /api/caisse/closing`, `POST /api/caisse/employee-advance`, `GET /api/caisse/tables-overview`, `GET|PATCH /api/admin/finance-tax-settings`, mouvements étendus `POST /api/staff/cash-register-movements` (option `create_finance_expense` pour branchement automatique ligne dépense).
- Calcul TVA suivie hors espèce : agrégats sur lignes **factures payées** avec `payment_method` **non** cash + option admin pour rajouter une base HT proportionnelle dérivée du **cash déclaré** en fin de jour.

## 8. Spécification « Smart gestion » (vision cible)

Voir **`docs/SMART_GESTION_SPEC.md`** : OCR + validation comme source de vérité, stock intelligent, caisse / paie, dashboard insights (règles) et roadmap +1.

**Insights légers (sans LLM)** : `GET /api/admin/ops-insights`, page **`/admin/insights`**, règles dans `lib/insights/ops-rules.ts`.

