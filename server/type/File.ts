export interface UploadedFile {
  id: string;
  name: string;
  url: string;
}

export const FILE_STATUS = {
  DRAFT: "DRAFT",
  UPLOADED: "UPLOADED",
  DELETED: "DELETED",
} as const;

export type FileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

// Type that adds additional properties to File type (using intersection type)

export type PostFile = {
  id: string;
  name: string;
  url: string;
};

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  status: FileStatus;
}
