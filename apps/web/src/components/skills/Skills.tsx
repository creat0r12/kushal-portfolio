import { useRef, useState } from "react";
import { skills } from "../../data/skills";
import "./Skills.css";

function Skills() {
  const [activeIndex, setActiveIndex] = useState(0);

  const animationFrame = useRef<number | null>(null);

  const handlePointerMove = (
    event: React.PointerEvent<HTMLElement>
  ) => {
    const card = event.currentTarget;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
    }

    const clientX = event.clientX;
    const clientY = event.clientY;

    animationFrame.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY =
        ((x - centerX) / centerX) * 3;

      const rotateX =
        ((centerY - y) / centerY) * 3;

      card.style.setProperty(
        "--rotate-x",
        `${rotateX}deg`
      );

      card.style.setProperty(
        "--rotate-y",
        `${rotateY}deg`
      );

      card.style.setProperty(
        "--mouse-x",
        `${x}px`
      );

      card.style.setProperty(
        "--mouse-y",
        `${y}px`
      );
    });
  };

  const handlePointerLeave = (
    event: React.PointerEvent<HTMLElement>
  ) => {
    const card = event.currentTarget;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");

    card.style.setProperty("--mouse-x", "50%");
    card.style.setProperty("--mouse-y", "50%");
  };

  const handleCardClick = () => {
    setActiveIndex(
      (current) => (current + 1) % skills.length
    );
  };

  return (
    <section className="skills" id="skills">
      <div className="container">

        {/* HEADER */}
        <div className="skills__header">

          <div className="skills__eyebrow">
            <span className="skills__eyebrow-line" />
            <span>SKILLS</span>
          </div>

          <div className="skills__heading-wrap">
            <span className="skills__number">
              03 / 04
            </span>

            <h2 className="skills__title">
              Tools I use to
              <br />
              <span>build things.</span>
            </h2>
          </div>

          <p className="skills__intro">
            Technologies I use to turn ideas into
            products, systems, and interactive
            experiences.
          </p>
        </div>

        {/* SKILL DECK */}
        <div className="skills__deck-wrap">

          <div className="skills__deck">

            {skills.map((skill, index) => {
              const position =
                (index -
                  activeIndex +
                  skills.length) %
                skills.length;

              return (
                <article
                  key={skill.name}
                  className={`skill ${
                    position === 0
                      ? "skill--active"
                      : ""
                  }`}
                  style={
                    {
                      "--skill-position": position,
                    } as React.CSSProperties
                  }
                  onPointerMove={handlePointerMove}
                  onPointerLeave={handlePointerLeave}
                  onClick={handleCardClick}
                >

                  {/* CURSOR LIGHT */}
                  <span className="skill__cursor-light" />

                  {/* GLASS SHINE */}
                  <span className="skill__shine" />

                  {/* TOP */}
                  <div className="skill__top">

                    <span className="skill__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="skill__category">
                      {skill.category}
                    </span>

                  </div>

                  {/* CONTENT */}
                  <div className="skill__content">

                    <h3 className="skill__name">
                      {skill.name}
                    </h3>

                    <span className="skill__build">
                      BUILD / CREATE / SHIP
                    </span>

                  </div>

                  {/* BOTTOM */}
                  <div className="skill__bottom">

                    <span className="skill__line" />

                    <span className="skill__arrow">
                      ↗
                    </span>

                  </div>

                </article>
              );
            })}

          </div>

          {/* CONTROLS */}
          <div className="skills__controls">

            <span className="skills__hint">
              TAP TO EXPLORE
            </span>

            <div className="skills__progress">
              {skills.map((_, index) => (
                <span
                  key={index}
                  className={
                    index === activeIndex
                      ? "is-active"
                      : ""
                  }
                />
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

export default Skills;