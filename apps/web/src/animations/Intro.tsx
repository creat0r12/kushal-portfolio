import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import "./Intro.css";

const introConfig = {
  displayTime: 3400,
  exitDuration: 0.15,
};

function Intro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, introConfig.displayTime);

    return () => window.clearTimeout(timer);
  }, []);

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
          {/* ================================================
              EVERYTHING VISIBLE DURING THE INTRO
              Stays visible until the white takes over.
          ================================================= */}
          <motion.div
            className="intro__front"
            initial={{
              opacity: 1,
            }}
            animate={{
              opacity: [1, 1, 1, 0],
            }}
            transition={{
              delay: 2.78,
              duration: 0.38,
              times: [0, 0.3, 0.55, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
          >
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
              initial={{
                opacity: 0,
                y: 8,
                filter: "blur(8px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 1.2,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              CREATIVE DEVELOPER
              <span>·</span>
              COMPUTER SCIENCE STUDENT
            </motion.div>

            {/* Main name */}
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

              {/* Sharp name */}
              <motion.div
                className="intro__name intro__name--sharp"
                initial={{
                  opacity: 0,
                  y: 4,
                  filter: "blur(8px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
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
          </motion.div>

          {/* ================================================
              LIGHT FROM THE NAME
          ================================================= */}
          <motion.div
            className="intro__light"
            initial={{
              opacity: 0,
              scale: 0.03,
            }}
            animate={{
              opacity: [0, 0.2, 0.55, 1],
              scale: [0.03, 0.35, 1.2, 5.5],
            }}
            transition={{
              delay: 2.25,
              duration: 0.95,
              times: [0, 0.18, 0.55, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          {/* ================================================
              FULL WHITE EXPOSURE

              Peaks while the name is still mixing into it,
              then immediately becomes transparent.
          ================================================= */}
          <motion.div
            className="intro__white"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: [
                0,
                0.03,
                0.12,
                0.35,
                0.68,
                1,
                0.96,
                0.72,
                0.42,
                0,
              ],
            }}
            transition={{
              delay: 2.38,
              duration: 0.95,
              times: [
                0,
                0.08,
                0.18,
                0.32,
                0.48,
                0.62,
                0.72,
                0.82,
                0.92,
                1,
              ],
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Intro;