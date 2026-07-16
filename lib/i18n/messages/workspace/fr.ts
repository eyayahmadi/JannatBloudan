export const workspaceMessages = {
  shell: {
    team: "Équipe",
    navLabel: "Navigation espace équipe",
    home: "Accueil",
    expandMenu: "Étendre le menu",
    collapseMenu: "Réduire le menu",
    logout: "Déconnexion",
    menu: "Menu",
    title: "Espace équipe",
  },
  nav: {
    server: {
      tables: "Plan de salle & tables",
      walkIn: "Commande sans table",
    },
    kitchen: {
      orders: "Commandes cuisine (KDS)",
    },
    bar: {
      orders: "Commandes bar",
    },
    shisha: {
      orders: "Commandes chicha",
    },
    cashier: {
      caisse: "Caisse — synthèse",
      pos: "POS",
      encaisser: "Tables à encaisser",
      encaisserHint: "addition demandée · partiel · non payée",
      tables: "Tables & sessions",
      tablesHint: "onglet Tables",
      factures: "Factures du jour",
      facturesHint: "onglet Factures",
      externes: "Entrées externes",
      externesHint: "Lieferando · Wolt · virements",
      mouvements: "Mouvements caisse",
      mouvementsHint: "sorties / avances",
      cloture: "Clôture caisse",
      clotureHint: "fin de service",
    },
    delivery: {
      dash: "Livraisons assignées",
      driver: "Vue chauffeur (carte)",
    },
    admin: {
      erp: "Admin ERP",
      tables: "Plan salle",
      kitchen: "Cuisine (KDS)",
      bar: "Bar",
      shisha: "Chicha",
      caisse: "Caisse",
      delivery: "Livraison",
    },
  },
  stations: {
    kitchen: {
      title: "Cuisine",
      subtitle: "KDS — station KITCHEN uniquement",
    },
    bar: {
      title: "Bar",
      subtitle: "File des boissons & desserts — station BAR",
    },
    shisha: {
      title: "Chicha",
      subtitle: "Commandes chicha — station SHISHA",
    },
  },
} as const

type DeepWiden<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { [K in keyof T]: DeepWiden<T[K]> }
    : T extends object
      ? { [K in keyof T]: DeepWiden<T[K]> }
      : T

export type WorkspaceMessages = DeepWiden<typeof workspaceMessages>
