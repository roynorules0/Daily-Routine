import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

function formatTime12h(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 is 12
  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');
  return `${hStr}:${mStr}:${sStr} ${ampm}`;
}

async function generateContentWithFallback(ai: GoogleGenAI, config: any): Promise<any> {
  const primaryModel = config.model || 'gemini-3.5-flash';
  const alternativeModel = 'gemini-3.1-flash-lite';
  
  const models = [primaryModel, alternativeModel];
  const uniqueModels = Array.from(new Set(models));
  
  let lastError: any = null;
  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        ...config,
        model
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.log(`[Gemini SDK Info] Moving to fallback option because ${model} is currently busy.`);
    }
  }
  throw lastError;
}

// Unified Global User State Store (synchronized in real-time from front-end)
let globalLanguage: 'hindi' | 'hinglish' | 'english' = 'hinglish';
const chatLanguages: Record<number, 'hindi' | 'hinglish' | 'english'> = {};

function getLanguageInstruction(lang: 'hindi' | 'hinglish' | 'english'): string {
  if (lang === 'hindi') {
    return `Output MUST be written in pure Hindi using Devanagari script (हिंदी भाषा, देवनागरी लिपि). Use Hindi terms but keep english technical names where helpful in brackets, e.g. "लैट पुलडाउन (Lat Pulldown)". Ensure the response style is friendly, clear, respectful and extremely actionable, utilizing bullet points, bold headers, and clean step-by-step paragraphs. NEVER use military-robotic or overly dense blocks.`;
  } else if (lang === 'hinglish') {
    return `Output MUST be written in Hinglish (Hindi language using English/Latin alphabets, standard youngster texting style in India, e.g., "Aapka focus area shoulder press h, back seedhi rakho..."). Keep it highly motivating, informal, easy to read, with clear line-breaks, spacing, bold headings, and bullet steps. No robotic style and no massive paragraphs.`;
  } else {
    return `Output MUST be written in clear, concise English. Maximize readability through standard bold bullet lists, short sentences (maximum 3 lines per paragraph), easy-to-digest headings, and dynamic encouraging steps. No dense blocks or complex language jargon.`;
  }
}

function getFormatInstruction(type: 'gym' | 'study' | 'motivation' | 'diet', lang: 'hindi' | 'hinglish' | 'english'): string {
  if (type === 'gym') {
    const headings = {
      hindi: { exercise: "व्यायाम:", target: "🎯 लक्षित मांसपेशी (Target):", steps: "📌 कैसे करें (Kaise Kare):", mistakes: "❌ गलतियाँ (Galtiyan):", benefits: "💪 फायदे (Fayda):" },
      hinglish: { exercise: "Exercise:", target: "🎯 Target:", steps: "📌 Kaise Kare:", mistakes: "❌ Galtiyan:", benefits: "💪 Fayda:" },
      english: { exercise: "Exercise:", target: "🎯 Target:", steps: "📌 How To Do:", mistakes: "❌ Mistakes to Avoid:", benefits: "💪 Benefits:" }
    }[lang];

    return `Format EACH exercise in your workout plan exactly using this custom template block:
${headings.exercise} [Exercise Name]

${headings.target}
[Target Muscle Group]

${headings.steps}
1. [Step]
2. [Step]
3. [Step]

${headings.mistakes}
• [Mistake 1]
• [Mistake 2]

${headings.benefits}
• [Benefit 1]
• [Benefit 2]

🎥 Watch Video`;
  }

  if (type === 'study') {
    const headings = {
      hindi: { title: "📚 [Subject Name] रिवीजन", chapter: "अध्याय (Chapter):", time: "⏰ समय:", tasks: "📌 क्या करना है (Kya Karna Hai):", goal: "🎯 लक्ष्य:" },
      hinglish: { title: "📚 [Subject Name] Revision", chapter: "Chapter:", time: "⏰ Time:", tasks: "📌 Kya Karna Hai:", goal: "🎯 Goal:" },
      english: { title: "📚 [Subject Name] Revision", chapter: "Chapter:", time: "⏰ Time:", tasks: "📌 What To Do:", goal: "🎯 Goal:" }
    }[lang];

    return `Format the study outline exactly using this custom template block:
${headings.title}

${headings.chapter}
[Chapter Name]

${headings.time}
[Duration or Time]

${headings.tasks}
• [Task 1]
• [Task 2]
• [Task 3]

${headings.goal}
[Chapter Complete or Specific Goal]`;
  }

  if (type === 'motivation') {
    const headings = {
      hindi: { title: "🔥 आज का मोटिवेशन", closing: "💪 आगे बढ़ते रहो।" },
      hinglish: { title: "🔥 Aaj Ka Motivation", closing: "💪 Keep Going." },
      english: { title: "🔥 Today's Motivation", closing: "💪 Keep Going." }
    }[lang];

    return `Format the motivation message exactly as follows:
${headings.title}

[Recipient Name (Default: Roy)],

[Message line 1]
[Message line 2]
[Message line 3]

${headings.closing}`;
  }

  if (type === 'diet') {
    const headings = {
      hindi: { title: "🥗 [Goal/Diet Type] डाइट", breakfast: "🌅 नाश्ता (Breakfast)", lunch: "🍛 दोपहर का भोजन (Lunch)", dinner: "🌙 रात का भोजन (Dinner)", preWorkout: "🏋️‍♂️ प्री-वर्कआउट (Pre-Workout)", postWorkout: "🥛 पोस्ट-वर्कआउट (Post-Workout)", water: "💧 पानी (Water)" },
      hinglish: { title: "🥗 [Goal/Diet Type] Diet", breakfast: "🌅 Breakfast", lunch: "🍛 Lunch", dinner: "🌙 Dinner", preWorkout: "🏋️‍♂️ Pre Workout", postWorkout: "🥛 Post Workout", water: "💧 Water" },
      english: { title: "🥗 [Goal/Diet Type] Diet", breakfast: "🌅 Breakfast", lunch: "🍛 Lunch", dinner: "🌙 Dinner", preWorkout: "🏋️‍♂️ Pre-Workout", postWorkout: "🥛 Post-Workout", water: "💧 Water" }
    }[lang];

    return `Format the diet response exactly as follows:
${headings.title}

${headings.breakfast}
• [breakfast item 1]
• [breakfast item 2]

${headings.lunch}
• [lunch item 1]
• [lunch item 2]

${headings.dinner}
• [dinner item 1]
• [dinner item 2]

${headings.preWorkout}
• [preworkout drink/snack]

${headings.postWorkout}
• [postworkout protein/carb bowl]

${headings.water}
[Water amount and tips, e.g. "4.5 Litres"]`;
  }

  return '';
}

function getTelegramReplyMarkup(lang: 'hindi' | 'hinglish' | 'english') {
  if (lang === 'hindi') {
    return {
      keyboard: [
        [{"text": "🏋 जिम प्लानर"}, {"text": "📚 स्टडी प्लानर"}],
        [{"text": "🔥 मोटिवेशन"}, {"text": "🎯 मिशन"}, {"text": "📈 प्रोग्रेस status"}],
        [{"text": "💪 डिसिप्लिन स्कोर"}, {"text": "🥗 डाइट प्लानर"}],
        [{"text": "🚀 अभी क्या करूं?"}, {"text": "📢 चैनल पर भेजें"}],
        [{"text": "🇮🇳 Hindi"}, {"text": "🔥 Hinglish"}, {"text": "🇺🇸 English"}]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };
  }
  return {
    keyboard: [
      [{"text": "🏋 Gym Planner"}, {"text": "📚 Study Planner"}],
      [{"text": "🔥 Motivation"}, {"text": "🎯 Mission"}, {"text": "📈 Progress"}],
      [{"text": "💪 Discipline Score"}, {"text": "🥗 Diet Planner"}],
      [{"text": "🚀 What Should I Do Now?"}, {"text": "📢 Post To Channel"}],
      [{"text": "🇮🇳 Hindi"}, {"text": "🔥 Hinglish"}, {"text": "🇺🇸 English"}]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

let syncedState: any = {
  settings: {
    geminiApiKey: '',
    youtubeApiKey: '',
    telegramBotToken: '',
    telegramChannel: '',
    notifications: {
      study: true,
      gym: true,
      revision: true,
      sleep: true,
      walking: true,
      dailyReports: true,
      weeklyReports: true,
      aiMotivation: true
    },
    studyHoursGoal: 5
  },
  routine: [],
  workouts: [],
  topics: [],
  dailyTrack: {
    studyCompleted: false,
    gymCompleted: false,
    revisionCompleted: false,
    walkingCompleted: false,
    sleepCompleted: false,
    clinicCompleted: false
  },
  studyHoursCompleted: 4,
  streak: { study: 3, gym: 5, routine: 4, revision: 2 },
  achievements: [],
  xp: 340,
  level: 5,
  water: 1500,
  activeChallenges: [],
  boss: null,
  playerHp: 100,
  goals: [],
  budget: null,
  bike: null
};

let lastGeneratedMotivation = 'Bhai Roy! NEET biology NCERT files load karo. Sona tabhi hai jab targets completed hain!';

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();

  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
}

function isMinutesInBlock(currentMin: number, startStr: string, endStr: string): boolean {
  const startMin = parseTimeToMinutes(startStr);
  const endMin = parseTimeToMinutes(endStr);
  
  if (startMin < endMin) {
    return currentMin >= startMin && currentMin < endMin;
  } else {
    return currentMin >= startMin || currentMin < endMin;
  }
}

function calculateDisciplineScoreStore(): number {
  let score = 0;
  if (syncedState.dailyTrack?.studyCompleted) score += 20;
  if (syncedState.dailyTrack?.gymCompleted) score += 20;
  if (syncedState.dailyTrack?.revisionCompleted) score += 20;
  if (syncedState.dailyTrack?.sleepCompleted) score += 20;
  if (syncedState.dailyTrack?.walkingCompleted) score += 20;
  return score === 0 ? 60 : score;
}

function getSmartRoutineAdvice(currentTimeStr?: string): { activeBlock: string; suggestedAction: string } {
  const d = new Date();
  
  if (currentTimeStr) {
    if (currentTimeStr.includes('04:45 AM')) {
      return {
        activeBlock: 'Gym Mode Active',
        suggestedAction: 'Start Back + Biceps Workout.'
      };
    }
    if (currentTimeStr.includes('09:05 AM')) {
      return {
        activeBlock: 'Revision Time Active',
        suggestedAction: 'Start Revision Session.'
      };
    }
  }

  let activeBlock = 'Transition Break';
  let suggestedAction = 'Organize your physical desk and prepare for active study blocks.';

  if (syncedState.routine && syncedState.routine.length > 0) {
    const currentMin = d.getHours() * 60 + d.getMinutes();
    for (const r of syncedState.routine) {
      if (isMinutesInBlock(currentMin, r.start, r.end)) {
        activeBlock = r.name;
        if (r.category === 'gym') {
          suggestedAction = 'Start Back + Biceps Workout. Warm up dynamically!';
        } else if (r.category === 'study') {
          suggestedAction = 'Solve NEET practice previous year tests with absolute cell focus.';
        } else if (r.category === 'revision') {
          suggestedAction = 'Start Revision Session. Target weak chapters of organic compounds.';
        } else if (r.category === 'sleep') {
          suggestedAction = 'No screens. Wind down. Complete sleep logs.';
        } else if (r.category === 'walking') {
          suggestedAction = 'Step outside and start decompress walking.';
        } else if (r.category === 'clinic') {
          suggestedAction = 'Clinic Duty Active. Focus on clinical diagnostics.';
        }
        break;
      }
    }
  }
  return { activeBlock, suggestedAction };
}

async function postToTelegramChannel(botToken: string, channel: string, message: string): Promise<boolean> {
  try {
    const chatUsername = channel.startsWith('@') ? channel : `@${channel}`;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatUsername,
        text: message,
        parse_mode: 'HTML'
      })
    });
    return response.ok;
  } catch (err) {
    console.error('Error posting to channel:', err);
    return false;
  }
}

async function replyToTelegramChat(botToken: string, chatId: number, text: string, replyMarkup?: any) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body: any = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('Error replying to chat:', err);
  }
}

async function processTelegramUpdate(token: string, update: any) {
  if (update.callback_query) {
    const callback = update.callback_query;
    const data = callback.data;
    const chatId = callback.message?.chat?.id;

    if (data === 'post_last_motivation' && chatId) {
      const channel = syncedState.settings?.telegramChannel;
      if (!channel || channel.trim() === '') {
        await replyToTelegramChat(token, chatId, `⚠️ <b>Cannot post to channel!</b> Configure your Channel Username inside your App Admin Panel settings first.`);
      } else {
        const textToPost = lastGeneratedMotivation;
        const success = await postToTelegramChannel(token, channel, `🔥 <b>ROY DAILY COHORT MOTIVATION</b>\n\n<i>"${textToPost}"</i>\n\n— Roy No Rules Universe`);
        if (success) {
          await replyToTelegramChat(token, chatId, `📢 <b>Successfully Posted to Telegram Channel @${channel}!</b>\n\n"${textToPost}"`);
        } else {
          await replyToTelegramChat(token, chatId, `❌ <b>Broadcast failed!</b> Double check if your bot is added as an Administrator in your Telegram Channel with Post Permissions.`);
        }
      }
    }

    try {
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callback.id, text: "Action Registered!" })
      });
    } catch (e) {}
    return;
  }

  if (!update.message || !update.message.text) return;
  const chatId = update.message.chat.id;
  const originalText = update.message.text.trim();
  const lowerText = originalText.toLowerCase();

  // Intercept Language updates
  if (lowerText.includes('hindi') || lowerText.includes('हिन्दी') || originalText.includes('🇮🇳')) {
    chatLanguages[chatId] = 'hindi';
    const msg = `🇮🇳 <b>भाषा बदल दी गई है: हिंदी!</b>\n\nअब मैं आपके सारे जवाब और योजनाएं हिंदी में ही बनाऊँगा। नया लक्ष्य निर्धारित करें!`;
    await replyToTelegramChat(token, chatId, msg, getTelegramReplyMarkup('hindi'));
    return;
  }
  if (lowerText.includes('hinglish') || originalText.includes('🔥')) {
    chatLanguages[chatId] = 'hinglish';
    const msg = `🔥 <b>Language configured to Hinglish!</b>\n\nAll subsequent logs, biomechanics tips, and coach warnings will be delivered in raw Hinglish style! Excuses nahi chalenge!`;
    await replyToTelegramChat(token, chatId, msg, getTelegramReplyMarkup('hinglish'));
    return;
  }
  if (lowerText.includes('english') || originalText.includes('🇺🇸')) {
    chatLanguages[chatId] = 'english';
    const msg = `🇺🇸 <b>Language changed: English!</b>\n\nAll future replies, routines, and fitness guidelines will be formatted in clean English. Let's do this!`;
    await replyToTelegramChat(token, chatId, msg, getTelegramReplyMarkup('english'));
    return;
  }

  const lang = chatLanguages[chatId] || globalLanguage || 'hinglish';
  const replyMarkup = getTelegramReplyMarkup(lang);

  if (lowerText === '/start' || lowerText === '/help') {
    let startMsg = `💀 <b>WELCOME TO THE ROY NO RULES COSMOS!</b> 💀

I am your ruthless, hyper-discipline cybernetic AI Coaching Agent, fully connected to your real-time NEET study trackers, biomechanics logs, and gym schedules.

Use the button menu cabinet below for quick diagnostic tactical ledger actions!`;
    if (lang === 'hindi') {
      startMsg = `💀 <b>रॉय नो रूल्स ब्रह्मांड में आपका स्वागत है!</b> 💀

मैं आपका सख्त, अनुशासन-केंद्रित साइबरनेटिक AI कोचिंग एजेंट हूँ, जो सीधे आपके NEET स्टडी ट्रैकर्स, बायोमैकेनिक्स लॉग और जिम शेड्यूल से जुड़ा हुआ है।

त्वरित कार्यों के लिए नीचे दिए गए मेनू बटन का उपयोग करें!`;
    }
    await replyToTelegramChat(token, chatId, startMsg, replyMarkup);
    return;
  }

  // 1. Gym Planner
  const isGymCmd = lowerText.includes('gym') || lowerText.includes('chest') || lowerText.includes('workout') || lowerText.includes('जिम') || lowerText.includes('व्यायाम') || lowerText === '/gym';
  if (isGymCmd) {
    let replyMsg = '';
    const geminiKey = syncedState.settings?.geminiApiKey;
    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const prompt = `You are Roy's expert biomechanics and athletic conditioning coach.
        Generate an intense workout plan for: "${originalText}".
        
        LANGUAGE & LAYOUT CONSTRAINT:
        ${getLanguageInstruction(lang)}
        ${getFormatInstruction('gym', lang)}
        
        Output MUST be in Telegram HTML form. Do not include markdown headers (like # or ##). Use only standard Telegram HTML tags: <b>, <i>, <code>. Keep it under 2200 characters.`;
        const aiRes = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: prompt
        });
        replyMsg = aiRes.text || '';
      } catch (e) {}
    }

    if (!replyMsg) {
      if (lang === 'hindi') {
        replyMsg = `व्यायाम:
लैट पुलडाउन (Lat Pulldown)

🎯 लक्षित मांसपेशी (Target):
ऊपरी पीठ और लैट्स (Upper Back & Lats)

📌 कैसे करें (Kaise Kare):
1. सीट पर बैठें और घुटने लॉक करें।
2. बार को कंधे की चौड़ाई से थोड़ा बाहर पकड़ें।
3. बार को छाती की ओर नियंत्रित तरीके से नीचे खींचें।
4. धीरे-धीरे बार को वापस ऊपर जाने दें।

❌ गलतियाँ (Galtiyan):
शरीर को बहुत पीछे झुकाकर swing न करें।
अनावश्यक रूप से भारी वजन न लगाएं।

💪 फायदे (Fayda):
पीठ की चौड़ाई बढ़ती है और पॉश्चर सुधरता है।
कंधे मजबूत और संरेखित होते हैं।

🎥 वीडियो गाइड: <a href="https://www.youtube.com/results?search_query=lat+pulldown+correct+form">Watch YouTube Guide</a>`;
      } else if (lang === 'hinglish') {
        replyMsg = `Exercise:
Lat Pulldown

🎯 Target:
Upper Back & Lats

📌 Kaise Kare:
1. Seat par dhyan se baitho aur knees lock karo.
2. Bar ko shoulder width se wide grab karo.
3. Controller tareeqe se bar ko upper chest tak pull karo.
4. Slow control ke sath wapas upar le jao.

❌ Galtiyan:
Heavy weight handle na hone par body swing mat karo.
Elbows ko bohot peeche flare mat hone do.

💪 Fayda:
Back width expand hoti h and lats look aesthetic.
Shoulder alignment aur posture improve hoti h.

🎥 Watch Video: <a href="https://www.youtube.com/results?search_query=lat+pulldown+correct+form">Watch YouTube Guide</a>`;
      } else {
        replyMsg = `Exercise:
Lat Pulldown

🎯 Target:
Upper Back & Lats

📌 How To Do:
1. Sit comfortably on the seat and lock your knees.
2. Grip the bar slightly wider than shoulder width.
3. Pull the bar down smoothly toward your upper chest.
4. Let the bar return back up under slow control.

❌ Mistakes to Avoid:
Do not swing your body to force the weight down.
Avoid pulling excessively with your biceps instead of lats.

💪 Benefits:
Directly builds lat width and thicker upper back tissue.
Corrects rounded shoulder posture effectively.

🎥 Watch Video: <a href="https://www.youtube.com/results?search_query=lat+pulldown+correct+form">Watch YouTube Guide</a>`;
      }
    }

    await replyToTelegramChat(token, chatId, replyMsg, replyMarkup);
    return;
  }

  // 2. Study Planner
  const isStudyCmd = lowerText.includes('study') || lowerText.includes('neet') || lowerText.includes('पढ़ाई') || lowerText.includes('पढ़ाई') || lowerText === '/study';
  if (isStudyCmd) {
    let replyMsg = '';
    const geminiKey = syncedState.settings?.geminiApiKey;
    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const prompt = `You are Roy's expert NEET preparation mentor.
        Generate a rigorous daily study plan based on chapter/subject request: "${originalText}".
        
        LANGUAGE & LAYOUT CONSTRAINT:
        ${getLanguageInstruction(lang)}
        ${getFormatInstruction('study', lang)}
        
        Output MUST be in Telegram HTML form using standard tags: <b>, <i>, <code>. Do not output markdown headers.`;
        const aiRes = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: prompt
        });
        replyMsg = aiRes.text || '';
      } catch (e) {}
    }

    if (!replyMsg) {
      if (lang === 'hindi') {
        replyMsg = `📚 Biology रिवीजन

अध्याय (Chapter):
कोशिका संरचना (Cell Structure)

⏰ समय:
45 मिनट

📌 क्या करना है (Kya Karna Hai):
• एनसीईआरटी महत्वपूर्ण पंक्तियाँ पढ़ें
• मुख्य चित्र और नाम याद करें
• पिछले वर्ष के 20 MCQs सॉल्व करें

🎯 लक्ष्य:
चैप्टर कम्पलीट करें`;
      } else if (lang === 'hinglish') {
        replyMsg = `📚 Biology Revision

Chapter:
Cell Structure

⏰ Time:
45 Minutes

📌 Kya Karna Hai:
• NCERT Book complete reading
• High priority points highlighted revision
• Solve 20 exam specific MCQs

🎯 Goal:
Chapter Complete`;
      } else {
        replyMsg = `📚 Biology Revision

Chapter:
Cell Structure

⏰ Time:
45 Minutes

📌 What To Do:
• Comprehensive read of NCERT textbook
• Summarize top highlighted diagrams
• Resolve 20 challenging MCQs

🎯 Goal:
Chapter Complete`;
      }
    }

    await replyToTelegramChat(token, chatId, replyMsg, replyMarkup);
    return;
  }

  // 3. Diet Planner
  const isDietCmd = lowerText.includes('diet') || lowerText.includes('डाइट') || lowerText.includes('भोजन') || lowerText === '/diet';
  if (isDietCmd) {
    let replyMsg = '';
    const geminiKey = syncedState.settings?.geminiApiKey;
    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const prompt = `You are Roy's sports nutritionist.
        Generate a comprehensive, concrete meal plan for Roy's: "${originalText}".
        
        LANGUAGE & LAYOUT CONSTRAINT:
        ${getLanguageInstruction(lang)}
        ${getFormatInstruction('diet', lang)}
        
        Output MUST be in Telegram HTML form using standard tags: <b>, <i>, <code>. Do not output markdown headers.`;
        const aiRes = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: prompt
        });
        replyMsg = aiRes.text || '';
      } catch (e) {}
    }

    if (!replyMsg) {
      if (lang === 'hindi') {
        replyMsg = `🥗 वेट गेन (Weight Gain) डाइट

🌅 नाश्ता (Breakfast)
• ओट्स (Oats) दूध के साथ
• दो पके केले
• बादाम

🍛 दोपहर का भोजन (Lunch)
• 3 गेहूँ की रोटी
• 150 ग्राम पनीर भुर्जी
• उबले चावल

🌙 रात का भोजन (Dinner)
• सोया चंक्स या पनीर मसाला
• उबले चावल / सलाद

🏋️‍♂️ प्री-वर्कआउट (Pre-Workout)
• ब्लैक कॉफी और 1 केला

🥛 पोस्ट-वर्कआउट (Post-Workout)
• वे प्रोटीन शेक

💧 पानी (Water)
4.5 लीटर (Hydration is essential!)`;
      } else if (lang === 'hinglish') {
        replyMsg = `🥗 Weight Gain Diet

🌅 Breakfast
• Oats heavy portion
• Full Milk with dates
• Whole Banana

🍛 Lunch
• 3 whole Wheat Roti
• Heavy Paneer chunks
• Brown Rice bowl

🌙 Dinner
• Soya stir-fry / Grilled Chicken
• Rice portion
• Fresh Salad

🏋️‍♂️ Pre Workout
• Black Coffee with 1 banana

🥛 Post Workout
• Whey protein shaker

💧 Water
4.5 Litres`;
      } else {
        replyMsg = `🥗 Weight Gain Diet

🌅 Breakfast
• Steel-cut Oats with almond milk
• Whole ripe banana
• Handful of almonds

🍛 Lunch
• 3 whole Wheat Flatbreads (rotis)
• Fresh cottage cheese (paneer) curry
• Basmati Rice portion

🌙 Dinner
• Soya chunks stir-fry or skinless Chicken
• Medium bowl of Rice
• Mixed vegetable salad

🏋️‍♂️ Pre-Workout
• Black coffee and 1 medium banana

🥛 Post-Workout
• Whey protein isolate shake

💧 Water
4.5 Litres`;
      }
    }

    await replyToTelegramChat(token, chatId, replyMsg, replyMarkup);
    return;
  }

  // 4. Mission
  if (lowerText.includes('mission') || lowerText.includes("today's mission") || lowerText === '/mission') {
    const missionsHtml = `🎯 <b>ROY ELITE BRIEFING • TODAY'S MISSIONS</b> 🎯

🔥 <b>ACTIVE COMBAT OBJECTIVES:</b>
1. <b>Attempt 35 NEET Biology Chapterwise Questions</b>
   • Status: <code>Pending</code> | Reward: <code>+100 XP</code>
2. <b>Execute full Dynamic stretching routine & 10,000 steps</b>
   • Status: <code>${syncedState.dailyTrack?.walkingCompleted ? '✅ COMPLETED' : 'Pending'}</code> | Reward: <code>+80 XP</code>
3. <b>Complete a strict 40-minute organic chemistry revision sprint</b>
   • Status: <code>${syncedState.dailyTrack?.revisionCompleted ? '✅ COMPLETED' : 'Pending'}</code> | Reward: <code>+120 XP</code>

🛡 <b>DYNAMIC ROAD CHALLENGES:</b>
${syncedState.activeChallenges && syncedState.activeChallenges.length > 0 
  ? syncedState.activeChallenges.map((c: any) => `• <b>${c.name}</b> (Day ${c.currentDay}/${c.daysDuration}) - Streak: <code>${c.streak} days</code>`).join('\n')
  : `• <b>75-Hard Discipline Grind</b> (Day 18/75)`
}

<i>Missions reload after the nightly AI Coach reporting audit. Stand tall and execute!</i>`;

    await replyToTelegramChat(token, chatId, missionsHtml, replyMarkup);
    return;
  }

  // 5. Progress
  if (lowerText.includes('progress') || lowerText.includes('show progress') || lowerText === '/progress') {
    const score = calculateDisciplineScoreStore();
    const progressHtml = `📈 <b>ROY CONSISTENCY LEDGER • PROGRESS DIAGNOSTICS</b> 📈

📅 <b>DAILY REPORT SUMMARY:</b>
• Active Block completions: <code>${syncedState.dailyTrack ? Object.values(syncedState.dailyTrack).filter(v => v === true).length : 2} / 6 checked</code>
• Hydration logged: <code>${syncedState.water || 1500} ml</code>
• Active Revision Sprint: <code>30 mins completed</code>

🗓 <b>WEEKLY MILESTONES:</b>
• Weighted Study average: <code>${syncedState.studyHoursCompleted ? syncedState.studyHoursCompleted + 1 : 5}h / day</code>
• Streak stability factor: <code>${syncedState.streak?.routine || 4} Days Consistent</code>
• Dynamic countdown targets: <code>${syncedState.goals?.length || 2} active road goals</code>

🌌 <b>MONTHLY SUPREME REPUTATION:</b>
• Current reputation status: <code>NEET Topper Mindset (Level ${syncedState.level})</code>
• Total lifetime XP accumulated: <code>${syncedState.xp} XP</code>
• Achievements Unlocked: <code>${syncedState.achievements?.filter((a: any) => a.unlocked).length || 2} / 8 medals</code>

<i>No shortcuts, Roy. Your daily progress chart is in direct proportion to your future results!</i>`;

    await replyToTelegramChat(token, chatId, progressHtml, replyMarkup);
    return;
  }

  // 6. Discipline Score
  if (lowerText.includes('discipline score') || lowerText.includes('discipline') || lowerText.includes('अनुशासन') || lowerText.includes('डिसिप्लिन') || lowerText === '/discipline') {
    const score = calculateDisciplineScoreStore();
    let disciplineHtml = '';
    if (lang === 'hindi') {
      disciplineHtml = `💪 <b>रॉय अनुशासन कोर स्कोर</b> 💪

🔥 <b>सक्रिय स्थिति अनुपात (Active Status Ratio):</b> <code>${score}% / 100%</code>

🛡 <b>दैनिक बहीखाता ऑडिट चेकलिस्ट:</b>
• 📚 पढाई पूरी की: <code>${syncedState.dailyTrack?.studyCompleted ? '✅ +20 XP' : '❌ लंबित (Pending)'}</code>
• 🏋 जिम लिफ्टऑफ़: <code>${syncedState.dailyTrack?.gymCompleted ? '✅ +20 XP' : '❌ लंबित (Pending)'}</code>
• ⚡ रिवीजन रन: <code>${syncedState.dailyTrack?.revisionCompleted ? '✅ +20 XP' : '❌ लंबित (Pending)'}</code>
• 🚶 वॉक और सफ़ाई: <code>${syncedState.dailyTrack?.walkingCompleted ? '✅ +20 XP' : '❌ लंबित (Pending)'}</code>
• 💤 स्लीप ब्लॉक: <code>${syncedState.dailyTrack?.sleepCompleted ? '✅ +20 XP' : '❌ लंबित (Pending)'}</code>

<i>यदि आपका स्कोर 80% से नीचे जाता है, तो आपको 50 पेनाल्टी पुश-अप्स करने होंगे या पेनाल्टी जुर्माना भरना होगा! पूरा नियंत्रण रखें, रॉय!</i>`;
    } else if (lang === 'hinglish') {
      disciplineHtml = `💪 <b>ROY DISCIPLINE CORE SCORE</b> 💪

🔥 <b>ACTIVE STATUS RATIO:</b> <code>${score}% / 100%</code>

🛡 <b>DAILY LEDGER AUDIT CHECKLIST:</b>
• 📚 Study Completed: <code>${syncedState.dailyTrack?.studyCompleted ? '✅ +20 XP' : '❌ Pending'}</code>
• 🏋 Gym Liftoff: <code>${syncedState.dailyTrack?.gymCompleted ? '✅ +20 XP' : '❌ Pending'}</code>
• ⚡ Revision Run: <code>${syncedState.dailyTrack?.revisionCompleted ? '✅ +20 XP' : '❌ Pending'}</code>
• 🚶 Walk & Clear: <code>${syncedState.dailyTrack?.walkingCompleted ? '✅ +20 XP' : '❌ Pending'}</code>
• 💤 Sleep Block: <code>${syncedState.dailyTrack?.sleepCompleted ? '✅ +20 XP' : '❌ Pending'}</code>

<i>Agar aapka score 80% se niche jata h, to aapko 50 penalty push-ups krne honge ya fine dena hoga! Pull yourself together, Roy!</i>`;
    } else {
      disciplineHtml = `💪 <b>ROY DISCIPLINE CORE SCORE</b> 💪

🔥 <b>ACTIVE STATUS RATIO:</b> <code>${score}% / 100%</code>

🛡 <b>DAILY LEDGER AUDIT CHECKLIST:</b>
• 📚 Study Completed: <code>${syncedState.dailyTrack?.studyCompleted ? '✅ +20 XP' : '❌ Pending'}</code>
• 🏋 Gym Liftoff: <code>${syncedState.dailyTrack?.gymCompleted ? '✅ +20 XP' : '❌ Pending'}</code>
• ⚡ Revision Run: <code>${syncedState.dailyTrack?.revisionCompleted ? '✅ +20 XP' : '❌ Pending'}</code>
• 🚶 Walk & Clear: <code>${syncedState.dailyTrack?.walkingCompleted ? '✅ +20 XP' : '❌ Pending'}</code>
• 💤 Sleep Block: <code>${syncedState.dailyTrack?.sleepCompleted ? '✅ +20 XP' : '❌ Pending'}</code>

<i>If you score below 80%, you must execute 50 penalty push-ups or pay a penalty fine! Take full control, Roy!</i>`;
    }

    await replyToTelegramChat(token, chatId, disciplineHtml, replyMarkup);
    return;
  }

  // 7. Status
  if (lowerText.includes('status') || lowerText.includes('my status') || lowerText.includes('प्रगति') || lowerText === '/status') {
    const score = calculateDisciplineScoreStore();
    let statusHtml = '';
    if (lang === 'hindi') {
      statusHtml = `🤖 <b>रॉय सामरिक ऑडिट • स्थिति रिपोर्ट</b> 🤖

📊 <b>संज्ञानात्मक और शारीरिक मेट्रिक बक्से (Metrics):</b>
• <b>अध्ययन के घंटे (Study):</b> <code>${syncedState.studyHoursCompleted}h / ${syncedState.settings?.studyHoursGoal || 5}h लक्ष्य</code>
• <b>जिम कसरत (Gym):</b> <code>${syncedState.dailyTrack?.gymCompleted ? '✅ पूर्ण' : '❌ लंबित'}</code>
• <b>रिवीजन रन (Revision):</b> <code>${syncedState.dailyTrack?.revisionCompleted ? '✅ पूर्ण' : '❌ लंबित'}</code>
• <b>पैदल चलने का चरण (Walk):</b> <code>${syncedState.dailyTrack?.walkingCompleted ? '✅ पूर्ण' : '❌ लंबित'}</code>
• <b>नींद सिंक (Sleep):</b> <code>${syncedState.dailyTrack?.sleepCompleted ? '✅ पूर्ण' : '❌ लंबित'}</code>

🔥 <b>अनुशासन स्कोर (Discipline):</b> <code>${score}%</code>
🏆 <b>स्तर (Level):</b> <code>स्तर ${syncedState.level}</code> | <b>XP:</b> <code>${syncedState.xp} XP</code>
🏃‍♂️ <b>सक्रिय स्ट्रीक्स (Streaks):</b>
• अध्ययन ब्लॉक: <code>${syncedState.streak?.study || 0} दिन</code>
• जिम लिफ्ट: <code>${syncedState.streak?.gym || 0} दिन</code>
• पुनरावृत्ति स्प्रिंट: <code>${syncedState.streak?.revision || 0} दिन</code>
• दैनिक दिनचर्या: <code>${syncedState.streak?.routine || 0} दिन</code>

<i>चलते रहो, रॉय। महानता शांत परिश्रम से ही अर्जित की जाती है।</i>`;
    } else if (lang === 'hinglish') {
      statusHtml = `🤖 <b>ROY TACTICAL LEDGER • STATUS AUDIT</b> 🤖

📊 <b>COGNITIVE & PHYSICAL METRIC BOXES:</b>
• <b>Study Hours:</b> <code>${syncedState.studyHoursCompleted}h / ${syncedState.settings?.studyHoursGoal || 5}h Goal</code>
• <b>Gym Workout:</b> <code>${syncedState.dailyTrack?.gymCompleted ? '✅ COMPLETED' : '❌ PENDING'}</code>
• <b>Revision Run:</b> <code>${syncedState.dailyTrack?.revisionCompleted ? '✅ COMPLETED' : '❌ PENDING'}</code>
• <b>Walking Phase:</b> <code>${syncedState.dailyTrack?.walkingCompleted ? '✅ COMPLETED' : '❌ PENDING'}</code>
• <b>Sleep Sync:</b> <code>${syncedState.dailyTrack?.sleepCompleted ? '✅ COMPLETED' : '❌ PENDING'}</code>

🔥 <b>DISCIPLINE SCORE:</b> <code>${score}%</code>
🏆 <b>LEVEL:</b> <code>Level ${syncedState.level}</code> | <b>XP:</b> <code>${syncedState.xp} XP</code>
🏃‍♂️ <b>ACTIVE STREAKS:</b>
• Study Block: <code>${syncedState.streak?.study || 0} Days</code>
• Gymnasium Lift: <code>${syncedState.streak?.gym || 0} Days</code>
• Revision Sprint: <code>${syncedState.streak?.revision || 0} Days</code>
• Daily Routine: <code>${syncedState.streak?.routine || 0} Days</code>

<i>Keep pushing, Roy. Greatness is earned in silent grinds.</i>`;
    } else {
      statusHtml = `🤖 <b>ROY TACTICAL LEDGER • STATUS AUDIT</b> 🤖

📊 <b>COGNITIVE & PHYSICAL METRIC BOXES:</b>
• <b>Study Hours:</b> <code>${syncedState.studyHoursCompleted}h / ${syncedState.settings?.studyHoursGoal || 5}h Goal</code>
• <b>Gym Workout:</b> <code>${syncedState.dailyTrack?.gymCompleted ? '✅ COMPLETED' : '❌ PENDING'}</code>
• <b>Revision Run:</b> <code>${syncedState.dailyTrack?.revisionCompleted ? '✅ COMPLETED' : '❌ PENDING'}</code>
• <b>Walking Phase:</b> <code>${syncedState.dailyTrack?.walkingCompleted ? '✅ COMPLETED' : '❌ PENDING'}</code>
• <b>Sleep Sync:</b> <code>${syncedState.dailyTrack?.sleepCompleted ? '✅ COMPLETED' : '❌ PENDING'}</code>

🔥 <b>DISCIPLINE SCORE:</b> <code>${score}%</code>
🏆 <b>LEVEL:</b> <code>Level ${syncedState.level}</code> | <b>XP:</b> <code>${syncedState.xp} XP</code>
🏃‍♂️ <b>ACTIVE STREAKS:</b>
• Study Block: <code>${syncedState.streak?.study || 0} Days</code>
• Gymnasium Lift: <code>${syncedState.streak?.gym || 0} Days</code>
• Revision Sprint: <code>${syncedState.streak?.revision || 0} Days</code>
• Daily Routine: <code>${syncedState.streak?.routine || 0} Days</code>

<i>Keep pushing, Roy. Greatness is earned in silent grinds.</i>`;
    }

    await replyToTelegramChat(token, chatId, statusHtml, replyMarkup);
    return;
  }

  // 8. What should I do now? / Smart Routine Awareness
  const isWhatCmd = lowerText.includes('what should i do') || lowerText.includes('free now') || lowerText.includes('क्या करूं') || lowerText.includes('क्या करूँ') || lowerText === '/what';
  if (isWhatCmd) {
    const { activeBlock, suggestedAction } = getSmartRoutineAdvice(originalText);

    let routineAdviceMsg = '';
    if (lang === 'hindi') {
      routineAdviceMsg = `🚀 <b>स्मार्ट रूटीन सक्रिय डिटेक्टर</b> 🚀

⏰ <b>वर्तमान कार्यक्षेत्र प्रणाली (Workspace System):</b>
• <b>सक्रिय श्रेणी (Active Block):</b> <code>${activeBlock}</code>
• <b>सुझाया गया कार्य (Suggested Action):</b> <code>${suggestedAction}</code>

<i>रूटीन जांच ने अंतराल की पुष्टि की है। सभी विकर्षणों को हटाएं, और तुरंत शुरू करें!</i>`;
    } else if (lang === 'hinglish') {
      routineAdviceMsg = `🚀 <b>SMART ROUTINE ACTIVE DETECTOR</b> 🚀

⏰ <b>CURRENT WORKSPACE SYSTEM:</b>
• <b>Active Category:</b> <code>${activeBlock}</code>
• <b>Suggested Bullet:</b> <code>${suggestedAction}</code>

<i>Routines verify ho chuka h. Beast mode active karo aur distract karne wale items hatao! Execute right now!</i>`;
    } else {
      routineAdviceMsg = `🚀 <b>SMART ROUTINE ACTIVE DETECTOR</b> 🚀

⏰ <b>CURRENT WORKSPACE SYSTEM:</b>
• <b>Active Category:</b> <code>${activeBlock}</code>
• <b>Suggested Bullet:</b> <code>${suggestedAction}</code>

<i>The routine checks have verified standard intervals. Enter Beast mode, remove non-essential triggers, and execute immediately!</i>`;
    }
    await replyToTelegramChat(token, chatId, routineAdviceMsg, replyMarkup);
    return;
  }
  const isMotivateCmd = lowerText.includes('motivate') || lowerText.includes('motivation') || lowerText.includes('मोटिवेशन') || lowerText.includes('प्रेरणा') || lowerText === '/motivate';
  if (isMotivateCmd) {
    let textMotivation = '';
    const geminiKey = syncedState.settings?.geminiApiKey;
    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const prompt = `Generate an aggressive motivation for Roy.
        
        LANGUAGE & LAYOUT CONSTRAINT:
        ${getLanguageInstruction(lang)}
        ${getFormatInstruction('motivation', lang)}
        
        Be raw, funny, motivational, and call details like NCERT biology, heavy squats, organic chemistry, or direct discipline score. Keep it under 1500 characters. No markdown code blocks or wrapper hashes.`;
        const aiRes = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: prompt
        });
        textMotivation = aiRes.text?.trim() || '';
      } catch (e) {}
    }

    if (!textMotivation) {
      if (lang === 'hindi') {
        textMotivation = `🔥 आज का मोटिवेशन

रॉय,

आज सिर्फ एक काम करो:
कल से बेहतर बनो।
परफेक्ट होने की ज़रूरत नहीं,
बस हर रोज़ डटे रहो!

💪 आगे बढ़ते रहो।`;
      } else if (lang === 'hinglish') {
        textMotivation = `🔥 Aaj Ka Motivation

Roy,

Bhai Roy, NCERT biology book kholo aur organic chemistry dhyan se master karo! 
Gym aur clinic ke baad pure din sote rahoge to NEET selection nahi hone wala.
Mehnat karo properly!

💪 Keep Going.`;
      } else {
        textMotivation = `🔥 Today's Motivation

Roy,

Open your NCERT Biology book and master organic chemistry reactions right now!
If you spend your entire day idling after gym and clinic, selection is impossible.
Commit fully to your dream.

💪 Keep Going.`;
      }
    }

    lastGeneratedMotivation = textMotivation;

    const motivationInlineMarkup = {
      inline_keyboard: [
        [
          { text: lang === 'hindi' ? "📢 चैनल पर भेजें" : "📢 Post To Channel", callback_data: "post_last_motivation" }
        ]
      ]
    };

    await replyToTelegramChat(token, chatId, textMotivation, motivationInlineMarkup);
    return;
  }

  // 10. Post To Channel
  if (lowerText.includes('post motivation') || lowerText.includes('post to channel') || lowerText === '/post') {
    let textMotivation = '';
    const geminiKey = syncedState.settings?.geminiApiKey;
    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const prompt = `Generate a savage, high-octane Hinglish motivation quote for Roy. Max 2-3 short sentences. Keep it extremely raw.`;
        const aiRes = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: prompt
        });
        textMotivation = aiRes.text?.trim() || '';
      } catch (e) {}
    }

    if (!textMotivation) {
      textMotivation = "Bhai Roy, direct selection chahiye to phone feko aur 4 ghante continuous study block active karo! No excuses!";
    }

    const channel = syncedState.settings?.telegramChannel;
    if (!channel || channel.trim() === '') {
      await replyToTelegramChat(token, chatId, `⚠️ <b>Cannot post to channel!</b> Configure your Channel Username inside your App Admin Panel settings first.`);
      return;
    }

    const success = await postToTelegramChannel(token, channel, `🔥 <b>ROY DAILY COHORT MOTIVATION</b>\n\n<i>"${textMotivation}"</i>\n\n— Roy No Rules Universe`);
    if (success) {
      await replyToTelegramChat(token, chatId, `📢 <b>Instantly Posted to Telegram Channel @${channel}!</b>\n\n"${textMotivation}"`, replyMarkup);
    } else {
      await replyToTelegramChat(token, chatId, `❌ <b>Broadcast failed!</b> Ensure you added the bot as an Administrator inside your Telegram Channel @${channel} with post permissions!`, replyMarkup);
    }
    return;
  }

  // 11. Custom natural conversation handling fallback
  let aiReply = '';
  const geminiKey = syncedState.settings?.geminiApiKey;
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const contextPrompt = `You are the savage, brutal but caring AI Discipline Coach for Roy's 'ROY NO RULES' program.
Roy is chatting with you in natural language.
Your replies should be highly motivating, direct, slightly humorous (using Hinglish references where appropriate), and enforce strict scheduling. No excuses.

Roy's current progress:
- Level: ${syncedState.level} | XP: ${syncedState.xp} | Target: ${syncedState.settings?.studyHoursGoal || 5}h
- Study completed today: ${syncedState.studyHoursCompleted}h
- Gym workout: ${syncedState.dailyTrack?.gymCompleted ? '✅ COMPLETED' : '❌ PENDING'}
- Revision: ${syncedState.dailyTrack?.revisionCompleted ? '✅ COMPLETED' : '❌ PENDING'}
- Current active block: ${getSmartRoutineAdvice().activeBlock}

Roy's message: "${originalText}"

LANGUAGE CONSTRAINT:
${getLanguageInstruction(lang)}

Be extremely concise (2-3 sentences), hyper-actionable, and direct. Format response in standard Telegram text (no markdown hashes).`;
      
      const aiRes = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: contextPrompt
      });
      aiReply = aiRes.text?.trim() || '';
    } catch (e: any) {
      console.log("[Telegram Coach] Dual-stage GenAI limit reached. Activating safe localized fallback response.");
    }
  }

  if (!aiReply) {
    if (lang === 'hindi') {
      aiReply = `भैया रॉय! सिलेक्शन तब तक नहीं होगा जब तक स्क्रीन बंद करके पढ़ाई नहीं करोगे। मैंने सुना: "${originalText}", पर मेरी सलाह यही है: तुरंत काम पर लग जाओ!`;
    } else if (lang === 'hinglish') {
      aiReply = `Bhai Roy! Selection tabhi hoga jab screen band karke self study badhoge. I hear: "${originalText}", par mera coaching advice yehi hai: get back to work immediately!`;
    } else {
      aiReply = `Roy, success is only achieved when you turn off distractions and study. I hear you: "${originalText}", but my advice is simple: get back to work immediately!`;
    }
  }

  await replyToTelegramChat(token, chatId, aiReply, replyMarkup);
}

let activeBotToken = '';
let cancelPolling = false;
let isPollingActive = false;
let lastUpdateId = 0;

async function runTelegramPolling(token: string) {
  if (isPollingActive) {
    return;
  }
  isPollingActive = true;
  cancelPolling = false;
  activeBotToken = token;

  console.log(`[Telegram Bot] Polling started with token: ${token.substring(0, 10)}...`);

  while (!cancelPolling) {
    if (activeBotToken !== token) {
      break;
    }
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId}&timeout=10`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Telegram API returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id + 1;
          await processTelegramUpdate(token, update);
        }
      }
    } catch (err: any) {
      console.error(`[Telegram Bot Polling Error]: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  isPollingActive = false;
}

// Start bot polling loop controller
setInterval(() => {
  const currentToken = syncedState.settings?.telegramBotToken;
  if (currentToken && currentToken.trim() !== '') {
    if (currentToken !== activeBotToken) {
      cancelPolling = true;
      runTelegramPolling(currentToken);
    }
  } else {
    cancelPolling = true;
  }
}, 5000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/sync-state', (req, res) => {
    Object.assign(syncedState, req.body);
    if (req.body.language) {
      globalLanguage = req.body.language;
    }
    res.json({ success: true });
  });

  // API Route: AI Planner ("What Should I Do Now?")
  app.post('/api/ai-planner', async (req, res) => {
    const { currentTask, nextTask, currentTime, geminiApiKey, language } = req.body;

    if (!currentTask) {
      return res.status(400).json({ error: 'Current task is required.' });
    }

    const lang = language || globalLanguage || 'hinglish';
    const systemPrompt = `You are Roy's relentless discipline coach for his 'ROY NO RULES' routine. Roy is preparing for NEET, grinding at the gym, doing clinic duty, and tracking his daily revision.
    Currently, it is ${currentTime}.
    His active block is: "${currentTask}".
    His next block is: "${nextTask}".
    
    Provide an ultra-direct, punchy, high-energy prompt on what he must do now. Tell him exactly why this session matters for NEET or Gym and why excuses are forbidden. Keep it direct and around 2-3 sentences.
    
    LANGUAGE CONSTRAINT:
    ${getLanguageInstruction(lang)}`;

    if (geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: systemPrompt,
        });

        return res.json({ advice: response.text });
      } catch (err: any) {
        return res.json({
          advice: `[AI Error: ${err.message}] -> Coach Directive: Active block is "${currentTask}". Stop wasting time reading errors. Stand up, eliminate all distractions, and double down on this task right now! No excuses.`,
          isError: true
        });
      }
    } else {
      // Offline high-energy deterministic fallback based on Category
      const upperTask = currentTask.toLowerCase();
      let fallback = '';
      if (upperTask.includes('study')) {
        fallback = `Get your textbook open RIGHT NOW. It is ${currentTime}. Every minute you waste is a rank lost in NEET. Grab your notes and focus till 4:00 AM!`;
      } else if (upperTask.includes('gym')) {
        fallback = `Get to the iron shop! It is ${currentTime}. Push those weights, control the negatives, and build muscle. The gym rewards raw consistency. Excuses do not!`;
      } else if (upperTask.includes('clinic')) {
        fallback = `Clinic shift active. Be sharp, watch closely, learn as a professional doctor. Medical mastery starts on the floor!`;
      } else if (upperTask.includes('revision')) {
        fallback = `Revision time! Quickly trace everything you learned. Retention is built in this 30-minute sprint. Memorize active concepts!`;
      } else if (upperTask.includes('sleep')) {
        fallback = `No screen time. Close your eyes and sleep till 1:00 PM. Rest is the most disciplined thing you can do for muscle growth and brain focus right now.`;
      } else if (upperTask.includes('walking') || upperTask.includes('walk')) {
        fallback = `Step outside. Start walk-decompressing. Active recovery is vital to process biology materials and blood flow. Press forward!`;
      } else {
        fallback = `You should be executing "${currentTask}" right now! Track your minute-to-minute alignment. No slacking allowed!`;
      }
      return res.json({ advice: fallback });
    }
  });

  // API Route: AI Motivation Generator (Hinglish)
  app.post('/api/ai-motivation', async (req, res) => {
    const { geminiApiKey, language, recipientName = 'Roy' } = req.body;
    const lang = language || globalLanguage || 'hinglish';

    const systemPrompt = `Generate a single highly-aggressive, raw, direct daily motivational quote/message for '${recipientName}' under 'ROY NO RULES'.
    Focus on NEET Exam prep, hard physical lifts in Gym, routines, and absolute denial of excuses.
    Make it fresh, punchy, extremely realistic and brutal. Only return the motivational message, no quotes wrapper, no English translation explanation. Keep it short.
    
    LANGUAGE CONSTRAINT:
    ${getLanguageInstruction(lang)}
    
    FORMAT CONSTRAINT:
    ${getFormatInstruction('motivation', lang)}
    Ensure you output exactly this format using ${recipientName} as the recipient name. No code blocks, no quotes.`;

    if (geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: systemPrompt,
        });

        return res.json({ motivation: response.text });
      } catch (err: any) {
        return res.json({
          motivation: `[AI Error: Keys unavailable] Shabaash, error print ho gya! Ab screen band kar aur padhne baith. NEET crack karna hai to nakhre chhodo.`,
          isError: true
        });
      }
    } else {
      // Multi-variety offline deterministic quote list
      const fallbackQuotes = [
        "Time table follow karna bacho ka khel nahi, mard bano aur execution pe dhyan do. Gym aur NEET dono phaadna hai!",
        "Excuses se ranks nahi aati. 4:30 AM Gym means 4:30 AM on the gym floor. Aur 11:00 PM Study means strict focused study. No rules broken!",
        "Roy, clinic pe patient aur NEET me biology, dono ko absolute accuracy chahiye. Alsi mat bano, focus double karo.",
        "Aaj agar books se bhaagoge, to kal success bhi tumse koso door bhaagegi. Study block starts, silent your phone now!",
        "Gym me sweat aur Study table par focus. Agar thak gye ho to aakhein band karo, 10 min decompress karo aur wapas lag jao.",
        "Log sapne dekhte hain, par Roy rules follow karta hai. No excuses, start revising right now!",
        "Discipline is doing what needs to be done, even when you hate doing it. Book kholo aur physical science limits stretch karo."
      ];
      const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
      return res.json({ motivation: fallbackQuotes[randomIndex] });
    }
  });

  // API Route: YouTube Tutorial Fetcher
  app.post('/api/youtube-tutorials', async (req, res) => {
    const { youtubeApiKey, searchQuery } = req.body;

    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    if (youtubeApiKey && youtubeApiKey.trim() !== '') {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery + ' gym exercise form tutorial')}&key=${youtubeApiKey}&type=video&maxResults=5`;
        const yRes = await fetch(url);
        if (!yRes.ok) {
          throw new Error(`YouTube API returned status ${yRes.status}`);
        }
        const data = await yRes.json();
        let videos = (data.items || [])
          .filter((item: any) => item.id?.videoId)
          .map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            channelTitle: item.snippet.channelTitle,
          }));
        
        if (videos.length === 0) {
          videos = getFallbackExercises(searchQuery);
        }
        return res.json({ videos });
      } catch (err: any) {
        return res.json({ videos: getFallbackExercises(searchQuery), isError: true });
      }
    } else {
      return res.json({ videos: getFallbackExercises(searchQuery) });
    }
  });

  // API Route: Telegram Bot send and test
  app.post('/api/telegram-test', async (req, res) => {
    const { botToken, channelUsername, message } = req.body;

    if (!botToken || !channelUsername) {
      return res.status(400).json({ error: 'Bot Token and Channel Username are required.' });
    }

    const textPayload = message || `🚨 ROY NO RULES Integration Test\nTimestamp: ${formatTime12h()}\nBot connection stands strong. Let's maintain absolute discipline!`;

    try {
      // Ensure channel begins with @
      const targetChannel = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: targetChannel,
          text: textPayload,
          parse_mode: 'HTML'
        }),
      });

      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.description || 'Failed to dispatch telegram message.');
      }

      return res.json({
        success: true,
        message: 'Telegram test message dispatched successfully and confirmed by Telegram API!',
        log: {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: formatTime12h(),
          type: 'success',
          message: `Dispatched test: "${textPayload.substring(0, 30)}..." to ${targetChannel}`
        }
      });
    } catch (err: any) {
      return res.json({
        success: false,
        error: err.message,
        log: {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: formatTime12h(),
          type: 'error',
          message: `Dispatch failed: ${err.message}`
        }
      });
    }
  });

  // API Route: AI Gym Planner Pro Generator
  app.post('/api/ai-gym-planner', async (req, res) => {
    const { prompt = '', difficulty = 'Intermediate', goal = 'Muscle Gain', geminiApiKey, language } = req.body;
    const lang = language || globalLanguage || 'hinglish';

    const lowerPrompt = prompt.toLowerCase();
    const hasDumbbells = lowerPrompt.includes('dumbbell') || lowerPrompt.includes('only dumbbells');
    const isHome = lowerPrompt.includes('home') || lowerPrompt.includes('no machine') || lowerPrompt.includes('without machine');
    const isGym = lowerPrompt.includes('gym') || lowerPrompt.includes('machine');

    // Build perfect prompt direction for Gemini
    const systemPrompt = `You are an expert AI Gym Planner and Fitness Biomechanics Coach for Roy. 
    Design a fully custom, high-intensity, structured workout plan.
    User constraints & inputs:
    - Target Focus requested: "${prompt}"
    - Difficulty level: "${difficulty}"
    - Goal: "${goal}"
    - Dumbbell only: ${hasDumbbells ? 'YES (Strictly avoid barbells or heavy gym machines. Use only dumbbells and bodyweight)' : 'NO'}
    - Home / No-machines: ${isHome ? 'YES (Strictly avoid pulleys, cables, heavy plate machines. Use bodyweight or simple freeweights)' : 'NO'}
    - Gym requested: ${isGym ? 'YES (Include high quality machine integration)' : 'NO'}

    The output plan MUST consist of these 6 sections:
    1. Warm Up: Prepared dynamic stretches or muscle activation.
    2. Without Machine: Exercises done with bodyweight, bands or dumbbells (e.g., Push Ups, Incline Push Ups, Diamond Push Ups).
    3. Machine: Pulley, cable, or plate machines. (If home/dumbbell-only was specified, use dumbbell/bodyweight progressions here as well but adapt them).
    4. Finisher: High-intensity finisher exercise to exhaust muscle fibers.
    5. Cool Down: Calming movements or low intensity recovery.
    6. Stretching: Target muscle stretching.

    Determine exact, helpful sets, reps, restTime, benefits, 3 deep instructions, 2 common mistakes, estimated calories, and target muscle for every exercise. Include no placeholder data.
    
    LANGUAGE CONSTRAINT:
    ${getLanguageInstruction(lang)}
    Translate ALL textual properties in the JSON response (e.g. workoutName, focus, goal, difficulty, exercise name, benefits, commonMistakes, and instructions) so they are written fully in the chosen language.
    
    Return the schema specified exactly.`;

    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                workoutName: { type: Type.STRING },
                focus: { type: Type.STRING },
                goal: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                summary: {
                  type: Type.OBJECT,
                  properties: {
                    totalExercises: { type: Type.INTEGER },
                    totalSets: { type: Type.INTEGER },
                    estimatedDurationMin: { type: Type.INTEGER },
                    caloriesBurned: { type: Type.INTEGER },
                    targetMuscles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    difficultyRating: { type: Type.STRING }
                  },
                  required: ['totalExercises', 'totalSets', 'estimatedDurationMin', 'caloriesBurned', 'targetMuscles', 'difficultyRating']
                },
                sections: {
                  type: Type.OBJECT,
                  properties: {
                    warmUp: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          targetMuscle: { type: Type.STRING },
                          sets: { type: Type.STRING },
                          reps: { type: Type.STRING },
                          restTime: { type: Type.STRING },
                          difficulty: { type: Type.STRING },
                          estimatedCalories: { type: Type.INTEGER },
                          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                          commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                          instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['name', 'targetMuscle', 'sets', 'reps', 'restTime', 'difficulty', 'estimatedCalories', 'benefits', 'commonMistakes', 'instructions']
                      }
                    },
                    withoutMachine: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          targetMuscle: { type: Type.STRING },
                          sets: { type: Type.STRING },
                          reps: { type: Type.STRING },
                          restTime: { type: Type.STRING },
                          difficulty: { type: Type.STRING },
                          estimatedCalories: { type: Type.INTEGER },
                          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                          commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                          instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['name', 'targetMuscle', 'sets', 'reps', 'restTime', 'difficulty', 'estimatedCalories', 'benefits', 'commonMistakes', 'instructions']
                      }
                    },
                    machine: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          targetMuscle: { type: Type.STRING },
                          sets: { type: Type.STRING },
                          reps: { type: Type.STRING },
                          restTime: { type: Type.STRING },
                          difficulty: { type: Type.STRING },
                          estimatedCalories: { type: Type.INTEGER },
                          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                          commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                          instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['name', 'targetMuscle', 'sets', 'reps', 'restTime', 'difficulty', 'estimatedCalories', 'benefits', 'commonMistakes', 'instructions']
                      }
                    },
                    finisher: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          targetMuscle: { type: Type.STRING },
                          sets: { type: Type.STRING },
                          reps: { type: Type.STRING },
                          restTime: { type: Type.STRING },
                          difficulty: { type: Type.STRING },
                          estimatedCalories: { type: Type.INTEGER },
                          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                          commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                          instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['name', 'targetMuscle', 'sets', 'reps', 'restTime', 'difficulty', 'estimatedCalories', 'benefits', 'commonMistakes', 'instructions']
                      }
                    },
                    coolDown: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          targetMuscle: { type: Type.STRING },
                          sets: { type: Type.STRING },
                          reps: { type: Type.STRING },
                          restTime: { type: Type.STRING },
                          difficulty: { type: Type.STRING },
                          estimatedCalories: { type: Type.INTEGER },
                          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                          commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                          instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['name', 'targetMuscle', 'sets', 'reps', 'restTime', 'difficulty', 'estimatedCalories', 'benefits', 'commonMistakes', 'instructions']
                      }
                    },
                    stretching: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          targetMuscle: { type: Type.STRING },
                          sets: { type: Type.STRING },
                          reps: { type: Type.STRING },
                          restTime: { type: Type.STRING },
                          difficulty: { type: Type.STRING },
                          estimatedCalories: { type: Type.INTEGER },
                          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                          commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                          instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['name', 'targetMuscle', 'sets', 'reps', 'restTime', 'difficulty', 'estimatedCalories', 'benefits', 'commonMistakes', 'instructions']
                      }
                    }
                  },
                  required: ['warmUp', 'withoutMachine', 'machine', 'finisher', 'coolDown', 'stretching']
                }
              },
              required: ['workoutName', 'focus', 'goal', 'difficulty', 'summary', 'sections']
            }
          }
        });

        const parsedData = JSON.parse(response.text);
        return res.json({ workout: parsedData, isAiGenerated: true });
      } catch (err: any) {
        console.error('[Gemini API error]:', err);
        const fallback = generateFallbackWorkoutData(prompt, difficulty, goal, hasDumbbells, isHome);
        return res.json({ workout: fallback, isAiGenerated: false, apiWarn: err.message });
      }
    } else {
      const fallback = generateFallbackWorkoutData(prompt, difficulty, goal, hasDumbbells, isHome);
      return res.json({ workout: fallback, isAiGenerated: false, apiWarn: "No API key configured." });
    }
  });

  // Fallback gym planner data generator
  function generateFallbackWorkoutData(promptStr: string, difficultyStr: string, goalStr: string, hasDumbbells: boolean, isHome: boolean) {
    const promptLower = promptStr.toLowerCase();
    
    // Determine main muscles
    let mainMuscles = ['Chest', 'Triceps'];
    let workoutTitle = 'Dynamic Push (Chest & Triceps) Planner';
    if (promptLower.includes('leg') || promptLower.includes('squat')) {
      mainMuscles = ['Legs', 'Abs'];
      workoutTitle = `${difficultyStr} Lower Body Power Plan`;
    } else if (promptLower.includes('back') || promptLower.includes('pull')) {
      mainMuscles = ['Back', 'Biceps'];
      workoutTitle = `Ultimate Pull & Width Plan`;
    } else if (promptLower.includes('shoulder')) {
      mainMuscles = ['Shoulders', 'Abs'];
      workoutTitle = `Aesthetic V-Taper Shoulder Routine`;
    } else if (promptLower.includes('arm') || promptLower.includes('bicep') || promptLower.includes('tricep')) {
      mainMuscles = ['Biceps', 'Triceps'];
      workoutTitle = `Hypertrophy Arm Blast Blueprint`;
    } else if (promptStr.trim() !== '') {
      workoutTitle = `Custom: ${promptStr} Blast`;
      mainMuscles = [promptStr.split(' ')[0] || 'Full Body'];
    }

    const defaultMuscle = mainMuscles[0];
    const secondMuscle = mainMuscles[1] || mainMuscles[0];

    // Helper for Dumbbell or Home names
    const getChestPushName = () => {
      if (hasDumbbells) return 'Dumbbell Bench Press';
      if (isHome) return 'Decline Push-Ups (Feet Elevated)';
      return 'Incline Dumbbell Fly';
    };

    const getChestMachineName = () => {
      if (hasDumbbells) return 'Dumbbell Floor Press';
      if (isHome) return 'Diamond Push Ups';
      return 'Chest Press Machine';
    };

    const getTricepName = () => {
      if (isHome || hasDumbbells) return 'Dumbbell Overhead Elongation';
      return 'Tricep Rope Pushdown';
    };

    // Construct perfect structure
    return {
      workoutName: workoutTitle,
      focus: mainMuscles.join(' + '),
      goal: goalStr,
      difficulty: difficultyStr,
      summary: {
        totalExercises: 6,
        totalSets: 22,
        estimatedDurationMin: 55,
        caloriesBurned: goalStr === 'Fat Loss' ? 480 : 380,
        targetMuscles: mainMuscles,
        difficultyRating: difficultyStr === 'Advanced' ? 'Hard' : difficultyStr === 'Beginner' ? 'Light' : 'Moderate'
      },
      sections: {
        warmUp: [
          {
            name: 'Arm Circles & Side Rotations',
            targetMuscle: 'Shoulders & Joint Capsule',
            sets: '2',
            reps: '15 reps each',
            restTime: '30s',
            difficulty: 'Beginner',
            estimatedCalories: 25,
            benefits: ['Increases synovial fluid in shoulder joints', 'Actives rotator cuff stabilizers'],
            commonMistakes: ['Moving too fast with poor shoulder blade control', 'Holding breath'],
            instructions: ['Stand with feet hip-width apart', 'Extend arms to sides and draw clockwise circles', 'Reverse direction and extend circles wide']
          }
        ],
        withoutMachine: [
          {
            name: promptLower.includes('leg') ? 'Bodyweight Goblet Squats' : getChestPushName(),
            targetMuscle: promptLower.includes('leg') ? 'Legs (Quadriceps/Glutes)' : 'Chest & Front Deltoids',
            sets: '4',
            reps: difficultyStr === 'Advanced' ? '15-20' : '10-12',
            restTime: '90s',
            difficulty: difficultyStr,
            estimatedCalories: 75,
            benefits: ['Builds fundamental compound strength', 'Enhances pectoralis major activation'],
            commonMistakes: ['Baring neck alignment or arching lower lumbar', 'Flaring elbows outward excessively'],
            instructions: ['Keep torso rigid and core tightly braced', 'Lower chest smoothly near the support floor', 'Press back up explosively keeping shoulder-blades pinned']
          }
        ],
        machine: [
          {
            name: promptLower.includes('leg') ? 'Leg Press Machine' : getChestMachineName(),
            targetMuscle: defaultMuscle,
            sets: '4',
            reps: '12',
            restTime: '90s',
            difficulty: 'Intermediate',
            estimatedCalories: 90,
            benefits: ['Strict isolation under high mechanical tension', 'Eliminates balance limits for max motor unit fire'],
            commonMistakes: ['Using excessively heavy weight with partial range', 'Lifting hips off the seat pad'],
            instructions: ['Sit fully back into support bench', 'Grip handles securely and press outward while exhaling', 'Slowly resist the return negative weight']
          },
          {
            name: promptLower.includes('leg') ? 'Seated Leg Curl Line' : getTricepName(),
            targetMuscle: secondMuscle,
            sets: '4',
            reps: '12-15',
            restTime: '60s',
            difficulty: 'Intermediate',
            estimatedCalories: 65,
            benefits: ['Isolates target muscles with targeted continuous resistance', 'Strengthens reciprocal tendon fibers'],
            commonMistakes: ['Using body momentum to swing details', 'Failing to lock elbow pivot points'],
            instructions: ['Maintain stable shoulder and trunk posture', 'Contract the targets fully pushing through the handles', 'Squeeze for 1 second before control-releasing']
          }
        ],
        finisher: [
          {
            name: promptLower.includes('leg') ? 'High Speed Box Jumps' : 'Pec Deck Fly Burnout Set',
            targetMuscle: promptLower.includes('leg') ? 'Legs' : 'Chest Inner Fiber Peak',
            sets: '3',
            reps: 'Failure reps',
            restTime: '45s',
            difficulty: difficultyStr,
            estimatedCalories: 80,
            benefits: ['Forces massive blood flow (pump)', 'Exhausts remaining deep fast-twitch fibers'],
            commonMistakes: ['Sloppy form due to fatigue', 'Dropping focus on deep contractions'],
            instructions: ['Select a slightly lighter operational weight', 'Perform reps under complete safety control to maximum capability', 'Maintain absolute tension through top range squeeze']
          }
        ],
        coolDown: [
          {
            name: 'Low Intensity Treadmill Walk',
            targetMuscle: 'Cardio System & Lower Body',
            sets: '1',
            reps: '5 mins',
            restTime: 'None',
            difficulty: 'Beginner',
            estimatedCalories: 35,
            benefits: ['Lowers heart rate safely back to baseline', 'Promotes lactic acid metabolic clearance'],
            commonMistakes: ['Stopping immediately without light walking decompression'],
            instructions: ['Set treadmill to low walking speed (3.0 km/h)', 'Swing arms loosely, taking deep abdominal breaths']
          }
        ],
        stretching: [
          {
            name: promptLower.includes('leg') ? 'Standing Quad/Hamstring Stretch' : 'Doorway Pec & Tricep Stretch',
            targetMuscle: mainMuscles[0],
            sets: '2',
            reps: '30 seconds static hold',
            restTime: '15s',
            difficulty: 'Beginner',
            estimatedCalories: 10,
            benefits: ['Improves static flexibility range of motion', 'Reduces post-workout muscle soreness (DOMS)'],
            commonMistakes: ['Bouncing during stretch (ballistic behavior)', 'Forcing stretch past safe pain thresholds'],
            instructions: ['Find a doorway outer edge or wall fixture', 'Place hand/forearm securely and rotate torso outward gently', 'Hold the static stretch feeling muscle opening']
          }
        ]
      }
    };
  }

  // API Route: AI Discipline Coach & Nightly Planner
  app.post('/api/ai-discipline-coach', async (req, res) => {
    const { dailyTrack, studyHours, geminiApiKey, botToken, channelUsername } = req.body;
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    const summaryReport = `
    DAILY PROGRESS TRACK REPORT:
    - Study Block: ${dailyTrack?.studyCompleted ? '✅ COMPLETED' : '❌ MISSED'} (Hours studied: ${studyHours || 0}h)
    - Gym Completed: ${dailyTrack?.gymCompleted ? '✅ COMPLETED' : '❌ MISSED'}
    - Walking Completed: ${dailyTrack?.walkingCompleted ? '✅ COMPLETED' : '❌ MISSED'}
    - Revision Completed: ${dailyTrack?.revisionCompleted ? '✅ COMPLETED' : '❌ MISSED'}
    - Sleep Schedule: ${dailyTrack?.sleepCompleted ? '✅ COMPLETED' : '❌ MISSED'}
    `;

    const instructionsPrompt = `You are a strict, savage, but highly caring AI Discipline Coach for Roy, who is tracking his day. 
    Analyze his daily completions:
    ${summaryReport}

    Generate a JSON response of feedback, punishment and next-day missions:
    1. "feedback": A 2-3 sentence intense, direct, and slightly humorous roast or high-octane motivational critique in Hinglish (Hindi + English) or deep English. If he missed tasks, roast his lack of consistency. If he completed all, praise him like a future NEET topper and muscle warrior.
    2. "punishment": If he missed any task/habit, prescribe a highly specific active punishment (e.g. "50 burpees", "20 wide incline pushups", "30 minutes phone lock study", "Write 20 chemical equations"). If they are all completed, output "No punishment! Outstanding, you are dominating the game."
    3. "missions": An array of exactly 3 daily missions for tomorrow (e.g. "Do 45 mins uninterrupted Chemistry revision", "Drink 4L hydration water", "100 squats post-workout"). Each mission should have properties: "id", "title" (string), "rewardXp" (number, typically 50 to 150), and "isCompleted" (boolean, false).
    
    Structure it exactly with this JSON schema:
    {
      "feedback": "string",
      "punishment": "string",
      "missions": [
        { "id": "string", "title": "string", "rewardXp": 120, "isCompleted": false }
      ]
    }`;

    let coachResult = {
      feedback: `Abe Roy! Routine is a sacred contract. You missed crucial segments today. Stand up, reset, and prepare to crush tomorrow! No excuses, NEET exam won't study itself.`,
      punishment: dailyTrack?.studyCompleted && dailyTrack?.gymCompleted ? 'No punishment! Absolute dedication today.' : 'Do 30 high-intensity squats and 25 incline pushups right now!',
      missions: [
        { id: `m-${Date.now()}-1`, title: 'Attempt 35 NEET Biology Chapterwise Questions', rewardXp: 100, isCompleted: false },
        { id: `m-${Date.now()}-2`, title: 'Execute full Dynamic stretching routine & 10,000 steps', rewardXp: 80, isCompleted: false },
        { id: `m-${Date.now()}-3`, title: 'Complete a strict 40-minute organic chemistry revision sprint', rewardXp: 120, isCompleted: false }
      ]
    };

    let isAiGenerated = false;

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: instructionsPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                feedback: { type: Type.STRING },
                punishment: { type: Type.STRING },
                missions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      rewardXp: { type: Type.INTEGER },
                      isCompleted: { type: Type.BOOLEAN }
                    },
                    required: ['id', 'title', 'rewardXp', 'isCompleted']
                  }
                }
              },
              required: ['feedback', 'punishment', 'missions']
            }
          }
        });

        const parsed = JSON.parse(response.text);
        coachResult = parsed;
        isAiGenerated = true;
      } catch (err: any) {
        console.error('Gemini Discipline Coach error:', err);
      }
    }

    // Deliver report & punishment to Telegram if channel is set up
    let telegramDispatched = false;
    if (botToken && channelUsername) {
      try {
        const targetChannel = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const textPayload = `🚨 <b>DAILY DISCIPLINE SUMMARY & CRITIQUE</b> 🚨\n\n` +
          `<b>Roy's Tracking Report:</b>\n` +
          `• Study: ${dailyTrack?.studyCompleted ? '✅' : '❌'} (${studyHours || 0} hours)\n` +
          `• Gym: ${dailyTrack?.gymCompleted ? '✅' : '❌'}\n` +
          `• Walk: ${dailyTrack?.walkingCompleted ? '✅' : '❌'}\n` +
          `• Revision: ${dailyTrack?.revisionCompleted ? '✅' : '❌'}\n` +
          `• Sleep Sync: ${dailyTrack?.sleepCompleted ? '✅' : '❌'}\n\n` +
          `💬 <b>AI COACH INSIGHTS:</b>\n<i>"${coachResult.feedback}"</i>\n\n` +
          `⚠️ <b>ACTIVE PUNISHMENT SPECIATION:</b>\n⚖️ <code>${coachResult.punishment}</code>\n\n` +
          `🎯 <b>TOMORROW'S ELITE DAILY MISSIONS:</b>\n` +
          coachResult.missions.map((m: any, i: number) => `${i+1}. ${m.title} (+${m.rewardXp} XP)`).join('\n') +
          `\n\n<i>Maintain iron absolute discipline. Zero rules, zero shortcuts.</i>`;

        await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: targetChannel, text: textPayload, parse_mode: 'HTML' })
        });
        telegramDispatched = true;
      } catch (tgErr) {
        console.error('Telegram deliver error inside Coach:', tgErr);
      }
    }

    return res.json({
      coachResult,
      isAiGenerated,
      telegramDispatched
    });
  });

  // API Route: AI Emergency Motivation & High Octane Hinglish
  app.post('/api/ai-emergency-motivation', async (req, res) => {
    const { mode = 'hinglish', geminiApiKey, botToken, channelUsername } = req.body;
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    let systemPrompt = '';
    if (mode === 'hinglish') {
      systemPrompt = `You are a hyper-aggressive, high-octane Hinglish (Hindi + English mixture) motivational fitness and study trainer. 
      Deliver a raw, unapologetic, intense speech of 3-4 sentences directly calling out Roy to wake up! 
      Call out that NEET exam competition or gym muscles do not care about excuses, comfort, or laziness. Use terms like "Bhai", "crush your comfort zone", "sapne bada hai toh mehnat bhi double kar", "No excuses zone".`;
    } else {
      systemPrompt = `You are an elite navy seal style discipline commander. 
      Deliver a 3-4 sentence hyper-focused, clear, motivational command. Explain that comfort is a lie, pain is temporary, and greatness is forged in the silent focus of work. Keep it incredibly sharp and professional.`;
    }

    let motivationText = `Roy! Bhai teri fight tere comfort zone se hai. Dream medical seat free mein nahi milti. If you want to conquer, shut down all distractions, set the stopwatch right now, and drill biology! No limits, no rules! Play like a king.`;
    let speechText = `Bhai Roy! Aaj comfortable ho gaya na, toh kal NEET exam ro dega. Uth aur shuru ho ja right now! Let's conquer.`;

    let isAiGenerated = false;

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: systemPrompt
        });

        motivationText = response.text || motivationText;
        speechText = response.text || speechText;
        isAiGenerated = true;
      } catch (err) {
        console.error('Emergency Motivation generation failed:', err);
      }
    }

    // Optionally dispatch to Telegram as alarm
    let telegramDispatched = false;
    if (botToken && channelUsername) {
      try {
        const targetChannel = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const textPayload = `⚡️ <b>ROY EMERGENCY DISCIPLINE ALARM</b> ⚡️\n\n` +
          `🗣 <b>COMMAND COHORT STIMULATION:</b>\n` +
          `<i>"${motivationText}"</i>\n\n` +
          `🔊 <i>ALERT! Turn on beast mode immediately. Zero mercy, zero delay.</i>`;

        await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: targetChannel, text: textPayload, parse_mode: 'HTML' })
        });
        telegramDispatched = true;
      } catch (tgErr) {
        console.error('Telegram dispatch failed inside Motivation API:', tgErr);
      }
    }

    return res.json({
      motivationText,
      voicePayload: speechText,
      isAiGenerated,
      telegramDispatched
    });
  });

  // API Route: AI Study Planner Block
  app.post('/api/ai-study-planner', async (req, res) => {
    const { geminiApiKey, focusAreaSection = 'Biology', weakTopicName = 'Kinetic Theory', studyGoalHours = 6, language } = req.body;
    const lang = language || globalLanguage || 'hinglish';
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    const plannerPrompt = `You are a legendary AI Study Planner specializing in the Indian NEET Exam (Physics, Chemistry, and Biology combined).
    Generate a full-stack learning plan for Roy:
    - Subject Section focused: "${focusAreaSection}"
    - Current weak chapter/topic detected: "${weakTopicName}"
    - Daily Study Goal: ${studyGoalHours} Hours

    Construct a JSON response with high-quality NEET syllabus coverage.
    1. "dailyPlan": Exactly 3 structured hourly segments totaling ${studyGoalHours} hours. (e.g. "Hour 1-2: NCERT deep-dive of cell structure; Hour 3-4: Hydrocarbon mechanism pyq drill").
    2. "weeklyDirectives": 3 key milestone strategies to master "${focusAreaSection}" over the next 7 days.
    3. "weakTopicAction": A specific biomechanical recall approach to completely fix Roy's deficit in "${weakTopicName}".
    4. "revisionDrill": Exactly 3 core recall topics that Roy must check with active spacing interval intervals.

    LANGUAGE CONSTRAINT:
    ${getLanguageInstruction(lang)}
    Translate and assemble ALL text values in the JSON response properties (dailyPlan, weeklyDirectives, weakTopicAction, and revisionDrill) so they are in the chosen language.

    Return the schema exactly:
    {
      "dailyPlan": ["string"],
      "weeklyDirectives": ["string"],
      "weakTopicAction": "string",
      "revisionDrill": ["string"]
    }`;

    let plannerResult = {
      dailyPlan: [
        `Hour 1-2: Deep mental NCERT textbook analysis of active ${focusAreaSection} mechanisms`,
        `Hour 3-4: Full intensive high speed multiple choice question simulation (35 chapters pyq)`,
        `Hour 5-6: Targeted structural analysis of formulas and equations in formula logbook`
      ],
      weeklyDirectives: [
        `Drill the top 100 previous year high-weightage topics twice this week`,
        `Commit to active recall session spacing: recall formulas without referring to worksheets first`,
        `Re-attempt all missed textbook questions on alternating days`
      ],
      weakTopicAction: `Immediately write down a 1-page condensed diagnostic index map of "${weakTopicName}" purely from visual memory. Identify formulas, highlight exact gap errors in red pen, and drill 15 NCERT standard exemplars.`,
      revisionDrill: [
        `Active recall testing of critical core diagrams`,
        `Kinematic calculations equations spaced simulation`,
        `Organic reactivity chains high yield summary questions`
      ]
    };

    let isAiGenerated = false;

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: plannerPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dailyPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                weeklyDirectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                weakTopicAction: { type: Type.STRING },
                revisionDrill: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['dailyPlan', 'weeklyDirectives', 'weakTopicAction', 'revisionDrill']
            }
          }
        });

        plannerResult = JSON.parse(response.text);
        isAiGenerated = true;
      } catch (err) {
        console.error('Gemini Study Planner error:', err);
      }
    }

    return res.json({
      plannerResult,
      isAiGenerated
    });
  });

  // API Route: Roy AI Desktop Floating Assistant
  app.post('/api/ai-assistant', async (req, res) => {
    const { userMessage = '', currentStats, geminiApiKey } = req.body;
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    const promptContext = `You are Roy's personal cyber Assistant and iron military companion.
    Current Roy Tracker Status Context:
    - Target Focus Today: ${currentStats?.focus || 'General NEET Plan'}
    - Studied hours: ${currentStats?.studiedHours || 0}h
    - Active time block: ${currentStats?.activeTaskName || 'Transition break'}
    - Level: ${currentStats?.userLevel || 1}
    - XP: ${currentStats?.userXp || 0}
    - Completed checklist summary: Gym(${currentStats?.gym ? 'YES' : 'NO'}), Walk(${currentStats?.walk ? 'YES' : 'NO'}), Water(${currentStats?.waterLiters || 0}L)

    Roy's query is: "${userMessage}"

    Provide a direct, helpful, concise response of no more than 3 sentences. Be extremely objective, precise, and supportive but highly disciplined. Suggest the direct next physical action Roy should execute right now! Use literal, simple, honest guidance. Do not use complex system logs or marketing jargon.`;

    let reply = `Roy, you are currently at studied hours of ${currentStats?.studiedHours || 0}h. My direct prescription is to close this client applet window, set your mental stopwatch for 45 minutes, and dive immediately into your weak study segment. Excuses are for the weak!`;
    let isAiGenerated = false;

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: promptContext
        });

        reply = response.text || reply;
        isAiGenerated = true;
      } catch (err) {
        console.error('RoAI Assistant failed:', err);
      }
    }

    return res.json({
      reply,
      isAiGenerated
    });
  });

  // API Route: AI Diet Planner
  app.post('/api/ai-diet-planner', async (req, res) => {
    const { dietGoal = 'Muscle Gain', restriction = 'Vegetarian', geminiApiKey, language } = req.body;
    const lang = language || globalLanguage || 'hinglish';
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    let dietResult = {
      breakfast: "Oats with almonds, banana, and whey protein scoop or chia pudding with high-protein soya chunks stir-fry.",
      lunch: "Brown rice, spiced lentil daal, paneer/tofu tikka (150g), and a raw green salad.",
      dinner: "Quinoa salad with roasted broccoli, black beans, bell peppers, and avocado slices.",
      preWorkout: "Black coffee with 1 medium banana.",
      postWorkout: "Whey protein isolate shake or Greek-style sprout bowl.",
      calories: 2750,
      protein: 145,
      carbs: 310,
      fats: 65,
      waterIntake: 3800
    };
    let isAiGenerated = false;

    if (dietGoal.toLowerCase().includes('loss')) {
      dietResult = {
        breakfast: "Egg white scramble with spinach and whole wheat toast, or Moong daal chilla.",
        lunch: "Sautéed low-fat paneer, mix vegetable curry, and 1 multigrain chapati with cucumber salad.",
        dinner: "Grilled vegetables with boiled sprouts or low-fat paneer salad.",
        preWorkout: "Matcha green tea or black coffee.",
        postWorkout: "Protein shake or dry roasted chickpea mix.",
        calories: 1850,
        protein: 130,
        carbs: 180,
        fats: 45,
        waterIntake: 4000
      };
    } else if (dietGoal.toLowerCase().includes('gain')) {
      dietResult = {
        breakfast: "Peanut butter banana toast with raw honey and whole milk milkshakes.",
        lunch: "Three whole wheat chapatis, full bowl chickpea curry, heavy portion of paneer, and rice.",
        dinner: "Soya chunks dynamic biryani or roasted paneer mash with baked potatoes.",
        preWorkout: "Dates with almond butter or sweet potato bowl.",
        postWorkout: "Oatmeal whey mix with roasted almonds.",
        calories: 3200,
        protein: 160,
        carbs: 390,
        fats: 85,
        waterIntake: 4500
      };
    }

    if (restriction.toLowerCase() === 'non-vegetarian') {
      dietResult.breakfast = dietResult.breakfast.replace(/chia pudding|paneer|tofu/gi, "3 whole scrambled eggs and seared lean turkey");
      dietResult.lunch = dietResult.lunch.replace(/paneer\/tofu tikka/gi, "Grilled chicken breast (200g)");
      dietResult.dinner = dietResult.dinner.replace(/paneer|beans/gi, "Baked salmon fillet or lean minced beef with asparagus");
      dietResult.postWorkout = dietResult.postWorkout.replace(/Greek-style sprout bowl|sprout bowl/gi, "Egg white salad or protein shake");
      dietResult.protein += 25; // non-veg has denser protein typically
    }

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const promptContext = `Generate a rigorous, clean meal and macros plan for Roy's 'ROY NO RULES' program.
        Roy has selected:
        - Diet Goal: ${dietGoal} (Scale macros specifically for this goal)
        - Dietary Style: ${restriction} (Respect Vegetarian vs Non-Vegetarian strictly)
        
        Provide highly nutritious meals popular in India. Include the correct number counts for calories, protein, carbs, fats, and target water intake. Do not suggest placeholders.
        
        LANGUAGE CONSTRAINT:
        ${getLanguageInstruction(lang)}
        IMPORTANT: Translate ALL description attributes in the JSON response (breakfast, lunch, dinner, preWorkout, postWorkout) into the chosen language.`;

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: promptContext,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                breakfast: { type: Type.STRING },
                lunch: { type: Type.STRING },
                dinner: { type: Type.STRING },
                preWorkout: { type: Type.STRING },
                postWorkout: { type: Type.STRING },
                calories: { type: Type.INTEGER },
                protein: { type: Type.INTEGER },
                carbs: { type: Type.INTEGER },
                fats: { type: Type.INTEGER },
                waterIntake: { type: Type.INTEGER }
              },
              required: ['breakfast', 'lunch', 'dinner', 'preWorkout', 'postWorkout', 'calories', 'protein', 'carbs', 'fats', 'waterIntake']
            }
          }
        });

        if (response.text) {
          dietResult = JSON.parse(response.text);
          isAiGenerated = true;
        }
      } catch (err) {
        console.error('Diet planner error:', err);
      }
    }

    return res.json({
      dietResult,
      isAiGenerated
    });
  });

  // API Route: AI Discipline Recovery Planner
  app.post('/api/ai-discipline-recovery', async (req, res) => {
    const { recoveryDuration = '7-Day Plan', missedRoutines = 'Missed study block and skipped gym sessions', geminiApiKey } = req.body;
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    let recoveryPlan = [
      "Stand Up and clear your study desk of all clutter (10 minutes)",
      "Do 20 raw deep squats or push-ups to reset cortisol and mental sluggishness",
      "Solve exactly 10 high-intensity NEET physics/biology past year MCQs right now to break progress friction",
      "Fast from all personal social media and non-essential messaging for the next 24 hours",
      "Log your hydration immediately and configure alarms for 4:30 AM tomorrow"
    ];
    let philosophy = "Downtime is over, Roy. High physical friction requires instant mechanical action. No thinking, just execution. Your discipline levels are now restored to combat status.";
    let dailyTargetXpBonus = 150;
    let isAiGenerated = false;

    if (recoveryDuration.includes('14')) {
      dailyTargetXpBonus = 250;
    }

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const promptContext = `Roy has broken discipline by: "${missedRoutines}".
        He initiated a ${recoveryDuration} Discipline Recovery Protocol.
        Generate an aggressive, action-oriented, precise plan. Build sequential concrete bullets.
        Also write a brutal philosophy/motivation paragraph to snap him out of lazy habits.`;

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: promptContext,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recoveryPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                philosophy: { type: Type.STRING },
                dailyTargetXpBonus: { type: Type.INTEGER }
              },
              required: ['recoveryPlan', 'philosophy', 'dailyTargetXpBonus']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          recoveryPlan = parsed.recoveryPlan || recoveryPlan;
          philosophy = parsed.philosophy || philosophy;
          dailyTargetXpBonus = parsed.dailyTargetXpBonus || dailyTargetXpBonus;
          isAiGenerated = true;
        }
      } catch (err) {
        console.error('Discipline Recovery AI error:', err);
      }
    }

    return res.json({
      recoveryPlan,
      philosophy,
      dailyTargetXpBonus,
      isAiGenerated
    });
  });

  // API Route: AI Weakness Detector
  app.post('/api/ai-weakness-detector', async (req, res) => {
    const { stats, geminiApiKey } = req.body;
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    let weaknessAnalysis = "Roy is exhibiting minor friction in early-morning transition periods and physical science NEET subject chapters review.";
    let improvementPlan = "Allocate the initial 30 minutes of the study block strictly to the weakest topics in Chemistry. Remove phones entirely from the room before sleep logs.";
    let recuperationFrictionScore = 4;
    let actionableDirectives = [
      "Dedicate first 45 mins of NEET blocks solely to active recall flashcards.",
      "Sync water logs after every study interval block completion.",
      "Execute 30 quick jumping jacks before attempting cold Physics formula derivations."
    ];
    let isAiGenerated = false;

    if (stats?.missedTaskRatio > 0.3) {
      recuperationFrictionScore = 8;
      weaknessAnalysis = "CRITICAL: Multiple routine task bypasses observed. Brain is chasing comfortable dopamine loops.";
    }

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const promptContext = `Analyze Roy's performance statistics context:
        - Missed task ratio: ${stats?.missedTaskRatio || 0.1}
        - Total Study Hours completed: ${stats?.studyHours || 0}h
        - Gym Habit Check: ${stats?.gymCompleted ? 'COMPLETED' : 'MISSED'}
        - Sleep Quality Logged: ${stats?.sleepHours || 'Not tracked'}h
        - Fluid intake state: ${stats?.waterLogged || 0} ml
        
        Perform a brutal, honest diagnostic analysis. Highlight the direct loopholes causing discipline drift. Describe a rigorous corrective plan, assign a friction rating scale (1-10) and 3 short directives.`;

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: promptContext,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                weaknessAnalysis: { type: Type.STRING },
                improvementPlan: { type: Type.STRING },
                recuperationFrictionScore: { type: Type.INTEGER },
                actionableDirectives: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['weaknessAnalysis', 'improvementPlan', 'recuperationFrictionScore', 'actionableDirectives']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          weaknessAnalysis = parsed.weaknessAnalysis || weaknessAnalysis;
          improvementPlan = parsed.improvementPlan || improvementPlan;
          recuperationFrictionScore = parsed.recuperationFrictionScore || recuperationFrictionScore;
          actionableDirectives = parsed.actionableDirectives || actionableDirectives;
          isAiGenerated = true;
        }
      } catch (err) {
        console.error('Weakness detector error:', err);
      }
    }

    return res.json({
      weaknessAnalysis,
      improvementPlan,
      recuperationFrictionScore,
      actionableDirectives,
      isAiGenerated
    });
  });

  // API Route: Roy No Rules Universe Central Intelligence
  app.post('/api/ai-universe-recommendation', async (req, res) => {
    const { stats, countdowns, habits, money, bike, geminiApiKey } = req.body;
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;

    let universeStatusSummary = "The Roy No Rules microcosm is in tactical balance. NEET study schedules align with critical physical hypertrophy segments.";
    let personalizedRecommendations = [
      "Ensure Royal Enfield chain lube routine is completed before evening clinic run.",
      "Your study savings goal stands at track. Fast from dining out to speed up savings surplus.",
      "Biology weak chapters require 2 additional micro study blocks of active recall tomorrow under Beast Focus."
    ];
    let syncDisciplineScore = 75;
    let isAiGenerated = false;

    if (habits?.streakAvg < 3) {
      syncDisciplineScore = 58;
      universeStatusSummary = "ALERT: Micronutrient, study habit, and biometrics tracking show low synchronization. Interlocking drift detected.";
    }

    if (apiKeyToUse && apiKeyToUse.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const promptContext = `You are the master cybernetic mind governing the 'ROY NO RULES UNIVERSE'.
        You possess integrated access to ALL active tracker modules:
        - Main Stats: Level ${stats?.level}, XP ${stats?.xp}, Water ${stats?.water}ml, Study ${stats?.studyHours}h
        - Countdown Goals: ${JSON.stringify(countdowns || [])}
        - Habits streaking: ${JSON.stringify(habits || [])}
        - Financial reserves: ${JSON.stringify(money || {})}
        - Royal Enfield hunter 350 maintenance: ${JSON.stringify(bike || {})}
        
        Generate a supreme, unified micro analysis linking these modules. Give a precise, literal assessment of how physical upkeep (bike), financial health (money trackers), cognitive excellence (NEET prep) and biomechanics are aligned. Return a unified score (1-100) and 3 premium personal prescriptions.`;

        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3.5-flash',
          contents: promptContext,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                universeStatusSummary: { type: Type.STRING },
                personalizedRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                syncDisciplineScore: { type: Type.INTEGER }
              },
              required: ['universeStatusSummary', 'personalizedRecommendations', 'syncDisciplineScore']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          universeStatusSummary = parsed.universeStatusSummary || universeStatusSummary;
          personalizedRecommendations = parsed.personalizedRecommendations || personalizedRecommendations;
          syncDisciplineScore = parsed.syncDisciplineScore || syncDisciplineScore;
          isAiGenerated = true;
        }
      } catch (err) {
        console.error('Universe Intelligence error:', err);
      }
    }

    return res.json({
      universeStatusSummary,
      personalizedRecommendations,
      syncDisciplineScore,
      isAiGenerated
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Roy No Rules Server running on http://localhost:${PORT}`);
  });
}

// Helpers for YouTube fallback search values
function getFallbackExercises(muscleQuery: string) {
  const query = muscleQuery.toLowerCase();
  if (query.includes('bench') || query.includes('chest')) {
    return [
      {
        videoId: '8iPjd5ap_64',
        title: 'Perfect Bench Press Form Guide (Avoid Injury)',
        thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'AthleanX'
      },
      {
        videoId: 'v9IAyepZ69A',
        title: 'How to Incline Dumbbell Press for Upper Chest Growth',
        thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'Jeff Nippard'
      }
    ];
  } else if (query.includes('back') || query.includes('row') || query.includes('lat')) {
    return [
      {
        videoId: 'CAwf7n6Luuc',
        title: 'How to Pull-Up Correctly (Step-by-Step Form)',
        thumbnail: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'Jeremy Ethier'
      },
      {
        videoId: 'axoeDmW0oAY',
        title: 'Perfect Barbell Row Guidelines for Massive Thickness',
        thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'AthleanX'
      }
    ];
  } else if (query.includes('shoulder') || query.includes('press') || query.includes('lateral')) {
    return [
      {
        videoId: 'HzIiNhHh8Ok',
        title: 'Overhead Press Guide (Avoid Lumbar Stress)',
        thumbnail: 'https://images.unsplash.com/photo-1532029837906-83b5f60e0a39?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'Alan Thrall'
      },
      {
        videoId: '-t7fePP0S_g',
        title: 'How to Lateral Raise for Aesthetic Side Delts',
        thumbnail: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'Jeff Nippard'
      }
    ];
  } else if (query.includes('squat') || query.includes('leg') || query.includes('hamstring')) {
    return [
      {
        videoId: 'gcNh17Cwl84',
        title: 'Squat Checklist (High Bar vs Low Bar Form)',
        thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'Squat University'
      },
      {
        videoId: 'D7KaRcUTQeE',
        title: 'Leg Press Safely (Never Hyper-Extend Your Knee!)',
        thumbnail: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'Mind Pump Show'
      }
    ];
  } else {
    // Default fallback
    return [
      {
        videoId: 'U90fE5rR9Xg',
        title: 'Complete Fitness Form Principles (For Study grind)',
        thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=480&auto=format&fit=crop&q=60',
        channelTitle: 'Buff Dudes'
      }
    ];
  }
}

startServer();
