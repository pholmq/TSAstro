import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import SegmentedBirthDateInput from "./SegmentedBirthDateInput";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;
  nativeSetter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function Harness({ initialValue = "", onLatest }) {
  const [val, setVal] = useState(initialValue);
  return (
    <SegmentedBirthDateInput
      idPrefix="test-date"
      autoFocus
      value={val}
      onChange={(next) => {
        setVal(next);
        onLatest(next);
      }}
    />
  );
}

describe("SegmentedBirthDateInput", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("jumps focus from 4-digit year to month, and from month to day", () => {
    let latest = "";
    act(() => {
      root.render(<Harness onLatest={(v) => (latest = v)} />);
    });

    const yearInput = document.getElementById("test-date-year");
    const monthInput = document.getElementById("test-date-month");
    const dayInput = document.getElementById("test-date-day");

    expect(document.activeElement).toBe(yearInput);

    // Partial year keeps focus in year
    act(() => {
      setInputValue(yearInput, "198");
    });
    expect(document.activeElement).toBe(yearInput);

    // Completing 4-digit year advances focus to month
    act(() => {
      setInputValue(yearInput, "1985");
    });
    expect(document.activeElement).toBe(monthInput);

    // Typing '0' stays in month
    act(() => {
      setInputValue(monthInput, "0");
    });
    expect(document.activeElement).toBe(monthInput);

    // Completing 2-digit month advances focus to day
    act(() => {
      setInputValue(monthInput, "07");
    });
    expect(document.activeElement).toBe(dayInput);

    // Entering day emits full YYYY-MM-DD
    act(() => {
      setInputValue(dayInput, "24");
    });
    expect(latest).toBe("1985-07-24");
  });

  test("auto-pads single digit month >= 2 and jumps to day", () => {
    let latest = "";
    act(() => {
      root.render(<Harness onLatest={(v) => (latest = v)} />);
    });

    const yearInput = document.getElementById("test-date-year");
    const monthInput = document.getElementById("test-date-month");
    const dayInput = document.getElementById("test-date-day");

    act(() => {
      setInputValue(yearInput, "1990");
    });
    expect(document.activeElement).toBe(monthInput);

    act(() => {
      setInputValue(monthInput, "5");
    });
    expect(monthInput.value).toBe("05");
    expect(document.activeElement).toBe(dayInput);

    act(() => {
      setInputValue(dayInput, "9");
    });
    expect(dayInput.value).toBe("09");
    expect(latest).toBe("1990-05-09");
  });

  test("moves focus backward on Backspace when month or day is empty", () => {
    act(() => {
      root.render(<Harness onLatest={() => {}} />);
    });

    const yearInput = document.getElementById("test-date-year");
    const monthInput = document.getElementById("test-date-month");
    const dayInput = document.getElementById("test-date-day");

    act(() => {
      dayInput.focus();
      dayInput.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Backspace", bubbles: true })
      );
    });
    expect(document.activeElement).toBe(monthInput);

    act(() => {
      monthInput.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Backspace", bubbles: true })
      );
    });
    expect(document.activeElement).toBe(yearInput);
  });
});
