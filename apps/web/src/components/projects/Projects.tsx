import { projects } from "../../data/projects";
import "./Projects.css";

function Projects() {
  return (
    <section className="projects" id="work">
      <div className="container">
        <div className="projects__header">
          <div>
            <p className="projects__eyebrow">SELECTED WORK</p>

            <h2 className="projects__title">
              Things I've
              <br />
              <span>built.</span>
            </h2>
          </div>

          <p className="projects__intro">
            A selection of things I've built, explored, and experimented
            with.
          </p>
        </div>

        <div className="projects__list">
          {projects.map((project) => {
            const projectContent = (
              <>
                <div className="project__top">
                  <span className="project__number">
                    {String(project.id).padStart(2, "0")}
                  </span>

                  <span className="project__status">
                    {project.status}
                  </span>
                </div>

                <div className="project__main">
                  <div className="project__content">
                    <p className="project__category">
                      {project.category}
                    </p>

                    <h3 className="project__title">
                      {project.title}
                    </h3>

                    <p className="project__description">
                      {project.description}
                    </p>
                  </div>

                  <div className="project__meta">
                    <span>{project.year}</span>

                    {project.link && (
                      <span className="project__arrow">↗</span>
                    )}
                  </div>
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
              <article key={project.id} className="project">
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