// src/components/public/TermsPage.tsx
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

export default function TermsPage({ onBack }: Props) {
    return (
        <div style={{ background: "#111108", minHeight: "100vh", color: "#F7F4EF" }}>

            {/* Top bar */}
            <div style={{
                position: "sticky", top: 0, zIndex: 50,
                background: "rgba(17,17,8,.92)",
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
                        transition: "all .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#D4880A"; e.currentTarget.style.color = "#D4880A"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#7A7468"; }}
                >← Back</button>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#fff" }}>
                    Mark<span style={{ color: "#F0A420" }}>o</span>pen
                </span>
            </div>

            {/* Hero */}
            <div style={{
                background: "linear-gradient(160deg, rgba(212,136,10,.06) 0%, transparent 60%)",
                borderBottom: "1px solid #1e1e1e",
                padding: "60px 24px 48px",
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
                    marginBottom: "1.2rem",
                }}>Legal</div>

                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "clamp(1.8rem, 5vw, 3rem)",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: -1,
                    lineHeight: 1.1,
                    marginBottom: "1rem",
                }}>Terms of Use</h1>
                <p style={{ fontSize: ".85rem", color: "#555" }}>Last updated: March 2026</p>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 24px 80px" }}>

                <Section title="1. Acceptance of Terms">
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9 }}>
                        By accessing or using Markopen, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, please do not use our platform. These terms apply to all visitors, users, and shop owners who access or use Markopen.
                    </p>
                </Section>

                <Section title="2. Who Can Use Markopen">
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9 }}>
                        Markopen is open to everyone — students, residents, and shop owners in and around Sambalpur University. You may browse the directory freely without creating an account. Shop owners who wish to list their shop must register and provide accurate information about their business.
                    </p>
                </Section>

                <Section title="3. Shop Owner Responsibilities">
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9, marginBottom: "1rem" }}>
                        If you are a shop owner listing your business on Markopen, you agree to:
                    </p>
                    <ul style={{ paddingLeft: "1.4rem", display: "flex", flexDirection: "column", gap: ".7rem" }}>
                        {[
                            "Provide accurate, truthful, and up-to-date information about your shop, including name, category, location, and opening hours.",
                            "Update your shop status promptly when your hours change, or when your shop is temporarily or permanently closed.",
                            "Not post misleading, false, or offensive content in your shop listing.",
                            "Not use Markopen to promote illegal activities or services.",
                        ].map((item, i) => (
                            <li key={i} style={{ fontSize: ".88rem", color: "#9A9490", lineHeight: 1.8 }}>{item}</li>
                        ))}
                    </ul>
                </Section>

                <Section title="4. Our Commitment to Accuracy">
                    <div style={{
                        background: "rgba(212,136,10,.05)",
                        border: "1px solid rgba(212,136,10,.2)",
                        borderLeft: "4px solid #D4880A",
                        borderRadius: "0 12px 12px 0",
                        padding: "1.4rem 1.6rem",
                        fontSize: ".9rem",
                        color: "#F7F4EF",
                        lineHeight: 1.85,
                        marginBottom: "1rem",
                    }}>
                        We strive to ensure all shop information on Markopen is accurate and up to date. If you find any incorrect details, please report it to us at <strong>markopen2026@gmail.com</strong> and we will fix it promptly.
                    </div>
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9 }}>
                        We take accuracy seriously because we know people rely on Markopen to make real decisions — especially in urgent situations. We actively monitor listings and work with shop owners to keep information current.
                    </p>
                </Section>

                <Section title="5. Content & Intellectual Property">
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9 }}>
                        All content on Markopen — including the design, logo, text, and features — is the property of Markopen and its founders. You may not copy, reproduce, or distribute any part of the platform without prior written permission. Shop owners retain ownership of the information and images they upload, but grant Markopen the right to display this content on the platform.
                    </p>
                </Section>

                <Section title="6. Platform Conduct">
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9, marginBottom: "1rem" }}>
                        Users of Markopen agree not to:
                    </p>
                    <ul style={{ paddingLeft: "1.4rem", display: "flex", flexDirection: "column", gap: ".7rem" }}>
                        {[
                            "Attempt to hack, disrupt, or damage the platform or its data.",
                            "Use automated tools or bots to scrape or collect data from Markopen.",
                            "Submit false reports or abuse the reporting system.",
                            "Impersonate another person, shop, or organisation.",
                        ].map((item, i) => (
                            <li key={i} style={{ fontSize: ".88rem", color: "#9A9490", lineHeight: 1.8 }}>{item}</li>
                        ))}
                    </ul>
                </Section>

                <Section title="7. Changes to These Terms">
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9 }}>
                        We may update these Terms of Use from time to time as Markopen grows and evolves. Any changes will be posted on this page with an updated date. Continued use of the platform after changes are made means you accept the updated terms.
                    </p>
                </Section>

                <Section title="8. Contact Us">
                    <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9, marginBottom: "1.2rem" }}>
                        If you have any questions about these terms or want to report an issue, please reach out to us:
                    </p>
                    <a href="mailto:markopen2026@gmail.com" style={{
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
                    >✉ markopen2026@gmail.com</a>
                </Section>

            </div>
        </div>
    );
}