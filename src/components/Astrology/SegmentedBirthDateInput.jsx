import React, { useEffect, useRef, useState } from "react";

function splitIsoDate(iso) {
  const match = String(iso || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: match[2], day: match[3] };
}

function composeIsoDate(year, month, day) {
  if (year.length !== 4 || month.length === 0 || day.length === 0) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function isBackspaceOrDeleteEvent(e) {
  const inputType = e?.nativeEvent?.inputType;
  return (
    inputType === "deleteContentBackward" || inputType === "deleteContentForward"
  );
}

const SEGMENT_INPUT_BASE_STYLE = {
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#ffffff",
  fontSize: "13px",
  fontFamily: "inherit",
  fontVariantNumeric: "tabular-nums",
  textAlign: "center",
  padding: "0 1px",
  margin: 0,
};

/**
 * Three-segment ISO birth date input (YYYY - MM - DD) that automatically
 * advances focus from 4-digit Year -> Month -> Day, with an optional native
 * calendar picker button.
 */
const SegmentedBirthDateInput = ({
  value,
  onChange,
  autoFocus = false,
  idPrefix = "birth-date",
  containerStyle = {},
}) => {
  const initial = splitIsoDate(value);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const [focusedSegment, setFocusedSegment] = useState(null);

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const pickerRef = useRef(null);
  const pointerDownRef = useRef(false);
  const lastEmittedRef = useRef(value || "");

  // Sync external value changes (e.g. loading a saved profile or resetting form)
  useEffect(() => {
    const normalized = value || "";
    if (normalized === lastEmittedRef.current) return;
    lastEmittedRef.current = normalized;
    const parts = splitIsoDate(normalized);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
  }, [value]);

  const emitChange = (nextYear, nextMonth, nextDay) => {
    const composed = composeIsoDate(nextYear, nextMonth, nextDay);
    lastEmittedRef.current = composed;
    if (typeof onChange === "function") {
      onChange(composed);
    }
  };

  const focusSegment = (ref, { select = true, caretToEnd = false } = {}) => {
    const el = ref?.current;
    if (!el) return;
    pointerDownRef.current = false;
    el.focus();
    if (select) {
      el.select();
    } else if (caretToEnd) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  };

  const handleSegmentMouseDown = () => {
    pointerDownRef.current = true;
  };

  const handleSegmentFocus = (segmentName) => (e) => {
    setFocusedSegment(segmentName);
    if (!pointerDownRef.current && e.target.value) {
      e.target.select();
    }
    pointerDownRef.current = false;
  };

  const handleSegmentBlur = (segmentName) => () => {
    setFocusedSegment((prev) => (prev === segmentName ? null : prev));
    if (segmentName === "month" && month.length === 1 && Number(month) >= 1) {
      const padded = month.padStart(2, "0");
      setMonth(padded);
      emitChange(year, padded, day);
    } else if (segmentName === "day" && day.length === 1 && Number(day) >= 1) {
      const padded = day.padStart(2, "0");
      setDay(padded);
      emitChange(year, month, padded);
    }
  };

  const handleYearChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    const deleting = isBackspaceOrDeleteEvent(e);
    setYear(digits);
    emitChange(digits, month, day);

    if (!deleting && digits.length === 4 && year.length < 4) {
      focusSegment(monthRef);
    }
  };

  const handleMonthChange = (e) => {
    let digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    const deleting = isBackspaceOrDeleteEvent(e);

    if (!deleting && digits.length === 1 && Number(digits) >= 2) {
      digits = `0${digits}`;
    }

    setMonth(digits);
    emitChange(year, digits, day);

    if (!deleting && digits.length === 2) {
      focusSegment(dayRef);
    }
  };

  const handleDayChange = (e) => {
    let digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    const deleting = isBackspaceOrDeleteEvent(e);

    if (!deleting && digits.length === 1 && Number(digits) >= 4) {
      digits = `0${digits}`;
    }

    setDay(digits);
    emitChange(year, month, digits);
  };

  const handleYearKeyDown = (e) => {
    e.stopPropagation();
    const el = e.currentTarget;
    if ((e.key === "-" || e.key === "/" || e.key === ".") && year.length > 0) {
      e.preventDefault();
      focusSegment(monthRef);
      return;
    }
    if (
      e.key === "ArrowRight" &&
      el.selectionStart === el.value.length &&
      el.selectionEnd === el.value.length
    ) {
      e.preventDefault();
      focusSegment(monthRef);
    }
  };

  const handleMonthKeyDown = (e) => {
    e.stopPropagation();
    const el = e.currentTarget;
    if ((e.key === "-" || e.key === "/" || e.key === ".") && month.length > 0) {
      e.preventDefault();
      if (month.length === 1 && Number(month) >= 1) {
        const padded = month.padStart(2, "0");
        setMonth(padded);
        emitChange(year, padded, day);
      }
      focusSegment(dayRef);
      return;
    }
    if (e.key === "Backspace" && month.length === 0) {
      e.preventDefault();
      focusSegment(yearRef, { select: false, caretToEnd: true });
      return;
    }
    if (
      e.key === "ArrowLeft" &&
      el.selectionStart === 0 &&
      el.selectionEnd === 0
    ) {
      e.preventDefault();
      focusSegment(yearRef);
      return;
    }
    if (
      e.key === "ArrowRight" &&
      el.selectionStart === el.value.length &&
      el.selectionEnd === el.value.length
    ) {
      e.preventDefault();
      focusSegment(dayRef);
    }
  };

  const handleDayKeyDown = (e) => {
    e.stopPropagation();
    const el = e.currentTarget;
    if (e.key === "Backspace" && day.length === 0) {
      e.preventDefault();
      focusSegment(monthRef, { select: false, caretToEnd: true });
      return;
    }
    if (
      e.key === "ArrowLeft" &&
      el.selectionStart === 0 &&
      el.selectionEnd === 0
    ) {
      e.preventDefault();
      focusSegment(monthRef);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData?.getData("text")?.trim() || "";
    const sepMatch = pasted.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    const compactMatch = !sepMatch && pasted.match(/^(\d{4})(\d{2})(\d{2})$/);
    const match = sepMatch || compactMatch;
    if (!match) return;

    e.preventDefault();
    const nextYear = match[1];
    const nextMonth = match[2].padStart(2, "0");
    const nextDay = match[3].padStart(2, "0");
    setYear(nextYear);
    setMonth(nextMonth);
    setDay(nextDay);
    emitChange(nextYear, nextMonth, nextDay);
    focusSegment(dayRef);
  };

  const handleCalendarPickerClick = () => {
    const picker = pickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === "function") {
      try {
        picker.showPicker();
        return;
      } catch {
        // Fall back to focus/click in environments without showPicker permission
      }
    }
    picker.focus();
    picker.click();
  };

  const handleNativePickerChange = (e) => {
    const picked = e.target.value;
    if (!picked) return;
    const parts = splitIsoDate(picked);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
    emitChange(parts.year, parts.month, parts.day);
  };

  const isFocused = focusedSegment !== null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
        padding: "7px 9px",
        borderRadius: "4px",
        border: "1px solid #4b5563",
        boxShadow: isFocused ? "0 0 0 2px #60a5fa" : "none",
        backgroundColor: "#374151",
        color: "#ffffff",
        position: "relative",
        transition: "box-shadow 0.15s ease",
        ...containerStyle,
      }}
    >
      <input
        id={`${idPrefix}-year`}
        ref={yearRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-year"
        aria-label="Birth year (4 digits)"
        placeholder="YYYY"
        maxLength={4}
        autoFocus={autoFocus}
        value={year}
        onChange={handleYearChange}
        onKeyDown={handleYearKeyDown}
        onMouseDown={handleSegmentMouseDown}
        onFocus={handleSegmentFocus("year")}
        onBlur={handleSegmentBlur("year")}
        onPaste={handlePaste}
        style={{ ...SEGMENT_INPUT_BASE_STYLE, width: "42px" }}
      />
      <span
        aria-hidden="true"
        style={{ color: "#9ca3af", userSelect: "none", fontSize: "13px" }}
      >
        -
      </span>
      <input
        id={`${idPrefix}-month`}
        ref={monthRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-month"
        aria-label="Birth month (2 digits)"
        placeholder="MM"
        maxLength={2}
        value={month}
        onChange={handleMonthChange}
        onKeyDown={handleMonthKeyDown}
        onMouseDown={handleSegmentMouseDown}
        onFocus={handleSegmentFocus("month")}
        onBlur={handleSegmentBlur("month")}
        onPaste={handlePaste}
        style={{ ...SEGMENT_INPUT_BASE_STYLE, width: "26px" }}
      />
      <span
        aria-hidden="true"
        style={{ color: "#9ca3af", userSelect: "none", fontSize: "13px" }}
      >
        -
      </span>
      <input
        id={`${idPrefix}-day`}
        ref={dayRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-day"
        aria-label="Birth day (2 digits)"
        placeholder="DD"
        maxLength={2}
        value={day}
        onChange={handleDayChange}
        onKeyDown={handleDayKeyDown}
        onMouseDown={handleSegmentMouseDown}
        onFocus={handleSegmentFocus("day")}
        onBlur={handleSegmentBlur("day")}
        onPaste={handlePaste}
        style={{ ...SEGMENT_INPUT_BASE_STYLE, width: "26px" }}
      />

      <div style={{ flex: 1 }} />

      <button
        type="button"
        tabIndex={-1}
        onClick={handleCalendarPickerClick}
        title="Pick date from calendar"
        aria-label="Pick birth date from calendar"
        style={{
          background: "transparent",
          border: "none",
          color: "#94A3B8",
          cursor: "pointer",
          padding: "0 2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={composeIsoDate(year, month, day)}
        onChange={handleNativePickerChange}
        style={{
          position: "absolute",
          right: "8px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default SegmentedBirthDateInput;
