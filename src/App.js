import React, { Component, Fragment } from 'react'
import {Container} from 'reactstrap'
import GMaps from './components/GMaps'
import {Marker} from 'react-google-maps'
import {Table, Button, UncontrolledTooltip} from 'reactstrap'
import uuid from 'uuid/v4'
import pontos from './dados/pontos'
import renderCSV from './csv'

const initialState = {
  pontos: pontos,
  matriz: null,
  carregando: false,
  current: 0,
  total: 0
}

const csvHeader = 'data:text/csv;charset-utf-8,\n'
const timeSpan = 1000

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      ...initialState
    }

    this.onMapClick = this.onMapClick.bind(this)
    this.renderRow = this.renderRow.bind(this)
    this.renderMarker = this.renderMarker.bind(this)
    this.getMatrizDistancias = this.getMatrizDistancias.bind(this)
    this.limparPontos = this.limparPontos.bind(this)
    this.gerarCSVDistancias = this.gerarCSVDistancias.bind(this)
    this.gerarCSVTempos = this.gerarCSVTempos.bind(this)
  }

  onMapClick(event) {
    const ponto = {id: uuid(), lat: event.latLng.lat(), lng: event.latLng.lng()}
    this.setState({pontos: [...this.state.pontos,
      ponto
    ]
    })
  }

  renderMarker(ponto, index) {
    return <Marker draggable key={index} position={ponto}
      onClick={this.removerMarker.bind(this, ponto)}
      onDragEnd={event => {
        this.removerMarker(ponto)
        this.onMapClick(event)
      }}
    />
  }

  removerMarker(ponto) {
    const novaLista = this.state.pontos.filter(pontoAtual => {
      return pontoAtual.id !== ponto.id
    })

    this.setState({pontos: novaLista})
  }

  renderRow(ponto, index) {
    return <tr key={index}>
      <th scope='row'>{index}</th>
      <td>{ponto.lat}</td>
      <td>{ponto.lng}</td>
      <td>
        <Button outline color='danger'
          onClick={this.removerMarker.bind(this, ponto)}
        >Remover</Button>
      </td>
    </tr>
  }

  async getMatrizDistancias() {
    this.setState({carregando: true})

    try {
      const matriz = await this.requestMatrix(this.state.pontos)
      return this.setState({matriz, carregando: false})
    } catch(e) {
      window.alert(e.toString())
      this.setState({carregando: false})
    }
  }

  calculaTotal(pontos, pagina) {
    let total = 0
    for (let i = 0; i < pontos.length; i++) {
      for (let j = 0; j < pontos.length; j += pagina) {
        total++
      }
    }

    return total
  }

  async requestMatrix(pontos) {
    const matriz = []
    const page = 25

    this.setState({total: this.calculaTotal(pontos, page)})

    for (let i = 0; i < pontos.length; i++) {
      const ponto = pontos[i]
      const linha = []

      for (let j = 0; j < pontos.length; j += page) {
        const slice = pontos.slice(j, j + page)

        const options =  {
          origins: [ponto],
          destinations: slice,
          travelMode: 'DRIVING'
        }

        const result = await this.callDMService(options, 0)
        const row = result.rows[0].elements

        linha.push(...row)
        matriz[i] = linha
        this.setState({matriz, current: this.state.current + 1})
      }
    }

    return matriz
  }

  callDMService(options, timeToWait) {
    const promise = new Promise((resolve, reject) => {
      const DMService = new window.google.maps.DistanceMatrixService()

      DMService.getDistanceMatrix(options, (response, status) => {
        if (status !== 'OK') {
          return setTimeout(() => {
            resolve(this.callDMService(options, timeToWait + timeSpan))
          }, timeToWait)
        }

        resolve(response)
      })
    })

    return promise
  }

  limparPontos() {
    this.setState({...initialState, pontos: []})
  }

  gerarCSVDistancias() {
    const distancias = this.state.matriz.map(item => {
      return item.map(itemlinha => {
        return itemlinha.distance.value
      })
    })

    let csv = renderCSV(distancias)
    this.downloadCSVData(csv, 'distancias.csv')
  }

  gerarCSVTempos() {
    const tempos = this.state.matriz.map(item => {
      return item.map(itemlinha => {
        return itemlinha.duration.value
      })
    })

    let csv = renderCSV(tempos)
    this.downloadCSVData(csv, 'tempos.csv')
  }

  downloadCSVData(stringData, filename) {
    const csv = csvHeader + stringData
    const data = encodeURI(csv)

    const link = document.createElement('a')

    link.style.display = 'none'
    link.setAttribute('href', data)
    link.setAttribute('download', filename)

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
  }

  render() {
    return <Fragment>
      <Container className='mb-5'>
        <header className="App-header text-center">
          <h1 className="App-title">Ferramenta de Matriz de Distâncias</h1>
          <h2>UFPB - Centro de Informática</h2>
          <h3>Departamento de Matemática Computacional</h3>
        </header>

        <div style={{height: '80vh'}}>
          <GMaps center={{lat: -7.119759, lng: -34.845499}} zoom={12}
            onClick={this.onMapClick}>
            {this.state.pontos.map(this.renderMarker)}
          </GMaps>
        </div>

        {this.state.pontos.length > 1 &&
          <Fragment>
            <div className='text-center'>
              <Button className='mt-3' color='secondary'
                onClick={this.limparPontos}>Limpar pontos</Button>
            </div>

            <Table striped hover bordered className='mt-3'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {this.state.pontos.map(this.renderRow)}
              </tbody>
            </Table>

            <div className='text-center'>
              <Button color='primary'
                disabled={this.state.carregando}
                onClick={this.getMatrizDistancias}>
                {this.state.carregando ? 'Aguarde...' :
                  'Gerar Matriz de Distâncias'}
              </Button>

              {this.state.total > 0 &&
               <p style={{fontSize: '1.6rem'}} className='mt-5'>
                Progresso das requisições:
                 {` ${this.state.current} / ${this.state.total}`}
                 {` ${Math.round((this.state.current / this.state.total) * 100)}%`}</p>
              }
            </div>
          </Fragment>
        }
      </Container>

      {this.state.matriz !== null &&
        <Container className='mb-5 text-center'>
          <Button color='primary' className='mr-3'
            onClick={this.gerarCSVDistancias}>
            Baixar CSV das distâncias
          </Button>
          <Button color='primary'
            onClick={this.gerarCSVTempos}>
            Baixar CSV dos tempos
          </Button>
        </Container>
      }

      {/* Tabela de distâncias */}
      {this.state.matriz !== null &&
        <Container fluid className='mb-5'>
          <Table striped hover bordered>
            <thead>
              <tr>
                <th>#</th>
                {Object.keys(this.state.pontos).map((key, index) => {
                  return <th key={index}>{key}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {Object.keys(this.state.matriz).map((key, index) => {
                const row = this.state.matriz[key]

                return <tr key={index}>
                  <th scope='row'>{key}</th>
                  {row.map((elemento, indexEl) => {
                    const id = `element-m-${index}-${indexEl}`
                    return <td key={indexEl}>
                      {elemento.distance.value === 0 ? 0 :
                        <Fragment>
                          <span id={id}>{elemento.distance.text}</span>
                          <UncontrolledTooltip target={id}>
                            {elemento.distance.value}m
                          </UncontrolledTooltip>
                        </Fragment>
                      }
                    </td>
                  })}
                </tr>
              })}
            </tbody>
          </Table>
        </Container>
      }

      {/* Tabela de tempos */}
      {this.state.matriz !== null &&
        <Container fluid className='mb-5'>
          <Table striped hover bordered>
            <thead>
              <tr>
                <th>#</th>
                {Object.keys(this.state.pontos).map((key, index) => {
                  return <th key={index}>{key}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {Object.keys(this.state.matriz).map((key, index) => {
                const row = this.state.matriz[key]

                return <tr key={index}>
                  <th scope='row'>{key}</th>
                  {row.map((elemento, indexEl) => {
                    const id = `element-s-${index}-${indexEl}`
                    return <td key={indexEl}>
                      {elemento.distance.value === 0 ? 0 :
                        <Fragment>
                          <span id={id}>{elemento.duration.text}</span>
                          <UncontrolledTooltip target={id}>
                            {elemento.duration.value}s
                          </UncontrolledTooltip>
                        </Fragment>
                      }
                    </td>
                  })}
                </tr>
              })}
            </tbody>
          </Table>
        </Container>
      }
    </Fragment>
  }
}

export default App
