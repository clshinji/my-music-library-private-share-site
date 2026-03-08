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
    <div className="flex items-center justify-center h-full bg-bg-primary">
      <form
        onSubmit={handleSubmit}
        className="bg-bg-secondary p-8 rounded-2xl w-80 flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-center">Music Library</h1>
        <p className="text-text-secondary text-sm text-center">
          パスワードを入力してください
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          className="bg-bg-tertiary px-4 py-3 rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent"
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
          className="bg-accent hover:bg-accent-hover text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
