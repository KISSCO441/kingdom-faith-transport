import { RidePaymentCheckout } from "@/components/ride-payment-checkout";

export default async function RidePaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <RidePaymentCheckout token={token} />;
}
