let count = 0
let timerId = null
let isRunning = false
let volume = 0.5
let wordArray = []

const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const counterDisplay = document.getElementById('counter')
const volumeSlider = document.getElementById('volumeSlider')
const volumeValue = document.getElementById('volumeValue')
const englishDisplay = document.getElementById('englishWord')
const japaneseDisplay = document.getElementById('japaneseWord')
const englishDisplay2 = document.getElementById('englishWord2')
const japaneseDisplay2 = document.getElementById('japaneseWord2')

// CSVファイルを読み込む関数
async function loadCSV () {
  try {
    const response = await fetch('./word.csv')
    const data = await response.text()
    const rows = data.split('\n')
    const tableBody = document.getElementById('wordTableBody')
    let tableHTML = ''

    // ヘッダー行をスキップして2行目から処理
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim() === '') continue

      const parts = rows[i].split('★')
      if (parts.length >= 4) {
        if (parts[3].trim()) {
          wordArray.push({
            en1: parts[0].trim(),
            jp1: parts[1].trim(),
            jp2: parts[2].trim(),
            en2: parts[3].trim()
          })
        }

        // テーブル行の作成
        tableHTML += `
          <tr>
            <td class="wordNo">${i}</td>
            <td>${parts[0].trim()}</td>
            <td>${parts[1].trim()}</td>
            <td>${parts[2].trim()}<br>${parts[3].trim()}</td>
          </tr>
        `
      }
    }

    tableBody.innerHTML = tableHTML
    console.log('Loaded words:', wordArray)
  } catch (error) {
    console.error('Error loading CSV:', error)
  }
}

function getRandomWord () {
  const randomIndex = Math.floor(Math.random() * wordArray.length)
  return wordArray[randomIndex]
}

volumeSlider.addEventListener('input', e => {
  volume = e.target.value / 100
  volumeValue.textContent = `${e.target.value}%`
})

const tts = (text, lang) => {
  return new Promise((resolve, reject) => {
    const uttr = new SpeechSynthesisUtterance()
    uttr.text = text
    uttr.lang = lang
    uttr.rate = 1.0
    uttr.pitch = 1.0
    uttr.volume = volume

    uttr.onend = () => resolve()
    uttr.onerror = error => reject(error)

    speechSynthesis.speak(uttr)
  })
}

const speakWord = async () => {
  try {
    count++
    counterDisplay.textContent = `${count}回目`

    const word = getRandomWord()
    englishDisplay.textContent = word.en1
    japaneseDisplay.textContent = '?'
    englishDisplay2.textContent = ''
    japaneseDisplay2.textContent = ''

    await tts(word.en1, 'en-US')
    await tts(word.en1, 'en-US')
    japaneseDisplay.textContent = word.jp1
    englishDisplay2.textContent = word.en2

    await tts(word.jp1, 'ja-JP')
    await tts(word.en1, 'en-US')
    await tts(word.en2, 'en-US')

    japaneseDisplay2.textContent = word.jp2

    await tts(word.jp2, 'ja-JP')
    await tts(word.en2, 'en-US')

    if (isRunning) {
      timerId = setTimeout(speakWord, 3000)
    }
  } catch (error) {
    console.error('Speech synthesis error:', error)
  }
}

startBtn.addEventListener('click', () => {
  if (!isRunning) {
    isRunning = true
    speakWord()
    startBtn.disabled = true
    stopBtn.disabled = false
  }
})

stopBtn.addEventListener('click', () => {
  if (isRunning) {
    clearTimeout(timerId)
    isRunning = false
    startBtn.disabled = false
    stopBtn.disabled = true
  }
})

stopBtn.disabled = true

window.addEventListener('DOMContentLoaded', loadCSV)
