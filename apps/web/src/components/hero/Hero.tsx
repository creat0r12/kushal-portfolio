import { motion } from "motion/react";
import "./Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">

        <motion.div
          className="hero__top"
          initial={{
            opacity: 0,
            y: 60,
            scaleY: 0.7,
          }}
          animate={{
            opacity: [0, 1, 1],
            y: [60, -6, 0],
            scaleY: [0.7, 1.05, 1],
          }}
          transition={{
            duration: 0.9,
            times: [0, 0.7, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <p className="hero__eyebrow">
            CREATIVE DEVELOPER
          </p>

          <p className="hero__availability">
            <span className="hero__status"></span>
            Available for interesting projects
          </p>
        </motion.div>

        <motion.div
          className="hero__main"
          initial={{
            opacity: 0,
            y: 120,
            scaleY: 0.65,
            transformOrigin: "center bottom",
          }}
          animate={{
            opacity: [0, 1, 1, 1],
            y: [120, -10, 4, 0],
            scaleY: [0.65, 1.08, 0.97, 1],
          }}
          transition={{
            duration: 1.15,
            times: [0, 0.55, 0.8, 1],
            ease: [0.22, 1, 0.36, 1],
            delay: 0.08,
          }}
        >
          <h1 className="hero__title">
            I build
            <br />
            <span>digital things.</span>
          </h1>

          <div className="hero__side">
            <p className="hero__description">
              I'm Kushal — a computer science student and developer focused
              on building useful products, creative interfaces, and
              experimental digital experiences.
            </p>

            <div className="hero__actions">
              <a
                href="#work"
                className="hero__button hero__button--primary"
              >
                Explore my work
                <span className="hero__arrow">↘</span>
              </a>

              <a
                href="#contact"
                className="hero__button hero__button--secondary"
              >
                Let's talk
              </a>
            </div>

            <div className="hero__socials">
              <a href="#" aria-label="GitHub">
                GH
              </a>

              <a href="#" aria-label="LinkedIn">
                IN
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero__bottom"
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            delay: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span>SCROLL TO EXPLORE</span>

          <div className="hero__line"></div>

          <span>2026</span>
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;