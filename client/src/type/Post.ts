interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  files?: PostFile[];
  contentFiles?: Array<{
    id: string;
    name: string;
    url: string;
    uuid: string;
    status?: string;
  }>;
}

interface PostFile {
  id: string;
  name: string;
  url: string;
}
