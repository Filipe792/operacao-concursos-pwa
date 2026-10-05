export function processarTextoOCR(texto) {
  const resultados = []

  const regex =
    /([A-ZÀ-Ú\s]+)\((\d+)\)/gi

  let match

  while ((match = regex.exec(texto)) !== null) {
    resultados.push({
      cidade: match[1]
        .trim()
        .replace(/\s+/g, ' '),

      quantidade: Number(match[2])
    })
  }

  return resultados
}