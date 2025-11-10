import { createContext, useContext, useState } from "react";
import axios from "axios";
import Loading from "./Loading";
type LoadingContextType = {
  loading: boolean;
  get: (url: string) => Promise<any>;
  del: (url: string) => Promise<any>;
  post: (url: string, data: any, headers: any) => Promise<any>;
  put: (url: string, data: any, headers: any) => Promise<any>;
  loadingProcess: (invoke: () => Promise<Object>) => Promise<Object>;
};
//abstract functions
let startLoading = () => {};
let endLoading = () => {};
//template method pattern
const loadingProcess = async (invoke: () => Promise<Object>) => {
  startLoading();
  const response = await invoke();
  endLoading();
  return response;
};

const LoadingContext = createContext<LoadingContextType>({
  loading: false,
  get: async (url: string) => ({}),
  del: async (url: string) => ({}),
  post: async (url: string, data: any, headers: any) => ({}),
  put: async (url: string, data: any, headers: any) => ({}),
  loadingProcess: loadingProcess,
});

export const LoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(false);
  //implement abstract functions
  startLoading = () => setLoading(true);
  endLoading = () => setLoading(false);
  const get = async (url: string) => {
    setLoading(true);
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error getting:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const del = async (url: string) => {
    setLoading(true);
    try {
      const response = await axios.delete(url);
      return response.data;
    } catch (error) {
      console.error("Error deleting:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const post = async (url: string, data: any, headers: any) => {
    setLoading(true);
    try {
      const response = await axios.post(url, data, headers);
      return response.data;
    } catch (error) {
      console.error("Error posting:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const put = async (url: string, data: any, headers: any) => {
    setLoading(true);
    try {
      const response = await axios.put(url, data, headers);
      return response.data;
    } catch (error) {
      console.error("Error putting:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingContext.Provider
      value={{ loading, get, del, post, put, loadingProcess }}
    >
      <Loading show={loading} />
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  return useContext(LoadingContext);
};
