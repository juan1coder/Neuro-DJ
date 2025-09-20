
export enum Genre {
  MelodicTechno = "Melodic Techno",
  AmbientIndustrial = "Ambient Industrial",
  MinimalistSynthscape = "Minimalist Synthscape",
  DowntempoElectronica = "Downtempo Electronica",
  BinauralASMR = "Binaural Soundscape + ASMR",
}

export enum NeuroIntent {
  Dopamine = "Dopamine",
  Serotonin = "Serotonin",
  Acetylcholine = "Acetylcholine",
}

export enum ColorTheme {
  None = "None",
  Green = "Green",
  Yellow = "Yellow",
  Gold = "Gold",
}

export enum AppMode {
  Standard = "Standard",
  Recovery = "Recovery",
  Productivity = "Productivity",
}

export interface MusicConfig {
  genre: Genre;
  energy: number; // 0-100
  neuroIntent: NeuroIntent;
  colorTheme: ColorTheme;
  voiceLayer: boolean;
  appMode: AppMode;
}

export interface FreestyleConfig {
    prompt: string;
}

export type GenerationParams = 
    | { mode: 'Guided'; config: MusicConfig }
    | { mode: 'Freestyle'; config: FreestyleConfig };


export interface GeneratedContent {
    musicDescription: string;
    imagePrompt: string;
}