import {
  getExcludedWordIds,
  removeExcludedWordId,
  clearExcludedWordIds
} from './localStorage.js'

const excludedTableBody = document.getElementById('excludedTableBody')
const clearLocalStorageButton = document.getElementById('clearLocalStorage')

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
        allWords.push({
          id: parts[0].trim(),
          level: parts[5].trim(),
          english: parts[1].trim(),
          japanese: parts[2].trim(),
          example: `${parts[3].trim()}<br>${parts[4].trim()}`,
          index: i + 1
        })
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
  // 除外されたテーブルの描画
  let excludedTableHTML = ''
  allWords.forEach(word => {
    if (excludedWords.includes(word.id)) {
      excludedTableHTML += `
              <tr>
                <td class="wordNo">${word.index}</td>
                <td class="wordNo">${word.level}</td>
                <td>${word.english}</td>
                <td>${word.japanese}</td>
                <td>${word.example}</td>
                <td class="wordNo"><button class="restore-button" data-id="${word.id}">復元</button></td>
              </tr>
            `
    }
  })
  excludedTableBody.innerHTML = excludedTableHTML
}

excludedTableBody.addEventListener('click', e => {
  const clickedElement = e.target
  if (clickedElement.classList.contains('restore-button')) {
    const dataId = clickedElement.dataset.id
    if (dataId) {
      removeExcludedWordId(dataId)
      renderTables()
    }
  }
})

// ローカルストレージのクリア
clearLocalStorageButton.addEventListener('click', () => {
  clearExcludedWordIds()
  renderTables()
  console.log('ローカルストレージをクリアしました')
})

window.addEventListener('DOMContentLoaded', loadCSV)
