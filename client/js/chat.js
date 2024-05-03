console.log("Loading......")
const query = (obj) =>
  Object.keys(obj)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
    .join("&");
const colorThemes = document.querySelectorAll('[name="theme"]');
const markdown = window.markdownit();
const message_box = document.getElementById(`messages`);
const message_input = document.getElementById(`message-input`);
const box_conversations = document.querySelector(`.top`);
const spinner = box_conversations.querySelector(".spinner");
const stop_generating = document.querySelector(`.stop_generating`);
const send_button = document.querySelector(`#send-button`);
let prompt_lock = false;
let fashionAdviceFlag = false;
let newStyleFlag = false;
let isLiked = false;
let img_id = null;


// hljs.addPlugin(new CopyButtonPlugin());

function resizeTextarea(textarea) {
  textarea.style.height = '80px';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

const format = (text) => {
  return text.replace(/(?:\r\n|\r|\n)/g, "<br>");
};

message_input.addEventListener("blur", () => {
  window.scrollTo(0, 0);
});
console.log("Loading .... 2")

message_input.addEventListener("focus", () => {
  document.documentElement.scrollTop = document.documentElement.scrollHeight;
});

const delete_conversations = async () => {
  localStorage.clear();
  await new_conversation();
};

const handle_ask = async () => {
    message_input.style.height = `80px`;
    message_input.focus();
  
    window.scrollTo(0, 0);
    let message = message_input.value.trim(); // Trim any whitespace
  
    if (message.length > 0 && fashionAdviceFlag == false) {
      message_input.value = ``; // Clear the input field
      message_input.placeholder = "Ask a question"
      await ask_api(message); // Call ask_api function with the message

    } else if (message.length > 0 && fashionAdviceFlag == true){
      message_input.value = ``; // Clear the input field
      await ask_advice(message);
    } else {
      console.log("Error: Message is empty"); // Log an error message if the message is empty
    }
  };
  

const remove_cancel_button = async () => {
  stop_generating.classList.add(`stop_generating-hiding`);

  setTimeout(() => {
    stop_generating.classList.remove(`stop_generating-hiding`);
    stop_generating.classList.add(`stop_generating-hidden`);
  }, 300);
};

const ask_api = async (prompt) => {
  window.text = ``;
  window.token = message_id();

  message_box.innerHTML += `
          <div class="message">
              <div class="user">
                  ${user_image}
                  <i class="fa-regular fa-phone-arrow-up-right"></i>
              </div>
              <div class="content" id="user_${token}"> 
                  ${format(prompt)}
              </div>
          </div>
      `;

  /* .replace(/(?:\r\n|\r|\n)/g, '<br>') */

  message_box.scrollTop = message_box.scrollHeight;
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 500));
  window.scrollTo(0, 0);

  var endpoint
  if(newStyleFlag) {
    endpoint = `/backend-api/generate_out_of_preference_image`
    newStyleFlag = !newStyleFlag
  }
  else if(document.getElementById("switch").checked) {
    endpoint = `/backend-api/generate_personalized_image`
  }
  else {
    endpoint = `/backend-api/generate_image`
  }
  const img_gen_resp = await fetch(endpoint, {
    method: `POST`,
    // signal: window.controller.signal,
    headers: {
      "content-type": `application/json`,
    },
    body: JSON.stringify({
      conversation_id: window.conversation_id,
      meta: {
        id: window.token,
        content: {
          content_type: "text",
          parts: [
            {
              content: prompt,
              role: "user",
            },
          ],
        },
      },
    }),
  });

  const img_gen_json = await img_gen_resp.json()
  console.log(img_gen_json)
  img_id = img_gen_json.image_id

  const likeButtons = document.querySelectorAll('.likebutton-active');

// Loop through each selected element
  likeButtons.forEach(button => {
      // Change class name to "likebutton-disabled"
      button.className = "likebutton-disabledwithoutlike"
      button.disabled = true;
  });

  message_box.innerHTML += `
          <div class="message">
              <div class="user">
                  ${gpt_image} <i class="fa-regular fa-phone-arrow-down-left"></i>
              </div>
              <div class="content" id="gpt_${window.token}">
                  <div id="${img_id}" class="img-reply"></div>
                  <button class="likebutton-active" onclick="toggleLike()">Like</button>
              </div>
          </div>
      `;

  message_box.scrollTop = message_box.scrollHeight;
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 1000));
  window.scrollTo(0, 0);

  const img_get_res = await fetch(`/backend-api/get_image/`+img_id, {
    method: `GET`,
    headers: {
      accept: "image/*"
    }
  })

  const imageBlob = await img_get_res.blob()
  const imageObjectURL = URL.createObjectURL(imageBlob);
  const image = document.createElement('img')
  image.src = imageObjectURL

  const img_container = document.getElementById(img_id)
  img_container.append(image)

  
}

const API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base";
const HEADERS = {
  "Authorization": "Bearer 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",
  "Content-Type": "application/json"
};


// Function to toggle the button's appearance and update the like status
async function toggleLike() {
  // const imageObjectURL = red_top.jpg;
  console.log("in toggle like");
  const likeButton = document.querySelectorAll('.likebutton-active')[0];
  isLiked = !isLiked; // Toggle the like status

  // Change button appearance to darker shade
  likeButton.className = "likebutton-disabled";
  likeButton.disabled = true; // Disable the button
  endpoint = `/backend-api/feedback/`+img_id;
  await fetch(endpoint, {
    method : `PUT`
  })
  
}


const ask_advice = async (prompt) => {
  window.text = ``;
  window.token = message_id();

  message_box.innerHTML += `
          <div class="message">
              <div class="user">
                  ${user_image}
                  <i class="fa-regular fa-phone-arrow-up-right"></i>
              </div>
              <div class="content" id="user_${token}"> 
                  ${format(prompt)}
              </div>
          </div>
      `;

  /* .replace(/(?:\r\n|\r|\n)/g, '<br>') */

  message_box.scrollTop = message_box.scrollHeight;
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 500));
  window.scrollTo(0, 0);

  // Get fashion advice based on prompt
  var fashion_advice = {
        "beach": "A flowy maxi dress paired with sandals and a sun hat would be perfect for a beach party.",
        "interview": "A blue shirt with black pants would go well for a formal interview.",
        "date": "For a date, try wearing a stylish dress or a smart casual outfit.",
        "party": "You can't go wrong with a little black dress for a party!",
        "formal": "A classic black suit paired with a crisp white shirt and a stylish tie would be ideal for a formal event.",
  };

  // Tokenize the prompt into words
  var words = prompt.toLowerCase().split(" ");

  // If no match found, return a default message
  var advice = "Sorry, I don't have specific fashion advice for that prompt.";
  // Check if any word from the prompt matches with the keys in fashion_advice
  for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (fashion_advice.hasOwnProperty(word)) {
          advice = fashion_advice[word];
          break; // Exit the loop once a match is found
      }
  }

  // Display fashion advice
  message_box.innerHTML += `
          <div class="message">
              <div class="user">
                  ${gpt_image} <i class="fa-regular fa-phone-arrow-down-left"></i>
              </div>
              <div class="content" id="gpt_${window.token}">
                  <p>${advice}</p>
              </div>
          </div>
      `;

  message_box.scrollTop = message_box.scrollHeight;
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 1000));
  window.scrollTo(0, 0);
}

const trendPromptSamples = [
  "Give me 80s inspired office attire for men.",
  "Can I get a Y2K themed outfit for teenage girls?",
  "Show me some flamboyant broadway apparel.",
  "Give me a pretty, victorian gothic dress for women."
]

const showTrendTips = async() => {
  if(fashionAdviceFlag)
    return
  var newSuggestedPlaceholder = trendPromptSamples[Math.floor(Math.random() * 4)]
  message_input.placeholder = "Try something like: '" + newSuggestedPlaceholder + "'!"
}

// const stylePromptSamples = [
//   "Tops out of my comfort zone.",
//   "Lets try some new style for pants",
//   "My choice is always dark shades give a dress in a light shade",
// ]

const showStyleTips = async() => {
  if(fashionAdviceFlag)
    return
  // var newSuggestedPlaceholder = stylePromptSamples[Math.floor(Math.random() * 3)]
  message_input.placeholder = "Try the name of an item! We'll give you sommething different from your preferences"
  newStyleFlag = true
}

const showAdviceTips = async() => {
  if(fashionAdviceFlag == false)
    return
  message_input.placeholder = "Try something like: Dress for a interview"
}

const showImageTips = async() => {
  if(fashionAdviceFlag)
    return
  message_input.placeholder = "Try something like: Red top & blue jeans"
}

function setFlag(value) {
  fashionAdviceFlag = value;
  console.log("Fashion Advice Flag:", fashionAdviceFlag);
}

const clear_conversations = async () => {
  const elements = box_conversations.childNodes;
  let index = elements.length;

  if (index > 0) {
    while (index--) {
      const element = elements[index];
      if (
        element.nodeType === Node.ELEMENT_NODE &&
        element.tagName.toLowerCase() !== `button`
      ) {
        box_conversations.removeChild(element);
      }
    }
  }
};

const clear_conversation = async () => {
  let messages = message_box.getElementsByTagName(`div`);

  while (messages.length > 0) {
    message_box.removeChild(messages[0]);
  }
};

const show_option = async (conversation_id) => {
  const conv = document.getElementById(`conv-${conversation_id}`);
  const yes = document.getElementById(`yes-${conversation_id}`);
  const not = document.getElementById(`not-${conversation_id}`);

  conv.style.display = "none";
  yes.style.display = "block";
  not.style.display = "block"; 
}

const hide_option = async (conversation_id) => {
  const conv = document.getElementById(`conv-${conversation_id}`);
  const yes = document.getElementById(`yes-${conversation_id}`);
  const not = document.getElementById(`not-${conversation_id}`);

  conv.style.display = "block";
  yes.style.display = "none";
  not.style.display = "none"; 
}

const delete_conversation = async (conversation_id) => {
  localStorage.removeItem(`conversation:${conversation_id}`);

  const conversation = document.getElementById(`convo-${conversation_id}`);
    conversation.remove();

  if (window.conversation_id == conversation_id) {
    await new_conversation();
  }

  await load_conversations(20, 0, true);
};

const set_conversation = async (conversation_id) => {
  history.pushState({}, null, `/chat/${conversation_id}`);
  window.conversation_id = conversation_id;

  await clear_conversation();
  await load_conversation(conversation_id);
  await load_conversations(20, 0, true);
};

const new_conversation = async () => {
  history.pushState({}, null, `/chat/`);
  window.conversation_id = uuid();

  await clear_conversation();
  await load_conversations(20, 0, true);
};

const load_conversation = async (conversation_id) => {
  let conversation = await JSON.parse(
    localStorage.getItem(`conversation:${conversation_id}`)
  );
  console.log(conversation, conversation_id);

  for (item of conversation.items) {
    message_box.innerHTML += `
            <div class="message">
                <div class="user">
                    ${item.role == "assistant" ? gpt_image : user_image}
                    ${
                      item.role == "assistant"
                        ? `<i class="fa-regular fa-phone-arrow-down-left"></i>`
                        : `<i class="fa-regular fa-phone-arrow-up-right"></i>`
                    }
                </div>
                <div class="content">
                    ${
                      item.role == "assistant"
                        ? markdown.render(item.content)
                        : item.content
                    }
                </div>
            </div>
        `;
  }

  document.querySelectorAll(`code`).forEach((el) => {
    hljs.highlightElement(el);
  });

  message_box.scrollTo({ top: message_box.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    message_box.scrollTop = message_box.scrollHeight;
  }, 500);
};


const add_conversation = async (conversation_id, title) => {
  if (localStorage.getItem(`conversation:${conversation_id}`) == null) {
    localStorage.setItem(
      `conversation:${conversation_id}`,
      JSON.stringify({
        id: conversation_id,
        title: title,
        items: [],
      })
    );
  }
};

const add_message = async (conversation_id, role, content) => {
  before_adding = JSON.parse(
    localStorage.getItem(`conversation:${conversation_id}`)
  );

  before_adding.items.push({
    role: role,
    content: content,
  });

  localStorage.setItem(
    `conversation:${conversation_id}`,
    JSON.stringify(before_adding)
  ); // update conversation
};

const load_conversations = async (limit, offset, loader) => {
  //console.log(loader);
  if (loader === undefined) box_conversations.appendChild(spinner);

  let conversations = [];
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).startsWith("conversation:")) {
      let conversation = localStorage.getItem(localStorage.key(i));
      conversations.push(JSON.parse(conversation));
    }
  }

  if (loader === undefined) spinner.parentNode.removeChild(spinner)
  await clear_conversations();

  for (conversation of conversations) {
    box_conversations.innerHTML += `
    <div class="convo" id="convo-${conversation.id}">
      <div class="left" onclick="set_conversation('${conversation.id}')">
          <i class="fa-regular fa-comments"></i>
          <span class="convo-title">${conversation.title}</span>
      </div>
      <i onclick="show_option('${conversation.id}')" class="fa-regular fa-trash" id="conv-${conversation.id}"></i>
      <i onclick="delete_conversation('${conversation.id}')" class="fa-regular fa-check" id="yes-${conversation.id}" style="display:none;"></i>
      <i onclick="hide_option('${conversation.id}')" class="fa-regular fa-x" id="not-${conversation.id}" style="display:none;"></i>
    </div>
    `;
  }

  document.querySelectorAll(`code`).forEach((el) => {
    hljs.highlightElement(el);
  });
};

document.getElementById(`cancelButton`).addEventListener(`click`, async () => {
  window.controller.abort();
  console.log(`aborted ${window.conversation_id}`);
});

function h2a(str1) {
  var hex = str1.toString();
  var str = "";

  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }

  return str;
}

const uuid = () => {
  return `xxxxxxxx-xxxx-4xxx-yxxx-${Date.now().toString(16)}`.replace(
    /[xy]/g,
    function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
};

const message_id = () => {
  random_bytes = (Math.floor(Math.random() * 1338377565) + 2956589730).toString(
    2
  );
  unix = Math.floor(Date.now() / 1000).toString(2);

  return BigInt(`0b${unix}${random_bytes}`).toString();
};

window.onload = async () => {
  
  message_input.addEventListener(`keydown`, async (evt) => {
    if (prompt_lock) return;
    if (evt.keyCode === 13 && !evt.shiftKey) {
        evt.preventDefault();
        console.log('pressed enter');
        await handle_ask();
    } else {
      message_input.style.removeProperty("height");
      message_input.style.height = message_input.scrollHeight + 4 + "px";
    }
  });

  send_button.addEventListener(`click`, async () => {
    console.log("clicked send");
    if (prompt_lock) return;
    await handle_ask();
  });

};

document.querySelector(".mobile-sidebar").addEventListener("click", (event) => {
  const sidebar = document.querySelector(".conversations");

  if (sidebar.classList.contains("shown")) {
    sidebar.classList.remove("shown");
    event.target.classList.remove("rotated");
  } else {
    sidebar.classList.add("shown");
    event.target.classList.add("rotated");
  }

  window.scrollTo(0, 0);
});

const register_settings_localstorage = async () => {
  settings_ids = ["switch", "model", "jailbreak"];
  settings_elements = settings_ids.map((id) => document.getElementById(id));
  settings_elements.map((element) =>
    element.addEventListener(`change`, async (event) => {
      switch (event.target.type) {
        case "checkbox":
          localStorage.setItem(event.target.id, event.target.checked);
          break;
        case "select-one":
          localStorage.setItem(event.target.id, event.target.selectedIndex);
          break;
        default:
          console.warn("Unresolved element type");
      }
    })
  );
};


// Theme storage for recurring viewers
const storeTheme = function (theme) {
  localStorage.setItem("theme", theme);
};

// set theme when visitor returns
const setTheme = function () {
  const activeTheme = localStorage.getItem("theme");
  colorThemes.forEach((themeOption) => {
    if (themeOption.id === activeTheme) {
      themeOption.checked = true;
    }
  });
  // fallback for no :has() support
  document.documentElement.className = activeTheme;
};

colorThemes.forEach((themeOption) => {
  themeOption.addEventListener("click", () => {
    storeTheme(themeOption.id);
    // fallback for no :has() support
    document.documentElement.className = themeOption.id;
  });
});

document.onload = setTheme();
