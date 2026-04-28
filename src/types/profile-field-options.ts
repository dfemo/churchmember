export type ProfileFieldOptionsBundle = {
  titles: string[];
  positions: string[];
  departments: string[];
};

export type ProfileFieldOptionAdminRow = {
  id: number;
  kind: string;
  value: string;
  sortOrder: number;
};

export type AddProfileFieldOptionRequest = {
  kind: "Title" | "Position" | "Department";
  value: string;
};
