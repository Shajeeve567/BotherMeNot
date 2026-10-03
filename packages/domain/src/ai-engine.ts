
export interface FormattedMessage { text: string }
export interface DeliveryDecision {
  deliver: boolean;
  urgency: "high" | "medium" | "low";
  reason: string;
}

export interface AIOutput{
  decision: DeliveryDecision,
  action: string,
  channelMessage: string
}