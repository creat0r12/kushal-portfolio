import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Moon } from "lucide-react";
import "./ScreenSleep.css";

export default function ScreenSleep() {
  const [sleeping, setSleeping] = useState(false);
  const enterCount = useRef(0);

  useEffect(() => {
    if (!sleeping) return;

    const blockEvent = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only Enter is allowed to count toward waking.
      if (event.key !== "Enter" || event.repeat) {
        blockEvent(event);
        return;
      }

      blockEvent(event);
      enterCount.current += 1;

      // Exit only after four Enter presses.
      if (enterCount.current >= 4) {
        enterCount.current = 0;
        setSleeping(false);

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    const blockMouse = (event: Event) => {
      blockEvent(event);
    };

    const blockedKeys = [
      "keydown",
      "keyup",
      "keypress",
      "contextmenu",
      "click",
      "dblclick",
      "mousedown",
      "mouseup",
      "pointerdown",
      "pointerup",
      "touchstart",
      "touchend",
      "wheel",
    ] as const;

    window.addEventListener("keydown", handleKeyDown, true);

    blockedKeys
      .filter((type) => type !== "keydown")
      .forEach((type) => {
        window.addEventListener(type, blockMouse, {
          capture: true,
          passive: false,
        });
      });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);

      blockedKeys
        .filter((type) => type !== "keydown")
        .forEach((type) => {
          window.removeEventListener(type, blockMouse, true);
        });
    };
  }, [sleeping]);

  const enterSleep = async () => {
    enterCount.current = 0;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Continue with the black overlay if fullscreen is unavailable.
    }

    setSleeping(true);
  };

  return (
    <>
      {!sleeping && (
        <button
          type="button"
          className="sleep-trigger"
          onClick={enterSleep}
          aria-label="Enter sleep mode"
          title="Sleep mode"
        >
          <Moon size={17} />
          <span>Sleep</span>
        </button>
      )}

      {sleeping &&
        createPortal(
          <div
            className="sleep-screen"
            aria-label="Sleep mode"
          />,
          document.body
        )}
    </>
  );
}