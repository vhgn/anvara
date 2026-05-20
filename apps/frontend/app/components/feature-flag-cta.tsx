import { getFeatureFlag } from '@/lib/api';

export async function FeatureFlagCta() {
  const text = await getFeatureFlag('home_page_button')

  return (
    <a
      href="/login"
      className="rounded-lg bg-[--color-primary] px-6 py-3 text-white hover:bg-[--color-primary-hover]"
    >
      {text}
    </a>
  );
}
