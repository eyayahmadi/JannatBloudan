# Démo finale — scénarios propres (Jannat Bloudan)

Guide pour une **présentation maîtrisée** : ordre conseillé, clics, et résultat attendu.  
Les **tests automatisés** couvrent une partie des chemins : `npm run test:e2e` (Playwright).

---

## Préparation (5 min)

1. `.env.local` : Supabase (URL, anon, **service_role**), `NEXT_PUBLIC_SITE_URL`, traduction si besoin (`TRANSLATION_PROVIDER` + clé).
2. Base : migrations appliquées (`npm run db:migrate:env`).
3. Comptes test (optionnel) : `npm run seed:test-accounts` — mots de passe dans `scripts/README.md`.
4. Lancer : `npm run dev` → http://localhost:3000  
5. **Tests smoke** (autre terminal) : `npm run test:e2e`

---

## Scénario A — Site public (sans compte)

| Étape | Action | Attendu |
|-------|--------|---------|
| A1 | Ouvrir `/` | Accueil, header, thème clair/sombre via icône soleil/lune |
| A2 | Menu langue (FR / AR / DE / EN) | Changement `lang` + **RTL** pour AR (`html[dir=rtl]`) |
| A3 | `/menu` | Carte ou message gracieux si API vide |
| A4 | `/events` | Liste ou état vide propre |
| A5 | `/reservation` | Formulaire / flux réservation |
| A6 | `/table/1/menu` (adapter ID) | Commande QR self-service si table seedée |
| A7 | `/login`, `/signup` | Formulaires visibles, pas de clé API en réseau (DevTools → Network) |

---

## Scénario B — Inscription & client

| Étape | Action | Attendu |
|-------|--------|---------|
| B1 | `/signup` — créer compte | Rôle **CLIENT** uniquement (pas choix staff) |
| B2 | Confirmation e-mail | Selon config Supabase ; sinon message clair |
| B3 | Login | Redirection vers **`/account`** (ou `?next=` valide) |
| B4 | `/account` | Sections overview, commandes, fidélité… (données réelles ou vides, pas d’erreur brute) |
| B5 | Déconnexion | Retour accueil ou login |

**Règle** : un CLIENT qui tape `/admin` en URL → après login éventuel, **403** ou refus (pas dashboard ERP).

---

## Scénario C — Administrateur

| Étape | Action | Attendu |
|-------|--------|---------|
| C1 | Login compte **ADMIN** | Redirection **`/admin/dashboard`** → **`/admin`** |
| C2 | Portail : sidebar, filtres période, **Déconnexion** | Header ERP cohérent |
| C3 | Modules : menu, stock, événements, finance, RH, paramètres | Pages chargent sans JSON brut |
| C4 | `/admin/users` ou staff | Gestion des rôles (création **staff** réservée admin) |
| C5 | Déconnexion | **`/`** (accueil site) |

---

## Scénario D — Personnel (un rôle à la fois)

Après login, vérifier la **bonne entrée** (`dashboardPathForRole`) :

| Rôle | URL d’accueil typique | À montrer |
|------|------------------------|-----------|
| SERVER | `/server/tables` | Plan de salle, alertes |
| KITCHEN | `/kitchen/orders` | File cuisine |
| BAR | `/bar/orders` | File bar |
| SHISHA | `/shisha/orders` | File chicha |
| CASHIER | `/caisse` | Vue caisse, onglets |
| DELIVERY | `/delivery/dashboard` → `/driver` | Suivi livraisons |

Vérifier : **lien retour** depuis caisse/POS ne renvoie pas un non-admin vers `/admin` (403) — comportement corrigé côté `SiteHeader` + `getStaffPortalBackNav`.

---

## Scénario E — Paiements & caisse (si données)

- POS `/pos`, tables `/pos/tables`
- Paiement split / transfert table : APIs `/api/caisse/*` (selon données)
- Ne pas afficher de message technique avec stack trace

---

## Scénario F — Traduction & avis

| Étape | Action | Attendu |
|-------|--------|---------|
| F1 | `TRANSLATION_PROVIDER=deepl` + clé | `POST /api/translate-page` traduit (pas la clé dans le navigateur) |
| F2 | Chaînes `useMt` / batch | Mise à jour après changement de langue |
| F3 | Maps / avis | Uniquement si `GOOGLE_*` renseignés |

---

## Scénario G — Design « premium »

- Pas de titres coupés (zoom 100 % desktop + mobile).
- Pas d’immenses blocs vides sans message.
- Couleurs **bordeaux / or / crème** cohérentes avec le reste du site.
- Mode sombre : lisible, pas de texte invisible.

---

## Automatisation vs manuel

| Couvert par Playwright (`e2e/`) | À faire à la main |
|-----------------------------------|-------------------|
| Smoke HTTP pages publiques | Tous les formulaires métier |
| Redirection login pour `/admin`, caisse, cuisines… | Stripe, e-mails, OCR réel |
| Login/signup champs visibles | Permissions fines par sous-page admin |
| Accueil / menu public | Performance réseau lent / 3G |

---

## Après la démo

- Captures d’écran des bugs éventuels.
- Noter les routes encore en **mock** (sans Supabase).
- Vérifier `docs/REGRESSION-REPORT.md` pour risques prod (`ignoreBuildErrors`, données démo).

---

*Bonne présentation — ce document est la trame ; adaptez les IDs de table / comptes à votre base.*
