export interface MediaFile {
  name: string;
  base64: string;
  uuid: string;
  type: string;
  status: FileStatus;
}

export const FILE_STATUS = {
  DRAFT: "DRAFT",
  UPLOADED: "UPLOADED",
  DELETED: "DELETED"
} as const;

export type FileStatus = typeof FILE_STATUS[keyof typeof FILE_STATUS];