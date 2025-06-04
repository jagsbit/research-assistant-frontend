document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['researchNotes'], (result) => {
    if (result.researchNotes) {
      document.getElementById('notes').value = result.researchNotes;
    }
  });

  document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
  document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);

  // Add listener for Delete Notes button
  document.getElementById('deleteNotesBtn').addEventListener('click', deleteNotes);
});

async function summarizeText() {
  const loader = document.getElementById('loader');
  const resultContent = document.getElementById('resultContent');

  try {
    // Show loader
    loader.style.display = 'inline-block';
    resultContent.innerHTML = ''; // Clear previous result

    // Get selected text from the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });

    if (!result) {
      showToast('Please select some text first');
      loader.style.display = 'none'; // Hide loader if no text selected
      return;
    }

    // Send the text to the server for summarization
    const response = await fetch('https://research-assitant-v1.onrender.com/api/research/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: result,
        operation: 'summarize'
      })
    });

    if (!response.ok) {
      throw new Error('API Error');
    }

    const text = await response.text();
    showResult(text.replace(/\n/g, '<br>'));
  } catch (error) {
    showToast('Error: ' + error.message);
    console.log(error);
  } finally {
    loader.style.display = 'none'; // Hide loader in any case
  }
}

async function saveNotes() {
  const notes = document.getElementById('notes').value;
  chrome.storage.local.set({ researchNotes: notes }, () => {
    showToast('Notes saved successfully!');
  });
}

async function deleteNotes() {
  chrome.storage.local.remove('researchNotes', () => {
    document.getElementById('notes').value = '';
    showToast('Notes deleted successfully!');
  });
}

function showResult(content) {
  const resultContent = document.getElementById('resultContent');
  resultContent.innerHTML = `
    <div class='result-item'>
      <div class='result-content'>${content}</div>
    </div>`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
