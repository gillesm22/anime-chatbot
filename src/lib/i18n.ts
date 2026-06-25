"use client";

export type Language = "en" | "ja";

export interface Translations {
  [key: string]: string;
}

const STORAGE_KEY = "anime-chatbot-language";

const translations: Record<Language, Translations> = {
  en: {
    chooseCompanion: "Choose Your Companion",
    gallery: "Gallery",
    settings: "Settings",
    back: "Back",
    send: "Send",
    typeMessage: "Type your message...",
    clickToContinue: "Click to start chatting",
    offline: "Offline Mode",
    dayReward: "Day %d Reward!",
    claim: "Claim",
    milestoneUnlocked: "Milestone unlocked",
    "levelNames.stranger": "Stranger",
    "levelNames.acquaintance": "Acquaintance",
    "levelNames.friend": "Friend",
    "levelNames.closeFriend": "Close Friend",
    "levelNames.soulmate": "Soulmate",
    auto: "Auto",
    history: "History",
  },
  ja: {
    chooseCompanion: "仲間を選んでね",
    gallery: "ギャラリー",
    settings: "設定",
    back: "戻る",
    send: "送信",
    typeMessage: "メッセージを入力...",
    clickToContinue: "クリックしてチャット開始",
    offline: "オフラインモード",
    dayReward: "%d日目の報酬！",
    claim: "受け取る",
    milestoneUnlocked: "実績解除",
    "levelNames.stranger": "他人",
    "levelNames.acquaintance": "知り合い",
    "levelNames.friend": "友達",
    "levelNames.closeFriend": "親友",
    "levelNames.soulmate": "運命の人",
    auto: "自動",
    history: "履歴",
  },
};

export function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ja") return saved;
  } catch {
    // localStorage unavailable
  }
  return "en";
}

export function setLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage unavailable
  }
}

export function t(key: string): string {
  const lang = getLanguage();
  const result = translations[lang][key];
  if (result !== undefined) return result;
  // Fallback to English
  return translations["en"][key] ?? key;
}

export function getCharacterJapaneseVoice(characterId: string): string {
  switch (characterId) {
    case "arisu":
      return "ja-JP-NanamiNeural";
    case "marin":
      return "ja-JP-MayuNeural";
    case "nao":
      return "ja-JP-NanamiNeural";
    default:
      return "ja-JP-NanamiNeural";
  }
}
