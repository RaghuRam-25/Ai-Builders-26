export type TrainingProgram = {
  id: string;
  title: string;
  provider: string;
  summary: string;
  ageMin: number;
  ageMax: number;
  requiredDocuments: string[];
  source: string;
  applicationUrl: string;
  accent: string;
};
