import type { Metric } from "@/lib/metrics";

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

export interface CardWithValue extends CardDisplay {
  value: number;
  metric: Metric;
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
  metric: Metric;
}

export interface GuessResponse {
  isCorrect: boolean;
  metric: Metric;
  // Primary metric values used to determine correctness
  cardAValue: number;
  cardBValue: number;
  valueDifference: number;
  // Full triple of metrics for display in the result overlay
  cardAIih: number | null;
  cardBIih: number | null;
  cardAGihWr: number | null;
  cardBGihWr: number | null;
  cardAAlsa: number | null;
  cardBAlsa: number | null;
  cardAName: string;
  cardBName: string;
  cardAScryfallId: string;
  cardBScryfallId: string;
  setCode: string;
  correctCardId: string;
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

export interface MetricStats {
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
  metricBreakdown: Record<Metric, MetricStats>;
  biggestMiss?: {
    cardA: { name: string; value: number };
    cardB: { name: string; value: number };
    selectedName: string;
    difference: number;
    metric: Metric;
    date: string;
  };
}

export interface MistakeItem {
  id: string;
  cardA: CardWithValue;
  cardB: CardWithValue;
  selectedCardId: string;
  valueDifference: number;
  metric: Metric;
  createdAt: string;
  setCode: string;
}

// Format and set types
export type DraftFormat = "PremierDraft";

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
export interface ScryfallSet {
  code: string;
  name: string;
  released_at: string;
  set_type: string;
  parent_set_code?: string;
  digital: boolean;
  card_count: number;
}

export interface ScryfallSetsResponse {
  object: string;
  has_more: boolean;
  data: ScryfallSet[];
}

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
