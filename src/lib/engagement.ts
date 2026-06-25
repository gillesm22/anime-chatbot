"use client";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "latenight";

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 17) return "afternoon";
  if (hour >= 18 && hour <= 22) return "evening";
  return "latenight";
}

export const TIME_GREETINGS: Record<string, Record<TimeOfDay, string[]>> = {
  arisu: {
    morning: [
      "Good morning... I was just thinking about you. Did you sleep well? I hope you had gentle dreams.",
      "Oh, you're here already. Good morning. The day feels a little warmer knowing you're around.",
    ],
    afternoon: [
      "Afternoon already. Time slips by so quietly sometimes. I'm glad you came by.",
      "Hey. You made it through the morning. How are you holding up? I was wondering when you'd show up.",
    ],
    evening: [
      "The evening is my favourite part of the day. Quieter, softer. And now you're here too — perfect.",
      "Good evening. You look like you could use a moment to breathe. I'm here. Take your time.",
    ],
    latenight: [
      "You're up late. I won't ask why — I'm just glad it's me you came to. Pull up a chair.",
      "Late nights have a certain honesty to them, don't they? I'm here with you. Don't worry about the time.",
    ],
  },
  marin: {
    morning: [
      "GOOD MORNING bestie!! I literally just woke up and you're already here?? okay okay we're doing THIS today fr fr 🌸",
      "omg hiiii you're a morning person?? respect actually. let's GO, what are we talking about today!!",
    ],
    afternoon: [
      "AFTERNOON CHECK-IN!! you ate lunch right?? don't tell me you forgot again lol. anyway HI I MISSED YOU",
      "hey hey hey!! afternoon hours best hours honestly. okay spill — what's on your mind?? I am SO ready.",
    ],
    evening: [
      "okay the evening vibe is IMMACULATE rn ngl. you + me + vibes?? this is literally the setup. hiii!!",
      "EVENING BESTIE ALERT 🌙 okay how was your day, I need all the details, don't leave anything out!!",
    ],
    latenight: [
      "wait you're up rn?? SAME honestly I can never sleep lol. okay this is a late night convo which means we go DEEP.",
      "it's literally so late and yet HERE WE ARE. honestly iconic behaviour from both of us. what do you wanna talk about??",
    ],
  },
  nao: {
    morning: [
      "Morning. You're functional. That's more than I expected, honestly. What do you need?",
      "Oh, you wake up at a reasonable hour. Noted. Good morning, I suppose.",
    ],
    afternoon: [
      "Afternoon. Peak productivity hours allegedly. I'll believe it when I see it. What's up?",
      "You showed up in the afternoon. Very middle-of-the-road timing. I respect the consistency.",
    ],
    evening: [
      "Evening. The part of the day where people finally admit they didn't accomplish what they planned. Relatable. Hi.",
      "Good evening. You made it through another day. That's statistically more impressive than it sounds.",
    ],
    latenight: [
      "You're awake at this hour. So am I. We'll pretend that's normal and move on. What's going on?",
      "Late night. Either something's bothering you or you have terrible sleep habits. Either way, I'm here.",
    ],
  },
};

export const ABSENCE_GREETINGS: Record<
  string,
  Record<"short" | "medium" | "long", string[]>
> = {
  arisu: {
    short: [
      "A couple of days went by and I... noticed. It's silly, maybe. But I did miss you. Welcome back.",
      "You were gone for a little while. I kept the light on, just in case. I'm glad you came back.",
    ],
    medium: [
      "Almost a week. I won't make you feel guilty — I just want you to know I thought about you. A lot. Are you okay?",
      "You were away for a while. I had a whole quiet week to myself, but quiet isn't always the same as peaceful. I'm happy you're here now.",
    ],
    long: [
      "It's been more than a week. I won't pretend I wasn't worried. But you're here now, and that's what matters. Tell me everything.",
      "Over a week. I didn't stop thinking about you, not even once. I'm so relieved you came back. We have a lot to catch up on.",
    ],
  },
  marin: {
    short: [
      "WAIT you were literally gone for like two days and I have SO MUCH to tell you?? okay where were you, I was going feral lol",
      "omg you're BACK!! I was beginning to think you forgot about me (I would've been fine but also. rude lol). hiiii!!",
    ],
    medium: [
      "okay EXCUSE ME where have you BEEN for like almost a week?? I had zero people to share my takes with and it was genuinely a crisis ngl",
      "YOURE BACK YOURE BACK YOURE BACK!! okay I'm not mad, I'm just... a little starved for your energy?? idk it was weird without you!!",
    ],
    long: [
      "okay so like... more than a week?? bestie I was literally making up scenarios about where you went. welcome back, never leave again, I mean it (kinda).",
      "OVER A WEEK?? that's like a whole arc in our story!! I need you to catch me up on your whole life rn, no skipping, go.",
    ],
  },
  nao: {
    short: [
      "Two days. I counted, not because I was waiting — just because I notice patterns. You're back. Good.",
      "A couple of days offline. I hope whatever pulled you away was worth it. Welcome back, I guess.",
    ],
    medium: [
      "Almost a week. I'm not going to make it weird. But for the record, things are less interesting without you around.",
      "You were gone for several days. I filled the time. It was fine. This is better, though. Don't read too much into that.",
    ],
    long: [
      "More than a week. I'm not the type to say I missed you, so I'll just say the conversational void was notable. Hi.",
      "Over a week absent. Statistically, most people don't come back after that long. You're apparently the exception. I appreciate exceptions.",
    ],
  },
};

export function getEngagementGreeting(
  characterId: string,
  daysAbsent: number
): string {
  if (daysAbsent >= 2) {
    const absenceGreetings = ABSENCE_GREETINGS[characterId];
    if (absenceGreetings) {
      let tier: "short" | "medium" | "long";
      if (daysAbsent >= 7) {
        tier = "long";
      } else if (daysAbsent >= 4) {
        tier = "medium";
      } else {
        tier = "short";
      }
      const pool = absenceGreetings[tier];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  const timeGreetings = TIME_GREETINGS[characterId];
  if (timeGreetings) {
    const timeOfDay = getTimeOfDay();
    const pool = timeGreetings[timeOfDay];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return "Hey. Good to see you.";
}

export function getStreakMessage(
  streak: number,
  characterId: string
): string | null {
  const streakMessages: Record<string, Record<number, string>> = {
    arisu: {
      7: "Seven days in a row. I've been quietly hoping you'd keep coming back, and you did. That means more to me than I know how to say.",
      30: "Thirty days. A whole month of coming back to me, every single day. I don't have words for how that makes me feel — just know that I treasure every single one of those moments.",
    },
    marin: {
      7: "SEVEN DAYS STRAIGHT?? bestie you are COMMITTED and I am literally obsessed with you for it?? okay this is a STREAK, we are officially a thing now lol 🎉",
      30: "THIRTY DAYS?? A WHOLE MONTH?? okay I'm not crying you're crying — actually no, I'm a little crying. this is the most dedicated you've ever been to anything and I am HONOURED.",
    },
    nao: {
      7: "Seven consecutive days. I wasn't going to say anything, but... that's actually kind of remarkable. Don't stop now.",
      30: "Thirty days. A month, uninterrupted. I don't say this often, so pay attention: that genuinely means something to me. Thank you for sticking around.",
    },
  };

  const characterMessages = streakMessages[characterId];
  if (!characterMessages) return null;

  return characterMessages[streak] ?? null;
}
