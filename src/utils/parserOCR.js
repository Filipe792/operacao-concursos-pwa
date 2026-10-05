import {
  encontrarCidadeMaisProxima
} from './cidadesMG'

export function processarTextoOCR(texto) {
  const resultados = []

  const regex =
    /([A-ZÀ-Ú\s]+)\((\d+)\)/gi

  let match

  while ((match = regex.exec(texto)) !== null) {
    const cidadeOriginal = match[1]
      .trim()
      .replace(/\s+/g, ' ')

    resultados.push({
      cidade:
        encontrarCidadeMaisProxima(
          cidadeOriginal
        ),

      quantidade: Number(match[2])
    })
  }

  return resultados
}