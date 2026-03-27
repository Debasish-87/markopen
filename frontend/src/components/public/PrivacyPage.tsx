// src/components/public/PrivacyPage.tsx
import React from "react";

interface Props {
  onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: "2.8rem" }}>
    <h2 style={{
      fontFamily: "'Syne', sans-serif",
      fontSize: "1.1rem",
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

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9, marginBottom: "1rem" }}>{children}</p>
);

const Li: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li style={{ fontSize: ".9rem", color: "#9A9490", lineHeight: 1.9, marginBottom: ".5rem", paddingLeft: ".5rem" }}>{children}</li>
);

export default function PrivacyPage({ onBack }: Props) {
  return (
    <div style={{ background: "#111108", minHeight: "100vh", color: "#F7F4EF" }}>

      {/* ── Top bar ── */}
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
        <button onClick={onBack} style={{
          background: "transparent", border: "1px solid #2a2a2a", color: "#7A7468",
          borderRadius: 8, padding: "6px 14px", fontSize: ".8rem", cursor: "pointer",
          fontFamily: "'Syne', sans-serif", fontWeight: 600, transition: "all .15s",
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
        background: "linear-gradient(160deg, rgba(212,136,10,.06) 0%, transparent 60%)",
        borderBottom: "1px solid #1e1e1e",
        padding: "60px 24px 48px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block", background: "rgba(212,136,10,.1)",
          border: "1px solid rgba(212,136,10,.25)", borderRadius: 20,
          padding: "4px 14px", fontSize: ".7rem", color: "#D4880A",
          fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "1.2rem",
        }}>Legal</div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.8rem, 5vw, 3rem)",
          fontWeight: 800, color: "#fff", letterSpacing: -1, lineHeight: 1.1, marginBottom: "1rem",
        }}>Privacy Policy</h1>
        <p style={{ fontSize: ".85rem", color: "#555" }}>Last updated: March 2026</p>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 24px 80px" }}>

        <Section title="Introduction">
          <P>
            At Markopen, we are committed to protecting your privacy. This Privacy Policy explains what information we collect,
            how we use it, and what rights you have over your data. By using Markopen, you agree to the practices described in this policy.
          </P>
          <P>
            Markopen is a real-time local shop directory built for Sambalpur University and its surrounding community.
            We take your privacy seriously and will never misuse your information.
          </P>
        </Section>

        <Section title="What Data We Collect">
          <P>We collect only the information necessary to run the platform. This includes:</P>
          <ul style={{ paddingLeft: "1.2rem", marginBottom: "1rem" }}>
            <Li><strong style={{ color: "#F7F4EF" }}>Name</strong> — when you register as a shop owner or subscriber.</Li>
            <Li><strong style={{ color: "#F7F4EF" }}>Email address</strong> — to send updates, notifications, or respond to enquiries.</Li>
            <Li><strong style={{ color: "#F7F4EF" }}>Shop details</strong> — name, category, location, opening hours, and photos (provided by shop owners).</Li>
            <Li><strong style={{ color: "#F7F4EF" }}>Usage data</strong> — pages visited, search queries, and device type, collected anonymously to improve the platform.</Li>
          </ul>
          <P>We do not collect sensitive personal information such as financial details, government IDs, or passwords in plain text.</P>
        </Section>

        <Section title="Why We Collect It">
          <P>Your data is used strictly for the following purposes:</P>
          <ul style={{ paddingLeft: "1.2rem", marginBottom: "1rem" }}>
            <Li>To list and display shops accurately on the platform.</Li>
            <Li>To send you updates when shop hours change or new shops join in your area.</Li>
            <Li>To respond to your messages or support requests.</Li>
            <Li>To improve the performance and usability of Markopen.</Li>
          </ul>
          <P>We will never use your data for advertising, spam, or any purpose beyond what is listed above.</P>
        </Section>

        <Section title="Who We Share It With">
          <P>
            We do <strong style={{ color: "#F7F4EF" }}>not</strong> sell, rent, or share your personal information with any third parties.
            Your data stays within Markopen.
          </P>
          <P>
            The only exception is if we are legally required to disclose information by law or a court order.
            In such cases, we will notify you to the extent permitted by law.
          </P>
        </Section>

        <Section title="Data Storage & Security">
          <P>
            All data is stored securely. We use industry-standard measures to protect your information from
            unauthorised access, loss, or misuse. Shop owner credentials are encrypted and never stored in plain text.
          </P>
          <P>
            We retain your data only for as long as it is necessary to provide our services. If you request deletion,
            we will remove your data promptly.
          </P>
        </Section>

        <Section title="Your Rights">
          <P>You have the right to:</P>
          <ul style={{ paddingLeft: "1.2rem", marginBottom: "1rem" }}>
            <Li>Request access to the data we hold about you.</Li>
            <Li>Request correction of inaccurate data.</Li>
            <Li>Request deletion of your data at any time.</Li>
            <Li>Unsubscribe from emails at any time.</Li>
          </ul>
          <P>To exercise any of these rights, contact us at <strong style={{ color: "#D4880A" }}>markopen2026@gmail.com</strong>.</P>
        </Section>

        <Section title="Contact">
          <P>If you have any questions about this Privacy Policy, please reach out to us:</P>
          <div style={{
            background: "rgba(212,136,10,.05)", border: "1px solid rgba(212,136,10,.15)",
            borderRadius: 12, padding: "1.2rem 1.4rem", display: "inline-block",
          }}>
            <div style={{ fontSize: ".85rem", color: "#F7F4EF", marginBottom: ".3rem" }}>✉ <a href="mailto:markopen2026@gmail.com" style={{ color: "#D4880A", textDecoration: "none" }}>markopen2026@gmail.com</a></div>
            <div style={{ fontSize: ".82rem", color: "#555" }}>📍 Sambalpur University, Odisha, India</div>
          </div>
        </Section>

      </div>
    </div>
  );
}