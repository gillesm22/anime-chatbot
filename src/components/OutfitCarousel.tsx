import { useRef } from "react";
import type { Outfit } from "./OutfitSelector";

const OUTFITS: { id: Outfit; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "bikini-front", label: "Bikini" },
  { id: "bikini-back", label: "Bikini Back" },
  { id: "casual", label: "Casual" },
  { id: "formal", label: "Formal" },
  { id: "school", label: "School" },
  { id: "school-skimpy", label: "School+" },
  { id: "cheerleader", label: "Cheer" },
  { id: "cheer-extreme", label: "Cheer+" },
  { id: "maid", label: "Maid" },
  { id: "vampire", label: "Vampire" },
  { id: "nurse", label: "Nurse" },
  { id: "cow", label: "Cow" },
  { id: "cowgirl", label: "Cowgirl" },
  { id: "demon", label: "Demon" },
  { id: "clown", label: "Clown" },
  { id: "flamenco", label: "Flamenco" },
];

export interface OutfitCarouselProps {
  characterId: string;
  basePath: string;
  accentColor: string;
  currentOutfit: string;
  onSelectOutfit: (outfit: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const FULL_OUTFIT_CHARS = new Set(["arisu", "marin", "suzuka", "kurisu", "merrick", "ticia"]);

export function OutfitCarousel({
  characterId,
  basePath,
  accentColor,
  currentOutfit,
  onSelectOutfit,
  isOpen,
  onClose,
}: OutfitCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasOutfits = FULL_OUTFIT_CHARS.has(characterId);
  const visibleOutfits = hasOutfits ? OUTFITS : OUTFITS.filter((o) => o.id === "default");

  return (
    <>
      <style>{`
        .outfit-carousel-scroll::-webkit-scrollbar {
          display: none;
        }
        .outfit-carousel-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
        }
        .outfit-carousel-panel {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .outfit-thumb {
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.2s ease;
          scroll-snap-align: center;
        }
        .outfit-thumb:active {
          transform: scale(0.96);
        }
        .outfit-thumb-active {
          transform: scale(1.05);
        }
      `}</style>

      <div
        className="outfit-carousel-panel"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 35,
          background: "var(--color-panel)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderTop: `1px solid var(--color-border)`,
          padding: "12px 12px 16px",
          transform: isOpen ? "translateY(0)" : "translateY(110%)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-secondary)",
            }}
          >
            Outfits
          </span>
          <button
            onClick={onClose}
            style={{
              background: "var(--color-border)",
              border: "none",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: "14px",
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="Close outfit selector"
          >
            ✕
          </button>
        </div>

        {/* Scrollable thumbnail row */}
        <div
          ref={scrollRef}
          className="outfit-carousel-scroll"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "8px",
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: "2px",
          }}
        >
          {visibleOutfits.map((outfit) => {
            const isActive = outfit.id === currentOutfit;
            return (
              <button
                key={outfit.id}
                className={`outfit-thumb${isActive ? " outfit-thumb-active" : ""}`}
                onClick={() => onSelectOutfit(outfit.id)}
                style={{
                  flex: "0 0 auto",
                  width: "60px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "5px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                title={outfit.label}
              >
                {/* Thumbnail card */}
                <div
                  style={{
                    width: "60px",
                    height: "90px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: isActive
                      ? `2px solid ${accentColor}`
                      : "2px solid var(--color-toggle-bg)",
                    boxShadow: isActive
                      ? `0 0 12px ${accentColor}66, 0 0 24px ${accentColor}33, 0 0 4px ${accentColor}aa`
                      : "none",
                    background: "var(--color-hover-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <img
                    src={`${basePath}/body-${outfit.id === "default" ? "neutral" : outfit.id}.png`}
                    alt={outfit.label}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top center",
                      display: "block",
                    }}
                    draggable={false}
                  />
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: "8px",
                    color: isActive ? accentColor : "var(--color-inactive-nav)",
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: "0.02em",
                    textAlign: "center",
                    lineHeight: 1.2,
                    maxWidth: "60px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    transition: "color 0.15s ease",
                  }}
                >
                  {outfit.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
