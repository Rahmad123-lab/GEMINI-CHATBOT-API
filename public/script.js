const chat = document.getElementById("chat");
const input = document.getElementById("input");

let messages = [];

function addMessage(content, sender = "user") {
    const div = document.createElement("div");

    div.className = `flex ${sender === "user" ? "justify-end" : "justify-start"}`;

    div.innerHTML = `
        <div class="
            px-4 py-2 rounded-2xl max-w-[75%]
            ${sender === "user"
                ? "bg-emerald-600 text-white rounded-br-none"
                : "bg-gray-200 text-gray-800 rounded-bl-none"}
        ">
            ${content}
        </div>
    `;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
    const div = document.createElement("div");
    div.id = "typing";

    div.className = "flex justify-start";

    div.innerHTML = `
        <div class="bg-gray-200 px-4 py-2 rounded-2xl animate-pulse">
            mengetik...
        </div>
    `;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");

    messages.push({ role: "user", content: text });

    input.value = "";
    input.focus();

    showTyping();

    try {
        const res = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages })
        });

        const data = await res.json();
        console.log("Response:", data);

        removeTyping();

        if (data.result) {
            addMessage(data.result, "bot");
            messages.push({ role: "assistant", content: data.result });
        } else {
            addMessage("Respon kosong 😢", "bot");
        }

    } catch (err) {
        console.error(err);
        removeTyping();
        addMessage("Gagal terhubung ke server 😢", "bot");
    }
}

// enter = kirim
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});