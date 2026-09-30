import { projects } from "../../data/projects";
import "./Projects.css";

function Projects() {
  return (
    <section className="projects" id="work">
      <div className="container">

        {/* HEADER */}
        <div className="projects__header">

          <div className="projects__heading">
            <div className="projects__eyebrow">
              <span className="projects__eyebrow-line" />
              <span>SELECTED WORK</span>
            </div>

            <span className="projects__number">
              01 / 04
            </span>

            <h2 className="projects__title">
              Things I've
              <br />
              <span>built.</span>
            </h2>
          </div>

          <p className="projects__intro">
            A selection of things I've built, explored,
            and experimented with.
          </p>

        </div>


        {/* PROJECT LIST */}
        <div className="projects__list">

          {projects.map((project) => {

            const projectContent = (
              <>
                {/* BACKGROUND NUMBER */}
                <span className="project__ghost-number">
                  {String(project.id).padStart(2, "0")}
                </span>

                {/* TOP */}
                <div className="project__top">

                  <span className="project__number">
                    {String(project.id).padStart(2, "0")}
                  </span>

                  <span className="project__category">
                    {project.category}
                  </span>

                  <span className="project__status">
                    {project.status}
                  </span>

                </div>


                {/* MAIN */}
                <div className="project__main">

                  <div className="project__content">

                    <h3 className="project__title">
                      {project.title}
                    </h3>

                    <p className="project__description">
                      {project.description}
                    </p>

                  </div>


                  {/* META */}
                  <div className="project__meta">

                    <span className="project__year">
                      {project.year}
                    </span>

                    {project.link && (
                      <span className="project__arrow">
                        ↗
                      </span>
                    )}

                  </div>

                </div>


                {/* BOTTOM LINE */}
                <div className="project__bottom">

                  <span className="project__line" />

                  <span className="project__explore">
                    VIEW PROJECT
                  </span>

                </div>

              </>
            );

            if (project.link) {
              return (
                <a
                  key={project.id}
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  className="project"
                >
                  {projectContent}
                </a>
              );
            }

            return (
              <article
                key={project.id}
                className="project"
              >
                {projectContent}
              </article>
            );
          })}

        </div>

      </div>
    </section>
  );
}

export default Projects;