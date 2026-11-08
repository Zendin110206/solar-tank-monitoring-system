import { AUTH_CONTENT } from "@/components/auth/auth-content";
import { AuthLayout } from "@/components/auth/auth-layout";

const copy = AUTH_CONTENT.signIn;
const FIELD_CLASS =
  "block h-[max(44px,calc(58*var(--auth-u)))] w-full animate-pulse rounded-[calc(8*var(--auth-u))] bg-zinc-100";
const LABEL_CLASS =
  "mb-[calc(11*var(--auth-u))] block h-[calc(18*var(--auth-u))] animate-pulse rounded bg-zinc-100";

export default function LoginLoading() {
  return (
    <AuthLayout description={copy.description} heading={copy.heading}>
      <div
        aria-busy="true"
        aria-label={copy.loadingLabel}
        className="mt-[calc(32*var(--auth-u))]"
        role="status"
      >
        <span className={`${LABEL_CLASS} w-[calc(220*var(--auth-u))]`} />
        <span className={FIELD_CLASS} />
        <span
          className={`${LABEL_CLASS} mt-[calc(15*var(--auth-u))] w-[calc(96*var(--auth-u))]`}
        />
        <span className={FIELD_CLASS} />
        <span className="mt-[calc(25*var(--auth-u))] block h-[max(44px,calc(58*var(--auth-u)))] w-full animate-pulse rounded-lg bg-brand-red/15" />
        <span className="mt-[calc(12*var(--auth-u))] block h-11 w-[calc(170*var(--auth-u))] animate-pulse rounded bg-zinc-100" />
      </div>
    </AuthLayout>
  );
}
