import type { Expression, SpriteConfig, BodyPose } from "@/lib/characters/types";

export interface SpritePaths {
  body: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
}

export function getSpritePaths(
  sprite: SpriteConfig,
  expression: Expression,
  pose: BodyPose
): SpritePaths {
  const mapping = sprite.expressionMap[expression];
  const base = sprite.basePath;

  return {
    body: `${base}/body-${pose}.png`,
    eyes: `${base}/eyes-${mapping.eyes}.png`,
    eyebrows: `${base}/eyebrows-${mapping.eyebrows}.png`,
    mouth: `${base}/mouth-${mapping.mouth}.png`,
  };
}

const ALL_EXPR = "neutral|happy|thinking|surprised|sad|smirk|laugh|angry|flustered|devoted|teasing|sleepy|excited|shy|jealous|crying";
const EXPRESSION_REGEX = new RegExp(`^\\s*\\[(${ALL_EXPR})\\]\\s*[\\n]?`);
const EXPRESSION_ANYWHERE = new RegExp(`\\[(${ALL_EXPR})\\]`, "g");

export function parseExpressionTag(response: string): {
  expression: Expression;
  text: string;
} {
  const match = response.match(EXPRESSION_REGEX);
  if (!match) {
    return { expression: "neutral", text: stripExpressionTags(response) };
  }
  const expression = match[1] as Expression;
  const text = stripExpressionTags(response.slice(match[0].length)).trim();
  return { expression, text };
}

export function stripExpressionTags(text: string, trim = true): string {
  let result = text
    .replace(EXPRESSION_ANYWHERE, " ")
    .replace(/  +/g, " ");
  if (trim) {
    result = result.replace(/^\s*\n/, "").trim();
  }
  return result;
}
