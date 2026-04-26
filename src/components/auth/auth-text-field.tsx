"use client";

type Props = {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
};

/** Flat: solid fill, 1px border, square-ish radius — no float label overlap shadow */
export function AuthTextField({
  id,
  label,
  type = "text",
  autoComplete,
  inputMode,
  value,
  onChange,
  required,
}: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="box-border w-full border border-slate-300 bg-slate-50 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-800 focus:bg-white"
        required={required}
      />
    </div>
  );
}
