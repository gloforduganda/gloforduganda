"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Heart, ArrowRight } from "lucide-react";

export function DonateSuccessClient({
  donationInfo,
}: {
  donationInfo: { amount: string; campaign?: string; donorName?: string } | null;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[rgb(var(--token-success)/0.12)]"
      >
        <CheckCircle2 className="h-14 w-14 text-[var(--color-success)]" strokeWidth={1.5} />
      </motion.div>

      {/* Floating hearts */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: "100vh", x: `${10 + i * 15}vw`, opacity: 0 }}
            animate={{ y: "-20vh", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5 + i * 0.3, delay: 0.3 + i * 0.15, ease: "easeOut" }}
            className="absolute bottom-0"
          >
            <Heart className="h-5 w-5 fill-[var(--color-primary)] text-[var(--color-primary)] opacity-60" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {donationInfo?.donorName ? `Thank you, ${donationInfo.donorName}!` : "Thank you!"}
        </h1>

        {donationInfo ? (
          <p className="text-lg text-[var(--color-muted-fg)]">
            Your gift of{" "}
            <span className="font-semibold text-[var(--color-primary)]">{donationInfo.amount}</span>
            {donationInfo.campaign ? (
              <>
                {" "}to <span className="font-semibold text-[var(--color-fg)]">{donationInfo.campaign}</span>
              </>
            ) : null}{" "}
            is being processed.
          </p>
        ) : (
          <p className="text-lg text-[var(--color-muted-fg)]">
            Your donation is being processed.
          </p>
        )}

        <p className="text-sm text-[var(--color-muted-fg)]">
          You&apos;ll receive a confirmation email with a receipt shortly.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-10 flex flex-wrap justify-center gap-4"
      >
        <Link
          href="/donate"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
        >
          <Heart className="h-4 w-4" /> Donate again
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
        >
          Back to site <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </main>
  );
}
