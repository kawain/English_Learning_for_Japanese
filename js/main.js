let count = 0
let timerId = null
let isRunning = false
let volume = 0.5
let wordArray = []
let originalWordArray = []
const localStorageKey = 'excludedWords' // localStorageのキー

// 1ブロックあたりの単語数
const blockSize = 10
let currentIndex = 0
let review = false

// 初期レベル
let currentLevel = '1'

const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const counterDisplay = document.getElementById('counter')
const volumeSlider = document.getElementById('volumeSlider')
const volumeValue = document.getElementById('volumeValue')
const englishDisplay = document.getElementById('englishWord')
const japaneseDisplay = document.getElementById('japaneseWord')
const englishDisplay2 = document.getElementById('englishWord2')
const japaneseDisplay2 = document.getElementById('japaneseWord2')
const levelRadios = document.querySelectorAll('input[name="level"]')
const reviewBox = document.getElementById('reviewBox')
const tableBody = document.getElementById('wordTableBody')

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
    const excludedWords =
      JSON.parse(localStorage.getItem(localStorageKey)) || [] // localStorageから除外単語を取得

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].trim() === '') continue

      const parts = rows[i].split('★')
      if (parts.length == 6) {
        const word = {
          id: parts[0].trim(),
          en1: parts[1].trim(),
          jp1: parts[2].trim(),
          en2: parts[3].trim(),
          jp2: parts[4].trim(),
          level: parts[5].trim()
        }
        // 除外された単語でない場合のみ配列に追加
        if (!excludedWords.includes(word.id)) {
          originalWordArray.push(word)
        }
      }
    }

    // 初期レベルでフィルタリングしてシャッフル
    filterAndShuffle(currentLevel)
    console.log('Loaded words:', originalWordArray)
  } catch (error) {
    console.error('Error loading CSV:', error)
  }
}

// レベルでフィルタリングしてシャッフル
function filterAndShuffle (level) {
  wordArray = originalWordArray.filter(word => word.level === level)
  shuffleArray(wordArray)
  currentIndex = 0
  count = 0
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
    if (wordArray.length === 0) {
      alert('選択されたレベルの単語がありません。')
      stopStudy()
      return
    }

    const word = wordArray[currentIndex]
    count++
    counterDisplay.textContent = `${count}回目 (${
      review === false ? '初回' : '復習'
    })`

    if (review) {
      englishDisplay.textContent = word.en1
      japaneseDisplay.textContent = word.jp1
      englishDisplay2.textContent = word.en2
      japaneseDisplay2.textContent = ''
      await tts(word.en2, 'en-US')
      japaneseDisplay2.textContent = word.jp2
      await tts(word.jp2, 'ja-JP')
      await tts(word.en2, 'en-US')
    } else {
      // 新しい行 (<tr>) を作成
      const newRow = document.createElement('tr')
      // セル (<td>) を作成し、内容を設定
      const cell1 = document.createElement('td')
      cell1.textContent = word.en1
      const cell2 = document.createElement('td')
      cell2.textContent = word.jp1
      const cell3 = document.createElement('td')
      cell3.innerHTML = `${word.en2}<br>${word.jp2}`
      // セルを行に追加
      newRow.appendChild(cell1)
      newRow.appendChild(cell2)
      newRow.appendChild(cell3)
      // 行をテーブル本体に追加
      tableBody.appendChild(newRow)

      englishDisplay.textContent = word.en1
      japaneseDisplay.textContent = '?'
      englishDisplay2.textContent = ''
      japaneseDisplay2.textContent = ''
      await tts(word.en1, 'en-US')
      await tts(word.en1, 'en-US')
      japaneseDisplay.textContent = word.jp1
      await tts(word.jp1, 'ja-JP')
      await tts(word.en1, 'en-US')
      englishDisplay2.textContent = word.en2
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
        stopStudy()
        currentIndex = 0
        count = 0
        releaseWakeLock() // アプリ停止時に Wake Lock を解除する
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
    reviewBox.style.display = 'block'
  }
})

function stopStudy () {
  clearTimeout(timerId)
  isRunning = false
  startBtn.disabled = false
  stopBtn.disabled = true
}

stopBtn.addEventListener('click', () => {
  stopStudy()
})

stopBtn.disabled = true

// ラジオボタンの変更を監視
levelRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    currentLevel = radio.value
    filterAndShuffle(currentLevel)
    stopStudy()
    counterDisplay.textContent = `${count}回目 (初回)`
    startBtn.disabled = false
    stopBtn.disabled = true
    englishDisplay.textContent = ''
    japaneseDisplay.textContent = ''
    englishDisplay2.textContent = ''
    japaneseDisplay2.textContent = ''
    tableBody.innerHTML = '' // 画面クリア
  })
})

window.addEventListener('DOMContentLoaded', loadCSV)
