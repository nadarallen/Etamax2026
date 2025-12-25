'use client';

import { useState, useEffect } from 'react';
import Galaxy from './Galaxy';

export default function GalaxyBackground({ children }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            <div className="fixed inset-0 z-0">
                <Galaxy
                    mouseRepulsion={!isMobile}
                    mouseInteraction={!isMobile}
                    density={isMobile ? 0.75 : 1.5}
                    glowIntensity={0.5}
                    saturation={0.8}
                    hueShift={240}
                />
                <div
                    className="absolute inset-0 pointer-events-none z-[1]"
                    style={{ backgroundColor: 'rgba(5, 5, 20, 0.4)' }}
                />
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
