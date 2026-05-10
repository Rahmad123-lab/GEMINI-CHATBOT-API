import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const PORT = 3000;

/* ================= BACKEND API ================= */
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages)) {
            throw new Error("Messages must be array");
        }

        // gabungkan semua chat (simple memory)
        const history = messages.map(m => `${m.role}: ${m.content}`).join("\n");

        const prompt = `
Kamu adalah asisten desa yang ramah dan profesional.
Jawab dengan bahasa Indonesia santai tapi sopan.

${history}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ result: response.text() });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* ================= FRONTEND ================= */
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>DesaCare AI</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gradient-to-br from-emerald-900 to-emerald-700 h-screen flex items-center justify-center">

<div class="w-full max-w-md h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

<div class="bg-emerald-600 text-white p-4">
<h1 class="font-bold">🤖 DesaCare AI</h1>
</div>

<div id="chat" class="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50"></div>

<div class="p-3 border-t flex gap-2">
<input id="input" class="flex-1 border rounded-full px-4 py-2" placeholder="Ketik pesan..." />
<button onclick="sendMessage()" class="bg-emerald-600 text-white px-4 rounded-full">Kirim</button>
</div>

</div>

<script>
const chat = document.getElementById("chat");
const input = document.getElementById("input");

let messages = [];

function addMessage(content, sender="user") {
    const div = document.createElement("div");

    div.className = sender === "user" ? "text-right" : "text-left";

    div.innerHTML = \`
        <div class="inline-block px-4 py-2 rounded-2xl max-w-[75%]
        \${sender === "user" ? "bg-emerald-600 text-white" : "bg-gray-200"}">
        \${content}
        </div>
    \`;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function typing() {
    const div = document.createElement("div");
    div.id = "typing";
    div.innerHTML = '<span class="text-gray-500">mengetik...</span>';
    chat.appendChild(div);
}

function removeTyping() {
    document.getElementById("typing")?.remove();
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    messages.push({ role:"user", content:text });

    input.value = "";
    typing();

    try {
        const res = await fetch("/api/chat", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ messages })
        });

        const data = await res.json();

        removeTyping();
        addMessage(data.result, "bot");

        messages.push({ role:"assistant", content:data.result });

    } catch {
        removeTyping();
        addMessage("Error 😢", "bot");
    }
}

input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});
</script>

</body>
</html>
    `);
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
    console.log("🚀 http://localhost:" + PORT);
});