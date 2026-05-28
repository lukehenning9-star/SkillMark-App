"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import "./landing.css";

function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div className={`lp-toast${show ? " show" : ""}`}>
      <div className="lp-toast-check">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
}

const FORMSPREE_ID = "xrejekgk";

export default function LandingPage() {
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

  return (
    <div className="lp">

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-logo">
            Skill<span>Mark</span>
          </Link>
          <div className="lp-nav-center">
            <a href="#how" className="lp-nav-link">How it works</a>
            <a href="#for-workers" className="lp-nav-link">For workers</a>
            <a href="#for-contractors" className="lp-nav-link">For contractors</a>
          </div>
          <div className="lp-nav-right">
            <Link href="/login" className="lp-nav-signin">Log in</Link>
            <Link href="/signup" className="lp-nav-cta">Join free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-text">
            <p className="lp-hero-eyebrow lp-fade-1">Now accepting early members</p>
            <h1 className="lp-fade-2">Build a career<br />you can <em>prove.</em></h1>
            <p className="lp-hero-sub lp-fade-3">
              SkillMark gives skilled tradespeople a verified photo portfolio
              of their work — job by job, employer by employer. The career
              record the trades have always needed.
            </p>
            <div className="lp-hero-actions lp-fade-4">
              <Link href="/signup" className="lp-btn-primary">Create your free profile</Link>
              <Link href="/signup?role=contractor" className="lp-btn-outline">I hire trade workers →</Link>
            </div>
            <p className="lp-hero-legal lp-fade-5">Free forever. No credit card required.</p>
          </div>

          {/* CSS profile mockup — no images needed */}
          <div className="lp-hero-mock" aria-hidden="true">
            <div className="lp-mock">
              <div className="lp-mock-header">
                <div className="lp-mock-avatar">MR</div>
                <div className="lp-mock-info">
                  <div className="lp-mock-name">Marcus Rivera</div>
                  <div className="lp-mock-meta">Journeyman Electrician · Denver, CO</div>
                </div>
              </div>
              <div className="lp-mock-pills">
                <span className="lp-mock-pill blue">IBEW Local 68</span>
                <span className="lp-mock-pill gray">7 yrs exp.</span>
              </div>
              <div className="lp-mock-label">Recent work</div>
              <div className="lp-mock-grid">
                <div className="lp-mock-photo p1">
                  <div className="lp-mock-photo-inner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M6 8h.01M6 12h12"/></svg>
                    <span>Panel Install</span>
                  </div>
                  <div className="lp-mock-tick">✓</div>
                </div>
                <div className="lp-mock-photo p2">
                  <div className="lp-mock-photo-inner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M3 9l9-6 9 6"/></svg>
                    <span>Conduit Run</span>
                  </div>
                  <div className="lp-mock-tick">✓</div>
                </div>
                <div className="lp-mock-photo p3">
                  <div className="lp-mock-photo-inner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                    <span>Service Work</span>
                  </div>
                  <div className="lp-mock-tick">✓</div>
                </div>
                <div className="lp-mock-photo p4">
                  <div className="lp-mock-photo-inner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                    <span>Rough-In</span>
                  </div>
                  <div className="lp-mock-tick">✓</div>
                </div>
                <div className="lp-mock-photo p5 pending">
                  <div className="lp-mock-photo-inner pending-inner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(146,64,14,0.7)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Awaiting</span>
                  </div>
                  <div className="lp-mock-pending-label">Pending</div>
                </div>
                <div className="lp-mock-photo p6 empty">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
              </div>
              <div className="lp-mock-stats">
                <div className="lp-mock-stat">
                  <strong>14</strong>
                  <span>Projects</span>
                </div>
                <div className="lp-mock-stat-divider" />
                <div className="lp-mock-stat">
                  <strong>11</strong>
                  <span>Verified</span>
                </div>
                <div className="lp-mock-stat-divider" />
                <div className="lp-mock-stat">
                  <strong>5</strong>
                  <span>Employers</span>
                </div>
              </div>
            </div>
            <div className="lp-mock-message">
              <div className="lp-mock-msg-avatar">JC</div>
              <div className="lp-mock-msg-bubble">
                <div className="lp-mock-msg-name">Jordan Chen — ABC Electric</div>
                <div className="lp-mock-msg-text">Your panel work on that commercial job looks great. Are you available in March?</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAT BAR ── */}
      <div className="lp-stats">
        <div className="lp-stats-inner">
          <div className="lp-stat-item">
            <strong>499,000+</strong>
            <span>Unfilled trade jobs in America right now</span>
          </div>
          <div className="lp-stat-rule" />
          <div className="lp-stat-item">
            <strong>$67,000+</strong>
            <span>Average journeyman starting salary</span>
          </div>
          <div className="lp-stat-rule" />
          <div className="lp-stat-item stat-zero">
            <strong>$0</strong>
            <span>Student debt after a trade apprenticeship</span>
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section className="lp-problem">
        <div className="lp-container">
          <div className="lp-problem-inner">
            <div className="lp-problem-tag">The problem</div>
            <p className="lp-problem-text">
              Right now, the best electricians, plumbers, and welders in America
              get hired based on a phone call and a gut feeling. There&apos;s no
              reliable way to show what you&apos;ve built — and no reliable way for
              contractors to verify it.
            </p>
            <p className="lp-problem-text">
              Tradespeople deserve the same thing every knowledge worker takes
              for granted: a career record that proves exactly what they can do.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how" id="how">
        <div className="lp-container">
          <h2 className="lp-how-heading">How SkillMark works</h2>
          <p className="lp-how-subhead">No more gut-feel hiring. Just verified evidence of what someone can actually do on a job site.</p>
          <div className="lp-how-editorial">
            <div className="lp-how-step-row">
              <div className="lp-how-step-n">01</div>
              <div className="lp-how-step-title"><h3>Build your profile</h3></div>
              <div className="lp-how-step-body"><p>Sign up free as a worker or contractor. Add your trade, location, and experience. Takes five minutes.</p></div>
            </div>
            <div className="lp-how-step-row">
              <div className="lp-how-step-n">02</div>
              <div className="lp-how-step-title"><h3>Upload your work</h3></div>
              <div className="lp-how-step-body"><p>Photograph real jobs — panel installs, conduit runs, HVAC units, plumbing rough-ins. Each photo shows contractors what you can actually do.</p></div>
            </div>
            <div className="lp-how-step-row">
              <div className="lp-how-step-n">03</div>
              <div className="lp-how-step-title"><h3>Get verified</h3></div>
              <div className="lp-how-step-body"><p>Tag your foreman or supervisor. One email, one click — they confirm the work. Your photo becomes certified proof of skill.</p></div>
            </div>
            <div className="lp-how-step-row">
              <div className="lp-how-step-n">04</div>
              <div className="lp-how-step-title"><h3>Get found</h3></div>
              <div className="lp-how-step-body"><p>Contractors search by trade and location. You get contacted by employers who already know you&apos;re qualified before the first call.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR WORKERS ── */}
      <section className="lp-split" id="for-workers">
        <div className="lp-container">
          <div className="lp-split-inner">
            <div className="lp-split-text">
              <p className="lp-split-eyebrow">For workers</p>
              <h2 className="lp-split-h2">Your reputation.<br />Portable forever.</h2>
              <p className="lp-split-body">
                Every job you work builds your portfolio. Every supervisor who
                verifies your work builds your reputation. It follows you from
                job to job, city to city — not locked inside someone else&apos;s
                HR system.
              </p>
              <ul className="lp-split-list">
                <li>Verified photo portfolio of your actual work</li>
                <li>Career record that moves with you</li>
                <li>Direct messages from interested contractors</li>
                <li>Free forever, no subscription required</li>
              </ul>
              <Link href="/signup" className="lp-split-cta">Create your free profile →</Link>
            </div>
            <div className="lp-split-callouts">
              <div className="lp-callout">
                <div className="lp-callout-num">$150K+</div>
                <p>Earned by a trade apprentice during training — while college peers finish school with $39K in debt</p>
              </div>
              <div className="lp-callout">
                <div className="lp-callout-num">92%</div>
                <p>Of contractors say they can&apos;t find enough qualified workers. Your verified profile gets you seen.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR CONTRACTORS ── */}
      <section className="lp-split lp-split-alt" id="for-contractors">
        <div className="lp-container">
          <div className="lp-split-inner lp-split-flip">
            <div className="lp-split-text">
              <p className="lp-split-eyebrow">For contractors</p>
              <h2 className="lp-split-h2">Hire based on<br />what they&apos;ve built.</h2>
              <p className="lp-split-body">
                See verified job photos before you make a call. Know who&apos;s done
                what kind of work, where, and who can vouch for it. Replace gut-feel
                hiring with actual evidence.
              </p>
              <ul className="lp-split-list">
                <li>Search verified profiles by trade and location</li>
                <li>View real job photos before you reach out</li>
                <li>Message workers directly through the platform</li>
                <li>Free to search, premium features coming</li>
              </ul>
              <Link href="/signup?role=contractor" className="lp-split-cta">Get early access →</Link>
            </div>
            <div className="lp-compare-table">
              <div className="lp-compare-title">The math on trades vs. college</div>
              <table className="lp-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>College grad</th>
                    <th>Trade apprentice</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Debt at graduation</td>
                    <td className="bad">$39,000+</td>
                    <td className="good">$0</td>
                  </tr>
                  <tr>
                    <td>Earnings in training</td>
                    <td className="bad">$0</td>
                    <td className="good">$150,000+</td>
                  </tr>
                  <tr>
                    <td>Starting salary</td>
                    <td className="neutral">~$65,000</td>
                    <td className="good">$67–76,000</td>
                  </tr>
                  <tr>
                    <td>Monthly loan payment</td>
                    <td className="bad">$300–400</td>
                    <td className="good">$0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION STRIP ── */}
      <section className="lp-mission">
        <div className="lp-container">
          <div className="lp-mission-inner">
            <h2 className="lp-mission-h2">
              The trades built this country. SkillMark is here to make sure
              the people who build it every day get the recognition they&apos;ve
              always deserved.
            </h2>
            <div className="lp-mission-cols">
              <p>
                There&apos;s a generation of skilled tradespeople who built careers
                with their hands — who never had a reliable way to show the world
                what they&apos;re capable of. Their reputation lived in a foreman&apos;s
                phone contact or a handshake that didn&apos;t transfer when they moved on.
              </p>
              <p>
                At the same time, contractors across America are turning down
                projects because they can&apos;t find qualified workers. Not because
                those workers don&apos;t exist — but because there&apos;s no modern,
                reliable way to find and trust them quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRADES CASE ── */}
      <section className="lp-trades" id="why">
        <div className="lp-container">
          <p className="lp-trades-eyebrow">Why the trades</p>
          <h2 className="lp-trades-h2">The smartest career move nobody&apos;s talking about.</h2>
          <div className="lp-trades-grid">
            <div className="lp-trades-item">
              <h3>Earn while you learn</h3>
              <p>Apprentices earn a real wage from day one — starting at 40–50% of journeyman pay and rising every year. By the time a college student graduates, a trade apprentice has already earned $150,000+ in wages.</p>
            </div>
            <div className="lp-trades-item">
              <h3>Zero student debt</h3>
              <p>The average college graduate carries $39,000 in debt before their first paycheck. Trade apprentices finish with a licensed credential, full journeyman wages, and no debt to service.</p>
            </div>
            <div className="lp-trades-item">
              <h3>AI-proof careers</h3>
              <p>Electricians, plumbers, and HVAC techs can&apos;t be outsourced or automated. With 499,000 unfilled trade jobs in America right now — and the number growing — qualified tradespeople are in demand everywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WAITLIST ── */}
      <section className="lp-waitlist">
        <div className="lp-container">
          <div className="lp-waitlist-inner">
            <div className="lp-waitlist-text">
              <h2>Not ready to sign up?</h2>
              <p>Drop your email and we&apos;ll let you know when we launch in your area. No spam, ever.</p>
            </div>
            <div className="lp-waitlist-form-wrap">
              <div className={`lp-waitlist-form${waitlistError ? " error" : ""}`}>
                <input
                  className="lp-waitlist-input"
                  type="email"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitWaitlist()}
                />
                <button className="lp-waitlist-submit" onClick={submitWaitlist}>
                  Notify me
                </button>
              </div>
              <p className="lp-waitlist-note">One email when we launch. That&apos;s it.</p>
            </div>
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
            <li><a href="#why">Why trades</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#for-workers">For workers</a></li>
            <li><a href="#for-contractors">For contractors</a></li>
            <li><a href="#">Privacy</a></li>
          </ul>
        </div>
      </footer>

      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}
