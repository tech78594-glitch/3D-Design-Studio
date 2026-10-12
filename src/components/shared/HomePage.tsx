/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Box, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { DesignSection, StudioThemeMode } from '../../types/cad';

interface HomePageProps {
  themeMode: StudioThemeMode;
  onSelectSection: (section: DesignSection) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ themeMode, onSelectSection }) => {
  const isLight = themeMode === 'light';
  const isBlueprint = themeMode === 'blueprint';

  return (
    <div
      className={`flex flex-col w-full h-screen overflow-y-auto overflow-x-hidden font-sans antialiased transition-colors ${
        isLight
          ? 'bg-slate-100 text-slate-900'
          : isBlueprint
          ? 'bg-[#001733] text-cyan-100'
          : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Ambient background glow, matching the studio's branded accent colors */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[32rem] h-[32rem] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-24 w-[32rem] h-[32rem] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center w-full max-w-5xl mx-auto px-6 py-16 sm:py-24 gap-14">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center text-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Box className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase flex items-center justify-center gap-2">
              <span>3D CAD Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 align-middle">
                PRO
              </span>
            </h1>
            <p
              className={`mt-2 text-sm font-mono flex items-center justify-center gap-2 ${
                isLight ? 'text-slate-500' : 'text-zinc-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Real-time parametric CAD, in your browser
            </p>
          </div>
        </motion.div>

        {/* Workspace Picker Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full"
        >
          <HomeCard
            id="home_card_cad_design"
            icon={<Box className="w-7 h-7" />}
            title="CAD Design"
            subtitle="Tech Device CAD"
            description="Design and inspect consumer electronics with precision parametric parts, PBR materials, and real-time clash detection."
            accent="from-blue-600 to-indigo-600"
            isLight={isLight}
            isBlueprint={isBlueprint}
            onClick={() => onSelectSection('technology')}
          />
          <HomeCard
            id="home_card_architectural_bim"
            icon={<Building2 className="w-7 h-7" />}
            title="Architectural BIM"
            subtitle="Building Design"
            description="Model buildings and structures with architectural components, floor plans, and building information workflows."
            accent="from-emerald-600 to-teal-600"
            isLight={isLight}
            isBlueprint={isBlueprint}
            onClick={() => onSelectSection('building')}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`text-xs font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}
        >
          Pick a workspace to get started — you can switch anytime from the header.
        </motion.p>
      </div>
    </div>
  );
};

interface HomeCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  isLight: boolean;
  isBlueprint: boolean;
  onClick: () => void;
}

const HomeCard: React.FC<HomeCardProps> = ({
  id,
  icon,
  title,
  subtitle,
  description,
  accent,
  isLight,
  isBlueprint,
  onClick,
}) => {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-start gap-4 p-6 sm:p-8 rounded-2xl border text-left shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl ${
        isLight
          ? 'bg-white/80 border-slate-200 hover:border-slate-300'
          : isBlueprint
          ? 'bg-[#002552]/80 border-blue-900/60 hover:border-blue-700/80'
          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
      } backdrop-blur-xl`}
    >
      <div
        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-lg`}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
              isLight ? 'bg-slate-200 text-slate-600' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {subtitle}
          </span>
        </div>
        <p className={`mt-2 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
          {description}
        </p>
      </div>
      <div
        className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${
          isLight ? 'text-blue-600' : 'text-blue-400'
        }`}
      >
        <span>Open workspace</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
};
