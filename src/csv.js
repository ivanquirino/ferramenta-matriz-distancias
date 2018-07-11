function renderCSV(data) {
  return data.reduce((soma, item) => {
    const linha = item.reduce((somalinha, itemlinha) => {
      return somalinha + itemlinha.toString() + ','
    }, '')

    return soma + linha + '\n'
  }, '')
}

export default renderCSV
