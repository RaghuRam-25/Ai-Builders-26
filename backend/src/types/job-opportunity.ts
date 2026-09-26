export type JobOpportunity = {
  id: string;
  title: string;
  organization: string;
  summary: string;
  status: string;
  deadline: string;
  ageMin: number;
  ageMax: number;
  education: string;
  requiredDocuments: string[];
  officialSource: string;
  applicationUrl: string;
  accent: string;
};
