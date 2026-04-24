"use client"

type InvoiceItem = { name: string; quantity: number; unitPrice: number }

type Props = {
  invoiceNumber: string
  date: string
  customerName: string
  items: InvoiceItem[]
  subtotal: number
  tvaRate: number
  tvaAmount: number
  total: number
  paymentMethod: string
}

export function InvoicePDF({
  invoiceNumber,
  date,
  customerName,
  items,
  subtotal,
  tvaRate,
  tvaAmount,
  total,
  paymentMethod,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200/50 bg-white p-8 shadow-sm print:border-none print:shadow-none dark:border-white/10 dark:bg-stone-900">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-amber-950 dark:text-amber-100">
            Jannat Baloudan
          </h1>
          <p className="text-sm text-amber-800/70 dark:text-amber-300/70">Restaurant syrien authentique</p>
          <p className="mt-1 text-xs text-amber-700/50 dark:text-amber-400/50">Paris, France</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-amber-950 dark:text-amber-100">{invoiceNumber}</p>
          <p className="text-sm text-amber-800/70 dark:text-amber-300/70">{date}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-amber-50/50 p-4 dark:bg-amber-950/20">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70">Client</p>
        <p className="text-sm font-medium text-amber-950 dark:text-amber-100">{customerName}</p>
      </div>

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200/50 dark:border-white/10">
            <th className="pb-2 text-left font-medium text-amber-800/70 dark:text-amber-300/70">Article</th>
            <th className="pb-2 text-center font-medium text-amber-800/70 dark:text-amber-300/70">Qte</th>
            <th className="pb-2 text-right font-medium text-amber-800/70 dark:text-amber-300/70">P.U.</th>
            <th className="pb-2 text-right font-medium text-amber-800/70 dark:text-amber-300/70">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-amber-100/30 dark:border-white/5">
              <td className="py-2 text-amber-950 dark:text-amber-100">{item.name}</td>
              <td className="py-2 text-center text-amber-900/80 dark:text-amber-200/80">{item.quantity}</td>
              <td className="py-2 text-right text-amber-900/80 dark:text-amber-200/80">{item.unitPrice.toFixed(2)}€</td>
              <td className="py-2 text-right font-medium text-amber-950 dark:text-amber-100">
                {(item.quantity * item.unitPrice).toFixed(2)}€
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-amber-800/70 dark:text-amber-300/70">
          <span>Sous-total HT</span>
          <span>{subtotal.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-amber-800/70 dark:text-amber-300/70">
          <span>TVA ({(tvaRate * 100).toFixed(0)}%)</span>
          <span>{tvaAmount.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between border-t border-amber-200/50 pt-2 text-lg font-bold text-amber-950 dark:border-white/10 dark:text-amber-100">
          <span>Total TTC</span>
          <span>{total.toFixed(2)}€</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl bg-green-50/50 p-3 text-sm dark:bg-green-950/20">
        <span className="text-green-800 dark:text-green-300">Paye par {paymentMethod}</span>
        <span className="font-medium text-green-700 dark:text-green-400">Validee</span>
      </div>

      <p className="mt-8 text-center text-xs text-amber-700/50 dark:text-amber-400/50">
        Merci de votre visite — Jannat Baloudan
      </p>
    </div>
  )
}
