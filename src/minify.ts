export function minifyCSS(source: string) {
    return source.replace(/\n/g, '')
    .replace(/(\/\*[^*]*\*\/)|(\/\/[^*]*)/g, '')
    .replace(/\s/g,'')
  }