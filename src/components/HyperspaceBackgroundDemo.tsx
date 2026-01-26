"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export function HyperspaceBackgroundDemo() {
    const router = useRouter()

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/events")
        }, 3000)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden rounded-lg bg-transparent">
            {/* Background is provided by layout.js */}
            <div className="z-10 text-center space-y-4">
                <motion.h1
                    className="text-xl md:text-3xl font-medium tracking-[0.5em] text-white uppercase"
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
                    <h2 className="text-4xl md:text-7xl font-bold text-white/20 tracking-[0.2em] -mt-2 md:-mt-4">
                        2026
                    </h2>
                </motion.div>
            </div>
        </div>
    )
}
