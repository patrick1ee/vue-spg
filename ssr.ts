#!/usr/bin/env node

import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';
import * as CompilerDOM from '@vue/compiler-dom'

import { parse as fparse } from 'node-html-parser';

import { minifyCSS, parseTemplate } from './src';

const componentPath = path.join(__dirname, './SubProfileRender.vue');
const componentPath2 = path.resolve('/home/patrick/dev/keypin-web/src/components/qr-section/AmazonReviewCTASection.vue')

const props = JSON.parse(fs.readFileSync('./test-am.json', 'utf8'));

const componentSrc  = fs.readFileSync(componentPath, 'utf8');

//console.log(ast.children[0])

const p = parse(componentSrc);
const script = compileScript(p.descriptor, { id: 'test' });

const template = compileTemplate({source: componentSrc, filename: componentPath, id: 'test'});
//console.log(template)

const ast = CompilerDOM.parse(componentSrc, {
    parseMode: 'sfc',
    prefixIdentifiers: true,
    onError: e => {
      console.log(e)
    },
  })

console.log(ast.children[0])

const s = compileTemplate({source: componentSrc, filename: componentPath, id: 'test'});
//console.log(p)
//console.log('\n\n')
//console.log(script.scriptSetupAst[5].declarations[0].init.arguments[0])
//console.log(JSON.stringify(parseTemplate(p.descriptor.template.content)))
//console.log(p.descriptor.template?.content)
//console.log(fparse(p.descriptor.template.content.toString().trim()).childNodes[0].childNodes[1])

/// ///////////////
import { parseVueSFC } from './parseVueSFC';
const sfc = parseVueSFC(componentSrc);
//console.log(sfc)

import { parseVueComponent } from './parseVueSFCFile';
const sfc2 = parseVueComponent(componentPath2);
//console.log(sfc2)
