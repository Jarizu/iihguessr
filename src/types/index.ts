// Card types
export interface CardDisplay {
  id: string;
  name: string;
  imageUri: string;
  imageUriLarge: string | null;
  setCode: string;
  colors: string[];
  rarity: string;
  typeLine: string;
  manaCost: string | null;
}

export interface CardWithIwd extends CardDisplay {
  iih: number;
}

// Game types
export interface CardPair {
  id: string;
  cardA: CardDisplay;
  cardB: CardDisplay;
}

export interface CardPairResponse {
  pairs: CardPair[];
  dataAsOf: string;
}

export interface GuessRequest {
  cardAId: string;
  cardBId: string;
  selectedCardId: string;
  setCode: string;
  format: string;
}

export interface GuessResponse {
  isCorrect: boolean;
  cardAIih: number;
  cardBIih: number;
  cardAGihWr: number;
  cardBGihWr: number;
  cardAName: string;
  cardBName: string;
  cardAScryfallId: string;
  cardBScryfallId: string;
  setCode: string;
  correctCardId: string;
  iihDifference: number;
  newStreak: number;
  newTotal: number;
  newAccuracy: number;
}

// Stats types
export interface SetStats {
  total: number;
  correct: number;
  accuracy: number;
}

export interface StatsResponse {
  totalGuesses: number;
  correctGuesses: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  setBreakdown: Record<string, SetStats>;
  biggestMiss?: {
    cardA: { name: string; iih: number };
    cardB: { name: string; iih: number };
    selectedName: string;
    difference: number;
    date: string;
  };
}

export interface MistakeItem {
  id: string;
  cardA: CardWithIwd;
  cardB: CardWithIwd;
  selectedCardId: string;
  iihDifference: number;
  createdAt: string;
  setCode: string;
}

// Format and set types
export type DraftFormat = "PremierDraft";

export interface SupportedSet {
  code: string;
  name: string;
  releaseDate: string;
  dataStartDate: string;
  dataEndDate: string;
}

// 17lands API types
export interface SeventeenLandsCard {
  name: string;
  color: string;
  rarity: string;
  seen_count: number;
  avg_seen: number;
  pick_count: number;
  avg_pick: number;
  game_count: number;
  win_rate: number;
  opening_hand_win_rate: number;
  drawn_win_rate: number;
  ever_drawn_win_rate: number;
  never_drawn_win_rate: number;
  drawn_improvement_win_rate: number;
  opening_hand_game_count: number;
  drawn_game_count: number;
  ever_drawn_game_count: number;
  never_drawn_game_count: number;
}

// Scryfall API types
export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  collector_number: string;
  colors?: string[];
  color_identity: string[];
  rarity: string;
  type_line: string;
  mana_cost?: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      png: string;
      art_crop: string;
      border_crop: string;
    };
  }>;
}

export interface ScryfallSearchResponse {
  object: string;
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}
