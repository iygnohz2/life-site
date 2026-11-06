import fs from 'node:fs'
import path from 'node:path'
import type { Track } from './music'

const DIR = path.join(process.cwd(), 'public', 'music')
const FILE = path.join(process.cwd(), 'site-data', 'music.json')
const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|wav|flac)$/i

/**
 * 扫描 public/music/ 里的音频文件，自动生成播放列表。
 * 歌名默认取文件名（去掉扩展名）；如需自定义显示名/歌手，
 * 在 site-data/music.json 里按「文件名」补充即可（可选）：
 *   { "tracks": { "示例.mp3": { "title": "曲名", "artist": "歌手" } } }
 * 只在服务端调用（layout / 页面），不要被客户端组件 import。
 */
export function getTracks(): Track[] {
  let files: string[] = []
  try {
    files = fs.readdirSync(DIR).filter((f) => AUDIO_EXT.test(f))
  } catch {
    return []
  }
  if (!files.length) return []

  let meta: Record<string, { title?: string; artist?: string }> = {}
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    if (raw && typeof raw.tracks === 'object' && raw.tracks) meta = raw.tracks
  } catch {
    /* 没有元数据文件也能正常跑 */
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
