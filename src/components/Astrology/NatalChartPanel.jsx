import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaQuestionCircle } from "react-icons/fa";
import { useStore } from "../../store";
import { useAstroStore } from "../../astroStore";
import { ASPECT_DEFINITIONS, ZODIAC_SIGNS } from "../../utils/astrology";
import { dateTimeToPos } from "../../utils/time-date-functions";

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";

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
          padding: "8px 13px",
          borderRadius: "999px",
          border: "1px solid rgba(212, 175, 55, 0.55)",
          background:
            "linear-gradient(135deg, rgba(11, 19, 43, 0.94), rgba(17, 24, 39, 0.94))",
          color: "#FDE68A",
          fontFamily: FONT_FAMILY,
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
        }}
        title="Expand Birth Chart HUD"
      >
        <span>✦ Birth Chart</span>
        {sunSign && (
          <span style={{ color: "#F8FAFC", fontWeight: 600 }}>
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
        top: "12px",
        left: "12px",
        zIndex: 2147483640,
        width: "326px",
        maxWidth: "calc(100vw - 24px)",
        maxHeight: "calc(100vh - 24px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        border: "1px solid rgba(212, 175, 55, 0.36)",
        background:
          "linear-gradient(170deg, rgba(11, 19, 43, 0.92) 0%, rgba(17, 24, 39, 0.94) 100%)",
        color: "#F8FAFC",
        fontFamily: FONT_FAMILY,
        boxShadow:
          "0 18px 42px rgba(0, 0, 0, 0.62), 0 0 24px rgba(212, 175, 55, 0.08)",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "11px 12px 10px",
          borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
          background: "rgba(11, 19, 43, 0.55)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#F8FAFC",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                ✦ The Tychosium Astro
              </span>
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                title="Help & Guide"
                aria-label="Help"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "0 2px",
                  color: "#94A3B8",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "13px",
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
                marginTop: "2px",
                fontSize: "10px",
              }}
            >
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "999px",
                  fontWeight: 700,
                  background: isNatalMoment
                    ? "rgba(212, 175, 55, 0.2)"
                    : "rgba(56, 189, 248, 0.16)",
                  border: isNatalMoment
                    ? "1px solid rgba(212, 175, 55, 0.45)"
                    : "1px solid rgba(56, 189, 248, 0.4)",
                  color: isNatalMoment ? "#FDE68A" : "#7DD3FC",
                }}
              >
                {isNatalMoment ? "Natal Chart" : "Live / Transit Sky"}
              </span>
              {customProfileName && (
                <span style={{ color: "#FDE68A", fontWeight: 600 }}>
                  {customProfileName}
                </span>
              )}
              {birthData?.birthDate && (
                <span style={{ color: "#94A3B8" }}>
                  Born {birthData.birthDate}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Collapse Birth Chart panel"
            style={{
              background: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              color: "#CBD5E1",
              borderRadius: "6px",
              width: "24px",
              height: "24px",
              cursor: "pointer",
              fontSize: "12px",
              flexShrink: 0,
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
            gap: "5px",
            marginTop: "8px",
          }}
        >
          {sunSign && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 7px",
                borderRadius: "6px",
                background: "rgba(251, 191, 36, 0.14)",
                border: "1px solid rgba(251, 191, 36, 0.35)",
                color: "#FDE68A",
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
                padding: "3px 7px",
                borderRadius: "6px",
                background: "rgba(226, 232, 240, 0.1)",
                border: "1px solid rgba(226, 232, 240, 0.25)",
                color: "#E2E8F0",
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
                padding: "3px 7px",
                borderRadius: "6px",
                background: "rgba(167, 139, 250, 0.14)",
                border: "1px solid rgba(167, 139, 250, 0.35)",
                color: "#DDD6FE",
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
          gap: "6px",
          padding: "8px 12px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
          background: "rgba(15, 23, 42, 0.45)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={handleJumpToNatal}
          disabled={typeof natalPos !== "number"}
          style={{
            padding: "5px 6px",
            borderRadius: "6px",
            border: "1px solid rgba(212, 175, 55, 0.42)",
            background: "rgba(212, 175, 55, 0.14)",
            color: "#FDE68A",
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
            borderRadius: "6px",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            background: "rgba(56, 189, 248, 0.12)",
            color: "#BAE6FD",
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
            borderRadius: "6px",
            border: "1px solid rgba(148, 163, 184, 0.28)",
            background: "rgba(30, 41, 59, 0.65)",
            color: "#E2E8F0",
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
          padding: "6px 12px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
          background: "rgba(11, 19, 43, 0.45)",
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
              color: "#CBD5E1",
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
                  borderRadius: "5px",
                  border: "1px solid rgba(148, 163, 184, 0.28)",
                  background: showAspectLabels
                    ? "rgba(212, 175, 55, 0.16)"
                    : "rgba(15, 23, 42, 0.65)",
                  color: showAspectLabels ? "#FDE68A" : "#94A3B8",
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
                borderRadius: "5px",
                border: "1px solid rgba(148, 163, 184, 0.28)",
                background: showAspects
                  ? "rgba(52, 211, 153, 0.16)"
                  : "rgba(15, 23, 42, 0.65)",
                color: showAspects ? "#6EE7B7" : "#94A3B8",
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
                    borderRadius: "999px",
                    border: `1px solid ${
                      enabled ? `${def.color}88` : "rgba(148, 163, 184, 0.2)"
                    }`,
                    background: enabled
                      ? `${def.color}20`
                      : "rgba(15, 23, 42, 0.45)",
                    color: enabled ? def.color : "#64748B",
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
          gap: "6px",
          padding: "8px 12px 4px",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("planets")}
          style={{
            padding: "6px 8px",
            borderRadius: "7px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            border:
              activeTab === "planets"
                ? "1px solid #D4AF37"
                : "1px solid rgba(148, 163, 184, 0.18)",
            background:
              activeTab === "planets"
                ? "rgba(212, 175, 55, 0.18)"
                : "rgba(15, 23, 42, 0.55)",
            color: activeTab === "planets" ? "#FDE68A" : "#94A3B8",
          }}
        >
          Planets ({placements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("aspects")}
          style={{
            padding: "6px 8px",
            borderRadius: "7px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            border:
              activeTab === "aspects"
                ? "1px solid #D4AF37"
                : "1px solid rgba(148, 163, 184, 0.18)",
            background:
              activeTab === "aspects"
                ? "rgba(212, 175, 55, 0.18)"
                : "rgba(15, 23, 42, 0.55)",
            color: activeTab === "aspects" ? "#FDE68A" : "#94A3B8",
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
          padding: "6px 12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {activeTab === "planets" ? (
          placements.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#94A3B8", padding: "10px 2px" }}>
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
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "7px",
                      border: isTargeted
                        ? "1px solid rgba(212, 175, 55, 0.55)"
                        : "1px solid rgba(148, 163, 184, 0.14)",
                      background: isTargeted
                        ? "rgba(212, 175, 55, 0.13)"
                        : "rgba(15, 23, 42, 0.55)",
                      color: "#F8FAFC",
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
                        color: "#CBD5E1",
                      }}
                    >
                      <span>
                        {p.sign.symbol} {p.sign.name}
                      </span>
                      <span
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          color: "#FDE68A",
                          fontWeight: 600,
                        }}
                      >
                        {formatDegreeMinutes(p)}
                      </span>
                      {p.house != null && (
                        <span
                          style={{
                            padding: "1px 5px",
                            borderRadius: "4px",
                            background: "rgba(167, 139, 250, 0.18)",
                            border: "1px solid rgba(167, 139, 250, 0.32)",
                            color: "#DDD6FE",
                            fontSize: "10px",
                            fontWeight: 700,
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
          <div style={{ fontSize: "12px", color: "#94A3B8", padding: "10px 2px" }}>
            No major Ptolemaic aspects within orb at this moment.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                fontSize: "10px",
                color: "#94A3B8",
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
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "7px",
                    border: isHighlighted
                      ? `1px solid ${a.color}`
                      : "1px solid rgba(148, 163, 184, 0.14)",
                    background: isHighlighted
                      ? `${a.color}22`
                      : "rgba(15, 23, 42, 0.55)",
                    color: "#F8FAFC",
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
                    <span style={{ fontSize: "11px", color: "#CBD5E1" }}>
                      {a.bodyA}–{a.bodyB}
                    </span>
                  </span>

                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "capitalize",
                        padding: "1px 6px",
                        borderRadius: "999px",
                        background: `${a.color}22`,
                        border: `1px solid ${a.color}66`,
                        color: a.color,
                      }}
                    >
                      {a.type}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#94A3B8",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      orb {a.orb.toFixed(1)}°
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
            padding: "9px 12px 11px",
            borderTop: "1px solid rgba(212, 175, 55, 0.22)",
            background: "rgba(11, 19, 43, 0.65)",
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
                letterSpacing: "0.06em",
                color: "#D4AF37",
              }}
            >
              ✦ Star Sign Wisdom
            </span>
            <button
              type="button"
              onClick={() => refreshQuote(birthData?.sunSignId)}
              style={{
                background: "transparent",
                border: "1px solid rgba(212, 175, 55, 0.35)",
                color: "#FDE68A",
                borderRadius: "5px",
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
              color: "#E2E8F0",
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
