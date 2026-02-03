import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://etamax2026.in';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/dashboard/',
                '/admin/',
                '/profile/',
                '/_next/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
