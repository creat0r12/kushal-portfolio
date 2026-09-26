import { experiences } from "../../data/experience";
import "./Experience.css";

function Experience() {
  return (
    <section className="experience" id="experience">
      <div className="container">
        <div className="experience__header">
          <p className="experience__eyebrow">EXPERIENCE</p>

          <h2 className="experience__title">
            What I've
            <br />
            <span>been doing.</span>
          </h2>
        </div>

        <div className="experience__list">
          {experiences.map((experience) => (
            <article className="experience__item" key={experience.role}>
              <div className="experience__period">
                {experience.period}
              </div>

              <div className="experience__content">
                <h3>{experience.role}</h3>
                <p className="experience__company">
                  {experience.company}
                </p>
                <p className="experience__description">
                  {experience.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Experience;