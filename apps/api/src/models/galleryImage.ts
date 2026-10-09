
export type GalleryImageStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface GalleryImage {
  id: string;
  publicId: string;
  secureUrl: string;
  title: string;
  status: GalleryImageStatus;
  createdAt: string;
  approvedAt: string | null;
}
