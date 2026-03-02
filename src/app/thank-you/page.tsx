import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ReceiptText, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Payment completed successfully.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/thank-you',
  },
};

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function formatCurrency(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = (await searchParams) || {};
  const orderId = getParam(resolvedParams.orderId);
  const reference = getParam(resolvedParams.reference);
  const amount = formatCurrency(getParam(resolvedParams.amount));
  const name = getParam(resolvedParams.name);
  const source = getParam(resolvedParams.source);
  const product = getParam(resolvedParams.product);

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border-2 border-black bg-white p-6 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-700" />
        </div>
        <h1 className="text-center text-3xl font-black">Thank You!</h1>
        <p className="mt-3 text-center text-sm text-gray-600">
          Your payment was received and your order is now being processed.
        </p>

        <div className="mt-8 space-y-3 rounded-2xl border bg-gray-50 p-4">
          {name && (
            <p className="text-sm">
              <span className="font-bold">Customer:</span> {name}
            </p>
          )}
          {amount && (
            <p className="text-sm">
              <span className="font-bold">Amount Paid:</span> Ksh {amount}
            </p>
          )}
          {orderId && (
            <p className="text-sm">
              <span className="font-bold">Order ID:</span> {orderId}
            </p>
          )}
          {reference && (
            <p className="text-sm break-all">
              <span className="font-bold">Payment Reference:</span> {reference}
            </p>
          )}
          {source === 'product' && product && (
            <p className="text-sm">
              <span className="font-bold">Product:</span> {product}
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/" className="block">
            <Button className="h-12 w-full rounded-full font-bold" size="lg">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
          <Link href="/bags" className="block">
            <Button variant="outline" className="h-12 w-full rounded-full font-bold" size="lg">
              <ReceiptText className="mr-2 h-4 w-4" />
              Browse Bags
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
