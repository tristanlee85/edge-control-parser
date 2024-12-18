export default function toRegExp(pattern: string, flags = 'g') {
  if (pattern.startsWith('(?i)')) {
    pattern = pattern.substring(4)
    flags += 'i'
  }

  return new RegExp(pattern, flags)
}
