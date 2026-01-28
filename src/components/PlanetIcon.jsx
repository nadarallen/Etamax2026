'use client';

import React from 'react';

const PlanetIcon = ({ day, size = 'small' }) => {
    const dayNum = Number(day);
    // Size classes
    const sizeClasses = size === 'large' ? 'w-full h-full' : 'w-8 h-8';

    // Map days to image paths
    const imagePath = `/planets/day${dayNum}.png`;

    return (
        <div className={`${sizeClasses} relative flex-shrink-0 group rounded-full overflow-hidden`}>
            {/* Use standard img tag to avoid potential Next.js Image issues */}
            <img
                src={imagePath}
                alt={`Day ${dayNum} Planet`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Optional: Overlay/Shadow */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"></div>
        </div>
    );
};

export default PlanetIcon;
