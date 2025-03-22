import { getExcludedWordIds, addExcludedWordId } from './localStorage.js'
import { shuffleArray } from './funcs.js'

// グローバル変数をオブジェクトにまとめる
const appState = {
  count: 0,
  timerId: null,
  isRunning: false,
  volume: 0.5,
  wordArray: [],
  originalWordArray: [],
  currentIndex: 0,
  currentLevel: '1',
  wakeLock: null
}

// DOM要素の取得をまとめる
const domElements = {
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  counterDisplay: document.getElementById('counter'),
  volumeSlider: document.getElementById('volumeSlider'),
  volumeValue: document.getElementById('volumeValue'),
  englishDisplay: document.getElementById('englishWord'),
  japaneseDisplay: document.getElementById('japaneseWord'),
  englishDisplay2: document.getElementById('englishWord2'),
  japaneseDisplay2: document.getElementById('japaneseWord2'),
  related: document.getElementById('related'),
  levelRadios: document.querySelectorAll('input[name="level"]'),
  reviewBox: document.getElementById('reviewBox'),
  tableBody: document.getElementById('wordTableBody')
}

// Wake Lock 関連の関数
async function requestWakeLock () {
  try {
    appState.wakeLock = await navigator.wakeLock.request('screen')
    appState.wakeLock.addEventListener('release', () => {
      console.log('Wake Lock が解放されました。')
    })
    console.log('Wake Lock が取得されました。')
  } catch (err) {
    console.error(`Wake Lock 取得に失敗しました: ${err.name}, ${err.message}`)
  }
}

function releaseWakeLock () {
  if (appState.wakeLock !== null) {
    appState.wakeLock
      .release()
      .then(() => {
        console.log('Wake Lock を明示的に解放しました。')
        appState.wakeLock = null
      })
      .catch(err => {
        console.error('Wake Lock の解放に失敗しました:', err)
      })
  }
}

// ページが再表示されたときに再取得する処理（任意）
document.addEventListener('visibilitychange', async () => {
  if (appState.wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock()
  }
})

// CSVファイルを読み込む関数
async function loadCSV () {
  try {
    const response = await fetch('./word.csv')
    const data = await response.text()
    const rows = data.split('\n')

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].trim() === '') continue

      const parts = rows[i].split('\t')
      if (parts.length == 7) {
        const word = {
          id: parts[0].trim(),
          en1: parts[1].trim(),
          jp1: parts[2].trim(),
          en2: parts[3].trim(),
          jp2: parts[4].trim(),
          level: parts[5].trim(),
          similar: parts[6].trim()
        }
        appState.originalWordArray.push(word)
      }
    }

    // localStorageからレベルを取得、なければデフォルトの'1'
    appState.currentLevel = localStorage.getItem('currentLevel') || '1'
    // ラジオボタンをセット
    document.querySelector(
      `input[name="level"][value="${appState.currentLevel}"]`
    ).checked = true

    // 初期レベルでフィルタリングしてシャッフル
    filterAndShuffle(appState.currentLevel)

    console.log('Loaded words:', appState.originalWordArray)
  } catch (error) {
    console.error('Error loading CSV:', error)
  }
}

// レベルでフィルタリングしてシャッフル
function filterAndShuffle (level) {
  appState.wordArray = []
  const excludedWords = getExcludedWordIds()
  // 除外された単語でない場合のみ配列に追加
  for (const word of appState.originalWordArray) {
    if (!excludedWords.includes(word.id)) {
      if (word.level === level) {
        appState.wordArray.push(word)
      }
    }
  }
  shuffleArray(appState.wordArray)
  appState.currentIndex = 0
  appState.count = 0
  console.log(appState.wordArray)
}

domElements.volumeSlider.addEventListener('input', e => {
  appState.volume = e.target.value / 100
  domElements.volumeValue.textContent = `${e.target.value}%`
})

// TTS関数
function tts (text, lang) {
  return new Promise((resolve, reject) => {
    const uttr = new SpeechSynthesisUtterance()
    uttr.text = text
    uttr.lang = lang
    uttr.rate = 1.0
    uttr.pitch = 1.0
    uttr.volume = appState.volume

    uttr.onend = () => resolve()
    uttr.onerror = error => reject(error)

    speechSynthesis.speak(uttr)
  })
}

// テーブルに単語を追加する関数
function addWordToTable (word) {
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
  domElements.tableBody.appendChild(newRow)
}

// 関連語を表示する関数
async function displayRelatedWords (word) {
  if (!word.similar) {
    return
  }
  const arr = word.similar
    .trim()
    .replace(/\[|\]/g, '')
    .split(/,/)
    .filter(Boolean)
    .map(String)

  const relatedContainer = domElements.related
  const relatedTitle = relatedContainer.firstChild // <p>【関連例文】</p>
  for (let i = 0; i < arr.length; i++) {
    let foundWord = appState.originalWordArray.find(obj => obj.id === arr[i])
    if (foundWord) {
      const newRelatedElement = document.createElement('p')
      newRelatedElement.innerHTML = `${foundWord.en2}<br>${foundWord.jp2}`
      // 2番目の子要素として挿入
      relatedContainer.insertBefore(newRelatedElement, relatedTitle.nextSibling)
      await tts(foundWord.en2, 'en-US') // 読み上げを待つ
    }
  }
}

// 単語を読み上げる関数
async function speakWord () {
  try {
    if (appState.wordArray.length === 0) {
      alert('選択されたレベルの単語がありません。')
      stopStudy()
      return
    }

    const word = appState.wordArray[appState.currentIndex]
    appState.count++
    domElements.counterDisplay.textContent = `${appState.count}回目`

    addWordToTable(word)

    domElements.englishDisplay.textContent = word.en1
    domElements.japaneseDisplay.textContent = '?'
    domElements.englishDisplay2.textContent = ''
    domElements.japaneseDisplay2.textContent = ''
    domElements.related.textContent = ''

    await tts(word.en1, 'en-US')
    await tts(word.en1, 'en-US')
    domElements.japaneseDisplay.textContent = word.jp1
    await tts(word.jp1, 'ja-JP')
    await tts(word.en1, 'en-US')
    domElements.englishDisplay2.textContent = word.en2
    await tts(word.en2, 'en-US')
    domElements.japaneseDisplay2.textContent = word.jp2
    await tts(word.jp2, 'ja-JP')
    await tts(word.en2, 'en-US')

    // 関連
    domElements.related.innerHTML = '<p>【関連例文】</p>'
    await displayRelatedWords(word)

    appState.currentIndex++

    if (appState.currentIndex >= appState.wordArray.length) {
      alert('終了しました。')
      filterAndShuffle(appState.currentLevel)
      stopStudy()
      domElements.counterDisplay.textContent = `${appState.count}回目`
      domElements.englishDisplay.textContent = ''
      domElements.japaneseDisplay.textContent = ''
      domElements.englishDisplay2.textContent = ''
      domElements.japaneseDisplay2.textContent = ''
      domElements.related.textContent = ''
      releaseWakeLock()
      return
    }

    if (appState.isRunning) {
      appState.timerId = setTimeout(speakWord, 2000)
    }
  } catch (error) {
    console.error('Speech synthesis error:', error)
    alert('音声合成でエラーが発生しました。')
  }
}

domElements.startBtn.addEventListener('click', async () => {
  if (!appState.isRunning) {
    appState.isRunning = true
    // ユーザーの操作イベント内で Wake Lock を要求する
    await requestWakeLock()
    speakWord()
    domElements.startBtn.disabled = true
    domElements.stopBtn.disabled = false
    domElements.reviewBox.style.display = 'block'
  }
})

function stopStudy () {
  clearTimeout(appState.timerId)
  appState.isRunning = false
  domElements.startBtn.disabled = false
  domElements.stopBtn.disabled = true
  releaseWakeLock() // Wake Lock を解放
}

domElements.stopBtn.addEventListener('click', () => {
  stopStudy()
})

domElements.stopBtn.disabled = true

// ラジオボタンの変更を監視
domElements.levelRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    // 選択されたレベルをlocalStorageに保存
    localStorage.setItem('currentLevel', radio.value)
    // ページを再読み込み
    location.reload()
  })
})

domElements.tableBody.addEventListener('click', e => {
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
