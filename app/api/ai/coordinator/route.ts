import { NextResponse } from "next/server"

const AGENTS = [
  { id: "recommendation", name: "Agent Recommandation", status: "active", lastRun: "il y a 2 min", metric: "847 suggestions", health: 98, endpoint: "/api/ai/recommendations", page: "/admin/ai/recommendations" },
  { id: "chatbot", name: "Agent Conversationnel", status: "active", lastRun: "en continu", metric: "324 conversations", health: 95, endpoint: "/api/chatbot", page: null },
  { id: "stock", name: "Agent Stock Predictif", status: "active", lastRun: "il y a 5 min", metric: "3 alertes critiques", health: 88, endpoint: "/api/ai/stock", page: "/admin/ai/stock" },
  { id: "pricing", name: "Agent Pricing Dynamique", status: "active", lastRun: "il y a 1 min", metric: "4 prix ajustes", health: 96, endpoint: "/api/ai/pricing", page: "/admin/ai/pricing" },
  { id: "anomaly", name: "Agent Detection Anomalies", status: "active", lastRun: "il y a 30 sec", metric: "6 anomalies", health: 92, endpoint: "/api/ai/anomalies", page: "/admin/ai/anomalies" },
  { id: "kitchen", name: "Agent Optimisation Cuisine", status: "active", lastRun: "il y a 3 min", metric: "22% gain temps", health: 94, endpoint: "/api/ai/kitchen", page: "/admin/ai/kitchen" },
  { id: "analytics", name: "Agent Analytics & BI", status: "active", lastRun: "il y a 4 min", metric: "12 insights", health: 94, endpoint: "/api/ai/analytics", page: "/admin/ai/analytics" },
  { id: "marketing", name: "Agent Marketing", status: "active", lastRun: "il y a 15 min", metric: "3 campagnes", health: 90, endpoint: "/api/ai/marketing", page: "/admin/ai/marketing" },
  { id: "loyalty", name: "Agent Fidelite", status: "active", lastRun: "il y a 1 min", metric: "156 membres actifs", health: 97, endpoint: "/api/ai/loyalty", page: "/admin/ai/loyalty" },
  { id: "sentiment", name: "Agent Analyse Sentiment", status: "active", lastRun: "il y a 10 min", metric: "78% positif", health: 91, endpoint: "/api/ai/sentiment", page: "/admin/ai/sentiment" },
  { id: "forecast", name: "Agent Prevision Business", status: "active", lastRun: "il y a 8 min", metric: "85/100 sante", health: 93, endpoint: "/api/ai/forecast", page: "/admin/ai/forecast" },
  { id: "vision", name: "Agent Vision", status: "active", lastRun: "en continu", metric: "20 tables surveillees", health: 89, endpoint: "/api/ai/vision", page: "/admin/ai/vision" },
  { id: "quality", name: "Agent Qualite", status: "active", lastRun: "il y a 6 min", metric: "92% conformite", health: 95, endpoint: "/api/ai/quality", page: "/admin/ai/quality" },
  { id: "reservation", name: "Agent Reservation IA", status: "active", lastRun: "il y a 2 min", metric: "82% occupation", health: 94, endpoint: "/api/ai/reservation", page: "/admin/ai/reservation" },
  { id: "memory", name: "Agent Memoire & RAG", status: "active", lastRun: "en continu", metric: "chunks indexes", health: 97, endpoint: "/api/ai/memory", page: "/admin/ai/memory" },
  { id: "upsell", name: "Agent Upselling Intelligent", status: "active", lastRun: "il y a 15 sec", metric: "offres contextuelles", health: 94, endpoint: "/api/ai/upsell", page: "/admin/ai/upsell" },
  { id: "realtime", name: "Agent Optimisation Temps Reel", status: "active", lastRun: "temps reel", metric: "p95 latence", health: 93, endpoint: "/api/ai/realtime-ops", page: "/admin/ai/realtime-ops" },
  { id: "journey", name: "Agent Customer Journey", status: "active", lastRun: "il y a 3 min", metric: "funnel multi-etapes", health: 92, endpoint: "/api/ai/customer-journey", page: "/admin/ai/customer-journey" },
  { id: "menuEng", name: "Agent Menu Engineering", status: "active", lastRun: "il y a 1 h", metric: "matrice BCG menu", health: 90, endpoint: "/api/ai/menu-engineering", page: "/admin/ai/menu-engineering" },
  { id: "autoDecision", name: "Agent Decision Automatique", status: "active", lastRun: "il y a 40 sec", metric: "decisions sous seuil", health: 89, endpoint: "/api/ai/auto-decisions", page: "/admin/ai/auto-decisions" },
  { id: "learning", name: "Registry Auto-Learning", status: "active", lastRun: "batch horaire", metric: "drift 0.04", health: 91, endpoint: "/api/ai/learning", page: "/admin/ai/learning" },
  { id: "nextgen", name: "Innovations NEXT GEN", status: "active", lastRun: "roadmap", metric: "pilotes 6", health: 88, endpoint: "/api/ai/next-gen", page: "/admin/ai/next-gen" },
  { id: "eventPlanner", name: "Agent Event Planner", status: "active", lastRun: "a la demande", metric: "menus, decor, timeline", health: 95, endpoint: "/api/ai/event-planner", page: "/admin/ai/event-planner" },
]

const RECENT_EVENTS = [
  { timestamp: new Date(Date.now() - 10000).toISOString(), from: "eventPlanner", to: "marketing", type: "trigger", message: "Buffet Ramadan planifie → campagne SMS preparee" },
  { timestamp: new Date(Date.now() - 15000).toISOString(), from: "memory", to: "recommendation", type: "rag", message: "Tag spicy renforce → boost shawarma sur session #A12" },
  { timestamp: new Date(Date.now() - 30000).toISOString(), from: "anomaly", to: "coordinator", type: "alert", message: "Commande #8839 non livree depuis 52 min" },
  { timestamp: new Date(Date.now() - 120000).toISOString(), from: "stock", to: "pricing", type: "sync", message: "Stock pistaches critique → prix ajuste +10%" },
  { timestamp: new Date(Date.now() - 300000).toISOString(), from: "sentiment", to: "marketing", type: "trigger", message: "Avis negatif service → campagne win-back declenchee" },
  { timestamp: new Date(Date.now() - 600000).toISOString(), from: "kitchen", to: "vision", type: "query", message: "Demande verification: Table 7 prete pour service?" },
  { timestamp: new Date(Date.now() - 900000).toISOString(), from: "forecast", to: "stock", type: "prediction", message: "Hausse prevue weekend → augmenter stock poulet" },
  { timestamp: new Date(Date.now() - 750000).toISOString(), from: "analytics", to: "marketing", type: "sync", message: "KPI dessert en baisse → segmenter campagne VIP" },
  { timestamp: new Date(Date.now() - 1200000).toISOString(), from: "recommendation", to: "loyalty", type: "sync", message: "Client fidele detecte → offre personnalisee envoyee" },
]

export async function GET() {
  const avgHealth = Math.round(AGENTS.reduce((s, a) => s + a.health, 0) / AGENTS.length)
  return NextResponse.json({
    agents: AGENTS,
    recentEvents: RECENT_EVENTS,
    systemHealth: { overall: avgHealth, activeAgents: AGENTS.filter((a) => a.status === "active").length, totalAgents: AGENTS.length, eventsLast24h: 247, alertsResolved: 18, alertsPending: 4 },
    algorithm: "multi_agent_orchestrator_v1",
    generatedAt: new Date().toISOString(),
  })
}
