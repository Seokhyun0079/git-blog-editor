export const FILE_STATUS = {
  DRAFT: "DRAFT",
  UPLOADED: "UPLOADED",
};

export type FileStatus = typeof FILE_STATUS[keyof typeof FILE_STATUS];