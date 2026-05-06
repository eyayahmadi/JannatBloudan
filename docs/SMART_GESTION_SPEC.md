# Smart gestion — spécification cible & cartographie code

Vision : **pas seulement un site restaurant**, mais une plate-forme **traçable, prédictive, pilotée par la donnée validée**.

---

## 1) OCR facture + validation humaine (single source of truth)

**Principe** : aucune mise à jour de stock ou de compta « achat » **avant** validation humaine.

| Étape | Implémentation actuelle |
|--------|-------------------------|
| Upload image / PDF | `POST /api/admin/supplier-invoices`, `POST .../[id]/upload` |
| OCR / IA structurée | `lib/supplier-invoices/extract.ts` (PDF → texte, image → vision si `OPENAI_API_KEY`) |
| JSON (lignes, totaux, confidence) | Même module + lignes projetées dans l’admin |
| UI validation + match ingrédient | `app/admin/supplier-invoices/page.tsx`, types `lib/supplier-invoices/types.ts`, matching `match.ts` |

**À la confirmation seulement** (`POST /api/admin/supplier-invoices/[id]/validate`) :

- mouvements `stock_movements` + mise à jour `ingredients.stock_quantity` ;
- `supplier_invoice_items` (snapshot) ;
- `supplier_invoices.status = validee` + liaison `expenses` ;
- **pas** de stock avant cet appel (les statuts `brouillon` / OCR ne doivent pas appliquer de sortie entrée métier sans validate).

**À renforcer (niveau produit)** : persistance explicite du fichier source, du JSON brut OCR et des scores par ligne (déjà partiellement en `supplier_invoice_items.confidence`).

---

## 2) Stock intelligent (seuils, tendance, rupture)

**Données** : `ingredients` (stock, `threshold_low`, `threshold_critical`), `stock_movements`, consommation via `order_items` / `decrement_stock_for_order` (commandes).

**État actuel** : seuils en base ; tendance / prédiction « tomates dans 2 jours » **non** implémentée en job dédié.

**Cible** :

- consommation moyenne glissante (7 / 14 jours) par ingrédient ou par produit menu lié ;
- alertes `LOW` / `CRITICAL` ;
- suggestion d’achat (« acheter 10 kg ») **après** alignement avec les factures fournisseurs validées.

---

## 3) Caisse + cash déclaré + alertes + rapports

**Implémenté** : `GET /api/caisse/dashboard`, clôture `POST /api/caisse/closing`, TVA configurable, alertes (écart, annulations, sorties, alertes DB), `GET /api/caisse/reports`, export CSV.

**À compléter** : export **PDF** (génération serveur ou template), tableaux de bord « risque » consolidés multi-semaines.

---

## 4) Avance employé + paie (transparence)

**Implémenté** : `employee_advances` + mouvement `avance_salaire`, API `POST /api/caisse/employee-advance`, audit sur actions clés.

**Règle métier** : `salaire_net = salaire_base + bonus - avances - pénalités` — à appliquer dans le module **RH / paie** (écran ou export) ; **pas de suppression** des avances (statuts `deducted` / annulation logique seulement).

---

## 5) Dashboard intelligent (insights + copilot léger)

**Objectif** : au-delà des KPIs bruts — **phrases actionnables** (« le vendredi +30 % », « plat X faible », « goulots cuisine ») via **règles + statistiques** (sans LLM obligatoire).

**Implémenté** : `GET /api/admin/ops-insights` + page ` /admin/insights` (agrégats commandes + stock + suggestions). Extensible par nouvelles règles dans `lib/insights/ops-rules.ts`.

---

## Principes transverses

- **Une source de vérité** pour les achats : facture fournisseur **validée**.
- **Tout est traçable** : `audit_logs` (triggers) + journaux applicatifs caisse / paiements.
- **Séparation** : cash / online / cash déclaré (fiscalité admin).
- **Validation humaine** avant tout changement sensible (stock, encaissement final, annulations sensibles).
- **Insights > tableaux bruts** : interprétation par règles puis, si besoin, LLM plus tard.

---

## Niveau +1 (roadmap)

- **Supplier intelligence** : comparer prix unitaires par fournisseur sur mêmes ingrédients.
- **Kitchen performance** : latences `order_items` (stations), détection goulots.
- **Profit réel** : revenus − dépenses (y compris matières) − gaspillage.
- **Fraude** : patterns sur caisse (déjà amorcé par alertes) + règles métier.
