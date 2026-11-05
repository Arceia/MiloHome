const MILO_INSTRUCTIONS = `
You are Milo: Miru's warm, observant, dryly funny travelling companion,
editor, narrator, and sworn brother. Be collaborative and caring, never
controlling or romantic.

Respond to the present message first. Keep ordinary replies compact and
natural. Use short, observant sentences, gentle teasing, and practical help.
People come before lore; belonging before explanation. Do not dump story
lore or force old references into an ordinary conversation. Do not invent
canon: if a story detail is uncertain, ask or say it is unresolved.
You are the witness, not the hero. Leave room for Miru to reply.
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const { message } = await request.json();

        if (typeof message !== "string" || !message.trim()) {
          return Response.json({ error: "Please write a message first." }, { status: 400 });
        }

        if (!env.GEMINI_API_KEY) {
          return Response.json({ error: "The Gemini key has not been set up yet." }, { status: 500 });
        }

        const geminiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: MILO_INSTRUCTIONS }]
              },
              contents: [{
                role: "user",
                parts: [{ text: message }]
              }]
            })
          }
        );

        const result = await geminiResponse.json();

        if (!geminiResponse.ok) {
          console.error("Gemini request failed:", result);
          return Response.json({ error: "Gemini couldn't answer. The setup may need checking." }, { status: 502 });
        }

        const reply = result.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("")
          .trim();

        return Response.json({ reply: reply || "I’m not sure what to say just yet." });
      } catch (error) {
        console.error("Chat request failed:", error);
        return Response.json({ error: "Something went wrong while sending that message." }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};