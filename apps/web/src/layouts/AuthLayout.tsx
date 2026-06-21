import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AuthLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Dynamic/Animated Ambient Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-[20%] -left-[10%] h-[60%] w-[50%] rounded-full bg-gradient-to-br from-indigo-600/30 to-violet-500/10 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -90, 0],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-[20%] -right-[10%] h-[60%] w-[50%] rounded-full bg-gradient-to-tr from-blue-600/30 to-cyan-500/10 blur-[120px]"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />

      {/* Auth Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md p-4 flex flex-col items-center"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-white shadow-lg shadow-primary/20 mb-3">
            <span className="font-extrabold text-2xl tracking-tighter">Ed</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit">
            EdTech <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">AI Platform</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Học tập cá nhân hóa & Trợ lý học tập AI thông minh
          </p>
        </div>

        <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};
