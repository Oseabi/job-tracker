// ---- DATA ----
// This is where all our job applications will live
let jobs = []

// ---- THEME TOGGLE ----
const themeToggle = document.getElementById('theme-toggle')
const themeIcon = document.querySelector('.theme-icon')

// Check for saved theme, default to light this time
const savedTheme = localStorage.getItem('jobTrackerTheme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)
themeIcon.textContent = savedTheme === 'light' ? '🌙' : '☀️'

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme')

  if (current === 'light') {
    document.documentElement.setAttribute('data-theme', 'dark')
    themeIcon.textContent = '☀️'
    localStorage.setItem('jobTrackerTheme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    themeIcon.textContent = '🌙'
    localStorage.setItem('jobTrackerTheme', 'light')
  }
})

// ---- MODAL ----
const modalOverlay = document.getElementById('modal-overlay')
const addJobBtn = document.getElementById('add-job-btn')
const modalClose = document.getElementById('modal-close')

// Open modal
addJobBtn.addEventListener('click', () => {
  modalOverlay.classList.add('active')
})

// Close modal when X is clicked
modalClose.addEventListener('click', () => {
  modalOverlay.classList.remove('active')
})

// Close modal when clicking outside it
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active')
  }
})

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modalOverlay.classList.remove('active')
  }
})

// ---- ADD JOB ----
const saveJobBtn = document.getElementById('save-job-btn')
const inputCompany = document.getElementById('input-company')
const inputRole = document.getElementById('input-role')
const inputType = document.getElementById('input-type')
const inputNotes = document.getElementById('input-notes')

saveJobBtn.addEventListener('click', () => {

  // Read the inputs
  const company = inputCompany.value.trim()
  const role = inputRole.value.trim()
  const type = inputType.value
  const notes = inputNotes.value.trim()

  // Guard clauses
  if (company === '') {
    alert('Please enter a company name.')
    return
  }

  if (role === '') {
    alert('Please enter a role.')
    return
  }

  // Build the job object
  const job = {
    id: Date.now().toString(),
    company: company,
    role: role,
    type: type,
    notes: notes,
    status: 'applied',
    date: new Date().toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short'
    })
  }

  // Add to our jobs array
  jobs.push(job)

  // Save to localStorage
  saveToStorage()

  // Update the screen
  renderBoard()

  // Clear the form and close modal
  clearForm()
  modalOverlay.classList.remove('active')

})

// Save jobs array to localStorage
function saveToStorage() {
  localStorage.setItem('jobTrackerJobs', JSON.stringify(jobs))
}

// Load jobs from localStorage
function loadFromStorage() {
  const saved = localStorage.getItem('jobTrackerJobs')
  if (saved) {
    jobs = JSON.parse(saved)
  }
}

// Clear the form inputs
function clearForm() {
  inputCompany.value = ''
  inputRole.value = ''
  inputType.value = 'remote'
  inputNotes.value = ''
}

// Load jobs when page first opens
function renderBoard(){

  // Clear all four columns
  document.getElementById('col-applied').innerHTML = ''
  document.getElementById('col-interview').innerHTML = ''
  document.getElementById('col-offer').innerHTML = ''
  document.getElementById('col-rejected').innerHTML = ''

  // Count jobs per column
  const counts = {
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0
  }

  // Loop through every job and create a card
  jobs.forEach((job) => {

    // Build the card element
    const card = document.createElement('div')
    card.className = 'card'
    card.draggable = true
    card.dataset.id = job.id

    // Fill the card with HTML
    card.innerHTML = `
      <div class="card-top">
        <div class="card-company">${job.company}</div>
        <button class="card-delete" data-id="${job.id}">✕</button>
      </div>
      <div class="card-role">${job.role}</div>
      <div class="card-footer">
        <span class="card-date">${job.date}</span>
        <span class="card-tag tag-${job.type}">${job.type}</span>
      </div>
    `

    // Add drag events to the card
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging')
      card.dataset.dragId = job.id
    })

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging')
      document.querySelectorAll('.column').forEach(col => {
        col.classList.remove('drag-over')
      })
    })

    // Add delete button event
    card.querySelector('.card-delete').addEventListener('click', () => {
      deleteJob(job.id)
    })

    // Add the card to the correct column
    document.getElementById(`col-${job.status}`).appendChild(card)

    // Increment the count for this column
    counts[job.status]++

  })

  // Update column counts
  document.getElementById('count-applied').textContent = counts.applied
  document.getElementById('count-interview').textContent = counts.interview
  document.getElementById('count-offer').textContent = counts.offer
  document.getElementById('count-rejected').textContent = counts.rejected

  // Update stats
  document.getElementById('stat-total').textContent = jobs.length
  document.getElementById('stat-applied').textContent = counts.applied
  document.getElementById('stat-interview').textContent = counts.interview
  document.getElementById('stat-offer').textContent = counts.offer

  // Set up drag and drop on columns
  setupDragAndDrop()

}

// ---- DELETE JOB ----
function deleteJob(id) {
  if (!confirm('Remove this application?')) return
  jobs = jobs.filter(job => job.id !== id)
  saveToStorage()
  renderBoard()
}

// ---- DRAG AND DROP ----
function setupDragAndDrop() {

  const columns = document.querySelectorAll('.column')

  columns.forEach((column) => {

    // When a card is dragged over a column
    column.addEventListener('dragover', (e) => {
      // This line is required — without it dropping is not allowed
      e.preventDefault()
      column.classList.add('drag-over')
    })

    // When a dragged card leaves a column
    column.addEventListener('dragleave', (e) => {
      // Only remove highlight if we're leaving the column entirely
      if (!column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over')
      }
    })

    // When a card is dropped onto a column
    column.addEventListener('drop', (e) => {
      e.preventDefault()
      column.classList.remove('drag-over')

      // Find the card that was being dragged
      const draggingCard = document.querySelector('.dragging')
      if (!draggingCard) return

      // Get the job id from the card
      const jobId = draggingCard.dataset.id

      // Get the new status from the column
      const newStatus = column.dataset.status

      // Find the job in our array and update its status
      const job = jobs.find(j => j.id === jobId)
      if (job) {
        job.status = newStatus
      }

      // Save and redraw
      saveToStorage()
      renderBoard()

    })

  })

}
// ---- EMPTY STATE ----
function renderBoard() {
  // find this line inside renderBoard already written
}