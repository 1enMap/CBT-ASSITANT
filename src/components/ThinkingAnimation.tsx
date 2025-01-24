import React from 'react';
import { motion } from 'framer-motion';

export const ThinkingAnimation: React.FC = () => {
  return (
    <div className="flex items-center gap-2 p-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8 }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="w-3 h-3 bg-indigo-600 rounded-full"
        />
      ))}
    </div>
  );
};