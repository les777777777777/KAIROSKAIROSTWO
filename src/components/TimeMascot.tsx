import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeMascotProps {
  streak: number;
  balance: number; // 0 to 100
  className?: string;
}

export const TimeMascot: React.FC<TimeMascotProps> = ({ streak, balance, className = 'py-4 md:py-10' }) => {
  // Moods based on balance
  const getMood = () => {
    if (balance < 30) return 'sad'; // Blue/Sad
    if (balance < 50) return 'tired'; // Grey/Tired
    if (balance < 80) return 'neutral'; // Yellow/Neutral
    return 'happy'; // Red-Orange/Happy
  };

  const mood = getMood();

  // Evolution stages - just scale for minimalism
  const getStage = (s: number) => {
    if (s >= 16) return 3;
    if (s >= 8) return 2;
    if (s >= 4) return 1;
    return 0;
  };

  const stage = getStage(streak);

  // Visual properties based on mood
  const getMoodConfig = () => {
    switch (mood) {
      case 'happy': return {
        color: '#ff6b6b', // Soft Red-Orange
        glow: 'rgba(255, 107, 107, 0.4)',
        mouth: "M85 135 Q100 155 115 135" // Happy smile
      };
      case 'neutral': return {
        color: '#fcc419', // emoji yellow
        glow: 'rgba(252, 196, 25, 0.3)',
        mouth: "M90 140 Q100 145 110 140" // Neutral smile
      };
      case 'tired': return {
        color: '#adb5bd', // Soft Grey
        glow: 'rgba(173, 181, 189, 0.2)',
        mouth: "M90 145 Q100 140 110 145" // Tired flat
      };
      case 'sad': return {
        color: '#4dabf7', // Soft Blue
        glow: 'rgba(77, 171, 247, 0.3)',
        mouth: "M85 150 Q100 135 115 150" // Sad curve
      };
      default: return {
        color: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.3)',
        mouth: "M90 140 Q100 145 110 140"
      };
    }
  };

  const config = getMoodConfig();
  const size = 130 + (stage * 20);

  // Messages
  const getMessages = () => {
    if (mood === 'sad') return ["Necesito un poco de motivación...", "¿Podemos intentar algo pequeño?"];
    if (mood === 'tired') return ["Un respiro vendría bien.", "Paso a paso, está bien."];
    if (mood === 'happy') return ["¡Me siento increíble hoy!", "¡Tu energía es contagiosa!"];
    return ["Todo va por buen camino.", "Me gusta este equilibrio."];
  };

  const messages = getMessages();
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-visible ${className}`}>
      {/* Dynamic Multi-layered Aura */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{ backgroundColor: config.color }}
          className="absolute w-[400px] h-[400px] rounded-[35%] blur-[110px]"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.12, 0.22, 0.12],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ backgroundColor: config.color }}
          className="absolute w-[450px] h-[450px] rounded-[45%] blur-[130px]"
        />
      </div>

      {/* Floating Particles - More sophisticated */}
      <div className="absolute inset-0 overflow-visible pointer-events-none -z-5">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 240 - 120, 
              y: Math.random() * 240 - 120,
              opacity: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              y: [-20, -60, -20],
              x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30],
              opacity: [0, 0.5, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 7 + Math.random() * 7,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeInOut"
            }}
            className="absolute w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: config.color, 
              filter: 'blur(2px)',
              boxShadow: `0 0 10px ${config.color}`
            }}
          />
        ))}
      </div>

      {/* Circular Progress Ring - Representing Harmony */}
      <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
        <svg width={size + 100} height={size + 100} viewBox="0 0 240 240" className="opacity-40">
          <circle
            cx="120"
            cy="120"
            r="110"
            fill="none"
            stroke="white"
            strokeWidth="1"
            className="opacity-20"
          />
          <motion.circle
            cx="120"
            cy="120"
            r="110"
            fill="none"
            stroke={config.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="691"
            initial={{ strokeDashoffset: 691 }}
            animate={{ strokeDashoffset: 691 - (691 * balance) / 100 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          />
        </svg>
      </div>

      {/* Mascot character with floating movement */}
      <motion.div
        className="relative cursor-pointer z-10 flex items-center justify-center w-full"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 1, 0, -1, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${stage}-${mood}`}
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
            style={{ width: size, height: size }}
            className="flex items-center justify-center drop-shadow-xl"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                  <stop offset="100%" stopColor={config.color} />
                </linearGradient>
                <filter id="softGlow">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                </filter>
              </defs>

              {/* Organic Blob Body - Irregular and animated */}
              <motion.path
                fill={config.color}
                animate={{
                  d: [
                    "M100,25 C145,25 175,55 175,100 C175,145 145,175 100,175 C55,175 25,145 25,100 C25,55 55,25 100,25",
                    "M100,30 C150,25 180,60 170,105 C160,150 140,180 95,170 C50,160 20,135 30,95 C40,55 50,35 100,30",
                    "M100,25 C140,30 170,50 175,95 C180,140 150,170 105,175 C60,180 30,150 25,105 C20,60 60,20 100,25"
                  ]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.path
                fill="url(#bodyGradient)"
                opacity="0.6"
                animate={{
                  d: [
                    "M100,25 C145,25 175,55 175,100 C175,145 145,175 100,175 C55,175 25,145 25,100 C25,55 55,25 100,25",
                    "M100,30 C150,25 180,60 170,105 C160,150 140,180 95,170 C50,160 20,135 30,95 C40,55 50,35 100,30",
                    "M100,25 C140,30 170,50 175,95 C180,140 150,170 105,175 C60,180 30,150 25,105 C20,60 60,20 100,25"
                  ]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Character Face - Asymmetric and expressive */}
              <motion.g 
                className="pointer-events-none"
                animate={{
                  y: [0, -2, 0],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Eyes - Softening the symmetry */}
                <motion.ellipse
                  cx="72" cy="98" rx="4.5" ry="6.5"
                  fill="#2d3436"
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
                />
                <motion.ellipse
                  cx="128" cy="96" rx="4.2" ry="6.2"
                  fill="#2d3436"
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1], delay: 0.1 }}
                />

                {/* Mouth based on mood */}
                <motion.path
                  d={config.mouth}
                  fill="none"
                  stroke="#2d3436"
                  strokeWidth="4"
                  strokeLinecap="round"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    x: [0, 1, -1, 0]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />

                {/* Blushed cheeks */}
                {mood === 'happy' && (
                  <>
                    <circle cx="58" cy="115" r="7" fill="black" opacity="0.05" />
                    <circle cx="142" cy="112" r="7" fill="black" opacity="0.05" />
                  </>
                )}
              </motion.g>
            </svg>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Message Bubble - Smooth transitions */}
      <div className="h-20 flex items-center justify-center mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="px-6 py-3 bg-white/60 backdrop-blur-lg border border-white/40 rounded-3xl shadow-lg max-w-[260px] text-center z-20"
          >
            <p className="text-sm font-bold text-slate-800 tracking-tight">
              {messages[messageIndex]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};