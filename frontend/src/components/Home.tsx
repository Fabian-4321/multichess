import { useState } from 'react';
import { GameMode, BotDifficulty, DIFFICULTIES } from '../types';

type HomeMode = 'bot-1v1' | 'bot-4p' | 'online' | null;

interface Props {
  onStart: (mode: GameMode, diff: BotDifficulty) => void;
  onCreateOnline: (mode: GameMode) => void;
  onJoinOnline: (code: string) => void;
  onOpenRulebook: () => void;
}

const DIFF_ORDER: BotDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'master'];

export default function Home({ onStart, onCreateOnline, onJoinOnline, onOpenRulebook }: Props) {
  const [mode, setMode] = useState<HomeMode>(null);
  const [diff, setDiff] = useState<BotDifficulty>('medium');
  const [joinCode, setJoinCode] = useState('');

  if (!mode) return (
    <div className="min-h-dvh overflow-y-auto flex items-center justify-center p-4">
      <div className="text-center max-w-2xl w-full py-8">
        <div className="mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-wider mb-2" style={{
            background: 'linear-gradient(135deg, #d4a574 0%, #f0d5a8 25%, #c9a96e 50%, #e8c98a 75%, #d4a574 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: '"Georgia", "Times New Roman", serif',
            letterSpacing: '0.1em',
          }}>
            <span style={{ fontSize: '1.15em' }}>M</span>ULTI<span style={{ fontSize: '1.15em' }}>C</span>HESS
          </h1>
          <p className="text-white/20 text-xs tracking-[0.4em] uppercase">Meister dein Spiel</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 max-w-lg mx-auto mb-4">
          <button onClick={() => setMode('bot-1v1')} className="glass-strong rounded-2xl p-5 sm:p-7 text-center hover:bg-white/10 transition-all group gold-border">
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">⚔️</div>
            <h2 className="gold-text text-xl sm:text-2xl font-bold mb-1 sm:mb-2">1 vs 1</h2>
            <p className="text-white/40 text-xs sm:text-sm">Duell gegen die KI</p>
          </button>

          <button onClick={() => setMode('bot-4p')} className="glass-strong rounded-2xl p-5 sm:p-7 text-center hover:bg-white/10 transition-all group gold-border">
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">👑</div>
            <h2 className="gold-text text-xl sm:text-2xl font-bold mb-1 sm:mb-2">4 Spieler</h2>
            <p className="text-white/40 text-xs sm:text-sm">Chaos-Modus gegen Bots</p>
          </button>
        </div>

        <button onClick={() => setMode('online')} className="glass-strong rounded-2xl px-6 sm:px-8 py-4 sm:py-5 text-center hover:bg-white/10 transition-all group gold-border max-w-lg mx-auto block w-full">
          <div className="text-3xl sm:text-4xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">🌐</div>
          <h2 className="gold-text text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Online</h2>
          <p className="text-white/40 text-xs sm:text-sm">Spiele gegen Freunde</p>
        </button>

        <button onClick={onOpenRulebook} className="mt-5 text-white/25 hover:text-white/50 text-xs transition tracking-widest uppercase">Schachregeln</button>
      </div>
    </div>
  );

  if (mode === 'online') return (
    <div className="min-h-dvh overflow-y-auto flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-xl w-full py-4">
        <button onClick={() => setMode(null)} className="text-white/30 hover:text-white/60 text-sm mb-5 transition flex items-center gap-1 mx-auto">
          <span>←</span> Zurück
        </button>
        <div className="text-4xl mb-3">🌐</div>
        <h2 className="gold-text text-2xl sm:text-3xl font-bold mb-2">Online</h2>
        <p className="text-white/30 mb-6 text-xs sm:text-sm tracking-wider uppercase">Erstelle oder trete einem Raum bei</p>

        <div className="space-y-3 max-w-md mx-auto">
          <button onClick={() => onCreateOnline('1v1')} className="w-full glass-strong rounded-xl px-4 py-3.5 transition-all flex items-center gap-3 hover:bg-white/5 gold-border">
            <span className="text-3xl opacity-80">⚔️</span>
            <div className="flex-1 text-left">
              <div className="font-bold text-base sm:text-lg gold-text">1 vs 1</div>
              <div className="text-white/30 text-[10px] sm:text-xs">Du + 1 Freund</div>
            </div>
          </button>

          <button onClick={() => onCreateOnline('4player')} className="w-full glass-strong rounded-xl px-4 py-3.5 transition-all flex items-center gap-3 hover:bg-white/5 gold-border">
            <span className="text-3xl opacity-80">👑</span>
            <div className="flex-1 text-left">
              <div className="font-bold text-base sm:text-lg gold-text">4 Spieler</div>
              <div className="text-white/30 text-[10px] sm:text-xs">Bis zu 4 Freunde (Rest = Bots)</div>
            </div>
          </button>

          <div className="glass-strong rounded-xl px-4 py-3.5 gold-border">
            <div className="flex items-center gap-3">
              <span className="text-3xl opacity-80">🎮</span>
              <div className="flex-1">
                <div className="font-bold text-base sm:text-lg gold-text mb-2">Raum beitreten</div>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Code eingeben"
                    maxLength={6}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm tracking-widest text-center focus:outline-none focus:border-amber-500/50"
                  />
                  <button onClick={() => joinCode.length >= 4 && onJoinOnline(joinCode)} disabled={joinCode.length < 4}
                    className="px-4 py-2 rounded-lg font-bold text-sm transition-all bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white disabled:opacity-30 disabled:cursor-not-allowed">
                    Los
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh overflow-y-auto flex flex-col items-center justify-start p-4">
      <div className="text-center max-w-xl w-full py-4">
        <button onClick={() => setMode(null)} className="text-white/30 hover:text-white/60 text-sm mb-4 transition flex items-center gap-1 mx-auto">
          <span>←</span> Zurück
        </button>
        <div className="text-4xl mb-2">{mode === 'bot-1v1' ? '⚔️' : '👑'}</div>
        <h2 className="gold-text text-2xl sm:text-3xl font-bold mb-1">{mode === 'bot-1v1' ? '1 vs 1' : '4-Spieler'}</h2>
        <p className="text-white/30 mb-5 text-xs sm:text-sm tracking-wider uppercase">Wähle die Stärke deines Gegners</p>

        <div className="space-y-2.5 max-w-md mx-auto">
          {DIFF_ORDER.map((d) => {
            const cfg = DIFFICULTIES[d];
            const selected = diff === d;
            return (
              <button key={d} onClick={() => setDiff(d)}
                className={`w-full text-left rounded-xl px-4 py-3 transition-all flex items-center gap-3 ${selected ? 'glass-strong gold-border pulse-gold' : 'glass hover:bg-white/5'}`}>
                <span className="text-2xl sm:text-3xl opacity-80">{cfg.icon}</span>
                <div className="flex-1">
                  <div className={`font-bold text-base sm:text-lg ${selected ? 'gold-text' : 'text-white/70'}`}>{cfg.label}</div>
                  <div className="text-white/30 text-[10px] sm:text-xs">ELO {cfg.elo}</div>
                </div>
                {selected && <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />}
              </button>
            );
          })}
        </div>

        <button onClick={() => onStart(mode === 'bot-1v1' ? '1v1' : '4player', diff)}
          className="mt-6 px-8 py-3 rounded-xl font-bold text-base sm:text-lg tracking-wide transition-all
            bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600
            shadow-lg shadow-amber-900/30 text-white">
          Spiel starten
        </button>
      </div>
    </div>
  );
}
