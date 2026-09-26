import { education } from "../../data/education";
import "./Education.css";

function Education() {
  return (
    <section className="education" id="education">
      <div className="container">
        <div className="education__header">
          <p className="education__eyebrow">EDUCATION</p>

          <h2 className="education__title">
            Learning,
            <br />
            <span>always.</span>
          </h2>
        </div>

        <div className="education__list">
          {education.map((item) => (
            <article className="education__item" key={item.degree}>
              <div className="education__period">
                {item.period}
              </div>

              <div className="education__content">
                <h3>{item.degree}</h3>

                <p className="education__institution">
                  {item.institution}
                </p>

                <p className="education__description">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Education;