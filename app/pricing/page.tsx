import { PricingPageClient } from './_components/pricing-page-client';

export const metadata = {
  title: '料金プラン | xtrade',
  description:
    'xtrade の料金プランをご覧ください。無料プランから始めて、必要に応じてアップグレードできます。',
};

export default function PricingPage() {
  return <PricingPageClient />;
}
