const newEntryInput = document.getElementById("new-entry");
const addEntryButton = document.getElementById("add-entry-btn");
const entriesContainer = document.getElementById("entries-container");

// Load saved entries when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const entries = getEntries();
  entries.forEach(displayEntry);
});

// Handle adding a new entry
addEntryButton.addEventListener("click", () => {
  const entryText = newEntryInput.value.trim();

  if (entryText) {
    const entry = {
      text: entryText,
      timestamp: new Date().toLocaleString()
    };
    saveEntry(entry);
    displayEntry(entry);
    newEntryInput.value = ""; // Clear input box
  } else {
    alert("Please write something before adding an entry.");
  }
});

// Retrieve entries from localStorage
function getEntries() {
  return JSON.parse(localStorage.getItem("journalEntries")) || [];
}

// Save an entry to localStorage
function saveEntry(entry) {
  const entries = getEntries();
  entries.push(entry);
  localStorage.setItem("journalEntries", JSON.stringify(entries));
}

// Show an entry on the page
function displayEntry(entry) {
  const entryDiv = document.createElement("div");
  entryDiv.innerHTML = `<p>${entry.text}</p><small>${entry.timestamp}</small><hr>`;
  entriesContainer.prepend(entryDiv); // Add to top
}
