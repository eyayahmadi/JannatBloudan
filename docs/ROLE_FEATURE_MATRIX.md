# Jannat Bloudan — Vision finale & matrice rôle / fonctionnalités

> Source de vérité opérationnelle pour le pilotage produit, le QA, le support et l'onboarding équipe.
> Ce document décrit **ce qui est réellement implémenté dans le repo** (`app/`, `lib/`, `scripts/`)
> ainsi que les conventions d'UX, d'accès et d'audit qui structurent la plateforme.

---

## 1. Vision globale

Jannat Bloudan n'est pas un site, c'est un **ERP / POS premium pour restaurant syrien de luxe**. Une seule
plateforme couvre :

- **Site public** & marque (vitrine, menu, événements, réservation, livraison).
- **Commande QR à table** (parcours invité, sans login).
- **POS / caisse** (encaissement, split, sorties, externes, clôture).
- **Plan salle serveur** (tables, transferts, fusion, walk-in).
- **KDS** dédié par station (cuisine, bar, chicha) — temps réel.
- **Stock & achats** (produits, fournisseurs, factures OCR).
- **Événements & billetterie** (publics et privés).
- **Livraison** (interface chauffeur + carte).
- **Portail client** (commandes, fidélité, factures, billets, recommandations).
- **Admin ERP** (vue globale, AI insights, rapports, audit logs).
- **Audit** (mouvements caisse, fusions, transferts, paiements, refunds — table `audit_logs`).
- **Real-time** (Supabase, polling 8 s sur la caisse, alertes par audience).

### Charte visuelle

- Palette : crème (`--lux-cream`), or (`--lux-gold`, `--lux-gold-deep`), bordeaux (`--lux-bordeaux`),
  bruns chauds. Dégradés discrets `--lux-gradient-ink`.
- Tipo : `font-display` pour les titres, sans-serif système ailleurs.
- Composants : Shadcn UI (Button, Card, Sheet, Tabs, Tooltip, Progress, Badge, Dialog, ScrollArea).
- Sidebars **Outlook-style** :
  - Staff : `components/workspace/StaffWorkspaceShell.tsx` (sidebar repliable, lien actif basé sur
    pathname + `?tab=`).
  - Admin : `components/admin/AdminPortalShell.tsx` (groupes thématiques).
  - Client : `app/account/page.tsx` (sidebar contextuelle, sous-pages dédiées).
- Pas de JSON brut affiché, pas de données mock dans les écrans (les fallbacks affichent des messages
  explicites du type « Aucune table libre… »).
- Toasts : `sonner`. Feedback son discret pour les alertes caisse (oscillator AudioContext).

### Conventions d'accès

- Auth : Supabase. Contexte React : `lib/context/AuthContext.tsx`.
- Rôles normalisés : `ADMIN | CLIENT | SERVER | KITCHEN | BAR | SHISHA | CASHIER | DELIVERY`
  (legacy `STAFF` → `SERVER`, `CUSTOMER` → `CLIENT`).
- Pages staff/caisse : composant `RequireAuth roles={[...]}` (`components/auth/RequireAuth.tsx`).
- APIs admin : `requireAdmin()` ou `requireRoles([...])` (`lib/auth/admin-api.ts`).
- Audit : helper `insertCaisseAudit` (`lib/caisse/audit.ts`) → table `audit_logs`.
- Redirect post-login : `dashboardPathForRole(role)` dans `lib/auth/roles.ts`, appliqué par
  `app/login/page.tsx` (et `signup`). Honor `?next=`.

| Rôle | Landing après login |
|------|----------------------|
| ADMIN | `/admin` |
| SERVER | `/server/tables` |
| KITCHEN | `/kitchen/orders` |
| BAR | `/bar/orders` |
| SHISHA | `/shisha/orders` |
| CASHIER | `/caisse` |
| DELIVERY | `/delivery/dashboard` |
| CLIENT (et défaut) | `/account` |

---

## 2. ADMIN

> ERP complet. Sidebar groupée (Outlook-style) côté `/admin`, plus accès direct aux interfaces métier
> (POS, KDS, plan salle, livraison) via le `StaffWorkspaceShell` quand il sort du portail admin.

### Pages & URL

Toutes les pages sous `app/admin/**` sont protégées par `app/admin/layout.tsx`
(`RequireAuth roles={["ADMIN"]}`).

| Module | URL | Composant clé |
|---|---|---|
| Dashboard principal | `/admin` | `app/admin/page.tsx` |
| Tables QR | `/admin/tables-qr` | `app/admin/tables-qr/page.tsx` |
| Menu & catégories & produits | `/admin/menu` | `app/admin/menu/page.tsx` |
| Stock | `/admin/inventory` | `app/admin/inventory/page.tsx` |
| Factures fournisseurs (OCR) | `/admin/supplier-invoices` | `app/admin/supplier-invoices/page.tsx` |
| Fournisseurs | `/admin/supplier-intelligence` | `app/admin/supplier-intelligence/page.tsx` |
| Achats | `/admin/purchases` | `app/admin/purchases/page.tsx` |
| Promotions & réductions | `/admin/promotions`, `/admin/offers`, `/admin/reductions` | `app/admin/promotions/...` |
| Réservations / IA | `/admin/ai/reservation` | — |
| Calendrier événements | `/admin/events/calendar` | — |
| Événements privés | `/admin/events/private` | — |
| Tickets / billetterie | `/admin/events`, `/admin/events/new` | — |
| Caisse — vue globale | `/caisse` | `app/caisse/page.tsx` (partagée ADMIN/CASHIER) |
| Finance & cash sorties | `/admin/finance`, `/admin/cash-sorties`, `/admin/taxes` | — |
| Personnel | `/admin/staff`, `/admin/users`, `/admin/hr` | — |
| Rapports | `/admin/reports` | `app/admin/reports/page.tsx` |
| Audit logs | `/admin/audit-log` | — |
| AI insights | `/admin/insights`, `/admin/ai/...`, `/admin/agents`, `/admin/copilot` | — |
| Paramètres | `/admin/settings` | — |

### Sidebar (`components/admin/admin-portal-nav.tsx`)

Groupes : Vue d'ensemble · Catalogue & achats · Commandes & opérations · Caisse & finance ·
Réservations & événements · Personnel · Clients & CRM · Intelligence & analytics · Paramètres.

### Boutons / actions principales

- Créer / éditer / désactiver un produit, une catégorie, un ingrédient, un fournisseur, une promo,
  un événement, un ticket, un staff.
- Régénérer les QR codes des tables, gérer les zones (Salle / Terrasse / VIP / Bar).
- Importer une facture fournisseur (OCR) puis valider les lignes.
- Ouvrir n'importe quel module métier (POS, plan salle, KDS, livraison) via le menu admin.
- Configurer fiscalité (`finance_tax_settings`), réglages de notification, cron, secrets.
- Voir / filtrer / exporter `audit_logs`.
- Voir KPIs IA (menu engineering, recommandations, sentiment, customer journey, upsell, etc.).

### Interdictions

- Aucune en termes d'UI ; le rôle ADMIN est opérationnellement super-admin.
- Les actions destructives (refunds, annulations, changements fiscaux) écrivent toujours dans
  `audit_logs` — pas de delete physique.

### APIs majeures

- `GET/POST/PATCH/DELETE /api/admin/*` (produits, ingrédients, catégories, restaurant-tables,
  staff, finance-tax-settings, supplier-invoices, audit-logs, ops-insights, etc.) — gardées par
  `requireAdmin()`.
- `POST /api/admin/private-events/*` — `STAFF_ROLES` (ADMIN + tous les rôles internes).
- `GET /api/caisse/dashboard`, `/reports`, `/export` — partagés avec CASHIER.

### Test checklist

- [ ] Connexion ADMIN → redirige `/admin`.
- [ ] Tous les liens de la sidebar admin atteignent une page existante (pas de 404).
- [ ] L'admin peut ouvrir `/caisse`, `/pos`, `/server/tables`, `/kitchen/orders`, `/bar/orders`,
      `/shisha/orders`, `/delivery/dashboard` sans 403.
- [ ] La création / suppression d'un produit apparaît dans `audit_logs`.
- [ ] L'export de rapport (`GET /api/caisse/export`) renvoie un fichier ouvrable.
- [ ] Le menu Outlook-style met en surbrillance l'élément actif (pathname + `?tab=`).

---

## 3. CLIENT

> Sidebar Outlook-style sur `/account`. Pas de dropdown caché : chaque action est un item de la sidebar.

### Pages

| URL | Description |
|---|---|
| `/account` | Vue d'ensemble + sidebar contextuelle |
| `/account/history` | Mes commandes |
| `/account/loyalty` | Points fidélité |
| `/account/notifications` | Notifications filtrées par audience |
| `/account/reviews` | Avis laissés |
| `/menu` | Carte publique |
| `/reservation` | Réserver une table |
| `/events` | Catalogue événements + tickets |
| `/delivery`, `/delivery/checkout`, `/delivery/track/[orderId]` | Parcours livraison |
| `/table/[tableId]`, `/table/[tableId]/menu`, `/table/[tableId]/order`, `/table/[tableId]/bill` | QR table |

### Sidebar (`SIDEBAR_ITEMS` dans `app/account/page.tsx`)

- Vue d'ensemble
- Commander maintenant
- Voir le menu
- Recommander dernière commande
- Mes recommandations
- Promotions & réductions
- Scanner table (QR)
- Réserver une table
- Réserver un événement
- Voir mes commandes
- Voir mes réservations
- Voir mes tickets événements
- Voir mes factures
- Gérer mes adresses
- Modifier mon profil
- Mes favoris
- Mes points fidélité
- Mes notifications
- Se déconnecter (visible uniquement si connecté)

### Vue d'ensemble — composants attendus

- En-tête de bienvenue avec prénom et niveau de fidélité.
- Carte « Points fidélité » avec progression.
- Carte « Prochaine réservation » (date, heure, table, action « Modifier »).
- Carte « Dernière commande » (montant, statut, bouton Réorder).
- Bandeau « Promotions actives ».
- Bandeau « Nouveautés » / chef's picks.
- Bloc « Recommandations IA » personnalisées.
- Liste « Plats favoris » (si data).
- Centre de notifications condensé (lu/non lu).

### Boutons / actions

- Commander (delivery, takeaway, table QR).
- Réserver table (`/reservation`).
- Acheter ticket événement (`/events`).
- Payer en ligne (Stripe checkout / wallet).
- Reorder dernière commande (POST /api/orders avec template).
- Ajouter / supprimer adresse.
- Modifier profil (`PATCH /api/profile`).
- Marquer favori.
- Marquer notifications lues.

### Interdictions

- Pas d'accès aux pages staff/admin (`/admin`, `/caisse`, `/pos`, `/server/*`, `/kitchen/*`, `/bar/*`,
  `/shisha/*`, `/delivery/dashboard`).
- Pas de visibilité sur la fiscalité, les sorties caisse, les audit logs.

### APIs

- `GET /api/menu`, `GET /api/promotions/active`, `GET /api/event-reservations`, `POST /api/orders`,
  `GET /api/orders/[id]`, `POST /api/event-reservations`, `POST /api/reservations`,
  `POST /api/ai/...` (chatbot, recommandations, sentiment).
- `GET /api/qr`, `GET /api/public/table-resolve`.
- Notifications : hook client `useNotifications` filtré par audience (`AppRole[]`).

### Test checklist

- [ ] Connexion CLIENT → `/account`.
- [ ] Toutes les entrées de la sidebar pointent vers une page existante.
- [ ] Tentative d'accès direct à `/admin`, `/caisse`, `/pos`, `/server/tables` → 403 ou redirect.
- [ ] Une notification de paiement est bien filtrée (audience CLIENT).
- [ ] Réorder met les bons produits dans le panier avec les variantes correctes.

---

## 4. SERVER / WAITER

> Interface tactile tablette/smartphone, optimisée rush. Sidebar courte ; tout passe par le plan de salle.

### Pages

| URL | Description |
|---|---|
| `/server` | Redirection serveur vers `/server/tables` |
| `/server/tables` | Plan de salle (composant `ServerFloorPlan`) |
| `/server/[tableId]` | Détail table : commandes, alertes, actions |
| `/server/walk-in` | Commande sans table (takeaway / téléphone / POS manuel) |

### Sidebar (`SERVER_NAV`)

- Plan de salle & tables → `/server/tables`
- Commande sans table → `/server/walk-in`

### Plan de salle — UI

- Cartes table colorées par statut (Libre / Occupée / En cours / Demande addition / Partiel / Payée /
  Non payée / Fermée), badges zone (Salle / Terrasse / VIP / Bar), badge fusion violet pour
  groupes mergés, anneau orange pulsant si addition demandée.
- Métriques compactes : invités, durée d'occupation (depuis `opened_at`), total €, progression payée.
- Boutons d'action : Ouvrir, Encaisser, Split, Transfert, Détail.
- Toolbar : transfert, fusion, libérer table / libérer groupe, walk-in, marquer alerte.

### Détail table (`/server/[tableId]`)

- Si la table appartient à un groupe fusionné, redirige les actions vers la table principale (UX cohérente).
- Bandeau « groupe fusionné » avec liste des membres.
- Onglets / panneaux :
  - Cart (items à envoyer, notes, allergie par item)
  - Commandes en cours (collapsibles, par item : annuler item avec raison, modifier quantité, modifier note)
  - Alertes table
  - Guests / split bill
- Bouton « Annuler tout », « Demander l'addition », « Appeler caisse », « Marquer servi ».

### Boutons / actions complets

- Ouvrir table (création de session)
- Ajouter / retirer guest
- Ajouter plat / boisson / chicha avec note + allergie
- Envoyer commande aux stations (kitchen / bar / shisha)
- Marquer un item « servi »
- Demander l'addition → `POST /api/caisse/request-payment`
- Notifier caisse → `POST /api/table-alerts` (`call_cashier`)
- Transférer table → `POST /api/caisse/transfer-table`
- Fusionner tables → `POST /api/caisse/merge-tables`
- Split bill (par personne, par item, par montant) → `SplitBillDialog`
- Annuler item avec raison → `POST /api/caisse/invoice-items/cancel`
- Marquer table libre / Libérer groupe (UI locale + API)
- Walk-in : créer commande sans table avec nom client + canal

### Interdictions

- Pas d'accès `/admin`, `/caisse`, `/pos`, `/pos/tables`, `/kitchen/*`, `/bar/*`, `/shisha/*`,
  `/delivery/dashboard`.
- Pas de bouton « Sortie caisse », « Avance employé », « Clôture jour ».
- Ne peut pas modifier les prix produits, ni la fiscalité, ni la structure menu.
- Ne peut pas voir le détail comptable (TVA / clôture / écarts).

### APIs

- `POST /api/orders` (création), `PATCH /api/orders/[id]` (statuts), `POST /api/caisse/transfer-table`,
  `POST /api/caisse/merge-tables`, `POST /api/caisse/guest-sessions`,
  `POST /api/caisse/invoice-items/cancel`, `POST /api/caisse/request-payment`,
  `POST /api/table-alerts`, `GET /api/caisse/tables-overview`.

### Test checklist

- [ ] Connexion SERVER → `/server/tables` ; voit toutes les tables temps réel.
- [ ] Cliquer une table → ouvre `/server/[tableId]` (jamais 403).
- [ ] Demander l'addition → notif visible côté CASHIER (audience).
- [ ] Fusion `Table 4 + Table 5` → la 5 est marquée fusionnée, totaux additionnés, Audit log créé.
- [ ] Annuler un item avec raison → l'item passe barré rouge, raison visible, total recalculé.
- [ ] Walk-in `/server/walk-in` : crée commande avec `table_number = null`, type `pos`.
- [ ] Tentative `/caisse` → 403.

---

## 5. CASHIER / CAISSE

> POS professionnel premium. Plan de salle compact, plateformes externes, clôture, exports.

### Pages

| URL | Description |
|---|---|
| `/caisse` | Onglets : `vue`, `factures`, `tables`, `externes`, `evenements`, `mouvements`, `cloture` |
| `/caisse?tab=tables` | Plan de salle redessiné (`CaisseFloorPlan`) + drawer détail |
| `/caisse?tab=externes` | Lieferando, Wolt, Uber Eats, virements |
| `/pos` | Point de vente (commandes manuelles) |
| `/pos/tables` | Vue tables POS |

### Sidebar (`CASHIER_NAV`)

- Caisse — synthèse → `/caisse?tab=vue`
- POS → `/pos`
- Tables & sessions → `/caisse?tab=tables`
- Factures du jour → `/caisse?tab=factures`
- Entrées externes → `/caisse?tab=externes` *(Lieferando · Wolt · virements)*
- Mouvements caisse → `/caisse?tab=mouvements`
- Clôture caisse → `/caisse?tab=cloture`

### Dashboard caisse — métriques exposées

- Ventes du jour, cash, carte + online, sorties, avances employés, **Entrées externes (plateformes)**.
- Carte « Plateformes externes » avec ventilation par source (Lieferando, Wolt, Uber Eats, …) et par
  mode (cash, carte, online, virement, payout) + cash vs hors-cash.
- Caisse théorique (cash + entrées externes cash − sorties − avances).
- Estimation TVA selon `vat_scope` (configurable admin : `online_only` / `online_plus_cash_declared`).
- Compteurs factures (draft, ouvert, payées, annulées, refunded).
- Alertes : addition demandée, appel caisse, écart tiroir, factures annulées répétées.

### Plan de salle caisse (`CaisseFloorPlan`)

- Filtres : statut (Libre / Occupées / En cours / Addition / Partiel / Payée), zone, recherche.
- Compteurs : total € en salle, total € à encaisser, badge temps réel.
- Carte table : numéro + zone + statut coloré + badge fusion + indicateur addition pulsant.
- Métriques : invités, durée, total €, progression payée colorée, reste.
- Actions par carte : Détail / Ouvrir, Encaisser (`/pos`), Split, Transfert.
- Click → drawer latéral droit (`Sheet`) :
  - Si session → `CaisseTableSessionPanel` (split, transfert, totaux détaillés, refund).
  - Si libre → `FreeTableDetailPanel` (infos table + boutons « Ouvrir sur le POS » et « Plan POS »).

### Boutons / actions complets

- Valider paiement cash, carte, online (`POST /api/caisse/payment`).
- Paiement groupé sur plusieurs factures (`POST /api/caisse/batch-pay`).
- Split par personne, par item, par montant (`SplitBillDialog`).
- Appliquer réduction / promo / hospitality (`POST /api/caisse/invoice-apply-offer`,
  `POST /api/caisse/invoice-hospitality`).
- Annuler facture / refund (`POST /api/caisse/cancel-invoice`,
  `POST /api/caisse/invoice-items/cancel`).
- Sortie caisse + pièce jointe (`POST /api/staff/cash-register-movements`,
  `POST /api/caisse/sortie/annuler` (admin only)).
- Avance employé (`POST /api/caisse/employee-advance`).
- **Entrée caisse externe** (`POST /api/caisse/external-income`) — Lieferando / Wolt / Uber Eats /
  Just Eat / Glovo / Deliveroo / virement / payout / autre. Si méthode = cash → mouvement caisse
  `kind = entree_externe` créé automatiquement.
- Clôturer table (`POST /api/caisse/close-table`).
- Clôture journée : compté physique + déclaré officiel + commentaire
  (`POST /api/caisse/closing`).
- Export rapport jour / mois (`GET /api/caisse/reports`, `GET /api/caisse/export`).
- Imprimer / envoyer reçu PDF (depuis `CaisseInvoicesPanel`).

### Interdictions

- Pas d'accès `/admin/*`.
- Ne peut pas créer / modifier produits, prix, stock, catégories.
- Ne peut pas annuler une sortie caisse (`POST /api/caisse/sortie/annuler` exige ADMIN).
- Ne peut pas modifier `finance_tax_settings`.
- Ne peut pas supprimer un audit log.
- Ne voit que les notifications dont l'audience inclut `CASHIER` (sauf ADMIN qui voit tout).

### APIs

- `/api/caisse/dashboard`, `/tables-overview`, `/payment`, `/batch-pay`, `/invoices`,
  `/invoice-apply-offer`, `/invoice-hospitality`, `/cancel-invoice`,
  `/invoice-items/cancel`, `/transfer-table`, `/merge-tables` (avec SERVER), `/close-table`,
  `/employee-advance`, `/external-income`, `/closing`, `/reports`, `/export`,
  `/event-tickets`, `/movement-attachment`.
- `/api/staff/cash-register-movements` (sorties / avances client / ajustements).

### Notifications reçues

- `request_bill` (table demande l'addition)
- `call_cashier` (serveur appelle)
- `payment_received` / `payment_failed` (audience CLIENT + CASHIER + ADMIN + DELIVERY si livraison)
- `split_bill_pending`, `partial_payment`
- `large_discount_applied` (audit)
- `cash_difference_detected` (clôture)
- `refund_requested`

### Test checklist

- [ ] Connexion CASHIER → `/caisse` (pas `/pos` directement).
- [ ] La sidebar a `Externes` et chaque entrée bascule sur le bon onglet.
- [ ] Saisir une entrée externe `Lieferando` en cash → ligne dans `external_cash_incomes` +
      `cash_register_movements` `kind=entree_externe` + `audit_logs` `external_cash_income.create`.
- [ ] Le tile « Entrées externes » et la carte ventilation apparaissent dans la synthèse.
- [ ] Click sur une table libre → ouvre le drawer avec « Aucune session ouverte » et 2 boutons.
- [ ] Click sur une table occupée → drawer = `CaisseTableSessionPanel`.
- [ ] Tentative de modifier un produit → 403.
- [ ] Tentative `POST /api/caisse/sortie/annuler` → 403.

---

## 6. KITCHEN

> KDS dédié station = `KITCHEN`. Aucune visibilité sur le bar, la chicha, la caisse.

### Pages & sidebar

| URL | Description |
|---|---|
| `/kitchen` | Redirection vers `/kitchen/orders` |
| `/kitchen/orders` | KDS cuisine (`StationBoard`) |

Sidebar : *Commandes cuisine (KDS)* uniquement.

### UI

- Colonnes : Nouvelles · En préparation · Prêtes · En retard · Annulées.
- Tickets larges (lisibles à 1 m), timers, statuts colorés (vert / ambre / rouge).
- Notes & allergies en évidence.
- Boutons : Accepter, Démarrer, Marquer prête, Signaler retard, Signaler rupture stock.
- Si l'item est cancelled après préparation → bouton « Marquer perte / waste ».

### APIs

- `GET /api/orders?station=kitchen` (via realtime).
- `PATCH /api/orders/[id]` (statut item).
- `POST /api/table-alerts` (signaler problème).
- `POST /api/admin/inventory/adjust` (perte) — gardé admin → la cuisine signale, l'admin valide.

### Interdictions

- Pas d'accès `/admin`, `/caisse`, `/pos`, `/server/*`, `/bar/*`, `/shisha/*`, `/delivery/*`.
- Ne voit pas les prix.

### Test checklist

- [ ] Connexion KITCHEN → `/kitchen/orders`.
- [ ] N'affiche aucun item bar / chicha.
- [ ] Marquer un item « prêt » : disparaît côté cuisine, apparaît côté serveur (notif audience SERVER).
- [ ] Tentative `/caisse` → 403.

---

## 7. BAR

Identique à `KITCHEN` mais station = `BAR` : boissons, cocktails, milkshakes, café, desserts froids.

### Pages & sidebar

- `/bar` → `/bar/orders`.
- Sidebar : *Commandes bar*.

### Actions spécifiques

- Marquer rupture d'ingrédient (alerte stock automatique).
- Suggérer alternative au serveur (note retournée).

### Test checklist

- [ ] Connexion BAR → `/bar/orders` ; pas d'items kitchen / shisha.

---

## 8. SHISHA

Station = `SHISHA`. Préparation chicha avec gestion des arômes/parfums.

### Pages & sidebar

- `/shisha` → `/shisha/orders`.
- Sidebar : *Commandes chicha*.

### Actions spécifiques

- Sélectionner parfum, indiquer rupture parfum.
- Marquer charbon prêt / chicha servie.
- Note allergie tabac.

### Test checklist

- [ ] Connexion SHISHA → `/shisha/orders` ; pas d'items kitchen / bar.

---

## 9. DELIVERY / DRIVER

### Pages & sidebar

| URL | Description |
|---|---|
| `/delivery/dashboard` | Tableau de bord chauffeur (livraisons assignées) |
| `/driver` | Vue carte (interface mobile / tablette) |
| `/driver/[orderId]` | Suivi livraison spécifique |

Sidebar : *Livraisons assignées* + *Vue chauffeur (carte)*.

### Actions

- Accepter / refuser une assignation.
- Marquer Picked up → On the way → Delivered.
- Encaisser à la livraison (cash / carte mobile) → notif CASHIER + audit.
- Appeler client (lien `tel:`).
- Ouvrir Google Maps (lien `geo:`).
- Signaler problème (livraison impossible, client absent, etc.).

### Interdictions

- Pas d'accès `/admin`, `/caisse`, `/pos`, `/server/*`, KDS.
- Ne voit que les livraisons qui lui sont assignées.

### APIs

- `GET /api/delivery/assignments`, `PATCH /api/delivery/assignments/[id]`.
- `POST /api/caisse/payment` (paiement à la livraison) — limité à CASHIER + DELIVERY si flag.
- `POST /api/table-alerts` (signaler problème — type `delivery_issue`).

### Test checklist

- [ ] Connexion DELIVERY → `/delivery/dashboard`.
- [ ] La vue carte s'ouvre, géoloc autorisée → markers visibles.
- [ ] Marquer livraison « Delivered » → notif CLIENT (audience) + notif CASHIER si paiement à
      la livraison.

---

## 10. Fonctionnalités transverses

| Fonctionnalité | Implémentation |
|---|---|
| QR table (parcours invité) | `/table/[code]` ; `qrImageUrlForTable` ; `app/api/qr` |
| Sessions table | `restaurant_tables`, `table_sessions`, `current_session_id`, `opened_at` |
| Transfert table | `POST /api/caisse/transfer-table` + audit |
| Fusion tables | `POST /api/caisse/merge-tables`, `table_session_merges`, `useMergeGroups` |
| Split bill | `SplitBillDialog`, `payment_split` JSONB sur `invoices` |
| Hospitality / offert maison | `invoices.billing_type='hospitality'`, `POST /api/caisse/invoice-hospitality` |
| Promotions / réductions | `scripts/21-promotions-module.sql`, `POST /api/caisse/invoice-apply-offer` |
| Entrées externes (plateformes) | `external_cash_incomes`, `POST /api/caisse/external-income` |
| Cancellation / refund | `POST /api/caisse/cancel-invoice`, `cancelled_at` sur `order_items`, jamais de DELETE physique |
| Audit logs | `audit_logs`, helper `insertCaisseAudit`, vue admin `/admin/audit-log` |
| Notifications | `useNotifications` + `audience: AppRole[]` (ADMIN voit tout, autres rôles filtrés) |
| Realtime | Supabase channels + polling caisse 8 s + tick durée 30 s |
| Multilingue | `app/api/translate*`, cache traduction (`16-translation-cache.sql`) |
| Réservations / événements | `event_reservations`, `private_events`, tickets QR |
| Stock | `inventory_items`, `inventory_movements`, OCR fournisseurs |
| AI insights | `app/admin/ai/*`, `/api/ai/*` |

---

## 11. Migrations SQL clés

| Script | Apport principal |
|---|---|
| `01-create-database-schema.sql` | Schéma initial |
| `13-cash-register-movements.sql` | Journal caisse |
| `14-caisse-intelligence-complete.sql` | TVA, employee_advances, payment_stage |
| `17-sortie-caisse-trace.sql` | Annulation sortie + traçabilité bénéficiaire |
| `18-advanced-table-pos.sql` | POS avancé tables |
| `19-private-events-calendar.sql` | Événements privés |
| `20-events-professional.sql` | Événements + billetterie |
| `21-promotions-module.sql` | Promotions / offres |
| `24-restaurant-tables-qr-admin.sql` | Admin QR tables |
| `27-table-session-merges.sql` | Fusion tables (audit) |
| `28-external-cash-incomes.sql` | **Entrées caisse externes (Lieferando/Wolt/Uber Eats/virements)** |

---

## 12. Garde-fous restants à surveiller

- `app/delivery/checkout/page.tsx`, `app/delivery/orders/page.tsx`, `app/delivery/track/[orderId]/page.tsx`,
  `app/driver/page.tsx`, `app/driver/[orderId]/page.tsx` ne portent pas de `RequireAuth` — par design
  pour le parcours client / livraison invité. Si un usage staff doit être restreint, ajouter le garde.
- `app/api/admin/staff/route.ts` n'importe pas `requireAdmin` — vérifier la garde au niveau RLS Supabase
  ou ajouter le helper. *(à valider lors du prochain audit)*

---

## 13. Checklist finale globale

- [ ] Login → chaque rôle atterrit sur le dashboard prévu (`dashboardPathForRole`).
- [ ] Aucune page staff/admin n'expose de JSON brut.
- [ ] Aucune page n'affiche de données de démo / mock à la prod (les fallbacks affichent un message
      explicite).
- [ ] Sidebar du portail correspond aux pages que le rôle peut effectivement ouvrir.
- [ ] Tentative de cross-role : un CLIENT ne peut pas atteindre `/admin`, `/caisse`, `/pos`, `/server/*`,
      `/kitchen/*`, `/bar/*`, `/shisha/*`, `/delivery/dashboard`.
- [ ] Les actions critiques (paiement, refund, transfert, fusion, sortie, externe, clôture) écrivent
      toutes dans `audit_logs`.
- [ ] Mobile/tablette : plan de salle, KDS, drawer caisse, sidebar collapsibles → testés.
- [ ] Mode sombre OK sur les nouveaux composants caisse.
- [ ] Aucun lien cassé dans les sidebars (pathname existe, pas de 404, pas de 403 inattendu).
