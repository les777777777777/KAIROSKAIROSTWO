import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthScreenProps {
  darkMode?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ darkMode }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const theme = {
    bg: darkMode ? 'bg-slate-950' : 'bg-gradient-to-br from-amber-50 via-rose-50 to-sky-100',
    card: darkMode ? 'bg-slate-900/60' : 'bg-white/40',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textTitle: darkMode ? 'text-white' : 'text-deep-teal',
    textMuted: darkMode ? 'text-slate-400' : 'text-deep-teal/40',
    border: darkMode ? 'border-white/10' : 'border-white/40'
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      console.log("Attempting Google Login via Popup...");
      const result = await signInWithPopup(auth, provider);
      console.log("Login Success:", result.user.email);
    } catch (err: any) {
      console.error("Login Error Details:", err);
      
      const errorCode = err.code;
      const errorMessage = err.message;
      const currentHost = window.location.hostname;

      if (errorCode === 'auth/popup-closed-by-user') {
        setError('El inicio de sesión fue cancelado. Asegúrate de completar el proceso en la ventana emergente.');
      } else if (errorCode === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.');
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError('El inicio de sesión con Google no está habilitado en la consola de Firebase -> Authentication -> Sign-in method.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Error de red. Verifica tu conexión a internet.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError(`Dominio no autorizado (${currentHost}). Agrégalo en la consola de Firebase -> Authentication -> Settings -> Authorized Domains.`);
      } else {
        setError(`Error (${errorCode}): ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-500`}>
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-40 -left-40 w-[600px] h-[600px] ${darkMode ? 'bg-indigo-500/5' : 'bg-sunset-orange/10'} blur-[100px] rounded-full`}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -bottom-40 -right-40 w-[500px] h-[500px] ${darkMode ? 'bg-emerald-500/5' : 'bg-emerald-500/10'} blur-[100px] rounded-full`}
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md ${theme.card} backdrop-blur-3xl rounded-[4rem] p-12 shadow-[0_32px_64px_rgba(0,0,0,0.08)] relative z-10 text-center flex flex-col items-center gap-12 border ${theme.border}`}
      >
        <div className="space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-24 h-24 rounded-[2.5rem] mx-auto overflow-hidden shadow-2xl shadow-sunset-orange/30"
          >
            <img src="/KAIROS_LOGO.png" alt="Kairos" className="w-full h-full object-cover" />
          </motion.div>
          <div className="space-y-2">
            <h1 className={`text-5xl font-black tracking-tighter ${theme.textTitle} italic`}>Kairos</h1>
            <p className={`${theme.textMuted} font-bold text-lg tracking-tight`}>Tiempo con sentido.</p>
          </div>
        </div>

        <div className="w-full space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 ${darkMode ? 'bg-rose-950/20' : 'bg-rose-50'} border border-rose-100 rounded-2xl space-y-3`}
            >
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">{error}</p>
              
              {error.includes('Dominio no autorizado') && (
                <button 
                  onClick={() => navigator.clipboard.writeText(window.location.hostname)}
                  className={`flex items-center gap-2 text-[9px] font-bold text-rose-600 hover:text-rose-700 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-white/50'} px-3 py-1.5 rounded-lg border border-rose-100`}
                >
                  <Copy size={12} />
                  COPIAR DOMINIO
                </button>
              )}
            </motion.div>
          )}

          {window.self !== window.top && (
            <div className={`p-4 ${darkMode ? 'bg-amber-950/20' : 'bg-amber-50'} border border-amber-100 rounded-2xl flex flex-col items-center gap-2`}>
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">⚠️ Ejecución en un iframe detectada</p>
              <a 
                href={window.location.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-[10px] font-bold text-amber-700 ${darkMode ? 'bg-slate-800' : 'bg-white/50'} px-4 py-2 rounded-xl border border-amber-100 hover:opacity-80 transition-all shadow-sm`}
              >
                <ExternalLink size={14} />
                ABRIR EN PESTAÑA NUEVA
              </a>
            </div>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full py-6 ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'} shadow-xl shadow-black/[0.03] rounded-[2.5rem] flex items-center justify-center gap-4 group transition-all border disabled:opacity-50`}
          >
            <div className={`w-8 h-8 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'} rounded-full flex items-center justify-center`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span className={`text-base font-black ${theme.textTitle} uppercase tracking-widest`}>
              {loading ? 'Sincronizando...' : 'Entrar con Google'}
            </span>
            <ArrowRight size={20} className={`${darkMode ? 'text-white/20' : 'text-deep-teal/20'} group-hover:text-current group-hover:translate-x-1 transition-all`} />
          </motion.button>
        </div>

        <div className={`pt-6 border-t ${darkMode ? 'border-white/5' : 'border-deep-teal/5'} w-full`}>
          <p className={`text-[10px] ${darkMode ? 'text-white/20' : 'text-deep-teal/20'} font-black uppercase tracking-[0.4em]`}>Experiencia Vital</p>
        </div>
      </motion.div>
    </div>
  );
};
