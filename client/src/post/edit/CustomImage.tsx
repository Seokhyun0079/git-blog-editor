import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      uuid: {
        default: null,
        parseHTML: (element) => {
          if (typeof element === "string") return null;
          return (
            element.getAttribute("data-uuid") || element.getAttribute("src")
          );
        },
        renderHTML: (attributes) => {
          if (!attributes.uuid) {
            return {};
          }
          return {
            "data-uuid": attributes.uuid,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "img[src]",
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
      "img",
      mergeAttributes(HTMLAttributes, {
        style: "max-width: 100%; height: auto; display: block; margin: 1rem 0;",
      }),
    ];
  },
});

