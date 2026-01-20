
import React, { useState, useEffect, useRef } from 'react';
import { GameState, PresetTheme } from './types.ts';
import { generatePuzzleImage } from './services/geminiService.ts';
import { createInitialTiles, scatterTiles, checkSnap, getPuzzlePath, getTileBounds, ROWS, COLS, PLAY_AREA_HEIGHT_PERCENT } from './utils/puzzleLogic.ts';
import Header from './components/Header.tsx';
import LoadingOverlay from './components/LoadingOverlay.tsx';

const PRESET_THEMES: PresetTheme[] = [
  { name: 'Bosque Mágico', prompt: 'Un bosque encantado con árboles de cristal y luciérnagas doradas, estilo acuarela detallada', icon: 'fa-tree' },
  { name: 'Ciudad Neón', prompt: 'Una metrópolis ciberpunk bajo la lluvia con reflejos de neón en los charcos, estilo cinemático', icon: 'fa-city' },
  { name: 'Viaje Espacial', prompt: 'Una nebulosa colorida con astronautas explorando ruinas antiguas flotantes, estilo épico', icon: 'fa-rocket' },
  { name: 'Gato Samurái', prompt: 'Un gato vestido de samurái en un jardín de cerezos japonés, estilo ilustración tradicional', icon: 'fa-cat' },
];

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    image: null,
    tiles: [],
    difficulty: 20,
    isSolved: false,
    isShuffled: false,
    moves: 0,
    startTime: null,
    elapsedTime: 0,
    isGenerating: false,
    statusMessage: '',
  });

  const [prompt, setPrompt] = useState('');
  const [isShuffling, setIsShuffling] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);
  const [hideVictoryPanel, setHideVictoryPanel] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.image && state.tiles.length === 0 && containerRef.current) {
      const initPuzzle = () => {
        const { offsetWidth, offsetHeight } = containerRef.current!;
        if (offsetWidth === 0) return;
        const initial = createInitialTiles(offsetWidth, Math.floor(offsetHeight * PLAY_AREA_HEIGHT_PERCENT));
        setState(prev => ({ ...prev, tiles: initial, isShuffled: false, startTime: null }));
      };
      const timeoutId = setTimeout(initPuzzle, 200);
      // Fix: Use clearTimeout instead of setTimeout to properly clean up the timeout.
      return () => clearTimeout(timeoutId);
    }
  }, [state.image, state.tiles.length]);

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;
    setState(prev => ({ ...prev, isGenerating: true, statusMessage: 'Pintando tu obra...' }));
    setHideVictoryPanel(false);
    try {
      const imageUrl = await generatePuzzleImage(finalPrompt);
      setState(prev => ({ ...prev, image: imageUrl, tiles: [], isSolved: false, isShuffled: false, moves: 0, isGenerating: false }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al generar");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleDragStart = (id: number) => {
    if (state.isSolved || !state.isShuffled || isShuffling) return;
    setDraggingId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerW = containerRef.current.offsetWidth;
    const playAreaH = Math.floor(containerRef.current.offsetHeight * PLAY_AREA_HEIGHT_PERCENT);

    const tile = state.tiles.find(t => t.id === draggingId)!;
    const bounds = getTileBounds(tile.correctRow, tile.correctCol, containerW, playAreaH);
    
    const x = e.clientX - rect.left - (bounds.width / 2);
    const y = e.clientY - rect.top - (bounds.height / 2);
    
    setState(prev => ({
      ...prev,
      tiles: prev.tiles.map(t => t.id === draggingId ? { ...t, currentX: x, currentY: y } : t)
    }));
  };

  const handleMouseUp = () => {
    if (draggingId === null || !containerRef.current) return;
    const { offsetWidth, offsetHeight } = containerRef.current;
    const playAreaH = Math.floor(offsetHeight * PLAY_AREA_HEIGHT_PERCENT);

    const tile = state.tiles.find(t => t.id === draggingId)!;
    const bounds = getTileBounds(tile.correctRow, tile.correctCol, offsetWidth, playAreaH);
    
    const isSnapped = checkSnap(tile.currentX, tile.currentY, bounds.x, bounds.y);

    setState(prev => {
      const newTiles = prev.tiles.map(t => {
        if (t.id === draggingId) {
          return isSnapped 
            ? { ...t, currentX: bounds.x, currentY: bounds.y, rotation: 0, isSnapped: true }
            : { ...t };
        }
        return t;
      });
      const solved = newTiles.every(t => t.isSnapped);
      return { ...prev, tiles: newTiles, isSolved: solved, moves: prev.moves + 1 };
    });
    setDraggingId(null);
  };

  const handleShuffle = () => {
    if (!containerRef.current || !state.image || isShuffling) return;
    const { offsetWidth, offsetHeight } = containerRef.current;
    setIsShuffling(true);
    setHideVictoryPanel(false);
    const newTiles = scatterTiles(state.tiles, offsetWidth, offsetHeight);
    setState(prev => ({ ...prev, tiles: newTiles, isSolved: false, isShuffled: true, moves: 0, startTime: Date.now() }));
    setTimeout(() => setIsShuffling(false), 2200);
  };

  const handleChangePuzzle = () => {
    setState(prev => ({ ...prev, image: null, tiles: [], isSolved: false, isShuffled: false }));
    setHideVictoryPanel(false);
  };

  useEffect(() => {
    if (state.startTime && !state.isSolved) {
      timerRef.current = window.setInterval(() => {
        setState(prev => ({ ...prev, elapsedTime: Math.floor((Date.now() - (prev.startTime || 0)) / 1000) }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.startTime, state.isSolved]);

  const containerW = containerRef.current?.offsetWidth || 0;
  const containerH = containerRef.current?.offsetHeight || 0;
  const playAreaH = Math.floor(containerH * PLAY_AREA_HEIGHT_PERCENT);

  return (
    <div className="h-screen flex flex-col select-none overflow-hidden bg-[#f7f3e9]" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <Header moves={state.moves} time={state.elapsedTime} isSolved={state.isSolved} onReset={handleChangePuzzle} />
      
      {!state.image ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f7f3e9] overflow-y-auto">
          {state.isGenerating && <LoadingOverlay message={state.statusMessage} />}
          <div className="max-w-4xl w-full text-center flex flex-col items-center py-6">
            <div className="mb-4 wood-texture w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2 border-[#3e2723]">
              <i className="fas fa-puzzle-piece text-white text-2xl"></i>
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#3e2723] mb-2">Estudio de Puzzles</h1>
            <p className="text-[#5d4037] mb-8 text-base lg:text-lg font-medium opacity-70 italic">Describe tu obra maestra y deja que la IA la cree.</p>
            
            <div className="paper-texture p-6 lg:p-8 rounded-[2.5rem] shadow-2xl border-2 border-[#d2b48c] w-full max-w-xl relative overflow-hidden">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe tu puzzle..."
                className="w-full bg-white border-2 border-[#d2b48c] rounded-2xl p-4 text-xl outline-none focus:border-[#5d4037] transition-all mb-4 text-center placeholder:opacity-30"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />

              <div className="flex justify-center gap-4 mb-8">
                {PRESET_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => handleGenerate(theme.prompt)}
                    title={theme.name}
                    className="w-12 h-12 rounded-full bg-[#f7f3e9] border-2 border-[#d2b48c] flex items-center justify-center text-[#3e2723] hover:bg-white hover:scale-110 hover:shadow-md transition-all group relative"
                  >
                    <i className={`fas ${theme.icon} text-lg`}></i>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[#8b5a2b]">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => handleGenerate()} 
                className="w-full py-4 lg:py-5 wood-texture text-white text-xl lg:text-2xl font-black rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all border-b-6 border-black/30"
              >
                GENERAR PUZZLE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <main className="flex-1 flex flex-col lg:flex-row p-2 lg:p-4 gap-4 w-full max-w-[2400px] mx-auto overflow-hidden">
          {/* Panel Lateral Izquierdo */}
          <aside className={`hidden lg:flex flex-col gap-4 w-[220px] shrink-0 transition-opacity ${state.isSolved && hideVictoryPanel ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="paper-texture p-3 rounded-3xl border-2 border-[#d2b48c] shadow-lg">
              <p className="text-center font-bold text-[#3e2723] mb-2 uppercase tracking-widest text-[9px] opacity-60">Referencia</p>
              <div className="relative rounded-2xl border-2 border-white shadow-md aspect-video overflow-hidden cursor-zoom-in" onClick={() => setIsReferenceExpanded(true)}>
                <img src={state.image} className="w-full h-full object-cover" />
              </div>
            </div>
            {!state.isSolved && (
              <button onClick={handleShuffle} disabled={isShuffling} className="w-full py-4 wood-texture text-white rounded-2xl shadow-xl font-black text-base border-b-4 border-black/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                <i className={`fas fa-random ${isShuffling ? 'animate-spin' : ''}`}></i>
                <span>{state.isShuffled ? "MEZCLAR" : "COMENZAR"}</span>
              </button>
            )}
          </aside>

          {/* Área de Juego */}
          <section className="flex-1 flex flex-col items-center relative min-h-0">
            <div ref={containerRef} className="relative w-full h-full flex flex-col items-center">
              
              <div 
                className="relative w-full rounded-[2.5rem] wood-texture shadow-2xl border-t-2 border-white/10 border-b-6 border-black/40 z-10 flex items-center justify-center p-2" 
                style={{ height: `${PLAY_AREA_HEIGHT_PERCENT * 100}%` }}
              >
                <div className="relative w-full h-full bg-[#3e2723]/60 rounded-[2rem] border-2 border-black/50 overflow-hidden board-inner-shadow">
                  {/* Definición de Clips para SVG */}
                  <svg className="absolute w-0 h-0">
                    <defs>
                      {state.tiles.map((tile) => {
                        const b = getTileBounds(tile.correctRow, tile.correctCol, containerW, playAreaH);
                        return (
                          <clipPath key={`clip-${tile.id}`} id={`puzzle-clip-${tile.id}`} clipPathUnits="userSpaceOnUse">
                            <path d={getPuzzlePath(tile.correctRow, tile.correctCol, b.width, b.height)} />
                          </clipPath>
                        );
                      })}
                    </defs>
                  </svg>

                  {/* Guías Sutiles */}
                  {(state.isShuffled || isShuffling) && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
                      {state.tiles.map((tile) => {
                        const b = getTileBounds(tile.correctRow, tile.correctCol, containerW, playAreaH);
                        return (
                          <path 
                            key={`guide-${tile.id}`}
                            d={getPuzzlePath(tile.correctRow, tile.correctCol, b.width, b.height)} 
                            transform={`translate(${b.x}, ${b.y})`}
                            fill="none" stroke="white" strokeWidth="0.5"
                          />
                        );
                      })}
                    </svg>
                  )}

                  {!state.isShuffled && !isShuffling && state.image && (
                    <div className="absolute inset-0 z-0 animate-fade-in">
                      <img src={state.image} className="w-full h-full object-fill" alt="Imagen Completa" />
                    </div>
                  )}
                </div>
              </div>

              {/* TRAY / MESA */}
              <div className="w-full mt-2 rounded-t-[3rem] border-x-4 border-t-4 border-[#d2b48c] paper-texture shadow-2xl relative flex-1 z-0 overflow-hidden">
                 <div className="absolute inset-0 bg-[#eaddca]/30 flex items-center justify-center opacity-40 italic font-black text-xl lg:text-3xl uppercase tracking-[1em] select-none">
                    {state.isSolved ? "GALERÍA" : "MESA DE TRABAJO"}
                 </div>
              </div>

              {/* RENDERIZADO DE LAS PIEZAS */}
              {(state.isShuffled || isShuffling) && state.tiles.map((tile, index) => {
                const b = getTileBounds(tile.correctRow, tile.correctCol, containerW, playAreaH);
                const isDragging = tile.id === draggingId;
                const isClose = isDragging && checkSnap(tile.currentX, tile.currentY, b.x, b.y);
                const zIndex = isDragging ? 1000 : (tile.isSnapped ? 25 : 30 + index);

                const posX = tile.isSnapped ? b.x : tile.currentX;
                const posY = tile.isSnapped ? b.y : tile.currentY;

                return (
                  <div
                    key={tile.id}
                    onMouseDown={() => handleDragStart(tile.id)}
                    className={`absolute cursor-grab active:cursor-grabbing ${isDragging ? 'z-[1000]' : 'puzzle-piece-transition'} ${tile.isSnapped ? 'pointer-events-none' : ''}`}
                    style={{
                      width: `${b.width}px`,
                      height: `${b.height}px`,
                      left: `${posX}px`,
                      top: `${posY}px`,
                      zIndex: zIndex,
                      transition: isDragging ? 'none' : isShuffling ? 'all 2.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'left 0.2s ease-out, top 0.2s ease-out, transform 0.2s ease',
                      transform: isDragging ? 'scale(1.08) rotate(0deg)' : `rotate(${tile.rotation}deg)`,
                      filter: tile.isSnapped 
                          ? 'none' 
                          : `drop-shadow(0 ${isDragging ? '15px' : '4px'} ${isDragging ? '25px' : '8px'} rgba(0,0,0,0.5))`,
                    }}
                  >
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        backgroundImage: `url(${state.image})`,
                        backgroundSize: `${containerW}px ${playAreaH}px`,
                        backgroundPosition: `-${b.x}px -${b.y}px`,
                        clipPath: `url(#puzzle-clip-${tile.id})`,
                        opacity: 1,
                      }}
                    />

                    {isClose && (
                      <div className="absolute inset-0 bg-white/20 pointer-events-none animate-pulse" style={{ clipPath: `url(#puzzle-clip-${tile.id})` }} />
                    )}

                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                       <path 
                         d={getPuzzlePath(tile.correctRow, tile.correctCol, b.width, b.height)} 
                         fill="none" 
                         stroke={tile.isSnapped ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.25)"} 
                         strokeWidth={tile.isSnapped ? "0.4" : "1.2"} 
                       />
                    </svg>
                  </div>
                );
              })}

              {/* PANEL DE OPCIONES FINAL */}
              {state.isSolved && (
                <div className={`absolute inset-0 z-[2000] flex items-end justify-center pb-10 transition-all duration-700 ${hideVictoryPanel ? 'bg-transparent pointer-events-none' : 'bg-black/10 backdrop-blur-[2px]'}`}>
                  <div className={`paper-texture p-6 lg:p-8 rounded-[3rem] border-4 border-[#3e2723] shadow-2xl flex flex-col md:flex-row items-center gap-6 max-w-[95%] transform transition-transform duration-500 ${hideVictoryPanel ? 'translate-y-[200%]' : 'translate-y-0'}`}>
                    
                    <div className="flex flex-col items-start md:pr-8 md:border-r border-[#d2b48c]/40 text-left">
                      <h2 className="text-3xl font-serif font-bold text-[#3e2723] dummy leading-none">Imagen Completada</h2>
                      <p className="text-[#8b5a2b] font-medium text-xs mt-1 uppercase tracking-wider">La obra se ha unido perfectamente</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      <button onClick={() => setHideVictoryPanel(true)} className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[#f7f3e9] transition-all">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-[#d2b48c] group-hover:scale-110 transition-transform">
                          <i className="fas fa-eye text-[#3e2723]"></i>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#3e2723]">Ver Resultado</span>
                      </button>

                      <button onClick={handleShuffle} className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[#f7f3e9] transition-all">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-[#d2b48c] group-hover:scale-110 transition-transform">
                          <i className="fas fa-rotate-left text-[#3e2723]"></i>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#3e2723]">Reintentar</span>
                      </button>

                      <button onClick={handleChangePuzzle} className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[#f7f3e9] transition-all">
                        <div className="w-12 h-12 wood-texture rounded-full flex items-center justify-center shadow-md border border-black group-hover:scale-110 transition-transform">
                          <i className="fas fa-plus text-white"></i>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#3e2723]">Nuevo Puzzle</span>
                      </button>
                    </div>
                  </div>

                  {hideVictoryPanel && (
                    <button onClick={() => setHideVictoryPanel(false)} className="fixed bottom-10 right-10 w-16 h-16 wood-texture text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 animate-bounce pointer-events-auto z-[2001] group">
                      <i className="fas fa-trophy text-2xl group-hover:rotate-12 transition-transform"></i>
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      {isReferenceExpanded && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/98 p-6" onClick={() => setIsReferenceExpanded(false)}>
           <div className="relative max-w-6xl w-full">
             <img src={state.image!} className="w-full rounded-2xl border-2 border-white/10 shadow-2xl" />
           </div>
        </div>
      )}

      <style>{`
        .puzzle-piece-transition { transition: left 0.2s ease-out, top 0.2s ease-out, transform 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .board-inner-shadow { box-shadow: inset 0 10px 60px rgba(0,0,0,0.6); }
      `}</style>
    </div>
  );
};

export default App;
