import Script from "next/script";
import LandingPage from "@/components/LandingPage";
import { companyInfo, faqItems, siteMeta } from "@/content/site";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: companyInfo.name,
  description: siteMeta.description,
  url: siteMeta.url,
  telephone: companyInfo.phone,
  email: companyInfo.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: companyInfo.address.streetAddress,
    addressLocality: companyInfo.address.addressLocality,
    addressRegion: companyInfo.address.addressRegion,
    postalCode: companyInfo.address.postalCode,
    addressCountry: companyInfo.address.addressCountry,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: companyInfo.geo.latitude,
    longitude: companyInfo.geo.longitude,
  },
  areaServed: "Mexico",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function Home() {
  return (
    <>
      <Script id="schema-local-business" type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </Script>
      <Script id="schema-faq" type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </Script>
      <LandingPage />
    </>
  );
}
