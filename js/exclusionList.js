import {
  getExcludedWordIds,
  removeExcludedWordId,
  clearExcludedWordIds
} from './localStorage.js'

const checkAll = document.getElementById('checkAll')
const checkAll2 = document.getElementById('checkAll2')
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
          example: `${parts[3].trim()}<br>${parts[4].trim()}`
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
  let index = 1
  allWords.forEach(word => {
    if (excludedWords.includes(word.id)) {
      excludedTableHTML += `
              <tr>
                <td class="wordNo">${index}</td>
                <td class="wordNo">${word.level}</td>
                <td>${word.english}</td>
                <td class="show-or-hide" style="opacity: 0">${word.japanese}</td>
                <td class="show-or-hide2" style="opacity: 0">${word.example}</td>
                <td class="wordNo"><button class="restore-button" data-id="${word.id}">復元</button></td>
              </tr>
            `
      index++
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
  } else if (e.target.classList.contains('show-or-hide')) {
    const element = e.target
    if (element.style.opacity === '0') {
      element.style.opacity = '1'
    } else {
      element.style.opacity = '0'
    }
  } else if (e.target.classList.contains('show-or-hide2')) {
    const element = e.target
    if (element.style.opacity === '0') {
      element.style.opacity = '1'
    } else {
      element.style.opacity = '0'
    }
  }
})

checkAll.addEventListener('change', e => {
  if (e.target.checked) {
    document.querySelectorAll('.show-or-hide').forEach(element => {
      element.style.opacity = '1'
    })
  } else {
    document.querySelectorAll('.show-or-hide').forEach(element => {
      element.style.opacity = '0'
    })
  }
})

checkAll2.addEventListener('change', e => {
  if (e.target.checked) {
    document.querySelectorAll('.show-or-hide2').forEach(element => {
      element.style.opacity = '1'
    })
  } else {
    document.querySelectorAll('.show-or-hide2').forEach(element => {
      element.style.opacity = '0'
    })
  }
})

// ローカルストレージのクリア
clearLocalStorageButton.addEventListener('click', () => {
  clearExcludedWordIds()
  renderTables()
  console.log('ローカルストレージをクリアしました')
})

window.addEventListener('DOMContentLoaded', loadCSV)
