import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";
import { NodeViewProps } from "@tiptap/core";

// Video Component for rendering
const VideoComponent = ({ node }: NodeViewProps) => {
  const { src, uuid } = node.attrs;
  return (
    <NodeViewWrapper as="div" style={{ margin: "1rem 0" }}>
      <video
        src={src}
        controls
        style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
        data-uuid={uuid}
      />
    </NodeViewWrapper>
  );
};

// YouTube Component for rendering
const YouTubeComponent = ({ node }: NodeViewProps) => {
  const { src } = node.attrs;
  return (
    <NodeViewWrapper as="div" style={{ margin: "1rem 0" }}>
      <iframe
        src={src}
        frameBorder="0"
        allowFullScreen
        title="YouTube video"
        width="100%"
        height="500px"
        style={{ borderRadius: "8px" }}
      />
    </NodeViewWrapper>
  );
};

// Video Node Extension
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: false,
  addAttributes() {
    return {
      src: {
        default: null,
      },
      uuid: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "video[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const src = element.getAttribute("src");
          const uuid = element.getAttribute("data-uuid") || src;
          return {
            src,
            uuid,
          };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: true,
        style: "max-width: 100%; height: auto;",
      }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoComponent);
  },
});

// YouTube Node Extension
export const YouTube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  selectable: false,
  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "youtube[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            src: element.getAttribute("src"),
          };
        },
      },
      {
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const src = element.getAttribute("src");
          if (src && src.includes("youtube.com")) {
            return { src };
          }
          return false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["youtube", mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(YouTubeComponent);
  },
});

