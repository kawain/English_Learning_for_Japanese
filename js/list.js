import { getExcludedWordIds, addExcludedWordId } from './localStorage.js'

document.getElementById('h1').textContent = `レベル${level} `
const tableBody = document.getElementById('wordTableBody')
const excludeBtn = document.getElementById('exclude')

let allWords = []

// CSVファイルを読み込む関数
async function loadCSV () {
  try {
    const response = await fetch('./word.csv')
    const data = await response.text()
    const rows = data.split('\n')
    allWords = []

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].trim() === '') continue

      const parts = rows[i].split('★')
      if (parts.length == 6) {
        if (level === parts[5].trim()) {
          allWords.push({
            id: parts[0].trim(),
            level: parts[5].trim(),
            english: parts[1].trim(),
            japanese: parts[2].trim(),
            example: `${parts[3].trim()}<br>${parts[4].trim()}`
          })
        }
      }
    }

    renderTables()
    console.log('Loaded words:', allWords)
  } catch (error) {
    console.error('Error loading CSV:', error)
  }
}

function renderTables () {
  const excludedWords = getExcludedWordIds()

  // 通常のテーブルの描画
  let tableHTML = ''
  let index = 1
  allWords.forEach(word => {
    if (!excludedWords.includes(word.id)) {
      tableHTML += `
              <tr>
                <td class="wordNo">${index}</td>
                <td class="wordNo">${word.level}</td>
                <td>${word.english}</td>
                <td>${word.japanese}</td>
                <td>${word.example}</td>
                <td class="check"><input type="checkbox" name="exclude" value="${word.id}"></td>
              </tr>
            `
      index++
    }
  })
  tableBody.innerHTML = tableHTML

  document.querySelectorAll('td.check').forEach(td => {
    td.addEventListener('click', function (event) {
      if (event.target.tagName !== 'INPUT') {
        const checkbox = this.querySelector('input[type="checkbox"]')
        if (checkbox) {
          checkbox.checked = !checkbox.checked
        }
      }
    })
  })
}

excludeBtn.addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('input[name="exclude"]:checked')
  const values = Array.from(checkboxes).map(checkbox => checkbox.value)
  for (const v of values) {
    addExcludedWordId(v)
  }
  renderTables()
})

window.addEventListener('DOMContentLoaded', loadCSV)
