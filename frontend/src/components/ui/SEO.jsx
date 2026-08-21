/**
 * SEO Component — Dynamic Meta Tags for Every Page
 * ==================================================
 * Uses react-helmet-async to inject page-specific:
 *   - <title> tag
 *   - meta description
 *   - Open Graph (og:*) tags for social sharing
 *   - Twitter Card tags
 *   - Canonical URL
 *   - JSON-LD structured data (for Google Rich Results)
 */
import { Helmet } from "react-helmet-async";

const SITE_NAME = "Vrital — AI Virtual Try-On Fashion";
const SITE_URL = "https://vrital.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export default function SEO({
  title,
  description = "Discover fashion with AI-powered virtual try-on. Shop top brands and see how clothes look on you before buying.",
  image = DEFAULT_IMAGE,
  type = "website",
  canonical,
  price,
  currency = "USD",
  availability = "in stock",
  brand,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  const productJsonLd =
    price && !jsonLd
      ? {
          "@context": "https://schema.org/",
          "@type": "Product",
          name: title,
          description,
          image,
          brand: brand ? { "@type": "Brand", name: brand } : undefined,
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: currency,
            availability: `https://schema.org/${availability === "in stock" ? "InStock" : "OutOfStock"}`,
            url: canonicalUrl,
          },
        }
      : null;

  const structuredData = jsonLd || productJsonLd;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
