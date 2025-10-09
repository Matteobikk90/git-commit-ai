#!/usr/bin/env ts-node

import { execSync } from "child_process";
import "dotenv/config";
import OpenAI from "openai";
import readline from "readline";

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY. Add it in .env or export it.");
    process.exit(1);
  }

  const diff = execSync(
    "git diff --staged -- . ':(exclude)*.png' ':(exclude)*.jpg' ':(exclude)*.jpeg' ':(exclude)*.svg' ':(exclude)*.gif' ':(exclude)*.webp' ':(exclude)*.json' ':(exclude)*.lock' ':(exclude)*.md' ':(exclude)*.env'",
    { maxBuffer: 1024 * 1024 * 10 }
  ).toString();

  if (!diff.trim()) {
    console.log("No staged changes");
    process.exit(0);
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      {
        role: "system",
        content:
          "You are a commit message assistant. Output one single-line Conventional Commit message under 70 characters. Be concise and ignore non-functional changes.",
      },
      { role: "user", content: `Generate a commit message for:\n\n${diff}` },
    ],
  });

  const message = completion.choices[0].message?.content?.trim();
  if (!message) {
    console.log("No commit message generated");
    process.exit(1);
  }

  console.log(`\nProposed commit: "${message}"`);
  const answer = (await ask("Accept? (y/n): ")).toLowerCase();
  if (answer !== "y") {
    console.log("Aborted.");
    process.exit(0);
  }

  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
    stdio: "inherit",
  });
}

main();
