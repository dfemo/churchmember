"use client";

type Props = {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
};

function FieldIcon({ kind }: { kind: "email" | "password" | "text" | "phone" }) {
  if (kind === "password") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-slate-400">
        <path
          fill="currentColor"
          d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V6Zm7 12H7v-8h10v8Z"
        />
      </svg>
    );
  }
  if (kind === "email") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-slate-400">
        <path
          fill="currentColor"
          d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"
        />
      </svg>
    );
  }
  if (kind === "phone") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-slate-400">
        <path
          fill="currentColor"
          d="M6.6 10.8a15.08 15.08 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.36 11.36 0 0 0 3.56.56 1 1 0 0 1 1 1V21a1 1 0 0 1-1 1A18 18 0 0 1 2 5a1 1 0 0 1 1-1h3.28a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .56 3.56 1 1 0 0 1-.24 1l-2.2 2.24Z"
        />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-slate-400">
      <path
        fill="currentColor"
        d="M11 2a9 9 0 1 0 5.59 16.05l4.7 4.7 1.41-1.41-4.7-4.7A9 9 0 0 0 11 2Zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z"
      />
    </svg>
  );
}

export function AuthTextField({
  id,
  label,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  hint,
  value,
  onChange,
  required,
}: Props) {
  const iconKind =
    type === "email" ? "email" : type === "password" ? "password" : type === "tel" ? "phone" : "text";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-600">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition focus-within:border-cyan-400 focus-within:bg-white">
        <FieldIcon kind={iconKind} />
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          required={required}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
