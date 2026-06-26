export type RegisterFieldValues = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  position: string;
  stoLocation: string;
  agreementAccepted: boolean;
};

export type RegisterFormState = {
  status: "idle" | "error" | "info";
  message: string;
  submissionId: number;
  fields: RegisterFieldValues;
};

export const initialRegisterFormState: RegisterFormState = {
  status: "idle",
  message: "",
  submissionId: 0,
  fields: {
    fullName: "",
    username: "",
    email: "",
    phone: "",
    position: "",
    stoLocation: "",
    agreementAccepted: false,
  },
};
