import { LiquidGlass } from "liquid-glass-web-react";
import "./GlassTest.css";

function GlassTest() {
  return (
    <div className="glass-test-page">
      <div className="glass-test-background">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <LiquidGlass
        width={500}
        height={220}
        
      >
        <div className="glass-test-content">
          <h1>Liquid Glass</h1>
          <p>Testing the glass effect.</p>
          <button>Explore</button>
        </div>
      </LiquidGlass>
    </div>
  );
}

export default GlassTest;