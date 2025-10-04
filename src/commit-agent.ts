#!/usr/bin/env ts-node

import { execSync } from "child_process";
import "dotenv/config";
import OpenAI from "openai";

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const diff = execSync("git diff --staged").toString();

  if (!diff.trim()) {
    console.log("No staged changes");
    process.exit(0);
  }

  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY. Add it in .env or export it.");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

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
