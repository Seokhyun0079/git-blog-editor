import PostPageContent from "./PostPageContent";
import { PostProvider } from "../context/PostPageContext";

type PostPageProps = {
  onOpenSettings: () => void;
};

const PostPage = ({ onOpenSettings }: PostPageProps) => {
  return (
    <PostProvider>
      <PostPageContent onOpenSettings={onOpenSettings} />
    </PostProvider>
  );
};

export default PostPage;
