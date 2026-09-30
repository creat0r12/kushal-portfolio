import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import "./Navbar.css";

const navLinks = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const animationFrame = useRef<number | null>(null);

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const card = event.currentTarget;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
    }

    const clientX = event.clientX;
    const clientY = event.clientY;

    animationFrame.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((x - centerX) / centerX) * 3;
      const rotateX = ((centerY - y) / centerY) * 3;

      card.style.setProperty(
        "--rotate-x",
        `${rotateX}deg`
      );

      card.style.setProperty(
        "--rotate-y",
        `${rotateY}deg`
      );

      card.style.setProperty(
        "--mouse-x",
        `${x}px`
      );

      card.style.setProperty(
        "--mouse-y",
        `${y}px`
      );
    });
  };

  const handlePointerLeave = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const card = event.currentTarget;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");

    card.style.setProperty("--mouse-x", "50%");
    card.style.setProperty("--mouse-y", "50%");
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="navbar">
      <div
        className="navbar__inner"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <a
          href="#"
          className="navbar__logo"
          onClick={closeMenu}
        >
          KP<span>.</span>
        </a>

        <nav
          className="navbar__links"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="navbar__menu"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={
            isOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X size={22} strokeWidth={1.5} />
          ) : (
            <Menu size={22} strokeWidth={1.5} />
          )}
        </button>
      </div>

      <div
        className={`navbar__mobile ${
          isOpen ? "is-open" : ""
        }`}
      >
        <nav aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;