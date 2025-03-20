import { getExcludedWordIds, addExcludedWordId } from './localStorage.js'
import { shuffleArray } from './funcs.js'


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

      const parts = rows[i].split('\t')
      if (parts.length == 7) {
        if (level === parts[5].trim()) {
          allWords.push({
            id: parts[0].trim(),
            level: parts[5].trim(),
            english: parts[1].trim(),
            japanese: parts[2].trim(),
            example: `${parts[3].trim()}<br>${parts[4].trim()}`,
            similar: parts[6].trim()
          })
        }
      }
    }

    shuffleArray(allWords)
    renderTables()
    console.log('Loaded words:', allWords)
  } catch (error) {
    console.error('Error loading CSV:', error)
  }
}

function handleTableBodyClick (e) {
  if (e.target.classList.contains('show-or-hide')) {
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
                <td class="show-or-hide" style="opacity: 0">${word.japanese}</td>
                <td class="show-or-hide2" style="opacity: 0">${word.example}</td>
                <td class="check"><input type="checkbox" name="exclude" value="${word.id}"></td>
              </tr>
            `
      index++
    }
  })
  tableBody.innerHTML = tableHTML
  tableBody.removeEventListener('click', handleTableBodyClick)
  tableBody.addEventListener('click', handleTableBodyClick)
}

document.getElementById('checkAll').addEventListener('change', e => {
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

document.getElementById('checkAll2').addEventListener('change', e => {
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

excludeBtn.addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('input[name="exclude"]:checked')
  const values = Array.from(checkboxes).map(checkbox => checkbox.value)
  for (const v of values) {
    addExcludedWordId(v)
  }
  renderTables()
})

window.addEventListener('DOMContentLoaded', loadCSV)
