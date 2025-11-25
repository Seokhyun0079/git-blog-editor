import { createContext, useContext, useState } from "react";
import axios from "axios";
import Loading from "./Loading";
type LoadingContextType = {
  loading: number;
  get: (url: string) => Promise<any>;
  del: (url: string) => Promise<any>;
  post: (url: string, data: any, headers: any) => Promise<any>;
  put: (url: string, data: any, headers: any) => Promise<any>;
  loadingProcess: (invoke: () => Promise<Object>) => Promise<Object>;
};

const LoadingContext = createContext<LoadingContextType>({
  loading: 0,
  get: async (url: string) => ({}),
  del: async (url: string) => ({}),
  post: async (url: string, data: any, headers: any) => ({}),
  put: async (url: string, data: any, headers: any) => ({}),
  loadingProcess: async (invoke: () => Promise<Object>) => {
    return await invoke();
  },
});

export const LoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(0);
  //implement abstract functions
  const loadingProcess = async (invoke: () => Promise<Object>) => {
    setLoading((prev) => prev + 1);
    try {
      return await invoke();
    } finally {
      setLoading((prev) => prev - 1);
    }
  };

  const get = async (url: string) => {
    return loadingProcess(async () => {
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error("Error getting:", error);
        throw error;
      }
    });
  };

  const del = async (url: string) => {
    return loadingProcess(async () => {
      try {
        const response = await axios.delete(url);
        return response.data;
      } catch (error) {
        console.error("Error deleting:", error);
        throw error;
      }
    });
  };

  const post = async (url: string, data: any, headers: any) => {
    return loadingProcess(async () => {
      try {
        const response = await axios.post(url, data, headers);
        return response.data;
      } catch (error) {
        console.error("Error posting:", error);
        throw error;
      }
    });
  };

  const put = async (url: string, data: any, headers: any) => {
    return loadingProcess(async () => {
      try {
        const response = await axios.put(url, data, headers);
        return response.data;
      } catch (error) {
        console.error("Error putting:", error);
        throw error;
      }
    });
  };

  return (
    <LoadingContext.Provider
      value={{ loading, get, del, post, put, loadingProcess }}
    >
      <Loading show={loading > 0} />
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  return useContext(LoadingContext);
};
