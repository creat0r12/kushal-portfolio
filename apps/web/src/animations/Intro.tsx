import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import "./Intro.css";

const introConfig = {
  displayTime: 3400,
  exitDuration: 0.15,
};

function Intro() {
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(true);

  // Start the intro only after the user's first interaction.
  useEffect(() => {
    if (!started) return;

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, introConfig.displayTime);

    return () => window.clearTimeout(timer);
  }, [started]);

  // Exit fullscreen after the intro is finished.
  useEffect(() => {
    if (visible || !started) return;

    const exitTimer = window.setTimeout(async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore fullscreen exit errors.
      }
    }, 180);

    return () => window.clearTimeout(exitTimer);
  }, [visible, started]);

  const enterExperience = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen can be denied by the browser.
      // The intro will still continue normally.
    }

    setStarted(true);
  };

  // -----------------------------------------
  // Waiting screen
  // -----------------------------------------
  if (!started) {
    return (
      <div
        className="intro intro--waiting"
        onPointerDown={enterExperience}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            enterExperience();
          }
        }}
        aria-label="Enter portfolio"
      >
        <div className="intro__waiting-content">
          <span className="intro__waiting-dot" />
          <span>CLICK TO ENTER</span>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="intro"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: introConfig.exitDuration,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
        >
          {/* =================================================
              YOUR INTRO
          ================================================= */}

          {/* Atmosphere */}
          <motion.div
            className="intro__atmosphere"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          />

          {/* Information */}
          <motion.div
            className="intro__meta"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1.2,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            CREATIVE DEVELOPER
            <span style={{ margin: "0 8px", opacity: 0.5 }}>
              ·
            </span>
            COMPUTER SCIENCE STUDENT
          </motion.div>

          {/* Main identity */}
          <motion.div
            className="intro__name-wrap"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1.05 }}
            transition={{
              duration: 4,
              ease: "linear",
            }}
          >
            {/* Soft glow */}
            <motion.div
              className="intro__name intro__name--glow"
              style={{
                position: "absolute",
                inset: 0,
                color: "#ffffff",
                filter: "blur(24px)",
              }}
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: [0, 0.85, 0.15],
                scale: [0.9, 1.1, 1.05],
              }}
              transition={{
                duration: 2.8,
                ease: [0.25, 1, 0.5, 1],
                times: [0, 0.4, 1],
                delay: 0.3,
              }}
            >
              KUSHAL PATIL
            </motion.div>

            {/* Sharp text */}
            <motion.div
              className="intro__name intro__name--sharp"
              style={{
                color: "#ffffff",
                textShadow:
                  "0 4px 12px rgba(255,255,255,0.1)",
              }}
              initial={{
                opacity: 0,
                y: 4,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.6,
              }}
            >
              KUSHAL PATIL
            </motion.div>
          </motion.div>

          {/* =================================================
              FINAL WHITE LIGHT
              Only the final 1 second is affected.
          ================================================= */}

          <motion.div
            className="intro__final-glow"
            initial={{
              opacity: 0,
              scale: 0.03,
            }}
            animate={{
              opacity: [0, 0.2, 0.55, 1, 1, 0],
              scale: [0.03, 0.3, 0.8, 1.8, 5.5, 5.5],
            }}
            transition={{
              delay: 2.4,
              duration: 1,
              times: [0, 0.12, 0.32, 0.58, 0.78, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Intro;