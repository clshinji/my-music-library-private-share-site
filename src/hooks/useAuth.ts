import { useState, useCallback } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return document.cookie.includes("music_auth=");
  });

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        return true;
      }
    } catch {
      // ネットワークエラー（fetch自体の失敗）
    }
    // ローカル開発時: API未接続のためパスワードチェックをスキップ
    if (window.location.hostname === "localhost") {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  return { isAuthenticated, login };
}
