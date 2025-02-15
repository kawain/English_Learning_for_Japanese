// localStorage.js

const localStorageKey = 'excludedWords'

/**
 * ローカルストレージから除外されたIDの配列を取得する。
 * @returns {string[]} 除外されたIDの配列 (存在しない場合は空の配列)
 */
export function getExcludedWordIds () {
  try {
    const storedIds = localStorage.getItem(localStorageKey)
    return storedIds ? JSON.parse(storedIds) : []
  } catch (error) {
    console.error('ローカルストレージからのID取得に失敗しました:', error)
    return [] // エラー発生時は空の配列を返す
  }
}

/**
 * ローカルストレージの除外されたIDの配列にIDを追加する。重複チェックを行う。
 * @param {string} wordId 追加するID (文字列)
 */
export function addExcludedWordId (wordId) {
  try {
    const excludedIds = getExcludedWordIds()

    if (!excludedIds.includes(wordId)) {
      excludedIds.push(wordId)
      localStorage.setItem(localStorageKey, JSON.stringify(excludedIds))
    }
  } catch (error) {
    console.error('ローカルストレージへのID追加に失敗しました:', error)
  }
}

/**
 * ローカルストレージの除外されたIDの配列からIDを削除する。
 * @param {string} wordId 削除するID (文字列)
 */
export function removeExcludedWordId (wordId) {
  try {
    let excludedIds = getExcludedWordIds()
    excludedIds = excludedIds.filter(id => id !== wordId)
    localStorage.setItem(localStorageKey, JSON.stringify(excludedIds))
  } catch (error) {
    console.error('ローカルストレージからのID削除に失敗しました:', error)
  }
}

/**
 * ローカルストレージの除外されたIDの配列をクリアする。
 */
export function clearExcludedWordIds () {
  try {
    localStorage.removeItem(localStorageKey)
  } catch (error) {
    console.error('ローカルストレージのクリアに失敗しました:', error)
  }
}
