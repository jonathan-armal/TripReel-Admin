import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { operatorAuthAPI } from "../services/api";

const OperatorAuthContext = createContext(null);

export function OperatorAuthProvider({ children }) {
  const [operator, setOperator] = useState(() => {
    try {
      const stored = localStorage.getItem("operatorUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [operatorLoading, setOperatorLoading] = useState(true);

  // Guard: only run session restore once on mount
  const didRestoreRef = useRef(false);

  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;

    const token = localStorage.getItem("operatorToken");
    if (!token) {
      setOperatorLoading(false);
      return;
    }

    operatorAuthAPI
      .getMe()
      .then((res) => {
        const op = res.data.operator;
        setOperator(op);
        localStorage.setItem("operatorUser", JSON.stringify(op));
      })
      .catch((err) => {
        // Only clear session on 401 (token expired/invalid)
        // Keep session on network errors so operator stays logged in offline
        if (err.response?.status === 401) {
          localStorage.removeItem("operatorToken");
          localStorage.removeItem("operatorUser");
          setOperator(null);
        }
        // For network errors, keep the stored operator data
      })
      .finally(() => {
        setOperatorLoading(false);
      });
  }, []); // empty deps — runs exactly once on mount

  const login = async (email, password) => {
    const res = await operatorAuthAPI.login({ email, password });
    const { token, operator: operatorData } = res.data;
    localStorage.setItem("operatorToken", token);
    localStorage.setItem("operatorUser", JSON.stringify(operatorData));
    setOperator(operatorData);
    return operatorData;
  };

  const logout = () => {
    localStorage.removeItem("operatorToken");
    localStorage.removeItem("operatorUser");
    setOperator(null);
  };

  const register = async (data) => {
    const res = await operatorAuthAPI.register(data);
    const { token, operator: operatorData } = res.data;
    localStorage.setItem("operatorToken", token);
    localStorage.setItem("operatorUser", JSON.stringify(operatorData));
    setOperator(operatorData);
    return operatorData;
  };

  const refreshOperator = useCallback(async () => {
    try {
      const res = await operatorAuthAPI.getMe();
      const updated = res.data.operator;
      setOperator(updated);
      localStorage.setItem("operatorUser", JSON.stringify(updated));
      return updated;
    } catch {
      return null;
    }
  }, []);

  return (
    <OperatorAuthContext.Provider
      value={{
        operator,
        operatorLoading,
        login,
        logout,
        register,
        refreshOperator,
      }}
    >
      {children}
    </OperatorAuthContext.Provider>
  );
}

export const useOperatorAuth = () => {
  const ctx = useContext(OperatorAuthContext);
  if (!ctx)
    throw new Error("useOperatorAuth must be used inside OperatorAuthProvider");
  return ctx;
};
