import { AlertTriangle, ShieldCheck } from "lucide-react"

export function BuyerSafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="buyer-safety-heading"
      className={compact
        ? "rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
        : "rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950 sm:p-6"}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="buyer-safety-heading" className="text-lg font-extrabold">
            Buyer safety notice — beware of fraudsters
          </h2>
          <p className="mt-2 text-sm leading-6">
            Verify the seller and the item independently before paying. Whenever possible,
            inspect the item in person. For vehicles, check ownership documents and arrange
            an independent inspection.
          </p>
          {!compact && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
              <li>Do not rush because a seller is pressuring you.</li>
              <li>Be cautious of unusually cheap offers and requests for advance deposits.</li>
              <li>Keep copies of adverts, messages, receipts and payment records.</li>
              <li>Report suspicious adverts to KFM using the report option on the advert.</li>
            </ul>
          )}
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-100 p-3 text-sm font-semibold">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              KFM listing fees pay for advertising space only. They do not guarantee that a
              seller, item, ownership claim or transaction is genuine. Buyers must make their
              own checks before completing a purchase.
            </p>
          </div>
          <p className="mt-3 text-sm font-extrabold">Stay alert. Verify first. Pay safely.</p>
        </div>
      </div>
    </section>
  )
}
