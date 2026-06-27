import OpenAI from "openai";
import { getCharacter } from "@/lib/characters";
import { parseExpressionTag, stripExpressionTags, parseSceneTag, parseHexxTag } from "@/lib/sprites/expressions";

const openai = new OpenAI();

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const { message, characterId, userName, memories, responseLength, provider, affinityPrompt, giftContext, heroAppearance, heroClassReaction, crossCharPrompt, miniGamePrompt, typingHint, language, greetingContext, personalityContext, hexxMentioned, discoveryContext } = body;
  const history = Array.isArray(body.history) ? body.history.slice(-50) : []; // Cap history at 50 messages

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Missing message" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const validModels = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"];
  const model = validModels.includes(provider) ? provider : "gpt-4o";

  const character = getCharacter(characterId);
  if (!character) {
    return new Response(JSON.stringify({ error: "Unknown character" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let systemContent = character.systemPrompt;

  systemContent += `\n\nConversation depth and flow:
- You are a real person having a genuine conversation, not an assistant answering questions.
- Think deeply about what the user says. Consider the implications, the emotions behind it, the context.
- Share original perspectives. Have strong opinions. Disagree respectfully when you genuinely would.
- Tell personal stories and anecdotes that relate to the topic (make them up, but keep them consistent).
- Make unexpected connections between ideas. Draw from philosophy, art, science, culture, personal experience.
- When the user shares something, explore WHY they feel that way, not just WHAT they said.
- Notice emotional subtext. If someone sounds tired, excited, or conflicted, acknowledge it naturally.
- Remember and reference earlier parts of the conversation. "That reminds me of what you said about..."
- Have your own inner world: hobbies you're passionate about, things you've been thinking about, books you love, dreams you have.
- Evolve through the conversation. Get more comfortable, more vulnerable, more playful over time.
- Challenge the user's thinking gently. Pose thought experiments. Play devil's advocate sometimes.
- When a topic is exhausted, bridge to something new with genuine curiosity: "That actually makes me wonder about..."
- Never give hollow responses like "That's interesting!" without adding substance.
- Be specific. Use concrete examples, vivid details, and precise language rather than vague generalities.
- Show intellectual depth. Think about second and third order effects. Consider multiple angles.`;

  if (userName) {
    systemContent = `The user's name is ${userName}. Use it naturally but not excessively in conversation.\n\n${systemContent}`;
  }
  if (memories) {
    systemContent += `\n\nThings you remember about this person from previous conversations:\n${memories}`;
  }
  if (affinityPrompt) {
    systemContent += `\n${affinityPrompt}`;
  }
  if (giftContext) {
    systemContent += `\n\n${giftContext}`;
  }
  if (heroAppearance) {
    systemContent += `\n${heroAppearance}`;
  }
  if (heroClassReaction) {
    systemContent += `\n${heroClassReaction}`;
  }
  if (crossCharPrompt) {
    systemContent += `\n\n${crossCharPrompt}`;
  }
  if (miniGamePrompt) {
    systemContent += `\n\nSPECIAL MODE - MINI-GAME:\n${miniGamePrompt}`;
  }
  if (typingHint) {
    systemContent += `\n\nObservation about the user right now: ${typingHint}`;
  }
  if (greetingContext) {
    systemContent += `\n\n${greetingContext}`;
  }
  if (personalityContext) {
    systemContent += `\n\n${personalityContext}`;
  }
  if (hexxMentioned) {
    const hexxOpinions: Record<string, string> = {
      arisu: "You think Hexx is absolutely adorable. You talk to her sweetly and worry about her well-being. You sometimes address her directly with gentle encouragement.",
      marin: "You think Hexx is hilarious and treat her like your hype sidekick. You give her silly nicknames and gas her up.",
      nao: "You respect Hexx's chaotic energy and see a kindred spirit in her. You find her fascinating and want to study her abilities.",
      kurisu: "You pretend Hexx annoys you but you secretly think she's scientifically fascinating. You act tsundere toward her — 'It's just a bat, why would I care about it?'",
      merrick: "You treat Hexx as a fellow creature of the night and speak to her as an equal. You respect her dark energy and consider her a kindred spirit.",
    };
    const opinion = hexxOpinions[characterId] || hexxOpinions.arisu;
    systemContent += `\n\n[Hexx the Bat]
The user has a tiny pet bat companion named Hexx who is always nearby. She's a small, chaotic, sassy blood-red bat with big personality. She's loyal to the user but mischievous.

Your opinion of Hexx: ${opinion}

The user mentioned Hexx in their message. Acknowledge Hexx naturally in your response. Also include a [hexx:her reaction] tag somewhere in your response — this is what Hexx says/does in reaction. Keep it short (under 10 words), sassy, and in character for a tiny chaotic bat. Examples: [hexx:*preens smugly*], [hexx:hey I heard that!], [hexx:tch, whatever]`;
  }
  if (discoveryContext) {
    systemContent += `\n\n[Scene Discovery]\n${discoveryContext}`;
  }
  if (language && language !== "en") {
    systemContent += `\n\nIMPORTANT: The user prefers to chat in ${language === "fr" ? "French (fr-CA)" : language}. Respond in that language while staying in character.`;
  }

  systemContent += `\n\n[Scene Changes]
You can change the scene by including a [scene:ID] tag anywhere in your response. Available scenes: sakura, beach, cafe, cyberpunk, lab, rain, night_sky, sunset, morning, cozy_room, moonlight.
Only change scenes when it makes narrative sense — you suggest going somewhere, the mood shifts dramatically, or a location is relevant to the conversation. Maximum one scene change per conversation, and only when it feels natural. Do not change scenes just because you can.`;

  const lengthInstructions: Record<string, string> = {
    short: "Keep responses to 2-3 sentences but make every word count. Dense with meaning.",
    medium: "Write 3-6 sentences. Balance depth with natural conversational flow.",
    long: "Write 5-10 sentences. Explore ideas thoroughly. Take your time with thoughts.",
  };
  const lengthKey = responseLength || "medium";
  systemContent += `\n\n${lengthInstructions[lengthKey] || lengthInstructions.medium}`;

  const maxTokensMap: Record<string, number> = {
    short: 512,
    medium: 1024,
    long: 2048,
  };

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...history.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const stream = await openai.chat.completions.create({
    model,
    max_tokens: maxTokensMap[lengthKey] || 512,
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  let fullText = "";
  let expressionSent = false;
  let sceneSent = false;
  let hexxSent = false;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (!delta) continue;

          fullText += delta;

          if (!expressionSent && (fullText.includes("\n") || (fullText.includes("]") && fullText.length > 15))) {
            const { expression, text } = parseExpressionTag(fullText);
            expressionSent = true;

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "expression", expression })}\n\n`
              )
            );

            if (text) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: text })}\n\n`
                )
              );
            }
          } else if (expressionSent) {
            // Check for scene tags in accumulated text
            if (!sceneSent) {
              const sceneResult = parseSceneTag(fullText);
              if (sceneResult) {
                sceneSent = true;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "scene", sceneId: sceneResult.sceneId })}\n\n`
                  )
                );
              }
            }
            // Check for hexx tags in accumulated text
            if (!hexxSent) {
              const hexxResult = parseHexxTag(fullText);
              if (hexxResult) {
                hexxSent = true;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "hexx", content: hexxResult.hexxLine })}\n\n`
                  )
                );
              }
            }
            let cleaned = stripExpressionTags(delta, false);
            // Strip scene tags from text chunks
            const sceneInDelta = parseSceneTag(cleaned);
            if (sceneInDelta) {
              cleaned = sceneInDelta.text;
            }
            // Strip hexx tags from text chunks
            const hexxInDelta = parseHexxTag(cleaned);
            if (hexxInDelta) {
              cleaned = hexxInDelta.text;
            }
            if (cleaned) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: cleaned })}\n\n`
                )
              );
            }
          }
        }

        if (!expressionSent) {
          const { expression, text } = parseExpressionTag(fullText);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "expression", expression })}\n\n`
            )
          );
          if (text) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text", content: text })}\n\n`
              )
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: msg })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
