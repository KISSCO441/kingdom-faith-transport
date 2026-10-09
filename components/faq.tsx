"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
{
question: "How do I book a KFM ride?",
answer:
"Visit the KFM Transport website, complete the ride booking form with your pickup location and destination, select your preferred vehicle, and submit your request. Keep your booking number so you can refer to your ride when contacting KFM.",
},
{
question: "Which areas does KFM Transport serve?",
answer:
"KFM Okada services focus on Nsawam and nearby communities. Car services can operate within Nsawam, nearby towns, and other destinations across the Eastern Region, subject to availability and the confirmed fare.",
},
{
question: "How much does a KFM ride cost?",
answer:
"Your fare depends on the service, route, distance, and applicable pricing. Check the fare displayed or confirmed for your booking before travelling. Contact KFM if you need help confirming a fare.",
},
{
question: "How do I pay for my ride?",
answer:
"Please follow the payment instructions confirmed by KFM for your booking. KFM's centralised online payment and driver settlement system is being planned, so online payment availability should not be assumed until it is activated.",
},
{
question: "How can I cancel or change a booking?",
answer:
"Contact KFM as soon as possible if you need to change or cancel a booking. Provide your booking number and explain the change you need. Any applicable cancellation terms should be confirmed by KFM.",
},
{
question: "How can I become a KFM driver?",
answer:
"Interested drivers can use the driver registration option on the KFM Transport website, submit the requested information, and follow KFM's verification process. Driver approval is required before accessing eligible driver services.",
},
{
question: "Can I find a mechanic through KFM?",
answer:
"Yes. Visit the Car Servicing directory to browse listed mechanics, search by service, view available map information, and use the published contact details. Customers can contact mechanics and arrange services directly with them.",
},
{
question: "Can I order items from Nsawam Market?",
answer:
"Yes. Visit the KFM Nsawam Market section to explore listed products and follow the available ordering instructions. For items not shown in the catalogue, contact KFM to ask about availability and current prices.",
},
{
question: "How do I contact KFM for assistance?",
answer:
"Call or WhatsApp KFM on 0240 555 688, email [kingdomfaithtransport@gmail.com](mailto:kingdomfaithtransport@gmail.com), or use the Live Chat link on the website. When asking about an existing booking or order, include its reference number.",
},
]

export function FAQ() {
const [openIndex, setOpenIndex] = useState<number | null>(null)

return ( <section
   id="faqs"
   className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8"
 > <div className="mx-auto max-w-4xl"> <div className="text-center"> <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">
KFM SUPPORT </p>


      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Frequently Asked Questions
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
        Find answers about rides, fares, drivers, market orders, and our
        other services.
      </p>
    </div>

    <div className="mt-10 space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index

        return (
          <div
            key={faq.question}
            className="overflow-hidden rounded-xl border border-border bg-background"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold transition-colors hover:text-primary"
            >
              <span>{faq.question}</span>

              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-border px-5 py-4 leading-7 text-muted-foreground">
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  </div>
</section>


)
}
