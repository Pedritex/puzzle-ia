
import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fdfaf0]/90 backdrop-blur-sm">
      <div className="flex flex-col items-center max-w-xs text-center">
        <div className="relative mb-8">
          <i className="fas fa-feather-alt text-4xl text-[#8b5a2b] animate-bounce"></i>
        </div>
        <h2 className="text-3xl font-serif italic text-[#3e2723] mb-2">
          {message === 'Dreaming...' ? 'Dibujando tu imaginación...' : message}
        </h2>
        <p className="text-[#8b5a2b] font-medium tracking-wide">
          Un momento de paz mientras la IA crea tu siguiente reto...
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
