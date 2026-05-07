import { useEffect, useState, useCallback, useRef } from 'react';
import { socket } from './socket';
import { GameState, GameMode, BotDifficulty, PieceType, PlayerColor, COLOR_NAMES, PIECE_UNICODE, DIFFICULTIES, AppView, Board as BoardType, Move } from './types';
import Home from './components/Home';
import Rulebook from './components/Rulebook';

type ThemeId = 'classic' | 'green' | 'dark' | 'ocean' | 'neon';
const THEMES: Record<ThemeId, { label: string; light: string; dark: string; highlight: string; lastL: string; lastD: string; check: string; dot: string }> = {
  classic: { label: 'Klassisch', light: '#f0d9b5', dark: '#b58863', highlight: '#baca2b88', lastL: '#ced26b', lastD: '#aaa23a', check: '#eb403488', dot: '#00000033' },
  green:   { label: 'Grün', light: '#eeeed2', dark: '#769656', highlight: '#ffff0044', lastL: '#ced26b', lastD: '#aaa23a', check: '#eb403455', dot: '#00000033' },
  dark:    { label: 'Dunkel', light: '#50505e', dark: '#36363e', highlight: '#cccc5533', lastL: '#5a5a40', lastD: '#484830', check: '#eb403455', dot: '#ffffff22' },
  ocean:   { label: 'Ozean', light: '#dee3e6', dark: '#577dba', highlight: '#64dcff44', lastL: '#8ec8d8', lastD: '#4a8fa8', check: '#eb403455', dot: '#00000033' },
  neon:    { label: 'Neon', light: '#282838', dark: '#1c1c2c', highlight: '#00ffb433', lastL: '#304a40', lastD: '#263830', check: '#ff325055', dot: '#00ffb455' },
};

function PieceSVG({ type, color }: { type: PieceType; color: PlayerColor }) {
  const isW = color === 'white';
  const isR = color === 'red';
  const isB = color === 'blue';

  let fill = '#ffffff';
  let stroke = '#333333';
  if (!isW && !isR && !isB) { fill = '#444444'; stroke = '#111111'; }
  if (isR) { fill = '#ff4444'; stroke = '#881111'; }
  if (isB) { fill = '#4488ff'; stroke = '#113388'; }

  const sw = 2.5;
  const vb = '0 0 45 45';

  switch (type) {
    case 'king': return <svg viewBox={vb} className="w-[85%] h-[85%]">
      <path d="M22.5 11.63V6" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <path d="M20 8h5" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill={fill} stroke={stroke} strokeWidth={sw - 0.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill={fill} stroke={stroke} strokeWidth={sw - 0.5} />
      <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke={stroke} strokeWidth={sw - 1} fill="none" />
    </svg>;

    case 'queen': return <svg viewBox={vb} className="w-[85%] h-[85%]">
      <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z" fill={fill} stroke={stroke} strokeWidth={sw - 1} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4" fill={fill} stroke={stroke} strokeWidth={sw - 1} strokeLinecap="round" />
      <circle cx="6" cy="12" r="2" fill={fill} stroke={stroke} strokeWidth={sw - 1.5} />
      <circle cx="14" cy="9" r="2" fill={fill} stroke={stroke} strokeWidth={sw - 1.5} />
      <circle cx="22.5" cy="8" r="2" fill={fill} stroke={stroke} strokeWidth={sw - 1.5} />
      <circle cx="31" cy="9" r="2" fill={fill} stroke={stroke} strokeWidth={sw - 1.5} />
      <circle cx="39" cy="12" r="2" fill={fill} stroke={stroke} strokeWidth={sw - 1.5} />
    </svg>;

    case 'rook': return <svg viewBox={vb} className="w-[85%] h-[85%]">
      <path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z" stroke={stroke} strokeWidth={sw - 1} fill={fill} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 29.5v-13h17v13H14z" stroke={stroke} strokeWidth={sw - 1} fill={fill} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 16.5L11 14h23l-3 2.5H14z" stroke={stroke} strokeWidth={sw - 1} fill={fill} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5H11z" stroke={stroke} strokeWidth={sw - 1} fill={fill} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 35.5h21" stroke={stroke} strokeWidth={sw - 0.5} fill="none" strokeLinecap="round" />
    </svg>;

    case 'bishop': return <svg viewBox={vb} className="w-[85%] h-[85%]">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" fill={fill} stroke={stroke} strokeWidth={sw - 1} />
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill={fill} stroke={stroke} strokeWidth={sw - 1} />
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" fill={fill} stroke={stroke} strokeWidth={sw - 1} />
    </svg>;

    case 'knight': return <svg viewBox={vb} className="w-[85%] h-[85%]">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill={fill} stroke={stroke} strokeWidth={sw - 0.5} />
      <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.99-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.99 2.5-3c1 0 1 3 1 3" fill={fill} stroke={stroke} strokeWidth={sw - 0.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>;

    case 'pawn': return <svg viewBox={vb} className="w-[85%] h-[85%]">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34C34 31.58 29.59 27.09 26.59 26.03A6.006 6.006 0 0 0 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill={fill} stroke={stroke} strokeWidth={sw - 0.5} strokeLinecap="round" />
    </svg>;
  }
}

const PC: Record<string, { m: string }> = {
  white: { m: '#f0e4cc' },
  black: { m: '#525258' },
  red:   { m: '#e84848' },
  blue:  { m: '#4888e0' },
};

const ZOOM_LEVELS = [1, 1.15, 1.3, 1.5, 1.75];

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>('classic');
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [replayIdx, setReplayIdx] = useState(-1);
  const [playerCount, setPlayerCount] = useState(1);
  const [neededPlayers, setNeededPlayers] = useState(2);
  const [onlineMode, setOnlineMode] = useState<GameMode>('1v1');
  const [zoomIdx, setZoomIdx] = useState(0);
  const snapshots = useRef<BoardType[]>([]);
  const moveListRef = useRef<Move[]>([]);
  const prevLen = useRef(0);

  const cloneBoard = (b: BoardType): BoardType => b.map(row => row.map(c => c ? { ...c } : null));

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('game-state', (s: GameState) => {
      const len = s.moveHistory.length;
      if (len === 0) {
        snapshots.current = [cloneBoard(s.board)];
        moveListRef.current = [];
      } else if (len > prevLen.current) {
        snapshots.current.push(cloneBoard(s.board));
        moveListRef.current = s.moveHistory;
      } else if (len < prevLen.current) {
        snapshots.current = [cloneBoard(s.board)];
        moveListRef.current = s.moveHistory;
      }
      prevLen.current = len;
      setGameState(s);
      setReplayIdx(-1);
      setView('playing');
    });
    socket.on('error-msg', (m: string) => setError(m));
    socket.on('room-update', (data: { playerCount: number; needed: number }) => {
      setPlayerCount(data.playerCount);
      setNeededPlayers(data.needed);
    });
    socket.connect();
    return () => { socket.disconnect(); socket.off(); };
  }, []);
  useEffect(() => { if (error) setTimeout(() => setError(''), 5000); }, [error]);

  const handleStart = useCallback((mode: GameMode, diff: BotDifficulty) => {
    setError('');
    socket.emit('start-game', { mode, difficulty: diff }, (res: any) => {
      if (res.success) { setGameState(res.state); setView('playing'); }
      else setError(res.error);
    });
  }, []);

  const handleCreateOnline = useCallback((mode: GameMode) => {
    setError('');
    setOnlineMode(mode);
    socket.emit('create-online', { mode }, (res: any) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setPlayerCount(res.playerCount || 1);
        setNeededPlayers(res.needed || 2);
        setView('waiting');
      }
      else setError(res.error);
    });
  }, []);

  const handleJoinOnline = useCallback((code: string) => {
    setError('');
    socket.emit('join-online', { roomCode: code }, (res: any) => {
      if (res.success) { setGameState(res.state); setView('playing'); setRoomCode(code); }
      else setError(res.error);
    });
  }, []);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}?join=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [roomCode]);

  const handleStartEarly = useCallback(() => {
    socket.emit('start-early', (res: any) => {
      if (!res.success) setError(res.error);
    });
  }, []);

  const handleLeave = useCallback(() => { socket.disconnect(); socket.connect(); setGameState(null); setView('home'); setRoomCode(''); snapshots.current = []; moveListRef.current = []; prevLen.current = 0; setReplayIdx(-1); setZoomIdx(0); }, []);
  const handleRestart = useCallback(() => { socket.emit('restart-game', (res: any) => { if (!res.success) setError(res.error); }); }, []);

  const handleZoom = useCallback(() => {
    setZoomIdx(i => (i + 1) % ZOOM_LEVELS.length);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      window.history.replaceState({}, '', window.location.pathname);
      setView('joining');
      setTimeout(() => {
        socket.emit('join-online', { roomCode: joinCode.toUpperCase() }, (res: any) => {
          if (res.success) { setGameState(res.state); setView('playing'); setRoomCode(joinCode.toUpperCase()); }
          else { setError(res.error); setView('home'); }
        });
      }, 500);
    }
  }, []);

  if (view === 'rulebook') return <Rulebook onBack={() => setView('home')} />;

  if (view === 'waiting') return (
    <div className="bg-exotic min-h-dvh text-white flex flex-col">
      <div className="px-4 py-3">
        <button onClick={() => { setView('home'); setRoomCode(''); socket.disconnect(); socket.connect(); }}
          className="text-white/40 hover:text-white/80 text-sm transition flex items-center gap-1">
          ← Zurück
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          {!connected && <div className="fixed top-0 inset-x-0 bg-red-700/90 text-center py-2 text-sm z-50">Verbinde...</div>}
          {error && <div className="fixed top-0 inset-x-0 bg-red-700/90 text-center py-2 text-sm z-50">{error}</div>}
          <div className="glass-strong rounded-2xl p-8 gold-border">
            <div className="text-5xl mb-4 opacity-80">🌐</div>
            <h2 className="gold-text text-2xl font-bold mb-2">Warte auf Spieler</h2>
            <p className="text-white/30 text-sm mb-2">{playerCount}/{neededPlayers} Spieler beigetreten</p>
            <p className="text-white/20 text-xs mb-6">Teile diesen Code:</p>
            <div className="bg-black/30 rounded-xl px-6 py-4 mb-4">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] gold-text">{roomCode}</span>
            </div>
            <button onClick={handleCopyLink}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${copied ? 'bg-green-700 text-white' : 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white'}`}>
              {copied ? 'Kopiert!' : 'Link kopieren'}
            </button>
            {onlineMode === '4player' && playerCount >= 2 && playerCount < neededPlayers && (
              <div className="mt-4">
                <p className="text-white/20 text-xs mb-2">{neededPlayers - playerCount} Platz{neededPlayers - playerCount > 1 ? 'e' : ''} frei (wird mit Bot{neededPlayers - playerCount > 1 ? 's' : ''} gefüllt)</p>
                <button onClick={handleStartEarly}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white">
                  Spiel starten ({playerCount}/{neededPlayers})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (view === 'joining') return (
    <div className="bg-exotic min-h-dvh text-white flex flex-col">
      <div className="px-4 py-3">
        <button onClick={() => { setView('home'); }} className="text-white/40 hover:text-white/80 text-sm transition flex items-center gap-1">← Zurück</button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🌐</div>
          <p className="text-white/40">Trete Raum bei...</p>
        </div>
      </div>
    </div>
  );

  if (!gameState || view === 'home') return (
    <div className="bg-exotic min-h-dvh text-white">
      {!connected && <div className="fixed top-0 inset-x-0 bg-red-700/90 text-center py-2 text-sm z-50">Verbinde...</div>}
      {error && <div className="fixed top-0 inset-x-0 bg-red-700/90 text-center py-2 text-sm z-50">{error}</div>}
      <Home onStart={handleStart} onCreateOnline={handleCreateOnline} onJoinOnline={handleJoinOnline} onOpenRulebook={() => setView('rulebook')} />
    </div>
  );

  const t = gameState;
  const theme = THEMES[themeId];
  const myColor = getMyColor(t, socket.id || '');
  const totalMoves = t.moveHistory.length;
  const isReplaying = replayIdx !== -1;
  const viewIdx = isReplaying ? replayIdx : totalMoves;
  const displayBoard = snapshots.current[viewIdx] || t.board;
  const displayLast = viewIdx > 0 ? moveListRef.current[viewIdx - 1] : null;
  const zoom = ZOOM_LEVELS[zoomIdx];

  return (
    <div className="bg-exotic text-white overflow-hidden game-layout">
      {error && <div className="fixed top-0 inset-x-0 bg-red-700/90 text-center py-2 text-sm z-50">{error}</div>}

      <header className="glass border-b border-white/5 px-3 py-1.5 z-20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={handleLeave} className="text-white/40 hover:text-white/80 transition text-xs shrink-0" title="Menü">
              ←
            </button>
            <span className="gold-text font-bold text-xs sm:text-sm tracking-wider truncate" style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>
              <span style={{ fontSize: '1.12em' }}>M</span>ULTI<span style={{ fontSize: '1.12em' }}>C</span>HESS
            </span>
            {roomCode && <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-white/25 font-mono shrink-0">{roomCode}</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <select value={themeId} onChange={e => setThemeId(e.target.value as ThemeId)} className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white/50 focus:outline-none">
              {Object.entries(THEMES).map(([k, v]) => <option key={k} value={k} className="bg-slate-800">{v.label}</option>)}
            </select>
            <button onClick={handleRestart} className="px-1.5 py-0.5 glass rounded text-[10px] hover:bg-white/10 gold-border">↻</button>
            <button onClick={handleLeave} className="px-1.5 py-0.5 glass rounded text-[10px] hover:bg-red-900/30 gold-border">✕</button>
          </div>
        </div>
      </header>

      <div className="shrink-0">
        <Players t={t} myColor={myColor} winner={t.winner} />
      </div>

      <div className="board-area relative">
        <Board t={t} theme={theme} myColor={myColor} displayBoard={displayBoard} displayLast={displayLast} isReplaying={isReplaying} zoom={zoom} />
        <button onClick={handleZoom}
          className="absolute bottom-2 right-2 z-20 w-8 h-8 rounded-lg glass-strong flex items-center justify-center text-white/40 hover:text-white/70 text-sm transition"
          title="Brett vergrößern">
          {zoom > 1 ? '⊖' : '⊕'}
        </button>
      </div>

      <div className="shrink-0 flex items-center justify-center gap-3 h-9 z-10">
        {totalMoves > 0 && (
          <>
            <button onClick={() => setReplayIdx(Math.max(0, (replayIdx === -1 ? totalMoves : replayIdx) - 1))}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors duration-150 ${replayIdx === 0 ? 'bg-white/5 text-white/15' : 'bg-white/10 text-white/60 hover:bg-white/15 active:bg-white/20 backdrop-blur-md'}`}
              disabled={replayIdx === 0}>
              ◀
            </button>
            <button onClick={() => {
              const next = replayIdx === -1 ? totalMoves : replayIdx + 1;
              if (next >= totalMoves) { setReplayIdx(-1); return; }
              setReplayIdx(next);
            }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors duration-150 ${replayIdx === -1 ? 'bg-white/5 text-white/15' : 'bg-white/10 text-white/60 hover:bg-white/15 active:bg-white/20 backdrop-blur-md'}`}
              disabled={replayIdx === -1}>
              ▶
            </button>
          </>
        )}
      </div>

      <div className="shrink-0 px-2 pb-2 pt-1 z-10" style={{ height: 'clamp(100px, 22dvh, 200px)' }}>
        <div className="glass-strong rounded-xl p-2 h-full flex flex-col max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h3 className="gold-text font-semibold text-[9px] sm:text-[10px] tracking-widest uppercase">Züge</h3>
            <CapturedSummary t={t} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-px">
            {totalMoves === 0 && <p className="text-white/15 text-[9px] sm:text-[10px] text-center py-3">Warte auf ersten Zug...</p>}
            {t.moveHistory.map((m, i) => {
              const cur = replayIdx === -1 ? totalMoves : replayIdx;
              const isActive = i + 1 === cur;
              return (
                <div key={i}
                  onClick={() => setReplayIdx(i + 1)}
                  className={`flex items-center gap-1 px-1.5 py-px rounded text-[9px] sm:text-[10px] cursor-pointer transition ${isActive ? 'bg-amber-600/20 ring-1 ring-amber-500/30' : 'hover:bg-white/5'}`}>
                  <span className="text-white/20 w-4 shrink-0 tabular-nums">{i + 1}.</span>
                  <span className="font-bold" style={{ color: PC[m.player]?.m || '#fff' }}>{COLOR_NAMES[m.player][0]}</span>
                  <span className="font-mono text-white/50">{m.notation}</span>
                  {m.captured && <span className="text-red-400/40 ml-auto">✕</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getMyColor(t: GameState, socketId: string): PlayerColor {
  for (const color of t.turnOrder) {
    const p = t.players[color];
    if (p && p.id === socketId) return color as PlayerColor;
  }
  return 'white';
}

function Players({ t, myColor, winner }: { t: GameState; myColor: PlayerColor; winner: PlayerColor | null }) {
  const statusMsg = winner
    ? `${winner === myColor ? 'Du gewinnst!' : COLOR_NAMES[winner] + ' gewinnt!'}`
    : null;

  return (
    <div className="px-2 py-1">
      <div className="flex gap-1 sm:gap-1.5 justify-center items-center">
        {t.turnOrder.map(color => {
          const p = t.players[color]; if (!p) return null;
          const isCur = !winner && t.currentPlayer === color;
          const isMe = color === myColor;
          return (
            <div key={color} className={`rounded-lg px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-center transition-all ${isCur ? 'pulse-gold glass-strong gold-border' : 'glass'} ${p.eliminated ? 'opacity-25' : ''}`}>
              <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ background: PC[color]?.m }} />
                <span className="font-bold text-[9px] sm:text-[11px]" style={{ color: PC[color]?.m }}>{COLOR_NAMES[color]}</span>
                {isMe && <span className="text-[7px] bg-amber-600/30 px-0.5 rounded text-amber-300/60">DU</span>}
              </div>
              {isCur && !p.eliminated && <div className="text-amber-400 text-[7px] sm:text-[9px] font-bold leading-tight">AM ZUG</div>}
              {t.inCheck.includes(color) && !p.eliminated && <div className="text-red-400 text-[7px] sm:text-[9px] font-bold leading-tight">SCHACH</div>}
            </div>
          );
        })}
      </div>
      {statusMsg && (
        <div className={`text-center mt-0.5 text-[10px] sm:text-xs font-bold tracking-wide ${winner ? 'gold-text' : 'text-blue-300/60'}`}>
          {winner && '♚ '}{statusMsg}{winner && ' ♚'}
        </div>
      )}
    </div>
  );
}

function CapturedSummary({ t }: { t: GameState }) {
  const pieces = Object.entries(t.capturedPieces).flatMap(([color, pcs]) => pcs.map(p => ({ ...p, capturedBy: color })));
  if (pieces.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-px">
      {pieces.slice(-12).map((cp, j) => <span key={j} className="text-[8px] opacity-30" style={{ color: PC[cp.color]?.m }}>{PIECE_UNICODE[cp.type]}</span>)}
    </div>
  );
}

function Board({ t, theme, myColor, displayBoard, displayLast, isReplaying, zoom }: { t: GameState; theme: typeof THEMES.classic; myColor: PlayerColor; displayBoard: BoardType; displayLast: Move | null; isReplaying: boolean; zoom: number }) {
  const [sel, setSel] = useState<any>(null);
  const [valid, setValid] = useState<any[]>([]);
  const isMyTurn = !isReplaying && t.currentPlayer === myColor && !t.winner && t.players[myColor] && !t.players[myColor].eliminated;
  const last = isReplaying ? displayLast : (t.moveHistory.length > 0 ? t.moveHistory[t.moveHistory.length - 1] : null);

  useEffect(() => { setSel(null); setValid([]); }, [t.currentPlayer, isReplaying]);

  const click = useCallback((row: number, col: number) => {
    if (!isMyTurn) return;
    const sz = t.boardSize;
    if (sz === 14 && ((row <= 2 && col <= 2) || (row <= 2 && col >= 11) || (row >= 11 && col <= 2) || (row >= 11 && col >= 11))) return;
    const piece = displayBoard[row][col];
    if (sel) {
      if (valid.some(m => m.row === row && m.col === col)) { socket.emit('make-move', { from: sel, to: { row, col } }, (r: any) => { if (!r.success) console.error(r.error); }); setSel(null); setValid([]); return; }
      if (piece && piece.color === myColor) { setSel({ row, col }); socket.emit('get-valid-moves', { row, col }, (m: any[]) => setValid(m)); return; }
      setSel(null); setValid([]); return;
    }
    if (piece && piece.color === myColor) { setSel({ row, col }); socket.emit('get-valid-moves', { row, col }, (m: any[]) => setValid(m)); }
  }, [sel, valid, isMyTurn, displayBoard, myColor]);

  const sz = t.boardSize;
  const cols = sz === 8 ? 'grid-cols-8' : 'grid-cols-14';
  const clip = sz === 14 ? 'polygon(21.4% 0%, 78.6% 0%, 78.6% 21.4%, 100% 21.4%, 100% 78.6%, 78.6% 78.6%, 78.6% 100%, 21.4% 100%, 21.4% 78.6%, 0% 78.6%, 0% 21.4%, 21.4% 21.4%)' : undefined;

  const baseMaxW = Math.min(window.innerWidth * 0.96, window.innerHeight * 0.56, 560);
  const scaledMaxW = baseMaxW * zoom;

  return (
    <div style={{ width: scaledMaxW, maxWidth: '96vw', aspectRatio: '1/1' }} className="relative">
      {isReplaying && <div className="absolute inset-0 z-10 rounded-xl" />}
      <div className={`grid ${cols} gap-0 rounded-xl overflow-hidden gold-border shadow-2xl shadow-black/50 w-full h-full ${isReplaying ? 'opacity-90' : ''}`} style={{ clipPath: clip }}>
        {Array.from({ length: sz }, (_, row) =>
          Array.from({ length: sz }, (_, col) => {
            const inv = sz === 14 && ((row <= 2 && col <= 2) || (row <= 2 && col >= 11) || (row >= 11 && col <= 2) || (row >= 11 && col >= 11));
            if (inv) return <div key={`${row}-${col}`} />;
            const piece = displayBoard[row][col];
            const light = (row + col) % 2 === 0;
            const isV = !isReplaying && valid.some(m => m.row === row && m.col === col);
            const isSel = sel?.row === row && sel?.col === col;
            const isLast = last && ((last.from.row === row && last.from.col === col) || (last.to.row === row && last.to.col === col));
            const isChk = !isReplaying && piece?.type === 'king' && t.inCheck.includes(piece.color);
            let bg = light ? theme.light : theme.dark;
            if (isSel) bg = theme.highlight;
            else if (isChk) bg = theme.check;
            else if (isLast) bg = light ? theme.lastL : theme.lastD;
            return (
              <div key={`${row}-${col}`} className="board-cell" style={{ background: bg }} onClick={() => click(row, col)}>
                {piece && <PieceSVG type={piece.type} color={piece.color} />}
                {isV && !piece && <div className="valid-dot" style={{ background: theme.dot }} />}
                {isV && piece && <div className="valid-capture" style={{ borderColor: theme.dot }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
