
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  files?: PostFile[];
}

interface PostFile {
  id: string;
  name: string;
  url: string;
}
