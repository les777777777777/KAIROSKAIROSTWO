import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Share2, 
  Copy, 
  HandMetal, 
  TrendingUp, 
  Clock, 
  Check,
  ChevronRight,
  LogOut,
  UserPlus
} from 'lucide-react';
import { SocialService, UserProfile, Interaction } from '../services/socialService';
import { TimeMascot } from './TimeMascot';
import { auth } from '../lib/firebase';

interface FriendsViewProps {
  darkMode?: boolean;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ darkMode }) => {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const theme = {
    bg: darkMode ? 'bg-slate-950' : 'bg-slate-50',
    card: darkMode ? 'bg-slate-900' : 'bg-white',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textTitle: darkMode ? 'text-white' : 'text-deep-teal',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-500',
    border: darkMode ? 'border-white/10' : 'border-slate-100',
    itemBg: darkMode ? 'bg-slate-800' : 'bg-slate-50',
    inputBg: darkMode ? 'bg-slate-800' : 'bg-rose-50',
    modalBg: darkMode ? 'bg-slate-900' : 'bg-white',
    shadow: darkMode ? 'shadow-xl shadow-black/20' : 'shadow-xl shadow-black/[0.02]'
  };

  useEffect(() => {
    const fetchMyProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const p = await SocialService.getUser(user.uid);
        setMyProfile(p);
      }
    };
    fetchMyProfile();

    const unsub = SocialService.subscribeToFriends((data) => {
      setFriends(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCopyId = () => {
    if (myProfile?.kairosId) {
      navigator.clipboard.writeText(myProfile.kairosId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    const textToShare = `Únete a Kairos con mi ID: ${myProfile?.kairosId || ''} — https://timefy-two.vercel.app`;
    if (navigator.share) {
      try {
        await navigator.share({
          text: textToShare
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(textToShare);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const handleSearch = async () => {
    const term = searchId.trim();
    if (!term) return;
    const normalizedId = term.startsWith('@') ? term : `@${term}`;
    const result = await SocialService.getUserByKairosId(normalizedId);
    setSearchResult(result || null);
  };

  const handleAddFriend = async (uid: string) => {
    await SocialService.addFriend(uid);
    setIsSearchOpen(false);
    setSearchResult(null);
    setSearchId('');
  };

  const isUserActive = (lastActive: any) => {
    if (!lastActive) return false;
    const date = lastActive.toDate ? lastActive.toDate() : new Date(lastActive);
    const diff = (new Date().getTime() - date.getTime()) / 1000 / 60;
    return diff < 15;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-12 h-12 rounded-full border-t-2 border-sunset-orange animate-spin" />
      <p className="text-sunset-wine/40 font-bold">Invocando compañía...</p>
    </div>
  );

  return (
    <div className={`space-y-10 pb-36 md:pb-12 px-4 sm:px-6 md:px-8 pt-6 md:pt-12 no-scrollbar ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} ${theme.text}`}>
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sunset-pink animate-pulse" />
            <p className="text-[10px] font-black text-sunset-pink uppercase tracking-[0.3em] italic">Social</p>
          </div>
          <h2 className={`text-4xl font-black ${theme.textTitle} tracking-tight leading-none italic`}>Sintonía</h2>
          <div 
            onClick={handleCopyId}
            className="flex items-center gap-2 cursor-pointer group mt-2"
          >
            <p className={`${darkMode ? 'text-white/40' : 'text-deep-teal/40'} font-black text-[9px] uppercase tracking-widest ${theme.itemBg} px-3 py-1.5 rounded-full transition-all flex items-center gap-2`}>
              ID: {myProfile?.kairosId || '@cargando...'}
              {copied ? <Check size={10} className="text-mint" /> : <Copy size={10} />}
            </p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsInviteOpen(true)}
          className={`w-16 h-16 ${darkMode ? 'bg-mint text-slate-900' : 'bg-deep-teal text-white'} rounded-[2.5rem] flex items-center justify-center shadow-2xl`}
        >
          <Plus size={32} />
        </motion.button>
      </header>

      {/* Friends List - Leaderboard Style */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h4 className={`text-[10px] font-black ${darkMode ? 'text-white/40' : 'text-deep-teal/40'} uppercase tracking-[0.2em] italic`}>Comunidad Activa</h4>
          <button 
            onClick={() => setIsSearchOpen(true)}
            className={`text-[10px] font-black ${theme.textTitle} uppercase tracking-widest flex items-center gap-2`}
          >
            <Search size={14} /> Buscar
          </button>
        </div>

        {friends.length > 0 ? (
          <div className="space-y-4">
            {friends.map((friend) => {
              const active = isUserActive(friend.lastActive);
              return (
                <motion.div 
                  key={friend.uid}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedFriend(friend)}
                  className={`bento-card p-6 flex items-center justify-between border ${theme.border} cursor-pointer transition-all duration-500 ${active ? `${theme.card} ${theme.shadow}` : `${theme.itemBg} opacity-60`}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[2rem] ${theme.itemBg} p-1 flex items-center justify-center relative shadow-inner overflow-hidden`}>
                       <div className="scale-[0.3]">
                          <TimeMascot streak={friend.streak} balance={friend.balance} />
                       </div>
                    </div>
                    <div>
                      <h3 className={`text-xl font-black italic tracking-tight ${active ? theme.textTitle : theme.textMuted}`}>{friend.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-sunset-pink uppercase tracking-widest">{friend.kairosId}</span>
                        <div className={`w-1 h-1 rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                        <span className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>{friend.streak} ✨</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className={`w-3 h-3 rounded-full ${active ? 'bg-mint shadow-[0_0_15px_rgba(65,184,162,0.6)] animate-pulse' : (darkMode ? 'bg-white/10' : 'bg-slate-200')}`} />
                    <p className={`text-[8px] font-black ${theme.textMuted} uppercase tracking-widest`}>{active ? 'ONLINE' : 'OFFLINE'}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-50'} rounded-[3.5rem] py-24 px-12 text-center space-y-6 border border-dashed ${theme.border}`}>
            <div className={`w-20 h-20 ${theme.card} rounded-[2rem] flex items-center justify-center mx-auto shadow-sm`}>
              <Users size={32} className={theme.textMuted} />
            </div>
            <div className="space-y-2">
               <p className={`text-sm font-black ${theme.textTitle} tracking-tighter italic`}>Sincroniza tu camino</p>
               <p className={`text-[10px] font-medium ${theme.textMuted} uppercase tracking-widest leading-relaxed px-4`}>Invita a tus amigos para compartir la racha y progresar juntos.</p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Invite Options */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsInviteOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm p-5 xs:p-8 md:p-10 ${theme.modalBg} ${theme.text} shadow-2xl space-y-8 rounded-3xl md:rounded-[3.5rem] border ${theme.border} max-h-[90vh] overflow-y-auto no-scrollbar`}
            >
              <div className="text-center space-y-2">
                <h3 className={`text-3xl font-black ${theme.textTitle}`}>Invitar</h3>
                <p className={`text-xs font-bold ${theme.textMuted}`}>Comparte tu presencia en Kairos</p>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleCopyId}
                  className={`w-full p-6 ${theme.itemBg} rounded-[2rem] flex items-center justify-between px-8 text-sunset-orange group transition-all font-black text-[11px] uppercase tracking-widest`}
                >
                  {myProfile?.kairosId}
                  <Copy size={16} />
                </button>
                <button 
                  onClick={handleShareLink}
                  className="w-full p-6 sunset-gradient rounded-[2rem] flex items-center justify-center gap-3 text-white shadow-xl shadow-sunset-orange/20 font-black text-[11px] uppercase tracking-widest"
                >
                  {copiedShare ? (
                    <>
                      <Check size={18} />
                      ¡Enlace Copiado!
                    </>
                  ) : (
                    <>
                      <Share2 size={18} />
                      Compartir Enlace
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Search/Add Friend */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-sm p-5 xs:p-8 md:p-10 ${theme.modalBg} ${theme.text} shadow-2xl space-y-6 rounded-3xl md:rounded-[3.5rem] border ${theme.border} max-h-[90vh] overflow-y-auto no-scrollbar`}
            >
              <div className="space-y-1">
                <h3 className={`text-2xl font-black ${theme.textTitle}`}>Buscar Amigo</h3>
                <p className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>Ingresa el ID @kairos_...</p>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="@kairos_..."
                  className={`flex-1 p-5 ${theme.inputBg} border ${theme.border} rounded-[1.5rem] focus:ring-4 focus:ring-sunset-orange/10 font-black ${theme.text} uppercase tracking-widest outline-none`}
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value.toLowerCase());
                    setSearchResult(undefined);
                  }}
                />
                <button 
                  onClick={handleSearch}
                  className="w-16 h-16 sunset-gradient text-white rounded-[1.5rem] flex items-center justify-center shadow-lg"
                >
                  <Search size={24} />
                </button>
              </div>

              {searchResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`p-4 ${theme.itemBg} rounded-[2rem] flex items-center justify-between border ${theme.border}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20">
                      <img src={searchResult.photoURL} alt="" />
                    </div>
                    <div>
                      <p className={`text-xs font-black ${theme.textTitle}`}>{searchResult.name}</p>
                      <p className="text-[8px] font-black text-sunset-orange uppercase tracking-widest">{searchResult.kairosId}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddFriend(searchResult.uid)}
                    className="p-2 bg-deep-teal text-white rounded-xl shadow-lg"
                  >
                    <UserPlus size={16} />
                  </button>
                </motion.div>
              )}

              {searchResult === null && searchId.trim().length > 2 && (
                <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl text-xs font-bold text-center">
                  No se encontró ningún usuario con ese ID
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Interaction Actions */}
      <AnimatePresence>
        {selectedFriend && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 pb-20">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedFriend(null)}
              className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
              className={`relative w-full max-w-sm p-5 xs:p-8 md:p-10 ${theme.modalBg} ${theme.text} shadow-2xl space-y-8 rounded-3xl md:rounded-[4rem] border ${theme.border} max-h-[90vh] overflow-y-auto no-scrollbar`}
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] sunset-gradient p-1 flex items-center justify-center relative shadow-xl shadow-sunset-orange/10">
                   <div className={`w-full h-full ${theme.card} rounded-[1.8rem] flex items-center justify-center overflow-hidden`}>
                      <div className="scale-[0.4]">
                         <TimeMascot streak={selectedFriend.streak} balance={selectedFriend.balance} />
                      </div>
                   </div>
                   <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 ${darkMode ? 'border-slate-900' : 'border-white'} ${isUserActive(selectedFriend.lastActive) ? 'bg-mint' : 'bg-slate-200'}`} />
                </div>
                <div>
                  <h3 className={`text-3xl font-black ${theme.textTitle} tracking-tight`}>{selectedFriend.name}</h3>
                  <p className={`text-[10px] font-black text-sunset-orange uppercase tracking-[.2em] ${theme.textMuted}`}>Compañía en sintonía</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <HandMetal />, label: 'Bien hecho', type: 'well_done' },
                  { icon: <TrendingUp />, label: 'Sigue así', type: 'keep_going' },
                  { icon: <Clock />, label: 'Descansa', type: 'rest' }
                ].map((action) => (
                  <motion.button 
                    key={action.type}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      SocialService.sendInteraction(selectedFriend.uid, action.type as any);
                      setSelectedFriend(null);
                    }}
                    className={`p-5 flex flex-col items-center gap-3 ${theme.itemBg} rounded-[2rem] hover:bg-sunset-orange hover:text-white transition-all group shadow-sm`}
                  >
                    <div className={`${darkMode ? 'text-white' : 'text-deep-teal'} group-hover:text-white transition-colors`}>{action.icon}</div>
                    <span className="text-[9px] font-black uppercase text-center leading-tight tracking-wider">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};