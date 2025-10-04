#!/usr/bin/env ts-node

import { execSync } from "child_process";
import OpenAI from "openai";

async function main() {
  const diff = execSync("git diff --staged").toString();
  if (!diff.trim()) {
    console.log("No staged changes");
    process.exit(0);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a commit message assistant. Always output one single-line Conventional Commit message.",
      },
      { role: "user", content: `Generate a commit message for:\n\n${diff}` },
    ],
  });

  const message = completion.choices[0].message?.content?.trim();
  if (!message) {
    console.log("No commit message generated");
    process.exit(1);
  }

  console.log("Commit:", message);
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
    stdio: "inherit",
  });
}

main();
