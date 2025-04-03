#!/usr/bin/env node

import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

import * as CompilerDOM from '@vue/compiler-dom'
import { minifyCSS } from './src';
import * as ts from 'typescript'


const componentPath = path.join(__dirname, './SubProfileRender.vue');
const componentPath2 = path.resolve('/home/patrick/dev/keypin-web/src/components/qr-section/AmazonReviewCTASection.vue')

const props = JSON.parse(fs.readFileSync('./test-am.json', 'utf8'));

const componentSrc  = fs.readFileSync(componentPath, 'utf8');

const ast = CompilerDOM.parse(componentSrc, {
    parseMode: 'sfc',
    prefixIdentifiers: true,
    onError: e => {
      console.log(e)
    },
  })

  const scriptNode = ast.children.find(c => c.type === 1 && c.tag === 'script')
  const templateNode = ast.children.find(c => c.type === 1 && c.tag === 'template')
  const styleNode = ast.children.find(c => c.type === 1 && c.tag === 'style')

  const styleContent = ((styleNode as CompilerDOM.ElementNode)?.children as CompilerDOM.TextNode[]).map(c => c.content).join('')

  const minifiedStyle = minifyCSS(styleContent)

  console.log(minifiedStyle)

  const scriptContent = ((scriptNode as CompilerDOM.ElementNode)?.children[0] as CompilerDOM.TextNode).content
  
  // Parse the script content
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    scriptContent,
    ts.ScriptTarget.Latest,
    true
  )
  // Extract imports
  const imports = sourceFile.statements.filter(ts.isImportDeclaration)
  console.log('Imports:', imports.map(i => ({
    name: i.importClause?.name?.getText() || i.importClause?.namedBindings?.getText(),
    from: i.moduleSpecifier.getText()
  })))

  // Extract props
  const propsDefinition = sourceFile.statements.find(s => 
    s.getText().includes('defineProps')
  )
  
  if (propsDefinition) {
    const propsText = propsDefinition.getText()
    const propsMatch = propsText.match(/defineProps\(({[\s\S]*?})\)/)
    if (propsMatch) {
      // Create a new source file with just the props object
    }
  }

  // Extract computed properties
  const computed = sourceFile.statements.filter(s => {
    const text = s.getText()
    return text.includes('computed(') && 
           (text.includes('=>') && !text.includes('function'))
  })

  computed.forEach(c => {
    const computedText = c.getText()
    const computedMatch = computedText.match(/computed\(\s*(\(\)\s*=>[\s\S]*?)\)/)
    if (computedMatch) {
      console.log(eval(computedMatch[1]))
    }
  })

//fs.writeFileSync('./ast.json', JSON.stringify(ast, null, 2));