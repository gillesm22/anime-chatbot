import type { Character } from "./types";
import { arisu } from "./arisu";
import { marin } from "./marin";
import { nao } from "./nao";

export const characters: Record<string, Character> = {
  arisu,
  marin,
  nao,
};

export function getCharacter(id: string): Character | undefined {
  return characters[id];
}

export type { Character, Expression, ExpressionMapping, ThemeColors, SpriteConfig } from "./types";
