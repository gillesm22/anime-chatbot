import OpenAI from "openai";
import { getCharacter } from "@/lib/characters";
import { parseExpressionTag, stripExpressionTags } from "@/lib/sprites/expressions";

const openai = new OpenAI();

export async function POST(request: Request) {
  const { message, characterId, history, userName, memories, responseLength, provider, affinityPrompt, giftContext, heroAppearance, heroClassReaction, crossCharPrompt, miniGamePrompt, typingHint, language } = await request.json();

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
  if (language && language !== "en") {
    systemContent += `\n\nIMPORTANT: The user prefers to chat in ${language === "fr" ? "French (fr-CA)" : language}. Respond in that language while staying in character.`;
  }

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
            const cleaned = stripExpressionTags(delta, false);
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
