export type Language = 'hindi' | 'hinglish' | 'english';

export interface TranslationSet {
  // App Header & Meta
  appName: string;
  appSubtitle: string;
  failTask: string;
  languageSelect: string;

  // Bottom Navigation
  navDashboard: string;
  navGym: string;
  navNeet: string;
  navBeast: string;

  // Dashboard
  activeNow: string;
  autoDetected: string;
  upNext: string;
  whatToDoNow: string;
  disciplineScore: string;
  scoreTip: string;
  routineProgress: string;
  completedStudy: string;
  studyGoalUnit: string;
  activeStudyStreak: string;
  activeGymStreak: string;
  routineStreak: string;
  achievementsUnlocked: string;
  days: string;
  unlocked: string;
  checklistTitle: string;
  checklistStudy: string;
  checklistGym: string;
  checklistClinic: string;
  checklistRevision: string;
  checklistSleep: string;
  checklistWalk: string;

  // NEET Prep
  neetProgressTitle: string;
  needsAttention: string;
  weakTopicsWarning: string;
  neetDailyTargets: string;
  addCustomTargetPlaceholder: string;
  addTargetBtn: string;
  studiedStatus: string;
  studyStatusBtn: string;
  topicRevised: string;
  topicReviseBtn: string;
  topicWeak: string;
  topicWeakBtn: string;
  noTargetsLogged: string;

  // Gym Tab
  workoutScheduleTab: string;
  aiGymExpertTab: string;
  restTimerTitle: string;
  estimatedDuration: string;
  caloriesBurned: string;
  exercisesInAction: string;
  commonMistakes: string;
  benefits: string;
  startExerciseBlock: string;
  guidedButton: string;

  // AI Advice Dialog
  aiCoachAdviceTitle: string;
  aiCoachLoading: string;
  closeBtn: string;

  // Settings & Admin
  adminTitle: string;
  adminLockHint: string;
  unlockBtn: string;
}

export const translations: Record<Language, TranslationSet> = {
  hindi: {
    appName: "रॉय नो रूल्स",
    appSubtitle: "पढ़ाई • जिम • अनुशासन • कोई बहाना नहीं",
    failTask: "⚠ टास्क फेल",
    languageSelect: "🌐 भाषा",

    navDashboard: "डैशबोर्ड",
    navGym: "जिमखाना",
    navNeet: "NEET तैयारी",
    navBeast: "बीस्ट सुइट",

    activeNow: "अभी एक्टिव है",
    autoDetected: "ऑटो-डिटेक्टेड मोड",
    upNext: "अगला टास्क:",
    whatToDoNow: "अभी मुझे क्या करना चाहिए?",
    disciplineScore: "अनुशासन स्कोर",
    scoreTip: "अनुशासन 100 बनाए रखने के लिए रूटीन का पालन करें",
    routineProgress: "रूटीन प्रगति बार",
    completedStudy: "पढ़ाई पूरी हुई",
    studyGoalUnit: "घंटे / 5 घंटे",
    activeStudyStreak: "सक्रिय पढ़ाई स्ट्रीक",
    activeGymStreak: "सक्रिय जिम स्ट्रीक",
    routineStreak: "रूटीन स्ट्रीक",
    achievementsUnlocked: "अनलॉक किए गए मेडल",
    days: "दिन",
    unlocked: "खुले",
    checklistTitle: "आज का चेकलिस्ट",
    checklistStudy: "पढ़ाई ब्लॉक पूरा हुआ",
    checklistGym: "जिम सेशन पूरा हुआ",
    checklistClinic: "क्लिनिक ड्यूटी पूरी हुई",
    checklistRevision: "रिवीजन स्प्रिंट पूरा हुआ",
    checklistSleep: "पर्याप्त नींद ली",
    checklistWalk: "टहलना पूरा हुआ",

    neetProgressTitle: "NEET सिलेबस प्रगति आँकड़े",
    needsAttention: "ध्यान दें (कमज़ोर टॉपिक्स)",
    weakTopicsWarning: "इन अध्यायों में आपकी पकड़ कमज़ोर लग रही है। इन्हें सीधे अपने रिवीजन ब्लॉक में जोड़ें!",
    neetDailyTargets: "NEET दैनिक लक्ष्य",
    addCustomTargetPlaceholder: "दैनिक लक्ष्य जोड़ें (जैसे: केमिस्ट्री MCQs सॉल्व करें...)",
    addTargetBtn: "लक्ष्य जोड़ें",
    studiedStatus: "✓ पढ़ा हुआ",
    studyStatusBtn: "पढ़ें",
    topicRevised: "✓ रिवाइज्ड",
    topicReviseBtn: "रिवाइज",
    topicWeak: "⚠ कमज़ोर",
    topicWeakBtn: "कमज़ोर",
    noTargetsLogged: "आज के लिए कोई NEET लक्ष्य नहीं जोड़ा गया है। नया लॉक बनाएं!",

    workoutScheduleTab: "वर्कआउट शेड्यूल",
    aiGymExpertTab: "AI जिम प्लानर",
    restTimerTitle: "रेस्ट ड्यूरेशन टाइमर",
    estimatedDuration: "अनुमानित समय",
    caloriesBurned: "कैलोरी बर्न",
    exercisesInAction: "सक्रिय व्यायाम सूची",
    commonMistakes: "आम गलतियाँ",
    benefits: "व्यायाम के फायदे",
    startExerciseBlock: "व्यायाम ब्लॉक शुरू करें",
    guidedButton: "वीडियो गाइड देखें",

    aiCoachAdviceTitle: "AI अनुशासन कोच सलाह",
    aiCoachLoading: "कोच सोच रहा है...",
    closeBtn: "बंद करें",

    adminTitle: "पासकोड सुरक्षित",
    adminLockHint: "सिस्टम कॉन्फ़िगरेशन बदलने के लिए पिन दर्ज करें (868486)",
    unlockBtn: "अनलॉक करें"
  },
  hinglish: {
    appName: "ROY NO RULES",
    appSubtitle: "Study • Gym • Discipline • No Excuses",
    failTask: "⚠ Fail Task",
    languageSelect: "🌐 Language",

    navDashboard: "Dashboard",
    navGym: "Gymnasium",
    navNeet: "NEET Prep",
    navBeast: "Beast Suite",

    activeNow: "ACTIVE NOW",
    autoDetected: "Auto-Detected Mode",
    upNext: "Up Next:",
    whatToDoNow: "What Should I Do Now?",
    disciplineScore: "Discipline Score",
    scoreTip: "Keep routine intact to maintain 100",
    routineProgress: "Routine Progress Bar",
    completedStudy: "Completed Study",
    studyGoalUnit: "hrs / 5 hrs",
    activeStudyStreak: "Active Study Streak",
    activeGymStreak: "Active Gym Streak",
    routineStreak: "Routine Streak",
    achievementsUnlocked: "Achievements Unlocked",
    days: "Days",
    unlocked: "Unlocked",
    checklistTitle: "Checklist Checklist",
    checklistStudy: "Study Block completed",
    checklistGym: "Gym block completed",
    checklistClinic: "Clinic duty completed",
    checklistRevision: "Target revision done",
    checklistSleep: "Core Sleep taken",
    checklistWalk: "Decompress walk done",

    neetProgressTitle: "NEET Syllabus Progress Metrics",
    needsAttention: "NEEDS ATTENTION (Weak Topics)",
    weakTopicsWarning: "These topics have been flagged as weak. Program these chapters directly into your revision blocks!",
    neetDailyTargets: "NEET Daily Targets",
    addCustomTargetPlaceholder: "Add custom target (e.g. Solve SN2 mechanism MCQ...)",
    addTargetBtn: "Add Target",
    studiedStatus: "✓ studied",
    studyStatusBtn: "study",
    topicRevised: "✓ revised",
    topicReviseBtn: "revise",
    topicWeak: "⚠ weak",
    topicWeakBtn: "weak",
    noTargetsLogged: "No NEET targets added for today yet. Make a target lock!",

    workoutScheduleTab: "Workout Schedule",
    aiGymExpertTab: "AI Gym Expert",
    restTimerTitle: "Rest Duration Timer",
    estimatedDuration: "Estimated Duration",
    caloriesBurned: "Calories Burned",
    exercisesInAction: "Exercises In Action",
    commonMistakes: "Common Mistakes",
    benefits: "Benefits",
    startExerciseBlock: "Start Exercise Block",
    guidedButton: "Watch Guide Video",

    aiCoachAdviceTitle: "AI Discipline Coach Advice",
    aiCoachLoading: "Coach is analyzing...",
    closeBtn: "Close",

    adminTitle: "Passcode Protected",
    adminLockHint: "ROY NO RULES system requires security clearance pin (868486).",
    unlockBtn: "Unlock Admin"
  },
  english: {
    appName: "ROY NO RULES",
    appSubtitle: "Study • Gym • Discipline • No Excuses",
    failTask: "⚠ Fail Task",
    languageSelect: "🌐 Language",

    navDashboard: "Dashboard",
    navGym: "Gymnasium",
    navNeet: "NEET Prep",
    navBeast: "Beast Suite",

    activeNow: "ACTIVE NOW",
    autoDetected: "Auto-Detected Mode",
    upNext: "Up Next:",
    whatToDoNow: "What Should I Do Now?",
    disciplineScore: "Discipline Score",
    scoreTip: "Keep routine intact to maintain 100",
    routineProgress: "Routine Progress Bar",
    completedStudy: "Completed Study",
    studyGoalUnit: "hrs / 5 hrs",
    activeStudyStreak: "Active Study Streak",
    activeGymStreak: "Active Gym Streak",
    routineStreak: "Routine Streak",
    achievementsUnlocked: "Achievements Unlocked",
    days: "Days",
    unlocked: "Unlocked",
    checklistTitle: "Checklist Checklist",
    checklistStudy: "Study Block completed",
    checklistGym: "Gym block completed",
    checklistClinic: "Clinic duty completed",
    checklistRevision: "Target revision done",
    checklistSleep: "Core Sleep taken",
    checklistWalk: "Decompress walk done",

    neetProgressTitle: "NEET Syllabus Progress Metrics",
    needsAttention: "NEEDS ATTENTION (Weak Topics)",
    weakTopicsWarning: "These topics are currently weak. Program these chapters directly into your revision blocks!",
    neetDailyTargets: "NEET Daily Targets",
    addCustomTargetPlaceholder: "Add custom target (e.g. Solve SN2 mechanism MCQ...)",
    addTargetBtn: "Add Target",
    studiedStatus: "✓ studied",
    studyStatusBtn: "study",
    topicRevised: "✓ revised",
    topicReviseBtn: "revise",
    topicWeak: "⚠ weak",
    topicWeakBtn: "weak",
    noTargetsLogged: "No NEET targets added for today yet. Make a target lock!",

    workoutScheduleTab: "Workout Schedule",
    aiGymExpertTab: "AI Gym Expert",
    restTimerTitle: "Rest Duration Timer",
    estimatedDuration: "Estimated Duration",
    caloriesBurned: "Calories Burned",
    exercisesInAction: "Exercises In Action",
    commonMistakes: "Common Mistakes",
    benefits: "Benefits",
    startExerciseBlock: "Start Exercise Block",
    guidedButton: "Watch Guide Video",

    aiCoachAdviceTitle: "AI Discipline Coach Advice",
    aiCoachLoading: "Coach is analyzing...",
    closeBtn: "Close",

    adminTitle: "Passcode Protected",
    adminLockHint: "ROY NO RULES system requires security clearance pin (868486).",
    unlockBtn: "Unlock Admin"
  }
};
