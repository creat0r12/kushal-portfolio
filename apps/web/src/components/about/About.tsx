import Reveal from "../../animations/Reveal";
import "./About.css";

function About() {
  return (
    <section className="about" id="about">
      <Reveal>
        <div className="container">
          <div className="about__grid">
            <div className="about__label">
              <p>ABOUT ME</p>
            </div>

            <div className="about__content">
              <h2>
                I like turning
                <br />
                <span>ideas into reality.</span>
              </h2>

              <p>
                I'm Kushal, a computer science student and creative developer
                who enjoys building useful products and experimenting with
                technology.
              </p>

              <p>
                I work across web development, creative technology, and
                product ideas. I'm always learning, building, and looking for
                better ways to turn an idea into something people can use.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default About;