let count = 0
let timerId = null
let isRunning = false
let volume = 0.5
let wordArray = []

// 1ブロックあたりの単語数
const blockSize = 2
let currentIndex = 0
let review = false

const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const counterDisplay = document.getElementById('counter')
const volumeSlider = document.getElementById('volumeSlider')
const volumeValue = document.getElementById('volumeValue')
const englishDisplay = document.getElementById('englishWord')
const japaneseDisplay = document.getElementById('japaneseWord')
const englishDisplay2 = document.getElementById('englishWord2')
const japaneseDisplay2 = document.getElementById('japaneseWord2')

// Wake Lock 関連の変数・関数
let wakeLock = null

// Wake Lock を要求する関数（ユーザー入力処理内で呼び出す）
async function requestWakeLock () {
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock が解放されました。')
    })
    console.log('Wake Lock が取得されました。')
  } catch (err) {
    console.error(`Wake Lock 取得に失敗しました: ${err.name}, ${err.message}`)
  }
}

function releaseWakeLock () {
  if (wakeLock !== null) {
    wakeLock.release()
    wakeLock = null
  }
}

// ページが再表示されたときに再取得する処理（任意）
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock()
  }
})

// 配列をシャッフルする（Fisher-Yatesアルゴリズム）
function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

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
    // 読み込み後に配列をシャッフル
    shuffleArray(wordArray)
    console.log('Loaded words:', wordArray)
  } catch (error) {
    console.error('Error loading CSV:', error)
  }
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
    const word = wordArray[currentIndex]
    count++
    counterDisplay.textContent = `${count}回目 (${
      review === false ? '初回' : '復習'
    })`

    if (review) {
      // 表示初期化
      englishDisplay.textContent = word.en1
      japaneseDisplay.textContent = word.jp1
      englishDisplay2.textContent = word.en2
      japaneseDisplay2.textContent = ''

      await tts(word.en2, 'en-US')

      japaneseDisplay2.textContent = word.jp2

      await tts(word.jp2, 'ja-JP')
      await tts(word.en2, 'en-US')
    } else {
      // 表示初期化
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
    }

    currentIndex++
    if (review) {
      if (currentIndex % blockSize == 0) {
        review = false
      } else if (currentIndex >= wordArray.length) {
        alert('終了しました。ページを再読込してください。')
        review = false
        isRunning = false
        startBtn.disabled = false
        stopBtn.disabled = true
        currentIndex = 0
        releaseWakeLock() // ロック解除
        return
      }
    } else {
      if (currentIndex % blockSize == 0) {
        review = true
        currentIndex = currentIndex - blockSize
      } else if (currentIndex >= wordArray.length) {
        review = true
        currentIndex = currentIndex - parseInt(wordArray.length % blockSize)
      }
    }

    if (isRunning) {
      timerId = setTimeout(speakWord, 2000)
    }
  } catch (error) {
    console.error('Speech synthesis error:', error)
  }
}

startBtn.addEventListener('click', async () => {
  if (!isRunning) {
    isRunning = true
    // ユーザーの操作イベント内で Wake Lock を要求する
    await requestWakeLock()
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
    releaseWakeLock() // アプリ停止時に Wake Lock を解除する
  }
})

stopBtn.disabled = true

window.addEventListener('DOMContentLoaded', loadCSV)
