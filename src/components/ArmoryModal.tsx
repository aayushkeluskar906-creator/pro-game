import React, { useState } from 'react';
import { Weapon, PlayerShooterStats, PlayerInventory } from '../types/game';
import { INITIAL_WEAPONS } from '../data/weaponsData';
import { 
  X, 
  Shield, 
  Zap, 
  Sparkles, 
  ChevronUp, 
  Lock, 
  Check, 
  ShoppingBag, 
  Rocket, 
  Heart, 
  Gift, 
  Magnet, 
  Crosshair, 
  Plus, 
  Star,
  Package
} from 'lucide-react';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerStats: PlayerShooterStats;
  onUnlockWeapon: (weaponId: string, cost: number) => void;
  onUpgradeWeapon: (weaponId: string, cost: number) => void;
  onBuyItem?: (itemId: keyof PlayerInventory, cost: number, count?: number) => void;
  onUpgradeBooster?: (boosterKey: keyof PlayerInventory, cost: number) => void;
}

export const ArmoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerStats,
  onUnlockWeapon,
  onUpgradeWeapon,
  onBuyItem,
  onUpgradeBooster,
}) => {
  const [activeTab, setActiveTab] = useState<'runner' | 'boosters' | 'weapons' | 'combat'>('runner');
  const [recentPurchase, setRecentPurchase] = useState<string | null>(null);

  if (!isOpen) return null;

  const inv: PlayerInventory = playerStats.inventory || {
    hoverboards: 3,
    headstarts: 1,
    mysteryBoxes: 0,
    resurrectWings: 1,
    magnetLevel: 1,
    sneakersLevel: 1,
    jetpackLevel: 1,
    multiplierLevel: 1,
    repairKits: 2,
    shieldBoosters: 1,
    sentryTurrets: 0,
  };

  const handleBuy = (itemId: keyof PlayerInventory, cost: number, count = 1, name: string) => {
    if (playerStats.credits < cost) {
      sound.playHit();
      return;
    }
    sound.playPowerup();
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    onBuyItem?.(itemId, cost, count);
    setRecentPurchase(`Purchased ${name}!`);
    setTimeout(() => setRecentPurchase(null), 2500);
  };

  const handleUpgrade = (boosterKey: keyof PlayerInventory, cost: number, name: string) => {
    if (playerStats.credits < cost) {
      sound.playHit();
      return;
    }
    sound.playPowerup();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    onUpgradeBooster?.(boosterKey, cost);
    setRecentPurchase(`Upgraded ${name}!`);
    setTimeout(() => setRecentPurchase(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pr-10">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-arcade text-lg sm:text-2xl font-bold text-neutral-100">
                IN-GAME ITEM SHOP & ARMORY
              </h2>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Spend earned points on powerups, hoverboards, booster upgrades & military hardware!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 font-mono font-bold text-sm shadow-lg shadow-amber-500/10">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{playerStats.credits} POINTS / CREDITS</span>
            </div>
          </div>
        </div>

        {/* Purchase Notification Banner */}
        {recentPurchase && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-arcade font-bold flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-200">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{recentPurchase}</span>
          </div>
        )}

        {/* Navigation Category Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-5 overflow-x-auto no-scrollbar text-xs font-arcade font-bold">
          <button
            onClick={() => setActiveTab('runner')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'runner'
                ? 'bg-cyan-500 text-neutral-950 shadow-lg shadow-cyan-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>RUNNER POWERUPS & ITEMS</span>
          </button>

          <button
            onClick={() => setActiveTab('boosters')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'boosters'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>PERMANENT BOOSTERS</span>
          </button>

          <button
            onClick={() => setActiveTab('combat')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'combat'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>COMBAT DEPLOYABLES</span>
          </button>

          <button
            onClick={() => setActiveTab('weapons')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'weapons'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>WEAPONS ARMORY</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* 1. RUNNER POWERUPS & CONSUMABLE ITEMS */}
          {activeTab === 'runner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hoverboards 3-Pack */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-arcade text-sm font-bold text-neutral-100">HOVERBOARD (3-PACK)</h4>
                        <span className="text-[10px] font-mono text-cyan-400">IN STOCK: {inv.hoverboards}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                      300 CR
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Double-tap space or screen to ride! Protects you from 1 fatal collision into trains or obstacles with surfboard shield sparks.
                  </p>
                </div>
                <button
                  disabled={playerStats.credits < 300}
                  onClick={() => handleBuy('hoverboards', 300, 3, 'Hoverboard 3-Pack')}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-neutral-950 font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>BUY 3 HOVERBOARDS (300 CR)</span>
                </button>
              </div>

              {/* Hypersonic Headstart */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between hover:border-rose-500/50 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <Rocket className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-arcade text-sm font-bold text-neutral-100">HYPERSONIC HEADSTART</h4>
                        <span className="text-[10px] font-mono text-rose-400">IN STOCK: {inv.headstarts}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                      250 CR
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Rocket-boosted headstart! Instantly launches you 250 meters ahead through the sky, collecting every track coin automatically.
                  </p>
                </div>
                <button
                  disabled={playerStats.credits < 250}
                  onClick={() => handleBuy('headstarts', 250, 1, 'Hypersonic Headstart')}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>BUY HEADSTART (250 CR)</span>
                </button>
              </div>

              {/* Wings of Resurrection 1UP */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between hover:border-amber-500/50 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-arcade text-sm font-bold text-neutral-100">WINGS OF IMMORTALITY (1UP)</h4>
                        <span className="text-[10px] font-mono text-amber-400">IN STOCK: {inv.resurrectWings}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                      400 CR
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Instant revive! Automatically saves your run when caught by the Inspector, demon ape, or crashing into an oncoming express train.
                  </p>
                </div>
                <button
                  disabled={playerStats.credits < 400}
                  onClick={() => handleBuy('resurrectWings', 400, 1, 'Wings of Immortality')}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>BUY 1UP WINGS (400 CR)</span>
                </button>
              </div>

              {/* Super Mystery Box */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between hover:border-purple-500/50 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-arcade text-sm font-bold text-neutral-100">SUPER MYSTERY BOX</h4>
                        <span className="text-[10px] font-mono text-purple-400">IN STOCK: {inv.mysteryBoxes}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                      150 CR
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Open for mystery prizes: 200–1,500 bonus credits, hoverboards, or instant score multipliers!
                  </p>
                </div>
                <button
                  disabled={playerStats.credits < 150}
                  onClick={() => handleBuy('mysteryBoxes', 150, 1, 'Super Mystery Box')}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>BUY MYSTERY BOX (150 CR)</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. PERMANENT POWERUP BOOSTER UPGRADES */}
          {activeTab === 'boosters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coin Magnet Upgrade */}
              {(() => {
                const cost = (inv.magnetLevel || 1) * 350;
                return (
                  <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Magnet className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-arcade text-sm font-bold text-neutral-100">COIN MAGNET GENERATOR</h4>
                            <span className="text-[10px] font-mono text-blue-400">LEVEL {inv.magnetLevel || 1} / 5</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                          {cost} CR
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                        Permanently upgrades the suction radius and duration (+3.5 seconds per tier) of every Magnet in Subway Surfers and Temple Run.
                      </p>
                    </div>
                    <button
                      disabled={playerStats.credits < cost || (inv.magnetLevel || 1) >= 5}
                      onClick={() => handleUpgrade('magnetLevel', cost, 'Magnet Booster')}
                      className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span>{(inv.magnetLevel || 1) >= 5 ? 'MAX LEVEL REACHED' : `UPGRADE TO LVL ${(inv.magnetLevel || 1) + 1} (${cost} CR)`}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Super Sneakers Upgrade */}
              {(() => {
                const cost = (inv.sneakersLevel || 1) * 350;
                return (
                  <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-arcade text-sm font-bold text-neutral-100">BIONIC SUPER SNEAKERS</h4>
                            <span className="text-[10px] font-mono text-emerald-400">LEVEL {inv.sneakersLevel || 1} / 5</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                          {cost} CR
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                        Permanently boosts jump height and airtime duration (+3.0 seconds per tier), easily soaring over oncoming passenger trains.
                      </p>
                    </div>
                    <button
                      disabled={playerStats.credits < cost || (inv.sneakersLevel || 1) >= 5}
                      onClick={() => handleUpgrade('sneakersLevel', cost, 'Super Sneakers')}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span>{(inv.sneakersLevel || 1) >= 5 ? 'MAX LEVEL REACHED' : `UPGRADE TO LVL ${(inv.sneakersLevel || 1) + 1} (${cost} CR)`}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Jetpack Fuel Upgrade */}
              {(() => {
                const cost = (inv.jetpackLevel || 1) * 400;
                return (
                  <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                            <Rocket className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-arcade text-sm font-bold text-neutral-100">DUAL-EXHAUST JETPACK</h4>
                            <span className="text-[10px] font-mono text-rose-400">LEVEL {inv.jetpackLevel || 1} / 5</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                          {cost} CR
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                        Increases airborne flight time (+2.5 seconds per tier) and yields higher coin densities along high-altitude sky clouds.
                      </p>
                    </div>
                    <button
                      disabled={playerStats.credits < cost || (inv.jetpackLevel || 1) >= 5}
                      onClick={() => handleUpgrade('jetpackLevel', cost, 'Jetpack Fuel')}
                      className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/20"
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span>{(inv.jetpackLevel || 1) >= 5 ? 'MAX LEVEL REACHED' : `UPGRADE TO LVL ${(inv.jetpackLevel || 1) + 1} (${cost} CR)`}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Multiplier Star Booster */}
              {(() => {
                const cost = (inv.multiplierLevel || 1) * 400;
                return (
                  <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Star className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-arcade text-sm font-bold text-neutral-100">SCORE MULTIPLIER STAR</h4>
                            <span className="text-[10px] font-mono text-purple-400">LEVEL {inv.multiplierLevel || 1} / 5</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                          {cost} CR
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                        Lengthens the active window of the 2X Score Multiplier pickup (+4 seconds per tier), maximizing points scored per meter!
                      </p>
                    </div>
                    <button
                      disabled={playerStats.credits < cost || (inv.multiplierLevel || 1) >= 5}
                      onClick={() => handleUpgrade('multiplierLevel', cost, 'Multiplier Star')}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span>{(inv.multiplierLevel || 1) >= 5 ? 'MAX LEVEL REACHED' : `UPGRADE TO LVL ${(inv.multiplierLevel || 1) + 1} (${cost} CR)`}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 3. COMBAT DEPLOYABLES & PERKS */}
          {activeTab === 'combat' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency Nanite Med-Kit */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-arcade text-sm font-bold text-neutral-100">NANITE MED-KIT</h4>
                        <span className="text-[10px] font-mono text-emerald-400">IN STOCK: {inv.repairKits}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                      200 CR
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Tactical combat medicine: Instantly repairs 50 HP in Cyber Storm Arena, Zombie Bunker, and Space Invaders!
                  </p>
                </div>
                <button
                  disabled={playerStats.credits < 200}
                  onClick={() => handleBuy('repairKits', 200, 1, 'Nanite Med-Kit')}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>BUY MED-KIT (200 CR)</span>
                </button>
              </div>

              {/* Overdrive Shield Barrier */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-arcade text-sm font-bold text-neutral-100">SHIELD OVERCHARGER</h4>
                        <span className="text-[10px] font-mono text-cyan-400">IN STOCK: {inv.shieldBoosters}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                      250 CR
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Deployable energy shielding: Grants a 100-point kinetic energy barrier protecting from incoming projectile fire.
                  </p>
                </div>
                <button
                  disabled={playerStats.credits < 250}
                  onClick={() => handleBuy('shieldBoosters', 250, 1, 'Shield Overcharger')}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-neutral-950 font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>BUY SHIELD (250 CR)</span>
                </button>
              </div>

              {/* Automated Sentry Turret */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <Crosshair className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-arcade text-sm font-bold text-neutral-100">AUTONOMOUS SENTRY DRONE</h4>
                        <span className="text-[10px] font-mono text-rose-400">IN STOCK: {inv.sentryTurrets}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                      350 CR
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Deploy an autonomous rapid-fire turret that targets enemies automatically during high-density combat waves.
                  </p>
                </div>
                <button
                  disabled={playerStats.credits < 350}
                  onClick={() => handleBuy('sentryTurrets', 350, 1, 'Autonomous Sentry Drone')}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white font-arcade font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>BUY SENTRY DRONE (350 CR)</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. WEAPONS ARMORY & UPGRADES */}
          {activeTab === 'weapons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INITIAL_WEAPONS.map(w => {
                const isUnlocked = playerStats.unlockedWeapons.includes(w.id);
                const currentLevel = playerStats.weaponLevels[w.id] || 1;
                const upgradeCost = currentLevel * 200;
                const canAffordUnlock = playerStats.credits >= w.cost;
                const canAffordUpgrade = playerStats.credits >= upgradeCost;

                return (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-arcade text-sm font-bold text-neutral-200">
                              {w.name}
                            </span>
                            {isUnlocked && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                                LVL {currentLevel}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                            {w.type} class
                          </span>
                        </div>

                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: w.color }}
                        />
                      </div>

                      <p className="text-xs text-neutral-400 font-mono mb-3 line-clamp-2">
                        {w.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400 bg-neutral-900/60 p-2 rounded-lg mb-3">
                        <div>
                          DMG: <strong className="text-neutral-200">{Math.round(w.damage * (1 + (currentLevel - 1) * 0.25))}</strong>
                        </div>
                        <div>
                          BURST: <strong className="text-neutral-200">{w.bulletsPerShot}x</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      {!isUnlocked ? (
                        <button
                          disabled={!canAffordUnlock}
                          onClick={() => {
                            sound.playPowerup();
                            onUnlockWeapon(w.id, w.cost);
                          }}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-arcade font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>UNLOCK ({w.cost} CR)</span>
                        </button>
                      ) : (
                        <button
                          disabled={!canAffordUpgrade}
                          onClick={() => {
                            sound.playPowerup();
                            onUpgradeWeapon(w.id, upgradeCost);
                          }}
                          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-neutral-950 font-arcade font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>UPGRADE TO LVL {currentLevel + 1} ({upgradeCost} CR)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
