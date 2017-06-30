import React from 'react'

import {
  AppState,
  Dimensions,
  I18nManager,
  PropTypes,
  PureComponent,
  StyleSheet,
  View
} from '../components'
import Loader from './loader'
import Theme from '../theme'
import * as Utils from '../libs/utils'

const LAND = 'land'
const LDLTR = 'ldltr'
const LDRTL = 'ldrtl'
const PORT = 'port'

class ThemeProvider extends PureComponent {

  static childContextTypes = {
    theme: PropTypes.any
  }

  static propTypes = {
    theme: PropTypes.instanceOf(Theme.constructor),
    onConfigChange: PropTypes.func
  }

  static defaultProps = {
    theme: Theme,
    onConfigChange: () => { }
  }

  state = {
    height: undefined,
    layoutDirection: undefined,
    orientation: undefined,
    ready: false,
    smallestWidth: undefined,
    width: undefined
  }

  _theme = {}

  componentDidMount() {
    AppState.addEventListener('change', this._onAppStateChange)
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._onAppStateChange)
  }

  getChildContext() {
    return { theme: this._theme }
  }

  render() {
    const configProps = this._getConfigProps()
    const theme = this._theme
    theme.__id = (theme.__id || new Date().getTime()) + 1
    Object.assign(theme, this.props.theme.resolve(Object.values(configProps)))
    const styles = Styles.get(theme, this.props)
    return (
      <View style={styles.container} onLayout={this._onLayout}>
        {this.state.ready && <Loader {...configProps} onUpdate={this._onConfigChange}>{this.props.children}</Loader>}
      </View>
    )
  }

  _getConfigProps = () => {
    const { layoutDirection, orientation, smallestWidth } = this.state
    return {
      ...Object.keys(this.props)
        .filter(prop => Utils.isString(this.props[prop]))
        .reduce((acc, prop) => {
          acc[prop] = this.props[prop]
          return acc
        }, {}),
      layoutDirection, orientation, smallestWidth
    }
  }

  _onAppStateChange = () => {
    this._updateState({ layoutDirection: I18nManager.isRTL ? LDRTL : LDLTR })
  }

  _onConfigChange = () => {
    this.props.onConfigChange(this._getConfigProps())
  }

  _onLayout = () => {
    this._onAppStateChange()
    const { height, width } = Dimensions.get('window')
    const keys = this.props.theme.getOrderedKeys()
    const newState = {
      height,
      layoutDirection: I18nManager.isRTL ? LDRTL : LDLTR,
      smallestWidth: undefined,
      width
    }
    keys.forEach(key => {
      const smallestWidth = Utils.idx(key, key =>
        parseInt(/^sw([0-9]+)$/.exec(key)[1])
      )
      if (smallestWidth && width >= smallestWidth) {
        newState.smallestWidth = key
      }
    })
    if (width > height) {
      newState.orientation = LAND
    } else if (width <= height) {
      newState.orientation = PORT
    }
    this._updateState(newState)
  }

  _updateState = (state) => {
    const newState = { ...this.state, ...state }
    if (newState.layoutDirection && newState.width) {
      newState.ready = true
    }
    this.setState(newState)
  }
}

ThemeProvider.defer = Loader.defer

ThemeProvider.isReady = Loader.isReady

ThemeProvider.ready = Loader.ready

export default ThemeProvider

const Styles = StyleSheet.create((theme, { style }) => {
  const container = {
    backgroundColor: theme.palette.background,
    flex: 1,
    ...style
  }
  return { container }
}, ['style'])
