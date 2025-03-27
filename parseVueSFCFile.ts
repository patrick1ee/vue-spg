// src/utils/vueComponentParser.ts
import { parse } from '@vue/compiler-sfc';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for the structure of a Vue component
 */
interface VueComponentStructure {
  props: Record<string, any>;
  data: Record<string, any>;
  computed: string[];
  methods: string[];
  watch: string[];
  emits: string[];
  lifecycleHooks: string[];
  components: string[];
  directives: string[];
  mixins: string[];
  imports: string[];
}

/**
 * Parses a Vue SFC file and extracts its structure into a JSON object
 * @param filePath Path to the Vue SFC file
 * @returns JSON object containing the component structure
 */
export function parseVueComponent(filePath: string): VueComponentStructure {
  // Read the file
  const fileContent = fs.readFileSync(path.resolve(filePath), 'utf-8');
  
  // Parse the SFC
  const { descriptor } = parse(fileContent);
  
  // Initialize the structure object
  const structure: VueComponentStructure = {
    props: {},
    data: {},
    computed: [],
    methods: [],
    watch: [],
    emits: [],
    lifecycleHooks: [],
    components: [],
    directives: [],
    mixins: [],
    imports: []
  };
  
  // Extract script content
  const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || '';
  
  // Extract imports
  const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"][^'"]+['"]/g;
  const imports = scriptContent.match(importRegex) || [];
  structure.imports = imports.map(imp => imp.trim());
  
  // Handle Options API
  if (descriptor.script && !descriptor.scriptSetup) {
    // Extract the component definition object
    const componentDefRegex = /export\s+default\s+{([^}]+)}/s;
    const componentDefMatch = scriptContent.match(componentDefRegex);
    
    if (componentDefMatch && componentDefMatch[1]) {
      const componentDef = componentDefMatch[1];
      
      // Extract props
      extractProps(componentDef, structure);
      
      // Extract data
      extractData(componentDef, structure);
      
      // Extract computed properties
      extractComputed(componentDef, structure);
      
      // Extract methods
      extractMethods(componentDef, structure);
      
      // Extract watch
      extractWatch(componentDef, structure);
      
      // Extract emits
      extractEmits(componentDef, structure);
      
      // Extract lifecycle hooks
      extractLifecycleHooks(componentDef, structure);
      
      // Extract components
      extractComponents(componentDef, structure);
      
      // Extract directives
      extractDirectives(componentDef, structure);
      
      // Extract mixins
      extractMixins(componentDef, structure);
    }
  }
  
  // Handle Composition API (script setup)
  if (descriptor.scriptSetup) {
    // Extract defineProps
    extractDefineProps(scriptContent, structure);
    
    // Extract defineEmits
    extractDefineEmits(scriptContent, structure);
    
    // Extract ref, reactive, computed
    extractReactivity(scriptContent, structure);
    
    // Extract functions (methods)
    extractFunctions(scriptContent, structure);
    
    // Extract watch
    extractCompositionWatch(scriptContent, structure);
    
    // Extract lifecycle hooks
    extractCompositionLifecycleHooks(scriptContent, structure);
  }
  
  return structure;
}

/**
 * Extract props from Options API
 */
function extractProps(componentDef: string, structure: VueComponentStructure): void {
  const propsRegex = /props\s*:\s*{([^}]+)}/s;
  const propsMatch = componentDef.match(propsRegex);
  
  if (propsMatch && propsMatch[1]) {
    const propsContent = propsMatch[1];
    const propEntries = propsContent.split(',').filter(entry => entry.trim());
    
    propEntries.forEach(entry => {
      const [key, value] = entry.split(':').map(part => part.trim());
      if (key && value) {
        structure.props[key] = value;
      }
    });
  }
}

/**
 * Extract data from Options API
 */
function extractData(componentDef: string, structure: VueComponentStructure): void {
  const dataRegex = /data\s*\(\s*\)\s*{\s*return\s*{([^}]+)}/s;
  const dataMatch = componentDef.match(dataRegex);
  
  if (dataMatch && dataMatch[1]) {
    const dataContent = dataMatch[1];
    const dataEntries = dataContent.split(',').filter(entry => entry.trim());
    
    dataEntries.forEach(entry => {
      const [key, value] = entry.split(':').map(part => part.trim());
      if (key && value) {
        structure.data[key] = value;
      }
    });
  }
}

/**
 * Extract computed properties from Options API
 */
function extractComputed(componentDef: string, structure: VueComponentStructure): void {
  const computedRegex = /computed\s*:\s*{([^}]+)}/s;
  const computedMatch = componentDef.match(computedRegex);
  
  if (computedMatch && computedMatch[1]) {
    const computedContent = computedMatch[1];
    const computedEntries = computedContent.match(/\w+\s*\([^)]*\)/g) || [];
    
    structure.computed = computedEntries.map(entry => {
      return entry.split('(')[0].trim();
    });
  }
}

/**
 * Extract methods from Options API
 */
function extractMethods(componentDef: string, structure: VueComponentStructure): void {
  const methodsRegex = /methods\s*:\s*{([^}]+)}/s;
  const methodsMatch = componentDef.match(methodsRegex);
  
  if (methodsMatch && methodsMatch[1]) {
    const methodsContent = methodsMatch[1];
    const methodEntries = methodsContent.match(/\w+\s*\([^)]*\)/g) || [];
    
    structure.methods = methodEntries.map(entry => {
      return entry.split('(')[0].trim();
    });
  }
}

/**
 * Extract watch from Options API
 */
function extractWatch(componentDef: string, structure: VueComponentStructure): void {
  const watchRegex = /watch\s*:\s*{([^}]+)}/s;
  const watchMatch = componentDef.match(watchRegex);
  
  if (watchMatch && watchMatch[1]) {
    const watchContent = watchMatch[1];
    const watchEntries = watchContent.match(/\w+\s*:/g) || [];
    
    structure.watch = watchEntries.map(entry => {
      return entry.replace(':', '').trim();
    });
  }
}

/**
 * Extract emits from Options API
 */
function extractEmits(componentDef: string, structure: VueComponentStructure): void {
  const emitsRegex = /emits\s*:\s*\[(.*?)\]/s;
  const emitsMatch = componentDef.match(emitsRegex);
  
  if (emitsMatch && emitsMatch[1]) {
    const emitsContent = emitsMatch[1];
    structure.emits = emitsContent
      .split(',')
      .map(emit => emit.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }
}

/**
 * Extract lifecycle hooks from Options API
 */
function extractLifecycleHooks(componentDef: string, structure: VueComponentStructure): void {
  const lifecycleHooks = [
    'beforeCreate', 'created', 
    'beforeMount', 'mounted', 
    'beforeUpdate', 'updated', 
    'beforeDestroy', 'destroyed', 
    'activated', 'deactivated'
  ];
  
  lifecycleHooks.forEach(hook => {
    const hookRegex = new RegExp(`${hook}\\s*\\(\\s*\\)\\s*{`, 'g');
    if (hookRegex.test(componentDef)) {
      structure.lifecycleHooks.push(hook);
    }
  });
}

/**
 * Extract components from Options API
 */
function extractComponents(componentDef: string, structure: VueComponentStructure): void {
  const componentsRegex = /components\s*:\s*{([^}]+)}/s;
  const componentsMatch = componentDef.match(componentsRegex);
  
  if (componentsMatch && componentsMatch[1]) {
    const componentsContent = componentsMatch[1];
    const componentEntries = componentsContent.match(/\w+/g) || [];
    
    structure.components = componentEntries.filter(Boolean);
  }
}

/**
 * Extract directives from Options API
 */
function extractDirectives(componentDef: string, structure: VueComponentStructure): void {
  const directivesRegex = /directives\s*:\s*{([^}]+)}/s;
  const directivesMatch = componentDef.match(directivesRegex);
  
  if (directivesMatch && directivesMatch[1]) {
    const directivesContent = directivesMatch[1];
    const directiveEntries = directivesContent.match(/\w+/g) || [];
    
    structure.directives = directiveEntries.filter(Boolean);
  }
}

/**
 * Extract mixins from Options API
 */
function extractMixins(componentDef: string, structure: VueComponentStructure): void {
  const mixinsRegex = /mixins\s*:\s*\[(.*?)\]/s;
  const mixinsMatch = componentDef.match(mixinsRegex);
  
  if (mixinsMatch && mixinsMatch[1]) {
    const mixinsContent = mixinsMatch[1];
    structure.mixins = mixinsContent
      .split(',')
      .map(mixin => mixin.trim())
      .filter(Boolean);
  }
}

/**
 * Extract defineProps from Composition API
 */
function extractDefineProps(scriptContent: string, structure: VueComponentStructure): void {
  const definePropsRegex = /defineProps\s*\(\s*{([^}]+)}\s*\)/s;
  const definePropsMatch = scriptContent.match(definePropsRegex);
  
  if (definePropsMatch && definePropsMatch[1]) {
    const propsContent = definePropsMatch[1];
    const propEntries = propsContent.split(',').filter(entry => entry.trim());
    
    propEntries.forEach(entry => {
      const [key, value] = entry.split(':').map(part => part.trim());
      if (key && value) {
        structure.props[key] = value;
      }
    });
  }
}

/**
 * Extract defineEmits from Composition API
 */
function extractDefineEmits(scriptContent: string, structure: VueComponentStructure): void {
  const defineEmitsRegex = /defineEmits\s*\(\s*\[(.*?)\]\s*\)/s;
  const defineEmitsMatch = scriptContent.match(defineEmitsRegex);
  
  if (defineEmitsMatch && defineEmitsMatch[1]) {
    const emitsContent = defineEmitsMatch[1];
    structure.emits = emitsContent
      .split(',')
      .map(emit => emit.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }
}

/**
 * Extract reactivity (ref, reactive, computed) from Composition API
 */
function extractReactivity(scriptContent: string, structure: VueComponentStructure): void {
  // Extract refs and reactive objects (data)
  const refRegex = /const\s+(\w+)\s*=\s*ref\(/g;
  let refMatch;
  while ((refMatch = refRegex.exec(scriptContent)) !== null) {
    structure.data[refMatch[1]] = 'ref';
  }
  
  const reactiveRegex = /const\s+(\w+)\s*=\s*reactive\(/g;
  let reactiveMatch;
  while ((reactiveMatch = reactiveRegex.exec(scriptContent)) !== null) {
    structure.data[reactiveMatch[1]] = 'reactive';
  }
  
  // Extract computed properties
  const computedRegex = /const\s+(\w+)\s*=\s*computed\(/g;
  let computedMatch;
  while ((computedMatch = computedRegex.exec(scriptContent)) !== null) {
    structure.computed.push(computedMatch[1]);
  }
}

/**
 * Extract functions (methods) from Composition API
 */
function extractFunctions(scriptContent: string, structure: VueComponentStructure): void {
  const functionRegex = /function\s+(\w+)\s*\(/g;
  let functionMatch;
  while ((functionMatch = functionRegex.exec(scriptContent)) !== null) {
    structure.methods.push(functionMatch[1]);
  }
  
  const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g;
  let arrowFunctionMatch;
  while ((arrowFunctionMatch = arrowFunctionRegex.exec(scriptContent)) !== null) {
    structure.methods.push(arrowFunctionMatch[1]);
  }
}

/**
 * Extract watch from Composition API
 */
function extractCompositionWatch(scriptContent: string, structure: VueComponentStructure): void {
  const watchRegex = /watch\(\s*(\w+)/g;
  let watchMatch;
  while ((watchMatch = watchRegex.exec(scriptContent)) !== null) {
    structure.watch.push(watchMatch[1]);
  }
  
  const watchEffectRegex = /watchEffect\(/g;
  if (watchEffectRegex.test(scriptContent)) {
    structure.watch.push('watchEffect');
  }
}

/**
 * Extract lifecycle hooks from Composition API
 */
function extractCompositionLifecycleHooks(scriptContent: string, structure: VueComponentStructure): void {
  const lifecycleHooks = {
    'onBeforeMount': 'beforeMount',
    'onMounted': 'mounted',
    'onBeforeUpdate': 'beforeUpdate',
    'onUpdated': 'updated',
    'onBeforeUnmount': 'beforeUnmount',
    'onUnmounted': 'unmounted',
    'onActivated': 'activated',
    'onDeactivated': 'deactivated',
    'onErrorCaptured': 'errorCaptured'
  };
  
  Object.entries(lifecycleHooks).forEach(([compositionHook, optionsHook]) => {
    const hookRegex = new RegExp(`${compositionHook}\\(`, 'g');
    if (hookRegex.test(scriptContent)) {
      structure.lifecycleHooks.push(optionsHook);
    }
  });
}

/**
 * Parse a Vue component file and return its structure as JSON
 * @param filePath Path to the Vue component file
 * @returns JSON string of the component structure
 */
export function getVueComponentAsJSON(filePath: string): string {
  const structure = parseVueComponent(filePath);
  return JSON.stringify(structure, null, 2);
}