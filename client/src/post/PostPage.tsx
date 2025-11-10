import PostPageContent from "./PostPageContent";
import { PostProvider } from "../context/PostPageContext";
const PostPage = () => {
  return (
    <PostProvider>
      <PostPageContent />
    </PostProvider>
  );
};

export default PostPage;
