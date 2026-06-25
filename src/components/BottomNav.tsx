export interface BottomNavProps {
  characterId: string;
  accentColor: string;
  onShowDiary: () => void;
  onShowGifts: () => void;
  onShowHistory: () => void;
  onShowScreenshot: () => void;
  onShowOutfits: () => void;
}

export type BottomNavTab = "chat" | "outfits" | "gifts" | "diary" | "more";

interface NavButtonProps {
  label: string;
  active: boolean;
  accentColor: string;
  onClick: () => void;
  icon: React.ReactNode;
}

function NavButton({ label, active, accentColor, onClick, icon }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        flex: 1,
        height: "100%",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 4px",
        color: active ? accentColor : "rgba(255,255,255,0.45)",
        transition: "color 0.2s ease",
        pointerEvents: "auto",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          filter: active ? `drop-shadow(0 0 6px ${accentColor})` : "none",
          transition: "filter 0.2s ease",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: "10px",
          fontWeight: active ? 600 : 400,
          letterSpacing: "0.02em",
          lineHeight: 1,
          transition: "font-weight 0.2s ease",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// SVG icons
function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function HangerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 18H3.62a1 1 0 0 1-.65-1.76L12 9" />
      <path d="M12 9V6" />
      <path d="M12 6a2 2 0 1 0-2-2" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

export function BottomNav({
  accentColor,
  onShowDiary,
  onShowGifts,
  onShowHistory,
  onShowScreenshot,
  onShowOutfits,
}: BottomNavProps) {
  // activeTab is managed externally via callbacks; default highlight is "chat"
  // For a stateless nav, we highlight "chat" by default. Parent can lift state if needed.
  const activeTab = "chat" as BottomNavTab;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "65px",
        zIndex: 40,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        background: "rgba(13,13,18,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
        borderTop: `1px solid ${accentColor}33`,
        pointerEvents: "auto",
      }}
    >
      <NavButton
        label="Chat"
        active={activeTab === "chat"}
        accentColor={accentColor}
        onClick={() => {}}
        icon={<ChatIcon />}
      />
      <NavButton
        label="Outfits"
        active={activeTab === "outfits"}
        accentColor={accentColor}
        onClick={onShowOutfits}
        icon={<HangerIcon />}
      />
      <NavButton
        label="Gifts"
        active={activeTab === "gifts"}
        accentColor={accentColor}
        onClick={onShowGifts}
        icon={<GiftIcon />}
      />
      <NavButton
        label="Diary"
        active={activeTab === "diary"}
        accentColor={accentColor}
        onClick={onShowDiary}
        icon={<BookIcon />}
      />
      <NavButton
        label="More"
        active={activeTab === "more"}
        accentColor={accentColor}
        onClick={() => {}}
        icon={<DotsIcon />}
      />
    </nav>
  );
}
