"use client";

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type Props = {
    message?: string;
};

export function ScreenLoader({ message = "Loading Data..." }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Disable scroll while loader is active
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    if (!mounted) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="
                fixed inset-0
                z-[99999]
                flex items-center justify-center
                bg-[rgba(241,245,249,0.8)] backdrop-blur-lg
            "
        >
            <div className="flex flex-col items-center gap-6">

                {/* Spinner Section */}
                <div className="relative flex items-center justify-center">

                    {/* Glow */}
                    <div className="absolute h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />

                    {/* Outer Ring */}
                    <motion.div
                        className="
                            h-32 w-32
                            rounded-full
                            border-[6px]
                            border-sky-500/20
                            border-t-sky-500
                        "
                        animate={{ rotate: 360 }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            ease: "linear",
                        }}
                    />

                    {/* Inner Ring */}
                    <motion.div
                        className="
                            absolute
                            h-20 w-20
                            rounded-full
                            border-[5px]
                            border-emerald-500/25
                            border-b-emerald-500
                        "
                        animate={{ rotate: -360 }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.6,
                            ease: "linear",
                        }}
                    />
                </div>

                {/* Text */}
                <div className="text-center">
                    <p className="text-slate-700 text-lg font-semibold tracking-wide">
                        {message}
                    </p>
                    <p className="text-slate-500 text-sm mt-1 tracking-wider">
                        Please Wait ...
                    </p>
                </div>

            </div>
        </motion.div>,
        document.body
    );
}
