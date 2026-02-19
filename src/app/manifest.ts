import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'CarubaAI - Virtual Assistant by Utero Indonesia',
        short_name: 'CarubaAI',
        description: 'CarubaAI - Virtual Assistant by Utero Indonesia',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#991b1b',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    }
}
