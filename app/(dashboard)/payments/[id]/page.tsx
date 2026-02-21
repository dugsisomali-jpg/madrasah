import { PaymentDetailContent } from './PaymentDetailContent';

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Payment detail</h1>
      <PaymentDetailContent paymentId={id} />
    </div>
  );
}
