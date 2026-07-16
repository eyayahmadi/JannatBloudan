import type { WorkspaceMessages } from "./fr"

export const workspaceMessages: WorkspaceMessages = {
  shell: {
    team: "Team",
    navLabel: "Team-Bereich Navigation",
    home: "Startseite",
    expandMenu: "Menü erweitern",
    collapseMenu: "Menü reduzieren",
    logout: "Abmelden",
    menu: "Menü",
    title: "Team-Bereich",
  },
  nav: {
    server: {
      tables: "Saalplan & Tische",
      walkIn: "Bestellung ohne Tisch",
    },
    kitchen: {
      orders: "Küchenbestellungen (KDS)",
    },
    bar: {
      orders: "Bar-Bestellungen",
    },
    shisha: {
      orders: "Shisha-Bestellungen",
    },
    cashier: {
      caisse: "Kasse — Übersicht",
      pos: "POS",
      encaisser: "Tische zum Abkassieren",
      encaisserHint: "Rechnung angefordert · teilweise · unbezahlt",
      tables: "Tische & Sitzungen",
      tablesHint: "Tab Tische",
      factures: "Tagesrechnungen",
      facturesHint: "Tab Rechnungen",
      externes: "Externe Einnahmen",
      externesHint: "Lieferando · Wolt · Überweisungen",
      mouvements: "Kassenbewegungen",
      mouvementsHint: "Entnahmen / Vorschüsse",
      cloture: "Kassenabschluss",
      clotureHint: "Schichtende",
    },
    delivery: {
      dash: "Zugewiesene Lieferungen",
      driver: "Fahreransicht (Karte)",
    },
    admin: {
      erp: "Admin ERP",
      tables: "Saalplan",
      kitchen: "Küche (KDS)",
      bar: "Bar",
      shisha: "Shisha",
      caisse: "Kasse",
      delivery: "Lieferung",
    },
  },
  stations: {
    kitchen: {
      title: "Küche",
      subtitle: "KDS — nur KITCHEN-Station",
    },
    bar: {
      title: "Bar",
      subtitle: "Getränke & Desserts — BAR-Station",
    },
    shisha: {
      title: "Shisha",
      subtitle: "Shisha-Bestellungen — SHISHA-Station",
    },
  },
}
