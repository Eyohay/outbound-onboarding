"use client";

import { useState } from "react";
import s from "./onboarding.module.css";

const SECTIONS = [
  {
    number: 1,
    title: "Your Business",
    intro:
      "Let's start with the basics. Your launch specialist will use these answers to understand your business before your kickoff call.",
  },
  {
    number: 2,
    title: "Your Edge",
    intro:
      "This is the part most businesses struggle with — but it's the most important. We need to know what actually makes you different, not just what you'd like to be true.",
  },
  {
    number: 3,
    title: "Your Offer",
    intro:
      "Last section. These questions help us figure out how to position your outreach so prospects say yes faster.",
  },
];

// Steps: 0=s1 intro, 1=s1 qs, 2=s2 intro, 3=s2 qs, 4=s3 intro, 5=s3 qs, 6=success
const SECTION_FOR_STEP = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 2 };

function VideoEmbed({ src, label }) {
  return (
    <div className={s.videoEmbed}>
      <iframe
        src={src}
        title={label}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}

function ProgressBar({ step }) {
  const getSectionState = (idx) => {
    const current = SECTION_FOR_STEP[step] ?? 0;
    if (idx < current) return "done";
    if (idx === current) return "active";
    return "idle";
  };

  return (
    <div className={s.progressBar}>
      <div className={s.progressSteps}>
        {SECTIONS.map((sec, idx) => {
          const state = getSectionState(idx);
          return (
            <div key={idx} className={s.progressStep}>
              <div className={`${s.progressStepDot} ${state === "active" ? s.active : ""} ${state === "done" ? s.done : ""}`}>
                {state === "done" ? "✓" : idx + 1}
              </div>
              <span className={`${s.progressStepLabel} ${state === "active" ? s.active : ""} ${state === "done" ? s.done : ""}`}>
                {sec.title}
              </span>
              {idx < SECTIONS.length - 1 && (
                <div className={`${s.progressConnector} ${state === "done" ? s.done : ""}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionIntro({ section, onStart }) {
  return (
    <div className={s.sectionIntro}>
      <div className={s.sectionBadge}>Section {section.number} of 3</div>
      <h2 className={s.sectionIntroTitle}>{section.title}</h2>
      <p className={s.sectionIntroText}>{section.intro}</p>
      <button className={s.startBtn} onClick={onStart}>
        {section.number === 1 ? "Let's get started" : "Continue"}
        <span className={s.startBtnArrow}>→</span>
      </button>
    </div>
  );
}

function Section1Questions({ data, onChange }) {
  return (
    <>
      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q1 — What's your full name and company name?</label>
        <div className={s.questionRow}>
          <input className={s.questionInput} type="text" placeholder="Your full name" value={data.name} onChange={(e) => onChange("name", e.target.value)} />
          <input className={s.questionInput} type="text" placeholder="Company name" value={data.company} onChange={(e) => onChange("company", e.target.value)} />
        </div>
        <input className={s.questionInput} type="email" placeholder="Your email address" value={data.email} onChange={(e) => onChange("email", e.target.value)} style={{ marginTop: "10px" }} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q2 — What does your business do, in two sentences or less?</label>
        <span className={s.questionHint}>Write it the way you'd explain it to someone you just met at a conference. No jargon.</span>
        <textarea className={s.questionTextarea} placeholder="We help [who] achieve [what] by [how]…" value={data.q2} onChange={(e) => onChange("q2", e.target.value)} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q3 — Who is your ideal client?</label>
        <span className={s.questionHint}>Be as specific as possible. Job title, industry, company size, geography if relevant.</span>
        <textarea className={s.questionTextarea} placeholder="e.g. VP of Sales at Series B SaaS companies, 50–200 employees, US-based…" value={data.q3} onChange={(e) => onChange("q3", e.target.value)} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q4 — What are the top 3 questions you ask to qualify a prospect or uncover their pain?</label>
        <span className={s.questionHint}>Think about your best discovery calls — what do you ask that reveals whether someone truly has the problem you solve?</span>
        <textarea className={s.questionTextarea} placeholder="e.g. What's your biggest challenge with X right now? / How long has this been a problem? / What have you already tried?…" value={data.q4} onChange={(e) => onChange("q4", e.target.value)} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q5 — What are the top 3 obstacles standing between your client and that outcome?</label>
        <span className={s.questionHint}>What gets in the way — before they find you, or even after they've hired you?</span>
        <textarea className={s.questionTextarea} style={{ minHeight: 130 }} placeholder={"1. …\n2. …\n3. …"} value={data.q5} onChange={(e) => onChange("q5", e.target.value)} />
      </div>
    </>
  );
}

function Section2Questions({ data, onChange }) {
  return (
    <>
      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q6 — For each obstacle above, what is your specific solution?</label>
        <span className={s.questionHint}>Walk through each one. How do you actually solve it — not in theory, but in practice?</span>
        <textarea className={s.questionTextarea} style={{ minHeight: 130 }} placeholder={"Obstacle 1: …\nObstacle 2: …\nObstacle 3: …"} value={data.q6} onChange={(e) => onChange("q6", e.target.value)} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q7 — What makes you genuinely different from competitors?</label>
        <span className={s.questionHint}>Be specific. Avoid "we care more" or "we have 20 years of experience." What can you do that others can't — or won't?</span>
        <textarea className={s.questionTextarea} placeholder="What's the honest, specific answer here…" value={data.q7} onChange={(e) => onChange("q7", e.target.value)} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q8 — What specific results have you gotten for past clients?</label>
        <span className={s.questionHint}>Numbers, timelines, revenue impact — the more concrete the better.</span>
        <textarea className={s.questionTextarea} placeholder="e.g. Helped [client type] go from $X to $Y in Z months…" value={data.q8} onChange={(e) => onChange("q8", e.target.value)} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q9 — What is the most recognized client or brand you've worked with?</label>
        <span className={s.questionHint}>Even if it's under NDA, you can note the industry and size.</span>
        <textarea className={s.questionTextarea} style={{ minHeight: 80 }} placeholder="Name or describe them…" value={data.q9} onChange={(e) => onChange("q9", e.target.value)} />
      </div>
    </>
  );
}

function Section3Questions({ data, onChange }) {
  return (
    <>
      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q10 — What is the specific offer or service you want to lead with in your outreach?</label>
        <span className={s.questionHint}>This is your opening line — what's the one thing you want prospects to hear first? It doesn't have to be your full service.</span>
        <textarea className={s.questionTextarea} placeholder="e.g. A free [audit / session / strategy call] that delivers [specific value]…" value={data.q10} onChange={(e) => onChange("q10", e.target.value)} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q11 — How could we make your offer stronger or easier to say yes to?</label>
        <span className={s.questionHint}>Think: guarantees, free trials, risk reversal, speed, bonuses. What would make a skeptical prospect think "I'd be an idiot not to try this"?</span>
        <textarea className={s.questionTextarea} placeholder="What risk-reversal or guarantee could work here…" value={data.q11} onChange={(e) => onChange("q11", e.target.value)} />
      </div>

      <div className={s.questionItem}>
        <label className={s.questionLabel}>Q12 — Is there anything else your launch specialist should know before your kickoff call?</label>
        <span className={s.questionHint}>Anything unusual about your market, a past campaign that didn't work, a competitor you're often compared to, or a type of client you don't want.</span>
        <textarea className={s.questionTextarea} placeholder="Anything that would help your launch specialist show up fully prepared…" value={data.q12} onChange={(e) => onChange("q12", e.target.value)} />
      </div>
    </>
  );
}

const emptyForm = {
  name: "", company: "", email: "",
  q2: "", q3: "", q4: "", q5: "",
  q6: "", q7: "", q8: "", q9: "",
  q10: "", q11: "", q12: "",
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));
  const goNext = () => setStep((s) => s + 1);
  const goBack = () => { setError(""); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Submission failed");
      setStep(6);
    } catch {
      setError("Something went wrong submitting your form. Please try again, or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormContent = () => {
    if (step === 0) return <SectionIntro section={SECTIONS[0]} onStart={goNext} />;
    if (step === 2) return <SectionIntro section={SECTIONS[1]} onStart={goNext} />;
    if (step === 4) return <SectionIntro section={SECTIONS[2]} onStart={goNext} />;

    if (step === 6) {
      return (
        <div className={s.successScreen}>
          <div className={s.successIcon}>✓</div>
          <h2 className={s.successTitle}>You're all set.</h2>
          <p className={s.successText}>
            Your launch specialist has everything they need. Keep an eye on your inbox — we'll be in touch shortly to confirm your kickoff call details.
          </p>
        </div>
      );
    }

    const sectionIdx = SECTION_FOR_STEP[step];
    const section = SECTIONS[sectionIdx];
    const isLastSection = step === 5;

    return (
      <>
        <div className={s.questionsPanel}>
          <div className={s.sectionHeader}>
            <div className={s.sectionNumber}>{section.number}</div>
            <div>
              <div className={s.sectionTitle}>{section.title}</div>
              <div className={s.sectionSubtitle}>Section {section.number} of 3</div>
            </div>
          </div>
          {step === 1 && <Section1Questions data={formData} onChange={updateField} />}
          {step === 3 && <Section2Questions data={formData} onChange={updateField} />}
          {step === 5 && <Section3Questions data={formData} onChange={updateField} />}
        </div>

        {error && <div className={s.errorBanner}>{error}</div>}

        <div className={s.formNav}>
          <button className={s.backBtn} onClick={goBack}>← Back</button>
          <div className={s.navSpacer} />
          {isLastSection ? (
            <div className={s.submitWrap}>
              <div className={s.submitHint}>Takes about 30 seconds to submit</div>
              <button className={s.submitBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit →"}
              </button>
            </div>
          ) : (
            <button className={s.nextBtn} onClick={goNext}>Next section →</button>
          )}
        </div>
      </>
    );
  };

  const showProgress = step >= 0 && step <= 5;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <a href="https://outbound.consulting" className={s.logo} target="_blank" rel="noopener noreferrer">
            <div className={s.logoMark}>O</div>
            <span className={s.logoText}>Outbound Consulting</span>
          </a>
          <span className={s.headerPill}>Client Onboarding</span>
        </div>
      </header>

      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.heroHeadline}>Let's build something<br />great together.</h1>
          <p className={s.heroSub}>
            Before your kickoff call, we need about 8 minutes from you. The more we know going in, the better your first campaign will be.
          </p>
        </div>
      </section>

      <div className={s.belowHero}>
        <p className={s.belowHeroTextWhite}>
          Watch the two short videos below, then fill out the form. Your launch specialist will review everything before your call so we can skip the basics and get straight to strategy.
        </p>
      </div>

      <main className={s.content}>
        <div className={s.videoSection}>
          <div className={s.sectionTitleBar}>
            <div className={s.sectionTitleNum}>1</div>
            <span className={s.sectionTitleText}>Watch first</span>
          </div>
          <div className={s.videoLabel}>
            <p className={s.videoLabelText}>
              Hey — welcome to Outbound Consulting. Really glad you're here. Before your kickoff call, we put together a short form that helps our team show up prepared. It takes about 8 minutes, and I promise it's worth it — the more specific you are, the better your first campaign is going to be.
              <br /><br />
              Watch our welcome video below — it'll set the stage for everything that follows.
            </p>
          </div>
          <VideoEmbed src="https://player.vimeo.com/video/1190113576?h=e9a39981b9" label="Welcome video" />
        </div>

        <div className={s.videoSection}>
          <div className={s.sectionTitleBar}>
            <div className={s.sectionTitleNum}>2</div>
            <span className={s.sectionTitleText}>Watch next</span>
          </div>
          <div className={s.videoLabel}>
            <p className={s.videoLabelText}>
              The form you're about to fill out uses a framework called the $100M Offer — it was developed by Alex Hormozi and it's one of the best tools we've found for understanding what makes a business worth talking about.
              <br /><br />
              Don't overthink it. Just be honest and specific. Your launch specialist is going to read every word of this before your call — the more you give them, the more prepared they'll be, and the faster we can get your campaigns performing. Eight minutes. Let's go.
            </p>
          </div>
          <VideoEmbed src="https://player.vimeo.com/video/1190114117?h=5d976ac606" label="$100M Offer framework explanation video" />
        </div>

        {step < 6 && (
          <div className={s.aboveForm}>
            <div className={s.aboveFormInner}>
              <div>
                <p className={s.aboveFormTitle}>Ready? Let's do this.</p>
                <p className={s.aboveFormSub}>Answer as specifically as you can — vague answers lead to generic campaigns. Specific answers lead to meetings.</p>
              </div>
              <div className={s.timeBadge}>
                <div className={s.timeBadgeNum}>8</div>
                <div className={s.timeBadgeLabel}>minutes</div>
              </div>
            </div>
          </div>
        )}

        <div className={s.formCard}>
          {showProgress && <ProgressBar step={step} />}
          {renderFormContent()}
        </div>
      </main>
    </div>
  );
}
