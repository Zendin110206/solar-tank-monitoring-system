export type HelpdeskSessionStatus = "open" | "closed";
export type HelpdeskSenderType = "visitor" | "user" | "admin" | "system";

export type HelpdeskMessage = {
  id: string;
  sessionId: string;
  senderType: HelpdeskSenderType;
  senderLabel: string;
  body: string;
  createdAt: string;
};

export type HelpdeskSession = {
  id: string;
  sessionCode: string;
  requesterEmail: string | null;
  requesterName: string | null;
  sourcePath: string | null;
  status: HelpdeskSessionStatus;
  lastMessageAt: string;
  closedAt: string | null;
  createdAt: string;
};

export type HelpdeskSessionBundle = {
  session: HelpdeskSession;
  messages: HelpdeskMessage[];
  sessionToken: string;
};
