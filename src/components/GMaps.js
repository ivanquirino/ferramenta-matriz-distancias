import React, {Component} from 'react'
import {GoogleMap, withGoogleMap, withScriptjs} from 'react-google-maps'
import {compose, withProps} from 'recompose'

const mapsKey = process.env.REACT_APP_MAPS_KEY
const gmapsurl = `https://maps.googleapis.com/maps/api/js?
key=${mapsKey}&v=3.exp&libraries=geometry,drawing,places&
language=pt-br&region=BR`

class MapHolder extends Component {
  constructor(props) {
    super(props)

    this.mapRef = React.createRef()
    this.onZoomChanged = this.onZoomChanged.bind(this)
    this.onCenterChanged = this.onCenterChanged.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onClick = this.onClick.bind(this)
  }
  render() {
    console.log(mapsKey)

    return (
      <GoogleMap
        {...this.props}
        ref={this.mapRef}
        onZoomChanged={this.onZoomChanged}
        onCenterChanged={this.onCenterChanged}
        onDragEnd={this.onDragEnd}
        onClick={this.onClick}
      >
        {this.props.children}
      </GoogleMap>
    )
  }

  onZoomChanged() {
    if (this.props.onZoomChange) {
      this.props.onZoomChange(this.mapRef.current.getZoom(),
        this.mapRef.current)
    }
  }
  onCenterChanged() {
    if (this.props.onCenterChange) {
      this.props.onCenterChange(this.mapRef.current.getCenter(),
        this.mapRef.current)
    }
  }

  onDragEnd() {
    if (this.props.onDragEnd) {
      this.props.onDragEnd(this.mapRef.current)
    }
  }

  onClick(mapEvent) {
    if (this.props.onClick) {
      this.props.onClick(mapEvent)
    }
  }
}

const WrappedMap = compose(
  withProps({
    loadingElement: <div>Carregando mapa...</div>,
    googleMapURL: gmapsurl,
    containerElement: <div style={{height: '100%', width: '100%'}}></div>,
    mapElement: <div style={{height: '100%', width: '100%'}}></div>
  }),
  withScriptjs,
  withGoogleMap
)(MapHolder)

export default WrappedMap
