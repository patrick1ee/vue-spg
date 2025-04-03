import { parse, compileTemplate, compileScript, compileStyle } from '@vue/compiler-sfc'
import { compile as ssrCompile } from '@vue/compiler-ssr'


export function compileSFCToPureHTML(sfcSource: string, data: any = {}) {
  // Parse the SFC
  const { descriptor } = parse(sfcSource)
  
  // Generate a unique ID for scoped styles
  const id = `data-v-${Math.random().toString(36).slice(2)}`
  
  // Compile script to extract computed properties and data
  const scriptResult = compileScript(descriptor, {
    id,
    inlineTemplate: true,
    templateOptions: {
      compilerOptions: {
        mode: 'module'
      }
    }
  })
  
  // Extract computed properties from the script
  const computedProps = scriptResult.content.match(/computed:\s*{([^}]*)}/)?.[1] || ''
  const computedValues: Record<string, any> = {}
  
  // Evaluate computed properties with the provided data
  if (computedProps) {
    const computedFns = computedProps.split(',').map(prop => {
      const [key, value] = prop.split(':').map(s => s.trim())
      if (key && value) {
        // Extract the function body
        const fnBody = value.match(/\(\)\s*=>\s*{([^}]*)}/)?.[1] || value
        try {
          // Create a function that has access to the data
          const fn = new Function('data', `return ${fnBody}`)
          computedValues[key] = fn(data)
        } catch (e) {
          console.warn(`Failed to compute property ${key}:`, e)
          computedValues[key] = ''
        }
      }
    })
  }
  
  // Compile template to static HTML using SSR compiler
  const templateResult = ssrCompile(descriptor.template?.content || '', {
    mode: 'module',
    hoistStatic: true,
    onError: (err) => {
      console.error('Template compilation error:', err)
    }
  })
  
  // Compile styles with CSS variables
  const styleResults = descriptor.styles.map(style => 
    compileStyle({
      source: style.content,
      filename: descriptor.filename,
      id,
      scoped: style.scoped,
      modules: !!style.module
    })
  )
  
  // Extract CSS variables from the styles
  const cssVars = descriptor.cssVars || []
  const cssVarValues = cssVars.reduce((acc, key) => {
    // Try to get value from computed properties first
    if (key in computedValues) {
      acc[key] = computedValues[key]
    }
    // Then try data
    else if (key in data) {
      acc[key] = data[key]
    }
    return acc
  }, {} as Record<string, any>)
  
  // Create CSS variables string
  const cssVarString = Object.entries(cssVarValues)
    .map(([key, value]) => `--${id}-${key}: ${value};`)
    .join('\n')
  
  // Extract the static HTML from the SSR compilation
  const staticHTML = templateResult.code
    .replace(/_push\(`([^`]*)`\)/g, '$1') // Remove _push and template literals
    .replace(/\${_ssrRenderAttrs\(_attrs\)}/g, '') // Remove dynamic attributes
    .replace(/\${_ssrRenderClass\(_attrs\)}/g, '') // Remove dynamic classes
    .replace(/\${_ssrRenderStyle\(_attrs\)}/g, '') // Remove dynamic styles
    .replace(/\${_ssrInterpolate\(([^)]+)\)}/g, (_, expr) => {
      // Replace interpolations with actual values
      try {
        return eval(`data.${expr}`)
      } catch {
        return ''
      }
    })
  
  // Create a self-contained HTML file
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          ${cssVarString}
          ${styleResults.map(r => r.code).join('\n')}
        </style>
      </head>
      <body>
        ${staticHTML}
      </body>
    </html>
  `
  
  return html
}