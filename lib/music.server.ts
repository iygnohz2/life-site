import fs from 'node:fs'
import path from 'node:path'
import type { Track } from './music'

const DIR = path.join(process.cwd(), 'public', 'music')
const FILE = path.join(process.cwd(), 'site-data', 'music.json')
const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|wav|flac)$/i

/**
 * 获取播放列表。
 *
 * 两种来源，优先级从高到低：
 * 1. 外链模式：site-data/music.json 里配置「数组」曲目，每项含 url（如腾讯云 COS）——
 *    { "tracks": [ { "title": "曲名", "artist": "歌手", "url": "https://..." } ] }
 *    适合音乐托管在国内对象存储/CDN 的场景。
 * 2. 本地模式：music.json 的 tracks 为空数组或对象时，自动扫描 public/music/ 目录，
 *    歌名默认取文件名（去掉扩展名）。
 *
 * 只在服务端调用（layout / 页面），不要被客户端组件 import。
 */
export function getTracks(): Track[] {
  let raw: any = null
  try {
    raw = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    raw = null
  }

  // 1. 外链模式：tracks 是「非空数组」
  if (raw && Array.isArray(raw.tracks) && raw.tracks.length) {
    return raw.tracks
      .filter((t: any) => t && typeof t.url === 'string' && t.url.trim())
      .map((t: any) => ({
        title: t.title || '未命名',
        artist: t.artist || '',
        src: t.url.trim(),
      }))
  }

  // 2. 本地模式：扫描 public/music/
  let files: string[] = []
  try {
    files = fs.readdirSync(DIR).filter((f) => AUDIO_EXT.test(f))
  } catch {
    return []
  }
  if (!files.length) return []

  let meta: Record<string, { title?: string; artist?: string }> = {}
  if (raw && raw.tracks && !Array.isArray(raw.tracks) && typeof raw.tracks === 'object') {
    meta = raw.tracks
  }

  return files
    .sort((a, b) => a.localeCompare(b, 'zh'))
    .map((file) => {
      const m = meta[file] ?? meta[file.replace(AUDIO_EXT, '')] ?? {}
      return {
        title: m.title || file.replace(AUDIO_EXT, ''),
        artist: m.artist || '',
        src: `/music/${encodeURIComponent(file)}`,
      }
    })
}
