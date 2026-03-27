import "../../styles/feedback.css";
import React, { useState } from "react";
import axios from "axios";

import {
    FEEDBACK_TYPES,
    FeedbackFormData,
    FeedbackType
} from "../../types";

import { StarRating } from "../shared";
import {
    validateEmail,
    validateDescription,
    charCount,
} from "../../lib/validation";

type SubmitStatus = "idle" | "loading" | "success" | "error";

interface FieldErrors {
    name?: string;
    email?: string;
    message?: string;
}

export default function FeedbackSection() {

    const [form, setForm] = useState<FeedbackFormData>({
        name: "",
        email: "",
        message: "",
        starRating: 0,
        types: []
    });

    const [status, setStatus] = useState<SubmitStatus>("idle");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const updateField = <K extends keyof FeedbackFormData>(
        field: K,
        value: FeedbackFormData[K]
    ) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field on change
        if (fieldErrors[field as keyof FieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const toggleType = (type: FeedbackType) => {
        setForm(prev => ({
            ...prev,
            types: prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type]
        }));
    };

    const validate = (): boolean => {
        const errs: FieldErrors = {};

        if (!form.name.trim()) errs.name = "Your name is required.";

        const emailResult = validateEmail(form.email);
        if (!emailResult.valid) errs.email = emailResult.message;

        if (!form.message.trim()) {
            errs.message = "Please enter a message.";
        } else {
            const descResult = validateDescription(form.message);
            if (!descResult.valid) errs.message = descResult.message;
        }

        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validate()) return;
        setStatus("loading");
        try {
            await axios.post("/api/feedback", form);
            setStatus("success");
            setForm({ name: "", email: "", message: "", starRating: 0, types: [] });
            setFieldErrors({});
        } catch {
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <section className="feedback-section feedback-success">
                <div className="tick">🎉</div>
                <h3>Thank you!</h3>
                <p>Your feedback has been received.</p>
            </section>
        );
    }

    const msgCounter = charCount(form.message, 500);

    return (
        <section className="feedback-section">

            <h2>💬 Share Your Feedback</h2>

            <p className="feedback-subtext">
                Help us make Markopen better for everyone
            </p>

            <form onSubmit={handleSubmit} noValidate>

                {/* NAME + EMAIL */}

                <div className="form-grid">

                    <div className="form-group">
                        <label className="form-label">Your Name *</label>
                        <input
                            className={`form-input${fieldErrors.name ? " error" : ""}`}
                            placeholder="John Doe"
                            value={form.name}
                            onChange={(e) => updateField("name", e.target.value)}
                        />
                        {fieldErrors.name && (
                            <p className="field-error-text">{fieldErrors.name}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                            className={`form-input${fieldErrors.email ? " error" : ""}`}
                            placeholder="john@email.com"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateField("email", e.target.value)}
                        />
                        {fieldErrors.email && (
                            <p className="field-error-text">{fieldErrors.email}</p>
                        )}
                    </div>

                </div>

                {/* STAR RATING */}

                <div className="star-row">
                    <StarRating
                        value={form.starRating}
                        onChange={(r) => updateField("starRating", r)}
                    />
                </div>

                {/* FEEDBACK TYPES */}

                <div className="type-grid">
                    {FEEDBACK_TYPES.map((t) => (
                        <button
                            key={t.label}
                            type="button"
                            className={`type-btn ${form.types.includes(t.label) ? "active" : ""}`}
                            onClick={() => toggleType(t.label)}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* MESSAGE */}

                <div className="form-group">
                    <div className="form-label-row">
                        <label className="form-label">Message *</label>
                        <span
                            className="char-counter"
                            style={{
                                color: msgCounter.over
                                    ? "#ef4444"
                                    : msgCounter.remaining <= 80
                                        ? "#f59e0b"
                                        : "#94a3b8",
                            }}
                        >
                            {msgCounter.remaining} / 500
                        </span>
                    </div>

                    <textarea
                        className={`form-input form-textarea${fieldErrors.message ? " error" : ""}`}
                        placeholder="Tell us what you think… (max 500 characters)"
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                    />
                    {fieldErrors.message && (
                        <p className="field-error-text">{fieldErrors.message}</p>
                    )}
                </div>

                {/* SUBMIT */}

                <button
                    className="submit-btn"
                    type="submit"
                    disabled={status === "loading"}
                    style={{ opacity: status === "loading" ? 0.7 : 1 }}
                >
                    {status === "loading" ? "Sending..." : "Send Feedback 🚀"}
                </button>

                {status === "error" && (
                    <p className="error-text">✕ Failed to send feedback. Please try again.</p>
                )}

            </form>

        </section>
    );
}