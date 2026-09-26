import { skills } from "../../data/skills";
import "./Skills.css";

function Skills() {
  return (
    <section className="skills" id="skills">
      <div className="container">
        <div className="skills__header">
          <p className="skills__eyebrow">SKILLS</p>

          <h2 className="skills__title">
            Tools I use to
            <br />
            <span>build things.</span>
          </h2>
        </div>

        <div className="skills__list">
          {skills.map((skill) => (
            <div className="skill" key={skill.name}>
              <span className="skill__name">{skill.name}</span>
              <span className="skill__category">{skill.category}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Skills;