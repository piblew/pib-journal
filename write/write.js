// DOM elements
const passwordSection = document.getElementById("password-section");
const entrySection = document.getElementById("entry-section");
const passwordInput = document.getElementById("password-input");
const submitPasswordBtn = document.getElementById("submit-password-btn");
const newEntryInput = document.getElementById("new-entry");
const addEntryBtn = document.getElementById("add-entry-btn");
const logoutBtn = document.getElementById("logout-btn");
const message = document.getElementById("message");

// Set the password here (change this to your desired password)
const CORRECT_PASSWORD = "password123";

// Check if already authenticated
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("authenticated") === "true") {
    showEntrySection();
  }
});

// Handle password submission
submitPasswordBtn.addEventListener("click", () => {
  const enteredPassword = passwordInput.value.trim();

  if (enteredPassword === CORRECT_PASSWORD) {
    sessionStorage.setItem("authenticated", "true");
    showEntrySection();
  } else {
    alert("Incorrect password. Try again.");
    passwordInput.value = "";
  }
});

// Handle adding a new entry
addEntryBtn. addEventListener("click", () => {
  const entryText = newEntryInput.value.trim();

  if (entryText) {
    const entry = {
      text: entryText,
      timestamp: new Date().toLocaleString()
    };
    saveEntry(entry);
    message.textContent = "Entry added successfully!";
    newEntryInput.value = "";
    setTimeout(() => {
      message.textContent = "";
    }, 3000);
  } else {
    alert("Please write something before adding an entry.");
  }
});

// Handle logout
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("authenticated");
  passwordSection.style.display = "block";
  entrySection.style. display = "none";
  passwordInput.value = "";
});

// Show entry section
function showEntrySection() {
  passwordSection.style.display = "none";
  entrySection.style.display = "block";
}

// Save an entry to localStorage
function saveEntry(entry) {
  const entries = JSON.parse(localStorage.getItem("journalEntries")) || [];
  entries.push(entry);
  localStorage.setItem("journalEntries", JSON.stringify(entries));
}
