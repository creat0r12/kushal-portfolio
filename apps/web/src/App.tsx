
import Navbar from "./components/navigation/Navbar";
import Hero from "./components/hero/Hero";
import Projects from "./components/projects/Projects";
import About from "./components/about/About";
import Skills from "./components/skills/Skills";
import Experience from "./components/experience/Experience";
import Education from "./components/education/Education";
import Contact from "./components/contact/Contact";
import Footer from "./components/common/Footer";
import Gallery from "./components/gallery/Gallery";
import Reveal from "./animations/Reveal";
import Notepad from "./components/temporary-notepad/Notepad";

function App() {
  return (
    <div>
      <Navbar />

      <main>
        <Reveal>
          <Hero />
        </Reveal>

        <Reveal>
          <Projects />
        </Reveal>

        <Reveal>
          <Gallery />
        </Reveal>

        <Reveal>
          <About />
        </Reveal>

        <Reveal>
          <Skills />
        </Reveal>

        <Reveal>
          <Experience />
        </Reveal>

        <Reveal>
          <Education />
        </Reveal>

        <Reveal>
          <Contact />
        </Reveal>
      </main>

      <Footer />

      <Notepad />
    </div>
  );
}

export default App;
