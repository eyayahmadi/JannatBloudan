export const caisseMessages = {
  shell: {
    title: "Caisse",
    subtitle: "Vue journée, tables et encaissements",
  },
  page: {
    title: "Gestion de caisse intelligente",
    description: "Synthèse des encaissements, TVA suivie hors espèces (configurable admin), journaux et clôture.",
    date: "Date",
    refresh: "Actualiser",
    supabaseDisabled: "Connectez Supabase pour activer le pilotage financier temps réel.",
    taxes: "Taxes",
  },
  tabs: {
    vue: "Synthèse",
    encaisser: "À encaisser",
    factures: "Factures & paiements",
    tables: "Tables",
    externes: "Externes",
    evenements: "Événements",
    mouvements: "Sorties",
    credits: "Crédits clients",
    revenus: "Revenus stations",
    cloture: "Clôture jour",
  },
  summary: {
    title: "Synthèse du jour",
    description: "Encaissements, mouvements et entrées externes — mis à jour en temps réel.",
    salesToday: "Ventes (paiements jour)",
    cashPaid: "Cash encaissé",
    cardOnline: "Carte + online",
    sorties: "Sorties caisse jour",
    advances: "Avances employés",
    externalIncome: "Entrées externes (plateformes)",
    openCredits: "Crédits clients ouverts",
    expectedCash: "Caisse théorique (après mouvements)",
    closingGap: "Écart clôture (compté − attendu)",
    dayClosed: "Journée clôturée ?",
    invoicesTotal: "Total factures (lignes jour)",
    yes: "Oui",
    no: "Non",
    dash: "—",
  },
  invoices: {
    dayTitle: "Factures journée",
    draft: "Brouillon",
    open: "Ouvert",
    paid: "Payées",
    cancelled: "Annul.",
  },
  vat: {
    title: "Estimation TVA (règle admin)",
    nonCash: "Hors espèces (fact.)",
    declaredCash: "+ cash déclaré si option",
    totalEstimate: "Total estimation",
    fiscalScope: "Scope fiscal",
  },
  closing: {
    lastTitle: "Dernière clôture (date)",
    declaredReal: "Réel déclaré",
    internalResidual: "Interne résiduel",
    notYetToday: "Pas encore clôturée aujourd'hui.",
    cashTitle: "Cash déclaré & physique",
    physicalCounted: "Espèces comptées (physique)",
    declaredOfficial: "Espèces déclarées (officiel)",
    comment: "Commentaire (écart, incident)",
    submit: "Valider et clôturer ({date})",
    hint: "Une ligne immuable sera créée (pas de suppression utilisateur). L'interne résiduel = attendu système − déclaré officiel. Les écarts physiques créent une alerte si volumineux.",
    placeholder: "0,00",
  },
  alerts: {
    title: "Alertes",
    none: "Aucune alerte automatique détectée.",
  },
  tables: {
    billRequests: "{count} demande{plural} d'addition en attente.",
    cashierCalls: "{count} appel{plural} caisse en attente.",
    unavailable: "Tables indisponibles (schéma `restaurant_tables` non chargé ou vide).",
    eventsTitle: "Tickets événements (jour sélectionné)",
    activeSession: "session active",
    free: "libre",
    clientView: "Vue client",
    tableLabel: "Table",
    freeStatus: "Libre",
    noZone: "Aucune zone",
    zone: "Zone {zone}",
    noSession: "Aucune session ouverte",
    info: "Informations",
    tableNumber: "Numéro de table",
    displayName: "Nom affiché",
    qrCode: "Code QR",
    posStatus: "État (POS)",
    availableActions: "Actions disponibles",
    openOnPos: "Ouvrir sur le POS",
    posPlan: "Plan POS",
    autoSessionHint: "La session de cette table sera créée automatiquement à la première commande prise sur le POS",
  },
} as const

type DeepWiden<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { [K in keyof T]: DeepWiden<T[K]> }
    : T extends object
      ? { [K in keyof T]: DeepWiden<T[K]> }
      : T

export type CaisseMessages = DeepWiden<typeof caisseMessages>
