import type { WorkspaceMessages } from "./fr"

export const workspaceMessages: WorkspaceMessages = {
  shell: {
    team: "Team",
    navLabel: "Staff workspace navigation",
    home: "Home",
    expandMenu: "Expand menu",
    collapseMenu: "Collapse menu",
    logout: "Log out",
    menu: "Menu",
    title: "Staff workspace",
  },
  nav: {
    server: {
      tables: "Floor plan & tables",
      walkIn: "Order without table",
    },
    kitchen: {
      orders: "Kitchen orders (KDS)",
    },
    bar: {
      orders: "Bar orders",
    },
    shisha: {
      orders: "Shisha orders",
    },
    cashier: {
      caisse: "Cash register — overview",
      pos: "POS",
      encaisser: "Tables to cash out",
      encaisserHint: "bill requested · partial · unpaid",
      tables: "Tables & sessions",
      tablesHint: "Tables tab",
      factures: "Today's invoices",
      facturesHint: "Invoices tab",
      externes: "External income",
      externesHint: "Lieferando · Wolt · transfers",
      mouvements: "Cash movements",
      mouvementsHint: "withdrawals / advances",
      cloture: "Cash closing",
      clotureHint: "end of shift",
    },
    delivery: {
      dash: "Assigned deliveries",
      driver: "Driver view (map)",
    },
    admin: {
      erp: "Admin ERP",
      tables: "Floor plan",
      kitchen: "Kitchen (KDS)",
      bar: "Bar",
      shisha: "Shisha",
      caisse: "Cash register",
      delivery: "Delivery",
    },
  },
  stations: {
    kitchen: {
      title: "Kitchen",
      subtitle: "KDS — KITCHEN station only",
    },
    bar: {
      title: "Bar",
      subtitle: "Drinks & desserts queue — BAR station",
    },
    shisha: {
      title: "Shisha",
      subtitle: "Shisha orders — SHISHA station",
    },
  },
}
