const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");
const sendPromptBtn = document.querySelector("#send-prompt-btn");

const API_URL = "/api/ask"; // updated endpoint

let controller, typingInterval;
const chatHistory = [];
const userData = { message: "", file: {} };

const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;
  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 40);
};

const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  const fullHistory = [
    ...chatHistory,
    {
      role: "user",
      parts: [
        { text: userData.message },
        ...(userData.file.data
          ? [{
              inline_data: (({ fileName, isImage, ...rest }) => rest)(userData.file),
            }]
          : []),
      ],
    },
  ];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: fullHistory }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok || !data.reply) throw new Error(data.error || "No response from API");

    const responseText = data.reply.trim();
    typingEffect(responseText, textElement, botMsgDiv);
    chatHistory.push({ role: "user", parts: [{ text: userData.message }] });
    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
  } catch (error) {
    textElement.textContent = `Error: ${error.message}`;
    textElement.style.color = "#d62939";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    scrollToBottom();
  } finally {
    userData.file = {};
  }
};

const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding")) return;
  userData.message = userMessage;
  promptInput.value = "";
  document.body.classList.add("chats-active", "bot-responding");
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");

  const userMsgHTML = `
    <p class="message-text"></p>
    ${userData.file.data
      ? (userData.file.isImage
          ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
          : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`)
      : ""}
  `;
  const userMsgDiv = createMessageElement(userMsgHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userData.message;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    const botMsgHTML = `<img class="avatar" src="gemini.svg" /> <p class="message-text">Loading...</p>`;
    const botMsgDiv = createMessageElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
    generateResponse(botMsgDiv);
  }, 600);
};

// All other existing event listeners remain the same
promptForm.addEventListener("submit", handleFormSubmit);

// existing event listeners unchanged (fileInput, themeToggleBtn, delete-chats-btn, etc.)
// (Keep rest of your original code exactly as before)

const preloadCV = async () => {
  try {
    const response = await fetch("Philip_Austbo_CV.pdf");
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result.split(",")[1];
      const pdfPart = {
        inline_data: { mime_type: "application/pdf", data: base64data },
      };
      chatHistory.push({ role: "user", parts: [{ text: "You are an assistant for Philip Austbø..." }, pdfPart] });
    };
  } catch (err) {
    console.error("CV preload failed:", err);
  }
};

preloadCV();
