
import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
  iconSize?: number;
  textSize?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'dark', 
  className = '', 
  iconSize = 32,
  textSize = 'text-2xl'
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="text-accent shrink-0 flex items-center">
        <ShieldCheck size={iconSize} strokeWidth={2.5} />
      </div>
      <div className={`
        font-poppins font-black italic tracking-tighter leading-none uppercase whitespace-nowrap
        ${textSize}
        ${variant === 'light' ? 'text-white' : 'text-primary'}
      `}>
        Qualifica Já
      </div>
    </div>
  );
};

export default Logo;
