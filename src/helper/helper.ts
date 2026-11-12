import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type ToastType = "success" | "error" | "info" | "warn";

const DURATION = 3000;

export const setToastMessage = (
  type: ToastType,
  message: string,
  duration?: number,
) => {
  const options = {
    position: "top-right" as const,
    duration: duration ?? DURATION,
  };

  switch (type) {
    case "success":
      return toast.success(message, options);
    case "error":
      return toast.error(message, options);
    case "info":
      return toast(message, { ...options, icon: "ℹ️" });
    case "warn":
      return toast(message, { ...options, icon: "⚠️" });
  }
};

export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
