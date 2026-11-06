/** 音乐轨道：src 为 public/music/ 下的相对路径（如 /music/xxx.mp3） */
export type Track = {
  title: string
  artist?: string
  src: string
}
