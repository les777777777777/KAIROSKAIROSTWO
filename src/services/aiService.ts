import { GoogleGenAI } from "@google/genai";

const getApiKey = (): string => {
  const meta = import.meta as any;
  return (
    (typeof import.meta !== 'undefined' && meta && meta.env && meta.env.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ||
    ""
  );
};

let aiInstance: GoogleGenAI | null = null;
const getAIClient = (): GoogleGenAI | null => {
  if (!aiInstance) {
    const key = getApiKey();
    if (key) {
      aiInstance = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiInstance;
};

export interface UserSnapshot {
  tasksCompleted: number;
  tasksTotal: number;
  routineCompleted: number;
  routineTotal: number;
  wellnessCompleted: number;
  wellnessTotal: number;
  streak: number;
  balance: number;
  mascotName: string;
  usageHours?: number;
  state?: 'active' | 'inactive' | 'saturated' | 'constant';
}

export type AIQueryType = 'why' | 'improve' | 'summary' | 'status' | 'open';

// Cache for AI responses to save quota
const thoughtCache: Record<string, { thought: string, timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getMascotThoughtOffline(snapshot: UserSnapshot, queryType: AIQueryType, userQuestion?: string): string {
  if (queryType === 'status') {
    if (snapshot.balance > 70) {
      return `Siento una gran armonía en tu día. Con un ${snapshot.balance}% de energía y ${snapshot.tasksCompleted}/${snapshot.tasksTotal} tareas, estás fluyendo a la perfección.`;
    }
    if (snapshot.balance < 40) {
      return `La energía está algo dispersa (${snapshot.balance}%). Es un buen momento para detenerte, respirar y sintonizar tus hábitos de bienestar.`;
    }
    return `Tu ritmo es constante hoy con ${snapshot.balance}% de balance energético en tu racha de ${snapshot.streak} días.`;
  }

  if (queryType === 'why') {
    return `Tu balance está en ${snapshot.balance}% debido a tu progreso de hoy: has completado ${snapshot.tasksCompleted} de ${snapshot.tasksTotal} tareas y ${snapshot.wellnessCompleted} hábitos de bienestar. Cada acción suma para equilibrar tu esencia diaria.`;
  }

  if (queryType === 'improve') {
    if (snapshot.wellnessCompleted < snapshot.wellnessTotal) {
      return `Para elevar tu balance de ${snapshot.balance}%, te sugiero completar uno de tus hábitos de bienestar pendientes. Un pequeño hábito en tu racha de ${snapshot.streak} días hace una gran diferencia.`;
    }
    if (snapshot.tasksCompleted < snapshot.tasksTotal) {
      return `Llevas una racha de ${snapshot.streak} días. Elige la tarea más pequeña e insignificante y complétala ahora mismo para activar tu balance de ${snapshot.balance}%.`;
    }
    return `Tu balance de hoy está excelente. Tómate un tiempo de calma para cerrar los ojos, respirar hondo y consolidar tu día con serenidad.`;
  }

  if (queryType === 'summary') {
    return `Hoy has conquistado ${snapshot.tasksCompleted} metas y realizado ${snapshot.routineCompleted} rutinas. Mantener tu racha de ${snapshot.streak} días demuestra tu increíble constancia en el sendero del tiempo.`;
  }

  // Open / User question fallback
  const query = (userQuestion || "").toLowerCase();
  if (query.includes("hola") || query.includes("buen") || query.includes("saludo") || query.includes("quien eres") || query.includes("kairo") || query.includes("mascota")) {
    return `¡Hola! Soy ${snapshot.mascotName}, tu guardián personal del tiempo. En este momento tienes una racha de ${snapshot.streak} días y un ${snapshot.balance}% de esencia. ¿En qué aspecto de tu bienestar u organización quisieras enfocar nuestra sintonía hoy?`;
  }
  if (query.includes("tarea") || query.includes("pendiente") || query.includes("organi") || query.includes("hacer") || query.includes("falta")) {
    const pending = snapshot.tasksTotal - snapshot.tasksCompleted;
    if (pending <= 0) {
      return `¡Excelente trabajo! Has completado todas tus tareas (${snapshot.tasksCompleted}/${snapshot.tasksTotal}). Tu balance energético está en un brillante ${snapshot.balance}%. Es un gran día para descansar o planificar con serenidad.`;
    }
    return `Actualmente tienes ${pending} tareas pendientes de un total de ${snapshot.tasksTotal}. Con un balance del ${snapshot.balance}%, te sugiero enfocarte en una sola tarea a la vez. ¿Te gustaría algún consejo para vencer la procrastinación en tu racha de ${snapshot.streak} días?`;
  }
  if (query.includes("bienestar") || query.includes("habito") || query.includes("remind") || query.includes("salud") || query.includes("medita") || query.includes("ritual") || query.includes("respirar") || query.includes("ejercicio")) {
    return `Los hábitos de bienestar sostienen tu día. Hoy has completado ${snapshot.wellnessCompleted} de ${snapshot.wellnessTotal} actividades de bienestar. Para potenciar tu balance del ${snapshot.balance}%, tómate una pausa de 3 minutos para estirarte y respirar hondo.`;
  }
  if (query.includes("racha") || query.includes("streak") || query.includes("consiste")) {
    return `¡Llevas ${snapshot.streak} días de racha consecutivos! La constancia es la clave de la maestría temporal. Sigue protegiendo tu balance (${snapshot.balance}%) paso a paso, sin presiones.`;
  }
  if (query.includes("balance") || query.includes("esencia") || query.includes("energia") || query.includes("estado")) {
    if (snapshot.balance > 70) {
      return `Tu esencia está en un nivel alto: ${snapshot.balance}%. Te sientes en equilibrio y en plena sintonía. Aprovecha esta energía para avanzar en tus rutinas más importantes.`;
    }
    if (snapshot.balance < 40) {
      return `Tu esencia está algo baja (${snapshot.balance}%). No te satures de exigencias. Es momento de priorizar el descanso y tus hábitos de bienestar para recuperar tu energía.`;
    }
    return `Tienes una esencia intermedia del ${snapshot.balance}%. Un equilibrio saludable entre acción y pausa de bienestar te mantendrá constante en tu racha de ${snapshot.streak} días.`;
  }
  if (query.includes("consejo") || query.includes("ayuda") || query.includes("productiv") || query.includes("tip")) {
    return `Aquí tienes un consejo de productividad consciente de ${snapshot.mascotName}: Aplica la regla de los 2 minutos. Si una tarea pendiente toma menos de dos minutos, hazla ya. Así liberarás espacio mental y elevarás ese ${snapshot.balance}% de balance actual.`;
  }
  if (query.includes("gracias") || query.includes("excelente") || query.includes("buenisimo") || query.includes("ok")) {
    return `¡Un placer guiarte! Recuerda que cada paso en tus ${snapshot.streak} días de racha es parte de tu sintonía con el tiempo. ¡Sigue fluyendo!`;
  }
  return `Entiendo perfectamente tu inquietud. Considerando tu racha actual de ${snapshot.streak} días y tu esencia al ${snapshot.balance}%, mi recomendación es que sigas el orden de tus rutinas diarias y des prioridad al bienestar primero.`;
}

export const AIService = {
  async getMascotThought(snapshot: UserSnapshot, queryType: AIQueryType = 'status', userQuestion?: string): Promise<string> {
    const aiClient = getAIClient();
    if (!aiClient) {
      return getMascotThoughtOffline(snapshot, queryType, userQuestion);
    }

    // Generate a cache key based on basic state data
    const cacheKey = `${queryType}-${snapshot.tasksCompleted}-${snapshot.wellnessCompleted}-${snapshot.balance}-${userQuestion || ''}`;
    const now = Date.now();
    
    if (thoughtCache[cacheKey] && (now - thoughtCache[cacheKey].timestamp < CACHE_TTL) && queryType !== 'open') {
      return thoughtCache[cacheKey].thought;
    }

    const contextStr = `
      DATOS REALES DEL USUARIO:
      - Tareas: ${snapshot.tasksCompleted}/${snapshot.tasksTotal} (${Math.round((snapshot.tasksCompleted/snapshot.tasksTotal)*100 || 0)}%)
      - Rutinas: ${snapshot.routineCompleted}/${snapshot.routineTotal}
      - Bienestar: ${snapshot.wellnessCompleted}/${snapshot.wellnessTotal}
      - Racha: ${snapshot.streak} días consecuentes
      - Balance Energético: ${snapshot.balance}/100
      - Estado sugerido: ${snapshot.state || 'activo'}
    `;

    const instructions = {
      status: "Escribe un pensamiento MUY breve basado en sus datos actuales. Sé poético pero basado en su balance energético.",
      why: `Analiza por qué el usuario tiene un balance de ${snapshot.balance}/100. Relaciónalo con que ha completado ${snapshot.tasksCompleted} de ${snapshot.tasksTotal} tareas y ${snapshot.wellnessCompleted} actividades de bienestar. Sé directo y analítico.`,
      improve: `Basado en que lleva ${snapshot.streak} días de racha y hoy tiene ${snapshot.balance}% de energía, sugiere UNA acción física o mental concreta para subir su balance ahora mismo.`,
      summary: `Actúa como un cronista del tiempo. Resume que hoy se han logrado ${snapshot.tasksCompleted} metas y ${snapshot.routineCompleted} rutinas. Comenta sobre la consistencia de su racha de ${snapshot.streak} días.`,
      open: `El usuario pregunta: "${userQuestion}". Responde usando sus datos reales (Tareas: ${snapshot.tasksCompleted}/${snapshot.tasksTotal}, Balance: ${snapshot.balance}%, Racha: ${snapshot.streak}) para dar una respuesta fundamentada y no genérica.`
    };

    const maxRetries = 3;
    let attempt = 0;

    const executeWithRetry = async (): Promise<string> => {
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash", // Replaced with general production gemini-3.5-flash
          contents: [
            {
              role: "user",
              parts: [{
                text: `Eres ${snapshot.mascotName}, el guardián de tiempo de Kairos. No eres un bot genérico, eres un analista de bienestar que conoce perfectamente al usuario.
                
                ${contextStr}
                
                INSTRUCCIÓN: ${instructions[queryType]}
                
                REGLAS CRÍTICAS:
                - PROHIBIDO usar frases como "Vas bien" o "Sigue así" sin justificar con datos.
                - DEBES mencionar al menos un dato numérico del contexto en tu respuesta.
                - Máximo 2 líneas de texto.
                - Tono humano y sabio.
                - Idioma: Español. Sin emojis.`
              }]
            }
          ],
          config: {
            temperature: 0.8,
            maxOutputTokens: 120,
          }
        });

        const result = response.text?.trim() || "La respuesta está en tu ritmo de hoy.";
        
        // Update cache
        thoughtCache[cacheKey] = { thought: result, timestamp: Date.now() };
        
        return result;
      } catch (error: any) {
        // Fall back to offline response if API fails
        const isRateLimit = error?.message?.includes("429") || error?.status === 429 || JSON.stringify(error).includes("429");
        
        if (isRateLimit && attempt < maxRetries) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          console.warn(`AI Rate limited. Retrying in ${Math.round(waitTime)}ms (Attempt ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return executeWithRetry();
        }
        
        console.error("AI Error after retries, returning offline fallback:", error);
        return getMascotThoughtOffline(snapshot, queryType, userQuestion);
      }
    };

    return executeWithRetry();
  },

  async getChatResponse(
    snapshot: UserSnapshot,
    chatHistory: { sender: 'user' | 'bot'; text: string }[]
  ): Promise<string> {
    const aiClient = getAIClient();
    if (!aiClient) {
      const lastUserMsg = [...chatHistory].reverse().find(m => m.sender === 'user')?.text || "";
      return getMascotThoughtOffline(snapshot, 'open', lastUserMsg);
    }

    const systemPrompt = `Eres Kairo, el asistente IA personal de esta app de productividad. El usuario tiene: ${snapshot.streak} días de racha, ${snapshot.balance}% de esencia/balance, ${snapshot.tasksTotal} tareas (${snapshot.tasksCompleted} completadas), ${snapshot.wellnessTotal} hábitos de bienestar (${snapshot.wellnessCompleted} completados), ${snapshot.routineTotal} rutinas. Responde siempre en español, de forma motivadora, concisa y personalizada. Puedes ayudar con: organización del tiempo, motivación, consejos de productividad, bienestar, y cualquier pregunta general.`;

    // Map history to the format expected by GoogleGenAI generateContent (role: user or model)
    const contents = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
        }
      });
      return response.text?.trim() || "He sentido una perturbación en el flujo temporal, ¿podrías repetirme la pregunta?";
    } catch (error) {
      console.error("Error in getChatResponse:", error);
      const lastUserMsg = [...chatHistory].reverse().find(m => m.sender === 'user')?.text || "";
      return getMascotThoughtOffline(snapshot, 'open', lastUserMsg);
    }
  }
};