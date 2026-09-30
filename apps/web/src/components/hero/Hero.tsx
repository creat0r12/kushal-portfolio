import "./Hero.css";

function Hero() {
  return (
    <section className="hero">
      {/* Atmospheric background */}
      <div className="hero__glow hero__glow--one" />
      <div className="hero__glow hero__glow--two" />
      <div className="hero__grid" />

      <div className="container hero__inner">

        {/* =====================================================
            TOP
        ===================================================== */}

        <div className="hero__top">
          <p className="hero__eyebrow">
            <span className="hero__eyebrow-line" />

            <span className="hero__small-word">COMPUTER SCIENCE</span>
            <span className="hero__separator">·</span>
            <span className="hero__small-word">BUILDER</span>
            <span className="hero__separator">·</span>
            <span className="hero__small-word">DEVELOPER</span>
          </p>

          <p className="hero__availability">
  <span className="hero__status">
    <span />
  </span>

  <span className="hero__small-word">
    Building things that matter
  </span>
</p>
        </div>


        {/* =====================================================
            MAIN
        ===================================================== */}

        <div className="hero__main">

          <div className="hero__title-wrap">
            <p className="hero__number">
              01 / 04
            </p>

            <h1 className="hero__title">
              <span className="hero__title-line">
                {"I build".split("").map((char, index) => (
                  <span
                    key={index}
                    className="hero__letter"
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </span>

              <span className="hero__title-line hero__title-line--accent">
                {"real things.".split("").map((char, index) => (
                  <span
                    key={index}
                    className="hero__letter"
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </span>
            </h1>
          </div>


          {/* =================================================
              SIDE CONTENT
          ================================================= */}

          <div className="hero__side">

            <div className="hero__description-wrap">
              <span className="hero__description-line" />

              <p className="hero__description">
                I'm Kushal — a computer science student and
                developer who turns ideas into useful software.
                From full-stack products and backend systems
                to creative interfaces and experimental
                experiences, I like building things from the
                idea all the way to something people can use.
              </p>
            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="hero__actions">

              <a
                href="#work"
                className="hero__button hero__button--primary"
              >
                <span>See what I've built</span>

                <span className="hero__arrow">
                  ↘
                </span>
              </a>

              <a
                href="#contact"
                className="hero__button hero__button--secondary"
              >
                Let's talk
              </a>

            </div>


            {/* =================================================
                SOCIALS
            ================================================= */}

            <div className="hero__socials">

              <span className="hero__social-label">
                FIND ME
              </span>

              <a
                href="#"
                aria-label="GitHub"
                className="hero__social"
              >
                GH
              </a>

              <a
                href="#"
                aria-label="LinkedIn"
                className="hero__social"
              >
                IN
              </a>

            </div>

          </div>
        </div>


        {/* =====================================================
            BOTTOM
        ===================================================== */}

        <div className="hero__bottom">

          <div className="hero__scroll">
            <span className="hero__scroll-dot" />

            <span>
              SCROLL TO EXPLORE
            </span>
          </div>

          <div className="hero__line">
            <span />
          </div>

          <span className="hero__year">
            2026
          </span>

        </div>

      </div>
    </section>
  );
}

export default Hero;