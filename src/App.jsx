import { useState, useEffect, useRef } from 'react'
import Tesseract from 'tesseract.js'
import { processarTextoOCR } from './utils/parserOCR'
import { saveAs } from 'file-saver'
import Cropper from 'react-easy-crop'
import getCroppedImg from './utils/cropImage'

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
  const [abaAtual, setAbaAtual] = useState('operacao')
  const [listaPaletes, setListaPaletes] = useState([])
  const [filtroCidade, setFiltroCidade] =
    useState('')
  const [imagemOriginal, setImagemOriginal] =
    useState(null)
  const [imagemRecortada, setImagemRecortada] =
    useState(null)

  const [modoDivisao, setModoDivisao] =
    useState(false)

  const [div1, setDiv1] = useState(25)
  const [div2, setDiv2] = useState(50)
  const [div3, setDiv3] = useState(75)
  
  const [crop, setCrop] = useState({
    x: 0,
    y: 0
  })

  const [zoom, setZoom] = useState(1)

  const [imagemParaRecorte,
    setImagemParaRecorte] =
    useState(null)

  const [croppedAreaPixels,
    setCroppedAreaPixels] =
    useState(null)
  
  const [filtroPalete, setFiltroPalete] =
    useState('')

  useEffect(() => {
    const dados = localStorage.getItem('paletes')

    if (dados) {
      const lista = JSON.parse(dados)

      setListaPaletes(lista)
      setNumeroPalete(lista.length + 1)
    }
  }, [])

  function adicionarFotos(evento) {
    const arquivo = evento.target.files?.[0]

    if (!arquivo) return

    const url = URL.createObjectURL(arquivo)

    setImagemOriginal(url)
    setImagemParaRecorte(url)

    setCrop({
      x: 0,
      y: 0
    })

    setZoom(1)
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

  async function salvarRecorte() {
    try {
      const imagemCortada =
        await getCroppedImg(
          imagemParaRecorte,
          croppedAreaPixels
        )

      setImagemRecortada(
        imagemCortada
      )

      setModoDivisao(true)

      setImagemParaRecorte(null)

      setCrop({
        x: 0,
        y: 0
      })

      setZoom(1)

    } catch (erro) {
      console.error(erro)
    }
  }
  async function confirmarDivisoes() {
    const image = new Image()

    image.src = imagemRecortada

    image.onload = async () => {
      const largura = image.width
      const altura = image.height

      const cortes = [
        0,
        largura * (div1 / 100),
        largura * (div2 / 100),
        largura * (div3 / 100),
        largura
      ]

      const novasImagens = []

      for (let i = 0; i < 4; i++) {
        const canvas =
          document.createElement('canvas')

        const ctx =
          canvas.getContext('2d')

        const larguraColuna =
          Math.floor(
            cortes[i + 1] - cortes[i]
          )

        canvas.width =
          larguraColuna

        canvas.height =
          altura

        ctx.drawImage(
          image,
          Math.floor(cortes[i]),
          0,
          larguraColuna,
          altura,
          0,
          0,
          larguraColuna,
          altura
        )

        const blob =
          await new Promise(
            resolve =>
              canvas.toBlob(
                resolve,
                'image/jpeg',
                0.95
              )
          )

        novasImagens.push(
          URL.createObjectURL(blob)
        )
      }

      setImagens(novasImagens)

      setModoDivisao(false)

      setImagemRecortada(null)
    }
  }

  const onCropComplete = (
    croppedArea,
    croppedAreaPixels
  ) => {
    setCroppedAreaPixels(
      croppedAreaPixels
    )
  }

  if (imagemParaRecorte && !modoDivisao) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: 'center'
        }}
      >
        <h2>✂️ Recorte a etiqueta</h2>

        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 800,
            height: 500,
            margin: '0 auto',
            background: '#222'
          }}
        >
          <Cropper
            image={imagemParaRecorte}
            crop={crop}
            zoom={zoom}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            cropShape="rect"
            showGrid={true}
          />
        </div>

        <br />

        <p>🔍 Zoom</p>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={e =>
            setZoom(Number(e.target.value))
          }
        />

        <br /><br />

        <button
          onClick={salvarRecorte}
        >
          ✂️ Confirmar Recorte
        </button>
      
        <button
          onClick={() => {
            setImagemParaRecorte(null)
            setImagemOriginal(null)
          }}
          style={{
            marginLeft: 10
          }}
        >
          ❌ Cancelar
        </button>
      </div>
    )
  }

  if (
    modoDivisao &&
    imagemRecortada
  ) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: 'center'
        }}
      >
        <h2>
          📏 Ajuste as colunas
        </h2>

        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            maxWidth: '100%'
          }}
        >
          <img
            src={imagemRecortada}
            alt="Etiqueta"
            style={{
              maxWidth: '100%',
              display: 'block',
              border: '2px solid #ccc',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: `${div1}%`,
              top: 0,
              bottom: 0,
              width: 4,
              background: '#ff0000',
              boxShadow: '0 0 6px #000'
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: `${div2}%`,
              top: 0,
              bottom: 0,
              width: 4,
              background: '#ff0000',
              boxShadow: '0 0 6px #000'
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: `${div3}%`,
              top: 0,
              bottom: 0,
              width: 4,
              background: '#ff0000',
              boxShadow: '0 0 6px #000'
            }}
          />

        </div>

        <br /><br />

        <p>Divisão 1</p>

        <input
          type="range"
          min="5"
          max={div2 - 5}
          value={div1}
          onChange={e =>
            setDiv1(Number(e.target.value))
          }
        />

        <p>Divisão 2</p>

        <input
          type="range"
          min={div1 + 5}
          max={div3 - 5}
          value={div2}
          onChange={e =>
            setDiv2(Number(e.target.value))
          }
        />

        <p>Divisão 3</p>

        <input
          type="range"
          min={div2 + 5}
          max="98"
          value={div3}
          onChange={e =>
            setDiv3(Number(e.target.value))
          }
        />

        <br /><br />

        <button
          onClick={confirmarDivisoes}
        >
          ✅ Confirmar Divisões
        </button>

        <button
          onClick={() => {
            setModoDivisao(false)

            setCrop({
              x: 0,
              y: 0
            })

            setZoom(1)

            setImagemRecortada(null)

            setImagemParaRecorte(
              imagemOriginal
            )
          }}
          style={{
            marginLeft: 10
          }}
        >
          ↩️ Voltar ao Recorte
        </button>

        <button
          onClick={() => {
            setModoDivisao(false)
            setImagemRecortada(null)
            setImagemParaRecorte(null)
          }}
          style={{
            marginLeft: 10
          }}
        >
          ❌ Cancelar
        </button>

      </div>
    )
  }

  function limparFotos() {
    setImagens([])
    setTextoOCR('')
    setDestinos([])

    setImagemOriginal(null)
    setImagemRecortada(null)
    setImagemParaRecorte(null)

    setModoDivisao(false)

    setCrop({
      x: 0,
      y: 0
    })

    setZoom(1)
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
      
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20
        }}
      >
        <button
          onClick={() => setAbaAtual('operacao')}
          style={{
            background:
              abaAtual === 'operacao'
                ? '#1976d2'
                : '#ccc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px'
          }}
        >
          📦 Operação
        </button>

        <button
          onClick={() => setAbaAtual('consulta')}
          style={{
            background:
              abaAtual === 'consulta'
                ? '#388e3c'
                : '#ccc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px'
          }}
        >
          🔍 Consulta
        </button>
      </div>
      {abaAtual === 'operacao' && (
        <>
          <h2>
            Palete Atual:{' '}
            {String(numeroPalete).padStart(2, '0')}
          </h2>

      <input
        ref={cameraInputRef}
        type="file"
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

      <button
        onClick={processarFotos}
        disabled={processando}
      >
        {processando
          ? 'Lendo Etiquetas...'
          : '📸 Ler Etiquetas'}
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

      <h3>DESTINOS</h3>

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
      </>
    )}
      {abaAtual === 'consulta' && (
        <div>
          <h2>Consulta</h2>

          <input
            placeholder="Pesquisar cidade"
            value={filtroCidade}
            onChange={e =>
              setFiltroCidade(
                e.target.value.toUpperCase()
              )
            }
          />

          <input
            placeholder="Pesquisar palete"
            value={filtroPalete}
            onChange={e =>
              setFiltroPalete(
                e.target.value
              )
            }
            style={{
              marginLeft: 10
            }}
          />

          <hr />

          <h3>Resumo Geral</h3>

          <p>
            <strong>Paletes:</strong>{' '}
            {listaPaletes.length}
          </p>

          <p>
            <strong>Destinos:</strong>{' '}
            {listaPaletes.reduce(
              (total, palete) =>
                total + palete.destinos.length,
              0
            )}
          </p>

          <p>
            <strong>Objetos:</strong>{' '}
            {listaPaletes.reduce(
              (total, palete) =>
                total +
                palete.destinos.reduce(
                  (soma, destino) =>
                    soma + destino.quantidade,
                  0
                ),
              0
            )}
          </p>

          <hr />

          {/* CONSULTA POR CIDADE */}
          {filtroCidade !== '' && (
            <>
              <h3>
                Pesquisa: {filtroCidade}
              </h3>

              <p>
                ✅ Encontrado em {
                  listaPaletes.filter(palete =>
                    palete.destinos.some(
                      destino =>
                        destino.cidade.includes(
                          filtroCidade
                        )
                    )
                  ).length
                } paletes
              </p>

              {listaPaletes
                .filter(palete =>
                  palete.destinos.some(
                    destino =>
                      destino.cidade.includes(
                        filtroCidade
                      )
                  )
                )
                .map(palete => (
                  <div
                    key={palete.numero}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 10
                    }}
                  >
                    <strong>
                      Palete {palete.numero}
                    </strong>

                    <hr />

                    {palete.destinos
                      .filter(destino =>
                        destino.cidade.includes(
                          filtroCidade
                        )
                      )
                      .map((destino, index) => (
                        <div key={index}>
                          📍 {destino.cidade} - {destino.quantidade}
                        </div>
                      ))}
                  </div>
                ))}
            </>
          )}

          {/* CONSULTA POR PALETE */}
          {filtroPalete !== '' &&
            listaPaletes
              .filter(
                palete =>
                  palete.numero ===
                  filtroPalete.padStart(2, '0')
              )
              .map(palete => (
                <div
                  key={palete.numero}
                  style={{
                    border: '2px solid #1976d2',
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 15
                  }}
                >
                  <h3>
                    📦 Palete {palete.numero}
                  </h3>

                  <p>
                    Total de objetos:{' '}
                    {palete.destinos.reduce(
                      (total, destino) =>
                        total + destino.quantidade,
                      0
                    )}
                  </p>

                  <hr />

                  {palete.destinos.map(
                    (destino, index) => (
                      <div key={index}>
                        📍 {destino.cidade} - {destino.quantidade}
                      </div>
                    )
                  )}
                </div>
              ))}
          {filtroPalete !== '' &&
            listaPaletes.filter(
              palete =>
                palete.numero ===
                filtroPalete.padStart(2, '0')
            ).length === 0 && (
              <p>
                ❌ Palete não encontrado.
              </p>
            )}

        </div>
      )}
    </div>
  )
}
export default App
