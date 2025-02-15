import {
  getExcludedWordIds,
  addExcludedWordId,
  removeExcludedWordId,
  clearExcludedWordIds
} from './localStorage.js'

document.getElementById('h1').textContent = `レベル${level} `
const tableBody = document.getElementById('wordTableBody')
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
        if (level === parts[5].trim()) {
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
  allWords.forEach(word => {
    if (!excludedWords.includes(word.id)) {
      tableHTML += `
              <tr>
                <td class="wordNo">${word.index}</td>
                <td class="wordNo">${word.level}</td>
                <td>${word.english}</td>
                <td>${word.japanese}</td>
                <td>${word.example}</td>
                <td class="wordNo"><button class="exclude-button" data-id="${word.id}">除外</button></td>
              </tr>
            `
    }
  })
  tableBody.innerHTML = tableHTML

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

tableBody.addEventListener('click', e => {
  const clickedElement = e.target
  if (clickedElement.classList.contains('exclude-button')) {
    const dataId = clickedElement.dataset.id
    if (dataId) {
      addExcludedWordId(dataId)
      renderTables()
    } else {
      console.warn('クリックされたボタンにdata-id属性がありません。')
    }
  }
})

excludedTableBody.addEventListener('click', e => {
  const clickedElement = e.target
  if (clickedElement.classList.contains('restore-button')) {
    const dataId = clickedElement.dataset.id
    if (dataId) {
      removeExcludedWordId(dataId)
      renderTables()
    } else {
      console.warn('クリックされたボタンにdata-id属性がありません。')
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
