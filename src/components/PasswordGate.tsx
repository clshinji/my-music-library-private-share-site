import { useState } from "react";

interface Props {
  onLogin: (password: string) => Promise<boolean>;
}

export default function PasswordGate({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = await onLogin(password);
    if (!ok) setError(true);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-full bg-bg-primary bg-[radial-gradient(ellipse_at_center,_var(--color-bg-secondary)_0%,_var(--color-bg-primary)_70%)]">
      <form
        onSubmit={handleSubmit}
        className="bg-bg-secondary border border-bg-tertiary/50 p-8 rounded-2xl w-80 flex flex-col gap-4"
      >
        <div className="flex justify-center mb-2">
          <div className="w-14 h-14 rounded-full bg-accent-subtle flex items-center justify-center">
            <svg width="28" height="28" fill="var(--color-accent)" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center">Music Library</h1>
        <p className="text-text-secondary text-sm text-center">
          パスワードを入力してください
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          className="bg-bg-tertiary px-4 py-3 rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent focus:shadow-[0_0_12px_var(--color-accent-glow)]"
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-sm text-center">
            パスワードが正しくありません
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="bg-gradient-to-r from-accent to-accent-hover text-black font-semibold py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-accent-glow disabled:opacity-50"
        >
          {loading ? "..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
