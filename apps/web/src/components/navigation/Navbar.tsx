import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import "./Navbar.css";

import Glass from "../Glass/Glass";

const navLinks = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

type NavbarProps = {
  backgroundRef: RefObject<HTMLDivElement | null>;
};

function Navbar({ backgroundRef }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [glassWidth, setGlassWidth] = useState(1100);

  useEffect(() => {
    const updateWidth = () => {
      setGlassWidth(
        Math.min(window.innerWidth * 0.92, 1100),
      );
    };

    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="navbar">

      {/* Universal Liquid Glass */}
      <Glass
        width={glassWidth}
        height={78}
        radius={28}
        backgroundRef={backgroundRef}
      >
        <div className="navbar__inner">

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
      </Glass>

      {/* Mobile navigation */}
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