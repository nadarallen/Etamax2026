'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Splash() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/events');
        }, 3000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-galaxy-dark overflow-hidden z-50">
            <div className="stars absolute inset-0"></div>
            <div className="text-center space-y-4">
                <motion.h1
                    className="text-xl md:text-3xl font-medium tracking-[0.5em] text-galaxy-purple uppercase"
                    initial={{ opacity: 0, letterSpacing: "1em" }}
                    animate={{ opacity: 1, letterSpacing: "0.5em" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                >
                    Introducing
                </motion.h1>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                >
                    <h2 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter drop-shadow-2xl">
                        ETAMAX
                    </h2>
                    <h2 className="text-4xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-[0.2em] -mt-2 md:-mt-4 relative z-10 drop-shadow-lg">
                        2026
                    </h2>
                    <h2 className="text-3xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-purple-500 to-indigo-300 tracking-[0.3em] mt-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        NAKSHATRA
                    </h2>
                </motion.div>
            </div>
        </div>
    );
}
