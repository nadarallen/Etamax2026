'use client';

import React from 'react';

const PlanetIcon = ({ day, size = 'small' }) => {
    const dayNum = Number(day);
    // Size classes
    const sizeClasses = size === 'large' ? 'w-full h-full' : 'w-8 h-8';

    // Common styles
    // Added stronger shadow for 3D effect
    const basePlanetStyle = "w-full h-full rounded-full relative overflow-hidden shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.8),0_0_10px_rgba(0,0,0,0.3)]";

    // Day 1: Terra (Blue/Green) - Dynamic Earth-like
    if (dayNum === 1) {
        return (
            <div className={`${sizeClasses} relative flex-shrink-0 group`}>
                <div className={`${basePlanetStyle} bg-[#1a4b8c] ring-2 ring-blue-400/20`}>
                    {/* Ocean Base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-900 opacity-80"></div>

                    {/* Moving Clouds/Land Texture */}
                    <div className="absolute inset-0 w-[300%] h-full opacity-90"
                        style={{
                            background: 'url("https://grainy-gradients.vercel.app/noise.svg"), linear-gradient(90deg, transparent 0%, #4ade80 15%, transparent 30%, #4ade80 50%, transparent 70%, #4ade80 85%, transparent 100%)',
                            backgroundSize: 'auto, 50% 80%',
                            filter: 'blur(1px)'
                        }}
                    />

                    {/* Clouds Layer 2 */}
                    <div className="absolute inset-0 w-[300%] h-full opacity-40 mix-blend-overlay"
                        style={{
                            background: 'linear-gradient(90deg, white 0%, transparent 20%, white 40%, transparent 60%, white 80%, transparent 100%)',
                            backgroundSize: '40% 100%'
                        }}
                    />

                    {/* Atmosphere Glow */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_4px_4px_12px_rgba(100,200,255,0.4)]"></div>
                </div>
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            </div>
        );
    }

    // Day 2: Mars (Red/Orange) - Fiery/Rocky
    if (dayNum === 2) {
        return (
            <div className={`${sizeClasses} relative flex-shrink-0 group`}>
                <div className={`${basePlanetStyle} bg-[#7f1d1d] ring-2 ring-red-500/20`}>
                    {/* Magma Base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-[#450a0a]"></div>

                    {/* Moving Texture */}
                    <div className="absolute inset-0 w-[200%] h-full"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.4) 10%, transparent 20%), radial-gradient(circle at 20% 80%, rgba(0,0,0,0.4) 5%, transparent 15%)',
                            backgroundSize: '50% 50%'
                        }}
                    />
                    <div className="absolute inset-0 w-[200%] h-full opacity-60 mix-blend-color-dodge"
                        style={{
                            background: 'repeating-linear-gradient(90deg, transparent 0px, #fca5a5 2px, transparent 4px, transparent 20px)'
                        }}
                    />

                    {/* Atmosphere Glow */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_4px_4px_12px_rgba(255,100,100,0.4)]"></div>
                </div>
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            </div>
        );
    }

    // Day 3: Gas Giant (Purple/Gold) - Majestic
    if (dayNum === 3) {
        return (
            <div className={`${sizeClasses} relative flex-shrink-0 flex items-center justify-center group`}>
                {/* Ring (Behind) */}
                <div className="absolute w-[160%] h-[40%] border-[6px] border-purple-400/30 rounded-[50%] skew-x-12 rotate-[-15deg] blur-[1px]"></div>
                <div className="absolute w-[150%] h-[35%] border-[2px] border-white/40 rounded-[50%] skew-x-12 rotate-[-15deg]"></div>

                {/* Planet Body */}
                <div className={`${basePlanetStyle} ${size === 'large' ? 'w-[75%] h-[75%]' : 'w-6 h-6'} z-10 bg-[#581c87] ring-2 ring-purple-400/20`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#3b0764] via-[#6b21a8] to-[#3b0764]"></div>

                    {/* Banded Gas Texture */}
                    <div className="absolute inset-0 w-full h-[200%]"
                        style={{
                            background: 'repeating-linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.1) 10%, transparent 20%, rgba(0,0,0,0.2) 30%, transparent 40%)',
                            backgroundSize: '100% 50%'
                        }}
                    />
                    <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_10px_rgba(216,180,254,0.5)]"></div>
                </div>
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            </div>
        );
    }

    // Fallback
    return (
        <div className={`${sizeClasses} relative flex-shrink-0`}>
            <div className={`${basePlanetStyle} bg-gray-700`}>
                <div className="absolute inset-0 rounded-full shadow-[inset_2px_2px_4px_rgba(255,255,255,0.2)]"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/50">?</div>
            </div>
        </div>
    );
};

export default PlanetIcon;
