export interface Battle {
  id: string;
  name_ar: string;
  name_en: string;
  year_hijri: number;
  year_gregorian: number;
  location_ar: string;
  location_en: string;
  description_ar: string;
  description_en: string;
  outcome: 'victory' | 'tactical_retreat' | 'draw';
  muslim_forces: number;
  enemy_forces: number;
  significance: string[];
}

