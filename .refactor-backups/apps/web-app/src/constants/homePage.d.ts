declare module "@/constants/homePage" {
  export interface FeatureCardDef { icon: any; title: string; description: string; color: string }
  export interface StatDef { value: string; label: string }
  export const HOME_FEATURES: FeatureCardDef[];
  export const HOME_STATS: StatDef[];
}
