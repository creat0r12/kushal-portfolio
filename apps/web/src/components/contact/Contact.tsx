import "./Contact.css";

function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="contact__content">
          <p className="contact__eyebrow">GET IN TOUCH</p>

          <h2 className="contact__title">
            Have an idea?
            <br />
            <span>Let's build it.</span>
          </h2>

          <p className="contact__description">
            I'm always open to interesting projects, collaborations, and
            conversations about technology and creativity.
          </p>

          <a
            href="mailto:hello@example.com"
            className="contact__button"
          >
            Get in touch
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;