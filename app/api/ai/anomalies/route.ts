import { NextResponse } from "next/server"

type Anomaly = {
  id: string
  type: "high_total" | "delayed_order" | "invoice_mismatch" | "stock_drop" | "revenue_anomaly"
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  affectedEntity: string
  suggestedAction: string
  detectedAt: string
  resolved: boolean
}

function generateAnomalies(): Anomaly[] {
  const now = new Date()
  return [
    {
      id: "ANO-001",
      type: "high_total",
      severity: "warning",
      title: "Commande au montant inhabituellement eleve",
      description: "Commande #ORD-8847 a un total de 245.00 EUR, soit 3.2x la moyenne (76.50 EUR).",
      affectedEntity: "ORD-8847",
      suggestedAction: "Verifier les articles de la commande et confirmer avec le client.",
      detectedAt: new Date(now.getTime() - 1800000).toISOString(),
      resolved: false,
    },
    {
      id: "ANO-002",
      type: "delayed_order",
      severity: "critical",
      title: "Commande non livree depuis 52 minutes",
      description: "Commande #ORD-8839 pour la Table 7 n'a pas ete servie depuis 52 min (seuil: 45 min).",
      affectedEntity: "ORD-8839",
      suggestedAction: "Contacter la cuisine immediatement et informer le client.",
      detectedAt: new Date(now.getTime() - 3120000).toISOString(),
      resolved: false,
    },
    {
      id: "ANO-003",
      type: "invoice_mismatch",
      severity: "warning",
      title: "Ecart facture vs commande",
      description: "Facture INV-4421 (89.50 EUR) ne correspond pas a la commande ORD-8835 (82.00 EUR). Ecart: 7.50 EUR.",
      affectedEntity: "INV-4421",
      suggestedAction: "Verifier les extras et corrections manuelles sur cette facture.",
      detectedAt: new Date(now.getTime() - 7200000).toISOString(),
      resolved: false,
    },
    {
      id: "ANO-004",
      type: "stock_drop",
      severity: "critical",
      title: "Baisse de stock anormale — Pistaches",
      description: "Stock de pistaches a chute de 5kg a 1.2kg sans commandes correspondantes (perte estimee: 3.8kg).",
      affectedEntity: "Pistaches",
      suggestedAction: "Verifier les enregistrements de stock et investiguer une possible perte ou vol.",
      detectedAt: new Date(now.getTime() - 14400000).toISOString(),
      resolved: false,
    },
    {
      id: "ANO-005",
      type: "revenue_anomaly",
      severity: "info",
      title: "Revenus en dessous de la moyenne",
      description: "Revenus du jour (420 EUR) sont a 58% de la moyenne glissante (725 EUR).",
      affectedEntity: "Revenue journaliere",
      suggestedAction: "Verifier s'il y a un evenement externe ou un probleme technique affectant les commandes.",
      detectedAt: new Date(now.getTime() - 600000).toISOString(),
      resolved: false,
    },
    {
      id: "ANO-006",
      type: "delayed_order",
      severity: "warning",
      title: "Commande en preparation depuis 38 minutes",
      description: "Commande #ORD-8844 approche le seuil de 45 min. Temps de preparation moyen: 22 min.",
      affectedEntity: "ORD-8844",
      suggestedAction: "Verifier avec la cuisine l'avancement de cette commande.",
      detectedAt: new Date(now.getTime() - 900000).toISOString(),
      resolved: false,
    },
  ]
}

export async function GET() {
  const anomalies = generateAnomalies()
  return NextResponse.json({
    anomalies,
    summary: {
      total: anomalies.length,
      critical: anomalies.filter((a) => a.severity === "critical").length,
      warning: anomalies.filter((a) => a.severity === "warning").length,
      info: anomalies.filter((a) => a.severity === "info").length,
      unresolved: anomalies.filter((a) => !a.resolved).length,
    },
    algorithm: "statistical_outlier_detection_v1",
    generatedAt: new Date().toISOString(),
  })
}
