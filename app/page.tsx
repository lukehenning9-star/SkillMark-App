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
      if (window.scrollY > 40) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp">

      {/* ── NAV ── */}
      <nav className="lp-nav" ref={navRef}>
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-logo">Skill<span>Mark</span></Link>
          <div className="lp-nav-right">
            <Link href="/login" className="lp-nav-link">Log In</Link>
            <Link href="/signup" className="lp-nav-cta">Join Free →</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-inner">
          <div className="lp-hero-eyebrow">
            <div className="lp-eyebrow-dot" />
            Now accepting early members
          </div>

          <h1>The verified<br />skills network<br />for the <em>trades.</em></h1>

          <p className="lp-hero-sub">
            SkillMark connects skilled tradespeople with the contractors who need them —
            through <strong>real job photos verified by real supervisors</strong>, not resumes.
          </p>

          <div className="lp-hero-actions">
            <Link href="/signup" className="lp-btn-primary">Build Your Profile — Free</Link>
            <a href="#how" className="lp-btn-ghost">See How It Works ↓</a>
          </div>

          <div className="lp-hero-stats">
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">499K</span>
              <span className="lp-hero-stat-label">Unfilled trade jobs heading into 2026</span>
            </div>
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">92%</span>
              <span className="lp-hero-stat-label">Of contractors can&apos;t find qualified workers</span>
            </div>
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">$67K+</span>
              <span className="lp-hero-stat-label">Average journeyman starting salary</span>
            </div>
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">$0</span>
              <span className="lp-hero-stat-label">Student debt after a trade apprenticeship</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF STRIP ── */}
      <div className="lp-proof-strip">
        <span className="lp-proof-item">Electricians</span>
        <div className="lp-proof-dot" />
        <span className="lp-proof-item">Plumbers</span>
        <div className="lp-proof-dot" />
        <span className="lp-proof-item">HVAC Technicians</span>
        <div className="lp-proof-dot" />
        <span className="lp-proof-item">Carpenters</span>
        <div className="lp-proof-dot" />
        <span className="lp-proof-item">Ironworkers</span>
        <div className="lp-proof-dot" />
        <span className="lp-proof-item">Pipefitters</span>
        <div className="lp-proof-dot" />
        <span className="lp-proof-item">Welders</span>
      </div>

      {/* ── WHY TRADES ── */}
      <section className="lp-reasons" id="why">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-overline">Why Join a Trade</span>
            <h2 className="lp-h2">The smartest career move<br />nobody&apos;s <em>talking about.</em></h2>
            <p className="lp-reasons-intro">
              Trade careers offer exceptional pay, zero student debt, and real job security — and the opportunity is bigger than ever.
            </p>
          </div>

          <div className="lp-reasons-list">
            <article className="lp-reason">
              <div className="lp-reason-num">01</div>
              <div>
                <h3>Earn while you learn</h3>
                <p>Apprentices earn a real wage from day one — starting at 40–50% of journeyman pay and rising every year. By the time a college student graduates, a trade apprentice has already earned <strong>$150,000+ in wages.</strong></p>
              </div>
            </article>

            <article className="lp-reason">
              <div className="lp-reason-num">02</div>
              <div>
                <h3>Zero student debt</h3>
                <p>The average college graduate carries <strong>$39,000 in debt</strong> before earning their first paycheck. Trade apprentices finish training with zero debt, a licensed credential, and full journeyman wages starting immediately.</p>
              </div>
            </article>

            <article className="lp-reason">
              <div className="lp-reason-num">03</div>
              <div>
                <h3>AI-proof careers</h3>
                <p>Electricians, plumbers, and HVAC techs can&apos;t be outsourced or automated. With <strong>499,000 unfilled trade jobs</strong> in America right now — and that number growing — qualified tradespeople are in demand everywhere.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="lp-compare-section">
        <div className="lp-container">
          <span className="lp-overline-dim">By the numbers</span>
          <h2 className="lp-h2-light">The math doesn&apos;t lie.</h2>
          <div className="lp-compare-grid">
            <div className="lp-compare-col">
              <div className="lp-compare-col-label">4-Year College Degree</div>
              <div className="lp-compare-row"><span className="lp-compare-key">Debt at graduation</span><span className="lp-compare-val bad">$39,000+</span></div>
              <div className="lp-compare-row"><span className="lp-compare-key">Earnings during training</span><span className="lp-compare-val bad">$0</span></div>
              <div className="lp-compare-row"><span className="lp-compare-key">Starting salary</span><span className="lp-compare-val bad">~$65,000</span></div>
              <div className="lp-compare-row"><span className="lp-compare-key">Monthly loan payment</span><span className="lp-compare-val bad">$300–$400/mo</span></div>
            </div>
            <div className="lp-compare-col is-trades">
              <div className="lp-compare-col-label">Trade Apprenticeship</div>
              <div className="lp-compare-row"><span className="lp-compare-key">Debt at completion</span><span className="lp-compare-val good">$0</span></div>
              <div className="lp-compare-row"><span className="lp-compare-key">Earnings during training</span><span className="lp-compare-val good">$150,000+</span></div>
              <div className="lp-compare-row"><span className="lp-compare-key">Starting salary</span><span className="lp-compare-val good">$67,000–$76,000</span></div>
              <div className="lp-compare-row"><span className="lp-compare-key">Monthly loan payment</span><span className="lp-compare-val good">$0</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how lp-section" id="how">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-overline">How It Works</span>
            <h2 className="lp-h2">Hire — and get hired —<br />based on <em>proof.</em></h2>
          </div>
          <ol className="lp-steps">
            <li className="lp-step">
              <div className="lp-step-n">01</div>
              <div>
                <h3>Build Your Profile</h3>
                <p>Sign up free as a worker or contractor. Add your trade, location, and experience. Your profile travels with you for your entire career.</p>
              </div>
            </li>
            <li className="lp-step">
              <div className="lp-step-n">02</div>
              <div>
                <h3>Upload Your Work</h3>
                <p>Photograph real jobs — panel installs, conduit runs, HVAC units, plumbing rough-ins. Every photo shows contractors exactly what you can do on a job site.</p>
              </div>
            </li>
            <li className="lp-step">
              <div className="lp-step-n">03</div>
              <div>
                <h3>Get Supervisor Verified</h3>
                <p>Tag the foreman or contractor you worked under. One email, one click — they confirm the work. Your photo becomes verified proof of skill.</p>
              </div>
            </li>
            <li className="lp-step">
              <div className="lp-step-n">04</div>
              <div>
                <h3>Connect Directly</h3>
                <p>Contractors search verified profiles by trade and location. Workers get found by employers who already know they&apos;re qualified before the first call.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="lp-mission">
        <div className="lp-container">
          <blockquote className="lp-pullquote">
            &ldquo;The trades built this country. SkillMark is here to make sure
            the people who build it every day get the recognition they&apos;ve always deserved.&rdquo;
          </blockquote>
          <div className="lp-mission-cols">
            <div>
              <p className="lp-mission-p">
                There&apos;s a generation of skilled tradespeople who built careers with their hands — who never had a reliable way to show the world what they&apos;re capable of. Their reputation lived in a foreman&apos;s phone contact or a handshake that didn&apos;t transfer when they moved on.
              </p>
            </div>
            <div>
              <p className="lp-mission-p">
                At the same time, contractors across America are turning down projects because they can&apos;t find qualified workers. Not because those workers don&apos;t exist — but because there&apos;s no modern, reliable way to find and trust them quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOIN ── */}
      <section className="lp-join" id="signup">
        <div className="lp-container">
          <div className="lp-join-head">
            <span className="lp-overline">Join SkillMark</span>
            <h2 className="lp-h2">Free for everyone.<br />Built for the <em>trades.</em></h2>
          </div>
          <div className="lp-join-grid">
            <div className="lp-join-card">
              <div className="lp-join-card-top">
                <div className="lp-join-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3>I work in the trades</h3>
                <p>Build a verified career profile with real job photos. Get found by contractors who care about actual skill.</p>
              </div>
              <div className="lp-join-card-body">
                <div className="lp-join-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified project portfolio
                </div>
                <div className="lp-join-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Portable career reputation
                </div>
                <div className="lp-join-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Direct contractor connections
                </div>
                <Link href="/signup" className="lp-join-btn worker">Create Free Profile →</Link>
                <p className="lp-join-note">Free forever. No credit card required.</p>
              </div>
            </div>

            <div className="lp-join-card">
              <div className="lp-join-card-top">
                <div className="lp-join-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-2)" }}>
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <h3>I hire trade workers</h3>
                <p>Search verified worker profiles with real job photos. Replace gut-feel hiring with actual evidence of skill.</p>
              </div>
              <div className="lp-join-card-body">
                <div className="lp-join-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Search by trade and location
                </div>
                <div className="lp-join-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  View verified work photos
                </div>
                <div className="lp-join-feature">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Message workers directly
                </div>
                <Link href="/signup" className="lp-join-btn contractor">Get Early Access →</Link>
                <p className="lp-join-note">Free to search. Premium features coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WAITLIST ── */}
      <section className="lp-waitlist">
        <div className="lp-container">
          <div className="lp-waitlist-inner">
            <h2>Not ready yet?</h2>
            <p className="lp-waitlist-p">Drop your email and we&apos;ll let you know when we launch in your area. No spam, ever.</p>
            <div className={`lp-waitlist-form${waitlistError ? " error" : ""}`}>
              <input
                className="lp-waitlist-input"
                type="email"
                placeholder="your@email.com"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitWaitlist()}
              />
              <button className="lp-waitlist-submit" onClick={submitWaitlist}>Notify Me</button>
            </div>
            <p className="lp-waitlist-note">One email when we launch. That&apos;s it.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-footer-logo">Skill<span>Mark</span></div>
            <div className="lp-footer-copy">© 2025 SkillMark · The verified skills network for the trades.</div>
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
