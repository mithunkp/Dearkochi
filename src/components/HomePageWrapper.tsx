import { generateOrganizationSchema } from '@/lib/seo-config';
import Script from 'next/script';

export default function HomePageWrapper({ children }: { children: React.ReactNode }) {
    const organizationSchema = generateOrganizationSchema();

    return (
        <>
            <Script
                id="organization-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            {children}
        </>
    );
}
