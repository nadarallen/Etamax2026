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
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5 }}
                className="text-center"
            >
                <h1 className="text-4xl md:text-6xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-galaxy-purple to-pink-500 drop-shadow-lg">
                    Introducing
                </h1>
                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-5xl md:text-8xl font-extrabold text-white mt-4 tracking-wider"
                >
                    ETAMAX 2026
                </motion.h2>
            </motion.div>
        </div>
    );
}
