import fs from 'fs'

async function gerarArquivo() {
  const resposta = await fetch(
    'https://servicodados.ibge.gov.br/api/v1/localidades/estados/MG/municipios'
  )

  const municipios = await resposta.json()

  const cidades = municipios
    .map(m => m.nome)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map(nome =>
      nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
    )

  const conteudo = `export const cidadesMG = ${JSON.stringify(
    cidades,
    null,
    2
  )}

export function encontrarCidadeMaisProxima(texto) {
  const cidadeOCR = texto
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toUpperCase()
    .trim()

  const encontrada = cidadesMG.find(
    cidade =>
      cidade === cidadeOCR ||
      cidade.includes(cidadeOCR) ||
      cidadeOCR.includes(cidade)
  )

  return encontrada || cidadeOCR
}
`

  fs.writeFileSync(
    './src/utils/cidadesMG.js',
    conteudo,
    'utf8'
  )

  console.log(
    `Arquivo criado com ${cidades.length} cidades.`
  )
}

gerarArquivo().catch(console.error)