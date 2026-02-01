/**
 * Leadership Team Component
 * 
 * Investor-grade executive team showcase.
 * Professional, wealthy, authoritative presentation.
 * 
 * @component LeadershipTeam
 * @version 1.0.0
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Award,
  Briefcase,
  Building2,
  Code,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ExecutiveProfile {
  name: string;
  title: string;
  role: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  achievements?: string[];
}

interface LeadershipTeamProps {
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
}

// ============================================================================
// EXECUTIVE DATA
// ============================================================================

const executives: ExecutiveProfile[] = [
  {
    name: 'Terrence Milliner',
    title: 'Founder • Engineer • CEO',
    role: 'Chief Executive Officer',
    icon: <Code className="w-6 h-6" />,
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    accentColor: 'violet',
    achievements: [
      'Visionary Founder',
      'Lead Software Architect',
      'AI Commerce Pioneer',
    ],
  },
  {
    name: 'Tiara Smith',
    title: 'Chief Financial Officer',
    role: 'CFO',
    icon: <TrendingUp className="w-6 h-6" />,
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    accentColor: 'emerald',
    achievements: [
      'Financial Strategy',
      'Investor Relations',
      'Business Operations',
    ],
  },
];

// ============================================================================
// EXECUTIVE CARD
// ============================================================================

const ExecutiveCard: React.FC<{ 
  executive: ExecutiveProfile; 
  index: number;
  variant: LeadershipTeamProps['variant'];
}> = memo(({ executive, index, variant }) => {
  const isCompact = variant === 'compact';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className={cn(
        'relative group',
        isCompact ? 'p-4' : 'p-6 md:p-8'
      )}
    >
      {/* Background gradient glow */}
      <div className={cn(
        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        `bg-gradient-to-br ${executive.gradient}`,
        'blur-xl'
      )} />
      
      {/* Card */}
      <div className={cn(
        'relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800',
        'shadow-lg hover:shadow-2xl transition-all duration-500',
        isCompact ? 'p-4' : 'p-6 md:p-8'
      )}>
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            'p-3 rounded-xl bg-gradient-to-br shadow-lg',
            executive.gradient
          )}>
            <div className="text-white">
              {executive.icon}
            </div>
          </div>
          
          {!isCompact && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.2, type: 'spring' }}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold',
                'bg-gradient-to-r',
                executive.gradient,
                'text-white shadow-md'
              )}
            >
              {executive.role}
            </motion.div>
          )}
        </div>

        {/* Name and Title */}
        <div className="space-y-1 mb-4">
          <h3 className={cn(
            'font-bold text-slate-900 dark:text-white',
            isCompact ? 'text-lg' : 'text-2xl md:text-3xl'
          )}>
            {executive.name}
          </h3>
          <p className={cn(
            'font-medium bg-gradient-to-r bg-clip-text text-transparent',
            executive.gradient,
            isCompact ? 'text-sm' : 'text-lg'
          )}>
            {executive.title}
          </p>
        </div>

        {/* Achievements */}
        {!isCompact && executive.achievements && (
          <div className="space-y-2 mt-6">
            {executive.achievements.map((achievement, i) => (
              <motion.div
                key={achievement}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.2 + i * 0.1 }}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  `bg-${executive.accentColor}-500`
                )} />
                {achievement}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

ExecutiveCard.displayName = 'ExecutiveCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LeadershipTeam: React.FC<LeadershipTeamProps> = memo(({
  variant = 'default',
  className,
}) => {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  return (
    <section className={cn(
      'relative overflow-hidden',
      isHero ? 'py-16 md:py-24' : 'py-12 md:py-16',
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
      
      {/* Decorative elements */}
      {isHero && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        </>
      )}

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-center mb-8 md:mb-12',
            isCompact && 'mb-6'
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-emerald-500/10 border border-violet-500/20 mb-4">
            <Building2 className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent">
              Executive Leadership
            </span>
          </div>
          
          {!isCompact && (
            <>
              <h2 className={cn(
                'font-bold text-slate-900 dark:text-white mb-4',
                isHero ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-2xl md:text-3xl'
              )}>
                Meet Our Leadership
              </h2>
              <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
                Pioneering the future of AI-powered commerce
              </p>
            </>
          )}
        </motion.div>

        {/* Executive Cards */}
        <div className={cn(
          'grid gap-6 md:gap-8',
          isCompact ? 'grid-cols-2' : 'md:grid-cols-2 max-w-4xl mx-auto'
        )}>
          {executives.map((executive, index) => (
            <ExecutiveCard
              key={executive.name}
              executive={executive}
              index={index}
              variant={variant}
            />
          ))}
        </div>

        {/* Trust Indicator */}
        {isHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-6 mt-12 text-sm text-slate-500 dark:text-slate-400"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Investor Backed</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-500" />
              <span>Industry Leaders</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span>AI Commerce Pioneers</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
});

LeadershipTeam.displayName = 'LeadershipTeam';

export default LeadershipTeam;
