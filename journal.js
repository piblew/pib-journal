// Get DOM elements
const entriesContainer = document.getElementById("entries-container");

// Load saved entries when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const entries = getEntries();
  entries.forEach(displayEntry);
});

// Retrieve entries from localStorage
function getEntries() {
  return JSON.parse(localStorage.getItem("journalEntries")) || [];
}

// Show an entry on the page
function displayEntry(entry) {
  const entryDiv = document.createElement("div");
  entryDiv.innerHTML = `<p>${entry.text}</p><small>${entry.timestamp}</small><hr>`;
  entriesContainer.prepend(entryDiv); // Add to top
}
