import "./Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">

        <div className="hero__top">
          <p className="hero__eyebrow">
            CREATIVE DEVELOPER
          </p>

          <p className="hero__availability">
            <span className="hero__status"></span>
            Available for interesting projects
          </p>
        </div>

        <div className="hero__main">
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
        </div>

        <div className="hero__bottom">
          <span>SCROLL TO EXPLORE</span>

          <div className="hero__line"></div>

          <span>2026</span>
        </div>

      </div>
    </section>
  );
}

export default Hero;