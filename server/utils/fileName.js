const MOJIBAKE_PATTERN = /(?:Ã|Ä|Å|Â|�)/
const SAFE_FILE_NAME_PATTERN = /[^\w.\-ğüşöçıİĞÜŞÖÇ]+/gi

const normalizeUploadFileName = (fileName, fallback = 'dosya') => {
  const rawName = String(fileName || fallback)
  if (!MOJIBAKE_PATTERN.test(rawName)) {
    return rawName
  }

  const decodedName = Buffer.from(rawName, 'latin1').toString('utf8')
  return decodedName.includes('�') ? rawName : decodedName
}

const sanitizeFileName = (fileName, fallback = 'dosya') => {
  return normalizeUploadFileName(fileName, fallback).replace(SAFE_FILE_NAME_PATTERN, '-')
}

module.exports = {
  normalizeUploadFileName,
  sanitizeFileName
}
