'use client'
import { motion } from 'framer-motion';

/* The travelling light-beam block, lifted verbatim from sign-in-card-2.tsx.
   Only the surrounding sign-in form is dropped; every beam, delay, blur and
   corner spot is the donor code unchanged. Drop it inside any position:relative
   card to get the four beams running its edges. */

export function TravelingBeams({ radius = 16 }: { radius?: number }) {
  return (
    /* Traveling light beam effect - reduced opacity */
    <div className="absolute -inset-[1px] overflow-hidden" style={{ borderRadius: radius }} aria-hidden="true">
      {/* Top light beam - enhanced glow */}
      <motion.div
        className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
        initial={{ filter: "blur(2px)" }}
        animate={{
          left: ["-50%", "100%"],
          opacity: [0.3, 0.7, 0.3],
          filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
        }}
        transition={{
          left: {
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1
          },
          opacity: {
            duration: 1.2,
            repeat: Infinity,
            repeatType: "mirror"
          },
          filter: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: "mirror"
          }
        }}
      />

      {/* Right light beam - enhanced glow */}
      <motion.div
        className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
        initial={{ filter: "blur(2px)" }}
        animate={{
          top: ["-50%", "100%"],
          opacity: [0.3, 0.7, 0.3],
          filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
        }}
        transition={{
          top: {
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1,
            delay: 0.6
          },
          opacity: {
            duration: 1.2,
            repeat: Infinity,
            repeatType: "mirror",
            delay: 0.6
          },
          filter: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: "mirror",
            delay: 0.6
          }
        }}
      />

      {/* Bottom light beam - enhanced glow */}
      <motion.div
        className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
        initial={{ filter: "blur(2px)" }}
        animate={{
          right: ["-50%", "100%"],
          opacity: [0.3, 0.7, 0.3],
          filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
        }}
        transition={{
          right: {
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1,
            delay: 1.2
          },
          opacity: {
            duration: 1.2,
            repeat: Infinity,
            repeatType: "mirror",
            delay: 1.2
          },
          filter: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: "mirror",
            delay: 1.2
          }
        }}
      />

      {/* Left light beam - enhanced glow */}
      <motion.div
        className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
        initial={{ filter: "blur(2px)" }}
        animate={{
          bottom: ["-50%", "100%"],
          opacity: [0.3, 0.7, 0.3],
          filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
        }}
        transition={{
          bottom: {
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1,
            delay: 1.8
          },
          opacity: {
            duration: 1.2,
            repeat: Infinity,
            repeatType: "mirror",
            delay: 1.8
          },
          filter: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: "mirror",
            delay: 1.8
          }
        }}
      />

      {/* Subtle corner glow spots - reduced opacity */}
      <motion.div
        className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
        animate={{
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />
      <motion.div
        className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
        animate={{
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          repeatType: "mirror",
          delay: 0.5
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
        animate={{
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
        animate={{
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 2.3,
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1.5
        }}
      />
    </div>
  );
}
