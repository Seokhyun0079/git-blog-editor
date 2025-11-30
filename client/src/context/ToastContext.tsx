import { createContext, useContext } from "react";
import toast, { Toaster } from "react-hot-toast";

export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  LOADING: "loading",
  INFO: "info",
} as const;

type ToastType = (typeof TOAST_TYPES)[keyof typeof TOAST_TYPES];

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const TOAST_POSITION = "top-right" as const;

const TOAST_OPTIONS = {
  duration: 3000,
  style: {
    background: "#363636",
    color: "#fff",
  },
  success: {
    duration: 3000,
    iconTheme: {
      primary: "#4ade80",
      secondary: "#fff",
    },
  },
  error: {
    duration: 4000,
    iconTheme: {
      primary: "#ef4444",
      secondary: "#fff",
    },
  },
} as const;

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const showToast = (
    message: string,
    type: ToastType = TOAST_TYPES.SUCCESS
  ) => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        toast.success(message);
        break;
      case TOAST_TYPES.ERROR:
        toast.error(message);
        break;
      case TOAST_TYPES.LOADING:
        toast.loading(message);
        break;
      case TOAST_TYPES.INFO:
        toast(message);
        break;
      default:
        toast(message);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toaster position={TOAST_POSITION} toastOptions={TOAST_OPTIONS} />
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  return useContext(ToastContext);
};
