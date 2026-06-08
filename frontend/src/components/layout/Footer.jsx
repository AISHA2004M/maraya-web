import { Link } from "react-router-dom";

const COL1 = ["New Arrivals", "Woman", "Man", "Accessories"];
const COL2 = ["About", "Sustainability", "Careers", "Press"];
const COL3 = ["Help & FAQ", "Returns", "Stores", "Contact"];

export default function Footer() {
  return (
    <footer className="border-t border-rule mt-24 bg-white">
      <div className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div>
            <p className="font-display text-3xl font-light tracking-widest2 mb-6">VRITAL</p>
            <p className="text-xs text-muted leading-relaxed max-w-[180px]">
              AI-powered virtual try-on. See it on you before you buy it.
            </p>
          </div>

          {[["Shop", COL1], ["Company", COL2], ["Support", COL3]].map(([heading, links]) => (
            <div key={heading}>
              <p className="label-upper-dark mb-5">{heading}</p>
              <ul className="space-y-3">
                {links.map((item) => (
                  <li key={item}>
                    <Link to="/" className="text-xs text-muted hover:text-ink transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="rule mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-subtle">© 2026 Vrital. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy Policy", "Cookie Policy", "Terms of Use"].map((t) => (
              <Link key={t} to="/" className="text-xs text-subtle hover:text-ink transition-colors">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
