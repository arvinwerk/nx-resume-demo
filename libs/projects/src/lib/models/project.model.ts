export interface ProjectModel {
  id: number;
  company: string;
  title: string;
  shortDescription: string;
  longDescription: string | null;
  keywords: string[];
  images: string[];
}
