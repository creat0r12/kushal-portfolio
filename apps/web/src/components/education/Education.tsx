import { education } from "../../data/education";
import "./Education.css";

function Education() {
  return (
    <section className="education" id="education">
      <div className="container">

        {/* HEADER */}
        <div className="education__header">
          <div className="education__eyebrow">
            <span className="education__eyebrow-line" />
            <span>EDUCATION</span>
          </div>

          <div className="education__heading-wrap">
            <span className="education__number">04 / 04</span>

            <h2 className="education__title">
              Learning,
              <br />
              <span>always.</span>
            </h2>
          </div>

          <p className="education__intro">
            Building a strong foundation in computer science
            while continuously learning through projects,
            experimentation, and real-world development.
          </p>
        </div>

        {/* EDUCATION LIST */}
        <div className="education__list">
          {education.map((item, index) => (
            <article
              className="education__item"
              key={item.degree}
            >
              {/* INDEX */}
              <div className="education__index">
                0{index + 1}
              </div>

              {/* PERIOD */}
              <div className="education__period">
                {item.period}
              </div>

              {/* CONTENT */}
              <div className="education__content">
                <h3>{item.degree}</h3>

                <p className="education__institution">
                  {item.institution}
                </p>

                <p className="education__description">
                  {item.description}
                </p>
              </div>

              {/* ARROW */}
              <span className="education__arrow">
                ↗
              </span>
            </article>
          ))}
        </div>

        {/* FOOTER LINE */}
        <div className="education__footer">
          <span />
          <span>CONTINUOUSLY LEARNING</span>
          <span />
        </div>

      </div>
    </section>
  );
}

export default Education;