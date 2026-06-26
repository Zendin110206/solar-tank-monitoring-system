export type LoginFormState = {
  status: "idle" | "error" | "info";
  message: string;
  submissionId: number;
};

export const initialLoginFormState: LoginFormState = {
  status: "idle",
  message: "",
  submissionId: 0,
};
