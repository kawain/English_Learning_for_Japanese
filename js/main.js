import { getExcludedWordIds, addExcludedWordId } from './localStorage.js'

let count = 0
let timerId = null
let isRunning = false
let volume = 0.5
let wordArray = []
let originalWordArray = []
let currentIndex = 0

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
const related = document.getElementById('related')

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
    const excludedWords = getExcludedWordIds()

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].trim() === '') continue

      const parts = rows[i].split('\t')
      if (parts.length == 7) {
        const word = {
          id: parts[0].trim(),
          en: parts[0].trim(),
          en1: parts[1].trim(),
          jp1: parts[2].trim(),
          en2: parts[3].trim(),
          jp2: parts[4].trim(),
          level: parts[5].trim(),
          similar: parts[6].trim()
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
  console.log(wordArray)
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
    counterDisplay.textContent = `${count}回目`

    // 新しい行 (<tr>) を作成
    const newRow = document.createElement('tr')
    // セル (<td>) を作成し、内容を設定
    const cell1 = document.createElement('td')
    cell1.textContent = word.en1
    const cell2 = document.createElement('td')
    cell2.textContent = word.jp1
    const cell3 = document.createElement('td')
    cell3.innerHTML = `${word.en2}<br>${word.jp2}`
    const cell4 = document.createElement('td')
    cell4.classList.add('wordNo')
    cell4.innerHTML = `<button class="exclude-button" data-id="${word.id}">除外</button>`
    // セルを行に追加
    newRow.appendChild(cell1)
    newRow.appendChild(cell2)
    newRow.appendChild(cell3)
    newRow.appendChild(cell4)
    // 行をテーブル本体に追加
    tableBody.appendChild(newRow)

    englishDisplay.textContent = word.en1
    japaneseDisplay.textContent = '?'
    englishDisplay2.textContent = ''
    japaneseDisplay2.textContent = ''
    related.textContent = ''

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

    // 関連
    const arr = word.similar
      .trim()
      .replace(/\[|\]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map(Number)

    let newParagraph = document.createElement('p')
    newParagraph.textContent = '【関連例文】'
    related.appendChild(newParagraph)

    for (let i = 0; i < arr.length; i++) {
      let foundWord = wordArray.find(obj => obj.id === String(arr[i]))
      newParagraph = document.createElement('p')
      newParagraph.innerHTML = `${foundWord.en2}<br>${foundWord.jp2}`

      // 2番目の要素を取得
      const secondChild = related.children[1]
      // 2番目の要素が存在する場合
      if (secondChild) {
        // insertBefore を使って2番目に追加
        related.insertBefore(newParagraph, secondChild)
      } else {
        // 2番目の要素が存在しない場合（子要素が1つ以下の場合）
        // appendChild を使って最後に追加（または最初に追加）
        related.appendChild(newParagraph)
      }

      await tts(foundWord.en2, 'en-US')
    }

    currentIndex++

    if (currentIndex >= wordArray.length) {
      alert('終了しました。')
      filterAndShuffle(currentLevel)
      stopStudy()
      counterDisplay.textContent = `${count}回目`
      startBtn.disabled = false
      stopBtn.disabled = true
      englishDisplay.textContent = ''
      japaneseDisplay.textContent = ''
      englishDisplay2.textContent = ''
      japaneseDisplay2.textContent = ''
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
    counterDisplay.textContent = `${count}回目`
    startBtn.disabled = false
    stopBtn.disabled = true
    englishDisplay.textContent = ''
    japaneseDisplay.textContent = ''
    englishDisplay2.textContent = ''
    japaneseDisplay2.textContent = ''
  })
})

tableBody.addEventListener('click', e => {
  const clickedElement = e.target
  if (clickedElement.classList.contains('exclude-button')) {
    const dataId = clickedElement.dataset.id
    if (dataId) {
      addExcludedWordId(dataId)
      alert('除外しました')
    }
  }
})

window.addEventListener('DOMContentLoaded', loadCSV)
