# Jannat Bloudan — Design System (Luxury · Hospitality · ERP)

> Référence unique pour toute l'équipe produit, design et développement.
> Ce système est **déjà implémenté** dans `app/globals.css`, `lib/ui/motion.ts`,
> `components/ui/*`. Aucun re-design, aucune librairie externe à ajouter — il
> faut **utiliser les primitives existantes** documentées ici.

---

## 1. Philosophie

L'application doit toujours évoquer :

- un **restaurant syrien de luxe** (chaleur, hospitalité, dorures patinées),
- un **SaaS premium moderne** (Notion / Stripe / Linear / Toast / Square),
- une **interface intelligente** (insights IA digérés en cartes lisibles, jamais en JSON).

Elle ne doit jamais ressembler à :

- un Bootstrap admin générique,
- un panel développeur avec JSON brut,
- un POS legacy froid,
- un projet d'école avec données mockées visibles.

---

## 2. Tokens de couleur (`app/globals.css`)

Toutes les couleurs sont exposées en variables CSS. **N'utilisez JAMAIS de hex
en dur** dans un composant — référencez toujours `var(--lux-*)` ou les classes
Tailwind dérivées.

| Token | Hex | Usage |
|---|---|---|
| `--lux-cream` | `#fbf7ef` | Fond principal pages (clair) |
| `--lux-sand` | `#f2e9d7` | Fond carte secondaire / hover beige |
| `--lux-ivory` | `#eadfc5` | Bordures douces, badges neutres |
| `--lux-gold` | `#c9a24c` | Accents premium, ring, focus |
| `--lux-gold-bright` | `#d9b76a` | Hover gold, dark mode text |
| `--lux-gold-deep` | `#8e6b1e` | Texte sur fond doré, icônes accent gold |
| `--lux-bordeaux` | `#6e1d2b` | CTA principal, headers, brand |
| `--lux-bordeaux-dark` | `#4a0f1c` | Hover bordeaux, fonds rich |
| `--lux-olive` | `#5c6b3a` | États « approuvé / nature », rare |
| `--lux-olive-dark` | `#3d4a22` | Variante sombre olive |
| `--lux-charcoal` | `#1a1410` | Texte principal sombre, surfaces foncées |
| `--lux-ink` | `#2b241c` | Surfaces card dark mode |

### Ombres

| Token | Usage |
|---|---|
| `--lux-shadow-soft` | Cards repos (light) |
| `--lux-shadow-gold` | Cards hover, primary CTA |
| `--lux-shadow-ink` | Cards dark mode |

### Gradients

| Token | Usage |
|---|---|
| `--lux-gradient-gold` | Boutons CTA, badges premium |
| `--lux-gradient-paper` | Background sections light |
| `--lux-gradient-ink` | Background hero / dark sections |

### Statuts (palette dérivée Tailwind, voir `StatusPill`)

| Statut | Couleur | Token Tailwind |
|---|---|---|
| Libre / Payée / Approved | vert | `emerald` |
| Occupée / Pending | ambre | `amber` |
| Commande en cours | bleu | `blue` |
| Prête à payer | cyan | `cyan` |
| Demande addition | orange (anneau pulsant) | `orange` |
| Paiement partiel | violet | `purple` |
| Non payée / Erreur | rouge | `rose` |
| Premium / VIP | doré | `gold` (`--lux-gold`) |
| Neutre / Désactivé | gris | `neutral` |

---

## 3. Typographie

- Titres : `font-display` (sérif élégant, défini dans Tailwind config).
- Corps : sans-serif système.
- Tabulaires (numéros) : ajouter `tabular-nums` ou utiliser `.numeric-display`
  (voir `CountUp`).

| Style | Classes |
|---|---|
| H1 hero | `font-display text-3xl md:text-4xl font-semibold tracking-tight` |
| H2 section | `font-display text-lg font-semibold tracking-tight` |
| Label badge / KPI | `text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground` |
| Valeur KPI | `text-lg font-semibold` |
| Caption / hint | `text-[11px] text-muted-foreground` |

---

## 4. Composants UI — boutons

Variants gérés par `components/ui/button.tsx` :

| Variant | Classe CSS | Usage |
|---|---|---|
| `default` | `.btn-primary` | Action principale (validation, soumission) |
| `gold` | `.btn-cta` | CTA premium (réserver, commander, payer) |
| `secondary` | `.btn-secondary` | Action secondaire neutre |
| `outline` | `.btn-outline` | Action secondaire bordée |
| `ghost` | `.btn-ghost` | Liens d'action discrets |
| `destructive` | `.btn-danger` | Suppression / refund / annulation |
| `luxPanel`, `luxOutlineBordeaux`, `heroGlass` | classes spécifiques | Headers / hero / panels luxe |

### Tailles

`default | sm | lg | xl | pill | pillSm | hero | panel | panelSm | headerGold | chip | icon | icon-sm | icon-lg`

### Règles

- Bouton primaire = bordeaux, glow gold subtil au hover (déjà géré par CSS).
- CTA premium (`variant="gold"`) = gradient or, à réserver pour 1 action par
  écran maximum.
- Danger = rouge profond, jamais agressif.
- Toujours inclure une icône lucide à gauche pour les actions critiques.

---

## 5. Cartes & surfaces

| Composant | Usage |
|---|---|
| `<Card>` (`components/ui/card.tsx`) | Surface standard ERP |
| `.premium-card` | Surface luxe (KPI, hero, blocs marketing) — bordure or, blur, ombres soft |
| `<MotionCard>` | Surface avec hover-lift Framer Motion |
| `<PremiumStatCard>` | KPI premium prêt à l'emploi (CountUp + icône + delta) |
| `<SkeletonStatCard>` | Placeholder cohérent pour PremiumStatCard |

### Règles

- Coins arrondis : `rounded-xl` (12) pour cards classiques, `rounded-2xl` (18) pour cards premium, `rounded-full` pour pills.
- Toujours espacer : `p-4` minimum, `p-5` ou `p-6` pour les cards hero.
- Bordure : `border` neutre, `border-[color:var(--lux-gold)]/25` pour premium.
- Ombre repos : `shadow-sm` ; hover : `shadow-md` ou `var(--lux-shadow-gold)`.

---

## 6. Animations — Framer Motion

Tous les presets sont dans `lib/ui/motion.ts`.

### Easings

| Preset | Quand l'utiliser |
|---|---|
| `EASE_SILK` (0.6 s, easeOut) | Apparitions élégantes (hero, sections de page) |
| `EASE_QUICK` (0.3 s, easeOut) | Hover, transitions UI rapides |
| `SPRING_SOFT` | Entrée naturelle de panneau / drawer |
| `SPRING_BOUNCE` | Confirmation tactile (success toast) |

### Variants

`fadeUp`, `fadeDown`, `fadeIn`, `scaleIn`, `slideInLeft`, `slideInRight`,
`staggerContainer`, `pageEnter`, `cardHover`, `buttonPress`.

### Composants prêts (`components/ui/motion-primitives.tsx`)

| Composant | Usage |
|---|---|
| `<FadeIn delay={0.1}>` | Section qui apparaît au scroll |
| `<StaggerList>` + `<StaggerItem>` | Liste avec apparition décalée |
| `<MotionCard>` | Card avec hover lift + tap |
| `<CountUp value={total} suffix=" €" decimals={2} />` | Compteur animé |
| `<RevealScale>` | Apparition avec léger zoom (galerie, hero) |
| `<Reveal>` (`components/ui/Reveal.tsx`) | Variante CSS-only pour SSR friendly |
| `<AnimatedCounter target={42} />` | Compteur scroll-triggered |

### Helpers Premium (`components/ui/premium.tsx`)

| Composant | Usage |
|---|---|
| `<PremiumStatCard>` | KPI complet (icône + label + CountUp + delta) |
| `<AnimatedDelta value={+12.4} />` | Variation period-over-period |
| `<NotificationDot count={3} />` | Pastille pulsante (badge sidebar / cloche) |
| `<StatusPill tone="emerald" pulsing label="Libre" />` | Badge statut universel |
| `<SkeletonStatCard />` | Placeholder |
| `<PremiumSection title="Synthèse" description="..." trailing={...}>` | Header de section avec animation fade-in |

### Animations CSS-utilities (`globals.css`)

`animate-float`, `animate-pulse-glow`, `animate-slide-up`, `animate-slide-in-left`,
`animate-slide-in-right`, `animate-scale-in`, `animate-rotate-in`,
`animate-bounce-gentle`, `animate-gradient`, `animate-syrian-gradient`,
`animate-fade-up`, `animate-drift-slow`, `animate-drift-delay`, `animate-progress`,
`shimmer-gold`, `agent-pulse`, `breathe`, `aurora-ring`.

### Règles

- Durées : 200–500 ms. **Au-delà = à éviter** (sauf shimmer / aurora décoratifs).
- Pas plus d'**une animation primaire** par viewport — sinon ça distrait.
- `prefers-reduced-motion` doit être respecté ; `LazyMotion` couvre déjà cela.
- Hover-lift maximum **-4 px** pour rester subtil.
- Pulse réservé aux alertes critiques (`addition`, `cashier_call`, `live`).

---

## 7. Layouts

### Sidebars Outlook-style (obligatoire pour les portails staff/admin/client)

| Portail | Composant | Source de la nav |
|---|---|---|
| Staff (server / kitchen / bar / shisha / cashier / delivery) | `components/workspace/StaffWorkspaceShell.tsx` | `lib/nav/role-workspace-nav.ts` (`workspaceNavForRole`) |
| Admin ERP | `components/admin/AdminPortalShell.tsx` | `components/admin/admin-portal-nav.tsx` (`ADMIN_PORTAL_NAV`) |
| Client | `app/account/page.tsx` (`SIDEBAR_ITEMS`) | local |

Caractéristiques :

- Largeur 240–256 px, repliable à 72 px (icônes uniquement).
- Item actif : fond bordeaux 14 %, font-semibold, `inset 3 0 0 0 gold` (barre gold à gauche).
- Icône dans pavé arrondi 36 px, fond crème 70 %.
- Transitions : `transition` Tailwind par défaut sur `bg`, `color`, `transform`.
- Badges / counters : `<NotificationDot>` ou pill chiffré gold/bordeaux.

### Page header

`SiteHeader` ou wrapper local avec :

- Titre `font-display`,
- Sous-titre court (1 ligne),
- Toolbar à droite (boutons d'action principaux + filtres).

### Drawers latéraux

Toujours `Sheet` (`components/ui/sheet.tsx`), side `right`, `sm:max-w-2xl`,
`overflow-y-auto`, `p-0` puis container interne `p-4`. Header dans `<SheetHeader>`
avec `border-b`.

---

## 8. Iconographie

- Librairie unique : **lucide-react**.
- Stroke `1.65` à `1.75` (déjà appliqué dans nos composants premium).
- Tailles : `h-3 w-3` (badge inline) · `h-3.5 w-3.5` (action button) · `h-4 w-4` (default) · `h-5 w-5` (icône principale tile) · `h-6 w-6` (logo / hero).
- Toujours associer une icône au texte des actions critiques.
- Pour la marque : `BloudanLogoMark` (animation `bloudan-mark-breathe` au repos).

---

## 9. États & feedback

### Toast — `sonner`

Importé via `<Toaster />` global. Préférer :

```tsx
import { toast } from "sonner"
toast.success("Paiement enregistré.")
toast.error("Impossible de fusionner ces tables.")
```

### Skeleton

`<Skeleton className="h-4 w-24" />` pour placeholders, ou `<SkeletonStatCard />`.

### Empty state

Toujours :

- Border `border-dashed`
- Fond `bg-muted/30` ou `bg-white/60`
- Icône lucide centrée + message court explicite
- Si pertinent : 1 bouton CTA pour démarrer l'action

### Live indicators

- Pastille verte `<span className="h-2 w-2 rounded-full bg-emerald-500" />`
- Badge « Temps réel · 8 s » (cf. `CaisseFloorPlan`)
- `animate-pulse` discret sur dot active

---

## 10. Surfaces métier — patterns de référence

Les composants ci-dessous sont les **références canoniques** à dupliquer pour
toute nouvelle surface du même type.

| Surface | Pattern de référence |
|---|---|
| Plan de salle (statut tables) | `components/caisse/CaisseFloorPlan.tsx` |
| Drawer session table | `components/caisse/CaisseTableSessionPanel.tsx` |
| KDS station | `components/stations/StationBoard.tsx` |
| Form premium (entrée caisse) | `components/caisse/ExternalIncomePanel.tsx` |
| Floor plan serveur tactile | `components/server/ServerFloorPlan.tsx` |
| Sidebar staff | `components/workspace/StaffWorkspaceShell.tsx` |
| Sidebar admin ERP | `components/admin/AdminPortalShell.tsx` |
| Notifications panel | `components/site/NotificationCenter.tsx` |

---

## 11. Règles d'or (rappel)

1. **Pas de JSON brut affiché** dans une UI utilisateur. Tout contenu doit
   passer par une carte / tile / pill.
2. **Pas de données mock visibles** — utiliser des messages explicites
   (« Aucune session ouverte », « Aucune table libre… ») via empty states
   stylés.
3. **Chaque action critique** est traçable (`audit_logs`) et donne un toast.
4. **Une seule animation primaire** par viewport — pas de carrousel auto + hero
   wave + pulse en même temps.
5. **Toujours** réutiliser les tokens (`--lux-*`) et les composants premium.
6. **Toujours** documenter une nouvelle primitive ici si elle est ajoutée.
7. **Mobile/tablette** : tester chaque carte au format 768 px et 414 px.
   Plan de salle reste lisible sur tablette (sm:grid-cols-2 minimum).

---

## 12. Guide d'application par portail

### Admin ERP (`/admin`)

- Sidebar fixe (Outlook), groupes thématiques, badges sur catégories.
- Cards KPI = `PremiumStatCard` accent `bordeaux` ou `gold`.
- Charts (Recharts) : palette gold/bordeaux/cream, lignes 1.5 px,
  axes en `text-muted-foreground`, tooltips `premium-card`.
- AI insights : pas de raw — toujours `<Card>` + recommandation 1 ligne +
  call-to-action (« Appliquer », « En savoir plus »).

### Client (`/account` + sous-pages)

- Sidebar Outlook-style avec emoji-icone par item.
- Hero personnalisé (`Bonjour {prénom}` + niveau fidélité).
- Tile fidélité avec `Progress` doré.
- Dernière commande, prochaine résa, recommandations, favoris dans cards
  cliquables (`MotionCard`).
- CTA principal `variant="gold"` (Commander).

### Server (`/server/tables`)

- Plan en grid `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Cartes avec couleurs par statut, glow orange si addition, ring violet si
  fusion.
- Boutons tactiles `min-h-12` minimum, larges, espacés.

### Cashier (`/caisse`)

- Onglets en pill, contenu animé par `<FadeIn>`.
- KPIs en `PremiumStatCard` avec accents variés (gold cash, indigo carte,
  rose sortie, amber avance, emerald externes).
- Plan de salle = `CaisseFloorPlan` (déjà conforme).
- Drawer = `Sheet` side right.

### KDS (kitchen / bar / shisha)

- Tickets = cards larges, `text-base` minimum, contraste élevé.
- Timer pulsant rouge si > seuil retard.
- Couleur statut par bordure left 4 px (vert/ambre/rouge).
- Mode tablette / dark mode disponibles.

### Delivery / Driver

- Cartes commande compactes, action principale `Marquer livré` en CTA gold.
- Map plein écran sur `/driver`.
- Pas de mention du panier client / prix détaillés.

---

## 13. Checklist QA design

À faire passer sur chaque nouvelle page avant merge :

- [ ] Couleurs uniquement via `--lux-*` ou tokens Tailwind sémantiques.
- [ ] Au moins une animation Framer Motion (FadeIn / PremiumSection / MotionCard).
- [ ] CountUp utilisé pour les montants chiffrés clés.
- [ ] Mode sombre testé (cards, ombres, badges restent lisibles).
- [ ] Mobile 414 px : pas de scroll horizontal involontaire, boutons tappables.
- [ ] Tablette 768 px : grilles 2 cols minimum.
- [ ] Aucun `JSON.stringify` ou `console.log` visible dans le rendu.
- [ ] Empty states stylés.
- [ ] Skeletons pendant le chargement (pas de placeholder vide).
- [ ] Hover-lift présent sur les cards cliquables (max -4 px).
- [ ] Pas de couleur hex en dur dans le JSX/Tailwind.
- [ ] Boutons critiques utilisent une icône lucide.
- [ ] Toasts `sonner` pour confirmer / signaler les erreurs.
- [ ] `prefers-reduced-motion` respecté (ne pas désactiver `LazyMotion`).

---

## 14. Roadmap design (non-bloquant)

| Item | Priorité |
|---|---|
| Page transitions globales (`motion.div` racine `pageEnter`) | basse |
| Theme switch animé (sun/moon morph) | basse |
| Galerie événements VIP avec parallax léger | basse |
| Skeleton spécifique tickets KDS | moyenne |
| Charts custom Recharts avec dégradés gold | moyenne |
| Onboarding tour (Driver / Cashier) | moyenne |

---

> **Source de vérité** : ce fichier. Toute évolution graphique ou animation
> doit être listée ici avant d'être appliquée à grande échelle. Si une primitive
> manque, l'ajouter dans `components/ui/premium.tsx` ou `motion-primitives.tsx`
> avant de l'utiliser dans plusieurs pages.
