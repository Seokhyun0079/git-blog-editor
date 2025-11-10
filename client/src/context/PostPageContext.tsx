import { createContext, useCallback, useContext, useRef } from "react";

type PostPageContextType = {
  onPostCreated: () => void;
  onPostDeleted: () => void;
  onPostClicked: (post: Post) => void;
  setOnPostCreated: (onPostCreated: () => void) => void;
  setOnPostDeleted: (onPostDeleted: () => void) => void;
  setOnPostClicked: (onPostClicked: (post: Post) => void) => void;
};

const defaultEvent = () => {
  console.log("event not set");
  return;
};

const defaultPostEvent = (post: Post) => {
  console.log("event not set");
  console.log("post:", post);
  return;
};

const PostPageContext = createContext<PostPageContextType>({
  onPostCreated: defaultEvent,
  onPostDeleted: defaultEvent,
  onPostClicked: defaultPostEvent,
  setOnPostCreated: () => {},
  setOnPostDeleted: () => {},
  setOnPostClicked: () => {},
});

export const PostProvider = ({ children }: { children: React.ReactNode }) => {
  const postCreatedRef = useRef<() => void>(defaultEvent);
  const postDeletedRef = useRef<() => void>(defaultEvent);
  const postClickedRef = useRef<(post: Post) => void>(defaultPostEvent);

  const onPostCreated = useCallback(() => {
    postCreatedRef.current();
  }, []);

  const onPostDeleted = useCallback(() => {
    postDeletedRef.current();
  }, []);

  const onPostClicked = useCallback((post: Post) => {
    postClickedRef.current(post);
  }, []);

  const setOnPostCreated = useCallback((onPostCreated: () => void) => {
    postCreatedRef.current = onPostCreated;
  }, []);

  const setOnPostDeleted = useCallback((onPostDeleted: () => void) => {
    postDeletedRef.current = onPostDeleted;
  }, []);

  const setOnPostClicked = useCallback(
    (onPostClicked: (post: Post) => void) => {
      postClickedRef.current = onPostClicked;
    },
    []
  );

  return (
    <PostPageContext.Provider
      value={{
        onPostCreated,
        onPostDeleted,
        onPostClicked,
        setOnPostCreated,
        setOnPostDeleted,
        setOnPostClicked,
      }}
    >
      {children}
    </PostPageContext.Provider>
  );
};

export const usePostPageContext = () => {
  return useContext(PostPageContext);
};
