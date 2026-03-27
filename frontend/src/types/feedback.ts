export interface FeedbackFormData {
  name: string;
  email: string;
  message: string;
  starRating: number;
  types: FeedbackType[];
}

export type FeedbackType =
  | "General"
  | "Bug Report"
  | "Feature Idea"
  | "Shop Issue"
  | "Compliment";

export const FEEDBACK_TYPES: { label: FeedbackType; icon: string }[] = [
  { label: "General", icon: "💬" },
  { label: "Bug Report", icon: "🐛" },
  { label: "Feature Idea", icon: "💡" },
  { label: "Shop Issue", icon: "🏪" },
  { label: "Compliment", icon: "👍" }
];