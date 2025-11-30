import { useState, useEffect, useRef } from "react";
import { Container, Box } from "@mui/material";
import PostEditor from "./PostEditor";
import PostList from "./PostList";
import { FILE_STATUS } from "../type/File";
import Header from "./Header";
import { useLoadingContext } from "../context/LoadingContext";
import { usePostPageContext } from "../context/PostPageContext";
import { Post } from "../type/Post";
import { PostFile } from "../type/File";
import { processPost } from "./FileAdapter";

function PostPageContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const showEditorRef = useRef(showEditor);
  const { get } = useLoadingContext();
  const { setOnPostCreated, setOnPostDeleted, setOnPostClicked } =
    usePostPageContext();
  // Mount: fetch posts and setup back button listener
  useEffect(() => {
    fetchPosts();
    setGlobalHandlers();
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle editor state changes
  useEffect(() => {
    // Sync showEditor state to ref
    showEditorRef.current = showEditor;

    // Add state to history when navigating to editor
    if (showEditor) {
      window.history.pushState({ showEditor: true }, "", window.location.href);
    }
  }, [showEditor]);

  // Detect browser back button
  const handlePopState = () => {
    // When back button is pressed
    if (showEditorRef.current) {
      setShowEditor(false);
      setSelectedPost(null);
    }
  };

  const fetchPosts = async (): Promise<void> => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const response = await get(`${apiUrl}/api/posts`);
    console.log("response", response);
    const sort = (a: Post, b: Post) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    setPosts(response.data.sort(sort).map(processPost));
  };

  const HeaderButtonClick = () => {
    console.log("HeaderButtonClick");
    setSelectedPost(null);
    setShowEditor(!showEditor);
  };

  const handlePostCreated = (): void => {
    console.log("handlePostCreated");
    setShowEditor(false);
    fetchPosts();
  };

  const handlePostDelete = (): void => {
    fetchPosts();
  };

  const handlePostClick = (post: Post): void => {
    console.log("handlePostClick", post);
    post.contentFiles = post.contentFiles?.map((contentFile: PostFile) => {
      return {
        ...contentFile,
        status: FILE_STATUS.UPLOADED,
      };
    });
    setSelectedPost(post);
    setShowEditor(true);
  };

  const setGlobalHandlers = () => {
    setOnPostCreated(handlePostCreated);
    setOnPostDeleted(handlePostDelete);
    setOnPostClicked(handlePostClick);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header showEditor={showEditor} clickButton={HeaderButtonClick} />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <PostEditor show={showEditor} selectedPost={selectedPost} />
        <PostList show={!showEditor} posts={posts} />
      </Container>
    </Box>
  );
}

export default PostPageContent;
