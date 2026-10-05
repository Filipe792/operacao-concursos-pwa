import { useState, useEffect, useRef } from 'react'
import Tesseract from 'tesseract.js'
import { processarTextoOCR } from './utils/parserOCR'
import { saveAs } from 'file-saver'


function App() {
  const [imagens, setImagens] = useState([])
  const [textoOCR, setTextoOCR] = useState('')
  const [destinos, setDestinos] = useState([])
  const [processando, setProcessando] = useState(false)
  const cameraInputRef = useRef(null)
  const [numeroPalete, setNumeroPalete] = useState(1)
  const galeriaInputRef = useRef(null)
  const [cidadeManual, setCidadeManual] = useState('')
  const [quantidadeManual, setQuantidadeManual] = useState('')

  const [listaPaletes, setListaPaletes] = useState([])

  useEffect(() => {
    const dados = localStorage.getItem('paletes')

    if (dados) {
      const lista = JSON.parse(dados)

      setListaPaletes(lista)
      setNumeroPalete(lista.length + 1)
    }
  }, [])

  function adicionarFotos(evento) {
    const arquivos = Array.from(evento.target.files)

    const urls = arquivos.map(
      arquivo => URL.createObjectURL(arquivo)
    )

    setImagens(anterior => [
      ...anterior,
      ...urls
    ])
  }

  async function processarFotos() {
    if (imagens.length === 0) {
      alert('Selecione uma imagem primeiro')
      return
    }

    try {
      setProcessando(true)

      let textoCompleto = ''

      for (const imagem of imagens) {
        const resultado =
          await Tesseract.recognize(
            imagem,
            'por'
          )

        textoCompleto +=
          resultado.data.text + '\n'
      }

      setTextoOCR(textoCompleto)

      const destinosExtraidos =
        processarTextoOCR(textoCompleto)

      setDestinos(destinosExtraidos)

    } catch (erro) {
      console.error(erro)

      alert(
        'Erro ao executar OCR'
      )

    } finally {
      setProcessando(false)
    }
  }

  function exportarCSV() {
    if (listaPaletes.length === 0) {
      alert('Nenhum palete para exportar')
      return
    }

    let csv =
      'Palete;DataHora;Cidade;Quantidade\n'

    listaPaletes.forEach(palete => {
      palete.destinos.forEach(destino => {
        csv +=
          `${palete.numero};` +
          `${palete.dataHora};` +
          `${destino.cidade};` +
          `${destino.quantidade}\n`
      })
    })

    const blob = new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8;'
      }
    )

    saveAs(
      blob,
      `paletes_${Date.now()}.csv`
    )
  }

  function adicionarDestinoManual() {
    if (
      !cidadeManual.trim() ||
      !quantidadeManual.trim()
    ) {
      alert('Informe cidade e quantidade')
      return
    }

    setDestinos([
      ...destinos,
      {
        cidade: cidadeManual
          .trim()
          .toUpperCase(),
        quantidade: Number(
          quantidadeManual
        )
      }
    ])

    setCidadeManual('')
    setQuantidadeManual('')
  }

  function salvarPalete() {
    if (destinos.length === 0) {
      alert('Nenhum destino para salvar')
      return
    }

    const novoPalete = {
      numero: String(numeroPalete).padStart(2, '0'),
      dataHora: new Date().toLocaleString(),
      destinos: [...destinos]
    }

    const novaLista = [
      novoPalete,
      ...listaPaletes
    ]

    setListaPaletes(novaLista)

    localStorage.setItem(
      'paletes',
      JSON.stringify(novaLista)
    )

    alert(
      `Palete ${novoPalete.numero} salvo com sucesso!`
    )

    setNumeroPalete(
      anterior => anterior + 1
    )

    setImagens([])
    setTextoOCR('')
    setDestinos([])

    setCidadeManual('')
    setQuantidadeManual('')
  }

  function excluirPalete(numeroPalete) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o palete ${numeroPalete}?`
    )

    if (!confirmar) return

    const novaLista = listaPaletes.filter(
      palete => palete.numero !== numeroPalete
    )

    setListaPaletes(novaLista)

    localStorage.setItem(
      'paletes',
      JSON.stringify(novaLista)
    )
  }
 
  function excluirDestino(numeroPalete, indexDestino) {
    const novaLista = listaPaletes.map(palete => {
      if (palete.numero !== numeroPalete) {
        return palete
      }

      return {
        ...palete,
        destinos: palete.destinos.filter(
          (_, index) => index !== indexDestino
        )
      }
    })

    setListaPaletes(novaLista)

    localStorage.setItem(
      'paletes',
      JSON.stringify(novaLista)
    )
  }

  function limparFotos() {
    setImagens([])
    setTextoOCR('')
    setDestinos([])
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 20,
        fontFamily: 'Arial'
      }}
    >
      <h1>Operação Concursos</h1>

      <h2>
        Palete Atual:{' '}
        {String(numeroPalete).padStart(2, '0')}
      </h2>

      <input
        ref={cameraInputRef}
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        onChange={adicionarFotos}
        style={{ display: 'none' }}
      />

      <button
        onClick={() =>
          cameraInputRef.current?.click()
        }
        style={{
          background: '#1976d2',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        📷 Abrir Câmera
      </button>

      <button
        onClick={() =>
          galeriaInputRef.current?.click()
        }
        style={{
          background: '#388e3c',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginLeft: '10px'
        }}
      >
        🖼️ Escolher da Galeria
      </button>

      <input
        ref={galeriaInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={adicionarFotos}
        style={{ display: 'none' }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 20
        }}
      >
        {imagens.map((imagem, index) => (
          <img
            key={index}
            src={imagem}
            alt={`Imagem ${index + 1}`}
            style={{
              width: '150px',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #ccc'
            }}
          />
        ))}
      </div>

      <br />

      <button onClick={processarFotos}>
        {processando
          ? 'Processando...'
          : 'Executar OCR'}
      </button>

      <button
        onClick={limparFotos}
        style={{
          background: '#f57c00',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginLeft: '10px'
        }}
      >
        🗑 Limpar Fotos
      </button>

      <hr />

      <h3>Texto OCR</h3>

      <textarea
        value={textoOCR}
        readOnly
        rows={6}
        style={{
          width: '100%'
        }}
      />

      <hr />

      <h3>Destinos OCR</h3>

      <p>
        <strong>Total de destinos:</strong>{' '}
        {destinos.length}
      </p>

      <p>
        <strong>Total de objetos:</strong>{' '}
        {destinos.reduce(
          (total, destino) =>
            total + destino.quantidade,
          0
        )}
      </p>

      {destinos.length === 0 ? (
        <p>Nenhum destino encontrado.</p>
      ) : (
        destinos.map((destino, index) => (
          <div
            key={index}
            style={{
              marginBottom: 5
            }}
          >
            📍 {destino.cidade} -{' '}
            {destino.quantidade}
          </div>
        ))
      )}

      <hr />

      <h3>Adicionar Destino Manual</h3>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap'
        }}
      >
        <input
          placeholder="Cidade"
          value={cidadeManual}
          onChange={e =>
            setCidadeManual(e.target.value)
          }
        />

        <input
          placeholder="Quantidade"
          value={quantidadeManual}
          onChange={e =>
            setQuantidadeManual(
              e.target.value
            )
          }
        />

        <button
          onClick={
            adicionarDestinoManual
          }
        >
          Adicionar
        </button>
      </div>

      <hr />

      <button onClick={salvarPalete}>
        Salvar Palete
      </button>

      <button
        onClick={exportarCSV}
        style={{
          marginLeft: 10
        }}
      >
        Exportar CSV
      </button>

      <hr />

      <h2>Paletes Salvos</h2>

            {listaPaletes.length === 0 ? (
        <p>Nenhum palete salvo.</p>
      ) : (
        listaPaletes.map(palete => (
          <div
            key={palete.numero}
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: 10,
              marginBottom: 10
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <strong>
                Palete {palete.numero}
              </strong>

              <button
                onClick={() =>
                  excluirPalete(palete.numero)
                }
                style={{
                  background: '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🗑 Excluir
              </button>
            </div>

            <br />

            <small>
              {palete.dataHora}
            </small>

            <hr />

            {palete.destinos.map(
              (destino, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 5
                  }}
                >
                  <span>
                    📍 {destino.cidade} - {destino.quantidade}
                  </span>

                  <button
                    onClick={() =>
                      excluirDestino(
                        palete.numero,
                        index
                      )
                    }
                  >
                    ❌
                  </button>
                </div>
              )
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default App