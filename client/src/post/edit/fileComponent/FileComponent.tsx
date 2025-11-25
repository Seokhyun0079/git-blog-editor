import { FileComponentProps } from "../../Props";
import UnknownFileComponent from "./UnknownFileComponent";
import ImageFileComponent from "./ImageFileComponent";
import VideoFileComponent from "./VideoFileComponent";

const FileComponent = ({ file }: FileComponentProps) => {
  // Use cached base64 preview URL
  // Check file type more accurately
  const isImage: boolean =
    file.type === "image" || file.type.startsWith("image/");
  const isVideo: boolean =
    file.type === "video" || file.type.startsWith("video/");

  if (isImage) {
    return <ImageFileComponent file={file} />;
  }
  if (isVideo) {
    return <VideoFileComponent file={file} />;
  }
  return <UnknownFileComponent file={file} />;
};

export default FileComponent;
