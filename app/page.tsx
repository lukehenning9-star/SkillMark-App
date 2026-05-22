"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./landing.css";

function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div className={`lp-toast${show ? " show" : ""}`}>
      <div className="lp-toast-check">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
}

const FORMSPREE_ID = "xrejekgk";

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistError, setWaitlistError] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, message: msg });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  }

  async function submitWaitlist() {
    if (!waitlistEmail || !waitlistEmail.includes("@")) {
      setWaitlistError(true);
      setTimeout(() => setWaitlistError(false), 2500);
      return;
    }
    try {
      await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: waitlistEmail, type: "Waitlist" }),
      });
    } catch {}
    setWaitlistEmail("");
    showToast("You're on the waitlist. We'll be in touch.");
  }

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.style.boxShadow = window.scrollY > 8 ? "0 2px 16px rgba(15,31,61,0.09)" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp">
      {/* NAV */}
      <nav className="lp-nav" ref={navRef}>
        <div className="lp-nav-inner">
          <Link className="lp-nav-logo" href="/">Skill<span>Mark</span></Link>
          <div className="lp-nav-right">
            <Link href="/login" className="lp-btn lp-btn-ghost">Log In</Link>
            <Link href="/signup" className="lp-btn lp-btn-navy">Join Free →</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-eyebrow">
            <div className="lp-eyebrow-dot" />
            Now accepting early members
          </div>
          <h1>The verified skills network<br />for the <em>trades.</em></h1>
          <p className="lp-hero-sub">
            SkillMark connects skilled tradespeople with the contractors who need them —
            through <strong>real job photos verified by real supervisors</strong>, not resumes.
          </p>
          <div className="lp-hero-actions">
            <Link href="/signup" className="lp-btn lp-btn-navy-lg">Build Your Profile — Free</Link>
            <a href="#how" className="lp-btn lp-btn-outline-lg">See How It Works</a>
          </div>
          <div className="lp-hero-proof">
            <div className="lp-proof-avatars">
              <div className="lp-proof-avatar" style={{ background: "#0c6e74" }}>MR</div>
              <div className="lp-proof-avatar" style={{ background: "#166534" }}>DJ</div>
              <div className="lp-proof-avatar" style={{ background: "#7c3aed" }}>TC</div>
              <div className="lp-proof-avatar" style={{ background: "#b45309" }}>RP</div>
            </div>
            &nbsp;Join tradespeople and contractors already on the waitlist
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="lp-stats-bar">
        <div className="lp-stats-bar-inner">
          <div className="lp-stat-bar-item">
            <div className="lp-stat-bar-num">499K</div>
            <div className="lp-stat-bar-label">Unfilled trade jobs heading into 2026</div>
          </div>
          <div className="lp-stat-bar-item">
            <div className="lp-stat-bar-num">92%</div>
            <div className="lp-stat-bar-label">Of contractors can&apos;t find qualified workers</div>
          </div>
          <div className="lp-stat-bar-item">
            <div className="lp-stat-bar-num">$67K+</div>
            <div className="lp-stat-bar-label">Average journeyman starting salary</div>
          </div>
          <div className="lp-stat-bar-item">
            <div className="lp-stat-bar-num">$0</div>
            <div className="lp-stat-bar-label">Student debt after a trade apprenticeship</div>
          </div>
        </div>
      </div>

      {/* WHY JOIN A TRADE */}
      <section className="lp-why-section" id="why">
        <div className="lp-container">
          <div className="lp-why-label">Why Join a Trade</div>
          <h2 className="lp-why-title">The smartest career move<br />nobody&apos;s <em>talking about.</em></h2>
          <p className="lp-why-sub">Trade careers offer exceptional pay, zero student debt, and real job security — and the opportunity is bigger than ever.</p>

          <div className="lp-why-grid">
            <div className="lp-why-card">
              <div className="lp-why-card-num">01</div>
              <h3>Earn while you learn</h3>
              <p>Apprentices earn a real wage from day one — starting at 40–50% of journeyman pay and rising every year. By the time a college student graduates, a trade apprentice has already earned <strong>$150,000+ in wages.</strong></p>
            </div>
            <div className="lp-why-card">
              <div className="lp-why-card-num">02</div>
              <h3>Zero student debt</h3>
              <p>The average college graduate carries <strong>$39,000 in debt</strong> before earning their first paycheck. Trade apprentices finish training with zero debt, a licensed credential, and full journeyman wages starting immediately.</p>
            </div>
            <div className="lp-why-card">
              <div className="lp-why-card-num">03</div>
              <h3>AI-proof careers</h3>
              <p>Electricians, plumbers, and HVAC techs can&apos;t be outsourced or automated. With <strong>499,000 unfilled trade jobs</strong> in America right now — and that number growing — qualified tradespeople are in demand everywhere.</p>
            </div>
          </div>

          <div className="lp-why-comparison">
            <div className="lp-why-compare-card">
              <div className="lp-why-compare-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                4-Year College Degree
              </div>
              <div className="lp-why-compare-row"><span className="lp-why-compare-key">Debt at graduation</span><span className="lp-why-compare-val bad">$39,000+</span></div>
              <div className="lp-why-compare-row"><span className="lp-why-compare-key">Earnings during training</span><span className="lp-why-compare-val bad">$0</span></div>
              <div className="lp-why-compare-row"><span className="lp-why-compare-key">Starting salary</span><span className="lp-why-compare-val bad">~$65,000</span></div>
              <div className="lp-why-compare-row"><span className="lp-why-compare-key">Monthly loan payment</span><span className="lp-why-compare-val bad">$300–$400/mo</span></div>
            </div>
            <div className="lp-why-compare-card highlight">
              <div className="lp-why-compare-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Trade Apprenticeship
              </div>
              <div className="lp-why-compare-row"><span className="lp-why-compare-key">Debt at completion</span><span className="lp-why-compare-val good">$0</span></div>
              <div className="lp-why-compare-row"><span className="lp-why-compare-key">Earnings during training</span><span className="lp-why-compare-val good">$150,000+</span></div>
              <div className="lp-why-compare-row"><span className="lp-why-compare-key">Starting salary</span><span className="lp-why-compare-val good">$67,000–$76,000</span></div>
              <div className="lp-why-compare-row"><span className="lp-why-compare-key">Monthly loan payment</span><span className="lp-why-compare-val good">$0</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how-section lp-section" id="how">
        <div className="lp-container">
          <div className="lp-section-label">How It Works</div>
          <h2 className="lp-section-title">Hire — and get hired —<br />based on proof.</h2>
          <p className="lp-section-sub">No more gut-feel hiring. Just verified evidence of what someone can actually do on a job site.</p>
          <div className="lp-steps-grid">
            <div className="lp-step-card">
              <div className="lp-step-num">01</div>
              <h3>Build Your Profile</h3>
              <p>Sign up free as a worker or contractor. Add your trade, location, and experience. Your profile travels with you for your entire career.</p>
            </div>
            <div className="lp-step-card">
              <div className="lp-step-num">02</div>
              <h3>Upload Your Work</h3>
              <p>Photograph real jobs — panel installs, conduit runs, HVAC units, plumbing rough-ins. Every photo shows contractors what you can actually do.</p>
            </div>
            <div className="lp-step-card">
              <div className="lp-step-num">03</div>
              <h3>Get Supervisor Verified</h3>
              <p>Tag the foreman or contractor you worked under. One email, one click — they confirm the work. Your photo becomes verified proof.</p>
            </div>
            <div className="lp-step-card">
              <div className="lp-step-num">04</div>
              <h3>Connect Directly</h3>
              <p>Contractors search verified profiles by trade and location. Workers get found by employers who already know they&apos;re qualified.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="lp-mission-section lp-section">
        <div className="lp-container">
          <div className="lp-mission-grid">
            <div>
              <div className="lp-section-label">Our Mission</div>
              <h2 className="lp-mission-title">The trades built this country. We&apos;re here to make sure they <em>keep</em> building it.</h2>
            </div>
            <div>
              <p className="lp-mission-body">
                There&apos;s a generation of skilled tradespeople who built careers with their hands — who never had a reliable way to show the world what they&apos;re capable of. Their reputation lived in a foreman&apos;s phone contact or a handshake that didn&apos;t transfer when they moved on.
              </p>
              <p className="lp-mission-body">
                At the same time, contractors across America are turning down projects because they can&apos;t find qualified workers. Not because those workers don&apos;t exist — but because there&apos;s no modern, reliable way to find and trust them quickly.
              </p>
              <p className="lp-mission-closing">
                The trades are the backbone of America. SkillMark is here to give that backbone the recognition — and the connections — it has always deserved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNUP */}
      <section className="lp-signup-section" id="signup">
        <div className="lp-container">
          <div className="lp-signup-header">
            <span className="lp-section-label">Join SkillMark</span>
            <h2 className="lp-section-title">Free for everyone.<br />Built for the trades.</h2>
            <p className="lp-section-sub" style={{ margin: "0 auto" }}>Whether you work in the trades or hire for them — SkillMark is your platform.</p>
          </div>
          <div className="lp-signup-grid">
            <div className="lp-signup-card">
              <div className="lp-signup-card-head">
                <div className="lp-signup-card-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="lp-signup-card-title">I work in the trades</div>
                <div className="lp-signup-card-sub">Build a verified career profile with real job photos. Get found by contractors who care about actual skill.</div>
              </div>
              <div className="lp-signup-card-body">
                <div className="lp-signup-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified project portfolio
                </div>
                <div className="lp-signup-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Portable career reputation
                </div>
                <div className="lp-signup-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Direct contractor connections
                </div>
                <Link href="/signup" className="lp-signup-btn worker">Create Free Profile →</Link>
                <p className="lp-signup-note">Free forever. No credit card required.</p>
              </div>
            </div>

            <div className="lp-signup-card">
              <div className="lp-signup-card-head">
                <div className="lp-signup-card-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--navy)" }}>
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <div className="lp-signup-card-title">I hire trade workers</div>
                <div className="lp-signup-card-sub">Search verified worker profiles with real job photos. Replace gut-feel hiring with actual evidence of skill.</div>
              </div>
              <div className="lp-signup-card-body">
                <div className="lp-signup-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Search by trade and location
                </div>
                <div className="lp-signup-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  View verified work photos
                </div>
                <div className="lp-signup-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Message workers directly
                </div>
                <Link href="/signup" className="lp-signup-btn contractor">Get Early Access →</Link>
                <p className="lp-signup-note">Free to search. Premium features coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section className="lp-waitlist-section">
        <div className="lp-waitlist-box">
          <h2>Not ready yet?</h2>
          <p>Drop your email and we&apos;ll let you know when we launch in your area. No spam, ever.</p>
          <div className={`lp-waitlist-row${waitlistError ? " error" : ""}`}>
            <input
              className="lp-waitlist-input"
              type="email"
              placeholder="your@email.com"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitWaitlist()}
            />
            <button className="lp-waitlist-btn" onClick={submitWaitlist}>Notify Me</button>
          </div>
          <p className="lp-waitlist-note">One email when we launch. That&apos;s it.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-footer-logo">Skill<span>Mark</span></div>
            <div className="lp-footer-copy">© 2025 SkillMark · joinskillmark.com · The verified skills network for the trades.</div>
          </div>
          <ul className="lp-footer-links">
            <li><a href="#why">Why Trades</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#signup">For Workers</a></li>
            <li><a href="#signup">For Contractors</a></li>
            <li><a href="#">Privacy</a></li>
          </ul>
        </div>
      </footer>

      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}
