import { useState, useEffect, useCallback, useRef } from "react";
import { useError } from "../context/ErrorContext.jsx";

export function useAsync(asyncFn, deps = [], options = {}) {
  const {
    immediate = true,    // run on mount automatically
    onSuccess,           // optional callback
    silent    = false,   // suppress global toast on error
  } = options;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  const { handleError } = useError();

  // Keep a ref to asyncFn so the effect doesn't re-fire when the
  // function reference changes between renders
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(...args);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      if (!silent) handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { data, loading, error, execute, setData };
}
