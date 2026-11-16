import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaQuestionCircle } from "react-icons/fa";
import { useStore } from "../../store";
import { useAstroStore } from "../../astroStore";
import { ASPECT_DEFINITIONS, ZODIAC_SIGNS } from "../../utils/astrology";
import { dateTimeToPos } from "../../utils/time-date-functions";
import TychosLogoIcon from "../../utils/TychosLogoIcon";

const FONT_FAMILY = "Arial, Helvetica, sans-serif";
const HEADER_FONT_FAMILY = "Cambria, Georgia, serif";

const ASPECT_LABELS = {
  conjunction: "Conjunction",
  sextile: "Sextile",
  square: "Square",
  trine: "Trine",
  opposition: "Opposition",
};

function pauseSimulation() {
  const store = useStore.getState();
  if (typeof store.setRun === "function") {
    store.setRun(false);
  } else {
    useStore.setState({ run: false });
  }
}

function getCurrentUtcDateAndTime() {
  const now = new Date();
  const utcDate = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  const utcTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(
    now.getUTCMinutes()
  ).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")}`;
  return { utcDate, utcTime };
}

function formatDegreeMinutes(placement) {
  if (!placement) return "";
  return `${placement.degreeInSign}°${String(placement.minutesInSign).padStart(
    2,
    "0"
  )}'`;
}

/**
 * Floating collapsible HUD panel showing the active Sun/Moon/Rising placements,
 * planetary zodiac positions, major aspects, and star-sign quote.
 */
const NatalChartPanel = () => {
  const welcomeOpen = useAstroStore((s) => s.welcomeOpen);
  const showNatalPanel = useAstroStore((s) => s.showNatalPanel);
  const activeProfileId = useAstroStore((s) => s.activeProfileId);
  const natalPos = useAstroStore((s) => s.natalPos);
  const birthData = useAstroStore((s) => s.birthData);
  const chartSnapshot = useAstroStore((s) => s.chartSnapshot);
  const activeQuote = useAstroStore((s) => s.activeQuote);
  const visibleAspectTypes = useAstroStore((s) => s.visibleAspectTypes);
  const highlightedAspectKey = useAstroStore((s) => s.highlightedAspectKey);
  const setWelcomeOpen = useAstroStore((s) => s.setWelcomeOpen);
  const refreshQuote = useAstroStore((s) => s.refreshQuote);
  const toggleAspectType = useAstroStore((s) => s.toggleAspectType);
  const setHighlightedAspectKey = useAstroStore(
    (s) => s.setHighlightedAspectKey
  );

  const posRef = useStore((s) => s.posRef);
  const runIntro = useStore((s) => s.runIntro);
  const setShowHelp = useStore((s) => s.setShowHelp);
  const cameraTarget = useStore((s) => s.cameraTarget);
  const setCameraTarget = useStore((s) => s.setCameraTarget);
  const showAspects = useStore((s) => s.showAspects ?? true);
  const setShowAspects = useStore((s) => s.setShowAspects);
  const showAspectLabels = useStore((s) => s.showAspectLabels ?? true);
  const setShowAspectLabels = useStore((s) => s.setShowAspectLabels);
  const updateAC = useStore((s) => s.updateAC);
  // Subscribe to updAC & run so mode indicator updates immediately on jumps/playback
  useStore((s) => s.updAC);
  useStore((s) => s.run);

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("planets");
  const [pinnedAspectKey, setPinnedAspectKey] = useState(null);

  if (welcomeOpen || runIntro || !showNatalPanel) return null;

  const fallbackSunSign = birthData?.sunSignId
    ? ZODIAC_SIGNS.find((z) => z.id === birthData.sunSignId) || null
    : null;

  const sunSign = chartSnapshot?.sunPlacement?.sign || fallbackSunSign;
  const moonSign = chartSnapshot?.moonPlacement?.sign || null;
  const ascendant = chartSnapshot?.ascendant || null;

  const currentPos = posRef?.current;
  const isNatalMoment =
    typeof natalPos === "number" &&
    typeof currentPos === "number" &&
    Math.abs(currentPos - natalPos) < 1e-6;

  const customProfileName =
    birthData?.name &&
    birthData.name !== "Stargazer" &&
    birthData.name !== "Tychosium Astro"
      ? birthData.name
      : activeProfileId
      ? null
      : null;

  const handleJumpToNatal = () => {
    if (typeof natalPos !== "number") return;
    useStore.getState().posRef.current = natalPos;
    pauseSimulation();
    updateAC();
  };

  const handleJumpToLiveNow = () => {
    const { utcDate, utcTime } = getCurrentUtcDateAndTime();
    useStore.getState().posRef.current = dateTimeToPos(utcDate, utcTime);
    updateAC();
  };

  if (collapsed) {
    return createPortal(
      <button
        type="button"
        className="astro-natal-panel"
        onClick={() => setCollapsed(false)}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "12px",
          left: "12px",
          zIndex: 2147483640,
          display: "flex",
          alignItems: "center",
          gap: "7px",
          padding: "5px 10px",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#374151",
          color: "#ffffff",
          fontFamily: FONT_FAMILY,
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.45)",
        }}
        title="Expand The Tychosium Astro menu"
      >
        <TychosLogoIcon size={16} />
        <span style={{ fontFamily: HEADER_FONT_FAMILY, fontWeight: "bold" }}>
          The Tychosium Astro
        </span>
        {sunSign && (
          <span style={{ color: "#9ca3af", fontWeight: 500 }}>
            · {sunSign.symbol} {sunSign.name}
          </span>
        )}
      </button>,
      document.body
    );
  }

  const placements = chartSnapshot?.placements || [];
  const aspects = chartSnapshot?.aspects || [];

  return createPortal(
    <div
      className="astro-natal-panel"
      onWheel={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: "6px",
        left: "6px",
        zIndex: 2147483640,
        width: "300px",
        maxWidth: "calc(100vw - 16px)",
        maxHeight: "calc(100vh - 16px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: "6px",
        border: "1px solid #1f2937",
        backgroundColor: "rgba(17, 24, 39, 0.88)",
        color: "#ffffff",
        fontFamily: FONT_FAMILY,
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.5)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 10px 9px",
          borderBottom: "1px solid #1f2937",
          backgroundColor: "#181c20",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "6px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "15px",
                fontWeight: "bold",
                fontFamily: HEADER_FONT_FAMILY,
                color: "#ffffff",
              }}
            >
              <TychosLogoIcon size={20} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                The Tychosium Astro
              </span>
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                title="Help & Guide"
                aria-label="Help"
                style={{
                  backgroundColor: "#374151",
                  border: "none",
                  borderRadius: "4px",
                  width: "22px",
                  height: "22px",
                  padding: 0,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  flexShrink: 0,
                }}
              >
                <FaQuestionCircle />
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "4px",
                fontSize: "10px",
              }}
            >
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontWeight: 600,
                  backgroundColor: isNatalMoment ? "#2563eb" : "#374151",
                  color: "#ffffff",
                }}
              >
                {isNatalMoment ? "Natal Chart" : "Live / Transit Sky"}
              </span>
              {customProfileName && (
                <span style={{ color: "#ffffff", fontWeight: 600 }}>
                  {customProfileName}
                </span>
              )}
              {birthData?.birthDate && (
                <span style={{ color: "#9ca3af", fontFamily: "monospace" }}>
                  Born {birthData.birthDate}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Minimize Astro menu"
            style={{
              backgroundColor: "#374151",
              border: "none",
              color: "#ffffff",
              borderRadius: "4px",
              width: "24px",
              height: "24px",
              cursor: "pointer",
              fontSize: "13px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            −
          </button>
        </div>

        {/* Sun / Moon / Rising Badges */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginTop: "7px",
          }}
        >
          {sunSign && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: "#111827",
                border: "1px solid #374151",
                color: "#ffffff",
              }}
            >
              ☉ Sun in {sunSign.symbol} {sunSign.name}
            </span>
          )}
          {moonSign && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: "#111827",
                border: "1px solid #374151",
                color: "#d1d5db",
              }}
            >
              ☽ Moon in {moonSign.symbol} {moonSign.name}
            </span>
          )}
          {ascendant?.sign && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: "#111827",
                border: "1px solid #374151",
                color: "#d1d5db",
              }}
            >
              ASC {ascendant.sign.symbol} {ascendant.sign.name}
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "5px",
          padding: "7px 10px",
          borderBottom: "1px solid #1f2937",
          backgroundColor: "rgba(17, 24, 39, 0.7)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={handleJumpToNatal}
          disabled={typeof natalPos !== "number"}
          style={{
            padding: "5px 6px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: isNatalMoment ? "#2563eb" : "#374151",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            cursor: typeof natalPos === "number" ? "pointer" : "not-allowed",
          }}
        >
          My Birth Chart
        </button>
        <button
          type="button"
          onClick={handleJumpToLiveNow}
          style={{
            padding: "5px 6px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#374151",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Live Now
        </button>
        <button
          type="button"
          onClick={() => setWelcomeOpen(true)}
          style={{
            padding: "5px 6px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#374151",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Switch / Edit
        </button>
      </div>

      {/* 3D Aspect Lines Legend & Quick Toggle */}
      <div
        style={{
          padding: "6px 10px",
          borderBottom: "1px solid #1f2937",
          backgroundColor: "rgba(24, 28, 32, 0.72)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "6px",
            marginBottom: showAspects ? "5px" : 0,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "#d1d5db",
              fontWeight: 600,
            }}
            title="Colored 3D lines connect planets forming major astrological angles as viewed from Earth"
          >
            3D Lines: Planetary Aspects
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            {showAspects && (
              <button
                type="button"
                onClick={() => setShowAspectLabels(!showAspectLabels)}
                style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: showAspectLabels ? "#2563eb" : "#374151",
                  color: showAspectLabels ? "#ffffff" : "#9ca3af",
                  fontSize: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Labels {showAspectLabels ? "On" : "Off"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAspects(!showAspects)}
              style={{
                padding: "2px 6px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: showAspects ? "#2563eb" : "#374151",
                color: showAspects ? "#ffffff" : "#9ca3af",
                fontSize: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Lines {showAspects ? "On" : "Off"}
            </button>
          </div>
        </div>

        {showAspects && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {ASPECT_DEFINITIONS.map((def) => {
              const enabled = visibleAspectTypes?.[def.type] !== false;
              return (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => toggleAspectType(def.type)}
                  title={`${def.name} (${def.angle}° ± ${def.orb}°) — click to ${
                    enabled ? "hide" : "show"
                  } in 3D`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: `1px solid ${enabled ? `${def.color}88` : "#374151"}`,
                    backgroundColor: enabled ? `${def.color}20` : "#1f2937",
                    color: enabled ? def.color : "#9ca3af",
                    fontSize: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: enabled ? 1 : 0.65,
                  }}
                >
                  <span>{def.symbol}</span>
                  <span>{def.angle}°</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5px",
          padding: "7px 10px 4px",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("planets")}
          style={{
            padding: "5px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            backgroundColor: activeTab === "planets" ? "#2563eb" : "#374151",
            color: activeTab === "planets" ? "#ffffff" : "#d1d5db",
          }}
        >
          Planets ({placements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("aspects")}
          style={{
            padding: "5px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            backgroundColor: activeTab === "aspects" ? "#2563eb" : "#374151",
            color: activeTab === "aspects" ? "#ffffff" : "#d1d5db",
          }}
        >
          Aspects ({aspects.length})
        </button>
      </div>

      {/* Scrollable Body */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "4px 10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {activeTab === "planets" ? (
          placements.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#9ca3af", padding: "8px 2px" }}>
              Calculating planetary placements from 3D scene...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {placements.map((p) => {
                const isTargeted = cameraTarget === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setCameraTarget(p.name)}
                    title={`Focus 3D camera on ${p.name}`}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                      padding: "5px 8px",
                      borderRadius: "4px",
                      border: isTargeted
                        ? "1px solid #60a5fa"
                        : "1px solid #1f2937",
                      backgroundColor: isTargeted
                        ? "rgba(37, 99, 235, 0.28)"
                        : "#1f2937",
                      color: "#ffffff",
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ color: p.color, fontSize: "14px" }}>
                        {p.symbol}
                      </span>
                      <span>{p.name}</span>
                    </span>

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        color: "#d1d5db",
                      }}
                    >
                      <span>
                        {p.sign.symbol} {p.sign.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontVariantNumeric: "tabular-nums",
                          color: "#ffffff",
                          fontWeight: 600,
                        }}
                      >
                        {formatDegreeMinutes(p)}
                      </span>
                      {p.house != null && (
                        <span
                          style={{
                            padding: "1px 4px",
                            borderRadius: "3px",
                            backgroundColor: "#374151",
                            color: "#e5e7eb",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          H{p.house}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : aspects.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#9ca3af", padding: "8px 2px" }}>
            No major Ptolemaic aspects within orb at this moment.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                fontSize: "10px",
                color: "#9ca3af",
                lineHeight: 1.35,
                padding: "2px 2px 4px",
              }}
            >
              Hover or click an aspect to highlight its 3D line &amp; Earth-centered angle rays:
            </div>
            {aspects.map((a, idx) => {
              const aspectKey = `${a.bodyA}-${a.type}-${a.bodyB}`;
              const isHighlighted = highlightedAspectKey === aspectKey;
              const isPinned = pinnedAspectKey === aspectKey;
              const isFilteredOut = visibleAspectTypes?.[a.type] === false;

              return (
                <button
                  key={`${aspectKey}-${idx}`}
                  type="button"
                  onMouseEnter={() => {
                    if (!pinnedAspectKey) setHighlightedAspectKey(aspectKey);
                  }}
                  onMouseLeave={() => {
                    if (!pinnedAspectKey) setHighlightedAspectKey(null);
                  }}
                  onClick={() => {
                    if (isPinned) {
                      setPinnedAspectKey(null);
                      setHighlightedAspectKey(null);
                    } else {
                      setPinnedAspectKey(aspectKey);
                      setHighlightedAspectKey(aspectKey);
                    }
                  }}
                  title={`${a.bodyA} ${ASPECT_LABELS[a.type] || a.type} ${
                    a.bodyB
                  } (${a.separation}° from Earth) — click to pin highlight in 3D`}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "6px",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    border: isHighlighted
                      ? `1px solid ${a.color}`
                      : "1px solid #1f2937",
                    backgroundColor: isHighlighted ? `${a.color}22` : "#1f2937",
                    color: "#ffffff",
                    fontSize: "12px",
                    cursor: "pointer",
                    opacity: isFilteredOut ? 0.45 : 1,
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 700, letterSpacing: "0.04em" }}>
                      {a.symbolA}{" "}
                      <span style={{ color: a.color }}>{a.symbol}</span>{" "}
                      {a.symbolB}
                    </span>
                    <span style={{ fontSize: "11px", color: "#d1d5db" }}>
                      {a.bodyA}–{a.bodyB}
                    </span>
                  </span>

                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "capitalize",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        backgroundColor: `${a.color}22`,
                        border: `1px solid ${a.color}66`,
                        color: a.color,
                      }}
                    >
                      {a.type}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#9ca3af",
                        fontFamily: "monospace",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {a.orb.toFixed(1)}°
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Star Sign Quote Footer */}
      {activeQuote?.text && (
        <div
          style={{
            padding: "8px 10px 10px",
            borderTop: "1px solid #1f2937",
            backgroundColor: "#181c20",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#9ca3af",
              }}
            >
              Star Sign Wisdom
            </span>
            <button
              type="button"
              onClick={() => refreshQuote(birthData?.sunSignId)}
              style={{
                backgroundColor: "#374151",
                border: "none",
                color: "#ffffff",
                borderRadius: "4px",
                padding: "2px 7px",
                fontSize: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              New quote
            </button>
          </div>
          <div
            style={{
              fontSize: "11px",
              lineHeight: 1.45,
              color: "#e5e7eb",
              fontStyle: "italic",
            }}
          >
            {activeQuote.text}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default NatalChartPanel;
