// src/components/public/AboutPage.tsx
import React from "react";

interface Props {
    onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ marginBottom: "2.8rem" }}>
        <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "#D4880A",
            letterSpacing: ".05em",
            textTransform: "uppercase",
            marginBottom: "1rem",
            paddingBottom: ".5rem",
            borderBottom: "1px solid #1e1e1e",
        }}>{title}</h2>
        {children}
    </div>
);

export default function AboutPage({ onBack }: Props) {
    return (
        <div style={{ background: "#111108", minHeight: "100vh", color: "#F7F4EF" }}>

            {/* ── Top bar ── */}
            <div style={{
                position: "sticky", top: 0, zIndex: 50,
                background: "rgba(17,17,8,.94)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid #1e1e1e",
                padding: "14px 24px",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: "transparent",
                        border: "1px solid #2a2a2a",
                        color: "#7A7468",
                        borderRadius: 8,
                        padding: "6px 14px",
                        fontSize: ".8rem",
                        cursor: "pointer",
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: ".4rem",
                        transition: "all .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#D4880A"; e.currentTarget.style.color = "#D4880A"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#7A7468"; }}
                >← Back</button>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#fff" }}>
                    Mark<span style={{ color: "#F0A420" }}>o</span>pen
                </span>
            </div>

            {/* ── Hero ── */}
            <div style={{
                background: "linear-gradient(160deg, rgba(212,136,10,.07) 0%, transparent 60%)",
                borderBottom: "1px solid #1e1e1e",
                padding: "72px 24px 60px",
                textAlign: "center",
            }}>
                <div style={{
                    display: "inline-block",
                    background: "rgba(212,136,10,.1)",
                    border: "1px solid rgba(212,136,10,.25)",
                    borderRadius: 20,
                    padding: "4px 14px",
                    fontSize: ".7rem",
                    color: "#D4880A",
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    marginBottom: "1.4rem",
                }}>About Us</div>

                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "clamp(2rem, 6vw, 3.4rem)",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: -1.5,
                    lineHeight: 1.1,
                    marginBottom: "1.2rem",
                }}>
                    Built so no one has to<br />
                    wonder where to go.
                </h1>

                <p style={{
                    fontSize: "clamp(.9rem, 2.5vw, 1.05rem)",
                    color: "#7A7468",
                    lineHeight: 1.85,
                    maxWidth: 540,
                    margin: "0 auto 2rem",
                }}>
                    A real-time local shop directory built for everyone.
                    Know what's open near you, right now — no calls, no wasted trips.
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: ".6rem", flexWrap: "wrap" }}>
                    {["📍 Bhubaneswar, Odisha", "⚡ Real-time status", "🆓 Free to use"].map(tag => (
                        <span key={tag} style={{
                            fontSize: ".75rem",
                            background: "rgba(212,136,10,.08)",
                            border: "1px solid rgba(212,136,10,.2)",
                            color: "#D4880A",
                            borderRadius: 20,
                            padding: "4px 12px",
                            fontWeight: 600,
                        }}>{tag}</span>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 24px 80px" }}>

                {/* Our Story */}
                <Section title="Our Story">
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9, marginBottom: "1rem" }}>
                        It started with a simple, frustrating problem — needing to know whether a nearby
                        shop was open. A medical store, a food stall, a café. But there was no way to find
                        out without physically walking there. Make the trip, find the shutter down, walk
                        back empty-handed.
                    </p>
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9, marginBottom: "1rem" }}>
                        This isn't just one person's problem. Every student, every resident faces the same
                        thing every day. We have powerful smartphones and fast internet, yet something as
                        basic as <em style={{ color: "#F7F4EF" }}>"is this shop open right now?"</em> had
                        no reliable answer. That gap is what Markopen was built to close.
                    </p>
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9 }}>
                        And as the world has become more uncertain, the stakes have grown. In times of
                        crisis, people desperately need to know where food and medicine are available.
                        Markopen is built to serve that need — not just on ordinary days, but on the
                        hardest ones too.
                    </p>
                </Section>

                {/* Our Mission */}
                <Section title="Our Mission">
                    <div style={{
                        background: "rgba(212,136,10,.05)",
                        border: "1px solid rgba(212,136,10,.2)",
                        borderLeft: "4px solid #D4880A",
                        borderRadius: "0 12px 12px 0",
                        padding: "1.6rem 1.8rem",
                        fontSize: "1.05rem",
                        color: "#F7F4EF",
                        fontStyle: "italic",
                        lineHeight: 1.9,
                        marginBottom: "1.6rem",
                    }}>
                        "To ensure that no person — student, resident, or family in crisis — ever has to
                        wonder where to find food, medicine, or essential supplies. Markopen exists to make
                        local commerce instantly visible, always accessible, and genuinely useful when it
                        matters most."
                    </div>
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9, marginBottom: "1rem" }}>
                        We believe that real-time local information is not a luxury — it is a necessity.
                        A student looking for a late-night meal, a parent searching for an open pharmacy,
                        or a family trying to locate available essentials — they all deserve a fast,
                        reliable answer.
                    </p>
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9 }}>
                        Markopen is committed to being that answer — building toward a future where every
                        local shop is discoverable in real time, saving wasted trips, unnecessary calls,
                        and anxious moments, every single day.
                    </p>
                </Section>

                {/* What We're Building */}
                <Section title="What We're Building">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                        {[
                            { icon: "🟢", title: "Live Open/Closed Status", desc: "Real-time updates so you always know what's actually open before you leave." },
                            { icon: "🗂️", title: "Category Browsing", desc: "Find food, medicine, services, and more — filtered exactly how you need." },
                            { icon: "📍", title: "Location & Directions", desc: "Every shop linked directly to Google Maps for instant directions." },
                            { icon: "❤️", title: "Favourites", desc: "Save your go-to shops and get notified the moment they open." },
                        ].map(item => (
                            <div key={item.title} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "1.4rem" }}>
                                <div style={{ fontSize: "1.6rem", marginBottom: ".6rem" }}>{item.icon}</div>
                                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#F7F4EF", fontSize: ".88rem", marginBottom: ".5rem" }}>{item.title}</div>
                                <p style={{ fontSize: ".8rem", color: "#7A7468", lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Contact */}
                <div style={{
                    background: "linear-gradient(135deg, rgba(212,136,10,.07) 0%, rgba(212,136,10,.02) 100%)",
                    border: "1px solid rgba(212,136,10,.2)",
                    borderRadius: 16,
                    padding: "2.4rem",
                }}>
                    <h2 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: "#F7F4EF",
                        marginBottom: ".6rem",
                        letterSpacing: "-.02em",
                    }}>Get in Touch</h2>
                    <p style={{ fontSize: ".88rem", color: "#7A7468", lineHeight: 1.8, marginBottom: "1.8rem", maxWidth: 520 }}>
                        Want to list your shop, partner with us, or just say hello? We'd love to hear from you.
                    </p>

                    <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "1.6rem" }}>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            <a href="mailto:hello@markopen.app" style={{
                                background: "#D4880A",
                                color: "#111108",
                                borderRadius: 8,
                                padding: "10px 22px",
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 700,
                                fontSize: ".85rem",
                                textDecoration: "none",
                                display: "inline-block",
                                transition: "opacity .15s",
                            }}
                                onMouseEnter={e => { (e.target as HTMLElement).style.opacity = ".85"; }}
                                onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "1"; }}
                            >✉ Email Us</a>
                            <a href="https://wa.me/" target="_blank" rel="noreferrer" style={{
                                background: "transparent",
                                color: "#F7F4EF",
                                border: "1px solid #2a2a2a",
                                borderRadius: 8,
                                padding: "10px 22px",
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 700,
                                fontSize: ".85rem",
                                textDecoration: "none",
                                display: "inline-block",
                                transition: "all .15s",
                            }}
                                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "#D4880A"; (e.target as HTMLElement).style.color = "#D4880A"; }}
                                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "#2a2a2a"; (e.target as HTMLElement).style.color = "#F7F4EF"; }}
                            >💬 WhatsApp</a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}