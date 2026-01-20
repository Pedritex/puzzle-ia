
import React from 'react';

interface HeaderProps {
  moves: number;
  time: number;
  isSolved: boolean;
  onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ moves, time, isSolved, onReset }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full flex flex-row items-center justify-between px-6 lg:px-12 py-3 lg:py-5 border-b border-[#d2b48c]/20 bg-white/40 backdrop-blur-md z-[5000]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 lg:w-10 lg:h-10 wood-texture rounded-xl flex items-center justify-center border border-[#8b5a2b] shadow-md">
          <i className="fas fa-magic text-[#d2b48c] text-sm lg:text-base"></i>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-xl lg:text-2xl font-bold text-[#3e2723] tracking-tight leading-none">
            Puzzles de Ensueño
          </h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#8b5a2b] font-black opacity-60">IA Art Studio</p>
        </div>
      </div>

      <div className="flex items-center gap-6 lg:gap-12 paper-texture px-6 py-2 rounded-2xl border border-[#d2b48c] shadow-sm">
        <div className="flex flex-col items-center">
          <span className="text-[8px] uppercase tracking-wider text-[#8b5a2b] font-black">Pasos</span>
          <span className="text-lg lg:text-xl font-serif font-bold text-[#3e2723] leading-none">{moves}</span>
        </div>
        <div className="h-6 w-px bg-[#d2b48c]/30"></div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] uppercase tracking-wider text-[#8b5a2b] font-black">Cronómetro</span>
          <span className="text-lg lg:text-xl font-serif font-bold text-[#3e2723] leading-none">{formatTime(time)}</span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="px-4 lg:px-6 py-2 wood-texture text-[#fdfaf0] rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg font-bold text-xs lg:text-sm flex items-center gap-2 border-b-4 border-black/20"
      >
        <i className="fas fa-paint-brush"></i>
        <span className="hidden md:inline">Nueva Obra</span>
        <span className="md:hidden">Nuevo</span>
      </button>
    </header>
  );
};

export default Header;
