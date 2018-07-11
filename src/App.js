import React, { Component, Fragment } from 'react';
import {Container} from 'reactstrap'
import GMaps from './components/GMaps'
import {Marker} from 'react-google-maps'
import {Table, Button, UncontrolledTooltip} from 'reactstrap'
import uuid from 'uuid/v4'
import pontos from './dados/pontos'

const initialState = {
  pontos: pontos,
  matriz: null,
  carregando: false,
  current: 0,
  total: 0
}

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
      console.error(e)
      window.alert(e.toString())
      this.setState({carregando: false})
    }        
  }
  
  async requestMatrixLimited(pontos) {
    const parcel = pontos.slice(0, 10)

    const options = {
      origins: parcel,
      destinations: parcel,
      travelMode: 'DRIVING'
    }

    const promise = new Promise((resolve, reject) => {
      const DMService = new window.google.maps.DistanceMatrixService()

      DMService.getDistanceMatrix(options, 
        (response, status) => {
          if (status !== 'OK') return reject(status);
          resolve(response);
      })
    })

    const result = await promise
    return result.rows
  }

  async requestMatrix(pontos) {   
    const matriz = []
    const page = 24

    this.setState({total: pontos.length})
    
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
        
        this.setState({matriz})
      }
      matriz.push(linha)
      this.setState({current: i})      
    }    
    
    return matriz
  }

  callDMService(options, timeToWait) {
    const timeSpan = 1000

    const promise = new Promise((resolve, reject) => {
      const DMService = new window.google.maps.DistanceMatrixService()
      
      DMService.getDistanceMatrix(options, (response, status) => {
        if (status !== 'OK') {
          return setTimeout(() => {
            resolve(this.callDMService(options, timeToWait + timeSpan))
          }, timeToWait);          
        }

        resolve(response)
      })
    })

    return promise
  }

  limparPontos() {
    this.setState({...initialState, pontos: []})
  }

  render() {    
    console.log(this.state.matriz)
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
                  {this.state.carregando ? 'Aguarde...' : 'Gerar Matriz de Distâncias'}
              </Button>
              {this.state.total > 0 &&
               <p>Progresso: {this.state.current} / {this.state.total}</p>
              }
            </div>
          </Fragment>      
        }          
      </Container>

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

export default App;
